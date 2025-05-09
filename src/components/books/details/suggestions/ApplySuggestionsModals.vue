<template>
  <div class="apply-suggestions-modal" @click="onModalClick" v-if="!isLoadingCounters">
    <div class="modal-header">
      <div>
        <h4 class="modal-title">{{modalTitle}}</h4>
      </div>
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="onClose">
        <i class="close-modal" aria-hidden="true"></i>
      </button>
    </div>
    <div class="modal-body">
      <div>
        <span v-html="suggestionTitle"></span>
      </div>
      <div class="apply-suggestions-radio-button-wrapper">
        <div class="apply-suggestions-radio-button">
          <RadioButton v-model="updateAction" id="apSugg1" name="apSugg" value="current" />
          <label for="apSugg1">current selection</label>
        </div>
        <div class="apply-suggestions-radio-button"
             v-show="matchFirstWordBlocksCounter > 0">
          <RadioButton v-model="updateAction" id="apSugg2" name="apSugg" value="allFirst" />
          <label for="apSugg2">all matching blocks, first word(s) only ({{matchFirstWordBlocksCounter}})</label>
        </div>
        <div class="apply-suggestions-radio-button">
          <RadioButton v-model="updateAction" id="apSugg3" name="apSugg" value="all" />
          <label for="apSugg3">all matching blocks ({{matchBlocksCounter}})</label>
        </div>
      </div>
      <div class="apply-suggestions-checkbox-wrapper">
        <Checkbox v-model="isDoNotDisturb" id="showSett" binary />
        <label for="showSett"> Don't show this message again </label>
      </div>
    </div>
    <div class="modal-footer apply-suggestions-button-wrapper">
      <button class="btn btn-default apply-suggestions-button" @click="onClose">Cancel</button>
      <button class="btn btn-primary apply-suggestions-button" @click="onApplySuggestion">{{suggestionButtonTitle}}</button>
    </div>
  </div>
</template>

<script>

import Vue from 'vue';
import v_modal from 'vue-js-modal';
import RadioButton from 'primevue/radiobutton';
import Checkbox from 'primevue/checkbox';
import api_config from '../../../../mixins/api_config.js';
import access from '../../../../mixins/access.js';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import { BookBlock }     from '../../../../store/bookBlock.js'
Vue.use(v_modal, { dialog: true, dynamic: true });

