require ('medium-editor')
require ('medium-editor-css')
require ('medium-editor-theme')
import { rangeUtils } from './RangeUtils';

let QuoteButton = MediumEditor.Extension.extend({
  name: 'quoteButton',
  quoteForm: false,
  quoteFormInput: false,
  quoteFormList: false,
  inString: '',
  isListOpen: false,

  formSaveLabel: '&#10003;',
  formCloseLabel: '&times;',

  init: function (params) {
    this.button = this.document.createElement('button');
    this.button.classList.add('medium-editor-action');
    this.button.innerHTML = '<b style="font-size: x-large; line-height: 43px;">&rdquo;</b>';
    this.button.title = 'quoteButton';

    this.on(this.button, 'click', this.handleClick.bind(this));
    this.subscribe('hideToolbar', this.handleHideToolbar.bind(this));
  },

  getForm: function () {
    if (!this.quoteForm) {
      this.quoteForm = this.createQuoteForm();
    }
    return this.quoteForm;
  },

  getButton: function () {
    return this.button;
  },

  isAlreadyApplied: function (node) {
    let quoteNode = rangeUtils.getSelectedTags()[0];
    return quoteNode.nodeName.toLowerCase() === 'w' && quoteNode.dataset.author;
  },

  isActive: function () {
    return this.button.classList.contains('medium-editor-button-active');
  },

  setInactive: function () {
    this.button.classList.remove('medium-editor-button-active');
  },

  setActive: function () {
    this.button.classList.add('medium-editor-button-active');
  },

  showForm: function (opts) {
    this.base.saveSelection();
    this.insertForm();
    this.getForm().classList.add('medium-editor-toolbar-form-active');
    this.hideToolbarDefaultActions();
    if (opts.value) this.quoteFormInput.value = opts.value;
  },

  doQuoteSave: function () {
      this.base.restoreSelection();
      //this.base.checkSelection();

      let value = this.quoteFormInput.value;
      let quote = document.createElement("w");
      quote.dataset.author = value;

      if (window.getSelection) {
        let sel = window.getSelection();
        if (sel.rangeCount) {
            let range = sel.getRangeAt(0).cloneRange();
            range.surroundContents(quote);
            sel.removeAllRanges();
            sel.addRange(range);
        }
      }

      let list = this.getEditorOption('quotesList');
      let check = list.filter(o => o.text === value)
      if (check.length == 0) list.push({ id: 99, text: value });
  },

  handleClick: function (event) {
    event.preventDefault();
    event.stopPropagation();

    this.showForm({});
  },

  handleHideToolbar: function () {
    this.destroy();
  },

  handleSaveClick: function (event) {
    event.preventDefault();
    this.destroy();
    this.showToolbarDefaultActions();
    this.doQuoteSave();
    this.base.checkContentChanged();
  },

  handleCloseClick: function (event) {
    event.preventDefault();
    this.destroy();
    this.showToolbarDefaultActions();
  },

  hideToolbarDefaultActions: function () {
    var toolbar = this.base.getExtensionByName('toolbar');
    if (toolbar) {
        toolbar.hideToolbarDefaultActions();
    }
  },

  showToolbarDefaultActions: function () {
    var toolbar = this.base.getExtensionByName('toolbar');
    if (toolbar) {
        toolbar.showToolbarDefaultActions();
    }
  },

  createQuoteForm: function () {
    var form = this.document.createElement('div');

    form.className = 'medium-editor-toolbar-form';
    form.id = 'medium-editor-toolbar-form-quote-' + this.getEditorId();
    form.innerHTML = this.getTemplate();
    return form;
  },

  createQuoteList: function () {
    var list = this.document.createElement('ul');
    list.className = 'quotes-list';
    list.id = 'quotes-list-' + this.getEditorId();
    return list;
  },

  createQuoteListItem: function (content) {
    var item = this.document.createElement('li');
    item.className = 'quotes-list-item';
    item.innerHTML = content.text;
    return item;
  },

  getTemplate: function () {
    let template = ['<input type="text" class="medium-editor-toolbar-input quote-input"></input>'];
    template.push(
      '<a href="#" class="medium-editor-toolbar-save">',
      this.getEditorOption('buttonLabels') === 'fontawesome' ? '<i class="fa fa-check"></i>' : this.formSaveLabel,
      '</a>'
    );

    template.push('<a href="#" class="medium-editor-toolbar-close">',
      this.getEditorOption('buttonLabels') === 'fontawesome' ? '<i class="fa fa-times"></i>' : this.formCloseLabel,
      '</a>');
    return template.join('');
  },

  insertForm: function () {
    let toolbar = this.base.getExtensionByName('toolbar');
    if (toolbar.getToolbarElement().querySelector('.medium-editor-toolbar-form')) return true;
    toolbar.getToolbarElement().appendChild(this.getForm());

    this.quoteFormInput = this.getForm().querySelector('.medium-editor-toolbar-input');
    this.on(this.quoteFormInput, 'input', this.onInput.bind(this));
    this.on(this.quoteFormInput, 'focus', this.onFocus.bind(this));
    var close = this.getForm().querySelector('.medium-editor-toolbar-close'),
        save = this.getForm().querySelector('.medium-editor-toolbar-save')

    this.on(close, 'click', this.handleCloseClick.bind(this));
    this.on(save, 'click', this.handleSaveClick.bind(this), true);
  },

  updateList: function (value) {
    if (this.quoteFormList) this.destroyList();
    this.quoteFormList = this.createQuoteList();
    let list = this.getEditorOption('quotesList');
    if (value.length) {
      const re = new RegExp(value, 'i');
      list = list.filter(o => o.text.match(re))
    }
    if (list.length) {
      list.forEach((item)=>{
        let listItem = this.createQuoteListItem(item);
        this.quoteFormList.append(listItem);
        this.on(listItem, 'click', this.onClick.bind(this));
      });

      this.getForm().appendChild(this.quoteFormList);
    }
  },

  onInput: function (ev) {
    this.updateList(ev.target.value);
  },

  onFocus: function (ev) {
    this.updateList(ev.target.value);
  },

  onClick: function (ev) {
    this.quoteFormInput.value = ev.target.textContent;
  },

  destroy: function () {
    this.destroyList();
    if (this.quoteForm) {
      if (this.quoteForm.parentNode) {
        this.quoteForm.parentNode.removeChild(this.quoteForm);
      }
      delete this.quoteForm;
    }
  },

  destroyList: function () {
    if (this.quoteFormList) {
      if (this.quoteFormList.parentNode) {
        this.quoteFormList.parentNode.removeChild(this.quoteFormList);
      }
      delete this.quoteFormList;
    }
  },

});

