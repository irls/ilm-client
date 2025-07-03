<template>
  <fieldset class="filter-tags">
    <legend>Filter tags</legend>
    <div :class="['filter-tags-list selected-filter-tags', {'-has-error': requiredError,  '-no-tags': bookFilterTags.length === 0}]">
      <span class="error-text" v-if="requiredError">Define tags</span>
      <template v-for="bookFilterTag in bookFilterTags">
        <div class="filter-tag-chip">
          <div>{{bookFilterTag}}<template v-if="canRemove(bookFilterTag)">&nbsp;<span class="remove-item" v-on:click="remove(bookFilterTag)">&times;</span></template></div>
        </div>
      </template>
      <div class="filter-tag-options" v-if="canEditTags">
        <div :class="['toggle-filter-tags-visible', {'-visible': filterTagsVisible}]" v-on:click="toggleFilterTagsVisible">
          <span>Tags</span><i class="arrow"></i></div>
      </div>
    </div>
    <template v-if="filterTagsVisible">
      <div :class="['filter-tags-list', { '-no-tags': notAssignedFilterTags.length === 0 }]">
        <template v-for="filterTag in notAssignedFilterTags">
          <div class="filter-tag-chip" v-on:click="selectFilterTag(filterTag.name)">
            <div>{{filterTag.name}}</div>
          </div>
        </template>
      </div>
    </template>
  </fieldset>
</template>
<script>
  import { mapActions, mapGetters } from 'vuex';
  export default {
    data() {
      return {
        filterTagsVisible: false
      }
    },
    components: {

    },
    props: ['allowMetadataEdit', 'requiredError'],
    computed: {
      canEditTags: {
        get() {
          return this.adminOrLibrarian;
        }
      },
      ...mapGetters(['currentBookMeta', 'bookCategories', 'adminOrLibrarian', 'isBookReaderCategory']),
      ...mapGetters('filterTagsModule', ['filterTags', 'notAssignedFilterTags']),
      bookFilterTags: {
        get() {
          return this.currentBookMeta.filter_tags ? this.currentBookMeta.filter_tags : [];
        },
        cache: false
      }
    },
    mounted() {
      this.loadFilterTags();
    },
    methods: {
      ...mapActions(['updateBookMeta']),
      ...mapActions('filterTagsModule', ['loadFilterTags']),
      selectFilterTag(filterTag) {
        if (this.allowMetadataEdit) {
          let filterTags = this.currentBookMeta.filter_tags || [];
          if (!filterTags.includes(filterTag)) {
            this.$emit('filterTagsUpdate');
            filterTags.push(filterTag);
            return this.updateBookMeta({filter_tags: filterTags});
          }
        }
      },
      toggleFilterTagsVisible() {
        this.filterTagsVisible = !this.filterTagsVisible;
      },
      remove(filterTag) {
        if (this.allowMetadataEdit) {
          let filterTags = this.currentBookMeta.filter_tags || [];
          let present = filterTags.indexOf(filterTag);
          if (present !== -1) {
            filterTags.splice(present, 1);
            return this.updateBookMeta({filter_tags: filterTags});
          }
        }
      },
      canRemove(filterTag) {
        return !["Adapted", "Translated"].includes(filterTag);
      }
    }
  }
</script>
<style lang="less">
  fieldset.filter-tags {
    border: 1px solid #b9b6b6;
    position: relative;
    margin-bottom: 10px;
    legend {
      padding: 2px 4px 0px 4px;
      margin-bottom: 4px;
      border: none;
      width: auto;
      font-size: 1.2rem;
    }
    .filter-tags-list {
      border: 1px solid #f0f0f0;
      padding: 4px;
      margin: 5px 0px;
      &.-has-error {
        border: 1px solid red;
        .error-text {
          color: red;
          display: inline-block;
          margin: 4px 0px;
        }
      }
      &.-no-tags {
        border: none;
      }
    }
    .filter-tag-chip {
      display: inline-block;
      width: auto;
      background-color: #f0f0f0;
      padding: 4px 4px;
      border-radius: 4px;
      margin: 4px;
      cursor: pointer;
      user-select: none;
      height: 30px;
      vertical-align: middle;
      .remove-item {
        font-size: 16px;
      }
    }
    .toggle-filter-tags-visible {
      cursor: pointer;
      color: #337ab7;
      width: 100%;
      text-align: right;
      display: inline-block;
      user-select: none;
      span {
        display: inline-block;
        vertical-align: text-top;
        padding: 0px 4px;
      }
      i.arrow {
        border: solid #337ab7;
        border-width: 0 1px 1px 0;
        display: inline-block;
        padding: 3px;
        transform: rotate(-45deg);
        -webkit-transform: rotate(-45deg);
        margin: 0px 2px;
        vertical-align: middle;
      }
      &.-visible {
        i.arrow {
          transform: rotate(45deg);
          -webkit-transform: rotate(45deg);
        }
      }
    }
  }
</style>
