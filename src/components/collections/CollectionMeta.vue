<template>
  <div class="collection-meta col-sm-12">
    <div class="col-sm-12">
      <i class="fa fa-book"></i>&nbsp;{{collection.title}}
    </div>
    <div class="col-sm-12">
      {{collection.books ? collection.books.length : '0'}} docs, {{collection.pages}} pages
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
      </fieldset>
    </div>
    <div class="col-sm-12">
      <div class="col-sm-4">Title</div>
      <div class="col-sm-8">
        <input type="text" v-model="collection.title" @input="update('title', $event)" :disabled="!allowCollectionsEdit"/>
      </div>
      <div class="col-sm-4">Language</div>
      <div class="col-sm-8">
        <select class="form-control" v-model='collection.language' @change="change('category')" :disabled="!allowCollectionsEdit">
          <option v-for="(value, index) in languages" :value="index">{{ value }}</option>
        </select>
      </div>
    </div>
    <div class="col-sm-12">
      <fieldset>
        <legend>Description</legend>
        <textarea v-model="collection.description" @input="update('description', $event)" :disabled="!allowCollectionsEdit"></textarea>
      </fieldset>
    </div>
    <div class="col-sm-12" v-if="allowPublishCurrentCollection">
      <fieldset>
        <legend>Publish</legend>
        
        <div class="col-sm-8">
          <button class="btn btn-primary" v-on:click="publish()">Publish</button>
        </div>
      </fieldset>
    </div>
    <linkBook v-if="linkBookModal"
      @close_modal="linkBookModal = false"
      :languages="languages"></linkBook>
    <modal v-model="onRemoveMessage" effect="fade" title="" ok-text="Remove" cancel-text="Cancel" @ok="remove()">
      <p>
        Remove {{collection.title}} Collection <template v-if="collection.books && collection.books.length">and unlink {{collection.books.length}} documents</template>?
      </p>
    </modal>
  </div>
</template>
<script>
  import _ from 'lodash';
  import superlogin from 'superlogin-client';
  import PouchDB from 'pouchdb';
  import {mapActions, mapGetters} from 'vuex';
  import LinkBook from './LinkBook';
  import api_config from '../../mixins/api_config';
  import {modal} from 'vue-strap';
  export default {
      name: 'CollectionMeta',
      data() {
        return {
          'collection': {},
          'languages': {
            en: 'English',
            es: 'Spanish',
            de: 'German',
            ru: 'Russian',
            ar: 'Arabic',
            fs: 'Farsi',
            zh: 'Chinese',
            ro: 'Romanian'
          },
          linkBookModal: false,
          onRemoveMessage: false
        }
      },
      components: {
        'LinkBook': LinkBook,
        'modal': modal
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
          var dbPath = superlogin.getDbUrl('ilm_collections')
          var db = new PouchDB(dbPath)
          this.collection[field] = value;
          return db.put(this.collection)
            .then(doc => {
              
            }).catch(err => {
              
            })
        },
        remove() {
          let api_url = this.API_URL + 'collection/' + this.currentCollection._id;
          let api = this.$store.state.auth.getHttp();
          let self = this;
          api.delete(api_url, {}, {}).then(function(response){
            self.onRemoveMessage = false;
            if (response.status===200) {
              self.$emit('collectionRemoved');
              self.$router.replace({ path: '/collections' });
            } else {

            }
          }).catch((err) => {
            self.onRemoveMessage = false;
          });
        },
        publish() {
          
        }
      },
      computed: {
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
    position: fixed;
    width: 29%;
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
  }
</style>