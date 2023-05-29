<template>
  <div class="delete-block-message" >
    <div class="modal-header"></div>
    <div class="modal-body">
      <p>Delete block?</p>
    </div>
    <div class="modal-footer">
      <template v-if="deletePending">
        <div class="voicework-preloader"></div>
      </template>
      <template v-else>
        <button class="btn btn-default" v-on:click="cancel()">Cancel</button>
        <button class="btn btn-primary" v-on:click="startDeleteBlock()">Delete</button>
      </template>
    </div>
  </div>
</template>
<script>
  export default {
    data() {
      return {
        deletePending: false
      }
    },
    props: ['deleteBlock'],
    methods: {
      cancel() {
        this.$emit('close');
      },
      startDeleteBlock() {
        this.deletePending = true;
        this.deleteBlock();
        this.$emit('close');
      }
    }
  }
</script>
<style>
  
</style>