<template>
  <div class="align-check col-md-12">
    <div id="top" class="col-md-12">
      <div class="col-md-8 align-text">
        <textarea v-model="text"></textarea>
      </div>
      <div class="col-md-4">
        <div class="col-md-6 pull-left">
          Language
          <select v-model="lang">
            <option value="eng">English</option>
            <option value="ukr">Ukrainian</option>
          </select>
        </div>
        <div class="col-md-6 pull-right">
          <button class="btn btn-primary" v-on:click="realign()">Realign</button>
        </div>
        <div class="col-md-12">
          <fieldset v-if="!isUploading">
            <form enctype="multipart/form-data" @submit.prevent>
              <div class="col-md-12">
                <div class="col-md-12">
                  <span v-if="filename">Current audio file name <i>{{filename}}</i></span>
                </div>
                <div class="col-sm-12">
                  <label class='btn btn-default' type="file">
                    <i class="fa fa-folder-open-o" aria-hidden="true"></i>Browse&hellip;
                    <input name="audio_import" type="file" class="file_open" accept="audio/*" @change="onAudioFileChange" />
                  </label>
                </div>
              </div>
            </form>
          </fieldset>
          <div class="col-md-12" v-else>
            <div class="preloader-small"></div>
          </div>
        </div>
      </div>
    </div>
    <div id="bottom" class="col-md-12">
      <div class="col-md-12 align-result">
        <div 
          id="check-align"
          :data-audiosrc="audioSrc"
          :class="['aligned-text', {'playing': isPlaying}]"
          v-html="alignedText"></div>
      </div>
      <div class="col-md-12 audio-controls" v-if="alignedText">
        <i class="fa fa-play-circle-o" v-if="!isPlaying" v-on:click="play()"></i>
        <i class="fa fa-pause-circle-o" v-if="isPlaying && !isPaused" v-on:click="pause()"></i>
        <i class="fa fa-stop-circle-o" v-if="isPlaying || isPaused" v-on:click="stop()"></i>
      </div>
    </div>
  </div>
</template>
<script>
  import api_config from '../../mixins/api_config.js'
  import ReadAlong from 'readalong'
  import Split from 'split.js'
  export default {
      name: 'CheckAlign',
      components: {
        
      },
      mixins: [api_config],
      data() {
        return {
          text: '',
          alignedText: '',
          isPlaying: false,
          isPaused: false,
          isUploading: false,
          filename: '',
          file: {},
          audioSrc: '',
          player: false,
          lang: ''
        }
      },
      mounted() {
        Split(['#top', '#bottom'], {
          direction: 'vertical'
        });
        this.player = new ReadAlong({
            forceLineScroll: false
        },{
            on_start: ()=>{
              this.isPlaying = true;
              this.isPaused = false;
            },
            on_pause: ()=>{
              if (this.isPlaying) {
                this.isPlaying = false;
                this.isPaused = true;
              } else {
                this.isPaused = false;
              }
            },
            on_resume: ()=>{
              this.isPaused = false;
              this.isPlaying = true;
            },
            on_complete: ()=>{
              this.isPlaying = false;
              this.isPaused = false;
              this.cleanAudioClasses();
            }
        });
      },
      methods: {
        realign() {
          if (this.file) {
            let formData = new FormData();
            formData.append('file', this.file, this.filename);
            formData.append('text', this.text);
            formData.append('lang', this.lang);
            let api = this.$store.state.auth.getHttp();
            this.isUploading = true;
            api.post(this.API_URL + 'align_check', formData)
              .then(response => {
                this.isUploading = false;
                if (response.data) {
                  this.alignedText = response.data.content;
                  this.audioSrc = process.env.ILM_API + response.data.audiosrc;
                }
              })
              .catch(err => {
                this.isUploading = false;
              });
          }
        },
        onAudioFileChange(e) {
          let fieldName = e.target.name;
          let fileList = e.target.files || e.dataTransfer.files;
          if (fileList[0]) {
            this.file = fileList[0];
            this.filename = this.file.name;
          }
        },
        play() {
          if (this.isPaused) {
            this.player.resume();
          } else {
            this.player.playBlock('check-align');
          }
        },
        pause() {
          this.player.pause();
        },
        stop() {
          this.isPlaying = false;
          this.isPaused = false;
          this.player.pause();
          this.cleanAudioClasses();
        },
        cleanAudioClasses: function() {
          let reading_class = this.player.config.reading_class;
          $('#check-align').find('.'+reading_class).each(function(){
            $(this).removeClass(reading_class);
          });
          let trail_class = this.player.config.trail_class;
          $('#check-align').find('.'+trail_class).each(function(){
            $(this).removeClass(trail_class);
          });
        }
      }
  }
</script>
<style lang="less">
  .align-check {
    height: 400px;
    #top {
      height: 180px;
    }
    textarea {
      width: 100%;
      height: 90%;
      resize: none;
    }
    .align-text {
      height: 100%;
    }
    .align-result {
      margin: 20px;
    }
    .audio-controls {
      margin: 30px 0px;
      text-align: center;
      
      i.fa {
        font-size: 45px;
        color: #428bca;
      }
    }
    input[type="file"] {
      display: none;
    }
    fieldset {
      border: 1px solid #b9b6b6;
      position: relative;
      margin: 10px;
      padding: 20px 5px;
    }
    .preloader-small {
      background: url(/static/preloader-snake-small.gif);
      width: 34px;
      height: 34px;
    }
  }
  .aligned-text[data-audiosrc].playing {
      w[data-map] {
        background: linear-gradient(
            transparent,
            transparent 50%,
            rgba(0,255,0,.2) 55%,
            transparent 70%,
            transparent
        );
        /*cursor: pointer*/
      }
      w:not([data-map]) {
        background: linear-gradient(
            transparent,
            transparent 30%,
            rgba(255,0,0,.3) 55%,
            transparent 80%,
            transparent
        );
      }

      /* hover effect to show which word is affected */
      w.audio-highlight {
          border-bottom: 5px solid rgb(226,226,226);
          border-radius: 3px;
      }
      w.audio-trail {
          border-bottom: 5px solid rgb(240,240,240);
          border-radius: 3px;
      }
      /* gap markers -- although CSS content messes up wrapping and is tricky to detect clicks */
      w[data-gap] {margin-right: 52px} /* Make room for marker */
      w[data-gapbefore] {margin-left: 50px} /* Make room marker */
      w[data-gap]:after, w[data-gapbefore]:before {
        cursor: pointer;
        padding: 5px;
        margin: 5px;
        position: absolute;
        width: auto;
        border-radius: .5em;
        border: 1px solid gray;
        background: silver;
        font: 10pt 'FontAwesome';
      }
      w[data-gap]:after {
          content: '\f060\00A0\f1c7';
          margin-left: 4px;
      }
      w[data-gapbefore]:before {
          content: '\f1c7\00A0\f061';
          left: -50px;
      }
      w.audio-highlight {
          background: linear-gradient(
              transparent 20%,
              rgba(255,255,0,.8) 55%,
              transparent 80%
          );
      }
      w.audio-trail {
          background: linear-gradient(
              transparent 30%,
              rgba(255,255,0,.4) 55%,
              transparent 70%
          );
      }
  }
  .gutter {
    background-color: #eee;

    background-repeat: no-repeat;
    background-position: 50%;
    float: left;
    width: 100%;
    cursor: ns-resize;
  }
</style>