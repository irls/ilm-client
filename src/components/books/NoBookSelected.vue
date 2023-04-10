<template>
  <div class="meta-edit-tabs empty-meta-wrapper">
    <div class='empty-meta-placeholder'>
      <img src='/static/metaTab/no-book.png' class='empty-meta-img'/>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'NoBookSelected',
    data() {
      return {

      }
    },
    components: {
    },
    methods: {
    }
  }
</script>
<style scoped lang="less">
  .empty-meta-wrapper {
    height: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    border: 1px solid #ccc;
    border-top-left-radius: 4px;
    .empty-meta-placeholder {
      display: flex;
      justify-content: center;
      .empty-meta-img {
        width: fit-content;
        height: fit-content;
      }
    }
  }
</style>
