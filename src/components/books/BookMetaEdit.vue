<template>
  <div class="sidebar">

    <div id='bookmeta' v-if="currentBook">
      <div class='booktopinfo'>
        <div class='coverimg' @click="bookEditCoverModalActive = true">
          <img height="80" v-if="currentBook.coverimg" v-bind:src="currentBook.coverimg" />
          <div v-else class='coverimg-wrap'></div>
        </div>
        <h4 class='title'>{{ currentBook.title }}</h4>
        <h5 class='subtitle' v-if='currentBook.subtitle'>{{ currentBook.subtitle }}</h5>
        <h5 class='author'>{{ currentBook.author ? currentBook.author.join(',') : '' }},
        <span class="pages">{{ Math.round(currentBook.wordcount / 300) }} pages &nbsp;
        </span></h5>
        <div style='clear: both'> </div>
      </div>

      <div class="row">
      <div class="download-area col-sm-6">
        <!-- <button id="show-modal" @click="downloadBook" class="btn btn-primary btn_download">
          <img src='/static/download.png' class='bookstack'/>
        </button> -->
      </div>
      </div>

      <BookDownload v-if="showModal" @close="showModal = false" />
      <AudioImport v-if="showModal_audio" @close="showModal_audio = false"
        @audiofilesUploaded="setAudiobook"
        :book="currentBook"
        :importTask="importTask"
        :audiobook="audiobook"
        :allowDownload="false" />

      <div class="book-listing">
        <div class="row">
          <div v-if="tc_hasTask('metadata_cleanup')" class="col-sm-4">
            <button v-if="!textCleanupProcess" class="btn btn-primary" v-on:click="showSharePrivateBookModal = true">Editing complete</button>
            <div v-else class="preloader-small"></div>
          </div>
        </div>
        <vue-tabs ref="panelTabs">
          <vue-tab title="Audio Integration" :id="'audio-integration'">
            <BookAudioIntegration ref="audioIntegration" :audiobook="audiobook" :blocksForAlignment="blocksForAlignment"
              ></BookAudioIntegration>
          </vue-tab>
          <vue-tab title="Book Content" :id="'book-content'">
            <fieldset>
              <legend>Book Metadata </legend>
              <table class='properties'>

                <tr class='bookid'>
                  <td>Book Id</td>
                  <td class='disabled'>{{currentBook.bookid}}</td>
                </tr>

                <tr class='title'>
                  <td>Title</td>
                  <td><input v-model='currentBook.title' @input="update('title', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='subtitle'>
                  <td>Subtitle</td>
                  <td><input v-model='currentBook.subtitle' @input="update('subtitle', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='author'>
                  <td>Author</td>
                  <td>
                    <template v-for="(author, i) in currentBook.author" >
                      <input v-model='currentBook.author[i]' @input="update('author', $event)" :disabled="!allowMetadataEdit"><button v-on:click="removeAuthor(i)" :class="{'disabled': i == 0 && currentBook.author.length == 1}"><i class="fa fa-minus-circle" ></i></button>
                    </template>
                    <button v-on:click="addAuthor"><i class="fa fa-plus-circle"></i></button>
                  </td>
                </tr>

                <tr class='category'>
                  <td>Category</td>
                  <td>
                    <select class="form-control" v-model='currentBook.category' @change="change('category')" :key="currentBookid" :disabled="!allowMetadataEdit">
                      <option v-for="(value, index) in subjectCategories" :value="value">{{ value }}</option>
                    </select>
                  </td>
                </tr>

                <tr class='language'>
                  <td>Language</td>
                  <td>
                    <select class="form-control" v-model='currentBook.language' @change="change('language')" :key="currentBookid" :disabled="!allowMetadataEdit">
                      <option v-for="(value, key) in languages" :value="key">{{ value }}</option>
                    </select>
                  </td>
                </tr>

