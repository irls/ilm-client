<template>
  <div>
    <div class="collection-meta col-sm-12">
      <div >
        {{collectionBooksLength}} Books, {{collection.blocksCount}} pages
      </div>
      <div v-if="allowCollectionsEdit">
        <fieldset>
          <legend>Ready for publication</legend>
          <div class="col-sm-6">
            <button class="btn btn-default" v-on:click="linkBookModal = true">
              <i class="fa fa-plus"></i>&nbsp;Add to collection
            </button>
          </div>
          <div class="col-sm-6">
            <button class="btn btn-danger" v-on:click="remove(true)">
              Remove collection
            </button>
          </div>
        </fieldset>
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


        <fieldset>
          <legend>Publication</legend>
        </fieldset>

    </div>
  </div>
</template>
<script>
  import {mapActions, mapGetters} from 'vuex';
  import LinkBook from './LinkBook';
  import { Languages } from "../../mixins/lang_config.js"
  import Grid from '../generic/Grid';
  export default {
    name: 'ManageCollection',
    data() {
      return {
        collection: {},
        linkBookModal: false,
        headers: [
          {title: 'Ready', path: 'bookid'},
          {title: 'Book updates', path: 'title'},
          {title: 'Version', path: 'ver', addClass: 'book-version',},
        ],
        selectedBooks: []
      }
    },
    components: {
      LinkBook, Grid
    },
    computed: {
      ...mapGetters(['currentCollection', 'allowCollectionsEdit']),

      languages() {
        return Languages;
      },
      collectionBooksLength() {
        console.log(`this.currentCollection: `, this.currentCollection);
        console.log(`this.books_list: `, this.currentCollection.books_list);
        if (this.currentCollection.books instanceof Object) {
          return Object.keys(this.currentCollection.books).length;
        }
        return 0;
      },
      booksGrid() {
        if (this.currentCollection.books instanceof Object) {
          const res = this.currentCollection.books_list.map((book)=>{
            return {
              bookid: book.bookid,
              ready: '1',
              title: book.title,
              ver: book.cur_ver
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
      ...mapActions(['removeCollection'])
    }
  }
</script>
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
</style>
