<template>
<div id="toolbar">
<table class="toolbartable"><tr>

  <td>
    <h3><img src='/static/bookstack.svg' class='bookstack'/>
     {{ bookCount() }} Book{{ (bookCount()===1 ? '':'s')}}
    </h3>
  </td>

  <td class="right">
    <!-- Edit Button -->
    <button v-if='$store.state.currentBookid' @click='editBook'
    class='btn btn-default'>
      <i class="fa fa-pencil fa-lg"></i>  Edit
    </button>  &nbsp;

    <!-- Import Button -->
    <!--<router-link to="/books/import" tag='button' class='btn btn-default'>
      <i class="glyphicon glyphicon-plus"></i> Import
    </router-link>   &nbsp; -->

    <button id="show-modal" @click="importBook"
    class='btn btn-default'>
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
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="du">German</option>
      <option value="ru">Russian</option>
      <option value="ar">Arabic</option>
      <option value="fa">Farsi</option>
      <option value="cn">Chinese</option>
      <option value="ru">Romanian</option>
    </select>
  </td>

</tr></table>

  <BookImport v-if="showModal" @close="showModal = false">
    <!--
      you can use custom content here to overwrite
      default content
    -->
    
  </BookImport>

</div>
</template>

<script>

import BookImport from './BookImport'

export default {
  name: 'toolbar',
  components: {
    BookImport
  },

  data () {
    return {
      filterStr: '',
      showModal: false
    }
  },
  
  methods: {
    booksFilterChange: function(el) {
      this.$store.commit('setCurrentBookFilter', {filter: el.target.value});
    },
    booksLanguageChange: function(el) {
      this.$store.commit('setCurrentBookFilter', {lang: el.target.value});
    },
    booksTypeChange: function(el) {
      this.$store.commit('setCurrentBookFilter', {importStatus: el.target.value});
    },
    bookCount() {
      return this.$store.state.books.length;
    },
    editBook() {
      //console.log('/books/edit/'+ this.$store.state.currentBookid)
      this.$router.push('/books/edit/'+ this.$store.state.currentBookid)
    },

    importBook() {
      console.log("event ok");
      this.showModal = true;
    }

  },
}
</script>


<style scoped >
.toolbartable {
   width: 100%;
   height: 4em;
   position: relative;
   padding-left: .25em;
   padding-right: .25em;
   box-shadow: 0px 0px 3px 2px rgba(178, 191, 224, 0.53);
 }
.toolbartable td {
   text-align: left;
   padding-top:0; margin-top:0;
 }
.toolbartable td.right {
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
