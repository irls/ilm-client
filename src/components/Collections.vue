<template>
  <div id='booksarea' v-cloak>
    <div :class="['content-meta-wrapper', 'meta-visible']">
      <div class="scroll-wrapper" v-bind:class="'-lang-' + currentBookMeta.language">
          <template v-if="isEditMode()">
            <BookEdit v-if="bookEditMode == 'Editor'" :mode="mode"/>
            <BookEditHtml v-else-if="bookEditMode == 'HTML'" />
            <BookEditJson v-else-if="bookEditMode == 'JSON'" />
            <BookEditDisplay v-else="bookEditMode == 'Display'" />
          </template>
          <CollectionsGrid v-else
            @selectCollection="selectCollection"
            @selectBook="selectBook"/>
      </div>
    </div>

    <div class='metaedit' v-if='hasBookSelected'>
      <CollectionTabs @collectionRemoved="collectionRemoved"></CollectionTabs>
      <BookMetaEdit :blocksForAlignment="blocksForAlignment"></BookMetaEdit>
    </div>

    <v-dialog :clickToClose="false"/>
  </div>
</template>
<script>
  import CollectionsGrid from './collections/CollectionsGrid';
  import CollectionTabs from './collections/CollectionTabs';
  import BookMetaEdit from './books/BookMetaEdit';
  import { mapGetters, mapActions } from 'vuex';
  import BookEdit from './books/BookEdit'
  import Vue from 'vue';
  import api_config from '../mixins/api_config.js'
  import task_controls from '../mixins/task_controls.js'
  var modal = require('vue-js-modal');

  Vue.use(modal, {dialog: true});
  export default {
      name: 'Collections',
      components: {
        CollectionsGrid: CollectionsGrid,
        CollectionTabs: CollectionTabs,
        BookMetaEdit: BookMetaEdit,
        BookEdit: BookEdit
      },
      mixins: [api_config, task_controls],
      data() {
        return {
          collectionMetaVisible: false,
          bookMetaVisible: false,
          blocksForAlignment: {
            start: {},
            end: {},
            count: 0
          },
          currentBook: {}
        }
      },
      props: ['mode'],
      methods: {
        hasBookSelected () {
          return !!this.currentBookMeta.bookid;
        },
        isEditMode () {
          return this.$route.matched.some(record => {
            return record.meta.mode === 'edit' || record.meta.mode === 'narrate'
          })
        },
        onCollectionAdded(id) {
          //let current = this.bookCollections.find(bk => bk._id == id);
          //if (current) {
          //this.loadCollection(false);
          if (this.currentCollection._id !== id) {
            this.$store.commit('SET_CURRENT_COLLECTION', false);
            this.selectCollection(id);
            this.scrollToRow(id);
          }
          //}
        },
        selectCollection(id) {
          //if (!this.currentCollection || collection._id !== this.currentCollection._id) {
            //this.currentCollection = collection;
            //this.currentBook = false;
            //this.bookMetaVisible = false;
            //this.$router.replace({ path: '/collections/' + this.currentCollection._id })
          //}
          if (this.currentCollection._id !== id) {
            this.loadCollection(id)
              .then(() => {
                this.$router.replace({ path: '/collections/' + id });
              });
          }
        },
        selectBook(id, collection_id) {
          this.loadBook(id);
          this.$router.replace({ path: '/collections/' + collection_id + '/' + id });
        },
        collectionRemoved() {
          this.collectionMetaVisible = false;
        },
        scrollToRow(id) {
          let t = setTimeout(function() {
            let el = document.getElementById('collection-' + id);
            if (el) {
              var offset = el.getBoundingClientRect();
              window.scrollTo(0, window.pageYOffset + offset.top - 110);
              //clearInterval(t);
            }
          }, 500);
        },
        getBlockSelectionInfo() {
          this.blocksForAlignment.count = 0;
          if (this.blocksForAlignment.start._id && this.blocksForAlignment.end._id) {
            let api_url = this.API_URL + 'books/' + this.$store.state.currentBookid + '/selection_alignment';
            let api = this.$store.state.auth.getHttp();
            let query = 'start=' + this.blocksForAlignment.start._id + '&end=' + this.blocksForAlignment.end._id;
            if (this.tc_hasTask('audio_mastering') || this.currentBookCounters.not_marked_blocks === 0) {
              query+='&voicework=all_audio&realign=true';
            }
            api.get(api_url + '?' + query, {})
              .then(response => {
                if (response.status == 200) {
                  this.blocksForAlignment.count = response.data.count;
                }
              })
          }
        },
        showModal(params) {
          //console.log('MODAL SHOW')
          this.$modal.show('dialog', params);
        },
        hideModal() {
          //console.log('MODAL HIDE')
          this.$modal.hide('dialog');
        },
        ...mapActions(['loadCollection', 'loadBook'])
      },
      mounted() {
        if (this.$route.params.hasOwnProperty('collectionid')) {
            this.loadCollection(this.$route.params.collectionid);
            this.scrollToRow(this.$route.params.collectionid);
        }
        if (this.$route.params.hasOwnProperty('bookid')) {
            this.loadBook(this.$route.params.bookid);
        }
        this.$root.$on('from-bookedit:set-selection', (start, end) => {
          this.blocksForAlignment.start = start;
          this.blocksForAlignment.end = end;
          this.getBlockSelectionInfo();
        });
        this.$root.$on('from-bookblockview:voicework-type-changed', () => {
          this.getBlockSelectionInfo();
        });
        this.$root.$on('show-modal', (params) => {this.showModal(params)})
        this.$root.$on('hide-modal', () => {this.hideModal()})
      },
      computed: {
        metaVisible: {
          get() {
            return this.bookMetaVisible || this.collectionMetaVisible
          }
        },
        hasItemSelected: {
          get() {
            return this.currentCollection._id || this.currentBook._id;
          }
        },
        ...mapGetters([
          'currentCollection', 'currentBookMeta', 'collectionsFilter', 'bookEditMode', 'currentBookCounters', 'currentCollectionId'
        ])
      },
      watch: {
        currentCollection: {
          handler(val) {
            this.currentBook = {};
            if (!this.$route.params.hasOwnProperty('bookid')) {
              this.collectionMetaVisible = this.metaVisible;
              this.bookMetaVisible = false;
            } else {
              this.collectionMetaVisible = false;
            }
          }
        },
        currentBookMeta: {
          handler(val) {
            if (this.$route.params.hasOwnProperty('bookid')) {
              this.bookMetaVisible = this.metaVisible;
              this.collectionMetaVisible = false;
            } else {
              this.collectionMetaVisible = this.metaVisible;
              this.bookMetaVisible = false;
            }
            this.currentBook = Object.assign({}, val);
          }
        },
        'currentCollectionId': {
          handler(val, oldVal) {
            if (oldVal && !val) {
              this.$router.replace({name: 'Collections'});
            }
          }
        }
      }
  }
</script>
