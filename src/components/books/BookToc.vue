<template>
  <fieldset>
    <legend>Table of contents </legend>
    <template v-if="isBlocked && blockers.indexOf('loadBookToc') >-1">
      <div class="preloader-spinner"></div>
    </template>
    <template v-else>
      <ul v-if="tocs.length > 0" class="toc-list">
        <li class="toc-item" v-for="(toc, tocIdx) in tocs" v-bind:key="tocIdx">
          <span class="toc-item-link" @click="goToBlock(toc._id, $event)">{{toc.content}}</span>
        </li>
      </ul>
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
      tocs: []
    }
  },

  props: [
    'bookId',
  ],


  computed: {
    ...mapGetters(['isBlocked', 'blockers'])
  },

  methods: {
    ...mapActions(['freeze', 'unfreeze', 'loadBookToc']),

    goToBlock(blockId, ev) {
      //console.log('goToBlock', blockId, this.$route.name);
      this.$router.push({name: this.$route.name, params: {}});
      this.$router.push({name: this.$route.name, params:  { block: blockId }});
    }
  },

  mounted () {
    console.log('mounted TOC', this.bookId);
    this.freeze('loadBookToc');
    this.loadBookToc(this.bookId)
    .then((res)=>{
      this.tocs = res.data;
      //console.log('this.tocs', this.tocs);
      this.unfreeze('loadBookToc');
    })
    .catch((err)=>{
      this.unfreeze('loadBookToc');
    })
  },

  watch: {
    '$route' () {
      if (this.$route.params.hasOwnProperty('bookid')) {
        if (this.bookId !== this.$route.params.bookid) {
          this.freeze('loadBookToc');
          this.loadBookToc(this.$route.params.bookid)
          .then((res)=>{
            this.tocs = res.data;
            //console.log('this.tocs', this.tocs);
            this.unfreeze('loadBookToc');
          })
          .catch((err)=>{
            this.unfreeze('loadBookToc');
          })
        }
      }
    }
  },

  destroyed: function () {

  }
}
</script>
<style lang="less">
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
  .toc-item {
    .toc-item-link {
      cursor: pointer;
      text-decoration: underline;
      color: #337ab7;
    }
  }
</style>
