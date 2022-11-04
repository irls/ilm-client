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
          <p>Published: Ver. DD Mon YYYY</p>
          <p>Unpublished: DD Mon YYYY</p>
          <button class="btn btn-primary" @click="publish">Publish</button>
        </fieldset>

    </div>
  </div>
</template>
<script>
  import {mapActions, mapGetters} from 'vuex';
  import LinkBook from './LinkBook';
  import { Languages } from "../../mixins/lang_config.js";
  import Grid from '../generic/Grid';
  import api_config     from '../../mixins/api_config.js';
  import axios from 'axios';

  export default {
    name: 'ManageCollection',
    data() {
      return {
        collection: {},
        linkBookModal: false,
        headers: [
          {title: 'Ready', path: 'ready', addClass: 'book-status',
            html (val) {
              switch(val) {
                case 'done' : {
                  return `<i class='fa fa-check' style="color: darkseagreen;"></i>`;
                } break;
                case 'error' : {
                  return `<i class='fa fa-warning' style="color: rgb(217 83 79);"></i>`;
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
        selectedBooks: []
      }
    },
    components: {
      LinkBook, Grid
    },
    mixins: [api_config],
    computed: {
      ...mapGetters(['currentCollection', 'allowCollectionsEdit']),

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
        if (this.currentCollection.books instanceof Object) {
          const res = this.currentCollection.books_list.map((book)=>{
            console.log(`book.publicationStatus: `, book.publicationStatus);
            console.log(`(book.isIntheProcessOfPublication || book.isInTheQueueOfPublication): `, (book.isIntheProcessOfPublication || book.isInTheQueueOfPublication));
            let publicationStatus = 'none';
            if (book.isIntheProcessOfPublication || book.isInTheQueueOfPublication) {
              publicationStatus = 'process';
            } else {
              switch(book.publicationStatus) {
                case 'done' : {
                  publicationStatus = 'done';
                } break;
                case '' : {
                  publicationStatus = 'none';
                } break;
                default : {
                  publicationStatus = 'error';
                } break;
              };
            }
console.log(`publicationStatus: `, publicationStatus);
            return {
              bookid: book.bookid,
              ready: publicationStatus,
              title: book.title,
              ver: book.pub_ver
            }
          });
          console.log(`booksGrid: `, res);
          return res;
        }
        return [];
      }
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
        console.log(`this.currentCollection: `, this.currentCollection);
        // this.isPublishing = false;
        // this.isPublishingQueue = true;
        return axios.post(this.API_URL + 'collection/' + encodeURIComponent(this.currentCollection.id) + '/publish')
        .then(resp => {
          if (resp.status == 200 && resp.data.ok) {
            //this.currentBook.isInTheQueueOfPublication = true;
            //this.currentBookMeta.isInTheQueueOfPublication = true;
          }
          console.log(resp);
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
