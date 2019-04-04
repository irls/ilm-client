<template>
  <fieldset class="job-workflow">
    <legend>Workflow</legend>
    <template v-if="!currentJobInfo.published && !isPublishingQueue">
      <div v-if="archiveInProcess" class="preloader-small"></div>
      <template v-else>
        <div v-if="status == 'active'">
          <div class="status-name">{{statusName}}</div>
          <button class="btn btn-primary" v-on:click="archive()">Archive</button>
        </div>
        <div v-else-if="status == 'archived'">
          <div class="status-name">{{statusName}}: {{archived}}</div>
          <button class="btn btn-primary" v-on:click="archive()">Unarchive</button>
        </div>
      </template>
    </template>
    <div v-else class="status-name">
      {{statusName}}
    </div>
  </fieldset>
</template>
<script>
  import { mapGetters, mapActions } from 'vuex'
  export default {
    name: 'BookWorkflow',
    data() {
      return {
        archiveInProcess: false
      }
    },
    props: ['isPublishingQueue'],
    computed: {
      status: {
        get: function() {
          return this.currentJobInfo.workflow.status;
        },
        cache: false
      },
      statusName: {
        get: function() {
          switch (this.status) {
            case 'active':
              return 'Active';
            case 'archived':
              return 'Archived';
            default:
              return '';
          }
        },
        cache: false
      },
      archived: {
        get: function() {
          if (this.currentJobInfo.workflow.archived) {
            let dt = new Date(this.currentJobInfo.workflow.archived);
            if (isNaN(dt.getUTCMonth())) {
              return '';
            }
            let date = dt.getDate();
            let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            if (date < 10) {
              date = '0' + date;
            }
            return date + ' ' + monthNames[dt.getMonth()] + ' ' + dt.getFullYear();
          }
          return '';
        },
        cache: false
      },
      ...mapGetters(['adminOrLibrarian', 'currentJobInfo', 'currentCollectionId', 'bookFilters', 'collectionsFilter'])
    },
    methods: {
      archive(check = true) {
        if (check) {
          this.$root.$emit('show-modal', {
            title: this.status === 'active' ? 'Archive the Book and revoke all active tasks?' : 'Resume the workflow and activate all incomplete tasks?',
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                },
              },
              {
                title: this.status === 'active' ? 'Archive' : 'Unarchive',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  this.archive(false);
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
          return;
        }
        let status = null;
        if (this.status === 'active') {
          status = 'archived';
        } else if (this.status === 'archived') {
          status = 'active';
        }
        if (status) {
          this.archiveInProcess = true;
          return this.setJobStatus(status)
            .then(() => {
              return this.getCurrentJobInfo()
                .then(() => {
                  if (this.$route && ['BooksGrid', 'CollectionBook'].indexOf(this.$route.name) !== -1)
                  if (!this.currentCollectionId) {
                    if (this.bookFilters.jobStatus !== '') {
                      this.$router.replace({path: '/books', params: {}});
                    }
                  } else {
                    if (this.collectionsFilter.jobStatus !== '') {
                      this.$router.replace({name: 'Collection', params: {collectionid: this.currentCollectionId}});
                    }
                  }
                  this.archiveInProcess = false;
                })
                .catch(err => {
                  this.archiveInProcess = false;
                });
            })
            .catch(err => {
              this.archiveInProcess = false;
              console.log(err);
            });
        }
      },
      ...mapActions(['setJobStatus', 'getCurrentJobInfo'])
    }
  }
</script>
<style scoped lang="less">
  .job-workflow {
    legend {
      margin-bottom: 0px;
    }
    .status-name {
      padding: 10px 2px;
    }
  }
</style>