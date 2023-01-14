<template>
  <Grid id='books_grid'
    ref="books_grid"
    :data="booksMeta"
    :columns="headers"
    :rowsPerPage="100"
    @clickRow="rowClick"
    :selected="selectedBooks"
    :idField="idField"
    :filter-key="''">
  </Grid>
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
      'bookFilters',
      'allBooks',
      'adminOrLibrarian'
    ]),

    books () { // filtered list of books
      if (!this.allBooks.length) return [];
      let filteredbooks = this.allBooks
        .filter(book => (this.bookFilters.language == '' || book.language === this.bookFilters.language))
        .filter(book => this.bookFilters.jobStatus ? book.job_status === this.bookFilters.jobStatus : true)
        .filter(book => {
          const bookAuthors = Array.isArray(book.author) ? book.author.join('|') : book.author;
          let str = prepareForFilter(`${book.title} ${book.subtitle} ${bookAuthors} ${book.bookid} ${book.category}`); // ${book.description}
          let find = prepareForFilter(this.bookFilters.filter);
          return (str.indexOf(find) > -1)
        })
        .filter(book => {
          let str = prepareForFilter(`${book.hashTags} ${book.executors.editor._id} ${book.executors.editor.name} ${book.executors.editor.title}`);
          let find = prepareForFilter(this.bookFilters.projectTag);
          return (str.indexOf(find) > -1)
        })
        .filter(book => !book.collection_id)
      return filteredbooks
    },

    booksMeta () { // because our grid does not work with nested values
      let result = []
      for (let book of this.books) {
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
          {
            title: 'Editor',
            path: 'executors',
            render(val) {
              return val && val.editor ? val.editor.title : '';
            }
          },
          {
            title: 'Published',
            path: 'pub_ver'
          },
          {
            title: 'Updated',
            path: 'cur_ver'
          },
          {
            title: 'Status',
            path: 'importStatus',
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
            }
          }
        ];
        if (this.adminOrLibrarian) {
          headers.push({
            title: 'State',
            path: 'job_status',
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
    this.selectedBooks = [this.$route.params.bookid]
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
    bookFilters: {
      deep: true,
      handler(newVal, oldVal) {
        if (this.$route.params.hasOwnProperty('bookid')) {
          const bookid = this.$route.params.bookid;
          const found = this.books.find((book)=>{
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
      let bookid = ev.bookid
      if (bookid) {

        this.openBookClickCounter++;

        if(this.openBookClickCounter == 1) {
          this.timer = setTimeout(() => {
            this.openBookClickCounter = 0;
            this.$router.replace({ path: '/books/' + bookid }) // this triggers update to loadBook
          }, 300);

          return;
        }
        clearTimeout(this.timer);
        this.openBookClickCounter = 0;
	    //this.bookFilters.filter = '';
	    //this.bookFilters.projectTag = '';
        this.$router.push('/books/' + bookid + '/display')

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
    width: 100%;
    overflow-y: auto;
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
