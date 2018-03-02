<template>
  <div>
    <div class="waveform-playlist">
      <div class="close-player-container pull-right">
        <span class="close-player" v-on:click="close()">&times;</span>
      </div>
      <div class="waveform-wrapper">
        <div id="playlist" class="wf-playlist"></div>
      </div>
      <div class="player-controls">
        
        <div :class="['play-controls', '-' + mode]">
          <i class="fa fa-play-circle-o" v-if="!isPlaying" v-on:click="play()"></i>
          <i class="fa fa-pause-circle-o" v-if="isPlaying" v-on:click="pause()"></i>
          <i class="fa fa-stop-circle" v-on:click="stop()"></i>
          <i class="fa fa-step-backward" v-on:click="goToStart()"></i>
          <i class="fa fa-step-forward" v-on:click="goToEnd()"></i>
        </div>
        <div class="zoom-controls">
          <i :class="['fa', 'fa-search-plus', {'disabled': !allowZoomIn}]" v-on:click="zoomIn()"></i>
          <i :class="['fa', 'fa-search-minus', {'disabled': !allowZoomOut}]" v-on:click="zoomOut()"></i>
        </div>
        <div class="selection-controls">
          <div v-if="selection.start >= 0">
            <div>Selection Start</div>
            <div>
              <input type="text" v-model="selectionStartH" disabled />:<input type="text" v-model="selectionStartM" disabled />:<input type="number" v-model="selectionStartS" class="sec" step="0.1" ref="selectionStartNum" />
            </div>
          </div>
          <div v-if="selection.end >= 0">
            <div>Selection End</div>
            <div>
              <input type="text" v-model="selectionEndH" disabled />:<input type="text" v-model="selectionEndM" disabled />:<input type="number" v-model="selectionEndS" class="sec" step="0.1" ref="selectionEndNum" :disabled="isSinglePointSelection"/>
            </div>
          </div>
          <template v-if="mode == 'block'">
            <div v-if="hasSelection && !isSinglePointSelection">
              <button class="btn btn-primary" v-on:click="cut()">Cut</button>
            </div>
            <div v-if="hasSelection && isSinglePointSelection">
              <input type="number" step="0.1" v-model="silenceLength" />
              <button class="btn btn-primary" v-on:click="addSilence()">Add Silence</button>
            </div>
          </template>
        </div>
        <div class="audio-controls" v-if="isModifiedComputed && mode == 'block'">
          <button class="btn btn-default" v-if="history.length" v-on:click="undo()">Undo</button>
          <button class="btn btn-default" v-on:click="onDiscardMessage = true">Discard</button>
          <button class="btn btn-primary" v-on:click="save()">Save</button>
          <button class="btn btn-primary" v-on:click="saveAndRealign()">Save & Re-align</button>
        </div>
        <div class="audio-controls" v-if="isModifiedComputed && mode == 'file'">
          <button class="btn btn-primary" v-on:click="save()">Save</button>
        </div>
      </div>
    </div>
    <modal v-model="onDiscardMessage" effect="fade" title="" ok-text="Discard" cancel-text="Cancel" @ok="discard()">
      <p>Discard unsaved audio changes?</p>
    </modal>
    <modal v-model="onExitMessage" effect="fade" title="" ok-text="Confirm" cancel-text="Cancel" @ok="discardAndExit()" @closed="checkExitState()">
      <p v-if="mode == 'block'">Discard unsaved audio changes?</p>
      <p v-if="mode == 'file'">Discard unsaved markers position?</p>
    </modal>
    <modal v-model="onWordRepositionMessage" effect="fade" title="" ok-text="OK" cancel-text="" @ok="onWordRepositionMessage = false" :class="['on-word-reposition']">
      <p>Words repositioning will be lost on unmastered audio</p>
    </modal>
  </div>