<!--                <tr class='sections'>
                  <td>Sections</td>
                  <td><input v-model='currentBook.sectionName' @input="update('sectionName', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>-->

                <tr class='trans'>
                  <td>Translator</td>
                  <td><input v-model='currentBook.translator' @input="update('translator', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='transfrom'>
                  <td>Tr From</td>
                  <!-- <td><input v-model="currentBook.transfrom" :placeholder="suggestTranslatedId"></td> -->
                  <td><input v-model="currentBook.transfrom" @input="update('transfrom', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='collection'>
                  <td>Collection</td>
                  <!-- <td><input v-model="currentBook.transfrom" :placeholder="suggestTranslatedId"></td> -->
                  <td>
                    <select @input="updateCollection($event)" :disabled="!allowMetadataEdit" class="form-control" v-model="currentBook.collection_id">
                      <option v-model="currentBook.collection_id" v-for="c in collectionsList" :value="c._id">{{c.title}}</option>
                    </select>
                  </td>
                </tr>

              </table>
            </fieldset>

          <fieldset class='description brief'>
            <legend>Brief Description </legend>
            <textarea v-model='currentBook.description_short' @input="update('description_short', $event)" :disabled="!allowMetadataEdit"></textarea>
          </fieldset>

          <fieldset class='description long'>
            <legend>Long Description </legend>
            <textarea v-model='currentBook.description' @input="update('description', $event)" :disabled="!allowMetadataEdit"></textarea>
          </fieldset>

          <fieldset class="publish" v-if="isLibrarian">
            <!-- Fieldset Legend -->
            <template v-if="currentBook.importStatus == 'staging'">
              <legend>Staging Document (not shared with library)</legend>
            </template>
            <template v-else>
              <legend>{{ currentBook.published ? 'Published' : 'Unpublished' }},
                Version #{{ currentBook.version }}
              </legend>
            </template>

            <!-- Publication Options -->
            <table class='properties publication'>
              <template v-if="currentBook.importStatus == 'staging'">
                <tr><td rowspan='2'>
                  <button class="btn btn-primary sharebtn" @click="shareBook"> Move book to Library</button>
                </td></tr>
              </template>
              <template v-else>

                <tr><td>Published</td> <td class='published'>
                  <i :class="[currentBook.published ? 'fa-toggle-on' : 'fa-toggle-off', 'fa pubtoggle']"
                    @click='publishedToggle'
                  ></i>
                </td></tr>

                <tr v-if="currentBook.published"><td>Type</td> <td class='pubtype'>
                  <select class="form-control" v-model='currentBook.pubType'>
                    <option v-for="(value, index) in pubTypes" :value="value">{{ value }}</option>
                  </select>
                </td></tr>

                <tr v-if="currentBook.published"><td>Ver. #{{ currentBook.version }}</td> <td class='version'>
                  <button class="btn btn-primary new-version" @click="newVersion"> Save New Version</button>
                </td></tr>

              </template>
            </table>
          </fieldset>
        </vue-tab>
        <vue-tab title="Styles" :id="'styles-switcher'">
<!--            <BookAudioIntegration ref="audioIntegration" :audiobook="audiobook" :blocksForAlignment="blocksForAlignment"
              ></BookAudioIntegration>-->
        </vue-tab>
      </vue-tabs>
      </div>
    </div>

    <book-edit-cover-modal
      :show="bookEditCoverModalActive"
      @closed="bookEditCoverModalActive = false"
      :img="currentBook"
    ></book-edit-cover-modal>

    <alert v-model="hasError" placement="top" type="danger" width="400px" :dismissable="true">
      <span class="icon-ok-circled alert-icon-float-left"></span>

      <p>{{errorMessage}}.</p>
    </alert>

    <alert v-model="hasMessage" placement="top" :duration="3000" type="info" width="400px">
      <span class="icon-ok-circled alert-icon-float-left"></span>

      <p>{{infoMessage}}.</p>
    </alert>

    <modal v-model="showSharePrivateBookModal" effect="fade" ok-text="Share" cancel-text="Cancel" title="" @ok="sharePrivateBook()">
      <div v-html="sharePrivateBookMessage"></div>
    </modal>
    <modal v-model="unlinkCollectionWarning" effect="fade" ok-text="Remove from collection" cancel-text="Cancel" @ok="updateCollection()" @cancel="cancelCollectionUpdate">
      <p>Remove book from collection?</p>
    </modal>

  </div>

</template>

<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import superlogin from 'superlogin-client'
import BookDownload from './BookDownload'
import BookEditCoverModal from './BookEditCoverModal'
import BookAudioIntegration from './BookAudioIntegration'
import AudioImport from '../audio/AudioImport'
import _ from 'lodash'
import PouchDB from 'pouchdb'
import axios from 'axios'
import { alert, modal } from 'vue-strap'
import task_controls from '../../mixins/task_controls.js'
import api_config from '../../mixins/api_config.js'
import { VueTabs, VTab } from 'vue-nav-tabs'
var BPromise = require('bluebird');

