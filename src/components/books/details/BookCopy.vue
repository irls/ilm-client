<template>
  <div class="book-copy">
    <a v-on:click="addBookCopy">Add book copy</a>
    <TaskAddModal :show="showModal"
      :parentBook="currentBookMeta"
      @closed="taskAddModalClose" />
  </div>
</template>
<script>
  import Vue from "vue";
  import v_modal from "vue-js-modal";
  import { mapGetters } from "vuex";
  import TaskAddModal from "@src/components/tasks/TaskAddModal";

  Vue.use(v_modal, { dialog: true });

  export default {
    data() {
      return {
        showModal: false
      }
    },
    components: {
      TaskAddModal
    },
    computed: {
      ...mapGetters(['currentBookMeta'])
    },
    methods: {
      addBookCopy() {
        this.showModal = true;
      },
      taskAddModalClose(create) {
        this.showModal = false;
      }
    }
  }
</script>
<style lang="less">
  .book-copy {
    float: right;
    a {
      cursor: pointer;
    }
  }
</style>