</template>
<script>
  import Vue from 'vue'
  import api_config from '../mixins/api_config.js'
  import task_controls from '../mixins/task_controls.js'
  import { modal } from 'vue-strap'
  import {mapActions, mapGetters} from 'vuex'
  //import Peaks from 'peaks.js';
  var WaveformPlaylist = require('waveform-playlist');
  var WaveformData = require('waveform-data')
  var Draggable = require ('draggable')
  export default {
      name: 'AudioEditor',
      components: {
        'modal': modal
      },
      mixins: [api_config, task_controls],
      data() {
        return {
          audiosourceEditor: false,
          peaksPlayer: false,
          content: "",//'<w data-map="0,335">Either </w><w data-map="335,250">the </w><w data-map="585,60">well </w><w data-map="645,200">was </w><w data-map="845,255">very </w><w data-map="1100,360">deep, </w><w data-map="1460,165">or </w><w data-map="1625,165">she </w><w data-map="1790,310">fell </w><w data-map="2100,280">very </w><w data-map="2380,680">slowly, </w><w data-map="3060,20">for </w><w data-map="3080,270">she </w><w data-map="3350,500">had </w><w data-map="3850,395">plenty  </w><w data-map="4245,25">of </w><w data-map="4270,190">time </w><w data-map="4460,355">as </w><w data-map="4815,115">she </w><w data-map="4930,265">went </w><w data-map="5195,220">down </w><w data-map="5415,115">to </w><w data-map="5530,150">look </w><w data-map="5680,750">about </w><w data-map="6430,450">her. </w><w data-map="6880,435">First, </w><w data-map="7315,100">she </w><w data-map="7415,265">tried </w><w data-map="7680,10">to </w><w>look </w><w data-map="7690,10">down </w><w data-map="7700,50">and </w><w data-map="7750,230">make </w><w data-map="7980,190">out </w><w data-map="8170,160">what </w><w data-map="8330,110">she </w><w data-map="8440,225">was  </w><w data-map="8665,315">coming </w><w data-map="8980,260">to, </w><w data-map="9240,555">but </w><w data-map="9795,80">it </w><w data-map="9875,175">was </w><w data-map="10050,150">too </w><w data-map="10200,115">dark </w><w data-map="10315,145">to </w><w data-map="10460,380">see </w><w data-map="10840,600">anything; </w><w data-map="11440,585">then </w><w data-map="12025,125">she </w><w data-map="12150,550">looked </w><w data-map="12700,250">at </w><w data-map="12950,165">the  </w><w data-map="13115,185">sides </w><w data-map="13300,170">of </w><w data-map="13470,130">the </w><w>well, </w><w data-map="13600,70">and </w><w data-map="13670,315">noticed </w><w data-map="13985,95">that </w><w>they </w><w data-map="14080,120">were </w><w data-map="14200,475">filled </w><w data-map="14675,185">with </w><w data-map="14860,245">cupboards </w><w data-map="15105,370">and  </w><w data-map="15475,1045">book-shelves; </w><w data-map="16520,305">here </w><w data-map="16825,20">and </w><w data-map="16845,160">there </w><w data-map="17005,160">she </w><w data-map="17165,180">saw </w><w data-map="17345,300">maps </w><w data-map="17645,330">and </w><w data-map="17975,400">pictures </w><w data-map="18375,180">hung </w><w data-map="18555,305">upon </w><w data-map="18860,820">pegs. </w><w data-map="19680,325">She  </w><w data-map="20005,240">took </w><w data-map="20245,215">down </w><w data-map="20460,80">a </w><w data-map="20540,295">jar </w><w data-map="20835,195">from </w><w data-map="21030,50">one </w><w data-map="21080,75">of </w><w data-map="21155,5">the </w><w data-map="21160,380">shelves </w><w data-map="21540,225">as </w><w data-map="21765,190">she </w><w data-map="21955,1005">passed; </w><w>it </w><w data-map="22960,265">was </w><w data-map="23225,395">labelled  </w><w data-map="23620,530">‘ORANGE </w><w data-map="24150,1010">MARMALADE’, </w><w data-map="25160,160">but </w><w data-map="25320,245">to </w><w data-map="25565,60">her </w><w data-map="25625,155">great </w><w data-map="25780,1030">disappointment </w><w data-map="26810,105">it </w><w data-map="26915,240">was </w><w data-map="27155,765">empty: </w><w data-map="27920,150">she </w><w data-map="28070,145">did  </w><w data-map="28215,170">not </w><w data-map="28385,110">like </w><w data-map="28495,115">to </w><w data-map="28610,485">drop </w><w data-map="29095,120">the </w><w data-map="29215,405">jar, </w><w data-map="29620,405">so </w><w data-map="30025,135">she </w><w data-map="30160,410">managed </w><w data-map="30570,140">to </w><w data-map="30710,165">put  </w><w data-map="30875,115">it </w><w data-map="30990,235">into </w><w data-map="31225,10">one </w><w data-map="31235,10">of </w><w data-map="31245,225">the </w><w data-map="31470,380">cupboards </w><w data-map="31850,205">as </w><w data-map="32055,165">she </w><w data-map="32220,195">fell </w><w data-map="32415,405">past </w><w data-map="32820,1060">it.</w>',
          audiofile: "",//'http://localhost:3000/audiofiles/aaiw1_en/aaiw1_en_31/aaiw1_en_31.flac',
          blockId: null,
          plEventEmitter: false,
          words: [],
          currentWord: null,
          selection: {},
          zoomLevel: 100,
          zoomLevels: [50, 100, 200, 500, 2000, 5000],
          isPlaying: false,
          isPaused: false,
          isSingleWordPlaying: false,
          silenceLength: 0.1,
          audioContext: null,
          contentContainer: null,
          isModified: false,
          isAudioModified: false,
          history: [],
          isHistoryFull: true,
          onDiscardMessage: false,
          onExitMessage: false,
          discardOnExit: false,
          mode: 'block',
          origFilePositions: {},
          cursorPosition: false,
          dragLeft: null,
          dragRight: null,
          onWordRepositionMessage: false,
          playlistScrollPosition: 0
        }
      },
      mounted() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext);
        let self = this;
        this.$root.$on('for-audioeditor:load-and-play', function(audio, text, blockId, autostart, mode) {
          self.load(audio, text, blockId, autostart, mode);
        });
        this.$root.$on('for-audioeditor:load', function(audio, text) {
          self.setAudio(audio, text);
        });
        this.$root.$on('for-audioeditor:reload-text', function(text) {
          self._setText(text);
        });
      },
      beforeDestroy() {
        if (this.audioContext) {
          this.audioContext.close();
          //this.audioContext = null;
          this.audiosourceEditor = null;
        }
      },
      methods: {
        load(audio, text, blockId, autostart = false, bookAudiofile = {}) {
          $('.playlist-tracks').off('scroll');
          if (this.audioContext && this.audioContext.state === 'closed') {
            return false;//component was destroyed;
          }
          let mode = bookAudiofile.id ? 'file' : 'block';
          let changeZoomLevel = mode != this.mode;
          if ((this.blockId && this.blockId != blockId) || mode == 'file' || mode != this.mode) {
            this.silenceLength = 0.1;
            this.isModified = false;
            this.playlistScrollPosition = 0;
            //this.isAudioModified = false;
            //this.contentHistory = [];
            //this.audioHistory = [];
            //this.selection = {};
            this.close();
          }
          if (bookAudiofile) {
            if (bookAudiofile.positions) {
              if (bookAudiofile.positions.start) {
                //bookAudiofile.positions.start = parseInt(bookAudiofile.positions.start);
              }
              if (bookAudiofile.positions.end) {
                //bookAudiofile.positions.end = parseInt(bookAudiofile.positions.end);
              }
            }
          }
          
          
          this.currentWord = null;
          this.mode = mode;
          
          let self = this;
          
          this.audiofile = audio;
          this.blockId = blockId;
          
          if (!this.audiosourceEditor) {
            if (!this.audioContext) {
              this.audioContext = new (window.AudioContext || window.webkitAudioContext);
            }
            if (mode == 'file') {
               this.zoomLevel = this.zoomLevels[this.zoomLevels.length - 1];
            }
            this.audiosourceEditor= WaveformPlaylist.init({
              ac: this.audioContext,
              samplesPerPixel: this.zoomLevel,
              waveHeight: 80,
              container: document.getElementById('playlist'),
              state: 'select',
              colors: {
                waveOutlineColor: '#E0EFF1',
                timeColor: 'grey',
                fadeColor: 'black'
              },
              zoomLevels: this.zoomLevels,
              timescale: true,
              linkEndpoints: true
            });
          } else if (changeZoomLevel) {
            if (this.mode == 'file') {
              let zoom = this.zoomOut();// if previously loaded block audio - set zoom level to max zoom out
              while(zoom) {
                zoom = this.zoomOut();
              }
            } else {
              let zoom = this.zoomIn();// if previously loaded file audio - set zoom level to max zoom in
              while(zoom) {
                zoom = this.zoomIn();
              }
            }
          }
          /*try {
            if (this.audiosourceEditor.getEventEmitter().__ee__ && this.audiosourceEditor.getEventEmitter().__ee__['dragged']) {
              this.audiosourceEditor.getEventEmitter().off('dragged', this.audiosourceEditor.getEventEmitter().__ee__['dragged']);
            }
          } catch(e) {}*/
          this._setText(text);
          this.audiosourceEditor.load([
            {
              src: this.audiofile,
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
          ])
          .then(() => {
            if (this.audiosourceEditor.tracks.length > 1) {
              this.audiosourceEditor.getEventEmitter().emit('clear');
              this.load(audio, text, blockId, autostart, bookAudiofile);
              return;
            }
            $('.playlist-tracks').scrollLeft(this.playlistScrollPosition);
            $('.playlist-tracks').on('scroll', () => {
              this.playlistScrollPosition = $('.playlist-tracks').scrollLeft();
            });
            this._setSelectionOnWaveform();
            this.plEventEmitter = this.audiosourceEditor.getEventEmitter();
            if (!text) {
              //this.plEventEmitter.emit('automaticscroll', true);
            }
            this.plEventEmitter.on('timeupdate', function(position) {
              if (self.mode == 'block') {
                if ((!self.isSingleWordPlaying && !self.isPlaying) || self.currentWord && self.currentWord.start <= position && self.currentWord.end > position) {
                  return;
                }
                let word = self.words.find(_w => {
                  return _w.start <= position && _w.end >position;
                })
                if (word) {
                  self.currentWord = word;
                  self._setWordSelection(word.alignedIndex);
                  if (!self.isAnnotationVisible(word.alignedIndex)) {
                    self.scrollPlayerToAnnotation(word.alignedIndex);
                  }
                  if (self.isSingleWordPlaying) {
                    self.isSingleWordPlaying = false;
                  }
                }
              } else if (self.mode == 'file') {
                if (self.isPlaying) {
                  let click_cursor_position = $('.cursor-position').position().left;
                  let cursor_position = $('.cursor').position().left;
                  let waveform_position = $('.playlist-tracks')[0].scrollLeft;
                  let waveform_width = $('.playlist-tracks')[0].offsetWidth;
                  if (cursor_position > 0 && (
                          cursor_position < waveform_position || 
                          cursor_position > waveform_position + waveform_width)) {
                      let scrollPosition = cursor_position > waveform_position + waveform_width ? waveform_position + waveform_width / 2 : cursor_position;
                      $('.playlist-tracks').scrollLeft(scrollPosition);
                  }
                }
              }
            });
            this.plEventEmitter.on('finished', function() {
              self._clearWordSelection();
              self.isPlaying = false;
              self.isPaused = false;
            });
            this.plEventEmitter.on('select', function(start, end) {
              let is_single_cursor = end - start == 0;
              
              if (self.mode == 'file') {
                if (is_single_cursor || 
                        ((typeof self.selection.start != 'undefined' && Math.ceil(start) != Math.ceil(self.selection.start)) && 
                        (typeof self.selection.end != 'undefined' && Math.ceil(end) != Math.ceil(self.selection.end)))) {
                  self.plEventEmitter.emit('select', self.selection.start, self.selection.end);
                  if (is_single_cursor) {
                    self.cursorPosition = start;
                  }
                  return;
                }
              }
              let is_second_click_ltr = self.selection && (self.selection.end == end && self.selection.end - self.selection.start > 0);
              let is_second_click_rtl = self.selection && (self.selection.start == start && self.selection.end - self.selection.start > 0);
              if (is_single_cursor && self.selection && ((
                      self.selection.end - self.selection.start == 0 && 
                      end != self.selection.end && 
                      start != self.selection.start) || 
                      is_second_click_ltr || is_second_click_rtl)) {
                let from = 0;
                let to = 0;
                if (is_second_click_ltr){ 
                  from = self.selection.start;
                  to = end;
                } else if (is_second_click_rtl) {
                  from = self.selection.start;
                  to = self.selection.end;
                } else {
                  from = self.selection.start < end ? self.selection.start : end;
                  to = self.selection.start > end ? self.selection.start : end;
                }
                self.plEventEmitter.emit('select', from, to);
              } else if (start < 0) {
                self.plEventEmitter.emit('select', 0, end);
              } else if(end > self.audiosourceEditor.activeTrack.duration) {
                self.plEventEmitter.emit('select', start, self.audiosourceEditor.activeTrack.duration);
              } else {
                self.selection = {start: start, end: end}
              }
            });
            $('.waveform .selection').after('<div id="resize-selection-right" class="resize-selection"></div>').after('<div id="resize-selection-left" class="resize-selection"></div>').after('<div id="cursor-position" class="cursor-position"></div>');
            self.dragRight = new Draggable (document.getElementById('resize-selection-right'), {
            
              limit: {x:[0, $('.channel-0').length ? $('.channel-0').width() : 10000], y: [0, 0]},
              onDrag: function(element, x, y, event) {
                let startX = 0;
                if (self.selection && typeof self.selection.start !== 'undefined') {
                  startX = self.selection.start / (self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate);
                } else {
                  startX = $('[id="resize-selection-left"]').position().left;
                }
                $('.selection.segment').css('width', x - $('.selection.segment')[0].offsetLeft)
                self.audiosourceEditor.activeTrack.stateObj.startX = startX;
                if (typeof self.audiosourceEditor.activeTrack.stateObj.emitSelection !== 'undefined') {
                  self.audiosourceEditor.activeTrack.stateObj.emitSelection(x);
                } else {
                  let startSec = x * self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate;
                  self.plEventEmitter.emit('select', self.selection.start, startSec);
                }
              }
            })
            self.dragLeft = new Draggable (document.getElementById('resize-selection-left'), {
              limit: {x: [0, $('.channel-0').length ? $('.channel-0').width() : 10000], y: [0, 0]},
              onDrag: function(element, x, y, event) {
                $('.selection.segment').css('width', $('[id="resize-selection-right"]').position().left - $('[id="resize-selection-left"]').position().left)
                $('.selection.segment').css('left', x - 5)
                let startX = 0;
                if (self.selection && typeof self.selection.end !== 'undefined') {
                  startX = self.selection.end / (self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate);
                } else {
                  startX = $('[id="resize-selection-right"]').position().left;
                }
                self.audiosourceEditor.activeTrack.stateObj.startX = startX;
                if (typeof self.audiosourceEditor.activeTrack.stateObj.emitSelection !== 'undefined') {
                  self.audiosourceEditor.activeTrack.stateObj.emitSelection(x);
                } else {
                  let startSec = x * self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate;
                  self.plEventEmitter.emit('select', startSec, self.selection.end);
                }
              }
            })
            this.onDiscardMessage = false;
            if (this.mode == 'file') {
              if (bookAudiofile && bookAudiofile.positions) {
                this.origFilePositions = bookAudiofile.positions;
                this.plEventEmitter.emit('select', bookAudiofile.positions.start, bookAudiofile.positions.end);
              } else {
                this.plEventEmitter.emit('select', 0, parseInt(this.audiosourceEditor.duration));
                this.origFilePositions = {start: 0, end: parseInt(this.audiosourceEditor.duration)}
              }
              this._showSelectionBorders();
            }
            if (this.discardOnExit) {
              this.discardOnExit = false;
              this._setDefaults();
              this.close();
            } else if (autostart) {
              this.play();
            }
          });
          $('#' + this.blockId).on('click', '#content-' + this.blockId + ' w', function() {
            let index = $('#content-' + self.blockId).find('w[data-map]').index($(this));
            let show_selection = true;
            if (typeof index =='undefined' || index === false || index < 0) {
              let index_no_data = $('#content-' + self.blockId).find('w:not([data-map])').index($(this));
              let total_index = $('#content-' + self.blockId).find('w').index($(this));
              index = total_index - index_no_data;
              show_selection = false;
            }
            if (!self.isAnnotationVisible(index)) {
              self.scrollPlayerToAnnotation(index, 'middle');
            }
            if (show_selection) {
              self._setWordSelection(index, true);
            } else {
              self._clearWordSelection();
            }
          });
          $('.wf-playlist').on('click', '.annotations-boxes .annotation-box', function(e) {
            let index = $('.annotations-boxes .annotation-box').index($(this));
            self._setWordSelection(index, true);
            ;
          });
          $('.wf-playlist').on('dragend', '.annotations-boxes .annotation-box .resize-handle', function(e) {
            if (!self._isAnnotationsEditable()) {
              self.onWordRepositionMessage = true;
            }
            let map = [];
            self.audiosourceEditor.annotationList.annotations.forEach((al, i) => {
              map.push([Math.round(al.start * 1000), Math.round((al.end - al.start) * 1000)]);
              let w = self.words.find(_w => {
                return _w.alignedIndex == i;
              });
              if (w) {
                w.start = al.start;
                w.end = al.end;
              }
            });
            self.$root.$emit('from-audioeditor:word-realign', map, self.blockId);
            self.isModified = true;
          });
          $('body').on('mouseup', '.playlist-overlay.state-select', function() {
            self._showSelectionBorders();
          });
          $('.player-controls').keydown('input[type="number"]', function(e) {
            e.preventDefault();
          });
          if (self.mode == 'file') {
            $('body').on('click', '.block-audio', function(e) {
              self.cursorPosition = (e.offsetX) * self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate;
              $('.cursor').css('left', e.offsetX);
            });
          }
        },
        setAudio(audio, text, saveToHistory) {
          if (this.plEventEmitter) {
            this.plEventEmitter.emit('clear');
          }
          if (typeof saveToHistory === 'undefined') {
            saveToHistory = true;
          }
          if (saveToHistory && this.content && this.audiofile) {
            this._addHistory(this.content, this.audiofile);
          }
          this.load(audio, text, this.blockId);
        },
        play(cursorPosition) {
          if (typeof cursorPosition === 'undefined' && this.cursorPosition !== false) {
            cursorPosition = this.cursorPosition;
          }
          this.cursorPosition = false;
          if (cursorPosition) {
            this.audiosourceEditor.play(cursorPosition);
          } else {
            this.audiosourceEditor.play();
          }
          this.isPlaying = true;
          this.$root.$emit('from-audioeditor:play');
        },
        stop() {
          this.cursorPosition = false;
          this.audiosourceEditor.stop();
          this.isPlaying = false;
          this._clearWordSelection();
          $('.playlist-tracks').scrollLeft(0);
          this.$root.$emit('from-audioeditor:stop');
        },
        pause() {
          this.audiosourceEditor.pause();
          this.isPlaying = false;
          this.isPaused = true;
          this.cursorPosition = this.audiosourceEditor.playbackSeconds;
          this.$root.$emit('from-audioeditor:pause');
        },
        zoomIn() {
          if (this.allowZoomIn) {
            this._setDraggableOptions();
            this.plEventEmitter.emit('zoomin');
            let index = this.zoomLevels.indexOf(this.zoomLevel)
            if (this.zoomLevels[--index]) {
              this.zoomLevel = this.zoomLevels[index]
            }
            this._showSelectionBorders();
            this._scrollToCursor();
            return true;
          }
          return false;
        },
        zoomOut() {
          if (this.allowZoomOut) {
            this._setDraggableOptions();
            this.plEventEmitter.emit('zoomout');
            let index = this.zoomLevels.indexOf(this.zoomLevel)
            if (this.zoomLevels[++index]) {
              this.zoomLevel = this.zoomLevels[index]
            }
            this._showSelectionBorders();
            this._scrollToCursor();
            return true;
          }
          return false;
        },
        _setDraggableOptions() {
          if ($('.channel-0').length > 0 && this.dragLeft && this.dragRight) {
            let width = $('.channel-0').width();
            let self = this;
            let t = setInterval(function(){
              if ($('.channel-0').width() != width) {
                self.dragRight.setOption('limit', {x: [0, $('.channel-0').width()], y: [0, 0]});
                clearInterval(t);
              }
            }, 100);
          }
        },
        goToStart() {
          if (this.mode == 'block') {
            this.clearSelection();
            this.plEventEmitter.emit('rewind');
          } else if (this.mode == 'file') {
            $('.playlist-tracks').animate({scrollLeft: 0},500);
          }
          this.isPlaying = false;
          this.isPaused = false;
        },
        goToEnd() {
          if (this.mode == 'block') {
            this.clearSelection();
            this.plEventEmitter.emit('fastforward');
          } else if (this.mode == 'file') {
            $('.playlist-tracks').animate({scrollLeft: $('.channel-0').width()},500);
          }
          this.isPlaying = false;
          this.isPaused = false;
        },
        scrollPlayerToAnnotation(index, position) {
          position = position || 'start'
          let annotations = $('.annotations-boxes .annotation-box');
          if (annotations[index]) {
            let scrollPosition = $(annotations[index]).position().left + $('.playlist-tracks')[0].scrollLeft;
            if (position == 'middle') {
              scrollPosition-= $('.playlist-tracks').width()/ 2;
              scrollPosition+= $(annotations[index]).width() / 2;
            }
            $('.playlist-tracks').animate({
              scrollLeft: scrollPosition
            }, 200);
          }
        },
        isAnnotationVisible(index) {
          let annotations = $('.annotations-boxes .annotation-box');
          if (annotations[index]) {
            return $(annotations[index]).position().left > 0 && $(annotations[index]).position().left < $('.playlist-tracks')[0].offsetWidth;
          } else {
            return true;
          }
        },
        clearSelection() {
          this.plEventEmitter.emit('select', undefined, undefined);
          $('[id="resize-selection-right"]').hide().css('left', 0);
          $('[id="resize-selection-left"]').hide().css('left', 0);
        },
        isEmpty() {
          return !this.audiosourceEditor || !this.audiosourceEditor.tracks || this.audiosourceEditor.tracks.length == 0;
        },
        close() {
          if (this.isModifiedComputed) {
            this.onExitMessage = true;
          } else {
            if (this.plEventEmitter) {
              this.plEventEmitter.emit('automaticscroll', false);
              this.plEventEmitter.emit('clear');
              this._clearWordSelection();
            }
            this._setDefaults();
            this.$root.$emit('from-audioeditor:closed', this.blockId);
            this.$root.$emit('from-audioeditor:close');
          }
        },
        addSilence() {
          if (this.silenceLength > 0 && this.isSinglePointSelection) {
            this.$root.$emit('from-audioeditor:insert-silence', this.blockId, this._round(this.selection.start, 2), this.silenceLength);
            this.isModified = true;
          }
        },
        save() {
          if (this.mode == 'block') {
            if (this.isModified) {
              this.$root.$emit('from-audioeditor:save', this.blockId);
              this.isModified = false;
            }
          } else if(this.mode == 'file') {
            this.$root.$emit('from-audioeditor:save-positions', this.audiofile, this.selection);
            this.origFilePositions = this.selection;
          }
        },
        saveAndRealign() {
          if (this.isModified) {
            this.$root.$emit('from-audioeditor:save-and-realign', this.blockId);
            this.isModified = false;
          }
        },
        cut() {
          this.$root.$emit('from-audioeditor:cut', this.blockId, Math.round(this.selection.start * 1000), Math.round(this.selection.end * 1000));
          this.isModified = true;
        },
        undo() {
          let record = this._popHistory();
          if (this.history.length === 0 && this.isHistoryFull) {
            this.isModified = false;
          }
          if (record) {
            this.setAudio(record.audio, record.text, false);
            this.$root.$emit('from-audioeditor:undo', this.blockId, record.audio, record.text, this.isModified);
          }
        },
        discard() {
          this.$root.$emit('from-audioeditor:discard', this.blockId);
          this._setDefaults();
        },
        discardAndExit() {
          this.discardOnExit = true;
          this.onExitMessage = false;
          if (this.mode == 'file') {
            //this.selection = this.origFilePositions;
            //this.close();
          }
        },
        checkExitState() {
          if (this.discardOnExit) {
            this.discard();
          }
        },
        _setDefaults() {
          $('.playlist-tracks').off('scroll');
          this.words = [];
          this.currentWord = null;
          this.selection = {};
          this.isModified = false;
          this.isAudioModified = false;
          this.history = [];
          this.isPlaying = false;
          this.isPaused = false;
          this.origFilePositions = {};
          this.onExitMessage = false;
          if (this.plEventEmitter) {
            this.plEventEmitter.emit('clear');
          }
        },
        _numToTime(val) {
          let val_check = parseInt(val);
          if (('' + val_check).length > 1) {
            return val
          }
          return '0' + val
        },
        _round(val, precision) {
          precision = typeof precision == 'undefined' ? 1 : precision;
          let step = parseInt('1' + '0'.repeat(precision));
          return Math.round(val * step) / step;
        },
        _showSelectionBorders() {
          setTimeout(function() {
            let selection = $('.selection.segment')[0];
            if (selection) {
              $('[id="resize-selection-right"]').show().css('left', selection.offsetLeft + selection.offsetWidth);
              $('[id="resize-selection-left"]').show().css('left', selection.offsetLeft);
            } else {
              $('[id="resize-selection-right"]').hide().css('left', 0);
              $('[id="resize-selection-left"]').hide().css('left', 0);
            }
          }, 50);
        },
        _scrollToCursor() {
          if (this.cursorPosition && this.cursorPosition > 0) {
            let position = this.cursorPosition / (this.audiosourceEditor.samplesPerPixel / this.audiosourceEditor.sampleRate);
            $('.cursor').css('left', position + 'px');
            setTimeout(() => {
              $('.playlist-tracks').scrollLeft($('.cursor').position().left - ($('.playlist-tracks')[0].offsetWidth / 2));
            }, 50);
          } else if (!this.isPlaying) {
            if (this.isSinglePointSelection) {
              setTimeout(function () {
                $('.playlist-tracks').scrollLeft($('.selection.point').position().left - ($('.playlist-tracks')[0].offsetWidth / 2));
              }, 50);
            } else if (this.hasSelection) {
              setTimeout(function () {
                $('.playlist-tracks').scrollLeft($('#resize-selection-left').position().left - ($('.playlist-tracks')[0].offsetWidth / 2));
              }, 50);
            }
          }
        },
        _clearWordSelection() {
          $(this.contentContainer).find('w').removeClass('selected');
          $('.annotations-boxes .annotation-box').removeClass('selected');
        },
        _setWordSelection(index, select_range) {
          select_range = typeof select_range == 'undefined' ? false : select_range;
          this._clearWordSelection();
          let annotations = $('.annotations-boxes .annotation-box');
          if (annotations[index]) {
            $(annotations[index]).addClass('selected');
          }
          let words = this.contentContainer.find('w[data-map]');
          if (words[index]) {
            $(words[index]).addClass('selected');
          }
          if (select_range) {
            let word = this.words.find(_w => {
              return _w.alignedIndex == index;
            });
            if (word) {
              this.plEventEmitter.emit('select', word.start, word.end);
              this._showSelectionBorders();
            }
          }
        },
        _emitSelection(part, field, value) {
          let new_selection = {start: this.selection.start, end: this.selection.end};
          switch(part) {
            case 'start':
              switch (field) {
                case 'h':
                  new_selection.start = parseInt(value) * 3600 + parseInt(this.selectionStartM) * 60 + parseFloat(this.selectionStartS);
                  break;
                case 'm':
                  new_selection.start = parseInt(this.selectionStartH) * 3600 + parseInt(value) * 60 + parseFloat(this.selectionStartS);
                  break;
                case 's':
                  new_selection.start = parseInt(this.selectionStartH) * 3600 + parseInt(this.selectionStartM) * 60 + parseFloat(value);
                  break;
                default:
                  return;
              }
              break;
            case 'end':
              switch (field) {
                case 'h':
                  new_selection.end = parseInt(value) * 3600 + parseInt(this.selectionEndM) * 60 + parseFloat(this.selectionEndS);
                  break;
                case 'm':
                  new_selection.end = parseInt(this.selectionEndH) * 3600 + parseInt(value) * 60 + parseFloat(this.selectionEndS);
                  break;
                case 's':
                  new_selection.end = parseInt(this.selectionEndH) * 3600 + parseInt(this.selectionEndM) * 60 + parseFloat(value);
                  break;
                default:
                  return;
              }
              break;
            default:
              return;
          }
          if (this.isSinglePointSelection) {
            new_selection.end = new_selection.start;
          }
          if (new_selection.start >= 0 && new_selection.end <= this.audiosourceEditor.activeTrack.duration && new_selection.start <= new_selection.end) {
            this.selection = new_selection;
            this._setSelectionOnWaveform();
          }
        },
        _addHistory(text, audio) {
          this.history.push({text: text, audio: audio});
          if (this.history.length >= 6) {
            this.history.shift();
            this.isHistoryFull = false;
          }
        },
        _popHistory() {
          return this.history.pop();
        },
        _setSelectionOnWaveform() {
          if (this.selection && typeof this.selection.start != 'undefined' && typeof this.selection.end != 'undefined' && this.plEventEmitter) {
            this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
            this._showSelectionBorders();
          }
        },
        _setText(text) {
          this.content = text;
          let self = this;
          let annotations = [];
          let alignedWords = 0;
          this.words = [];
          this.contentContainer = $('#content-' + this.blockId);
          $('<div>' + this.content + '</div>').find('w').each(function() {
            let map = $(this).attr('data-map');
            if (map) {
              let position = map.split(',');
              if (position.length == 2) {
                position[0] = parseInt(position[0]) / 1000;
                position[1] = parseInt(position[1]) / 1000;
                annotations.push({
                  "begin": position[0], 
                  "children": [], 
                  "end": self._round(position[1] + position[0], 3), 
                  "id": $(this).text(), 
                  "language": "eng", 
                  "lines": []
                });
                self.words.push({start: position[0], end: self._round(position[0] + position[1], 3), index: self.words.length, alignedIndex: alignedWords++});
              }
            } else {
              self.words.push({start: null, end: null, index: self.words.length});
            }
          });
          //console.log(self.audiosourceEditor.annotationList.renderResizeLeft);
          if (self.audiosourceEditor.getEventEmitter().__ee__ && self.audiosourceEditor.getEventEmitter().__ee__['dragged']) {
            self.audiosourceEditor.getEventEmitter().off('dragged', self.audiosourceEditor.getEventEmitter().__ee__['dragged']);
          }
          if (self.audiosourceEditor) {
            if (self.audiosourceEditor.annotationList.annotations.length > 0) {
              $('.annotation-box').each(function(i, el) {
                if(typeof annotations[i] !== 'undefined') {
                  $(el).find('span.id').html(annotations[i].id);// workaround, waveform editor does not update text in annotations by annotations change
                }
              });
            }
            self.audiosourceEditor.setAnnotations({
                annotations: annotations,
                editable: true,
                isContinuousPlay: false,
                linkEndpoints: true
              });
            }
            //self.audiosourceEditor.annotationList.renderResizeLeft(annotations.length - 1);
        },
        _isAnnotationsEditable() {
          return this.currentBookMeta.isMastered;
        }
      },
      computed: {
        selectionStartH: {
          get() {
            if (typeof this.selection.start == 'undefined') {
              return false;
            }
            return this._numToTime(parseInt(this.selection.start / 3600))
          },
          set(value) {
            this._emitSelection('start', 'h', value);
          }
        },
        selectionStartM: {
          get() {
            if (typeof this.selection.start == 'undefined') {
              return false;
            }
            return this._numToTime(parseInt(this.selection.start / 60))
          },
          set(value) {
            this._emitSelection('start', 'm', value);
          }
        },
        selectionStartS: {
          get() {
            if (typeof this.selection.start == 'undefined') {
              return false;
            }
            return this._numToTime(this._round(this.selection.start % 60))
          },
          set(value) {
            this._emitSelection('start', 's', value);
          }
        },
        selectionEndH: {
          get(){
            if (typeof this.selection.end == 'undefined') {
              return false
            }
            return this._numToTime(parseInt(this.selection.end / 3600))
          },
          set(value) {
            this._emitSelection('end', 'h', value);
          }
        },
        selectionEndM: {
          get(){
            if (typeof this.selection.end == 'undefined') {
              return false
            }
            return this._numToTime(parseInt(this.selection.end / 60))
          },
          set(value) {
            this._emitSelection('end', 'm', value);
          }
        },
        selectionEndS: {
          get(){
            if (typeof this.selection.end == 'undefined') {
              return false
            }
            return this._numToTime(this._round(this.selection.end % 60))
          },
          set(value) {
            this._emitSelection('end', 's', value);
          }
        },
        allowZoomIn: {
          get() {
            return this.zoomLevels[0] != this.zoomLevel;
          }
        },
        allowZoomOut: {
          get() {
            return this.zoomLevels[this.zoomLevels.length - 1] != this.zoomLevel;
          }
        },
        isSinglePointSelection: {
          get() {
            return typeof this.selection.start != 'undefined' && this.selection.start == this.selection.end;
          }
        },
        hasSelection: {
          get() {
            return typeof this.selection.start != 'undefined';
          }
        },
        isModifiedComputed: {
          get() {
            if (this.mode == 'file') {
              return this.hasSelection && !this.isSinglePointSelection && (
                      !this.origFilePositions || (this.origFilePositions.start != this.selection.start || this.origFilePositions.end != this.selection.end))
            } else if (this.mode == 'block') {
              return this.isModified;
            }
          }
        },
        ...mapGetters(['currentBookMeta'])
      },
      watch: {
        'cursorPosition': {
          handler(val) {
            if (val !== false) {
              if (val == 0) {
                $('#cursor-position').css('left', 0);
              } else {
                let pos = val * this.audiosourceEditor.sampleRate / this.audiosourceEditor.samplesPerPixel;
                $('#cursor-position').css('left', pos);
              }
            }
            
            if (val > 0) {
              if (this.isPlaying) {
                this.stop();
                this.play(val);
              } else {
                $('#cursor-position').show();
              }
            } else {
              $('#cursor-position').hide();
            }
          }
        },
        'zoomLevel': {
          handler(val) {
            if (this.mode == 'file') {
              let pos = this.cursorPosition * this.audiosourceEditor.sampleRate / this.audiosourceEditor.samplesPerPixel;
              $('#cursor-position').css('left', pos);
            }
          }
        }
      }
  }
