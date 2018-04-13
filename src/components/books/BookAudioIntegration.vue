<template>
  <div>
    <accordion :one-at-atime="true" ref="accordionAudio">
      <panel :is-open="true" :header="'File audio catalogue'" v-bind:key="'file-audio-catalogue'" ref="panelAudiofile">
        <div class="file-catalogue">
          <div class="file-catalogue-buttons">
            <div v-if="_is('editor')" class="upload-audio">
              <button id="show-modal" @click="uploadAudio" class="btn btn-primary btn_audio_upload btn-small">
                Import Audio
              </button>
            </div>
            <div class="delete-audio">
              <button class="btn btn-danger btn-small" :disabled="selectionLength == 0 || !_is('editor')" v-on:click="deleteAudio()">Delete<span v-if="selectionLength > 0">({{selectionLength}})</span></button>
            </div>
            <dropdown text="Mark" type="default" :disabled="selectionLength == 0" ref="allAudioDropdown" class="all-audio-dropdown">
                <li>
                  <span v-on:click="markSelected()" class="mark-done">Mark done</span>
                </li>
                <li>
                  <span v-on:click="unmarkSelected()">Mark pending</span>
                </li>
            </dropdown>

            <div class="">
              <input type="checkbox" v-model="checkAllState"/>
            </div>
          </div>
          <div class="file-catalogue-files-wrapper">
            <draggable v-model="audiobook.importFiles" class="file-catalogue-files" @end="listReorder">
              <div v-for="(audiofile, index) in audiobook.importFiles" class="audiofile">
                <template v-if="audiofile.status == 'processing'">
                  <div class="audiofile-info">
                    <i>Processing, {{audiofile.name}}</i>
                  </div>
                </template>
                <template v-else>
                  <div :class="['audiofile-info', {'playing': playing == audiofile.id, done: audiofile.done}]">
                    <div class="audiofile-player-controls">
                      <i class="fa fa-play-circle-o" v-on:click="play(audiofile.id, true)"></i>
                      <!-- <i class="fa fa-play-circle-o red" v-on:click="play()" v-if="paused === audiofile.id"></i>
                      <i class="fa fa-pause-circle-o" v-on:click="pause()" v-if="playing === audiofile.id && paused !== audiofile.id"></i>
                      <i class="fa fa-stop-circle-o" v-on:click="stop()" v-if="playing === audiofile.id"></i> -->
                    </div>
                    <div class="audiofile-name">
                      <span v-if="renaming !== audiofile.id" 
                            :class="['audiofile-name-edit']" 
                            @click="play(audiofile.id, false)"  :title="audiofile.name">{{audiofile.name}}</span>
                      <input type="text" v-model="audiofile.name" class="audiofile-name-edit"
                           @focusout="saveAudiobook()"
                           v-else />
                    </div>
                    <div class="audiofile-duration"><span>({{ parseAudioLength(audiofile.duration) }})</span></div>
                  </div>
                  <div class="audiofile-options">
                    <input type="checkbox" 
                           :name="audiofile.id" 
                           :checked="selections.indexOf(audiofile.id) !== -1"
                           @click="addSelection(audiofile.id, $event)"
                           />
                    <dropdown text="..." type="default">
                      <li><i class="fa fa-check"></i>
                        <a v-on:click="mark(audiofile.id)">Mark done</a>
                      </li>
                      <li><i class="fa fa-minus"></i>
                        <a v-on:click="unmark(audiofile.id)">Mark pending</a>
                      </li>
                      <li><i class="fa fa-pencil"></i>
                        <a v-on:click="renameAudiofile(audiofile.id)">Rename</a>
                      </li>
                      <li><i class="fa fa-trash"></i>
                        <a v-on:click="deleteAudio(audiofile.id)">Delete</a>
                      </li>
                    </dropdown>
                  </div>
                </template>
              </div>
            </draggable>
          </div>
        </div>
        <div>
          
        </div>
      </panel>
      <panel :is-open="false" :header="'TTS audio catalogue'" v-bind:key="'tts-audio-catalogue'" ref="panelTTS">
        <div class="tts-volume-label">Volume:</div>
        <vue-slider ref="slider" v-model="pre_volume" :min="0.1" :max="1.0" :interval="0.1" :tooltip="false"></vue-slider>
        <table class="table table-striped table-bordered table-voices">
        <thead>
          <tr>
            <th>Block</th><th>Voice</th>
          </tr>
        </thead>
        <tbody v-if="pre_options">
          <tr>
            <td>Title</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices.title"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              :blocksForAlignment="blocksForAlignment"
              @onSelect="onTtsSelect('title', $event)"
            ></select-tts-voice></td>
          </tr>
          <tr>
            <td>Header</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices.header"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              :blocksForAlignment="blocksForAlignment"
              @onSelect="onTtsSelect('header', $event)"
            ></select-tts-voice></td>
          </tr>
          <!--<tr>
            <td>Subheader</td>
            <td><select-tts-voice
              pre_selected=""
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              :blocksForAlignment="blocksForAlignment"
            ></select-tts-voice></td>
          </tr>-->
          <tr>
            <td>Paragraph</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices.paragraph"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              :blocksForAlignment="blocksForAlignment"
              @onSelect="onTtsSelect('paragraph', $event)"
            ></select-tts-voice></td>
          </tr>
          <tr>
            <td>Footnote</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices.footnote"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              :blocksForAlignment="blocksForAlignment"
              @onSelect="onTtsSelect('footnote', $event)"
            ></select-tts-voice></td>
          </tr>
        </tbody>
        </table>
        <p v-if="blocksForAlignment.start._id || blocksForAlignment.end._id">
          <span v-if="hasBlocksForAlignment">{{blocksForAlignment.countTTS}}</span> blocks in range: <a class="go-to-block" v-on:click="scrollToBlock(blocksForAlignment.start._id)">{{blocksForAlignment.start._id}}</a> - <a class="go-to-block" v-on:click="scrollToBlock(blocksForAlignment.end._id)">{{blocksForAlignment.end._id}}</a><!-- need audio-->
        </p>
        <!--<div class="pull-left" v-if="hasBlocksForAlignment && !enableAlignment">
          <span class="red">Select audio</span>
        </div>-->
        <div class="pull-right align-process-start">
          <button v-if="!alignmentProcess" class="btn btn-default" :disabled="!enableTtsAlignment" v-on:click="alignTts()">Convert text to speech &amp; Align with text</button>
        </div>
      </panel>
    </accordion>
    <div id="player"></div>
  </div>
