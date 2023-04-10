<template>
  <div id='booksarea' :class="bookMode"><!-- v-cloak-->

    <div id="narrateStartCountdown" class="modal fade in">
      <div>
        <strong>3</strong>
      </div>
    </div>

    <div :class="['content-meta-wrapper', metaVisible ? 'meta-visible' : '']">

      <AllListsToolbar
        v-if="!isBookEditRoute"
        :hasBookSelected="hasBookSelected"
        :toggleMetaVisible="toggleMetaVisible"
      />

      <BookEditToolbar v-if="isBookEditRoute && isEditMode"
        :toggleMetaVisible="toggleMetaVisible"
        :hasBookSelected="hasBookSelected"
        :metaVisible="metaVisible"/>
        <!--@import_finished="bookImportFinished"-->

      <BookReimport v-if="isBookEditRoute && showBookReimport"
        :multiple="false"
        @close_modal="reimportBookClose"
        :bookId="getBookid" />


      <div class="scroll-wrapper" :class="[currentBookMeta.language ? '-lang-' + currentBookMeta.language : '']">
        <router-view></router-view>
      </div>

    </div>

    <div class='metaedit' v-if="isCollectionRoute">
      <CollectionTabs v-if="hasCollectionSelected" @collectionRemoved="collectionRemoved"></CollectionTabs>
      <NoCollectionSelected v-else />
    </div>

    <div class='metaedit' v-else-if="metaVisible" >
      <BookMetaEdit v-if='hasBookSelected'></BookMetaEdit>
      <NoBookSelected v-else />
    </div>

    <v-dialog :clickToClose="false"/>
    <modals-container/>

    <alert :show="hasErrorAlert" placement="top" :duration="5000" type="danger" width="400px">
      <span class="icon-ok-circled alert-icon-float-left"></span>
      <p>{{errorAlert}}</p>
    </alert>
    <alert :show="hasAlert" placement="top" :duration="5000" type="info" width="400px">
      <span class="icon-ok-circled alert-icon-float-left"></span>
      <p>{{messageAlert}}</p>
    </alert>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Clipboard from 'v-clipboard'
import AllListsToolbar from '@src/components/toolbar/AllListsToolbar'
import BookEditToolbar from '@src/components/toolbar/BookEditToolbar'
import BookMetaEdit from './books/BookMetaEdit'
import NoBookSelected from './books/NoBookSelected'
import CollectionTabs from './collections/CollectionTabs'
import NoCollectionSelected from './collections/NoCollectionSelected'
import BookEditHtml from './books/BookEdit_HTML'
import BookEditJson from './books/BookEdit_JSON'
import axios from 'axios'
import superlogin from 'superlogin-client'
import api_config from '../mixins/api_config.js'
import task_controls from '../mixins/task_controls.js'
import BookReimport from './books/BookReimport'
import Vue from 'vue';
import {alert} from 'vue-strap';

var modal = require('vue-js-modal');

Vue.use(modal, {dialog: true, dynamic: true});
Vue.use(Clipboard);


