<template>
  <div class="collection-meta col-sm-12">
    <div class="col-sm-12">
      <div class="coverimg" @click="changeCoverModal()">
        <img height="80" v-if="collectionImage" v-bind:src="collectionImage" />
        <div v-else class="coverimg-wrap"></div>
      </div>
    </div>
    <div class="col-sm-12">
      <i class="fa fa-book"></i>&nbsp;{{collection.title}}
    </div>
    <div class="col-sm-12">
      {{collectionBooksLength}} Books, {{collection.pages}} pages
    </div>
    <div class="col-sm-12" v-if="allowCollectionsEdit">
      <div class="col-sm-6">
        <button class="btn btn-default" v-on:click="linkBookModal = true">
          <i class="fa fa-plus"></i>&nbsp;Add to collection
        </button>
      </div>
      <div class="col-sm-6">
        <button class="btn btn-danger" v-on:click="onRemoveMessage = true">
          Remove collection
        </button>
      </div>
    </div>
    <div class="col-sm-12">
      <fieldset>
        <legend>
          Status
        </legend>
        <div class="col-sm-9">
          {{collection.state}}
        </div>
        <div class="col-sm-9">
          Version: {{collection.version ? collection.version : '1.0'}}
        </div>
        <div class="col-sm-9" v-if="collection.publishedVersion">
          Published version: {{collection.publishedVersion}}
        </div>
        <div class="col-sm-9" v-if="allowPublishCurrentCollection">
          <!-- <button class="btn btn-primary" v-on:click="publish()">Publish</button> -->
        </div>
      </fieldset>
    </div>
    <div class="col-sm-12">
      <div class="col-sm-4">Title</div>
      <div class="col-sm-8">
        <input type="text" v-model="collection.title" v-on:change="update('title', $event)" :disabled="!allowCollectionsEdit" :class="[{'has-error': hasTitleWarning}]"/>
        <span v-if="hasTitleWarning" class="error-message">Please define Collection title</span>
      </div>
      <div class="col-sm-4">Language</div>
      <div class="col-sm-8">
        <select class="form-control" v-model='collection.language' v-on:change="update('language', $event)" :disabled="!allowCollectionsEdit || collectionBooksLength > 0">
          <option v-for="(value, index) in languages" :value="index">{{ value }}</option>
        </select>
      </div>
    </div>
    <div class="col-sm-12">
      <fieldset>
        <legend>Description</legend>
        <textarea v-model="collection.description" v-on:change="update('description', $event)" :disabled="!allowCollectionsEdit"></textarea>
      </fieldset>
    </div>

    <linkBook v-if="linkBookModal"
      @close_modal="linkBookModal = false"
      :languages="languages"></linkBook>
    <modal v-model="onRemoveMessage" effect="fade" title="" ok-text="Remove" cancel-text="Cancel" @ok="remove()">
      <p>
        Remove {{collection.title}} Collection <template v-if="collection.books && collection.books.length">and unlink {{collection.books.length}} Books</template>?
      </p>
    </modal>
    <CollectionCoverModal ref="collectionCoverModal" @closed="resetCollectionImage"></CollectionCoverModal>
  </div>
</template>
<script>
  import _ from 'lodash';
  import superlogin from 'superlogin-client';
  import PouchDB from 'pouchdb';
  import {mapActions, mapGetters} from 'vuex';
  import LinkBook from './LinkBook';
  import api_config from '../../mixins/api_config';
  import { Languages }      from "../../mixins/lang_config.js"
  import {modal} from 'vue-strap';
  import CollectionCoverModal from './CollectionCoverModal';
  export default {
      name: 'CollectionMeta',
      data() {
        return {
          'collection': {},
          linkBookModal: false,
          onRemoveMessage: false,
          showCollectionCoverModal: false,
          collectionImage: ''
        }
      },
      components: {
        'LinkBook': LinkBook,
        'modal': modal,
        'CollectionCoverModal': CollectionCoverModal
      },
      mounted() {
        this.init();
      },
      mixins: [api_config],
      methods: {
        init() {
          if (this.currentCollection) {
            this.collection = Object.assign({}, this.currentCollection);
          } else {
            this.collection = {};
          }
          this.resetCollectionImage();
        },
        update: _.debounce(function (key, event) {
          this.liveUpdate(key, event.target.value)
        }, 300),
        change(field) {
          this.liveUpdate(field, this.collection[field]);
        },
        liveUpdate(field, value) {
          if (!this.allowCollectionsEdit) {
            return false;
          }
          let update = {};
          update[field] = value;
          return this.updateCollection(update)
            .then(() => {
              this.collection[field] = value;
            });
        },
        remove() {
          return this.removeCollection()
            .then((response) => {
              this.onRemoveMessage = false;
              if (response.status===200) {
                this.$emit('collectionRemoved');
                this.$router.replace({ path: '/collections' });
              } else {

              }
            }).catch((err) => {
              this.onRemoveMessage = false;
            });
        },
        publish() {
          let api_url = this.API_URL + 'collection/' + this.currentCollection._id + '/publish';
          let api = this.$store.state.auth.getHttp();
          let self = this;
          api.post(api_url, {}, {}).then(function(response){
            self.reloadCollection();
          }).catch((err) => {

          });
        },
        changeCoverModal() {
          this.$refs.collectionCoverModal.show();
        },
        resetCollectionImage() {
          this.collectionImage = '';
          if (this.currentCollection.coverimgURL) {
            this.collectionImage = this.currentCollection.coverimgURL + '?' + Date.now();
          }
        },
        ...mapActions(['reloadCollection', 'updateCollectionVersion', 'updateCollection', 'removeCollection'])
      },
      computed: {
        collectionBooksLength: {
          get() {
            return this.collection.books ? this.collection.books.length : 0;
          }
        },
        hasTitleWarning: {
          get() {
            return this.allowCollectionsEdit && (!this.collection.title || this.collection.title.length == 0);
          }
        },
        languages() {
          console.log('languages', Languages);
          //return Object.entries(Languages)
          return Languages;

        },

        ...mapGetters(['currentCollection', 'allowCollectionsEdit', 'allowPublishCurrentCollection'])
      },
      watch: {
        'currentCollection': {
          handler(val) {
            this.init();
          },
          deep: true
        }
      }
  }
</script>
<style lang="less">
  .collection-meta {
    /*position: fixed;
    width: 29%;*/
    height: 100%;
    overflow-y: auto;
    /*padding-top: 38px;*/
    fieldset {
      border:1px solid #b9b6b6;
      position:relative;
      margin-bottom:10px;
    }
    legend {
      width:auto;
      border-bottom:0;
      font-size:12px;
      margin-bottom:0;
    }
    textarea {
      width: 100%;
      border: none;
      resize: none;
      height: 100px;
    }
    .has-error {
      border: solid 1px red;
    }
    .error-message {
      margin: 0px;
    }
    .coverimg {
      padding:0; margin: 5px; margin-right: 8px;
      float: left;
      margin-left: 3px;
      margin-top: 10px;
      background: white;
      box-shadow: inset 0px 0px 3px 3px rgba(0,0,0,0.06);
      cursor: pointer;
      position: relative;
    }
    .coverimg-wrap {
      height: 80px;
      width: 60px;
    }
  }
  .collection-meta::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    border-radius: 10px;
    background-color: #F5F5F5;
  }
  .collection-meta::-webkit-scrollbar {
    width: 12px;
    background-color: #F5F5F5;
  }
  .collection-meta::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: #555;
  }
</style>
