<template>
  <div>
    <div class="collection-meta col-sm-12">
      <div class="col-sm-12" v-if="allowCollectionsEdit">
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
      </div>
      <linkBook v-if="linkBookModal"
        @close_modal="linkBookModal = false"
        :languages="languages"></linkBook>
    </div>
  </div>
</template>
<script>
  import {mapActions, mapGetters} from 'vuex';
  import LinkBook from './LinkBook';
  import { Languages } from "../../mixins/lang_config.js"
  export default {
    name: 'ManageCollection',
    data() {
      return {
        collection: {},
        linkBookModal: false
      }
    },
    components: {
      LinkBook: LinkBook
    },
    computed: {
      languages() {
        return Languages;
      },
      collectionBooksLength() {
        if (this.currentCollection.books instanceof Object) {
          return Object.keys(this.currentCollection.books).length;
        }
        return 0;
      },
      ...mapGetters(['currentCollection', 'allowCollectionsEdit'])
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
  
</style>