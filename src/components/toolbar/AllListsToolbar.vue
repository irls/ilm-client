<template>
<div class="toolbar books-list-toolbar">
  <div class="toolbar-first-row">
    <!-- Meta Filter -->
    <input v-model="bookFilters.filter" type="text" class="form-control" style="width: 17.5em; padding-right:30px;" placeholder="Filter by Title / Author / Category" @keyup="filterChange"></input>
    <i class="fa fa-times-circle-o btn-inside"  aria-hidden="true" @click="bookFilters.filter='';"></i>

    <input v-model="bookFilters.projectTag" type="text" class="form-control" style="width: 16em; padding-right:30px;" placeholder="Filter by Editor or Project tag" @keyup="filterChange"></input>
    <i class="fa fa-times-circle-o btn-inside"  aria-hidden="true" @click="bookFilters.projectTag='';"></i>

    <!--<MultiSelect v-model="multiBookFilters.multiProjectTag"
      :options="mapFilterProjectTag"
      optionLabel="caption" placeholder="All projects"
      display="chip" :showToggleAll="false"
      @change="filterChange" />-->

    <!-- Language Dropdown -->
    <!--<select v-model="bookFilters.language" @change="filterChange()">
      <option value="">Any language</option>
      <option v-for="(name, code) in languages" :value="code">{{name}}</option>
    </select>-->

    <!-- Language Dropdown -->
    <MultiSelect v-model="multiBookFilters.language"
      :options="mapFilterLanguages"
      optionLabel="caption" placeholder="Any language"
      display="chip" :showToggleAll="false"
      @change="filterChange" />

    <!-- Book status Dropdown -->
    <MultiSelect v-model="multiBookFilters.importStatus"
      :options="mapFilterImportStatus"
      optionLabel="caption" placeholder="Any status"
      display="chip" :showToggleAll="false"
      @change="filterChange" />

    <!--<template v-if="adminOrLibrarian">
      <select v-model="bookFilters.jobStatus" @change="filterChange()">
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
      optionLabel="caption" placeholder="Any job status"
      display="chip" :showToggleAll="false"
      @change="filterChange" />

  </div>

  <div class="toolbar-second-row">
    <TabView ref="booksListTabs" :activeIndex="activeTabIdx" :scrollable="false" @tab-change="onBooksListTabChange">
      <TabPanel :header="booksCount + ' Book' + (booksCount===1 ? '':'s')"></TabPanel>
      <TabPanel :header="collectionsCount + ' Collection' + (collectionsCount===1 ? '':'s')"></TabPanel>
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

      multiBookFilters: {
        language: [],
        jobStatus: [{caption: 'Active', value: 'active'}],
        importStatus: [],
        multiProjectTag: []
      },

      mapFilterJobStatus: [
        {caption: 'Active',    value: 'active'},
        {caption: 'Archived',  value: 'archived'},
        {caption: 'Completed', value: 'completed'},
        {caption: 'Suspended', value: 'suspended'}
      ],

      mapFilterImportStatus: [
        {caption: 'No content',   value: 'staging_empty'},
        {caption: 'Text Cleanup', value: 'staging'},
        {caption: 'Narration',    value: 'narrating'},
        {caption: 'Proofreading', value: 'proofing'},
        {caption: 'Mastering',    value: 'mastering'},
        {caption: 'Done',         value: 'completed'}
      ],

      mapFilterProjectTag: [
        {caption: 'Reader',  value: 'Reader'},
        {caption: 'Ocean',   value: 'Ocean'},
        {caption: 'ST',      value: 'ST'},
        {caption: 'OOL',     value: 'OOL'},
        {caption: 'Testing', value: 'Testing'},
        {caption: 'Traning', value: 'Traning'},
      ],
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
      'bookFilters',
      'currentBookMeta',
      'currentCollection',
      'allowCollectionsEdit',
    ]),
    booksCount () {
      if (this.allBooks && this.allBooks.length) {
        const filtered = this.allBooks
                .filter(m => !m.collection_id)
                .filter(m => m.importStatus);
        return filtered.length;
      } else {
        return 0;
      }
    },
    collectionsCount () {
      if (this.bookCollections && this.bookCollections.length) {
        const filtered = this.bookCollections;
                //.filter(m => !m.collection_id)
                //.filter(m => m.importStatus);
        return filtered.length;
      } else {
        return 0;
      }
    },
    collectionBooksCount () {
      if (this.currentCollection._id) {
        return this.currentCollection.bookids.length;
      }
      return 0;
    },
    currentCollectionHeader () {
      if (this.currentCollection._id) {
        return `${this.currentCollection.title} (${this.collectionBooksCount} Book${(this.collectionBooksCount === 1?'':'s')})`;
      }
      return '';
    },
    mapFilterLanguages () {
      return Object.entries(Languages).map(([code, name])=>({caption: name, value: code}));
    }
  },

  methods: {
    filterChange (val) {
      /*if (this.$route.params.hasOwnProperty('bookid')) {
        this.$router.replace({ path: '/books'});
      }*/
      const newFilters = Object.entries(this.multiBookFilters).reduce((acc, [key, val])=>{
        acc[key] = val.map((el)=>el.value);
        return acc;
      }, {});
      console.log(`filterChange.newFilters: `, newFilters);
      this.$store.commit('SET_CURRENTBOOK_FILTER', newFilters);
    },
    convertFilters () {

    },
    displayBook () {
      this.$router.push('/books/' + this.$store.state.currentBookMeta.bookid + '/display')
    },
    importBook () {
      console.log('event ok')
      this.showImportBooksModal = true
    },
    importBooksModalClose(uploaded) {
      this.showImportBooksModal = false
      this.$emit('import_finished', uploaded)
    },
    taskAddModalClose(create) {
      this.taskAddModalActive = false;
      console.log(`taskAddModalClose.create: `, create);
      if (create) {
        this.$store.dispatch('tc_loadBookTask')
      }
    },
    addCollection() {
      return this.$store.dispatch('createCollection', {})
        .then(doc => {
          Vue.nextTick(() => {
            this.$emit('collectionAdded', doc._id);
          });
        }).catch(err => {})
    },
    onBooksListTabChange(ev) {
      switch(ev.index) {
          case 2 : {
            if (this.currentCollection._id) {
              this.$router.push({ name: 'CollectionBooks', params: { collectionid: this.currentCollection._id } });
            }
          } break;
          case 1 : {
            this.$router.push({ name: 'Collections' });
          } break;
          case 0 : default : {
            this.$router.push({ name: 'Books' });
          } break;
      };
    },
    syncRouteWithTab() {
      console.log(`syncRouteWithTab: `, this.$route.name, this.currentCollection._id);
      switch(this.$route.name) {
        case 'CollectionBooks' :
        case 'CollectionBook' : {
          if (this.currentCollection._id) {
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

  }
  .toolbar-second-row {
    display: flex;
    justify-content: space-between;
    .p-tabview {
      .p-tabview-nav {
        li.p-highlight {
          .p-tabview-nav-link {
            background: #eaf1fc;
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
