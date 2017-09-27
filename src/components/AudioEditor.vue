<template>
  <div>
    <div class="waveform-playlist">
      <div id="playlist" class="playlist"></div>
      <div>
        <i class="fa fa-play-circle-o" v-on:click="play()"></i>
        <i class="fa fa-pause-circle-o" v-on:click="pause()"></i>
        <i class="fa fa-stop-circle-o" v-on:click="stop()"></i>
      </div>
    </div>
    <div class="peaks-player">
      <div id="peaks-player"></div>
      <audio>
        <source src="http://localhost:3000/audiofiles/aaiw1_en/aaiw1_en_2s/23716-02.mp3.flac" type="audio/ogg">
      </audio>
    </div>
  </div>
</template>
<script>
  import api_config from '../mixins/api_config.js'
  import Peaks from 'peaks.js';
  var WaveformPlaylist = require('waveform-playlist');
  var WaveformData = require('waveform-data')
  export default {
      name: 'AudioEditor',
      components: {
        
      },
      mixins: [api_config],
      data() {
        return {
          player: false,
          peaksPlayer: false
        }
      },
      mounted() {
        this.player= WaveformPlaylist.init({
          ac: new (window.AudioContext || window.webkitAudioContext),
          samplesPerPixel: 500,
          mono: true,
          waveHeight: 150,
          container: document.getElementById('playlist'),
          state: 'cursor',
          colors: {
            waveOutlineColor: '#FFFFFF',
            timeColor: 'grey',
            fadeColor: 'black'
          },
          controls: {
            show: true,
            width: 200
          },
          zoomLevels: [500, 1000, 3000, 5000],
          timescale: true
        });
        this.player.load([
          {
            src: 'http://localhost:3000/audiofiles/aaiw1_en/aaiw1_en_2s/23716-01.mp3.flac',
            name: 'Vocals',
            gain: 0.5,
            waveOutlineColor: '#f3f3f3',
            customClass: 'vocals',
            states: {
              cursor: true,
              fadein: true,
              fadeout: true,
              select: true,
              shift: true,
            }
          }
        ])
        .then(() => {
          
        });
        var aContext = window.AudioContext || window.webkitAudioContext;
        var myAudioContext = new aContext();
        
        this.peaksPlayer = Peaks.init({
          container: document.getElementById('peaks-player'),
          mediaElement: document.querySelector('audio'),
          audioContext: myAudioContext
        });
        this.peaksPlayer.on('peaks.ready', function() {
          console.log('Peaks ready')
        });
      },
      methods: {
        play() {
          this.player.play();
        },
        stop() {
          this.player.stop();
        },
        pause() {
          this.player.pause();
        }
      }
  }
</script>
<style lang="less">
  .playlist {
    .cursor {
      width: 2px;
      background-color: black;
    }
    .selection.point {
      width: 2px;
      background-color: green;
    }
  }
</style>
