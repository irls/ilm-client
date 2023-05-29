<template>
  <div class="vue-js-modal" @before-close="voicework_change_close($event)">
    <!-- custom header -->
    <div class="modal-header">
      <h4 class="modal-title"><!--text-center-->
        Voicework update
      </h4>
    </div>
    <div class="modal-body" style="padding-top: 10px; padding-bottom: 10px;">
      <section v-if="isBatch">
        <div class="modal-text">Apply <i>"{{voicework}}"</i> voicework type to:</div>
        <div class="modal-content-flex">
          <div class="modal-content-flex-block">
          <label><input type="radio" name="voicework-update-type" v-model="voiceworkUpdateType" value="single" :disabled="voiceworkUpdating"/>this {{blockType}}</label>
          <label><input type="radio" name="voicework-update-type" v-model="voiceworkUpdateType" value="unapproved" :disabled="voiceworkUpdating"/>all unapproved {{blockType}}s</label>
          <label><input type="radio" name="voicework-update-type" v-model="voiceworkUpdateType" value="all" :disabled="voiceworkUpdating || !adminOrLibrarian"/><span v-if="adminOrLibrarian">all {{blockType}}s</span><span v-else style="color: #bbb;">all {{blockType}}s</span></label>
          <!--v-if="!block.status.marked"-->
          </div>
          <div class="modal-content-flex-block">
          <label class="modal-content-empty">&nbsp;</label>
          <label class="modal-content-empty">&nbsp;</label>
          <label class="modal-content-empty">&nbsp;</label>
          </div>
        </div>
        <div v-if="voiceworkUpdateType == 'single'" :class="['attention-msg', {'visible': isSingleBlockRemoveAudio}]">This will also delete current audio from the {{blockType}}</div>
        <div v-else :class="['attention-msg', {'visible': blocksCount > 0}]">This will also delete current audio from {{blocksCount}} {{blockType}}<span v-if="blocksCount !== 1">(s)</span></div>
      </section>
      <section v-else> <!--!isAllowBatchVoiceworkNarration-->
        <div class="modal-text">Apply <i>"{{voicework}}"</i> voicework type to this {{blockType}}?</div>
        <div v-if="voiceworkUpdateType == 'single'" :class="['attention-msg', {'visible': !isNarratedBlockCompleteAudio}]">Сurrent audio on the {{blockType}} cannot be saved because it is incomplete</div>
      </section>
    </div>
    <!-- custom buttons -->
    <div class="modal-footer vue-dialog-buttons">
      <template v-if="!voiceworkUpdating">
        <button type="button" class="btn btn-cancel" @click="close()">Cancel</button>
        <button type="button" class="btn btn-primary" @click="startUpdateVoicework()">Update voicework</button>
      </template>
      <template v-else>
        <div class="voicework-preloader"></div>
      </template>
    </div>
  </div>
</template>
<script>
  import { mapGetters, mapActions } from 'vuex';
  export default {
    data() {
      return {
        voiceworkUpdating: false,
        voiceworkUpdateType: 'single',
      }
    },
    props: ['blockType', 'voicework', 'isBatch', 'isNarratedBlockCompleteAudio', 'adminOrLibrarian', 'isSingleBlockRemoveAudio', 'updateVoicework', 'voiceworkUpdateProgress', 'voiceworkChange', 'block'],
    mounted() {
      this.voiceworkUpdating = this.voiceworkUpdateProgress;
    },
    computed: {
      ...mapGetters(['currentBookCounters']),
      blocksCount: {
        get() {
          return this.currentBookCounters.voiceworks_for_remove;
        },
        cache: false
      }
    },
    methods: {
      ...mapActions(['setCurrentBookCounters']),
      close() {
        this.$emit('close');
      },
      startUpdateVoicework() {
        this.voiceworkUpdating = true;
        this.updateVoicework(false, this.voiceworkUpdateType)
          .then(() => {
            this.$emit('close');
          })
          .catch(err => {
            this.$emit('close');
          });
      },
      countVoiceworksForRemove(blockType, voicework, isApproved = null) {
        let filters = {
          'voiceworks_for_remove': {
            type: blockType,
            voicework: voicework
          }
        };
        if (isApproved !== null) filters['voiceworks_for_remove']['status.marked'] = isApproved;
        return this.setCurrentBookCounters([filters]);
      },
    },
    watch: {
      'voiceworkUpdateType': {
        handler(val) {
          this.currentBookCounters.voiceworks_for_remove = 0;
          if (val !== 'single') {
            //this.voiceworkUpdating = true;
            this.countVoiceworksForRemove(this.block.type, this.voiceworkChange, (val === 'unapproved' ? false: null))
            .then((res)=>{
              //this.voiceworkUpdating = false;
            })
          }
        }
      }
    }
  }
</script>
<style>
  
</style>