<template>
  <div class="suggestions-dictionary">
    <VueTabs>
      <VTab v-for="category in categoryTabs" :title="category" :key="category">
        <SuggestionsList :suggestions="suggestions(category)"/>
      </VTab>
      <VTab title="General">
        <SuggestionsList 
          :suggestions="suggestions()"
          />
      </VTab>
    </VueTabs>
  </div>
</template>
<script>
  import { mapGetters, mapActions } from "vuex";
  import { VueTabs, VTab } from "vue-nav-tabs";

  import SuggestionsList from "./SuggestionsList";

  export default {
    data() {
      return {}
    },
    components: {
      VueTabs, VTab, SuggestionsList
    },
    mounted() {
      this.getAllSuggestions();
    },
    computed: {
      categoryTabs: {
        get() {
          if (this.currentBookMeta.alt_meta && this.currentBookMeta.alt_meta.ocean && this.currentBookMeta.alt_meta.ocean.category) {
            return [
              this.currentBookMeta.alt_meta.ocean.category
            ];
          }
          return [];
        },
        cahce: false
      },
      ...mapGetters(['currentBookMeta']),
      ...mapGetters('suggestionsModule', ['suggestions'])
    },
    methods: {
      ...mapActions('suggestionsModule', {
        getAllSuggestions: 'getAll'
      })
    }
  }
</script>
<style lang="less"></style>