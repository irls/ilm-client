<template>
  <div id='booksarea' v-cloak>

    <table id='bodytable'>
      <tr>
        <td :class="['toolbar-wrapper', metaVisible ? 'meta-visible' : '']">

            <BookEditToolbar v-if="isEditMode()"
            :toggleMetaVisible="toggleMetaVisible"
            :hasBookSelected="hasBookSelected"
            :metaVisible="metaVisible"/>

            <BooksToolbar v-else
            @import_finished="bookImportFinished"
            :toggleMetaVisible="toggleMetaVisible"
            :hasBookSelected="hasBookSelected"
            :metaVisible="metaVisible"/>

        </td> <!--collapseEditBar visible-->
        <td class='metaedit' v-if='metaVisible' rowspan="2">
          <book-meta-edit v-if='metaVisible'
            :blocksForAlignment="blocksForAlignment"></book-meta-edit>
        </td>
      </tr>
      <tr>
        <td class='maincontent scrollable'>
          <router-view></router-view>

        </td>
<!--        <td v-if='hasBookSelected() && !metaVisible'
            class='collapseEditBar'
            @click='toggleMetaVisible'>

          <div class="bar">
            <i :class="['fa-chevron-left' , 'fa collapsebtn']" aria-hidden="true"></i>
          </div>
        </td>-->
      </tr>
    </table>
    <nav :class="['navbar', 'fixed-bottom', 'navbar-light', 'bg-faded', {'hidden': !showAudioeditor()}]" >
      <AudioEditor ref="audioEditor"></AudioEditor>
    </nav>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import BooksToolbar from './books/BooksToolbar'
import BookEditToolbar from './books/BookEditToolbar'
import BookMetaEdit from './books/BookMetaEdit'
import BookEditHtml from './books/BookEdit_HTML'
import BookEditJson from './books/BookEdit_JSON'
import axios from 'axios'
import superlogin from 'superlogin-client'
import api_config from '../mixins/api_config.js'
import AudioEditor from './AudioEditor'
import task_controls from '../mixins/task_controls.js'


export default {

  name: 'Books',

  data () {
    return {
      metaVisible: false,
      metaAvailable: false,
      //colCount: 1,
      currentBookid: this.$store.state.currentBookid,
      blocksForAlignment: {
        start: {},
        end: {},
        count: 0,
        countTTS: 0
      }
    }
  },

  components: {
    BooksToolbar,
    BookMetaEdit,
    BookEditToolbar,
    axios,
    superlogin,
    AudioEditor
  },

  computed: {
    ...mapGetters(['bookEditMode', 'currentBook', 'currentBookMeta', 'currentBookCounters']),
  },

  watch: {
//     '$store.state.route.params' (to, from) {
//       // react to route changes...
//       // this.recountRows()
//     }
    'currentBookMeta': {
      handler(val, old_val) {
        if (!old_val._id && this.currentBookMeta && this.currentBookMeta.collection_id) {
          this.$router.replace({ path: '/collections/' + this.currentBookMeta.collection_id + '/' + this.currentBookMeta.bookid });
        } else if (this.metaVisible && !this.currentBookMeta._id) {
          this.metaVisible = false;
          this.metaAvailable = false;
        }
      }
    }
  },
  mixins: [api_config, task_controls],

  mounted() {
        // load intial book
        // this.$router.replace({ path: '/books/' + this.$route.params.bookid })
        if (this.$route.params.hasOwnProperty('bookid')) {
          if (!this.currentBookMeta._id || this.currentBookMeta._id != this.$route.params.bookid) {
            this.loadBook(this.$route.params.bookid);
          }
        }

        let self = this;
        this.$root.$on('from-bookedit:set-selection', function(start, end) {
          self.blocksForAlignment.start = start;
          self.blocksForAlignment.end = end;
          self.getBlockSelectionInfo();
        });
        this.$root.$on('from-bookblockview:voicework-type-changed', function() {
          self.getBlockSelectionInfo();
        });

//         this.loadTTSVoices();
  },

  methods: {
    toggleMetaVisible () {
      let id = this.$store.state.currentBookid
      this.metaAvailable = id
      this.metaVisible = !this.metaVisible
      if (!this.metaAvailable) this.metaVisible = false;
    },
    hasBookSelected () {
      return !!this.currentBook
    },
    isEditMode () {
      return this.$route.matched.some(record => {
        return record.meta.mode === 'edit'
      })
    },
//     recountRows () {
//       let count = 1
//       if (this.hasBookSelected()) count++
//       if (this.metaVisible) count++
//       this.colCount = count
//     },
    bookImportFinished(result) {

    },

    showAudioeditor() {
      return this.$refs.audioEditor && !this.$refs.audioEditor.isEmpty();
    },
    getBlockSelectionInfo() {
      this.blocksForAlignment.count = 0;
      if (this.blocksForAlignment.start._id && this.blocksForAlignment.end._id) {
        let api_url = this.API_URL + 'books/' + this.$store.state.currentBookid + '/selection_alignment';
        let api = this.$store.state.auth.getHttp();
        let query = 'start=' + this.blocksForAlignment.start._id + '&end=' + this.blocksForAlignment.end._id;
        if (this.tc_hasTask('audio_mastering') || this.currentBookCounters.not_marked_blocks === 0) {
          query+='&voicework=all_audio&realign=true';
        } else { // In case of normal task (with tts counter)
          query+='&voicework=all_with_tts';
        }
        api.get(api_url + '?' + query, {})
          .then(response => {
            if (response.status == 200) {
              this.blocksForAlignment.count = response.data.count;
              this.blocksForAlignment.countTTS = response.data.countTTS;
            }
          })
      }
    },

    ...mapActions(['loadBook', 'updateBooksList', 'loadTTSVoices'])
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
  margin-top: -10px;

  .contentarea {
    margin-top:10px;
  }

  #bodytable {
    width: 100%;
    margin-top: -23px;
    display: table;
    tr {
      td {
        /*vertical-align: top;*/
        &.toolbar-wrapper {
          /*box-shadow: 0px 0px 3px 2px rgba(178, 191, 224, 0.53);*/
          height: 3em;
          width: 99.4%;
          &.meta-visible {
            width: 69.4%;
          }
        }
        &.maincontent {
          overflow: hidden;
          max-width: 500px;
          padding-top: 2em;
        }
        &.metaedit {
          width: 30%;
          min-width: 300px!important;
          vertical-align: top;
          padding-left: 6px;
        }
        &.collapseEditBar {
          vertical-align: top;
          width: 40px;
          min-width: 40px;
          height: 100%;
          /*padding: 13px*/
          padding-top: 23px;
          padding-left: 8px;
          cursor: pointer;
          /*position: relative;*/

          .bar {
            width: 100%;
            min-width: 2px;
            height: 100%;
            background-color: rgba(204, 212, 226, .25);
            /*position: relative;*/

            .collapsebtn {
              /*position: fixed;*/
              background: white;
              padding: 5px 5px 3px 8px;
              border: .5px solid rgb(204, 212, 226);
              border-radius: 25px;
              box-shadow: 0px 0px 5px 1px rgba(0,0,0,0.2);
              color: rgba(204, 212, 226, 1);
              cursor: pointer;
              font-size: 1.25em;

              &.fa-chevron-left {
                padding-left: 5px;
                padding-right: 8px;
              }
              &:hover {
                color: green;
              }
            }
          }
          &.visible {
            .fa-chevron-right {
              margin-top: 50px;
              margin-left: -3px;
            }
          }
        }
      }
    }
  }
}
</style>
