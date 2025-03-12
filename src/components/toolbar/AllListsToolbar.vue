<template>
<div class="books-list-toolbar">
  <div class="toolbar-first-row" ref="toolbarFirstRow">
    <!-- Meta Filter -->
    <span v-if="showBooksFilters">
      <input placeholder="Filter by Title / Author / Category"
        ref="booksFilters.filter" type="text"
        :class="['form-control book-filter', {filled: booksFilters.filter!=''}]"
        @keyup="filterChangeBooksDebounce('filter', $event)"
        @paste="filterChangeBooksDebounce('filter', $event)" ></input>
      <i class="ico ico-clear-filter btn-inside" aria-hidden="true"
        v-if="booksFilters.filter!=''"
        @click="cleanFilterVal('booksFilters.filter'); filterChangeBooks('filter');"></i>

      <input placeholder="Filter by Editor / Tag"
        ref="booksFilters.secFilter" type="text"
        :class="['form-control book-filter second-filter', {filled: booksFilters.secFilter!=''}]"
        @keyup="filterChangeBooksDebounce('secFilter', $event)"
        @paste="filterChangeBooksDebounce('secFilter', $event)"></input>
      <i class="ico ico-clear-filter btn-inside" aria-hidden="true"
        v-if="booksFilters.secFilter!=''"
        @click="cleanFilterVal('booksFilters.secFilter'); filterChangeBooks('secFilter');"></i>
    </span>

    <span v-if="showCollectionsFilters">
      <input placeholder="Filter by Title / Author / Category"
        ref="collectionsFilters.filter" type="text"
        :class="['form-control book-filter', {filled: collectionsFilters.filter!=''}]"
        @keyup="filterChangeCollectionsDebounce('filter', $event)"
        @paste="filterChangeCollectionsDebounce('filter', $event)" ></input>
      <i class="ico ico-clear-filter btn-inside" aria-hidden="true"
        v-if="collectionsFilters.filter!=''"
        @click="cleanFilterVal('collectionsFilters.filter'); filterChangeCollections('filter');"></i>
    </span>

    <!--<MultiSelect v-model="multiBookFilters.multiProjectTag"
      :options="mapFilterProjectTag"
      optionLabel="caption" placeholder="All projects"
      display="chip" :showToggleAll="false"
      @change="filterChangeBooks" />-->

    <!-- Language Dropdown -->
    <!--<select v-model="booksFilters.language" @change="filterChangeBooks">
      <option value="">Any language</option>
      <option v-for="(name, code) in languages" :value="code">{{name}}</option>
    </select>-->

    <!-- Language Dropdown -->
    <MultiSelect v-if="mapFilterLanguages.length > 1"
      v-model="multiBookFilters.language"
      :options="mapFilterLanguages" optionLabel="caption"
      data-captions="Languages" placeholder="Language"
      display="chip" :showToggleAll="false"
      @change="filterChangeBooks" />

    <!-- Book status Dropdown -->
    <MultiSelect v-if="showBooksFilters && mapFilterImportStatus.length > 1"
      v-model="multiBookFilters.importStatus"
      :options="mapFilterImportStatus" optionLabel="caption"
      data-captions="Statuses" placeholder="Status"
      display="chip" :showToggleAll="false"
      @change="filterChangeBooks" />

    <!--<template v-if="adminOrLibrarian">
      <select v-model="booksFilters.jobStatus" @change="filterChangeBooks">
        <option value="">Not filtered</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
        <option value="completed">Completed</option>
        <option value="suspended">Suspended</option>
      </select> &nbsp;
    </template>-->

    <MultiSelect v-if="showBooksFilters && adminOrLibrarian && mapFilterJobStatus.length > 1"
      v-model="multiBookFilters.jobStatus"
      :options="mapFilterJobStatus" optionLabel="caption"
      data-captions="States" placeholder="State"
      display="chip" :showToggleAll="false"
      @change="filterChangeBooks" />

  </div>

  <div class="toolbar-second-row">
    <div class="toolbar-tabview">
      <div :class="['toolbar-nav-link', {'p-highlight': activeTabIdx == 0}]" @click="onBooksListTabChange({index: 0})">
          {{filteredBooksCounter + ' Book' + (filteredBooksCounter===1 ? '':'s')}}
      </div>
      <div :class="['toolbar-nav-link', {'p-highlight': activeTabIdx == 1}]" @click="onBooksListTabChange({index: 1})">
          {{filteredCollectionsCounter + ' Collection' + (filteredCollectionsCounter===1 ? '':'s')}}
      </div>
      <div :class="['toolbar-clip toolbar-nav-link', {'p-highlight': activeTabIdx == 2}]" @click="onBooksListTabChange({index: 2})"
        v-if="currentCollectionHeader.length" v-html="currentCollectionHeader" >
      </div>
    </div>

    <div class="toolbar-second-row-buttons">
      <button class="btn btn-primary add-book-button" v-on:click="addJob" v-if="(isAdmin || isLibrarian)">
        <i class="fa fa-plus"></i>&nbsp;Add Book
      </button>
      <button class="btn btn-primary add-collection-button" v-on:click="addCollection" v-if="(isAdmin || isLibrarian) && allowCollectionsEdit">
        <i class="fa fa-plus"></i>&nbsp;Add Collection
      </button>
    </div>

    <!--<h3><img src='/static/bookstack_crop.svg' class='bookstack'/></h3>-->

    <!--<div class="pull-right">-->
    <!-- Edit Button -->
    <!--<button v-show="hasBookSelected"
      @click='displayBook' class='btn btn-default'>
      <i class="fa fa-pencil fa-lg"></i>  Display Book
    </button>  &nbsp;-->

    <!--<button v-show='hasBookSelected()' class='btn btn-default btn-meta' @click='toggleMetaVisible'><i :class="[metaVisible ? 'fa-chevron-right': 'fa-chevron-left', 'fa fa-lg collapsebtn']" aria-hidden="true"></i>Details</button>-->

  </div>

  <!-- Import Books Modal Popup -->
  <BookImport v-if="showImportBooksModal"
  @close_modal="importBooksModalClose" />

