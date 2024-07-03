<template>
  <div class="router-view-wrapper" v-cloak>
    <Grid id='books_grid'
      ref="books_grid"
      :data="mapFilteredBooks"
      :columns="headers"
      :rowsPerPage="100"
      @clickRow="rowClick"
      @dblClickRow="openBook"
      :selected="selectedBooks"
      :idField="idField"
      :filter-key="''"
      :scrollTopOnPageClick="true"
      customEmptyTableText="No Books found" />
  </div>
  <!--<div class="router-view-wrapper"-->
</template>

<script>
import Vue from 'vue';
import { mapGetters, mapActions } from 'vuex'
import Grid from '../generic/Grid'
import { prepareForFilter, cleanDiacritics } from '@src/filters/search.js';
//import taskControls from '@src/mixins/task_controls.js';

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

  //mixins: [taskControls],

  computed: {

    ...mapGetters([
      'allBooks',
      'adminOrLibrarian',
      'isEditor',
      'isNarrator',
      'isProofer'
    ]),
    ...mapGetters({
      fltrChangeTrigger: 'gridFilters/fltrChangeTrigger',
      booksFilters:      'gridFilters/booksFilters',
      filteredBooks:     'gridFilters/filteredBooks'
    }),

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
              if (val.collection_id) { // data-tooltip="${title}"
                if (val.audioBlocksCount > 0) {
                  return `<span><i class='ico ico-book-collection-audio'></i>&nbsp;&nbsp;${title}</span>`
                }
                return `<span><i class='ico ico-book-collection'></i>&nbsp;&nbsp;${title}</span>`
              } // data-tooltip="${title}"
              if (val.audioBlocksCount > 0) {
                return `<span><i class='ico ico-book-single-audio'></i>&nbsp;&nbsp;${title}</span>`
              }
              return `<span><i class='ico ico-book-single'></i>&nbsp;&nbsp;${title}</span>`
            }
          },
          {
            title: 'Author',
            path: 'author',
            addClass: 'author width-16-p',
            html(val) {
              const text = val && Array.isArray(val) ? val.join(', ') : val;
              // data-tooltip="${text}"
              return `<span>${text}</span>`;
            }
          },
          {
            title: 'Editor',
            path: 'editor',
            addClass: 'width-150',
            //render(val) {
            //  return val && val.editor ? val.editor.title : '';
            //}
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
    },

    mapFilteredBooks() {
      return this.filteredBooks.map((book)=>{
        // need to remap for correct sorting by Grid component
        book.editor = (book.executors && book.executors.editor) ? book.executors.editor.title : '';
        return book;
      });
    }
  },

  mounted () {
    // let loadBooks = new Promise((resolve, reject) => {
    //   if (this.allBooks.length === 0) {
    //     return this.updateBooksList()
    //       .then(() => {
    //         return resolve();
    //       })
    //   } else {
    //     return resolve();
    //   }
    // });
    const loadBooks = Promise.resolve();
    return loadBooks
    .then(()=>{
      Vue.nextTick(()=>{
        if (this.$route && this.$route.params) {
          if (this.$route.params.hasOwnProperty('bookid')) {
            const selectedBookId = this.$route.params.bookid;
            this.initScroll(selectedBookId)
            .then((isOk)=>{
              if (isOk !== true) {
                this.filterScrollTimer = setTimeout(()=>{
                  this.initScroll(selectedBookId)
                }, 100)
              }
            })
          }
        }
      });
    })
    .catch((e)=>{
      console.error(e)
    })
  },

  watch: {
    '$route' (toRoute, fromRoute) {
      if (!this.$route.params.hasOwnProperty('bookid')) {
        this.selectedBooks = [];
        if (this.$refs.books_grid) {
          this.$refs.books_grid.currentPage = 0;
        }
      }
    },
    fltrChangeTrigger: {
      handler(newVal, oldVal) {
        Vue.nextTick(()=>{
          if (this.$route.params.hasOwnProperty('bookid')) {
            const bookid = this.$route.params.bookid;
            const [selectedBookId] = this.selectedBooks;
            const found = this.filteredBooks.find((book)=>{
              return book.bookid === bookid;
            })
            if (found) {
              clearTimeout(this.filterScrollTimer);
              this.filterScrollTimer = setTimeout(()=>{
                this.goToBookPage(bookid);
                if (!selectedBookId || (selectedBookId && selectedBookId !== bookid)) {
                  this.scrollToRow(bookid);
                  this.selectedBooks = [bookid];
                }
              }, 1)
            } else {
              this.goToBookPage();
              this.$router.replace({ name: 'Books' });
              this.selectedBooks = [];
            }
          } else {
            this.goToBookPage();
          }
        });
      }
    }
  },

  methods: {
    ...mapActions(['updateBooksList']),
    // A row in the table has been clicked. Returns Vue data object bound to the row.
    rowClick (book) {
      const bookid = book.bookid;
      if (bookid) {
        const book = this.filteredBooks.find(book=>book.bookid === bookid);
        if (book && book.collection_id) {
          this.$store.dispatch('loadCollection', book.collection_id);
        } else {
          this.$store.dispatch('loadCollection', false);
        }
        this.selectedBooks = [book.bookid];
        this.$router.replace({ path: '/books/' + bookid }) // this triggers update to loadBook
      }
    },
    openBook (book) {
      const bookid = book.bookid;
      if (bookid) {
        switch(true) {
          case this.adminOrLibrarian : case this.isEditor : {
            this.$router.replace({name: 'BookEdit', params: { bookid:bookid }});
          } break;
          case this.isNarrator : {
            this.$router.replace({name: 'BookNarrate', params: { bookid:bookid }});
          } break;
          case this.isProofer : {
            this.$router.replace({name: 'BookProofread', params: { bookid:bookid }});
          } break;
          default : {
            this.$router.replace({name: 'BookEditDisplay', params: { bookid:bookid }});
          } break;
        };
      }
    },
    goToBookPage (bookId = false) {
      if (this.$refs.books_grid) {
        if (bookId) {
          const index = this.$refs.books_grid.filteredData.findIndex((book)=>book.bookid === bookId);
          this.$refs.books_grid.goToIndex(index);
        } else {
          this.$refs.books_grid.goToIndex(0);
        }
        return true;
      }
      return false;
    },
    scrollToRow(bookId) {
      const el = document.querySelector(`[data-id="${bookId}"]`);
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'start'
        });
        return true;
      }
      return false;
    },
    async initScroll(selectedBookId) {
      let result = false;
      const found = this.filteredBooks.find((book)=>book.bookid == selectedBookId);
      if (found) {
        await Vue.nextTick();
        result = this.goToBookPage(selectedBookId);
        await Vue.nextTick();
        if (result) result = this.scrollToRow(selectedBookId);
        if (result) {
          this.selectedBooks = [selectedBookId];
          if (found.collection_id) {
            this.$store.dispatch('loadCollection', found.collection_id);
          }
        }
        return result;
      }
      this.$router.replace({ name: 'Books' });
      this.selectedBooks = [];
      return false;
    }
  }

}
</script>


<style>
  #books_grid {
    /*width: 100%;*/
    /*height: 100%;*/
    min-width: 900px;
    /*padding-top: 4px;*/
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
