<template>
  <vue-tabs ref="collectiontabs" class="meta-edit-tabs collection-tabs" @tab-change="onTabChange">
    <vue-tab title="Manage Collection" id="manageCollection">
      <ManageCollection @collectionRemoved="$emit('collectionRemoved')" v-if="tabIndex === 0"></ManageCollection>
    </vue-tab>
    <vue-tab title="Meta" id="collectionMeta">
      <CollectionMeta v-if="tabIndex === 1"></CollectionMeta>
    </vue-tab>
  </vue-tabs>
</template>
<script>
  import CollectionMeta from './CollectionMeta';
  import ManageCollection from './ManageCollection';
  import { VueTabs, VTab } from 'vue-nav-tabs';
  export default {
    name: 'CollectionTabs',
    data() {
      return {
        tabIndex: 0
      }
    },
    components: {
      CollectionMeta: CollectionMeta,
      ManageCollection: ManageCollection,
      'vue-tabs': VueTabs,
      'vue-tab': VTab
    },
    methods: {
      onTabChange(index) {
        //console.log(arguments)
        this.tabIndex = index;
      }
    }
  }
</script>
<style lang="less">
  .collection-meta {
    /*position: fixed;
    width: 29%;*/
    height: 100%;
    overflow-y: auto;
    float: none;
    /*padding-top: 38px;*/
    fieldset {
      border:1px solid #b9b6b6;
      position:relative;
      margin-bottom:10px;
    }
    legend {
      width:auto;
      border-bottom:0;
      font-size:12px;
      margin-bottom:0;
    }
    textarea {
      width: 100%;
      border: none;
      resize: none;
      height: 100px;
    }
    .has-error {
      border: solid 1px red;
    }
    .error-message {
      margin: 0px;
    }
  }
  .collection-meta::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    border-radius: 10px;
    background-color: #F5F5F5;
  }
  .collection-meta::-webkit-scrollbar {
    width: 12px;
    background-color: #F5F5F5;
  }
  .collection-meta::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: #555;
  }
  .collection-tabs {
    height: auto;
    &.vue-tabs {
      height: auto;
    }
    .nav-tabs-navigation {
      position: sticky;
      top: 43px;
      background-color:white;
      z-index: 1;
    }

    & > .nav-tabs-navigation {
      border: 1px solid white;
      position: sticky;
      top: -1px;
      background-color: white;
      z-index: 2;
    }
  }
  .metaedit::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    border-radius: 10px;
    background-color: #F5F5F5;
  }
  .metaedit::-webkit-scrollbar {
    width: 12px;
    background-color: #F5F5F5;
  }
  .metaedit::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: #555;
  }
</style>
