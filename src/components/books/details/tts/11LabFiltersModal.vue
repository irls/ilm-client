<template>
  <div>
    <modal
      name="eleven-lab-filters-modal"
      transition="nice-modal-fade"
      :adaptive="true"
      :resizable="true"
      width="75%"
      height="90%"
      :minWidth="155"
      :minHeight="400"
      @before-open="modalOpening"
      @before-close="modalClosing"
      @resize="modalResizing">
      <div class="eleven-lab-filters-modal-wrapper">
        <div class="modal-header">
          <div class="header-title">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close_modal')">
            <i class="fa fa-times-circle-o" aria-hidden="true"></i>
            </button>
            <h4>Select voices</h4>
          </div>
        </div>
        <div class="modal-body">
          <div class="tabs-controls">
            <TabView ref="charactersTabs" :scrollable="true"
              :activeIndex="charactersTabsActiveIndex"
              class="meta-edit-tabs"
              @tab-change="charactersTabChange"
              :showAddTab="true"
              @onAddTab="addCharacter"
              @onRemoveTab="removeCharacter">

              <TabPanel
                v-for="(char, idx) in mapCharactersList"
                :key="char.uuid"
                :data-idx="idx"><!--:header="char.name"-->
                <template #header>
                  <span v-if="!char.isEditing"
                    class="p-tabview-title-character"
                    :contenteditable="char.isEditing"
                    v-text="char.name"
                    @dblclick="onTitleDblClick($event, char)">
                  </span>
                  <span v-if="char.isEditing"
                    class="p-tabview-title-character"
                    :contenteditable="char.isEditing"
                    ref="voiceTitleEditRef"
                    @input="onTitleEdit($event, char)"
                    @blur="onTitleBlur">
                  </span>
                </template>

                <span style="display: none">{{char.name}}</span>
              </TabPanel>

              <!--<TabPanel
                data-tab-head-class="no-padding"
                :data-idx="mapCharactersList.length">
                <template #header>
                  <div class="p-tabview-title add-character">
                    <button class="btn btn-primary" :disabled="false" @click="addVCharacter">
                      <i class="glyphicon glyphicon-remove-circle"></i>
                    </button>
                  </div>
                </template>
              </TabPanel>-->

            </TabView>
          </div>
          <!--<div class="tabs-controls">-->

          <div class="eleven-lab-filters-search">

            <elevenLabFiltersBar
              ref="elevenLabFiltersBar"
              :character = "mapCharactersList[charactersTabsActiveIndex]"
              :activeIndex="charactersTabsActiveIndex"
              @applyFilters = "charactersTabChange"/>
            <elevenLabSearchResults
              ref="elevenLabSearchResults"
              :character = "mapCharactersList[charactersTabsActiveIndex]"
              :activeIndex="charactersTabsActiveIndex"
              :audio_playing="audio_playing"
              @rowClick = "searchRowClick"
              @play="playVoiceExample"
              @stop="stopVoiceExample"/>

          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="cancelCharactersChanges">Cancel</button>
          <button class="btn btn-primary" @click="applyCharactersChanges">
            <!--<i class="fa fa-plus"></i>&nbsp;-->
            Apply Voices
          </button>
        </div>
      </div><!--<div class="link-book-modal-wrapper">-->
    </modal>
    <modal name="characters-message" class="eleven-labs-characters-modal" :height="141" :resizeable="false">
      <div class="modal-header">Delete character tab</div>
      <div class="modal-body">
        <p>This will remove {{relinkCount}} of the selected books from their current collection(s).</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" v-on:click="linkBooks()">Confirm</button>
        <button class="btn btn-default" v-on:click="hideModal('characters-message')">Cancel</button>
      </div>
    </modal>
  </div>
