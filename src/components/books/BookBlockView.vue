<template>
<div class="table-body -block" :id="block._id">
    <div class="table-cell controls-left">
        <div class="table-row parnum-row">
          <span v-if="block.type=='par' && block.parnum!==false" :class="['parnum']">{{block.parnum}}</span>

          <span v-if="block.type=='header' && block.secnum!==false" :class="['parnum', '-hidden-hover']">{{block.secnum}}</span>

          <span v-if="block.type=='header' && block.secnum===''" :class="['parnum', '-hidden-hover', '-auto']">Auto</span>

          <input v-if="block.type=='header' && block.secnum!==false"
            :class="['secnum', '-hidden']"
            v-model="block.secnum" @input="setSecnumVal"
            type="text" maxlength="3" size="3"/>

        </div>
        <div class="table-row">
            <div class='par-ctrl -hidden'>
                <i v-if="block.type=='header'"
                  class="fa fa-header"
                  :class="{'-active': block.secnum!==false}"
                  @click="setSecnum"></i>

                <i v-if="block.type=='par'"
                  class="fa fa-paragraph"
                  :class="{'-active': block.parnum!==false}"
                  @click="setParnum"></i>
            </div>
            <div v-if="false" class='par-ctrl -hidden'>
                <i class="glyphicon glyphicon-volume-up"></i>
                <i class="glyphicon glyphicon-volume-off"></i>
            </div>
        </div>
    </div>
    <div class="table-cell" :class="{'completed': isCompleted}" >
        <div :class="['table-body', '-content', {'editing': isAudioEditing}]"
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
                        :update="update"
                        @click.stop>

                      <li v-if="isHideArchFlags"
                        @click.prevent="toggleArchFlags()">
                        <i class="fa fa-eye" aria-hidden="true"></i>
                        Show archived flags</li>
                      <li v-else
                        @click.prevent="toggleArchFlags()">
                        <i class="fa fa-eye-slash" aria-hidden="true"></i>
                        Hide archived flags</li>

                      <li class="separator"></li>
                      <template v-if="allowEditing">
                        <li @click="insertBlockBefore()">Insert block before</li>
                        <li @click="insertBlockAfter()">Insert block after</li>
                        <li @click="showModal('delete-block-message')">Delete block</li>
                        <!--<li>Split block</li>-->
                        <li @click="joinWithPrevious()">Join with previous block</li>
                        <li @click="joinWithNext()">Join with next block</li>
                        <li class="separator"></li>
                      </template>
                      <li @click="discardBlock" v-if="allowEditing">
                        <i class="fa fa-undo" aria-hidden="true"></i>
                        Discard un-saved changes</li>
                      <li @click="discardAudio" v-if="allowEditing">
                        <i class="fa fa-cloud-download" aria-hidden="true"></i>
                        Revert to original audio</li>
                    </block-menu>
                  </div>

                  <!--<i class="fa fa-trash-o fa-lg"></i>-->
                  <!--<i class="fa fa-pencil-square-o fa-lg"></i>-->

                  <!--<label v-if="block.type=='header'">start:&nbsp;<input type="checkbox"/></label>&nbsp;-->
                  <template v-if="allowEditing">
                    <!-- Block Type selector -->
                    <label>type:&nbsp;
                    <select v-model='block.type' style="min-width: 80px;" @input="setChanged(true)"><!--v-model='block.type'--><!--:value="type"-->
                      <option v-for="(type, key) in blockTypes" :value="key">{{ key }}</option>
                    </select>
                    </label>
                    <!-- Block Class selector -->
                    <label>classes:&nbsp;
                    <select v-model='classSel' style="min-width: 100px;" @input="setChangedByClass(true)"><!--v-model='block.classes'--><!--:value="style"-->
                      <option v-for="(val, key) in blockClasses" :value="key">{{ key }}</option>
                    </select>
                    </label>
                    <!-- Block Class selector -->
                    <label v-if="blockStyles">style:&nbsp;
                    <select v-model='styleSel' style="min-width: 110px;" @input="setChanged(true)"><!--v-model='block.classes'--><!--:value="style"-->
                      <option v-for="(val, key) in blockStyles" :value="val">{{ val }}</option>
                    </select>
                  </label><!-- &nbsp;&nbsp;{{block.getClass()}}-->
                    <template v-if="allowVoiceworkChange()">
                      <label>Voicework:&nbsp;
                      <select v-model='voiceworkSel' style="min-width: 100px;" ref="voiceworkSel">
                        <option v-for="(val, key) in blockVoiceworksSel" :value="key">{{ val }}</option>
                      </select>
                      </label>
                    </template>
                    <template v-else>
                      <label>Voicework:&nbsp;{{blockVoiceworks[block.voicework]}}
                      </label>
                    </template>
                  </template>
              </div>
              <!--<div class="-hidden">-->

              <div class="par-ctrl -audio -hidden -right">
                  <template v-if="blockAudio.src && (tc_showBlockNarrate(block._id) || (isEditor && tc_isShowEdit(block._id))) && !isAudioChanged">
                    <i class="fa fa-pencil" v-on:click="showAudioEditor"></i>
                  </template>
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
                        <!--<div class="empty-control"></div>--><!-- empty block to keep order -->
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
            <div :class="['table-row ilm-block', block.markedAsDone ? '-marked':'']">
                <hr v-if="block.type=='hr'" :class="[block.getClass()]"/>

                <div v-else-if="block.type == 'illustration'" :class="['table-body illustration-block']">
                  <img v-if="block.illustration" :src="block.getIllustration()" :class="[block.getClass()]"/>
                  <div :class="['table-row drag-uploader', 'no-picture', {'__hidden': this.isChanged && !isIllustrationChanged}]" v-if="allowEditing">
                    <vue-picture-input
                      @change="onIllustrationChange"
                      @remove="onIllustrationChange"
                      ref="illustrationInput"
                      accept="image/*"
                      :customStrings="{ drag: 'Click here or drag image here' }"
                      :removable="true"
                      :crop="false">
                    </vue-picture-input>
                    <!-- <div class="save-illustration" v-if="isIllustrationChanged">
                      <button class="btn btn-default" @click="uploadIllustration">Save picture</button>
                    </div> -->
                  </div>

                  <div :class="['table-row content-description', block.getClass()]">
                    <div class="content-wrap-desc description"
                      ref="blockDescription"
                      @input="commitDescription($event)"
                      v-html="block.description"
                      @contextmenu.prevent="onContext">
                    </div>
                  </div>

                </div>
                <!--<img v-if="block.illustration"-->

                <div v-else class="content-wrap"
                :id="'content-'+block._id"
                ref="blockContent"
                v-html="block.content"
                :class="[ block.getClass(), {
                  'updated': block.isUpdated,
                  'playing': blockAudio.src,
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
                      <a v-if="isCanFlag('narrator') && part.type == 'editor'"
                      href="#" class="flag-control -right"
                      @click.prevent="addFlagPart(part.content, 'narrator')">
                      Flag for narration also</a>
                      <a v-if="isCanFlag('editor') && part.type == 'narrator'"
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
                  <template v-if="isFootnoteAllowed()">
                    <li @click="addFootnote">Add footnote</li>
                    <li class="separator"></li>
                  </template>
                  <li v-if="isCanFlag('editor')" @click="addFlag($event, 'editor')">Flag for Editing</li>
                  <li v-if="isCanFlag('narrator')" @click="addFlag($event, 'narrator')">Flag for Narration</li>
                  <template v-if="!range.collapsed && blockAudio.src">
                    <li class="separator"></li>
                    <li @click="audPlayFromSelection()">Play from here</li>
                    <li @click="audPlaySelection()">Play selection</li>
                    <li v-if="allowEditing && !isAudioEditing" @click="audDeleteSelection()">Delete audio in selection</li>
                  </template>
                  <template v-if="!range.collapsed && tc_showBlockNarrate(block._id) && allowEditing && !isAudioEditing">
                    <li class="separator"></li>
                    <li @click="reRecord">Re-record audio</li>
                  </template>
                  <!--<li @click="test">test</li>-->
                </block-cntx-menu>

            </div>
            <!--<div class="table-row ilm-block">-->

            <div class="table-row content-footnotes"
              v-if="block.footnotes.length > 0">
              <div class="table-body footnote"
                v-for="(footnote, ftnIdx) in block.footnotes">

                <div class="table-row controls-top -hidden">
                  <div class="table-cell"></div>
                  <div class="table-cell">
                    <template v-if="allowEditing">
                      <template v-if="tc_hasTask('content_cleanup')">
                        <label>Voicework:&nbsp;
                        <select v-model='footnote.voicework' style="min-width: 100px;" ref="footnVoiceworkSel" @input="commitFootnote(ftnIdx, $event)">
                          <option v-for="(val, key) in footnVoiceworks" :value="key">{{ val }}</option>
                        </select>
                        </label>
                      </template>
                    </template>
                  </div>
                  <div class="table-cell -audio -right">
                    <template v-if="(footnote.audiosrc && footnote.audiosrc.length) && (isEditor && tc_isShowEdit(block._id))"> <!--&& !isAudioChanged"-->
                      <i class="fa fa-pencil" v-on:click="showFootnoteAudioEditor(footnote, ftnIdx, $event)"></i>
                    </template>
                    <template v-if="FtnAudio.palyer!==false && footnote.audiosrc && footnote.audiosrc.length">
                        <template v-if="!FtnAudio.isStarted || FtnAudio.isStarted!==`${block._id}_${ftnIdx}`">
                          <i class="fa fa-play-circle-o"
                            @click="FtnAudio.audPlay(block._id, ftnIdx)"></i>
                          <i class="fa fa-stop-circle-o disabled"></i>
                        </template>
                        <template v-else>
                          <i class="fa fa-pause-circle-o" v-if="!FtnAudio.isPaused"
                            @click="FtnAudio.audPause(block._id, ftnIdx)"></i>
                          <i class="fa fa-play-circle-o paused" v-else
                            @click="FtnAudio.audResume(block._id, ftnIdx)"></i>
                          <i class="fa fa-stop-circle-o"
                            @click="FtnAudio.audStop(block._id, ftnIdx)"></i>
                          <!--<div class="empty-control"></div>--><!-- empty block to keep order -->
                        </template>
                    </template>
                  </div>
                </div>

                <div class="table-row">
                  <div class="table-cell -num">{{ftnIdx+1}}.</div>
                  <div class="content-wrap-footn table-cell -text"
                    :id="block._id +'_'+ ftnIdx"
                    :data-audiosrc="footnote.audiosrc"
                    :data-footnoteIdx="block._id +'_'+ ftnIdx"
                    :class="['js-footnote-val', 'js-footnote-'+ block._id, {'playing': (footnote.audiosrc)}]"
                    @input="commitFootnote(ftnIdx, $event)"
                    v-html="footnote.content">
                  </div>
                  <div class="table-cell -control">
                    <span @click="delFootnote(ftnIdx)"><i class="fa fa-trash"></i></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-row controls-bottom">
              <div class="save-block -left"
              v-bind:class="{ '-disabled': (!isChanged && (!isAudioChanged || isAudioEditing) && !isIllustrationChanged) }"
              @click="assembleBlockProxy">
                  <i class="fa fa-save fa-lg"></i>&nbsp;&nbsp;save
              </div>
              <div class="align-range -hidden -left" v-if="allowEditing">
                Set block range: <label><input type="checkbox" v-on:change="setRangeSelection('start', $event)" class="set-range-start" :disabled="!allowSetStart"/>&nbsp;Start</label><label>&nbsp;&nbsp;<input type="checkbox" v-on:change="setRangeSelection('end', $event)" class="set-range-end" :disabled="!allowSetEnd"/>&nbsp;End</label>
                <template v-if="displaySelectionStart">
                  <a class="go-to-block" v-on:click="scrollToBlock(displaySelectionStart)">View start({{displaySelectionStart}})</a>
                </template>
                <template v-if="displaySelectionEnd">
                  <a class="go-to-block" v-on:click="scrollToBlock(displaySelectionEnd)">View end({{displaySelectionEnd}})</a>
                </template>
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

                  <span v-if="!enableMarkAsDone" :class="[{'-disabled': needWorkButtonDisabled}]"
                    @click.prevent="reworkBlock">
                    <i class="fa fa-hand-o-left"></i>&nbsp;&nbsp;Need work</span>
                  <span v-if="!enableMarkAsDone" :class="[{'-disabled': isApproveDisabled}]"
                    @click.prevent="approveBlock">
                    <i class="fa fa-thumbs-o-up"></i>&nbsp;&nbsp;Approve</span>

                  <span v-if="enableMarkAsDone" :class="[{'-disabled': markAsDoneButtonDisabled}]"
                    @click.prevent="markBlock">
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
    <modal :name="'delete-block-message' + block._id" :height="150" :resizeable="false">
        <div class="modal-header"></div>
        <div class="modal-body">
          <p>Delete block?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" v-on:click="hideModal('delete-block-message')">Cancel</button>
          <button class="btn btn-primary" v-on:click="deleteBlock()">Delete</button>
        </div>
      </modal>
    <modal :name="'voicework-change' + block._id" :resizeable="false" :height="250">
      <!-- custom header -->
      <div class="modal-header">
        <h4 class="modal-title">
          Voicework update
        </h4>
      </div>
      <div class="modal-body">
        <div>Apply "{{blockVoiceworks[voiceworkChange]}}" voicework type to</div>
        <div><label><input type="radio" name="voicework-update-type" v-model="voiceworkUpdateType" value="single" :disabled="voiceworkUpdating"/>this {{block.type}}</label></div>
        <div><label><input type="radio" name="voicework-update-type" v-model="voiceworkUpdateType" value="all" :disabled="voiceworkUpdating"/>all incomplete {{block.type}}s</label></div>
        <div>This will also delete current audio from the {{block.type}}(s)</div>
      </div>
      <!-- custom buttons -->
      <div class="modal-footer">
        <template v-if="!voiceworkUpdating">
          <button type="button" class="btn btn-default" @click="voiceworkChange = false">Cancel</button>
          <button type="button" class="btn btn-confirm" @click="updateVoicework()">Apply</button>
        </template>
        <template v-else>
          <div class="voicework-preloader"></div>
        </template>
      </div>
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
import _                  from 'lodash'
import ReadAlong          from 'readalong'
import BlockMenu          from '../generic/BlockMenu';
import BlockContextMenu   from '../generic/BlockContextMenu';
import BlockFlagPopup     from '../generic/BlockFlagPopup';
import taskControls       from '../../mixins/task_controls.js';
import apiConfig          from '../../mixins/api_config.js';
import access             from '../../mixins/access.js';
//import { modal }          from 'vue-strap';
import v_modal from 'vue-js-modal';
import { BlockTypes, FootNote }     from '../../store/bookBlock'
import VuePictureInput    from 'vue-picture-input'
var BPromise = require('bluebird');
Vue.use(v_modal, { dialog: true });

