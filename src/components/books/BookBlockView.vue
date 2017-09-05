<template>
<div class="table-body -block" :id="block._id">
    <div class="table-cell controls-left">
        <div class="table-row">
            <span>{{block.parnum?block.parnum:'&nbsp;'}}</span>
        </div>
        <div class="table-row">
            <!-- Show parnum only on paragraphs -->
            <div class='par-ctrl -hidden'>
                <i class="fa fa-paragraph"></i>
            </div>
            <div class='par-ctrl -hidden'>
                <i class="glyphicon glyphicon-volume-up"></i>
                <i class="glyphicon glyphicon-volume-off"></i>
            </div>
        </div>
    </div>
    <div class="table-cell">
        <div class="table-body -content"
        @mouseleave="onBlur"
        @click="onBlur">
            <div class="table-row controls-top">
            <!--data-toggle="tooltip" v-bind:title="JSON.stringify(block)">-->

              <div class="par-ctrl -hidden -left">
                  <span class="block-menu" style="position: relative;">
                  <i class="glyphicon glyphicon-menu-hamburger"
                  @click.prevent="$refs.blockMenu.open">
                  </i>
                  <block-menu
                      ref="blockMenu"
                      dir="top"
                      :update="update">
                    <li @click="update">Show hidden flags</li>
                    <li class="separator"></li>
                    <li>Insert block before</li>
                    <li>Insert block after</li>
                    <li>Delete block</li>
                    <li>Split block</li>
                    <li>Join with previous block</li>
                    <li>Join with next block</li>
                    <li class="separator"></li>
                    <li @click="discardBlock">Discard un-saved changes</li>
                    <li @click="discardAudio">Revert to original audio</li>
                  </block-menu>
                  </span>

                  <!--<i class="fa fa-trash-o fa-lg"></i>-->
                  <!--<i class="fa fa-pencil-square-o fa-lg"></i>-->
                  <!-- Block Type selector -->
                  <label>type
                  <select v-model='block.type'>
                      <option v-for="(type, index) in blockTypes" :value="type">{{ type }}</option>
                  </select>
                  </label>
                  <!-- Block Class selector -->
                  <label>class
                  <select v-model='block.classes'>
                    <option v-for="(style, index) in blockClasses" :value="style">{{ style }}</option>
                  </select>
                  </label>
              </div>
              <!--<div class="-hidden">-->

              <div class="par-ctrl -audio -hidden -right">
                  <template v-if="player && blockAudio.src && !isRecording">
                      <template v-if="!isAudStarted">
                        <i class="fa fa-play-circle-o" 
                          @click="audPlay(block._id, $event)"></i>
                        <i class="fa fa-stop-circle-o disabled"></i>
                      </template>
                      <template v-else>
                        <i class="fa fa-pause-circle-o" v-if="!isAudPaused"
                          @click="audPause(block._id, $event)"></i>
                        <i class="fa fa-play-circle-o paused" v-else
                          @click="audResume(block._id, $event)"></i>
                        <i class="fa fa-stop-circle-o"
                          @click="audStop(block._id, $event)"></i>
                        <div class="empty-control"></div><!-- empty block to keep order -->
                        </template>
                  </template>
                  <template v-if="recorder && tc_showBlockNarrate(block._id) && !isAudStarted">
                    <i class="fa fa-arrow-circle-o-down" v-if="isRecording" @click="stopRecording(true, $event)"></i>
                    <i class="fa fa-stop-circle-o" v-if="isRecording" @click="stopRecording(false, $event)"></i>
                    <i class="fa fa-microphone" v-if="!isRecording" @click="startRecording($event)"></i>
                    <i class="fa fa-microphone paused" v-if="isRecordingPaused" @click="resumeRecording($event)"></i>
                    <i class="fa fa-pause-circle-o" v-if="isRecording && !isRecordingPaused" @click="pauseRecording($event)"></i>
                  </template>
              </div>
              <!--<div class="-hidden">-->

            </div>
            <!--<div class="table-row controls-top">-->
            <div style="" class="preloader-container">
              <div v-if="isUpdating" class="preloader-small"> </div>
            </div>
            <div class="table-row ocean">
                <hr v-if="block.type=='hr'" />
                
                <div v-else class="content-wrap"
                :id="'content-'+block._id"
                ref="blockContent"
                v-html="block.content"
                :class="[ block.type, block.classes, { 'updated': isUpdated, 'playing': isAudStarted || tc_showBlockNarrate(block._id) }]"
                :data-audiosrc="blockAudio.src"
                @click="onClick"
                @input="onInput"
                @mouseenter="onHover"

                @contextmenu.prevent="onContext">
                </div>
                <!--<div class="content-wrap">-->

                <block-cntx-menu
                    ref="blockCntx"
                    dir="bottom"
                    :update="update"
                >
                  <li v-if="selection.collapsed" @click="addFootnote">Add footnote</li>
                  <template v-if="!selection.collapsed && blockAudio.src">
                    <li class="menu-separator"></li>
                    <li @click="audPlayFromSelection()">Play from here</li>
                    <li @click="audPlaySelection()">Play selection</li>
                    <li @click="audDeleteSelection()">Delete audio in selection</li>
                    <li class="menu-separator"></li>
                  </template>
                  <li v-if="!selection.collapsed && tc_showBlockNarrate(block._id)" @click="reRecord">Re-record audio</li>
                  <!--<li @click="test">test</li>-->
                </block-cntx-menu>

            </div>
            <!--<div class="table-row ocean">-->

            <div class="table-row content-footnotes"
              v-if="block.footnotes.length > 0">
              <div class="table-body footnote"
                v-for="(footnote, footnote_Idx) in block.footnotes">
                <div class="table-row">
                  <div class="table-cell -num">{{footnote_Idx+1}}.</div>
                  <div class="table-cell -text"
                    :class="['js-footnote-val']"
                    contenteditable="true"
                    @input="commitFootnote(footnote_Idx, $event)"
                    v-html="footnote">
                  </div>
                  <div class="table-cell -control">
                    <span @click="delFootnote(footnote_Idx)"><i class="fa fa-trash"></i></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-row controls-bottom">
                <div class="save-block -hidden -left"
                v-bind:class="{ '-disabled': !isChanged }"
                @click="assembleBlock()">
                    <i class="fa fa-save fa-lg"></i>&nbsp;&nbsp;save
                </div>
                <!--<div class="-left">
                  Changed: {{isChanged}}
                </div>-->
                <div class="save-block -hidden -left"
                v-bind:class="{ '-disabled': !isAudioChanged }"
                @click="assembleBlockAudio()">
                    <i class="fa fa-save fa-lg"></i>&nbsp;&nbsp;save
                </div>
              <div class="par-ctrl -hidden -right">
                  <span><i class="fa fa-flag-o"></i></span>
                  <span><i class="fa fa-hand-o-left"></i>&nbsp;&nbsp;Need work</span>
                  <span><i class="fa fa-thumbs-o-up"></i>&nbsp;&nbsp;Approve</span>
              </div>
              <!--<div class="-hidden">-->
            </div>
            <!--<div class="table-row controls-bottom">-->
        </div>
    </div>
    <div class="table-cell controls-right">
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import { QuoteButton, QuotePreview } from '../generic/ExtMediumEditor';
import ReadAlong from 'readalong'
import BlockMenu from '../generic/BlockMenu';
import BlockContextMenu from '../generic/BlockContextMenu';
import taskControls from '../../mixins/task_controls.js'
import apiConfig from '../../mixins/api_config.js'
var BPromise = require('bluebird');

