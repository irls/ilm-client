<template>
  <fieldset class="job-workflow">
    <legend>Workflow</legend>
    <div v-if="archiveInProcess" class="preloader-small"></div>
    <template v-else>
      <div class="status-name" v-if="status !== 'active'">{{statusName}}: {{archived}}</div>
      <div class="status-name" v-else>{{statusName}}</div>
      <template v-if="isArchiveAllowed">
        <button class="btn btn-primary" v-on:click="archive()" v-if="isArchiveActive">
          {{archiveButtonLabel}}
        </button>
        <a class="btn btn-primary disabled" v-else>Archive</a>
      </template>
      <button class="btn btn-primary" v-on:click="complete()" v-if="isCompleteActive">
        {{completeButtonLabel}}
      </button>
      <a class="btn btn-primary disabled" v-else>Complete</a>
      <button class="btn btn-primary" v-on:click="suspend()" v-if="isSuspendActive">
        {{suspendButtonLabel}}
      </button>
      <a class="btn btn-primary disabled" v-else>Suspend</a>
    </template>
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
            case 'completed':
              return 'Completed';
            case 'suspended':
              return 'Suspended';
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
      isArchiveAllowed: {
        get() {
          return !this.currentJobInfo.published && !this.isPublishingQueue;
        },
        cache: false
      },
      isArchiveActive: {
        get() {
          return this.status === 'active' || this.status === 'archived';
        },
        cache: false
      },
      archiveButtonLabel: {
        get() {
          return this.status === 'active' ? 'Archive' : 'Unarchive';
        },
        cache: false
      },
      isCompleteActive: {
        get() {
          return this.status === 'active' || this.status === 'completed';
        },
        cache: false
      },
      completeButtonLabel: {
        get() {
          return this.status === 'active' ? 'Complete' : 'Reopen';
        },
        cache: false
      },
      isSuspendActive: {
        get() {
          return this.status === 'active' || this.status === 'suspended';
        },
        cache: false
      },
      suspendButtonLabel: {
        get() {
          return this.status === 'active' ? 'Suspend' : 'Resume';
        },
        cache: false
      },
      ...mapGetters(['adminOrLibrarian', 'currentJobInfo', 'currentCollectionId', 'activeTasksCount']),
      ...mapGetters({
        booksFilters:       'gridFilters/booksFilters',
        collectionsFilters: 'gridFilters/collectionsFilters'
      }),

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
        return this._setJobStatus(status);
      },
      complete(check = true) {
        if (check) {
          let message = '';
          if (this.status === 'active') {
            message = this.activeTasksCount > 0 ? 'The book has incomplete Tasks. Complete the workflow and revoke all active tasks?' : 'Complete the workflow?';
          } else {
            message = 'Reopen the workflow and activate all incomplete tasks?';
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
                title: this.status === 'active' ? 'Complete' : 'Reopen',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  this.complete(false);
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
          status = 'completed';
        } else {
          status = 'active';
        }
        return this._setJobStatus(status);
      },
      suspend(check = true) {
        if (check) {
          this.$root.$emit('show-modal', {
            title: this.status === 'active' ? 'Suspend the workflow and revoke all active tasks?' : 'Resume the workflow and activate all incomplete tasks?',
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                },
              },
              {
                title: this.status === 'active' ? 'Suspend' : 'Resume',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  this.suspend(false);
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
          status = 'suspended';
        } else {
          status = 'active';
        }
        return this._setJobStatus(status);
      },
      _setJobStatus(status) {
        if (status) {
          this.archiveInProcess = true;
          return this.setJobStatus(status)
            .then(() => {
              return this.getCurrentJobInfo()
                .then(() => {
                  this.$store.commit('gridFilters/set_fltrChangeTrigger');
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
      border: none;
      width: auto;
      font-size: 1.2rem;
    }
    .status-name {
      padding: 2px 2px 10px 2px;
    }
  }
</style>