export default {
  data () {
    return {
      editor: false,
      player: false,
      range: false,
      editorDescr: false,
      editorFootn: false,
      flagsSel: false,
      flagEl: 'f',
      quoteEl: 'qq',
      suggestEl: 'sg',
      footEl: 'sup',
      isHideArchFlags: true,
      isHideArchParts: true,
      moment: moment,

      classSel: false,
      styleSel: false,
      blockTypes: BlockTypes,

      isChanged: false,

      isAudStarted: false,
      isAudPaused: false,
      isRecording: false,
      isRecordingPaused: false,
      isAudioChanged: false,
      isIllustrationChanged: false,
      blockAudio: {
        src: '',
        map: ''
      },
      FtnAudio: {
        player: false,
        isStarted: false,
        isPaused: false,
        isEditing: false,
        isChanged: false,
        map: '',
        audPlay: function(){}
      },

      reRecordPosition: false,
      isUpdating: false,
      recordStartCounter: 0,
      voiceworkChange: false,
      voiceworkUpdateType: 'single',
      isAudioEditing: false,
      voiceworkUpdating: false
    }
  },
  components: {
      'block-menu': BlockMenu,
      'block-cntx-menu': BlockContextMenu,
      'block-flag-popup': BlockFlagPopup,
      //'modal': modal,
      'vue-picture-input': VuePictureInput
  },
  props: ['block', 'putBlock', 'putBlockPart', 'getBlock', 'reCount', 'recorder', 'block_Idx', 'audioEditor', 'joinBlocks'],
  mixins: [taskControls, apiConfig, access],
  computed: {
      blockClasses: function () {
          return this.blockTypes[this.block.type];
      },
      blockStyles: function () {
          if (this.classSel && this.blockTypes[this.block.type][this.classSel] && this.blockTypes[this.block.type][this.classSel].length) {
            return this.blockTypes[this.block.type][this.classSel];
          }
          return false;
       },
      blockVoiceworks: function () {
        return {
          'audio_file': 'Audio file',
          'tts': 'Text to Speach',
          'narration': 'Narration',
          'no_audio': 'No audio'
        }
      },
      blockVoiceworksSel: function() {
        if (this.tc_hasTask('content_cleanup')) {
          return this.blockVoiceworks;
        }
        let voiceworks = {};
        for (let k in this.blockVoiceworks) {
          if (['tts', 'no_audio'].indexOf(k) !== -1) {
            voiceworks[k] = this.blockVoiceworks[k];
          }
        }
        return voiceworks;
      },
      footnVoiceworks: function () {
        return {
          'tts': 'Text to Speach',
          'no_audio': 'No audio'
        }
      },
      voiceworkSel: {
        get() {
          return this.block.voicework;
        },
        set(val) {
          if (val !== this.block.voicework) {
            this.voiceworkChange = val;
            this.showModal('voicework-change');
          }
        }
      },
      footnVoiceworkSel: {
        get() {
          return 'ttn';
        },
        set(val) {
//           if (val !== this.block.voicework) {
//             this.voiceworkChange = val;
//           }
        }
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
      enableMarkAsDone: function() {
        if (this.tc_getBlockTask(this.block._id)) {
          return false;
        }
        return this._is('editor') && (this.tc_hasTask('content_cleanup') || this.tc_hasTask('audio_mastering'));
      },
      markAsDoneButtonDisabled: function() {
        if (this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged) {
          return true;
        }
        return this.block.markedAsDone ||
                (this.block.status && this.block.status.proofed === true) ||
                !this.block.audiosrc && (this.block.voicework === 'audio_file' || this.block.voicework === 'tts');
      },
      isApproveDisabled: function () {
        if (this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged) {
          return true;
        }
          if (this._is('editor') && !this.tc_getBlockTask(this.block._id)) return true;
          if (this._is('narrator') && !(this.blockAudio && this.blockAudio.src)) return true;
          let flags_summary = this.block.calcFlagsSummary();
          if (!(flags_summary.stat !== 'open') && this._is(flags_summary.dir)) return true;
          if (flags_summary && flags_summary.stat === 'open' && flags_summary.dir && !this._is(flags_summary.dir)) {
            return true;
          }
          return false;
      },
      needWorkButtonDisabled: function() {
        if (this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged) {
          return true;
        }
        return false;
      },
      isCompleted: function () {
          if (this._is('editor') && (
                  this.tc_hasTask('content_cleanup') ||
                  (this.tc_hasTask('audio_mastering') && this.block.status && this.block.status.stage === 'audio_mastering')
                )) return false;
          return this.tc_getBlockTask(this.block._id) ? false : true;
      },
      allowSetStart: function () {
        return !this.$parent.selectionEnd._id || this.$parent.selectionEnd.index >= this.block.index;
      },
      allowSetEnd: function () {
        return !this.$parent.selectionStart._id || this.$parent.selectionStart.index <= this.block.index;
      },
      displaySelectionStart() {
        return this.$parent.selectionEnd._id == this.block._id ? this.$parent.selectionStart._id : false;
      },
      displaySelectionEnd() {
        return this.$parent.selectionStart._id == this.block._id ? this.$parent.selectionEnd._id : false;
      },
      ...mapGetters({
          auth: 'auth',
          book: 'currentBook',
          meta: 'currentBookMeta',
          watchBlk: 'contentDBWatch',
          tc_currentBookTasks: 'tc_currentBookTasks',
          authors: 'authors',
          allowArchiving: 'allowArchiving',
          isEditor: 'isEditor'
      }),
      illustrationChaged() {
        return this.$refs.illustrationInput.image
      },
      allowEditing: {
        get() {
          return this.tc_isShowEdit(this.block._id) || this.tc_hasTask('content_cleanup');
        }
      }
  },
  beforeDestroy:  function() {
    if (this.editor) this.editor.destroy();
  },
  mounted: function() {
      //this.initEditor();
      //console.log('mounted', this.block._id);
      this.blockAudio = {'map': this.block.content, 'src': this.block.audiosrc ? this.block.audiosrc : ''};
      if (!this.player && this.blockAudio.src) {
          this.blockAudio.src = this.blockAudio.src + '?' + (new Date()).toJSON();
          this.initPlayer();
      }

      if (this.block.footnotes && this.block.footnotes.length) {
        this.block.footnotes.forEach((footnote, footnoteIdx)=>{
          if (footnote.audiosrc && !this.FtnAudio.player) {
            this.initFootnotePlayer(this.FtnAudio);
            return true;
          }
        });
      }

//       if (this.block._id == '1_en_2s') {
//         console.log('this.FtnAudio11', this.FtnAudio);
//       }

      Vue.nextTick(() => {
        if (this.$refs.blockContent) {
          this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
            flag.addEventListener('click', this.handleFlagClick);
          });
        }
      });
      this.updateFlagStatus(this.block._id);
      if (Object.keys(this.blockTypes[this.block.type])[0] !== '') {
        this.classSel = Object.keys(this.blockTypes[this.block.type])[0];
      } else {
        let blockClasses = Object.keys(this.block.classes);
        if (blockClasses.length) {
          this.classSel = blockClasses[0];
        }
      }

      this.voiceworkSel = this.block.voicework;
      //this.detectMissedFlags();
  },
  methods: {
      ...mapActions([
        'putMetaAuthors',
        'tc_approveBookTask',
        'setCurrentBookBlocksLeft',
        'setCurrentBookCounters'
      ]),
      //-- Checkers -- { --//
      isCanFlag: function (flagType = false) {
        let canFlag = true;
        if (flagType) switch(flagType) {
          case 'editor' : {
            if (!this._is('admin') && this._is('editor')) canFlag = false;
          } break;
          case 'narrator' : {
            if (this.block.voicework !== 'narration') {
              canFlag = false;
            } else {
              if (!(this.block.audiosrc && this.block.audiosrc.length)) canFlag = false;
              else if (!this._is('admin') && this._is('narrator')) canFlag = false;
            }
          } break;
        };
        return canFlag && !this.tc_hasTask('content_cleanup') && !this.range.collapsed;
      },
      //-- } -- end -- Checkers --//

      destroyEditor() {
        if (this.editor) {
          //this.editor.removeElements();
          this.editor.destroy();
          if (this.block.type === 'illustration') {
            Vue.nextTick(() => {
              $('[id="' + this.block._id + '"] .illustration-block')
              .removeAttr('contenteditable')
              .removeAttr('data-placeholder');
            });
          }
        }
        if (this.editorDescr) {
          //this.editorDescr.removeElements();
          this.editorDescr.destroy();
          //this.editorDescr = false;
        }
        if (this.editorFootn) {
          this.editorFootn.destroy();
        }
      },

      initEditor(force) {
        if ((!this.editor || force === true) && this.block.needsText()) {
          let extensions = {};
          let toolbar = {buttons: []};
          if (this.allowEditing) {
            extensions = {
                'quoteButton': new QuoteButton(),
                'quotePreview': new QuotePreview(),
                'suggestButton': new SuggestButton(),
                'suggestPreview': new SuggestPreview()
              };
            toolbar = {
                buttons: [
                  'bold', 'italic', 'underline',
                  'superscript', 'subscript',
                  'orderedlist', 'unorderedlist',
    //               'html', 'anchor',
                  'quoteButton', 'suggestButton'
                ]
              };
          }
          this.editor = new MediumEditor('.content-wrap', {
              toolbar: toolbar,
              buttonLabels: 'fontawesome',
              quotesList: this.authors,
              onQuoteSave: this.onQuoteSave,
              suggestEl: this.suggestEl,
              extensions: extensions,
              disableEditing: !this.allowEditing
          });
    //       this.editor.subscribe('hideToolbar', (data, editable)=>{});
    //       this.editor.subscribe('positionToolbar', ()=>{})
        }  else if (this.editor) this.editor.setup();

        if ((!this.editorDescr || force === true) && this.block.needsText()) {
          let extensions = {};
          let toolbar = {buttons: []};
          if (this.allowEditing) {
            extensions = {
                'quoteButton': new QuoteButton(),
                'quotePreview': new QuotePreview()
              };
            toolbar = {
                buttons: [
                  'bold', 'italic', 'underline',
                  'superscript', 'subscript',
                  'orderedlist', 'unorderedlist',
                  'quoteButton', 'suggestButton'
                ]
              };
          }
          this.editorDescr = new MediumEditor('.content-wrap-desc', {
              toolbar: toolbar,
              buttonLabels: 'fontawesome',
              quotesList: this.authors,
              onQuoteSave: this.onQuoteSave,
              extensions: extensions,
              disableEditing: !this.allowEditing
          });
        } else if (this.editorDescr) this.editorDescr.setup();

        if ((!this.editorFootn || force === true) && this.block.needsText()) {
          let extensions = {};
          let toolbar = {buttons: []};
          if (this.allowEditing) {
            extensions = {
                'quoteButton': new QuoteButton(),
                'quotePreview': new QuotePreview(),
                'suggestButton': new SuggestButton(),
                'suggestPreview': new SuggestPreview()
              };
            toolbar = {
                buttons: [
                  'bold', 'italic', 'underline',
                  'superscript', 'subscript',
                  'orderedlist', 'unorderedlist',
                  'quoteButton', 'suggestButton'
                ]
              };
          }

          this.editorFootn = new MediumEditor('.content-wrap-footn' , {
              toolbar: toolbar,
              buttonLabels: 'fontawesome',
              quotesList: this.authors,
              onQuoteSave: this.onQuoteSave,
              suggestEl: this.suggestEl,
              extensions: extensions,
              disableEditing: !this.allowEditing
          });
        } else if (this.editorFootn) this.editorFootn.setup();

        $('.medium-editor-toolbar.medium-editor-stalker-toolbar').css('display', '');
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
        if (this.$refs.blockCntx && this.$refs.blockCntx.viewMenu) this.$refs.blockCntx.close();
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
        if (this.$refs.blockCntx) {
          this.$refs.blockCntx.open(e, this.range);
        }
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
          if (this.$refs.blockContent) this.$refs.blockContent.innerHTML = this.block.content;
          Vue.nextTick(() => {
            if (this.$refs.blockContent) this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
              flag.addEventListener('click', this.handleFlagClick);
            });
          });
          this.isChanged = false;
          this.updateFlagStatus(this.block._id);

          if (Object.keys(this.blockTypes[this.block.type])[0] !== '') {
            this.classSel = Object.keys(this.blockTypes[this.block.type])[0];
          } else {
            let blockClasses = Object.keys(this.block.classes);
            if (blockClasses.length) {
              this.classSel = blockClasses[0];
            }
          }

          if (this.$refs.blockContent) this.$refs.blockContent.focus();
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

      discardFtnAudio: function() {
//         this.blockAudio.src = this.block.audiosrc;
//         this.blockAudio.map = this.block.content;
//         let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_tmp';
//         let api = this.$store.state.auth.getHttp();
//         api.delete(api_url, {}, {})
//           .then(response => {
//
//           })
//           .catch(err => {
//
//           });
      },

      discardAudioEdit: function() {
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_edit';
        let api = this.$store.state.auth.getHttp();
        api.delete(api_url, {}, {})
          .then(response => {
            if (response.status == 200 && response.data) {
              this.block.content = response.data.content;
              this.blockAudio.src = process.env.ILM_API + response.data.audiosrc;
              this.blockAudio.map = response.data.content;
              this.block.audiosrc = this.blockAudio.src;
              this.isAudioChanged = false;
              this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map);
            }
          })
          .catch(err => {

          });
      },

      assembleBlockProxy: function (ev) {
        if (this.block.type == 'illustration') {
          if (this.isIllustrationChanged) {
            return this.uploadIllustration();
          } else if (this.isChanged) {
            return this.assembleBlock();
          }
        } else {
          if (this.isAudioChanged && !this.isAudioEditing) return this.assembleBlockAudio();
          else if (this.isChanged) return this.assembleBlock();
        }
        return BPromise.resolve();
      },

      assembleBlock: function() {
        switch (this.block.type) {
          case 'illustration':
            this.block.description = this.$refs.blockDescription.innerHTML;
          case 'hr':
            this.block.content = '';
            break;
          default:
            this.block.content = this.$refs.blockContent.innerHTML.replace(/(<[^>]+)(selected)/g, '$1');
            if (this.block.footnotes && this.block.footnotes.length) {
              this.block.footnotes.forEach((footnote, footnoteIdx)=>{
                this.block.footnotes[footnoteIdx].content = $('[data-footnoteIdx="'+this.block._id +'_'+ footnoteIdx+'"').html();
              });
            }
            break;
        }
        this.block.classes = [this.block.classes];
        if (this.block.markedAsDone === true) {
          this.block.markedAsDone = false;
        }
        if (this.block._markedAsDone) {
          this.block.markedAsDone = true;
          delete this.block._markedAsDone;
        }

        this.checkBlockContentFlags();
        this.updateFlagStatus(this.block._id);
        return this.putBlock(this.block).then(()=>{
          this.$emit('blockUpdated', this.block._id);
          this.isChanged = false;
          if (this.blockAudio.map) {
            this.blockAudio.map = this.block.content;
          }
          if (this.isAudioEditing) {
            this.$root.$emit('for-audioeditor:reload-text', this.block.content);
          }
          if (this.$refs.blockContent) {
            if (this.$refs.blockContent.dataset.has_suggestion) {
              if (this.$refs.blockContent.dataset.has_suggestion === 'true') {
                //console.log('has_suggestion', this.$refs.blockContent.dataset.has_suggestion);
                this.doReAlign();
              }
            }
            this.$refs.blockContent.dataset.has_suggestion = false;
          }
          this.reCount();
        });
      },

      checkBlockContentFlags: function() {
        if (this.block.flags) this.block.flags.forEach((flag, flagIdx)=>{
          if (flag._id !== this.block._id) {
            let node = this.$refs.blockContent.querySelector(`[data-flag="${flag._id}"]`);
            if (!node) this.block.mergeFlags(flagIdx);
          }
        });
      },

      assembleBlockAudio: function() {
        if (this.blockAudio.map) {
          let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_tmp';
          let api = this.$store.state.auth.getHttp();
          return api.post(api_url, {}, {})
            .then(response => {
              if (response.status == 200 && response.data.audiosrc) {
                this.block.content = this.blockAudio.map;
                this.block.audiosrc = response.data.audiosrc;
                //this.blockAudio.map = '';
                this.blockAudio.src = process.env.ILM_API + response.data.audiosrc;
                this.isAudioChanged = false;
                return this.putBlock(this.block);
              }
            })
            .catch(err => {});
        }
        this.isAudioChanged = false;
      },

      assembleBlockAudioEdit: function() {// to save changes from audio editor
        if (this.blockAudio.map && this.blockAudio.src) {
          let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_edit';
          let api = this.$store.state.auth.getHttp();
          return api.post(api_url, {
            audiosrc: this.blockAudio.src.replace(process.env.ILM_API, '').split('?').shift(),
            content: this.blockAudio.map
          }, {})
            .then(response => {
              if (response.status == 200) {
                //this.block.content = this.blockAudio.map;
                //this.block.audiosrc = response.data.audiosrc;
                //this.blockAudio.map = '';
                //this.blockAudio.src = '';
                //return this.putBlock(this.block);
                this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map);
                this.isAudioChanged = false;
                this.isChanged = false;
                return BPromise.resolve();
              }
            })
            .catch(err => BPromise.reject(err));
        } else {
          return BPromise.reject();
        }
        //this.isAudioChanged = false;
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

      unmarkBlock: function(ev) {
        if (this.block.markedAsDone) {
          this.block.markedAsDone = false;
          this.assembleBlock(ev)
          .then(()=>{
            //this.setCurrentBookBlocksLeft(this.block.bookid);
            this.setCurrentBookCounters(['not_marked_blocks']);
          });
        }
      },

      markBlock: function(ev) {
        if (!this.markAsDoneButtonDisabled) {
          if (!this.block.audiosrc && (this.block.voicework === 'audio_file' || this.block.voicework === 'tts')) {
            return false;
          }
          this.block._markedAsDone = true;
          this.assembleBlock(ev)
          .then(()=>{
            //this.setCurrentBookBlocksLeft(this.block.bookid);
            this.setCurrentBookCounters(['not_marked_blocks']);
          });
        }
      },

      actionWithBlock: function(ev) {
        this.assembleBlockProxy(ev)
        .then(()=>{
          let task = this.tc_getBlockTask(this.block._id);

          if (!task) {
             task = {
              blockid: this.block._id,
              bookid: this.block.bookid
            }
          }

          let blockSummary = this.block.calcFlagsSummary();
          task.nextStep = blockSummary.dir;

          if (task.nextStep == 'proofer' && !this.block.hasAudio()) {
            switch (this.block.voicework) {
              case 'narration':
                task.nextStep = 'narrator';
                break;
            }
          }

          this.tc_approveBookTask(task)
          .then(response => {
            if (response.status == 200) {
              if (typeof response.data._id !== 'undefined') {
                this.$root.$emit('bookBlocksUpdates', {blocks: [response.data]});
              }
            }
          })
          .catch(err => {});
        });

        this.$root.$emit('closeFlagPopup', true);
      },

      audPlay: function(block_id, ev) {
        if (this.player) {
          this.audCleanClasses(block_id, ev);
          this.player.playBlock('content-'+block_id);
        }
      },
      audPlayFromSelection() {
        if (this.player) {
          let startElement = this._getParent(this.range.startContainer, 'w');
          if (startElement) {
            this.isAudStarted = true;
            this.player.playFromWordElement(startElement, 'content-'+this.block._id);
          }
        }
      },
      audPlaySelection() {
        if (this.player) {
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
          this.$root.$emit('playBlock', this.block._id);
        }
      },
      audPause: function(block_id, ev) {
        if (this.player) {
          this.player.pause();
        }
      },
      audResume: function(block_id, ev) {
        if (this.player) {
          this.audCleanClasses(block_id, ev);
          this.player.resume();
        }
      },
      audStop: function(block_id, ev) {
        if (this.player) {
          this.player.pause();
          this.isAudStarted = false;
          this.isAudPaused = false;
          this.audCleanClasses(block_id, ev);
        }
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
        this._audDeletePart(startRange[0], endRange[0] + endRange[1]);
      },
      _audDeletePart(start, end) {
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_remove';
        let api = this.$store.state.auth.getHttp();
        this.isUpdating = true;
        let formData = new FormData();
        let position = [start, end];
        formData.append('position', position);
        formData.append('modified', this.isAudioChanged);
        formData.append('content', this.block.content);
        formData.append('audio', this.blockAudio.src.replace(process.env.ILM_API, '').split('?').shift());
        api.post(api_url, formData, {})
          .then(response => {
            this.isUpdating = false;
            if (response.status == 200) {
              this.blockAudio.src = process.env.ILM_API + response.data.audiosrc + '?' + (new Date()).toJSON();
              this.blockAudio.map = response.data.content;
              this.block.content = response.data.content;
              this.block.audiosrc = this.blockAudio.src;
              this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map);
            }
          })
          .catch(err => {
            this.isUpdating = false;
          });
      },
      insertSilence(position, length) {
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio/insert_silence';
        let api = this.$store.state.auth.getHttp();
        this.isUpdating = true;
        let formData = new FormData();
        formData.append('position', position);
        formData.append('modified', this.isAudioChanged);
        formData.append('length', length);
        formData.append('content', this.block.content);
        formData.append('audio', this.blockAudio.src.replace(process.env.ILM_API, '').split('?').shift());
        api.post(api_url, formData, {})
          .then(response => {
            this.isUpdating = false;
            if (response.status == 200) {
              this.blockAudio.src = process.env.ILM_API + response.data.audiosrc + '?' + (new Date()).toJSON();
              this.blockAudio.map = response.data.content;
              this.block.content = response.data.content;
              this.block.audiosrc = this.blockAudio.src;
              this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map);
              this.isAudioChanged = true;
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

      audFootnoteCleanClasses: function(ftnId) {
        let reading_class = this.FtnAudio.player.config.reading_class
        $(`#${ftnId}`).find('.'+reading_class).each(function(){
          $(this).removeClass(reading_class);
        });
        let trail_class = this.FtnAudio.player.config.trail_class
        $(`#${ftnId}`).find('.'+trail_class).each(function(){
          $(this).removeClass(trail_class);
        });
      },

      isFootnoteAllowed: function() {
        if (!this.allowEditing) return false;
        if (this.block.type == 'illustration') return false;
        if (!this.range) return false;
        let container = this.range.commonAncestorContainer;
        if (typeof container.length == 'undefined') return false;
        if (this.range.endOffset >= container.length) return true;
        let checkRange = document.createRange();
        //console.log(container, container.length, this.range.endOffset);
        checkRange.setStart( container, this.range.startOffset );
        checkRange.setEnd( container, this.range.endOffset+1 );
        let regexp = /^[\.\s]+$/i;
        return regexp.test(checkRange.toString());
      },
      addFootnote: function() {

        this.destroyEditor();

        let el = document.createElement('SUP');
        el.setAttribute('data-idx', this.block.footnotes.length);
        this.range.insertNode(el);
        let pos = this.updFootnotes(this.block.footnotes.length);
        this.block.footnotes.splice(pos, 0, new FootNote({}));
        this.isChanged = true;

        //if (this.editorFootn) {

          //console.log(MediumEditor.getEditorFromElement('.content-wrap-footn'));
          console.log('this.editorFootn', this.editorFootn);
          Vue.nextTick(() => {
            //this.destroyEditor();
            this.initEditor();
          });
        //}
      },
      delFootnote: function(pos) {
        $('#'+this.block._id).find(`[data-idx='${pos+1}']`).remove();
        this.updFootnotes();
        this.block.footnotes.splice(pos, 1);
        this.isChanged = true;
      },
      updFootnotes: function(c_pos = 0) {
        let pos = 0;
        $('#'+this.block._id).find('[data-idx]').each(function(idx) {
          if ($(this).data('idx') == c_pos) pos = idx;
          $(this).text(idx+1).attr('data-idx', idx+1);
        });
        return pos;
      },
      commitFootnote: function(pos, ev) {
        //this.block.footnotes[pos] = ev.target.innerText.trim();
        this.isChanged = true;
      },
      commitDescription: function(ev) {
        //this.block.description = ev.target.innerText.trim();
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
          this.isChanged = true;
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
            if (this.$store.state.auth.confirmRole(flagPart.type) || (flagPart.type === 'narrator' && this.$store.state.auth.confirmRole('editor'))) result = true;
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
        $('[id="' + this.block._id + '"]' + ' div.table-body.-content').addClass('recording-block');
      },
      unselectCurrentBlock() {
        $('#booksarea').removeClass('recording-background')
        $('[id="' + this.block._id + '"]' + ' div.table-body.-content').removeClass('recording-block');
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
      doReAlign() {
        if (this.block.audiosrc) {
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/realign';
        let api = this.$store.state.auth.getHttp();
        let formData = new FormData();
        formData.append('audio', [this.block.audiosrc.replace(process.env.ILM_API, '').split('?').shift()]);
        this.isUpdating = true;
        return api.post(api_url, formData, {})
        .then(response => {
          this.isUpdating = false;
          if (response.status == 200) {
            this.blockAudio.src = process.env.ILM_API + response.data.audiosrc + '?' + (new Date()).toJSON();
            this.blockAudio.map = response.data.content;
          }
          this.reRecordPosition = false;
          return BPromise.resolve();
        })
        .catch(err => {
          this.reRecordPosition = false;
          this.isUpdating = false;
          return BPromise.reject();
        });
        } else {
          return BPromise.reject();
        }
      },
      stopRecordingAndNext() {
        //this.stopRecording();
        //let offset = document.getElementById(this.block._id).getBoundingClientRect()
        //window.scrollTo(0, window.pageYOffset + offset.bottom - 100);
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
      initFootnotePlayer(playerObj) {
        let parent = this;
        playerObj.audPlay = function (blockId, ftnIdx) {
          parent.$root.$emit('playBlockFootnote', `${blockId}_${ftnIdx}`);
          parent.$root.$emit('playBlock', false);
          this.isStarted = `${blockId}_${ftnIdx}`;
          this.player.playBlock(`${blockId}_${ftnIdx}`);
        }

        playerObj.audPause = function (blockId, ftnIdx) {
          this.isPaused = true;
          this.player.pause();
        }

        playerObj.audResume = function (blockId, ftnIdx) {
          this.isPaused = false;
          this.player.resume();
        }

        playerObj.audStop = function (blockId, ftnIdx) {
          this.player.pause();
          parent.audFootnoteCleanClasses(this.isStarted);
          this.isStarted = false;
          this.isPaused = false;
        }

        playerObj.player = new ReadAlong({
            forceLineScroll: false
        },{
          on_start:   ()=>{},
          on_pause:   ()=>{},
          on_resume:  ()=>{},
          on_complete:()=>{
            playerObj.isStarted = false;
            playerObj.isPaused = false;
            parent.audFootnoteCleanClasses(playerObj.isStarted);
          }
        });

        parent.$root.$on('playBlockFootnote', (ftnId)=>{
          if (playerObj.isStarted !== ftnId) {
            if (playerObj.player) {
              playerObj.player.pause();
              parent.audFootnoteCleanClasses(playerObj.isStarted);
              playerObj.isStarted = false;
              playerObj.isPaused = false;
            }
          }
        });
        parent.$root.$on('playBlock', (blockid)=>{
          if (playerObj.player) {
            playerObj.player.pause();
            parent.audFootnoteCleanClasses(playerObj.isStarted);
            playerObj.isStarted = false;
            playerObj.isPaused = false;
          }
        });
      },
      initPlayer() {
        this.player = new ReadAlong({
            forceLineScroll: false
        },{
            on_start: ()=>{
                this.isAudStarted = true;
                this.isAudPaused = false;
                this.$root.$emit('playBlock', this.block._id);
                this.$root.$emit('playBlockFootnote', false);
            },
            on_pause: ()=>{
                this.isAudPaused = true;
            },
            on_resume: ()=>{
                this.isAudPaused = false;
                this.$root.$emit('playBlock', this.block._id);
            },
            on_complete: ()=>{
                this.isAudStarted = false;
                this.isAudPaused = false;
                this.audCleanClasses(this.block._id, {});
            }
        });
        var self = this;
        this.$root.$on('playBlock', function(blockid) {
          if (blockid !== self.block._id) {
            if (self.player) {
              self.audStop();
            }
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
        this.$emit('insertBefore', this.block, this.block_Idx);
      },
      insertBlockAfter() {
        this.$emit('insertAfter', this.block, this.block_Idx);
      },
      deleteBlock() {
        this.hideModal('delete-block-message');
        this.$emit('deleteBlock', this.block, this.block_Idx);
      },
      showModal(name) {
        this.$modal.show(name + this.block._id);
      },
      hideModal(name) {
        this.$modal.hide(name + this.block._id);
      },
      setChanged(val) {
        //console.log('setChanged', val);
        this.isChanged = val;
      },
      setChangedByClass(val) {
        //console.log('setChangedByClass', this.block.type, val);
        if (this.block.type === 'title') {
          this.isChanged = val;
        }
      },
      joinWithPrevious() {
        this.joinBlocks(this.block, this.block_Idx, 'previous')
        .then(()=>{})
        .catch(()=>{})
      },
      joinWithNext() {
        this.joinBlocks(this.block, this.block_Idx, 'next')
        .then(()=>{})
        .catch(()=>{})
      },
      showFootnoteAudioEditor(footnote, ftnIdx) {
        this.FtnAudio.isEditing = true;
        this.FtnAudio.map = footnote.content;
        if (this.FtnAudio.isChanged) {
          this.discardFtnAudio();
        }

        this.$root.$emit('for-audioeditor:load-and-play', footnote.audiosrc, this.FtnAudio.map, `${this.block._id}_${ftnIdx}`);

        $('nav.fixed-bottom').removeClass('hidden');
      },
      showAudioEditor() {
        //$('.table-body.-content').removeClass('editing');
        //$('#' + this.block._id + ' .table-body.-content').addClass('editing');
        this.isAudioEditing = true;
        if (this.isAudioChanged) {
          this.discardAudio();
        }
        $('nav.fixed-bottom').removeClass('hidden');
        Vue.nextTick(() => {

          this.$root.$emit('for-audioeditor:load-and-play', this.blockAudio.src, this.blockAudio.map, this.block._id);

          let self = this;
          this.$root.$on('from-audioeditor:word-realign', function(map, blockId) {
            if (blockId == self.block._id && self.$refs.blockContent.querySelectorAll) {
              self.audStop();
              //console.log(self.$refs.blockContent.querySelectorAll('[data-map]').length, map.length);
              self.$refs.blockContent.querySelectorAll('[data-map]').forEach(_w => {
                let _m = map.shift();
                let w_map = _m.join()
                $(_w).attr('data-map', w_map)
              });
              self.block.content = self.$refs.blockContent.innerHTML;
              self.blockAudio.map = self.block.content;
              self.isChanged = true;
            }
          });
          this.$root.$on('from-audioeditor:save', function(blockId) {
            if (blockId == self.block._id) {
              self.audStop();
              self.assembleBlockAudioEdit();
            }
          });
          this.$root.$on('from-audioeditor:save-and-realign', function(blockId) {
            if (blockId == self.block._id) {
              self.audStop();
              self.doReAlign()
                .then(() => {
                  self.assembleBlockAudioEdit();
                });
            }
          })
          this.$root.$on('from-audioeditor:cut', function(blockId, start, end) {
            if (blockId == self.block._id) {
              self.audStop();
              self._audDeletePart(start, end);
            }
          });
          this.$root.$on('from-audioeditor:closed', function(blockId) {
            if (blockId == self.block._id) {
              self.isAudioEditing = false;
              if (self.isAudioChanged) {
                self.discardAudioEdit();
              }
              $('nav.fixed-bottom').addClass('hidden');
              self.$root.$off('from-audioeditor:insert-silence');
              self.$root.$off('from-audioeditor:word-realign');
              self.$root.$off('from-audioeditor:save');
              self.$root.$off('from-audioeditor:save-and-realign');
              self.$root.$off('from-audioeditor:cut');
              self.$root.$off('from-audioeditor:undo');
              self.$root.$off('from-audioeditor:discard');
              self.$root.$off('from-audioeditor:closed');
              $('#' + self.block._id + ' .table-body.-content').removeClass('editing');
            }
          });
          this.$root.$on('from-audioeditor:insert-silence', function(blockId, position, length) {
            if (blockId == self.block._id) {
              self.audStop();
              self.insertSilence(position, length);
            }
          });
          this.$root.$on('from-audioeditor:undo', function(blockId, audio, text, isModified) {
            if (self.block._id == blockId) {
              self.audStop();
              self.blockAudio.map = text;
              self.blockAudio.src = audio;
              self.block.content = text;
              self.block.audiosrc = self.blockAudio.src;
              self.isAudioChanged = isModified;
            }
          });
          this.$root.$on('from-audioeditor:discard', function(blockId) {
            if (self.block._id == blockId) {
              self.audStop();
              self.discardAudioEdit();
            }
          });
        });
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
      },
      uploadIllustration(event) {
        let formData = new FormData();
        formData.append('illustration', this.$refs.illustrationInput.file, this.$refs.illustrationInput.file.name);
        formData.append('block', JSON.stringify({'description': this.$refs.blockDescription.innerHTML}));
        let api = this.$store.state.auth.getHttp()
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/image';
        let self = this;
        api.post(api_url, formData, {}).then(function(response){
          if (response.status===200) {
            // hide modal after one second
            self.$refs.illustrationInput.removeImage();
            let offset = document.getElementById(self.block._id).getBoundingClientRect()
            window.scrollTo(0, window.pageYOffset + offset.top);
            self.$root.$emit('bookBlocksUpdates', {blocks: [response.data]});
            self.isChanged = false;
            //if (self.editor) {
              //self.editor.destroy();
            //}
            $('[id="' + self.block._id + '"] .illustration-block')
              .removeAttr('contenteditable')
              .removeAttr('data-placeholder');
            self.isIllustrationChanged = false;
          } else {

          }
        }).catch((err) => {
          console.log(err)
        });
      },
      onIllustrationChange() {
        //console.log(arguments, this.$refs.illustrationInput.image);
        if (this.$refs.illustrationInput && this.$refs.illustrationInput.image) {
          
          this.isIllustrationChanged = true;
          Vue.nextTick(() => {
            $('[id="' + this.block._id + '"] .drag-uploader').removeClass('no-picture');
          });
        } else {
          
          this.isIllustrationChanged = false;
          Vue.nextTick(() => {
            $('[id="' + this.block._id + '"] .drag-uploader').addClass('no-picture');
          });
        }
      },
      setRangeSelection(type, event) {
        let checked = event.target && event.target.checked;
        this.$emit('setRangeSelection', this.block, type, checked);
      },
      updateVoicework() {

        this.voiceworkUpdating = true;
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/set_voicework';
        let api = this.$store.state.auth.getHttp();
        return api.post(api_url, {
          voicework: this.voiceworkChange,
          updateType: this.voiceworkUpdateType
        }, {})
          .then(response => {
            this.voiceworkUpdating = false;
            if (response.status == 200) {
              this.$root.$emit('from-bookblockview:voicework-type-changed');
              this.$root.$emit('bookBlocksUpdates', response.data);
              //this.setCurrentBookBlocksLeft(this.block.bookid);
            }
            this.voiceworkChange = false;
          })
          .catch(err => {
            this.voiceworkUpdating = false;
            this.voiceworkChange = false;
          });
      },
      scrollToBlock(id) {
        this.$root.$emit('for-bookedit:scroll-to-block', id);
      },

      setSecnumVal: _.debounce(function(){
        this.reCount();
        this.block.section = this.block.secnum;
        this.putBlockPart({block: this.block, field: 'section'}).then(()=>{});
      }, 800),

      setSecnum() {
        if (this.block.secnum === false) {
          this.block.secnum = this.block.section ? this.block.section : '';
        }
        else {
          this.block.section = this.block.secnum;
          this.block.secnum = false;
        }
        this.reCount();
        this.putBlockPart({block: this.block, field: 'section'}).then(()=>{});
      },
      setParnum() {
        if (this.block.parnum === false) this.block.parnum = ''
        else this.block.parnum = false;
        this.reCount();
        this.putBlockPart({block: this.block, field: 'parnum'}).then(()=>{
        });
      },
      allowVoiceworkChange() {
        if (this.block.type == 'illustration' || this.block.type == 'hr') {
          return false;
        }
        if (this.tc_hasTask('content_cleanup')) {
          return true;
        }
        return this.tc_hasBlockTask(this.block._id, 'approve-new-block') || this.tc_hasBlockTask(this.block._id, 'approve-modified-block');
      }
  },
  watch: {
      'block.isUpdated' (newVal) {
        if (newVal) setTimeout(() => {
          this.block.isUpdated = false;
        }, 2000);
      },
      'block._id' (newVal) {
        //this.isUpdated = false;
      },
      'block._rev' (newVal, oldVal) {
        //console.log('block._rev: ', this.block._rev, 'newVal: ', newVal, 'oldVal: ', oldVal);
        if (newVal !== this.block._rev) {

          if (this.block.illustration) {
            this.block.illustration = this.block.illustration.split('?').shift() + '?' + Date.now()
          }
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
        } else {
          if (!this.blockAudio.src || !this.tc_showBlockNarrate(this.block._id)) {
            this.blockAudio = {
              'src': this.block.audiosrc ? this.block.audiosrc + '?' + (new Date()).toJSON() : '',
              'map': this.block.content
            };
          }
        }
      },
      'block.type' (newVal) {
        //console.log('block.type', this.block._id, this.blockTypes);
        if (Object.keys(this.blockTypes[newVal])[0] !== '') {
          this.classSel = Object.keys(this.blockTypes[newVal])[0];
        }
        this.block.classes = {};
        this.reCount();
      },
      'classSel' (newVal, oldVal) {
        //if (this.block._id== "1_en_2s") console.log('classSel', this.block._id, ' newVal: ', newVal, ' oldVal: ', oldVal);
        let styleCurr = this.block.setClass(newVal);
        if (styleCurr) this.styleSel = styleCurr;
        else this.styleSel = '';
      },
      'styleSel' (newVal, oldVal) {
        //console.log('styleSel', newVal, oldVal);
        this.block.setClassStyle(this.classSel, newVal);
        this.destroyEditor()
        this.initEditor();
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
          if (this.tc_showBlockNarrate(this.block._id) || this.isEditor) {
            /*let isChanged = newVal && this.block.audiosrc != newVal.split('?').shift() && !(this.block.audiosrc && this.block.audiosrc.indexOf('_tmp.') !== -1 && newVal.indexOf('_tmp.') === -1);
            if (!this.isAudioEditing) {
              this.isAudioChanged = isChanged;
            }
            if (isChanged) {
              this.infoMessage = 'Audio updated';
            }*/
          }
        }
      },
      'blockAudio.map' (newVal) {
        //console.log('Tmp audiomap', newVal);
        if (this.tc_showBlockNarrate(this.block._id)) {
          let isChanged = this.block.content != newVal;
          if (!this.isAudioChanged && !this.isAudioEditing) {
            this.isAudioChanged = isChanged;
          }
          if (this.$refs.blockContent) {
            this.$refs.blockContent.innerHTML = newVal;
          }
          if (isChanged) {
            this.infoMessage = 'Audio updated';
          }
        }
      },
      'block.markedAsDone': {
        handler(val) {
          if (val !== this.block.markedAsDone) {
            this.setCurrentBookCounters(['not_marked_blocks']);
          }
        }
      },
      'isCompleted': {
        handler(val, oldVal) {
          Vue.nextTick(() => {
            this.updateFlagStatus(this.block._id);
          });
        }
      },
      'voiceworkChange': {
        handler(val) {
          if (val === false) {
            this.hideModal('voicework-change');
          }
        }
      }
  },
  destroyed: function () {
    this.$root.$off('playBlockFootnote');
    this.$root.$off('playBlock');
  }
}
</script>

<style lang='less'>
@variable: 90px;
.ilm-block {
    padding: 0;
    .content-wrap {
      position: static;
      &.par {
        min-height: 47px;
        position: static;
      }
      &.title {
        min-height: 77.5px;
      }
      &.header {
        min-height: 62.5px;
      }
      &.subhead {
        min-height: 54.5px;
      }
    }
    hr {
      position: static;
    }
    &.-marked {
      background-color: rgba(219, 255, 255, 0.5);
    }
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

        &:hover, &.editing {
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
        background: rgba(51, 122, 183, 0.04);
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

        .table-row.parnum-row {
          height: 5px;
        }

        .-hidden {
            visibility: hidden;
        }

        &:hover {
            .-hidden {
                visibility: visible;
            }
        }
        .-hidden-hover {
            display: block;
        }

        &:hover {
            .-hidden-hover {
                display: none;
            }
        }
        .parnum {
            font-size: 1.1em;
            font-family: serif;
            &.-bold {
              font-weight: bold;
            }
            &.-auto {
              letter-spacing: -1px;
              margin-left: -6px;
            }
        }
        .secnum {
            font-size: 15px;
            font-family: serif;
            padding: 0;
            width: 38px;
            height: 25px;
            margin-left: -1px;
          }
    }

    &.controls-right {
        width: 20px;
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
          margin-right: 10px;
          background: rgba(204, 255, 217, 0.5);
          &:hover {
              background: rgba(204, 255, 217, 0.9);
          }

          &.-disabled {
/*                cursor: not-allowed;
              &:hover {
                  background: rgba(100, 100, 100, 0.2);
              }*/
              visibility: hidden;
          }
          .fa-save {
            color: green;
          }
        }
    }

    .content-wrap {
      margin: 6px auto 4px auto;
      /*padding: 6px 11px;*/
      /*padding: 11px;*/
      border-radius: 8px;
      box-shadow: none;
      transition: box-shadow 900ms;

      &:hover {
          border: 1px solid silver;
          /*padding: 5px 10px;*/
          padding: 10px;
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

    &.content-description {
        line-height: 24pt;
        .content-wrap-desc {
          p {
            margin: 0;
          }
        }
    }

    .content-wrap-footn {
        p {
          margin: 0;
        }
    }

    &.ilm-block {
      .content-wrap {
        &.header, &.subhead {
          margin: 4px;
        }
      }
    }

    .block-menu {
      display: inline-block;
      vertical-align: bottom;
      position: relative;
      width: 40px;
      height: 20px;
      .fa, .glyphicon {
        margin-right: 5px;
      }
    }
    .illustration-block {
      img {
        border: solid grey 2px;
        /*max-height: 85vh;*/
        padding: 4px;
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
    position: static;
}

.medium-editor-toolbar .fa {
    color: #FFFFFF;
}

.fa:hover, .glyphicon:hover {
    color: #303030;
}

.par-ctrl, .controls-top {
    width: auto;
    .fa-paragraph, .fa-header {
        margin-left: 4px;
        &.-active {
          color: #303030;
        }
    }
    .glyphicon-volume-up, .glyphicon-volume-off {
        margin-left: 3px;
     }
    .glyphicon-menu-hamburger {
        font-size: 20px;
        top: 5px;
    }
    .-audio {
        width: 100px;
        .fa {
            font-size: 18px;
        }
    }
    .fa.disabled {
      color: #dddddd;
    }
    .fa.paused {
      color: red;
    }
}

  /* A tricky way to create a lightweight highlight effect */
  .content-wrap[data-audiosrc].playing,
  .content-wrap-footn[data-audiosrc].playing {
      w[data-map] {
        background: linear-gradient(
            transparent,
            transparent 50%,
            rgba(0,255,0,.3) 55%,
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
      w.audio-highlight, w.selected {
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
      vertical-align: middle;
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

  /*.drag-uploader {
    width: 20%;
    max-height: 100px;
    display: table-row;
    .uploadBox {
      .uploadBoxMain {
        max-height: 100px;
        margin: 0px;
      }
      .uploadBoxMain.uploading {
        p, ol {
          display: none;
        }
      }
      .dropArea {
        max-height: 100px;
        padding-top: 30px;
        font-size: 20px;
        content: '';
        .help-block {
          display: none;
        }
      }
      form {
        max-height: 100px;
        button {
          display: none;
        }
      }
      h3 {
        display: none;
      }
    }
  }*/
  .drag-uploader {
    /*display: table-row;*/
    .picture-input {
      .preview-container, .picture-preview {
        max-height: 80vh;
        width: auto;
        position: static;
      }
    }
    .save-illustration {
      float: left !important;
      width: 100% !important;
      text-align: center !important;
    }
  }
  .drag-uploader.no-picture {
    /*display: table-row;*/
    .picture-input {
      .preview-container, .picture-preview {
        max-height: 100px;
        width: auto;
        float: left;
        background-color: transparent !important;
        width: 100%;
      }
      .picture-inner {
        top: -90px !important;
        z-index: 0 !important;
        margin-bottom: 0px !important;
        font-size: 15px !important;
      }
    }
  }
  .modal-content {
    .modal-header {
      padding-left: 15px;
      padding-right: 15px;
    }
  }
  .voicework-preloader {
      background: url(/static/preloader-snake-small.gif);
      width: 100%;
      height: 34px;
      display: inline-block;
      margin: 4px 0px;
      background-repeat: no-repeat;
      text-align: center;
      background-position: center;
  }
</style>
