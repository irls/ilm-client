<template>
  <div>
    <fieldset>
      <legend>Collection Metadata</legend>
      <table class="properties">
        <tr>
          <td>
            Collection ID
          </td>
          <td>
            {{collection._id}}
          </td>
        </tr>
        <tr>
          <td>
            Title
          </td>
          <td>
            <input v-model="collection.title"
                  v-on:change="update('title', $event)"
                  v-on:keydown="cleanError('title')"
                  :disabled="!allowCollectionsEdit"
                  :class="[{'-has-error': currentCollection.validationErrors.title}]"/>
            <span class="validation-error" v-if="currentCollection.validationErrors.title">{{ currentCollection.validationErrors.title}}</span>
          </td>
        </tr>
        <tr v-if="collection.language !== 'en'">
          <td>
            Title EN
          </td>
          <td>
            <input v-model="collection.title_en"
                  v-on:change="update('title_en', $event)"
                  v-on:keydown="cleanError('title_en')"
                  :disabled="!allowCollectionsEdit"
                  :class="[{'-has-error': currentCollection.validationErrors.title_en}]"/>
            <span class="validation-error" v-if="currentCollection.validationErrors.title_en">{{ currentCollection.validationErrors.title_en}}</span>
          </td>
        </tr>
        <tr>
          <td>
            Subtitle
          </td>
          <td>
            <input v-model="collection.subtitle" v-on:change="update('subtitle', $event)" :disabled="!allowCollectionsEdit" />
          </td>
        </tr>
        <tr class="author">
          <td>
            Author
          </td>
          <td>
            <div class="authors">
              <div class="author-row" v-if="collection.author && collection.author.length === 0">
                <input v-model="collection.author[0]"
                  v-on:change="update('author', $event)"
                  :disabled="!allowCollectionsEdit"
                  >
                <div class="dropdown" v-if="collection.author && collection.author.length === 0">
                  <div v-on:click="toggleShowUnknownAuthor()"
                    class="dropdown-button" >
                    <i class="fa fa-angle-down" ></i>
                  </div>
                  <div class="dropdown-content"
                    v-if="showUnknownAuthor && allowCollectionsEdit"
                    v-on:click="setUnknownAuthor()" >Unknown</div>
                </div>
              </div>
              <template v-for="(author, i) in collection.author" >
                <div class="author-row">
                  <input v-model='collection.author[i]' v-on:change="update('author', $event); " :disabled="!allowCollectionsEdit">
                  <div class="dropdown" v-if=" i == 0">
                    <div v-on:click="toggleShowUnknownAuthor()" class="dropdown-button">
                      <i class="fa fa-angle-down" ></i>
                    </div>
                    <div class="dropdown-content" v-if="showUnknownAuthor && allowCollectionsEdit"
                      v-on:click="setUnknownAuthor()" >Unknown</div>
                  </div>
                  <button v-if="i !== 0" v-on:click="removeAuthor(i)" :class="[{'disabled': i == 0 && collection.author.length == 1}, 'remove-author']">
                    <i class="fa fa-minus-circle" v-if="allowCollectionsEdit"></i>
                  </button>
                </div>
              </template>
              <button v-on:click="addAuthor" class="add-author" v-if="allowCollectionsEdit">
                <i class="fa fa-plus-circle"></i>
              </button>
            </div>
          </td>
        </tr>
        <tr class="author" v-if="collection.language !== 'en'">
          <td>
            Author EN
          </td>
          <td>
            <div class="authors">
              <div class="author-row">
                <input v-model="collection.author_en"
                  v-on:change="update('author_en', $event)"
                  :disabled="!allowCollectionsEdit"
                  :class="[{'-has-error': currentCollection.validationErrors.author_en}]"
                  >
                <div class="dropdown">
                  <div v-on:click="toggleShowUnknownAuthorEn()"
                    class="dropdown-button" >
                    <i class="fa fa-angle-down" ></i>
                  </div>
                  <div class="dropdown-content"
                    v-if="showUnknownAuthorEn && allowCollectionsEdit"
                    v-on:click="setUnknownAuthorEn()" >Unknown</div>
                </div>
                <span class="validation-error" v-if="currentCollection.validationErrors.author_en">{{ currentCollection.validationErrors.author_en}}</span>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td>
            Language
          </td>
          <td>
            <select class="form-control" v-model="collection.language"
              v-on:change="update('language', $event)"
              :disabled="!allowCollectionsEdit || collectionBooksLength > 0" >
              <option v-for="(value, key) in languages" :value="key">{{ value }}</option>
            </select>
          </td>
        </tr>
      </table>
    </fieldset>
    <fieldset class="properties">
      <legend>URL slug</legend>
      <input v-model="collection.slug"
            :class="['collection-slug', {'-is-manual': collection.slug_status === 0}, {'-has-error': currentCollection.validationErrors.slug}]"
            :disabled="!allowCollectionsEdit || (collection && collection.hasOwnProperty('pubVersionDate') && collection.pubVersionDate.length > 0)"
            v-on:change="update('slug', $event)" :title="collection.slug"
            v-on:keydown="cleanError('slug')"/>
      <span class="validation-error" v-if="currentCollection.validationErrors.slug">{{ currentCollection.validationErrors.slug}}</span>
    </fieldset>
    <fieldset>
      <table class="properties">
        <tr>
          <td>
            Category
          </td>
          <td>
            <select :class="['form-control', {'-has-error': currentCollection.validationErrors.category}]" v-model="collection.category" v-on:change="update('category', $event)" :disabled="!allowCollectionsEdit">
              <template v-for="(data, index) in bookCategories">
                <optgroup :label="data.group">
                  <option v-for="(value, ind) in data.categories" :value="value">{{ value }}</option>
                </optgroup>
              </template>
            </select>
            <span class="validation-error" v-if="currentCollection.validationErrors.category">{{ currentCollection.validationErrors['category'] }}</span>
          </td>
        </tr>
        <tr>
          <td>
            Difficulty
          </td>
          <td>
            <input
              v-model="collection.difficulty"
              v-on:change="updateDifficulty($event)"
              :disabled="!allowCollectionsEdit"
              :class="['number-text-input', {'-has-error': currentCollection.validationErrors.difficulty}]"
              v-on:keydown="validateNumberInput('difficulty', $event)"  />
            <span class="validation-error" v-if="currentCollection.validationErrors['difficulty']">{{ currentCollection.validationErrors['difficulty'] }}</span>
          </td>
        </tr>
        <tr>
          <td>
            Translator
          </td>
          <td>
            <input v-model="collection.translator" v-on:change="update('translator', $event)" :disabled="!allowCollectionsEdit" />
          </td>
        </tr>
        <tr>
          <td>
            Weight
          </td>
          <td>
            <input
              v-model="collection.weight"
              v-on:change="updateWeight($event)"
              :disabled="!allowCollectionsEdit"
              :class="['number-text-input', {'-has-error': currentCollection.validationErrors.weight}]"
              v-on:keydown="validateNumberInput('weight', $event)" />
            <span class="validation-error" v-if="currentCollection.validationErrors['weight']">{{currentCollection.validationErrors['weight']}}</span>
          </td>
        </tr>
      </table>
    </fieldset>
    <fieldset>
      <legend>Collection Cover</legend>
      <div class="coverimg" v-on:click="changeCoverModal()">
        <img height="80" v-if="collectionImage" v-bind:src="collectionImage" />
        <div v-else class="coverimg-wrap"></div>
      </div>
      <button class="btn btn-primary edit-coverimg" v-on:click="changeCoverModal()" v-if="allowCollectionsEdit">
        <i class="fa fa-pencil" ></i>
      </button>
    </fieldset>
    <fieldset>
      <legend>Description</legend>
      <resizable-textarea @valueChanged="descriptionValueChanged"
        :initValue="collection.description"
        ref="collectionDescription"
        :disabled="!allowCollectionsEdit">
      </resizable-textarea>
    </fieldset>
    <div class="collection-meta col-sm-12">
      <CollectionCoverModal ref="collectionCoverModal" @closed="resetCollectionImage"></CollectionCoverModal>
    </div>
  </div>
