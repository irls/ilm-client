<template>
  <div class="suggestions-dictionary">
    <VueTabs ref="categoriesTabs" v-model="activeTab">
      <VTab v-for="(category, categoryIdx) in categoryTabs" :title="category.title" :key="category.title" :id="category.title">
        <SuggestionsList
          :suggestions="suggestions(category.category)"
          :category="category.category"
          :isActive="isActive && $refs.categoriesTabs.activeTabIndex === categoryIdx"
          :categoryName="category.title" />
      </VTab>
    </VueTabs>
  </div>
</template>
<script>
  import Vue from "vue";
  import { mapGetters, mapActions } from "vuex";
  import { VueTabs, VTab } from "vue-nav-tabs";

  import SuggestionsList from "./SuggestionsList";

  export default {
    data() {
      return {
        activeTab: "General"
      }
    },
    props: ['isActive'],
    components: {
      VueTabs, VTab, SuggestionsList
    },
    mounted() {
      this.getAllSuggestions()
        .then(() => {
          this.resetTab();
        });
      this.$root.$on('for-suggestions-list:add-suggestion', this.activateSuggestionsTab);
    },
    beforeDestroy: function () {
      this.$root.$off('for-suggestions-list:add-suggestion', this.activateSuggestionsTab);
    },
    computed: {
      categoryTabs: {
        get() {
          let tabs = [];
          if (this.currentBookMeta.alt_meta && this.currentBookMeta.alt_meta.ocean && this.currentBookMeta.alt_meta.ocean.category) {
            let category = this.currentBookMeta.alt_meta.ocean.category;
            tabs.push({category: category, title: category});
          }
          tabs.push({category: null, title: "General"});
          return tabs;
        },
        cahce: false
      },
      ...mapGetters(['currentBookMeta']),
      ...mapGetters('suggestionsModule', ['suggestions'])
    },
    methods: {
      resetTab() {
        this.activeTab = this.categoryTabs[0].title;
        document.getElementById(`p-${this.activeTab}`).style.removeProperty('display');
      },
      activateSuggestionsTab(suggestionItem = {}) {
        if (!this.isActive) {
          this.$refs.categoriesTabs.navigateToTab(0);
        }
        const tabs = this.$refs.categoriesTabs.getTabs();
        if (tabs && tabs.length) {
          for (const tab of tabs) {
            const tabComponent = tab?.child?.$children;
            if (tabComponent && tabComponent.length) {
              tabComponent[0].onAddEvent(suggestionItem);
            }
          }
        }
      },
      ...mapActions('suggestionsModule', {
        getAllSuggestions: 'getAll'
      })
    },
    watch: {
      'currentBookMeta.bookid': {
        handler(val) {
          Vue.nextTick(() => {
            this.resetTab();
          });
        }
      }
    }
  }
</script>
<style lang="less"></style>
