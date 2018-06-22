<template>
  <div>
    <cntx-menu
          ref="waveformContext"
          dir="bottom">
        <li v-on:click="setSelectionStart(null, $event)">Selection Start</li>
        <li v-on:click="setSelectionEnd(null, $event)">Selection End</li>
      </cntx-menu>
    <div class="waveform-playlist">
      <div class="close-player-container pull-right">
        <span class="close-player" v-on:click="close()">&times;</span>
      </div>
      <div class="waveform-wrapper" @contextmenu.prevent="onContext">
        <div id="playlist" class="wf-playlist" ref="playlist"></div>
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
        <div class="selection-controls" v-bind:class="['-' + mode]">
          <div class="hidden">{{origFilePositions}}
            {{selection}}</div>
          <div v-if="selection.start >= 0" class="selection-display">
            <div>Selection Start</div>
            <div>
              <template v-if="mode == 'block'">
                <input type="text" v-model="selectionStartH" disabled />:<input type="text" v-model="selectionStartM" disabled />:<input type="number" v-model="selectionStartS" class="sec" step="0.1" ref="selectionStartNum" />
              </template>
              <template v-else-if="mode == 'file'">
                <input type="number" step="1" v-model="selectionStartH" />:
                <input type="number" step="1" v-model="selectionStartM" />:
                <input type="number" v-model="selectionStartS" class="sec" step="0.1" ref="selectionStartNum" />
              </template>
            </div>
          </div>
          <div v-if="selection.end >= 0" class="selection-display">
            <div>Selection End</div>
            <div>
              <template v-if="mode == 'block'">
                <input type="text" v-model="selectionEndH" disabled />:<input type="text" v-model="selectionEndM" disabled />:<input type="number" v-model="selectionEndS" class="sec" step="0.1" ref="selectionEndNum" :disabled="isSinglePointSelection"/>
              </template>
              <template v-else-if="mode == 'file'">
                <input type="number" step="1" v-model="selectionEndH" />:
                <input type="number" step="1" v-model="selectionEndM" />:
                <input type="number" v-model="selectionEndS" class="sec" step="0.1" ref="selectionEndNum" :disabled="isSinglePointSelection"/>
              </template>
            </div>
          </div>
          <template v-if="mode == 'block'">
            <div>
              <button class="btn btn-default" v-on:click="clearSelection()" :disabled="!hasSelection || isSinglePointSelection">Clear</button>
              <button class="btn btn-primary" v-on:click="cut()"  :disabled="!hasSelection || isSinglePointSelection">Cut</button>
            </div>
          </template>
        </div>
        <div class="selection-controls" v-if="mode == 'block'">
          <input type="number" step="0.1" v-model="silenceLength" />
          <button class="btn btn-primary" v-on:click="addSilence()" :disabled="cursorPosition === false">Add Silence</button>
        </div>
        <div class="audio-controls" v-if="isModifiedComputed && mode == 'block'">
          <button class="btn btn-default" v-if="history.length" v-on:click="undo()">Undo</button>
          <button class="btn btn-default" v-on:click="showModal('onDiscardMessage')">Discard</button>
          <button class="btn btn-primary" v-on:click="save()">Save</button>
          <button class="btn btn-primary" v-on:click="saveAndRealign()">Save & Re-align</button>
        </div>
        <div class="audio-controls" v-if="mode == 'file'">
          <button class="btn btn-default" :disabled="!isModifiedComputed" v-on:click="undo()">Undo</button>
          <button class="btn btn-primary" :disabled="!allowAlignSelection" v-on:click="align()" v-if="!hasLocks('align')">Align</button>
          <button class="btn btn-danger" v-else v-on:click="cancelAlign()">Cancel alignment</button>
          <span v-if="!hasAlignSelection" class="red-message">Define block range</span>
          <template v-else>
            <span v-if="hasAlignSelectionStart && hasAlignSelectionEnd" class="blue-message">
              {{selectionBlocksToAlign}} audio blocks in range <a v-if="hasAlignSelectionStart" class="blue-message" v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> - <a v-if="hasAlignSelectionEnd" class="blue-message" v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a>
            </span>
          </template>
        </div>
      </div>
    </div>
    <modal name="onDiscardMessage" :resizeable="false" :clickToClose="false" height="auto">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p>Discard unsaved audio changes?</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-default" v-on:click="hideModal('onDiscardMessage')">Cancel</button>
        <button class="btn btn-primary" v-on:click="discard()">Discard</button>
      </div>
    </modal>
    <modal name="onExitMessage" :resizeable="false" :clickToClose="false" height="auto">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p v-if="mode == 'block'">Discard unsaved audio changes?</p>
        <p v-if="mode == 'file'">Discard unsaved markers position?</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-default" v-on:click="checkExitState()">Cancel</button>
        <button v-if="mode == 'block'" class="btn btn-primary" v-on:click="discardAndExit()">Confirm</button>
        <button v-if="mode == 'file'" class="btn btn-primary" v-on:click="discardAndExit()">Discard</button>
      </div>
    </modal>
    <modal name="onWordRepositionMessage" :class="['on-word-reposition']" :resizeable="false" :clickToClose="false" height="auto">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p>Words repositioning will be lost on unmastered audio</p>
      </div>
      <div class="modal-footer">
         <button class="btn btn-primary" v-on:click="hideModal('onWordRepositionMessage')">OK</button>
      </div>
    </modal>
  </div>