export default {
  data () {
    return {
      editor: false,
      player: false,
      selection: false,
      blockTypes: ['title', 'header', 'subhead', 'par', 'illustration', 'aside', 'hr'],
      blockTypeClasses: {
          title: [' ', 'subtitle', 'author', 'translator'],
          header: [' ', 'chapter', 'selection', 'letter', 'talk', 'date', 'venue'],
          subhead: [' ', 'toc1', 'toc2', 'toc3', 'toc4'],
          par: [' ', 'dropcap', 'blockquote'],
          illustration: ['small', 'med', 'full'],
          aside: ['fn', 'inline'],
          hr: [' ', 'section', 'large', 'small']
      },
      isChanged: false,
      isUpdated: false,
      isAudStarted: false,
      isAudPaused: false,
      isRecording: false,
      isRecordingPaused: false,
      isAudioChanged: false,
      blockAudio: {
        src: '',
        map: ''
      },
      reRecordPosition: false,
      isUpdating: false,
      recordStartCounter: 0
    }
  },
  components: {
      'block-menu': BlockMenu,
      'block-cntx-menu': BlockContextMenu
  },
  props: ['block', 'putBlock', 'getBlock', 'recorder'],
  mixins: [taskControls, apiConfig],
  computed: {
      blockClasses : function () {
          return this.blockTypeClasses[this.block.type];
      },
      ...mapGetters({
          book: 'currentBook',
          meta: 'currentBookMeta',
          authors: 'authors'
      })
  },
  beforeDestroy:  function() {
    if (this.editor) this.editor.destroy();
  },
  mounted: function() {
      this.editor = new MediumEditor('.content-wrap', {
          toolbar: {
            buttons: [
              'bold', 'italic', 'underline',
              'superscript', 'subscript',
              'orderedlist', 'unorderedlist',
//               'html', 'anchor',
              'quoteButton'
            ]
          },
          buttonLabels: 'fontawesome',
          quotesList: this.authors,
          onQuoteSave: this.onQuoteSave,
          extensions: {
            'quoteButton': new QuoteButton(),
            'quotePreview': new QuotePreview()
          },
          disableEditing: !this.tc_isShowEdit(this.block._id)
      });
//       this.editor.subscribe('hideToolbar', (data, editable)=>{});
//       this.editor.subscribe('positionToolbar', ()=>{})
      this.blockAudio = {'map': this.block.content, 'src': this.block.audiosrc ? this.block.audiosrc : ''};
      if (!this.player && this.blockAudio.src) {
          this.blockAudio.src = this.blockAudio.src + '?' + (new Date()).toJSON();
          this.initPlayer();
      }
  },
  methods: {
      ...mapActions(['putMetaAuthors']),
      onQuoteSave: function() {
        this.putMetaAuthors(this.authors).then(()=>{
          this.update();
        });
      },
      onHover: function() {
        //this.$refs.blockContent.focus();
      },
      onBlur: function() {
        if (this.$refs.blockCntx.viewMenu) this.$refs.blockCntx.close();
      },
      onClick: function() {
        $('.medium-editor-toolbar').each(function(){
              $(this).css('display', 'inline-block');
        });
      },
      onContext: function(e) {
        $('.medium-editor-toolbar').each(function(){
            $(this).css('display', 'none');
        });
        this.selection = window.getSelection().getRangeAt(0).cloneRange();
        //console.log(this.selection);
        this.$refs.blockCntx.open(e);
      },
      update: function() {
        console.log('update');
        //this.isChanged = true;
        //Vue.set(this, 'isChanged', true);
      },
      onInput: function(el) {
        this.isChanged = true;
        el.target.focus();
      },
      discardBlock: function(block_id, ev) {
        this.getBlock(this.block._id)
        .then((block)=>{
          this.$refs.blockContent.innerHTML = this.block.content;
          this.isChanged = false;
          this.$refs.blockContent.focus();
        });
      },
      discardAudio: function() {
        this.blockAudio.src = this.block.audiosrc;
        this.blockAudio.map = this.block.content;
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_tmp';
        let api = this.$store.state.auth.getHttp();
        api.delete(api_url, {}, {})
          .then(response => {

          })
          .catch(err => {

          });
      },
      assembleBlock: function(el) {
        this.block.content = this.$refs.blockContent.innerHTML;
        this.block.classes = [this.block.classes];
        this.putBlock(this.block);
        this.isChanged = false;
      },
      assembleBlockAudio: function(el) {
        if (this.blockAudio.map) {
          let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_tmp';
          let api = this.$store.state.auth.getHttp();
          return api.post(api_url, {}, {})
            .then(response => {
              if (response.status == 200) {
                this.block.content = this.blockAudio.map;
                this.block.audiosrc = response.data.audiosrc;
                this.blockAudio.map = '';
                this.blockAudio.src = '';
                this.putBlock(this.block);
              }
            })
            .catch(err => {});
        }
        this.isAudioChanged = false;
      },
      audPlay: function(block_id, ev) {
        this.audCleanClasses(block_id, ev);
        this.player.playBlock('content-'+block_id);
      },
      audPlayFromSelection() {
        let startElement = this._getParent(this.selection.startContainer, 'w');
        if (startElement) {
          this.isAudStarted = true;
          this.player.playFromWordElement(startElement, 'content-'+this.block._id);
        }
      },
      audPlaySelection() {
        let startElement = this._getParent(this.selection.startContainer, 'w');
        let endElement = this._getParent(this.selection.endContainer, 'w');
        let startRange = this._getClosestAligned(startElement, 1);
        if (!startRange) {
          startRange = [0, 0];
        }
        let endRange = this._getClosestAligned(endElement, 0);
        if (!endRange) {
          endRange = this._getClosestAligned(endElement, 1)
        }
        this.isAudStarted = true;
        this.player.playRange('content-' + this.block._id, startRange[0], endRange[0] + endRange[1]); 
      },
      audPause: function(block_id, ev) {
        this.player.pause();
      },
      audResume: function(block_id, ev) {
        this.audCleanClasses(block_id, ev);
        this.player.resume();
      },
      audStop: function(block_id, ev) {
        this.player.pause();
        this.isAudStarted = false;
        this.isAudPaused = false;
        this.audCleanClasses(block_id, ev);
      },
      audDeleteSelection() {
        let startElement = this._getParent(this.selection.startContainer, 'w');
        let endElement = this._getParent(this.selection.endContainer, 'w');
        let startRange = this._getClosestAligned(startElement, 1);
        if (!startRange) {
          startRange = [0, 0];
        }
        let endRange = this._getClosestAligned(endElement, 0);
        if (!endRange) {
          endRange = this._getClosestAligned(endElement, 1)
        }
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_remove';
        let api = this.$store.state.auth.getHttp();
        this.isUpdating = true;
        let formData = new FormData();
        let position = [startRange[0], endRange[0] + endRange[1]];
        formData.append('position', position);
        formData.append('isTemp', this.isAudioChanged);
        api.post(api_url, formData, {})
          .then(response => {
            this.isUpdating = false;
            if (response.status == 200) {
              this.blockAudio.src = process.env.ILM_API + response.data.audiosrc + '?' + (new Date()).toJSON();
              this.blockAudio.map = response.data.content;
            }
          })
          .catch(err => {
            this.isUpdating = false;
          });
      },
      audCleanClasses: function(block_id, ev) {
        let reading_class = this.player.config.reading_class
        $('#'+block_id).find('.'+reading_class).each(function(){
          $(this).removeClass(reading_class);
        });
        let trail_class = this.player.config.trail_class
        $('#'+block_id).find('.'+trail_class).each(function(){
          $(this).removeClass(trail_class);
        });
      },
      addFootnote: function() {
        let el = document.createElement('SUP');
        el.className = 'js-footnote-el';
        el.setAttribute('data-idx', this.block.footnotes.length);
        this.selection.insertNode(el);
        let pos = this.updFootnotes(this.block.footnotes.length);
        this.block.footnotes.splice(pos, 0, '');
        this.isChanged = true;
      },
      delFootnote: function(pos) {
        $('#'+this.block._id).find(`.js-footnote-el[data-idx='${pos+1}']`).remove();
        this.updFootnotes();
        this.block.footnotes.splice(pos, 1);
        this.isChanged = true;
      },
      updFootnotes: function(c_pos = 0) {
        let pos = 0;
        $('#'+this.block._id).find('.js-footnote-el').each(function(idx) {
          if ($(this).data('idx') == c_pos) pos = idx;
          $(this).text(idx+1).attr('data-idx', idx+1);
        });
        return pos;
      },
      commitFootnote: function(pos, ev) {
        this.block.footnotes[pos] = ev.target.innerText.trim();
        this.isChanged = true;
      },

      test: function() {
          console.log('addFootnote'+this.block._id, this.block.footnotes);
      },
      startRecording() {
        this.recordTimer()
        .then(() => {
          this.recordStartCounter = 0;
          this.isRecording = true;
          this.selectCurrentBlock();
          this.recorder.startRecording();
        })
      },
      recordTimer() {
        let self = this;
        return new BPromise(function(resolve, reject) {
          self.recordStartCounter = 3;
          $('#narrateStartCountdown strong').html(self.recordStartCounter);
          $('body').addClass('modal-open');
          $('#narrateStartCountdown').show();
          let timer = setInterval(function() {
            --self.recordStartCounter;
            if (self.recordStartCounter <= 0) {
              clearTimeout(timer)
              $('body').removeClass('modal-open');
              $('#narrateStartCountdown').hide();
              resolve()
            } else {
              //console.log(self.recordStartCounter);
              $('#narrateStartCountdown strong').html(self.recordStartCounter);
            }
          }, 1000);
        });
      },
      selectCurrentBlock() {
        $('#booksarea').addClass('recording-background');
        $('#' + this.block._id + ' div.table-body.-content').addClass('recording-block');
      },
      unselectCurrentBlock() {
        $('#booksarea').removeClass('recording-background')
        $('#' + this.block._id + ' div.table-body.-content').removeClass('recording-block');
      },
      stopRecording(start_next) {
        start_next = typeof start_next === 'undefined' ? false : start_next;
        if (!this.isRecording) {
          return false;
        }
        this.unselectCurrentBlock();
        this.isRecording = false;
        this.isRecordingPaused = false;
        
        let self = this;
        
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio';
        let api = this.$store.state.auth.getHttp();
        this.isUpdating = true;
        this.recorder.stopRecording(function(audioUrl) {
          this.getDataURL(function(dataURL) {
            if (start_next) {
              self.stopRecordingAndNext();
            }
            let formData = new FormData();
            formData.append('audio', dataURL.split(',').pop());
            formData.append('position', self.reRecordPosition);
            formData.append('isTemp', self.isAudioChanged);
            api.post(api_url, formData, {})
              .then(response => {
                self.isUpdating = false;
                if (response.status == 200) {
                  self.blockAudio.src = process.env.ILM_API + response.data.audiosrc + '?' + (new Date()).toJSON();
                  self.blockAudio.map = response.data.content;
                }
                self.reRecordPosition = false;
              })
              .catch(err => {
                self.reRecordPosition = false;
                self.isUpdating = false;
              });
          });
        });
      },
      stopRecordingAndNext() {
        //this.stopRecording();
        let offset = document.getElementById(this.block._id).getBoundingClientRect()
        window.scrollTo(0, window.pageYOffset + offset.bottom - 100);
        this.$emit('stopRecordingAndNext', this.block);
      },
      pauseRecording() {
        this.isRecordingPaused = true;
        this.recorder.pauseRecording();
      },
      resumeRecording() {
        this.isRecordingPaused = false;
        this.recorder.resumeRecording();
      },
      initPlayer() {
        this.player = new ReadAlong({
            forceLineScroll: false
        },{
            on_start: ()=>{
                this.isAudStarted = true;
                this.isAudPaused = false;
            },
            on_pause: ()=>{
                this.isAudPaused = true;
            },
            on_resume: ()=>{
                this.isAudPaused = false;
            },
            on_complete: ()=>{
                this.isAudStarted = false;
                this.isAudPaused = false;
                this.audCleanClasses(this.block._id, {});
            }
        });
      },
      reRecord() {
        this._markSelection();
        let startElement = this._getParent(this.selection.startContainer, 'w');
        let endElement = this._getParent(this.selection.endContainer, 'w');
        let startRange = this._getClosestAligned(startElement, 0);
        if (!startRange) {
          startRange = [0, 0];
        }
        let endRange = this._getClosestAligned(endElement, 1);
        if (!endRange) {
          endRange = this._getClosestAligned(endElement, 0);
          if (!endRange) {
            endRange = [0, 0];
          }
        }
        this.reRecordPosition = [parseInt(startRange[0]), parseInt(endRange[0]) + parseInt(endRange[1])];
        //console.log(this.reRecordPosition, this.blockAudio.map.replace(/"/g, '\\"'));
        this.startRecording();
      },
      _getParent(node, tag) {
        if (node.localName == tag) {
          return node;
        }
        let parent = false;
        do {
          parent = parent === false ? node.parentElement : parent.parentElement;
          if (parent.localName == tag) {
            return parent;
          }
        } while(parent);
        return null;
      },
      _getClosestAligned(node, direction) {
        if (node.dataset && node.dataset.map) {
          let splitted = node.dataset.map.split(',');
          if (splitted.length == 2) {
            splitted[0] = parseInt(splitted[0]);
            splitted[1] = parseInt(splitted[1]);
            return splitted;
          }
        }
        let sibling = false;
        if (direction > 0) {
          sibling = node.nextSibling ? node.nextSibling : null;
        } else {
          sibling = node.previousSibling ? node.previousSibling : null;
        }
        while (sibling) {
          if (sibling.dataset && sibling.dataset.map) {
            let splitted = sibling.dataset.map.split(',');
            if (splitted.length == 2) {
              splitted[0] = parseInt(splitted[0]);
              splitted[1] = parseInt(splitted[1]);
              return splitted;
            }
          }
          if (direction > 0) {
            sibling = sibling.nextSibling ? sibling.nextSibling : null;
          } else {
            sibling = sibling.previousSibling ? sibling.previousSibling : null;
          }
        }
        return null;
      },
      _markSelection() {
        let startElement = this._getParent(this.selection.startContainer, 'w');
        let endElement = this._getParent(this.selection.endContainer, 'w');
        if (startElement && endElement) {
          startElement.classList.add('audio-highlight');
          let next = false;
          do {
            next = next ? next.nextSibling : startElement.nextSibling;
            if (next) {
              next.classList.add('audio-highlight');
            }
          } while (next && next !== endElement);
        }
      }
  },
  watch: {
      'block._rev' (newVal) {
          console.log('block._rev', newVal);
          this.isUpdated = true;
          setTimeout(() => {
              this.isUpdated = false;
          }, 2000);
          if (!this.blockAudio.src || !this.tc_showBlockNarrate(this.block._id)) {
            this.blockAudio = {
              'src': this.block.audiosrc ? this.block.audiosrc + '?' + (new Date()).toJSON() : '',
              'map': this.block.content
            };
          }
      },
      'block.type' (newVal) {
        this.isChanged = true;
      },
      'blockAudio.src' (newVal) {
        if (newVal) {
          //console.log('Book audio', newVal, this.block._id);
          if (!this.player) {
            this.initPlayer();
          }
          if (newVal.indexOf('?') === -1) {
            this.blockAudio.src+= '?' + (new Date()).toJSON();
          }
          if (this.tc_showBlockNarrate(this.block._id)) {
            let isChanged = newVal && this.block.audiosrc != newVal.split('?').shift();
            this.isAudioChanged = isChanged;
            if (isChanged) {
              this.infoMessage = 'Audio updated';
            }
          }
        }
      },
      'blockAudio.map' (newVal) {
        //console.log('Tmp audiomap', newVal);
        if (this.tc_showBlockNarrate(this.block._id)) {
          let isChanged = this.block.content != newVal;
          this.isAudioChanged = isChanged;
          this.$refs.blockContent.innerHTML = newVal;
          if (isChanged) {
            this.infoMessage = 'Audio updated';
          }
        }
      }
  }
}
</script>

