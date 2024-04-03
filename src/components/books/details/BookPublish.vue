<template>
  <fieldset class="publish publish-book">
    <!-- Fieldset Legend -->
    <legend style="margin-bottom: 1px !important;">Publication<!--{{ currentBookMeta.published ? 'Published' : 'Unpublished' }}--></legend>
    <BlocksDisable v-if="showDisabledBlock"></BlocksDisable>

    <section v-if="!isInCollection" class="publish-section">
      <div v-if="currentBookMeta.publishedVersion">
        {{publishedLabel}}  Ver. {{currentBookMeta.publishedVersion}} &nbsp; {{publishDate}}
      </div>
      <div v-if="currentBookMeta.publishedVersion != currentBookMeta.version || !currentBookMeta.version">
        Unpublished: Ver. {{ currentBookMeta.version ? currentBookMeta.version : '1.0' }} &nbsp; {{updateDate}}
      </div>
      <div v-if="currentBookMeta.publicationStatus && (currentBookMeta.publicationStatus.includes('Error') || currentBookMeta.publicationStatus.includes('failed'))" >
        <span style="color: red">Publication failed</span>
      </div>
      <div v-if="disabledBlocks.ranges.length > 0">
        <template v-if="disabledBlocksQuery">
          <div class="preloader-spinner"></div>
        </template>
        <template v-else>
        {{disabledBlocks.blocks.length}}&nbsp;block(s) disabled in range
          <template v-for="(range, rangeIdx) in disabledBlocks.ranges">
            <a v-on:click="goToBlock(range.start.blockid)" class="go-to-block">{{range.start.shortid}}</a>
            &nbsp;-&nbsp;
            <a v-on:click="goToBlock(range.end.blockid)" class="go-to-block">{{range.end.shortid}}</a>
            <template v-if="rangeIdx < disabledBlocks.ranges.length - 1">, </template>
          </template>
        </template>
      </div>
      <div v-if="allowPublishCurrentBook && currentBookMeta.job_status !== 'archived'" style="margin-top: 10px;">
        <button disabled class="btn btn-primary" v-if="isPublishingQueue">Already in queue</button>
        <button class="btn btn-primary" v-on:click="checkPublish()" v-if="!isPublishingQueue && !isPublishing && publishButtonStatus">
          Publish
        </button>
        <button disabled="disabled" class="btn btn-primary" v-else-if="!isPublishingQueue && !isPublishing && !publishButtonStatus">
          Publish
        </button>
        <span v-if="isPublishing" class="align-preloader -small"></span>
      </div>
    </section>

    <section v-if="isInCollection" class="publish-section">
      <div v-if="currentBookMeta.publishedVersion">
        {{publishedLabel}}  Ver. {{currentBookMeta.publishedVersion}} &nbsp; {{publishDate}}
      </div>
      <div v-if="currentBookMeta.publishedVersion != currentBookMeta.version || !currentBookMeta.version">
        Unpublished: Ver. {{ currentBookMeta.version ? currentBookMeta.version : '1.0' }} &nbsp; {{updateDate}}
      </div>

      <div v-if="currentBookMeta.publicationStatus && (currentBookMeta.publicationStatus.includes('Error') || currentBookMeta.publicationStatus.includes('failed'))" >
        <span style="color: red">Publication failed</span>
      </div>

      <button disabled class="btn btn-primary" v-if="isPublishing">Already in queue</button>

      <label class="collection-publish-box" v-if="!isPublishing && publishButtonStatus">
        <input type="checkbox" v-on:click.prevent="checkCollectionPublish" v-model="isPublishingQueue"> Ready for publication</input>
      </label>

      <label class="collection-publish-box disabled" v-else-if="!isPublishing && !publishButtonStatus">
        <input type="checkbox" disabled> Ready for publication</input>
      </label>

      <span v-if="isPublishing" class="align-preloader -small"></span>
    </section>
    <div class="publish-html-validation" v-if="showPublicationErrors" v-bind:key="'errors' + currentBookMeta.bookid">
      <Accordion ref="publicationErrorsAccordion" v-on:tab-open="publicationErrorTabOpen">
        <AccordionTab :header="'Publication errors (' + publicationErrorsCount + ')'">
          <div v-for="publication_error in publicationErrors" class="publication-error">
            <div class="publication-error-blockid" v-if="publication_error.blockid">
              <a v-on:click="goToBlock(publication_error.blockid)">{{ shortId(publication_error.blockid) }}</a>
            </div>
            <div class="publication-error-message">{{ publication_error.message }}</div>
            <div class="publication-error-info">{{ publication_error.info }}<template v-if="publication_error.line && publication_error.col">, line {{ publication_error.line }}, col {{ publication_error.col }}</template></div>
          </div>
        </AccordionTab>
      </Accordion>
    </div>
  </fieldset>
