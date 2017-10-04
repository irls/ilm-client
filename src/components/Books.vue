<template>
  <div id='booksarea' v-cloak>

    <table id='bodytable'>
      <tr>
        <td :colspan="metaVisible ? 1 : 2">
          <BookEditToolbar v-if="isEditMode()" />
          <BooksToolbar v-else @import_finished="bookImportFinished" />
        </td>
        <td v-if='hasBookSelected() && metaVisible'
            class='collapseEditBar visible'
            @click='toggleMetaVisible' rowspan="2">

          <div class="bar">
            <i :class="['fa-chevron-right' , 'fa collapsebtn']" aria-hidden="true"></i>
          </div>
        </td>
        <td class='metaedit' v-if='metaVisible' rowspan="2">
          <book-meta-edit v-if='metaVisible'></book-meta-edit>
        </td>
      </tr>
      <tr>
        <td class='maincontent scrollable'>
          <template v-if="isEditMode()">
            <BookEdit v-if="bookEditMode == 'Editor'" />
            <BookEditHtml v-else-if="bookEditMode == 'HTML'" />
            <BookEditJson v-else-if="bookEditMode == 'JSON'" />
            <BookEditDisplay v-else="bookEditMode == 'Display'" />
          </template>
          <BooksGrid v-else />
        </td>
        <td v-if='hasBookSelected() && !metaVisible'
            class='collapseEditBar'
            @click='toggleMetaVisible'>

          <div class="bar">
            <i :class="['fa-chevron-left' , 'fa collapsebtn']" aria-hidden="true"></i>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import BooksToolbar from './books/BooksToolbar'
import BookEditToolbar from './books/BookEditToolbar'
import BooksGrid from './books/BooksGrid'
import BookMetaEdit from './books/BookMetaEdit'
import BookEdit from './books/BookEdit'
import BookEditHtml from './books/BookEdit_HTML'
import BookEditJson from './books/BookEdit_JSON'
import BookEditDisplay from './books/BookEdit_Display'
import axios from 'axios'
import superlogin from 'superlogin-client'
import api_config from '../mixins/api_config.js'


export default {

  name: 'Books',

  data () {
    return {
      metaVisible: false,
      metaAvailable: false,
      //colCount: 1,
      currentBookid: this.$store.state.currentBookid
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
    BookEditDisplay,
    axios,
    superlogin
  },

  computed: mapGetters(['bookEditMode', 'currentBook']),

  watch: {
    '$store.state.route.params' (to, from) {
      // react to route changes...
      this.recountRows()
    }
  },
  mixins: [api_config],

  mounted() {
        // load intial book
        if (this.$route.params.hasOwnProperty('bookid')) {
            this.loadBook(this.$route.params.bookid)
            this.$router.replace({ path: '/books/' + this.$route.params.bookid })
        }
  },

  methods: {
    toggleMetaVisible () {
      let id = this.$store.state.currentBookid
      this.metaAvailable = id
      this.metaVisible = !this.metaVisible
      if (!this.metaAvailable) this.metaVisible = false;
    },
    hasBookSelected () {
      return !!this.currentBook
    },
    isEditMode () {
      return this.$store.state.route.path.indexOf('/books/edit') > -1
    },
//     recountRows () {
//       let count = 1
//       if (this.hasBookSelected()) count++
//       if (this.metaVisible) count++
//       this.colCount = count
//     },
    bookImportFinished(result) {

    },

    ...mapActions(['loadBook', 'updateBooksList'])
  }
}
</script>

<style lang="less">
#booksarea {
  margin: 0;
  padding:0;
  margin-top: -10px;

  .contentarea {
    margin-top:10px;
  }

  #bodytable {
    width: 100%;
    display: block;
    margin-top: 15px;
    display: table;
    tr {
      width: 100%;
      td {
        /*vertical-align: top;*/
        &.maincontent {
          overflow: hidden;
          max-width: 500px;
          padding-top: 3em;
        }
        &.metaedit {
          width: 30%;
          min-width: 300px!important;
          vertical-align: top
        }
        &.collapseEditBar {
          vertical-align: top;
          width: 40px;
          min-width: 40px;
          height: 100%;
          /*padding: 13px*/
          padding-top: 23px;
          padding-left: 8px;
          cursor: pointer;
          position: relative;

          .bar {
            width: 100%;
            min-width: 2px;
            height: 100%;
            background-color: rgba(204, 212, 226, .25);
            position: relative;

            .collapsebtn {
              position: fixed;
              background: white;
              padding: 5px 5px 3px 8px;
              border: .5px solid rgb(204, 212, 226);
              border-radius: 25px;
              box-shadow: 0px 0px 5px 1px rgba(0,0,0,0.2);
              color: rgba(204, 212, 226, 1);
              cursor: pointer;
              font-size: 1.25em;

              &.fa-chevron-left {
                padding-left: 5px;
                padding-right: 8px;
              }
              &:hover {
                color: green;
              }
            }
          }
          &.visible {
            .fa-chevron-right {
              margin-top: 50px;
              margin-left: -3px;
            }
          }
        }
      }
    }
  }
}
</style>
