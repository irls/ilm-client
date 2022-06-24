<template>
  <Grid id='books_grid'
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

export default {

  name: 'BooksGrid',

  components: {
    Grid
  },

  data () {
    return {
      idField: 'bookid',
      selectedBooks: [],
      openBookClickCounter: 0
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
          let str = `${book.title} ${book.bookid} ${book.category} ${book.description} ${book.subtitle} ${book.author}`.toLowerCase()
          let find = this.bookFilters.filter.toLowerCase().trim()
          return (str.indexOf(find) > -1)
        })
        .filter(book => {
          let str = `${book.hashTags} ${book.executors.editor._id} ${book.executors.editor.name} ${book.executors.editor.title}`.toLowerCase()
          let find = this.bookFilters.projectTag.toLowerCase().trim()
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
    this.updateBooksList();
  },

  watch: {
    '$route' () {
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.selectedBooks = [this.$route.params.bookid]
      } else this.selectedBooks = [];
    }
  },

  methods: {
    ...mapActions(['updateBooksList']),
    // A row in the table has been clicked. Returns Vue data object bound to the row.
    rowClick (ev) {
      let bookid = ev.bookid
      console.log('ev.bookid', ev.bookid);
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
    }
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
