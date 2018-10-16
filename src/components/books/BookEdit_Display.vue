<template>
  <div :class="['ilm-global-style ilm-book-styles container-fluid', metaStyles]" @scroll="onScroll">
    <!--<BookDisplayHeader />-->
    <!--<BookTOC />-->
    <template v-for="(blockRid, listIdx) in parlistO.rIdsArray()">

      <book-block-display
        ref="viewBlocks"
        :blockRid = "blockRid"
        :blockO = "parlistO.getBlockByRid(blockRid)"
        :fntCounter = "fntCounter"
        :lang = "meta.language"
        :loaded = "parlistO.getBlockByRid(blockRid) && parlistO.getBlockByRid(blockRid).loaded"
      ></book-block-display>

    </template>
  </div>
</template>

<script>
import Vue from 'vue'
import BookDisplayHeader from './BookDisplayHeader'
import BookBlockDisplay   from './BookBlockDisplay';
//import BookTOC from './BookTOC'
import { mapGetters, mapState, mapActions } from 'vuex'
import { BookBlock, setBlockParnum }    from '../../store/bookBlock'

export default {
  name: 'BookEditDisplay',
  data () {
    return {
      page: 0,
      startId: false,
      fntCounter: 0,
      onScrollEv: false
    }
  },
  components: {
    BookDisplayHeader, BookBlockDisplay/*InfiniteLoading,  BookTOC,*/
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
      }
  },
  methods: {
    ...mapActions([
      'loadBook', 'loadBookBlocks', 'loadPartOfBookBlocks',
      'loopPreparedBlocksChain', 'putNumBlockOBatch'
    ]),

    onScroll(ev) {
      //console.log('onScroll', 'this.onScrollEv', this.onScrollEv);
      if (!this.onScrollEv) {
        let firstVisibleId = false;
        let visible = false;
        let idsArray = [];
        for (let blockRef of this.$refs.viewBlocks) {
          visible = this.checkVisible(blockRef.$refs.viewBlock);
          if (visible) {
            if (!firstVisibleId) firstVisibleId = blockRef.blockId;
            if (this.parlist.has(blockRef.blockId)) {
              this.parlistO.setLoaded(blockRef.blockId);
              blockRef.$forceUpdate();
            }
            else if (this.parlistO.getBlockByRid(blockRef.blockRid).loaded === false) {
              this.parlistO.getBlockByRid(blockRef.blockRid).loaded = 'loading';
              idsArray.push(blockRef.blockId);
            }
          }
        }
        if (idsArray.length) {
          //console.log('idsArray', idsArray);
          this.getBlocks(idsArray)
          .then((resIdsArray)=>{
            for (let blockRef of this.$refs.viewBlocks) {
              if (resIdsArray.indexOf(blockRef.blockId) > -1) {
                //blockRef.block = this.parlist.get(blockRef.blockId);
                blockRef.$forceUpdate();
              }
            }
          })
        }
        //console.log('firstVisibleId', firstVisibleId);
        if (firstVisibleId !== false && this.$route.params.block !== firstVisibleId) {
          this.onScrollEv = true;
          this.$router.push({
            name: 'BookEditDisplay',
            params: { block: firstVisibleId }
          });
        }
      } else this.onScrollEv = false;
    },

    checkVisible(elm) {
      var rect = elm.getBoundingClientRect();
      var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
      return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    },

    getAllBlocks(metaId, startBlock) {
      //console.time('getAllBlocks');
      this.loadBookBlocks({bookId: metaId})
      .then((answer)=>{
        let scrollId = this.parlistO.idsArray()[0];
        this.parlistO.updateLookupsList(metaId, answer);
        //console.timeEnd('getAllBlocks');
        Vue.nextTick(()=>{
          document.getElementById(scrollId).scrollIntoView();
        });
      });
    },
    getBlocks(idsArray) {
      //console.log('getBlocks idsArray', idsArray);
      return this.loopPreparedBlocksChain({ids: idsArray})
      .then((result)=>{
        let resIdsArray = [];
        if (result.rows && result.rows.length > 0) {
          result.rows.forEach((el, idx, arr)=>{
            if (!this.parlist.has(el._id)) {
              let newBlock = new BookBlock(el);
              this.$store.commit('set_storeList', newBlock);
              this.parlistO.setLoaded(el._id);
              resIdsArray.push(el._id);
            }
          });
        }
        return Promise.resolve(resIdsArray);
      });
    },
    listenSetNum(bookId, numMask, blockRid) {
      if (bookId) {
        this.putNumBlockOBatch({bookId: bookId, bookNum: numMask, blockRid: blockRid})
        .then((blocks)=>{
          for (let blockRef of this.$refs.viewBlocks) {
            //blockRef.blockO = new LookupBlock(this.parlistO.getBlockByRid(blockRef.blockRid));
            blockRef.$forceUpdate();
          }
        })
        .catch((err)=>{})
      }
    },
    bookReimported() {
      this.$store.commit('clear_storeList');
      this.$store.commit('clear_storeListO');
      this.$router.push({
        name: 'BookEditDisplay', params: {}
      });
      this.loadBookMounted();
    },
    loadBookMounted() {
      //console.time('loadBookMounted');
      if (this.$route.params.hasOwnProperty('bookid')) {
        let bookid = this.$route.params.bookid;
        if (!this.meta._id || bookid !== this.parlistO.meta.bookid) {
          this.$store.commit('clear_storeList');
          this.$store.commit('clear_storeListO');
          this.loadBook(bookid)
          .then((meta)=>{
            //console.log('then meta', meta);

            let startBlock = this.$route.params.block || false;
            this.startId = startBlock;
            let taskType = this.$route.params.task_type || false;


            return this.loadPartOfBookBlocks({
              bookId: this.$route.params.bookid,
              block: startBlock,
              taskType: taskType
            }).then((answer)=>{
              this.parlistO.setLookupsList(answer.meta.bookid, answer);
              if (this.startId == false) this.startId = this.parlistO.idsArray()[0];
              this.loopPreparedBlocksChain({ids: this.parlistO.idsArray()})
              .then((result)=>{
                //console.log('result', result);
                if (result.rows && result.rows.length > 0) {
                  result.rows.forEach((el, idx, arr)=>{
                    if (!this.parlist.has(el._id)) {
                      let newBlock = new BookBlock(el);
                      this.$store.commit('set_storeList', newBlock);
                      this.parlistO.setLoaded(el._id);
                    } else {
                      this.parlistO.setLoaded(el._id);
                    }
                  });
                }
                for (let blockRef of this.$refs.viewBlocks) {
                  blockRef.$forceUpdate();
                }
                //console.timeEnd('loadBookMounted');
                this.getAllBlocks(this.parlistO.meta.bookid, startBlock);
              });
            });
          })
        }
        else {
          if (this.$route.params.block && this.$route.params.block!=='unresolved') {
            this.onScrollEv = true;
            document.getElementById(this.$route.params.block).scrollIntoView();
            //console.timeEnd('loadBookMounted');
          }
        }
      }
    }
  },
  mounted: function() {
      //console.log('mounted');
      this.loadBookMounted();
      this.$root.$on('from-meta-edit:set-num', this.listenSetNum);
      this.$root.$on('book-reimported', this.bookReimported);
  },
  beforeDestroy:  function() {
    this.$root.$off('from-meta-edit:set-num', this.listenSetNum);
    this.$root.$off('book-reimported', this.bookReimported);
  },
  watch: {
    '$route' (toRoute, fromRoute) {
      //console.log('$route', toRoute, fromRoute, this.onScrollEv);
      if (!this.onScrollEv && toRoute.params.hasOwnProperty('block')) {
        if (toRoute.params.block !== 'unresolved') {
          document.getElementById(toRoute.params.block).scrollIntoView();
        } else {
          //TODO add method to find unresolved
          this.onScrollEv = true;
          this.$router.push({
            name: 'BookEditDisplay',
            params: { }
          });
        }
      }
      else this.onScrollEv = false;
    }
  },
}
</script>

<style lang="less" scoped>
.container-fluid {
  padding-top: 15px;
  overflow-y: auto;
}
</style>
