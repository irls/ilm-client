<template>
  <div class="sidebar">

    <div id='bookmeta' v-if="currentBook">
      <div class='booktopinfo'>
        <div class='coverimg' @click="bookEditCoverModalActive = true">
          <img v-if="currentBook.coverimg" v-bind:src="currentBook.coverimg" />
        </div>
        <h4 class='title'>{{ currentBook.title }}</h4>
        <h5 class='subtitle' v-if='currentBook.subtitle'>{{ currentBook.subtitle }}</h5>
        <h5 class='author'>{{ currentBook.author }},
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
       :book="currentBook" />

      <div class="book-listing">
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
                <select class="form-control" v-model='currentBook.lang' @change="change('lang')" :key="currentBookid" :disabled="!allowMetadataEdit">
                  <option v-for="(value, key) in languages" :value="key">{{ value }}</option>
                </select>
              </td>
            </tr>

            <tr class='sections'>
              <td>Sections</td>
              <td><input v-model='currentBook.sectionName' @input="update('sectionName', $event)" :disabled="!allowMetadataEdit"></td>
            </tr>

            <tr class='numbering'>
              <td>Numbering</td>
              <td>
                <select class="form-control" v-model='currentBook.numbering' @change="change('numbering')" :key="currentBookid" :disabled="!allowMetadataEdit">
                  <option v-for="(value, key) in numberingOptions" :value="value">{{ value }}</option>
                </select>
                <!-- <input v-model='currentBook.numbering'> -->
              </td>
            </tr>

            <tr class='trans'>
              <td>Translator</td>
              <td><input v-model='currentBook.translator' @input="update('translator', $event)" :disabled="!allowMetadataEdit"></td>
            </tr>

            <tr class='transfrom'>
              <td>Tr From</td>
              <!-- <td><input v-model="currentBook.transfrom" :placeholder="suggestTranslatedId"></td> -->
              <td><input v-model="currentBook.transfrom" @input="update('transfrom', $event)" :disabled="!allowMetadataEdit"></td>
            </tr>

          </table>
        </fieldset>
      </div>

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
      <fieldset v-if="isOwner && tc_hasTask('metadata_cleanup')">
        <legend>Cleanup finished</legend>
        <button class="btn btn-primary" v-on:click="showSharePrivateBookModal = true">Text cleanup finished</button>
      </fieldset>

      <div class="row">
        <div class="download-area col-sm-6" v-if="allowMetadataEdit">
          <button id="show-modal" @click="uploadAudio" class="btn btn-primary btn_audio_upload">
            <i class="fa fa-pencil fa-lg"></i>&nbsp;Import Audio
          </button>
        </div>
      </div>

    </div>

    <book-edit-cover-modal
      :show="bookEditCoverModalActive"
      @closed="bookEditCoverModalActive = false"
      :img="currentBook"
    ></book-edit-cover-modal>

    <alert v-model="hasError" placement="top" :duration="3000" type="danger" width="400px">
      <span class="icon-ok-circled alert-icon-float-left"></span>

      <p>{{errorMessage}}.</p>
    </alert>

    <modal v-model="showSharePrivateBookModal" effect="fade" ok-text="Share" cancel-text="Cancel" title="Share book" @ok="sharePrivateBook()">
      <div v-html="getSharePrivateBookMessage()"></div>
    </modal>

  </div>

</template>

<script>

import { mapGetters } from 'vuex'
import superlogin from 'superlogin-client'
import BookDownload from './BookDownload'
import BookEditCoverModal from './BookEditCoverModal'
import AudioImport from '../audio/AudioImport'
import _ from 'lodash'
import PouchDB from 'pouchdb'
import axios from 'axios'
import { alert, modal } from 'vue-strap'
import task_controls from '../../mixins/task_controls.js'
import api_config from '../../mixins/api_config.js'
var BPromise = require('bluebird');

