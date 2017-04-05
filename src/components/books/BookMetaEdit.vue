<template>
  <div class="sidebar">

    <div id='bookmeta' v-if="currentBook">
      <div class='booktopinfo'>
        <div class='coverimg' @click="bookEditCoverModalActive = true"><img class='coverimg' v-bind:src="currentBook.meta.coverimg" /></div>
        <h4 class='title'>{{ currentBook.meta.title }}</h4>
        <h5 class='subtitle' v-if='currentBook.meta.subtitle'>{{ currentBook.meta.subtitle }}</h5>
        <h5 class='author'>{{ currentBook.meta.author }},
        <span class="pages">{{ Math.round(currentBook.meta.length / 300) }} pages &nbsp;
        </span></h5>
        <div style='clear: both'> </div>
      </div>

      <div class="download-area col-sm-12">
        <button id="show-modal" @click="downloadBook" class=" btn btn-primary btn_download">
          <img src='/static/download.png' class='bookstack'/>
        </button>
      </div>

      <BookDownload v-if="showModal" @close="showModal = false">
          <!--
            you can use custom content here to overwrite
            default content
          -->
      </BookDownload>

      <div class="book-listing">
          <fieldset>
              <legend>Book Metadata </legend>
              <table class='properties' style=''>
                <tr class='bookid'><td>Book Id</td><td class='disabled'>{{currentBook.meta.bookid}}</td></tr>

                <tr class='title'><td>Title</td><td><input v-model='currentBook.meta.title'></td></tr>
                <tr class='subtitle'><td>Subtitle</td><td><input v-model='currentBook.meta.subtitle'></td></tr>

                <tr class='category'><td>Category</td><td><select class="form-control"
                   v-model='currentBook.meta.category'>
                  <option v-for="(value, index) in subjectCategories" :value="value">{{ value }}</option>
                </select></td></tr>

                <tr class='language'><td>Language</td><td><select class="form-control"
                   v-model='currentBook.meta.lang'>
                  <option v-for="(value, key) in languages" :value="key">{{ value }}</option>
                </select></td></tr>

                <tr class='sections'><td>Sections</td><td><input v-model='currentBook.meta.sectionName'></td></tr>
                <tr class='numbering'><td>Numbering</td><td>

                  <select class="form-control" v-model='currentBook.meta.numbering'>
                  <option v-for="(value, key) in numberingOptions" :value="value">{{ value }}</option>
                </select>

                  <!-- <input v-model='currentBook.meta.numbering'> -->

                </td></tr>

                <tr class='trans'><td>Translator</td> <td><input v-model='currentBook.meta.translator'></td></tr>
                <tr class='transfrom'><td>Tr From</td> <td><input v-model='currentBook.meta.transfrom'
                    :placeholder="suggestTranslatedId"></td></tr>
              </table>
          </fieldset>
      </div>


      <fieldset class='description brief'>
          <legend>Brief Description </legend>
          <textarea>{{ currentBook.meta.description_short }}</textarea>
      </fieldset>
      <fieldset class='description long'>
          <legend>Long Description </legend>
          <textarea>{{ currentBook.meta.description }}</textarea>
      </fieldset>


      <fieldset class="publish">
        <!-- Fieldset Legend -->
        <template v-if="currentBook.meta.importStatus == 'staging'">
          <legend>Staging Document (not shared with library)</legend>
        </template>
        <template v-else>
          <legend>{{ currentBook.meta.published ? 'Published' : 'Unpublished' }},
            Version #{{ currentBook.meta.version }}
          </legend>
        </template>

        <!-- Publication Options -->
          <form>
            <table class='properties publication'>
              <template v-if="currentBook.meta.importStatus == 'staging'">
                <tr><td rowspan='2'>
                  <button class="btn btn-primary sharebtn" @click="shareBook"> Move book to Library</button>
                </td></tr>
              </template>
              <template v-else>

                <tr><td>Published</td> <td class='published'>
                  <i :class="[currentBook.meta.published ? 'fa-toggle-on' : 'fa-toggle-off', 'fa pubtoggle']"
                    @click='publishedToggle'
                  ></i>
                </td></tr>

                <tr v-if="currentBook.meta.published"><td>Type</td> <td class='pubtype'>
                  <select class="form-control" v-model='currentBook.meta.pubType'>
                    <option v-for="(value, index) in pubTypes" :value="value">{{ value }}</option>
                  </select>
                </td></tr>

                <tr v-if="currentBook.meta.published"><td>Ver. #{{ currentBook.version }}</td> <td class='version'>
                  <button class="btn btn-primary new-version" @click="newVersion"> Save New Version</button>
                </td></tr>

              </template>
            </table>
          </form>
      </fieldset>
  </div>

  <book-edit-cover-modal
    :show="bookEditCoverModalActive"
    @closed="bookEditCoverModalActive = false"
    :img="currentBook.meta"
  ></book-edit-cover-modal>