<style lang='less'>
@variable: 90px;
.ocean {
    padding: 0;
}

.table-body {
    display: table;
    width: 100%;

    &.-block {
        margin-bottom: 20px;
    }

    &.-content {
        .-hidden {
            visibility: hidden;
        }

        &:hover {
            .-hidden {
                visibility: visible;
            }
        }
    }

    .-left {
        float: left;
    }
    .-right {
        float: right;
    }

    &.footnote {
      margin-top: 5px;
      margin-bottom: 10px;

      .table-row {

      }

      .-num {
        padding-right: 5px;
        padding-top: 3px;
      }
      .-text {
        width: 100%;
        background: rgba(204, 255, 217, 0.5);
        padding: 3px;
        height: 21px;
        min-height: 21px;
      }
      .-control {
        padding-left: 10px;

      }
    }
}

.table-cell {
    display: table-cell;

    &.controls-left {
        width: 50px;
        padding-left: 15px;

        .-hidden {
            visibility: hidden;
        }

        &:hover {
            .-hidden {
                visibility: visible;
            }
        }
    }

    &.controls-right {
        width: 100px;
    }

}

.table-row {
    display: table-row;
    &.-relative {
        position: relative;
    }
    &.controls-top {
         i, select {
            margin-right: 15px;
         }
         label {
            margin-bottom: 0;
            font-weight: normal;
         }
         select {
            border: none;
         }
    }

    &.controls-bottom {
         span {
            margin-right: 15px;
            cursor: pointer;
        }
        .save-block {
            cursor: pointer;
            border: 1px solid silver;
            border-radius: 3px;
            padding: 0 3px 1px 3px;
            &:hover {
                background: rgba(204, 255, 217, 0.2);
            }
            &.-disabled {
/*                cursor: not-allowed;
                &:hover {
                    background: rgba(100, 100, 100, 0.2);
                }*/
                visibility: hidden;
            }
        }
    }

    .content-wrap {
      margin: 6px 0 4px 0;
      /*padding: 6px 11px;*/
      padding: 3.2px;
      border-radius: 8px;
      box-shadow: none;
      transition: box-shadow 900ms;

      &:hover {
          border: 1px solid silver;
          /*padding: 5px 10px;*/
          padding: 2.2px;
          background: rgba(219, 232, 255, .3);
      }
      &:focus {
          outline: none;
          border-color: #9ecaed;
          box-shadow: 0 0 10px #9ecaed;
      }
      &.updated {
          box-shadow: 0 0 10px rgba(56, 171, 53, 0.7);
          transition: box-shadow 200ms;
      }
    }
}

