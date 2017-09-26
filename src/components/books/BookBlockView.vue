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
    <div class="table-cell" :class="{'completed': isCompleted}" >
        <div class="table-body -content"
        @mouseleave="onBlur"
        @click="onBlur">
            <div class="table-row controls-top" :data-json="JSON.stringify(block)">

              <div class="par-ctrl -hidden -left">
                  <div class="block-menu">
                    <i class="glyphicon glyphicon-menu-hamburger"
                    @click.prevent="$refs.blockMenu.open($event, block._id)">
                    </i>
                    <block-menu
                        ref="blockMenu"
                        dir="top"
                        :update="update">

                      <li v-if="isHideArchFlags"
                        @click.prevent="toggleArchFlags()">
                        <i class="fa fa-eye" aria-hidden="true"></i>
                        Show archived flags</li>
                      <li v-else
                        @click.prevent="toggleArchFlags()">
                        <i class="fa fa-eye-slash" aria-hidden="true"></i>
                        Hide archived flags</li>

                      <li class="separator"></li>
                      <template v-if="tc_hasTask('content_cleanup')">
                        <li @click="insertBlockBefore()">Insert block before</li>
                        <li @click="insertBlockAfter()">Insert block after</li>
                        <li @click="deleteBlockMessage = true">Delete block</li>
                        <li>Split block</li>
                        <li>Join with previous block</li>
                        <li>Join with next block</li>
                        <li class="separator"></li>
                      </template>
                      <li @click="discardBlock">
                        <i class="fa fa-undo" aria-hidden="true"></i>
                        Discard un-saved changes</li>
                      <li @click="discardAudio">
                        <i class="fa fa-cloud-download" aria-hidden="true"></i>
                        Revert to original audio</li>
                    </block-menu>
                  </div>

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
                :class="[ block.type, block.classes, {
                  'updated': isUpdated,
                  'playing': isAudStarted || tc_showBlockNarrate(block._id),
                  'hide-archive': isHideArchFlags
                }]"
                :data-audiosrc="blockAudio.src"
                @click="onClick"
                @input="onInput"
                @mouseenter="onHover"

                @contextmenu.prevent="onContext">
                </div>
                <!--<div class="content-wrap">-->

                <block-flag-popup
                    ref="blockFlagPopup"
                    dir="top"
                    :isHideArchFlags="isHideArchFlags"
                    :isHideArchParts="isHideArchParts"
                    :toggleHideArchParts="toggleHideArchParts"
                    :countArchParts="countArchParts"
                >

                  <template v-for="(part, partIdx) in flagsSel.parts">
                    <template v-if="part.status!=='hidden' || !isHideArchFlags || !isHideArchParts">
                    <li>

                    <div class="flag-header -left">

                      <i class="glyphicon glyphicon-triangle-bottom"
                        v-if="!part.collapsed"
                        @click.prevent="toggleFlagPart($event, partIdx)"></i>
                      <i class="glyphicon glyphicon-triangle-right"
                        v-if="part.collapsed"
                        @click.prevent="toggleFlagPart($event, partIdx)"></i>

                      <span v-if="part.type == 'editor'">Editing</span>
                      <span v-if="part.type == 'narrator'">Narrating</span>
                      <span class="flag-date">{{moment(part.created_at).format("D MMM")}}</span>
                      <i v-if="part.status == 'resolved'" class="glyphicon glyphicon-flag flag-resolved"></i>
                      <i v-if="part.status == 'open'" class="glyphicon glyphicon-flag flag-open"></i>
                      <i v-if="part.status == 'hidden'" class="glyphicon glyphicon-flag flag-hidden"></i>
                    </div>



                    <a href="#" class="flag-control -right -top"
                      v-if="allowArchiving && part.status == 'resolved'"
                      @click.prevent="hideFlagPart($event, partIdx)">
                      Archive flag</a>

                    <a href="#" class="flag-control -right -top"
                      v-if="allowArchiving && part.status == 'hidden'"
                      @click.prevent="unHideFlagPart($event, partIdx)">
                      Unarchive flag</a>

                    <a href="#" class="flag-control -right -top"
                      v-if="canDeleteFlagPart(part) && part.status == 'open'"
                      @click.prevent="delFlagPart($event, partIdx)">
                      <i class="fa fa-trash"></i></a>

                    <div class="clearfix"></div>

                    <template v-if="!part.collapsed">

                    <p v-if="part.content" class="flag-content">"{{part.content}}"</p>

                    <p v-for="comment in part.comments" class="flag-comment">
                      <i>{{comment.creator}}</i>&nbsp;({{moment(comment.created_at).format("D MMM")}}): {{comment.comment}}
                    </p>

                    <textarea v-if="part.status !== 'hidden'"
                      class="flag-comment"
                      v-model="part.newComment"
                      placeholder="Enter description here ...">
                    </textarea>

                    </template>

                    <template v-if="block.isNeedAlso(flagsSel._id)">
                      <a v-if="part.type == 'editor'"
                      href="#" class="flag-control -right"
                      @click.prevent="addFlagPart(part.content, 'narrator')">
                      Flag for narration also</a>
                      <a v-if="part.type == 'narrator'"
                      href="#" class="flag-control -right"
                      @click.prevent="addFlagPart(part.content, 'editor')">
                      Flag for editing also</a>
                    </template>

                    <a v-if="part.status == 'resolved' && !part.collapsed"
                      href="#" class="flag-control"
                      @click.prevent="reopenFlagPart($event, partIdx)">
                      Re-open flag</a>

                    <a v-if="canResolveFlagPart(part) && part.status == 'open' && !part.collapsed"
                      href="#" class="flag-control -left"
                      @click.prevent="resolveFlagPart($event, partIdx)">
                      Resolve flag</a>

                    <div class="clearfix"></div>

                    </li>
                    <!--<li class="separator"></li>-->

                    </template>
                  </template>

                </block-flag-popup>

                <block-cntx-menu
                    ref="blockCntx"
                    dir="bottom"
                    :update="update"
                >
                  <li v-if="range.collapsed" @click="addFootnote">Add footnote</li>
                  <li class="separator"></li>
                  <li v-if="!range.collapsed" @click="addFlag($event, 'editor')">Flag for Editing</li>
                  <li v-if="!range.collapsed" @click="addFlag($event, 'narrator')">Flag for Narration</li>
                  <template v-if="!range.collapsed && blockAudio.src">
                    <li class="separator"></li>
                    <li @click="audPlayFromSelection()">Play from here</li>
                    <li @click="audPlaySelection()">Play selection</li>
                    <li @click="audDeleteSelection()">Delete audio in selection</li>
                  </template>
                  <template v-if="!range.collapsed && tc_showBlockNarrate(block._id)">
                    <li class="separator"></li>
                    <li @click="reRecord">Re-record audio</li>
                  </template>
                  <!--<li @click="test">test</li>-->
                </block-cntx-menu>

            </div>
            <!--<div class="table-row ocean">-->

            <div class="table-row content-footnotes"
              v-if="block.footnotes.length > 0">
              <div class="table-body footnote"
                v-for="(footnote, footnoteIdx) in block.footnotes">
                <div class="table-row">
                  <div class="table-cell -num">{{footnoteIdx+1}}.</div>
                  <div class="table-cell -text"
                    :class="['js-footnote-val']"
                    contenteditable="true"
                    @input="commitFootnote(footnoteIdx, $event)"
                    v-html="footnote">
                  </div>
                  <div class="table-cell -control">
                    <span @click="delFootnote(footnoteIdx)"><i class="fa fa-trash"></i></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-row controls-bottom">
              <div class="save-block -hidden -left"
              v-bind:class="{ '-disabled': (!isChanged && !isAudioChanged) }"
              @click="assembleBlockProxy">
                  <i class="fa fa-save fa-lg"></i>&nbsp;&nbsp;save
              </div>
              <div class="par-ctrl -hidden -right">
                  <!--<span>isCompleted: {{isCompleted}}</span>-->
                  <template v-if="!isCompleted">
                  <span>
                    <i class="glyphicon glyphicon-flag"
                      ref="blockFlagControl"
                      @click="handleBlockFlagClick"
                    ></i>
                  </span>
                  <span v-bind:class="{ '-disabled': isNeedWorkDisabled }"
                    @click.prevent="reworkBlock">
                    <i class="fa fa-hand-o-left"></i>&nbsp;&nbsp;Need work</span>
                  <span v-bind:class="{ '-disabled': isApproveDisabled }"
                    @click.prevent="approveBlock">
                    <i class="fa fa-thumbs-o-up"></i>&nbsp;&nbsp;Approve</span>
                  </template>
              </div>
              <!--<div class="-hidden">-->
            </div>
            <!--<div class="table-row controls-bottom">-->
        </div>
    </div>
    <div class="table-cell controls-right">
    </div>
    <modal v-model="deleteBlockMessage" effect="fade" ok-text="Delete" cancel-text="Cancel" title="Delete block" @ok="deleteBlock()">
      <div>Delete block? </div>
    </modal>
