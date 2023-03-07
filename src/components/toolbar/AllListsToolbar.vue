<template>
<div class="toolbar books-list-toolbar">
  <div class="toolbar-first-row">
    <!-- Meta Filter -->
    <input v-model="bookFilters.filter" type="text" class="form-control" style="width: 17.5em; padding-right:30px;" placeholder="Filter by Title / Author / Category" @keyup="filterChange()"></input>
    <i class="fa fa-times-circle-o btn-inside"  aria-hidden="true" @click="bookFilters.filter='';"></i>

    <input v-model="bookFilters.projectTag" type="text" class="form-control" style="width: 16em; padding-right:30px;" placeholder="Filter by Editor or Project tag" @keyup="filterChange()"></input>
    <i class="fa fa-times-circle-o btn-inside"  aria-hidden="true" @click="bookFilters.projectTag='';"></i>

    <template v-if="adminOrLibrarian">
      <select v-model="bookFilters.jobStatus" @change="filterChange()">
        <option value="">Not filtered</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
        <option value="completed">Completed</option>
        <option value="suspended">Suspended</option>
      </select> &nbsp;
    </template>

    <!-- Language Dropdown -->
    <select v-model="bookFilters.language" @change="filterChange()">
      <option value="">Any language</option>
      <option v-for="(name, code) in languages" :value="code">{{name}}</option>
    </select>
  </div>

  <div class="toolbar-second-row">
    <TabView ref="booksListTabs" :scrollable="false" v-on:tab-change="onBooksListTabChange">
      <TabPanel :header="'aaaa'"></TabPanel>
      <TabPanel :header="'bbb'"></TabPanel>
      <TabPanel :header="'ccccc'"></TabPanel>
    </TabView>


    <h3><img src='/static/bookstack_crop.svg' class='bookstack'/>
      {{ bookCount() }} Book{{ (bookCount()===1 ? '':'s')}}
    </h3>

    <div class="pull-right">
    <!-- Edit Button -->
    <button v-show="hasBookSelected"
      @click='displayBook' class='btn btn-default'>
      <i class="fa fa-pencil fa-lg"></i>  Display Book
    </button>  &nbsp;



    <!--<button v-show='hasBookSelected()' class='btn btn-default btn-meta' @click='toggleMetaVisible'><i :class="[metaVisible ? 'fa-chevron-right': 'fa-chevron-left', 'fa fa-lg collapsebtn']" aria-hidden="true"></i>Details</button>-->

    </div>

    <!-- Import Books Modal Popup -->
    <BookImport v-if="showImportBooksModal"
    @close_modal="importBooksModalClose" />

  </div>

</div>
</template>

<script>
import { mapGetters } from 'vuex'
import BookImport from '../books/BookImport'
import { Languages } from "../../mixins/lang_config.js"
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

export default {

  name: 'AllListsToolbar',

  components: {
    BookImport, TabView, TabPanel
  },

  data () {
    return {
      filterStr: '',
      showImportBooksModal: false,
      languages: Languages,
    }
  },

  props: [
    'hasBookSelected',
    //'toggleMetaVisible',
    'metaVisible'
  ],

  computed: mapGetters([
    'isLoggedIn',
    'isAdmin',
    'isEditor',
    'isLibrarian',
    'allowBookEditMode',
    'allBooks',
    'adminOrLibrarian',
    'bookFilters'
  ]),

  methods: {
    filterChange () {
      /*if (this.$route.params.hasOwnProperty('bookid')) {
        this.$router.replace({ path: '/books'});
      }*/
    },
    bookCount () {
      if (this.allBooks && this.allBooks.length) {
        let filtered = this.allBooks
                .filter(m => !m.collection_id)
                .filter(m => m.importStatus);
        return filtered.length;
      } else {
        return 0;
      }
    },
    displayBook () {
      this.$router.push('/books/' + this.$store.state.currentBookMeta.bookid + '/display')
    },
    importBook () {
      console.log('event ok')
      this.showImportBooksModal = true
    },
    importBooksModalClose(uploaded) {
      this.showImportBooksModal=false
      this.$emit('import_finished', uploaded)
    },
    onBooksListTabChange(ev) {
      console.log(`onBooksListTabChange: `, ev.index, this.$router);
      switch(ev.index) {
          case 2 : {
          } break;
          case 1 : {
            this.$router.push('/collections');
          } break;
          case 0 : default : {
            this.$router.push('/books');
          } break;
      };
    }
  }
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
  .toolbar-second-row {
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