export default {

  name: 'Books',

  data () {
    return {
      metaVisible: true,
      currentBookid: this.$store.state.currentBookid,
      showBookReimport: false,
      hasErrorAlert: false,
      errorAlert: '',
      hasAlert: false,
      messageAlert: ''
    }
  },

  components: {
    AllListsToolbar,
    BookMetaEdit,
    NoBookSelected,
    CollectionTabs,
    NoCollectionSelected,
    BookEditToolbar,
    axios,
    superlogin,
    BookReimport,
    alert
  },

  computed: {
    ...mapGetters(['bookMode', 'bookEditMode', 'currentBook', 'currentBookMeta', 'currentBookCounters', 'jobStatusError', 'adminOrLibrarian', 'hashTagsSuggestions']),

    getBookid() {
      return this.$store.state.currentBookid
    },

    isEditMode () {
      return this.$route.matched.some(record => {
        return ['edit', 'narrate', 'proofread'].indexOf(record.meta.mode) !== -1;
      })
    },

    hasBookSelected () {
      //console.log(`hasBookSelected.this.currentBookMeta: `, this.currentBookMeta);
      return this.currentBookMeta && this.currentBookMeta.bookid;
    },

    hasCollectionSelected () {
      return ['Collection', 'CollectionBooks'].indexOf(this.$route.name) >= 0;
    },

    isCollectionRoute () {
      return ['Collections', 'Collection', 'CollectionBooks'].indexOf(this.$route.name) >= 0;
    },

    isBookRoute () {
      return ['Books', 'BooksGrid', 'CollectionBooks', 'CollectionBook'].indexOf(this.$route.name) >= 0;
    },

    isBookEditRoute () {
      return [
        'BookEdit', 'BookEditDisplay',
        'BookNarrate', 'BookProofread',
        'CollectionBookEdit', 'CollectionBookEditDisplay',
        'CollectionBookNarrate', 'CollectionBookProofread'
      ].indexOf(this.$route.name) >= 0;
    }
  },

  watch: {
//     '$store.state.route.params' (to, from) {
//       // react to route changes...
//       // this.recountRows()
//     }
//     'currentBookMeta': {
//       handler(val, old_val) {
//       }
//    },
    'jobStatusError': {
      handler(val) {
        if (val) {
          this.tc_loadBookTask(this.currentBookMeta.bookid);
          this.getCurrentJobInfo();
          this.showModal({
            title: 'Book preparation is stopped. Further modifications are not allowed',
            text: '',
            buttons: [
              {
                title: 'OK',
                handler: () => {
                  this.$store.commit('set_job_status_error', '');
                  if (!this.adminOrLibrarian) {
                    if (this.$route && ['BooksGrid', 'CollectionBook'].indexOf(this.$route.name) !== -1) {
                      this.updateBooksList()
                        .then(() => {
                          switch(this.$route.name) {
                            case 'BooksGrid':
                              this.$router.push('/books');
                              break;
                            case 'CollectionBook':
                              this.$router.push({name: 'Collection', params: {collectionid: this.$route.params.collectionid}});
                              break;
                          }
                          this.hideModal();
                        });
                    } else {
                      this.$router.push({name: 'Assignments'});
                    }
                  } else {
                    this.hideModal();
                    if (this.$route && ['BookNarrate'].indexOf(this.$route.name) !== -1) {
                      this.$router.push({name: 'BookEdit'});
                    }
                  }
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
        }
      }
    },
    errorAlert: {
      handler(val) {
        this.hasErrorAlert = val.length > 0;
      },
      deep: true
    },
    hasErrorAlert: {
      handler(val) {
        if (val === false) {
          this.errorAlert = '';
        }
      },
      deep: true
    },
    messageAlert: {
      handler(val) {
        this.hasAlert = val.length > 0;
      },
      deep: true
    },
    hasAlert: {
      handler(val) {
        if (val === false) {
          this.messageAlert = '';
        }
      },
      deep: true
    }
  },
  mixins: [api_config, task_controls],
  props: ['listing'],

  mounted() {
        // load intial book
        // this.$router.replace({ path: '/books/' + this.$route.params.bookid })
        if (this.$route.params.hasOwnProperty('bookid')) {
          if (!this.currentBookMeta._id || this.currentBookMeta._id != this.$route.params.bookid) {
            this.loadBook(this.$route.params.bookid);
          }
        }

        this.$root.$on('show-modal', (params) => {this.showModal(params)})
        this.$root.$on('hide-modal', () => {this.hideModal()})
        this.$root.$on('book-reimport-modal', this.evOnReimportModal);
        this.$root.$on('set-error-alert', this.setErrorAlert);
        this.$root.$on('set-alert', this.setAlert);
        this.$root.$on('for-bookedit:scroll-to-block', this.goToBlock);

//         this.loadTTSVoices();
  },

  methods: {

    toggleMetaVisible ($event = {}) {
      console.log(`toggleMetaVisible: `, $event.force, $event.hasOwnProperty('force'));
      if ($event.hasOwnProperty('force')) {
        this.metaVisible = $event.force;
      } else {
        this.metaVisible = !this.metaVisible;
      }

      Vue.nextTick(()=>{
        this.$root.$emit('from-toolbar:toggle-meta');
      })

    },
    showModal(params) {
      this.$modal.show('dialog', params);
    },
    hideModal() {
      this.$modal.hide('dialog');
    },
    reimportBookClose() {
      this.showBookReimport = false;
    },
    bookImportFinished() {
    },
    evOnReimportModal() {
      if (this.tc_allowEditingComplete()) {
        this.showBookReimport = true;
      }
    },
    setErrorAlert(message) {
      this.errorAlert = message;
    },
    setAlert(message) {
      this.messageAlert = message;
    },
    goToBlock(blockid) {
      if (this.$route && ['BookEdit', 'BookNarrate', 'BookProofread'].includes(this.$route.name)) {
        return;
      }
      let params = {params: {bookid: this.currentBookMeta.bookid, block: blockid}, name: 'BookEdit'};
      this.$router.push(params);
    },
    collectionRemoved() {

    },

    ...mapActions(['loadBook', 'updateBooksList', 'loadTTSVoices', 'setBlockSelection', 'tc_loadBookTask', 'getCurrentJobInfo'])
  },

  destroyed: function () {
    this.$root.$off('from-bookedit:set-selection', this.listenRangeSelection);
    this.$root.$off('book-reimport-modal', this.evOnReimportModal);
    this.$root.$off('set-error-alert', this.setErrorAlert);
    this.$root.$off('set-alert', this.setAlert);
    this.$root.$off('for-bookedit:scroll-to-block', this.goToBlock);
  }
}
</script>

<style lang='less' src='./books/css/ilm_base.less' scope></style>

<style lang="less">

.modal-dialog {
  margin: 105px auto;
}

#booksarea {
  margin: 0;
  padding:0;
/*  height: 100%;
  padding-top: 43px;*/

  flex-grow: 2;
  display:flex;
  flex-direction: row;
  overflow-y:auto;
  &.narrate {
    overflow-x: auto;
  }

  .metaedit {
    /*flex-grow: 1;
    min-width: 445px;
    max-width: 27%;*/
    width: 445px;
    flex-shrink: 0;
    overflow-y: auto;
  }

  .content-meta-wrapper {
    flex-grow: 2;
    display:flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    .narrate& {
      min-width: 860px;
    }
    .edit& {
      min-width: 700px;
    }

    .toolbar {
      justify-content: space-between;
      display: flex;
      /*flex-direction: column;*/
      box-shadow: 0px 2px 3px 0px rgba(178, 191, 224, 0.53);
      padding-left: 4px;
      margin-bottom: 3px;

      .pull-right {
        min-width: 505px;
        text-align: right;
      }

      .title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .scroll-wrapper {
      flex-grow: 2;
      display: flex;
      flex-direction: row;
      overflow: auto;

      .container-fluid {
        width: 100%;
        overflow-x: hidden;
      }

      .router-view-wrapper {
        width: 100%;
      }
    }
  }
}


// for book settings:
.-lang-fa, .-lang-ar {
  .ilm-block, /*.content-wrap-footn*/ {
    direction: rtl;
  }

   .-langftn-undefined,
   .-langftn-ar,
   .-langftn-fa  {
     direction: rtl;
   }

}


.-lang-false,
.-lang-en,
.-lang-de,
.-lang-da,
.-lang-cy,
.-lang-es,
.-lang-fr,
.-lang-is,
.-lang-it,
.-lang-ko,
.-lang-ja,
.-lang-nb,
.-lang-nl,
.-lang-pl,
.-lang-pt,
.-lang-ro,
.-lang-ru,
.-lang-sv,
.-lang-tr  {
   .-langftn-undefined   {
     direction: ltr;
   }
}

// for block settings:
.-langblock-en,
.-langblock-de,
.-langblock-da,
.-langblock-cy,
.-langblock-es,
.-langblock-fr,
.-langblock-is,
.-langblock-it,
.-langblock-ko,
.-langblock-ja,
.-langblock-nb,
.-langblock-nl,
.-langblock-pl,
.-langblock-pt,
.-langblock-ro,
.-langblock-ru,
.-langblock-sv,
.-langblock-tr  {
  .ilm-block, .recording-text {
    direction: ltr;
  }
  &.ilm-block {
    direction: ltr;
  }
}
/* Edit mode */
.-langblock-ar,
.-langblock-fa  {
  .ilm-block, .recording-text {
    direction: rtl;
    .content-wrap, .content-wrap-preview, .content-wrap-desc {
      font-family: 'Times New Roman', 'Liberation Serif';
      &.title {
        font-family: 'Times New Roman', 'Liberation Serif';
      }
      &.header {
        &.h1, &.h2, &.h3, &.h4, &.h5 {
          font-family: 'Times New Roman', 'Liberation Serif';
        }
      }
    }
    .direction-ltr {
      direction: ltr;
    }
  }
}
/* Display mode */
.-langblock-ar,
.-langblock-fa {
  &.ilm-block, {
    direction: rtl;
  }
}

// for footnote settings:
.-langftn-en,
.-langftn-de,
.-langftn-da,
.-langftn-cy,
.-langftn-es,
.-langftn-fr,
.-langftn-is,
.-langftn-it,
.-langftn-ko,
.-langftn-ja,
.-langftn-nb,
.-langftn-nl,
.-langftn-pl,
.-langftn-pt,
.-langftn-ro,
.-langftn-ru,
.-langftn-sv,
.-langftn-tr  {
  direction: ltr;
}

.-langftn-ar,
.-langftn-fa  {
  direction: rtl;
  font-family: 'Times New Roman', 'Liberation Serif';
}

.alert.top {
  top: 120px;
  p {
    text-align: center;
  }
}
.audio-process-run {

  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 99999;
  background-color: #0000006b;
  background-repeat: no-repeat;
  background-position: center;
  &.preloader-editing-audio {
    background-image: url(/static/preloader-editing-audio.gif);
  }
  &.preloader-save {
    background-image: url(/static/preloader-save.gif);
  }
  &.preloader-align {
    background-image: url(/static/preloader-align.gif);
  }
  &.preloader-loading {
    background-image: url(/static/preloader-loading.gif);
  }
}
.content-process-run {
  height: 150px;
  width: 100%;
  background-repeat: no-repeat;
  background-position: center;

  &.locked-block-cover {
    width: 100%;
    position: absolute;
    height: 100%;
    background-color: #0000006b;
  }
  &.preloader-loading {
    background-image: url(/static/preloader-loading.gif);
  }
  &.preloader-save {
    background-image: url(/static/preloader-save.gif);
  }
  &.preloader-editing-audio {
    background-image: url(/static/preloader-editing-audio.gif);
  }
  &.preloader-align {
    background-image: url(/static/preloader-align.gif);
  }
  &.preloader-audio-positioning {
    background-image: url(/static/preloader-audio-positioning.gif);
  }
}

i.ico {
  &.ico-collection {
    margin-right: -2px;
    margin-top: -6px;
    display: inline-block;
    &:before {
      content: url('/static/books_list/books-24.ico');
      margin-left: -5px;
      position: relative;
      top: 5px;
      right: -2px;
      opacity: 0.8;
    }
    &:hover {
      &:before {
        opacity: 1.0;
      }
    }
  }

  &.ico-clear-filter {
    display: inline-block;
    width: 20px;
    height: 20px;
    cursor: pointer;
    &:before {
      content: url('/static/books_list/clear-filter-button.png');
      position: relative;
      left: 6px;
    }
  }
}

</style>
