<template>
  <div class="collection-meta-wrap">
    <div class="collection-meta col-sm-12">
      <div class="c-info-block">
        <h5 class="c-title">{{currentCollection.title}}</h5>
        {{collectionBooksLength}} books
      </div>
      <div class="c-action-block">
        <div class="c-action-button">
          <button :disabled="!allowCollectionsEdit" class="btn btn-primary" v-on:click="linkBookModal = true"><!--btn-default-->
            <i class="fa fa-plus"></i>&nbsp;Add to collection
          </button>
        </div>
        <div class="c-action-button">
          <button :disabled="!allowCollectionsEdit" class="btn btn-danger" v-on:click="remove(true)">
            Unpublish Collection
          </button>
        </div>

      </div>
      <linkBook v-if="linkBookModal"
        @close_modal="linkBookModal = false"
        :languages="languages"></linkBook>

        <fieldset class="ready-books-list">
          <legend>Ready for publication</legend>
          <Grid id="books-in-collection"
            ref="books_in_collection"
            :data="booksGrid"
            :columns="headers"
            :rowsPerPage="100"
            :selected="selectedBooks"
            idField="bookid"
            />

        </fieldset>


        <fieldset class="c-publication-action">
          <legend>Publication</legend>
          <p v-if="pubVersion && pubVersion.length">
            Published: <b>Ver. {{pubVersion}}</b> <i class="p-margin-left">{{pubVersionDate}}</i>
          </p>
          <p v-if="!currentCollection.isPublished || hasReadyBooks">
            Unpublished: <b>Ver. {{currVersion}}</b> <i class="p-margin-left">{{currVersionDate}}</i>
          </p>

          <span v-if="currentCollection.isInTheQueueOfPublication" class="align-preloader -small"></span>
          <button v-else :disabled="isPubDisabled" class="btn btn-primary" @click="publish">Publish</button> <span style="color: white">{{currentCollection.id}} - Q: {{currentCollection.isInTheQueueOfPublication}} - P: {{currentCollection.isPublished}}</span>
        </fieldset>

    </div>
  </div>
