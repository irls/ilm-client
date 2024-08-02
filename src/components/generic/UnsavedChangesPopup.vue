<template>
  <div class="unsaved-changes-popup align-modal">
    <div class="modal-header">
      Unsaved changes
    </div>
    <div class="modal-body">
      You have unsaved changes in selected block range.<br/>Save and align with audio?
    </div>
    <div class="modal-footer">
      <template v-if="isSaving">
        <div class="is-saving voicework-preloader"></div>
      </template>
      <template v-else>
        <button class="btn btn-default" v-on:click="cancel()">Cancel</button>
        <button class="btn btn-primary" v-on:click="save()">Save&Align</button>
      </template>
    </div>
  </div>
</template>
<script>
  import { mapActions, mapGetters } from 'vuex';
  export default {
    data() {
      return {
        isSaving: false
      }
    },
    props: {
      'voicework': String,
      'callbackProps': Object,
      'ttsVoiceAlign': {
        type: Boolean,
        default: false
      },
      'modifiedBlockids': {
        type: Array,
        default() {
          return [];
        }
      }
    },
    computed: {
      ...mapGetters('alignActions', ['alignTTSVoicesData'])
    },
    methods: {
      cancel() {
        this.$emit('close');
      },
      save() {
        this.isSaving = true;
        let getBlocks = new Promise((resolve, reject) => {
          if (this.modifiedBlockids.length > 0) {
            //console.log(this.alignTTSVoicesData);
            return resolve(this.modifiedBlockids);
          } else {
            return this.getChangedBlocks({voicework: this.voicework})
             .then(blockIds => {
              return resolve(blockIds);
             });
          }
        });
        getBlocks
          .then(ids => {
            if (!Array.isArray(ids)) {
              return Promise.reject();
            }
            let wait = [];
            ids.forEach(blockid => {
              let promise = Promise.resolve();
              let evt = {};
              evt.waitUntil = p => promise = p
              this.$root.$emit(`save-block:${blockid}`, evt)
              wait.push(promise);
            })
            Promise.all(wait)
              .then(() => {
                this.callbackProps.saved = true;
                this.$emit('close');
                let i = setInterval(() => {
                  if ($('.align-modal').length == 0) {
                    clearInterval(i);
                    //this.align(id, false)
                    this.$emit('close');
                  }
                }, 50);
              });
          });
      },
      ...mapActions(['getChangedBlocks'])
    },
    watch: {}
  }
</script>
<style lang="less">
  .unsaved-changes-popup {
    padding: 0px;
    .modal-header {
      font-size: 14px;
      font-weight: 600;
      padding: 15px;
    }
    .modal-body {
      text-align: left;
      padding: 0px 15px 15px 15px;
    }
    .modal-footer {
      padding: 0px;
      display: flex;
      .btn {
        flex: 1 1 50%;
        margin: 0px;
      }
    }
  }
</style>