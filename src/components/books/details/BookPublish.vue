<template>
  <fieldset class="publish">
  <!-- Fieldset Legend -->
    <legend>Publication<!--{{ currentBookMeta.published ? 'Published' : 'Unpublished' }}--></legend>
    <div v-if="currentBookMeta.publishedVersion">
      Published:  Ver. {{currentBookMeta.publishedVersion}} &nbsp; {{publishDate}}
    </div>
    <div v-if="currentBookMeta.publishedVersion != currentBookMeta.version || !currentBookMeta.version">
      Unpublished: Ver. {{ currentBookMeta.version ? currentBookMeta.version : '1.0' }} &nbsp; {{updateDate}}
    </div>
    <!--<div v-if="publicationStatus" >
      Status #{{ publicationStatus }}
    </div>-->
    <div v-if="allowPublishCurrentBook && currentBookMeta.job_status !== 'archived'">
      <button disabled class="btn btn-primary" v-if="isPublishingQueue">Already in queue</button>
      <button class="btn btn-primary" v-on:click="checkPublish()" v-if="!isPublishingQueue && !isPublishing">
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
        let message = '';
        if (count === 0) {
          message = 'Publish the Book?';
        } else {
          message = 'The Book has incomplete Tasks. Publish anyway?';
        }
        this.$root.$emit('show-modal', {
          title: message,
          text: '',
          buttons: [
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
          ],
          class: ['align-modal']
        });
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
      ...mapGetters(['currentBookMeta', 'allowPublishCurrentBook', 'currentJobInfo'])
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