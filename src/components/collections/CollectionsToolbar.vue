<template>
  <div class="toolbar">

        <h3><img src='/static/bookstack_crop.svg' class='bookstack'/>
          {{ collectionCount() }} Collection{{ (collectionCount()<=1 ? '':'s')}}
        </h3>


        <!-- <input type="text" @keyup="filterChange('title', $event)" class="form-control" placeholder="Search by author or title" v-model="collectionsFilter['title']"></input> -->
        <div class="input-group">
          <input v-model="collectionsFilter.title" type="text" @keyup="filterChange('title', $event)" class="form-control" style="width: 15em;" placeholder="Filter by Author or Title"></input>
          <i class="fa fa-times-circle-o btn-inside"  aria-hidden="true"  @click="collectionsFilter.title='';"></i>
        </div>


        <div class="input-group">
          <input v-model="collectionsFilter.projectTag" type="text" @keyup="filterChange('projectTag', $event)"" class="form-control" style="width: 18em;" placeholder="Filter by Editor or Project tag"></input>
          <i class="fa fa-times-circle-o btn-inside" aria-hidden="true"  @click="collectionsFilter.projectTag='';"></i>
        </div>



        <template v-if="adminOrLibrarian">
          <select @change="filterChange('jobStatus', $event)" v-model="collectionsFilter.jobStatus">
            <option value="">Not filtered</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="completed">Completed</option>
            <option value="suspended">Suspended</option>
          </select> &nbsp;
        </template>

        <select @change="filterChange('language', $event)" v-model="collectionsFilter['language']">
          <option v-for="(name, code) in languages" :value="code">{{name}}</option>
        </select>



        <button v-if="hasBookSelected()" @click="displayBook" class='btn btn-default'>
          <i class="fa fa-pencil fa-lg"></i>&nbsp;Display Book
        </button>


        <button class="btn btn-primary" v-on:click="addCollection" v-if="allowCollectionsEdit">
          <i class="fa fa-plus"></i>&nbsp;Add Collection
        </button>

        <button v-if='hasItemSelected' class='btn btn-default btn-meta' @click='toggleMetaVisible'>
          <i :class="[metaVisible ? 'fa-chevron-right': 'fa-chevron-left', 'fa fa-lg collapsebtn']" aria-hidden="true"></i>&nbsp;Details
        </button>

  </div>
</template>
<script>
  import superlogin from 'superlogin-client';
  import PouchDB from 'pouchdb';
  import {mapGetters, mapActions} from 'vuex';
  import { Languages }      from "../../mixins/lang_config.js"
  import Vue from 'vue';
  export default {
    name: 'CollectionsToolbar',
    data() {
      return {
        /*,
        metaVisible: false*/
        filterAuthorTitle: '',
        filterTag: ''

      };
    },
    props: [
      'hasItemSelected', 'metaVisible', 'hasBookSelected'
    ],
    mounted() {
      //this.$store.commit('CLEAR_CURRENTBOOK_FILTER');
    },
    methods: {
      collectionCount() {
        return this.bookCollections ? this.bookCollections.length : 0;
      },
      textFilterChange() {

      },
      languageFilterChange() {

      },
      filterChange(field, event) {
        //if (this.$route.params.hasOwnProperty('collectionid')) {
        //  this.$router.replace({ path: '/collections'});
        //}
        //let filter = {};
        //filter[field] = event.target.value;
        //this.$store.commit('SET_COLLECTIONS_FILTER', filter);
      },
      filterTagChange (el) {
        //this.$store.commit('SET_COLLECTIONS_FILTER', {projectTag: el.target.value})
      },

      addCollection() {
        return this.createCollection({})
          .then(doc => {
            Vue.nextTick(() => {
              this.$emit('collectionAdded', doc._id);
            });
          }).catch(err => {

          })
      },
      toggleMetaVisible() {
        //this.metaVisible = !this.metaVisible;
        this.$emit('toggleMetaVisible', !this.metaVisible);
      },
      displayBook() {
        this.$router.push('/collections/' + this.currentBookMeta.collection_id + '/' + this.currentBookMeta.bookid + '/display');
      },
      ...mapActions(['createCollection'])
    },
    computed: {
      languages() {
        //return Object.entries(Languages)
        return Languages;

      },

      ...mapGetters(['bookCollections', 'collectionsFilter', 'allowCollectionsEdit', 'currentBookMeta', 'adminOrLibrarian'])
    }
  }
</script>
<style lang="less" scoped>

  h3 {
    margin: 0;
    padding-top: 0;
    display: inline-block;
  }

  select {
    padding: 3px; height: 2.5em;
  }

  .btn {
    margin-right: .5em;

    &.btn-meta {
      margin-left: 40px;
      &:focus {
        background: rgb(255, 255, 255);
        border-color: rgb(204, 204, 204);
      }
      .collapsebtn {
        margin-right: 5px;
      }
    }
  }


  button:hover {
    color: darkgreen;
    background: #F0FFF0
  }

  img.bookstack {
    width: 30px;
    opacity: .75
  }

  input {width: 14em;}
  input, select, button {margin-right: 15px;}

  .form-control {display: inline; margin-right: .5em;}
  div {
    &.table {
      display: table;
    }
    &.tr {
      display: table-row;
    }
    &.td {
      display: table-cell;
    }
  }

  .btn-inside {
      margin-left: -30px;
      margin-top: 7px;
      z-index: 999;
      position: absolute;

  }


</style>
