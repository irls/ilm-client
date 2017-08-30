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
            <div class="table-row controls-top"
            data-toggle="tooltip" v-bind:title="JSON.stringify(block)">

              <div class="par-ctrl -hidden -left">
                  <span class="block-menu" style="position: relative;">
                  <i class="glyphicon glyphicon-menu-hamburger"
                  @click.prevent="$refs.blockMenu.open($event, block._id)">
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
                    <li>Revert to original audio</li>
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
                  <template v-if="player">
                      <i class="fa fa-play-circle-o" v-if="!isAudStarted"
                      @click="audPlay(block._id, $event)"></i>
                      <template v-else>
                        <i class="fa fa-stop-circle-o"
                          @click="audStop(block._id, $event)"></i>
                        <i class="fa fa-pause-circle-o" v-if="!isAudPaused"
                          @click="audPause(block._id, $event)"></i>
                        <i class="fa fa-play-circle-o" v-else
                          @click="audResume(block._id, $event)"></i>
                        </template>
                  </template>
                  <template v-if="recorder && tc_showBlockNarrate(block._id) && !isAudStarted">
                    <i class="fa fa-microphone" v-if="!isRecording" @click="startRecording($event)"></i>
                    <template v-else>
                      <i class="fa fa-stop-circle-o" @click="stopRecording(true, $event)"></i>
                    </template>
                  </template>
              </div>
              <!--<div class="-hidden">-->

            </div>
            <!--<div class="table-row controls-top">-->

            <div class="table-row ocean">
                <hr v-if="block.type=='hr'" />

                <div v-else class="content-wrap"
                :id="'content-'+block._id"
                ref="blockContent"
                v-html="block.content"
                :class="[ block.type, block.classes, { 'updated': isUpdated, 'playing': isAudStarted }]"
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
                    :update="update"
                >

                  <template v-for="(part, partIdx) in flagsSel.parts">
                    <li>

                    <div class="flag-header -left">Editing {{moment(part.created_at).format("D MMM")}} <i v-if="part.status == 'resolved'" class="glyphicon glyphicon-flag -resolved"></i></div>
                    <a href="#" class="flag-control -right"
                      v-if="part.status == 'resolved'"
                      @click.prevent="$refs.blockFlagPopup.close">
                      Hide flag</a>
                    <a href="#" class="flag-control -right"
                      v-if="canDeleteFlagPart(part)"
                      @click.prevent="delFlagPart($event, partIdx)">
                      <i class="fa fa-trash"></i></a>
                    <div class="clearfix"></div>

                    <p class="flag-content">"{{part.content}}"</p>

                    <p v-for="comment in part.comments" class="flag-comment">
                      <i>{{comment.creator}}</i>&nbsp;({{moment(comment.created_at).format("D MMM")}}): {{comment.comment}}
                    </p>

                    <textarea class="flag-comment"
                      v-model="part.newComment"
                      placeholder="Enter description here ...">
                    </textarea>

                    </li>
                    <!--<li class="separator"></li>-->
                    <a href="#" class="flag-control -left"
                    @click.prevent="$refs.blockFlagPopup.close">
                    Flag for narration also</a>
                  </template>

                  <a href="#" class="flag-control -right"
                    @click.prevent="$refs.blockFlagPopup.close">
                    Close</a>

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
                  <li class="separator"></li>
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
import moment from 'moment'
import { mapGetters, mapActions }    from 'vuex'
import { QuoteButton, QuotePreview } from '../generic/ExtMediumEditor';
import ReadAlong          from 'readalong'
import BlockMenu          from '../generic/BlockMenu';
import BlockContextMenu   from '../generic/BlockContextMenu';
import BlockFlagPopup     from '../generic/BlockFlagPopup';
import taskControls       from '../../mixins/task_controls.js'
import apiConfig          from '../../mixins/api_config.js'

export default {
  data () {
    return {
      editor: false,
      player: false,
      range: false,
      flagsSel: [],
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
      isAudioChanged: false,
      blockAudio: {
        src: '',
        map: ''
      }
    }
  },
  components: {
      'block-menu': BlockMenu,
      'block-cntx-menu': BlockContextMenu,
      'block-flag-popup': BlockFlagPopup
  },
  props: ['block', 'putBlock', 'getBlock', 'recorder'],
  mixins: [taskControls, apiConfig],
  computed: {
      blockClasses : function () {
          return this.blockTypeClasses[this.block.type];
      },
      ...mapGetters({
          auth: 'auth',
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

      Vue.nextTick(() => {
        if (this.$refs.blockContent) this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
          flag.addEventListener('click', this.handleFlagClick);
        });
      });
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
          this.$refs.blockContent.focus();
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
          let flag = document.createElement('w');
          flag.dataset.flag = this.block.addFlag(this.range, type);
          //flag.dataset.status = 'open';

          flag.appendChild(this.range.extractContents());
          this.range.insertNode(flag);

          flag.addEventListener('click', this.handleFlagClick);
          this.handleFlagClick({target: flag});

          this.isChanged = true;
        }
      },

      handleFlagClick: function(ev) {
        let flagId = ev.target.dataset.flag;
        this.flagsSel = this.block.flags.filter((flag)=>{
          return flag._id === flagId;
        })[0];
        this.$refs.blockFlagPopup.open(ev, flagId);
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

                let node = this.$refs.blockContent.querySelector(`[data-flag="${this.flagsSel._id}"]`);
                let parent = node.parentNode;
                while (node.firstChild) parent.insertBefore(node.firstChild, node);
                parent.removeChild(node);
            }
            this.$root.$emit('closeFlagPopup', true);
            this.isChanged = true;
        }
      },

      test: function() {
          console.log('addFootnote'+this.block._id, this.block.footnotes);
      },

      startRecording() {
        this.isRecording = true;
        this.$emit('startRecording', this.block._id)
      },
      stopRecording(isSend) {
        this.isRecording = false;
        this.$emit('stopRecording', this.block._id, this.blockAudio)
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
          Vue.nextTick(() => {
            if (this.$refs.blockContent) this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
              flag.addEventListener('click', this.handleFlagClick);
            });
          });
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
            this.isAudioChanged = newVal && this.block.audiosrc != newVal.split('?').shift();
          }
        }
      },
      'blockAudio.map' (newVal) {
        //console.log('Tmp audiomap', newVal);
        if (this.tc_showBlockNarrate(this.block._id)) {
          this.isAudioChanged = this.block.content != newVal;
          this.$refs.blockContent.innerHTML = newVal;
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
