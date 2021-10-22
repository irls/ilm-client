<template>
  <div>
    <div class="collection-meta col-sm-12">
      <div class="col-sm-12" v-if="allowCollectionsEdit">
        <div class="col-sm-6">
          <button class="btn btn-default" v-on:click="linkBookModal = true">
            <i class="fa fa-plus"></i>&nbsp;Add to collection
          </button>
        </div>
        <div class="col-sm-6">
          <button class="btn btn-danger" v-on:click="onRemoveMessage = true">
            Remove collection
          </button>
        </div>
      </div>
      <linkBook v-if="linkBookModal"
        @close_modal="linkBookModal = false"
        :languages="languages"></linkBook>
      <modal v-model="onRemoveMessage" effect="fade" title="" ok-text="Remove" cancel-text="Cancel" @ok="remove()">
        <p>
          Remove {{collection.title}} Collection <template v-if="collection.books && collection.books.length">and unlink {{collection.books.length}} Books</template>?
        </p>
      </modal>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'ManageCollection'
  }
</script>
<style>
  
</style>