export default {
  data() {
    return {
      isDoNotDisturb: false,
      updateAction: 'current',
      matchBlocksCounter: 0,
      matchFirstWordBlocksCounter: 0,
      isLoadingCounters: false
    }
  },
  components: {
    Vue, RadioButton, Checkbox
  },
  mixins: [api_config, access],
  props: {
    'suggestion': {
      type: Object,
      default: {}
    },
    'userChoiceSelected': {
      type: Function,
      default: ()=>Promise.resolve({})
    },
    'currentBlockId': {
      type: String,
      default: ''
    },
    'sourceBlock': {
      type: Object,
      default: {}
    }
  },
  beforeMount: function() {
    this.isLoadingCounters = true;
    let isEdited = this.modifiedBlockids.indexOf(this.currentBlockId) > -1;
    if (isEdited || this.sourceBlock.hasAudio) {
      const closeCallback = ()=>{
        this.userChoiceSelected({
          isApply: true,
          action: this.suggestion.action,
          updateAction: this.updateAction,
          // do not apply suggestion changes if block was edited
          isEdited: isEdited,
          applyLocally: this.sourceBlock.hasAudio || isEdited
        });
        this.onClose();
      }
      Vue.nextTick(() => {
        closeCallback();
      });
      this.isLoadingCounters = false;
      //return;
    } else {
    this.getCounters()
      .then(() => {
        if (this.suggestion.hideIfSingle && this.matchBlocksCounter <= 1 && ["add", "delete"].includes(this.suggestion.action)) {
          const closeCallback = ()=>{
            this.userChoiceSelected({
              isApply: true,
              action: this.suggestion.action,
              updateAction: this.updateAction,
              // do not apply suggestion changes if block was edited
              isEdited: isEdited
            });
            this.onClose();
          }
          if (!isEdited) {
            const requestParams = {
              start_id: this.sourceBlock.blockid,
              end_id: this.sourceBlock.blockid,
              exclude_ids: [],
              text: this.suggestion.text,
              suggestion: this.suggestion.suggestion,
              method: this.suggestion.action === "add" ? 'POST' : 'DELETE',
              first_word: false
            }
            this.postApplySuggestionsFromBlock(requestParams)
                    //.then(()=>{
                      //closeCallback()
                    //})
          }
          closeCallback();
        }
        this.isLoadingCounters = false;
      });
    }
  },
  mounted: function () {
    //this.getCounters();
    this.isDoNotDisturb = this.getIsDoNotDisturb;
    let suggestionElement = document.getElementById("apSugg1");
    if (suggestionElement) {
      suggestionElement.focus();
    }
  },
  computed: {
    modalTitle: {
      get() {
        switch(this.suggestion.action) {
          case 'add' : {
            return 'Add suggestion';
          } break;
          case 'edit' : {
            return 'Update suggestion'
          } break;
          case 'delete' : {
            return 'Delete suggestion'
          } break;
          default : {
            return 'Add suggestion';
          } break;
        };
      },
      cache: true
    },
    suggestionTitle: {
      get() {

        const suggLen = this.suggestion.suggestion.trim().length;
        let title = '';

        switch(this.suggestion.action) {
          case 'add' : {
            title = 'Add' + (suggLen > 0 ? ' suggestion' : ' empty suggestion');
            title += suggLen > 0 ? ` <i>"${this.suggestion.suggestion}"</i> for` : ' for';
            title += ` <b>"${this.suggestion.text}"</b> to:`
          } break;
          case 'edit' : {
            title = 'Update' + (suggLen > 0 ? ' suggestion' : ' empty suggestion');
            title += suggLen > 0 ? ` <i>"${this.suggestion.suggestion}"</i> for` : ' for';
            title += ` <b>"${this.suggestion.text}"</b> in:`
          } break;
          case 'delete' : {
            title = 'Delete suggestion';
            title += suggLen > 0 ? ` <i>"${this.suggestion.suggestion}"</i> for` : ' for';
            title += ` <b>"${this.suggestion.text}"</b> from:`
          } break;
          default : {
          } break;
        };

        return title;
      },
      cache: true
    },
    suggestionButtonTitle: {
      get() {

        const suggLen = this.suggestion.suggestion.trim().length;
        let title = '';

        switch(this.suggestion.action) {
          case 'add' : {
            title = 'Add Suggestion';
          } break;
          case 'edit' : {
            title = 'Update Suggestion';
          } break;
          case 'delete' : {
            title = 'Delete Suggestion';
          } break;
          default : {
          } break;
        };
        return title;
      },
      cache: true
    },
    ...mapGetters({
      parlistO: 'storeListO',
      modifiedBlockids: 'modifiedBlockids'
    }),
    ...mapGetters('suggestionsModule', [
      'suggestions',
      'getIsDoNotDisturb',
      'getLastAction'
    ]),
  },
  methods: {
    onClose: function() {
      this.userChoiceSelected({
        isApply: false,
        action: this.suggestion.action,
        updateAction: this.updateAction
      });

      this.$emit('close');
    },
    onApplySuggestion: function() {

      const start_id = this.parlistO.idsArray()[0];
      const end_id = this.parlistO.idsArray()[this.parlistO.idsArray().length - 1];
      const exclude_ids = [];
      //const exclude_ids = this.currentBlockId.length ? [this.currentBlockId] : [];

      const closeCallback = ()=>{
        this.userChoiceSelected({
          isApply: true,
          action: this.suggestion.action,
          updateAction: this.updateAction,
          // do not apply suggestion changes if block was edited
          isEdited: this.modifiedBlockids.indexOf(this.currentBlockId) > -1
        });
        this.$emit('close');
      }

      const requestParams = {
        start_id,
        end_id,
        exclude_ids,
        text: this.suggestion.text,
        suggestion: this.suggestion.suggestion
      }

      switch(this.suggestion.action) {
        case 'add' : {
          requestParams.method = 'POST';
          switch(this.updateAction) {
            case 'allFirst' : {
              requestParams.first_word = true;
              this.postApplySuggestionsFromBlock(requestParams)
              .then(()=>{
                closeCallback()
              })
            } break;
            case 'all' : {
              requestParams.first_word = false;
              this.postApplySuggestionsFromBlock(requestParams)
              .then(()=>{
                closeCallback()
              })
            } break;
            case 'current': {
              requestParams.start_id = this.sourceBlock.blockid;
              requestParams.end_id = this.sourceBlock.blockid;
              requestParams.first_word = false;
              this.postApplySuggestionsFromBlock(requestParams)
              .then(()=>{
                closeCallback()
              })
            } break;
            default : {
              closeCallback()
            } break;
          };
        } break;
        case 'edit' : {
          requestParams.method = 'PUT';
          switch(this.updateAction) {
            case 'allFirst' : {
              requestParams.first_word = true;
              this.postApplySuggestionsFromBlock(requestParams)
              .then(()=>{
                closeCallback()
              })
            } break;
            case 'all' : {
              requestParams.first_word = false;
              this.postApplySuggestionsFromBlock(requestParams)
              .then(()=>{
                closeCallback()
              })
            } break;
            default : {
              closeCallback()
            } break;
          };
        } break;
        case 'delete' : {
          requestParams.method = 'DELETE';
          switch(this.updateAction) {
            case 'allFirst' : {
              requestParams.first_word = true;
              this.postApplySuggestionsFromBlock(requestParams)
              .then(()=>{
                closeCallback()
              })
            } break;
            case 'current': {
              requestParams.start_id = this.sourceBlock.blockid;
              requestParams.end_id = this.sourceBlock.blockid;
              requestParams.first_word = false;
              this.postApplySuggestionsFromBlock(requestParams)
              .then(()=>{
                closeCallback()
              });
            } break;
            case 'all' : {
              requestParams.first_word = false;
              this.postApplySuggestionsFromBlock(requestParams)
              .then(()=>{
                closeCallback()
              })
            } break;
            default : {
              closeCallback()
            } break;
          }
        }
      };

    },
    onModalClick: function(event) {
      // event.preventDefault();
      // event.stopPropagation();
      return false;
    },
    getCounters() {
      const start_id = this.parlistO.idsArray()[0];
      const end_id = this.parlistO.idsArray()[this.parlistO.idsArray().length - 1];
      const exclude_ids = [];
      const isAddNew = this.suggestion.action === 'add';
      //const exclude_ids = this.currentBlockId.length ? [this.currentBlockId] : [];

      console.log(`${__filename.substr(-30)}:this.suggestion.action:: `, this.suggestion.action);

      return this.countApplicableSuggestions({
        start_id,
        end_id,
        exclude_ids,
        text: this.suggestion.text,
        suggestion: this.suggestion.suggestion,
        isAddNew,
        sourceBlock: this.sourceBlock
      })
      .then((fullBlockCounters)=>{
        console.log(`fullBlockCounters::: `, fullBlockCounters);
        this.matchBlocksCounter = fullBlockCounters.blocks;
        this.matchFirstWordBlocksCounter = fullBlockCounters.firstWordBlocks;
        if (this.isDoNotDisturb) {
          this.updateAction = this.getLastAction;
        }
        return {};
      })
      .catch((err)=>{
        console.error(err.message || err);
        return {};
      });
    },
    ...mapActions('suggestionsModule', [
      'canApplySuggestions',
      'countApplicableSuggestions',
      'postApplySuggestionsFromBlock'
    ]),
    ...mapMutations('suggestionsModule', [
      'setDoNotDisturb',
      'setLastAction'
    ]),
  },
  watch: {
    isDoNotDisturb: {
      handler(newVal, oldVal) {
        this.setDoNotDisturb(newVal);
      }
    },
    updateAction: {
      handler(newVal, oldVal) {
        this.setLastAction(newVal);
      }
    }
  }
}
</script>