</template>
<script>
  import Vue from 'vue'
  import api_config from '../mixins/api_config.js'
  import task_controls from '../mixins/task_controls.js'
  import BlockContextMenu from './generic/BlockContextMenu';
  //import { modal } from 'vue-strap'
  import v_modal from 'vue-js-modal';
  import {mapActions, mapGetters} from 'vuex'
  import _ from 'lodash';
  //import Peaks from 'peaks.js';
  var WaveformPlaylist = require('waveform-playlist');
  var WaveformData = require('waveform-data')
  var Draggable = require ('draggable')
  Vue.use(v_modal, { dialog: true });

  export default {
      name: 'AudioEditor',
      components: {
        //'modal': modal,
        'cntx-menu': BlockContextMenu
      },
      mixins: [api_config, task_controls],
      data() {
        return {
          audiosourceEditor: false,
          peaksPlayer: false,
          content: "",//'<w data-map="0,335">Either </w><w data-map="335,250">the </w><w data-map="585,60">well </w><w data-map="645,200">was </w><w data-map="845,255">very </w><w data-map="1100,360">deep, </w><w data-map="1460,165">or </w><w data-map="1625,165">she </w><w data-map="1790,310">fell </w><w data-map="2100,280">very </w><w data-map="2380,680">slowly, </w><w data-map="3060,20">for </w><w data-map="3080,270">she </w><w data-map="3350,500">had </w><w data-map="3850,395">plenty  </w><w data-map="4245,25">of </w><w data-map="4270,190">time </w><w data-map="4460,355">as </w><w data-map="4815,115">she </w><w data-map="4930,265">went </w><w data-map="5195,220">down </w><w data-map="5415,115">to </w><w data-map="5530,150">look </w><w data-map="5680,750">about </w><w data-map="6430,450">her. </w><w data-map="6880,435">First, </w><w data-map="7315,100">she </w><w data-map="7415,265">tried </w><w data-map="7680,10">to </w><w>look </w><w data-map="7690,10">down </w><w data-map="7700,50">and </w><w data-map="7750,230">make </w><w data-map="7980,190">out </w><w data-map="8170,160">what </w><w data-map="8330,110">she </w><w data-map="8440,225">was  </w><w data-map="8665,315">coming </w><w data-map="8980,260">to, </w><w data-map="9240,555">but </w><w data-map="9795,80">it </w><w data-map="9875,175">was </w><w data-map="10050,150">too </w><w data-map="10200,115">dark </w><w data-map="10315,145">to </w><w data-map="10460,380">see </w><w data-map="10840,600">anything; </w><w data-map="11440,585">then </w><w data-map="12025,125">she </w><w data-map="12150,550">looked </w><w data-map="12700,250">at </w><w data-map="12950,165">the  </w><w data-map="13115,185">sides </w><w data-map="13300,170">of </w><w data-map="13470,130">the </w><w>well, </w><w data-map="13600,70">and </w><w data-map="13670,315">noticed </w><w data-map="13985,95">that </w><w>they </w><w data-map="14080,120">were </w><w data-map="14200,475">filled </w><w data-map="14675,185">with </w><w data-map="14860,245">cupboards </w><w data-map="15105,370">and  </w><w data-map="15475,1045">book-shelves; </w><w data-map="16520,305">here </w><w data-map="16825,20">and </w><w data-map="16845,160">there </w><w data-map="17005,160">she </w><w data-map="17165,180">saw </w><w data-map="17345,300">maps </w><w data-map="17645,330">and </w><w data-map="17975,400">pictures </w><w data-map="18375,180">hung </w><w data-map="18555,305">upon </w><w data-map="18860,820">pegs. </w><w data-map="19680,325">She  </w><w data-map="20005,240">took </w><w data-map="20245,215">down </w><w data-map="20460,80">a </w><w data-map="20540,295">jar </w><w data-map="20835,195">from </w><w data-map="21030,50">one </w><w data-map="21080,75">of </w><w data-map="21155,5">the </w><w data-map="21160,380">shelves </w><w data-map="21540,225">as </w><w data-map="21765,190">she </w><w data-map="21955,1005">passed; </w><w>it </w><w data-map="22960,265">was </w><w data-map="23225,395">labelled  </w><w data-map="23620,530">‘ORANGE </w><w data-map="24150,1010">MARMALADE’, </w><w data-map="25160,160">but </w><w data-map="25320,245">to </w><w data-map="25565,60">her </w><w data-map="25625,155">great </w><w data-map="25780,1030">disappointment </w><w data-map="26810,105">it </w><w data-map="26915,240">was </w><w data-map="27155,765">empty: </w><w data-map="27920,150">she </w><w data-map="28070,145">did  </w><w data-map="28215,170">not </w><w data-map="28385,110">like </w><w data-map="28495,115">to </w><w data-map="28610,485">drop </w><w data-map="29095,120">the </w><w data-map="29215,405">jar, </w><w data-map="29620,405">so </w><w data-map="30025,135">she </w><w data-map="30160,410">managed </w><w data-map="30570,140">to </w><w data-map="30710,165">put  </w><w data-map="30875,115">it </w><w data-map="30990,235">into </w><w data-map="31225,10">one </w><w data-map="31235,10">of </w><w data-map="31245,225">the </w><w data-map="31470,380">cupboards </w><w data-map="31850,205">as </w><w data-map="32055,165">she </w><w data-map="32220,195">fell </w><w data-map="32415,405">past </w><w data-map="32820,1060">it.</w>',
          audiofile: "",//'http://localhost:3000/audiofiles/aaiw1_en/aaiw1_en_31/aaiw1_en_31.flac',
          blockId: null,
          block: null,
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
          discardOnExit: false,
          mode: 'block',
          origFilePositions: {},
          cursorPosition: false,
          dragLeft: null,
          dragRight: null,
          playlistScrollPosition: 0,
          audiofileId: null,
          blockMap: {},
          blockSelectionEmit: false,
          contextPosition: null,
          pendingLoad: null,
          mouseSelection: {
            start: null,
            end: null
          }
        }
      },
      mounted() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext);
        this.$root.$on('for-audioeditor:load-and-play', this.load);
        this.$root.$on('for-audioeditor:load', this.setAudio);
        this.$root.$on('for-audioeditor:reload-text', this._setText);
        this.$root.$on('for-audioeditor:select', this.select);
        this.$root.$on('for-audioeditor:close', this.close);
      },
      beforeDestroy() {
        if (this.audioContext) {
          this.audioContext.close();
          //this.audioContext = null;
          this.audiosourceEditor = null;
        }
        this.$root.$off('for-audioeditor:close', this.close);
        this.$root.$off('for-audioeditor:load-and-play', this.load);
        this.$root.$off('for-audioeditor:load', this.setAudio);
        this.$root.$off('for-audioeditor:reload-text', this._setText);
        this.$root.$off('for-audioeditor:select', this.select);
      },
      methods: {
        select (block_id, start, end) {
          if (this.blockId === block_id) {
            this.blockSelectionEmit = true;
            this.selection.start = start / 1000;
            this.selection.end = end / 1000;
            this._clearWordSelection();
            this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
            this._showSelectionBorders(true);
          }
        },
        load(audio, text, block, autostart = false, bookAudiofile = {}, reloadOnChange = true) {
          //console.log('load', audio, text, block, autostart, bookAudiofile, reloadOnChange);
          let blockId = block ? block._id : null;
          if (bookAudiofile && bookAudiofile.blockMap) {
            this.blockMap = bookAudiofile.blockMap;
          } else {
            this.blockMap = {};
          }
          $('.playlist-tracks').off('scroll');
          if (this.audioContext && this.audioContext.state === 'closed') {
            return false;//component was destroyed;
          }
          let mode = bookAudiofile.id ? 'file' : 'block';
          if (bookAudiofile.id) {
            this.audiofileId = bookAudiofile.id;
          }
          let changeZoomLevel = mode != this.mode;
          if ((this.blockId && this.blockId != blockId) || (mode == 'file' && reloadOnChange) || mode != this.mode) {
            if (this.isModifiedComputed && this.mode === 'block') {
              this.pendingLoad = arguments;
              this.showModal('onExitMessage');
              return;
            }
            this.silenceLength = 0.1;
            this.cursorPosition = false;
            this.isModified = false;
            this.playlistScrollPosition = 0;
            this.selection = {};
            this.$root.$emit('from-audioeditor:closed', this.blockId, this.audiofileId);
            this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
            this._clearWordSelection();
            //this.isAudioModified = false;
            //this.contentHistory = [];
            //this.audioHistory = [];
            //this.close();
          }
          this.pendingLoad = null;
          if (this.audiosourceEditor) {
            let emitter = this.audiosourceEditor.getEventEmitter();
            if (emitter) {
              emitter.emit('clear');
            }
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
          this.contextPosition = null;
          this.mode = mode;

          if (this.$refs.waveformContext) {
            this.$refs.waveformContext.close();
          }

          let self = this;

          this.audiofile = audio;
          this.blockId = blockId;
          this.block = block;

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
              this.load(audio, text, block, autostart, bookAudiofile);
              return;
            }
            if (this.blockId) {
              this.$root.$emit('from-audioeditor:block-loaded', this.blockId);
            } else if (bookAudiofile && bookAudiofile.id) {
              this.$root.$emit('from-audioeditor:audio-loaded', bookAudiofile.id);
            }
            $('.playlist-tracks').scrollLeft(this.playlistScrollPosition);
            $('.playlist-tracks').on('scroll', () => {
              this.playlistScrollPosition = $('.playlist-tracks').scrollLeft();
            });
            if (this.selection.end && this.selection.end > parseFloat(this.audiosourceEditor.duration)) {
              this.selection.end = this._round(parseFloat(this.audiosourceEditor.duration), 1);
              if (this.selection.start >= this.selection.end) {
                this.selection.start = this.selection.end - 0.1;
              }
            }
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
              start = self._round(start, 2);
              end = self._round(end, 2);
              let is_single_cursor = end - start == 0;
              if (is_single_cursor && self.contextPosition && self.mode === 'file' &&
                      typeof self.selection.start !== 'undefined' &&
                      typeof self.selection.end !== 'undefined') {
                self.plEventEmitter.emit('select', self.selection.start, self.selection.end);
                return;
              }
              if (!is_single_cursor) {
                if (start != self.selection.start) {
                  //self.cursorPosition = start;
                }
                self.selection = {start: start, end: end};
              } //else {
                //self.cursorPosition = start;
              //}
              return;
            });
            $('.waveform .selection').after('<div id="resize-selection-right" class="resize-selection"></div>').after('<div id="resize-selection-left" class="resize-selection"></div>').after('<div id="cursor-position" class="cursor-position"></div>').after('<div id="context-position" class="context-position"></div>');
            self.dragRight = new Draggable (document.getElementById('resize-selection-right'), {

              limit: {x:[0, $('.channel-0').length ? $('.channel-0').width() : 10000], y: [0, 0]},
              onDrag: function(element, x, y, event) {
                if ($('[id="resize-selection-left"]').position().left >= x) {
                  let start = x * self.audiosourceEditor.samplesPerPixel /  self.audiosourceEditor.sampleRate;
                  self.selection.start = start-1;
                  self._setSelectionOnWaveform();
                  return false;
                }
                let startX = 0;
                if (self.selection && typeof self.selection.start !== 'undefined') {
                  startX = self.selection.start / (self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate);
                } else {
                  startX = $('[id="resize-selection-left"]').position().left;
                }
                if ($('.selection.segment').length > 0) {
                  $('.selection.segment').css('width', x - $('.selection.segment')[0].offsetLeft)
                }

                if (typeof self.audiosourceEditor.activeTrack !== 'undefined') {
                  self.audiosourceEditor.activeTrack.stateObj.startX = startX;
                  if (typeof self.audiosourceEditor.activeTrack.stateObj.emitSelection !== 'undefined') {
                    self.audiosourceEditor.activeTrack.stateObj.emitSelection(x);
                  } else {
                    let startSec = x * self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate;
                    self.plEventEmitter.emit('select', self.selection.start, startSec);
                  }
                }
                //self.cursorPosition = self.selection.start;
              }
            })
            self.dragLeft = new Draggable (document.getElementById('resize-selection-left'), {
              limit: {x: [0, $('.channel-0').length ? $('.channel-0').width() : 10000], y: [0, 0]},
              onDrag: function(element, x, y, event) {
                if ($('[id="resize-selection-right"]').position().left <= x) {
                  let start = x * self.audiosourceEditor.samplesPerPixel /  self.audiosourceEditor.sampleRate;
                  self.selection.end = start+1;
                  self._setSelectionOnWaveform();
                  return false;
                }
                $('.selection.segment').css('width', $('[id="resize-selection-right"]').position().left - $('[id="resize-selection-left"]').position().left)
                $('.selection.segment').css('left', x - 5)
                let startX = 0;
                if (self.selection && typeof self.selection.end !== 'undefined') {
                  startX = self.selection.end / (self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate);
                } else {
                  startX = $('[id="resize-selection-right"]').position().left;
                }
                if (typeof self.audiosourceEditor.activeTrack !== 'undefined') {
                  self.audiosourceEditor.activeTrack.stateObj.startX = startX;
                  if (typeof self.audiosourceEditor.activeTrack.stateObj.emitSelection !== 'undefined') {
                    self.audiosourceEditor.activeTrack.stateObj.emitSelection(x);
                  } else {
                    let startSec = x * self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate;
                    self.plEventEmitter.emit('select', startSec, self.selection.end);
                  }
                }
                self.cursorPosition = self.selection.start;
              }
            })
            this.hideModal('onDiscardMessage');
            if (this.mode == 'file') {
              if (bookAudiofile && bookAudiofile.positions) {
                this.origFilePositions = bookAudiofile.positions;
              } else {
                this.origFilePositions = {start: 0, end: parseInt(this.audiosourceEditor.duration)}
              }
              if (!this._setBlocksSelection()) {
                if (bookAudiofile && bookAudiofile.positions && typeof bookAudiofile.positions.start !== 'undefined' && typeof bookAudiofile.positions.end !== 'undefined') {
                  this.plEventEmitter.emit('select', bookAudiofile.positions.start, bookAudiofile.positions.end);
                } else {
                  this.plEventEmitter.emit('select', 0, parseFloat(this.audiosourceEditor.duration));
                }
                this._showSelectionBorders();
              }
            }
            if (this.discardOnExit) {
              this.discardOnExit = false;
              this._setDefaults();
              this.close();
            } else if (autostart) {
              this.play();
            }
          })
          .catch(err => {
            //console.log(err)
            this._setDefaults();
            this.close();
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
              self.blockSelectionEmit = true;
              self._setWordSelection(index, true);
            } else {
              self._clearWordSelection();
            }
          });
          $('.wf-playlist').on('click', '.annotations-boxes .annotation-box', function(e) {
            let index = $('.annotations-boxes .annotation-box').index($(this));
            self.blockSelectionEmit = true;
            self._setWordSelection(index, true);
            ;
          });
          $('.wf-playlist').on('dragend', '.annotations-boxes .annotation-box .resize-handle', function(e) {
            if (!self._isAnnotationsEditable()) {
              self.showModal('onWordRepositionMessage');
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
          $('body').on('click', '.playlist-overlay', (e) => {
            if (typeof this.audiosourceEditor !== 'undefined') {
              let pos = (e.clientX + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              let pos_r = this._round(pos, 1);
              if (this.mouseSelection.start !== null && Math.abs(pos_r - this.mouseSelection.start) < 0.1) {
                if (this.mode === 'block' && e.shiftKey && this.cursorPosition >= 0) {
                  if (this.cursorPosition > pos_r) {
                    let end_pos = this.cursorPosition;
                    this.setSelectionStart(pos);
                    this.setSelectionEnd(end_pos);
                  } else {
                    this.setSelectionStart(this.cursorPosition);
                    this.setSelectionEnd(pos);
                  }
                } else {
                  if (typeof this.selection.start !== 'undefined') {
                    this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  }
                  this.cursorPosition = pos;
                  if (this.isPlaying) {
                    this.stop().then(() => this.play(pos));
                  }
                }
              } else {
                if (this.isPlaying) {
                  this.cursorPosition = pos;
                } else {
                  this.cursorPosition = this.selection.start;
                }
                //console.log(this.mouseSelection.start, pos)
              }
              //$('#cursor-position').show();
              this._showSelectionBorders();
            }
          });
          $('body').on('mousedown', '.playlist-overlay', (e) => {
            if (e.which !== 1) {
              return;
            }
            $('[id="resize-selection-right"]').hide().css('left', 0);
            $('[id="resize-selection-left"]').hide().css('left', 0);
            $('#cursor-position').hide();
            if (typeof this.audiosourceEditor.samplesPerPixel !== 'undefined') {
              let pos = (e.clientX + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              if (typeof this.selection.start !== 'undefined') {
                this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
              }
              this.mouseSelection = {start: this._round(pos, 1), end: null};
            }
          });
          $('.player-controls').keydown('input[type="number"]', function(e) {
            e.preventDefault();
          });
          if (self.mode == 'file') {
            let eventsTimer = setInterval(() => {
              if (this.$refs.playlist) {
                let ref = this.$refs.playlist.querySelector('.block-audio');
                $(ref).on('click', (e) => {
                  clearInterval(eventsTimer);
                  if (e && e.target && e.target.className && e.target.className.indexOf('resize-selection') !== -1) {
                    return;
                  }
                  //this.cursorPosition = (e.offsetX) * this.audiosourceEditor.samplesPerPixel / this.audiosourceEditor.sampleRate;
                  //$('.cursor').css('left', e.offsetX);
                })
              }
            }, 500);
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
          this.load(audio, text, this.block);
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
        stop(go_to_start = true) {
          if (this.isPlaying || this.isPaused) {
            this.cursorPosition = false;
            return this.audiosourceEditor.stop()
              .then(() => {
                this.isPlaying = false;
                this._clearWordSelection();
                if (go_to_start) {
                  if (this.hasSelection) {
                    this._scrollToCursor();
                  } else {
                    $('.playlist-tracks').scrollLeft(0);
                  }
                }
                this.$root.$emit('from-audioeditor:stop');
                return Promise.resolve();
              })
              .catch(err => console.log(err));
          } else {
            return Promise.resolve();
          }
        },
        pause() {
          if (this.isPlaying) {
            return this.audiosourceEditor.pause()
              .then(() => {
                this.isPlaying = false;
                this.isPaused = true;
                this.cursorPosition = this.audiosourceEditor.playbackSeconds;
                this.$root.$emit('from-audioeditor:pause');
                return Promise.resolve();
              })
              .catch(err => console.log(err));
          } else {
            return Promise.resolve();
          }
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
          let restart = this.isPlaying;
          this.pause()
            .then(() => {
              this.plEventEmitter.emit('select', undefined, undefined);
              $('[id="resize-selection-right"]').hide().css('left', 0);
              $('[id="resize-selection-left"]').hide().css('left', 0);
              if (restart) {
                this.play();
              }
            })
        },
        isEmpty() {
          return !this.audiosourceEditor || !this.audiosourceEditor.tracks || this.audiosourceEditor.tracks.length == 0;
        },
        close(autosave = true) {
          if (this.isModifiedComputed && this.mode === 'block') {
            this.showModal('onExitMessage');
          } else {
            if (autosave && this.isModifiedComputed && this.mode === 'file') {
              this.save();
            }
            if (this.plEventEmitter) {
              this.plEventEmitter.emit('automaticscroll', false);
              this.plEventEmitter.emit('clear');
              this._clearWordSelection();
            }
            this._setDefaults();
            this.$root.$emit('from-audioeditor:closed', this.blockId, this.audiofileId);
            this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
          }
        },
        addSilence() {
          if (this.silenceLength > 0 && this.cursorPosition >= 0) {
            this.$root.$emit('from-audioeditor:insert-silence', this.blockId, this._round(this.cursorPosition, 2), this.silenceLength);
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
            this.$root.$emit('from-audioeditor:save-positions', this.audiofileId, this.selection);
            this.origFilePositions = this.selection;
          }
        },
        align() {
          if (this.mode === 'file') {
            if (this.allowAlignSelection) {
              let save_selection = null;
              if (this.isModifiedComputed) {
                this.origFilePositions = this.selection;
                save_selection = this.selection;
              }
              this.$root.$emit('from-audioeditor:align', this.audiofileId, save_selection);
            }
          }
        },
        saveAndRealign() {
          if (this.isModified) {
            this.$root.$emit('from-audioeditor:save-and-realign', this.blockId);
            this.isModified = false;
          }
        },
        cut() {
          this.cursorPosition = this.selection.start;
          this.$root.$emit('from-audioeditor:cut', this.blockId, Math.round(this.selection.start * 1000), Math.round(this.selection.end * 1000));
          this.isModified = true;
        },
        undo() {
          if (this.mode === 'block') {
            let record = this._popHistory();
            if (this.history.length === 0 && this.isHistoryFull) {
              this.isModified = false;
            }
            if (record) {
              this.setAudio(record.audio, record.text, false);
              this.$root.$emit('from-audioeditor:undo', this.blockId, record.audio, record.text, this.isModified);
            }
          } else if (this.mode === 'file') {
            if (this.origFilePositions) {
              //this.selection = this.origFilePositions;
              //this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
              //this._showSelectionBorders();
              if (this.origFilePositions.start == this.selection.end) {
                this.setSelectionEnd(this.origFilePositions.end);
              }
              this.setSelectionStart(this.origFilePositions.start);
              this.setSelectionEnd(this.origFilePositions.end);
            }
          }
        },
        discard() {
          this.$root.$emit('from-audioeditor:discard', this.blockId);
          this._setDefaults();
          this.hideModal('onDiscardMessage');
        },
        discardAndExit() {
          //this.discardOnExit = true;
          this.hideModal('onExitMessage');
          if (this.mode == 'file') {
            this.selection = this.origFilePositions;
          } else if (this.mode == 'block') {
            this.isModified = false;
          }
          if (this.pendingLoad) {
            if (this.plEventEmitter) {
              this.plEventEmitter.emit('automaticscroll', false);
              this._clearWordSelection();
            }
            this._setDefaults();
            this.$root.$emit('from-audioeditor:closed', this.blockId, this.audiofileId);
            this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
            this.load(...this.pendingLoad);
          } else {
            this.close();
          }
        },
        checkExitState() {
          this.hideModal('onExitMessage');
          if (this.discardOnExit) {
            this.discard();
          } else {
            /*if (this.pendingLoad) {
              if (this.pendingLoad[3]) {
                this.$root.$emit('from-audioeditor:closed', this.pendingLoad[3]);
              } else {
                this.$root.$emit('from-audioeditor:close');
              }
            }*/
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
          this.hideModal('onExitMessage');
          if (this.plEventEmitter) {
            this.plEventEmitter.emit('clear');
          }
        },
        showModal(name) {
          this.$modal.show(name);
        },
        hideModal(name) {
          this.$modal.hide(name);
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
        _showSelectionBorders(scroll_to_selection = false) {
          setTimeout(() => {
            let selection = $('.selection.segment')[0];
            if (selection) {
              $('[id="resize-selection-right"]').show().css('left', selection.offsetLeft + selection.offsetWidth - 2);
              $('[id="resize-selection-left"]').show().css('left', selection.offsetLeft);
            } else {
              $('[id="resize-selection-right"]').hide().css('left', 0);
              $('[id="resize-selection-left"]').hide().css('left', 0);
            }
            if (scroll_to_selection) {
              this._scrollToCursor();
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
                if ($('#resize-selection-left').length > 0 && $('.playlist-tracks').length > 0) {
                  $('.playlist-tracks').scrollLeft($('#resize-selection-left').position().left - ($('.playlist-tracks')[0].offsetWidth / 2));
                  $('.cursor').css('left', $('#resize-selection-left').position().left + 'px');
                }
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
          if (new_selection.end > this._round(this.audiosourceEditor.activeTrack.duration, 1)) {
            new_selection.end = this._round(this.audiosourceEditor.activeTrack.duration, 1)
          }
          if (this._round(new_selection.start, 1) == this._round(new_selection.end, 1) && field == 's') {
            switch (part) {
              case 'start':
                new_selection.end+= 0.1;
                if (new_selection.end > this._round(this.audiosourceEditor.activeTrack.duration, 1)) {
                  return;
                }
                break;
              case 'end':
                new_selection.start-= 0.1;
                if (new_selection.start < 0) {
                  return;
                }
                break;
            }
            new_selection.end = this._round(new_selection.end, 1);
            new_selection.start = this._round(new_selection.start, 1);
          }
          if (new_selection.start >= 0 && new_selection.start < new_selection.end) {
            //this._setSelectionOnWaveform();
            if (this.selection.end == new_selection.start) {
              this.setSelectionEnd(new_selection.end);
            }
            if (this.selection.start != new_selection.start) {
              this.setSelectionStart(new_selection.start);
            }
            if (this.selection.end != new_selection.end) {
              this.setSelectionEnd(new_selection.end);
            }
            //this._showSelectionBorders(true);
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
          if (this.contentContainer.length == 0) {
            this.contentContainer = $('#' + this.blockId);//footnote
          }
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
          return this.currentBookMeta.isMastered || (this.block && this.block.voicework === 'tts');
        },
        _setBlocksSelection() {
          if (this.blockSelection && ((this.blockSelection.start && this.blockSelection.start._id) || (this.blockSelection.end && this.blockSelection.end._id)) && this.plEventEmitter) {
            let start = false;
            let end = false;
            if (this.blockSelection.start && this.blockSelection.start._id && this.blockMap[this.blockSelection.start._id]) {
              start = parseInt(this.blockMap[this.blockSelection.start._id][0])/1000;
              if (!this.blockSelection.end || !this.blockSelection.end._id || !this.blockMap[this.blockSelection.end._id]) {
                end = this.selection.end;//parseInt(this.blockMap[this.blockSelection.start._id][1])/1000;
              }
            }
            if (this.blockSelection.end && this.blockSelection.end._id && this.blockMap[this.blockSelection.end._id]) {
              end = parseInt(this.blockMap[this.blockSelection.end._id][1])/1000;
              if (!this.blockSelection.start || !this.blockSelection.start._id || !this.blockMap[this.blockSelection.start._id]) {
                start = this.selection.start;//parseInt(this.blockMap[this.blockSelection.end._id][0])/1000;
              }
            }

            if (start !== false && end !== false && start < end) {
              this.selection.start = this._round(start, 2);
              this.selection.end = this._round(end, 2);
              this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
              this._showSelectionBorders(true);
              //this.setSelectionStart(start);
              //this.setSelectionEnd(end);
              return true;
            } else {
              return false;
            }
          }
          return false;
        },
        onContext: function(e) {
          if (this.mode == 'file') {
            if (this.mode === 'file' &&
                    typeof this.selection.start !== 'undefined' &&
                    typeof this.selection.end !== 'undefined') {
              let t = setInterval(() => {
                if ($('.selection.point').length > 0) {
                  this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  clearInterval(t);
                }
              }, 50);
            }
            this.contextPosition = e.clientX;
            $('.medium-editor-toolbar').each(function(){
                $(this).css('display', 'none');
            });
            if (this.$refs.waveformContext) {
              this.$refs.waveformContext.open(e, {}, 0, e.layerY - 80);
            }
          }
        },
        setSelectionStart(val, event) {
          //if (this.mode == 'file') {
            if (this.audiosourceEditor) {
              let start = val !== null ? val : (this.contextPosition + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              start = this._round(start, 2);
              if (start == this.selection.start) {
                return;
              }
              if (start > this.selection.end) {
                if (this.audiosourceEditor.activeTrack && this.audiosourceEditor.activeTrack.duration) {
                  this.selection.end = this.audiosourceEditor.activeTrack.duration;
                } else {
                  return;
                }
              }
              let replay = this.isPlaying;
              this.stop(false)
                  .then(() => {
                    this.selection.start = start;
                    this.cursorPosition = this.selection.start;
                    this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                    this._showSelectionBorders();
                    this.contextPosition = null;
                    if (replay) {
                      this.play();
                    }
                  });
            } else {
              return;
            }
          //}
          this.contextPosition = null;
        },
        setSelectionEnd(val, event) {
          //if (this.mode == 'file') {
            if (this.audiosourceEditor) {
              let end = val !== null ? val : (this.contextPosition + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              end = this._round(end, 2);
              if (end == this.selection.end) {
                return;
              }
              if (end < this.selection.start) {
                //this.selection.start = 0;
                //this.cursorPosition = this.selection.start;
                this.setSelectionStart(0);
              }
              this.selection.end = end;
              //this.cursorPosition = this.selection.start;
              let pause;
              let replay = this.isPlaying;
              if (replay) {
                pause = this.pause();
              } else {
                pause = new Promise((res, rej) => {res()});
              }
              pause
                .then(() => {
                  this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  this._showSelectionBorders();
                  this.contextPosition = null;
                  if (replay) {
                    this.play();
                  }
                });
            } else {
              return;
            }
          //}
          this.contextPosition = null;
        },
        goToBlock(blockId, ev) {
          this.$root.$emit('for-bookedit:scroll-to-block', blockId);
          //console.log('goToBlock', blockId, this.$route.name);
          //this.$router.push({name: this.$route.name, params: {}});
          //this.$router.push({name: this.$route.name, params:  { block: blockId }});
        },
        cancelAlign() {
          this.$root.$emit('cancel-align');
        },
        throttleSelection: _.debounce(function (val, oldVal) {
          if (!this.blockSelectionEmit) {
            if (typeof val.start !== 'undefined' && typeof val.end !== 'undefined') {
              if (val.start !== oldVal.start || val.end !== oldVal.end) {
                this._clearWordSelection();
                this.$root.$emit('from-audioeditor:select', this.blockId, val.start, val.end);
              }
            }
          } else {
            this.blockSelectionEmit = false;
          }
          this.$root.$emit('from-audioeditor:selection-change', this.blockId, val.start, val.end);
        }, 30),
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
            return typeof this.selection.start != 'undefined' && this.selection.start >= 0;
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
          },
        },
        hasAlignSelection: {
          get() {
            return (this.blockSelection.start && this.blockSelection.start._id) ||
                    (this.blockSelection.end && this.blockSelection.end._id)
          }
        },
        hasAlignSelectionStart: {
          get() {
            return this.blockSelection.start && this.blockSelection.start._id;
          }
        },
        hasAlignSelectionEnd: {
          get() {
            return this.blockSelection.end && this.blockSelection.end._id;
          }
        },
        allowAlignSelection: {
          get() {
            return this.blockSelection.start && this.blockSelection.start._id &&
                    this.blockSelection.end && this.blockSelection.end._id &&
                    this.alignCounter.count;
          }
        },
        selectionBlocksToAlign: {
          get() {
            if (this.alignCounter) {
              return this.alignCounter.countAudio;
            }
            return 0;
          }
        },
        ...mapGetters(['currentBookMeta', 'blockSelection', 'alignCounter', 'hasLocks'])
      },
      watch: {
        'cursorPosition': {
          handler(val) {
            if (val !== false) {
              if (val == 0) {
                $('#cursor-position').css('left', 0);
                $('.cursor').css('left', 0)
              } else {
                let pos = val * this.audiosourceEditor.sampleRate / this.audiosourceEditor.samplesPerPixel;
                $('#cursor-position').css('left', pos);
                $('.cursor').css('left', pos);
              }
            }

            if (val > 0) {
              if (this.isPlaying) {
                this.stop()
                  .then(() => {
                    this.play(val);
                  });
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
        },
        'blockSelection.start._id': {
          handler(val) {
            //console.log('blockSelection CHANGED', val)
            this._setBlocksSelection();
          },
          deep: true
        },
        'blockSelection.end._id': {
          handler(val) {
            this._setBlocksSelection();
          }
        },
        'selection': {
          handler(val, oldVal) {
            this.throttleSelection(val, oldVal);
          },
          deep: true
        },
        'contextPosition': {
          handler(val) {
            if (val !== null) {
              $('#context-position').css('left', val + $('.playlist-tracks').scrollLeft());
              $('#context-position').show();
            } else {
              $('#context-position').hide();
            }
          }
        },
        '$route' () {
          if (this.$route.params.hasOwnProperty('bookid') && this.mode === 'block') {
            if (!this.currentBookMeta || this.$route.path.indexOf(this.currentBookMeta._id + '/edit' === -1)) {
              this._setDefaults();
              this.close();
            }
          }
        },
        'currentBookMeta._id': {
          handler(val, oldVal) {
            if (this.mode === 'file') {
              if (oldVal) {
                this.close();
              }
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
          width: 3px;
          height: 100%;
          border: 1px solid green;
          cursor: ew-resize;
          position: absolute;
          z-index: 1001;
          display: none;
          background-color: green;
      }
  }
  .waveform-playlist {
    background-color: #d9d9d9;
    .blue-message {
        color: blue;
        display: inline-block;
        padding: 1px 3px;
    }
    a.blue-message {
        font-weight: bold;
        text-decoration: underline;
        cursor: pointer;
    }
    .red-message {
        color: red;
        display: inline-block;
        padding: 1px 3px;
    }
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
    min-height: 62px;
    height: auto;
    .play-controls {
      display: inline-block;
      padding: 17px 25px;
      /*width: 200px;*/
      i {
        font-size: 29px;
        color: #0089ff;
        display: inline-block;
        margin: 0px 5px;
      }
    }
    .zoom-controls {
      display: inline-block;
      padding: 17px 14px;
      /*width: 120px;*/
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
      padding: 21px 20px 9px 20px;
      /*width: 500px;*/
      &>div {
        display: inline-block;
        padding: 0px 10px;
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
      .selection-display {
        margin-top: -21px;
      }
      &.-file {
        padding: 25px 20px 14px 20px;
      }
    }
    .audio-controls {
      display: inline-block;
    }
    >div:not(.audio-controls) {
      border-right: solid 2px #b1b1b1;
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
  .context-position {
      width: 1px;
      height: 100%;
      background-color: green;
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
