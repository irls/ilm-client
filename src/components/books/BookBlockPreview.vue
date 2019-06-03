<template>
<div ref="viewBlock" class="block-preview">
  <div v-if="block && (block.type != 'par' || (loaded === true || blockO.loaded === true))"
    :class="['table-body -block', blockOutPaddings]">

    <div :class="['table-cell', 'controls-left']">
      <div class="table-row"></div>
      <div class="table-row check-row"></div>
    </div>
    <!--<div :class="['table-cell', 'controls-left']">-->
    <div :class="['table-cell', {'completed': isCompleted}]">
      <div :class="['table-body', '-content']">
        <div class="table-row-flex controls-top"></div>
        <!--<div class="table-row-flex controls-top">-->
        <template v-for="(blockPart, blockPartIdx) in blockParts">
          <BookBlockPartPreview
            :blockRid = "blockRid"
            :blockId = "blockId"
            :blockO = "blockO"
            :block = "block"
            :blockPart="blockPart"
            :blockPartIdx="blockPartIdx"
            :id="'v-' + blockId + '-' + blockPartIdx"
            ></BookBlockPartPreview>
        </template>
        <!--<div :class="['table-row ilm-block']">-->

        <div class="table-row content-footnotes"
          v-if="block.footnotes.length > 0 && mode !== 'narrate'">
          <div class="table-body footnote"
            v-for="(footnote, ftnIdx) in block.footnotes">

            <div :class="['table-row controls-top', {'completed': isCompleted}]">
            </div>

            <div class="table-row">
              <div class="table-cell -num">{{ftnIdx+1}}.</div>
              <div
                :class="['content-wrap-footn-preview table-cell -text', {'js-hidden': blockO.loaded !== true}]"
                v-html="footnote.content">
              </div>
              <div class="table-cell -control"></div>
            </div>
            <!--<div class="table-row">-->

          </div>
          <!--<div class="table-body footnote"-->
        </div>
        <!--<div class="table-row content-footnotes"-->

        <div class="table-row controls-bottom">
          <div class="-left">
            <span>
              <i :class="['glyphicon']"></i>
            </span>
          </div>
        </div>

      </div>
      <!--<div :class="['table-body', '-content']">-->
    </div>
    <!--<div :class="['table-cell']">-->
    <div class="table-cell controls-right"></div>

  </div>
  <!--<div v-if="loaded === true || blockO.loaded === true"-->
  <div v-else :class="['in-loading']">
    <!--{{blockId}}/{{blockRid}}/{{blockO.loaded}}-->
  </div>
</div>
</template>

<script>
import taskControls       from '../../mixins/task_controls.js';
import apiConfig          from '../../mixins/api_config.js';
import access             from '../../mixins/access.js';
import BookBlockPartPreview from './BookBlockPartPreview';

  export default {
    name: 'book-block-preview',
    props: [
      'blockRid', 'blockO', 'block', 'mode'
    ],// loaded property is necessary for updating first part of loaded blocks, VueJS is not updating automatically
    data() {
      return {
        loaded: false
      }
    },
    mixins: [access, taskControls, apiConfig],
    components: {
      BookBlockPartPreview: BookBlockPartPreview
    },
    computed: {
      /*...mapGetters({
        meta: 'currentBookMeta',
        parlist: 'storeList',
        parlistO: 'storeListO'
      }),*/
      blockId: function() {
        return this.blockO.blockid;
      },
      blockOutPaddings: function () {
        if (this.block) {
          return (this.block.classes && this.block.classes.hasOwnProperty('outsize-padding')) ? this.block.classes['outsize-padding'] : ''
        } else return '';
      },
      parnum: { cache: true,
        get: function () {
          if (this.blockO.type == 'header' && this.blockO.isNumber && !this.blockO.isHidden) {
            return this.blockO.secnum;
          }
          else if (this.blockO.type == 'par' && this.blockO.isNumber && !this.blockO.isHidden) {
            return this.blockO.parnum;
          }
          else return false;
        }
      },
      getClass: { cache: true,
        get: function () {
          return this.block.getClass();
        }
      },
      getIllustration: { cache: true,
        get: function () {
          return this.block.getIllustration();
        }
      },
      allowEditing: { cache: false,
        get() {
          return this.block && this.tc_isShowEdit(this.block._id) && this.mode === 'edit';
        }
      },
      blockParts: {
        get() {
          if (this.block.parts && this.block.parts.length > 0) {
            return this.block.parts;
          } else {
            return [
              {
                content: this.block.content,
                audiosrc: this.block.audiosrc,
                audiosrc_ver: this.block.audiosrc_ver
              }
            ];
          }
        },
        cache: false
      },
      isCompleted: { cache: false,
        get() {
          return this.block ? this.tc_isCompleted(this.block) : true;
        }
      },
      isIllustrationChanged: { cache: true,
        get() {
          return this.block.isIllustrationChanged;
        }
      },
      isChanged: {
        get() {
          return false;
        }
      },
    },
    methods: {

    }
  }
</script>
