var setUpSource = function(playbackRate = 1) {
  this.source = this.ac.createBufferSource();
  this.source.buffer = this.buffer;
  const sourcePromise = new Promise(resolve => {
    // keep track of the buffer state.
    this.source.onended = () => {
      /*if (this.source) {
        this.source.disconnect();
        this.fadeGain.disconnect();
        this.volumeGain.disconnect();
        this.shouldPlayGain.disconnect();
        this.panner.disconnect();
        this.masterGain.disconnect();
        this.source = undefined;
        this.fadeGain = undefined;
        this.volumeGain = undefined;
        this.shouldPlayGain = undefined;
        this.panner = undefined;
        this.masterGain = undefined;
      }*/
      //onSourceEnded.call(this);
      resolve();
    };
  });
  this.fadeGain = this.ac.createGain(); // used for track volume slider

  this.volumeGain = this.ac.createGain(); // used for solo/mute

  this.shouldPlayGain = this.ac.createGain();
  this.masterGain = this.ac.createGain();
  this.panner = this.ac.createStereoPanner();
  this.source.connect(this.fadeGain);
  this.source.playbackRate.value = playbackRate;
  this.fadeGain.connect(this.volumeGain);
  this.volumeGain.connect(this.shouldPlayGain);
  this.shouldPlayGain.connect(this.masterGain);
  this.masterGain.connect(this.panner);
  this.panner.connect(this.destination);
  return sourcePromise;
}

var onSourceEnded = function() {
  if (this.source) {
    this.source.disconnect();
    this.fadeGain.disconnect();
    this.volumeGain.disconnect();
    this.shouldPlayGain.disconnect();
    this.panner.disconnect();
    this.masterGain.disconnect();
    this.source = undefined;
    this.fadeGain = undefined;
    this.volumeGain = undefined;
    this.shouldPlayGain = undefined;
    this.panner = undefined;
    this.masterGain = undefined;
  }
}

module.exports = {
  setUpSource,
  onSourceEnded
}