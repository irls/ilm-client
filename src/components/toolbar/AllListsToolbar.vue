<template>
<div class="toolbar books-list-toolbar">
  <div class="toolbar-first-row" ref="toolbarFirstRow">
    <!-- Meta Filter -->
    <input v-model="booksFilters.filter" type="text" class="form-control" style="width: 17.5em; padding-right:30px;" placeholder="Filter Books" @keyup="filterChangeBooks"></input>
    <i class="ico ico-clear-filter btn-inside"  aria-hidden="true" @click="booksFilters.filter='';"></i>

    <input v-model="collectionsFilters.filter" type="text" class="form-control" style="width: 17.5em; padding-right:30px;" placeholder="Filter Collections" @keyup="filterChangeCollections"></input>
    <i class="ico ico-clear-filter btn-inside"  aria-hidden="true" @click="collectionsFilters.filter='';"></i>

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
    <MultiSelect v-model="multiBookFilters.language"
      :options="mapFilterLanguages"
      optionLabel="caption" placeholder="Language"
      display="chip" :showToggleAll="false"
      @change="filterChangeBooks" />

    <!-- Book status Dropdown -->
    <MultiSelect v-model="multiBookFilters.importStatus"
      :options="mapFilterImportStatus"
      optionLabel="caption" placeholder="Status"
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

    <MultiSelect v-if="adminOrLibrarian"
      v-model="multiBookFilters.jobStatus"
      :options="mapFilterJobStatus"
      optionLabel="caption" placeholder="State"
      display="chip" :showToggleAll="false"
      @change="filterChangeBooks" />

  </div>

  <div class="toolbar-second-row">
    <TabView ref="booksListTabs" :activeIndex="activeTabIdx" :scrollable="false" @tab-change="onBooksListTabChange">
      <TabPanel :header="filteredBooksCounter + ' Book' + (filteredBooksCounter===1 ? '':'s')"></TabPanel>
      <TabPanel :header="filteredCollectionsCounter + ' Collection' + (filteredCollectionsCounter===1 ? '':'s')"></TabPanel>
      <TabPanel v-if="currentCollection._id" :header="currentCollectionHeader"></TabPanel>
    </TabView>

    <div class="toolbar-second-row-buttons">
      <button class="btn btn-primary" v-on:click="taskAddModalActive = true" v-if="(isAdmin || isLibrarian)">
        <i class="fa fa-plus"></i>&nbsp;Add Book
      </button>
      <button class="btn btn-primary" v-on:click="addCollection" v-if="(isAdmin || isLibrarian) && allowCollectionsEdit">
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
  <TaskAddModal :show="taskAddModalActive"
  @closed="taskAddModalClose" />

</div>
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex'
import BookImport from '../books/BookImport'
import TaskAddModal from '../tasks/TaskAddModal'
import { Languages } from "../../mixins/lang_config.js"
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import MultiSelect from 'primevue/multiselect';

export default {

  name: 'AllListsToolbar',

  components: {
    BookImport, TaskAddModal, TabView, TabPanel, MultiSelect
  },

  data () {
    return {
      filterStr: '',
      showImportBooksModal: false,
      taskAddModalActive: false,
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
        return `${this.currentCollection.title || this.currentCollection._id} (${this.filteredCollectionBooksCounter} Book${(this.filteredCollectionBooksCounter === 1?'':'s')})`;
      }
      return '';
    }
  },

  methods: {
    filterChangeBooks (val) {
      /*if (this.$route.params.hasOwnProperty('bookid')) {
        this.$router.replace({ path: '/books'});
      }*/
      const newFilters = Object.entries(this.multiBookFilters).reduce((acc, [key, val])=>{
        acc[key] = val.map((el)=>el.value);
        return acc;
      }, {});
      //console.log(`filterChangeBooks.newFilters: `, newFilters);
      this.$store.commit('gridFilters/set_booksFilters', newFilters);
      this.changeFilterVisual();
    },
    filterChangeCollections (val) {
      const newFilters = Object.entries(this.multiBookFilters).reduce((acc, [key, val])=>{
        acc[key] = val.map((el)=>el.value);
        return acc;
      }, {});
      this.$store.commit('gridFilters/set_collectionsFilters', newFilters);
    },
    convertFilters () {

    },
    changeFilterVisual() {
      Vue.nextTick(()=>{
        const vFilters = this.$refs.toolbarFirstRow.querySelectorAll('.p-multiselect-label-container .p-multiselect-label');
        for (const vContainer of vFilters) {
          const vTokens = vContainer.querySelectorAll('.p-multiselect-token');
          const maxTokens = 3;
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
    taskAddModalClose(create) {
      this.taskAddModalActive = false;
      if (create) {
        this.$store.dispatch('tc_loadBookTask')
      }
    },
    addCollection() {
      return this.$store.dispatch('createCollection', {})
        .then(doc => {
          Vue.nextTick(() => {
            this.$emit('collectionAdded', doc._id);
            this.$store.commit('SET_CURRENT_COLLECTION', doc._id);
            this.$router.push({ name: 'Collection', params: { collectionid: doc._id } });
          });
        }).catch(err => {})
    },
    onBooksListTabChange(ev) {
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
              console.log(`this.currentBookMeta: `, this.currentBookMeta.bookid);
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
    }
  },

  async mounted() {
    this.toggleMetaVisible({force: true});
    await Vue.nextTick();
    this.syncRouteWithTab();
    this.changeFilterVisual();
  },
  watch:{
    async '$route' ($to, $from) {
      if ($to.name !== $from.name) {
        await Vue.nextTick();
        this.syncRouteWithTab();
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

input.form-control {
  height: 34px;
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

.form-control {display: inline}

.btn-inside {
  margin-left: -30px;
  margin-top: 7px;
  z-index: 999;
  position: absolute;
}

</style>

<style lang="less">
.books-list-toolbar {
  .toolbar-first-row {
    .p-multiselect {
      min-width: 14rem;
      &.p-multiselect-chip {
        .p-multiselect-token {
          border-radius: 4px;
          .p-multiselect-token-icon {
            display: none;
          }
        }
      }
    }
  }
  .toolbar-second-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    .p-tabview {
      .p-tabview-nav {
        .p-tabview-nav-link {
          font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
          font-size: 1.0em;
          font-weight: 400;
        }
        li.p-highlight {
          .p-tabview-nav-link {
            background: #eaf1fc;
            font-weight: 600;
          }
        }
      }
      .p-tabview-panels {
        display: none;
      }
    }
  }
}

</style>