</template>
<script>
  import _ from 'lodash';
  import superlogin from 'superlogin-client';
  import PouchDB from 'pouchdb';
  import {mapActions, mapGetters} from 'vuex';
  import api_config from '../../mixins/api_config';
  import number_methods from '../../mixins/number_methods';
  import { Languages }      from "../../mixins/lang_config.js"
  import CollectionCoverModal from './CollectionCoverModal';
  import Vue from 'vue';
  import ResizableTextarea from '../generic/ResizableTextarea';
  export default {
      name: 'CollectionMeta',
      data() {
        return {
          'collection': {},
          showCollectionCoverModal: false,
          collectionImage: '',
          showUnknownAuthor: false,
          showUnknownAuthorEn: false,
          difficultyRange: [1, 14.99],
          weightRange: [1, 10.99],
          validationErrors: {
            difficulty: '',
            weight: ''
          }
        }
      },
      components: {
        'CollectionCoverModal': CollectionCoverModal,
        'resizable-textarea': ResizableTextarea
      },
      mounted() {
        this.init();
      },
      mixins: [api_config, number_methods],
      methods: {
        init() {
          if (this.currentCollection) {
            this.collection = Object.assign({}, this.currentCollection);
          } else {
            this.collection = {};
          }
          this.resetCollectionImage();
          this.$refs.collectionDescription.setValue(this.collection.description);
        },
        cleanError(key) {
          if (this.currentCollection.validationErrors
            && this.currentCollection.validationErrors[key]) {
            delete this.currentCollection.validationErrors[key];
          }
        },
        update(key, event) {
          let value = key === 'author' ? this.currentCollection.author : event.target.value;
          if (this.currentCollection.validationErrors
            && this.currentCollection.validationErrors[key]) {
            delete this.currentCollection.validationErrors[key];
          }
          this.liveUpdate(key, value);
        },
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
              this.collection.slug = this.currentCollection.slug;
              this.collection.slug_status = this.currentCollection.slug_status;
             });
        },
        publish() {
          /*let api_url = this.API_URL + 'collection/' + this.currentCollection._id + '/publish';
          let api = this.$store.state.auth.getHttp();
          let self = this;
          api.post(api_url, {}, {}).then(function(response){
            self.reloadCollection();
          }).catch((err) => {});*/
        },
        changeCoverModal() {
          if (!this.allowCollectionsEdit) {
            return false;
          }
          this.$refs.collectionCoverModal.show();
        },
        resetCollectionImage() {
          this.collectionImage = '';
          if (this.currentCollection.coverimgURL) {
            this.collectionImage = this.currentCollection.coverimgURL + '?' + Date.now();
          }
        },
        toggleShowUnknownAuthor(setValue = null) {
          if (setValue === null) {
            this.showUnknownAuthor = !this.showUnknownAuthor;
          } else {
            this.showUnknownAuthor = setValue ? true : false;
          }
        },
        toggleShowUnknownAuthorEn(setValue = null) {
          if (setValue === null) {
            this.showUnknownAuthorEn = !this.showUnknownAuthorEn;
          } else {
            this.showUnknownAuthorEn = setValue ? true : false;
          }
        },
        addAuthor() {
          this.collection.author.push('');
          this.liveUpdate('author', this.collection.author);
        },
        removeAuthor(i) {
          if (i > 0 || this.collection.author.length > 1) {
            this.collection.author.splice(i, 1);
            this.liveUpdate('author', this.collection.author);
          }
        },
        setUnknownAuthor() {
          this.toggleShowUnknownAuthor(false);
          this.collection.author[0] = 'Unknown';
          this.liveUpdate('author', this.collection.author);
        },
        setUnknownAuthorEn() {
          this.toggleShowUnknownAuthorEn(false);
          this.collection.author_en = 'Unknown';
          this.liveUpdate('author_en', this.collection.author_en);
        },
        updateDifficulty($event) {
          $event.target.value = ($event.target.value).replace(',', '.');
          let val = $event.target.value;
          if (!this.currentCollection.setValidateDifficulty(val)) {
            return false;
          }
          val = this.parseFloatToFixed(val, 2);
          return this.liveUpdate('difficulty', val);
        },
        updateWeight(event) {
          $event.target.value = ($event.target.value).replace(',', '.');
          let val = event.target.value;
          if (!this.currentCollection.setValidateWeight(val)) {
            return false;
          }
          val = this.parseFloatToFixed(val, 2);
          this.collection.weight = val;
          return this.liveUpdate('weight', val);
        },
        validateNumberInput(field, event) {
          //console.log(event.keyCode);
          //on:paste pastedData = e.clipboardData.getData('text')
          if (event && ![9, 13, 27].includes(event.keyCode)) {// tab, enter, esc
            event.target.classList.remove('-has-error');
            this.currentCollection.validationErrors[field] = '';
          }
          /*if ([101, 45].includes(event.keyCode)) {// keys: 'e', '-'
            event.preventDefault();
            return false;
          }
          if ([46, 44].includes(event.keyCode) && !event.target.value) {// keys: '.', ','
            event.preventDefault();
            return false;
          }*/
        },
        descriptionValueChanged(event) {
          return this.update('description', event);
        },
        ...mapActions(['reloadCollection', 'updateCollectionVersion', 'updateCollection'])
      },
      computed: {
        collectionBooksLength: {
          get() {
            if (this.currentCollection.books instanceof Object) {
              return Object.keys(this.currentCollection.books).length;
            }
            return 0;
          }
        },
        hasTitleWarning: {
          get() {
            return this.allowCollectionsEdit && (!this.collection.title || this.collection.title.length == 0);
          }
        },
        languages() {
          return Languages;
        },

        ...mapGetters(['currentCollection', 'allowCollectionsEdit', 'allowPublishCurrentCollection', 'bookCategories', 'currentCollectionId'])
      },
      watch: {
        'currentCollection': {
          handler(val, oldVal) {

            this.init();
            //if (this.$refs.collectionDescription) {
              //Vue.nextTick(() => {
                //this.$refs.collectionDescription.initSize();
              //});
            //}
          },
          deep: true
        }/*,
        'currentCollection._id': {
          handler() {
            if (this.$refs.collectionDescription) {
              Vue.nextTick(() => {
                this.$refs.collectionDescription.initSize();
              });
            }
          }
        }*/
      }
  }
