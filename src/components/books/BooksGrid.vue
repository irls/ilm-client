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
import Grid from '../generic/Grid'

export default {
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
          addClass: 'author'
        },
        {
          title: 'BookID',
          path: 'bookid',
          addClass: 'bookid'
        },

        // {
        //   title: 'Subject',
        //   path: 'category',
        //   addClass: 'category'
        // },
        // {
        //   title: 'Size',
        //   path: 'length',
        //   render (val) {
        //     // return '~'+Math.round(val / 300) +'pg'
        //     return `~${Math.round(val / 300)}pg`
        //   }
        // },
        // {
        //   title: 'Difficulty',
        //   path: 'difficulty'
        // },
        // {
        //   title: 'Published',
        //   path: 'published',
        //   html (val) {
        //     // return `<i class='fa ${(val ? 'fa-check-square-o' : 'fa-square-o')}></i>`
        //     // return "<i class='fa "+ (val ? "fa-check-square-o" : "fa-square-o") + "'></i>"
        //     return '<i class="fa ' + (val ? 'fa-check-square-o' : 'fa-square-o') + '"></i>'
        //   }
        // },
        // {
        //   title: 'Type',
        //   path: 'pubType'
        // }
      ],
      idField: '_id',
      selectedBooks: []
    }
  },
  components: {
    Grid
  },
  methods: {
    // A row in the table has been clicked. Returns Vue data object bound to the row.
    rowClick (ev) {
      // console.log(ev.bookid)
      let bookid = ev.bookid
      if (bookid) {
        this.selectedBooks = [bookid]
        this.$store.commit('setCurrentBook', bookid)
        this.$router.replace({ path: '/books/' + bookid })
      }
    }
    // setFilter (filter) {
      // filterQuery = filter.trim()
    // }
  },
  computed: {
    books () { // filtered list of books
      let state = this.$store.state
      let books = this.$store.getters.allBooks
      return books
        .filter(book => book.language === state.bookFilters.language)
        .filter(book => book.importStatus === state.bookFilters.importStatus)
        .filter(book => {
          let str = `${book.title} ${book.bookid} ${book.category} ${book.description} ${book.subtitle} ${book.author}` 
          str = str.toLowerCase()
          let find = state.bookFilters.filter.toLowerCase().trim()
          return (str.indexOf(find) > -1)
        })
    },
    booksMeta () { // because our grid does not work with nested values
      let result = []
      for (let book of this.books) result.push(book)
      return result
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
