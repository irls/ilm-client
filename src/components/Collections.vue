<template>
  <div id='booksarea' v-cloak>
    <table id='bodytable'>
      <tr>
        <td :class="['toolbar-wrapper', metaVisible ? 'meta-visible' : '']">
            <BookEditToolbar v-if="isEditMode()"
            :toggleMetaVisible="toggleMetaVisible"
            :hasBookSelected="hasBookSelected"
            :metaVisible="metaVisible"/>
            <CollectionsToolbar v-else
              :hasItemSelected="hasItemSelected"
              :metaVisible="metaVisible"
              @collectionAdded="onCollectionAdded"
              @toggleMetaVisible="toggleMetaVisible"/>

        </td> <!--collapseEditBar visible-->
        <td class='metaedit' v-if='metaVisible' rowspan="2">
          <CollectionMeta v-if="collectionMetaVisible"
            @collectionRemoved="collectionRemoved"></CollectionMeta>
          <BookMetaEdit v-if="bookMetaVisible"
            :blocksForAlignment="blocksForAlignment"></BookMetaEdit>
        </td>
      </tr>
      <tr>
        <td class='maincontent scrollable'>
          <template v-if="isEditMode()">
            <BookEdit v-if="bookEditMode == 'Editor'" />
            <BookEditHtml v-else-if="bookEditMode == 'HTML'" />
            <BookEditJson v-else-if="bookEditMode == 'JSON'" />
            <BookEditDisplay v-else="bookEditMode == 'Display'" />
          </template>
          <CollectionsGrid v-else 
            @selectCollection="selectCollection"
            @selectBook="selectBook"/>
        </td>
      </tr>
    </table>
    <nav :class="['navbar', 'fixed-bottom', 'navbar-light', 'bg-faded', {'hidden': !showAudioeditor()}]" >
      <AudioEditor ref="audioEditor"></AudioEditor>
    </nav>
  </div>
</template>
<script>
  import BookEditToolbar from './books/BookEditToolbar';
  import CollectionsToolbar from './collections/CollectionsToolbar';
  import CollectionsGrid from './collections/CollectionsGrid';
  import CollectionMeta from './collections/CollectionMeta';
  import BookMetaEdit from './books/BookMetaEdit';
  import { mapGetters, mapActions } from 'vuex';
  import AudioEditor from './AudioEditor';
  import Vue from 'vue';
  export default {
      name: 'Collections',
      components: {
        BookEditToolbar: BookEditToolbar,
        CollectionsToolbar: CollectionsToolbar,
        CollectionsGrid: CollectionsGrid,
        CollectionMeta: CollectionMeta,
        BookMetaEdit: BookMetaEdit,
        AudioEditor: AudioEditor
      },
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
      methods: {
        isEditMode() {
          return this.$store.state.route.path.indexOf('/books/edit') > -1
        },
        onCollectionAdded(id) {
          //let current = this.bookCollections.find(bk => bk._id == id);
          //if (current) {
          //this.loadCollection(false);
          if (this.currentCollection._id !== id) {
            this.$store.commit('SET_CURRENT_COLLECTION', {});
            this.selectCollection(id);
            this.collectionMetaVisible = true;
            this.scrollToRow(id);
          }
          //}
        },
        toggleMetaVisible() {
          if (this.currentBookMeta._id) {
            this.bookMetaVisible = !this.bookMetaVisible;
          } else if (this.currentCollection._id) {
            this.collectionMetaVisible = !this.collectionMetaVisible;
          }
        },
        selectCollection(id) {
          //if (!this.currentCollection || collection._id !== this.currentCollection._id) {
            //this.currentCollection = collection;
            //this.currentBook = false;
            //this.bookMetaVisible = false;
            //this.$router.replace({ path: '/collections/' + this.currentCollection._id })
          //}
          if (this.currentCollection._id !== id) {
            this.loadCollection(id);
            this.$router.replace({ path: '/collections/' + id });
          }
        },
        selectBook(id, collection_id) {
          this.loadBook(id);
          this.$router.replace({ path: '/collections/' + collection_id + '/' + id });
        },
        collectionRemoved() {
          this.collectionMetaVisible = false;
        },
        showAudioeditor() {
          return this.$refs.audioEditor && !this.$refs.audioEditor.isEmpty();
        },
        scrollToRow(id) {
          let t = setTimeout(function() {
            let el = document.getElementById('collection-' + id);
            if (el) {
              var offset = el.getBoundingClientRect();
              window.scrollTo(0, window.pageYOffset + offset.top - 110);
              clearInterval(t);
            }
          }, 500);
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
          'currentCollection', 'currentBookMeta', 'collectionsFilter'
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
            }
            this.currentBook = Object.assign({}, val);
          }
        }
      }
  }
</script>