</div>
</template>

<script>
import Vue from 'vue'
import moment from 'moment'
import { mapGetters, mapActions }    from 'vuex'
import {  QuoteButton, QuotePreview,
          SuggestButton, SuggestPreview
        } from '../generic/ExtMediumEditor';
import ReadAlong          from 'readalong'
import BlockMenu          from '../generic/BlockMenu';
import BlockContextMenu   from '../generic/BlockContextMenu';
import BlockFlagPopup     from '../generic/BlockFlagPopup';
import taskControls       from '../../mixins/task_controls.js'
import apiConfig          from '../../mixins/api_config.js'
import { modal }          from 'vue-strap'
var BPromise = require('bluebird');

export default {
  data () {
    return {
      editor: false,
      player: false,
      range: false,
      flagsSel: false,
      flagEl: 'f',
      quoteEl: 'w',
      suggestEl: 'sg',
      footEl: 'sup',
      isHideArchFlags: true,
      isHideArchParts: true,
      moment: moment,
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
      recordStartCounter: 0,
      deleteBlockMessage: false
    }
  },
  components: {
      'block-menu': BlockMenu,
      'block-cntx-menu': BlockContextMenu,
      'block-flag-popup': BlockFlagPopup,
      'modal': modal
  },
  props: ['block', 'putBlock', 'getBlock', 'recorder', 'blockOrderChanged'],
  mixins: [taskControls, apiConfig],
  computed: {
      blockClasses : function () {
          return this.blockTypeClasses[this.block.type];
      },
      countArchParts: function () {
          return this.flagsSel ? this.block.countArchParts(this.flagsSel._id) : 0;
      },
      countFlags: function () {
          return this.block.flags && this.block.flags.length;
      },
      isNeedWorkDisabled: function () {
          let flagsSummary = this.block.calcFlagsSummary();
          let executors = this.tc_currentBookTasks.job.executors;
          if (executors[flagsSummary.dir] ==  this.auth.getSession().user_id) return true;

          return flagsSummary.stat !== 'open';
      },
      isApproveDisabled: function () {
          if (!(this.blockAudio && this.blockAudio.src)) return true;
          if (!(this.block.calcFlagsSummary().stat !== 'open')) return true;
          return false;
      },
      isCompleted: function () {
          return this.tc_getBlockTask(this.block._id) ? false : true;
      },
      ...mapGetters({
          auth: 'auth',
          book: 'currentBook',
          meta: 'currentBookMeta',
          watchBlk: 'contentDBWatch',
          tc_currentBookTasks: 'tc_currentBookTasks',
          allowArchiving: 'allowArchiving',
          authors: 'authors'
      })
  },
  beforeDestroy:  function() {
    if (this.editor) this.editor.destroy();
  },
  mounted: function() {
      this.initEditor();
      this.blockAudio = {'map': this.block.content, 'src': this.block.audiosrc ? this.block.audiosrc : ''};
      if (!this.player && this.blockAudio.src) {
          this.blockAudio.src = this.blockAudio.src + '?' + (new Date()).toJSON();
          this.initPlayer();
      }

      Vue.nextTick(() => {
        if (this.$refs.blockContent) {
          this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
            flag.addEventListener('click', this.handleFlagClick);
          });
        }
      });
      this.updateFlagStatus(this.block._id);
      //this.detectMissedFlags();

  },
  methods: {
      ...mapActions([
        'putMetaAuthors',
        'tc_approveBookTask'
      ]),
      initEditor(force) {
        if (!this.editor || force === true) {
          this.editor = new MediumEditor('.content-wrap', {
              toolbar: {
                buttons: [
                  'bold', 'italic', 'underline',
                  'superscript', 'subscript',
                  'orderedlist', 'unorderedlist',
    //               'html', 'anchor',
                  'quoteButton', 'suggestButton'
                ]
              },
              buttonLabels: 'fontawesome',
              quotesList: this.authors,
              onQuoteSave: this.onQuoteSave,
              suggestEl: this.suggestEl,
              extensions: {
                'quoteButton': new QuoteButton(),
                'quotePreview': new QuotePreview(),
                'suggestButton': new SuggestButton(),
                'suggestPreview': new SuggestPreview()
              },
              disableEditing: !this.tc_isShowEdit(this.block._id)
          });
    //       this.editor.subscribe('hideToolbar', (data, editable)=>{});
    //       this.editor.subscribe('positionToolbar', ()=>{})
        }
      },
      onQuoteSave: function() {
        this.putMetaAuthors(this.authors).then(()=>{
          this.update();
        });
      },
      onHover: function() {
        //this.$refs.blockContent.focus();
        //console.log(this.block.calcFlagsSummary());
        //console.log(this.tc_currentBookTasks.job.executors);
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
        this.range = window.getSelection().getRangeAt(0).cloneRange();
        this.$refs.blockCntx.open(e, this.range);
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
          Vue.nextTick(() => {
            if (this.$refs.blockContent) this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
              flag.addEventListener('click', this.handleFlagClick);
            });
          });
          this.isChanged = false;
          this.updateFlagStatus(this.block._id);
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

      assembleBlockProxy: function (ev) {
        if (this.isAudioChanged) return this.assembleBlockAudio(ev);
        else if (this.isChanged) return this.assembleBlock(ev);
        return BPromise.resolve();
      },

      assembleBlock: function(ev) {
        this.block.content = this.$refs.blockContent.innerHTML;
        this.block.classes = [this.block.classes];

        this.checkBlockContentFlags();
        this.updateFlagStatus(this.block._id);
        return this.putBlock(this.block).then(()=>{ this.isChanged = false });
      },

      checkBlockContentFlags: function(ev) {
        if (this.block.flags) this.block.flags.forEach((flag, flagIdx)=>{
          if (flag._id !== this.block._id) {
            let node = this.$refs.blockContent.querySelector(`[data-flag="${flag._id}"]`);
            if (!node) this.block.mergeFlags(flagIdx);
          }
        });
      },

      assembleBlockAudio: function(ev) {
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
                return this.putBlock(this.block);
              }
            })
            .catch(err => {});
        }
        this.isAudioChanged = false;
      },

      reworkBlock: function(ev) {
        if (!this.isNeedWorkDisabled) {
          this.actionWithBlock(ev)
        }
      },

      approveBlock: function(ev) {
        if (!this.isApproveDisabled) {
          this.actionWithBlock(ev);
        }
      },

      actionWithBlock: function(ev) {
        this.assembleBlockProxy(ev)
        .then(()=>{
          //console.log('audio', this.block.audiosrc);
          let task = this.tc_getBlockTask(this.block._id);

          if (!task) {
             task = {
              blockid: this.block._id,
              bookid: this.block.bookid
            }
          }

          let blockSummary = this.block.calcFlagsSummary();
          task.nextStep = blockSummary.dir;

          this.tc_approveBookTask(task)
          .then(response => {
            if (response.status == 200) {}
          })
          .catch(err => {});
        });
        this.$root.$emit('closeFlagPopup', true);
//      this.assembleBlockProxy(ev).then(()=>{
//      this.watchBlk.once('change', (change) => {
      },

      audPlay: function(block_id, ev) {
        this.audCleanClasses(block_id, ev);
        this.player.playBlock('content-'+block_id);
      },
      audPlayFromSelection() {
        let startElement = this._getParent(this.range.startContainer, 'w');
        if (startElement) {
          this.isAudStarted = true;
          this.player.playFromWordElement(startElement, 'content-'+this.block._id);
        }
      },
      audPlaySelection() {
        let startElement = this._getParent(this.range.startContainer, 'w');
        let endElement = this._getParent(this.range.endContainer, 'w');
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
        let startElement = this._getParent(this.range.startContainer, 'w');
        let endElement = this._getParent(this.range.endContainer, 'w');
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
        this.range.insertNode(el);
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

      addFlag: function(ev, type = 'editor') {
        if (window.getSelection) {
          let flag = document.createElement(this.flagEl);
          let existsFlag = this.detectExistingFlag();
          if (!existsFlag) {
            flag.dataset.flag = this.block.newFlag(this.range, type);
            flag.dataset.status = 'open';
            flag.appendChild(this.range.extractContents());
            this.range.insertNode(flag);
            flag.addEventListener('click', this.handleFlagClick);
            this.handleFlagClick({target: flag});
          } else {
            this.block.addFlag(existsFlag.dataset.flag, this.range, type);
            this.handleFlagClick({target: existsFlag});
          }
          this.$refs.blockFlagPopup.scrollBottom();
          this.isChanged = true;
        }
      },

      addFlagPart: function(content, type = 'editor') {
        this.block.addPart(this.flagsSel._id, content, type);

        this.updateFlagStatus(this.flagsSel._id);
        this.$refs.blockFlagPopup.reset();

        this.$refs.blockFlagPopup.scrollBottom();
        this.isChanged = true;
      },

      detectExistingFlag: function(ev) {
        let node = this.range.startContainer;
        let endNode = this.range.endContainer;
        let target = MediumEditor.util.traverseUp(node, (element)=>{
          return element.dataset.flag;
        })
        while (target === false && node && node != endNode) {
          target = MediumEditor.util.traverseUp(node = this.nextNode(node), (element)=>{
            return element.dataset.flag;
          })
        }
        return target;
      },

      nextNode: function (node) {
        if (node.hasChildNodes()) {
          return node.firstChild;
        } else {
          while (node && !node.nextSibling) {
            node = node.parentNode;
          }
          if (!node) {
            return null;
          }
          return node.nextSibling;
        }
      },

      handleFlagClick: function(ev) {
        let flagId = ev.target.dataset.flag;
        this.flagsSel = this.block.flags.filter((flag)=>{
          return flag._id === flagId;
        })[0];
        this.isHideArchParts = true;
        this.$refs.blockFlagPopup.open(ev, flagId);
        this.updateFlagStatus(flagId);
      },

      handleBlockFlagClick: function(ev, type = 'editor') {
        let flagId = this.block._id;
        let foundBlockFlag = this.block.flags.filter((flag)=>{
          return flag._id === flagId;
        });

        if (foundBlockFlag.length == 0) {
          flagId = this.$refs.blockFlagControl.dataset.flag = this.block.newFlag({}, type, true);
          this.$refs.blockFlagControl.dataset.status = 'open';
        }

        this.flagsSel = this.block.flags.filter((flag)=>{
          return flag._id === flagId;
        })[0];

        this.$refs.blockFlagControl.dataset.flag = flagId;
        this.isHideArchParts = true;
        this.$refs.blockFlagPopup.open(ev, flagId);
        this.updateFlagStatus(flagId);
      },

      updateFlagStatus: function (flagId) {
        let node;
        if (flagId ===  this.block._id) {
          node = this.$refs.blockFlagControl;
          if (node) node.dataset.flag = flagId;
        } else {
          node = this.$refs.blockContent.querySelector(`[data-flag="${flagId}"]`);
        }
        if (node) node.dataset.status = this.block.calcFlagStatus(flagId);
      },

      canResolveFlagPart: function (flagPart) {
          let result = false;
          if (flagPart.creator === this.auth.getSession().user_id) {
            result = true;
            if (flagPart.comments.length) flagPart.comments.forEach((comment)=>{
              if (comment.creator !== flagPart.creator) result = false;
            });
          } else {
            if (this.$store.state.auth.confirmRole(flagPart.type)) result = true;
          }
          return result;
      },

      canDeleteFlagPart: function (flagPart) {
          let result = false;
          if (flagPart.creator === this.auth.getSession().user_id) {
            result = true;
            if (flagPart.comments.length) flagPart.comments.forEach((comment)=>{
              if (comment.creator !== flagPart.creator) result = false;
            });
          }
          return result;
      },

      delFlagPart: function(ev, partIdx) {
        if (this.canDeleteFlagPart(this.flagsSel.parts[partIdx])) {

            this.flagsSel.parts.splice(partIdx, 1);

            if (this.flagsSel.parts.length == 0) {
              if (this.flagsSel._id !== this.block._id) {
                let node = this.$refs.blockContent.querySelector(`[data-flag="${this.flagsSel._id}"]`);
                let parent = node.parentNode;
                while (node.firstChild) parent.insertBefore(node.firstChild, node);
                parent.removeChild(node);
              } else {
                this.$refs.blockFlagControl.removeAttribute('data-flag');
                this.$refs.blockFlagControl.removeAttribute('data-status');
                this.block.delFlag(this.flagsSel._id);
              }
              this.$root.$emit('closeFlagPopup', true);
            }
            else {
              this.$refs.blockFlagPopup.reset();
              this.updateFlagStatus(this.flagsSel._id);
            }
            this.isChanged = true;
        }
      },

      toggleFlagPart: function(ev, partIdx) {
        if (!this.flagsSel.parts[partIdx].collapsed) this.flagsSel.parts[partIdx].collapsed = true;
        else this.flagsSel.parts[partIdx].collapsed = !this.flagsSel.parts[partIdx].collapsed;
        this.$refs.blockFlagPopup.reset();
      },

      resolveFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'resolved';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
      },

      reopenFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'open';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
      },

      hideFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'hidden';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
      },

      unHideFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'resolved';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
      },

      toggleArchFlags: function(ev, partIdx) {
        this.isHideArchFlags = !this.isHideArchFlags;
      },

      toggleHideArchParts: function() {
        this.isHideArchParts = !this.isHideArchParts;
        this.$refs.blockFlagPopup.reset();
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
        let startElement = this._getParent(this.range.startContainer, 'w');
        let endElement = this._getParent(this.range.endContainer, 'w');
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
      insertBlockBefore() {
        this.$emit('insertBefore', this.block._id);
      },
      insertBlockAfter() {
        this.$emit('insertAfter', this.block._id);
      },
      deleteBlock() {
        this.deleteBlockMessage = false;
        this.$emit('deleteBlock', this.block._id);
      },
      setChanged(val) {
        if (!this.blockOrderChanged || !val) {
          this.isChanged = val;
        }
      },
      setUpdated(val) {
        if (!this.blockOrderChanged || !val) {
          this.isUpdated = val;
        }
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
        let startElement = this._getParent(this.range.startContainer, 'w');
        let endElement = this._getParent(this.range.endContainer, 'w');
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
      'block._id' (newVal) {
        this.isUpdated = false;
      },
      'block._rev' (newVal) {
          //console.log('block._rev', newVal);
          this.setUpdated(true);
          setTimeout(() => {
              this.setUpdated(false);
          }, 2000);
          if (!this.blockAudio.src || !this.tc_showBlockNarrate(this.block._id)) {
            this.blockAudio = {
              'src': this.block.audiosrc ? this.block.audiosrc + '?' + (new Date()).toJSON() : '',
              'map': this.block.content
            };
          }
          Vue.nextTick(() => {
            if (this.$refs.blockContent) this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
              flag.addEventListener('click', this.handleFlagClick);
            });
          });
      },
      'block.type' (newVal) {
        this.setChanged(true);
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

    &.completed {
      background: #EFEFEF;
      border-radius: 7px;
      padding: 7px;
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
          color: gray;
          &:hover {
            color: #303030;
            .fa, .glyphicon, {
              color: #303030;
            }
          }
        }
        span.-disabled {
          color: lightgray;
          .fa, .glyphicon, {
            color: lightgray;
          }
          &:hover {
            color: lightgray;
            .fa, .glyphicon, {
              color: lightgray;
            }
          }
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

    &.ocean {
      .content-wrap {
        &.header, &.subhead {
          margin: 4px;
        }
      }
    }

    .block-menu {
      display: inline-block;
      position: relative;
      width: 40px;
      .fa, .glyphicon {
        margin-right: 5px;
      }
      .fa.fa-eye {
        margin-right: 6px;
      }
      .fa.fa-undo {
        margin-right: 7px;
        margin-left: 2px;
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

.fa:hover, .glyphicon:hover {
    color: #303030;
}

.par-ctrl {
    width: auto;
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

  [data-suggestion] {
    background: yellow;
  }

  [data-flag] {
    position: relative;
    border-bottom: 2px solid red;
    pointer-events: none;
    &:before {
      pointer-events: all;
      /*content: "\F024";*/
      content: "\e034";
      /*font-family: 'FontAwesome';*/
      font-family: 'Glyphicons Halflings';
      color: red;
      cursor: pointer;
      display: inline-block;
      margin-right: 1px;
      position: relative;
      top: 2px;
    }

    &[data-status="open"] {
      border-bottom: 2px solid red;
      &:before {
        color: red;
      }
    }
    &[data-status="resolved"] {
      border-bottom: 2px solid green;
      &:before {
        color: green;
      }
    }
    &[data-status="hidden"] {
      border-bottom: 2px solid gray;
      &:before {
        color: gray;
      }
    }
  }

  .hide-archive {
    [data-flag] {
      &[data-status="hidden"] {
        border-bottom: none;
        &:before {
          content: '';
        }
      }
    }
  }

  i[data-flag] {
    &[data-status] {
      border-bottom: none;
    }
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

    .medium-editor-toolbar-input {

      &.quote-input {
        position: relative;
        font-size: 16px;
        padding-left: 8px;
        /*line-height: 20px;*/
      }

      &.suggest-input {
        position: relative;
        font-size: 16px;
        padding-left: 8px;
      }
    }

    ul.quotes-list {
      display: flex;
      flex-direction: column;
      margin-top: -4px;
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
