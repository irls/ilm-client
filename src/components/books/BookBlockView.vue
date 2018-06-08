<template>
<div class="table-body -block" v-bind:class="['-mode-' + mode, blockOutPaddings]" :id="block._id">
    <div v-if="isBlockLocked(block._id)" class="locked-block-cover"></div>
    <div :class="['table-cell', 'controls-left', {'_-check-green': block.checked==true}]">
        <div class="table-row parnum-row" v-if="meta.numeration !== 'none'">

          <template v-if="block.secnum!==false">
            <span v-if="block.secHide===false" :class="['parnum', '-hidden-hover']">{{block.secnum.toString().length?block.secnum:block.parnum}}</span>
          </template>

          <template v-else >
            <span v-if="block.parnum && block.parnum!==false" :class="['parnum', {'-hidden': block.secHide===true }]">{{block.parnum}}</span>
          </template>

          <!--<template v-if="block.secHide===false">
            <span v-if="block.secnum!==false" :class="['parnum', '-hidden-hover']">{{block.secnum}}</span>
            <span v-if="block.secnum===''" :class="['parnum', '-hidden-hover', '-auto']">{{block.parnum}}</span>
          </template>-->

          <input v-if="block.secnum!==false"
            :class="['secnum', '-hidden-block']"
            v-model="block.secnum" @input="setSecnumVal"
            type="text" maxlength="3" size="3"/>

        </div>
        <div class="table-row" v-if="meta.numeration !== 'none'">
            <!-- <div class='par-ctrl -hidden'>
                <i v-if="block.secnum!==false"
                  class="fa fa-paragraph"
                  :class="{'-active': block.secHide===false}"
                  @click="setSecnumHidden"></i>

                <i v-else
                  class="fa fa-paragraph"
                  :class="{'-active': block.parnum!==false}"
                  @click="setParnum"></i>
            </div> -->
            <div v-if="false" class='par-ctrl -hidden'>
                <i class="glyphicon glyphicon-volume-up"></i>
                <i class="glyphicon glyphicon-volume-off"></i>
            </div>
        </div>
        <div class="table-row check-row" v-if="allowEditing">

          <div class="set-range">
            <i class="fa fa-square-o -hidden" aria-hidden="true"
            v-if="block.checked === false"
            v-on:click="$event.target.checked = true; setRangeSelection('byOne', $event)"></i>
            <i class="fa fa-check-square-o" aria-hidden="true"
            v-if="block.checked === true"
            v-on:click="setRangeSelection('byOne', false)"></i>

            <template v-if="selectionStart && selectionStart !== selectionEnd">
            <i v-if="selectionEnd && block._id == selectionStart"
            class="fa fa-arrow-circle-down" aria-hidden="true"
            v-on:click="scrollToBlock(selectionEnd)"></i>
            <i v-if="selectionStart && block._id == selectionEnd"
            class="fa fa-arrow-circle-up" aria-hidden="true"
            v-on:click="scrollToBlock(selectionStart)"></i>
            </template>
          </div>

        </div>
        <template v-if="mode === 'narrate'">
          <div class="table-row" v-if="blockAudio.src && tc_showBlockAudioEdit(block._id) && !isAudioChanged && !isRecording">
            <i class="fa fa-pencil" v-on:click="showAudioEditor()"></i>
          </div>
          <template v-if="player && blockAudio.src && !isRecording">
            <div class="table-row" v-if="!isAudStarted">
              <i class="fa fa-play-circle-o"
                @click="audPlay(block._id, $event)"></i>
            </div>
            <template v-else>
              <div class="table-row">
                <i class="fa fa-pause-circle-o" v-if="!isAudPaused"
                  @click="audPause(block._id, $event)"></i>
                <i class="fa fa-play-circle-o paused" v-else
                  @click="audResume(block._id, $event)"></i>
              </div>
              <div class="table-row">
                <i class="fa fa-stop-circle-o"
                  @click="audStop(block._id, $event)"></i>
              </div>
            </template>
          </template>
          <div class="table-row narrate-controls" v-if="recorder && tc_showBlockNarrate(block._id) && !isAudStarted">
            <!-- <i class="fa fa-arrow-circle-o-down" v-if="isRecording" @click="stopRecording(true, $event)"></i> -->
            <!-- <i class="fa fa-stop-circle-o" v-if="isRecording" @click="stopRecording(false, $event)"></i> -->
            <i class="fa fa-microphone" v-if="!isRecording && !isChanged" @click="startRecording($event)"></i>
            <i class="fa fa-microphone paused" v-if="isRecordingPaused" @click="resumeRecording($event)"></i>
            <i class="fa fa-pause-circle-o" v-if="isRecording && !isRecordingPaused" @click="pauseRecording($event)"></i>
          </div>
        </template>
    </div>
    <div class="table-cell" :class="{'completed': isCompleted}" >
        <div :class="['table-body', '-content', {'editing': isAudioEditing}]"
        @mouseleave="onBlur"
        @click="onBlur">
            <div class="table-row controls-top"><!--:data-json="JSON.stringify(block)"-->

              <div class="par-ctrl -hidden -left">
                  <div class="block-menu">
                    <i class="glyphicon glyphicon-menu-hamburger"
                    @click.prevent="$refs.blockMenu.open($event, block._id)">
                    </i><!-- {{changes}} -->
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
                        <li v-if="!isBlockLocked(prevId)" @click="insertBlockBefore()">
                          <i class="fa fa-angle-up" aria-hidden="true"></i>
                          Insert block before</li>
                        <li v-else class="disabled">
                          <i class="fa menu-preloader" aria-hidden="true"></i>
                          Insert block before</li>
                        <li v-if="!isBlocked" @click="insertBlockAfter()">
                          <i class="fa fa-angle-down" aria-hidden="true"></i>
                          Insert block after</li>
                        <li v-else class="disabled">
                          <i class="fa menu-preloader" aria-hidden="true"></i>
                          Insert block after</li>
                        <li v-if="!isBlockLocked(prevId)" @click="showModal('delete-block-message')">
                          <i class="fa fa-trash" aria-hidden="true"></i>
                          Delete block</li>
                        <li v-else class="disabled">
                          <i class="fa menu-preloader" aria-hidden="true"></i>
                          Delete block</li>
                        <!--<li>Split block</li>-->
                        <li v-if="!isBlockLocked(block._id) && !isBlockLocked(prevId)" @click="joinWithPrevious()">
                          <i class="fa fa-angle-double-up" aria-hidden="true"></i>
                          Join with previous block</li>
                        <li v-else class="disabled">
                          <i class="fa menu-preloader" aria-hidden="true"></i>
                          Join with previous block</li>
                        <li v-if="!isBlockLocked(block._id) && !isBlockLocked(block.chainid)" @click="joinWithNext()">
                          <i class="fa fa-angle-double-down" aria-hidden="true"></i>
                          Join with next block</li>
                        <li v-else class="disabled">
                          <i class="fa menu-preloader" aria-hidden="true"></i>
                          Join with next block</li>
                        <li class="separator"></li>
                        <template v-if="block.type != 'illustration' && block.type != 'hr'">
                        <li @click="showModal('block-html')">
                          <i class="fa fa-code" aria-hidden="true"></i>
                          Edit HTML</li>
                        <li class="separator"></li>
                        </template>
                      </template>
                      <li @click="discardAudio" v-if="allowAudioRevert">
                        <i class="fa fa-cloud-download" aria-hidden="true"></i>
                        Revert to original audio</li>
                    </block-menu>
                  </div>

                  <!--<i class="fa fa-trash-o fa-lg"></i>-->
                  <!--<i class="fa fa-pencil-square-o fa-lg"></i>-->

                  <!--<label v-if="block.type=='header'">start:&nbsp;<input type="checkbox"/></label>&nbsp;-->
                  <template v-if="allowEditing">
                    <!-- Block Type selector -->
                    <label>
                      <select v-model="block.type" style="min-width: 80px;" @input="setChanged(true, 'type', $event)"><!--v-model='block.type'--><!--:value="type"-->
                        <option v-for="(type, key) in blockTypes" :value="key">{{ key }}</option>
                      </select>
                    </label>

                    <template v-if="allowVoiceworkChange()">
                      <label>
                        <i class="fa fa-volume-off"></i>&nbsp;
                      <select v-model='voiceworkSel' style="min-width: 100px;">
                        <option v-for="(val, key) in blockVoiceworksSel" :value="key">{{ val }}</option>
                      </select>
                      </label>
                    </template>
                    <template v-else>
                      <label>
                        <i class="fa fa-volume-off"></i>&nbsp;<span>{{blockVoiceworks[block.voicework]}}</span>
                      </label>
                    </template>
                  </template>
              </div>
              <!--<div class="-hidden">-->

              <div class="par-ctrl -audio -hidden -right" v-if="mode !== 'narrate'">
                  <template v-if="player && blockAudio.src && !isRecording">
                      <template v-if="!isAudStarted">
                        <i class="fa fa-pencil" v-on:click="showAudioEditor()" v-if="tc_showBlockAudioEdit(block._id)"></i>
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

              </div>
              <!--<div class="-hidden">-->

            </div>
            <!--<div class="table-row controls-top">-->
            <div style="" class="preloader-container">
              <div v-if="isUpdating" class="preloader-small"> </div>
            </div>
            <div :class="['table-row ilm-block', block.markedAsDone && !hasChanges ? '-marked':'']">
                <hr v-if="block.type=='hr'"
                  :class="[block.getClass(), {'checked': block.checked}]"
                  @click="onClick($event)"/>

                <div v-else-if="block.type == 'illustration'"
                :class="['table-body illustration-block', {'checked': block.checked}]"
                @click="onClick($event)">
                  <img v-if="block.illustration" :src="block.getIllustration()"
                  :height="block.illustration_height"
                  :class="[block.getClass()]"/>
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
                v-html="blockContent"
                :class="[ block.getClass(), {
                  'updated': isUpdated,
                  'checked': block.checked,
                  'playing': blockAudio.src,
                  'hide-archive': isHideArchFlags
                }]"
                :data-audiosrc="blockAudio.src"
                @click="onClick($event)"
                @selectionchange.prevent="onSelect"
                @input="onInput"
                @mouseenter="onHover"
                @contextmenu.prevent="onContext"
                @focusout="onFocusout">
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

                  <template v-if="flagsSel" v-for="(part, partIdx) in flagsSel.parts">
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
                      v-if="_is('proofer', true) && part.status == 'resolved' && !isCompleted"
                      @click.prevent="hideFlagPart($event, partIdx)">
                      Archive flag</a>

                    <a href="#" class="flag-control -right -top"
                      v-if="_is('proofer', true) && part.status == 'hidden' && !isCompleted"
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
                      <a v-if="isCanFlag('narrator', false) && part.type == 'editor'"
                      href="#" class="flag-control -right"
                      @click.prevent="addFlagPart(part.content, 'narrator')">
                      Flag for narration also</a>
                      <a v-if="isCanFlag('editor', false) && part.type == 'narrator'"
                      href="#" class="flag-control -right"
                      @click.prevent="addFlagPart(part.content, 'editor')">
                      Flag for editing also</a>
                    </template>

                    <a v-if="part.status == 'resolved' && !part.collapsed && !isCompleted"
                      href="#" class="flag-control"
                      @click.prevent="reopenFlagPart($event, partIdx)">
                      Re-open flag</a>

                    <a v-if="canResolveFlagPart(part) && part.status == 'open' && !part.collapsed && !isCompleted"
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
              v-if="block.footnotes.length > 0 && mode !== 'narrate'">
              <div class="table-body footnote"
                v-for="(footnote, ftnIdx) in block.footnotes">

                <div class="table-row controls-top -hidden">
                  <div class="table-cell"></div>
                  <div class="table-cell">
                    <template v-if="allowEditing">
                      <template v-if="tc_hasTask('content_cleanup')">
                        <label>Voicework:&nbsp;
                        <select v-model='footnote.voicework' style="min-width: 100px;" @input="commitFootnote(ftnIdx, $event, 'voicework')">
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
                    :data-audiosrc="block.getAudiosrcFootnote(ftnIdx, 'm4a', true)"
                    :data-footnoteIdx="block._id +'_'+ ftnIdx"
                    :class="['js-footnote-val', 'js-footnote-'+ block._id, {'playing': (footnote.audiosrc)}]"
                    @input="commitFootnote(ftnIdx, $event)"
                    v-html="footnote.content"
                    :ref="'footnoteContent_' + ftnIdx">
                  </div>
                  <div class="table-cell -control">
                    <span @click="delFootnote(ftnIdx)"><i class="fa fa-trash"></i></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-row controls-bottom">
              <div class="-hidden -left">
                <span>
                  <i :class="['glyphicon', 'glyphicon-flag']"
                    ref="blockFlagControl"
                    @click="handleBlockFlagClick"
                  ></i>
                </span>
              </div>
              <div class="align-range -hidden -left" v-if="false && allowEditing">
                Set block range: <label>
                <input type="checkbox" v-on:change="setRangeSelection('start', $event)"
                class="set-range-start" :disabled="!allowSetStart(block._id)"
                v-model="block.checkedStart"/>&nbsp;Start</label>
                <label>&nbsp;&nbsp;
                <input type="checkbox" v-on:change="setRangeSelection('end', $event)" class="set-range-end" :disabled="!allowSetEnd(block._id)"
                v-model="block.checkedEnd"/>&nbsp;End</label>
                <template v-if="displaySelectionStart">
                  <a class="go-to-block" v-on:click="scrollToBlock(selectionStart)">View start({{displaySelectionStart}})</a>
                </template>
                <template v-if="displaySelectionEnd">
                  <a class="go-to-block" v-on:click="scrollToBlock(selectionEnd)">View end({{displaySelectionEnd}})</a>
                </template>
              </div>
              <div v-if="isRecording" class="recording-hover-controls" >
                <i class="fa fa-ban" v-if="isRecording" @click="cancelRecording()"></i>
                <i class="fa fa-arrow-circle-o-down" v-if="isRecording" @click="stopRecording(true, $event)"></i>
                <i class="fa fa-stop-circle-o" v-if="isRecording" @click="stopRecording(false, $event)"></i>
                <!-- <i class="fa fa-microphone paused" v-if="isRecordingPaused" @click="resumeRecording($event)"></i> -->
                <!-- <i class="fa fa-pause-circle-o" v-if="isRecording && !isRecordingPaused" @click="pauseRecording($event)"></i> -->
              </div>
              <div class="par-ctrl -hidden -right">
                  <!--<span>isCompleted: {{isCompleted}}</span>-->
                  <div class="save-block -right" @click="discardBlock"
                       v-bind:class="{'-disabled': !(allowEditing && hasChanges)}">
                    Discard
                  </div>
                  <div class="save-block -right"
                  v-bind:class="{ '-disabled': (!isChanged && (!isAudioChanged || isAudioEditing) && !isIllustrationChanged) }"
                  @click="assembleBlockProxy">
                    Save
                  </div>
                  <template v-if="!isCompleted">
                  <div v-if="!enableMarkAsDone" :class="['save-block', '-right', {'-disabled': isNeedWorkDisabled}]"
                    @click.prevent="reworkBlock">
                    Need work</div>
                  <div v-if="!enableMarkAsDone" :class="['save-block', '-right', {'-disabled': isApproveDisabled}]"
                    @click.prevent="approveBlock">
                    Approve</div>

                  <div v-if="enableMarkAsDone" :class="['save-block', '-right', {'-disabled': markAsDoneButtonDisabled}]"
                    @click.prevent="markBlock">
                    Approve</div>

                  </template>
              </div>
              <!--<div class="-hidden">-->
            </div>
            <!--<div class="table-row controls-bottom">-->
        </div>
    </div>
    <div class="table-cell controls-right">
    </div>
    <modal :name="'delete-block-message' + block._id" :resizeable="false" :clickToClose="false" height="auto">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p>Delete block?</p>
      </div>
      <div class="modal-footer">
        <template v-if="deletePending">
          <div class="voicework-preloader"></div>
        </template>
        <template v-else>
          <button class="btn btn-default" v-on:click="hideModal('delete-block-message')">Cancel</button>
          <button class="btn btn-primary" v-on:click="deleteBlock()">Delete</button>
        </template>
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
        <div><label><input type="radio" name="voicework-update-type" v-model="voiceworkUpdateType" value="single" :disabled="voiceworkUpdating"/>this {{blockTypeLabel}}</label></div>
        <div><label><input type="radio" name="voicework-update-type" v-model="voiceworkUpdateType" value="all" :disabled="voiceworkUpdating"/>all unapproved {{blockTypeLabel}}s</label></div>
        <div>This will also delete current audio from the {{blockTypeLabel}}(s)</div>
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
    <modal :name="'block-html' + block._id" height="auto" width="90%" class="block-html-modal" :clickToClose="false" @opened="setHtml">
      <div class="modal-header">
        <h4 class="modal-title">
          Block: {{block._id}}
        </h4>
        <button type="button" class="close modal-close-button" aria-label="Close" @click="hideModal('block-html')"><span aria-hidden="true">×</span></button>
      </div>
      <div class="modal-body">
        <textarea :ref="'block-html' + block._id" class="block-html"></textarea>
      </div>
      <div class="modal-footer">
          <button class="btn btn-default" v-on:click="hideModal('block-html')">Cancel</button>
          <button class="btn btn-primary" v-on:click="setContent()">Apply</button>
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

      isUpdated: false,
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
      voiceworkUpdating: false,
      changes: [],
      deletePending: false,
      audioEditFootnote: {footnote: {}, isAudioChanged: false}
    }
  },
  components: {
      'block-menu': BlockMenu,
      'block-cntx-menu': BlockContextMenu,
      'block-flag-popup': BlockFlagPopup,
      //'modal': modal,
      'vue-picture-input': VuePictureInput
  },
  props: ['block', 'putBlock', 'putBlockPart', 'getBlock', 'reCount', 'recorder', 'blockId', 'audioEditor', 'joinBlocks', 'blockReindexProcess', 'getBloksUntil', 'allowSetStart', 'allowSetEnd', 'prevId', 'mode'],
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
      blockOutPaddings: function () {
//         if (!this.block.getClass) return '';
//         let match = this.block.getClass().match(/out[^\s]*/ig);
//         return (match && match.length) ? match.join(' ') : '';
        return (this.block.classes && this.block.classes.hasOwnProperty('outsize-padding')) ? this.block.classes['outsize-padding'] : ''
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
          console.log('voiceworkSel set', val);
          if (val && val !== this.block.voicework) {
            if (this._is('editor', true)) {
              this.voiceworkChange = val;
              if (!this.block.markedAsDone && this.tc_hasTask('content_cleanup')) {
                this.showModal('voicework-change');
              } else {
                this.voiceworkUpdateType = 'single';
                this.updateVoicework();
              }
            }
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
          if (this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged) {
            return true;
          }
          if (!this.tc_getBlockTask(this.block._id)) {
            return true;
          }
          let flagsSummary = this.block.calcFlagsSummary();
          let executors = this.tc_currentBookTasks.job.executors;
          if (executors[flagsSummary.dir] ==  this.auth.getSession().user_id) return true;

          return flagsSummary.stat !== 'open';
      },
      enableMarkAsDone: function() {
        if (this.tc_getBlockTask(this.block._id)) {
          return false;
        }
        return this._is('editor', true) && (this.tc_hasTask('content_cleanup') || this.tc_hasTask('audio_mastering'));
      },
      markAsDoneButtonDisabled: function() {
        if (this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged) {
          return true;
        }
        let disable_audio = !this.block.audiosrc && (this.block.voicework === 'audio_file' || this.block.voicework === 'tts');
        if (this.block.footnotes) {
          this.block.footnotes.forEach(f => {
            if (f.voicework === 'tts' && !f.audiosrc) {
              disable_audio = true;
            }
          });
        }
        return this.block.markedAsDone ||
                (this.block.status && this.block.status.proofed === true) ||
                disable_audio;
      },
      isApproveDisabled: function () {
        if (this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged || this.isRecording || this.isUpdating) {
          return true;
        }
        let flags_summary = this.block.calcFlagsSummary();
          if (this.isCanApproveWithoutTask) {
            if (flags_summary.stat === 'open') {
              return true;
            } else {
              return false;
            }
          }
          if (this._is('editor', true) && !this.tc_getBlockTask(this.block._id)) return true;
          if (this._is('editor', true) && this.tc_hasBlockTask(this.block._id, 'approve-new-block')) return false;
          if (this._is('narrator', true) && !(this.blockAudio && this.blockAudio.src)) return true;
          if (!(flags_summary.stat !== 'open') && this._is(flags_summary.dir, true)) return true;
          if (flags_summary && flags_summary.stat === 'open' && flags_summary.dir && !this._is(flags_summary.dir, true)) {
            return true;
          }
          return false;
      },
      isCanApproveWithoutTask: function() {
        if (this._is('editor', true)) {
          let task = this.tc_getBlockTaskOtherRole(this.block._id);
          return task ? true : false;
        }
        return false;
      },
      isCompleted: function () {
          if (this._is('editor', true) && (
                  this.tc_hasTask('content_cleanup') ||
                  (this.tc_hasTask('audio_mastering') && this.block.status && this.block.status.stage === 'audio_mastering')
                )) return false;
          if (this._is('editor', true)) {
            let flags_summary = this.block.calcFlagsSummary();
            if (!this.block.status || this.block.status.assignee !== 'proofer') {
              if (flags_summary && flags_summary.stat === 'open' && ['editor', 'narrator'].indexOf(flags_summary.dir) !== -1) {
                return false;
              }
            }
            if (this.isCanApproveWithoutTask) {
              return false;
            }
          }
          return this.tc_getBlockTask(this.block._id) ? false : true;
      },
      displaySelectionStart() {
        return this.blockSelection.end._id == this.block._id ? this.blockSelection.start._id : false;
      },
      displaySelectionEnd() {
        return this.blockSelection.start._id == this.block._id ? this.blockSelection.end._id : false;
      },
      selectionStart() {
        return this.blockSelection.start._id
      },
      selectionEnd() {
        return this.blockSelection.end._id
      },
      allowBlockFlag() {
        if (this.isCanFlag('narrator', false) || this.isCanFlag('editor', false)) {
          return true;
        }
        let flags_summary = this.block.calcFlagsSummary(true);
        if (flags_summary && flags_summary.stat === 'open' && (this._is(flags_summary.dir, true) || (this._is('editor', true) && flags_summary.dir === 'narrator'))) {
          return true;
        }
        return false;
      },
      hasChanges: {
        get() {
          return this.isChanged || this.isIllustrationChanged || this.isAudioChanged;
        }
      },
      ...mapGetters({
          auth: 'auth',
          book: 'currentBook',
          meta: 'currentBookMeta',
          watchBlk: 'contentDBWatch',
          tc_currentBookTasks: 'tc_currentBookTasks',
          authors: 'authors',
          isEditor: 'isEditor',
          isBlocked: 'isBlocked',
          blockSelection: 'blockSelection',
          isBlockLocked: 'isBlockLocked',
          lockedBlocks: 'lockedBlocks'
      }),
      illustrationChaged() {
        return this.$refs.illustrationInput.image
      },
      allowEditing: {
        get() {
          return this.block && (this.tc_isShowEdit(this.block._id) || this.tc_hasTask('content_cleanup')) && this.mode === 'edit';
        }
      },
      blockTypeLabel: {
        get() {
          return this.block.type === 'par' ? 'paragraph' : this.block.type;
        }
      },
      blockContent: {
        get() {
          if (this.mode === 'narrate') {
            let content = '';
            /*if ($('<div>' + this.block.content + '</div>').find('w').length > 0) {
              content = this.block.content.replace(/(\.|\?|\!)([^<]*)<\/w>(.+?)/g, '<div class="narrate-content">$1$2</w></div>$3')
            } else if ($('<div>' + this.block.content + '</div>').find('*').length > 0) {
              //content = this.block.content.replace(/(<[^>]+>)([^<]+)(<\/[^>]+>)/g, '<span>$1</span>$2')
              content = this.block.content.replace(/([^\.|\?|\!]+)(\.|\?|\!)/g, '<div class="narrate-content">$1$2</div>');
              content = content.replace(/(<\/div>)([^\.|\?|\!]+)$/g, '$1<div class="narrate-content">$2</div>');
            } else {
              content = this.block.content//.replace(/([A-z0-9']+)/g, '<span>$1</span>')
              content = content.replace(/([^\.|\?|\!]+)(\.|\?|\!)/g, '<div class="narrate-content">$1$2</div>');
              content = content.replace(/(<\/div>)([^\.|\?|\!]+)$/g, '$1<div class="narrate-content">$2</div>');
            }*/
            let split = '<br class="narrate-split"/><br class="narrate-split"/>';
            if ($('<div>' + this.block.content + '</div>').find('w').length > 0) {
              content = this.block.content.replace(/(\.|\?|\!)([^<]*)<\/w>(.+?)/g, '$1' + split + '$2</w>$3')
            } else {
              content = this.block.content + '<span class="content-tail"></span>';
              content = content.replace(/(\.|\?|\!)([^\.\?\!]+)/g, '$1' + split + '$2');
            }
            return content;
          } else {
            return this.block.content;
          }
        }
      },
      allowAudioRevert() {
        if (this.tc_hasBlockTask('fix-block-text') && this.block && this.block.audiosrc === 'audio_file') {
          return true;
        }
        if (this.tc_hasBlockTask(this.block._id, 'fix-block-narration')) {
          return true;
        }
        return false;
      }
  },
  beforeDestroy:  function() {
    if (this.editor) this.editor.destroy();
    this.$root.$off('block-state-refresh-' + this.block._id);
  },
  mounted: function() {
      //this.initEditor();
      //console.log('mounted', this.block._id);
      this.blockAudio = {'map': this.block.content, 'src': this.block.getAudiosrc('m4a')};
      if (!this.player && this.blockAudio.src) {
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

      this.updateFlagStatus(this.block._id);
      if (Object.keys(this.blockTypes[this.block.type])[0] !== '') {
        this.classSel = Object.keys(this.blockTypes[this.block.type])[0];
      } else {
        let blockClasses = Object.keys(this.block.classes);
        if (blockClasses.length) {
          this.classSel = blockClasses[0];
        }
      }

      //this.voiceworkSel = this.block.voicework;
      this.isChanged = this.block.isChanged;
      this.isAudioChanged = this.block.isAudioChanged;
      this.isIllustrationChanged = this.block.isIllustrationChanged;
      //this.detectMissedFlags();

      //console.log('mounted', this.block._id);
      this.destroyEditor();
      this.initEditor();
      this.addContentListeners();

      this.$root.$on('block-state-refresh-' + this.block._id, () => {
        this.$forceUpdate();
      });
      this.$root.$on('saved-block:' + this.block._id, () => {
        this.isChanged = false;
        this.isAudioChanged = false;
        this.isIllustrationChanged = false;
        this.recountApprovedInRange();
      });


//       Vue.nextTick(() => {
//
//       });
  },
  methods: {
      ...mapActions([
        'putMetaAuthors',
        'tc_approveBookTask',
        'setCurrentBookBlocksLeft',
        'setCurrentBookCounters',
        'addBlockLock',
        'getAlignCount',
        'recountApprovedInRange'
      ]),
      //-- Checkers -- { --//
      isCanFlag: function (flagType = false, range_required = true) {
        if (!this.tc_getBlockTask(this.block._id)) {
          return false;
        }
        let canFlag = true;
        if (flagType) {
          switch(flagType) {
            case 'editor' : {
              if (this._is('editor', true)) canFlag = false;
            } break;
            case 'narrator' : {
              if (this.block.voicework !== 'narration') {
                canFlag = false;
              } else {
                if (this.block.status && this.block.status.stage === 'audio_mastering') canFlag = false;
                else if (!(this.block.audiosrc && this.block.audiosrc.length)) canFlag = false;
                else if (this._is('narrator', true)) canFlag = false;
              }
            } break;
          };
        }

        return canFlag && !this.tc_hasTask('content_cleanup') && (!this.range.collapsed || !range_required);
      },
      //-- } -- end -- Checkers --//

      destroyEditor() {
        if (this.editor) {
          //this.editor.removeElements();
          this.editor.destroy();
          if (this.block && this.block.type === 'illustration') {
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
        force = force || false;

        if ((!this.editor || force === true) && this.block.needsText()) {
          let extensions = {};
          let toolbar = {buttons: []};
          if (this.allowEditing && this.mode === 'edit') {
            extensions = {
                'quoteButton': new QuoteButton(),
                'quotePreview': new QuotePreview(),
                'suggestButton': new SuggestButton(),
                'suggestPreview': new SuggestPreview()
              };
            toolbar = {
                buttons: [
                  'bold', 'italic', 'underline',
                  //'superscript', 'subscript',
                  'orderedlist', 'unorderedlist',
                  //'html', 'anchor',
                  'quoteButton', 'suggestButton'
                ]
              };
            this.editor = new MediumEditor('#content-' + this.block._id, {
                toolbar: toolbar,
                buttonLabels: 'fontawesome',
                quotesList: this.authors,
                onQuoteSave: this.onQuoteSave,
                suggestEl: this.suggestEl,
                extensions: extensions,
                disableEditing: !this.allowEditing
            });
          } else if (this.tc_showBlockNarrate(this.block._id) && this.mode === 'narrate') {
            extensions = {
                'suggestButton': new SuggestButton(),
                'suggestPreview': new SuggestPreview()
              };
            toolbar = {
                buttons: ['suggestButton']
              };
            this.editor = new MediumEditor('#content-' + this.block._id, {
                toolbar: toolbar,
                buttonLabels: 'fontawesome',
                quotesList: [],
                onQuoteSave: this.onQuoteSave,
                suggestEl: this.suggestEl,
                extensions: extensions,
                disableEditing: true
            });
          }
    //       this.editor.subscribe('hideToolbar', (data, editable)=>{});
    //       this.editor.subscribe('positionToolbar', ()=>{})
        }  else if (this.editor) this.editor.setup();

        if ((!this.editorDescr || force === true) && this.block.type == 'illustration') {
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
          this.editorDescr = new MediumEditor('[id="' + this.block._id + '"] .content-wrap-desc', {
              toolbar: toolbar,
              buttonLabels: 'fontawesome',
              quotesList: this.authors,
              onQuoteSave: this.onQuoteSave,
              extensions: extensions,
              disableEditing: !this.allowEditing
          });
        } else if (this.editorDescr) this.editorDescr.setup();

        this.initFtnEditor(force)

        $('.medium-editor-toolbar.medium-editor-stalker-toolbar').css('display', '');
      },
      initFtnEditor(force) {
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
      onSelect: function($event) {
        console.log('onSelect');
      },
      onClick: function($event) {
//         $('.medium-editor-toolbar').each(function(){
//           $(this).css('display', 'inline-block');
//         });
        $event.target.checked = true;
        this.setRangeSelection('byOne', $event)
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
        this.pushChange('content');
        el.target.focus();
      },
      onFocusout: function(el) {
        this.block.content = this.$refs.blockContent.innerHTML.replace(/(<[^>]+)(selected)/g, '$1');
        this.block.content = this.block.content.replace(/(<[^>]+)(audio-highlight)/g, '$1');
      },
      discardBlock: function(ev) {

        let checked = this.block.checked;
        this.getBlock(this.block._id)
        .then((block)=>{

          if (this.$refs.blockContent) {
            this.$refs.blockContent.innerHTML = block.content;
            this.$refs.blockContent.focus();
          }

          Vue.nextTick(() => {
            if (this.$refs.blockContent) {
              this.addContentListeners();
            }
          });

          this.isChanged = false;
          this.updateFlagStatus(block._id);
          if (this.block.type === 'illustration') {
            if (this.$refs.illustrationInput) {
              this.$refs.illustrationInput.removeImage();
            }
            this.block.description = block.description;
            if (this.$refs.blockDescription) {
              this.$refs.blockDescription.innerHTML = block.description;
            }
          }

        });
      },
      discardAudio: function() {
        //this.blockAudio.src = this.block.getAudiosrc('m4a');
        //this.blockAudio.map = this.block.content;
        //let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_tmp';
        //let api = this.$store.state.auth.getHttp();
        //api.delete(api_url, {}, {})
          //.then(response => {
          //
          //})
          //.catch(err => {
          //
          //});
        if (this.tc_hasBlockTask(this.block._id, 'fix-block-narration')) {
          let api = this.$store.state.auth.getHttp();
          api.post(this.API_URL + 'book/block/' + this.block._id + '/audio/revert')
            .then(response => {
              this.$root.$emit('bookBlocksUpdates', {blocks: [response.data.block]});
            })
            .catch(err => console.log(err));
        }
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

      discardAudioEdit: function(footnoteIdx = null, reload = true) {
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_edit';
        if (footnoteIdx !== null) {
          api_url+= '/footnote/' + footnoteIdx;
        }
        let api = this.$store.state.auth.getHttp();
        api.delete(api_url, {}, {})
          .then(response => {
            if (response.status == 200 && response.data) {
              if (footnoteIdx === null) {
                this.block.content = response.data.content;
                this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                this.blockAudio.map = response.data.content;
                //this.block.audiosrc = this.blockAudio.src;
                this.blockAudio.src = this.block.getAudiosrc('m4a');
                this.isAudioChanged = false;
                if (reload) {
                  this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map);
                }
              } else {
                let resp_block = response.data;
                let resp_f = resp_block.footnotes[footnoteIdx];
                this.block.setContentFootnote(footnoteIdx, resp_f.content);
                this.block.setAudiosrcFootnote(footnoteIdx, resp_f.audiosrc, resp_f.audiosrc_ver);
                if (reload) {
                  this.$root.$emit('for-audioeditor:load', this.block.getAudiosrcFootnote(footnoteIdx, 'm4a'), this.audioEditFootnote.footnote.content);
                }
                this.audioEditFootnote.isAudioChanged = false;
              }
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
            this.block.voicework = 'no_audio';
          case 'hr':
            this.block.content = '';
            this.block.voicework = 'no_audio';
            break;
          default:
            this.block.content = this.$refs.blockContent.innerHTML.replace(/(<[^>]+)(selected)/g, '$1');
            this.block.content = this.block.content.replace(/(<[^>]+)(audio-highlight)/g, '$1');
            this.block.content = this.block.content.replace(/<br class="narrate-split"[^>]*>/g, '')
            this.block.content = this.block.content.replace('<span class="content-tail"></span>', '');
            if (this.block.footnotes && this.block.footnotes.length) {
              this.block.footnotes.forEach((footnote, footnoteIdx)=>{
                this.block.footnotes[footnoteIdx].content = $('[data-footnoteIdx="'+this.block._id +'_'+ footnoteIdx+'"').html();
              });
            }
            break;
        }
        this.block.classes = [this.block.classes];
        let recount_marked = this.block.markedAsDone === true && this._is('editor', true);
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
          if (!(this.changes.length == 1 && this.changes.indexOf('flags') !== -1)) {
            this.$emit('blockUpdated', this.block._id);
          }
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
          if (recount_marked) {
            this.setCurrentBookCounters(['not_marked_blocks']);
          }
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
          return api.post(api_url, {
            content: this.blockAudio.map
          }, {})
            .then(response => {
              if (response.status == 200 && response.data.audiosrc) {
                //this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                //this.blockAudio.src = this.block.getAudiosrc('m4a');
                this.isAudioChanged = false;
                this.block.isAudioChanged = false;
                //return this.putBlock(this.block);
                this.$root.$emit('bookBlocksUpdates', {blocks: [response.data.block]});
              }
            })
            .catch(err => {});
        }
        this.isAudioChanged = false;
      },

      assembleBlockAudioEdit: function(footnoteIdx = null) {// to save changes from audio editor
        if ((this.blockAudio.map && this.blockAudio.src) || (footnoteIdx && this.audioEditFootnote.footnote)) {
          let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_edit';
          let api = this.$store.state.auth.getHttp();
          let data = {};
          if (footnoteIdx === null) {
            data = {
              audiosrc: this.block.getAudiosrc(null, false),
              content: this.blockAudio.map
            };
          } else {
            data = {
              audiosrc: this.block.getAudiosrcFootnote(footnoteIdx, null, false),
              content: this.audioEditFootnote.footnote.content,
              footnote_idx: footnoteIdx
            }
          }
          return api.post(api_url, data, {})
            .then(response => {
              if (response.status == 200) {
                if (footnoteIdx === null) {
                  this.block.content = response.data.content;
                  this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                  this.blockAudio.map = response.data.content;
                  this.blockAudio.src = this.block.getAudiosrc('m4a');
                  //return this.putBlock(this.block);
                  this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map);
                  this.isAudioChanged = false;
                  this.isChanged = false;
                  return BPromise.resolve();
                } else {
                  this.isChanged = false;
                  let resp_block = response.data;
                  let resp_f = resp_block.footnotes[footnoteIdx];
                  this.block.setContentFootnote(footnoteIdx, resp_f.content);
                  this.block.setAudiosrcFootnote(footnoteIdx, resp_f.audiosrc, resp_f.audiosrc_ver);
                  this.$root.$emit('for-audioeditor:load', this.block.getAudiosrcFootnote(footnoteIdx, 'm4a'), this.audioEditFootnote.footnote.content);
                  this.audioEditFootnote.isAudioChanged = false;
                  return BPromise.resolve();
                }
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
            this.recountApprovedInRange();
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
            this.recountApprovedInRange();
            //this.$router.push({name: this.$route.name, params:  { block: 'unresolved' }});
            this.getBloksUntil('unresolved', null, this.block._id)
          });
        }
      },

      actionWithBlock: function(ev) {
        this.assembleBlockProxy(ev)
        .then(()=>{
          let task = this.tc_getBlockTask(this.block._id);

          if (!task) {
             let other_task = this.tc_getBlockTaskOtherRole(this.block._id);
             if (other_task) {
               task = Object.assign({}, other_task);
             } else {
              task = {
               blockid: this.block._id,
               bookid: this.block.bookid
             }
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
              //this.$router.push({name: this.$route.name, params:  { block: 'unresolved', task_type: true }});
              this.getBloksUntil('unresolved', true, this.block._id)
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
          this.audStop(this.block._id);
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

          this.player.playRange('content-' + this.block._id, startRange[0], endRange[0] + endRange[1]);
          this.isAudStarted = true;
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
      _audDeletePart(start, end, footnoteIdx = null) {
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_remove';
        let api = this.$store.state.auth.getHttp();
        this.isUpdating = true;
        let formData = new FormData();
        let position = [start, end];
        formData.append('position', position);
        if (footnoteIdx === null ) {
          formData.append('modified', this.isAudioChanged);
          formData.append('content', this.block.content);
          formData.append('audio', this.block.getAudiosrc(null, false));
        } else {
          formData.append('content', this.audioEditFootnote.footnote.content);
          formData.append('audio', this.block.getAudiosrcFootnote(footnoteIdx, null, false));
          formData.append('modified', this.audioEditFootnote.isAudioChanged);
          formData.append('footnote_idx', footnoteIdx);
        }
        api.post(api_url, formData, {})
          .then(response => {
            this.isUpdating = false;
            if (response.status == 200) {

              if (footnoteIdx === null) {
                this.blockAudio.map = response.data.content;
                this.block.setContent(response.data.content);
                this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                this.blockAudio.src = this.block.getAudiosrc('m4a');
                this.isAudioChanged = true;
                this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map);
              } else {
                this.block.setContentFootnote(footnoteIdx, response.data.content);
                this.block.setAudiosrcFootnote(footnoteIdx, response.data.audiosrc, response.data.audiosrc_ver);
                this.$root.$emit('for-audioeditor:load', this.block.getAudiosrcFootnote(footnoteIdx, 'm4a'), this.audioEditFootnote.footnote.content);
                this.audioEditFootnote.isAudioChanged = true;
              }
            }
          })
          .catch(err => {
            this.isUpdating = false;
          });
      },
      insertSilence(position, length, footnoteIdx = null) {
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio/insert_silence';
        let api = this.$store.state.auth.getHttp();
        this.isUpdating = true;
        let formData = new FormData();
        formData.append('position', position);
        formData.append('length', length);
        if (footnoteIdx === null ) {
          formData.append('content', this.block.content);
          formData.append('audio', this.block.getAudiosrc(null, false));
          formData.append('modified', this.isAudioChanged);
        } else {
          formData.append('content', this.audioEditFootnote.footnote.content);
          formData.append('audio', this.block.getAudiosrcFootnote(footnoteIdx, null, false));
          formData.append('modified', this.audioEditFootnote.isAudioChanged);
        }
        if (footnoteIdx !== null) {
          formData.append('footnote_idx', footnoteIdx)
        }
        api.post(api_url, formData, {})
          .then(response => {
            this.isUpdating = false;
            if (response.status == 200) {
              if (footnoteIdx === null) {
                this.blockAudio.map = response.data.content;
                this.block.setContent(response.data.content);
                this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                this.blockAudio.src = this.block.getAudiosrc('m4a');
                this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map);
                this.isAudioChanged = true;
              } else {
                this.block.setContentFootnote(footnoteIdx, response.data.content);
                this.block.setAudiosrcFootnote(footnoteIdx, response.data.audiosrc, response.data.audiosrc_ver);
                this.$root.$emit('for-audioeditor:load', this.block.getAudiosrcFootnote(footnoteIdx, 'm4a'), this.audioEditFootnote.footnote.content);
                this.audioEditFootnote.isAudioChanged = true;
              }
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
        //console.log('this.range', this.range);
        let el = document.createElement('SUP');
        el.setAttribute('data-idx', this.block.footnotes.length);
        this.range.insertNode(el);
        let pos = this.updFootnotes(this.block.footnotes.length);
        this.block.footnotes.splice(pos, 0, new FootNote({}));
        this.isChanged = false; // to be shure to update view
        this.isChanged = true;
        this.pushChange('footnotes');
        Vue.nextTick(() => {
          //this.destroyEditor();
          this.initFtnEditor(true);
        });
      },
      delFootnote: function(pos) {
        $('#'+this.block._id).find(`[data-idx='${pos+1}']`).remove();
        this.updFootnotes();
        this.block.footnotes.splice(pos, 1);
        this.isChanged = false; // to be shure to update view
        this.isChanged = true;
        this.pushChange('footnotes');
      },
      updFootnotes: function(c_pos = 0) {
        let pos = 0;
        $('#'+this.block._id).find('[data-idx]').each(function(idx) {
          if ($(this).data('idx') == c_pos) pos = idx;
          $(this).text(idx+1).attr('data-idx', idx+1);
        });
        return pos;
      },
      commitFootnote: function(pos, ev, field = null) {
        //this.block.footnotes[pos] = ev.target.innerText.trim();
        this.isChanged = true;
        this.pushChange('footnotes');
        if (field === 'voicework') {
          this.block.setAudiosrcFootnote(pos, '');
        }
      },
      commitDescription: function(ev) {
        //this.block.description = ev.target.innerText.trim();
        this.isChanged = true;
        this.pushChange('description');
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
          this.pushChange('flags');
        }
      },

      addFlagPart: function(content, type = 'editor') {
        this.block.addPart(this.flagsSel._id, content, type);

        this.updateFlagStatus(this.flagsSel._id);
        this.$refs.blockFlagPopup.reset();

        this.$refs.blockFlagPopup.scrollBottom();
        this.isChanged = true;
        this.pushChange('flags');
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
          if (this.allowBlockFlag) {
            if (type === 'editor' && this._is('editor', true)) {
              type = 'narrator';
            }
            flagId = this.$refs.blockFlagControl.dataset.flag = this.block.newFlag({}, type, true);
            this.$refs.blockFlagControl.dataset.status = 'open';
            this.isChanged = true;
            this.pushChange('flags');
          } else {
            return;
          }
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
            if (this._is(flagPart.type, true) && this.tc_getBlockTask(this.block._id)) {
              result = true;
            }
            if (!result && flagPart.type === 'narrator' && this._is('editor', true)) {
              result = true;
            }
          }
          return result;
      },

      canDeleteFlagPart: function (flagPart) {
          let result = false;
          if (!this.isCompleted && flagPart.creator === this.auth.getSession().user_id) {
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
            this.pushChange('flags');
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
        this.pushChange('flags');
      },

      reopenFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'open';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
        this.pushChange('flags');
      },

      hideFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'hidden';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
        this.pushChange('flags');
      },

      unHideFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'resolved';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
        this.pushChange('flags');
      },

      toggleArchFlags: function(ev, partIdx) {
        this.isHideArchFlags = !this.isHideArchFlags;
      },

      toggleHideArchParts: function() {
        this.isHideArchParts = !this.isHideArchParts;
        this.$refs.blockFlagPopup.reset();
      },

      startRecording() {
        this.$emit('recordingState', 'recording', this.block._id);
        this.recordTimer()
        .then(() => {
          this.recordStartCounter = 0;
          this.isRecording = true;
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
      stopRecording(start_next) {
        start_next = typeof start_next === 'undefined' ? false : start_next;
        if (!this.isRecording) {
          return false;
        }
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
                  //self.blockAudio.map = response.data.content;
                  self.$root.$emit('bookBlocksUpdates', {blocks: [response.data]});
                  //self.block.setContent(response.data.content);
                  //self.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                  //self.blockAudio.src = self.block.getAudiosrc('m4a');
                  //self.blockAudio.map = self.block.content;
                  //self.isAudioChanged = true;
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
      cancelRecording() {
        if (this.recorder) {
          this.isRecording = false;
          this.isRecordingPaused = false;
          this.recorder.stopRecording(() => {

          });
        }
      },
      doReAlign(footnoteIdx = null) {
        if (this.block.audiosrc) {
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/realign';
        let api = this.$store.state.auth.getHttp();
        let formData = new FormData();
        if (footnoteIdx !== null){
          api_url = this.API_URL + 'book/block/' + this.block._id + '/footnote/' + footnoteIdx + 'realign'
          formData.append('footnote_idx', footnoteIdx);
          formData.append('audio', [this.block.getAudiosrcFootnote(footnoteIdx, false, false)]);
        } else {
          formData.append('audio', [this.block.getAudiosrc(false, false)]);
        }
        this.isUpdating = true;
        return api.post(api_url, formData, {})
        .then(response => {
          this.isUpdating = false;
          if (response.status == 200) {
            if (footnoteIdx === null) {
              this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
              this.blockAudio.src = this.block.getAudiosrc('m4a');
              this.blockAudio.map = response.data.content;
            } else {
              this.block.setContentFootnote(footnoteIdx, response.data.content);
              this.block.setAudiosrcFootnote(footnoteIdx, response.data.audiosrc, response.data.audiosrc_ver);
            }
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
        this.$emit('insertBefore', this.block, this.blockId);
      },
      insertBlockAfter() {
        this.$emit('insertAfter', this.block, this.blockId);
      },
      deleteBlock() {
        if (!this.blockReindexProcess) {
          this.deletePending = false;
          this.hideModal('delete-block-message');
          this.$emit('deleteBlock', this.block, this.blockId);
        } else {
          this.deletePending = true;
        }
      },
      showModal(name) {
        this.$modal.show(name + this.block._id);
      },
      hideModal(name) {
        this.$modal.hide(name + this.block._id);
      },
      setChanged(val, type = null, event = null) {
        console.log('setChanged', val);
        this.isChanged = val;
        if (val && type) {
          this.pushChange(type);
          if (this.block) {
            this.block.classes = {};
            this.block.secnum = false;
            this.block.parnum = false;
          }
          this.reCount();
          this.$root.$emit('from-block-edit:set-style');
          if (type === 'type' && event && event.target) {
            if (event.target.value === 'illustration') {
              let i = setInterval(() => {
                if (document.querySelectorAll('[id="' + this.block._id + '"] .content-wrap-desc').length > 0) {
                  this.initEditor();
                  clearInterval(i);
                }
              }, 500);
            }
          }
        }
      },
      setChangedByClass(val) {
        //console.log('setChangedByClass', this.block.type, val);
        if (this.block.type === 'title') {
          this.isChanged = val;
          this.pushChange('class');
        }
      },
      joinWithPrevious() {
        this.joinBlocks(this.block, this.blockId, 'previous')
        .then(()=>{})
        .catch(()=>{})
      },
      joinWithNext() {
        this.joinBlocks(this.block, this.blockId, 'next')
        .then(()=>{})
        .catch(()=>{})
      },
      showFootnoteAudioEditor(footnote, ftnIdx) {
        this.FtnAudio.isEditing = true;
        this.FtnAudio.map = footnote.content;
        if (this.FtnAudio.isChanged) {
          this.discardFtnAudio();
        }

        //this.$root.$emit('for-audioeditor:load-and-play', this.block.getAudiosrcFootnote(ftnIdx, 'm4a', true), this.FtnAudio.map, `${this.block._id}_${ftnIdx}`);

        //$('nav.fixed-bottom').removeClass('hidden');
        this.audioEditFootnote.footnote = footnote;
        this.showAudioEditor(ftnIdx, footnote);
      },
      showAudioEditor(footnoteIdx = null, footnote = null) {
        //$('.table-body.-content').removeClass('editing');
        //$('#' + this.block._id + ' .table-body.-content').addClass('editing');
        if (!footnoteIdx) {
          this.isAudioEditing = true;
          if (this.isAudioChanged) {
            this.discardAudio();
          }
        }
        let check_id = footnoteIdx !== null ? this.block._id + '_' + footnoteIdx : this.block._id;

        Vue.nextTick(() => {

          let audiosrc = footnoteIdx !== null ? this.block.getAudiosrcFootnote(footnoteIdx, 'm4a', true) : this.blockAudio.src;
          let text = footnote ? footnote.content : this.blockAudio.map;
          let loadBlock = footnoteIdx !== null ? {_id: check_id, voicework: footnote ? footnote.voicework : 'tts'} : this.block;
          this.$root.$emit('for-audioeditor:load-and-play', audiosrc, text, loadBlock);

          let self = this;
          this.$root.$on('from-audioeditor:block-loaded', function(blockId) {
            if (blockId == check_id) {
              $('nav.fixed-bottom').removeClass('hidden');
            }
          });
          this.$root.$on('from-audioeditor:word-realign', function(map, blockId) {
            if (blockId == check_id) {
              self.audStop();
              //console.log(self.$refs.blockContent.querySelectorAll('[data-map]').length, map.length);
              if (footnoteIdx !== null) {
                let ref = self.$refs['footnoteContent_' + footnoteIdx];
                if (ref) {
                  ref = ref[0];
                }
                if (ref && ref.querySelectorAll) {
                  ref.querySelectorAll('[data-map]').forEach(_w => {
                    let _m = map.shift();
                    let w_map = _m.join()
                    $(_w).attr('data-map', w_map)
                  });
                  self.audioEditFootnote.footnote.content = ref.innerHTML;
                  self.isChanged = true;
                  self.pushChange('footnotes');
                  self.pushChange('content_footnote');
                }
              } else {
                if (self.$refs.blockContent && self.$refs.blockContent.querySelectorAll) {
                  self.$refs.blockContent.querySelectorAll('[data-map]').forEach(_w => {
                    let _m = map.shift();
                    let w_map = _m.join()
                    $(_w).attr('data-map', w_map)
                  });
                  self.block.content = self.$refs.blockContent.innerHTML;
                  self.blockAudio.map = self.block.content;
                  self.isChanged = true;
                  self.pushChange('content');
                }
              }
            }
          });
          this.$root.$on('from-audioeditor:save', function(blockId) {
            if (blockId == check_id) {
              self.audStop();
              self.assembleBlockAudioEdit(footnoteIdx);
            }
          });
          this.$root.$on('from-audioeditor:save-and-realign', function(blockId) {
            if (blockId == check_id) {
              self.audStop();
              self.doReAlign()
                .then(() => {
                  self.assembleBlockAudioEdit(footnoteIdx);
                });
            }
          })
          this.$root.$on('from-audioeditor:cut', function(blockId, start, end) {
            if (blockId == check_id) {
              self.audStop();
              self._audDeletePart(start, end, footnoteIdx);
            }
          });
          this.$root.$on('from-audioeditor:closed', function(blockId) {
            if (blockId == check_id) {
              self.isAudioEditing = false;
              if (self.isAudioChanged) {
                self.discardAudioEdit(footnoteIdx, false);
              }
              $('nav.fixed-bottom').addClass('hidden');
              //self.$root.$off('from-audioeditor:insert-silence');
              //self.$root.$off('from-audioeditor:word-realign');
              //self.$root.$off('from-audioeditor:save');
              //self.$root.$off('from-audioeditor:save-and-realign');
              //self.$root.$off('from-audioeditor:cut');
              //self.$root.$off('from-audioeditor:undo');
              //self.$root.$off('from-audioeditor:discard');
              //self.$root.$off('from-audioeditor:closed');
              //self.$root.$off('from-audioeditor:select');
              $('#' + self.block._id + ' .table-body.-content').removeClass('editing');
            }
          });
          this.$root.$on('from-audioeditor:insert-silence', function(blockId, position, length) {
            if (blockId == check_id) {
              self.audStop();
              self.insertSilence(position, length, footnoteIdx);
            }
          });
          this.$root.$on('from-audioeditor:undo', function(blockId, audio, text, isModified) {
            if (check_id == blockId) {
              self.audStop();
              if (footnoteIdx === null) {
                self.block.undoContent();
                self.block.undoAudiosrc();
                self.blockAudio.map = self.block.content;
                self.blockAudio.src = self.block.getAudiosrc('m4a');
                self.isAudioChanged = isModified;
              } else {
                //self.audioEditFootnote.footnote.content = text;
                //self.block.setAudiosrcFootnote(footnoteIdx, audio);
                //self.audioEditFootnote.isAudioChanged = isModified;
                self.block.undoContentFootnote(footnoteIdx);
                self.block.undoAudiosrcFootnote(footnoteIdx);
                this.$root.$emit('for-audioeditor:load', self.block.getAudiosrcFootnote(footnoteIdx, 'm4a'), self.audioEditFootnote.footnote.content);
              }
            }
          });
          this.$root.$on('from-audioeditor:discard', function(blockId) {
            if (check_id == blockId) {
              self.audStop();
              self.discardAudioEdit(footnoteIdx);
            }
          });
          this.$root.$on('from-audioeditor:select', (blockId, start, end) => {
            if (check_id == blockId) {
              //console.log(start, end)
              let ref;
              if (footnoteIdx !== null) {
                ref = this.$refs['footnoteContent_' + footnoteIdx];
                if (ref) {
                  ref = ref[0];
                }
              } else {
                if (this.$refs.blockContent) {
                  ref = this.$refs.blockContent;
                }
              }
              if (ref && ref.querySelectorAll) {
                start = parseInt(start * 1000);
                end = parseInt(end * 1000);
                ref.querySelectorAll('w').forEach(e => {
                  let map = $(e).attr('data-map');
                  if(map) {
                    map = map.split(',');
                    if (map.length == 2) {
                      map[0] = parseInt(map[0]);
                      map[1] = map[0] + parseInt(map[1]);
                      if ((map[0] >= start && map[0] < end) ||
                              (map[0] < start && map[1] > start)) {
                        //console.log(map[0], start, map[1], end)
                        //console.log(e)
                        $(e).addClass('selected');
                      } else {
                        //console.log('NOT', map, start, end, e)
                        $(e).removeClass('selected');
                      }
                    }
                  }
                });
              }
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
          if (parent && parent.localName == tag) {
            return parent;
          }
        } while(parent);
        return null;
      },
      _getClosestAligned(node, direction) {
        if (!node) {
          return null;
        }
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
            self.$emit('blockUpdated', self.block._id);
            //let offset = document.getElementById(self.block._id).getBoundingClientRect()
            //window.scrollTo(0, window.pageYOffset + offset.top);
            self.isIllustrationChanged = false;
            self.isChanged = false;
            self.block.isIllustrationChanged = false;
            self.block.isChanged = false;
            self.$root.$emit('bookBlocksUpdates', {blocks: [response.data]});
            //if (self.editor) {
              //self.editor.destroy();
            //}
            $('[id="' + self.block._id + '"] .illustration-block')
              .removeAttr('contenteditable')
              .removeAttr('data-placeholder');
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
      setRangeSelection(type, ev) {
        let checked;
        if (ev === true || ev === false) checked = ev;
        else checked = ev.target && ev.target.checked;

        let shiftKey = ev.shiftKey||ev.ctrlKey||false;
        if (ev.shiftKey) {
          if (this.selectionStart && this.selectionStart != this.block._id) {
            document.getSelection().removeAllRanges();
          }
        }
        this.block.checked = checked;
        this.$emit('setRangeSelection', this.block, type, checked, shiftKey);
      },
      updateVoicework() {
        if (!this.voiceworkChange) {
          return false;
        }
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
              this.getAlignCount();
              response.data.updField = 'voicework';
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
        this.block.secVal = this.block.secnum;
        this.block.partUpdate = true;
        this.putBlock(this.block).then(()=>{});
      }, 500),

      setSecnum() {
        if (this.block.secnum === false) {
          this.block.secnum = this.block.secVal ? this.block.secVal : '';
        }
        else {
          this.block.secVal = this.block.secnum;
          this.block.secnum = false;
        }
        this.reCount();
        this.block.partUpdate = true;
        this.putBlock(this.block).then(()=>{});
      },
      setSecnumHidden() {
        this.block.secHide = !this.block.secHide;
        this.putBlockPart({block: this.block, field: 'secHide'}).then(()=>{});
      },
      setParnum() {
        if (this.block.parnum === false) this.block.parnum = ''
        else this.block.parnum = false;
        this.reCount();
        this.putBlockPart({block: this.block, field: 'parnum'}).then(()=>{});
      },
      allowVoiceworkChange() {
        if (this.block.type == 'illustration' || this.block.type == 'hr') {
          return false;
        }
        if (this.tc_hasTask('content_cleanup')) {
          return true;
        }
        return this.tc_hasBlockTask(this.block._id, 'approve-new-block') || this.tc_hasBlockTask(this.block._id, 'approve-modified-block');
      },
      pushChange(change) {
        if (this.changes.indexOf(change) === -1) {
          this.changes.push(change);
        }
      },
      flushChanges() {
        this.changes = [];
      },
      unsetChange(change) {
        let index = this.changes.indexOf(change);
        if (index !== -1) {
          this.changes.splice(index, 1);
        }
      },
      setHtml() {
        if (this.$refs.blockContent) {
          this.$refs['block-html' + this.block._id].value = this.$refs.blockContent.innerHTML;
        }
      },
      setContent() {
        //console.log('value', this.$refs['block-html' + this.block._id].value)
        this.block.content = this.$refs['block-html' + this.block._id].value;
        this.$refs.blockContent.innerHTML = this.block.content;
        this.isChanged = true;
        this.hideModal('block-html');
      },

      addContentListeners() {
        let handler = (id, ref) => {
          if (window.getSelection) {
            //let content = this.range.extractContents();
            let range = window.getSelection().getRangeAt(0).cloneRange();
            //console.log(this.range, window.getSelection(), range)
            let startElement = this._getParent(range.startContainer, 'w');
            let endElement = this._getParent(range.endContainer, 'w');
            let startRange = this._getClosestAligned(startElement, 1);
            if (!startRange) {
              startRange = [0, 0];
            }
            let endRange = this._getClosestAligned(endElement, 0);
            if (!endRange) {
              endRange = this._getClosestAligned(endElement, 1)
            }
            if (startRange && endRange) {
              //console.log(startRange[0], endRange[0] + endRange[1])
              this.$root.$emit('for-audioeditor:select', id, startRange[0], endRange[0] + endRange[1]);
            }
            //console.log(startElement, endElement, startRange, endRange)
          }

          if (ref && ref.querySelectorAll) {
            ref.querySelectorAll('w').forEach(e => {
              $(e).removeClass('selected');
            });
          }
        }
        if (this.$refs.blockContent) {
          this.$refs.blockContent.addEventListener("mouseup", () => {
            //console.log('Selection changed.');
            handler(this.block._id, this.$refs.blockContent);
          });
          this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
            flag.addEventListener('click', this.handleFlagClick);
          });
        }
        if (this.block && this.block.footnotes) {
          for (let i in this.block.footnotes) {
            let ref = this.$refs['footnoteContent_' + i];
            if (ref) {
              ref = ref[0];
              ref.addEventListener("mouseup", () => {
                //console.log('Selection changed.');
                handler(this.block._id + '_' + i, ref);
              });
            }
          }
        }
      },
      _handleSpacePress(e) {
        if (e) {
          if (e.charCode == 32 && this.isRecording) {
            if (!this.isRecordingPaused) {
              this.pauseRecording();
            } else {
              this.resumeRecording();
            }
          }
          if (e.charCode == 32 && this.isAudStarted) {
            if (!this.isAudPaused) {
              this.audPause();
            } else {
              this.audResume();
            }
          }
        }
      }
  },
  watch: {
      'block.isUpdated' (newVal, oldVal) {
        if (newVal===true) {
          this.isUpdated = true;
          this.block.isUpdated = false;
          setTimeout(() => {
            this.isUpdated = false;
          }, 2000);
        }
      },
      'block._id' (newVal) {
        //this.isUpdated = false;
      },
      'block._rev' (newVal, oldVal) {
        //console.log('block._rev: ', this.block._rev, 'newVal: ', newVal, 'oldVal: ', oldVal);
        if (oldVal) {
          this.isUpdated = true;
          setTimeout(() => {
            this.isUpdated = false;
          }, 2000);
        }
        if (!this.block) {
          return;
        }
        if (newVal !== this.block._rev)
        {
          if (this.block.illustration) {
            this.block.illustration = this.block.illustration.split('?').shift() + '?' + Date.now()
          }
          this.blockAudio = {'map': this.block.content, 'src': this.block.getAudiosrc('m4a')};
          if (this.$refs.blockContent) {
            this.addContentListeners();
          }
        } else {
          this.blockAudio = {
            'src': this.block.getAudiosrc('m4a'),
            'map': this.block.content
          };
        }
      },
//       'block.type' (newVal) {
//         console.log('block.type' , newVal);
//         if (this.blockTypes[newVal] && Object.keys(this.blockTypes[newVal])[0] !== '') {
//           this.classSel = Object.keys(this.blockTypes[newVal])[0];
//         }
//         if (this.block) {
//           this.block.classes = {};
//         }
//         this.reCount();
//         this.$root.$emit('from-block-edit:set-style');
//       },
      'classSel' (newVal, oldVal) {
        let styleCurr = this.block.setClass(newVal);
        if (styleCurr) this.styleSel = styleCurr;
        else this.styleSel = '';
      },
      'styleSel' (newVal, oldVal) {
        //console.log('styleSel');
        this.block.setClassStyle(this.classSel, newVal);
        this.$root.$emit('from-block-edit:set-style');
        //this.addContentListeners();
        //this.destroyEditor()
        //this.initEditor();
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
      'block.footnotes': {
        handler: function (val, oldVal) {
          if (this.block && this.block.footnotes && this.block.footnotes.length) {
            this.block.footnotes.forEach((footnote, footnoteIdx)=>{
              if (footnote.audiosrc && !this.FtnAudio.player) {
                this.initFootnotePlayer(this.FtnAudio);
                return true;
              }
            });
          }
        },
        deep: true
      },
      'blockAudio.map' (newVal, oldVal) {

      },
      'block.markedAsDone': {
        handler(val) {
          if (this.block && val !== this.block.markedAsDone) {
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
      },
      'isChanged' : {
        handler(val) {
          if (val === false) {
            this.flushChanges();
          }
          this.block.isChanged = val;
          this.recountApprovedInRange();
        }
      },
      'isAudioChanged': {
        handler(val) {
          if (val) {
            this.pushChange('audio');  //TODO ask !
            //this.voiceworkSel('audio');
          } else {
            this.unsetChange('audio');
          }
          this.block.isAudioChanged = val;
        }
      },
      'isIllustrationChanged': {
        handler(val) {
          if (val) {
            this.pushChange('illustration');
          } else {
            this.unsetChange('illustration');
          }
          this.block.isIllustrationChanged = val;
        }
      },
      'block.content': {
        handler(val) {
          Vue.nextTick(() => {
            if (this.$refs.blockContent) {
              this.addContentListeners();
            }
          });
        }
      },
      'blockReindexProcess': {
        handler(val, oldVal) {
          if (this.deletePending && oldVal && !val) {
            this.deleteBlock();
          }
        }
      },
      'block.flags': {
        handler(val) {
          if (this.isCompleted) {
            Vue.nextTick(() => {
              if (this.$refs.blockContent) {
                this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
                  flag.addEventListener('click', this.handleFlagClick);
                });
              }
            });
            this.updateFlagStatus(this.block._id);
          }
        }
      },
      'allowEditing': {
        handler(newVal, oldVal) {
          // because after page loaded tasks may be late
          if (newVal === true && !this.editor) this.initEditor();
          else this.destroyEditor();
        }
      },
      'mode': {
        handler(val, oldVal) {
          //if (val === 'narrate') {
            //this.destroyEditor();
          //} else if (oldVal === 'narrate') {
            this.initEditor(true);
          //}
        }
      },
      'isRecording': {
        handler(val) {
          this.$emit('recordingState', val ? 'recording' : 'stopped', this.block._id);
          if (val === true) {
            if (this.$refs.blockContent) {
              let i = setInterval(() => {
                let w = this.$refs.blockContent.querySelectorAll('w');
                let ctrl = $('#'+this.block._id).find('.recording-hover-controls')
                if (ctrl.length > 0) {
                  clearInterval(i);
                  let ctrl_pos = ctrl.position();
                  if (w.length === 0) {
                    w = this.$refs.blockContent.querySelectorAll('*');
                  }
                  ctrl_pos.top+=parseInt(ctrl.css('margin-top'));
                  if (w.length > 0) {
                    w.forEach(_w => {
                      let _w_pos = $(_w).position();
                      if (_w_pos.left + _w.offsetWidth >= ctrl_pos.left && _w_pos.top + _w.offsetHeight >= ctrl_pos.top) {
                        ctrl.css('margin-top', '-15px');
                        return;
                      }
                    });
                  }
                }
              }, 50)
            }
            $('body').off('keypress', this._handleSpacePress);
            $('body').on('keypress', this._handleSpacePress);
          } else {
            $('body').off('keypress', this._handleSpacePress);
          }
        }
      },
      'isAudStarted': {
        handler(val) {
          if (this.mode === 'narrate') {
            if (val === true) {
              $('body').off('keypress', this._handleSpacePress);
              $('body').on('keypress', this._handleSpacePress);
            } else {
              $('body').off('keypress', this._handleSpacePress);
            }
          }
        }
      }
  },
  beforeDestroy: function () {
//      console.log('beforeDestroy', this.block._id);
//     console.log('this.isChanged', this.isChanged);
    if (this.isChanged) {
        switch (this.block.type) { // part from assembleBlock: function()
          case 'illustration':
            this.block.description = this.$refs.blockDescription.innerHTML;
            this.block.voicework = 'no_audio';
          case 'hr':
            this.block.content = '';
            this.block.voicework = 'no_audio';
            break;
          default:
            this.block.content = this.$refs.blockContent.innerHTML.replace(/(<[^>]+)(selected)/g, '$1');
            this.block.content = this.block.content.replace(/(<[^>]+)(audio-highlight)/g, '$1');
            if (this.block.footnotes && this.block.footnotes.length) {
              this.block.footnotes.forEach((footnote, footnoteIdx)=>{
                this.block.footnotes[footnoteIdx].content = $('[data-footnoteIdx="'+this.block._id +'_'+ footnoteIdx+'"').html();
              });
            }
            break;
        }
    }

    if (this.$refs.blockContent) {
      this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
        flag.removeEventListener('click', this.handleFlagClick);
      });
    }
  },
  destroyed: function () {
    this.$root.$off('playBlockFootnote');
    this.$root.$off('playBlock');
    this.$root.$off('saved-block:' + this.block._id);
    this.destroyEditor();
  }
}
</script>

<style lang='less'>
@variable: 90px;
.ilm-block {
    padding: 0;
    .medium-editor-placeholder:after {
      top: -6px;
    }
/*    .content-wrap {
      &.par {
        min-height: 54px;
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
    }*/
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

    }

    &.-content {
        margin-bottom: 20px;

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

        &.-check-green {
          /*border-left: 6px solid darkgreen;*/
          /*background-color: lightgreen;*/
          background: linear-gradient(to right, lightgreen , white);
          /*padding-left: 9px;
          width: 48px;*/
        }

        .table-row.parnum-row {
          height: 25px;
        }

        .table-row.check-row {
          height: 25px;
          width: 17px;

         .set-range {
            /*cursor: pointer;*/
            margin: 5px 0 0 1px;
            .fa {
              font-size: 20px;
            }
          }

          .fa {
            display: block;
            margin: 5px 0 0 2px;
            cursor: pointer;
          }
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

        .-hidden-block {
            display: none;
        }

        &:hover {
            .-hidden-block {
                display: block;
            }
        }

        .parnum {
          font-size: 1.1em;
          font-family: serif;
          margin-top: 1px;

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

          margin-left: -3px;
          margin-top: -1px;
/*          &.-hidden {
            display: none;
            &:hover {
              display: block;
            }
          }*/
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
.-mode-narrate {
  .table-cell {
    &.completed {
      border: 1px solid #afacac;
      /*border-radius: 7px;*/
    }
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
          padding: 1px 5px;
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
              /*visibility: hidden;*/
              display: none;
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
          /*border-color: #9ecaed;*/
          box-shadow: 0 0 10px #9ecaed;
      }
      &.checked {
          outline: none;
          border-color: #9ecaed;
          box-shadow: 0 0 10px #9ecaed;
      }
      &.updated {
          box-shadow: 0 0 10px rgba(56, 171, 53, 0.7);
          transition: box-shadow 200ms;
      }

    }

    .hr.checked {
          outline: none;
          border-color: #9ecaed;
          box-shadow: 0 0 10px #9ecaed;
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
        &.menu-preloader {
          background: url(/static/preloader-snake-transparent-small.gif);
          width: 18px;
          height: 16px;
          display: inline-block;
          background-repeat: no-repeat;
          text-align: center;
          background-position: 0 0;
          background-size: 83%;
          margin-bottom: -3px;
          margin-right: -1px;
        }
      }
      .disabled {
        color: gray;
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
      &.checked {
        outline: none;
        border-color: #9ecaed;
        box-shadow: 0 0 10px #9ecaed;
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
        width: 160px;
        .fa {
            font-size: 18px;
        }
    }
    i.fa-volume-off {
        font-size: 27px;
        margin-right: 5px;
    }
    label {
      select, span {
          display: inline-block;
          vertical-align: super;
      }
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

      [data-idx], [data-pg] {
        w:not([data-map]) {
          background: none;
        }
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
  .glyphicon-flag.flag-disabled {
    color: lightgray;
    &:before {
      color: lightgray;
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

  .block-html-modal {
    .modal-header {
      width: 100%;
      .modal-title {
        float: left;
        margin-left: 15px;
        width: 80%;
      }
      .modal-close-button {
        float: right;
        margin-right: 15px;
      }
    }
    .modal-body {
      overflow: visible;
    }
    textarea.block-html {
      width: 100%;
      height: 250px;
      resize: vertical;
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
  .locked-block-cover {
    width: 100%;
    position: absolute;
    height: 100%;
    background: url(/static/preloader-snake-small.gif);
    background-repeat: no-repeat;
    text-align: center;
    background-position: center;
    background-color: #8080807d;
  }
  .recording-hover-controls {
    position: absolute;
    right: 30px;
    margin-top: -35px;
    i {
      font-size: 27px;
      margin: 0px 5px;
      color: red;
      &:hover {
        color: #ff7a7a;
      }
    }
  }
  .fa.disabled {
    color: #dddddd;
  }
  .fa.paused {
    color: red;
  }
  .controls-left {
    .fa {
      font-size: 27px;
      margin: 7px 0px;
    }
  }
  .narrate-controls {
    .fa-pause-circle-o {
      color: red;
    }
  }

</style>