</script>
<style lang="less">
  @waveform-height: 80px;
  .waveform {
      max-height: @waveform-height;
      .resize-selection {
          width: 1px;
          height: 100%;
          border: 1px solid green;
          cursor: ew-resize;
          position: absolute;
          z-index: 1001;
          display: none;
      }
  }
  .waveform-playlist {
    background-color: #d9d9d9;
  }
  .wf-playlist {
    min-height: 100px;
    .cursor {
      width: 2px;
      background-color: black;
    }
    .selection.point {
      width: 2px;
      background-color: green;
    }
    .channel-wrapper {
        max-height: @waveform-height;
    }
    .playlist {
        .annotations {
          .annotation-box {
            background-color: white;
            &.selected {
              background-color: yellow;
            }
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
                width: 100%;
            }
            &:after {
              content: ' ';
              width: 98%;
              position: absolute;
              height: 100%;
              left: 1px;
              z-index: 1000;
            }
          }
          .annotations-text {
            display: none;
            max-height: 200px;
            overflow-x: scroll;
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
          .annotations-text::-webkit-scrollbar-track {
            -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
            border-radius: 10px;
            background-color: #F5F5F5;
          }
          .annotations-text::-webkit-scrollbar {
            width: 12px;
            background-color: #F5F5F5;
          }
          .annotations-text::-webkit-scrollbar-thumb {
            border-radius: 10px;
            -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
            background-color: #555;
          }
        }
        .playlist-time-scale {
            height: 30px;
            background-color: white;
        }
        .channel-progress {
            background: yellow;
        }
        .channel {
            background: gray;
            max-height: @waveform-height;
            canvas {
                /*max-height: @waveform-height;*/
            }
        }
        .playlist-overlay {
            max-height: @waveform-height;
        }
        .selection.segment {
            background: rgba(0, 128, 0, 0.1);
            border-right: 2px solid green;
            border-left: 2px solid green;
            cursor: ew-resize;
        }
    }
    &.annotations-fixed {
      .resize-handle {
        display: none;
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
  .player-controls {
    background-color: #d9d9d9;
    vertical-align: middle;
    .play-controls {
      display: inline-block;
      padding: 25px;
      width: 200px;
      i {
        font-size: 29px;
        color: #0089ff;
        display: inline-block;
        margin: 0px 5px;
      }
    }
    .zoom-controls {
      display: inline-block;
      padding: 14px;
      width: 120px;
      i {
        font-size: 29px;
        color: #0089ff;
        display: inline-block;
        margin: 0px 5px;
        &.disabled {
            color: gray;
            cursor: inherit;
        }
      }
    }
    .selection-controls {
      display: inline-block;
      padding: 0px 20px;
      width: 500px;
      &>div {
        display: inline-block;
        padding: 5px 10px;
      }
      input[type="number"] {
        width: 40px;
        &.sec {
          width: 50px;
        }
      }
      input[type="text"] {
        width: 30px;
      }
    }
    .audio-controls {
      display: inline-block;
    }
  }
  .cursor-position {
      width: 1px;
      height: 100%;
      border: 1px solid black;
      background-color: black;
      position: absolute;
      z-index: 1000;
      display: none;
  }
  .playlist-tracks {
    
  }
  .playlist-tracks::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    border-radius: 10px;
    background-color: #F5F5F5;
  }
  .playlist-tracks::-webkit-scrollbar {
    width: 12px;
    background-color: #F5F5F5;
  }
  .playlist-tracks::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: #555;
  }
  .waveform-wrapper {
    width: 100%;
  }
  .close-player-container {
    position: absolute;
    z-index: 1000;
    right: 0px;
    top: -22px;
    padding: 2px;
    height: 20px;
    .close-player {
      font-size: 25px;
      display: inline-block;
      padding: 0px 5px;
      cursor: pointer;
      color: black;
      background-color: #d9d9d9;
      height: 20px;
      line-height: 0.9;
    }
  }
  .modal.on-word-reposition {
    .btn.btn-default {
      display: none;
    }
  }
</style>
