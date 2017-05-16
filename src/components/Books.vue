<template>
  <div id='booksarea' v-cloak>

    <div class='toolbar clearfix'>
      <BookEditToolbar v-if="isEditMode()" />
      <BooksToolbar v-else />
    </div>

    <table id='bodytable'>
      <tr :colspan="colCount">
        <td class='maincontent scrollable'>
          <template v-if="isEditMode()">
            <BookEdit v-if="bookEditMode()=='Editor'" />
            <BookEditHtml v-else-if="bookEditMode()=='HTML'" />
            <BookEditJson v-else-if="bookEditMode()=='JSON'" />
            <BookEditDisplay v-else="bookEditMode()=='Display'" />
          </template>
          <BooksGrid v-else />
        </td>
        <td class='collapseEditBar' @click='toggleMetaVisible' v-if='hasBookSelected()'>
          <div class="bar">
            <i :class="[metaVisible ? 'fa-chevron-right' : 'fa-chevron-left' , 'fa collapsebtn']" aria-hidden="true"></i>
          </div>
        </td>
        <td class='metaedit' v-if='metaVisible'>
          <book-meta-edit
            v-if='metaVisible'

          ></book-meta-edit>
          <!-- <BookMetaEdit v-if='metaVisible'/> -->
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
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
      metaAvailable: false,
      colCount: 1,
      currentBookId: this.$store.state.currentBookid
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

  computed: mapGetters(['bookEditMode', 'currentBook']),

  watch: {
    '$store.state.route.params' (to, from) {
      // react to route changes...
      // console.log('Watching route: ',to,from)
      this.recountRows()
    }
  },

  methods: {
    toggleMetaVisible () {
      let id = this.$store.state.currentBookid
      this.metaAvailable = id
      this.metaVisible = !this.metaVisible
      if (!this.metaAvailable) this.metaVisible = false;
      // let doShow = !this.metaVisible
      // if (doShow && this.$store.state.hasBookSelected()) this.metaVisible = true
      // else this.metaVisible = false
      // this.recountRows()
    },
    hasBookSelected () {
      return !!this.currentBook
    },
    isEditMode () {
      return this.$store.state.route.path.indexOf('/books/edit') > -1
    },
    bookEditMode () {
      return this.bookEditMode
    },
    recountRows () {
      let count = 1
      if (this.hasBookSelected()) count++
      if (this.metaVisible) count++
      // console.log('Rows: '+ count)
      this.colCount = count
    }

/*
  },

  watch: {
    '$store.state.route.params' (to, from) {
      // react to route changes...
      // console.log('Watching route: ',to,from)
      this.recountRows()
    }
  },

  created: function() {
    var vm=this
    this.$events.on('SET_CURRENTBOOK_EVENT', function(){
      //  console.log('WTH')
        vm.metaAvailable = true
        vm.currentBookId = vm.$store.state.currentBookid
     })
*/

  }
}
</script>

<style lang="stylus" scoped>
#booksarea
  margin: 0
  padding:0
  margin-top: -10px

.contentarea
  margin-top:10px

#bodytable
  width: 100%
  display: block
  margin-top: 15px
  display: table
  tr
    width: 100%
    td
      vertical-align: top
      &.maincontent
        overflow: hidden
        max-width: 500px
      &.metaedit
        width: 30%
        min-width: 300px!important
      &.collapseEditBar
        width: 40px
        min-width: 40px
        padding: 13px
        cursor: pointer
        position: relative
        .bar
          width: 100%
          background-color: rgba(204, 212, 226, .25)
          height: 100%
          min-width: 2px
          align-items: stretch
          display: inline-block
          border: .5px solid silver
          border-radius: 8px
          position: relative
          .collapsebtn
            left: -8px
            top: -18px
            position: absolute
            background: white
            padding: 3px
            border: .5px solid rgb(204, 212, 226)
            border-radius: 25px
            padding-left: 8px
            padding-right: 5px
            padding-top: 5px
            box-shadow: 0px 0px 5px 1px rgba(0,0,0,0.2)
            color: rgba(204, 212, 226, 1)
            cursor: pointer
            font-size: 1.25em
            .fa-chevron-left
              padding-left: 5px
              padding-right: 8px
            &:hover
              color: green

  </style>
