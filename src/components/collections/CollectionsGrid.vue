<template>
  <div id="books_grid">
     <Grid id='collections_grid'
      :data="bookCollections"
      :columns="headers"
      :rowsPerPage="100"
      @clickRow="rowClick"
      @dblClickRow="openCollection"
      :selected="selectedBooks"
      :idField="idField"
      :filter-key="''">
    </Grid>
    <!--<div v-for="collection in collectionsPage" class="collection-container">-->
      <!--<div v-on:click="rowClick(collection, $event)"
        :class="['collection-title collection-row', {'selected': currentCollection._id == collection._id}]"
        :data-id="collection._id">
        <span slot="header" class="collection-title" @click.prevent.self>
          <i class="fa fa-book"></i>&nbsp;
          {{collection.title + ' ' + collection.bookids.length + ' Books, ' + collection.pages + ' pages'}}
        </span>
      </div>-->
      <!--<Grid id='books_grid_grid'
          :data="collectionsPage"
          :columns="headers"
          :rowsPerPage="100"
          @clickRow="selectBook"
          @orderChanged="moveBook(collection, $event)"
          :selected="selectedBooks"
          :idField="'bookid'"
          :filter-key="''"
          :draggable="allowCollectionsEdit"
          :sortable="false"
          :ref="'grid-' + collection._id"
          :class="['collection-books-grid']"
          :customEmptyTableText="'No books'" />-->
    <!--</div>-->
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
      name: 'CollectionsGrid',
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
          if (collection._id !== this.currentCollection._id) {
            this.$emit('selectCollection', collection._id);
            this.$router.replace({ path: '/collections/' + collection._id })
          }
        },
        openCollection(collection, event) {
          const collectionId = collection._id;
          if (collectionId) {
            this.$router.push({ name: 'CollectionBooks', params: { collectionid: collectionId } });
          }
        },
        selectBook(book) {
          let bookid = book.bookid;
          if (bookid) {

            this.openBookClickCounter++;


            if(this.openBookClickCounter == 1) {
              this.timer = setTimeout(() => {
                this.openBookClickCounter = 0;
                this.selectedBooks = [book.bookid];
                this.$emit('selectBook', book.bookid, book.collection_id);
              }, 300);

              return;
            }
            clearTimeout(this.timer);
            //this.bookFilters.filter = '';
            //this.bookFilters.projectTag = '';
            this.openBookClickCounter = 0;
            this.$router.push('/books/' + book.bookid + '/display')
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
              let hasBook = this.selectedBooks.findIndex(b => {
                return b.bookid === this.$route.params.bookid;
              });
              if (hasBook === -1) {
                let book = this.allBooks.find(b => {
                  return b.bookid === this.$route.params.bookid;
                });
                if (book) {
                  this.selectBook(book);
                  this.scrollToRow(book.bookid);
                }
              }
            } else if (this.$route.params.collectionid) {
              this.scrollToRow(this.$route.params.collectionid);
            }
          }
          console.log(`bookCollections: `, this.bookCollections);
        })
      },
      computed: {
        ...mapGetters([
          'collectionsFilter',
          'bookCollections',
          'allBooks',
          'currentBookMeta',
          'currentCollection',
          'collectionsFilter',
          'allowCollectionsEdit',
          'adminOrLibrarian',
        ]),
        headers: {
          get() {
            let headers = [
              {
                title: 'Collection Title',
                path: 'title',
                addClass: 'booktitle',
                html (val) {
                  return `<i class='fa fa-book'></i>&nbsp;&nbsp;${val}`
                }
              },
              {
                title: 'Title EN',
                path: 'title_en',
                addClass: 'author',
                html (val) {
                  return `${val}`
                }
              },
              {
                title: 'Category',
                path: 'category',
                addClass: 'author',
                render(val) {
                  return val && Array.isArray(val) ? val.join(', ') : val;
                }
              }
            ];
            return headers;
          },
          //cache: false
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
        collectionsFilter: {
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
                this.$router.replace({ path: '/collections' });
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
    padding: 10px 5px;
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