</div>
</template>

<script>
import Vue from 'vue';
import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex'
import BookImport from '@src/components/books/BookImport'
import TaskAddModal from '@src/components/tasks/TaskAddModal'
import { Languages } from "@src/mixins/lang_config.js"
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import MultiSelect from 'primevue/multiselect';
import v_modal from 'vue-js-modal';

//Vue.use(v_modal, { dialog: true });

export default {

  name: 'AllListsToolbar',

  components: {
    BookImport, TabView, TabPanel, MultiSelect
  },

  data () {
    return {
      filterStr: '',
      showImportBooksModal: false,
      languages: Languages,
      activeTabIdx: 0,
    }
  },

  props: [
    'hasBookSelected',
    'toggleMetaVisible',
    //'metaVisible'
  ],

  computed: {
    ...mapGetters([
      'isLoggedIn',
      'isAdmin',
      'isEditor',
      'isLibrarian',
      'allowBookEditMode',
      'allBooks',
      'bookCollections',
      'adminOrLibrarian',
      'currentBookMeta',
      'currentCollection',
      'allowCollectionsEdit',
    ]),
    ...mapGetters({
      booksFilters:                   'gridFilters/booksFilters',
      collectionsFilters:             'gridFilters/collectionsFilters',
      multiBookFilters:               'gridFilters/multiBookFilters',
      mapFilterJobStatus:             'gridFilters/mapFilterJobStatus',
      mapFilterImportStatus:          'gridFilters/mapFilterImportStatus',
      mapFilterProjectTag:            'gridFilters/mapFilterProjectTag',
      mapFilterLanguages:             'gridFilters/mapFilterLanguages',
      filteredBooksCounter:           'gridFilters/filteredBooksCounter',
      filteredCollectionsCounter:     'gridFilters/filteredCollectionsCounter',
      filteredCollectionBooksCounter: 'gridFilters/filteredCollectionBooksCounter',
    }),
    currentCollectionHeader () {
      if (this.currentCollection._id) {
        return `<span class="text-clip-ellipsis">${this.currentCollection.title || this.currentCollection._id}</span><span>&nbsp;(${this.filteredCollectionBooksCounter} Book${(this.filteredCollectionBooksCounter === 1?'':'s')})</span>`;
      }
      return '';
    },
    showCollectionsFilters () {
      return ['Collections', 'Collection'].indexOf(this.$route.name) >= 0;
    },

    showBooksFilters () {
      return ['Books', 'BooksGrid', 'CollectionBooks', 'CollectionBook'].indexOf(this.$route.name) >= 0;
    },
  },

  methods: {
    filterChangeBooks (key, $event) {
      const newFilters = Object.entries(this.multiBookFilters).reduce((acc, [key, val])=>{
        acc[key] = val.map((el)=>el.value);
        return acc;
      }, {});
      if (key && key === 'filter') {
        newFilters.filter = $event ? $event.target.value : '';
      }
      if (key && key === 'secFilter') {
        newFilters.secFilter = $event ? $event.target.value : '';
      }
      this.$store.commit('gridFilters/set_booksFilters', newFilters);
      this.changeFilterVisual();
    },

    filterChangeBooksDebounce: _.debounce(function (key, $event) {
      this.filterChangeBooks(key, $event)
    }, 300),

    filterChangeCollections (key, $event) {
      const newFilters = Object.entries(this.multiBookFilters).reduce((acc, [key, val])=>{
        acc[key] = val.map((el)=>el.value);
        return acc;
      }, {});
      if (key && key === 'filter') {
        newFilters.filter = $event ? $event.target.value : '';
      }
      this.$store.commit('gridFilters/set_collectionsFilters', newFilters);
    },

    filterChangeCollectionsDebounce: _.debounce(function (key, $event) {
      this.filterChangeCollections(key, $event)
    }, 300),

    cleanFilterVal (key) {
      // To unlink chain between input value and model because of debounce
      if (this.$refs[key]) {
        this.$refs[key].value = '';
      }
    },

    changeFilterVisual() {
      Vue.nextTick(()=>{
        const vFilters = this.$refs.toolbarFirstRow.querySelectorAll('.p-multiselect-label-container .p-multiselect-label');
        for (const vContainer of vFilters) {
          const vTokens = vContainer.querySelectorAll('.p-multiselect-token');
          const maxTokens = 2;
          for (const [vIndex, vToken] of vTokens.entries()) {
            if (vIndex < maxTokens) {
              vToken.style.display = 'inline-block';
            } else {
              vToken.style.display = 'none';
            }
          }
          const moreCounterVal = vTokens.length - maxTokens;
          const moreCounterPrev = vContainer.querySelector('.p-multiselect-more-counter');
          if (moreCounterVal > 0) {
            if (moreCounterPrev) {
              moreCounterPrev.innerText = `+${moreCounterVal}`;
            } else {
              const counter = document.createElement('span');
              counter.className = 'p-multiselect-more-counter';
              counter.innerText = `+${moreCounterVal}`;
              vContainer.appendChild(counter);
            }
          } else {
            if (moreCounterPrev) {
              vContainer.removeChild(moreCounterPrev);
            }
          }
        }
      })
    },
    changeFilterVisual2() {
      Vue.nextTick(()=>{
        const vFilters = this.$refs.toolbarFirstRow.querySelectorAll('.p-multiselect.p-component.p-inputwrapper');
        for (const vFilter of vFilters) {
          const vContainer = vFilter.querySelector('.p-multiselect-label-container .p-multiselect-label');
          const vTokens = vContainer.querySelectorAll('.p-multiselect-token');
          const maxTokens = 3;
          for (const [vIndex, vToken] of vTokens.entries()) {
            if (vTokens.length > maxTokens) {
              vToken.style.display = 'none';
            } else {
              vToken.style.display = 'inline-block';
            }
          }
          const moreCounterVal = vTokens.length;
          const moreCounterPrev = vContainer.querySelector('.p-multiselect-more-counter');
          if (vTokens.length > maxTokens) {
            if (moreCounterPrev) {
              moreCounterPrev.innerText = `${moreCounterVal} ${vFilter.dataset.captions}`;
            } else {
              const counter = document.createElement('div');
              counter.className = 'p-multiselect-more-counter';
              counter.innerText = `${moreCounterVal} ${vFilter.dataset.captions}`;
              vContainer.appendChild(counter);
            }
          } else {
            if (moreCounterPrev) {
              vContainer.removeChild(moreCounterPrev);
            }
          }
        }
      })
    },
    displayBook () {
      this.$router.push('/books/' + this.$store.state.currentBookMeta.bookid + '/display')
    },
    importBook () {
      //console.log('event ok')
      this.showImportBooksModal = true
    },
    importBooksModalClose(uploaded) {
      this.showImportBooksModal = false
      this.$emit('import_finished', uploaded)
    },
    addCollection() {
      return this.$store.dispatch('createCollection', {})
        .then(doc => {
          Vue.nextTick(() => {
            this.$emit('collectionAdded', doc._id);
            this.$store.commit('SET_CURRENT_COLLECTION', doc._id);
            this.$router.push({ name: 'Collection', params: { collectionid: doc._id } });
            this.$store.commit('gridFilters/set_fltrChangeTrigger');
          });
        }).catch(err => {})
    },
    onBooksListTabChange(ev) {
      this.activeTabIdx = ev.index;
      switch(ev.index) {
          case 2 : {
            if (this.currentCollection._id) {
              if (this.currentBookMeta && this.currentBookMeta.bookid) {
                this.$router.push({ name: 'CollectionBook', params: {
                  collectionid: this.currentCollection._id,
                  bookid: this.currentBookMeta.bookid
                } });
              } else {
                this.$router.push({ name: 'CollectionBooks', params: {
                  collectionid: this.currentCollection._id
                } });
              }
            }
          } break;
          case 1 : {
            if (this.currentCollection._id) {
              this.$router.push({ name: 'Collection', params: { collectionid: this.currentCollection._id } });
            }
            else {
              this.$router.push({ name: 'Collections' });
            }
          } break;
          case 0 : default : {
            if (this.currentBookMeta && this.currentBookMeta.bookid) {
              this.$router.push({ name: 'BooksGrid', params: { bookid: this.currentBookMeta.bookid } });
            } else {
              this.$router.push({ name: 'Books' });
            }
          } break;
      };
    },
    syncRouteWithTab() {
      console.log(`syncRouteWithTab: `, this.$route.name, this.currentCollection._id);
      let currentCollectionId = (this.$route.params && this.$route.params.collectionid) ? this.$route.params.collectionid : false;
      if (this.currentCollection._id) {
        currentCollectionId = this.currentCollection._id;
      }
      switch(this.$route.name) {
        case 'CollectionBooks' :
        case 'CollectionBook' : {
          if (currentCollectionId) {
            this.activeTabIdx = 2;
          } else {
            this.activeTabIdx = 1;
          }
        } break;
        case 'Collections' :
        case 'Collection' : {
          this.activeTabIdx = 1;
        } break;
        default : {
          this.activeTabIdx = 0;
        } break;
      }
    },
    fillFilters() {
      if (this.showBooksFilters) {
        this.$refs['booksFilters.secFilter'].value = this.booksFilters.secFilter;
        this.$refs['booksFilters.filter'].value = this.booksFilters.filter;
      }
      if (this.showCollectionsFilters) {
        this.$refs['collectionsFilters.filter'].value = this.collectionsFilters.filter;
      }
    },
    addJob() {
      let uploadInfo = {};
      this.$modal.show(TaskAddModal, {
        uploadInfo: uploadInfo
      },
      {
        height: "auto",
        width: "600px",
        clickToClose: false
      },
      {
        closed: () => {
          if (uploadInfo.create) {
            this.tc_loadBookTask();
          }
        }
      });
    },
    ...mapActions(['tc_loadBookTask'])
  },

  async mounted() {
    this.toggleMetaVisible({force: true});
    await Vue.nextTick();
    this.syncRouteWithTab();
    this.changeFilterVisual();
    this.fillFilters();
    document.body.addEventListener('mouseover', (e) => {
      console.log(e.target.innerHTML);
    });
  },
  watch:{
    async '$route' ($to, $from) {
      if ($to.name !== $from.name) {
        await Vue.nextTick();
        this.syncRouteWithTab();
        this.changeFilterVisual();
      }
    },
    'showBooksFilters': {
      handler() {
        Vue.nextTick(() => {
          if (this.showBooksFilters) {
            this.fillFilters();
          }
        });
      }
    },
    'showCollectionsFilters': {
      handler() {
        Vue.nextTick(() => {
          if (this.showCollectionsFilters) {
            this.fillFilters();
          }
        });
      }
    }
  },
}
</script>

