<template>
<div class="rewrite-book-wrapper" v-if="editModeAllowed">
  <div class="rewrite-book-header">
    <p>{{tabPlaceholder}}</p>
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
      <template v-if="editModeAllowed && !isBookTranslated">
        <button class="btn btn-primary"
          :disabled="applyRewriteDataCount == 0"
          v-on:click="startApplyAdaptation()">
          Adapt <span v-if="applyRewriteDataCount > 0">({{ applyRewriteDataCount }})</span>
        </button>
      </template>

      <template v-if="editModeAllowed && isBookTranslated">
        <button class="btn btn-primary"
          :disabled="applyRewriteDataCount == 0"
          v-on:click="startApplyTranslation()">
          Translate <span v-if="applyRewriteDataCount > 0">({{ applyRewriteDataCount }})</span>
        </button>
      </template>

      <button class="btn btn-primary"
        :disabled="applyRevertDataCount == 0"
        v-on:click="revertBlock()">
        Revert <span v-if="applyRevertDataCount > 0">({{ applyRevertDataCount }})</span>
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
        <div style="display: none;">
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
  import access from "../../../mixins/access";

  export default {
    data() {
      return {
        calculate_apply: false,
        rewriteBook : {
          title: true,
          author: true,
          three_before: false,
          prompt_do: '',
          prompt_dont: ''
        },
        applyRewriteDataCount: 0,
        applyRevertDataCount: 0
      }
    },
    props: {
      allowMetadataEdit: {
        type: Boolean,
        default: false
      },
    },
    components: {
      
    },
    mixins: [ access ],
    computed: {

      tabPlaceholder: {
        get() {
          return this.isBookTranslated ? 'Create translated book version' : 'Create adapted book version';
        }
      },

      promptDoPlaceholder: {
        get() {
          return this.isBookTranslated ? 'Translate the text' : 'Simplify the text to A2 level';
        }
      },

      editModeAllowed: {
        get() {
          return this.adminOrLibrarian || this._is('editor', true) || this._is('narrator', true);
        },
        cache: false
      },

      isBookTranslated: {
        get() {
          if (this.currentBookMeta && this.currentBookMeta.copy_type) {
            switch(this.currentBookMeta.copy_type) {
                case 'adapted' : {
                  return false;
                } break;
                case 'translated' : {
                  return true;
                } break;
                default : {
                  return false;
                } break;
            };
          }
          return this.currentBookMeta.parent_book && this.currentBookMeta.parent_language !== this.currentBookMeta.language;
        },
        cache: true
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
      ...mapGetters([
        'currentBookMeta',
        'currentCollection',
        'adminOrLibrarian',
        'blockSelection',
        'storeListO',
        'storeList',
        'lockedBlocks',
        'aligningBlocks',
        'allowedAdaptedBlockTypes'
      ]),
      //...mapGetters('booksModule', ["rewrite", "revert"])
    },
    created() {

    },
    mounted() {
      this.calculateCounters();
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

        if (this.rewriteBook.prompt_dont.trim().length) {
          prompt.prompt_dont = this.rewriteBook.prompt_dont;
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

        if (this.rewriteBook.prompt_dont.trim().length) {
          prompt.prompt_dont = this.rewriteBook.prompt_dont;
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
      },
      calculateCounters() {
        let counterAdapt = 0;
        let counterRevert = 0;
        let idsArrayRange = [];

        if (this.blockSelection.start._id) {
          const startId = this.blockSelection.start._id;
          const endId = this.blockSelection.end._id;

          if (this.storeListO.getBlock(startId)) {
            idsArrayRange = this.storeListO.ridsArrayRange(startId, endId);
          }
        } else {
          idsArrayRange = this.storeListO.rIdsArray();
        }
        for (const blockRid of idsArrayRange) {
          const oBlock = this.storeListO.get(blockRid);
          if (oBlock) {
            const pBlock = this.storeList.get(oBlock.blockid);
            const isAllowedBlockType = this.allowedAdaptedBlockTypes.indexOf(pBlock.type) > -1
            const isBlockHasAudio = pBlock.audiosrc && pBlock.audiosrc.trim() !== '';
            if (isAllowedBlockType && !isBlockHasAudio) {
              counterAdapt++;
            }
            const isBlockAdapted = pBlock.adapted && pBlock.data_original && pBlock.data_original.content;
            if (isBlockAdapted) {
              counterRevert++;
            }
          }
        }

        this.applyRewriteDataCount = counterAdapt;
        this.applyRevertDataCount = counterRevert;
      },

    },
    'watch': {
      updated: {
        handler(val) {
        }
      },
      'lockedBlocks.length': {
        handler(val, oldVal) {
          if (val < oldVal) {
            this.calculateCounters();
          }
        }
      },
      'aligningBlocks.length': {
        handler(val, oldVal) {
          if (val < oldVal) {
            this.calculateCounters();
          }
        }
      },
      'storeList.size': {
        handler(val) {
          this.calculateCounters();
        }
      },
      'blockSelection.start._id': {
        handler(val) {
          this.calculateCounters();
        }
      },
      'blockSelection.end._id': {
        handler(val) {
          this.calculateCounters();
        }
      }
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
