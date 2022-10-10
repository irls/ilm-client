

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

module.exports = {
  getHostOffset,
  getWindowScrollLeft,
  getWindowScrollTop,
  getOuterWidth,
  getOuterHeight,
  isOutOfBounds
}