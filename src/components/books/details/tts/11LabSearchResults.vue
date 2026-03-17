<template>
<div class="search-results-main-wrapper">
<div v-if="!isReqFltrsSelected" class="search-results-filter-non-selected">
  Voice filtering requires Language, Gender and Age to be selected.
</div>
</div>
<!--<div class="search-results-main-wrapper">-->
</template>

<script>

import _     from 'lodash';
import Vue   from 'vue';

import { mapGetters, mapActions } from 'vuex';
import { Languages } from "@src/mixins/lang_config.js"

export default {
    name: 'ElevenLabSearchResults',
    props: {
      // activeIndex: {
      //   type: Number,
      //   default: 0
      // },
      // onAddTab: {
      //   type: Function,
      //   default: function(){}
      // }
    },
    data() {
      return {
      };
    },
    watch: {},
    mounted() {},
    updated() {},
    methods: {
    },
    computed: {
      ...mapGetters({
        voicesListLoading:  'elevenLabsVoices/voiceFilters',
        mapVoicesList:      'elevenLabsVoices/mapVoicesList',
        voiceFilters:       'elevenLabsVoicesFilters/voiceFilters',
        isReqFltrsSelected: 'elevenLabsVoicesFilters/isReqFltrsSelected'
      }),
    },
    components: {
    },
    directives: {
    }
}
</script>

<style lang="less" scoped>

.search-results-main-wrapper {
  flex-grow: 1;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  margin-top: 10px;

  .search-results-filter-non-selected {
    color: red;
    text-align: center;
    padding-top: 10px;
  }
}

</style>

<!--<style lang="less">

</style>-->
