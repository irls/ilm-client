import LoaderFactory from "waveform-playlist/lib/track/loader/LoaderFactory";
import Track from "waveform-playlist/lib/Track.js";
import Playout from "waveform-playlist/lib/Playout.js";

var trackLoad = function(trackList) {
  const loadPromises = trackList.map(trackInfo => {
    const loader = LoaderFactory.createLoader(trackInfo.src, this.ac, this.ee);
    return loader.load();
  });
  return Promise.all(loadPromises).then(audioBuffers => {
    this.ee.emit("audiosourcesloaded");
    const tracks = audioBuffers.map((audioBuffer, index) => {
      
      let new_list = new Float32Array(audioBuffer.length);
      for (let i = 0; i < audioBuffer.numberOfChannels; ++i) {
        let changed = 0;
        audioBuffer.copyFromChannel(new_list, i);
        new_list.forEach((n, ni) => {
          if (n === 0) {
            new_list[ni] = 0.005;
            ++changed;
          }
        });
        audioBuffer.copyToChannel(new_list, i);
        console.log(`changed: ${changed}`);
      }
      //this.audiosourceEditor.activeTrack.setBuffer(new_buffer);
      const info = trackList[index];
      const name = info.name || "Untitled";
      const start = info.start || 0;
      const states = info.states || {};
      const fadeIn = info.fadeIn;
      const fadeOut = info.fadeOut;
      const cueIn = info.cuein || 0;
      const cueOut = info.cueout || audioBuffer.duration;
      const gain = info.gain || 1;
      const muted = info.muted || false;
      const soloed = info.soloed || false;
      const selection = info.selected;
      const peaks = info.peaks || {
        type: "WebAudio",
        mono: this.mono
      };
      const customClass = info.customClass || undefined;
      const waveOutlineColor = info.waveOutlineColor || undefined;
      const stereoPan = info.stereoPan || 0; // webaudio specific playout for now.

      const playout = new Playout(this.ac, audioBuffer);
      const track = new Track();
      track.src = info.src;
      track.setBuffer(audioBuffer);
      track.setName(name);
      track.setEventEmitter(this.ee);
      track.setEnabledStates(states);
      track.setCues(cueIn, cueOut);
      track.setCustomClass(customClass);
      track.setWaveOutlineColor(waveOutlineColor);

      if (fadeIn !== undefined) {
        track.setFadeIn(fadeIn.duration, fadeIn.shape);
      }

      if (fadeOut !== undefined) {
        track.setFadeOut(fadeOut.duration, fadeOut.shape);
      }

      if (selection !== undefined) {
        this.setActiveTrack(track);
        this.setTimeSelection(selection.start, selection.end);
      }

      if (peaks !== undefined) {
        track.setPeakData(peaks);
      }

      track.setState(this.getState());
      track.setStartTime(start);
      track.setPlayout(playout);
      track.setGainLevel(gain);
      track.setStereoPanValue(stereoPan);

      if (muted) {
        this.muteTrack(track);
      }

      if (soloed) {
        this.soloTrack(track);
      } // extract peaks with AudioContext for now.


      track.calculatePeaks(this.samplesPerPixel, this.sampleRate);
      return track;
    });
    this.tracks = this.tracks.concat(tracks);
    this.adjustDuration();
    this.draw(this.render());
    this.ee.emit("audiosourcesrendered");
  }).catch(e => {
    this.ee.emit("audiosourceserror", e);
  });
}

module.exports = {
  trackLoad
}