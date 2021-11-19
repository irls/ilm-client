import extractPeaks from "webaudio-peaks";
import { secondsToPixels, secondsToSamples } from "waveform-playlist/lib/utils/conversions";

const calculateTrackPeaks = function(samplesPerPixel, sampleRate) {
  const cueIn = secondsToSamples(this.cueIn, sampleRate);
  const cueOut = secondsToSamples(this.cueOut, sampleRate);
  let peaks = extractPeaks(this.buffer, samplesPerPixel, this.peakData.mono, cueIn, cueOut);
  if (peaks && Array.isArray(peaks.data)) {
    peaks.data.forEach((pd, i) => {
      console.log(pd.forEach);
      if (Array.isArray(pd)) {
        console.log('ARRAY HERE');
      }
      if (pd === 0) {
        peaks.data[i] = 163;
      }
    });
  }
  this.setPeaks(peaks);
}

module.exports = {
  calculateTrackPeaks
}