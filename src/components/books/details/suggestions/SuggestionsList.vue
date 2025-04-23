<template>
  <div class="suggestions-list-options">
    <div class="suggestions-header">
      <div class="apply-suggestion">
        <template v-if="editModeAllowed">
          <button class="btn btn-primary" :disabled="applySuggestionData.total === 0" v-on:click="startApplySuggestions(true)">Apply</button>
          <template v-if="calculate_apply">
            <div class="process-preloader"></div>
          </template>
          <template v-else>
            {{ applySuggestionData.total }} matching block(s) in range
            <a v-on:click="goToBlock(selectedRange.start.id)" class="go-to-block">{{ selectedRange.start.id_short }}</a>&nbsp;-&nbsp;
            <a v-on:click="goToBlock(selectedRange.end.id)" class="go-to-block">{{ selectedRange.end.id_short }}</a>
          </template>
        </template>
        <template v-else>
          <button class="btn btn-primary" disabled>Apply</button>
        </template>
      </div>
      <div class="filter-suggestion">
        <div>
          <input type="text" v-model="filter" />
          <i v-if="filter.length > 0" class="ico ico-clear-filter btn-inside" v-on:click="clearFilter"></i>
        </div>
        <div>
          <button class="btn btn-primary" :disabled="!filter.trim().length" v-on:click="add" v-if="editModeAllowed">
            <i class="glyphicon glyphicon-remove-circle"></i>
          </button>
        </div>
      </div>
    </div>
    <div v-if="addSuggestionMode" class="add-suggestion">
      <EditSuggestion
        :suggestion="edit_suggestion"
        @save="createSuggestion"
        @cancel="cancelCreate" />
    </div>
    <div class="suggestions-list" v-if="filteredSuggestions.length > 0">
      <table>
        <template v-for="suggestion in filteredSuggestions">
          <tr>
            <td :title="suggestion.text">
              <button class="play-suggestion" v-if="suggestion.voice_example" v-on:click="playSuggestion(suggestion)"></button>
              {{ suggestion.text }}
            </td>
            <td :title="suggestion.suggestion">
              {{ suggestion.suggestion }}
              <div class="suggestion-options" v-if="editModeAllowed">
                <i class="fa fa-trash" v-on:click="remove(suggestion, true)"></i>
                <i class="fa fa-pencil" v-on:click="setEditSuggestion(suggestion)"></i>
              </div>
            </td>
          </tr>
          <tr v-if="isEditingSuggestion(suggestion.id)">
            <td colspan="2">
              <EditSuggestion
                :suggestion="getEditingSuggestion(suggestion)"
                @save="update"
                @cancel="cancelUpdate(suggestion)" />
            </td>
          </tr>
        </template>
      </table>
    </div>
  </div>
