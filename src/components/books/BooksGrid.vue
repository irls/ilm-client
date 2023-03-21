<template>
  <div class="router-view-wrapper" v-cloak>
    <Grid id='books_grid'
      ref="books_grid"
      :data="booksMeta"
      :columns="headers"
      :rowsPerPage="100"
      @clickRow="rowClick"
      @dblClickRow="openBook"
      :selected="selectedBooks"
      :idField="idField"
      :filter-key="''"
      customEmptyTableText="No Books found" />
  </div>
  <!--<div class="router-view-wrapper"-->
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Grid from '../generic/Grid'
import { prepareForFilter, cleanDiacritics } from '@src/filters/search.js';

export default {

  name: 'BooksGrid',

  components: {
    Grid
  },

  data () {
    return {
      idField: 'bookid',
      selectedBooks: [],
      openBookClickCounter: 0,
      filterScrollTimer: null
    }
  },

  computed: {

    ...mapGetters([
      'allBooks',
      'adminOrLibrarian'
    ]),
    ...mapGetters({
      bookdFilters:   'gridFilters/booksFilters',
      filteredBooks: 'gridFilters/filteredBooks'
    }),

    booksMeta () { // because our grid does not work with nested values
      let result = []
      for (let book of this.filteredBooks) {
        if (book.importStatus == 'staging' && book.blocksCount <= 2){
          if (!book.hasOwnProperty('publishLog') || book.publishLog == null){
            book.importStatus = 'staging_empty'
          } else if (!book.publishLog.updateTime){
            book.importStatus = 'staging_empty'
          }
        }
        result.push(book)
      }
      return result
    },
    headers: {
      get() {
        let headers = [
          {
            title: 'Book Title',
            path: 'title',
            addClass: 'booktitle width-36-p',
            isPassFull: true,
            html (val) {
              const title = val.title.length ? val.title : val.bookid;
              if (val.collection_id) {
                return `<span data-tooltip="${title}"><i class='ico ico-collection'></i>&nbsp;&nbsp;${title}</span>`
              }
              return `<span data-tooltip="${title}"><i class='fa fa-book'></i>&nbsp;&nbsp;${title}</span>`
            }
          },
          {
            title: 'Author',
            path: 'author',
            addClass: 'author width-16-p',
            html(val) {
              const text = val && Array.isArray(val) ? val.join(', ') : val;
              return `<span data-tooltip="${text}">${text}</span>`;
            }
          },
          {
            title: 'Editor',
            path: 'executors',
            addClass: 'width-150',
            render(val) {
              return val && val.editor ? val.editor.title : '';
            }
          },
          {
            title: 'Published',
            path: 'pub_ver',
            addClass: 'width-135'
          },
          {
            title: 'Updated',
            path: 'cur_ver',
            addClass: 'width-135'
          },
          {
            title: 'Status',
            path: 'importStatus',
            addClass: 'width-100',
            render(val) {
              switch (val) {
                case 'staging_empty':
                  return 'No content';
                  break;
                case 'staging':
                  return 'Text Cleanup';
                  break;
                case 'narrating':
                  return 'Narration';
                  break;
                case 'proofing':
                  return 'Proofreading';
                  break;
                case 'mastering':
                  return 'Mastering';
                  break;
                case 'completed':
                  return 'Done';
                  break;
                default:
                  return val ? val : 'Book Import';
              }
            },
          }
        ];
        if (this.adminOrLibrarian) {
          headers.push({
            title: 'State',
            path: 'job_status',
            addClass: 'width-90',
            render(val) {
              switch (val) {
                case 'active':
                  return 'Active';
                case 'archived':
                  return 'Archived';
                case 'completed':
                  return 'Completed';
                case 'suspended':
                  return 'Suspended';
                default:
                  return val;
              }
            }
          });
        }
        return headers;
      },
      cache: false
    }
  },

  created () {
    this.selectedBooks = [this.$route.params.bookid];
  },

  mounted () {
    let loadBooks = new Promise((resolve, reject) => {
      if (this.allBooks.length === 0) {
        return this.updateBooksList()
          .then(() => {
            return resolve();
          })
      } else {
        return resolve();
      }
    });
    return loadBooks
    .then(()=>{
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.goToBookPage(this.$route.params.bookid);
        this.scrollToRow(this.$route.params.bookid);
      }
    })
    .catch((e)=>{
      console.error(e)
    })
  },

  watch: {
    '$route' () {
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.selectedBooks = [this.$route.params.bookid];
      } else {
        this.selectedBooks = [];
        if (this.$refs.books_grid) {
          this.$refs.books_grid.currentPage = 0;
        }
      }
    },
    booksFilters: {
      deep: true,
      handler(newVal, oldVal) {
        if (this.$route.params.hasOwnProperty('bookid')) {
          const bookid = this.$route.params.bookid;
          const found = this.filteredBooks.find((book)=>{
            return book.bookid === bookid;
          })
          if (found) {
            clearTimeout(this.filterScrollTimer);
            this.filterScrollTimer = setTimeout(()=>{
              this.goToBookPage(found.bookid);
              this.scrollToRow(found.bookid);
            }, 10)
          } else {
            if (this.$refs.books_grid) {
              this.$refs.books_grid.currentPage = 0;
              this.$router.replace({ path: '/books' });
            }
          }
        } else {
          if (this.$refs.books_grid) {
            this.$refs.books_grid.currentPage = 0;
          }
        }
      }
    }
  },

  methods: {
    ...mapActions(['updateBooksList']),
    // A row in the table has been clicked. Returns Vue data object bound to the row.
    rowClick (ev) {
      const bookid = ev.bookid;
      if (bookid) {
        this.$router.replace({ path: '/books/' + bookid }) // this triggers update to loadBook
        const book = this.filteredBooks.find(book=>book.bookid === bookid);
        if (book && book.collection_id) {
          this.$store.dispatch('loadCollection', book.collection_id);
        } else {
          this.$store.dispatch('loadCollection', false);
        }
      }
    },
    openBook (ev) {
      const bookid = ev.bookid;
      if (bookid) {
        this.$router.push('/books/' + bookid + '/display');
      }
    },
    goToBookPage (bookId) {
      if (this.$refs.books_grid) {
        //const index = this.cacheFiltered.findIndex((book)=>book.bookid === bookId);
        const index = this.$refs.books_grid.filteredData.findIndex((book)=>book.bookid === bookId);
        const page = Math.trunc(index / this.$refs.books_grid.rowsPerPage);
        this.$refs.books_grid.currentPage = page;
      }
    },
    scrollToRow(bookId) {
      let t = setTimeout(function() {
        let el = document.querySelector(`[data-id="${bookId}"]`);
        if (el) {
          el.scrollIntoView();
        }
      }, 300);
    },
  }

}
</script>


<style>
  #books_grid {
    /*width: 100%;*/
    /*height: 100%;*/
    min-width: 900px;
    padding-top: 4px;
  }

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
