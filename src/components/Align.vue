<template>
  <div class="area-wrapper">
    <check-align></check-align>
  </div>
  <!--<div class="area-wrapper">-->
</template>
<script>
  import CheckAlign from './align/CheckAlign'
  export default {
      components: {
        'check-align': CheckAlign
      }
  }
</script>

<style lang="less">

.area-wrapper {

  .vue-tabs {
    height: 100%;

    .tab-content {
      height: 100%;

      .tab-container {
        height: 100%;

          .toolbar {
            margin-bottom: 0;
          }

          .overflow-wrapper {
            height: 93%;
            overflow: auto;
            margin-top: 2px;
            margin-bottom: 45px;
          }
      }
    }
  }


}

</style>
