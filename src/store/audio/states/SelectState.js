import { pixelsToSeconds } from "waveform-playlist/lib/utils/conversions";
export default class {
  constructor(track) {
    this.track = track;
    this.active = false;
  }

  setup(samplesPerPixel, sampleRate) {
    this.samplesPerPixel = samplesPerPixel;
    this.sampleRate = sampleRate;
  }

  emitSelection(x) {
    const minX = Math.min(x, this.startX);
    const maxX = Math.max(x, this.startX);
    const startTime = pixelsToSeconds(minX, this.samplesPerPixel, this.sampleRate);
    const endTime = pixelsToSeconds(maxX, this.samplesPerPixel, this.sampleRate);
    this.track.ee.emit("select", startTime, endTime, this.track);
  }

  complete(x) {
    if (Math.abs(x - this.startX) > 0.1) {// avoid single cursor selection
      this.emitSelection(x);
    }
    this.active = false;
  }

  mousedown(e) {
    e.preventDefault();
    if (e && e.buttons === 1) {// only if left button pressed
      this.active = true;
      this.startX = e.offsetX;
      const startTime = pixelsToSeconds(this.startX, this.samplesPerPixel, this.sampleRate);
      this.track.ee.emit("select", startTime, startTime, this.track);
    }
  }

  mousemove(e) {
    if (this.active) {
      e.preventDefault();
      this.emitSelection(e.offsetX);
    }
  }

  mouseup(e) {
    if (this.active && e && e.buttons === 0) {
      e.preventDefault();
      this.complete(e.offsetX);
    }
  }

  mouseleave(e) {
    if (this.active) {
      e.preventDefault();
      this.complete(e.offsetX);
    }
  }

  static getClass() {
    return ".state-select";
  }

  static getEvents() {
    return ["mousedown", "mousemove", "mouseup", "mouseleave"];
  }

}