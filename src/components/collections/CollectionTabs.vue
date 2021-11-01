<template>
  <vue-tabs ref="collectiontabs" class="meta-edit-tabs">
    <vue-tab title="Manage collection" id="manageCollection">
      <ManageCollection @collectionRemoved="$emit('collectionRemoved')"></ManageCollection>
    </vue-tab>
    <vue-tab title="Meta" id="collectionMeta">
      <CollectionMeta></CollectionMeta>
    </vue-tab>
  </vue-tabs>
</template>
<script>
  import CollectionMeta from './CollectionMeta';
  import ManageCollection from './ManageCollection';
  import { VueTabs, VTab } from 'vue-nav-tabs';
  export default {
    name: 'CollectionTabs',
    components: {
      CollectionMeta: CollectionMeta,
      ManageCollection: ManageCollection,
      'vue-tabs': VueTabs,
      'vue-tab': VTab
    }
  }
</script>
<style>
  
</style>