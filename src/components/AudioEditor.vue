<template>
  <div>
    <div v-html="content" :data-audiosrc="audiofile" class="block-content">
      
    </div>
    <div class="waveform-playlist">
      <div>
        <i class="fa fa-play-circle-o" v-on:click="play()"></i>
        <i class="fa fa-pause-circle-o" v-on:click="pause()"></i>
        <i class="fa fa-stop-circle-o" v-on:click="stop()"></i>
      </div>
      <div id="playlist" class="wf-playlist"></div>
    </div>
    <!-- <div class="peaks-player">
      <div id="peaks-player"></div>
      <audio>
        <source src="http://localhost:3000/audiofiles/aaiw1_en/aaiw1_en_2s/23716-02.mp3.flac" type="audio/ogg">
      </audio>
    </div> -->
  </div>
</template>
<script>
  import api_config from '../mixins/api_config.js'
  //import Peaks from 'peaks.js';
  var WaveformPlaylist = require('waveform-playlist');
  var WaveformData = require('waveform-data')
  export default {
      name: 'AudioEditor',
      components: {
        
      },
      mixins: [api_config],
      data() {
        return {
          audiosourceEditor: false,
          peaksPlayer: false,
          content: '<w data-map="0,975">The </w><w data-map="975,285">odd </w><w data-map="1260,950">superstitions </w><w data-map="2210,385">touched </w><w data-map="2595,520">upon </w><w data-map="3115,430">were </w><w data-map="3545,530">all </w><w data-map="4075,395">prevalent </w><w data-map="4470,660">among </w><w data-map="5130,555">children </w><w data-map="5685,185">and </w><w data-map="5870,610">slaves </w><w data-map="6480,45">in </w><w data-map="6525,265">the </w><w data-map="6790,425">West </w><w data-map="7215,140">at </w><w data-map="7355,220">the </w><w data-map="7575,420">period </w><w data-map="7995,245">of </w><w data-map="8240,155">this </w><w data-map="8395,715">story — </w><w data-map="9110,685">that </w><w data-map="9795,235">is </w><w data-map="10030,115">to </w><w data-map="10145,635">say, </w><w data-map="10780,310">thirty </w><w data-map="11090,145">or </w><w data-map="11235,365">forty </w><w data-map="11600,610">years </w><w data-map="12210,1030">ago.</w>',
          audiofile: 'http://localhost:3000/audiofiles/1_en/1_en_33/1_en_33.flac',
          plEventEmitter: false
        }
      },
      mounted() {
        let annotations = [];
        $(this.content).each(function() {
          let map = $(this).attr('data-map');
          if (map) {
            let position = map.split(',');
            if (position.length == 2) {
              annotations.push({
                "begin": parseInt(position[0]) / 1000, 
                "children": [], 
                "end": parseInt(position[1]) / 1000 + parseInt(position[0]) / 1000, 
                "id": $(this).html(), 
                "language": "eng", 
                "lines": []
              });
            }
          }
        });
        this.audiosourceEditor= WaveformPlaylist.init({
          ac: new (window.AudioContext || window.webkitAudioContext),
          samplesPerPixel: 100,
          //mono: true,
          //waveHeight: 150,
          container: document.getElementById('playlist'),
          state: 'cursor',
          colors: {
            waveOutlineColor: '#E0EFF1',
            timeColor: 'grey',
            fadeColor: 'black'
          },
          /*controls: {
            show: true,
            width: 200
          },*/
          zoomLevels: [100],
          timescale: true,
          annotationList: {
            annotations: annotations,
            //controls: actions,
            editable: true,
            isContinuousPlay: false,
            linkEndpoints: true
          }
        });
        this.audiosourceEditor.load([
          {
            src: this.audiofile,
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
          console.log('Loaded')
          this.plEventEmitter = this.audiosourceEditor.getEventEmitter();
          
          //console.log(this.player)
        });
        $('.block-content w').on('click', function() {
          let index = $('.block-content w').index($(this));
          let annotations = $('.annotations-boxes .annotation-box');
          if (annotations[index]) {
            $('.playlist-tracks').animate({
              scrollLeft: $(annotations[index]).position().left
            }, 500);
            //console.log($(annotations[index]).position().left);
          }
        });
        $('.annotations-boxes .annotation-box').on('click', function() {
          let index = $('.annotations-boxes .annotation-box').index($(this));
          $('.block-content w').removeClass('selected');
          let words = $('.block-content w');
          if (words[index]) {
            $(words[index]).addClass('selected');
          }
        });
        /*var aContext = window.AudioContext || window.webkitAudioContext;
        var myAudioContext = new aContext();
        
        this.peaksPlayer = Peaks.init({
          container: document.getElementById('peaks-player'),
          mediaElement: document.querySelector('audio'),
          audioContext: myAudioContext
        });
        this.peaksPlayer.on('peaks.ready', function() {
          console.log('Peaks ready')
        });*/
        $('.wf-playlist').on('click', function() {
          
        });
      },
      methods: {
        play() {
          this.audiosourceEditor.play();
        },
        stop() {
          this.audiosourceEditor.stop();
        },
        pause() {
          this.audiosourceEditor.pause();
        }
      }
  }
</script>
<style lang="less">
  .wf-playlist {
    .cursor {
      width: 2px;
      background-color: black;
    }
    .selection.point {
      width: 2px;
      background-color: green;
    }
    .playlist {
        .annotations {
          .annotation-box {
            border: 1px solid grey;
            padding: 0 10px;
            cursor: pointer;
            .resize-handle {
                background: grey;
                opacity: 0.3;
                cursor: ew-resize;
            }
            .id {
                height: 100%;
                display: inline-block;
                margin: 4px 0px;
            }
          }
          .annotations-text {
            .annotation {
              .annotation-id {
                  font-weight: bold;
                  margin: 0px 10px;
              }
              .annotation-start {
                  margin: 0px 10px;
              }
              .annotation-end {
                  margin: 0px 10px;
              }
            }
          }
        }
        .playlist-time-scale {
            height: 30px;
        }
        .channel-progress {
            background: yellow;
        }
        .channel {
            background: gray;
        }
    }
  }
  .block-content {
    w {
      &.selected {
          background-color: yellow;
      }
    }
  }
</style>
