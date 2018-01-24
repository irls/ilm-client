<template>
  <div>
    <accordion>
      <panel :is-open="true" :header="'File audio catalogue'" v-bind:key="'file-audio-catalogue'">
        <div class="file-catalogue">
          <div class="file-catalogue-buttons">
            <div v-if="tc_hasTask('upload_audio') || tc_hasTask('audio_mastering')" class="upload-audio">
              <button id="show-modal" @click="uploadAudio" class="btn btn-primary btn_audio_upload btn-small">
                Import Audio
              </button>
            </div>
            <div class="delete-audio">
              <button class="btn btn-danger btn-small" :disabled="selectionLength == 0 || !_is('editor')" v-on:click="deleteAudio()">Delete<span v-if="selectionLength > 0">({{selectionLength}})</span></button>
            </div>
            <div class="unselect-audio">
              <button class="btn btn-default btn-small" :disabled="selectionLength == 0" v-on:click="checkAll(null, false)">Unselect<span v-if="selectionLength > 0">({{selectionLength}})</span></button>
            </div>

            <div class="">
              <input type="checkbox" v-model="checkAllState"/>
            </div>
          </div>
          <div class="file-catalogue-files-wrapper">
            <ul class="file-catalogue-files draggable-list">
              <li v-for="(audiofile, index) in audiobook.importFiles" class="audiofile">
                <div :class="['audiofile-info', {'playing': playing == audiofile.id}]">
                  <div class="audiofile-player-controls">
                    <i class="fa fa-play-circle-o" v-on:click="play(audiofile.id, true)"></i>
                    <!-- <i class="fa fa-play-circle-o red" v-on:click="play()" v-if="paused === audiofile.id"></i>
                    <i class="fa fa-pause-circle-o" v-on:click="pause()" v-if="playing === audiofile.id && paused !== audiofile.id"></i>
                    <i class="fa fa-stop-circle-o" v-on:click="stop()" v-if="playing === audiofile.id"></i> -->
                  </div>
                  <div class="audiofile-name">
                    <span v-if="renaming !== audiofile.id" class="audiofile-name-edit" @click="play(audiofile.id, false)"  :title="audiofile.name">{{audiofile.name}}</span>
                    <input type="text" v-model="audiofile.name" class="audiofile-name-edit"
                         @focusout="saveAudiobook()"
                         v-else />
                  </div>
                  <div class="audiofile-duration"><span>({{ parseAudioLength(audiofile.duration) }})</span></div>
                </div>
                <div class="audiofile-options">
                  <input type="checkbox" :name="audiofile.id" @change="addSelection(audiofile.id, $event)"/>
                  <dropdown text="..." type="default">
                    <li><i class="fa fa-pencil"></i>
                      <a v-on:click="renameAudiofile(audiofile.id)">Rename</a>
                    </li>
                    <li><i class="fa fa-trash"></i>
                      <a v-on:click="deleteAudio(audiofile.id)">Delete</a>
                    </li>
                  </dropdown>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div>
          <p v-if="hasBlocksForAlignment">
            {{blocksForAlignment.count}} blocks in range: <a class="go-to-block" v-on:click="scrollToBlock(blocksForAlignment.start._id)">{{blocksForAlignment.start._id}}</a> - <a class="go-to-block" v-on:click="scrollToBlock(blocksForAlignment.end._id)">{{blocksForAlignment.end._id}}</a> need audio
          </p>
          <div class="pull-left" v-if="hasBlocksForAlignment && !enableAlignment">
            <span class="red">Select audio</span>
          </div>
          <div class="pull-right align-process-start">
            <button v-if="!alignmentProcess" class="btn btn-default" :disabled="!enableAlignment" v-on:click="align()">Align with text</button>
          </div>
        </div>
      </panel>
      <panel :is-open="false" :header="'TTS audio catalogue'" v-bind:key="'tts-audio-catalogue'">
        <div></div>
      </panel>
    </accordion>
    <modal v-model="onDeleteMessage" effect="fade">
      <!-- custom header -->
      <div slot="modal-header" class="modal-header">
        <h4 class="modal-title" v-if="deleting">
          Delete audio file?
        </h4>
        <h4 class="modal-title" v-else>
          Delete {{ selectionLength }} audio files?
        </h4>
      </div>
      <!-- custom buttons -->
      <div slot="modal-footer" class="modal-footer">
        <button type="button" class="btn btn-default" @click="discardDeleteAudio()">Cancel</button>
        <button type="button" class="btn btn-confirm" @click="deleteAudioProcess()">Delete<span v-if="!deleting">({{ selectionLength }})</span></button>
      </div>
    </modal>
    <modal v-model="alignmentProcessModal" effect="false" @closed="cancelAlign()" class="align-modal">
      <div slot="modal-header" class="modal-header">
        <h4>Aligning blocks {{blocksForAlignment.start._id}} - {{blocksForAlignment.end._id}} with audio</h4>
      </div>
      <div slot="modal-body" class="modal-body">
          <div class="align-preloader"></div>
      </div>
      <div slot="modal-footer" class="modal-footer">
        <button type="button" class="btn btn-default" v-on:click="cancelAlign()">Cancel</button>
      </div>
    </modal>
    <div id="player"></div>
  </div>
