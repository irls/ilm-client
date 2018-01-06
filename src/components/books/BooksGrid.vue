<template>
  <div>
    <Grid id='books_grid'
      :data="booksMeta"
      :columns="headers"
      :rowsPerPage="100"
      @clickRow="rowClick"
      :selected="selectedBooks"
      :idField="idField"
      :filter-key="''">
    </Grid>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Grid from '../generic/Grid'

export default {

  name: 'BooksGrid',

  components: {
    Grid
  },

  data () {
    return {
      headers: [
        {
          title: 'Book Title',
          path: 'title',
          addClass: 'booktitle',
          html (val) {
            return `<i class='fa fa-book'></i>&nbsp;&nbsp;${val}`
          }
        },
        {
          title: 'Author',
          path: 'author',
          addClass: 'author',
          render(val) {
            return val && Array.isArray(val) ? val.join(', ') : val;
          }
        },
        // {
        //   title: 'BookID',
        //   path: 'bookid',
        //   addClass: 'bookid'
        // },

        // {
        //   title: 'Subject',
        //   path: 'category',
        //   addClass: 'category'
        // },
        {
          title: 'Size',
          path: 'wordcount',
          render (val) {
            // return '~'+Math.round(val / 300) +'pg'
            return `${Math.round(val / 300)} pages`
          }
        },
        // {
        //   title: 'Difficulty',
        //   path: 'difficulty'
        // },
        {
          title: 'Published',
          path: 'published',
          html (val) {
            // return `<i class='fa ${(val ? 'fa-check-square-o' : 'fa-square-o')}></i>`
            // return "<i class='fa "+ (val ? "fa-check-square-o" : "fa-square-o") + "'></i>"
            return '<i class="fa ' + (val ? 'fa-check-square-o' : 'fa-square-o') + '"></i>'
          }
        },
        {
          title: 'Type',
          path: 'pubType'
        }
      ],
      idField: '_id',
      selectedBooks: []
    }
  },

  computed: {

    ...mapGetters([
      'bookFilters',
      'allBooks'
    ]),

    books () { // filtered list of books
      let filteredbooks = this.allBooks
        .filter(book => (book.language === this.bookFilters.language))
        .filter(book => book.importStatus === this.bookFilters.importStatus)
        .filter(book => {
          let str = `${book.title} ${book.bookid} ${book.category} ${book.description} ${book.subtitle} ${book.author}`.toLowerCase()
          let find = this.bookFilters.filter.toLowerCase().trim()
          return (str.indexOf(find) > -1)
        })
        .filter(book => !book.collection_id)
      return filteredbooks
    },

    booksMeta () { // because our grid does not work with nested values
      let result = []
      for (let book of this.books) result.push(book)
      return result
    }
  },

  created () {
    this.selectedBooks = [this.$route.params.bookid]
  },

  watch: {
    '$route' () {
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.selectedBooks = [this.$route.params.bookid]
      }
    }
  },

  methods: {
    // A row in the table has been clicked. Returns Vue data object bound to the row.
    rowClick (ev) {
      let bookid = ev.bookid
      if (bookid) {
        this.$router.replace({ path: '/books/' + bookid }) // this triggers update to loadBook
      }
    }
  }

}
</script>


<style>
  #books_grid tbody tr:hover {
    background-color: cornsilk  ;
  }
  #books_grid tbody tr.selected {
    background-color: darkseagreen  ;
  }
  #books_grid thead th {
    padding-right: 5px; margin-right:0;
    background-color: silver;
  }
  #books_grid thead th.act {
    background-color: gray;
  }
  #books_grid tbody td.booktitle {
    max-width: 300px;
    font-size: 1.25em;
  }
  #books_grid tbody td {
    overflow: hidden;
    white-space: nowrap;
    vertical-align: top;
  }
</style>