export default {

  name: 'BookMetaEdit',

  components: {
    BookDownload,
    BookEditCoverModal,
    AudioImport,
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
      bookTaskId: '',
      linkTaskError: '',
      isOwner: false,
      errorMessage: '',//to display validation errors for some cases, e.g. on sharing book
      hasError: false,//has some validation error, e.g. on sharing book
      approveMetadataComment: '',
      showSharePrivateBookModal: false,
      allowMetadataEdit: false
    }
  },

  props: {
    userTasks: Array//tasks list for editor to link this book to a task before sharing
  },

  computed: {

    ...mapGetters(['currentBookid', 'currentBookMeta', 'isLibrarian', 'isEditor', 'isAdmin']),

    suggestTranslatedId: function () {
      if (this.currentBook) return this.currentBook.bookid.split('-').slice(0, -1).join('-') + '-?'
    }
  },

  mixins: [task_controls, api_config],

  mounted() {
    for (let id in this.$store.state.tc_currentBookTasks.tasks) {
      let record = this.$store.state.tc_currentBookTasks.tasks[id]
      if (record.type == 2) {
       this.bookTaskId = record._id
      }
    }
    this.allowMetadataEdit = (this.isLibrarian && this.currentBook && this.currentBook.private == false) || this.isEditor
  },

  watch: {

    currentBookMeta: {
      handler (val) {
        this.init()
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
    }

  },

  created () {
    this.init()
  },

  methods: {

    init () {
      this.currentBook = Object.assign({}, this.currentBookMeta)
      this.isOwner = this.currentBook.owner == superlogin.getSession().user_id
    },

    update: _.debounce(function (key, event) {
      this.liveUpdate(key, event.target.value)
    }, 300),

    change (key) {
      this.liveUpdate(key, this.currentBook[key])
    },

    liveUpdate (key, value) {
      var dbPath = superlogin.getDbUrl('ilm_library_meta')
      if (process.env.DOCKER) dbPath = dbPath.replace('couchdb', 'localhost')

      var db = new PouchDB(dbPath)
      var api = db.hoodieApi()

      return api.update(this.currentBookid, {
        [key]: value
      }).then(doc => {
        console.log('success DB update: ', doc)
        return BPromise.resolve(doc)
      }).catch(err => {
        console.log('error DB pdate: ', err)
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
      console.log("hello there")
      this.showModal_audio = true
    },

    linkTask() {
      let self = this
      self.linkTaskError = ''
      if (!self.bookTaskId) {
        self.linkTaskError = 'Required'
      } else {
        axios.put(self.API_URL + 'task/' + self.bookTaskId + '/link_book', {book_id: self.currentBook._id})
          .then((response) => {
            //self.getTasks()
            self.$emit('task_linked')
          })
          .catch((err) => {})
      }
    },
    sharePrivateBook() {
      var self = this
      self.showSharePrivateBookModal = false
      if (!self.bookTaskId) {
        self.errorMessage = 'No linked task, please link task'
      } else {
        //axios.put(API_URL + 'books/' + self.currentBook._id + '/share_private')
        self.liveUpdate('private', false)
          .then((doc) => {
            axios.put(self.API_URL + 'task/' + self.bookTaskId + '/finish_cleanup')
              .then((doc) => {
                self.currentBook.private = false
                self.$store.dispatch('tc_loadBookTask')
              })
              .catch((err) => {
              })
          })
          .catch((err) => {
          })
      }
    },
    setMetadataStatus(status) {
      if ([-1, 1].indexOf(status) === -1) {
        return false
      }
      if (status == -1 && !this.approveMetadataComment) {
        this.errorMessage = 'Please specify a comment'
      } else {
        var self = this
        if (status == -1) {
          axios.put(self.API_URL + 'task/' + self.tc_currentBookTasks.task._id + '/metadata_reject', {comment: self.approveMetadataComment})
            .then((response) => {
              self.tc_loadBookTask()
            }).
            catch(err => {
              self.errorMessage = err.message
            })
        } else if (status == 1) {
          axios.put(self.API_URL + 'task/' + self.tc_currentBookTasks.task._id + '/metadata_update', {})
            .then((response) => {
              self.tc_loadBookTask()
            }).
            catch(err => {
              self.errorMessage = err.message
            })
        }
      }
    },
    getSharePrivateBookMessage() {
      let next_user = this.$store.state.tc_currentBookTasks.type == 1 ? 'proofer' : 'narrator';
      return 'This will make book visible to others and send it to the ' + next_user + '. Continue?';
    }
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
  .sidebar { margin-top:0px; position: relative; margin-left:0; padding-left:0;}

  /* Main book cover image */
  div.coverimg {
    min-width: 60px;
    min-height: 80px;
    width: 80px;
    padding:0; margin: 5px; margin-right: 8px;
    float: left;
    margin-left: 3px; margin-top: 0;
    background: white;
    box-shadow: inset 0px 0px 3px 3px rgba(0,0,0,0.06);
    cursor: pointer;
    position: relative;
  }
  .coverimg img {
    width: 100%;
  }
  .author,  h4.title {margin: 0; padding-bottom: 0; }
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
  .disabled {font-style: italic; color: gray; font-size: .85em;}

  /* publication info */
  i.pubtoggle {cursor: pointer;}
  button.new-version { font-size: 1em; }
  button.sharebtn {width: 100%}

  .fix-message {
    color: red;
    background-color: yellow;
  }

</style>
