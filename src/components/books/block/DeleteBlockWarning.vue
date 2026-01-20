<template>
  <div class="delete-block-warning">
    <div class="modal-header">
      <h4>Delete block(s)</h4>
    </div>
    <div class="modal-body">
      Delete {{ delete_count }} block(s)?
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" v-on:click="saveChanges">
        Delete ({{ delete_count }})
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
      
    }
  },
  props: ['deleteInfo', 'delete_count'],
  methods: {
    closePopup() {
      this.deleteInfo.success = false;
      this.$emit('close');
    },
    saveChanges() {
      this.deleteInfo.success = true;
      this.$emit('close');
    }
  },
}
</script>

<style lang="less">
  .delete-block-warning {
    .modal-header {
      border: none;
      padding: 2px 15px;
      h4 {
        font-weight: bold;
        font-size: 14px;
      }
    }
    .modal-body {
      padding: 2px 15px 15px 15px;
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
