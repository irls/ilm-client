<template>
  <div id='booksarea' v-cloak>

    <div class='toolbar clearfix'>
      <BookEditToolbar v-if="isEditMode()" />
      <BooksToolbar v-else />
    </div>

    <table id='bodytable'><tr :colspan="colCount">
      <td class='maincontent scrollable'>
        <template v-if="isEditMode()">
          <BookEdit v-if="bookEditMode()=='Editor'" />
          <BookEditHtml v-else-if="bookEditMode()=='HTML'" />
          <BookEditJson v-else-if="bookEditMode()=='JSON'" />
          <BookEditDisplay v-else="bookEditMode()=='Display'" />
        </template>
        <BooksGrid v-else />
      </td><td class='collapseEditBar' @click='toggleMetaVisible' v-if='hasBookSelected()'>
        <div class="bar"><i :class="[metaVisible ? 'fa-chevron-right' : 'fa-chevron-left' , 'fa collapsebtn']" aria-hidden="true"></i></div>
      </td><td class='metaedit' v-if='metaVisible'>
        <BookMetaEdit v-if='metaVisible'/>
      </td>
    </tr></table>

  </div>
</template>

<script>
import BooksToolbar from './books/BooksToolbar'
import BookEditToolbar from './books/BookEditToolbar'
import BooksGrid from './books/BooksGrid'
import BookMetaEdit from './books/BookMetaEdit'
import BookEdit from './books/BookEdit'
import BookEditHtml from './books/BookEdit_HTML'
import BookEditJson from './books/BookEdit_JSON'
import BookEditDisplay from './books/BookEdit_Display'

export default {

  name: 'Books',

  data () {
    return {
      metaVisible: false,
      colCount: 1
    }
  },

  components: {
    BooksToolbar,
    BooksGrid,
    BookMetaEdit,
    BookEditToolbar,
    BookEdit,
    BookEditHtml,
    BookEditJson,
    BookEditDisplay
  },

  methods: {

    toggleMetaVisible () {
      let doShow = !this.metaVisible
      if (doShow && this.hasBookSelected()) this.metaVisible = true
      else this.metaVisible = false
      this.recountRows()
    },

    hasBookSelected () {
      return !!this.$store.state.currentBookid
    },

    isEditMode () {
      return this.$store.state.route.path.indexOf('/books/edit') > -1
    },

    bookEditMode () {
      return this.$store.getters.bookEditMode
    },

    recountRows () {
      let count = 1
      if (this.hasBookSelected()) count++
      if (this.metaVisible) count++
      // console.log('Rows: '+ count)
      this.colCount = count
    }

  },

  watch: {
    '$store.state.route.params' (to, from) {
      // react to route changes...
      // console.log('Watching route: ',to,from)
      this.recountRows()
    }
  }
}
</script>

<style scoped>

 /*ul.nav.nav-tabs {margin-left: 3em; margin-top: 0; }*/

/* Nudge the whole page up a bit */
 #booksarea {
     margin: 0; padding:0; margin-top: -10px;
 }

 /*Book table or content area*/
 .contentarea {
   margin-top:10px;
 }

/* New layout table !! Oh yes I did! */
#bodytable {width: 100%; display: block; margin-top: 15px; display: table;}
#bodytable tr {width: 100%}
#bodytable td {vertical-align: top; }
#bodytable td.maincontent { overflow: hidden; max-width: 500px;}
#bodytable td.metaedit { width: 30%; min-width: 300px !important;}

/*Collapse bar to hide/show meta editor*/
td.collapseEditBar {
  width: 40px; min-width: 40px;
  padding: 13px;
  cursor: pointer;
  position: relative;
}
div.bar {
  width: 100%;
  background-color: rgba(204, 212, 226, .25);
  height: 100%; min-width: 2px;
  align-items: stretch; display: inline-block;
  border: .5px solid silver;
  border-radius: 8px;
  position: relative;
}
.collapsebtn {
  left: -8px; top:-18px; position: absolute;
  background: white; padding: 3px; border: .5px solid rgb(204, 212, 226);
  border-radius: 25px; padding-left:8px; padding-right: 5px; padding-top: 5px;
  box-shadow: 0px 0px 5px 1px rgba(0,0,0,0.2);
  color: rgba(204, 212, 226, 1);
  cursor: pointer;
  font-size: 1.25em;
}
.collapsebtn.fa-chevron-left {
  padding-left: 5px; padding-right: 8px;
}
.collapsebtn:hover {
  color: green;
}



/*
.clearfix:after {
  content: "";
  display: table;
  clear: both;
}

.scrollable {
  height: auto;
  overflow: hidden;
  backface-visibility: hidden;
  overflow-y: auto !important;
  will-change: overflow;
  width: 100%;
  display: flex;
  height: 100vh;
  position: relative;
  will-change: overflow;
}*/


</style>
