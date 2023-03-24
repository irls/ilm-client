<template>
  <div id="books_grid">
    <div v-for="collection in collectionsPage" class="collection-container">
      <div v-on:click="rowClick(collection, $event)"
        :class="['collection-title collection-row', {'selected': currentCollection._id == collection._id}]"
        :data-id="collection._id">
        <span slot="header" class="collection-title" @click.prevent.self>
          <i class='ico ico-collection'></i>&nbsp;
          {{collection.title + ' ' + collection.bookids.length + ' Books, ' + collection.pages + ' pages'}}
        </span>
      </div>
      <Grid id='books_grid_grid'
          v-if="isOpenPanel(collection)"
          :data="collection.books_list"
          :columns="headers"
          :rowsPerPage="100"
          @clickRow="selectBook"
          @dblClickRow="openBook"
          @orderChanged="moveBook(collection, $event)"
          :selected="selectedBooks"
          :idField="'bookid'"
          :filter-key="''"
          :draggable="allowCollectionsEdit"
          :sortable="false"
          :ref="'grid-' + collection._id"
          :class="['collection-books-grid']"
          customEmptyTableText="No Books found" />
    </div>
  </div>
</template>
<script>
  import Grid from '../generic/Grid';
  import { mapGetters, mapActions } from 'vuex';
  import Vue from 'vue';
  import superlogin from 'superlogin-client';
  import PouchDB from 'pouchdb';
  import lodash from 'lodash';
  import { prepareForFilter, cleanDiacritics } from '@src/filters/search.js';

  export default {
      name: 'CollectionGrid',
      props: {

      },
      components: {
        Grid: Grid
      },
      data() {
        return {
          idField: '_id',
          selectedBooks: [],
          openBookClickCounter: 0
        }
      },
      methods: {
        rowClick(collection, event) {
          console.log(`rowClick: `, collection._id, this.currentCollection._id);
          //if (collection._id !== this.currentCollection._id) {
            //this.$emit('selectCollection', collection._id);
            this.selectedBooks = [];
            this.$router.replace({ name: 'CollectionBooks' });
          //}
          /*else if (this.selectedBooks.length) {
            this.selectedBooks = [];
            this.$router.replace({ path: '/collections/' + collection._id })
          }*/
        },
        selectBook(book) {
          const bookid = book.bookid;
          const currentId = this.currentCollection._id;
          this.selectedBooks = [book.bookid];
          this.$router.push({ name: 'CollectionBook', params: { collectionid: currentId, bookid: bookid} })
        },
        openBook(book) {
          this.$router.push({ name: 'CollectionBookEditDisplay', params: { collectionid: this.currentCollection._id, bookid: this.selectedBooks[0] } });
        },
        scrollToRow(bookId) {
          let t = setTimeout(function() {
            let el = document.querySelector(`[data-id="${bookId}"]`);
            if (el) {
              el.scrollIntoView();
            }
          }, 300);
        },
        isOpenPanel(collection) {
          if (this.currentCollection._id) {
            return this.currentCollection._id === collection._id;
          }
          return collection.book_match || collection.bookids.indexOf(this.currentBookMeta.bookid) !== -1;
        },
        moveBook(collection, data) {
          if (this.allowCollectionsEdit
            && typeof data.from !== 'undefined'
            && typeof data.to !== 'undefined'
            && data.from != data.to) {
          }
        },
        ...mapActions(['updateBooksList'])
      },
      mounted() {
        this.updateBooksList()
        .then(()=>{
          if (this.$route && this.$route.params) {
            if (this.$route.params.bookid) {
              this.selectedBooks = [this.$route.params.bookid];
              this.scrollToRow(this.$route.params.bookid);
//               let hasBook = this.selectedBooks.findIndex(b => {
//                 return b.bookid === this.$route.params.bookid;
//               });
//               if (hasBook === -1) {
//                 let book = this.allBooks.find(b => {
//                   return b.bookid === this.$route.params.bookid;
//                 });
//                 if (book) {
//                   this.selectBook(book);
//                   this.scrollToRow(book.bookid);
//                 }
//               }
            } /*else if (this.$route.params.collectionid) {
              this.scrollToRow(this.$route.params.collectionid);
            }*/
          }
        })
      },
      computed: {
        ...mapGetters([
          'bookCollections',
          'allBooks',
          'currentBookMeta',
          'currentCollection',
          'collectionsFilters',
          'allowCollectionsEdit',
          'adminOrLibrarian',
        ]),
        ...mapGetters({
          booksFilters:       'gridFilters/booksFilters',
          collectionsFilters: 'gridFilters/collectionsFilters',
          filteredBooks:      'gridFilters/filteredCollectionBooks'
        }),
        collectionsPage: {
          cache: true,
          get() {
            if (!this.bookCollections || !this.bookCollections.length) {
              return [];
            }
            const currentId = this.currentCollection._id;
            const collections = this.bookCollections.reduce((acc, curr)=>{
              if (curr._id === currentId) {
                let cloneCurr = lodash.cloneDeep(curr);
                cloneCurr.book_match = false;
                acc.push(cloneCurr);
              }
              return acc;
            }, []);

            if (collections.length == 0) {
              return collections;
            }

            collections[0].books_list = this.filteredBooks;

            /*for (const field in this.collectionsFilters) {
              if (this.collectionsFilters[field].length > 0) {
                let filter = prepareForFilter(this.collectionsFilters[field]);
                switch (field) {
                  case 'title':
                    collections = collections.filter(collection => {
                      let match = prepareForFilter(collection.title).indexOf(filter) !== -1;
                      if (!match) {
                        collection.books_list = collection.books_list.filter(book => {
                          const bookAuthors = Array.isArray(book.author) ? book.author.join('|') : book.author;
                          let str = prepareForFilter(`${book.title} ${book.subtitle} ${bookAuthors} ${book.bookid} ${book.category}`); // ${book.description}
                          return (str.indexOf(filter) > -1)
                        });
                      }
                      let book_match = !match && collection.books_list.length > 0;
                      collection.match = match;
                      collection.book_match = book_match;
                      return match || book_match;
                    });
                    break;
                  case 'language':
                    collections = collections.filter(collection => {
                      return collection.language == filter;
                    });
                    break;
                  case 'jobStatus':
                    collections = collections.filter(collection => {
                      if (!collection.books_list) return false;
                      collection.books_list = collection.books_list.filter(b => {
                        return b.job_status === filter;
                      });
                      return collection.books_list.length > 0;
                    });
                    break;
                  case 'projectTag':
                    collections = collections.filter(collection => {
                      collection.books_list = collection.books_list.filter(b => {
                        let str = prepareForFilter(`${b.hashTags} ${b.executors.editor._id} ${b.executors.editor.name} ${b.executors.editor.title}`)
                        return (str.indexOf(filter) > -1)
                      });
                      let book_match =  collection.books_list.length > 0;
                      collection.match = book_match;
                      collection.book_match = book_match;
                      return book_match;

                    });
                    break;

                }
              }
            }*/
            return collections;
          }
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
                  return `<span data-tooltip="${val.title}"><i class='ico ico-collection'></i>&nbsp;&nbsp;${val.title}</span>`
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
                addClass: 'width-100',
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
      watch: {
        currentBookMeta: {
          handler() {
            if (this.currentBookMeta.bookid) {
              this.selectedBooks = [this.currentBookMeta.bookid];
            }
          },
          deep: true
        },
        currentCollection: {
          handler(val, oldVal) {
            if(val._id && !oldVal._id) {

            }
          }
        },
        collectionsFilters: {
          deep: true,
          handler(newVal, oldVal) {
            if (this.$route.params.hasOwnProperty('bookid')) {
              const bookid = this.$route.params.bookid;
              const collectionid = this.$route.params.collectionid;
              const found = this.collectionsPage.find((collection)=>{
                return collection.bookids.find((book)=>{
                  return book === bookid;
                })
              })
              if (found) {
                this.scrollToRow(bookid);
              } else {
                if (collectionid) {
                  this.$router.replace({ name: 'CollectionBooks', params: {
                    collectionid: collectionid
                  } });
                } else {
                  this.$router.replace({ name: 'Collections' });
                }
              }
            } else {
              this.selectedBooks = []; // clean old selection
            }
          }
        }
      }
  }
</script>
<style lang="less">
  .collection-row {
    position: inherit;
    /*i.fa-book {
      position: absolute;
      top: 10px;
      left: 5px;
    }*/
    .panel-title {
      margin-left: 10px;
    }
    &.selected {
      .panel-heading {
        background-color: #c6c2c2;
      }
    }
    .panel-heading {
      &.selected {
        background-color: #c6c2c2;
      }
    }
  }
  body.modal-open {
    .collection-row {
        position: inherit;
    }
  }
  div.collection-title {
    padding: 3px 5px 10px 5px;
    background-color: #f5f5f5;
    border-color: #ddd;
    color: #333;
    cursor: pointer;
    &.selected {
      background-color: #c6c2c2;
    }
  }
  div.collection-container {
    border: 1px solid #ddd;
    div.collection-books-grid {
      padding: 0px 15px;
    }
  }
</style>
