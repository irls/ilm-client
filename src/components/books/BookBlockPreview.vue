<template>
<div ref="viewBlock" class="block-preview">
  <div :class="['table-body -block', blockOutPaddings]">

    <div :class="['table-cell', 'controls-left']">
      <div class="table-row"></div>
      <div class="table-row check-row"></div>
    </div>
    <!--<div :class="['table-cell', 'controls-left']">-->

    <div :class="['table-cell', {'completed': isCompleted}]">
      <div :class="['table-body', '-content']">
        <div class="table-row-flex controls-top"></div>
        <!--<div class="table-row-flex controls-top">-->
        <div :class="['table-row ilm-block']">

        <hr v-if="block.type=='hr'"
          :class="[getClass]"/>

        <div v-else-if="block.type == 'illustration'"
        :class="['table-body illustration-block']">
          <img v-if="block.illustration" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          :height="block.illustration_height"
          :class="[getClass]"/>
          <div :class="['table-row drag-uploader', 'no-picture', {'__hidden': isChanged && !isIllustrationChanged}]" v-if="allowEditing">
            <div class="preview-container"></div>
          </div>

          <div :class="['table-row content-description', getClass]">
            <div class="content-wrap-desc description"
              v-html="block.description">
            </div>
          </div>

        </div>
        <!--<img v-if="block.illustration"-->

        <div v-else v-cloak class="content-wrap-preview"
        v-html="blockContent"
        :class="[getClass]">
        </div>
        <!--<div class="content-wrap">-->

        </div>
        <!--<div :class="['table-row ilm-block']">-->

        <div class="table-row content-footnotes"
          v-if="block.footnotes.length > 0 && mode !== 'narrate'">
          <div class="table-body footnote"
            v-for="(footnote, ftnIdx) in block.footnotes">

            <div :class="['table-row controls-top', {'completed': isCompleted}]">
            </div>

            <div class="table-row">
              <div class="table-cell -num">{{ftnIdx+1}}.</div>
              <div class="content-wrap-footn-preview table-cell -text"
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
</div>
</template>

<script>
import taskControls       from '../../mixins/task_controls.js';
import apiConfig          from '../../mixins/api_config.js';
import access             from '../../mixins/access.js';

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
      blockContent: { cache: false,
        get() {
          //console.log('blockContent', this.block._id);
          if (this.mode === 'narrate') {
            let content = '';
            let split = '<br class="narrate-split"/><br class="narrate-split"/>';
            if ($('<div>' + this.block.content + '</div>').find('w').length > 0) {
              let rg = new RegExp('(<[^>]+>[^<]*?)((?<!St|Mr|Mrs|Dr|[^\\w][\\w]{1})[\\.|\\?|\\!]+[\'\"\‘\”\“\’]*)([^<]*?<\\/[^>]+>.+?)', 'gmi')
              content = this.block.content.replace(rg, '$1$2' + split + '$3')
            } else {
              content = this.block.content + '<span class="content-tail"></span>';
              let rg = new RegExp('((?<!St|Mr|Mrs|Dr|[^\\w][\\w]{1})[\\.\\?\\!]+[\'\"\‘\”\“\’]*)([^\\.\\?\\!\'\"\‘\”\“\’]+)', 'mig');
              content = content.replace(/<a[^>]*>((?!<\/a>).*)<\/a>/igm, '$1')
              content = content.replace(rg, '$1' + split + '$2');
            }
            return content;
          } else {
            return this.block.content;
          }
        }
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

<style lang='less'>
.block-preview {
  .in-loading {
    height: 150px;
    background: url(/static/preloader-snake-small.gif);
    width: 100%;
    /*margin: 0 auto;*/
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

  .content-wrap-desc.description {
    min-height: 30px;
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
    &.completed {
      height: 20px;
    }
  }

  /*.ilm-book-styles.global-ocean*/
  .ilm-block {
    .content-wrap-preview {
      &.header {
        margin: 4px;
      }
      &.title {
        margin-top: 6px;
      }
    }
  }

  .content-wrap-footn-preview {
    p {
      margin: 0;
    }
  }

  .table-body.footnote {
    .content-wrap-footn-preview.-text {
      padding-right: 150px;
    }
  }
}
</style>