export default {

  name: 'BookMetaEdit',

  components: {
    BookDownload,
    BookEditCoverModal,
    AudioImport,
    BookAudioIntegration,
    'vue-tabs': VueTabs,
    'vue-tab': VTab,
    alert,
    modal
  },

  data () {
    return {
      pubTypes: [
        'Public', 'Hidden', 'Encumbered', 'Research', 'Private'
      ],
      subjectCategories: [
        'Stories', 'Verse', 'History', 'Ideas', 'Science'
      ],
      languages: {
        en: 'English',
        es: 'Spanish',
        du: 'German',
        ru: 'Russian',
        ar: 'Arabic',
        fa: 'Farsi',
        cn: 'Chinese',
        ro: 'Romanian'
      },
      numberingOptions: ['x', 'x.x', 'x.x.x'],
      dirty: {
      },
      visible: true,
      showModal: false,
      showModal_audio: false,
      bookEditCoverModalActive: false,
      currentBook: {},
      cleanupTask: {},
      importTask: {},
      linkTaskError: '',
      isOwner: false,
      errorMessage: '',//to display validation errors for some cases, e.g. on sharing book
      hasError: false,//has some validation error, e.g. on sharing book
      hasMessage: false,//has some info message
      infoMessage: '',//to display info on action finished
      approveMetadataComment: '',
      showSharePrivateBookModal: false,
      allowMetadataEdit: false,
      textCleanupProcess: false,
      audiobook: {},
      sharePrivateBookMessage: '',
      collectionsList: [],
      unlinkCollectionWarning: false
    }
  },

  props: [
    'blocksForAlignment'
  ],

  computed: {

    ...mapGetters(['currentBookid', 'currentBookMeta', 'currentBookFiles', 'isLibrarian', 'isEditor', 'isAdmin', 'bookCollections']),

    suggestTranslatedId: function () {
      if (this.currentBook) return this.currentBook.bookid.split('-').slice(0, -1).join('-') + '-?'
    }
  },

  mixins: [task_controls, api_config],

  mounted() {

    this.allowMetadataEdit = (this.isLibrarian && this.currentBook && this.currentBook.private == false) || this.isEditor
    let self = this;
    this.loadAudiobook(true)
    this.$refs.audioIntegration.$on('uploadAudio', function() {
      self.showModal_audio = true;
    })
    this.$refs.audioIntegration.$on('audiobookUpdated', function(response) {
      self.audiobook = {};
      Vue.nextTick(() => {
        self.audiobook = response;
      })
    })
    this.collectionsList = [{'_id': '', 'title' :''}];
    this.bookCollections.forEach(c => {
      this.collectionsList.push(c);
    });
  },

  watch: {

    currentBookMeta: {
      handler (val) {
        this.init()
      },
      deep: true
    },
    currentBookFiles: {
      handler (val) {
        this.currentBook.coverimg = this.currentBookFiles.coverimg
      },
      deep: true
    },
    errorMessage: {
      handler(val) {
        this.hasError = val.length > 0
      },
      deep: true
    },
    hasError: {
      handler(val) {
        if (val === false) {
          this.errorMessage = ''
        }
      },
      deep: true
    },
    infoMessage: {
      handler(val) {
        this.hasMessage = val.length > 0
      },
      deep: true
    },
    hasMessage: {
      handler(val) {
        if (val === false) {
          this.infoMessage = ''
        }
      },
      deep: true
    },
    showSharePrivateBookModal: {
      handler(val) {
        if (val === true) {
          this.getSharePrivateBookMessage();
        }
      }
    }

  },

  created () {
    this.init()
  },

  methods: {

    init () {
      for (let id in this.$store.state.tc_currentBookTasks.tasks) {
        let record = this.$store.state.tc_currentBookTasks.tasks[id]
        if (record.type == 'text-cleanup') {
         this.cleanupTask = record
        } else if (record.type == 'import-book') {
          this.importTask = record
        }
      }
      this.currentBook = Object.assign({}, this.currentBookMeta);
      this.currentBook.coverimg = this.currentBookFiles.coverimg;
      this.isOwner = this.currentBook.owner == superlogin.getSession().user_id
      this.loadAudiobook();
    },

    update: _.debounce(function (key, event) {
      this.liveUpdate(key, key == 'author' ? this.currentBook.author : event.target.value)
    }, 300),

    updateCollection(event) {
      if (event && event.target.value) {
        let collectionId = event.target.value;
        let api_url = this.API_URL + 'collection/' + collectionId + '/link_books';
        let api = this.$store.state.auth.getHttp();
        let self = this;
        api.post(api_url, {books_ids: [this.currentBook._id]}, {}).then(function(response){
          if (response.status===200) {
            self.$router.push('/collections/' + collectionId + '/' + self.currentBookMeta._id);
          } else {

          }
        }).catch((err) => {

        });
      } else if (event) {
        this.unlinkCollectionWarning = true;
      } else {
        let api_url = this.API_URL + 'collection/' + this.currentBookMeta.collection_id + '/unlink_books';
        let api = this.$store.state.auth.getHttp();
        let self = this;
        api.post(api_url, {books_ids: [this.currentBook._id]}, {}).then(function(response){
          if (response.status===200) {
            self.$router.push('/books/' + self.currentBookMeta._id);
          } else {

          }
        }).catch((err) => {

        });
      }
    },

    cancelCollectionUpdate() {
      this.unlinkCollectionWarning = false;
      this.currentBook.collection_id = this.currentBookMeta.collection_id;
    },

    change (key) {
      this.liveUpdate(key, this.currentBook[key])
    },

    liveUpdate (key, value) {
      var dbPath = superlogin.getDbUrl('ilm_content_meta')
      if (process.env.DOCKER) dbPath = dbPath.replace('couchdb', 'localhost')

      var db = new PouchDB(dbPath)
      var api = db.hoodieApi()

      return api.update(this.currentBookid, {
        [key]: value
      }).then(doc => {
        //console.log('success DB update: ', doc)
        return BPromise.resolve(doc)
      }).catch(err => {
        //console.log('error DB pdate: ', err)
        return BPromise.reject(err)
      })
    },

    languageName (code) {
      if (this.languages[code]) return this.languages[code]
    },
    publishedToggle () {
      this.currentBook.published = !this.currentBook.published
    },
    shareBook () {
      if (confirm('This will share the book with the entire library. Usually this is done after rudimentary formatting and text cleanup. Are you sure it is ready?')) {
        this.currentBook.published = 'false'
        this.currentBook.pubType = 'Hidden'
        this.currentBook.version = '1.0'
        this.currentBook.importStatus = 'shared'
      }
    },
    newVersion () {
      this.currentBook.version = (parseFloat(this.currentBook.version) + 0.1).toFixed(1).toString()
    },
    toggleVisibility () {
      this.visible = !this.visible
    },

    downloadBook () {
      this.showModal = true
    },

    uploadAudio () {
      this.showModal_audio = true
    },

    linkTask() {
      let self = this
      self.linkTaskError = ''
      if (!self.cleanupTask._id) {
        self.linkTaskError = 'Required'
      } else {
        axios.put(self.API_URL + 'task/' + self.cleanupTask._id + '/link_book', {book_id: self.currentBook._id})
          .then((response) => {
            //self.getTasks()
            self.$emit('task_linked')
          })
          .catch((err) => {})
      }
    },
    sharePrivateBook() {
      this.textCleanupProcess = true
      var self = this
      self.showSharePrivateBookModal = false
      if (!self.cleanupTask._id) {
        self.errorMessage = 'No linked task, please link task'
        self.textCleanupProcess = false
      } else {
        //axios.put(API_URL + 'books/' + self.currentBook._id + '/share_private')
        self.liveUpdate('private', false)
          .then((doc) => {
            axios.put(self.API_URL + 'task/' + self.cleanupTask._id + '/finish_cleanup')
              .then((doc) => {
                self.textCleanupProcess = false
                if (!doc.data.error) {
                  self.currentBook.private = false
                  self.$store.dispatch('tc_loadBookTask')
                  self.infoMessage = 'Text cleanup task finished'
                } else {
                  self.liveUpdate('private', true)
                  self.errorMessage = doc.data.error
                }
              })
              .catch((err, test) => {
                self.textCleanupProcess = false
                self.liveUpdate('private', true)
              })
          })
          .catch((err) => {
            self.textCleanupProcess = false
          })
      }
    },
    getSharePrivateBookMessage() {
      return axios.get(this.API_URL + 'books/' + this.currentBookMeta.bookid + '/selection_alignment?voicework=narration')
      .then(resp => {
        this.sharePrivateBookMessage = resp.data && resp.data.count > 0 ? 'Complete editing and request narration for ' + resp.data.count + ' blocks?' : 'Complete editing?';
      });
    },
    loadAudiobook(set_tab = false) {
      let self = this;
      this.getAudioBook(this.currentBookMeta.bookid).then(audio => {
        self.audiobook = audio;//
        //console.log(self.audiobook)
        if (set_tab) {
          if (self.audiobook.bookid) {
            self.$refs.panelTabs.findTabAndActivate('Audio Integration');
          } else {
            self.$refs.panelTabs.findTabAndActivate('Book Content');
          }
        }
      })
    },
    setAudiobook(audiobook) {
      this.audiobook = audiobook;
    },
    addAuthor() {
      this.currentBook.author.push('');
      this.liveUpdate('author', this.currentBook.author);
    },
    removeAuthor(i) {
      if (i > 0 || this.currentBook.author.length > 1) {
        this.currentBook.author.splice(i, 1);
        this.liveUpdate('author', this.currentBook.author);
      }
    },
    ...mapActions(['getAudioBook'])
  }
}
</script>


