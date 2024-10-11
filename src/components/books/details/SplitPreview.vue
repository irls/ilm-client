<template>
  <fieldset class="publish">
    <legend>Split points Demo Book</legend>
    <div class="align-preloader -small" v-if="isGenerating"></div>
    <template v-else>
      <div v-if="currentBookMeta.split_demo_time && currentBookMeta.split_demo_time !== -1">
        <span>Last build: {{convertTime(currentBookMeta.split_demo_time)}}</span>
      </div>
      <div>
        <button class="btn btn-primary" v-if="!currentBookMeta.split_demo" v-on:click="generateSplitDemo">Build</button>
        <button class="btn btn-primary" v-else v-on:click="generateSplitDemo">Rebuild</button>
      </div>
      <div>
        <a :href="this.SERVER_URL + currentBookMeta.split_demo" v-if="currentBookMeta.split_demo" target="_blank">
          Split Demo Link
        </a>
      </div>
    </template>
  </fieldset>
</template>
<script>
  import {mapGetters, mapActions} from 'vuex';
  import api_config from '../../../mixins/api_config.js';
  export default {
    name: 'SplitPreview',
    data() {
      return {}
    },
    props: ['convertTime'],
    mixins: [api_config],
    computed: {
      isGenerating: {
        get() {
          let dt = new Date(this.bookSplitDemoTime);
          return this.bookSplitDemoTime === -1 || (this.bookSplitDemoTime && dt.getTime() <= 0);
        },
        cache: false
      },
      ...mapGetters(['currentBookMeta', 'bookSplitDemoTime'])
    },
    methods: {
      ...mapActions(['generateSplitDemo'])
    }
  }
</script>
<style lang="less">

  fieldset.publish {

    legend {
      margin-bottom: 1px !important;
      border: none;
      width: auto;
      font-size: 1.2rem;
    }
  }

</style>
