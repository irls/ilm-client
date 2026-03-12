<template>
  <div>
    <modal
      name="eleven-lab-filters-modal"
      transition="nice-modal-fade"
      :adaptive="true"
      :resizable="true"
      width="80%"
      height="80%"
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
          <div class="header-controls">
            <!--<label>Collection</label>-->
            <!--<select @change="filterChange('collection', $event)">
              <option v-for="c in filterCollectionsList" :value="c._id">{{c.title}}</option>
            </select>-->

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
                {{voice.title}}
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
        </div>
        <div class="modal-body">
          <div class="eleven-lab-filters-search"></div>
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

          headers: [
            {
              title: '',
              path: 'bookid',
              html (val) {
                return `<i class="fa fa-check-square toggle-select"></i><i class="fa fa-square toggle-select"></i><input type="checkbox" class="link-book-select-toggle" name="select-link-${val}"/>`
              }
            },
            {
              title: 'Title',
              path: 'title',
              addClass: 'booktitle'
            },
            {
              title: 'Author',
              path: 'author',
              addClass: 'author',
              render(val) {
                return val ? val.join(', ') : '';
              }
            },
            {
              title: 'Size',
              path: 'wordcount',
              render (val) {
                // return '~'+Math.round(val / 300) +'pg'
                return val ? `${Math.round(val / 300)} pages` : '0 pages';
              }
            },
            {
              title: 'Published',
              path: 'published',
              html (val) {
                return '<i class="fa ' + (val ? 'fa-check-square-o' : 'fa-square-o') + '"></i>'
              }
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
      },
      mixins: [api_config],
      computed: {
        linkBooksList: {
          get() {
          }
        },
        ...mapGetters(['allBooks', 'currentCollection', 'bookCollections'])
      },
      mounted() {
        this.showModal('eleven-lab-filters-modal');
      },
      methods: {
        ...mapActions(['linkBooksToCollection']),

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
          //this.activeTabIndex = tab.index;
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
          this.voiceTabsActiveIndex = lastIndex;
          Vue.nextTick(()=>{
            this.$refs.voicesTabs.onResize();
          })
        },

        removeVoice(params) {
          const { i, tab: voice } = params;
          const voiceId = this.voicesList[i]?.id;
          console.log(`${__filename.slice(-30)}:i:tab: `, voiceId);

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

        linkBooks(check = false) {
          this.hideModal('on-link-message');
          if (check === true) {
            this.relinkCount = 0;
            this.selected.forEach(s => {
              let b = this.allBooks.find(_b => _b.bookid === s);
              if (b && b.collection_id) {
                ++this.relinkCount;
              }
            });
            if (this.relinkCount > 0) {
              this.showModal('on-link-message');
              return;
            }
          }
          if (this.selected.length > 0) {
            return this.linkBooksToCollection(this.selected)
              .then((response) => {
                if (response.status===200) {
                  this.$emit('close_modal');
                } else {

                }
              }).catch((err) => {

              });
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
    padding: 2px 15px 15px 15px;

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
  }

  .modal-body {
    flex-grow: 1;
  }

  .modal-footer {}

}
</style>