<style scoped src='./css/BookProperties.css'></style>

<style scoped>

  .btn_download {
    border: 0px;
    background-color: Transparent;
    outline:none;
  }

  img.bookstack {
    width: 60px;
    opacity: .75
  }

  .download-area {
    margin-left:15px; padding-left:0;
  }
  .download-area .btn_download {
    float: right;
  }
  .download-area .btn_audio_upload {
    float: left;  margin: 10px; margin-left: -15px;
  }
  /* Wrapper around entire side editor */
  .sidebar {
    position: fixed;
    width: 29%;

    margin-top:0px;
    margin-left:0;
    padding-left:0;
  }

  /* Main book cover image */
  div.coverimg {
    padding:0; margin: 5px; margin-right: 8px;
    float: left;
    margin-left: 3px; margin-top: 0;
    background: white;
    box-shadow: inset 0px 0px 3px 3px rgba(0,0,0,0.06);
    cursor: pointer;
    position: relative;
  }
  div.coverimg-wrap {
    height: 80px;
    width: 60px;
  }
  .author,  h4.title {margin: 0; margin-top:2px; padding-bottom: 0; }
  .subtitle {margin-top:0;}

  /*  Top edit icon for opening the book in an edit mode */
  .edit-button {
    float: right;  cursor: pointer; margin-top: -5px;
  }

  /* Edit area for book description */
  fieldset.description textarea {
    width: 100%; padding: 0; margin:0; border: none; min-height: 180px;
    resize: vertical;
  }
  fieldset.description.brief textarea {
    min-height: 50px;
  }
  fieldset.approve-metadata textarea {
    width: 100%;
    min-height: 100px;
  }

  /* Properties editor area */
  table.properties {margin:0; padding:0; width:100%; font-size: 1em;
    border-collapse: separate; border-spacing: 3px;
  }
  table.properties td:nth-child(1) {width: 30%; padding: 3px; margin:0}
  table.properties td:nth-child(2), input {width: auto; text-align: right}
  table.properties tr:nth-child(odd) {background-color: #F0F0F0}
  table tr {border: 2px solid white}
  table tr.changed {border: 2px solid wheat}
  table tr input {font-size: 1em; width: 100%}
  tr.subtitle input {font-size: .85em; width: 100%; line-height: 1.85em;}
  tr.author input {width: 80%;}
  tr.author button {width: 15%; border: none; background-color: inherit;}
  tr.author button.disabled i {display: none;}
  .disabled {font-style: italic; color: gray; font-size: .85em;}

  /* publication info */
  i.pubtoggle {cursor: pointer;}
  button.new-version { font-size: 1em; }
  button.sharebtn {width: 100%}

  .fix-message {
    color: red;
    background-color: yellow;
  }
  .preloader-small {
      background: url(/static/preloader-snake-small.gif);
      width: 34px;
      height: 34px;
  }
  .alert.top {
    top: 120px;
  }

</style>