</template>
<script>
  import {mapActions, mapGetters} from 'vuex';
  import api_config from '../../../mixins/api_config.js';
  import axios from 'axios';
  import BlocksDisable from './BlocksDisable';
  import access from '../../../mixins/access.js';
  import Accordion from 'primevue/accordion';
  import AccordionTab from 'primevue/accordiontab';
  export default {
    name: 'BookPublish',
    data() {
      return {
        publicationStatus: false,
        isPublishing: false,
        isPublishingQueue: false,
        txt_months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun",  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      }
    },
    mixins: [api_config, access],
    components: {BlocksDisable, Accordion, AccordionTab},
    methods: {
      checkPublish(successCallback = null) {
        this.$emit('checkPublish');

        let title = '';
        let text = '';
        let buttons = [];
        let popUpReady = false;
        let defaultCategory = ['story', 'Stories']; // means there is no category assigned


        let canPublish = true;
        let mandatoryFields = [];

        //Book meta is incomplete. Define Title, Author, Title EN (title English translation), Author EN (author English translation) Category, and URL Slug before publishing

        //console.log('meta', this.currentBookMeta);

        if (this.currentBookMeta.title == ''){
            canPublish = false;
            mandatoryFields.push('Title');
        }

        if (this.currentBookMeta.author.join("").length == 0){
            canPublish = false;
            mandatoryFields.push('Author');
        }

        if (this.currentBookMeta.language != 'en' && (this.currentBookMeta.title_en == '' || !this.currentBookMeta.hasOwnProperty('title_en'))){
            canPublish = false;
            mandatoryFields.push('Title EN (title English translation)');
        }

        if (this.currentBookMeta.language != 'en' && (this.currentBookMeta.author_en == '' || !this.currentBookMeta.hasOwnProperty('author_en'))){
            canPublish = false;
            mandatoryFields.push('Author EN (author English translation)');
        }

        const alt_meta = this.currentBookMeta.alt_meta;
        let checkCategory = (
          alt_meta.reader
          && alt_meta.reader.category
          && alt_meta.reader.category.trim().length
          && !defaultCategory.includes(alt_meta.reader.category)
        );
        checkCategory = checkCategory || (
          alt_meta.ocean
          && alt_meta.ocean.category
          && alt_meta.ocean.category.trim().length
          && !defaultCategory.includes(alt_meta.ocean.category)
        );
        checkCategory = checkCategory || (
          this.currentBookMeta.collection_id
          && this.currentBookMeta.collection_id.length
        ); // override by collection
        if(!checkCategory) {
            canPublish = false;
            mandatoryFields.push('Category');
        }

        if (this.currentBookMeta.slug == '' || !this.currentBookMeta.hasOwnProperty('slug')){
            canPublish = false;
            mandatoryFields.push('URL slug');
        }

        if ( parseFloat(this.currentBookMeta.difficulty) > 14.99 ){
          canPublish = false;
          mandatoryFields.push('difficulty');
        }
        if ( this.currentBookMeta.difficulty !='' && parseFloat(this.currentBookMeta.difficulty) < 1){
          canPublish = false;
          mandatoryFields.push('difficulty');
        }
        if( this.currentBookMeta.difficulty && isNaN(parseFloat(this.currentBookMeta.difficulty)) ){
          canPublish = false;
          mandatoryFields.push('difficulty');
        }
        let hasGenres = !this.isBookReaderCategory || (Array.isArray(this.currentBookMeta.genres) && this.currentBookMeta.genres.length > 0);
        if (!hasGenres) {
          canPublish = false;
        }


        if(!canPublish){
          title = 'Publication error';
          let errorText = '';
          if (mandatoryFields.length > 0) {
            errorText+= `${mandatoryFields.join(", ")}`;
            if (!hasGenres) {
              errorText+= ` and Genres`;
            }
          } else if (!hasGenres) {
            errorText+= ` Genres`;
          }
          text = 'Book meta is incomplete. Define ' + errorText + ' before publishing';

          buttons = [
              {
                  title: 'Ok',
                  handler: () => {
                      this.$root.$emit('hide-modal');
                  },
              },
          ];
          popUpReady = true;

        }

        if(!popUpReady) {
          let count = 0;
          if (this.currentJobInfo.tasks_counter && Array.isArray(this.currentJobInfo.tasks_counter)) {
              this.currentJobInfo.tasks_counter.forEach(tc => {
                  if (tc && tc.data && tc.data.tasks && Array.isArray(tc.data.tasks)) {
                      tc.data.tasks.forEach(t => {
                          count+= t.count ? parseInt(t.count) : 0;
                      });
                  }
              });
          }
          let byAudioQuality = Array.from(this.storeList).reduce((acc, block) => {
            if (block[1] && block[1].audio_quality) {
              if (!acc[block[1].audio_quality]) {
                acc[block[1].audio_quality] = 0;
              }
              ++acc[block[1].audio_quality];
            }
            return acc;
          }, {});
          let quality_count = Object.keys(byAudioQuality).length;
          if (count === 0 && quality_count < 2) {
              title = 'Publish the Book?';
          } else {
              if (count > 0) {
                title = 'The Book has incomplete Tasks.';
              }
              if (quality_count > 1) {
                title+= `<br><br>Audio quality varying: `;
                Object.keys(byAudioQuality).forEach(q => {
                  title+= ` ${byAudioQuality[q]} `;
                  switch (q) {
                    case 'raw':
                      title+= 'Raw,';
                      break;
                    case 'improved':
                      title+= 'Refined,';
                      break;
                    case 'mastered':
                      title+= 'Mastered,';
                      break;
                  }
                });
                title = title.replace(/,$/, '') + ' Blocks';
              }
              title+= `<br><br> Publish anyway?`;
          }
          buttons = [
              {
                  title: 'Cancel',
                  handler: () => {
                      this.$root.$emit('hide-modal');
                  },
              },
              {
                  title: 'Publish',
                  handler: () => {
                      this.$root.$emit('hide-modal');
                      if (successCallback) {
                        successCallback();
                      }
                      else {
                        this.publish();
                      }
                  },
                  'class': 'btn btn-primary'
              }
          ];
          popUpReady = true;

        }

        if(popUpReady){
            this.$root.$emit('show-modal', {
                title: title,
                text: text,
                buttons: buttons,
                class: ['align-modal']
            });

        }
      },
      publish() {
        return axios.post(this.API_URL + 'books/' + this.currentBookMeta.bookid + '/publish')
          .then(resp => {
            if (resp.status == 200 && resp.data.ok) {
              this.currentBookMeta.isInTheQueueOfPublication = true;
              this.currentBookMeta.publication_errors = {};
            }
          });
      },
      checkCollectionPublish(ev) {
        if (this.currentBookMeta) {
          if (!this.currentBookMeta.isInTheQueueOfPublication) {
            this.checkPublish(()=>{
              return axios.get(this.API_URL + 'books/' + this.currentBookMeta.bookid + '/add_in_collection_publish')
              .then(resp => {
                if (resp.status == 200 && resp.data.ok) {
                  this.currentBookMeta.isInTheQueueOfPublication = true;
                  }
                });
            });
          } else {
            return axios.get(this.API_URL + 'books/' + this.currentBookMeta.bookid + '/rem_from_collection_publish')
            .then(resp => {
              if (resp.status == 200 && resp.data.ok) {
                this.currentBookMeta.isInTheQueueOfPublication = false;
              }
            });
          }
        }
      },
      goToBlock(blockid) {
        this.$root.$emit('for-bookedit:scroll-to-block', blockid);
      },
      shortId(blockid) {
        const blockIdRgx = /.*(?:\-|\_){1}([a-zA-Z0-9]+)$/;
        let _id_short = blockIdRgx.exec(blockid);
        _id_short = (_id_short && _id_short.length == 2) ? _id_short[1] : blockid;
        if (_id_short.length > 7) {
          _id_short = _id_short.substr(0, 2) + '...' + _id_short.substr(_id_short.length - 2, 2);
        }
        return _id_short;
      },
      publicationErrorTabOpen() {
        setTimeout(() => {
          this.$refs.publicationErrorsAccordion.$el.scrollIntoView({
            behavior: 'smooth'
          });
        }, 300);
      },
      ...mapActions('setBlocksDisabled', ['getDisabledBlocks'])
    },
    computed: {
      publishDate: {
        get() {
          if (this.currentBookMeta.hasOwnProperty('publishLog') && this.currentBookMeta.publishLog != null && this.currentBookMeta.publishLog != false && this.currentBookMeta.publishLog != undefined){
            if (this.currentBookMeta.publishLog.publishTime != false && this.currentBookMeta.publishLog.publishTime != undefined){
              var pDate = new Date(this.currentBookMeta.publishLog.publishTime);
              var publishDate = ' ' + pDate.getDate() + ' ' + this.txt_months[pDate.getMonth()] + ' ' + pDate.getFullYear();
            } else {
              var publishDate = '';
            }
          } else {
            var publishDate = '';
          }
          return publishDate;
        },
        cache: false
      },
      updateDate: {
        get() {
          if (this.currentBookMeta.hasOwnProperty('publishLog') && this.currentBookMeta.publishLog != null && this.currentBookMeta.publishLog != false && this.currentBookMeta.publishLog != undefined){
            if (this.currentBookMeta.publishLog.updateTime != false && this.currentBookMeta.publishLog.updateTime != undefined){
              var uDate = new Date(this.currentBookMeta.publishLog.updateTime);
              var updateDate = ' ' + uDate.getDate() + ' ' + this.txt_months[uDate.getMonth()] + ' ' + uDate.getFullYear();
            } else {
              var updateDate = '';
            }
          } else {
            var updateDate = '';
          }
          return updateDate;
        },
        cache: false
      },
      showDisabledBlock: {
        get() {
          return this.adminOrLibrarian || this._is('editor', true);
        },
        cache: false
      },
      isInCollection: {
        get() {
          return this.currentBookMeta
              && this.currentBookMeta.collection
              && this.currentBookMeta.collection.length
              && this.currentBookMeta.collection_id
              && this.currentBookMeta.collection_id.length
        }
      },
      publishedLabel: {
        get() {
          const pubCollection = this.isBookWasPublishedInCollection({
            bookId: this.currentBookMeta.bookid,
            /*currCollId: this.currentBookMeta.collection_id*/
          })
          if (pubCollection) {
            if (pubCollection._id !== this.currentBookMeta.collection_id) {
              return `Published in "${pubCollection.title}" collection:`
            } else {
              return 'Published:';
            }
          }
          const {publishedVersion = ''} = this.currentBookMeta;
          if (!pubCollection && this.isInCollection
            && publishedVersion !== 'false' && publishedVersion !== '') {
            return 'Published out of collection:';
          }
          //if (this.isInCollection )
          return 'Published:';
        }
      },
      publicationErrorsCount: {
        get() {
          return this.publicationErrors.length;
        },
        cache: false
      },
      publicationErrors: {
        get() {
          let errors = [];
          if (this.currentBookMeta.publication_errors) {
            if (Array.isArray(this.currentBookMeta.publication_errors.blocks) && this.currentBookMeta.publication_errors.blocks.length > 0) {
              errors = this.currentBookMeta.publication_errors.blocks;
            } else if (this.currentBookMeta.publication_errors.book && this.currentBookMeta.publication_errors.book.message) {
              errors.push({
                message: this.currentBookMeta.publication_errors.book.message,
                info: this.currentBookMeta.publication_errors.book.info
              });
            }
          }
          return errors;
        },
        cache: false
      },
      showPublicationErrors: {
        get() {
          return this.adminOrLibrarian && this.publicationErrorsCount > 0;
        },
        cache: false
      },
      ...mapGetters(['currentBookMeta', 'allowPublishCurrentBook', 'publishButtonStatus', 'currentJobInfo', 'storeList', 'adminOrLibrarian', 'isBookWasPublishedInCollection', 'isBookReaderCategory']),
      ...mapGetters('setBlocksDisabled', ['disabledBlocks', 'disabledBlocksQuery'])
    },
    mounted() {
      if (this.currentBookMeta && this.currentBookMeta.isInTheQueueOfPublication) {
        this.isPublishingQueue = this.currentBookMeta.isInTheQueueOfPublication;
      }
      if (this.currentBookMeta && this.currentBookMeta.isIntheProcessOfPublication) {
        this.isPublishing = this.currentBookMeta.isIntheProcessOfPublication;
      }
      this.getDisabledBlocks();
      this.$root.$on('book-reimported', this.getDisabledBlocks);
      //console.log(`this.currentBookMeta: `, this.currentBookMeta);
      //console.log(`publishButtonStatus: `, this.publishButtonStatus);
    },
    beforeDestroy() {
      this.$root.$off('book-reimported', this.getDisabledBlocks);
    },
    watch: {
      'currentBookMeta.publicationStatus': {
        handler(val) {
          this.publicationStatus = val;
        }
      },
      'currentBookMeta.isIntheProcessOfPublication': {
        handler(val) {
          console.log(val)
          this.isPublishing = !!val;
        }
      },
      'currentBookMeta.isInTheQueueOfPublication': {
        handler(val) {
          this.isPublishingQueue = !!val;
        }
      },
      'currentBookMeta.bookid': {
        handler(val) {
          if (val) {
            this.getDisabledBlocks();
          }
        }
      }

    }
  }
</script>
<style lang="less">
  fieldset.publish-book {
    padding-bottom: 0px !important;
  }
  .preloader-spinner {
    width: 100%;
    height: 50px;
    background: url(/static/preloader-snake-small.gif);

    background-repeat: no-repeat;
    text-align: center;
    background-position: center center;
  }
  .publish-section {
    padding-top: 10px;
    .collection-publish-box {
      font-weight: 400;
      margin-bottom: 0px;

      &.disabled {
        cursor: not-allowed;
        opacity: 0.8;
      }
    }
  }
  .publish-html-validation {
    white-space: pre-wrap;
    margin: 10px -6px 0px -6px;
    line-height: 0px;

    .p-accordion {
      .p-accordion-header {
        &:focus {
          border: 1px solid #a19f9d !important;
          box-shadow: none !important;
        }
        .p-accordion-header-link {
          text-decoration: none;
          font-weight: normal;
          &:focus {
            border: 1px solid #a19f9d !important;
            box-shadow: none !important;
          }
          .p-accordion-header-text {
            font-weight: normal;
          }
        }
      }
      .p-accordion-tab {
        margin-bottom: 0px;
        .p-accordion-content {
          padding: 0px;
          max-height: 300px;
          overflow-y: scroll;
          width: 425px;
          max-width: 425px;
          overflow-x: hidden;
        }
        .p-accordion-content::-webkit-scrollbar-track {
          -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
          border-radius: 10px;
          background-color: #F5F5F5;
        }
        .p-accordion-content::-webkit-scrollbar {
          width: 12px;
          background-color: #F5F5F5;
        }
        .p-accordion-content::-webkit-scrollbar-thumb {
          border-radius: 10px;
          -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
          background-color: #555;
        }
      }
    }
    .publication-error {
      line-height: 20px;
      padding: 3px 5px;
      &:nth-child(even) {
        background-color: #f2f2f2;
      }
      div {
        display: inline-block;
        vertical-align: top;
        &.publication-error-blockid {
          width: 12%;
          max-width: 12%;
          padding: 0px 5px;
          a {
            text-decoration: underline;
            cursor: pointer;
          }
        }
        &.publication-error-message {
          max-width: 85%;
        }
        &.publication-error-info {
          padding: 0px 5px;
          white-space: pre;
          display: block;
        }
      }
    }
  }

</style>
