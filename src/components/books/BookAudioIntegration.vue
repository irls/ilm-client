<template>
  <div>
    <accordion :one-at-atime="true" ref="accordionAudio">
      <panel :is-open="true" :header="'File audio catalogue'" v-bind:key="'file-audio-catalogue'" ref="panelAudiofile" class="panel-audio-catalogue">
        <div class="file-catalogue" id="file-catalogue">
          <div class="file-catalogue-buttons">
            <div class="" v-if="_is('admin') || _is('editor')">
              <input type="checkbox" v-model="checkAllState"/>
            </div>
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
            <div class="align-audio">
              <button class="btn btn-primary btn-small" :disabled="alignCounter.count == 0 || selections.length == 0" v-on:click="align(null, true)" v-if="!hasLocks('align')">Align&nbsp;<span v-if="alignCounter.count > 0">({{blocksForAlignment}})</span></button>
              <button v-else class="btn btn-danger btn-small" v-on:click="cancelAlign(true)">Cancel Alignment</button>
            </div>
          </div>
          <h5 v-if="audiobook.info && (!audiobook.importFiles || audiobook.importFiles.length == 0)"><i>{{audiobook.info}}</i></h5>
          <div class="file-catalogue-files-wrapper">
            <draggable v-model="audiobook.importFiles" class="file-catalogue-files" @end="listReorder">
              <div v-for="(audiofile, index) in audiobook.importFiles" :class="['audiofile', {'-selected': selections.indexOf(audiofile.id) !== -1}]">
                <template v-if="audiofile.status == 'processing'">
                  <div class="audiofile-info">
                    <i>Processing, {{audiofile.name}}</i>
                  </div>
                </template>
                <template v-else>
                  <div :class="['audiofile-info', {'playing': playing == audiofile.id, done: audiofile.done}]">
                    <div class="audiofile-player-controls">
                      <i class="fa fa-play-circle-o" v-on:click="audiofileClick(audiofile.id, true, $event)"></i>
                      <!-- <i class="fa fa-play-circle-o red" v-on:click="play()" v-if="paused === audiofile.id"></i>
                      <i class="fa fa-pause-circle-o" v-on:click="pause()" v-if="playing === audiofile.id && paused !== audiofile.id"></i>
                      <i class="fa fa-stop-circle-o" v-on:click="stop()" v-if="playing === audiofile.id"></i> -->
                    </div>
                    <div class="audiofile-name">
                      <span v-if="renaming !== audiofile.id" 
                            :class="['audiofile-name-edit']" 
                            @click="audiofileClick(audiofile.id, false, $event)"  :title="audiofile.name" v-on:dblclick="renaming = audiofile.id">{{audiofile.name}}</span>
                      <input type="text" v-model="audiofile.name" class="audiofile-name-edit"
                           @focusout="saveAudiobook()"
                           v-else />
                    </div>
                    <div class="audiofile-duration"><span>({{ parseAudioLength(audiofile.duration) }})</span></div>
                  </div>
                  
                </template>
              </div>
            </draggable>
          </div>
        </div>
        <div :class="['audio-import-errors', 'errors-' + (audiobook.importErrors ? audiobook.importErrors.length : 0)]" id="audio-import-errors">
          <div style="overflow-y: scroll; min-height: 80px; height: 100%;">
            <div>Unable to import file(s):<span class="hide-errors" v-on:click="clearErrors()">&times;</span></div>
            <div v-for="ierr in audiobook.importErrors" class="audio-import-error">
              <a :href="ierr.link">{{ierr.file}}: {{ierr.error}}</a>
            </div>
          </div>
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
              @onSelect="onTtsSelect('title', $event)"
            ></select-tts-voice></td>
          </tr>
          <tr>
            <td>Header</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices.header"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              @onSelect="onTtsSelect('header', $event)"
            ></select-tts-voice></td>
          </tr>
          <!--<tr>
            <td>Subheader</td>
            <td><select-tts-voice
              pre_selected=""
              :pre_volume="pre_volume"
              :pre_options="pre_options"
            ></select-tts-voice></td>
          </tr>-->
          <tr>
            <td>Paragraph</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices.paragraph"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              @onSelect="onTtsSelect('paragraph', $event)"
            ></select-tts-voice></td>
          </tr>
          <tr>
            <td>Footnote</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices.footnote"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              @onSelect="onTtsSelect('footnote', $event)"
            ></select-tts-voice></td>
          </tr>
        </tbody>
        </table>
        
        <!--<div class="pull-left" v-if="hasBlocksForAlignment && !enableAlignment">
          <span class="red">Select audio</span>
        </div>-->
        <div class="pull-right align-process-start">
          <button class="btn btn-default" :disabled="!enableTtsAlignment" v-on:click="alignTts()" v-if="!hasLocks('align')">Convert text to speech &amp; Align with text</button>
          <button v-else class="btn btn-danger" v-on:click="cancelAlign()">Cancel Alignment</button>
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
  import Split from 'split.js';
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
      'audiobook': Object
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
        aligningBlocks: [],
        positions_tmp: {}
      }
    },
    mixins: [task_controls, api_config, access],
    mounted() {
      let parentHeight = false;
      let minSize = false;
      let maxSize = false;
      Split(['#file-catalogue', '#audio-import-errors'], {
        direction: 'vertical',
        //minSize: [80, 80],
        sizes: [70, 30],
        elementStyle: (dimension, size, gutterSize) => {
          let resizeWrapper = true;
          if (!parentHeight) {
            parentHeight = parseInt($('#file-catalogue').parent().css('height'));
            resizeWrapper = false;
            if (parentHeight) {
              minSize = parentHeight / 100 * 30;
              $('#audio-import-errors').css('height', minSize + 'px');
              maxSize = parentHeight - minSize;
            }
          }
          //console.log(dimension, size, gutterSize)
          let height = parentHeight / 100 * size - gutterSize;
          //console.log('SET HEIGHT TO', height - gutterSize + 'px', height, parentHeight)
          if (resizeWrapper) {
            $('.file-catalogue-files-wrapper').css('height', parseInt($('#file-catalogue').css('height')) - parseInt($('.file-catalogue-buttons').css('height')) + 'px')
          }
          if (height < minSize && resizeWrapper) {
            height = minSize;
          }
          if (height > maxSize && resizeWrapper) {
            height = maxSize;
          }
          return {'height': height + 'px'};
          return { 'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)' }
        }
      });
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
      this.$root.$on('from-audioeditor:selection-change', (id, start, end) => {
        if (this.playing) {
          //console.log('FOR ', af)
          this.positions_tmp[this.playing] = {start: start, end: end};
        }
      });
      this.$root.$on('book-reimported', () => {
        this.positions_tmp = {};
      });

      this.getTTSVoices(/*this.currentBookMeta.language*/)
      .then(()=>{
        this.pre_options = this.ttsVoices;
        if (this.currentBookMeta.language == 'en') {
          let default_voice = null;
          this.pre_options.forEach(group => {
            if (!default_voice && group.children) {
              default_voice = group.children.find(ch => ch.id == 'Brian');
            }
          });
          //console.log(default_voice);
          if (default_voice && Object.keys(this.currentBookMeta.voices).length > 0) {
            for (let type in this.currentBookMeta.voices) {
              if (!this.currentBookMeta.voices[type]) {
                this.currentBookMeta.voices[type] = default_voice.id
              }
            }
          }
        }
      })
      .catch(err=>err);
      this._setCatalogueSize();
      window.addEventListener('resize', this._setCatalogueSize, true);
      this.$root.$on('cancel-align', this.cancelAlign)
    },
    methods: {
      uploadAudio() {
        this.$emit('uploadAudio')
      },
      renameAudiofile(id) {
        this.renaming = id;
      },
      saveAudiobook(reorder = [], removeFiles = []) {
        let api_url = this.API_URL + 'books/' + this.audiobook.bookid + '/audiobooks/' + this.audiobook._id;
        let formData = new FormData();
        //let save_data = this.audiobook;
        //if (save_data.importFiles) {
          //save_data.importFiles.forEach(af => {
            //if (typeof this.positions_tmp[af.id] !== 'undefined') {
              //af.positions = this.positions_tmp[af.id];
            //}
          //});
        //}
        //formData.append('audiobook', JSON.stringify(save_data));
        formData.append('reorder', JSON.stringify(reorder));
        formData.append('removeFiles', JSON.stringify(removeFiles));
        if (this.renaming) {
          let rename = this.audiobook.importFiles.find(aif => aif.id == this.renaming);
          if (rename) {
            formData.append('rename', JSON.stringify([
              {
                id: rename.id,
                name: rename.name
              }
            ]));
          }
        }
        this.renaming = false;
        let api = this.$store.state.auth.getHttp()
        let self = this;
        return api.post(api_url, formData, {}).then(function(response){
          if (response.status===200) {
            if (response.data && response.data.audio) {
              self.$emit('audiobookUpdated', response.data.audio);
            }
          } else {

          }
          return Promise.resolve();
        }).catch((err) => {
          console.log('error: '+ err)
          return Promise.reject();
        });
      },
      addSelection(id, value) {
        
        if (value === true) {
          if (this.selections.indexOf(id) === -1) {
            this.selections.push(id)
          }
        } else {
          this.selections.splice(this.selections.indexOf(id), 1)
          $('input[name="' + id + '"]').prop('checked', false);
        }
        if (this.selections.length > 1 && this.playing) {
          this.$root.$emit('for-audioeditor:close');
        }
      },
      audiofileClick(id, play, event) {
        setTimeout(() => {// to prevent selection on doubleclick
          let BreakException = {};
          if(!this.renaming && event) {
            if (event.shiftKey) {
              if (this.selections.length > 0) {
                if (this.selections.indexOf(id) === -1) {
                  let select = false;
                  this.addSelection(id, true);
                  let clicked_passed = false;
                  try {
                    this.audiobook.importFiles.forEach(af => {
                      if (!clicked_passed) {
                        clicked_passed = af.id === id;
                      }
                      if (this.selections.indexOf(af.id) !== -1) {
                        if (select === false || clicked_passed) {
                          select = !select;
                          if (select === false) {
                            throw BreakException;
                          }
                        }
                      }
                      if (select) {
                        this.addSelection(af.id, true)
                      }
                    });
                  } catch (e) {
                    if (e !== BreakException) {
                      throw(e);
                    }
                  }
                } else {
                  let split = {before: [], after: []};
                  let container = split.before;
                  this.audiobook.importFiles.forEach(af => {
                    if (this.selections.indexOf(af.id) !== -1) {
                      if (af.id === id) {
                        container = split.after;
                      } else {
                        container.push(af.id);
                      }
                    }
                  });
                  this.selections = [];
                  this.addSelection(id, true);
                  if (split.before.length < split.after.length || split.before.length === split.after.length) {
                    split.before.forEach(_id => this.addSelection(_id, true));
                  } else {
                    split.after.forEach(_id => this.addSelection(_id, true));
                  }
                }
              } else {
                this.addSelection(id, true);
                this.play(id, play);
              }
            } else if(event.ctrlKey) {
              if (this.selections.indexOf(id) === -1) {
                this.addSelection(id, true);
              } else {
                this.addSelection(id, false);
              }
            } else {
              this.selections = [id];
              this.play(id, play);
            }
          }
        }, 500);
        
      },
      checkAll(event, value) {
        if (event && event.target) {
          value = event.target.checked;
        }
        //$('.file-catalogue-files input[type="checkbox"]').prop('checked', value);
        if (this.audiobook.importFiles) {
          this.audiobook.importFiles.forEach(_f => {
            this.addSelection(_f.id, value)
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
          //let files = [];
          //this.audiobook.importFiles.forEach((_f, i) => {
            //if (this.selections.indexOf(_f.id) === -1) {
              //files.push(_f);
            //} else {
              //this.addSelection(_f.id, false);
            //}
          //});
          //this.audiobook.importFiles = files;
          let toDelete = this.selections;
          this.selections = [];
          this.checkAllState = false;
          this.saveAudiobook([], toDelete);
        } else {
          let files = [];
          if (this.selections.indexOf(this.deleting) !== -1) {
            this.addSelection(this.deleting, false);
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
      align(id = null, warn = 2) {
        if (warn >= 2 && this.currentBookCounters.approved_audio_in_range > 0) {
          this.$root.$emit('show-modal', {
            title: 'Are you you sure you want to realign ' + this.currentBookCounters.approved_audio_in_range + ' approved block(s)?',
            //text: 'Are you you sure you want to realign ' + this.currentBookCounters.approved_audio_in_range + ' approved block(s)?',
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //this.cancelAlign();
                },
              },
              {
                title: 'Realign',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  let i = setInterval(() => {
                    if ($('.align-modal').length == 0) {
                      clearInterval(i);
                      this.align(id, 1)
                    }
                  }, 50);
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
          return;
        }
        if (warn >= 1 && this.currentBookCounters.changed_in_range_audio > 0) {
          this.$root.$emit('show-modal', {
            title: 'Unsaved changes',
            text: 'You have unsaved changes in selected block range.<br/>Save and align with audio?',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //this.cancelAlign();
                },
              },
              {
                title: 'Save&Align',
                handler: () => {
                  this.saveChangedBlocks({voicework: 'audio_file'})
                    .then(ids => {
                      if (ids && Array.isArray(ids)) {
                        ids.forEach(id => {
                          this.$root.$emit('saved-block:' + id);
                        });
                      }
                      //console.log('saved ids', ids);
                      this.$root.$emit('hide-modal');
                      let i = setInterval(() => {
                        if ($('.align-modal').length == 0) {
                          clearInterval(i);
                          this.align(id, false)
                        }
                      }, 50);
                    });
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
          return;
        }
        let api_url = this.API_URL + 'books/' + this.audiobook.bookid + '/selection_alignment';
        let formData = new FormData();
        let api = this.$store.state.auth.getHttp()
        let self = this;
        //this.alignmentProcess = true;
        let realign = true;
        let update = this.saveAudiobook()
          .then((updated) => Promise.resolve(updated))
          .catch((err) => Promise.resolve({error: true, err: err}));
        this._setAligningBlocks('audio_file');
        Promise.all([update])
          .then((updated) => {
            //console.log(updated)
            //console.log('START ALIGN');
            api.post(api_url, {
              start: this.blockSelection.start._id,
              end: this.blockSelection.end._id,
              audiofiles: id ? [id] : this.selections,
              realign: realign,
              positions: this.positions_tmp
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
        if (this.alignCounter.blocks) {
          this.alignCounter.blocks.forEach(_b => {
            if (voicework === 'audio_file') {
              if (_b.voicework === 'audio_file' || (realign && _b.voicework === 'narration')) {
                this.aligningBlocks.push(_b);
                //this.clearBlockLock({block: _b, watch: ['realigned']});
              }
            } else if (voicework === 'tts') {
              if (_b.voicework === 'tts') {
                this.aligningBlocks.push(_b);
              } else {
                if (_b.footnotes && _b.footnotes.length > 0) {
                  let f = _b.footnotes.filter(_f => _f.voicework === 'tts');
                  if (f && f.length > 0) {
                    this.aligningBlocks.push(_b);
                  }
                }
              }
            }
          });
        }
        this.aligningBlocks.forEach(b => {
          this.addBlockLock({block: b, watch: ['realigned'], type: 'align'});
          this.$root.$emit('block-state-refresh-' + b._id);
        });
        this.$root.$on('blockChange', (doc) => {
          if (doc && doc._id) {
            let d = this.aligningBlocks.find(b => b._id == doc._id);
            if (d) {
              let i = this.aligningBlocks.indexOf(d);
              if (i !== -1) {
                this.aligningBlocks.splice(i, 1);
                this.clearBlockLock({block: d, force: true});
              }
            }
          }
          if (this.aligningBlocks.length === 0) {
            this.$root.$off('blockChange');
          }
        });
      },
      cancelAlign(force = false) {
        //if (this.alignmentProcess || force) {
          let api_url = this.API_URL + 'books/' + this.audiobook.bookid + '/selection_alignment';

          let api = this.$store.state.auth.getHttp()
          let self = this;

          api.delete(api_url, {}, {}).then(function(response){
            if (response.status===200) {

            } else {

            }
            self.aligningBlocks = [];
            self.clearLocks({type: 'align'});
          }).catch((err) => {
            console.log('error: '+ err)
            self.aligningBlocks = [];
            self.clearLocks({type: 'align'});
          });
        //}
      },
      alignTts(warn = 2) {
        if (warn >= 2 && this.currentBookCounters.approved_tts_in_range > 0) {
          this.$root.$emit('show-modal', {
            title: 'Are you you sure you want to realign ' + this.currentBookCounters.approved_tts_in_range + ' approved block(s)?',
            //text: 'Are you you sure you want to realign ' + this.currentBookCounters.approved_audio_in_range + ' approved block(s)?',
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //this.cancelAlign();
                },
              },
              {
                title: 'Realign',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  let i = setInterval(() => {
                    if ($('.align-modal').length == 0) {
                      clearInterval(i);
                      this.alignTts(1)
                    }
                  }, 50);
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
          return;
        }
        if (warn >= 1 && this.currentBookCounters.changed_in_range_tts > 0) {
          this.$root.$emit('show-modal', {
            title: 'Unsaved changes',
            text: 'You have unsaved changes in selected block range.<br/>Save and align with audio?',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //this.cancelAlign();
                },
              },
              {
                title: 'Save&Align',
                handler: () => {
                  this.saveChangedBlocks({voicework: 'tts'})
                    .then(ids => {
                      if (ids && Array.isArray(ids)) {
                        ids.forEach(id => {
                          this.$root.$emit('saved-block:' + id);
                        });
                      }
                      //console.log('saved ids', ids);
                      this.$root.$emit('hide-modal');
                      let i = setInterval(() => {
                        if ($('.align-modal').length == 0) {
                          clearInterval(i);
                          this.alignTts(false)
                        }
                      }, 50);
                    });
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
          return;
        }
        let api_url = this.API_URL + 'books/' + this.currentBookid + '/selection_alignment';
        let formData = new FormData();
        let api = this.$store.state.auth.getHttp()
        //this.alignmentProcess = true;
        this._setAligningBlocks('tts');
        api.post(api_url, {
          start: this.blockSelection.start._id,
          end: this.blockSelection.end._id,
          audiofiles: false,
          realign: true,
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
      _setCatalogueSize() {
        let file_catalogue_height = $(document).height() - 500;
        $('.file-catalogue-files').css('max-height', file_catalogue_height + 'px');
      },
      
      clearErrors() {
        let url = this.API_URL + 'books/' + this.currentBookid + '/audiobooks/' + this.audiobook._id + '/clear_errors';
        this.$store.state.auth.getHttp().post(url)
          .then(resp => {
            this.$emit('audiobookUpdated', resp.data);
          })
          .catch(err => {
            console.log(err)
          })
      },

      ...mapActions(['setCurrentBookCounters', 'getTTSVoices', 'addBlockLock', 'clearBlockLock', 'saveChangedBlocks', 'clearLocks'])
    },
    beforeDestroy() {
      this.$root.$off('from-audioeditor:save-positions');
      this.$root.$off('from-audioeditor:align');
      this.$root.$off('cancel-align', this.cancelAlign);
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
        return this.hasBlocksForTTS && voicesSelected && this.blockSelection.start._id && this.blockSelection.end._id;
      },
      hasBlocksForAlignment: function() {
        return this.alignCounter.count > 0
      },
      hasBlocksForTTS: function() {
        return this.alignCounter.countTTS > 0
      },
      blocksForAlignment: function() {
        let blocks = this.alignCounter.count - this.alignCounter.countTTS;
        return blocks >=0 ? blocks : 0;
      },
      ...mapGetters(['currentBookCounters', 'ttsVoices', 'currentBookid', 'currentBookMeta', 'blockSelection', 'alignCounter', 'hasLocks', 'lockedBlocks'])
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
                let positions = file.positions;
                let positionsOld = fileOld.positions;
                if ((typeof map !== 'undefined' && (typeof mapOld === 'undefined' || !_.isEqual(map, mapOld))) ||
                        (typeof map === 'undefined' && typeof mapOld !== 'undefined') || 
                        !_.isEqual(positions, positionsOld)) {
                  this.play(this.playing);
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
              title: 'Aligning blocks ' + this.blockSelection.start._id + ' - ' + this.blockSelection.end._id + ' with audio',
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
        /*if (this.aligningBlocks.length > 0) {
          this.alignmentProcess = true;
        } else {
          this.alignmentProcess = false;
        }*/
      },
      'blockSelection': {
        handler(val) {
          var openAudio = this.$refs.panelAudiofile ? this.$refs.panelAudiofile.open : false;
          var openTTS = this.$refs.panelTTS ? this.$refs.panelTTS.open : false;
          if (!openAudio && openTTS) {
            this.$root.$emit('from-bookedit:set-voice-test', this.blockSelection.start, this.blockSelection.end)
          }
        },
        deep: true
      },
      'audiobook.importErrors': {
        handler(val) {
          //console.log('IMPORT ERRORS CHANGED')
          //console.log($('#file-catalogue'), $('#audio-import-errors'))
          //let i = setInterval(() => {
            //if ($('#audio-import-errors').length > 0) {
              //clearInterval(i)
              //Split(['#file-catalogue', '#audio-import-errors'], {
              //direction: 'vertical'
            //});
            //}
          //}, 500)
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
          /*width: 100px;*/
        }
      }
    }
    .file-catalogue-files-wrapper {
        height: 100%;
        /*max-height: 220px;*/
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
      min-height: 300px;
      max-height: 300px;
      .audiofile {
        list-style-type: none;
        padding: 2px;
        &.-selected {
            background-color: #d0e9ff;
        }
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
          /*&.playing {
            color: maroon;
            i.fa {
              color: maroon;
            }
          }*/
          &.done {
              color: gray;
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
  .panel-audio-catalogue {
      .panel-body {
        padding-left: 9px;
        padding-right: 9px;
        .all-audio-dropdown {
            margin: 0px;
        }
      }
  }
  .audio-import-errors {
    border: solid 1px red;
    border-radius: 8px;
    padding: 8px 5px 5px 5px;
    background-color: #ffd3d3;
    margin-top: 10px;
    height: 95px;
    color: red;
    /*overflow-y: scroll;*/
    &.errors-0 {
      display: none;
    }
    .audio-import-error {
      padding: 2px;
      /*width: 80%;*/
      word-break: break-all;
      a {
        font-weight: bolder;
      }
      &:nth-child(even) {
        background-color: #fcebeb;
      }
    }
    .hide-errors {
      display: inline-block;
      float: right;
      cursor: pointer;
      padding: 0px 3px;
      color: black;
    }
  }
</style>