</template>
<script>
  import {mapActions, mapGetters} from 'vuex';
  import LinkBook      from './LinkBook';
  import { Languages } from "../../mixins/lang_config.js";
  import api_config    from '../../mixins/api_config.js';
  import Grid          from '../generic/Grid';
  import axios         from 'axios';

  export default {
    name: 'ManageCollection',
    data() {
      return {
        collection: {},
        linkBookModal: false,
        headers: [
          {title: 'Ready', path: 'ready', addClass: 'book-status',
            html (val) {
              switch(val.status) {
                case 'done' : {
                  return `<i class='fa fa-check' data-tooltip="Ready for publication" style="color: darkseagreen;"></i>`;
                } break;
                case 'error' : {
                  return `<i class='fa fa-warning' data-tooltip="${val.tooltip}" style="color: rgb(217 83 79);"></i>`;
                } break;
                case 'process' : {
                  return `<i class='fa fa-spinner fa-spin' data-tooltip="Publishing..."></i>`;
                } break;
                default : {
                  return ``;
                } break;
              };
            }
          },
          {title: 'Book updates', path: 'title', addClass: 'book-title'},
          {title: 'Version', path: 'ver', addClass: 'book-version'},
        ],
        selectedBooks: [],
        txt_months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun",  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        pubStatusErrors : ['error','failed','not found'],
        isShowTime: true
      }
    },
    components: {
      LinkBook, Grid
    },
    mixins: [api_config],
    computed: {
      ...mapGetters(['currentCollection', 'allowCollectionsEdit', 'bookMetaById']),

      languages() {
        return Languages;
      },
      collectionBooksLength() {
        if (this.currentCollection.books instanceof Object) {
          return Object.keys(this.currentCollection.books).length;
        }
        return 0;
      },
      readyBooks() {
        let books = [];
        if (this.currentCollection.books instanceof Object) {
          books = this.currentCollection.books_list
          .filter((book)=>{
            return (book.isIntheProcessOfPublication
                 || book.isInTheQueueOfPublication
            );
          })
        }
        return books;
      },
      deletedBooks() {
        const { pubBooksEntities = [] } = this.currentCollection;
        let deletedBooks = [];
        if (pubBooksEntities.length) {
          pubBooksEntities.forEach((pBook)=>{
            if (this.currentCollection.bookids.indexOf(pBook.bookId) < 0) {
              const bookMeta = this.bookMetaById(pBook.bookId);
              if (bookMeta) {
                deletedBooks.push( pBook.bookId)
              }
            }
          })
        }
        return deletedBooks;
      },
      hasReadyBooks() {
        const books = this.readyBooks;
        const deletedBooks = this.deletedBooks;
        return [...books, ...deletedBooks].length > 0;
      },
      hasReadyOnlyPublished() {
        const books = this.readyBooks;
        const deletedBooks = this.deletedBooks;
        if (deletedBooks.length) return false;
        if (books.length) {
          const { pubBooksEntities = [] } = this.currentCollection;
          console.log(`pubBooksEntities: `, pubBooksEntities);
          const readyBooks = books.map((pBook)=>pBook.bookid);
          const pubBooks = pubBooksEntities.map((pBook)=>pBook.bookId);
          console.log(`pubBooks: `, pubBooks, readyBooks);
          return readyBooks.every((bookId)=>(pubBooks.indexOf(bookId) >= 0))
        }
        return false;
      },
      isPubDisabled() {
        return !(!this.currentCollection.isPublished || this.hasReadyBooks);
      },
      booksGrid() {
        let books = [];
        const { pubBooksEntities = [] } = this.currentCollection;
        if (this.currentCollection.books instanceof Object) {
          console.log(`this.currentCollection: `, this.currentCollection);
          books = this.currentCollection.books_list
          .filter((book)=>{
            return (book.isIntheProcessOfPublication
                 || book.isInTheQueueOfPublication
                 || (book.publicationStatus && this.pubStatusErrors.some((err)=>book.publicationStatus.toLowerCase().includes(err)))
                 || (book.version && book.version !== book.publishedVersion)
            );
          })
          .map((book)=>{
            let publicationStatus = 'none';
            if (book.isInTheQueueOfPublication) {
              publicationStatus = 'done';
            } else if (book.isIntheProcessOfPublication) {
              publicationStatus = 'process';
            } else {
              switch(book.publicationStatus) {
                case 'done' : {
                  //publicationStatus = 'done';
                } break;
                case '' : {
                  publicationStatus = 'none';
                } break;
                default : {
                  publicationStatus = 'error';
                } break;
              };
            }
            let version = 'v. '+ (book.version || '1.0');
            if (pubBooksEntities.length == 0 || !pubBooksEntities.find((pBook)=>pBook.bookId == book.bookid)) {
              version = 'New';
            }

            return {
              bookid: book.bookid,
              ready: {
                status: publicationStatus,
                tooltip: book.publicationStatus
              },
              title: book.title,
              ver: version
            }
          });
          //console.log(`booksGrid: `, books);
        }

        //-- Search for published but removed books -- { --//
        let deletedBooks = [];
        if (pubBooksEntities.length) {
          pubBooksEntities.forEach((pBook)=>{
            if (this.currentCollection.bookids.indexOf(pBook.bookId) < 0) {
              const bookMeta = this.bookMetaById(pBook.bookId);
              if (bookMeta) {
                deletedBooks.push({
                  bookid: pBook.bookId,
                  ready: {
                    status: 'done',
                    tooltip: ''
                  },
                  title: bookMeta.title,
                  ver: 'Removed'
                })
              }
            }
          })
        }
        //console.log(`deletedBooks = : `, deletedBooks);
        //-- } -- end -- Search for published but removed books --//
        return [...deletedBooks, ...books];
      },
      pubVersionDate() {
        //DD Mon YYYY
        if (this.currentCollection.pubVersionDate) {
          const uDate = new Date(this.currentCollection.pubVersionDate);
          return this.formatDate(uDate);
        }
        return '';
      },
      currVersionDate() {
        if (this.hasReadyBooks) {
          const uDate = new Date();
          return this.formatDate(uDate);
        }
        if (this.currentCollection.currVersionDate) {
          const uDate = new Date(this.currentCollection.currVersionDate);
          return this.formatDate(uDate);
        }
        return '';
      },
      pubVersion() {
        //DD Mon YYYY
        if (this.currentCollection.pubVersion && this.currentCollection.pubVersion.length) {
          return this.currentCollection.pubVersion;
        }
        return '1.0';
      },
      currVersion() {
        if (this.hasReadyBooks) {
          console.log(`hasReadyOnlyPublished: `, this.hasReadyOnlyPublished);
          const versions = this.pubVersion.split('.');
          if (versions && versions.length == 2) {
            if (this.hasReadyOnlyPublished) {
              versions[0] = parseInt(versions[0]);
              versions[1] = (parseInt(versions[1]) + 1);
            } else {
              versions[0] = (parseInt(versions[0]) + 1);
              versions[1] = 0;
            }
            return versions[0] + '.' + versions[1];
          }
        }
        if (this.currentCollection.currVersion && this.currentCollection.currVersion.length) {
          return this.currentCollection.currVersion;
        }
        return '1.0';
      },
    },
    methods: {
      formatDate(date) {
        return date.getDate() + ' ' + this.txt_months[date.getMonth()] + ' ' + date.getFullYear() + (this.isShowTime ? ` ${('0'+date.getHours()).slice(-2)}:${('0'+date.getMinutes()).slice(-2)}:${('0'+date.getSeconds()).slice(-2)}` : '');
      },
      remove(showMessage = false) {
        if (showMessage) {
          let booksLength = this.collectionBooksLength;
          this.$root.$emit('show-modal', {
            title: '',
            text: `Remove ${this.currentCollection.title} Collection${booksLength ? ' and unlink ' + booksLength + ' Books' : ''}?`,
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                },
                class: ['btn btn-default']
              },
              {
                title: 'Remove',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  this.remove(false);
                },
                class: ['btn btn-primary']
              }
            ]
          });
        } else {
          return this.removeCollection()
            .then((response) => {
              if (response.status===200) {
                this.$emit('collectionRemoved');
                this.$router.replace({ path: '/collections' });
              } else {

              }
            }).catch((err) => {
              console.log(err);
            });
        }
      },
      publish() {
        return axios.post(this.API_URL + 'collection/' + encodeURIComponent(this.currentCollection.id) + '/publish')
        .then(resp => {
          if (resp.status == 200 && resp.data.ok) {
            this.currentCollection.isInTheQueueOfPublication = true;
          }
        });
      },
      ...mapActions(['removeCollection'])
    }
  }
