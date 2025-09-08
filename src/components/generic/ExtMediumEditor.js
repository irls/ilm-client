import MediumEditor from './medium-editor/js/medium-editor.js';
require('./medium-editor/css/medium-editor.min.css');
require('./medium-editor/css/themes/flat.min.css');
import { cleanFilter } from "../../filters/search.js";

const customFormAddListLabel = `<style>
  .medium-editor-toolbar-form .medium-editor-toolbar-add-list-item i.customFormAddListLabel {
    height: 30px; width: 30px;
    display: inline-block;
    position: relative; top: 9px; left: 1px;
    background-size: contain;
    background-image: url(/static/MediumEditorButtons/playlist-add-white-svgrepo-com.svg);
  }
  .medium-editor-toolbar-form .medium-editor-toolbar-add-list-item i.customFormAddListLabel:hover {
    background-image: url(/static/MediumEditorButtons/playlist-add-gray-svgrepo-com.svg);
  }
</style>
<i class="customFormAddListLabel"></i>`;

const iconButtonsTmpl = {
  'fontawesome': {
    formSaveLabel:    '<i class="fa fa-check"></i>',
    formCloseLabel:   '<i class="fa fa-times"></i>',
    formRemoveLabel:  '<i class="fa fa-trash"></i>',
    formDiscardLabel: '<i class="fa fa-times-circle-o"></i>',
    formAddLabel:     '<i class="fa fa-check"></i>',
    formAddListLabel: '<i class="fa fa-check"></i>'
  },
  'glyphicon': {
    formSaveLabel:    '<i class="glyphicon glyphicon-ok-circle"></i>',
    formCloseLabel:   '<i class="glyphicon glyphicon-remove-circle"></i>',
    formRemoveLabel:  '<i class="glyphicon glyphicon-trash"></i>',
    formDiscardLabel: '<i class="glyphicon glyphicon-ban-circle"></i>',
    formAddLabel:     '<i class="glyphicon glyphicon-remove-circle" style="transform: rotate(45deg);"></i>',
    formAddListLabel:  customFormAddListLabel
  },
  'default': {
    formSaveLabel:    '&#10003;',
    formCloseLabel:   '&times;',
    formRemoveLabel:  '&#xf056;',
    formDiscardLabel: '&times;',
    formAddLabel:     '&times;',
    formAddListLabel: '&times;'
  }
};