</div>

</template>

<script>

import BookDownload from './BookDownload'
import BookEditCoverModal from './BookEditCoverModal'

export default {
  name: 'bookmeta',
  components: {
    BookDownload,
    BookEditCoverModal
  },
  data () {
    return {
      pubTypes: [
        "Public", "Hidden", "Encumbered", "Research", "Private"
      ],
      subjectCategories: [
        'Fiction', 'Historical Fiction', 'Religion', 'Autobiography'
      ],
      languages: {
        en: "English",
        es: "Spanish",
        du: "German",
        ru: "Russian",
        ar: "Arabic",
        fa: "Farsi",
        cn: "Chinese",
        ru: "Romanian"
      },
      numberingOptions: ['x', 'x.x', 'x.x.x'],
      dirty: {
      },
      visible: true,
      showModal: false,
      bookEditCoverModalActive: false
    }
  },

  computed: {
    currentBook: function () {
      return this.$store.getters.currentBook
    },
    suggestTranslatedId: function () {
      return this.currentBook.meta.bookid.split('-').slice(0,-1).join('-')+'-?'
    }
  },
  methods: {
    languageName: function(code) {
      if (this.languages[code]) return this.languages[code];
    },
    publishedToggle: function() {
      this.currentBook.meta.published = !this.currentBook.meta.published
    },
    shareBook: function() {
      if (confirm("This will share the book with the entire library. Usually this is done after rudimentary formatting and text cleanup. Are you sure it is ready?")) {
        this.currentBook.meta.published = 'false';
        this.currentBook.meta.pubType = 'Hidden';
        this.currentBook.meta.version = '1.0';
        this.currentBook.meta.importStatus = 'shared';
      }
    },
    newVersion: function() {
      this.currentBook.meta.version = (parseFloat(this.currentBook.meta.version)+0.1).toFixed(1).toString();
    },
    toggleVisibility: function (){
      this.visible = !this.visible
    },

    downloadBook() {
      this.showModal = true;
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

  }
  .download-area button {
    float: right;
  }
  /* Wrapper around entire side editor */
  .sidebar { margin-top:0px; position: relative; margin-left:0; padding-left:0;}

  /* Main book cover image */
  div.coverimg {
    width: 60px;
    padding:0; padding-right: 8px;
    float: left;
    margin-left: 3px; margin-top: 0;
    padding-bottom: 10px;}
  img.coverimg {
    max-width: 50px;
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

  /* Properties editor area */
  table.properties {margin:0; padding:0; width:100%; font-size: 1em;
    border-collapse: separate; border-spacing: 3px;
  }
  table.properties td:nth-child(1) {width: 30%}
  table.properties td:nth-child(2), input {width: auto; text-align: right}
  table.properties tr:nth-child(odd) {background-color: #F0F0F0}
  table tr {border: 2px solid white}
  table tr.changed {border: 2px solid wheat}
  table tr input {font-size: 1em; width: 100%}
  tr.subtitle input {font-size: .85em; width: 100%; line-height: 1.85em;}
  .disabled {font-style: italic; color: gray; font-size: 1.25em;}

  /* publication info */
  i.pubtoggle {cursor: pointer;}
  button.new-version { font-size: 1em; }
  button.sharebtn {width: 100%}

</style>