</script>

<style lang="less" scoped>
  .c-info-block {
    padding-left: 10px;
  }
  h5.c-title {
    font-weight: bold;
    margin-bottom: 5px;
  }
  .c-action-block {
    display: flex;
    width: 100%;
    justify-content: space-evenly;
    margin-top: 15px;
    margin-bottom: 15px;
  }
  .c-publication-action {
    padding: 10px;
  }
  i.p-margin-left {
    margin-left: 10px;
  }
  .collection-meta-wrap {
    height: 100%;
    .collection-meta {
      display: flex;
      flex-direction: column;

      .ready-books-list {
        flex: 1;
        overflow-y: auto;
        min-height: 100px;
      }
    }
  }
</style>

<style>
  #p-manageCollection {
    height: 100%;
  }
  #books-in-collection {
    /*max-height: 500px;*/
    overflow-y: auto;
  }
  #books-in-collection thead th {
    background-color: silver;
  }
  #books-in-collection thead tr {
    border: 1px solid white;
  }
  #books-in-collection table.table {
    margin-bottom: 0;
  }
  #books-in-collection thead .book-version {
    min-width: 82px;
  }
  #books-in-collection thead .book-status {
    width: 75px;
  }
  #books-in-collection td.book-status {
    text-align: center;
  }
  #books-in-collection td.book-title {
    max-width: 80px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
</style>