</template>
<script>
  //import Grid from '../../../generic/Grid';

  import api_config from '../../../../mixins/api_config.js' // ?????

  import TabPanel from 'primevue/tabpanel';
  import TabView  from '../../../generic/components/TabViewILM.vue';

  import elevenLabFiltersBar  from './11LabFiltersBar.vue';
  import elevenLabSearchResults  from './11LabSearchResults.vue';

  import {mapGetters, mapActions} from 'vuex';

  import _     from 'lodash'
  import modal from 'vue-js-modal';
  import Vue   from 'vue';
  Vue.use(modal, { dialog: true });

  export default {
      name: 'ElevenLabFiltersModal',
      data() {
        return {
          charactersTabsActiveIndex: 0,

          selected: [],
          booksFilter: {title: '', language: 'en', collection: 'not-linked', published: ''},
          relinkCount: 0
        }
      },
      props: {
        play: {
          type: Function,
          default: function(){}
        },
        audio_playing: {
          type: [String, Boolean],
          default: false
        },
        onSaveBookCharacters: {
          type: Function,
          default: function(){}
        },
      }, //['languages'],
      components: {
        //Grid: Grid
        TabView,
        TabPanel,
        elevenLabFiltersBar,
        elevenLabSearchResults
      },
      mixins: [api_config],
      computed: {
        linkBooksList: {
          get() {
          }
        },
        ...mapGetters({
          voicesListLoading:  'elevenLabsVoicesModule/voicesListLoading',
          mapCharactersList:  'elevenLabsVoicesModule/mapCharactersList',
          getSelectedVoice:   'elevenLabsVoicesModule/getSelectedVoice',
        })
      },
      mounted() {
        this.$store.dispatch('elevenLabsVoicesModule/applyInitVoicesFilters');
        this.showModal('eleven-lab-filters-modal');
      },
      methods: {
        //...mapActions(),

        showModal(name) {
          this.$modal.show(name);
        },
        hideModal(name) {
          this.$modal.hide(name);
        },
        modalResizing: _.debounce(function () {
          if (this?.$refs?.charactersTabs) {
            this.$refs.charactersTabs.onResize()
          }
        }, 300),
        modalOpening() {},
        modalClosing() {
          this.$emit('close_modal');
        },
        async charactersTabChange(tab) {
          this.charactersTabsActiveIndex = tab.index;
          await this.$store.dispatch('elevenLabsVoicesModule/applySavedVoicesFilters', tab.index);
          await this.$store.dispatch('elevenLabsVoicesModule/applyFilterVoices', tab.index);
          if (this.getSelectedVoice?.voice_id) {
            Vue.nextTick(()=>{
              const voiceId = this.getSelectedVoice.voice_id;
              const selectedVoiceEl = this.$refs.elevenLabSearchResults.$el.querySelector(`[data-id="${voiceId}"]`);
              if (selectedVoiceEl) {
                selectedVoiceEl.scrollIntoView();
              }
            });
          }
        },

        onTitleBlur() {
          this.$store.commit('elevenLabsVoicesModule/set_charactersListNonEdit');
        },

        onTitleDblClick(event, char) {
          this.$store.commit('elevenLabsVoicesModule/set_charactersListItemEdit', char);

          Vue.nextTick(()=>{
            const activeRef = this.$refs.voiceTitleEditRef.find(el=>el.getAttribute('contenteditable')==='true');
            if (activeRef) {
              activeRef.innerText = char.name;
              this.setCaretToEnd(activeRef);
            }
          })
        },

        setCaretToEnd(element) {
          if (!element) return;
          const range = document.createRange();
          const selection = window.getSelection();
          selection.removeAllRanges();
          range.selectNodeContents(element);
          range.collapse(false);
          selection.addRange(range);
          element.focus();
        },

        onTitleEdit(event, character) {
          this.$store.commit('elevenLabsVoicesModule/set_charactersListItemValue', {
            values: { name: event.target.innerText }, character
          });
        },

        addCharacter() {
          const lastIndex = this.mapCharactersList.length;
          this.$store.commit('elevenLabsVoicesModule/set_charactersListAddItem');

          Vue.nextTick(()=>{
            this.charactersTabsActiveIndex = lastIndex;
            this.$refs.charactersTabs.onResize(lastIndex);
            this.$store.commit('elevenLabsVoicesFilters/set_resetVoiceFilters');
            this.$store.dispatch('elevenLabsVoicesModule/applyFilterVoices');
          })
        },

        removeCharacter(params) {
          const { i } = params;
          this.$store.commit('elevenLabsVoicesModule/set_charactersListRemoveItem', i);

          Vue.nextTick(()=>{
            this.$refs.charactersTabs.onResize();
            Vue.nextTick(()=>{
              const idx = this.$refs.charactersTabs.d_activeIndex;
              this.$store.dispatch('elevenLabsVoicesModule/applySavedVoicesFilters', idx);
            })
          })
        },

        applyCharactersChanges() {
          //this.showModal('characters-message');
          this.$emit('onSaveBookCharacters', this.charactersTabsActiveIndex);
        },

        cancelCharactersChanges() {
          this.$emit('close_modal');
        },

        searchRowClick(params) {
          const { event, voice, character } = params;
          this.$store.commit('elevenLabsVoicesModule/set_characterVoiceSelected', { voice, character });
          this.$store.commit('elevenLabsVoicesModule/set_voiceSelected', { voice });
        },

        playVoiceExample(params) {
          //const { event, voice, character } = params;
          this.$emit('play', params);
        },

        stopVoiceExample(params) {
          //const { event, voice, character } = params;
          this.$emit('stop', params);
        },

        // rowClick(item, event) {
        //   if (event && event.target && event.target.className.indexOf('toggle-select') !== -1) {
        //     if (item && item.bookid) {
        //       $('[name="select-link-' + item.bookid + '"]').trigger('click');
        //     }
        //   }
        // },
        //
        // filterChange(field, event) {
        //   this.booksFilter[field] = event.target.type === 'checkbox' ? (event.target.checked ? '1' : '') : event.target.value;
        // },
      }
  }
</script>

<style lang="less" scoped>

.eleven-lab-filters-modal-wrapper {

  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  .modal-header {
    padding: 2px 15px 2px 15px;
  }

  .modal-body {
    flex-grow: 1;
    min-height: 0; /* CRITICAL FIX: Allows it to shrink below content size */
    display: flex;
    flex-direction: column;
    padding-bottom: 0;

    .tabs-controls {
      padding-bottom: 10px;
    }

    span.p-tabview-title-character {
      line-height: 1;
      white-space: nowrap;

      &[contenteditable="true"] {
        cursor: text;
        outline-color: #ddd;
        outline-style: solid;
        outline-width: 1px;
        padding: 0.5rem;
        margin-right: -5px;
      }
    }

    input.p-tabview-title-character {
      width: 86%;
      height: 30px;
      margin-left: 0;
      margin-right: auto;
      border: 1px solid #767676;
      border-radius: 2px 0px 0px 2px;
      position: relative;
      z-index: 1;
    }

    .eleven-lab-filters-search {
      flex-grow: 1;
      min-height: 0; /* CRITICAL FIX: Allows it to shrink below content size */
      display: flex;
      flex-direction: column;
    }
  }

  .modal-footer {
    border-top: none;
  }

}

.eleven-labs-characters-modal {
  .modal-header {
    border: 0;
    font-weight: 600;
    padding-bottom: 0;
  }

  .modal-footer {
    padding: 0;
    border: 0;
    display: flex;
    flex-direction: row;

    .btn {
      width: 50%;
      height: 46px;
      margin: 0;
    }
  }
}
</style>
