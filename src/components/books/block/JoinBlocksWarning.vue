<template>
  <div class="join-block-warning">
    <div class="modal-header">
      <h4>Join block(s)</h4>
    </div>
    <div class="modal-body">
      Task Assignments and Styles for the lower block(s) will be discarded.<br>
      Join {{ join_count }} blocks?
      <label>
        <input type="checkbox" v-model="line_breaks" />&nbsp;Join with line breaks
      </label>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" v-on:click="saveChanges">
        Join ({{ join_count }})
      </button>
      <button class="btn btn-default" v-on:click="closePopup">
        Cancel
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      line_breaks: false
    }
  },
  props: ['joinInfo', 'join_count'],
  methods: {
    closePopup() {
      this.joinInfo.success = false;
      this.$emit('close');
    },
    saveChanges() {
      this.joinInfo.success = true;
      this.joinInfo.line_breaks = this.line_breaks;
      this.$emit('close');
    }
  },
}
</script>

<style lang="less">
  .join-block-warning {
    .modal-header {
      border: none;
      padding: 2px 15px;
      h4 {
        font-weight: bold;
        font-size: 14px;
      }
    }
    .modal-body {
      padding: 2px 15px;
      label {
        font-weight: normal;
        color: #808080;
        display: block;
        margin: 8px 0px;
        input[type="checkbox"] {
          vertical-align: top;
        }
      }
    }
    .modal-footer {
      border: none;
      text-align: inherit;
      padding: 0px;
      display: flex;
      .btn {
        width: 50%;
        margin: 0px;
        flex: 1 1 50%;
      }
    }
  }
</style>
