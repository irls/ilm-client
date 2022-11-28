<template>
  <div>
    <div class="collection-meta col-sm-12">
      <div class="c-info-block">
        <h5 class="c-title">{{currentCollection.title}}</h5>
        {{collectionBooksLength}} books
      </div>
      <div v-if="allowCollectionsEdit" class="c-action-block">

        <div class="c-action-button">
          <button class="btn btn-primary" v-on:click="linkBookModal = true"><!--btn-default-->
            <i class="fa fa-plus"></i>&nbsp;Add to collection
          </button>
        </div>
        <div class="c-action-button">
          <button class="btn btn-danger" v-on:click="remove(true)">
            Remove collection
          </button>
        </div>

      </div>
      <linkBook v-if="linkBookModal"
        @close_modal="linkBookModal = false"
        :languages="languages"></linkBook>

        <fieldset>
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
            Published: Ver. {{pubVersion}} {{pubVersionDate}}
          </p>
          <p v-if="pubVersion !== currVersion">
            Unpublished: Ver. {{currVersion}} {{currVersionDate}}
          </p>
          <p>{{currentCollection.id}} - Q: {{currentCollection.isInTheQueueOfPublication}} - P: {{currentCollection.isPublished}}</p>
          <span v-if="currentCollection.isInTheQueueOfPublication" class="align-preloader -small"></span>
          <button v-else class="btn btn-primary" @click="publish">Publish</button>
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
                  return `<i class='fa fa-check' style="color: darkseagreen;"></i>`;
                } break;
                case 'error' : {
                  return `<i class='fa fa-warning' data-tooltip="${val.tooltip}" style="color: rgb(217 83 79);"></i>`;
                } break;
                case 'process' : {
                  return `<i class='fa fa-spinner fa-spin'></i>`;
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
        pubStatusErrors : ['error','failed','not found']
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
      booksGrid() {
        let books = [];
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
            return {
              bookid: book.bookid,
              ready: {
                status: publicationStatus,
                tooltip: book.publicationStatus
              },
              title: book.title,
              ver: 'v. '+ (book.version || '1.0')
            }
          });
          //console.log(`booksGrid: `, books);
        }

        //-- Search for published but removed books -- { --//
        let deletedBooks = [];
        if (this.currentCollection.pubBooksEntities
          && this.currentCollection.pubBooksEntities.length) {
          this.currentCollection.pubBooksEntities.forEach((pBook)=>{
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
          return ' ' + uDate.getDate() + ' ' + this.txt_months[uDate.getMonth()] + ' ' + uDate.getFullYear();
        }
        return '';
      },
      currVersionDate() {
        if (this.currentCollection.currVersionDate) {
          const uDate = new Date(this.currentCollection.currVersionDate);
          return ' ' + uDate.getDate() + ' ' + this.txt_months[uDate.getMonth()] + ' ' + uDate.getFullYear();
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
        if (this.currentCollection.currVersion && this.currentCollection.currVersion.length) {
          return this.currentCollection.currVersion;
        }
        return '1.0';
      },
    },
    methods: {
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

<style scoped>
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
</style>

<style>
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
