const _id = require('uniqid');
const lodash = require('lodash');

function bindEvents(el) {
  el.addEventListener('click', onClick);
}

function unbindEvents(el) {
  el.removeEventListener('click', onClick);
}

function onClick(event) {
  let el = getTooltipElement(event.currentTarget);
  if (el) {
    hide(el);
  }
  show(event.currentTarget);
}

function show(el) {
  let tElement = create(el);
  if (el.$_btnToast) {
    setTimeout(function() {
      tElement.style.opacity = 1;
      let fadeOutInterval = setInterval(function() {
        if (tElement.style.opacity <= 0.3) {
          clearInterval(fadeOutInterval);
          hide(tElement);
        } else {
          tElement.style.opacity-= 0.1;
        }
      }, 10);
    }, el.$_btnToast.timeout || 0);
  }
  align(el);
}

function hide(toast) {
  remove(toast);
}

function create(el) {
  const id = _id() + '_btn-toast';
  el.$_btnToastId = id;

  let container = document.createElement('div');
  container.id = id;
  //container.className = 'ilm-btn-tooltip';

  let tooltipText = document.createElement('div');
  tooltipText.className = 'btn-toast-text';

  tooltipText.innerHTML = el.$_btnToast.value;
  if (el.$_btnToast.valueSource) {
    let value = document.getElementById(el.$_btnToast.valueSource);
    if (value) {
      tooltipText.innerHTML = value.innerHTML;
    }
  }

  container.appendChild(tooltipText);
  document.body.appendChild(container);

  container.style.display = 'inline-block';
  
  if (el.$_btnToast.classList) {
    if (el.$_btnToast.classList.tooltip) {
      container.className = el.$_btnToast.classList.tooltip;
    }
  }

  return container;
}

function remove(toast) {
  if (toast && toast.parentElement) {
    document.body.removeChild(toast);
  }
}

function align(el) {
  const modifiers = el.$_btnToast.modifiers;
  if (modifiers.top) {
    alignTop(el);
  }
  
  let tooltipElement = getTooltipElement(el);
  let inBounds = isOutOfBounds(tooltipElement);
  if (inBounds.right !== false) {
    let textLabel = tooltipElement.getElementsByClassName('btn-toast-text')[0];
    textLabel.style.position = 'relative';
    textLabel.style.left = parseInt(inBounds.right * -1) - 4 + 'px';
  }
}

function preAlign(el, position) {
  let tooltipElement = getTooltipElement(el);
  tooltipElement.style.left = -999 + 'px';
  tooltipElement.style.top = -999 + 'px';
  tooltipElement.className+= ` btn-toast -${position}`;
}

function alignTop(el) {
  preAlign(el, 'top');
  let tooltipElement = getTooltipElement(el);
  let hostOffset = getHostOffset(el);
  //console.log(`hostOffset.left: ${hostOffset.left}`);
  //console.log(`getOuterWidth(el): ${getOuterWidth(el)}`);
  //console.log(`getOuterWidth(tooltipElement): ${getOuterWidth(tooltipElement)}`);
  let left = hostOffset.left + (getOuterWidth(el) - getOuterWidth(tooltipElement)) / 2;
  let top = hostOffset.top - getOuterHeight(tooltipElement);
  //tooltipElement.classList+=' -top';
  tooltipElement.style.left = left + 'px';
  tooltipElement.style.top = top + 'px';
}

function getTooltipElement(el) {
  return document.getElementById(el.$_btnToastId);
}



function getHostOffset(el) {
  let offset = el.getBoundingClientRect();
  let targetLeft = offset.left + getWindowScrollLeft();
  let targetTop = offset.top + getWindowScrollTop();

  return {left: targetLeft, top: targetTop};
}

function getWindowScrollLeft() {
  let doc = document.documentElement;
  return (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
}

function getWindowScrollTop() {
  let doc = document.documentElement;
  return (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
}

function getOuterWidth(el, margin) {
  return el.offsetWidth;
}
function getOuterHeight(el, margin) {
  return el.offsetHeight;
}

function isOutOfBounds(el) {
  let offset = el.getBoundingClientRect();
  let targetTop = offset.top;
  let targetLeft = offset.left;

  let width = getOuterWidth(el);

  let height = getOuterHeight(el);

  let viewport = getViewport();
  
  let right = targetLeft + width - viewport.width;
  if (right < 0) {
    right = false;
  }
  if (targetLeft > 0) {
    targetLeft = false;
  }
  if (targetTop > 0) {
    targetTop = false;
  }
  let bottom = targetTop + height - viewport.height;
  if (bottom < 0) {
    bottom = false;
  }
  return {
    right: right, 
    left: targetLeft, 
    top: targetTop, 
    bottom: bottom
  };
}

function getViewport() {
  let win = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      w = win.innerWidth || e.clientWidth || g.clientWidth,
      h = win.innerHeight || e.clientHeight || g.clientHeight;
  return {
    width: w,
    height: h
  };
}

const BtnToast = {
  bind(el, binding) {
    el.$_btnToast = binding;
    el.$_btnToast = _.assign(el.$_btnToast, {classList: {}, timeout: 2000});
    //console.log(el.className, binding.value, el.$_ilmTooltip);
    if (typeof binding.value !== 'string') {
      if (binding.value.valueSource) {
        el.$_btnToast.valueSource = lodash.cloneDeep(binding.value.valueSource);
      }
      if (binding.value.classList) {
        el.$_btnToast.classList = lodash.cloneDeep(binding.value.classList);
      }
      el.$_btnToast.value = lodash.cloneDeep(binding.value.value);
      if (binding.value.hasOwnProperty('timeout')) {
        el.$_btnToast.timeout = binding.value.timeout;
      }
    }
    bindEvents(el);
  },
  unbind(el) {
    delete el.$_btnToast;
    delete el.$_btnToastId;
    remove(el);
    unbindEvents(el);
  },
  update(el, binding) {
    if (typeof binding.value !== 'string') {
      if (binding.value.valueSource) {
        el.$_btnToast.valueSource = lodash.cloneDeep(binding.value.valueSource);
      }
      if (binding.value.classList) {
        el.$_btnToast.classList = lodash.cloneDeep(binding.value.classList);
      }
      el.$_btnToast.value = lodash.cloneDeep(binding.value.value);
      if (binding.value.hasOwnProperty('timeout')) {
        el.$_btnToast.timeout = binding.value.timeout;
      }
    } else {
      el.$_btnToast.value = binding.value;
    }
  }
}

export default BtnToast;