let QuotePreview = MediumEditor.extensions.anchorPreview.extend({
  name: 'quote-preview',
  init: function () {
    MediumEditor.extensions.anchorPreview.prototype.init.apply(this, arguments);
  },

  handleEditableMouseover: function (event) {
    var target = MediumEditor.util.traverseUp(event.target, function (element) {
      return element.dataset.author;
    });

    if (false === target) {
        return;
    }

    // only show when toolbar is not present
    var toolbar = this.base.getExtensionByName('toolbar');
    if (!this.showWhenToolbarIsVisible && toolbar && toolbar.isDisplayed && toolbar.isDisplayed()) {
        return true;
    }

    // detach handler for other anchor in case we hovered multiple anchors quickly
    if (this.activeAnchor && this.activeAnchor !== target) {
        this.detachPreviewHandlers();
    }

    this.anchorToPreview = target;

    this.instanceHandleAnchorMouseout = this.handleAnchorMouseout.bind(this);
    this.on(this.anchorToPreview, 'mouseout', this.instanceHandleAnchorMouseout);
    // Using setTimeout + delay because:
    // - We're going to show the anchor preview according to the configured delay
    //   if the mouse has not left the anchor tag in that time
    this.base.delay(function () {
        if (this.anchorToPreview) {
            this.showPreview(this.anchorToPreview);
        }
    }.bind(this));
  },

  showPreview: function (anchorEl) {
    if (this.anchorPreview.classList.contains('medium-editor-anchor-preview-active') ||
            anchorEl.getAttribute('data-disable-preview')) {
        return true;
    }

    if (this.previewValueSelector) {
        this.anchorPreview.querySelector(this.previewValueSelector).textContent = anchorEl.dataset.author;
        this.anchorPreview.querySelector(this.previewValueSelector).href = anchorEl.dataset.author;
    }

    this.anchorPreview.classList.add('medium-toolbar-arrow-over');
    this.anchorPreview.classList.remove('medium-toolbar-arrow-under');

    if (!this.anchorPreview.classList.contains('medium-editor-anchor-preview-active')) {
        this.anchorPreview.classList.add('medium-editor-anchor-preview-active');
    }

    this.activeAnchor = anchorEl;

    this.positionPreview();
    this.attachPreviewHandlers();

    return this;
  },
  handleClick: function (event) {
      var anchorExtension = this.base.getExtensionByName('quoteButton'),
          activeAnchor = this.activeAnchor;

      if (anchorExtension && activeAnchor) {
          event.preventDefault();

          this.base.selectElement(this.activeAnchor);

          // Using setTimeout + delay because:
          // We may actually be displaying the anchor form, which should be controlled by delay
          this.base.delay(function () {
              if (activeAnchor) {
                  var opts = {
                      value: activeAnchor.dataset.author,
                      target: activeAnchor.dataset.author,
                      //buttonClass: activeAnchor.getAttribute('class')
                  };
                  anchorExtension.showForm(opts);
                  activeAnchor = null;
              }
          }.bind(this));
      }

      this.hidePreview();
  },
});

export {
  QuoteButton,
  QuotePreview
}
