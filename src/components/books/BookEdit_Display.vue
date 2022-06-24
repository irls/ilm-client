<template>
  <div ref="scrollWrap" v-hotkey="keymap" :class="['ilm-global-style ilm-book-styles container-fluid', metaStyles]">

    <SvelteBookDisplayInVue
      v-if="isBookMounted"
      :parlistO="parlistO"
      :parlist="parlist"
      :lang="meta.language"
      :startId="startId"
      :hotkeyScrollTo="hotkeyScrollTo"
      @setStart="setStartIdIdx"
      @setEdge="scrolledToEdge"
      ref="viewBlocks"
    />
    <div v-else class="content-process-run preloader-loading"></div>

  </div>
</template>

<script>
import Vue from 'vue'
import BookDisplayHeader from './BookDisplayHeader'
import BookBlockDisplay   from './BookBlockDisplay';
//import BookTOC from './BookTOC'
import { mapGetters, mapState, mapActions } from 'vuex'
import { BookBlock, setBlockParnum }    from '../../store/bookBlock'

import SvelteBookDisplay from "./BookEdit_Display.svelte";
import toVue from "svelte-adapter/vue";

//import(/* webpackPrefetch: true */ "./css/fonts/Gentium/GentiumPlus-R.woff");

export default {
  name: 'BookEditDisplay',
  data () {
    return {
      startId: false,
      isBookMounted: false,
      hotkeyScrollTo: false,
      onScrollEv: false,
      startReached: false,
      endReached: false,
      correctVisibleTop: 86, //px
    }
  },
  components: {
    BookDisplayHeader, BookBlockDisplay,/*InfiniteLoading,  BookTOC,*/
    SvelteBookDisplayInVue: toVue(SvelteBookDisplay, {height: '100%'}, "div")
  },
  computed: {
      ...mapGetters({
        book: 'currentBook',
        meta: 'currentBookMeta',
        parlist: 'storeList',
        parlistO: 'storeListO'
      }),
      metaStyles: function () {
          let result = '';
          if (this.meta.styles) {
            result = [];
            for (let style in this.meta.styles) {
              //console.log('style', style, 'val', this.meta.styles[style]);
              if (this.meta.styles[style].length) result.push(this.meta.styles[style]);
            }
            result = result.join(' ');
          }
          return result;
      },
      keymap: function() {
        return {
          // 'esc+ctrl' is OK.
          'ctrl+home': (ev)=>{
            //console.log('ctrl+home', 'this.startId', this.startId);
            ev.preventDefault();
            ev.stopPropagation();
            let firstRid = this.parlistO.getFirstRid();
            if (firstRid) {
              let block = this.parlistO.getBlockByRid(firstRid);
              console.log('ctrl+home', 'blockid:', block.blockid, this.startReached);
              if (block && !this.startReached) {
                this.scrollToBlock(block.index, block.blockid);
              }
            }
          },
          'ctrl+end': (ev)=>{
            //console.log('ctrl+end', 'this.startId', this.startId);
            ev.preventDefault();
            ev.stopPropagation();
            let lastRid = this.parlistO.getLastRid();
            if (lastRid) {
              let block = this.parlistO.getBlockByRid(lastRid);
              console.log('ctrl+end', 'blockid:', block.blockid, this.endReached);
              if (block && !this.endReached) {
                this.scrollToBlock(block.index, block.blockid);
              }
            }
          },
          'ctrl+up': (ev)=>{
            this.ctrlUp(ev)
          },
          'ctrl+down': (ev)=>{
            this.ctrlDown(ev)
          },
          /*'ctrl+pgup': (ev)=>{
            //ev.preventDefault();
            //ev.stopPropagation();
            this.ctrlUp(ev)
          },
          'ctrl+pgdn': (ev)=>{
            //ev.preventDefault();
            //ev.stopPropagation();
            this.ctrlDown(ev)
          },*/
          'pgup': (ev)=>{
            //console.log('page up', 'this.startId', this.startId);
            ev.preventDefault();
            ev.stopPropagation();
            let prevId = this.parlistO.getInId(this.startId);
            if (prevId) {
              let block = this.parlistO.get(prevId);
              if (block) {
                console.log('page up', 'blockid:', block.blockid, this.startReached);
                if (prevId !== this.startId && !this.startReached) this.scrollToBlock(block.index, block.blockid);
              }
            }
          },
          'pgdn': (ev)=>{
            //console.log('page down', 'this.startId', this.startId);
            ev.stopPropagation();
            ev.preventDefault();
            let nextId = this.parlistO.getOutId(this.startId);
            if (nextId) {
              let block = this.parlistO.get(nextId);
              if (block) {
                console.log('page down', 'blockid:', block.blockid, this.endReached);
                if (nextId !== this.startId && !this.endReached) this.scrollToBlock(block.index, block.blockid);
              }
            }
          },
          'end': (ev)=>{
            ev.preventDefault();
            ev.stopPropagation();
          },
          'home': (ev)=>{
            ev.preventDefault();
            ev.stopPropagation();
          }
        }
      }
  },
  watch: {
    '$route' (toRoute, fromRoute) {
      //console.log('$route', fromRoute.params.block, '->', toRoute.params.block, 'onScrollEv:', this.onScrollEv);
      if (!this.onScrollEv && toRoute.params.hasOwnProperty('block')) {
        if (toRoute.params.block !== 'unresolved' && toRoute.params.block !== this.startId) {
          const idsArray = this.getIdsArray();
          const blkIdx = idsArray.indexOf(toRoute.params.block);
          if (blkIdx && blkIdx > -1) {
            this.scrollToBlock(blkIdx, toRoute.params.block);
          }
//         } else {
//           //TODO add method to find unresolved
//           this.onScrollEv = true;
//           this.$router.push({
//             name: 'BookEditDisplay',
//             params: { }
//           });
        }
      }
      this.onScrollEv = false;
    }
  },
  methods: {
    ...mapActions([
      'loadBook', 'loadBookBlocks', 'loadPartOfBookBlocks',
      'loopPreparedBlocksChain', 'putNumBlockOBatch', 'setCurrentBookCounters', 'loadBookToc'
    ]),

    ctrlUp(ev) {
      //console.log('ctrl+up arrow', 'this.startId', this.startId);
      const idsArray = this.getIdsArray();
      const jumpStep = Math.floor(idsArray.length * 0.1);
      const currIdx = idsArray.indexOf(this.startId);
      if (currIdx > -1) {
        let jumpIdx = currIdx - jumpStep;
        if (jumpIdx < 0) jumpIdx = 0;
        //console.log('ctrl+up arrow', 'blockid:', idsArray[jumpIdx], this.startReached);
        if (!this.startReached) this.scrollToBlock(jumpIdx, idsArray[jumpIdx]);
      }
    },

    ctrlDown(ev) {
      //console.log('ctrl+down arrow', 'this.startId', this.startId);
      const idsArray = this.getIdsArray();
      const jumpStep = Math.floor(idsArray.length * 0.1);
      const currIdx = idsArray.indexOf(this.startId);
      if (currIdx > -1) {
        let jumpIdx = currIdx + jumpStep;
        if (jumpIdx > idsArray.length) jumpIdx = idsArray.length - 1;
        //console.log('ctrl+down arrow', 'blockid:', idsArray[jumpIdx], this.endReached);
        if (!this.endReached) this.scrollToBlock(jumpIdx, idsArray[jumpIdx]);
      }
    },

    getIdsArray(isFilter = false) {
      if (isFilter) {
        return this.parlistO.idsArray()
          .filter((blkId)=>{
            let result = true;
            if (this.parlist.has(blkId)) {
              const block = this.parlist.get(blkId);
              if (block.disabled) result = false
            }
            return result;
          });
      }
      return this.parlistO.idsArray()
    },

    scrollToBlock(blockIdx, blockId) {
      //console.log('scrollToBlock', blockIdx, blockId, 'startId:', this.startId, 'hotkeyScrollTo:', this.hotkeyScrollTo);
      this.onScrollEv = true;

      this.hotkeyScrollTo = blockIdx + ':' + Date.now();

      this.startId = blockId;

      let params = {};
      for (let p in this.$route.params) {
        params[p] = this.$route.params[p];
      }
      params.block = blockId;
      this.$router.push({
        name: this.$route.name,
        params: params
      });

      this.onScrollEv = true;
    },

    setStartIdIdx(ev) {
      //console.log('setStartIdIdx', 'this.startId:', this.startId, 'ev.detail.blockId:', ev.detail.blockId, 'update:', (this.startId !== ev.detail.blockId));
      if (this.startId !== ev.detail.blockId) {
        this.onScrollEv = true;
        let params = {};
        for (let p in this.$route.params) {
          params[p] = this.$route.params[p];
        }
        params.block = ev.detail.blockId;
        this.startId = ev.detail.blockId;
        this.$router.push({
          name: this.$route.name,
          params: params
        });
      }
    },

    scrolledToEdge(ev) {
      this.$store.commit('set_taskBlockMapAllowNext', !ev.detail.endReached);
      this.startReached = ev.detail.startReached;
      this.endReached = ev.detail.endReached;
    },

    checkVisible(elm) {
      var rect = elm.getBoundingClientRect();
      var viewHeight = document.getElementsByClassName('scroll-wrapper')[0].scrollHeight;
      //Math.max(document.getElementsByClassName('.scroll-wrapper').clientHeight, window.innerHeight);
      return !(rect.bottom < this.correctVisibleTop || rect.top - viewHeight >= 0);
    },

    getAllBlocks(metaId, startBlock) {
      //console.log('getAllBlocks', metaId, startBlock);
      return this.$store.dispatch('loadBookBlocks', {bookId: metaId})
      .then((res)=>{
        this.parlistO.setLookupsList(metaId, res);
        if (res.blocks && res.blocks.length > 0) {
          res.blocks.forEach((el, idx, arr)=>{
            if (!this.parlist.has(el._id)) {
              let newBlock = new BookBlock(el);
              this.$store.commit('set_storeList', newBlock);
              /*if (el.type !== 'par' || idx < 100 || idx > res.blocks.length - 100) {
                this.parlistO.setVisible(el.rid);
              }*/
            } else {
              //this.parlistO.setLoaded(el.rid);
            }
          });
        }
        return res;
      });
    },
    listenSetNum(bookId, numMask, blockRid) {
      if (bookId) {
        this.putNumBlockOBatch({bookId: bookId, bookNum: numMask, blockRid: blockRid})
        .then((blocks)=>{

        })
        .catch((err)=>{})
      }
    },
    bookReimported() {
      this.$store.commit('clear_storeList');
      this.$store.commit('clear_storeListO');

      this.isBookMounted = false;
      this.startId = false;

      this.$router.push({
        name: 'BookEditDisplay', params: {}
      });
      this.hotkeyScrollTo = '0:' + Date.now();
      this.loadBookMounted();
      this.loadBookToc({bookId: this.meta._id, isWait: true});
    },
    loadBookMounted() {
      //console.log('loadBookMounted', this.parlistO.listObjs.length, this.parlist.size);
      if (this.$route.params.hasOwnProperty('bookid')) {
        let checkMeta = this.parlistO.meta || {};
        checkMeta = checkMeta.bookid || false;
        const bookid = this.$route.params.bookid;
        if (!this.meta._id || bookid !== checkMeta || !this.parlist.values().next().value) {
          console.log('loadBookMounted', 'load');
          this.$store.commit('clear_storeList');
          this.$store.commit('clear_storeListO');
          this.$store.dispatch('loadBook', bookid)
          .then((meta)=>{
            const startBlock = this.$route.params.block || false;
            const taskType = this.$route.params.task_type || false;
            //console.log('startBlock', startBlock, '$route.params.block', this.$route.params.block);
            this.startId = startBlock;
            return this.$store.dispatch('loadPartOfBookBlocks', {
              bookId: this.$route.params.bookid,
              block: startBlock,
              taskType: taskType,
              onPage: 1
            }).then((answer)=>{
                if (this.startId == false) {
                  this.startId = answer.blocks[0].blockid;
                }
                return this.getAllBlocks(answer.meta.bookid, this.startId)
                .then((result)=>{
                  this.isBookMounted = true;
                });
            });
          })
        }
        else {
          console.log('loadBookMounted', 'pre');
          if (this.$route.params.hasOwnProperty('block')) {
            if (this.$route.params.block=='unresolved') {
              this.startId = this.$route.params.block || false;
            } else {
              this.startId = this.$route.params.block;
            }
          }
          this.isBookMounted = true;
        }
      }
    },
    checkScrollBottom() {
    //console.log('checkScrollBottom', this.$refs.scrollWrap.offsetHeight, this.$refs.scrollWrap.scrollTop, this.$refs.scrollWrap.scrollHeight);
      if (this.$refs.scrollWrap.offsetHeight) {
        let scrolledBottom = this.$refs.scrollWrap.offsetHeight + this.$refs.scrollWrap.scrollTop >= this.$refs.scrollWrap.scrollHeight;
        this.$store.commit('set_taskBlockMapAllowNext', !scrolledBottom);
      }
    }
  },
  mounted: function() {
      //console.log('mounted');
      this.loadBookMounted();
      this.$root.$on('from-meta-edit:set-num', this.listenSetNum);
      this.$root.$on('book-reimported', this.bookReimported);
      this.$root.$on('for-bookedit:scroll-to-block', this.scrollToBlock);
  },
  beforeDestroy:  function() {
    this.$root.$off('from-meta-edit:set-num', this.listenSetNum);
    this.$root.$off('book-reimported', this.bookReimported);
    this.$root.$off('for-bookedit:scroll-to-block', this.scrollToBlock);
  },
}
</script>

<style lang="less" scoped>
.container-fluid {
  /*padding-top: 15px;*/
  /*overflow-y: auto;*/
  padding: 0px;
  margin: 0px;
}
</style>

<style lang='less'>
  .ilm-display {
    [data-flag] {
      pointer-events: all;
      cursor: default;
      &:before {
        cursor: default;
      }
    }
  }
</style>
