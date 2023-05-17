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
  export default {
    data() {
      return {
        voiceworkUpdating: false,
        voiceworkUpdateType: 'single',
      }
    },
    props: ['blocksCount', 'blockType', 'voicework', 'isBatch', 'isNarratedBlockCompleteAudio', 'adminOrLibrarian', 'isSingleBlockRemoveAudio', 'updateVoicework'],
    methods: {
      close() {
        this.$emit('close');
      },
      startUpdateVoicework() {
        this.voiceworkUpdating = true;
        this.updateVoicework()
          .then(() => {
            this.$emit('close');
          })
          .catch(err => {
            this.$emit('close');
          });
      }
    }
  }
</script>
<style>
  
</style>