<style lang="less" scoped>

h3 {
  margin: 0;
  padding-top: 0;
  display: inline-block;
}

select {
  padding: 3px; height: 34px;
}

.btn {
  margin-right: .5em;
  vertical-align: top;

  &.btn-meta {
     margin-left: 40px;
    &:focus {
      background: rgb(255, 255, 255);
      border-color: rgb(204, 204, 204);
    }
    .collapsebtn {
      margin-right: 5px;
    }
  }
}


button:hover {
  color: darkgreen;
  background: #F0FFF0
}

img.bookstack {
  width: 30px;
  opacity: .75
}

input {width: 12em}

input.form-control {
  display: inline;
  box-shadow: none;
  padding-top: 4px;
  padding-bottom: 4px;
  height: 32px;
  &:hover {
    box-shadow: none;
    border: 1px solid #66afe9;
  }
}

.btn-inside {
  margin-left: -30px;
  margin-top: 6px;
  z-index: 999;
  position: absolute;
}

</style>

<style lang="less">
.books-list-toolbar {
  .toolbar-first-row {
    margin-bottom: 1px;

    .form-control.book-filter {
      width: 16.2em;
      margin-bottom: 2px;

      &.filled {
        /*width: 17.5em;*/
        padding-right:30px;
      }

      &.second-filter {
        width: 10.9em;
      }
    }
    .p-multiselect {
      min-width: 14rem;
      border-radius: 4px;
      border: 1px solid #ccc;
      box-shadow: none;
      margin-bottom: 2px;

      &:hover, &.p-focus {
        box-shadow: none;
        border: 1px solid #66afe9;
      }

      &.p-multiselect-chip {
        .p-multiselect-token {
          border-radius: 4px;
          .p-multiselect-token-icon {
            display: none;
          }
        }
        .p-multiselect-more-counter {
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          margin-right: 0.5rem;
          background: #edebe9;
          color: #323130;
          cursor: default;
          width: fit-content;
        }
      }
    }
  }
  .toolbar-second-row {
    display: flex;
    flex-wrap: wrap;

    .toolbar-tabview {
      /*margin-bottom: -1px;*/
      min-width: 370px;
      flex: 1;
      display: flex;
      height: 34px;
      overflow: hidden;

      .toolbar-nav-link {
        user-select: none;
        cursor: pointer;
        padding: 8px 10px;
        margin-right: 5px;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-size: 1.1em;
        font-weight: 400;
        line-height: 1;
        color: gray;
        white-space: nowrap;

        &.toolbar-clip {
          /*flex: 1;*/
          display: flex;
          white-space: nowrap;
          overflow: hidden;

          span {
            display: inline-block;
            white-space: nowrap;
            &.text-clip-ellipsis {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }

        &:hover {
          background: #f3f2f1;
          text-decoration: underline;
          color: black;
        }

        &.p-highlight {
          background: #eaf1fc;
          &:hover {
            background: #eaf1fc;
          }
        }
      }
    }

    .add-book-button {

    }

    .add-collection-button {
      margin-right: 0px;
    }
  }
}

</style>
