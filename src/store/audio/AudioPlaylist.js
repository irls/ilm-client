var updateEditor = function(cursor, playbackRate) {
  let currentTime = this.ac.currentTime;
  //currentTime = currentTime / 2;
  const selection = this.getTimeSelection();
  const cursorPos = cursor || this.cursor;
  let elapsed = (currentTime - this.lastDraw);
  if (playbackRate !== 1) {
    elapsed = elapsed / (1 / playbackRate);
  }

  if (this.isPlaying()) {
    const playbackSeconds = cursorPos + elapsed;
    this.ee.emit("timeupdate", playbackSeconds);
    this.animationRequest = window.requestAnimationFrame(() => {
      this.updateEditor(playbackSeconds);
    });
    this.playbackSeconds = playbackSeconds;
    this.draw(this.render());
    this.lastDraw = currentTime;
  } else {
    if (cursorPos + elapsed >= (this.isSegmentSelection() ? selection.end : this.duration)) {
      this.ee.emit("finished");
    }

    this.stopAnimation();
    this.resetDrawTimer = setTimeout(() => {
      this.pausedAt = undefined;
      this.lastSeeked = undefined;
      this.setState(this.getState());
      this.playbackSeconds = 0;
      this.draw(this.render());
    }, 0);
  }
}

module.exports = {
  updateEditor
}