</template>
<script>
  import {accordion, panel, dropdown, modal} from 'vue-strap'
  import task_controls from '../../mixins/task_controls.js'
  import api_config from '../../mixins/api_config.js'
  import Vue from 'vue'
  import access from '../../mixins/access.js';
  import {mapGetters, mapActions} from 'vuex';
  var WaveformPlaylist = require('waveform-playlist');
  var List = require('draggable-list')
  //var d3 = require('d3')
  export default {
    name: 'BookAudioIntegration',
    computed: {

    },
    components: {
      accordion,
      panel,
      dropdown,
      modal

    },
    props: {
      'audiobook': Object,
      'blocksForAlignment': Object
    },
    data() {
      return {
        renaming: false,
        selections: [],
        deleting: false,
        onDeleteMessage: false,
        player: false,
        playing: false,
        paused: false,
        draggableList: false,
        alignmentProcess: false,
        alignmentProcessModal: false
      }
    },
    mixins: [task_controls, api_config, access],
    mounted() {
      /*let ac = new (window.AudioContext || window.webkitAudioContext);
      this.player = WaveformPlaylist.init({
        ac: ac,
        samplesPerPixel: 0,
        waveHeight: 0,
        container: document.getElementById('player'),
        state: 'select',
        zoomLevels: [0],
        timescale: false,
        linkEndpoints: false
      });*/
      var self = this;
      this.$root.$on('from-audioeditor:close', function() {
        self.playing = false;
      })
      this.$root.$on('from-audioeditor:save-positions', function(id, selections) {
        id = id.split('/').pop();
        let record = self.audiobook.importFiles.find(_f => {
          return _f.id == id;
        });
        if (record) {
          record.positions = selections;
          self.saveAudiobook();
        }
      });
      this.$root.$on('from-audioeditor:discard', function() {
        let record = self.audiobook.importFiles.find(f => {
          return f.id == self.playing;
        })
        if (record) {
          self.$root.$emit('for-audioeditor:load-and-play', process.env.ILM_API + self.audiobook.importUrl + record.id, '', null, false, record)
        }
      });

    },
    methods: {
      uploadAudio() {
        this.$emit('uploadAudio')
      },
      renameAudiofile(id) {
        this.renaming = id;
      },
      saveAudiobook(reorder) {
        reorder = reorder || [];
        this.renaming = false;
        let api_url = this.API_URL + 'books/' + this.audiobook.bookid + '/audiobooks/' + this.audiobook._id;
        let formData = new FormData();
        formData.append('audiobook', JSON.stringify(this.audiobook));
        formData.append('reorder', JSON.stringify(reorder));
        let api = this.$store.state.auth.getHttp()
        let self = this;
        api.post(api_url, formData, {}).then(function(response){
          if (response.status===200) {
            self.$emit('audiobookUpdated', response.data);
          } else {

          }
        }).catch((err) => {
          console.log('error: '+ err)
        });
      },
      addSelection(id, event, value) {

        if (event && event.target) {
          value = event.target.checked;
        }

        if (value === true) {
          if (this.selections.indexOf(id) === -1) {
            this.selections.push(id)
          }
        } else {
          this.selections.splice(this.selections.indexOf(id), 1)
          $('input[name="' + id + '"]').prop('checked', false);
        }
      },
      checkAll(event, value) {
        if (event && event.target) {
          value = event.target.checked;
        }
        $('.file-catalogue-files input[type="checkbox"]').prop('checked', value);
        if (this.audiobook.importFiles) {
          this.audiobook.importFiles.forEach(_f => {
            this.addSelection(_f.id, null, value)
          })
        }
      },
      deleteAudio(id) {
        this.onDeleteMessage = true;
        this.deleting = id;

      },
      deleteAudioProcess() {
        if (!this.deleting) {
          if (!this.selections.length) {
            return false;
          }
          let files = [];
          this.audiobook.importFiles.forEach((_f, i) => {
            if (this.selections.indexOf(_f.id) === -1) {
              files.push(_f);
            } else {
              this.addSelection(_f.id, null, false);
            }
          });
          this.audiobook.importFiles = files;
          this.checkAllState = false;
          this.saveAudiobook();
        } else {
          let files = [];
          if (this.selections.indexOf(this.deleting) !== -1) {
            this.addSelection(this.deleting, null, false);
          }
          this.audiobook.importFiles.forEach((_f, i) => {
            if (_f.id !== this.deleting) {
              files.push(_f);
            }
          });
          this.audiobook.importFiles = files;
          this.saveAudiobook();
        }
        this.onDeleteMessage = false;
        let self = this;
        Vue.nextTick(() => {
          self.selections.forEach(s => {
            $('input[name="' + s + '"]').prop('checked', true);
          });
        })
      },
      discardDeleteAudio() {
        this.onDeleteMessage = false;
        this.deleting = false;
      },
      play(id, autostart) {
        if (!this._is('editor')) {
          return;
        }
        if (id) {
          let record = this.audiobook.importFiles.find(f => {
            return f.id == id;
          })
          if (record/* && this.player*/) {
            this.$root.$emit('for-audioeditor:load-and-play', process.env.ILM_API + this.audiobook.importUrl + record.id, '', null, autostart, record)
            this.playing = id;
            /*this.player.getEventEmitter().emit('clear');
            this.player.load([
              {
                src: process.env.ILM_API + this.audiobook.importUrl + id,
                name: 'block-audio',
                gain: 0.5,
                waveOutlineColor: '#f3f3f3',
                customClass: 'block-audio',
                states: {
                  cursor: true,
                  fadein: true,
                  fadeout: true,
                  select: true,
                  shift: true,
                }
              }
            ]).then(() => {
              this.player.play();
              this.playing = id;
              let self = this;
              this.player.getEventEmitter().on('finished', function() {
                self.playing = false;
                self.paused = false;
              });
            });*/
          }
        } else if (this.player) {
          this.player.play();
        }
        this.paused = false;
      },
      pause() {
        this.player.pause();
        this.paused = this.playing;
      },
      stop() {
        this.player.stop();
        this.paused = false;
        this.playing = false;
      },
      parseAudioLength(length) {
        if (!length) {
          return '';
        }
        let l = length.split(':');
        if (l[0]) {
          l[0] = parseInt(l[0]);
        }
        if (l[2]) {
          l[2] = l[2].split('.').shift();
        }
        return l.join(':')
      },
      align() {
        let api_url = this.API_URL + 'books/' + this.audiobook.bookid + '/selection_alignment';
        let formData = new FormData();
        let api = this.$store.state.auth.getHttp()
        let self = this;
        this.alignmentProcess = true;
        api.post(api_url, {
          start: this.blocksForAlignment.start._id,
          end: this.blocksForAlignment.end._id,
          audiofiles: this.selections,
          realign: this.tc_hasTask('audio_mastering') || this.currentBookCounters.not_marked_blocks === 0
        }, {}).then(function(response){
          if (response.status===200) {

          } else {

          }
          self.alignmentProcess = false;
          self.setCurrentBookCounters();
        }).catch((err) => {
          console.log('error: '+ err)
          self.alignmentProcess = false;
        });
      },
      cancelAlign(force = false) {
        if (this.alignmentProcess || force) {
          let api_url = this.API_URL + 'books/' + this.audiobook.bookid + '/selection_alignment';

          let api = this.$store.state.auth.getHttp()
          let self = this;

          api.delete(api_url, {}, {}).then(function(response){
            if (response.status===200) {

            } else {

            }
            self.alignmentProcess = false;
          }).catch((err) => {
            console.log('error: '+ err)
          });
        }
      },
      scrollToBlock(id) {
        this.$root.$emit('for-bookedit:scroll-to-block', id);
      },
      ...mapActions(['setCurrentBookCounters'])
    },
    computed: {
      selectionLength: {
        get() {
          return this.selections.length
        }
      },
      checkAllState: {
        get() {
          return this.audiobook && this.audiobook.importFiles && this.audiobook.importFiles.length ? this.selections.length == this.audiobook.importFiles.length : false;
        },
        set(val) {
          this.checkAll(null, val)
        }
      },
      enableAlignment: function() {
        return this.hasBlocksForAlignment && this.selectionLength > 0
      },
      hasBlocksForAlignment: function() {
        return this.blocksForAlignment.count > 0
      },
      ...mapGetters(['currentBookCounters'])
    },
    watch: {
      'audiobook': {
        handler(val) {
          //console.log('Audiobook changed');
          if (typeof val.importFiles !== 'undefined') {
            val.importFiles.forEach(_if => {
              if (typeof this.selections[_if.id] === 'undefined') {
                //this.selections[_if.id] = false;
              }
              this.selections.forEach((s, i) => {
                let exists = val.importFiles.find(v => {return v.id === s});
                if (!exists) {
                  delete this.selections[i];
                }
              });
            });
            let self = this;
            Vue.nextTick(() => {
              self.draggableList = new List(document.querySelector('.draggable-list'));
              self.draggableList.on('move', function (node, newIndex, prevIndex) {
                self.saveAudiobook([[prevIndex, newIndex]]);
              })
              self.selections.forEach(s => {
                $('input[name="' + s + '"]').prop('checked', true);
              });
            })
          }
        },
        deep: true
      },
      'alignmentProcess': {
        handler(val) {
          this.alignmentProcessModal = val;
        }
      }
    }
  }