</template>
<script>

  import Vue from "vue";
  import { mapActions, mapGetters } from "vuex";
  import v_modal from "vue-js-modal";
  import lodash from "lodash";
  import { cleanFilter } from "../../../../filters/search";
  import EditSuggestion from "./EditSuggestion";
  import access from '../../../../mixins/access.js';

  Vue.use(v_modal, { dialog: true, dynamic: true });

  export default {
    data() {
      return {
        filter: '',
        addSuggestionMode: false,
        edit_suggestion: {
          text: '',
          suggestion: '',
          voice_id: null,
          voice_example: ''
        },
        added_suggestion_id: null,
        audio_element: null,
        audio_playing: null,
        editing_suggestions: {},
        applySuggestionData: {
          total: 0
        },
        calculate_apply: false
      }
    },
    props: ['suggestions', 'category', 'isActive', 'categoryName'],
    mixins: [access],
    components: {
      EditSuggestion
    },
    computed: {
      filteredSuggestions: {
        get() {
          if (!this.filter) {
            return this.suggestions;
          }
          let filter = cleanFilter(this.filter.toLowerCase().trim());
          return this.suggestions.filter(suggestion => {
            return cleanFilter(suggestion.text.toLowerCase()).indexOf(filter) !== -1 || cleanFilter(suggestion.suggestion.toLowerCase()).indexOf(filter) !== -1 || suggestion.id === this.added_suggestion_id || this.isEditingSuggestion(suggestion.id);
          });
        },
        cache: false
      },
      canAddSuggestion: {
        get() {
          return this.filter.length > 0;
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
      editModeAllowed: {
        get() {
          return this.adminOrLibrarian || this._is('editor', true) || this._is('narrator', true);
        },
        cache: false
      },
      ...mapGetters(['storeList', 'blockSelection', 'modifiedBlockids', 'adminOrLibrarian']),
      ...mapGetters('suggestionsModule', ['applySuggestions'])
    },
    mounted() {
      Vue.nextTick(() => {
        this.setContainerHeight();
      });
      window.addEventListener('resize', this.setContainerHeight);
    },
    destroyed() {
      //this.$root.$off('for-suggestions-list:add-suggestion', this.onAddEvent);
    },
    activated() {
      console.log('activated', this.category);
    },
    methods: {
      clearFilter() {
        this.filter = "";
      },
      add() {
        this.edit_suggestion.text = this.filter;
        this.edit_suggestion.category = this.category;
        this.addSuggestionMode = true;
      },
      onAddEvent(suggestionItem = {}) {
        this.edit_suggestion.text = suggestionItem.text;
        this.edit_suggestion.suggestion = suggestionItem.suggestion;
        this.filter = suggestionItem.text;
        this.addSuggestionMode = true;
      },
      setEditSuggestion(suggestion) {
        //this.addSuggestionMode = false;
        return this.getEditingSuggestion(suggestion);
      },
      createSuggestion() {
        let suggestionData = lodash.cloneDeep(this.edit_suggestion);
        if (this.category) {
          suggestionData.category = this.category;
        }
        return this.addSuggestion([suggestionData])
          .then((response) => {
            this.addSuggestionMode = false;
            this.added_suggestion_id = response.id;
            this.resetEditSuggestion();
            this.getApplySuggestions();
          });
      },
      remove(suggestion, check = true) {
        if (check) {
          this.$modal.show('dialog', {
            title: 'Delete suggestion',
            text: `Delete “${suggestion.text}“ suggestion?`,
            buttons: [
              {
                title: 'Delete',
                handler: () => {
                  this.$modal.hide('dialog');
                  this.remove(suggestion, false);
                },
                class: 'btn btn-primary'
              },
              {
                title: 'Cancel',
                handler: () => {
                  this.$modal.hide('dialog');
                },
                class: 'btn btn-default'
              }
            ]
          });
          return;
        }
        return this.removeSuggestion([suggestion.id])
          .then(() => {
            this.getAll();
            this.getApplySuggestions();
          });
      },
      cancelCreate() {
        this.addSuggestionMode = false;
        this.resetEditSuggestion();
      },
      resetEditSuggestion() {
        this.edit_suggestion.text = '';
        this.edit_suggestion.suggestion = '';
        this.edit_suggestion.voice_id = null;
        this.edit_suggestion.voice_example = '';
        this.edit_suggestion.category = null;
      },
      playSuggestion(suggestion) {
        if (suggestion.voice_example) {
          this.checkCreateAudioElement();
          this.audio_element.src = process.env.ILM_API + suggestion.voice_example;
          this.audio_element.play();
          return;
        }
      },
      checkCreateAudioElement() {
        if (!this.audio_element) {
          this.audio_element = document.createElement('audio');
          this.audio_element.addEventListener('ended', () => {
            this.clearPlayingAudio();
          });
          this.audio_element.addEventListener('pause', () => {
            this.clearPlayingAudio();
          });
          //this.audio_element.addEventListener('loadstart', () => {
            //this.clearPlayingAudio();
          //});
        }
      },
      clearPlayingAudio() {
        this.audio_playing = false;
      },
      update(suggestion) {
        return this.updateSuggestion([suggestion.id, suggestion])
          .then(() => {
            this.cancelUpdate(suggestion);
            this.getApplySuggestions();
            return {};
          });
      },
      cancelUpdate(suggestion) {
        delete this.editing_suggestions[suggestion.id];
        this.$forceUpdate();
      },
      copySuggestion(suggestion) {
        return lodash.cloneDeep(suggestion);
      },
      isEditingSuggestion(id) {
        return typeof this.editing_suggestions[id] !== "undefined";
      },
      getEditingSuggestion(suggestion) {
        if (!this.editing_suggestions[suggestion.id]) {
          this.editing_suggestions[suggestion.id] = this.copySuggestion(suggestion);
          this.$forceUpdate();
        }
        return this.editing_suggestions[suggestion.id];
      },
      getApplySuggestions() {
        if (this.isActive) {
          this.calculate_apply = true;
          this.applySuggestionData.total = 0;
          return this.canApplySuggestions({category: this.category})
            .then(response => {
              let suggestions = this.applySuggestions(this.category);
              this.applySuggestionData.total = suggestions.total;
              this.calculate_apply = false;
              return {};
            });
        }
        return Promise.resolve();
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
      startApplySuggestions(check = true) {
        if (check) {
          this.$modal.show('dialog', {
            title: 'Apply dictionary suggestions',
            text: `Would you like to apply ${this.categoryName} dictionary suggestions to ${this.applySuggestionData.total} matching blocks?<br>You'll need to review and, if necessary, adjust them.`,
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$modal.hide('dialog');
                },
                class: 'btn btn-default'
              },
              {
                title: 'Apply Suggestions',
                handler: () => {
                  this.$modal.hide('dialog');
                  this.startApplySuggestions(false);
                },
                class: 'btn btn-primary'
              }
            ]
          });
          return;
        }
        if (Object.keys(this.editing_suggestions).length > 0) {
          this.$modal.show('dialog', {
            title: 'Unsaved changes',
            text: `You have unsaved ${this.categoryName} dictionary changes. Save and apply suggestions?`,
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$modal.hide('dialog');
                },
                class: 'btn btn-default'
              },
              {
                title: 'Save & Apply Suggestions',
                handler: () => {
                  this.saveAllSuggestions()
                    .then(() => {
                      this.$modal.hide('dialog');
                      this.startApplySuggestions(false);
                    });
                },
                class: 'btn btn-primary'
              }
            ]
          });
          return;
        }
        this.$modal.show('dialog', {
          title: 'Apply dictionary suggestions',
          text: `Applying ${this.categoryName} dictionary suggestions...`,
          buttons: [

          ]
        });
        return this.postSuggestions([this.category])
          .then(() => {
            this.getApplySuggestions()
              .then(() => {
                this.$modal.hide('dialog');
              });
          });
      },
      saveAllSuggestions() {
        let updates = [];
        Object.values(this.editing_suggestions).forEach(suggestion => {
          updates.push(this.update(suggestion));
        });
        return Promise.all(updates)
          .then(() => {
            return {};
          });
      },
      setContainerHeight() {
        Vue.nextTick(() => {
          let targetContainer = document.querySelector(`section[id="${'p-' + this.categoryName}"] .suggestions-list-options`);
          if (targetContainer) {
            let containersHeight = document.querySelector('.nav-tabs-navigation').offsetHeight * 2 + document.querySelector('.top-menu-wrapper').offsetHeight/* + document.querySelector(`section[id="${'p-' + this.categoryName}"] .apply-suggestion`).offsetHeight + document.querySelector(`section[id="${'p-' + this.categoryName}"] .filter-suggestion`).offsetHeight*/ + 10;
            targetContainer.style.height = window.innerHeight - parseInt(containersHeight) + 'px';
          }
        });
      },
      ...mapActions('suggestionsModule', {
        addSuggestion: 'create',
        removeSuggestion: 'remove',
        getAll: 'getAll',
        updateSuggestion: 'update',
        canApplySuggestions: 'canApplySuggestions',
        postSuggestions: 'postSuggestions'
      })
    },
    watch: {
      'filter': {
        handler(val) {
          this.added_suggestion_id = null;
        }
      },
      'isActive': {
        handler(val) {
          if (this.isActive) {
            this.getApplySuggestions();
            this.setContainerHeight();
          }
        }
      },
      'blockSelection': {
        handler(val) {
          this.getApplySuggestions();
        },
        deep: true
      }
    }
  }