</script>
<style scoped src='../books/css/BookProperties.css'></style>
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

  /* Properties editor area */
  table.properties {
    margin:0;
    padding:0;
    width:100%;
    font-size: 1em;
    border-collapse: separate;
    border-spacing: 3px;
    td {
      &:nth-child(1) {
        width: 30%;
        padding: 3px;
        margin:0;
      }
      &:nth-child(2) {
        width: auto;
        text-align: right !important;
      }
    }
    tr{
      &:nth-child(odd) {
        background-color: #F0F0F0;
      }
      &.author {
        .authors {
          display: table;
          width: 100%;
          border-collapse: unset;
          border-spacing: 0;
          .dropdown {
            padding: 0px 0px 0px 5px;
            width: 10%;
          }
          .author-row {
            display: table-row;
            input {
              display: table-cell;
              width: 90%;
            }
            .remove-author {
              display: table-cell;
              background: transparent;
              border: none;
              width: 10%;
            }
          }
          .add-author {
            background: transparent;
            border: none;
            width: 27px;
          }
          .dropdown-content {
            text-align: center;
          }
        }
      }
    }
  }

  table tr {border: 2px solid white}
  table tr.changed {border: 2px solid wheat}
  table tr input {font-size: 1em; width: 100%}
  .collection-slug {
    width: 100%;
    color: #999;
    &.-is-manual {
      color: #000;
    }
  }
  .coverimg {
    padding:0; margin: 5px; margin-right: 8px;
    float: right;
    margin-left: 3px;
    margin-top: 10px;
    background: white;
    box-shadow: inset 0px 0px 3px 3px rgba(0,0,0,0.06);
    cursor: pointer;
    position: relative;
    .coverimg-wrap {
      height: 80px;
      width: 60px;
    }
  }
  .edit-coverimg {
    float: right;
    margin-top: 10px;
    i {
      color: white;
    }
  }
  .collection-description {
    width: 100%;
  }
  .number-text-input::-webkit-outer-spin-button,
  .number-text-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  table.properties {
    input, select.form-control {
      &.-has-error {
        border: 2px solid red;
        outline-color: red;
      }
    }
    span.validation-error {
      width: 100% !important;
      color: red;
      float: left !important;
    }
  }
  fieldset.properties {
    span.validation-error {
      width: 100%;
      color: red;
      text-align: right;
      display: inline-block;
    }
  }
</style>