</script>
<style lang="less">
  .btn-small {
    font-size: 12px;
  }
  .file-catalogue {
    .file-catalogue-buttons {
      &>div {
        display: inline-block;
        text-align: center;
        &.delete-audio, &.upload-audio, &.unselect-audio {
          width: 100px;
        }
      }
    }
    .file-catalogue-files-wrapper {
        height: 220px;
        max-height: 220px;
        overflow-y: scroll;
    }
    .file-catalogue-files-wrapper::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
      border-radius: 10px;
      background-color: #F5F5F5;
    }
    .file-catalogue-files-wrapper::-webkit-scrollbar {
      width: 12px;
      background-color: #F5F5F5;
    }
    .file-catalogue-files-wrapper::-webkit-scrollbar-thumb {
      border-radius: 10px;
      -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
      background-color: #555;
    }
    .file-catalogue-files {
      list-style-type: none;
      margin-left: 0px;
      padding-left: 0px;
      max-height: 300px;
      .audiofile {
        list-style-type: none;
        padding: 2px;
        i.fa {
          display: inline-block;
          padding: 0px 2px;
          &.red {
              color: red;
          }
        }
        span {
          display: inline-block;
          padding: 0px 2px;
        }
        .audiofile-info {
          display: inline-block;
          width: 305px;
          .audiofile-player-controls {
            width: 19px;
            display: inline-block;
          }
          .audiofile-name {
            display: inline-block;
            cursor: pointer;
          }
          .audiofile-duration {
            width: 50px;
            display: inline-block;
          }
          &.playing {
            color: maroon;
            i.fa {
              color: maroon;
            }
          }
        }
        .audiofile-options {
          display: inline-block;
          .btn-group {
            .dropdown-toggle {
                padding: 6px;
            }
          }
          ul.dropdown-menu {
              margin-left: -35px;
              min-width: 80px;
              max-width: 80px;
          }
        }
        button {
          background-color: inherit;
          border: none;
          cursor: pointer;
          span {
              display: none;
          }
        }
        ul.dropdown-menu {
          i {
              font-size: 12px;
              &.fa-trash {
                  color: red;
              }
          }
          li {
              font-size: 12px;
              a {
                  display: inline-block;
                  padding: 0px 1px;
              }
          }
        }
        input[type="text"] {

        }
        input[disabled] {
            background-color: inherit;
            border: none;
        }
      }
    }
  }
  h4.panel-title {
    font-size: 14px;
  }
  #player {
      display: none;
  }
  .red {
    color: red;
  }
  .align-preloader {
      background: url(/static/preloader-snake-small.gif);
      width: 34px;
      height: 34px;
      display: inline-block;
      margin: 4px 0px;
  }
  .align-modal {
    .modal-header {
        border-bottom: none;
    }
    .modal-body {
        text-align: center;
    }
    .modal-footer {
      button {
          width: 100%;
      }
    }
  }
</style>
