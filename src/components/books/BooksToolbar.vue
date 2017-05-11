<template>
<div>
<table class="toolbar"><tr>

  <td>
    <h3><img src='/static/bookstack.svg' class='bookstack'/>
     {{ bookCount() }} Book{{ (bookCount()===1 ? '':'s')}}
    </h3>
  </td>

  <td class="right">
    <!-- Edit Button -->
    <button v-if="$store.state.currentBookid && (isAdmin || isEditor || isLibrarian)"
      @click='editBook' class='btn btn-default'>
      <i class="fa fa-pencil fa-lg"></i>  Edit
    </button>  &nbsp;

    <!-- Import Button -->
    <pre>
      isLoggedIn: {{isLoggedIn}}
      isAdmin: {{isAdmin}}
      isLibrarian: {{isLibrarian}}
    </pre>
    <button id="show-modal" @click="importBook" class="btn btn-default" v-if="(isAdmin || isLibrarian)">
      <i class="fa fa-pencil fa-lg"></i>  Import
    </button>  &nbsp;

    <!-- Meta Filter -->
    <input type="text" @keyup="booksFilterChange" class="form-control" placeholder="Filter"></input> &nbsp;

    <select @change="booksTypeChange">
      <option value="staging">Staging</option>
      <option value="shared">Shared</option>
    </select> &nbsp;

    <!-- Language Dropdown -->
    <select @change="booksLanguageChange">
      <option v-for="(name, code) in languages" :value="code">{{name}}</option>
    </select>
  </td>

</tr></table>

  <!-- Import Books Modal Popup -->
  <BookImport v-if="showImportBooksModal" @close_modal="showImportBooksModal=false" />

</div>
</template>

<script>
import { mapGetters } from 'vuex'
import BookImport from './BookImport'

export default {

  name: 'toolbar',

  components: {
    BookImport
  },

  data () {
    return {
      filterStr: '',
      showImportBooksModal: false,
      languages: {
        en: 'English',
        es: 'Spanish',
        du: 'German',
        ru: 'Russian',
        ar: 'Arabic',
        fa: 'Farsi',
        cn: 'Chinese',
        ro: 'Romanian'
      }
    }
  },

  computed: mapGetters([
    'isLoggedIn',
    'isAdmin',
    'isEditor',
    'isLibrarian'
  ]),

  methods: {
    booksFilterChange (el) {
      this.$store.commit('SET_CURRENTBOOK_FILTER', {filter: el.target.value})
    },
    booksLanguageChange (el) {
      this.$store.commit('SET_CURRENTBOOK_FILTER', {language: el.target.value})
      // console.log("language: "+el.target.value)
    },
    booksTypeChange (el) {
      this.$store.commit('SET_CURRENTBOOK_FILTER', {importStatus: el.target.value})
    },
    bookCount () {
      return this.$store.state.books_meta && this.$store.state.books_meta.length
    },
    editBook () {
      // console.log('/books/edit/'+ this.$store.state.currentBook._id)
      this.$router.push('/books/edit/' + this.$store.state.currentBook._id)
    },
    importBook () {
      console.log('event ok')
      this.showImportBooksModal = true
    }
  }
}
</script>


<style scoped>
.toolbar {
   width: 100%;
   height: 4em;
   position: relative;
   padding-left: .25em;
   padding-right: .25em;
   box-shadow: 0px 0px 3px 2px rgba(178, 191, 224, 0.53);
 }
.toolbar td {
   text-align: left;
   padding-top:0; margin-top:0;
 }
.toolbar td.right {
  text-align: right;
  position: inline;
  padding-top: 11px;
  float: right;
  padding-right: 10px;
}


h3 {margin: 0; padding-top: 0; padding-left: 2.5em; }

select {
  padding: 3px; height: 2.5em;
}
.btn {
  margin-right: .5em;
}
button:hover {
  color: darkgreen;
  background: #F0FFF0
}
img.bookstack {
  width: 60px; position: absolute; left: 10px; top: 5px;
  opacity: .75
}

input {width: 8em}

.form-control {display: inline}

</style>
