<template>
  <div id="books_grid" v-cloak>
     <Grid id='collections_grid'
      ref="books_grid"
      :data="filteredCollections"
      :columns="headers"
      :rowsPerPage="100"
      @clickRow="rowClick"
      @dblClickRow="openCollection"
      :selected="selectedBooks"
      :idField="idField"
      :filter-key="''"
      :scrollTopOnPageClick="true"
      customEmptyTableText="No Collections found" />
  </div>
</template>
<script>
  import Grid from '../generic/Grid';
  import { mapGetters, mapActions } from 'vuex';
  import Vue from 'vue';
  //import lodash from 'lodash';
  import { prepareForFilter, cleanDiacritics } from '@src/filters/search.js';
  import { Languages } from "../../mixins/lang_config.js"

  export default {
      name: 'CollectionsGrid',
      props: {

      },
      components: {
        Grid: Grid
      },
      data() {
        return {
          idField: '_id',
          selectedBooks: [],
          filterScrollTimer: null
        }
      },
      methods: {
        rowClick(collection, event) {
          if (collection._id !== this.currentCollection._id) {
            this.$store.dispatch('loadCollection', collection._id);
            this.$router.replace({ path: '/collections/' + collection._id });
            this.selectedBooks = [collection._id];
          }
        },
        openCollection(collection, event) {
          const collectionId = collection._id;
          if (collectionId) {
            this.$router.push({ name: 'CollectionBooks', params: { collectionid: collectionId } });
          }
        },
        goToBookPage (collId = false) {
          if(this.$refs.books_grid) {
            if (collId) {
              const index = this.$refs.books_grid.filteredData.findIndex((coll)=>coll._id === collId);
              this.$refs.books_grid.goToIndex(index);
            } else {
              this.$refs.books_grid.goToIndex(0);
            }
            return true;
          }
          return false;
        },
        scrollToRow(bookId) {
          const el = document.querySelector(`[data-id="${bookId}"]`);
          if (el) {
            el.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'start'
            });
            return true;
          }
          return false;
        },
        async initScroll(selectedCollectionId) {
          if (this.filteredCollections.some((coll)=>coll._id == selectedCollectionId)) {
            this.$store.dispatch('loadCollection', selectedCollectionId);
            await Vue.nextTick();
            this.goToBookPage(selectedCollectionId);
            await Vue.nextTick();
            this.scrollToRow(selectedCollectionId);
            this.selectedBooks = [selectedCollectionId];
          }
        },
        ...mapActions([])
      },
      mounted() {
        if (this.$route && this.$route.params) {
          if (this.$route.params.hasOwnProperty('collectionid')) {
            this.initScroll(this.$route.params.collectionid)
          }
        }
      },
      computed: {
        ...mapGetters([
          'bookCollections',
          'allBooks',
          'currentBookMeta',
          'currentCollection',
          'allowCollectionsEdit',
          'adminOrLibrarian',
        ]),
        ...mapGetters({
          fltrChangeTrigger:    'gridFilters/fltrChangeTrigger',
          booksFilters:         'gridFilters/booksFilters',
          collectionsFilters:   'gridFilters/collectionsFilters',
          filteredCollections:  'gridFilters/filteredCollections'
        }),
        headers: {
          get() {
            let headers = [
              {
                title: 'Collection Title',
                path: 'title',
                addClass: 'booktitle width-45-p',
                isPassFull: true,
                html (val) {
                  return `<i class='ico ico-collection'></i>&nbsp;&nbsp;${val.title.length ? val.title : val._id}`
                }
              },
              {
                title: 'Author',
                path: 'author_link',
                addClass: 'author width-25-p',
                render(val) {
                  return val && Array.isArray(val) ? val.filter(author => {
                    return author.name || author.name_en;
                  }).reduce((authors, author) => {
                    authors.push(author.name ? author.name : author.name_en);
                    return authors;
                  }, []).join(', ') : '';
                }
              },
              {
                title: 'Published',
                path: 'pubVersion',
                addClass: 'width-135',
                isPassFull: true,
                html(val) {
                  let date = '';
                  let pubVersion = '';
                  if (val.pubVersionDate) {
                    date = new Date(val.pubVersionDate);
                    date = `${date.getFullYear()}.${('0'+(date.getMonth()+1)).slice(-2)}.${('0'+date.getDate()).slice(-2)}`;
                    if (val.pubVersion) {
                      pubVersion = `v.${val.pubVersion}`;
                    }
                  }
                  return `<i>${date}</i> ${pubVersion}`;
                }
              },
              {
                title: 'Updated',
                path: 'currVersion',
                addClass: 'width-135',
                isPassFull: true,
                html(val) {
                  let date = '';
                  if (val.currVersionDate) {
                    date = new Date(val.currVersionDate);
                    date = `${date.getFullYear()}.${('0'+(date.getMonth()+1)).slice(-2)}.${('0'+date.getDate()).slice(-2)}`;
                  }
                  let currVersion = 'v.1.0';
                  if (val.currVersion) {
                    currVersion = `v.${val.currVersion}`;
                  }
                  return `<i>${date}</i> ${currVersion}`;
                }
              },
              /*{
                title: 'Category',
                path: 'category',
                addClass: 'author width-150',
                render(val) {
                  return val && Array.isArray(val) ? val.join(', ') : val;
                }
              },
              {
                title: 'Language',
                path: 'language',
                addClass: 'author width-100',
                html (val) {
                  if (Languages.hasOwnProperty(val)) {
                    return `${Languages[val]}`;
                  }
                  return `${val}`
                }
              },*/
            ];
            return headers;
          },
          //cache: false
        }
      },
      watch: {
        'filteredCollections.length': {
          handler(newVal, oldVal) {
            if (oldVal == 0 && newVal > 0) {
              if (this.$route && this.$route.params) {
                if (this.$route.params.hasOwnProperty('collectionid')) {
                  console.log(`filteredCollections.length.initScroll: `,oldVal, newVal);
                  this.initScroll(this.$route.params.collectionid)
                }
              }
            }
          }
        },
        '$route' (toRoute, fromRoute) {
          if (!this.$route.params.hasOwnProperty('collectionid')) {
            this.selectedBooks = [];
            if (this.$refs.books_grid) {
              this.goToBookPage()
            }
          }
        },
        fltrChangeTrigger: { //collectionsFilters
          handler(newVal, oldVal) {
            Vue.nextTick(()=>{
              if (this.$route.params.hasOwnProperty('collectionid')) {
                const collectionid = this.$route.params.collectionid;
                const [selectedCollId] = this.selectedBooks;
                const found = this.filteredCollections.find((collection)=>{
                  return collection._id === collectionid;
                })
                if (found) {
                  clearTimeout(this.filterScrollTimer);
                  this.filterScrollTimer = setTimeout(()=>{
                    this.goToBookPage(collectionid);
                    if (!selectedCollId || (selectedCollId && selectedCollId !== collectionid)) {
                      this.scrollToRow(collectionid);
                      this.selectedBooks = [collectionid];
                    }
                  }, 1)
                } else {
                  this.goToBookPage();
                  this.$router.replace({ name: 'Collections' });
                  this.selectedBooks = [];
                }
              } else {
                this.goToBookPage();
                this.selectedBooks = []; // clean old selection
              }
            });
          }
        }
      }
  }
</script>
<style lang="less">
  .collection-row {
    position: inherit;
    /*i.fa-book {
      position: absolute;
      top: 10px;
      left: 5px;
    }*/
    .panel-title {
      margin-left: 10px;
    }
    &.selected {
      .panel-heading {
        background-color: #c6c2c2;
      }
    }
    .panel-heading {
      &.selected {
        background-color: #c6c2c2;
      }
    }
  }
  body.modal-open {
    .collection-row {
        position: inherit;
    }
  }
  div.collection-title {
    /*padding: 10px 5px;*/
    background-color: #f5f5f5;
    border-color: #ddd;
    color: #333;
    cursor: pointer;
    &.selected {
      background-color: #c6c2c2;
    }
  }
</style>
