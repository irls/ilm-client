<template>
  <fieldset class="publish">
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
  </fieldset>
</template>
<script>
  import {mapActions, mapGetters} from 'vuex';
  import api_config from '../../../mixins/api_config.js';
  import axios from 'axios';
  import BlocksDisable from './BlocksDisable';
  import access from '../../../mixins/access.js';
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
    components: {BlocksDisable},
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

        //if (!this.currentBookMeta.collection_id || !this.currentBookMeta.collection_id.length) {
        const alt_meta = this.currentBookMeta.alt_meta;
        if((!alt_meta.reader.category && !alt_meta.ocean.category) || defaultCategory.includes(alt_meta.reader.category)) {
            canPublish = false;
            mandatoryFields.push('Category');
        }

        if (this.currentBookMeta.slug == '' || !this.currentBookMeta.hasOwnProperty('slug')){
            canPublish = false;
            mandatoryFields.push('URL slug');
        }
        //}

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


        if(!canPublish){
          title = 'Publication error';
          text = 'Book meta is incomplete. Define ' + mandatoryFields.join(", ") + ' before publishing';

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
      ...mapGetters(['currentBookMeta', 'allowPublishCurrentBook', 'publishButtonStatus', 'currentJobInfo', 'storeList', 'adminOrLibrarian', 'isBookWasPublishedInCollection']),
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

</style>
