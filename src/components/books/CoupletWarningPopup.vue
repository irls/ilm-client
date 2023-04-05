<template>
  <div class="couplet-warning">
    <div class="modal-header">
      <h4>Confirm Couplet update</h4>
    </div>
    <div class="modal-body">
      Couplet block style converts forward slash /, pipe |, 3 spaces, tab, or any combination of them into a unified couplet line separator /
      <br>
      Save changes?
      <br>
      <div class="warn">
        <label class="dont-show">
          <input type="checkbox" v-model="isDontShowAgain" />
          Don't show this message again
        </label>
      </div>
    </div>
    <div class="modal-footer">
      <button
        class="btn btn-default"
        type="button"
        aria-label="Close"
        @click="closePopup"
        id="cancelCoupletUpdate">
        Cancel
      </button>
      <button
        class="btn btn-primary"
        type="button"
        @click="saveChanges"
        id="saveCoupletUpdates">
        Save
      </button>
    </div>
  </div>
</template>

<script>
import modal from 'vue-js-modal';
import modalMixin from './../../mixins/modal';
export default {
  name: "CoupletWarningPopup",
  components: {
    modal,
    alert,
  },
  mixins: [modalMixin],
  props: ['coupletInfo'],
  data() {
    return {
      isDontShowAgain: false,
    }
  },
  methods: {
    closePopup() {
      this.coupletInfo.isDontShowAgain = this.isDontShowAgain;
      this.coupletInfo.success = false;
      this.$emit('close');
    },
    saveChanges() {
      this.coupletInfo.isDontShowAgain = this.isDontShowAgain;
      this.coupletInfo.success = true;
      this.$emit('close');
    }
  },
}
</script>

<style lang="less">
  .couplet-warning {
    .modal-header {
      border-bottom: none;
      padding: 15px 15px;
      h4 {
        padding: 0px;
        margin: 0px;
        font-weight: 700;
        font-size: 14px;
      }
    }
    .modal-body {
      padding: 0px 15px 15px 15px;
      font-weight: 400;
      line-height: 21px;
    }
    .modal-footer {
      padding: 0px;
      border-top: none;
      .btn {
        width: 50%;
        margin: 0px;
        float: left;
        height: 40px;
      }
    }
    .dont-show {
      color: #808080;
      font-weight: 400;
      font-size: 14px;
      padding: 15px 0px 0px 0px;
      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin: 0px 12px 0px 0px;
        vertical-align: text-bottom;
      }
    }
  }
</style>
