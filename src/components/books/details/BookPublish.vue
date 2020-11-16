<template>
  <fieldset class="publish">
  <!-- Fieldset Legend -->
    <legend style="margin-bottom: 1px !important;">Publication<!--{{ currentBookMeta.published ? 'Published' : 'Unpublished' }}--></legend>
    <div v-if="currentBookMeta.publishedVersion">
      Published:  Ver. {{currentBookMeta.publishedVersion}} &nbsp; {{publishDate}}
    </div>
    <div v-if="currentBookMeta.publishedVersion != currentBookMeta.version || !currentBookMeta.version">
      Unpublished: Ver. {{ currentBookMeta.version ? currentBookMeta.version : '1.0' }} &nbsp; {{updateDate}}
    </div>
    <div v-if="currentBookMeta.publicationStatus && (currentBookMeta.publicationStatus.includes('Error') || currentBookMeta.publicationStatus.includes('failed'))" >
      <span style="color: red">Publication failed</span>
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
  </fieldset>
</template>
<script>
  import {mapActions, mapGetters} from 'vuex';
  import api_config from '../../../mixins/api_config.js';
  import axios from 'axios';
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
    mixins: [api_config],
    methods: {
      checkPublish() {
        this.$emit('checkPublish');

        let title = '';
        let text = '';
        let buttons = [];
        let popUpReady = false;
        let defaultCategory = ['story', 'Stories']; // means there is no category assigned

        if(!this.currentBookMeta.category || defaultCategory.includes(this.currentBookMeta.category)){
          title = 'Publication failed';
          text = 'The Book has no Category. Please define it in Book Meta and try again';

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
                      this.publish();
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
      }
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
      ...mapGetters(['currentBookMeta', 'allowPublishCurrentBook', 'publishButtonStatus', 'currentJobInfo', 'storeList'])
    },
    mounted() {
      if (this.currentBookMeta && this.currentBookMeta.isInTheQueueOfPublication) {
        this.isPublishingQueue = this.currentBookMeta.isInTheQueueOfPublication;
      }
      if (this.currentBookMeta && this.currentBookMeta.isIntheProcessOfPublication) {
        this.isPublishing = this.currentBookMeta.isIntheProcessOfPublication;
      }
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
      }

    }
  }
</script>
<style>
</style>
