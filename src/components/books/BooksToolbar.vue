<template>
<div class="toolbar">

  <h3><img src='/static/bookstack_crop.svg' class='bookstack'/>
    {{ bookCount() }} Book{{ (bookCount()===1 ? '':'s')}}
  </h3>

  <div class="pull-right">
  <!-- Edit Button -->
  <button v-if="hasBookSelected()"
    @click='displayBook' class='btn btn-default'>
    <i class="fa fa-pencil fa-lg"></i>  Display Book
  </button>  &nbsp;

  <!-- Meta Filter -->
  <input v-model="bookFilters.filter" type="text" class="form-control" style="width: 15em; padding-right:30px;" placeholder="Filter by Author or Title" @keyup="filterChange()"></input>
  <i class="fa fa-times-circle-o btn-inside"  aria-hidden="true" @click="bookFilters.filter='';"></i>

  <input v-model="bookFilters.projectTag" type="text" class="form-control" style="width: 18em; padding-right:30px;" placeholder="Filter by Editor or Project tag" @keyup="filterChange()"></input>
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

  <button v-if='hasBookSelected()' class='btn btn-default btn-meta' @click='toggleMetaVisible'><i :class="[metaVisible ? 'fa-chevron-right': 'fa-chevron-left', 'fa fa-lg collapsebtn']" aria-hidden="true"></i>Details</button>

  </div>

  <!-- Import Books Modal Popup -->
  <BookImport v-if="showImportBooksModal"
  @close_modal="importBooksModalClose" />

</div>
</template>

<script>
import { mapGetters } from 'vuex'
import BookImport from './BookImport'
import { Languages } from "../../mixins/lang_config.js"

export default {

  name: 'toolbar',

  components: {
    BookImport
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
    'toggleMetaVisible',
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
