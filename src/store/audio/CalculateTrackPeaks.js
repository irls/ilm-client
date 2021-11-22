import extractPeaks from "webaudio-peaks";
import { secondsToPixels, secondsToSamples } from "waveform-playlist/lib/utils/conversions";

const calculateTrackPeaks = function(samplesPerPixel, sampleRate, silence_value) {
  const cueIn = secondsToSamples(this.cueIn, sampleRate);
  const cueOut = secondsToSamples(this.cueOut, sampleRate);
  let peaks = extractPeaks(this.buffer, samplesPerPixel, this.peakData.mono, cueIn, cueOut);
  if (peaks && Array.isArray(peaks.data) && typeof peaks.data[0] !== 'undefined') {
    const silence_peaks = convert(silence_value, peaks.bits);
    peaks.data[0].forEach((pd, i) => {
      if (pd === 0) {
        peaks.data[0][i] = silence_peaks;
      }
    });
  }
  this.setPeaks(peaks);
}

const convert = function(n, bits) {
  var max = Math.pow(2, bits - 1);
  var v = n < 0 ? n * max : n * (max - 1);
  return Math.max(-max, Math.min(max - 1, v));
}

module.exports = {
  calculateTrackPeaks
}