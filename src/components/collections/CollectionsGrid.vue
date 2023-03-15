<template>
  <div id="books_grid">
     <Grid id='collections_grid'
      :data="collections"
      :columns="headers"
      :rowsPerPage="100"
      @clickRow="rowClick"
      @dblClickRow="openCollection"
      :selected="selectedBooks"
      :idField="idField"
      :filter-key="''"
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
        scrollToRow(bookId) {
          let t = setTimeout(function() {
            let el = document.querySelector(`[data-id="${bookId}"]`);
            if (el) {
              el.scrollIntoView();
            }
          }, 300);
        },
        ...mapActions(['updateBooksList'])
      },
      mounted() {
        this.updateBooksList()
        .then(()=>{
          if (this.$route && this.$route.params) {
            if (this.$route.params.collectionid) {
              this.$store.dispatch('loadCollection', this.$route.params.collectionid);
              this.selectedBooks = [this.$route.params.collectionid];
              this.scrollToRow(this.$route.params.collectionid);
            }
          }
          //console.log(`bookCollections: `, this.bookCollections);
        })
      },
      computed: {
        ...mapGetters([
          'bookCollections',
          'allBooks',
          'currentBookMeta',
          'currentCollection',
          'bookFilters',
          'collectionsFilter',
          'allowCollectionsEdit',
          'adminOrLibrarian',
        ]),
        collections: { // filtered list of collections
          get() {
            if (!this.bookCollections.length) return [];
            let filteredCollections = this.bookCollections
               .filter(coll => (this.bookFilters.language.length == 0 || (this.bookFilters.language).indexOf(coll.language) >= 0))
               .filter(coll => {
                  const collAuthors = Array.isArray(coll.author) ? coll.author.join('|') : coll.author;
                  let str = prepareForFilter(`${coll.title} ${coll.subtitle} ${collAuthors} ${coll._id} ${coll.category}`); // ${coll.description}
                  let find = prepareForFilter(this.bookFilters.filter);
                  return (str.indexOf(find) > -1)
                })
            return filteredCollections;
          }
        },
        headers: {
          get() {
            let headers = [
              {
                title: 'Collection Title',
                path: 'title',
                addClass: 'booktitle',
                isPassFull: true,
                html (val) {
                  return `<i class='ico ico-collection'></i>&nbsp;&nbsp;${val.title.length ? val.title : val._id}`
                }
              },
              {
                title: 'Author',
                path: 'author',
                addClass: 'author',
                render(val) {
                  return val && Array.isArray(val) ? val.join(', ') : val;
                }
              },
              {
                title: 'Title EN',
                path: 'title_en',
                addClass: 'author',
                html (val) {
                  return `${val}`
                }
              },
              {
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
              },
            ];
            return headers;
          },
          //cache: false
        }
      },
      watch: {
        currentCollection: {
          handler(val, oldVal) {
            if(val._id && !oldVal._id) {

            }
          }
        },
        bookFilters: { //collectionsFilter
          deep: true,
          handler(newVal, oldVal) {
            if (this.$route.params.hasOwnProperty('collectionid')) {
              const collectionid = this.$route.params.collectionid;
              const found = this.collections.find((collection)=>{
                return collection._id === collectionid;
                //return collection.bookids.find((book)=>{
                //  return book === bookid;
                //})
              })
              if (found) {
                this.scrollToRow(collectionid);
              } else {
                this.$router.replace({ path: '/collections' });
              }
            } else {
              this.selectedBooks = []; // clean old selection
            }
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
  div.collection-container {
    border: 1px solid #ddd;
    div.collection-books-grid {
      padding: 0px 15px;
    }
  }
</style>
