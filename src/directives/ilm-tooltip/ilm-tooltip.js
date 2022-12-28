const _id = require('uniqid');
const lodash = require('lodash');

import { getHostOffset, getWindowScrollLeft, getWindowScrollTop, getOuterWidth, getOuterHeight, isOutOfBounds } from './common.js';

function bindEvents(el) {
  el.addEventListener('mouseenter', onMouseEnter);
  el.addEventListener('mouseleave', onMouseLeave);
  el.addEventListener('click', onClick);
}

function unbindEvents(el) {
  el.removeEventListener('mouseenter', onMouseEnter);
  el.removeEventListener('mouseleave', onMouseLeave);
  el.removeEventListener('click', onClick);
}

function onMouseEnter(event) {
  show(event.currentTarget);
}

function onMouseLeave(event) {
  let tooltipElement = getTooltipElement(event.currentTarget);
  if ((event.currentTarget && event.currentTarget.$_ilmTooltipId && event.toElement && event.currentTarget.$_ilmTooltipId === event.toElement.id) || (tooltipElement && tooltipElement.contains(event.toElement))) {
    let hideElement = event.currentTarget;
    tooltipElement.addEventListener('mouseleave', () => {
      hide(hideElement);
    });
  } else {
    hide(event.currentTarget);
  }
}

function onClick(event) {
  hide(event.currentTarget);
  let ilmTooltip = event.currentTarget.$_ilmTooltip;
  if (!event.currentTarget.disabled && ilmTooltip && !ilmTooltip.closeOnClick) {
    show(event.currentTarget);
  }
}

/*function bindScrollListener(el) {
  if (!el.$_ilmTooltipScrollHandler) {
    el.$_ilmTooltipScrollHandler = el.addEventListener('scroll', hide);
  }
}

function unbindScrollListener(el) {
  if (el.$_ilmTooltipScrollHandler) {
    el.$_ilmTooltipScrollHandler.unbindScrollListener();
  }
}*/

function show(el) {
  //console.log('SHOW HERE');
  let tElement = create(el);
  align(el);
}

function hide(el) {
  //console.log('HIDE HERE');
  remove(el);
}

function create(el) {
  const id = _id() + '_btn-tooltip';
  el.$_ilmTooltipId = id;

  let container = document.createElement('div');
  container.id = id;
  //container.className = 'ilm-btn-tooltip';

  let tooltipArrow = document.createElement('div');
  tooltipArrow.className = 'ilm-tooltip-arrow';
  container.appendChild(tooltipArrow);

  let tooltipText = document.createElement('div');
  tooltipText.className = 'ilm-tooltip-text';

  tooltipText.innerHTML = el.$_ilmTooltip.value;
  if (el.$_ilmTooltip.valueSource) {
    let value = document.getElementById(el.$_ilmTooltip.valueSource);
    if (value) {
      tooltipText.innerHTML = value.innerHTML;
    }
  }

  container.appendChild(tooltipText);
  document.body.appendChild(container);

  container.style.display = 'inline-block';
  
  if (el.$_ilmTooltip.classList) {
    if (el.$_ilmTooltip.classList.tooltip) {
      container.className = el.$_ilmTooltip.classList.tooltip;
    }
  }

  return container;
}

function remove(el) {
  if (el) {
    let tooltipElement = getTooltipElement(el);
    if (tooltipElement && tooltipElement.parentElement) {
      document.body.removeChild(tooltipElement);
    }
  }
}

function align(el) {
  const modifiers = el.$_ilmTooltip.modifiers;
  if (modifiers.top) {
    alignTop(el);
  }
  
  let tooltipElement = getTooltipElement(el);
  let inBounds = isOutOfBounds(tooltipElement);
  if (inBounds.right !== false) {
    let textLabel = tooltipElement.getElementsByClassName('ilm-tooltip-text')[0];
    textLabel.style.position = 'relative';
    textLabel.style.left = parseInt(inBounds.right * -1) - 4 + 'px';
  }
}

function preAlign(el, position) {
  let tooltipElement = getTooltipElement(el);
  tooltipElement.style.left = -999 + 'px';
  tooltipElement.style.top = -999 + 'px';
  tooltipElement.className+= ` ilm-tooltip -${position}`;
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
  return document.getElementById(el.$_ilmTooltipId);
}

const IlmTooltip = {
  bind(el, binding) {
    el.$_ilmTooltip = binding;
    el.$_ilmTooltip = _.assign(el.$_ilmTooltip, {classList: {}, closeOnClick: true});
    //console.log(el.className, binding.value, el.$_ilmTooltip);
    if (typeof binding.value !== 'string') {
      if (binding.value.valueSource) {
        el.$_ilmTooltip.valueSource = lodash.cloneDeep(binding.value.valueSource);
      }
      if (binding.value.classList) {
        el.$_ilmTooltip.classList = lodash.cloneDeep(binding.value.classList);
      }
      el.$_ilmTooltip.value = lodash.cloneDeep(binding.value.value);
      if (binding.value.hasOwnProperty('closeOnClick')) {
        el.$_ilmTooltip.closeOnClick = binding.value.closeOnClick;
      }
    }
    bindEvents(el);
  },
  unbind(el) {
    delete el.$_ilmTooltip;
    delete el.$_ilmTooltipId;
    remove(el);
    unbindEvents(el);
  },
  update(el, binding) {
    //console.log('2.', el.className, binding.value, el.$_ilmTooltip);
    if (typeof binding.value !== 'string') {
      if (binding.value.valueSource) {
        el.$_ilmTooltip.valueSource = lodash.cloneDeep(binding.value.valueSource);
      }
      if (binding.value.classList) {
        el.$_ilmTooltip.classList = lodash.cloneDeep(binding.value.classList);
      }
      el.$_ilmTooltip.value = lodash.cloneDeep(binding.value.value);
      if (binding.value.hasOwnProperty('closeOnClick')) {
        el.$_ilmTooltip.closeOnClick = binding.value.closeOnClick;
      }
    } else {
      el.$_ilmTooltip.value = binding.value;
    }
  }
}

export default IlmTooltip;