.fa, .glyphicon {
    cursor: pointer;
    color: gray;
    font-size: 18px;
}

.medium-editor-toolbar .fa {
    color: #FFFFFF;
}

.fa:hover {
    color: #505050;
}

.par-ctrl {
    .fa-paragraph {
        margin-left: 4px;
    }
    .glyphicon-volume-up, .glyphicon-volume-off {
        margin-left: 3px;
     }
    .glyphicon-menu-hamburger {
        font-size: 20px;
        top: 5px;
    }
    &.-audio {
        .fa {
            font-size: 22px;
        }
    }
    .fa.disabled {
      color: #dddddd;
    }
    .fa.paused {
      color: red;
    }
}

  .content-wrap {
      w {position: relative;}
  }
  /* A tricky way to create a lightweight highlight effect */
  .content-wrap[data-audiosrc].playing {
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

  [data-author] {
    color: teal;
  }
  
  .preloader-small {
      background: url(/static/preloader-snake-small.gif);
      width: 34px;
      height: 34px;
      left: 50%;
      top: 30px;
      position: absolute;
  }
  .preloader-container {
    position: relative;
  }
  .empty-control {
    width: 22px; display: inline-block;
  }
  .menu-separator {
    width: 100%;
    border-bottom: 1px solid black;
    height: 10px;
  }

  .medium-editor-toolbar-form {

    .quote-input {
      position: relative;
      height: 300px;
    }

    ul.quotes-list {
      display: flex;
      flex-direction: column;
      margin-top: -12px;
      border: 1px solid #dbdbdb;
      border-radius: 0 0 3px 3px;
      position: absolute;
      width: 100%;
      overflow: hidden;
      z-index: 999999;

      li {
        width: 100%;
        flex-wrap: wrap;
        background: white;
        margin: 0;
        border-bottom: 1px solid #eee;
        color: #363636;
        padding: 7px;
        cursor: pointer;

        &.highlighted {
          background: #f8f8f8
        }
      }
    }
  }
</style>