</script>
<style lang="less">
  @border-color: 2px solid #D9D9D9;
  .suggestions-list-options {
    overflow-y: scroll;
    .process-preloader {
      background: url(/static/preloader-snake-small.gif);
      background-repeat: no-repeat;
      background-position: center;
      height: 34px;
      display: inline-block;
      width: 50%;
      vertical-align: middle;
    }
    .suggestions-header {
      position: sticky;
      top: 0;
      background-color: white;
      z-index: 999;
      border-bottom: @border-color;
      .apply-suggestion {
        padding: 10px 3px;
        button {
          &:disabled {
            opacity: 0.5;
          }
        }
      }
      .filter-suggestion {
        padding: 10px 3px;
        &>div {
          display: inline-block;
          &:first-child {
            width: 80%;
            input[type="text"] {
              width: 100%;
              height: 34px;
              border: 1px solid #D9D9D9;
              border-radius: 5px;
              &:focus {
                outline: 0;
              }
            }
            i {
              margin-left: -30px;
              margin-top: 6px;
              z-index: 999;
              position: absolute;
            }
          }
          button {
            padding-top: 6px;
            padding-bottom: 1px;

            i {
              color: white;
              transform: rotate(45deg);
              font-size: 22px;
            }
          }
          button:disabled {
            i {
              cursor: not-allowed;
            }
          }
        }
      }
    }
    .suggestions-list  {
      padding: 10px 5px;
      margin: 5px 0px;
      border-bottom: @border-color;
      table {
        width: 100%;
        tr {
          border: none;
          cursor: pointer;
          &:hover {
            background-color: #FFF8DC;
            .suggestion-options {
              display: inline-block;
            }
          }
          td {
            border: none;
            padding: 5px 7px;
            width: 50%;
            position: relative;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            max-width: 210px;
            &:first-child {
              border-right: @border-color;
            }
            .play-suggestion {
              background: url(/static/tts-catalog/play-small.png);
              width: 24px;
              height: 24px;
              border: none;
              margin: 0px 2px;
              vertical-align: middle;
            }
            .suggestion-options {
              display: none;
              position: absolute;
              left: 75%;
              top: 20%;
              i {
                display: inline-block;
                padding: 0px 4px;
                &.fa-trash {
                  color: red;
                }
              }
            }
          }
        }
        tr:nth-child(odd) {
          background-color: #EFEFEF;
        }
      }
    }
  }
</style>