</template>
<script>
  import {accordion, panel, dropdown} from 'vue-strap'
  import task_controls from '../../mixins/task_controls.js'
  import api_config from '../../mixins/api_config.js'
  import Vue from 'vue'
  import access from '../../mixins/access.js';
  import {mapGetters, mapActions} from 'vuex';
  import vueSlider from 'vue-slider-component';
  import SelectTTSVoice from '../generic/SelectTTSVoice'
  var WaveformPlaylist = require('waveform-playlist');
  import draggable from 'vuedraggable';
  import superlogin from 'superlogin-client';
  import PouchDB from 'pouchdb';
  //var d3 = require('d3')
  export default {
    name: 'BookAudioIntegration',
    computed: {

    },
    components: {
      accordion,
      panel,
      dropdown,
      vueSlider,
      'select-tts-voice':SelectTTSVoice,
      draggable

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
        pre_options: false,
        pre_volume: 1.0,
        aligningBlocks: []
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
      this.$root.$on('from-audioeditor:close', function(blockId, audiofileId) {
        if (audiofileId && self.playing === audiofileId) {
          self.playing = false;
        }
      })
      this.$root.$on('from-bookedit:set-selection', (start, end) => {
        var openAudio = this.$refs.panelAudiofile ? this.$refs.panelAudiofile.open : false;
        var openTTS = this.$refs.panelTTS ? this.$refs.panelTTS.open : false;
        if (!openAudio && openTTS) {
          this.$root.$emit('from-bookedit:set-voice-test', start, end)
        }
      })
      this.$root.$on('from-audioeditor:save-positions', function(id, selections) {
        let record = self.audiobook.importFiles.find(_f => {
          return _f.id == id;
        });
        if (record) {
          record.positions = selections;
          self.saveAudiobook();
        }
      });
      this.$root.$on('from-audioeditor:align', function(id, selections = null) {
        
        let record = self.audiobook.importFiles.find(_f => {
          return _f.id == id;
        });
        if (record) {
          if (selections) {
            record.positions = selections;
            self.saveAudiobook()
              .then(() => {
                self.align(id);
              })
              .catch(err => console.log(err));
          } else {
            self.align(id);
          }
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
      this.$root.$on('from-audioeditor:audio-loaded', (id) => {
        let record = this.audiobook.importFiles.find(f => f.id === id);
        if (record) {
          this.playing = id;
        }
      });

      this.getTTSVoices(/*this.currentBookMeta.language*/)
      .then(()=>{
        this.pre_options = this.ttsVoices;
      })
      .catch(err=>err);
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
        return api.post(api_url, formData, {}).then(function(response){
          if (response.status===200) {
            self.$emit('audiobookUpdated', response.data);
          } else {

          }
          return Promise.resolve();
        }).catch((err) => {
          console.log('error: '+ err)
          return Promise.reject();
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
          let reloadOnChange = this.playing != id
          let record = this.audiobook.importFiles.find(f => {
            return f.id == id;
          })
          if (record/* && this.player*/) {
            let audio_th = record['ver'] && record['ver']['m4a'] ? record['ver']['m4a'] : record.id
            this.$root.$emit('for-audioeditor:load-and-play', process.env.ILM_API + this.audiobook.importUrl + audio_th, '', null, autostart, record, reloadOnChange);
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
      align(id = null) {
        let api_url = this.API_URL + 'books/' + this.audiobook.bookid + '/selection_alignment';
        let formData = new FormData();
        let api = this.$store.state.auth.getHttp()
        let self = this;
        //this.alignmentProcess = true;
        let realign = this.tc_hasTask('audio_mastering') || this.currentBookCounters.not_marked_blocks === 0;
        this._setAligningBlocks('audio_file');
        api.post(api_url, {
          start: this.blocksForAlignment.start._id,
          end: this.blocksForAlignment.end._id,
          audiofiles: id ? [id] : this.selections,
          realign: realign
        }, {
          validateStatus: function (status) {
            return status == 200 || status == 504;
          }
        }).then(function(response){
          if (response.status===200) {
            self.$root.$emit('bookBlocksUpdates', response.data);
            self.$emit('alignmentFinished');
            self.aligningBlocks = [];
          } else if (response.status == 504) {
            self.checkAligningBlocks();
          }
          self.setCurrentBookCounters();
        }).catch((err) => {
          console.log('error: '+ err);
          if ((err.response && err.response.status == 504) || err.message == 'Network Error') {
            self.checkAligningBlocks();
          } else {
            self.aligningBlocks = [];
          }
        });
      },
      checkAligningBlocks() {
        this.$root.$off('blockChange');
        var dbPath = superlogin.getDbUrl('ilm_content');
        var db = new PouchDB(dbPath);
        let keys = [];
        this.aligningBlocks.forEach(b => keys.push(b._id));
        db.allDocs({keys: keys, include_docs: true})
          .then(docs => {
            //console.log(docs);
            if (docs.rows) {
              docs.rows.forEach(doc => {
                let d = this.aligningBlocks.find(b => b._id == doc.id);
                if (d && d._rev != doc.value.rev) {
                  this.$root.$emit('bookBlocksUpdates', {blocks: [doc.doc]});
                  let i = this.aligningBlocks.indexOf(d);
                  if (i !== -1) {
                    this.aligningBlocks.splice(i, 1);
                  }
                }
              })
              if (this.aligningBlocks.length > 0) {
                setTimeout(() => {
                  this.checkAligningBlocks();
                }, 5000);
              } else {
                this.$emit('alignmentFinished');
              }
            }
            this.setCurrentBookCounters();
          })
          .catch(err => {
            console.log(err);
          })
      },
      _setAligningBlocks(voicework) {
        this.aligningBlocks = [];
        let realign = this.tc_hasTask('audio_mastering') || this.currentBookCounters.not_marked_blocks === 0;
        if (this.blocksForAlignment.blocks) {
          this.blocksForAlignment.blocks.forEach(_b => {
            if (voicework === 'audio_file') {
              if (_b.voicework === 'audio_file' || (realign && _b.voicework === 'narration')) {
                this.aligningBlocks.push({_id: _b._id, _rev: _b._rev});
              }
            } else if (voicework === 'tts') {
              if (_b.voicework === 'tts') {
                this.aligningBlocks.push({_id: _b._id, _rev: _b._rev});
              } else {
                if (_b.footnotes && _b.footnotes.length > 0) {
                  let f = _b.footnotes.filter(_f => _f.voicework === 'tts');
                  if (f && f.length > 0) {
                    this.aligningBlocks.push({_id: _b._id, _rev: _b._rev});
                  }
                }
              }
            }
          });
        }
        this.$root.$on('blockChange', (doc) => {
          if (doc && doc._id) {
            let d = this.aligningBlocks.find(b => b._id == doc._id);
            if (d) {
              let i = this.aligningBlocks.indexOf(d);
              if (i !== -1) {
                this.aligningBlocks.splice(i, 1);
              }
            }
          }
          if (this.aligningBlocks.length === 0) {
            this.$root.$off('blockChange');
          }
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
            self.aligningBlocks = [];
          }).catch((err) => {
            console.log('error: '+ err)
          });
        }
      },
      alignTts() {
        let api_url = this.API_URL + 'books/' + this.currentBookid + '/selection_alignment';
        let formData = new FormData();
        let api = this.$store.state.auth.getHttp()
        //this.alignmentProcess = true;
        this._setAligningBlocks('tts');
        api.post(api_url, {
          start: this.blocksForAlignment.start._id,
          end: this.blocksForAlignment.end._id,
          audiofiles: false,
          realign: false,/*this.tc_hasTask('audio_mastering') || this.currentBookCounters.not_marked_blocks === 0*/
          voicework: 'all_with_tts',
          voices: this.currentBookMeta.voices
        }, {
          validateStatus: function (status) {
            return status == 200 || status == 504;
          }
        }).then((response)=>{
          if (response.status===200) {
            this.$root.$emit('bookBlocksUpdates', response.data);
            this.$emit('alignmentFinished');
            this.aligningBlocks = [];
          } else if (response.status == 504) {
            self.checkAligningBlocks();
          }
          this.setCurrentBookCounters();
        }).catch((err) => {
          console.log('error11: '+ err);
          if ((err.response && err.response.status == 504) || err.message == 'Network Error') {
            this.checkAligningBlocks();
          } else {
            this.aligningBlocks = [];
          }
        });
      },
      scrollToBlock(id) {
        this.$root.$emit('for-bookedit:scroll-to-block', id);
      },

      onTtsSelect(key, value) {
        this.currentBookMeta.voices[key] = value;
        if (value) this.$emit('onTtsSelect', 'voices.'+ key, value);
      },

      listReorder(info) {
        if (info && typeof info.newIndex !== 'undefined' && typeof info.oldIndex !== 'undefined' && info.newIndex !== info.oldIndex) {
          this.saveAudiobook([[info.oldIndex, info.newIndex]]);
        }
      },
      markSelected() {
        this._setDone(true);
        this.$refs.allAudioDropdown.toggle();
      },
      unmarkSelected() {
        this._setDone(false);
        this.$refs.allAudioDropdown.toggle();
      },
      mark(id) {
        this._setDone(true, [id]);
      },
      unmark(id) {
        this._setDone(false, [id]);
      },
      _setDone(done, ids = []) {
        if (!ids.length) {
          ids = this.selections;
        }
        if (ids.length) {
          ids.forEach(id => {
            this.audiobook.importFiles.forEach((f, i) => {
              if (f.id === id) {
                this.audiobook.importFiles[i].done = done;
              }
            });
          });
          this.saveAudiobook();
        }
      },

      ...mapActions(['setCurrentBookCounters', 'getTTSVoices'])
    },
    beforeDestroy() {
      this.$root.$off('from-audioeditor:save-positions');
      this.$root.$off('from-audioeditor:align');
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
      enableTtsAlignment: function() {
        let voicesSelected = true;
        if (this.currentBookMeta.voices) {
          for(let voice in this.currentBookMeta.voices) {
            if (!this.currentBookMeta.voices[voice] || this.currentBookMeta.voices[voice].length == 0) {
              voicesSelected = false;
            }
          }
        }
        //console.log('enableTtsAlignment', voicesSelected, this.currentBookMeta.voices);
        return this.hasBlocksForTTS && voicesSelected && this.blocksForAlignment.start._id && this.blocksForAlignment.end._id;
      },
      hasBlocksForAlignment: function() {
        return this.blocksForAlignment.count > 0
      },
      hasBlocksForTTS: function() {
        return this.blocksForAlignment.countTTS > 0
      },
      ...mapGetters(['currentBookCounters', 'ttsVoices', 'currentBookid', 'currentBookMeta'])
    },
    watch: {
      'audiobook': {
        handler(val, oldVal) {
          if (val && oldVal && val._id != oldVal._id) {
            //this.checkAllState = false;
            return;
          }
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
              /*self.draggableList = new List(document.querySelector('.draggable-list'));
              self.draggableList.on('move', function (node, newIndex, prevIndex) {
                self.saveAudiobook([[prevIndex, newIndex]]);
              })*/
              self.selections.forEach(s => {
                $('input[name="' + s + '"]').prop('checked', true);
              });
            })
            if (this.playing && val.importFiles && Array.isArray(val.importFiles) && 
                    oldVal.importFiles && Array.isArray(oldVal.importFiles)) {
              let file = val.importFiles.find(f => f.id == this.playing);
              let fileOld = oldVal.importFiles.find(f => f.id == this.playing);
              if (file && fileOld) {
                let map = file.blockMap;
                let mapOld = fileOld.blockMap;
                if (typeof map !== 'undefined') {
                  if (typeof mapOld === 'undefined' || !_.isEqual(map, mapOld)) {
                    this.play(this.playing);
                  }
                }
              }
            }
          }
        },
        deep: true
      },
      'alignmentProcess': {
        handler(val) {
          if (val) {
            this.$root.$emit('show-modal', {
              title: 'Aligning blocks ' + this.blocksForAlignment.start._id + ' - ' + this.blocksForAlignment.end._id + ' with audio',
              text: '<div class="align-preloader"></div>',
              buttons: [
                {
                  title: 'Cancel',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                    this.cancelAlign();
                  },
                }
              ],
              class: ['align-modal']
            });
          } else {
            this.$root.$emit('hide-modal');
          }
        }
      },
      'onDeleteMessage': {
        handler(val) {
          if (val) {
            this.$root.$emit('show-modal', {
              title: this.deleting ? '<h4 class="modal-title">Delete audio file?</h4>' : '<h4 class="modal-title">Delete ' + this.selectionLength + ' audio files?</h4>',
              text: '',
              buttons: [
                {
                  title: 'Cancel',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                    this.discardDeleteAudio();
                  }
                },
                {
                  title: 'Delete' + (!this.deleting ? '<span >(' + this.selectionLength + ')</span>' : ''),
                  handler: () => {
                    this.$root.$emit('hide-modal');
                    this.deleteAudioProcess();
                  }
                }
              ]
            });
          } else {
            this.$root.$emit('hide-modal');
          }

        }
      },
      'ttsVoices': function (val) {
        this.pre_options = val;
      },
      'aligningBlocks': function() {
        if (this.aligningBlocks.length > 0) {
          this.alignmentProcess = true;
        } else {
          this.alignmentProcess = false;
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
          white-space: nowrap;
          max-width: 80%;
          overflow: hidden;
          .audiofile-player-controls {
            width: 19px;
            display: inline-block;
          }
          .audiofile-name {
            display: inline-block;
            cursor: pointer;
            white-space: nowrap;
            max-width: 65%;
            overflow: hidden;
          }
          .audiofile-duration {
            display: inline-block;
            overflow: hidden;
          }
          &.playing {
            color: maroon;
            i.fa {
              color: maroon;
            }
          }
          &.done {
              color: green;
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
              margin-left: -56px;
              min-width: 97px;
              max-width: 97px;
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
              &.fa-check {
                  color: green;
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
    .all-audio-dropdown {
      margin: 0px 10px;
      ul {
        span {
          display: inline-block;
          width: 100%;
          padding: 2px 12px;
          cursor: pointer;
          &.mark-done {
            color: green;
          }
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
      width: 100%;
      height: 34px;
      display: inline-block;
      margin: 4px 0px;
      background-repeat: no-repeat;
      background-position-x: center;
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
  .table.table-voices {
    margin-top: 10px;
    thead {
      tr {

      }
      th {
        background-color: silver;
        padding-top: 2px;
        padding-bottom: 2px;
        border-bottom: none;
      }
    }
    tbody {
      tr:nth-child(odd) {
        background-color:#eee;
      }
      td {
        vertical-align: middle;
      }
      td:nth-child(2) {
        width: 280px;
      }
    }
  }
</style>
