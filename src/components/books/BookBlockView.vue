<template>
<div class="table-body -block">
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
        <div class="table-body -content">
            <div class="table-row controls-top"
            data-toggle="tooltip" v-bind:title="JSON.stringify(block)">

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
                    <li @click="discard">Discard un-saved changes</li>
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
                  <i class="fa fa-microphone"></i>
              </div>
              <!--<div class="-hidden">-->

            </div>
            <!--<div class="table-row controls-top">-->

            <div class="table-row ocean">
                <hr v-if="block.type=='hr'" />

                <div v-else class="content-wrap"
                ref="blockContent"
                v-html="block.content"
                :id="block._id"
                :class="[ block.type, block.classes, { 'updated': isUpdated, 'playing': isAudStarted }]"
                :data-audiosrc="block.audiosrc"
                @click="onClick"
                @input="input"
                @contextmenu.prevent="onContext">
                </div>
                <!--<div class="content-wrap">-->

                <block-cntx-menu
                    ref="blockCntx"
                    dir="bottom"
                    :update="update"
                >
                  <li>{{ block.type }}</li>
                  <li>{{ block.classes }}</li>
                </block-cntx-menu>

            </div>
            <!--<div class="table-row ocean">-->

            <div class="table-row controls-bottom">
                <div class="save-block -hidden -left"
                v-bind:class="{ '-disabled': !isChanged }"
                @click="assembleBlock()">
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
require('medium-editor');
require('medium-editor-css');
require('medium-editor-theme');
import ReadAlong from 'readalong'
import BlockMenu from '../generic/BlockMenu';
import BlockContextMenu from '../generic/BlockContextMenu';

export default {
  data () {
    return {
      editor: false,
      player: false,
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
      isAudPaused: false
    }
  },
  components: {
      'block-menu': BlockMenu,
      'block-cntx-menu': BlockContextMenu,
  },
  props: ['block', 'putBlock'],
  computed: {
      blockClasses : function () {
          return this.blockTypeClasses[this.block.type];
      }
  },
  mounted: function() {
      this.editor = new MediumEditor('.content-wrap', {
          toolbar: {
              buttons: ['bold', 'italic', 'underline', 'anchor', 'quote'],
          }
      });
//       this.editor.subscribe('hideToolbar', (data, editable)=>{});
//       this.editor.subscribe('positionToolbar', ()=>{})

      if (!this.player && this.block.audiosrc) {
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
                  this.audCleanClasses(block_id, ev);
              }
          });
      }
  },
  methods: {
      onClick: function() {
          $('.medium-editor-toolbar').each(function(){
                $(this).css('display', 'inline-block');
          });
      },
      onContext: function(e) {
          $('.medium-editor-toolbar').each(function(){
              $(this).css('display', 'none');
          });
          this.$refs.blockCntx.open(e);
      },
      update: function() {
          console.log('update');
      },
      input: function(el) {
          this.isChanged = true;
          el.target.focus();
      },
      discard: function(el) {
          this.$refs.blockContent.innerHTML = this.block.content;
          this.isChanged = false;
          this.$refs.blockContent.focus();
      },
      assembleBlock: function(el) {
          this.block.content = this.$refs.blockContent.innerHTML;
          this.block.classes = [this.block.classes];
          this.putBlock(this.block);
          this.isChanged = false;
      },
      audPlay: function(block_id, ev) {
          this.audCleanClasses(block_id, ev);
          this.player.playBlock(block_id);
      },
      audPause: function(block_id, ev) {
          this.player.pause();
      },
      audResume: function(block_id, ev) {
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
      }
  },
  watch: {
      'block._rev' (newVal){
          console.log('block._rev', newVal);
          this.isUpdated = true;
          setTimeout(() => {
              this.isUpdated = false;
          }, 2000);
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
</style>
