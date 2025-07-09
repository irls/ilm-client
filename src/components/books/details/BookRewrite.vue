<template>
<div class="rewrite-book-wrapper" v-if="editModeAllowed">
  <div class="rewrite-book-header">
    <p>Create adapted book version</p>
  </div><!--<div class="rewrite-book-header">-->

  <div class="rewrite-book-range">
    <template v-if="calculate_apply">
      <div class="process-preloader"></div>
    </template>
    <template v-else>
      <p>{{ applyRewriteDataCount }} text block(s) in range
      <a v-on:click="goToBlock(selectedRange.start.id)" class="go-to-block">{{ selectedRange.start.id_short }}</a>&nbsp;-&nbsp;
      <a v-on:click="goToBlock(selectedRange.end.id)" class="go-to-block">{{ selectedRange.end.id_short }}</a></p>
    </template>
  </div><!--<div class="rewrite-book-range">-->

  <div class="rewrite-book-controls">
    <p>
      <template v-if="editModeAllowed">
        <button class="btn btn-primary"
          :disabled="applyRewriteDataCount == 0"
          v-on:click="startApplyAdaptation()">
          Adapt
        </button>
      </template>

      <template v-if="editModeAllowed">
        <button class="btn btn-primary"
          :disabled="applyRewriteDataCount == 0"
          v-on:click="startApplyTranslation()">
          Translate
        </button>
      </template>

      <button class="btn btn-primary"
        :disabled="applyRewriteDataCount == 0"
        v-on:click="revertBlock()">
        Revert
      </button>
    </p>
  </div><!--<div class="rewrite-book-controls">-->

  <div class="rewrite-book-settings">
    <div class="rewrite-book-selectors">
      <p>Use</p>

        <div v-if="false">
          <label></label>
        </div>
        <div>
          <label>
            <input type="checkbox" name="rewriteBook.title" v-model="rewriteBook.title" /><span></span>Title
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" name="rewriteBook.author"  v-model="rewriteBook.author" /><span></span>Author
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" name="rewriteBook.three_before"  v-model="rewriteBook.three_before" /><span></span>{{3}} Blocks before
          </label>
        </div>

    </div><!--<div class="rewrite-book-selectors">-->

    <div class="rewrite-book-do-settings">
      <p>Do</p>

        <div v-if="false">
          <label></label>
        </div>
        <div class="input-text-wrapper">
          <input type="text" v-model="rewriteBook.prompt_do" name="rewriteBook.prompt_do"
          :placeholder="promptDoPlaceholder"/>
        </div>

    </div><!--<div class="rewrite-book-do-settings">-->

    <div class="rewrite-book-dont-settings">
      <p>Don`t</p>

        <div v-if="false">
          <label></label>
        </div>
        <div class="input-text-wrapper">
          <input type="text" v-model="rewriteBook.prompt_dont" name="rewriteBook.prompt_dont"
          placeholder="Do not retell it, do not make it shorter"/>
        </div>

    </div><!--<div class="rewrite-book-do-settings">-->

  </div><!--<div class="rewrite-book-settings">-->

</div><!--<div class="rewrite-book-wrapper">-->
</template>
<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from 'vuex';
  // import lodash from "lodash";
  // import DropdownILM from "../../generic/components/DropdownILM";
  // import v_modal from 'vue-js-modal';

  // Vue.use(v_modal, {dialog: true});

  export default {
    data() {
      return {
        calculate_apply: false,
        rewriteBook : {
          title: false,
          author: false,
          three_before: false,
          prompt_do: '',
          prompt_do: ''
        },
        allowedBlockTypes: [
          'title',
          'header',
          'par'
        ],
        allowedBlockVoicework: 'no_audio',
      }
    },
    props: {
      allowMetadataEdit: {
        type: Boolean,
        default: false
      },
    },
    components: {
      // DropdownILM
    },
    computed: {

      promptDoPlaceholder: {
        get() {
          return true ? 'Simplify the text to A2 level': 'Translate the text';
        }
      },

      editModeAllowed: {
        get() {
          return this.adminOrLibrarian || this._is('editor', true) || this._is('narrator', true);
        },
        cache: false
      },

      selectedRange: {
        get() {
          let range = {start: {id_short: ''}, end: {id_short: ''}};
          if (!this.blockSelection || !this.blockSelection.start || !this.blockSelection.start._id) {
            if (this.storeList.size > 0) {
              let entries = Array.from(this.storeList);
              range = {
                start: {id: entries[0][0]},
                end: {id: entries[entries.length - 1][0]}
              }
              range.start.id_short = this.shortId(range.start.id);
              range.end.id_short = this.shortId(range.end.id);
            }
          } else {
            range = {
              start: {id: this.blockSelection.start._id, id_short: this.blockSelection.start._id_short},
              end: {id: this.blockSelection.end._id, id_short: this.blockSelection.end._id_short}
            };
          }
          return range;
        },
        cache: false
      },
      applyRewriteDataCount: {
        get() {
          let counter = 0;

          const startId = this.blockSelection.start._id;
          const endId = this.blockSelection.end._id;

          if (this.storeListO.getBlock(startId)) {
            const idsArrayRange = this.storeListO.ridsArrayRange(startId, endId);
            for (const blockRid of idsArrayRange) {
              const oBlock = this.storeListO.get(blockRid);
              if (oBlock) {
                const pBlock = this.storeList.get(oBlock.blockid);
                const isAllowedBlockType = this.allowedBlockTypes.indexOf(pBlock.type) > -1
                const allowedBlockVoicework = this.allowedBlockVoicework == pBlock.voicework;
                const isBlockHasAudio = pBlock.audiosrc && pBlock.audiosrc.trim() !== '';
                if (isAllowedBlockType && allowedBlockVoicework && !isBlockHasAudio) {
                  counter++;
                }
              }
            }
          }

          return counter;
        },
        cache: false
      },
      ...mapGetters([
        'currentBookMeta',
        'currentCollection',
        'adminOrLibrarian',
        'blockSelection',
        'storeListO',
        'storeList'
      ]),
      //...mapGetters('booksModule', ["rewrite", "revert"])
    },
    created() {

    },
    methods: {
      ...mapActions('booksModule', ["rewrite", "revert"]),

      startApplyAdaptation() {
        const prompt = {
          title: this.rewriteBook.title,
          author: this.rewriteBook.author,
          three_before: this.rewriteBook.three_before
        };

        if (this.rewriteBook.prompt_do.trim().length) {
          prompt.prompt_do = this.rewriteBook.prompt_do;
        }

        if (this.rewriteBook.prompt_do.trim().length) {
          prompt.prompt_dont = this.rewriteBook.prompt_do;
        }

        this.rewrite(prompt);
      },
      startApplyTranslation() {
        const prompt = {
          title: this.rewriteBook.title,
          author: this.rewriteBook.author,
          three_before: this.rewriteBook.three_before
        };

        if (this.rewriteBook.prompt_do.trim().length) {
          prompt.prompt_do = this.rewriteBook.prompt_do;
        }

        if (this.rewriteBook.prompt_do.trim().length) {
          prompt.prompt_dont = this.rewriteBook.prompt_do;
        }

        this.rewrite(prompt);
      },
      revertBlock() {
        this.revert();
      },

      shortId(blockid) {
        const blockIdRgx = /.*(?:\-|\_){1}([a-zA-Z0-9]+)$/;
        let _id_short = blockIdRgx.exec(blockid);
        _id_short = (_id_short && _id_short.length == 2) ? _id_short[1] : blockid;
        if (_id_short.length > 7) {
          _id_short = _id_short.substr(0, 2) + '...' + _id_short.substr(_id_short.length - 2, 2);
        }
        return _id_short;
      },
      goToBlock(blockid) {
        this.$root.$emit('for-bookedit:scroll-to-block', blockid);
      }

    },
    'watch': {
      updated: {
        handler(val) {
        }
      },
    }
  }
</script>
<style lang="less" scoped>
.rewrite-book-wrapper {
  display: flex;
  flex-direction: column;
  padding: 10px 7px 5px 7px;
  position: sticky;
  top: 29px;
  background-color: white;
  div {
    display: inline-block;
    width: auto;
    padding: 2px 14px 2px 0px;
    label {
      font-size: 14px;
      font-weight: 400;
      position: relative;
    }
    input[type="checkbox"] {
      /*width: 18px;
      height: 18px;
      margin: 0px 5px 0px 0px;
      vertical-align: middle;*/
      width: 0px;
      height: 0px;
      visibility: hidden;
    }
    input[type="checkbox"] + span {
      display: inline-block;
      width: 19px;
      height: 19px;
      border: 1px solid #CCCCCC;
      border-radius: 2px;
      vertical-align: middle;
      margin: 0px 5px 0px 0px;
    }
    input[type="checkbox"]:checked + span {
      background-color: #337AB7;
      &:after {
        content: '';
        position: absolute;
        width: 11px;
        height: 6px;
        background: transparent;
        top: 6px;
        left: 4px;
        border: 2px solid white;
        border-top: none;
        border-right: none;
        transform: rotate(-45deg);
      }
    }

    &.rewrite-book-header {
      p {
        margin: 20px 0 20px 0;
      }
    }

    &.rewrite-book-range {
      p {
        margin: 0 0 25px 0;
      }
    }

    &.rewrite-book-controls {
      p {
        margin: 0 0 20px 0;
      }
    }

    &.rewrite-book-selectors {
      label {
        span {
          margin-right: 15px;
          margin-top: -4px;
        }
      }
    }

    &.rewrite-book-settings {
      display: flex;
      flex-direction: column;
    }

    &.input-text-wrapper {
      display: flex;
      width: 100%;

      input[type="text"] {
        width: 100%;
        height: 34px;
        border: 1px solid #D9D9D9;
        border-radius: 5px;
        padding: 0px 8px;
      }
    }
  }
}
</style>
