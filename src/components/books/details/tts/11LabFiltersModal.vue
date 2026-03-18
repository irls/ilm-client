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
            <TabView ref="voicesTabs" :scrollable="true"
              :activeIndex="voiceTabsActiveIndex"
              class="meta-edit-tabs"
              @tab-change="voiceTabChange"
              :showAddTab="true"
              @onAddTab="addVoice"
              @onRemoveTab="removeVoice">

              <TabPanel
                v-for="(voice, idx) in voicesList"
                :key="voice.id"
                :data-idx="idx"><!--:header="voice.title"-->
                <template #header>
                  <span v-if="!voice.isEditing"
                    class="p-tabview-title-voice"
                    :contenteditable="voice.isEditing"
                    v-text="voice.title"
                    @dblclick="onTitleDblClick($event, voice)">
                  </span>
                  <span v-if="voice.isEditing"
                    class="p-tabview-title-voice"
                    :contenteditable="voice.isEditing"
                    ref="voiceTitleEditRef"
                    @input="onTitleEdit($event, voice)"
                    @blur="onTitleBlur($event, voice)">
                  </span>
                </template>

                <span style="display: none">{{voice.title}}</span>
              </TabPanel>

              <!--<TabPanel
                data-tab-head-class="no-padding"
                :data-idx="voicesList.length">
                <template #header>
                  <div class="p-tabview-title add-voice">
                    <button class="btn btn-primary" :disabled="false" @click="addVoice">
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
              @applyFilters = "addVoice"/>
            <elevenLabSearchResults />

          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="addVoice">
            <i class="fa fa-plus"></i>&nbsp;
          </button>
          <button class="btn btn-default" v-on:click="$emit('close_modal')">Cancel</button>
        </div>
      </div><!--<div class="link-book-modal-wrapper">-->
    </modal>
    <modal name="on-link-message" :height="150" :resizeable="false">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p>This will remove {{relinkCount}} of the selected books from their current collection(s).</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-default" v-on:click="hideModal('on-link-message')">Cancel</button>
        <button class="btn btn-primary" v-on:click="linkBooks()">Confirm</button>
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

  import {mapGetters, mapActions } from 'vuex';

  import _     from 'lodash'
  import modal from 'vue-js-modal';
  import Vue   from 'vue';
  Vue.use(modal, { dialog: true });

  export default {
      name: 'ElevenLabFiltersModal',
      data() {
        return {
          voiceTabsActiveIndex: 0,
          voicesList: [
            {
              id: 1,
              title: 'Tasks'
            },
            {
              id: 2,
              title: 'Narrator'
            }
          ],

          idField: 'bookid',
          selected: [],
          booksFilter: {title: '', language: 'en', collection: 'not-linked', published: ''},
          relinkCount: 0
        }
      },
      props: ['languages'],
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
          mapVoicesList:      'elevenLabsVoicesModule/mapVoicesList',
        })
      },
      mounted() {
        this.showModal('eleven-lab-filters-modal');
      },
      methods: {
        ...mapActions([]),

        showModal(name) {
          this.$modal.show(name);
        },
        hideModal(name) {
          this.$modal.hide(name);
        },
        modalResizing: _.debounce(function () {
          if (this?.$refs?.voicesTabs) {
            this.$refs.voicesTabs.onResize()
          }
        }, 300),
        modalOpening() {},
        modalClosing() {
          this.$emit('close_modal');
        },
        voiceTabChange(tab) {
          //this.voiceTabsActiveIndex = tab.index;
          // if (this.activeTabIndex === 1 && this.$refs.descriptionShort) {
          //   Vue.nextTick(() => {
          //     this.$refs.descriptionShort.setValue(this.currentBook.description_short);
          //     //this.$refs.descriptionShort.initSize();
          //   });
          // }
          // if (this.activeTabIndex === 1 && this.$refs.descriptionLong) {
          //   Vue.nextTick(() => {
          //     this.$refs.descriptionLong.setValue(this.currentBook.description);
          //     //this.$refs.descriptionLong.initSize();
          //   });
          // }

          // for (const _v of this.voicesList) {
          //   _v.isEditing = false;
          // }
        },

        onTitleBlur(event, voice) {
          this.voicesList = this.voicesList.map((_v)=>{
            _v.isEditing = false;
            return _v;
          })
        },

        onTitleDblClick(event, voice) {
          this.voicesList = this.voicesList.map((_v)=>{
            _v.isEditing = (_v.id == voice.id)
            return _v;
          })

          Vue.nextTick(()=>{
            const activeRef = this.$refs.voiceTitleEditRef.find(el=>el.getAttribute('contenteditable')==='true');
            if (activeRef) {
              activeRef.innerText = voice.title;
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

        onTitleEdit(event, voice) {
          voice.title = event.target.innerText;
        },

        addVoice() {
          const lastIndex = this.voicesList.length;
          const id = this.voicesList[lastIndex - 1].id;

          this.voicesList.push({
            id: id + 1,
            title: (id + 1).toString()
          })

          Vue.nextTick(()=>{
            this.$refs.voicesTabs.onResize(lastIndex);
          })
        },

        removeVoice(params) {
          const { i, tab: voice } = params;
          const voiceId = this.voicesList[i]?.id;

          if (voiceId) {
            this.voicesList = this.voicesList.filter((voice)=>voice.id!==voiceId);
          }

          Vue.nextTick(()=>{
            this.$refs.voicesTabs.onResize();
          })
        },

        rowClick(item, event) {
          if (event && event.target && event.target.className.indexOf('toggle-select') !== -1) {
            if (item && item.bookid) {
              $('[name="select-link-' + item.bookid + '"]').trigger('click');
            }
          }
        },

        filterChange(field, event) {
          this.booksFilter[field] = event.target.type === 'checkbox' ? (event.target.checked ? '1' : '') : event.target.value;
        },
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

    span.p-tabview-title-voice {
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

    input.p-tabview-title-voice {
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
</style>
