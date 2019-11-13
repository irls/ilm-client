<template>
  <fieldset class="publish">
  <!-- Fieldset Legend -->
    <legend>Publication<!--{{ currentBookMeta.published ? 'Published' : 'Unpublished' }}--></legend>
    <div>
      Version #{{ currentBookMeta.version ? currentBookMeta.version : '1.0' }} 
    </div>
    <div v-if="publicationStatus" >
      Status #{{ publicationStatus }}
    </div>
    <div v-if="currentBookMeta.publishedVersion">
      Published version {{currentBookMeta.publishedVersion}}
    </div>
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
        isPublishingQueue: false
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
          var pDate = new Date(this.currentBookMeta.publishLog.publishTime);
          var pDay = pDate.getDate()
          var pMonth = pDate.getMonth() + 1
          var pYear = pDate.getFullYear()
          var pMin = pDate.getMinutes()
          var pHours = pDate.getHours()

          return pYear + '.' + pMonth + '.' + pDay + ' ' + pHours + ':' + pMin;
        },
        cache: false
      },
      updateDate: {
        get() {
          var uDate = new Date(this.currentBookMeta.publishLog.updateTime);
          var uDay = uDate.getDate()
          var uMonth = uDate.getMonth() + 1
          var uYear = uDate.getFullYear()
          var uMin = uDate.getMinutes()
          var uHours = uDate.getHours()

          return uYear + '.' + uMonth + '.' + uDay + ' ' + uHours + ':' + uMin;
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