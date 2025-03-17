<template>
  <div class="suggestions-list-options">
    <div class="apply-suggestion">
      <button class="btn btn-primary" :disabled="applySuggestionData.total === 0">Apply</button>
      {{ applySuggestionData.total }} matching block(s) in range 
      <a v-on:click="goToBlock(selectedRange.start.id)" class="go-to-block">{{ selectedRange.start.id_short }}</a>&nbsp;-&nbsp;
      <a v-on:click="goToBlock(selectedRange.end.id)" class="go-to-block">{{ selectedRange.end.id_short }}</a>
    </div>
    <div class="filter-suggestion">
      <div>
        <input type="text" v-model="filter" />
        <i v-if="filter.length > 0" class="ico ico-clear-filter btn-inside" v-on:click="clearFilter"></i>
      </div>
      <div>
        <button class="btn btn-primary" :disabled="!filter.length" v-on:click="add">
          <i class="fa fa-plus"></i>
        </button>
      </div>
    </div>
    <div v-if="addSuggestionMode" class="add-suggestion">
      <EditSuggestion 
        :suggestion="edit_suggestion"
        @save="createSuggestion"
        @cancel="cancelCreate" />
    </div>
    <div class="suggestions-list">
      <table>
        <template v-for="suggestion in filteredSuggestions">
          <tr>
            <td :title="suggestion.text">
              <button class="play-suggestion" v-if="suggestion.voice_example" v-on:click="playSuggestion(suggestion)"></button>
              {{ suggestion.text }}
            </td>
            <td :title="suggestion.suggestion">
              {{ suggestion.suggestion }}
              <div class="suggestion-options">
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
        }
      }
    },
    props: ['suggestions', 'category', 'isActive'],
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
      ...mapGetters(['storeList', 'blockSelection']),
      ...mapGetters('suggestionsModule', ['applySuggestions'])
    },
    mounted() {
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
          this.applySuggestionData.total = 0;
          this.canApplySuggestions([this.category])
            .then(response => {
              let suggestions = this.applySuggestions(this.category);
              this.applySuggestionData.total = suggestions.total;
            });
        }
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
      ...mapActions('suggestionsModule', {
        addSuggestion: 'create',
        removeSuggestion: 'remove',
        getAll: 'getAll',
        updateSuggestion: 'update',
        canApplySuggestions: 'canApplySuggestions'
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
    .apply-suggestion {
      padding: 10px 3px;
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
          i {
            color: white;
            font-weight: 200;
            font-size: 14px;
            border: 1px solid white;
            border-radius: 15px;
            padding: 5px;
            width: 26px;
            height: 26px;
          }
        }
      }
    }
    .suggestions-list  {
      padding: 10px 5px;
      margin: 5px 0px;
      border-top: @border-color;
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