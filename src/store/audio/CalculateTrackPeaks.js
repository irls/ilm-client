import extractPeaks from "webaudio-peaks";
import { secondsToPixels, secondsToSamples } from "waveform-playlist/lib/utils/conversions";

const calculateTrackPeaks = function(samplesPerPixel, sampleRate, silenceValue, silenceArray = []) {
  const cueIn = secondsToSamples(this.cueIn, sampleRate);
  const cueOut = secondsToSamples(this.cueOut, sampleRate);
  let peaks = extractPeaks(this.buffer, samplesPerPixel, this.peakData.mono, cueIn, cueOut);
  if (peaks && Array.isArray(peaks.data) && typeof peaks.data[0] !== 'undefined') {
    const silence_peaks = convert(silenceValue, peaks.bits);
    if (!silenceArray || silenceArray.length < 2) {
      peaks.data[0].forEach((pd, i) => {
        if (pd === 0) {
          peaks.data[0][i] = silence_peaks;
        }
      });
    } else {
      const min_silence_peak = convert(silenceArray[0], peaks.bits);
      const max_silence_peak = convert(silenceArray[1], peaks.bits);
      peaks.data[0].forEach((pd, i) => {
        if (pd >= min_silence_peak && pd <= max_silence_peak) {
          peaks.data[0][i] = silence_peaks;
        }
      });
    }
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