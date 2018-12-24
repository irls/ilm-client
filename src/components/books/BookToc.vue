<template>
  <fieldset class="toc-items-list">
    <legend>Table of contents <i class="fa fa-refresh refresh-toc" v-on:click="loadBookTocProxy(true)"></i></legend>
    <template v-if="isBlocked && blockers.indexOf('loadBookToc') >-1">
      <div class="preloader-spinner"></div>
    </template>
    <template v-else>
      <div v-if="currentBookToc.data.length > 0" class="toc-list">
        <!--<div :class="['toc-item', toc.level]" v-for="(toc, tocIdx) in tocs" v-bind:key="tocIdx">
          <span :class="['toc-item-number', toc.level]">{{toc.secnum?toc.secnum:''}}</span>
          <span class="toc-item-link" @click="goToBlock(toc._id, $event)">{{toc.content}}</span>
        </div>-->
        <table class="toc-list-table table-striped">
          <tr :class="['toc-item', toc.level]" v-for="(toc, tocIdx) in currentBookToc.data" v-bind:key="tocIdx">
            <!--<template v-if="!toc.level">
              <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
              <td colspan="4" class="toc-item-link" @click="goToBlock(toc._id, $event)">{{toc.content}}</td>
            </template>-->
            <template v-if="toc.level == 'toc1'">
              <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
              <td colspan="4" class="toc-item-link" @click="goToBlock(toc.blockid, $event)">{{toc.content}}</td>
            </template>
            <template v-if="toc.level == 'toc2'">
              <td></td>
              <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
              <td colspan="3" class="toc-item-link" @click="goToBlock(toc.blockid, $event)">{{toc.content}}</td>
            </template>
            <template v-if="toc.level == 'toc3'">
              <td></td><td></td>
              <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
              <td colspan="2" class="toc-item-link" @click="goToBlock(toc.blockid, $event)">{{toc.content}}</td>
            </template>
            <template v-if="toc.level == 'toc4'">
              <td></td><td></td><td></td>
              <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
              <td class="toc-item-link" @click="goToBlock(toc.blockid, $event)">{{toc.content}}</td>
            </template>
          </tr>
        </table>
      </div>
      <div v-else class="empty-tocs">
        No Table of contents
      </div>
    </template>
  </fieldset>
</template>
<script>

//import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'

export default {

  name: 'BookToc',

  data () {
    return {
      currBookId: this.bookId,
      loading: false
    }
  },

  props: [
    'bookId',
  ],


  computed: {
    ...mapGetters(['isBlocked', 'blockers', 'currentBookToc'])
  },

  methods: {
    ...mapActions(['freeze', 'unfreeze', 'loadBookToc']),

    goToBlock(blockId, ev) {
      //console.log('goToBlock', blockId, this.$route.name);
      this.$router.push({name: this.$route.name, params: {}});
      this.$router.push({name: this.$route.name, params:  { block: blockId }});
    },
    loadBookTocProxy(isWait = false) {
      //if (!isWait) this.freeze('loadBookToc');
      if (this.loading) {
        return false;
      }
      this.loading = true;
      this.loadBookToc({bookId: this.currBookId, isWait: isWait})
      .then((res)=>{
        this.loading = false;
        this.unfreeze('loadBookToc');
      })
      .catch((err)=>{
        this.loading = false;
        this.unfreeze('loadBookToc');
      });
    }
  },

  mounted () {
    //console.log('mounted TOC', this.currBookId);
    this.loadBookTocProxy(true);
    this.$root.$on('from-book-meta:upd-toc', this.loadBookTocProxy)
  },

  watch: {
    '$route' () {
      //console.log('$route', this.currBookId, this.$route.params.bookid);
      if (this.$route.params.hasOwnProperty('bookid')) {
        if (this.currBookId !== this.$route.params.bookid) {
          this.currBookId = this.$route.params.bookid;
          this.loadBookTocProxy();
        }
      }
    }
  },

  destroyed: function () {
    this.$root.$off('from-book-meta:upd-toc', this.loadBookTocProxy)
  }
}
</script>
<style lang="less">
 fieldset.toc-items-list {
    padding-left: 5px;

    .table-striped>tr:nth-of-type(odd) {
      background-color: #f9f9f9;
    }

    legend {
      width: auto;
      border-bottom: 0;
      font-size: 12px;
      margin-bottom: 0;
    }
    .preloader-spinner {
      width: 100%;
      height: 100px;
      background: url(/static/preloader-snake-small.gif);

      background-repeat: no-repeat;
      text-align: center;
      background-position: center center;
      /*background-size: 83%;*/
    }
    .empty-tocs {
      width: 100%;
      height: 100px;
    }
    .toc-list {
      display: table;
      .toc-item {
        display: table-row;

        .toc-item-number {
          display: table-cell;
          padding-right: 5px;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
        }
        .toc-item-link {
          display: table-cell;
          cursor: pointer;
          text-decoration: underline;
          color: #337ab7;
        }
      }
    }
    legend {
      .refresh-toc {
        margin: 0px 3px;
        color: #329adf;
        cursor: pointer;
        vertical-align: middle;
      }
    }
  }
</style>
