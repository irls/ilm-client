<template>
  <vue-tabs ref="collectiontabs" class="meta-edit-tabs" @tab-change="onTabChange">
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
<style>

</style>
