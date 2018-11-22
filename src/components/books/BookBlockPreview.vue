<template>
<section>
  <div v-if="loaded === true || blockO.loaded === true"
    ref="viewBlock" :data-id="blockId" :data-rid="blockRid" :id="blockId"
    :class="['table-body -block', blockOutPaddings, {'in-back': inBack === true }]"><!--{'in-back': parlistO.isInViewArray(blockRid)}-->

    <div :class="['table-cell', 'controls-left']">
      <div class="table-row" v-if="meta.numeration !== 'none'"></div>
      <div class="table-row check-row"></div>
    </div>
    <!--<div :class="['table-cell', 'controls-left']">-->
    <div :class="['table-cell']">
      <div :class="['table-body', '-content']">
        <div class="table-row-flex controls-top"></div>
        <!--<div class="table-row-flex controls-top">-->
        <div :class="['table-row ilm-block']">

        <hr v-if="block.type=='hr'"
          :class="[block.getClass()]"/>

        <div v-else-if="block.type == 'illustration'"
        :class="['table-body illustration-block']">
          <img v-if="block.illustration" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          :height="block.illustration_height"
          :class="[block.getClass()]"/>
          <div :class="['table-row drag-uploader', 'no-picture', {'__hidden': isChanged && !isIllustrationChanged}]" v-if="allowEditing">
            <div class="preview-container"></div>
          </div>

          <div :class="['table-row content-description', block.getClass()]">
            <div class="content-wrap-desc description"
              v-html="block.description">
            </div>
          </div>

        </div>
        <!--<img v-if="block.illustration"-->

        <div v-else class="content-wrap-preview"
        v-html="mode === 'narrate' ? blockContent : block.content"
        :class="[ block.getClass()]">
        </div>
        <!--<div class="content-wrap">-->

        </div>
        <!--<div :class="['table-row ilm-block']">-->

        <div class="table-row content-footnotes"
          v-if="block.footnotes.length > 0 && mode !== 'narrate'">
          <div class="table-body footnote"
            v-for="(footnote, ftnIdx) in block.footnotes">

            <div class="table-row controls-top">
            </div>

            <div class="table-row">
              <div class="table-cell -num">{{ftnIdx+1}}.</div>
              <div class="content-wrap-footn table-cell -text"
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
  <div v-else ref="viewBlock" :data-id="blockId" :data-rid="blockRid" :id="blockId" :class="['ilm-block', 'ilm-display', 'in-loading']">
    <!--{{blockId}}/{{blockRid}}/{{blockO.loaded}}-->
  </div>

  <div class="clearfix"></div>
</section>
</template>

<script>
import Vue from 'vue'
import { BookBlock }    from '../../store/bookBlock'
import { mapGetters, mapState, mapActions } from 'vuex'

import taskControls       from '../../mixins/task_controls.js';
import apiConfig          from '../../mixins/api_config.js';
import access             from '../../mixins/access.js';

  export default {
    name: 'book-block-preview',
    props: [
      'blockRid', 'blockO', 'lang', 'loaded', 'mode'
    ],// loaded property is necessary for updating first part of loaded blocks, VueJS is not updating automatically
    data() {
      return {
        inBack: false
      }
    },
    mixins: [access, taskControls, apiConfig],
    computed: {
      ...mapGetters({
        meta: 'currentBookMeta',
        parlist: 'storeList'/*,
        parlistO: 'storeListO'*/
      }),
      blockId: function() {
        return this.blockO.blockid;
      },
      block: function() {
        //console.log('preview get block');
        return this.parlist.get(this.blockId)
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
      getClass: { cache: false,
        get: function () {
          return this.block.getClass();
        }
      },
      getIllustration: { cache: true,
        get: function () {
          return this.block.getIllustration();
        }
      },
      allowEditing: { cache: true,
        get() {
          return this.block && (this.tc_isShowEdit(this.block._id) || this.tc_hasTask('content_cleanup')) && this.mode === 'edit';
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

<style lang='less' scoped>
  .in-loading {
    height: 150px;
    background: url(/static/preloader-snake-small.gif);
    width: 100%;
    background-repeat: no-repeat;
    text-align: center;
    background-position: center;
  }

  .in-back {
    visibility: hidden;
    /*opacity: 0.5;*/
    /*border-bottom: 1px red solid;*/
  }

  .preview-container {
    height: 100px;
  }

  .table-row .illustration-block img {
    border: solid white 2px;
  }

  .content-wrap-preview {
    padding: 10px;
    margin: 9px auto 4px auto;
  }

  .table-row.controls-bottom {
    height: 24px;
  }

  .table-row.controls-top {
    height: 28px;
  }

  /*.ilm-book-styles.global-ocean*/
  .ilm-block {
    .content-wrap-preview.header {
      margin: 4px;
    }
  }

</style>