const QuoteButton = MediumEditor.Extension.extend({
  name: 'quoteButton',
  quoteForm: false,
  quoteFormInput: false,
  quoteFormList: false,
  value: '',
  isListOpen: false,
  iconButtonsStyle: 'glyphicon',

  wrapNode: 'qq',

  init: function (params) {
    this.button = this.document.createElement('button');
    this.button.classList.add('medium-editor-action');
    this.button.innerHTML = '<b style="font-size: x-large; line-height: 43px;">&rdquo;</b>';
    this.button.title = 'Quote author';

    this.on(this.button, 'click', this.handleClick.bind(this));
    this.subscribe('hideToolbar', this.handleHideToolbar.bind(this));

    this.addQuotesStyles(this.getEditorOption('quotesList'));
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

  getIconButton: function (buttonName) {
    const buttonLabels = this.iconButtonsStyle || this.getEditorOption('buttonLabels') || 'default';
    const iconButtons = iconButtonsTmpl[buttonLabels] || iconButtonsTmpl['default'];
    return iconButtons[buttonName] || '<i>Wrong button name</i>';
  },

  isAlreadyApplied: function (node) {
    if (this.quoteForm) this.destroy();
    //-- A trick to keep right selection for Mozilla -- { --//
    if (window.getSelection && !window.getSelection().focusNode) {
      this.base.saveSelection();
      this.base.restoreSelection();
    }
    //-- } -- end --//
    if (node.nodeName.toLowerCase() === this.wrapNode && node.dataset.author) {
      this.value = node.dataset.author;
      return true
    }
    this.value = '';
    return false;
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

    //text_farsi

    if (this.getEditorOption('blockLang') == 'fa' || this.getEditorOption('blockLang') == 'ar')
      {
        this.getEditorOption('quotesList').forEach(
          function(element){
            if (opts.value == element.text && element.text_farsi !== undefined)
              opts.value = element.text_farsi;
          }
        );
      }

    if (opts.value) this.quoteFormInput.value = opts.value;
    else this.quoteFormInput.value = this.value;
  },

  doQuoteSave: function () {
    this.base.restoreSelection();

    let value = this.quoteFormInput.value.trim();
    //let value = this.quoteFormInput.dataset.author.trim();
    if (value.length) {
      let quote = document.createElement(this.wrapNode);
      //console.log('lang: ', this.getEditorOption('blockLang'));
      //console.log('value', value);
      //console.log('list autors', this.getEditorOption('quotesList'));
      // let's convert author form farsi to english
      if (this.getEditorOption('blockLang') == 'fa' || this.getEditorOption('blockLang') == 'ar'){
        var found = this.getEditorOption('quotesList').find(element => element.text_farsi == value);
        if (found) value = found.text

      }

      quote.dataset.author = value;
      //console.log('quote.dataset', quote.dataset);
      if (this.isActive()) this.doQuoteRemove();

      if (window.getSelection) {
        let sel = window.getSelection();
        if (sel.rangeCount) {
          let range = sel.getRangeAt(0);
          let node = range.startContainer;
          quote.appendChild(range.extractContents());
          range.insertNode(quote);
          let prev = node.previousSibling;
          if (prev && prev.textContent.length == 0) {
            let prevParent = prev.parentNode;
            prevParent.removeChild(prev);
          }
          let next = node.nextSibling;
          if (next && next.textContent.length == 0) {
            let prevParent = next.parentNode;
            prevParent.removeChild(next);
          }
          if (quote.nextElementSibling && quote.nextElementSibling.nodeName === 'SUP') {
            if (quote.childNodes.length > 0) {// when qq is set for word with superscript, user agent creates empty duplicate of superscript after qq
              let sup = Array.from(quote.childNodes).find(cel => {
                return cel.nodeName === 'SUP';
              });
              if (sup && (!quote.nextElementSibling.textContent || quote.nextElementSibling.textContent.trim().length === 0)) {
                quote.nextElementSibling.parentNode.removeChild(quote.nextElementSibling);
              }
            }
          }
        }
      }

      let list = this.getEditorOption('quotesList');
      let check = -1;
      let colors = [];
      list.forEach((item, index) => {
        if (item.text === value) check = index;
        colors.push(item.color);
      });
      let color = this.genColor(colors);
      if (check == -1) {
        let color = this.genColor(colors);
        list.unshift({ text: value, color: color });
      } else {
        let moved = list.splice(check, 1);
        list.unshift(moved[0]);
      }
      this.getEditorOption('onQuoteSave').call();
      this.addQuotesStyles(list);
      this.triggerEvent(this.base.getFocusedElement(), 'input');
      this.base.restoreSelection();
    }
    this.base.checkSelection();
  },

  doQuoteRemove: function () {
      this.base.restoreSelection();
      if (window.getSelection) {
        let sel = window.getSelection();
        if (sel.rangeCount) {
          let range = sel.getRangeAt(0).cloneRange();
          let node = range.startContainer;
          while (node && node.nodeName.toLowerCase() !== this.wrapNode) {
            node = node.parentNode;
          }
          let parent = node.parentNode;
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          parent.removeChild(node);
          this.value = '';
          this.setInactive();
          this.triggerEvent(this.base.getFocusedElement(), 'input');
          this.base.restoreSelection();
        }
      }
      this.base.checkSelection();
  },

  triggerEvent: function(el, type) {
    if ('createEvent' in document) {
      // modern browsers, IE9+
      var e = document.createEvent('HTMLEvents');
      e.initEvent(type, false, true);
      el.dispatchEvent(e);
    } else {
      // IE 8
      var e = document.createEventObject();
      e.eventType = type;
      el.fireEvent('on'+e.eventType, e);
    }
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
    this.doQuoteSave();
    this.showToolbarDefaultActions();
    this.base.checkContentChanged();
  },

  handleRemoveClick: function (event) {
    event.preventDefault();
    this.destroy();
    this.doQuoteRemove();
    this.showToolbarDefaultActions();
    this.base.checkContentChanged();
  },

  handleCloseClick: function (event) {
    event.preventDefault();
    this.destroy();
    this.base.restoreSelection();
    this.showToolbarDefaultActions();
  },

  hideToolbarDefaultActions: function () {
    var toolbar = this.base.getExtensionByName('toolbar');
    if (toolbar) {
        toolbar.hideToolbarDefaultActions();
        toolbar.setToolbarPosition();
    }
  },

  showToolbarDefaultActions: function () {
    var toolbar = this.base.getExtensionByName('toolbar');
    if (toolbar) {
        toolbar.showToolbarDefaultActions();
        toolbar.setToolbarPosition();
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
    item.id = content.text;
    if (this.getEditorOption('blockLang') == 'fa' || this.getEditorOption('blockLang') == 'ar'){
      if (content.text_farsi !== undefined)
        item.innerHTML = `<div style="float: left;">${content.text_farsi}</div><div style="float: right; width: 20px; height: 20px; background: ${content.color}">`;
      else
        item.innerHTML = `<div style="float: left;">${content.text}</div><div style="float: right; width: 20px; height: 20px; background: ${content.color}">`;
    } else {
      item.innerHTML = `<div style="float: left;">${content.text}</div><div style="float: right; width: 20px; height: 20px; background: ${content.color}">`;
    }

    return item;
  },

  getTemplate: function () {
    let template = ['<input type="text" class="medium-editor-toolbar-input quote-input"></input>'];

    template.push(
      '<a href="#" class="medium-editor-toolbar-save">',
      this.getIconButton('formSaveLabel'),
      '</a>'
    );

    if (this.value.length) {
      template.push(
        '<a href="#" class="medium-editor-toolbar-remove">',
        this.getIconButton('formRemoveLabel'),
        '</a>');
    }

    template.push('<a href="#" class="medium-editor-toolbar-close">',
      this.getIconButton('formCloseLabel'),
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
        save = this.getForm().querySelector('.medium-editor-toolbar-save'),
        remove = this.getForm().querySelector('.medium-editor-toolbar-remove')

    if (close) this.on(close, 'click', this.handleCloseClick.bind(this));
    if (save) this.on(save, 'click', this.handleSaveClick.bind(this), true);
    if (remove) this.on(remove, 'click', this.handleRemoveClick.bind(this), true);

    if (this.value.length) {
      var self = this;
      //let's change to farsi if farsi  input field
      //this.getEditorOption('blockLang')
      //this.getEditorOption('quotesList')
      if (this.getEditorOption('blockLang') == 'fa' || this.getEditorOption('blockLang') == 'ar')
      {
        this.getEditorOption('quotesList').forEach(
          function(element){
            if (self.value == element.text && element.text_farsi !== undefined)
              self.value = element.text_farsi;
          }
        );
      }
    }
  },

  updateList: function (value) {
    if (this.quoteFormList) this.destroyList();
    this.quoteFormList = this.createQuoteList();
    let list = this.getEditorOption('quotesList');

    if (value.length) {
      const re = new RegExp(value, 'i');
      if (this.getEditorOption('blockLang') == 'fa' || this.getEditorOption('blockLang') == 'ar'){
        list = list.filter(o => (o.text.match(re) || (o.text_farsi !== undefined && o.text_farsi.match(re) )))
      } else {
        list = list.filter(o => o.text.match(re))
      }
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
    this.quoteFormInput.dataset.author = ev.target.id;
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

  genColor: function (exceptColors) {
    let letters = '6789ABCD'.split('');
    let color = '';
    do {
      color = '#';
      for (let i = 0; i < 6; i++ ) {
          color += letters[Math.floor(Math.random() * letters.length)];
      }
    } while (exceptColors.filter(item=>item==color).length>0);
    return color;
  },

  addQuotesStyles: function (quotesList) {
    let id = "quotes-styles";
    let prevStyles = document.getElementById(id);
    if (prevStyles && prevStyles.parentNode) {
      prevStyles.parentNode.removeChild(prevStyles);
    }

    let styleNode = document.createElement('style');
    styleNode.type = "text/css";
    styleNode.id = id;

    let styles = '';
    quotesList.forEach(item=>{
      styles+= `.ilm-block [data-author="${item.text}"] {color: ${item.color};}`
    })

    // browser detection (based on prototype.js)
    if(!!(window.attachEvent && !window.opera)) {
      styleNode.styleSheet.cssText = styles;
    } else {
      let styleText = document.createTextNode(styles);
      styleNode.appendChild(styleText);
    }
    document.getElementsByTagName('head')[0].appendChild(styleNode);
  }

});

const QuotePreview = MediumEditor.extensions.anchorPreview.extend({
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
    if (this.anchorPreview.classList.contains('medium-editor-anchor-preview-active')
      || anchorEl.getAttribute('data-disable-preview')) {
        return true;
    }

    // text in bubble
    if (this.previewValueSelector) {
      if (this.getEditorOption('blockLang') == 'fa' || this.getEditorOption('blockLang') == 'ar'){
        let list = this.getEditorOption('quotesList');
        const author = list.find( author => author.text == anchorEl.dataset.author );
        if (author !== undefined && author.hasOwnProperty('text_farsi') && author.text_farsi !== undefined){
            this.anchorPreview.querySelector(this.previewValueSelector).textContent = author.text_farsi;
            this.anchorPreview.querySelector(this.previewValueSelector).href = author.text_farsi;
        } else {
            if (author !== undefined && author.hasOwnProperty('text'))
                this.anchorPreview.querySelector(this.previewValueSelector).textContent = author.text;
                this.anchorPreview.querySelector(this.previewValueSelector).href = author.text;
        }

      } else {
        this.anchorPreview.querySelector(this.previewValueSelector).textContent = anchorEl.dataset.author;
        this.anchorPreview.querySelector(this.previewValueSelector).href = anchorEl.dataset.author;
      }
      //this.anchorPreview.querySelector(this.previewValueSelector).href = anchorEl.dataset.author;
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
  }
});

const SuggestButton = MediumEditor.Extension.extend({
  name: 'suggestButton',
  suggestForm: false,
  suggestFormInput: false,
  value: '',
  prevValue: '',
  hasProp: false,
  iconButtonsStyle: 'glyphicon',
  selectedTextContent: '',
  onAddListItemCallback: ()=>{},
  showApplyModalCallback: ()=>{},

  wrapNode: 'sg',

  init: function (params) {
    this.wrapNode = this.getEditorOption('suggestEl') || 'sg';
    this.button = this.document.createElement('button');
    this.button.classList.add('medium-editor-action');
    this.button.innerHTML = '<i class="fa fa-commenting" aria-hidden="true"></i>';
    this.button.title = 'Suggestion';

    this.on(this.button, 'click', this.handleClick.bind(this));
    this.subscribe('hideToolbar', this.handleHideToolbar.bind(this));

    this.onAddListItemCallback = this.getEditorOption('onAddListItemCallback') || this.onAddListItemCallback;
    this.showApplyModalCallback = this.getEditorOption('showApplyModalCallback') || this.onAddListItemCallback;

    this.textSelection = {};
  },

  getForm: function () {
    if (!this.suggestForm) {
      this.suggestForm = this.createSuggestForm();
    }
    return this.suggestForm;
  },

  getButton: function () {
    return this.button;
  },

  getIconButton: function (buttonName) {
    const buttonLabels = this.iconButtonsStyle || this.getEditorOption('buttonLabels') || 'default';
    const iconButtons = iconButtonsTmpl[buttonLabels] || iconButtonsTmpl['default'];
    return iconButtons[buttonName] || '<i>Wrong button name</i>';
  },

  isAlreadyApplied: function (node) {
    if (this.suggestForm) this.destroy();
    //-- A trick to keep right selection for Mozilla -- { --//
    if (window.getSelection && !window.getSelection().focusNode) {
      this.base.saveSelection();
      this.base.restoreSelection();
    }
    //-- } -- end --//
    if (node.nodeName.toLowerCase() === this.wrapNode && node.dataset.hasOwnProperty('suggestion')) {
      this.value = node.dataset.suggestion;
      this.selectedTextContent = node.textContent.trim().toLowerCase();
      this.hasProp = node.dataset.hasOwnProperty('suggestion');
      return true
    }
    this.value = '';
    this.hasProp = false;
    this.selectedTextContent = '';
    return false;
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
    if (opts.value) this.suggestFormInput.value = opts.value;
    else this.suggestFormInput.value = this.value;
    this.prevValue = this.value;
    this.textSelection = this.getTextSelection();
  },

  doSuggestSave: function (value = false, updateAction = 'current') {
    let textContent = '';
    this.base.restoreSelection();
    value = value || this.suggestFormInput?.value?.trim() || '';
//     if (value.length) {
      let node = document.createElement(this.wrapNode);
      node.dataset.suggestion = value;
      if (this.isActive()) this.doSuggestRemove();

      if (window.getSelection) {
        let sel = window.getSelection();
        if (sel.rangeCount) {
          let range = sel.getRangeAt(0);
          node.appendChild(range.extractContents());
          textContent = node.textContent.trim().toLowerCase();
          range.insertNode(node);
          let prev = node.previousSibling;
          if (prev.textContent.length == 0) {
            let prevParent = prev.parentNode;
            prevParent.removeChild(prev);
          }
          let next = node.nextSibling;
          if (next.textContent.length == 0) {
            let prevParent = next.parentNode;
            prevParent.removeChild(next);
          }
          if (node.parentNode) {
            node.parentNode.dataset.sugg = value;
          }
        }
      }

      this.triggerEvent(this.base.getFocusedElement(), 'inputSuggestion');
      this.base.restoreSelection();
      MediumEditor.util.getContainerEditorElement(this.base.getFocusedElement()).dataset.has_suggestion = true;
//     }

    if (updateAction === 'all') {
      const MEditor = this.base.elements[0];
      const suggestions = MEditor.querySelectorAll('sg[data-suggestion]');
      if (textContent.length) {
        for (const sg of suggestions) {
          const checkTextContent = sg.textContent.trim().toLowerCase();
          if (checkTextContent === textContent) {
            sg.dataset.suggestion = value;
          }
        }
        this.base.restoreSelection();
      }
    }
    //this.base.checkSelection();
  },

  doSuggestRemove: function (updateAction = 'current') {
    let textContent = '';
    this.base.restoreSelection();
    if (window.getSelection) {
      let sel = window.getSelection();
      if (sel.rangeCount) {
        let range = sel.getRangeAt(0).cloneRange();
        let node = range.startContainer;
        while (node && node.nodeName.toLowerCase() !== this.wrapNode) {
          node = node.parentNode;
        }
        let parent = node.parentNode;
        node.childNodes.forEach(n => {
          if (n.dataset) {
            delete n.dataset.sugg;
          }
        });
        textContent = node.textContent.trim().toLowerCase();
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
        this.value = '';
        this.setInactive();
        this.triggerEvent(this.base.getFocusedElement(), 'input');
        this.base.restoreSelection();
        MediumEditor.util.getContainerEditorElement(this.base.getFocusedElement()).dataset.has_suggestion = true;
      }
    }
    if (updateAction === 'all') {
      const MEditor = this.base.elements[0];
      const suggestions = MEditor.querySelectorAll('sg[data-suggestion]');
      if (textContent.length) {
        for (const sg of suggestions) {
          const checkTextContent = sg.textContent.trim().toLowerCase();
          if (checkTextContent === textContent) {
            const parent = sg.parentNode;
            while (sg.firstChild) parent.insertBefore(sg.firstChild, sg);
            parent.removeChild(sg);
          }
        }
        this.base.restoreSelection();
      }
    }
    this.base.checkSelection();
  },

  doAddListItem: function (value = false) {
    console.log(`doAddListItem::: `, this.selectedTextContent);
    this.onAddListItemCallback({
      suggestion: this.value || this.suggestFormInput.value.trim(),
      text: this.selectedTextContent
    });
  },

  compareSelectedWordWithSuggestionsList: function() {
    const suggestionsList = this.getEditorOption('suggestionsList');
    if (!suggestionsList || !Array.isArray(suggestionsList)) {
      return false;
    }

    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel.rangeCount) {
        const range = sel.getRangeAt(0).cloneContents();

        if (this.hasProp) {
          // isAlreadyApplied
          return false;
        }

        const div = document.createElement('div');
        div.appendChild(range);

        //-- Cleanup selected html -- { --//
        let innerHTML = div.innerHTML;
        innerHTML = innerHTML.replace(/<sup data-idx[^>]*>.*?<\/sup>/mig, '');
        div.innerHTML = innerHTML;
        //-- } -- end -- Cleanup selected html --//

        const textContent = cleanFilter(div.textContent.trim().toLowerCase());

        const foundSuggestion = suggestionsList.find((sugg)=>{
          return cleanFilter(sugg.text.trim().toLowerCase()) === textContent;
        })

        if (foundSuggestion) {
          this.textSelection = this.getTextSelection();

          sel.empty();
          this.base.checkSelection();
          this.destroy();

          this.showApplyModalCallback({
            suggestion: foundSuggestion.suggestion,
            text: foundSuggestion.text,
            action: 'add',
            hideIfSingle: true,
            textSelection: this.textSelection
          })
            .then(res => {
              if (res.isApply && res.applyLocally) {
                this.doSuggestSave(foundSuggestion.suggestion);
              }
            });

          return true;
        }

        this.selectedTextContent = textContent;
      }
    }

    return false;

  },

  triggerEvent: function(el, type) {
    if ('createEvent' in document) {
      // modern browsers, IE9+
      var e = document.createEvent('HTMLEvents');
      e.initEvent(type, false, true);
      el.dispatchEvent(e);
    } else {
      // IE 8
      var e = document.createEventObject();
      e.eventType = type;
      el.fireEvent('on'+e.eventType, e);
    }
  },

  handleClick: function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.base.saveSelection();

    if (!this.compareSelectedWordWithSuggestionsList()) {
      this.showForm({});
    }
  },

  handleHideToolbar: function () {
    this.destroy();
  },

  handleSaveClick: async function (event) {
    event.preventDefault();
    this.destroy();

    const suggestion = this.suggestFormInput.value.trim();
    let res = {};

    if (!this.hasProp || this.prevValue !== suggestion) {
      res = await this.showApplyModalCallback({
        suggestion: suggestion,
        text: this.selectedTextContent,
        action: this.hasProp ? 'edit': 'add',
        hideIfSingle: true,
        textSelection: this.textSelection
      });
    }

    if (res.isApply) {
      if (res.applyLocally) {
        this.doSuggestSave(false, res.updateAction);
        this.showToolbarDefaultActions();
        this.base.checkContentChanged();
      }
    }

    return;
  },

  handleAddListClick: function (event) {
    event.preventDefault();
    this.destroy();
    this.doAddListItem();
    //this.base.restoreSelection();
  },

  handleRemoveClick: async function (event) {
    event.preventDefault();
    this.destroy();

    const sel = window.getSelection();
    if (sel) {
      sel.empty();
      this.base.checkSelection();
    }

    var res = await this.showApplyModalCallback({
      suggestion: this.value || this.suggestFormInput.value.trim(),
      text: this.selectedTextContent,
      action: 'delete',
      hideIfSingle: true,
      textSelection: this.textSelection
    });

    if (res.isApply) {
      if (res.applyLocally) {
        this.doSuggestRemove(res.updateAction);
        this.showToolbarDefaultActions();
        this.base.checkContentChanged();
      }
    }

    return;
  },

  handleCloseClick: function (event) {
    event.preventDefault();
    this.destroy();
    this.base.restoreSelection();
    this.showToolbarDefaultActions();
  },

  hideToolbarDefaultActions: function () {
    var toolbar = this.base.getExtensionByName('toolbar');
    if (toolbar) {
        toolbar.hideToolbarDefaultActions();
        toolbar.setToolbarPosition();
    }
  },

  showToolbarDefaultActions: function () {
    var toolbar = this.base.getExtensionByName('toolbar');
    if (toolbar) {
        toolbar.showToolbarDefaultActions();
        toolbar.setToolbarPosition();
    }
  },

  createSuggestForm: function () {
    var form = this.document.createElement('div');

    form.className = 'medium-editor-toolbar-form';
    form.id = 'medium-editor-toolbar-form-suggest-' + this.getEditorId();
    form.innerHTML = this.getTemplate();
    return form;
  },

  getTemplate: function () {
    let template = ['<input type="text" class="medium-editor-toolbar-input suggest-input"></input>'];

    template.push(
      '<a href="#" class="medium-editor-toolbar-save" title="Add Suggestion">',
      this.getIconButton('formSaveLabel'),
      '</a>'
    );

    template.push('<a href="#" class="medium-editor-toolbar-add-list-item" title="Add to Suggestions Dictionary">',
      this.getIconButton('formAddListLabel'),
      '</a>');

    if (this.value.length || this.hasProp) {
      template.push(
        '<a href="#" class="medium-editor-toolbar-remove" title="Delete suggestion">',
        this.getIconButton('formRemoveLabel'),
        '</a>');
    }

    template.push('<a href="#" class="medium-editor-toolbar-close" title="Cancel">',
      this.getIconButton('formCloseLabel'),
      '</a>');

    return template.join('');
  },

  insertForm: function () {
    let toolbar = this.base.getExtensionByName('toolbar');
    if (toolbar.getToolbarElement().querySelector('.medium-editor-toolbar-form')) return true;
    toolbar.getToolbarElement().appendChild(this.getForm());

    this.suggestFormInput = this.getForm().querySelector('.medium-editor-toolbar-input');
    var close =   this.getForm().querySelector('.medium-editor-toolbar-close'),
        save =    this.getForm().querySelector('.medium-editor-toolbar-save'),
        remove =  this.getForm().querySelector('.medium-editor-toolbar-remove'),
        addList = this.getForm().querySelector('.medium-editor-toolbar-add-list-item')

    if (close)   this.on(close, 'click', this.handleCloseClick.bind(this));
    if (save)    this.on(save, 'click', this.handleSaveClick.bind(this), true);
    if (remove)  this.on(remove, 'click', this.handleRemoveClick.bind(this), true);
    if (addList) this.on(addList, 'click', this.handleAddListClick.bind(this));
  },

  onClick: function (ev) {
    console.log(`${__filename.substr(-30)}:onClick:function:textContent: `, ev.target.textContent);
    this.suggestFormInput.value = ev.target.textContent;
  },

  destroy: function () {
    if (this.suggestForm) {
      if (this.suggestForm.parentNode) {
        this.suggestForm.parentNode.removeChild(this.suggestForm);
      }
      delete this.suggestForm;
    }
  },

  getTextSelection() {
    let textSelection = {};
    if (window.getSelection) {
      let selection = window.getSelection();
      if (selection.rangeCount) {
        //console.log(selection.getRangeAt(0), this.base.exportSelection());
        let position = selection.anchorNode.compareDocumentPosition(selection.focusNode);
        let direction = selection.direction;
        if (!direction) {
          if (!position && selection.anchorOffset > selection.focusOffset || position === Node.DOCUMENT_POSITION_PRECEDING) {
            direction = "backward";
          } else {
            direction = "forward";
          }
        }
        let selectedNodes = [];
        let startWord = null;
        if (selection.baseNode.nodeType === 3) {
          startWord = selection.baseNode.parentNode;
        }
        if (startWord) {
          selectedNodes.push(startWord);
          if (!Array.from(startWord.childNodes).includes(selection.focusNode)) {
            let nextSibling = null;
            let searchNodeType = direction === "forward" ? "nextElementSibling" : "previousElementSibling";
            do {
              let baseElement = (nextSibling || startWord);
              while (!baseElement[searchNodeType]) {
                baseElement = baseElement.parentNode;
              }
              nextSibling = baseElement[searchNodeType];
              while (nextSibling.nodeName !== "W") {
                nextSibling = nextSibling.childNodes[0];
              }
              selectedNodes.push(nextSibling);
              if (Array.from(nextSibling.childNodes).includes(selection.focusNode)) {
                break;
              }
            } while (nextSibling);
          }
          if (direction === "forward") {
            textSelection.start_id = selectedNodes[0].id;
            textSelection.end_id = selectedNodes[selectedNodes.length - 1].id;
          } else {
            textSelection.start_id = selectedNodes[selectedNodes.length - 1].id;
            textSelection.end_id = selectedNodes[0].id;
          }
          let startOffset = selection.baseOffset - 1;
          let endOffset = selection.focusOffset - 1;
          textSelection.start_offset = direction === "forward" ? startOffset : endOffset;
          textSelection.end_offset = direction === "forward" ? endOffset : startOffset;
        } else if (selection.baseNode.nodeName === "SG") {
          let selectedW = null;
          let selectedEl = selection.baseNode;
          while (selectedEl.childNodes.length > 0 && !selectedW) {
            selectedEl = selectedEl.childNodes[0];
            if (selectedEl.nodeName === "W") {
              selectedW = selectedEl;
            }
          }
          if (selectedW) {
            textSelection.start_id = selectedW.id;
            textSelection.end_id = selectedW.id;
          }
        }
      }
    }

    return textSelection;
  }


});

const SuggestPreview = MediumEditor.extensions.anchorPreview.extend({
  name: 'suggest-preview',
  init: function () {
    MediumEditor.extensions.anchorPreview.prototype.init.apply(this, arguments);
  },

  handleEditableMouseover: function (event) {
    var target = MediumEditor.util.traverseUp(event.target, function (element) {
      return element.dataset.hasOwnProperty('suggestion');
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
    if (this.anchorPreview.classList.contains('medium-editor-anchor-preview-active')
      || anchorEl.getAttribute('data-disable-preview')) {
        return true;
    }

    if (this.previewValueSelector) {
        let val = anchorEl.dataset.suggestion ? anchorEl.dataset.suggestion : '"Empty suggestion"';
        this.anchorPreview.querySelector(this.previewValueSelector).textContent = val;
        this.anchorPreview.querySelector(this.previewValueSelector).href = val;
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
    var anchorExtension = this.base.getExtensionByName('suggestButton'),
      activeAnchor = this.activeAnchor;

    if (anchorExtension && activeAnchor) {
      event.preventDefault();

      this.base.selectElement(this.activeAnchor);

      // Using setTimeout + delay because:
      // We may actually be displaying the anchor form, which should be controlled by delay
      this.base.delay(function () {
          if (activeAnchor) {
              var opts = {
                  value: activeAnchor.dataset.suggestion,
                  target: activeAnchor.dataset.suggestion,
                  //buttonClass: activeAnchor.getAttribute('class')
              };
              anchorExtension.showForm(opts);
              activeAnchor = null;
          }
      }.bind(this));
    }

    this.hidePreview();
  }
});

const applyCustomTag = function (nodeName = 'sup') {

  let selection = document.getSelection();

  const editorElement = this.base.elements[0];
  if (!editorElement) return false;
  const ftnMarkers = editorElement.querySelectorAll('sup[data-idx]');
  const pgMarkers = editorElement.querySelectorAll('sup[data-pg]');
  for (const searchNode of [...Array.from(ftnMarkers), ...Array.from(pgMarkers)]) {
    if (selection.containsNode(searchNode, true)) {
      return;
    }
  }

  let position = selection.anchorNode.compareDocumentPosition(selection.focusNode),
      isBackward = false;
  // position == 0 if nodes are the same
  if (!position && selection.anchorOffset > selection.focusOffset
    || position === Node.DOCUMENT_POSITION_PRECEDING)
    isBackward = true;

  if (isBackward) {
    const _range = new Range();
    _range.setStart(selection.focusNode, selection.extentOffset);
    _range.setEnd(selection.anchorNode, selection.baseOffset);
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(_range);
    selection = document.getSelection();
  }

  const isCollapsed = selection.isCollapsed;
  let isAlreadyApplied = false;

  const startParentNodeOffset = selection.baseOffset;

  let startParentNode = selection.anchorNode; // sel.baseNode === sel.anchorNode
  const startParentNodes = [startParentNode];
  while (startParentNode.parentNode && startParentNode.parentNode.nodeName.toLowerCase() !== 'div') {
    startParentNode = startParentNode.parentNode;
    startParentNodes.push(startParentNode);
  }
  isAlreadyApplied = startParentNodes.some((node)=>node.nodeName.toLowerCase() === nodeName);

  //console.log(`:startParentNodes: `, startParentNodes, startParentNodeOffset);

  const endParentNodeOffset = selection.extentOffset;

  let endParentNode = selection.focusNode; // sel.extentNode === sel.focusNode
  const endParentNodes = [endParentNode];
  while (endParentNode.parentNode && endParentNode.parentNode.nodeName.toLowerCase() !== 'div') {
    endParentNode = endParentNode.parentNode;
    endParentNodes.push(endParentNode)
  }
  isAlreadyApplied = isAlreadyApplied || endParentNodes.some((node)=>node.nodeName.toLowerCase() === nodeName);

  if (!isAlreadyApplied) {
    const wordWrappers = this.base.getFocusedElement().querySelectorAll(nodeName);
    for (const searchNode of Array.from(wordWrappers)) {
      if (selection.containsNode(searchNode, true)) {
        isAlreadyApplied = true;
        break;
      }
    }
  }

  //console.log(`:endParentNodes: `, endParentNodes, endParentNodeOffset);

  if (isCollapsed) {
    if (!isAlreadyApplied) {
      //console.log(`isCollapsed::!isAlreadyApplied`);

      let command = 'superscript';
      switch(nodeName) {
        case 'sup' : {
          command = 'superscript';
        } break;
        case 'sub' : {
          command = 'subscript';
        } break;
      };
      document.execCommand(command);
    } else {
      //console.log(`isCollapsed::isAlreadyApplied`);

      const startTagNode = startParentNodes.find((node)=>node.nodeName.toLowerCase() === nodeName);
      let range = new Range();
      range.setStart(startTagNode, 0);
      range.setEnd(selection.focusNode, endParentNodeOffset);
      const docFragment = range.cloneContents();

      const newNode = document.createElement(nodeName);
      newNode.appendChild(docFragment);

      range.setStartBefore(startTagNode);
      range.deleteContents();
      range.insertNode(newNode);

      var emptyElement = document.createTextNode('\u200B');
      newNode.after(emptyElement)

      range.setStart(emptyElement, 1);
      range.setEnd(emptyElement, 1);
      range.collapse();

      document.getSelection().removeAllRanges();
      document.getSelection().addRange(range);

    }
  } else {

    if (!isAlreadyApplied) {
      //console.log(`!isAlreadyApplied::!isCollapsed`);

      const range = selection.getRangeAt(0);
      const newNode = document.createElement(nodeName);
      const docFragment = range.cloneContents();

      let prevSibling, nextSibling;

      range.deleteContents();
      newNode.appendChild(docFragment);
      newNode.textContent = newNode.textContent.replace(/\s+$/, '');
      range.insertNode(newNode);
      // add space after element to have possibility to set cursor ahead with normal text
      newNode.insertAdjacentHTML('afterend', ' ');

      prevSibling = newNode.previousSibling;
      if (prevSibling) {

        const lostSpace = newNode.textContent.match(/^\s+/);
        if (lostSpace && lostSpace[0]) { //restore captured space in previous node
          prevSibling.innerHTML = prevSibling.innerHTML + lostSpace[0];
        }

        if (prevSibling.textContent && prevSibling.textContent.length == 0) {
          prevSibling.remove()
        } else if (prevSibling.nodeName.toLowerCase() === 'w') {
            const wordId = prevSibling.getAttribute('id');
            const wordWrappers = this.base.getFocusedElement().querySelectorAll(`w[id="${wordId}"]`);
            let isFirstApplyed = false;
            for (const foundNode of Array.from(wordWrappers)) {
              if (foundNode.textContent.trim().length == 0) {
                foundNode.remove();
              } else if (isFirstApplyed) {
                foundNode.removeAttribute('id');
              } else {
                isFirstApplyed = true;
              }
            }
        }
      }

      nextSibling = newNode.nextSibling;
      if (nextSibling) {
        if (nextSibling.textContent && nextSibling.textContent.trim().length == 0) {
          nextSibling.replaceWith(document.createTextNode(nextSibling.textContent));
        } else if (nextSibling.nodeName.toLowerCase() === 'w') {
          const wordId = nextSibling.getAttribute('id');
          const wordWrappers = this.base.getFocusedElement().querySelectorAll(`w[id="${wordId}"]`);
          let isFirstApplyed = false;
          for (const foundNode of Array.from(wordWrappers)) {
            if (foundNode.textContent.trim().length == 0) {
              foundNode.replaceWith(document.createTextNode(foundNode.textContent));
            } else if (isFirstApplyed) {
              foundNode.removeAttribute('id');
            } else {
              isFirstApplyed = true;
            }
          }
        }
      }

      range.setStart(newNode, 0);
      range.setEnd(newNode, newNode.childNodes.length);
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(range);

    } else {
      //console.log(`isAlreadyApplied::!isCollapsed`);

      const startTagNode = startParentNodes.find((node)=>node.nodeName.toLowerCase() === nodeName);
      const endTagNode = endParentNodes.find((node)=>node.nodeName.toLowerCase() === nodeName);

      let docFragment, cleanupNode, cleanupSelection, startCheckNode, endCheckNode;

      const range = selection.getRangeAt(0);

      if (endTagNode) {
        const endTagRange = new Range();
        endTagRange.setStart(selection.focusNode, selection.extentOffset);
        endTagRange.setEnd(endTagNode, endTagNode.childNodes.length);

        docFragment = endTagRange.cloneContents();

        cleanupNode = document.createElement(nodeName);
        cleanupNode.appendChild(docFragment);
        cleanupNode.innerHTML = cleanupNode.innerHTML.replace(new RegExp(`<\\/*${nodeName}[^>]*>`,'g'), '');

        if (cleanupNode.textContent.trim().length) {
          endTagRange.deleteContents();
          endTagRange.setStartAfter(endTagNode);
          endTagRange.insertNode(cleanupNode);
        }

        range.setEndAfter(endTagNode);
      }

      if (startTagNode) {
        const startTagRange = new Range();
        startTagRange.setStart(startTagNode, 0);
        startTagRange.setEnd(selection.anchorNode, selection.baseOffset);

        docFragment = startTagRange.cloneContents();

        cleanupNode = document.createElement(nodeName);
        cleanupNode.appendChild(docFragment);
        cleanupNode.innerHTML = cleanupNode.innerHTML.replace(new RegExp(`<\\/*${nodeName}[^>]*>`,'g'), '');

        if (cleanupNode.textContent.trim().length) {
          startTagRange.deleteContents();
          startTagRange.setStartBefore(startTagNode);
          startTagRange.insertNode(cleanupNode);
        }

        range.setStartBefore(startTagNode);

      }

      docFragment = range.cloneContents();
      range.deleteContents();

      cleanupNode = document.createElement(nodeName);
      cleanupNode.appendChild(docFragment);
      cleanupNode.innerHTML = cleanupNode.innerHTML.replace(new RegExp(`<\\/*${nodeName}[^>]*>`,'g'), '');

      docFragment = new DocumentFragment();
      for (const childNode of Array.from(cleanupNode.childNodes)) {
        docFragment.append(childNode)
      }

      range.insertNode(docFragment);

      startCheckNode = startParentNodes.find((node)=>node.nodeName.toLowerCase() === 'w');
      if (startCheckNode && startCheckNode.id) {
        const wordWrappers = this.base.getFocusedElement().querySelectorAll(`w[id="${startCheckNode.id}"]`);
        let isFirstApplyed = false;
        for (const foundNode of Array.from(wordWrappers)) {
          delete foundNode.dataset.sugg;
          let checkIfEmpty = foundNode;
          while (checkIfEmpty.parentNode && checkIfEmpty.parentNode.nodeName.toLowerCase() !== 'div') {
            checkIfEmpty = checkIfEmpty.parentNode;
          }
          if (checkIfEmpty.textContent.trim().length == 0) {
            const lostSpace = checkIfEmpty.textContent.match(/^\s+/);
            if (lostSpace && lostSpace[0] && checkIfEmpty.previousSibling) { //restore captured space in previous node
              const prevSibling = checkIfEmpty.previousSibling;
              prevSibling.innerHTML = prevSibling.innerHTML + lostSpace[0];
            }
            checkIfEmpty.remove();
          } else if (isFirstApplyed) {
            foundNode.removeAttribute('id');
          } else {
            isFirstApplyed = true;
          }
        }
      }

      endCheckNode = endParentNodes.find((node)=>node.nodeName.toLowerCase() === 'w');
      if (endCheckNode && endCheckNode.id) {
        const wordWrappers = this.base.getFocusedElement().querySelectorAll(`w[id="${endCheckNode.id}"]`);
        for (const foundNode of Array.from(wordWrappers)) {
          delete foundNode.dataset.sugg;
        }
      }
    }

    var e = document.createEvent('HTMLEvents');
    e.initEvent('input', false, true);
    this.base.getFocusedElement().dispatchEvent(e);
  }
};

const formatSup = function () {
  const selection = document.getSelection();
  const wordWrappers = this.base.getFocusedElement().querySelectorAll('sub');
  for (const searchNode of Array.from(wordWrappers)) {
    if (selection.containsNode(searchNode, true)) {
      applyCustomTag.call(this, searchNode.nodeName.toLowerCase());
    }
  }
  applyCustomTag.call(this, 'sup');
};

const formatSub = function () {
  const selection = document.getSelection();
  const wordWrappers = this.base.getFocusedElement().querySelectorAll('sup');
  for (const searchNode of Array.from(wordWrappers)) {
    if (selection.containsNode(searchNode, true)) {
      applyCustomTag.call(this, searchNode.nodeName.toLowerCase());
    }
  }
  applyCustomTag.call(this, 'sub');
};

const SuperScriptButton = MediumEditor.extensions.button.extend({
    name: 'superScriptButton',
    tagNames: ['sup'],
    contentDefault: '<b>x<sup>1</sup></b>',
    contentFA: '<i class="fa fa-superscript"></i>',
    aria: 'Superscript Ctrl/⌘+.',
    action: 'customSupScript',
    disabledButtonClass: 'medium-editor-button-disable',

    init: function () {
      MediumEditor.extensions.button.prototype.init.call(this);
    },

    handleClick: function (event) {
      if (this.isEnabled()) {
        formatSup.call(this);
        this.base.checkSelection();
      }

      // Ensure the editor knows about an html change so watchers are notified
      // ie: <textarea> elements depend on the editableInput event to stay synchronized
      // this.base.checkContentChanged();
    },

    isAlreadyApplied: function () {
      const selection = document.getSelection();
      let isAlreadyApplied = false;
      const editorElement = this.base.elements[0];
      if (!editorElement) return false;
      const wordWrappers = editorElement.querySelectorAll(this.tagNames[0]);
      const ftnMarkers = editorElement.querySelectorAll('sup[data-idx]');
      const pgMarkers = editorElement.querySelectorAll('sup[data-pg]');
      for (const searchNode of [...Array.from(ftnMarkers), ...Array.from(pgMarkers)]) {
        if (selection.containsNode(searchNode, true)) {
          this.setDisabled();
          return false;
        }
      }
      if (!this.isEnabled()) {
        this.setEnabled();
      }
      for (const searchNode of Array.from(wordWrappers)) {
        if (selection.containsNode(searchNode, true)) {
          isAlreadyApplied = true;
          break;
        }
      }
      return isAlreadyApplied;
    },

    isEnabled: function () {
      return !this.button.classList.contains(this.disabledButtonClass);
    },

    setDisabled: function () {
      this.button.classList.add(this.disabledButtonClass);
    },

    setEnabled: function () {
      this.button.classList.remove(this.disabledButtonClass);
    },
});

const SubScriptButton = MediumEditor.extensions.button.extend({
    name: 'subScriptButton',
    tagNames: ['sub'],
    contentDefault: '<b>x<sub>1</sub></b>',
    contentFA: '<i class="fa fa-subscript"></i>',
    aria: 'Subscript Ctrl/⌘+,',
    action: 'customSubScript',
    disabledButtonClass: 'medium-editor-button-disable',

    init: function () {
      MediumEditor.extensions.button.prototype.init.call(this);
    },

    handleClick: function (event) {
      if (this.isEnabled()) {
        formatSub.call(this)
        this.base.checkSelection();
      }

      // Ensure the editor knows about an html change so watchers are notified
      // ie: <textarea> elements depend on the editableInput event to stay synchronized
      // this.base.checkContentChanged();
    },

    isAlreadyApplied: function () {
      const selection = document.getSelection();
      let isAlreadyApplied = false;
      const editorElement = this.base.elements[0];
      if (!editorElement) return false;
      const wordWrappers = editorElement.querySelectorAll(this.tagNames[0]);
      const ftnMarkers = editorElement.querySelectorAll('sup[data-idx]');
      const pgMarkers = editorElement.querySelectorAll('sup[data-pg]');
      for (const searchNode of [...Array.from(ftnMarkers), ...Array.from(pgMarkers)]) {
        if (selection.containsNode(searchNode, true)) {
          this.setDisabled();
          return false;
        }
      }
      if (!this.isEnabled()) {
        this.setEnabled();
      }
      for (const searchNode of Array.from(wordWrappers)) {
        if (selection.containsNode(searchNode, true)) {
          isAlreadyApplied = true;
          break;
        }
      }
      return isAlreadyApplied;
    },
    isEnabled: function () {
      return !this.button.classList.contains(this.disabledButtonClass);
    },

    setDisabled: function () {
      this.button.classList.add(this.disabledButtonClass);
    },

    setEnabled: function () {
      this.button.classList.remove(this.disabledButtonClass);
    },
});

export {
  QuoteButton,
  QuotePreview,
  SuggestButton,
  SuggestPreview,
  MediumEditor,
  formatSup,
  formatSub,
  SuperScriptButton,
  SubScriptButton
}
