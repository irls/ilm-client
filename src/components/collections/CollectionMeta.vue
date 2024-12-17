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
          <td colspan="2">
            <BookAuthors 
            :author_link="currentCollection.author_link"
            :requiredFields="currentCollection.validationErrors"
            :allowMetadataEdit="allowCollectionsEdit"
            @addAuthorLink="addAuthorLink"
            @removeAuthorLink="removeAuthorLink"
            @editAuthorLink="editAuthorLink"
            @verifyAuthor="verifyAuthor"
            @changeAuthorLink="changeAuthorLink"
            @addAuthor="addAuthor" />
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
          <td>Reader category</td>
          <td class="category-wrapper">
            <select :class="['form-control', {'-has-error': currentCollection.validationErrors['category']}]" v-model="readerCategory" :disabled="!allowCollectionsEdit">
              <!--<template v-for="(data, index) in bookCategories">-->
                <!--<optgroup :label="data.group">-->
                  <option v-for="(value, ind) in bookCategories.reader" :value="value">{{ value }}</option>
                <!--</optgroup>-->
              <!--</template>-->
            </select>
            <i class="ico ico-clear-filter btn-inside" aria-hidden="true"
              v-if="allowCollectionsEdit && collection.alt_meta.reader.category"
              @click="clearReaderCategory(true)"></i>
            <span class="validation-error" v-if="currentCollection.validationErrors['category']">{{ currentCollection.validationErrors['category'] }}</span>
          </td>
        </tr>
        <tr>
          <td>Ocean category</td>
          <td class="category-wrapper">
            <select :class="['form-control', {'-has-error': currentCollection.validationErrors['category']}]" v-model="collection.alt_meta.ocean.category" v-on:change="update('alt_meta.ocean.category', $event)" :disabled="!allowCollectionsEdit">
              <!--<template v-for="(data, index) in bookCategories">-->
                <!--<optgroup :label="data.group">-->
                  <option v-for="(value, ind) in bookCategories.ocean" :value="value">{{ value }}</option>
                <!--</optgroup>-->
              <!--</template>-->
            </select>
            <i class="ico ico-clear-filter btn-inside" aria-hidden="true"
              v-if="allowCollectionsEdit && collection.alt_meta.ocean.category"
              @click="collection.alt_meta.ocean.category = null; update('alt_meta.ocean.category', {target:{value:''}})"></i>
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
  import {mapActions, mapGetters} from 'vuex';
  import api_config from '../../mixins/api_config';
  import number_methods from '../../mixins/number_methods';
  import { Languages }      from "../../mixins/lang_config.js"
  import CollectionCoverModal from './CollectionCoverModal';
  import ResizableTextarea from '../generic/ResizableTextarea';
  import BookAuthors from '../books/details/BookAuthors.vue';
  export default {
      name: 'CollectionMeta',
      data() {
        return {
          collection: {alt_meta:{ reader:{category: null}, ocean:{category: null}}},
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
        'resizable-textarea': ResizableTextarea,
        'BookAuthors': BookAuthors
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
          //console.log(`this.currentCollection::: `,this.currentCollection);
          this.resetCollectionImage();
          if (!document.activeElement || !document.activeElement.classList.contains('resizable-textarea')) {
            this.$refs.collectionDescription.setValue(this.collection.description);
          }
          this.getAuthorsList({ lang: this.collection.language || 'en' });
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
          let keys = key.split('.');
          if (keys[0] == 'alt_meta' && keys.length == 3) { // case of .alt_meta.ocean.category
            if (keys[2] == 'category') {
              try {
                delete this.currentCollection.validationErrors['category'];
              } catch (err) {}
            }
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
          let keys = field.split('.');
          if (keys[0] == 'alt_meta' && keys.length == 3) { // case of .alt_meta.ocean.category
            update[keys[0]] = this.currentCollection[keys[0]] || {};
            update[keys[0]][keys[1]] = this.currentCollection[keys[0]][keys[1]] || {};
            update[keys[0]][keys[1]][keys[2]] = (value !== '' ? value : null);
          } else {
            update[field] = value;
          }
          return this.updateCollection(update)
          .then((response) => {
            this.currentCollection[field] = field !== "author_link" ? value : response[field];
            this.collection = Object.assign({}, this.currentCollection);
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
        addAuthor(addedAuthor, authorIndex) {
          if (addedAuthor && addedAuthor.id) {
            if (this.collection.language !== "en") {
              let nameLang = addedAuthor.name_lang.find(name_lang => {
                return name_lang.language === this.collection.language;
              });
              this.collection.author_link[authorIndex] = {
                name: nameLang ? nameLang.name : "",
                name_en: addedAuthor.name,
                id: addedAuthor.id,
                slug: addedAuthor.slug
              };
            } else {
              this.collection.author_link[authorIndex] = {
                name: addedAuthor.name,
                slug: addedAuthor.slug,
                id: addedAuthor.id
              };
            }
            this.liveUpdate('author_link', this.collection.author_link);
          }
        },
        addAuthorLink(author) {
          this.liveUpdate('author_link', this.collection.author_link);
        },
        removeAuthorLink(ev, i) {
          this.liveUpdate('author_link', this.collection.author_link);
        },
        editAuthorLink(ev, i, field) {
          this.liveUpdate('author_link', this.collection.author_link);
        },
        changeAuthorLink(ev, i) {
          this.liveUpdate('author_link', this.collection.author_link);
        },
        verifyAuthor(author, author_en) {
          this.liveUpdate('author_link', this.collection.author_link);
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
        updateWeight($event) {
          $event.target.value = ($event.target.value).replace(',', '.');
          let val = $event.target.value;
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
        clearReaderCategory(check = true) {
          if (check && Array.isArray(this.currentCollection.bookids) && this.currentCollection.bookids.length > 0) {
            this.$root.$emit('show-modal', {
              title: 'Remove Category and Genres',
              text: 'Remove Collection Category and Book Genres?',
              buttons: [
                {
                  title: 'Cancel',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                  },
                },
                {
                  title: 'Remove',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                    this.clearReaderCategory(false);
                  },
                  'class': 'btn btn-primary'
                }
              ],
              class: ['align-modal']
            });
          } else {
            this.collection.alt_meta.reader.category = null;
            this.update('alt_meta.reader.category', {target:{value:''}});
          }
        },
        ...mapActions(['reloadCollection', 'updateCollectionVersion', 'updateCollection']),
        ...mapActions('authorsMapModule', ['getAuthorsList'])
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

        readerCategory: {
          get() {
            return this.collection.alt_meta.reader.category;
          },
          set(category) {
            if (!this.collection.alt_meta.reader.category && category && category !== this.collection.alt_meta.reader.category) {
              if (Array.isArray(this.currentCollection.bookids) && this.currentCollection.bookids.length > 0) {
                return this.$root.$emit('show-modal', {
                  title: 'Add Category and Genres',
                  text: 'Add Collection Category and Book Genres?',
                  buttons: [
                    {
                      title: 'Cancel',
                      handler: () => {
                        this.readerCategory = this.collection.alt_meta.reader.category;
                        this.$forceUpdate();
                        this.$root.$emit('hide-modal');
                      }
                    },
                    {
                      title: 'Add',
                      handler: () => {
                        this.$root.$emit('hide-modal');
                        this.update('alt_meta.reader.category', {target: {value: category}});
                      },
                      class: ['btn btn-primary']
                    }
                  ]
                });
              }
            }
            return this.liveUpdate('alt_meta.reader.category', category);
          }
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
        },/*
        'currentCollection._id': {
          handler() {
            if (this.$refs.collectionDescription) {
              Vue.nextTick(() => {
                this.$refs.collectionDescription.initSize();
              });
            }
          }
        }*/
        'currentCollection.slug': {
          handler(val) {
            if (this.currentCollection.validationErrors.slug){
              if (this.currentCollection.slug) {
                delete this.currentCollection.validationErrors.slug;
              }
            }
          }
        }
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

  td.category-wrapper {
    position: relative;

    .ico-clear-filter {
      position: absolute;
      top: 6px;
      right: 29px;
    }
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
        text-align: right;
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

          .dropdown {
            position: relative;
            display: inline-block;
          }

          .dropdown-button {
            border: 1px solid #444;
            border-radius: 2px;
            padding: 4px 6px 4px 0px;
            height: 30px
          }

          .dropdown-content {
            cursor: default;
            top: 30px;
            left:-59px;
            position: absolute;
            background-color: #f9f9f9;
            min-width: 80px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            padding: 5px;
            z-index: 1;
            border: 1px solid #aaa;
            text-align: center;
          }

          .dropdown-content:hover {
            background: #1e90ff;
            color: #fff;
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