<style scoped lang="less">
  .apply-suggestions-modal {
    [class^="col-sm-"] {
      padding: 4px 4px 4px 0px;
    }
    .modal-header {
      padding: 10px 10px 10px 28px;
      border-bottom: none;

      h4 {
        font-size: 16px;
        font-weight: 700;
      }
      button.close {
        margin-top: -25px;
      }
      button.close i.close-modal {
        font-size: 18px;
        padding-right: .5em;
        &:before {
          content: "\00d7";
        }
      }
    }
    .modal-body {
      padding: 0px 30px;

      .apply-suggestions-radio-button-wrapper {
        display: flex;
        flex-flow: column;
        margin: 15px 0px;

        label {
          margin-bottom: 0px;
          font-weight: normal;
          cursor: pointer;
          margin-left: 10px;
        }

        .apply-suggestions-radio-button {
          margin: 7px 0px;
        }
      }

      .apply-suggestions-checkbox-wrapper {
        label {
          margin-bottom: 0px;
          margin-left: 10px;
          font-weight: normal;
          cursor: pointer;
        }
      }
    }
    .modal-footer {
      border-top: none;

      &.apply-suggestions-button-wrapper {
        display: flex;
        flex-flow: row nowrap;
        height: 46px;
        margin: 20px 0px 0px 0px;
        padding: 0px;

        .apply-suggestions-button {
          height: 100%;
          width: 50%;
          margin: 0px;
        }
      }
      .btn {
        margin: 0px 7px;
      }
    }
  }
</style>
