<template>
  <div>
    <cntx-menu
      ref="waveformContext"
      dir="bottom">
      <li v-on:click="setSelectionStart(null, $event)" v-if="mode == 'file'">Selection Start</li>
      <li v-on:click="setSelectionEnd(null, $event)" v-if="mode == 'file'">Selection End</li>
      <li v-on:click="unpinRight($event)" v-if="mode == 'block'">Unpin Rightward</li>
      <li v-on:click="toggleDisplayRecordingPauses()" v-if="mode === 'block'">
        <template v-if="displayRecordingPauses">
          Hide pause markers
        </template>
        <template v-else>
          Show pause markers
        </template>
      </li>
    </cntx-menu>
    <div class="waveform-playlist">
      <div v-if="!this.$parent.preloader" class="close-player-container pull-right">
        <span class="close-player" v-on:click="close()">&times;</span>
      </div>
      <div v-if="selection.start >= 0 && selection.end > 0" class="selection-tooltips">
        <div class="selection-tooltip -start">
          <button class="adjust-selection selection-decrease" v-on:click="decreaseSelectionStart()"></button>
          <span class="selection-time">{{selectionStartH}}:{{selectionStartM}}:{{selectionStartS}}</span>
          <button class="adjust-selection selection-increase" v-on:click="increaseSelectionStart()"></button>
        </div>
        <div class="selection-tooltip -end">
          <button class="adjust-selection selection-decrease" v-on:click="decreaseSelectionEnd()"></button>
          <span class="selection-time">{{selectionEndH}}:{{selectionEndM}}:{{selectionEndS}}</span>
          <button class="adjust-selection selection-increase" v-on:click="increaseSelectionEnd()"></button>
        </div>
      </div>
      <div class="waveform-wrapper" @contextmenu.prevent="onContext">
        <div id="playlist" class="wf-playlist" ref="playlist"></div>
      </div>
      <div class="audio-player-component">
        <div :class="['controls-list', controlsClassname]">
          <div class="controls-group">
            <div class="control-wrapper -special-control">
              <button class="audio-btn -play" v-if="!isPlaying" v-on:click="play()"></button>
              <button class="audio-btn -pause" v-if="isPlaying" v-on:click="pause()"></button>
            </div>
          </div>
          <div class="controls-group silence-controls" v-if="mode == 'block' && !editingLocked">
            <div class="control-wrapper">
              <dropdown 
                v-model="silenceLength" 
                :options="silenceLengths" 
                scrollHeight="auto"
                class="add-silence-dropdown" />
              <button class="audio-btn -add-silence" v-on:click="addSilenceLocal()" :disabled="cursorPosition === false" v-ilm-tooltip.top="'Add Silence'"></button>
            </div>
          </div>
          <div class="controls-group" v-if="mode == 'block'">
            <template v-if="!editingLocked">
            <div class="control-wrapper">
              <button class="audio-btn -cut" v-on:click="cutLocal()" :disabled="!hasSelection || isSinglePointSelection" v-ilm-tooltip.top="'Cut'"></button>
            </div>
            <div class="control-wrapper">
              <button class="audio-btn -erase" v-on:click="eraseLocal()"  :disabled="!hasSelection || isSinglePointSelection" v-ilm-tooltip.top="'Erase'"></button>
            </div>
            <div class="control-wrapper">
              <dropdown 
                v-model="fadePercent" 
                :options="fadePercents" 
                scrollHeight="410px" 
                class="fade-percent-dropdown"/>
              <button class="audio-btn -fade" v-on:click="fade()" :disabled="isFadeDisabled" v-ilm-tooltip.top="'Fade'" v-btn-toast.top="{value: rangeFadePercent, timeout: 2000}"></button>
            </div>
            </template>
            <div class="control-wrapper">
              <button class="audio-btn -clear" v-on:click="clearSelection()" :disabled="!hasSelection || isSinglePointSelection"  v-ilm-tooltip.top="'Clear'"></button>
            </div>
          </div>
          <div class="controls-group" v-if="mode == 'block' && !editingLocked">
            <div class="control-wrapper">
              <button class="audio-btn -save" v-on:click="save()"  :disabled="isSaveDisabled" v-ilm-tooltip.top="'Save'"></button>
            </div>
            <div class="control-wrapper">
              <button class="audio-btn -save-and-realign" v-on:click="saveAndRealign()" :disabled="isSaveDisabled" v-ilm-tooltip.top="'Save & Re-align'"></button>
            </div>
          </div>
          <div class="controls-group" v-if="mode == 'block' && !editingLocked">
            <div class="control-wrapper">
              <button class="audio-btn -undo" :disabled="actionsLog.length === 0" v-on:click="undo()" v-ilm-tooltip.top="{value: 'Undo ' + lastActionName, closeOnClick: false}"></button>
            </div>
          </div>
          <div class="controls-group" v-if="mode == 'block' && !editingLocked">
            <div class="control-wrapper">
              <button class="audio-btn -revert" :disabled="isRevertDisabled" v-on:click="revert(true)" v-ilm-tooltip.top="'Revert'"></button>
            </div>
          </div>
          <template v-if="mode === 'file'">
            <div class="controls-group">
              <div class="control-wrapper">
                <button class="audio-btn -undo" :disabled="!isModifiedComputed" v-on:click="undo()" v-ilm-tooltip.top="'Undo'"></button>
              </div>
            </div>
            <div class="controls-group">
              <div class="control-wrapper">
                <button class="audio-btn -align" :disabled="!allowAlignSelection" v-on:click="align()" v-if="!alignProcess" v-ilm-tooltip.top="'Align'"></button>
                <span v-else class="align-preloader -small"></span>
              </div>
              <div class="control-wrapper">
                <button class="cancel-align" v-if="hasLocks('align')" v-on:click="cancelAlign()" title="Cancel aligning"><i class="fa fa-ban"></i></button>
              </div>
              <div class="control-wrapper">
                <span v-if="!hasAlignSelection" class="define-block-range" v-ilm-tooltip.top="{value: 'Define block range', classList: {tooltip: 'red-tooltip'}}">i</span>
                <template v-else>
                  <span v-if="hasAlignSelectionStart && hasAlignSelectionEnd" :class="['blue-message', {'-bigger': selectionBlocksToAlign >= 100}]" v-ilm-tooltip.top="{value: '', valueSource: 'selection-alignment-info', classList: {tooltip: 'blue-tooltip'}}">
                    {{selectionBlocksToAlign}}
                  </span>
                  <div id="selection-alignment-info" class="hidden">{{selectionBlocksToAlign}} audio blocks in range <a v-if="hasAlignSelectionStart" class="blue-message" v-on:click="goToBlock(blockSelection.start._id)" :data-blockid="blockSelection.start._id">{{blockSelection.start._id_short}}</a> - <a v-if="hasAlignSelectionEnd" class="blue-message" v-on:click="goToBlock(blockSelection.end._id)" :data-blockid="blockSelection.end._id">{{blockSelection.end._id_short}}</a></div>
                </template>
              </div>
            </div>
          </template>
          <div class="controls-group -special-group">
            <div class="controls-group">
              <div class="control-wrapper">
                <button class="audio-btn -go-to-start" v-on:click="goToStart()"></button>
              </div>
              <div class="control-wrapper">
                <button class="audio-btn -go-to-end" v-on:click="goToEnd()"></button>
              </div>
            </div>
            <div class="controls-group">
              <div class="control-wrapper">
                <button class="audio-btn -zoom-in" :disabled="!allowZoomIn" v-on:click="zoomIn()"></button>
              </div>
              <div class="control-wrapper">
                <button class="audio-btn -zoom-out" :disabled="!allowZoomOut" v-on:click="zoomOut()"></button>
              </div>
            </div>
            <div class="control-wrapper" v-if="mode == 'block'">
              <dropdown v-ilm-tooltip.top="'Speed'"
                v-model="playbackRate" 
                :options="playbackRates" 
                scrollHeight="410px" 
                @change="onPlaybackRateChange"
                class="playbackrate-dropdown"/>
            </div>
          </div>
          <div class="controls-group" v-if="editingLocked">
            <div class="control-wrapper">{{editingLockedReason}}</div>
          </div>
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
  import {mapActions, mapGetters} from 'vuex'
  import _ from 'lodash';
  //import Peaks from 'peaks.js';
  import WaveformPlaylist from 'waveform-playlist';
  var Draggable = require ('draggable')
  var {TimeScale} = require('../store/audio/AudioTimeScale.js');

  import _Playout from 'waveform-playlist/lib/Playout';
  import Track from 'waveform-playlist/lib/Track';
  import { renderTrack, setState } from '../store/audio/AudioTrackMethods.js';
  import { calculateTrackPeaks } from '../store/audio/CalculateTrackPeaks.js';
  import { setUpSource, onSourceEnded } from '../store/audio/AudioPlayout.js';
  import { updateEditor } from '../store/audio/AudioPlaylist.js';
  import dropdown from 'primevue/dropdown';
  import IlmTooltip from '../directives/ilm-tooltip/ilm-tooltip.js';
  import '../directives/ilm-tooltip/ilm-tooltip.css';
  import BtnToast from '../directives/btn-toast/btn-toast.js';
  import '../directives/btn-toast/btn-toast.css';
  //var _Playout2 = _interopRequireDefault(_Playout);
  const SILENCE_VALUE = 0.005;
  const closeBracketsRegex = /[\)\]\}\﴿]/mg;
  const closeQuotesRegex = /[\”\’\»]/mg;
  
  Vue.directive('ilm-tooltip', IlmTooltip);
  Vue.directive('btn-toast', BtnToast);

  export default {
      name: 'AudioEditor',
      components: {
        'cntx-menu': BlockContextMenu,
        'dropdown': dropdown
      },
      mixins: [api_config, task_controls],
      data() {
        return {
          audiosourceEditor: false,
          peaksPlayer: false,
          content: "",
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
          silenceLengths: [],
          audioContext: null,
          contentContainer: null,
          isModified: false,
          isAudioModified: false,
          history: [],
          actionsLog: [],
          isHistoryFull: true,
          discardOnExit: false,
          mode: 'block',
          origFilePositions: {},
          cursorPosition: false,
          dragLeft: null,
          dragRight: null,
          playlistScrollPosition: 0,
          audiofileId: null,
          blockSelectionEmit: false,
          contextPosition: null,
          pendingLoad: null,
          mouseSelection: {
            start: null,
            end: null
          },
          alignProcess: false,
          annotations: [],
          minWordSize: 0.05,
          wordSelectionMode: false,
          processRun: false,
          processRunType: null,
          selectionBordersVisible: false,
          audioDuration: 0,
          isFootnote: false,
          wordRepositioning: false,
          editingLocked: false,
          editingLockedReason: '',
          pausedAt: null,
          playbackRate: 1,
          playbackRates: [],
          fadePercent: '',
          fadePercents: ['to 95%', 'to 90%', 'to 75%', 'to 50%', 'to 25%', 'to 10%', 'to 5%'],
          fadeSelectionLog: [],
          remoteSilenceData: [],
          silencePeaks: [],
          recordingPauses: [],
          displayRecordingPauses: true
        }
      },
      mounted() {
        let self = this;
        Track.prototype.calculatePeaks = function(samplesPerPixel, sampleRate) {
          calculateTrackPeaks.call(this, samplesPerPixel, sampleRate, SILENCE_VALUE, self.silencePeaks);
        }
        _Playout.prototype.setUpSource = function() {
          //console.log(self.audiosourceEditor.tracks[0].playout)
          setUpSource.call(this, self.playbackRate);
        }
        Track.prototype.setState = function(state) {
          setState.call(this, state);
        }
        this.$root.$on('for-audioeditor:load-and-play', this.load);
        this.$root.$on('for-audioeditor:load', this.setAudio);
        this.$root.$on('for-audioeditor:load-silent', this.setAudioSilent);
        //this.$root.$on('for-audioeditor:reload-text', this._setText);
        //this.$root.$on('for-audioeditor:select', this.select);
        this.$root.$on('for-audioeditor:close', this.close);
        this.$root.$on('for-audioeditor:force-close', this.forceClose);
        this.$root.$on('for-audioeditor:check-close-realigning-block', this.checkCloseRealigningBlock);
        this.$root.$on('start-align', () => {
          this.alignProcess = true;
        })
        this.$root.$on('stop-align', () => {
          this.alignProcess = false;
        })
        this.$root.$on('for-audioeditor:set-process-run', this.setProcessRun);
        this.$root.$on('for-audioeditor:flush', this.flush);
        this.$root.$on('for-audioeditor:lock-editing', this.setEditingLocked);
        this.$root.$on('readalong:playBlock', this.stop);
        
        for (let i = 1.25; i > 0.7; i-=0.05) {
          this.playbackRates.push(this._round(i, 2));
        }
        
        this.silenceLengths.push(2);
        this.silenceLengths.push(1.5);
        for (let i = 1; i >= 0.1; i-=0.1) {
          this.silenceLengths.push(this._round(i, 1));
        }
        
        let targetNode = document.querySelector('.navbar.fixed-bottom.navbar-light.bg-faded');
        let observer = new MutationObserver(() => {
          Vue.nextTick(() => {
            this.$root.$emit('from-audioeditor:visible', targetNode.classList.contains('hidden'));
          });
        });
        observer.observe(targetNode, { attributes: true, attributeFilter: ['class'] });

      },
      beforeDestroy() {
        if (this.audioContext) {
          this.audioContext.close();
          //this.audioContext = null;
          this.audiosourceEditor = null;
        }
        this.$root.$off('for-audioeditor:close', this.close);
        this.$root.$off('for-audioeditor:force-close', this.forceClose);
        this.$root.$off('for-audioeditor:check-close-realigning-block', this.checkCloseRealigningBlock);
        this.$root.$off('for-audioeditor:load-and-play', this.load);
        this.$root.$off('for-audioeditor:load', this.setAudio);
        this.$root.$off('for-audioeditor:load-silent', this.setAudioSilent);
        this.$root.$off('for-audioeditor:reload-text', this._setText);
        this.$root.$off('for-audioeditor:select', this.select);
        this.$root.$off('for-audioeditor:set-process-run', this.setProcessRun);
        this.$root.$off('for-audioeditor:flush', this.flush);
        this.$root.$off('for-audioeditor:lock-editing', this.setEditingLocked);
        this.$root.$off('readalong:playBlock', this.stop);
      },
      methods: {
        select (block_id, start, end, selectElement = false, startElementIndex = null) {
          if (block_id && this.blockId === block_id) {
            this.pause()
              .then(() => {
                this.blockSelectionEmit = true;
                this.selection.start = start / 1000;
                this.selection.end = end / 1000;
                this.cursorPosition = this.selection.start;
                this.wordSelectionMode = false;
                this._clearWordSelection();
                this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                this._showSelectionBorders(true);
                if (selectElement) {
                  if (startElementIndex >= 0) {
                    Vue.nextTick(() => {
                      this.wordSelectionMode = startElementIndex;
                      this._setWordSelection(startElementIndex, true, true);
                    });
                  }
                }
            });
          }
        },
        load(audio, text, block, autostart = false, bookAudiofile = {}, reloadOnChange = true) {
          //console.log('load', audio, text, block, autostart, bookAudiofile, reloadOnChange);

          if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext);
          }

          let blockId = block ? block._id : null;
          let reloadBlockAudio = this.mode === 'block' && blockId === this.blockId;
          if (this.mode === 'file') {
            this.pausedAt = null;
          }
          this.isFootnote = block ? block.is_footnote : false;

          this.$root.$off('for-audioeditor:select', this.select);
          this.$root.$off('for-audioeditor:reload-text', this._setText);
          this.$root.$on('for-audioeditor:select', this.select);
          this.$root.$on('for-audioeditor:reload-text', this._setText);

          //if (bookAudiofile && bookAudiofile.blockMap) {
            //this.blockMap = bookAudiofile.blockMap;
          //} else {
            //this.blockMap = {};
          //}
          $('.playlist-tracks').off('scroll');
          if (this.audioContext && this.audioContext.state === 'closed') {
            return false;//component was destroyed;
          }
          this.recordingPauses = [];
          let mode = bookAudiofile.id ? 'file' : 'block';
          if (mode === 'file') {
            this.setEditingLocked(false);
            $('.waveform-playlist').on('mouseenter', 'span.blue-message', () => {
              setTimeout(() => {
                $('a.blue-message').on('click', (event) => {
                  if (event && event.target && event.target.dataset) {
                    this.goToBlock(event.target.dataset.blockid);
                  }
                });
              });
            });
          } else {
            this.recordingPauses = block.recording_pauses || [];
          }
          let closingId = this.audiofileId;
          if (bookAudiofile.id) {
            this.audiofileId = bookAudiofile.id;
          }
          let changeZoomLevel = mode != this.mode;
          if ((this.blockId && this.blockId != blockId) || (mode == 'file' && reloadOnChange) || mode != this.mode) {
            if (this.mode === 'block') {
              let block = this.audioTasksQueueBlockOrPart();
              if (this.processRun && this.processRunType === 'save') {
                this.pendingLoad = arguments;
                this.setProcessRun(true, 'loading');
                return;
              }
              if (this.blockId && blockId) {
                if (this.pendingLoad && this.processRun && (this.processRunType === 'save' || this.processRunType === 'loading')) {// second opening of audioeditor while block saving in progress
                  this.pendingLoad = arguments;
                  return;
                }
              }
              if (block && !block.isAudioChanged && this.isModified) {// button save was pressed
                this.pendingLoad = arguments;
                this.setProcessRun(true, 'loading');
                return;
              } else if (this.isModified) {
                this.pendingLoad = arguments;
                this.showOnExitMessage();
                return;
              }
            }
            if (this.isModifiedComputed && this.mode === 'file') {
              this.$root.$emit('from-audioeditor:save-positions', closingId, this.selection);
            }
            if (this.dragRight) {
              this.dragRight.destroy();
            }
            if (this.dragLeft) {
              this.dragLeft.destroy();
            }
            this.silenceLength = 0.1;
            this.cursorPosition = false;
            this.isModified = false;
            this.playlistScrollPosition = 0;
            this.selection = {};
            this.wordSelectionMode = false;
            this.$root.$emit('from-audioeditor:closed', this.blockId, this.audiofileId);
            this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
            this._clearWordSelection();
            //this.isAudioModified = false;
            //this.contentHistory = [];
            //this.audioHistory = [];
            //this.close();
          }
          if (!reloadBlockAudio) {
            this.cursorPosition = false;
          }
          this.setProcessRun(true, 'loading');
          this.pendingLoad = null;
          this.isPlaying = false;
          this.isPaused = false;
          let clear = [];
          if (mode === 'block' && block) {
            if (block._id !== this.blockId) {
              this._clearHistoryLocal();
              this.displayRecordingPauses = true;
            }
            this.setAudioTasksBlockId([block.blockid, block._id, block.partIdx]);
            this.fillSilenceSample();
          }
          if (this.audiosourceEditor) {
            this.audiosourceEditor.tracks.forEach(t => {
              //console.log(t.playout);
              t.playout.buffer = null;
              //clear.push(t.playout.ac.close());
              t.buffer = null;
              t = null;
            });
            //console.log('CLEAR');
            this.audiosourceEditor.activeTrack = null;
            this.content = '';
            this.words = [];
            this.annotations = [];
            this.audiosourceEditor.annotationList = null;
            //console.log(this.audiosourceEditor.ac.close());
            //Object.getOwnPropertyDescriptor(this.audiosourceEditor, 'activeTrack')
            clear.push(this.audiosourceEditor.clear());
          }
          Promise.all(clear)
            .then(() => {


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
          
          this.playbackRate = 1;
          if (this.currentBookMeta && this.currentBookMeta.bookid && mode === 'block') {
            if (this.user.bookPlaybackRate && this.user.bookPlaybackRate[this.currentBookMeta.bookid]) {
              this.playbackRate = this.user.bookPlaybackRate[this.currentBookMeta.bookid];
            }
          }
          let fadePercent = this.audioFadeConfig.percent;
          /*if (this.currentBookMeta && this.currentBookMeta.bookid && mode === 'block') {
            if (this.user.audioFadeConfig && this.user.audioFadeConfig[this.currentBookMeta.bookid]) {
              fadePercent = this.user.audioFadeConfig[this.currentBookMeta.bookid].percent;
            }
          }*/
          this.fadePercent = `to ${fadePercent}%`;
          $('.playbackrate-dropdown .p-inputtext').html(`${this.playbackRate}x`)

          if (this.$refs.waveformContext) {
            this.$refs.waveformContext.close();
          }

          var self = this;

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
            this.audiosourceEditor= WaveformPlaylist({
              ac: this.audioContext,
              samplesPerPixel: this.zoomLevel,
              waveHeight: 80,
              container: document.getElementById('playlist'),
              state: 'select',
              colors: {
                waveOutlineColor: '#F3F3F3',
                timeColor: 'grey',
                fadeColor: 'black'
              },
              zoomLevels: this.zoomLevels,
              timescale: true,
              linkEndpoints: true
            });
            this.audiosourceEditor.renderTimeScale = function() {// temporary solution for ILM-2453, need to have audio editor in local repositories
              const controlWidth = this.controls.show ? this.controls.width : 0;
              const timeScale = new TimeScale(this.duration, this.scrollLeft,
                this.samplesPerPixel, this.sampleRate, controlWidth, this.colors);

              return timeScale.render();
            }
            
            //this.audiosourceEditor.load = trackLoad;
//             var _this15 = this.audiosourceEditor;
//             this.audiosourceEditor.drawRequest = function (){
//               console.log('drawRequest', blockId);
//               if (_this15) {
//                 _this15.draw(_this15.render());
//               }
//            }
          } else if (changeZoomLevel) {
            if (this.mode == 'file') {
              let zoom = this.zoomOut();// if previously loaded block audio - set zoom level to max zoom out
              while(zoom) {
                zoom = this.zoomOut();
              }
            } else {
              let zoom = this.zoomIn(100);// if previously loaded file audio - set zoom level to max zoom in
              while(zoom) {
                zoom = this.zoomIn(100);
              }
            }
          }
          /*try {
            if (this.audiosourceEditor.getEventEmitter().__ee__ && this.audiosourceEditor.getEventEmitter().__ee__['dragged']) {
              this.audiosourceEditor.getEventEmitter().off('dragged', this.audiosourceEditor.getEventEmitter().__ee__['dragged']);
            }
          } catch(e) {}*/
          this._setText(text, block);
          this.audiosourceEditor.updateEditor = function(cursor) {
            updateEditor.call(this, cursor, self.playbackRate);
          };
          this.audiosourceEditor.load([
            {
              src: this.audiofile,
              name: 'block-audio',
              gain: 1.1,
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
            //this.audiosourceEditor.tracks[0].playout.setUpSource = function() {
              //setUpSource.call(self.audiosourceEditor.tracks[0].playout, self.playbackRate);
            //}
            if (reloadBlockAudio) {
              if (this.pausedAt) {
                this.audiosourceEditor.pausedAt = this.pausedAt;
                this.audiosourceEditor.playbackSeconds = this.pausedAt;
                $('.annotation-box').removeClass('selected');
              }
              if (this.wordSelectionMode === false) {
                let selectedAnnotation = $('.annotation-box.selected');
                if (selectedAnnotation) {
                  let index = $('.annotations-boxes').find('.annotation-box').index($(selectedAnnotation));
                  let wrapped = this.contentContainer.find('.content-wrap w[data-map]');
                  if (index >= 0 && wrapped[index]) {
                    $(wrapped[index]).addClass('selected');
                  }
                }
              }
              this.audiosourceEditor.setActiveTrack(this.audiosourceEditor.tracks[0]);
            } else if (this.mode === 'block') {
              this.clearSelection();
              this.pausedAt = null;
            }
            //console.log(`memory: ${window.performance.memory.usedJSHeapSize}`);
            // overwrite function, bug ILM-4033
            this.audiosourceEditor.tracks.forEach(track => {
              track.render = renderTrack;
            })
            //console.log(this.audiosourceEditor.tracks[0].render);
            this.setProcessRun(false);
            this.audiosourceEditor.stopAnimation();
            if (this.audiosourceEditor.tracks.length > 1) {
              this.audiosourceEditor.getEventEmitter().emit('clear');
              this.load(audio, text, block, autostart, bookAudiofile);
              return;
            }
            let self = this;;
            this.$root.$emit('from-audioeditor:content-loaded');

            this.audioDuration = this._round(this.audiosourceEditor.duration, 2);
            if (this.blockId) {
              this.$root.$emit('from-audioeditor:block-loaded', this.blockId);
            } else if (bookAudiofile && bookAudiofile.id) {
              this.$root.$emit('from-audioeditor:audio-loaded', bookAudiofile.id);
            }
            $('.playlist-tracks').scrollLeft(this.playlistScrollPosition);
            $('.playlist-tracks').trigger('scroll');
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
              //console.log('this.plEventEmitter.on(timeupdate');
              if (self.isPlaying) {
                let cursor_position = $('.cursor').position().left;
                let waveform_position = $('.playlist-tracks')[0].scrollLeft;
                let waveform_width = $('.playlist-tracks')[0].offsetWidth;
                if (cursor_position > 0 && (
                        cursor_position < waveform_position ||
                        cursor_position > waveform_position + waveform_width)) {
                    let scrollPosition = cursor_position > waveform_position + waveform_width ? waveform_position + waveform_width / 2 : cursor_position;
                    $('.playlist-tracks').scrollLeft(scrollPosition);// scrolls to start, changes scroll on click
                }
              }
              if (self.mode == 'block') {
                if ((!self.isSingleWordPlaying && !self.isPlaying) || (self.currentWord && self.currentWord.start <= position && self.currentWord.end > position)) {
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
              }
            });
            this.plEventEmitter.on('finished', function() {
              self._clearWordSelection();
              self.isPlaying = false;
              self.isPaused = false;
              if (self.selection.start && !isNaN(self.selection.start)) {
                self.cursorPosition = self.selection.start;
              }
            });
            this.plEventEmitter.off('select', this.onEmittedSelect);
            this.plEventEmitter.on('select', this.onEmittedSelect);
            this.initDragSelection();
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
            this.showRecordingPauses();
            //$(`#content-${this.blockId}`).on('click', 'w', {blockId: this.blockId}, this.showSelection)
            let waveform = document.querySelector('.playlist-overlay');
            if (waveform) {
              waveform.addEventListener('mouseup', () => {// make sure selection drag stops at the event
                if (this.dragLeft) {
                  this.dragLeft.stop();
                  this.fixDragStart(null);
                }
                if (this.dragRight) {
                  this.dragRight.stop();
                  this.fixDragEnd(null);
                }
                Vue.nextTick(() => {
                  this._showSelectionBorders();
                });
              });
              waveform.addEventListener('mouseleave', (e) => {
                let toDragLeft = this.dragLeft && this.dragLeft.element === e.toElement;
                let toDragRight = this.dragRight && this.dragRight.element === e.toElement;
                let toCursor = e.toElement && e.toElement.classList.contains('cursor-position');
                if (!toDragLeft && !toDragRight && !toCursor) {
                  if (this.dragLeft) {
                    this.dragLeft.stop();
                    this.fixDragStart(null);
                  }
                  if (this.dragRight) {
                    this.dragRight.stop();
                    this.fixDragEnd(null);
                  }
                  //Vue.nextTick(() => {
                    //this._showSelectionBorders();
                  //});
                }
                setTimeout(() => {
                  this._showSelectionBorders();
                  this.setSelectionWidth();
                }, 50);
              });
            }
          })
          .catch(err => {
            //console.log(err)
            this._setDefaults();
            this.close();
          });
          });
          let self = this;
          $('.wf-playlist').off('click', '.annotations-boxes .annotation-box');
          $('.wf-playlist').on('click', '.annotations-boxes .annotation-box', function(e) {
            if (e.target.nodeName === 'SPAN') {
              console.log('CLICK ON SPAN');
              self.wordSelectionMode = false;
              let index = $('.annotations-boxes .annotation-box').index($(this));
              self.wordSelectionMode = index;
              self._drawWordSelection();
              return;
            }
            self.wordSelectionMode = false;
            let index = $('.annotations-boxes .annotation-box').index($(this));
            self.blockSelectionEmit = true;
            self._setWordSelection(index, true, true);
            self.wordSelectionMode = index;
            console.log('TARGET', e.target.className, e.target.nodeName, e.target.onclick);
            console.log('click word', index);
          });
          $('.wf-playlist').on('dragstart', '.annotations-boxes .annotation-box .resize-handle', (ev) => {
            if (this.editingLocked) {
              ev.preventDefault();
              return false;
            }
            //console.log('DRAG START');
            this.wordRepositioning = true;
          });
          $('.wf-playlist').on('dragend', '.annotations-boxes .annotation-box .resize-handle', (ev)=>{
            if (this.editingLocked) {
              ev.preventDefault;
              return false;
            }
            this.smoothDrag(ev);
            //console.log('DRAG END');
            this.wordRepositioning = false;
          });

          let waitPlaylist = setInterval(() => {
            if ($('.playlist-overlay').length > 0) {
              clearInterval(waitPlaylist);

              $('.playlist-overlay.state-select').on('mouseup', this._showSelectionBordersOnClick);

              $('.playlist-overlay').on('click, mouseup', (e) => {
                if (e && e.type === 'mouseup' && e.button === 2) {// right mouse up during selecting
                  return;
                }
                if (typeof this.audiosourceEditor !== 'undefined') {
                  let restart = this.isPlaying;
                  this.pause().then(() => {
                    let pos = (e.clientX + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
                    let pos_r = this._round(pos, 1);
                    //console.log('click', this.mouseSelection.start, Math.abs(pos_r - this.mouseSelection.start));
                    if (this.mouseSelection.start !== null && Math.abs(pos_r - this.mouseSelection.start) < 0.1) {
                      //console.log('2', this.cursorPosition, pos_r);
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
                        if (typeof this.selection.start !== 'undefined' && !isNaN(this.selection.start)) {
                          this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                        }
                        this.cursorPosition = pos;
                      }
                    } else {
                      this.wordSelectionMode = false;
                      if (this.isPlaying) {
                        this.cursorPosition = pos;
                      } else {
                        this.cursorPosition = this.selection.start;
                      }
                      //console.log(this.mouseSelection.start, pos)
                    }
                    //$('#cursor-position').show();

                    this._showSelectionBorders();
                    if (restart) {
                      this.play();
                    }
                  })
                }
              });

              $('.playlist-overlay').on('mousedown', (e) => {
                //console.log('this.mouseSelection', e.which, this.mouseSelection.start, this.mouseSelection.end);
                if (e.button !== 0) {
                  return;
                }
                if (this.$refs.waveformContext) {
                  this.$refs.waveformContext.close();
                  this.contextPosition = null;
                }
                let stop = new Promise((resolve, reject) => {
                    if (this.isPlaying) {
                      return this.pause()
                        .then(() => {
                          this.audiosourceEditor.activeTrack.stateObj.active = true;// allow selection by drag after pause, default editor behaviour changed
                          this.audiosourceEditor.activeTrack.stateObj.startX = e.offsetX;
                          return resolve();
                        });
                    } else {
                      return resolve();
                    }
                  });
                  stop.then(() => {
                //$('[id="resize-selection-right"]').hide().css('left', 0);
                //$('[id="resize-selection-left"]').hide().css('left', 0);
                this.setDragRightPosition(null);
                this.setDragLeftPosition(null);
                this.selectionBordersVisible = false;
                $('#cursor-position').hide();
                if (typeof this.audiosourceEditor.samplesPerPixel !== 'undefined') {
                  let pos = (e.clientX + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
                  if (typeof this.selection.start !== 'undefined' && !isNaN(this.selection.start)) {
                    this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  }
                  this.mouseSelection = {start: this._round(pos, 1), end: null};
                }
              });
                //console.log("$('body').on('mousedown', '.playlist-overlay'");
              });
            }
          }, 50);

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
        onEmittedSelect (r_start, r_end) {
          console.log('on select', r_start, r_end);
          let start = this._round(r_start, 2);
          let end = this._round(r_end, 2);
          let is_single_cursor = end - start == 0;
          if (is_single_cursor && this.contextPosition && this.mode === 'file' &&
                  typeof this.selection.start !== 'undefined' &&
                  typeof this.selection.end !== 'undefined') {
            this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
            return;
          }
          // do not select less than 0.2 sec
          if (this.mode === 'file' && Math.abs(end - start) < 0.2 &&
                  typeof this.selection.start !== 'undefined' &&
                  typeof this.selection.end !== 'undefined' &&
                  (this.selection.start != start ||
                  this.selection.end != end)) {
            this.selection.start = this._round(this.selection.start, 2);
            this.selection.end = this._round(this.selection.end, 2);
            if (this.selection.start != start ||
                  this.selection.end != end) {
              this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
            }
            //Vue.nextTick(() => {
              //this._showSelectionBorders();
            //});
            return;
          }
          if (!is_single_cursor) {
            if (start != this.selection.start) {
              //self.cursorPosition = start;
            }
            if (r_start > 0 && start === 0 && end === this.selection.end) {
              this.plEventEmitter.emit('select', 0, this.selection.end);
            } else if(end > this.audioDuration) {
              this.plEventEmitter.emit('select', start, this.audioDuration);
              this.stopDrag();
            } else {
              if (start < 0) {
                this.plEventEmitter.emit('select', 0, end);
                this.stopDrag();
              }
              this.selection = {start: start < 0 ? 0 : start, end: end};
            }
          } //else {
            //self.cursorPosition = start;
          //}
          
          //setTimeout(() => {
            //if (this.selection.start === start && this.selection.end === end) {
              //this._showSelectionBorders(false, true);
            //} else {
              //console.log('differs', JSON.stringify(this.selection), start, end);
            //}
          //}, 100);
          return;
        },
        stopDrag() {
          if (this.dragLeft) {
            this.dragLeft.stop();
            this.fixDragStart(null);
          }
          if (this.dragRight) {
            this.dragRight.stop();
            this.fixDragEnd(null);
          }
          Vue.nextTick(() => {
            this._showSelectionBorders();
          });
          //self._showSelectionBorders();
        },
        showSelection (event) {
          this.wordSelectionMode = false;
          let blockId = event.data.blockId;
          let index = $('#content-' + blockId).find('w[data-map]').index($(event.target));
          if (typeof index =='undefined' || index === false || index < 0) {
            let index_no_data = $('#content-' + blockId).find('w:not([data-map])').index($(event.target));
            let total_index = $('#content-' + blockId).find('w').index($(event.target));
            index = total_index - index_no_data;
          }
          if (!this.isAnnotationVisible(index)) {
            this.scrollPlayerToAnnotation(index, 'middle');
          }
          this._clearWordSelection();
        },
        setAudio(audio, text, saveToHistory = true, block = null) {
          if (this.plEventEmitter) {
            this.plEventEmitter.emit('clear');
          }
          if (typeof saveToHistory === 'undefined') {
            saveToHistory = true;
          }
          if (saveToHistory && this.content && this.audiofile) {
            this._addHistory(this.content, this.audiofile, this.block.manual_boundaries ? this.block.manual_boundaries.slice() : []);
          }
          this.load(audio, text, block ? block : this.block);
        },
        setAudioSilent(queue_record, audio, text, saveToHistory = true, block = null) {
          //console.log(`%c COMPARE ${this.audioTasksQueue.time}, ${queue_record.time}`, `color: #bada55; background-color: #222;`)
          this.emitDisplayWordSelection();
          if (this.audioTasksQueue.time === queue_record.time && !this.wordRepositioning) {
            if (block) {
              this.block.manual_boundaries = block.manual_boundaries || [];
            }
            if (!audio) {
              this._setText(text, block);
              return Promise.resolve();
            }
            let replay = this.isPlaying;
            let stopPlay = new Promise((resolve, reject) => {
              if (replay) {
                return this.pause()
                  .then(() => {
                    return resolve();
                  });
              } else {
                return resolve();
              }
            });
            return stopPlay
              .then(() => {
                let api = this.$store.state.auth.getHttp();
                return api.get(audio, {
                  responseType: 'arraybuffer'
                })
                  .then((response) => {
                    //console.log(response);
                    if (this.audioTasksQueue.time === queue_record.time) {
                      this.audiosourceEditor.ac.decodeAudioData(response.data, (buffer) => {
                        this.setAudioBuffer(buffer);
                        this.audiosourceEditor.activeTrack.duration = buffer.duration;
                        this.audiosourceEditor.duration = buffer.duration;
                        this._setText(text, block);
                        this.audiosourceEditor.activeTrack.setCues(0, this.audiosourceEditor.duration);
                        this.audiosourceEditor.activeTrack.calculatePeaks(this.audiosourceEditor.samplesPerPixel, this.audiosourceEditor.sampleRate);
                        this.audiosourceEditor.drawRequest();
                        if (replay && (this.audiosourceEditor.pausedAt || this.cursorPosition)) {
                          this.play();
                        }
                      });

                    } else {
                      if (replay && (this.audiosourceEditor.pausedAt || this.cursorPosition)) {
                        this.play();
                      }
                    }
                  })
                  .catch(err => {
                    console.log('ERROR');
                    console.log(err);
                  });
                })
          }
        },
        play(cursorPosition) {
          if (typeof cursorPosition === 'undefined') {
            if (this.cursorPosition !== false && !isNaN(this.cursorPosition)) {
              cursorPosition = this.cursorPosition;
            } else if (!this.selection.start && this.selection.start !== 0 && this.mode === 'block') {
              //this.cursorPosition = 0;
              this.audiosourceEditor.setTimeSelection(0);
              cursorPosition = 0;
            }
          }
          this.cursorPosition = false;
          if (cursorPosition) {
            this.audiosourceEditor.play(cursorPosition);
          } else {
            this.audiosourceEditor.play();
          }
          this.isPlaying = true;
          this.$root.$emit('from-audioeditor:play');
          $('.selection.point').hide();
          $('.context-position').hide();
        },
        stop(go_to_start = true) {
          if (this.isPlaying || this.isPaused) {
            this.cursorPosition = false;
            return this.audiosourceEditor.stop()
              .then(() => {
                onSourceEnded.call(this.audiosourceEditor.tracks[0].playout);
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
                /*this.audiosourceEditor.tracks[0].playout.source.disconnect();
                this.audiosourceEditor.tracks[0].playout.fadeGain.disconnect();
                this.audiosourceEditor.tracks[0].playout.volumeGain.disconnect();
                this.audiosourceEditor.tracks[0].playout.shouldPlayGain.disconnect();
                this.audiosourceEditor.tracks[0].playout.panner.disconnect();
                this.audiosourceEditor.tracks[0].playout.masterGain.disconnect();
                this.audiosourceEditor.tracks[0].playout.source = undefined;
                this.audiosourceEditor.tracks[0].playout.fadeGain = undefined;
                this.audiosourceEditor.tracks[0].playout.volumeGain = undefined;
                this.audiosourceEditor.tracks[0].playout.shouldPlayGain = undefined;
                this.audiosourceEditor.tracks[0].playout.panner = undefined;
                this.audiosourceEditor.tracks[0].playout.masterGain = undefined;*/
                onSourceEnded.call(this.audiosourceEditor.tracks[0].playout);
                this.isPlaying = false;
                this.isPaused = true;
                this.cursorPosition = this.audiosourceEditor.playbackSeconds;
                this.pausedAt = this.cursorPosition;
                this.$root.$emit('from-audioeditor:pause');
                return Promise.resolve();
              })
              .catch(err => console.log(err));
          } else {
            return Promise.resolve();
          }
        },
        zoomIn(till = false) {
          if (till !== false) {
            let index = this.zoomLevels.indexOf(this.zoomLevel);
            --index;
            if (!this.zoomLevels[index] || this.zoomLevels[index] < till) {
              return false;
            }
          }
          if (this.allowZoomIn) {
            //this._setDraggableOptions();setDragLimit
            this.plEventEmitter.emit('zoomin');
            let index = this.zoomLevels.indexOf(this.zoomLevel)
            if (this.zoomLevels[--index]) {
              this.zoomLevel = this.zoomLevels[index]
            }
            return true;
          }
          return false;
        },
        zoomOut() {
          if (this.allowZoomOut) {
            //this._setDraggableOptions();
            this.plEventEmitter.emit('zoomout');
            let index = this.zoomLevels.indexOf(this.zoomLevel)
            if (this.zoomLevels[++index]) {
              this.zoomLevel = this.zoomLevels[index]
            }
            return true;
          }
          return false;
        },
        /*_setDraggableOptions() {
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
        },*/
        goToStart() {
          if (this.mode == 'block') {
            this.pause()
              .then(() => {
                this.cursorPosition = 0;
                this.clearSelection();
                this._clearWordSelection();
                this.scrollPlayerToAnnotation(0);
              });
          } else if (this.mode == 'file') {
            //$('.playlist-tracks').animate({scrollLeft: 0},500);
            this.pause()
              .then(() => {
                this.audiosourceEditor.rewind()
                  .then(() => {
                    //$('.playlist-tracks').scrollLeft(0);
                    this.cursorPosition = 0;
                    //this.playPosition = 0;
                    //$('.playlist-tracks').animate({scrollLeft: 0},500);
                  })
              });
          }
          //this.playPosition = 0;
          //this.cursorPosition = 0;
          //this.isPlaying = false;
          //this.isPaused = false;
        },
        goToEnd() {
          if (this.mode == 'block') {
            this.pause()
              .then(() => {
                this.cursorPosition = 0;//this.audiosourceEditor.duration;
                this.clearSelection();
                this._clearWordSelection();
                this.scrollPlayerToAnnotation(-1);
              });
          } else if (this.mode == 'file') {
            this.pause()
              .then(() => {
                this.audiosourceEditor.fastForward();
                this.cursorPosition = 0;
              })
            //$('.playlist-tracks').animate({scrollLeft: $('.channel-0').width()},500);
          }
        },
        scrollPlayerToAnnotation(index, position) {
          position = position || 'start'
          let annotations = $('.annotations-boxes .annotation-box');
          if (index === -1) {
            index = annotations.length - 1;
          }
          if (annotations[index]) {
            let scrollPosition = $(annotations[index]).position().left + $('.playlist-tracks')[0].scrollLeft;
            if (position == 'middle') {
              scrollPosition-= $('.playlist-tracks').width()/ 2;
              scrollPosition+= $(annotations[index]).width() / 2;
            }
            $('.playlist-tracks').scrollLeft(scrollPosition);
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
          this.wordSelectionMode = false;
          let restart = this.isPlaying;
          this.pause()
            .then(() => {
              this.plEventEmitter.emit('select', undefined, undefined);
              $('[id="resize-selection-right"]').hide().css('left', 0);
              $('[id="resize-selection-left"]').hide().css('left', 0);
              this.selectionBordersVisible = false;
              if (restart) {
                this.play();
              }
            })
        },
        close(autosave = true) {
          //console.log('AudioEditor close', autosave);
          this.displayRecordingPauses = true;
          return this.pause()
            .then(() => {
              if (this.audiosourceEditor) this.audiosourceEditor.stopAnimation();
              if (this.isModifiedComputed && this.mode === 'block') {
                this.showOnExitMessage();
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
                $('body').off('mouseup', '.playlist-overlay.state-select', this._showSelectionBordersOnClick);
                $(`#content-${this.blockId}`).off('click', 'w', this.showSelection);
                this.$root.$off('for-audioeditor:select', this.select);
                this.$root.$off('for-audioeditor:reload-text', this._setText);
              }
            });
        },
        forceClose() {
          this.displayRecordingPauses = true;
          this.setProcessRun(false);
          if (this.audiosourceEditor) this.audiosourceEditor.stopAnimation();
          if (this.plEventEmitter) {
            this.plEventEmitter.emit('automaticscroll', false);
            this.plEventEmitter.emit('clear');
            this._clearWordSelection();
          }
          //console.log('forceClose');
          this._setDefaults();
          this.$root.$emit('from-audioeditor:closed', this.blockId, this.audiofileId);
          this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
          $('body').off('mouseup', '.playlist-overlay.state-select', this._showSelectionBordersOnClick);
          $(`#content-${this.blockId}`).off('click', 'w', this.showSelection);
          this.$root.$off('for-audioeditor:select', this.select);
          this.$root.$off('for-audioeditor:reload-text', this._setText);
        },
        addSilenceLocal() {
          //let original_buffer = this.audiosourceEditor.activeTrack.buffer;
          let time = this._round(this.cursorPosition, 2);
          this.silenceLength = parseFloat(this.silenceLength);

          //let silence = new Float32Array(this.silenceLength * original_buffer.sampleRate);
          let silence = this.getSilenceSample();

          this.insertRangeAction(time, silence, this.silenceLength);
          //this.audiosourceEditor.draw(this.audiosourceEditor.render());
          //this.audiosourceEditor.drawRequest();
          //this.audiosourceEditor.renderTrackSection();
          
          let original_buffer = this.audiosourceEditor.activeTrack.buffer;
              
          let fadeTime = 0.02;
          
          let fadeOutStart = 0;
          let fadeOutEnd = 0;
          let fadeLength = fadeTime * original_buffer.sampleRate;
          let fadePercent = 30;
          let removePercent = (100 - fadePercent);
          let range = [];
          let maxRemote = this.remoteSilenceData.length > 0 ? Math.max(...this.remoteSilenceData) : 0;
          
          if (time >= fadeTime) {

            let fadeOut = new Float32Array((fadeTime) * original_buffer.sampleRate);

            fadeOut.fill(SILENCE_VALUE);
            fadeOutStart = time - fadeTime;
            fadeOutEnd = time;
            range = this.cutRangeAction(fadeOutStart, fadeOutEnd);
            let maxRange = Math.max(...range);
            
            if (maxRange > maxRemote) {
              if (this.remoteSilenceData.length > 0) {
                removePercent = 100 - maxRemote * 100 / maxRange;
              }
              // Fade out from original volume to fadePercent starting from selection start till fadeLength
              for (let i = 0; i <= fadeLength; ++i) {
                if (range[i]) {
                  let currentPercent = i * removePercent / fadeLength;
                  let currentDelta = currentPercent * Math.abs(range[i]) / 100;
                  let currentValue;
                  if (range[i] < 0) {
                    currentValue = range[i] + currentDelta;
                  } else if (range[i] > 0) {
                    currentValue = range[i] - currentDelta;
                  } else {
                    currentValue = 0;
                  }
                  fadeOut[i] = currentValue;
                }
              }
              this.insertRangeAction(fadeOutStart, fadeOut, fadeTime);
            }
          }
          // Fade in from fadePercent to original volume at the end of selection
          //let fadeInStart = range.length - fadeLength;
          let fadeInStart = time + this.silenceLength;
          let fadeInEnd = time + this.silenceLength + fadeTime;
          let rangeEnd = [];
          
          if (time < this.audioDuration - fadeTime) {
          
            let fadeIn = new Float32Array((fadeTime) * original_buffer.sampleRate);

            fadeIn.fill(SILENCE_VALUE);
            rangeEnd = this.cutRangeAction(fadeInStart, fadeInEnd);
            
            let maxRange = Math.max(...rangeEnd);
            
            if (maxRange > maxRemote) {
              if (this.remoteSilenceData.length > 0) {
                removePercent = 100 - maxRemote * 100 / maxRange;
              }
              for (let i = 0; i <= fadeLength; ++i) {
                //console.log(i, fadeInStart, range.length)
                //console.log(range[i]);
                let currentPercent = i * removePercent / fadeLength;
                //console.log(currentPercent);
                let rangePos = rangeEnd.length - 1 - i;
                if (rangeEnd[rangePos]) {
                  let currentDelta = currentPercent * Math.abs(rangeEnd[rangePos]) / 100;
                  let currentValue;
                  if (rangeEnd[rangePos] < 0) {
                    currentValue = rangeEnd[rangePos] + currentDelta;
                  } else if (rangeEnd[rangePos] > 0) {
                    currentValue = rangeEnd[rangePos] - currentDelta;
                  } else {
                    currentValue = 0;
                  }
                  fadeIn[rangePos] = currentValue;
                }
                //console.log('===========', silence[i]);
              }

              this.insertRangeAction(fadeInStart, fadeIn, fadeTime);
            }
          }

          // Fill middle part with fadePercent
          /*for (let i = fadeLength + 1; i < fadeInStart; ++i) {
            if (range[i]) {
              let currentDelta = removePercent * Math.abs(range[i]) / 100;
              let currentValue;
              if (range[i] < 0) {
                currentValue = range[i] + currentDelta;
              } else if (range[i] > 0) {
                currentValue = range[i] - currentDelta;
              } else {
                currentValue = 0;
              }
              silence[i] = currentValue;
            }
          }*/


          this._addHistoryLocal('insert_silence', [
            {range: range, start: fadeOutStart, end: fadeOutEnd, length: fadeTime},
            {range: rangeEnd, start: fadeInStart, end: fadeInEnd, length: fadeTime}
          ], this.cursorPosition, this.cursorPosition + this.silenceLength, {
            recording_pauses: [...this.recordingPauses]
          });
          this.audiosourceEditor.annotationList.annotations.forEach((al, i) => {
            if (al.start >= time) {
              al.start = this._round(al.start + this.silenceLength, 2);
              this._changeWordPositions(al, i);
            }
            if (al.end >= time) {
              al.end = this._round(al.end + this.silenceLength, 2);
              this._changeWordPositions(al, i);
            }
          });
          
          this.recordingPauses.forEach((pause, idx) => {
            if (pause > time * 1000) {
              this.recordingPauses[idx]+= this.silenceLength * 1000;
            }
          });
          this.fixMap();
          this.audiosourceEditor.annotationList.annotations[this.audiosourceEditor.annotationList.annotations.length - 1].end = this.audiosourceEditor.duration;
          this.addTaskQueue('insert_silence', [this._round(this.cursorPosition, 2), this.silenceLength, fadeTime]);
          //this.clearSelection();
          this.showRecordingPauses();
          this.isModified = true;
          this.clearSelection();
        },
        _changeWordPositions(new_positions, index) {
          new_positions.start = this._round(new_positions.start, 2);
          new_positions.end = this._round(new_positions.end, 2);
          let w = this.words.find(_w => {
            return _w.index === index;
          });//this.words.push({start: map[0], end: map[1], index: this.words.length, alignedIndex: alignedWords++})
          if (w) {
            w.start = new_positions.start;
            w.end = new_positions.end;
          }
          let a = this.annotations[index];
          if (a) {
            a.begin = new_positions.start;
            a.end = new_positions.end;
          }
        },
        fixMap() {
          this.audiosourceEditor.annotationList.annotations.forEach((al, i) => {
            //console.log(i, ':', map[i][0], map[i][1]);
            if (this.audiosourceEditor.annotationList.annotations[i - 1] && this.audiosourceEditor.annotationList.annotations[i - 1].end != al.start) {
              //al.start = this.audiosourceEditor.annotationList.annotations[i - 1].end;
              this.audiosourceEditor.annotationList.annotations[i - 1].end = al.start;
              //this._changeWordPositions(al, i);
              this._changeWordPositions(this.audiosourceEditor.annotationList.annotations[i - 1], i - 1);
            }

          });
        },
        insertRangeAction(position, range, length) {
          let original_buffer = this.audiosourceEditor.activeTrack.buffer;
          let first_list_index        = parseInt(position * original_buffer.sampleRate);
          let second_list_index       = parseInt(first_list_index + range.length);
          let second_list_mem_alloc   = (original_buffer.length - first_list_index);
          if (second_list_mem_alloc < 0) {
            second_list_mem_alloc = 0;
          }

          let new_buffer      = this.audiosourceEditor.ac.createBuffer(original_buffer.numberOfChannels, original_buffer.length + parseInt((length) * original_buffer.sampleRate), original_buffer.sampleRate);

          let new_list        = new Float32Array( parseInt( first_list_index ));
          let second_list     = new Float32Array( parseInt( second_list_mem_alloc ));
          let combined        = new Float32Array( new_list.length + range.length + second_list.length );
          //console.log(new_list.length + second_list.length + range.length, first_list_index, second_list_index, combined.length);
          //console.log(new_list.length, range.length, second_list.length);

          for (let i = 0; i < original_buffer.numberOfChannels; ++i ) {

            original_buffer.copyFromChannel(new_list, i);
            original_buffer.copyFromChannel(second_list, i, first_list_index)

            combined.set(new_list)
            combined.set(range, first_list_index);
            combined.set(second_list, second_list_index)

            new_buffer.copyToChannel(combined, i);
          }
          //this.audiosourceEditor.activeTrack.setBuffer(new_buffer);
          this.setAudioBuffer(new_buffer);
          this.audiosourceEditor.activeTrack.duration+= length;
          this.audiosourceEditor.duration = this.audiosourceEditor.activeTrack.duration;
          this.audioDuration = this._round(this.audiosourceEditor.duration, 2);
          this.audiosourceEditor.activeTrack.setCues(0, this.audiosourceEditor.duration);
          this.audiosourceEditor.activeTrack.calculatePeaks(this.audiosourceEditor.samplesPerPixel, this.audiosourceEditor.sampleRate);
          this.audiosourceEditor.drawRequest();
        },
        save() {
          if (this.mode == 'block') {
            if (this.isModified) {
              this.pause()
                .then(() => {
                  //this._clearWordSelection();
                  //this.cursorPosition = 0;
                  //this.scrollPlayerToAnnotation(0);
                  let block = this.audioTasksQueueBlockOrPart();
                  block.recording_pauses = this.recordingPauses || [];
                  this.$root.$emit('from-audioeditor:save');
                });
              //this.addTaskQueue('save', []);
              //this.isModified = false;
            }
          } else if(this.mode == 'file') {
            this.history = [];
            this.$root.$emit('from-audioeditor:save-positions', this.audiofileId, this.selection);
            this.origFilePositions = this.selection;
          }
        },
        align() {
          if (this.mode === 'file') {
            if (this.allowAlignSelection) {
              let save_selection = null;
              if (this.isModifiedComputed) {
                this.origFilePositions = Object.assign({}, this.selection);
                save_selection = this.selection;
              }
              this.$root.$emit('from-audioeditor:align', this.audiofileId, save_selection);
            }
          }
        },
        saveAndRealign() {
          if (this.isModified) {
            //this.history = [];
            this.pause()
              .then(() => {
                //this._clearWordSelection();
                //this.cursorPosition = 0;
                //this.scrollPlayerToAnnotation(0);
                let block = this.audioTasksQueueBlockOrPart();
                block.recording_pauses = this.recordingPauses || [];
                this.$root.$emit('from-audioeditor:save', true);
              });
            //this.isModified = false;
          }
        },
        cutLocal() {
          let playPosition = null;
          return this.pause()
            .then(() => {
              let cut_range = this.cutRangeAction(this.selection.start, this.selection.end);
              this._addHistoryLocal('cut', cut_range, this.selection.start, this.selection.end, {
                recording_pauses: [...this.recordingPauses]
              });
              let diff = this._round(this.selection.end - this.selection.start, 2);
              if (this.cursorPosition >= this.selection.start && this.cursorPosition <= this.selection.end) {
                playPosition = this.selection.start;
              } else if (this.cursorPosition > this.selection.end) {
                playPosition = this.cursorPosition - diff;
              } else {
                playPosition = this.cursorPosition;
              }
              this.audiosourceEditor.annotationList.annotations.forEach((al, i) => {
                if (al.start <= this.selection.start && al.end >= this.selection.end) {// cut middle of the word
                  al.end-= diff;
                  this._changeWordPositions(al, i);
                } else if (al.start >= this.selection.end) {// word after selection
                  al.start-= diff;
                  al.end-= diff;
                  this._changeWordPositions(al, i);
                } else if (al.start >= this.selection.start && al.end <= this.selection.end) {// cut word
                  al.start = this.selection.start;
                  al.end = this.selection.start;
                  this._changeWordPositions(al, i);
                } else if (al.end > this.selection.start && al.end < this.selection.end) {// cut end of the word
                  al.end = this.selection.start;
                  this._changeWordPositions(al, i);
                } else if (al.start > this.selection.start && al.start < this.selection.end) {// cut end of the word
                  al.start = this.selection.start;
                  al.end-= diff;
                  this._changeWordPositions(al, i);
                }
              });
              /*if (pos && pos.length == 2) {
                    let begin = parseInt(pos[0]);
                    let end = parseInt(pos[1]);
                    if (end < 0) {
                      end = 0;
                    }
                    let mb_index = manual_boundaries.indexOf(begin);
                    //console.log(begin, end, $(item).text(), shift);
                    if (shift > 0) {
                      if (end - shift > min) {
                        begin+= shift;
                        end-=shift;
                        shift = 0;
                        if (mb_index !== -1) {
                          manual_boundaries.splice(mb_index, 1);
                        }
                        //console.log('SHIFT1', $(item).text(), shift)
                      } else if (end > min && end - shift < min) {
                        let delta = end - min;
                        shift-=delta;
                        begin+= delta;

                        begin+= shift;
                        end = min;
                        if (mb_index !== -1) {
                          manual_boundaries.splice(mb_index, 1);
                        }
                        //console.log('SHIFT2', $(item).text(), begin, end)
                        //end+= shift;
                      } else {
                        begin+=shift;
                        //console.log('SHIFT3', $(item).text(), shift)
                        //end+=shift;
                        //shift*=2;
                        if (mb_index !== -1) {
                          manual_boundaries.splice(mb_index, 1);
                        }
                      }
                    }
                    let dur = parseInt(end) || 0;
                    if (dur < min) {
                      let delta = (min - dur);
                      shift+= delta;
                      end+=delta;
                      //console.log('SHIFT4', $(item).text(), delta)
                      //console.log('INCREASE', shift, end)
                      //mapData[i].shift = delta;
                    }
                    //console.log(begin, end, $(this).text(), shift);
                    $(item).attr('data-map', begin + ',' + end);
                    lastMap = [begin, end];
                  }
                  if (shift > 0 && index === total - 1) {
                    addSilence = shift / 1000;
                  }
                });*/
              let shift = 0;
              let min = 0.05;
              this.audiosourceEditor.annotationList.annotations.forEach((al, i) => {
                let duration = al.end - al.start;
                if (shift > 0) {
                  if (duration - shift > min) {
                    al.start+= shift;
                    //al.end-=shift;
                    shift = 0;
                    //if (mb_index !== -1) {
                      //manual_boundaries.splice(mb_index, 1);
                    //}
                  } else if (duration > min && duration - shift < min) {
                    let delta = duration - min;
                    shift-=delta;
                    al.start+= delta;

                    al.start+= shift;
                    al.end = al.start + min;
                    //if (mb_index !== -1) {
                      //manual_boundaries.splice(mb_index, 1);
                    //}
                  } else {
                    al.start+=shift;
                    al.end+=shift;
                    //if (mb_index !== -1) {
                      //manual_boundaries.splice(mb_index, 1);
                    //}
                  }
                  this._changeWordPositions(al, i);
                }
                if (al.end - al.start < min) {
                  let delta = this._round(min - (al.end - al.start), 2);
                  shift = this._round(shift + delta, 2);
                  al.end = this._round(al.end + delta, 2);
                  this._changeWordPositions(al, i);
                }
              });
              if (shift > 0) {
                shift = this._round(shift, 2);
                this.insertRangeAction(this.audiosourceEditor.duration, new Float32Array(shift * this.audiosourceEditor.activeTrack.buffer.sampleRate), shift);
              }
              this.fixMap();
              this.audiosourceEditor.annotationList.annotations[this.audiosourceEditor.annotationList.annotations.length - 1].end = this.audiosourceEditor.duration;
              let positionStart = Math.round(this.selection.start * 1000);
              let positionEnd = Math.round(this.selection.end * 1000);
              let changedPauses = [];
              this.recordingPauses.forEach((pause, pauseIdx) => {
                if (pause < positionStart) {
                  changedPauses.push(pause);
                } else if (pause > positionEnd) {
                  changedPauses.push(parseInt(pause - diff * 1000));
                }
              });
              this.recordingPauses = changedPauses;
              this.addTaskQueue('cut', [positionStart, positionEnd, shift]);
              this.clearSelection();
              this.isModified = true;
              if (playPosition) {
                this.cursorPosition = playPosition;
              }
              //this.audiosourceEditor.ee.emit('scroll');
              //durationformat
              //statechange + state
              //trim + clear selection
              //scroll
              //playbackReset call
              this.showRecordingPauses();
            });
        },
        cutRangeAction(start, end) {
          let original_buffer = this.audiosourceEditor.activeTrack.buffer;

          let first_list_index        = (start * original_buffer.sampleRate);
          let second_list_index       = (end * original_buffer.sampleRate);
          let second_list_mem_alloc   = (original_buffer.length - (end * original_buffer.sampleRate));
          if (second_list_mem_alloc < 1) {
            second_list_mem_alloc = 1;
          }

          let new_buffer      = this.audiosourceEditor.ac.createBuffer(original_buffer.numberOfChannels, parseInt( first_list_index ) + parseInt( second_list_mem_alloc ), original_buffer.sampleRate);

          let new_list        = new Float32Array( parseInt( first_list_index ));
          let second_list     = new Float32Array( parseInt( second_list_mem_alloc ));
          let combined        = new Float32Array( parseInt( first_list_index ) + parseInt( second_list_mem_alloc ) );
          let cut_range = new Float32Array((end - start) * original_buffer.sampleRate);

          //this.actionsLog.push({
            //type: 'cut',
            //buffer: original_buffer
          //});

          for (let i = 0; i < original_buffer.numberOfChannels; ++i) {
            original_buffer.copyFromChannel(new_list, i);

            combined.set(new_list);

            if (second_list_mem_alloc > 0) {
              original_buffer.copyFromChannel(second_list, i, second_list_index);
              combined.set(second_list, first_list_index);
            }

            new_buffer.copyToChannel(combined, i);
            original_buffer.copyFromChannel(cut_range, i, first_list_index);
          }
          //console.log(cut_range);
          this.setAudioBuffer(new_buffer);
          //this._addHistoryLocal('cut', cut_range, this.selection.start, this.selection.end);
          this.audiosourceEditor.activeTrack.duration-= end - start;
          if (this.audiosourceEditor.activeTrack.duration < 0) {
            this.audiosourceEditor.activeTrack.duration = 0;
          }
          this.audiosourceEditor.duration = this.audiosourceEditor.activeTrack.duration;
          this.audioDuration = this._round(this.audiosourceEditor.duration, 2);

          this.audiosourceEditor.activeTrack.setCues(0, this.audiosourceEditor.duration);
          this.audiosourceEditor.activeTrack.calculatePeaks(this.audiosourceEditor.samplesPerPixel, this.audiosourceEditor.sampleRate);
          this.audiosourceEditor.drawRequest();
          return cut_range;
        },
        fade() {
          return this.pause()
            .then(() => {
              
              let original_buffer = this.audiosourceEditor.activeTrack.buffer;
              
              let selectionLength = this._round(this.selection.end - this.selection.start, 2);

              let silence = new Float32Array((selectionLength) * original_buffer.sampleRate);
              
              silence.fill(SILENCE_VALUE);
              let range = this.cutRangeAction(this.selection.start, this.selection.end);
              
              let calculatedFadeLength = this.audioFadeConfig.length;
              if (selectionLength < this.audioFadeConfig.shortLength) {
                calculatedFadeLength = this._round(this.audioFadeConfig.shortPercent * selectionLength / 100, 2);
              }
              let fadeLength = calculatedFadeLength * original_buffer.sampleRate;
              let fadePercent = this.getClearFadePercent();
              let removePercent = (100 - fadePercent);
              // Fade out from original volume to fadePercent starting from selection start till fadeLength
              for (let i = 0; i <= fadeLength; ++i) {
                if (range[i]) {
                  let currentPercent = i * removePercent / fadeLength;
                  let currentDelta = currentPercent * Math.abs(range[i]) / 100;
                  let currentValue;
                  if (range[i] < 0) {
                    currentValue = range[i] + currentDelta;
                  } else if (range[i] > 0) {
                    currentValue = range[i] - currentDelta;
                  } else {
                    currentValue = 0;
                  }
                  silence[i] = currentValue;
                }
              }
              // Fade in from fadePercent to original volume at the end of selection
              let fadeInStart = range.length - fadeLength;
              for (let i = 0; i <= fadeLength; ++i) {
                //console.log(i, fadeInStart, range.length)
                //console.log(range[i]);
                let currentPercent = i * removePercent / fadeLength;
                //console.log(currentPercent);
                let rangePos = range.length - 1 - i;
                if (range[rangePos]) {
                  let currentDelta = currentPercent * Math.abs(range[rangePos]) / 100;
                  let currentValue;
                  if (range[rangePos] < 0) {
                    currentValue = range[rangePos] + currentDelta;
                  } else if (range[rangePos] > 0) {
                    currentValue = range[rangePos] - currentDelta;
                  } else {
                    currentValue = 0;
                  }
                  silence[rangePos] = currentValue;
                }
                //console.log('===========', silence[i]);
              }
              
              // Fill middle part with fadePercent
              for (let i = fadeLength + 1; i < fadeInStart; ++i) {
                if (range[i]) {
                  let currentDelta = removePercent * Math.abs(range[i]) / 100;
                  let currentValue;
                  if (range[i] < 0) {
                    currentValue = range[i] + currentDelta;
                  } else if (range[i] > 0) {
                    currentValue = range[i] - currentDelta;
                  } else {
                    currentValue = 0;
                  }
                  silence[i] = currentValue;
                }
              }
              
              this.insertRangeAction(this.selection.start, silence, this.selection.end - this.selection.start);
              
              
              this._addHistoryLocal('fade', range, this.selection.start, this.selection.end);
              this.addTaskQueue('fade', [this.selection.start, this.selection.end, fadePercent, calculatedFadeLength]);
              this.addFadeSelectionLog();
              this.isModified = true;
              this.cursorPosition = this.selection.start;
              let el = document.getElementById('resize-selection-left');
              let pos = el.getBoundingClientRect();
              if (window.innerWidth <= pos.left - 20) {
                $('.playlist-tracks').scrollLeft(pos.left - ($('.playlist-tracks')[0].offsetWidth / 2));
              }
              Vue.nextTick(() => {
                this.play(this.selection.start);
              });
            });
        },
        setAudioBuffer(new_buffer) {
          if (this.audiosourceEditor && this.audiosourceEditor.activeTrack) {
            this.audiosourceEditor.activeTrack.setBuffer(new_buffer);
            //console.log(_Playout);
            //console.log(new _Playout.default(this.audiosourceEditor.ac, new_buffer));
            //console.log(new _Playout(this.audiosourceEditor.ac, new_buffer));
            //this.audiosourceEditor.activeTrack.playout.setBuffer(new_buffer);
            //this.audiosourceEditor.activeTrack.duration = new_buffer.duration;
            //this.audiosourceEditor.duration = new_buffer.duration;
            this.audiosourceEditor.activeTrack.setPlayout(new _Playout(this.audiosourceEditor.ac, new_buffer));
          }
        },
        addTaskQueue(type, options) {
          let wordMap = [];
          this.audiosourceEditor.annotationList.annotations.forEach((an, i) => {
            wordMap.push([Math.round(an.start * 1000), Math.round((an.end - an.start) * 1000)]);
            //console.log(i, ':', map[i][0], map[i][1]);
            if (wordMap[i - 1] && wordMap[i - 1][0] + wordMap[i - 1][1] != wordMap[i][0]) {
              //console.log('FIX MAP', map[i - 1][0] + map[i - 1][1], map[i][0]);
              wordMap[i][0] = wordMap[i - 1][0] + wordMap[i - 1][1];
            }
          });
          this.addAudioTask([type, options, wordMap]);
          //this._addHistory(this.content, this.audiofile, this.block && this.block.manual_boundaries ? this.block.manual_boundaries.slice() : []);
          //this.$root.$emit('from-audioeditor:tasks-queue-push', this.blockId, this.audioTasksQueue.queue);
        },
        popTaskQueue() {
          this.undoTasksQueue();
        },
        eraseLocal() {
          let pause;
          if (this.isPlaying) {
            pause = this.pause();
          } else {
            pause = new Promise((res, rej) => {res()});
          }
          return pause
            .then(() => {

              let original_buffer = this.audiosourceEditor.activeTrack.buffer;

              let silence = new Float32Array((this.selection.end - this.selection.start) * original_buffer.sampleRate);
              
              silence.fill(SILENCE_VALUE);
              let range = this.cutRangeAction(this.selection.start, this.selection.end);
              this.insertRangeAction(this.selection.start, silence, this.selection.end - this.selection.start);

              let selectionStart = Math.round(this.selection.start * 1000);
              let selectionEnd = Math.round(this.selection.end * 1000);
              this._addHistoryLocal('erase', range, this.selection.start, this.selection.end, {
                recording_pauses: [...this.recordingPauses]
              });
              let changedPauses = [];
              this.recordingPauses.forEach(pause => {
                if (pause < selectionStart || pause > selectionEnd) {
                  changedPauses.push(pause);
                }
              });
              this.recordingPauses = changedPauses;
              this.addTaskQueue('erase', [selectionStart, selectionEnd]);
              this.showRecordingPauses();
              //this.$root.$emit('from-audioeditor:erase-audio', this.blockId, Math.round(this.selection.start * 1000), Math.round(this.selection.end * 1000));
              this.clearSelection();
              this.isModified = true;
            });
        },
        undo() {
          //this.undoLocal();
          //return;
          if (this.mode === 'block') {
            this.popFadeSelectionLog();
            return this.pause()
              .then(() => {
                let make_event = !this.audioTasksQueue.running;
                this.popTaskQueue();
                let record = this._popHistoryLocal(true);
                //let record = this._popHistory();
                if (record.type === "insert_silence") {
                  if (record.selection) {
                    if (this.cursorPosition >= record.selection.start && this.cursorPosition <= record.selection.end) {
                      this.cursorPosition = record.selection.start;
                    } else if (this.cursorPosition > record.selection.end) {
                      this.cursorPosition -= record.selection.end - record.selection.start;
                    }
                  }
                }
                if (this.actionsLog.length === 0 && this.isHistoryFull) {
                  this.isModified = false;
                }
                if (record) {
                  //this.block.manual_boundaries = record.manual_boundaries ? record.manual_boundaries.slice() : [];
                  //this.setAudio(record.audio, record.text, false);
                  this.$root.$emit('from-audioeditor:undo', this.blockId, record.audio, record.text, this.isModified);
                }
              })
          } else if (this.mode === 'file') {
            return this.pause()
              .then(() => {
                if (this.origFilePositions) {
                  //this.selection = this.origFilePositions;
                  //this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  //this._showSelectionBorders();
                  if (this.origFilePositions.start == this.selection.end) {
                    this.setSelectionEnd(this.origFilePositions.end);
                  }
                  this.setSelectionStart(this.origFilePositions.start)
                    .then(() => {
                      this.cursorPosition = this.selection.start;
                      this.setSelectionEnd(this.origFilePositions.end);
                    });
                }
              });
          }
        },
        undoLocal() {
          this.audioTasksQueue.log.pop();
          this.popTaskQueue();
          this._popHistoryLocal();
        },
        discard() {
          this.setProcessRun(true, '');
          this.$root.$emit('from-audioeditor:discard', this.blockId);
          this._setDefaults();
          this.hideModal('onDiscardMessage');
        },
        discardAndExit() {
          //this.discardOnExit = true;
          //this.hideModal('onExitMessage');
          //return this.isPlaying ? this.pause() : Promise.resolve()
            //.then(() => {
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
                let promise = Promise.resolve();
                let event = {};
                event.waitUntil = p => promise = p;
                this.$root.$emit('from-audioeditor:closed', event);
                this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
                promise.then(() => {
                  let load = this.pendingLoad;
                  this.pendingLoad = null;
                  this._setDefaults();
                  this.setProcessRun(false);
                  this.load(...load);
                });
              } else {
                this.close();
              }
            //})
        },
        checkExitState() {
          //this.hideModal('onExitMessage');
          this.$root.$emit('from-audioeditor:close-cancelled');
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
          this.wordSelectionMode = false;
          this.isModified = false;
          this.isAudioModified = false;
          this.history = [];
          this.actionsLog = [];
          this.isPlaying = false;
          this.isPaused = false;
          this.origFilePositions = {};
          //this.hideModal('onExitMessage');
          if (this.pendingLoad) {
            this.setProcessRun(true, 'loading');
          } else {
            if (this.plEventEmitter) {
              this.plEventEmitter.emit('clear');
            }
          }
        },
        showModal(name) {
          this.$modal.show(name);
        },
        showOnExitMessage() {
          return this.pause()
            .then(() => {
              this.$root.$emit('show-modal', {
                title: 'Unsaved Changes',
                text: `Block audio has been modified and not saved.<br>
    Discard unsaved audio changes?`,
                buttons: [
                  {
                    title: 'Cancel',
                    handler: () => {
                      this.$root.$emit('hide-modal');
                      this.checkExitState();
                    },
                    class: ['btn btn-default']
                  },
                  {
                    title: 'Discard',
                    handler: () => {
                      this.$root.$emit('hide-modal');
                      this.discardAndExit();
                    },
                    class: ['btn btn-primary']
                  }
                ]
              });
            });
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
        _showSelectionBordersOnClick(ev) {
          ev.preventDefault();
          window.requestAnimationFrame(() => {
            if (ev.button && ev.button === 2 && (typeof this.selection.start !== 'undefined' || typeof this.selection.end !== 'undefined')) {
              this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
            }
          });
          //this._showSelectionBorders(false);
          return false;
        },
        _showSelectionBorders(scroll_to_selection = false, skip_when_hidden = false) {
          return new Promise((resolve, reject) => {
            //setTimeout(() => {
              //let selection = $('.selection.segment')[0];
              if ((this.selection.start >= 0 && this.selection.start !== null) || (this.selection.end >= 0 && this.selection.end !== null)) {
                //$('[id="resize-selection-right"]').show().css('left', selection.offsetLeft + selection.offsetWidth - 2);
                let pixelsPerSecond = this.getPixelsPerSecond();
                let setRight = null;
                let setLeft = null;
                if (this.dragRight) {
                  if (skip_when_hidden) {
                    if (this.dragRight.element.style.display === 'none') {
                      return resolve();
                    }
                  }
                  //$('[id="resize-selection-right"]').show();
                  setRight = this._round(this.selection.end / pixelsPerSecond - 1, 1);
                }
                //$('[id="resize-selection-left"]').show().css('left', selection.offsetLeft < 0 ? 0 : selection.offsetLeft);
                if (this.dragLeft) {
                  //$('[id="resize-selection-left"]').show();
                  setLeft = this._round(this.selection.start / pixelsPerSecond - 1, 1);
                }
                //this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                console.log('show borders:', setRight, setLeft);
                if (setLeft !== null) {
                  console.log('show borders: left');
                  //this.dragLeft.stop();
                  this.setDragLeftPosition(setLeft);
                }
                if (setRight !== null) {
                  console.log('show borders: right');
                  this.setDragRightPosition(setRight);
                }
                this.selectionBordersVisible = true;
              } else {
                //$('[id="resize-selection-right"]').hide().css('left', 0);
                //$('[id="resize-selection-left"]').hide().css('left', 0);
                this.setDragRightPosition(null);
                this.setDragLeftPosition(null);
                this.selectionBordersVisible = false;
              }
              if (scroll_to_selection) {
                this._scrollToCursor();
              }
              return resolve();
            //}, 50);
          })
        },
        setDragLeftPosition(position) {
          if (this.dragLeft) {
            //this.dragLeft.set(position === null ? 0 : position, 0);
            //$('[id="resize-selection-left"]').css('left', setLeft);
            this.dragLeft.element.style.left = position !== null ? `${position}px` : '0px';
            this.dragLeft.element.style.display = position !== null ? 'block' : 'none';
            console.log('left set', position);
          }
        },
        setDragRightPosition(position) {
          if (this.dragRight) {
            //this.dragRight.set(position !== null ? position : 0, 0);
            //$('[id="resize-selection-right"]').css('left', setRight);
            this.dragRight.element.style.left = position !== null ? `${position}px` : '0px';
            this.dragRight.element.style.display = position !== null ? 'block' : 'none';
            console.log('right set', position);
          }
        },
        _scrollToCursor() {
          if (this.cursorPosition && this.cursorPosition > 0) {
            let position = this.cursorPosition / (this.audiosourceEditor.samplesPerPixel / this.audiosourceEditor.sampleRate);
            $('.cursor').css('left', position + 'px');
            let interval = setInterval(() => {
              if (typeof $('.cursor').position() !== 'undefined') {
                $('.playlist-tracks').scrollLeft($('.cursor').position().left - ($('.playlist-tracks')[0].offsetWidth / 2));
                clearInterval(interval);
              }
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
          if (this.wordSelectionMode === false) {
            this.$root.$emit('from-audioeditor:select', this.blockId, []);
            $('.annotations-boxes .annotation-box').removeClass('selected');
          }
        },
        _setWordSelection(index, select_range, autoplay = false) {
          if (this.wordSelectionMode !== false && this.wordSelectionMode !== index) {
            return;
          }
          select_range = typeof select_range == 'undefined' ? false : select_range;
          this._clearWordSelection();
          let annotations = $('.annotations-boxes .annotation-box');
          if (annotations[index]) {
            $(annotations[index]).addClass('selected');
          }
          this.$root.$emit('from-audioeditor:select', this.blockId, [index]);
          if (select_range) {
            let word = this.words.find(_w => {
              return _w.alignedIndex == index;
            });
            if (word) {
              this.stop().then(() => {
                let r_start = this._round(word.start, 2);
                let r_end = this._round(word.end, 2);
                if (r_start !== this._round(this.selection.start, 2) || r_end !== this._round(this.selection.end, 2)) {
                  this.plEventEmitter.emit('select', word.start, word.end);
                }
                Vue.nextTick(() => {
                  this._showSelectionBorders()
                    .then(() => {
                      if (autoplay) {
                        this.cursorPosition = false;
                        this.forceCleanupSource();
                        Vue.nextTick(() => {
                          this.play();
                        });
                      }
                    });
                });
              });
            }
          }
        },
        _drawWordSelection() {
          
          let word = this.words.find(_w => {
            return _w.alignedIndex === this.wordSelectionMode;
          });
          if (word) {
            let r_start = this._round(word.start, 2);
            let r_end = this._round(word.end, 2);
            this.selection.start = r_start;
            this.selection.end = r_end;
            this.cursorPosition = r_start;
            this._showSelectionBorders();
            let selectedAnnotation = document.querySelector('.annotations-boxes .annotation-box.selected');
            if (selectedAnnotation) {
              selectedAnnotation.classList.remove('selected');
            }
            let annotation = document.querySelectorAll('.annotations-boxes .annotation-box')[this.wordSelectionMode];
            if (annotation) {
              annotation.classList.add('selected');
            }
          }
        },
        forceCleanupSource() {
          if (this.audiosourceEditor && this.audiosourceEditor.tracks && this.audiosourceEditor.tracks[0] && this.audiosourceEditor.tracks[0].playout && this.audiosourceEditor.tracks[0].playout.source) {
            onSourceEnded.call(this.audiosourceEditor.tracks[0].playout);
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
          if (this._round(new_selection.start, 2) == this._round(new_selection.end, 2) && field == 's') {
            switch (part) {
              case 'start':
                new_selection.end+= 0.01;
                if (new_selection.end > this._round(this.audiosourceEditor.activeTrack.duration, 2)) {
                  return;
                }
                break;
              case 'end':
                new_selection.start-= 0.01;
                if (new_selection.start < 0) {
                  return;
                }
                break;
            }
            new_selection.end = this._round(new_selection.end, 2);
            new_selection.start = this._round(new_selection.start, 2);
          }
          if (new_selection.start >= 0 && new_selection.start < new_selection.end) {
            this.clearFadeSelectionLog();
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
        _addHistory(text, audio, manual_boundaries) {
          this.history.push({
            text: text,
            audio: audio,
            manual_boundaries: manual_boundaries
          });
          if (this.history.length >= 6) {
            this.history.shift();
            this.isHistoryFull = false;
          }
        },
        _addHistoryLocal(type, range, start, end, additional = {}) {
          let record = {
            type: type,
            range: range,
            selection: {
              start: start,
              end: end
            },
            annotations: [],
            additional: additional
          };
          this.audiosourceEditor.annotationList.annotations.forEach(an => {
            record.annotations.push(Object.assign({}, an));
          });
          if (type === 'manual_boundaries') {
            record.annotations.forEach((an, i) => {
              an.start = record.additional.oldMap[i].start;
              an.end = record.additional.oldMap[i].end;
            });
          }
          this.actionsLog.push(record);
          if (this.actionsLog.length >= 6) {
            this.actionsLog.shift();
            this.isHistoryFull = false;
          }
        },
        _clearHistoryLocal() {
          this.actionsLog = [];
          this.isHistoryFull = true;
        },
        _popHistory() {
          return this.history.pop();
        },
        _popHistoryLocal(redraw = true) {
          let record = this.actionsLog.pop();
          if (record) {
            this.audiosourceEditor.annotationList.annotations = [...record.annotations];
            this.words = [];
            this.audiosourceEditor.annotationList.annotations.forEach((an, i) => {
              this.words.push({
                start: an.start,
                end: an.end,
                index: i,
                alignedIndex: i
              });
            });
            if (redraw) {
              switch (record.type) {
                case 'cut':
                  this.insertRangeAction(record.selection.start, record.range, record.selection.end - record.selection.start);
                  break;
                case 'insert_silence':
                  if (record.range[1].range && record.range[1].range.length) {
                    this.cutRangeAction(record.range[1].start, record.range[1].end);
                    this.insertRangeAction(record.range[1].start, record.range[1].range, record.range[1].length);
                  }
                  this.cutRangeAction(record.selection.start, record.selection.end);
                  if (record.range[0].range && record.range[0].range.length) {
                    this.cutRangeAction(record.range[0].start, record.range[0].end);
                    this.insertRangeAction(record.range[0].start, record.range[0].range, record.range[0].length);
                  }
                  break;
                case 'erase':
                  this.cutRangeAction(record.selection.start, record.selection.end);
                  this.insertRangeAction(record.selection.start, record.range, record.selection.end - record.selection.start);
                  break;
                case 'manual_boundaries':
                  if (record.additional && record.additional.shifted && record.additional.oldMap) {
                    record.additional.shifted.forEach(sw => {
                      let oldMap = record.additional.oldMap.shift();
                      if (oldMap) {
                        this.audiosourceEditor.annotationList.annotations[sw.index].start = oldMap.start;
                        this.audiosourceEditor.annotationList.annotations[sw.index].end = oldMap.end;
                      }
                    });
                    $(`.annotation-box`).find(`.resize-handle`).removeClass('manual');
                    if (Array.isArray(record.additional.manual_boundaries)) {
                      record.additional.manual_boundaries.forEach(mb => {
                        this.audiosourceEditor.annotationList.annotations.forEach((an, i) => {
                          //console.log(mb, an);
                          let position = this._round(parseInt(mb) / 1000, 2);
                          if (Math.abs(an.start - position) <= 0.02) {
                            $($(`.annotation-box`)[i]).find(`.resize-handle.resize-w`).addClass('manual');
                          } else if (Math.abs(an.end - position) <= 0.02) {

                            $($(`.annotation-box`)[i]).find(`.resize-handle.resize-e`).addClass('manual');
                          }
                        })
                        /*let position = this._round(parseInt(mb) / 1000, 2);
                        self.audiosourceEditor.annotationList.annotations.forEach((al, index) => {
                          if (Math.abs(al.start - position) <= 0.02) {
                            $(`.annotation-box[data-index="${index}"] .resize-handle.resize-w`).addClass('manual');
                          }
                          if (Math.abs(al.end - position) <= 0.02) {
                            $(`.annotation-box[data-index="${index}"] .resize-handle.resize-e`).addClass('manual');
                          }
                        });*/
                      });
                    }
                    //this.audiosourceEditor.renderAnnotations();
                    //this.audiosourceEditor.activeTrack.setCues(0, this.audiosourceEditor.duration);
                    //this.audiosourceEditor.activeTrack.calculatePeaks(this.audiosourceEditor.samplesPerPixel, this.audiosourceEditor.sampleRate);
                    this.audiosourceEditor.drawRequest();
                  }
                  break;
                case 'unpin_right':
                  if (record.additional.unpinned_indexes) {
                    record.additional.unpinned_indexes.start.forEach(i => {
                      $($(`.annotation-box`)[i]).find(`.resize-handle.resize-w`).addClass('manual');
                    });
                    record.additional.unpinned_indexes.end.forEach(i => {
                      $($(`.annotation-box`)[i]).find(`.resize-handle.resize-e`).addClass('manual');
                    });
                  }
                  break;
                case 'fade':
                  this.cutRangeAction(record.selection.start, record.selection.end);
                  this.insertRangeAction(record.selection.start, record.range, record.selection.end - record.selection.start);
                  break;
              }
            } else {
              this.audiosourceEditor.renderAnnotations();
            }
          }
          //this.audiosourceEditor.annotationList.annotations.forEach(an => {
            //record.annotations.push(Object.assign({}, an));
          //});
          if (record.additional.hasOwnProperty('recording_pauses')) {
            this.recordingPauses = record.additional.recording_pauses || [];
            this.showRecordingPauses();
            //let block = this.audioTasksQueueBlockOrPart();
            //block.recording_pauses = this.recordingPauses;
          }
          return record;
        },
        _setSelectionOnWaveform(start = null, end = null) {
          let s_start = start === null ? this.selection.start : start;
          let s_end = end === null ? this.selection.end : end
          if (this.selection && typeof s_start !== 'undefined' && typeof s_end !== 'undefined' && this.plEventEmitter && !isNaN(s_start)) {
            this.plEventEmitter.emit('select', s_start, s_end);
            this._showSelectionBorders();
          }
        },
        _setText(text, block, saveToHistory = false) {
          if (this.wordRepositioning) {
            return false;
          }
          if (saveToHistory && this.content && this.audiofile) {
            this.isModified = true;
            //this._addHistory(this.content, this.audiofile, block.manual_boundaries ? this.block.manual_boundaries.slice() : []);
            //this._addHistoryLocal('manual_boundaries');
          }
          this.content = text;
          let self = this;
          let annotations = [];
          let alignedWords = 0;
          this.words = [];
          let textRg = new RegExp('<w.*?data-map="([^"]+)"[^>]*>(.*?)<\\/w>', 'mig');
          let match;
          let tokens = [];
          let currentLength = 0;
          text = text.replace(/[\r\n]/img, '');// remove line breaks for clear regular expressions
          //text = text.replace(/<sg\s*?data-suggestion(\=\"\")?(\s*data-sugg)?>[\s\S]+?<\/sg>/img, '');// clear empty suggestion
          let parser = new DOMParser();
          let doc = parser.parseFromString(text, "text/html");
          doc.querySelectorAll('sg').forEach(sg => {
            if (sg.dataset && (!sg.dataset.suggestion || sg.dataset.suggestion.length === 0)) {
              text = text.replace(sg.toString(), '');
            }
          });
          //text = $('<textarea/>').html(text).text();// remove html entities
          while((match = textRg.exec(text))) {
            let word = match[2];
            if (currentLength < match.index) {
              let addPart = text.substr(currentLength, match.index - currentLength);
              if ((closeBracketsRegex.test(addPart) || closeQuotesRegex.test(addPart)) && annotations.length > 0) {
                annotations[annotations.length - 1].id+= $('<textarea/>').html(addPart.replace(/<\/?[^>]+?>/img, '')).text();
              } else {
                word = addPart + word;
              }
            }
            word = $('<textarea/>').html(word.replace(/<[^>]+?>/img, '')).text().replace(this.coupletSeparator, '');
            currentLength = match.index + match[0].length;
            let map = match[1] && match[1].indexOf(',') !== -1 ? match[1].split(',') : [0, 0]
            map[0] = this._round(parseInt(map[0]) / 1000, 2);
            map[1] = this._round(parseInt(map[1]) / 1000 + map[0], 2)
            annotations.push({
              "begin": map[0],
              "children": [],
              "end": map[1],
              "id":word,
              "language": "eng",
              "lines": []
            });
            this.words.push({start: map[0], end: map[1], index: this.words.length, alignedIndex: alignedWords++});
          }
          this.contentContainer = $('#content-' + this.blockId);
          if (this.contentContainer.length == 0) {
            this.contentContainer = $('#' + this.blockId);//footnote
          }
          //console.log(self.audiosourceEditor.annotationList.renderResizeLeft);
          if (this.audiosourceEditor && this.audiosourceEditor.getEventEmitter().__ee__ && this.audiosourceEditor.getEventEmitter().__ee__['dragged']) {
            this.audiosourceEditor.getEventEmitter().off('dragged', this.audiosourceEditor.getEventEmitter().__ee__['dragged']);
          }
          if (this.audiosourceEditor) {
            //annotations = annotations.splice(annotations.length - 10);
            this.annotations = annotations;
            this.audiosourceEditor.setAnnotations({
                annotations: annotations,
                editable: true,
                isContinuousPlay: false,
                linkEndpoints: true
              });
            this.fixMap();
            $('.resize-handle').removeClass('manual');
            let waitAnnotations = setInterval(() => {
              if ($('.annotation-box').length > 0) {
                clearInterval(waitAnnotations);
                if (block && block.manual_boundaries && block.manual_boundaries.length > 0) {
                  $('.annotation-box').each(function(index) {// set indexes for manual class
                    $(this).attr('data-index', index);
                  });
                  block.manual_boundaries.forEach(mb => {
                    let position = this._round(parseInt(mb) / 1000, 2);
                    self.audiosourceEditor.annotationList.annotations.forEach((al, index) => {
                      if (Math.abs(al.start - position) <= 0.02) {
                        $(`.annotation-box[data-index="${index}"] .resize-handle.resize-w`).addClass('manual');
                      }
                      if (Math.abs(al.end - position) <= 0.02) {
                        $(`.annotation-box[data-index="${index}"] .resize-handle.resize-e`).addClass('manual');
                      }
                    });
                  });
                }
                /*document.querySelectorAll('.waveform-wrapper .annotations span.id').forEach((annotation) => {
                  //annotation.removeEventListener('click', annotation.onclick);
                  //console.log(annotation.onclick)
                  let annotationCopy = annotation.cloneNode(true);
                  annotation.parentNode.replaceChild(annotationCopy, annotation);
                  annotation.remove();
                });*/
              }
            }, 100);
            
//            let targetNode = document.querySelector('.waveform-wrapper');
//            let observer = new MutationObserver((mutationList) => {
//              console.log(mutationList)
//              let addedAnnotations = targetNode.querySelector('.annotations-boxes');
//              if (addedAnnotations) {
//                console.log('ANNOTATIONS2');
//                observer.disconnect();
//                let observerClick = new MutationObserver((clickMutations) => {
//                  console.log(clickMutations)
//                  console.log('ANNOTATIONS3');
//                  Vue.nextTick(() => {
//                    document.querySelectorAll('.waveform-wrapper .annotations span.id').forEach((annotation) => {
//                      //annotation.removeEventListener('click', annotation.onclick);
//                      console.log(annotation.onclick)
//                      let annotationCopy = annotation.cloneNode(true);
//                      annotation.parentNode.replaceChild(annotationCopy, annotation);
//                      annotation.remove();
//                    });
//                  });
//                });
//                observerClick.observe(addedAnnotations, { attributes: true, /*attributeOldValue: true,*/ subtree: true/*, childList: true*/ });
//              }
//            });
//            observer.observe(targetNode, { /*attributes: true, attributeFilter: ['onclick'],*/ subtree: true, childList: true });
            
            if (this.audiosourceEditor.annotationList.annotations.length > 0) {
              $('.annotation-box').each(function(i, el) {
                if(typeof annotations[i] !== 'undefined') {
                  // workaround, waveform editor does not update text in annotations by annotations change
                  el.querySelector('span.id').innerText = annotations[i].id;
                }
              });
              //$('.channel-wrapper.block-audio').scroll();
            }
          }
            //self.audiosourceEditor.annotationList.renderResizeLeft(annotations.length - 1);
          $('.channel-wrapper.block-audio').trigger('scroll');
          $('.playlist-tracks').scrollLeft(0);
          $('.playlist-tracks').scrollLeft(this.playlistScrollPosition || 0);
          Vue.nextTick(() => {
            this.audiosourceEditor.annotationList.resizeHandlers.forEach((rh, i) => {
              /*this.audiosourceEditor.annotationList.resizeHandlers[i].ondragover = (e) => {

              }*/
              //console.log(rh.playlist.ee)
              if (Array.isArray(rh.playlist.ee.__ee__.dragged)) {
                rh.playlist.ee.__ee__.dragged.forEach((dr, drI) => {
                  rh.playlist.ee.off('dragged', dr)
                })
              }
              rh.playlist.ee.on('dragged', (deltaTime, data, ev) => {
                if ((data.direction === 'left' && data.index == 0) ||
                        (data.direction === 'right' && data.index == this.annotations.length - 1)) {
                  return;
                }
                var annotationIndex = data.index;
                var annotations = this.audiosourceEditor.annotationList.annotations;
                var note = annotations[annotationIndex];
                /*$('.annotation-resize-pos').show();
                $('.annotation-resize-pos').css('left', (e.clientX - 10) + 'px');// show resize marker
                var deltaTime = deltaX * this.audiosourceEditor.samplesPerPixel / this.audiosourceEditor.sampleRate;*/

                // resizing to the left
                if (data.direction === 'left') {
                  var originalVal = note.start;
                  note.start += deltaTime;

                  if (note.start < 0) {
                    note.start = 0;
                  }

                  if (annotationIndex && annotations[annotationIndex - 1].end > note.start) {
                    annotations[annotationIndex - 1].end = note.start;
                  }

                  if (annotationIndex && annotations[annotationIndex - 1].end === originalVal) {
                    annotations[annotationIndex - 1].end = note.start;
                  }
                } else {
                  // resizing to the right
                  var _originalVal = note.end;
                  note.end += deltaTime;

                  if (note.end > this.audiosourceEditor.duration) {
                    note.end = this.audiosourceEditor.duration;
                  }

                  if (annotationIndex < annotations.length - 1 && annotations[annotationIndex + 1].start < note.end) {
                    annotations[annotationIndex + 1].start = note.end;
                  }

                  if (annotationIndex < annotations.length - 1 && annotations[annotationIndex + 1].start === _originalVal) {
                    annotations[annotationIndex + 1].start = note.end;
                  }
                }
              });
            });
          });
          //this.$forceUpdate();
        },
        _isAnnotationsEditable() {
          return (!this.currentBookMeta.masteringRequired || this.currentBookMeta.isMastered) ||
                  (this.block && this.block.voicework === 'tts' ||
                  (this.block && this.block.status && this.block.status.proofed === false && this.tc_hasTask('audio_mastering') && this.block.status.stage === 'audio_mastering'));
        },
        _setBlocksSelection() {
          if (this.blockSelection && ((this.blockSelection.start && this.blockSelection.start._id) || (this.blockSelection.end && this.blockSelection.end._id)) && this.plEventEmitter) {
            let start = false;
            let end = false;
            this.selectedBlocksData.forEach(block => {
              let _start = null;
              let _end = null;
              if (block.audiocatalog_map) {
                if (block.audiocatalog_map[this.audiofileId]) {
                  _start = block.audiocatalog_map[this.audiofileId].start / 1000;
                  _end = block.audiocatalog_map[this.audiofileId].end / 1000;
                }
              } else if (this.blockMap[block.blockid]) {
                _start = parseInt(this.blockMap[block.blockid][0])/1000;
                _end = parseInt(this.blockMap[block.blockid][1])/1000;
              }
              if (_start !== null || _end !== null) {
                if (start === false || _start < start) {
                  start = _start;
                }
                if (end === false || _end > end) {
                  end = _end;
                }
              }
            });

            if (start !== false && end !== false && start < end) {
              start = this._round(start, 2);
              end = this._round(end, 2);
              if (this.selection.start === start && this.selection.end === end) {
                return false;
              }
              this.selection.start = start;
              this.selection.end = end;
              let replay = this.isPlaying;
              let wait = this.isPlaying ? [this.pause()] : [];
              Promise.all(wait)
                .then(() => {
                  this.cursorPosition = this.selection.start;
                  this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  this._showSelectionBorders(true);
                  if (replay) {
                    this.play();
                  }
                })
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
          if (!e || e.button !== 2) {// check for only right button pressed
            return false;
          }
          if (e && e.buttons === 3) {// two buttons pressed
            return false;
          }
          if (this.editingLocked) {
            return false;
          }
          let replay = this.isPlaying;
          this.pause()
            .then(() => {
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
                this.$refs.waveformContext.open(e, document.querySelector('.waveform'));
                $('body').one('click', () => {
                  this.$refs.waveformContext.close();
                  this.contextPosition = null;
                });
              }
              let hasSelection = $('.selection.segment').length > 0;
              Vue.nextTick(() => {
                window.requestAnimationFrame(() => {
                  if (hasSelection) {
                    this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  }
                  if (replay) {
                    this.play();
                  }
                });
              });
          });
        },
        setSelectionStart(val, event) {
          //if (this.mode == 'file') {
            if (this.audiosourceEditor) {
              let start = val !== null ? val : (this.contextPosition + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              this.contextPosition = null;
              start = this._round(start, 2);
              if (start == this.selection.start) {
                return Promise.resolve();
              }
              if (start > this.selection.end) {
                if (this.audiosourceEditor.activeTrack && this.audiosourceEditor.activeTrack.duration) {
                  this.selection.end = this.audiosourceEditor.activeTrack.duration;
                } else {
                  return Promise.resolve();
                }
              }
              let replay = this.isPlaying;
              return new Promise((resolve, reject) => {
                if (replay) {
                  return this.pause(false)
                    .then(() => {
                      return resolve();
                    })
                }
                return resolve();
              })
                  .then(() => {
                    this.selection.start = start;
                    this.cursorPosition = this.selection.start;
                    this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                    this._showSelectionBorders();
                    this.contextPosition = null;
                    if (replay) {
                      this.play();
                    }
                    return Promise.resolve();
                  });
            } else {
              return Promise.resolve();
            }
          //}
        },
        setSelectionEnd(val, event) {
          //if (this.mode == 'file') {
            if (this.audiosourceEditor) {
              let end = val !== null ? val : (this.contextPosition + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              end = this._round(end, 2);
              if (end == this.selection.end) {
                return;
              }
              let setStart = Promise.resolve();
              if (end < this.selection.start) {
                //this.selection.start = 0;
                //this.cursorPosition = this.selection.start;
                setStart = this.setSelectionStart(0);
              }
              this.selection.end = end;
              //this.cursorPosition = this.selection.start;
              return setStart
                .then(() => {
                  let pause;
                  let replay = this.isPlaying;
                  if (replay) {
                    pause = this.pause();
                  } else {
                    pause = Promise.resolve();
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
        smoothSelection: _.debounce(function (val, oldVal) {

          if (!this.blockSelectionEmit) {
            if (typeof val.start !== 'undefined' && typeof val.end !== 'undefined') {
              if (val.start !== oldVal.start || val.end !== oldVal.end) {
                this._clearWordSelection();
                this.emitDisplayWordSelection();
              }
            }
          } else {
            this.blockSelectionEmit = false;
          }
          this.$root.$emit('from-audioeditor:selection-change', this.blockId, val.start, val.end);
          if (this.selection.end >= this.audioDuration && this.mode === 'block') {

            /*setTimeout(() => {
              let resizeRight = document.getElementById('resize-selection-right');
              if (resizeRight) {
                let win = window,
                  d = document,
                  e = d.documentElement,
                  g = d.getElementsByTagName('body')[0],
                  w = win.innerWidth || e.clientWidth || g.clientWidth;
                let offset = resizeRight.getBoundingClientRect();
                if (offset.left < w) {
                  console.log('SCROLL')
                  $('.playlist-tracks').scrollLeft($('.playlist-tracks').scrollLeft() + 100);
                }
              }
            }, 500);*/
          }
        }, 30),

        smoothDrag:_.debounce(function (ev) {
          if (this.editingLocked) {
            return false;
          }
          let moveIndex = $('.annotations-boxes .annotation-box .resize-handle').index(ev.target);
          let oldMap = [];
          this.words.forEach(w => {
            oldMap.push(Object.assign({}, w));
          });
          $('.annotation-resize-pos').remove();// hide resize marker
          if (!this._isAnnotationsEditable()) {
            this.showModal('onWordRepositionMessage');
          }
          let map = [];
          let direction = '';

          let shiftedAnnotation = null;
          let shiftedIndex = null;
          if (moveIndex === 0 || moveIndex === this.annotations.length * 2 - 1) {// do not pin first and last
            return;
          }

          this.audiosourceEditor.annotationList.annotations.forEach((al, i) => {// find the shifted annotation, find shift direction
            if (this.annotations[i]) {
              if (!shiftedAnnotation && this._round(this.annotations[i].begin, 2) == this._round(al.start, 2) && this._round(this.annotations[i].end, 2) != this._round(al.end, 2)) {
                direction = this.annotations[i].end > al.end ? 'left' : 'right';
                if (direction === 'left') {
                  shiftedAnnotation = Object.assign({}, al);
                  shiftedIndex = i;
                } else if (direction === 'right') {
                  let next = this.audiosourceEditor.annotationList.annotations[i + 1];
                  if (next) {
                    shiftedAnnotation = Object.assign({}, next);
                    shiftedIndex = i + 1;
                  }
                }
              }
              this.annotations[i].begin = al.start;
              this.annotations[i].end = al.end;
            }
          });
          console.log('drag', shiftedIndex);
          let shifted = false;
          //console.log(this.audiosourceEditor.annotationList.annotations[8].start, this.audiosourceEditor.annotationList.annotations[8].end);
          //console.log(this.annotations[8].begin, this.annotations[8].end);
          let length = 0;
          //let shift = 0;
          this.annotations.forEach((an, i) => {// fix annotations, avoid spaces between word positions
            if (length > an.begin) {
              //console.log(an.begin, 'overlapped by ', this.annotations[i - 1]);
              an.begin = length;
              //if (this._round(an.end - an.begin) < this.minWordSize) {
                //shift = this._round(this.minWordSize)
              //}
            } else if (length < an.begin) {
              //console.log('HERE LESS', length, an.begin)
              an.begin = length;
            }
            length = an.end;
          });

          this.annotations.forEach((an, i) => {
            //console.log(an);
            //this._addHistory(this.content, this.audiofile, this.block.manual_boundaries ? this.block.manual_boundaries.slice() : []);
            if (this._round(an.end - an.begin, 2) < this.minWordSize) {// find words with length less than minimum
              //console.log('MIN WORD SIZE', an.begin, an.end, an.id);
              let shift = this.minWordSize - (an.end - an.begin);
              //console.log(shift);
              let found = false;
              let shiftIndexes = [];
              switch (direction) {
                case 'left':
                  this.annotations[i].begin-= shift;
                  let j = i - 1;
                  do {
                    if (this.annotations[j]) {
                      this.annotations[j].end-=shift;
                      if (this.annotations[j].end - this.annotations[j].begin >= this.minWordSize) {
                        shifted = true;
                      } else {
                        shift = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].begin-= shift;
                      }
                    }
                    --j;
                  } while (j >= 0 && !shifted);
                  shifted = true;
                  shift = 0;
                  for (j = 0; j <= i + 2; ++j) {// if some words start is before zero, shift all words
                    if (this.annotations[j]) {
                      if (this.annotations[j].begin < 0) {
                        if (shift == 0) {
                          shift+= -1 * (this.annotations[j].begin);
                        }
                        this.annotations[j].begin+=shift;
                        this.annotations[j].end+=shift;
                      }
                      else if (this.annotations[j].end - this.annotations[j].begin - shift >= this.minWordSize) {
                        this.annotations[j].begin+= shift;
                        shift = 0;
                      } else {
                        let diff = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].begin+=shift;
                        shift = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].end+=shift;
                      }
                    }
                  }
                  break;
                case 'right':
                  this.annotations[i].end+= shift;
                  j = i + 1;
                  do {
                    if (this.annotations[j]) {
                      this.annotations[j].begin+=shift;
                      if (this.annotations[j].end - this.annotations[j].begin >= this.minWordSize) {
                        shifted = true;
                      } else {
                        shift = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].end+= shift;
                      }
                    }
                    ++j;
                  } while (j < this.annotations.length && !shifted);
                  shifted = true;
                  shift = 0;
                  for (j = this.annotations.length; j >= i - 2; --j) {// if some words end if after audio finish, shift all words
                    if (this.annotations[j]) {
                      if (this.annotations[j].end > this.audiosourceEditor.duration) {
                        if (shift == 0) {
                          shift+= this.annotations[j].end - this.audiosourceEditor.duration;
                        }
                        this.annotations[j].begin-=shift;
                        this.annotations[j].end-=shift;
                      }
                      else if (this.annotations[j].end - this.annotations[j].begin - shift >= this.minWordSize) {
                        this.annotations[j].end-= shift;
                        shift = 0;
                      } else {
                        this.annotations[j].end-=shift;
                        shift = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].begin-=shift;
                      }
                    }
                  }
                  break;
              }
            }
          });
          this.annotations.forEach((al, i) => {
            map.push([Math.round(al.begin * 1000), Math.round((al.end - al.begin) * 1000)]);
            //console.log(i, ':', map[i][0], map[i][1]);
            if (map[i - 1] && map[i - 1][0] + map[i - 1][1] != map[i][0]) {
              //console.log('FIX MAP', map[i - 1][0] + map[i - 1][1], map[i][0], al);
              map[i][0] = map[i - 1][0] + map[i - 1][1];
            }
            let w = this.words.find(_w => {
              return _w.alignedIndex == i;
            });
            if (w) {
              w.start = this._round(al.begin, 2);
              w.end = this._round(al.end, 2);
              if (i === shiftedIndex) {
                console.log('drag word', w.start, w.end);
              }
            }
          });
          if (shifted) {
            this.annotations.forEach((al, i) => {
              this.audiosourceEditor.annotationList.annotations[i].start = al.begin;
              this.audiosourceEditor.annotationList.annotations[i].end = al.end;
            });
          }
          this.audiosourceEditor.drawRequest();
          let shiftedWords = [];
          let index = parseInt(moveIndex / 2);
          let pinnedIndex = null
          if (moveIndex % 2 === 1) {
            //shiftedWords.push({index: index, map: map[index]});
            //shiftedWords.push({index: index + 1, map: map[index + 1]});
            pinnedIndex = index + 1;
          } else {
            //shiftedWords.push({index: index - 1, map: map[index - 1]});
            //shiftedWords.push({index: index, map: map[index]});
            pinnedIndex = index;
          }
          map.forEach((m, i) => {
            shiftedWords.push({index: i, map: m});
          });
          let shiftedOldMap = [];
          shiftedWords.forEach(sw => {
            shiftedOldMap.push(oldMap[sw.index]);
          })
          let queueBlock = this.audioTasksQueueBlockOrPart();
          this._addHistoryLocal('manual_boundaries', null, null, null, {
            shifted: shiftedWords,
            oldMap: shiftedOldMap,
            manual_boundaries: queueBlock ? queueBlock.manual_boundaries : []
          });
          //if (this.audioTasksQueue.queue.length > 0) {
            //console.log(shiftedWords.slice());
            this.addTaskQueue('manual_boundaries', [shiftedWords.slice(), pinnedIndex, this.blockId]);
            //$($(`.annotation-box`)[shiftedWords[pinnedIndex].index]).find(`.resize-handle.resize-w`).addClass('manual');

            //$($(`.annotation-box`)[shiftedWords[pinnedIndex - 1].index]).find(`.resize-handle.resize-e`).addClass('manual');
          //} else {
            //this.$root.$emit('from-audioeditor:word-realign', shiftedWords, pinnedIndex, this.blockId);
          //}
          this.isModified = true;
          if (this.wordSelectionMode !== false) {
            if (shiftedIndex === this.wordSelectionMode ||
                    (shiftedIndex - 1 === this.wordSelectionMode && direction === 'right') ||
                    (shiftedIndex + 1 === this.wordSelectionMode && direction === 'left')) {
              Vue.nextTick(() => {
                console.log('select on drag');
                this._setWordSelection(this.wordSelectionMode, true, true);
              });
            }
          }
        }, 30),

        setProcessRun(val, type) {
          this.processRun = val;
          this.processRunType = type;
          if (val) {
            if (this.mode === 'block' && ['save', 'align'].indexOf(type) !== -1) {
              this._clearHistoryLocal();
            }
            this.$root.$emit('preloader-toggle', true, type);
          } else {
            if (this.pendingLoad) {
              this.load(...this.pendingLoad);
            } else {
              this.$root.$emit('preloader-toggle', false, '');
            }
          }
        },

        flush() {
          this.isModified = false;
          this.setProcessRun(false);
        },

        unpinRight(event) {
          let position = (this.contextPosition + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
          let unpinned_indexes = {start: [], end: []};
          let unpin = 0;
          this.audiosourceEditor.annotationList.annotations.forEach((al, i) => {
            let resize_w = $($(`.annotation-box`)[i]).find(`.resize-handle.resize-w.manual`);
            if (al.start >= position && resize_w.length > 0) {
              unpinned_indexes.start.push(i);
              resize_w.removeClass('manual');
              ++unpin;
            }
            let resize_e = $($(`.annotation-box`)[i]).find(`.resize-handle.resize-e.manual`);
            if (al.end >= position && resize_e.length > 0) {
              unpinned_indexes.end.push(i);
              resize_e.removeClass('manual');
              ++unpin;
            }
          });

          if (unpin > 0) {
            this._addHistoryLocal('unpin_right', null, null, null, {unpinned_indexes: unpinned_indexes});
            this.addTaskQueue('unpin_right', [position * 1000]);
            this.isModified = true;
          }
          //this.$root.$emit('from-audioeditor:unpin-right', position * 1000, this.blockId);
        },
        revert(warn = false) {
          if (this.isRevertDisabled) {
            return false;
          }
          if (warn) {
            this.$root.$emit('show-modal', {
              title: '<b>Revert block audio</b>',
              text: `Changes to the audio will be lost, including saved changes.<br>
Revert to original block audio?`,
              buttons: [
                {
                  title: 'Cancel',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                  },
                },
                {
                  title: 'Revert',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                    this.revert(false);
                  },
                  'class': 'btn btn-primary'
                }
              ],
              class: ['align-modal']
            });
          } else {
            let pause;
            if (this.isPlaying) {
              pause = this.pause();
            } else {
              pause = new Promise((res, rej) => {res()});
            }
            return this.pause()
              .then(() => {
                //this._setDefaults();
                /*this.words = [];
                this.currentWord = null;
                this.origFilePositions = {};
                this.isPlaying = false;
                this.isPaused = false;*/
                this.selection = {};
                this.wordSelectionMode = false;
                this.isModified = false;
                this.isAudioModified = false;
                this.history = [];
                this.actionsLog = [];
                this.cursorPosition = false;
                this._clearWordSelection();
                this.scrollPlayerToAnnotation(0);
                //$('.playlist-tracks').scrollLeft(0);
                this.pausedAt = null;
                return Promise.resolve();
              })
              .then(() => {

                this.$root.$emit('from-audioeditor:revert', this.blockId);
              });
          }
        },
        emitDisplayWordSelection() {
          if (!this.isSinglePointSelection && typeof this.selection.start !== 'undefined' && typeof this.selection.end!== 'undefined') {
            let list = [];
            if (this.wordSelectionMode !== false) {
              list.push(this.wordSelectionMode);
            } else {
              this.audiosourceEditor.annotationList.annotations.every((al, i) => {
                if ((al.start >= this.selection.start && al.start <= this.selection.end) || (al.end >= this.selection.start && al.end <= this.selection.end) || (al.start < this.selection.start && al.end > this.selection.end)) {
                  list.push(i);
                }
                if (al.start > this.selection.end) {
                  return false;
                }
                return true;
              });
            }
            this.$root.$emit('from-audioeditor:select', this.blockId, list);
          }
        },
        setEditingLocked(isLocked, reason = '') {
          this.$root.$emit('from-audioeditor:lock', isLocked,reason);
          this.editingLocked = isLocked;
          if (isLocked) {
            this.editingLockedReason = reason;
          } else {
            this.editingLockedReason = '';
          }
        },
        initDragSelection() {
          let dragDropInterval = setInterval(() => {
            if ($('.waveform .selection').length > 0) {
              clearInterval(dragDropInterval);
              $('.waveform .selection').after('<div id="resize-selection-right" class="resize-selection"></div>').after('<div id="resize-selection-left" class="resize-selection"></div>').after('<div id="cursor-position" class="cursor-position"></div>').after('<div id="context-position" class="context-position"></div>');
              if (this.cursorPosition) {//reset cursor position
                let cp = this.cursorPosition;
                this.cursorPosition = 0;
                Vue.nextTick(() => {
                  this.cursorPosition = cp;
                });
              }
              Vue.nextTick(() => {
                $('[id="resize-selection-left"]').hide();
                $('[id="resize-selection-right"]').hide();
                if (!isNaN(this.selection.start)) {
                  $('[id="resize-selection-left"]').show();
                  //$('[id="resize-selection-left"]').css({'left': this.selection.start / this.getPixelsPerSecond() + 'px'});
                  this.dragLeft.set(this.selection.start / this.getPixelsPerSecond(), 0);
                }
                if (!isNaN(this.selection.end)) {
                  $('[id="resize-selection-right"]').show();
                  //$('[id="resize-selection-right"]').css({'left': this.selection.end / this.getPixelsPerSecond() + 'px'});
                  this.dragRight.set(this.selection.end / this.getPixelsPerSecond(), 0);
                }
                if (this.wordSelectionMode) {
                  this._setWordSelection(this.wordSelectionMode, true, false);
                }
              });
              this.dragRight = new Draggable (document.getElementById('resize-selection-right'), {

                limit: this.calculateDragLimit(),
                onDrag: (element, x, y, event) => {
                  //console.log(event.buttons, event.which)
                  this.pause()
                    .then(() => {
                      if (!event.buttons) {
                        this.dragRight.stop();
                        event.preventDefault();
                        this._showSelectionBorders();
                        return false;
                      }
                      this.wordSelectionMode = false;
                      if ($('[id="resize-selection-left"]').position().left >= x) {
                        let end = this._round(x * this.getPixelsPerSecond());
                        this.selection.start = end - 1;
                        this.dragRight.stop();
                        this._setSelectionOnWaveform(null, end);
                        return false;
                      }
                      let startX = 0;
                      if (this.selection && typeof this.selection.start !== 'undefined') {
                        startX = this.selection.start / (this.getPixelsPerSecond());
                      } else {
                        startX = $('[id="resize-selection-left"]').position().left;
                      }
                      this.setSelectionWidth(x, 'right');
                      

                      if (typeof this.audiosourceEditor.activeTrack !== 'undefined') {
                        this.audiosourceEditor.activeTrack.stateObj.startX = startX;
                        let startSec = this._round(x * this.getPixelsPerSecond(), 2);
                        //console.log(`SET END ${startSec}`);
                        this.plEventEmitter.emit('select', this.selection.start, startSec);
                      }
                      //self.cursorPosition = self.selection.start;
                    })
                },
                onDragEnd: (element, x, y, event) =>  {
                  this.fixDragEnd(x);
                }
              })
              this.dragLeft = new Draggable (document.getElementById('resize-selection-left'), {
                limit: this.calculateDragLimit(),
                onDrag: (element, x, y, event) => {
                  this.pause()
                    .then(() => {
                      this.wordSelectionMode = false;
                      if ($('[id="resize-selection-right"]').position().left <= x) {
                        let start = this._round(x * this.getPixelsPerSecond());
                        this.selection.end = start + 1;
                        this.dragLeft.stop();
                        this._setSelectionOnWaveform(start);
                        return false;
                      }
                      let startX = 0;
                      if (this.selection && typeof this.selection.end !== 'undefined') {
                        startX = this.selection.end / (this.getPixelsPerSecond());
                      } else {
                        startX = $('[id="resize-selection-right"]').position().left;
                      }
                      this.setSelectionWidth(x, 'left');
                      if (typeof this.audiosourceEditor.activeTrack !== 'undefined') {
                        this.audiosourceEditor.activeTrack.stateObj.startX = startX;
                        let startSec = this._round(x * this.getPixelsPerSecond(), 2);
                        this.plEventEmitter.emit('select', startSec, this.selection.end);
                      }
                      this.cursorPosition = this.selection.start;
                    });
                },
                onDragEnd: (element, x, y, event) => {
                  this.fixDragStart(x);
                }
              })
              if (this.mode === 'file') {
                this._showSelectionBorders();
              }
            }
          }, 100);
        },
        // make sure selection border has same position as drag right
        fixDragEnd(x) {
          if (typeof this.selection.end !== 'undefined' && this.selection.end !== null) {
            this.dragRight.set(this.selection.end / this.getPixelsPerSecond() - 1);
            Vue.nextTick(() => {
              this.setSelectionWidth(x);
            });
          }
        },
        // make sure selection border has same position as drag left
        fixDragStart(x) {
          if (typeof this.selection.start !== 'undefined' && this.selection.start !== null) {
            this.dragLeft.set(this.selection.start / this.getPixelsPerSecond() - 1);
            Vue.nextTick(() => {
              this.setSelectionWidth(x);
            });
          }
        },
        // make sure selection highlight has correct positions
        setSelectionWidth(x, direction) {
          if ((this.selection.start >= 0 || this.selection.end >= 0)) {
            switch (direction) {
              case 'right':
                $('.selection.segment').css('width', this._round(x - this.selection.start / this.getPixelsPerSecond()) + 'px');
                break;
              case 'left':
                $('.selection.segment').css('width', this._round(this.selection.end / this.getPixelsPerSecond() - x) + 'px');
                $('.selection.segment').css('left', x + 'px');
                break;
              default:
                let pixelsPerSecond = this.getPixelsPerSecond();
                let left = this.selection.start / pixelsPerSecond;
                $('.selection.segment').css('width', this._round(this.selection.end / pixelsPerSecond - left));
                $('.selection.segment').css('left', left);
                break;
            }
          }
        },
        // limits for selection drag start and end
        setDragLimit() {
          if (this.dragLeft) {
            this.dragLeft.setOption('limit', this.calculateDragLimit());
          }
          if (this.dragRight) {
            this.dragRight.setOption('limit', this.calculateDragLimit());
          }
        },
        // limits for selection drag start and end
        calculateDragLimit() {
          return {
            x: [0, $('.channel-0').length ? $('.channel-0').width() : 10000],
            y: [0, 0]
          };
        },
        getPixelsPerSecond() {
          if (this.audiosourceEditor) {
            return this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
          } else {
            return false;
          }
        },
        onPlaybackRateChange() {
          //console.log(this.playbackRate);
          $('.playbackrate-dropdown .p-inputtext').html(`${this.playbackRate}x`);
        },
        decreaseSelectionStart() {
          if (this.processRun) {
            return false;
          }
          if (this.selection.start > 0) {
            this.selectionStartS = this._round(this.selectionStartS, 2) - 0.01;
          }
        },
        increaseSelectionStart() {
          if (this.processRun) {
            return false;
          }
          if (this.selection.start < this.audioDuration) {
            this.selectionStartS = this._round(this.selectionStartS, 2) + 0.01;
            //this.setSelectionStart(start + 0.1);
          }
        },
        decreaseSelectionEnd() {
          if (this.processRun) {
            return false;
          }
          if (this.selection.end > 0) {
            this.selectionEndS = this._round(this.selectionEndS, 2) - 0.01;
          }
        },
        increaseSelectionEnd() {
          if (this.processRun) {
            return false;
          }
          if (this.selection.end < this.audioDuration) {
            this.selectionEndS = this._round(this.selectionEndS, 2) + 0.01;
          }
        },
        showSelectionTooltip() {
          if ($('.selection-tooltip.-start').length > 0) {
            let left = this.selection.start * this.audiosourceEditor.sampleRate /  this.audiosourceEditor.samplesPerPixel - this.playlistScrollPosition;
            let right = this.selection.end * this.audiosourceEditor.sampleRate / this.audiosourceEditor.samplesPerPixel - this.playlistScrollPosition;
            let win = window,
              d = document,
              e = d.documentElement,
              g = d.getElementsByTagName('body')[0],
              w = win.innerWidth || e.clientWidth || g.clientWidth;
            let elWidth = right - left;
            let minWidth = parseInt($('.selection-tooltips').css('min-width'));
            if (elWidth < minWidth) {
              right = left + minWidth;
            }
            if (left < 0 || w - right < 0) {
              if (left < 0) {
                left = 0;
              }
              if (w - right < 0) {
                right = w;
              }
              if (right - left < minWidth) {
                if (left > 0) {
                  left = right - minWidth;
                }
              }
              elWidth = right - left;
            }
            $('.selection-tooltips').css('left', `${left}px`).width(`${elWidth}px`);
          }
        },
        addFadeSelectionLog() {
          this.fadeSelectionLog.push({percent: this.getClearFadePercent()});
        },
        popFadeSelectionLog() {
          this.fadeSelectionLog.pop();
        },
        clearFadeSelectionLog() {
          this.fadeSelectionLog = [];
        },
        getClearFadePercent() {
          return parseInt(this.fadePercent.replace(/^\D*/, ''));
        },
        fillSilenceSample() {
          let loadRemoteSilence = new Promise((resolve, reject) => {
            if (this.remoteSilenceData && this.remoteSilenceData.length > 0) {
              return resolve(this.remoteSilenceData);
            }
            return this.loadSilenceSample()
              .then(response => {
                if (response && response.byteLength > 0) {
                  return this.audiosourceEditor.ac.decodeAudioData(response)
                    .then(silenceBuffer => {
                      //console.log(silenceBuffer);
                      this.remoteSilenceData = silenceBuffer.getChannelData(0);
                      //console.log(this.remoteSilenceData);
                      this.silencePeaks.push(Math.min(...this.remoteSilenceData));
                      this.silencePeaks.push(Math.max(...this.remoteSilenceData));
                      return resolve();
                  });
                }
                return resolve();
              })
              .catch(() => {
                return resolve();
              });
          });
          return loadRemoteSilence
            .then(() => {
              return [];
          });
        },
        getSilenceSample() {
          let original_buffer = this.audiosourceEditor.activeTrack.buffer;
          this.silenceLength = parseFloat(this.silenceLength);

          let silence = new Float32Array(this.silenceLength * original_buffer.sampleRate);

          if (this.remoteSilenceData && this.remoteSilenceData.length > 0) {
            let silenceCopy = [...this.remoteSilenceData];
            for (let i = 0; i < silence.length; ++i) {
              silence[i] = silenceCopy.shift();
              if (silenceCopy.length === 0) {
                silenceCopy = [...this.remoteSilenceData];
              }
            }
          } else {
            silence.fill(SILENCE_VALUE);
          }
          return silence;
        },
        showRecordingPauses() {
          document.querySelectorAll('.pause-position').forEach(pausePosition => {
            pausePosition.remove();
          });
          if (this.displayRecordingPauses) {
            this.recordingPauses.forEach(pause => {
              let position = parseInt((pause / 1000) * this.audiosourceEditor.sampleRate / this.audiosourceEditor.samplesPerPixel);
              let pausePosition = document.createElement('div');
              let waveform = document.querySelector(`.waveform`);
              pausePosition.className = 'pause-position';
              pausePosition.style.left = `${position}px`;
              waveform.appendChild(pausePosition);
            });
          }
        },
        toggleDisplayRecordingPauses() {
          this.displayRecordingPauses = !this.displayRecordingPauses;
          this.showRecordingPauses();
        },
        checkCloseRealigningBlock(alignVoicework, realignVoiceType) {

          let editingBlock = this.audioTasksQueueBlock();
          if (editingBlock && editingBlock.voicework === alignVoicework) {
            let alignBlk;
            if (alignVoicework !== "tts" || !realignVoiceType) {
              alignBlk = this.selectedBlocks.find(blk => {
                return blk.blockid === editingBlock.blockid;
              });
            } else if (alignVoicework === "tts" && realignVoiceType) {
              alignBlk = this.alignTTSVoiceBlockids(realignVoiceType).find(blockid => {
                return blockid === editingBlock.blockid;
              });
            }
            if (alignBlk) {
              this.forceClose();
            }
          }
        },
        ...mapActions(['addAudioTask', 'undoTasksQueue', 'setAudioTasksBlockId', 'loadSilenceSample']),
        ...mapActions('userActions', ['updateUser'])

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
            return this._numToTime(this._round(this.selection.start % 60, 2));
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
            return this._numToTime(this._round(this.selection.end % 60, 2));
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
                    this.alignCounter.countAudio && this.allowAlignBlocksLimit;
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
        blockMap: {
          get() {
            if (!this.currentAudiobook._id || !this.currentAudiobook.importFiles || !this.audiofileId) {
              return {};
            }
            let audio = this.currentAudiobook.importFiles.find(_if => _if.id === this.audiofileId);
            return audio && audio.blockMap ? audio.blockMap : {};
          }
        },
        blockSelection: {
          get() {
            return this.mode === 'file' ? this.blkSelection : {};
          }
        },
        isRevertDisabled: {
          get() {
            return this.block ? !this.block.audiosrc_original && !this.isModified : true;
          },
          cache: false
        },
        lastActionName: {
          get() {
            if (this.actionsLog.length > 0) {
              switch (this.actionsLog[this.actionsLog.length - 1].type) {
                case 'cut':
                  return 'Cut';
                  break;
                case 'erase':
                  return 'Erase';
                  break;
                case 'insert_silence':
                  return 'Silence';
                  break;
                case 'fade':
                  return 'Fade';
                  break;
                case 'manual_boundaries':
                  return 'Pin';
                  break;
              }
            }
            return '';
          },
          cache: false
        },
        isSaveDisabled: {
          get() {
            if (!this.isModifiedComputed) {
              return true;
            }
            if (this.audioTasksQueue.running) {
              return true;
            } else {
              return false;
            }
          },
          cache: false
        },
        isEmpty: {
          get() {
               return (!this.audiosourceEditor || !this.audiosourceEditor.tracks || this.audiosourceEditor.tracks.length == 0) && !this.processRun;
          },
          cache: false
        },
        isFadeDisabled: {
          get() {
            if (!this.hasSelection || this.isSinglePointSelection) {
              return true;
            }
            return false;
          },
          cache: false
        },
        rangeFadePercent: {
          get() {
            let startPercent = 100;
            this.fadeSelectionLog.forEach(log => {
              startPercent = log.percent * startPercent / 100;
            });
            return `Faded to ${this._round(startPercent, 0)}%`;
          },
          cache: false
        },
        controlsClassname: {
          get() {
            let classname = '';
            if (this.mode === 'block') {
              if (!this.editingLocked) {
                classname+= '-active';
              } else {
                classname+= '-inactive';
              }
            } else if (this.mode === 'file') {
              if (this.hasLocks('align')) {
                classname+= '-align-mode-active';
              } else {
                classname+= '-align-mode';
              }
            }
            return classname;
          },
          cache: false
        },
        ...mapGetters({
          currentBookMeta: 'currentBookMeta',
          blkSelection: 'blockSelection',
          alignCounter: 'alignCounter',
          hasLocks: 'hasLocks',
          currentAudiobook: 'currentAudiobook',
          storeListO: 'storeListO',
          audioTasksQueue: 'audioTasksQueue',
          audioTasksQueueBlock: 'audioTasksQueueBlock',
          audioTasksQueueBlockOrPart: 'audioTasksQueueBlockOrPart',
          coupletSeparator: 'coupletSeparator',
          allowAlignBlocksLimit: 'allowAlignBlocksLimit',
          user: 'user',
          audioFadeConfig: 'audioFadeConfig',
          selectedBlocksData: 'selectedBlocksData',
          selectedBlocks: 'selectedBlocks'
        }),
        ...mapGetters('alignActions', ['alignTTSVoicesData', 'alignTTSVoiceBlockids'])
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
            //if (this.mode == 'file') {
              let pos = this.cursorPosition * this.audiosourceEditor.sampleRate / this.audiosourceEditor.samplesPerPixel;
              $('#cursor-position').css('left', pos);
            //}
            Vue.nextTick(() => {
              this.showSelectionTooltip();
              this.showRecordingPauses();
            });
            setTimeout(() => {
              this.setDragLimit();
              this.setSelectionWidth();// pin selection highlight to positions
              // move position lines to cursor
              let cursorPosition = document.querySelector('.cursor-position');
              if (cursorPosition && cursorPosition.style && cursorPosition.style.left) {
                let selectionPoint = document.querySelector('.selection.point');
                if (selectionPoint) {
                  selectionPoint.style.left = cursorPosition.style.left;
                }
                let cursor = document.querySelector('.cursor');
                if (cursor) {
                  cursor.style.left = cursorPosition.style.left;
                }
              }
            }, 50);
            this._showSelectionBorders();
            this._scrollToCursor();
            //if ($('.cursor').position()) {
              //$('.cursor-position').css('left', $('.cursor').position().left);
            //}
          }
        },
        'blockSelection.start._id': {
          handler(val, oldVal) {
            //console.log('blockSelection CHANGED', val)
            if ((!val) &&
                    (this.blockMap && this.blockMap[oldVal])) {
              if (this.mode === 'file' && this.origFilePositions) {
                this.selection.start = this._round(this.origFilePositions.start, 2);
                this.selection.end = this._round(this.origFilePositions.end, 2);
                let replay = this.isPlaying;
                let wait = this.isPlaying ? [this.pause()] : [];
                Promise.all(wait)
                  .then(() => {
                    this.cursorPosition = this.selection.start;
                    this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                    this._showSelectionBorders(true);
                    if (replay) {
                      this.play();
                    }
                  });
              }
            } else if (val && this.blockMap && this.blockMap[val]) {
              this._setBlocksSelection();
            }
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

            let clearFadeLog = val instanceof Object && val.hasOwnProperty('start') && val.hasOwnProperty('end') && (!oldVal || (val.start !== oldVal.start || val.end !== oldVal.end));
            Vue.nextTick(() => {
              //return;
              //$('[id="resize-selection-right"]')
              if (typeof oldVal.end !== 'undefined' && oldVal.end === val.end && val.start <= 0) {// moving left, probably cursor is out of player
                if (!this.selectionBordersVisible) {
                  this._showSelectionBorders();
                }
              } else if (val.end >= this.audioDuration) {// moving right, probably cursor is out of player
                if (!this.selectionBordersVisible) {
                  this._showSelectionBorders();
                }
              }
              if ($('[id="resize-selection-left"]').css('display') === 'none' && $('.playlist-overlay:hover').length === 0) {
                this.cursorPosition = typeof this.selection.start === 'number' && !isNaN(this.selection.start) ? this.selection.start : this.cursorPosition;
                this._showSelectionBorders();
              }
              this.showSelectionTooltip();
            })
            this.smoothSelection(val, oldVal);
            if (clearFadeLog) {
              this.clearFadeSelectionLog();
            }
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
//           console.log('$route', this.mode);
//           if (this.$route.params.hasOwnProperty('bookid') && this.mode === 'block') {
//             if (!this.currentBookMeta || this.$route.path.indexOf(this.currentBookMeta._id + '/edit' === -1)) {
//               this._setDefaults();
//               this.close();
//             }
//           }
        },
        'currentBookMeta._id': {
          handler(val, oldVal) {
            if (this.mode === 'file') {
              if (oldVal) {
                this.close();
              }
            }
          }
        },
        'wordSelectionMode': {
          handler(val) {
            if (val === false) {
              this._clearWordSelection();
            }
          }
        },
        'playbackRate': {
          handler(val) {
            if (this.isPlaying) {
              this.pause()
                .then(() => {
                  setTimeout(() => {
                    this.play();
                  }, 200)
                });
            }
            if (this.currentBookMeta && this.currentBookMeta.bookid && this.mode === 'block') {
              let bookPlaybackRate = {};
              if (!this.user.bookPlaybackRate || !this.user.bookPlaybackRate[this.currentBookMeta.bookid] || this.user.bookPlaybackRate[this.currentBookMeta.bookid] !== this.playbackRate) {
                bookPlaybackRate[this.currentBookMeta.bookid] = parseFloat(parseFloat(this.playbackRate).toFixed(2));
                this.updateUser([this.user._id, {bookPlaybackRate: bookPlaybackRate}]);
              }
            }
          }
        },
        'playlistScrollPosition': {
          handler(val) {
            this.showSelectionTooltip();
          }
        }
        /*'fadePercent': {
          handler(val) {
            if (this.currentBookMeta && this.currentBookMeta.bookid && this.mode === 'block') {
              let audioFadeConfig = {};
              let clearPercent = this.getClearFadePercent();
              audioFadeConfig[this.currentBookMeta.bookid] = Object.assign({}, this.audioFadeConfig);
              if (!this.user.audioFadeConfig || !this.user.audioFadeConfig[this.currentBookMeta.bookid] || this.user.audioFadeConfig[this.currentBookMeta.bookid].percent !== clearPercent) {
                audioFadeConfig[this.currentBookMeta.bookid].percent = parseFloat(parseFloat(clearPercent).toFixed(0));
                this.updateUser([this.user._id, {audioFadeConfig: audioFadeConfig}]);
              }
            }
          }
        }*/
      }
  }
</script>
<style lang="less">
  @waveform-height: 80px;
  @audio-btn: "/static/audio_editor/";
  .waveform {
      max-height: @waveform-height;
      .resize-selection {
          width: 3px;
          height: 100%;
          border: 1px solid green;
          cursor: ew-resize;
          position: absolute;
          z-index: 1000;
          display: none;
          background-color: green;
      }
  }
  .waveform-playlist {
    background-color: #d9d9d9;
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
                &.manual {
                  background: #6aa84f;
                }
            }
            .id {
                height: 100%;
                display: inline-block;
                padding: 4px 0px;
                width: 100%;
                cursor: all-scroll;
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
          .annotation-resize-pos {
              width: 20px;
              height: 30px;
              position: absolute;
              background-color: gray;
              z-index: 9999;
              border-left: 9px solid #bebebe;
              border-right: 9px solid #bebebe;
              cursor: ew-resize;
              display: none;
          }
        }
        .playlist-time-scale {
            height: 30px;
            background-color: white;
        }
        .channel-progress {
            background: #b4b3b3;/*#53dbfe*/
        }
        .channel {
            background: #2e2e2e;/*#0000ba*/
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
    height: 92px;
    overflow-y: hidden !important;
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
    top: -2px;
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
  .playbackrate-dropdown.p-dropdown {
    width: 62px;
  }
  .dropdown-controls {
    display: inline-block;
    padding: 0px 20px;
    .fade-percent-dropdown.p-dropdown {
      width: 75px;
    }
  }
  .selection-tooltips {
    position: absolute;
    z-index: 999;
    top: -29px;
    left: 595.35px;
    min-width: 275px;
    .selection-tooltip {
      display: inline-block;
      background: rgb(186, 232, 195);
      border-radius: 4px 4px 0px 0px;
      padding: 4px 5px;
      user-select: none;
      &.-start {
        float: left;
      }
      &.-end {
        float: right;
      }
      .adjust-selection {
        width: 20px;
        height: 19px;
        border: none;
        vertical-align: middle;
        &.selection-decrease {
          background: url("@{audio-btn}selection-decrease.png");
        }
        &.selection-increase {
          background: url("@{audio-btn}selection-increase.png");
        }
      }
      .selection-time {
        padding: 0px 0px;
        display: inline-block;
        font-weight: 700;
        min-width: 77px;
        text-align: center;
      }
    }
  }
  .define-block-range {
    border: 1.7px solid #FF4343;
    /*transform: matrix(1, 0, 0, -1, 0, 0);*/
    padding: 1px 1px;
    border-radius: 15px;
    color: #FF4343;
    cursor: pointer;
    width: 22px;
    display: inline-block;
    text-align: center;
    height: 22px;
    vertical-align: middle;
    font-size: 12px;
    font-weight: bold;
  }
  
  span.blue-message {
    color: #2D76B0;
    border: 1.7px solid #2D76B0;
    padding: 1px 1px;
    border-radius: 15px;
    cursor: pointer;
    width: 22px;
    display: inline-block;
    text-align: center;
    height: 22px;
    vertical-align: middle;
    font-size: 12px;
    font-weight: bold;
    &.-bigger {
      width: auto;
      padding: 4px 6px;
      height: 26px;
    }
  }
  a.blue-message {
    font-weight: bold;
    text-decoration: underline;
    cursor: pointer;
    color: #2D76B0;
  }
  
  .audio-player-component {
    width: 100%;
    background-color: #aaa9a97c;
    border: #b1b1b1 1px solid;
    border-bottom: 0;
    color: #828282;
    font-size: 14px;
    font-weight: 400;
    font-family: Helvetica;

    .controls-list {
      padding: 15px 30px;
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: space-between;

      &.-active {
        max-width: 1305px;
        padding: 15px 20px;
        
        @media screen and (max-width: 1200px) {
          .control-wrapper {
            &.-special-control {
              padding-inline-end: 20px;
            }
          }
        }
        
        @media screen and (max-width: 1150px) {
          padding: 15px 9px;
        }
        
        @media screen and (max-width: 1070px) {
          padding: 15px 5px;
        }

        @media screen and (max-width: 1066px) {
          justify-content: flex-start;
          max-width: 1060px;
          padding: 15px 15px;
        }
        
        @media screen and (max-width: 805px) {
          max-width: 795px;
        }
        
        @media screen and (max-width: 744px) {
          max-width: 734px;
        }
        
        @media screen and (max-width: 683px) {
          max-width: 673px;
        }
        
        @media screen and (max-width: 584px) {
          max-width: 570px;
        }
      }

      &.-inactive {
        max-width: 935px;
        
        @media screen and (max-width: 880px) {
          .control-wrapper {
            &.-special-control {
              padding-inline-end: 20px;
            }
          }
        }

        @media screen and (max-width: 840px) {
          justify-content: flex-start;
          max-width: 812px;
        }
      }

      &.-align-mode {
        max-width: 564px;
        padding: 15px 25px;
        
        @media screen and (max-width: 530px) {
          .control-wrapper {
            &.-special-control {
              padding-inline-end: 20px;
            }
          }
        }

        @media screen and (max-width: 474px) {
          justify-content: flex-start;
          max-width: 462px;
        }
      }

      &.-align-mode-active {
        max-width: 606px;
        padding: 15px 25px;
        
        @media screen and (max-width: 560px) {
          .control-wrapper {
            &.-special-control {
              padding-inline-end: 20px;
            }
          }
        }

        @media screen and (max-width: 524px) {
          justify-content: flex-start;
          max-width: 505px;
        }
      }
    }

    .controls-group {
      display: flex;
      align-items: center;
      gap: 10px;

      &.-special-group {
        gap: 20px;
      }
    }

    .control-wrapper {
      display: flex;
      gap: 2px;

      /*&.-special-control {
        padding-inline-end: 20px;
      }*/
    }
    
    .audio-btn {
      display: inline-block;
      vertical-align: middle;
      cursor: pointer;
      border: none;
      width: 41px;
      height: 34px;
      margin: 0px;
      border-radius: 4px;
      &[disabled] {
        cursor: not-allowed;
      }
      &.-play {
        background: url("@{audio-btn}play.png");
        width: 34px;
      }
      &.-pause {
        background: url("@{audio-btn}pause.png");
        width: 34px;
      }
      &.-go-to-start {
        background: url("@{audio-btn}go-to-start.png");
        width: 34px;
      }
      &.-go-to-end {
        background: url("@{audio-btn}go-to-end.png");
        width: 34px;
      }
      &.-zoom-in {
        background: url("@{audio-btn}zoom-in.png");
        border-radius: 20px;
        width: 34px;
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-zoom-out {
        background: url("@{audio-btn}zoom-out.png");
        width: 34px;
        border-radius: 20px;
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-fade {
        background: url("@{audio-btn}fade.png");
        width: 49px;
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-clear {
        background: url("@{audio-btn}clear.png");
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-erase {
        background: url("@{audio-btn}erase.png");
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-cut {
        background: url("@{audio-btn}cut.png");
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-add-silence {
        background: url("@{audio-btn}add-silence.png");
        width: 63px;
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-revert{
        background: url("@{audio-btn}revert.png");
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-save {
        background: url("@{audio-btn}save.png");
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-save-and-realign {
        background: url("@{audio-btn}save-and-realign.png");
        width: 91px;
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-undo {
        background: url("@{audio-btn}undo.png");
        &[disabled] {
          opacity: 0.5;
        }
      }
      &.-align {
        background: url("@{audio-btn}align.png");
        &[disabled] {
          opacity: 0.5;
        }
      }
    }
    
    
    .silence-controls {
      .add-silence-dropdown.p-dropdown {
        width: 48px;
        .p-dropdown-trigger {
          .pi-chevron-down::before {
            left: 70%;
          }
        }
      }
    }
    
    .p-dropdown {
      height: 34px;
      vertical-align: middle;
      .p-inputtext {
        font-size: inherit;
      }
    }
    .speed-controls, .silence-controls, .selection-controls {
      .p-dropdown {
        .p-dropdown-panel {
          border-radius: 5px;
        }
        .p-dropdown-items-wrapper {
          box-shadow: rgba(0, 0, 0, 0.13) 0px 3.2px 7.2px 0px, rgba(0, 0, 0, 0.11) 0px 0.6px 1.8px 0px;
          &::-webkit-scrollbar {
            width: 10px;
          }
          &::-webkit-scrollbar-track {
            background: white;
            border-radius: 10px;
          }
          &::-webkit-scrollbar-thumb {
            background: #D9D9D9;
            border-radius: 9999px;
            width: 2px;
            background-clip: padding-box;
            border: 4px solid rgba(0, 0, 0, 0);
          }
          .p-dropdown-items {
            border-radius: 5px;
          }
          .p-dropdown-item {
            &.p-highlight {
              background: inherit;
              font-weight: bolder;
            }
          }
        }
      }
    }
    .p-dropdown {
      .p-inputtext {
        /*padding: 5px 3px;*/
      }
      .p-dropdown-trigger {
        width: 15px;
        .pi-chevron-down::before {
          content: '';
          position: absolute;
          left: 75%;
          top: 13px;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 6px solid #000;
          clear: both;
        }
      }
    }
    .align-preloader{
      &.-small {
        height: 20px;
        width: 34px;
      }
    }
  }
  .pause-position {
    position: absolute;
    width: 2px;
    background-color: #FF9900;
    height: 80px;
    z-index: 8;
  }
</style>
