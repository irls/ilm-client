<template>
  <div :class="['ilm-global-style ilm-book-styles container-fluid', metaStyles]" @scroll="onScroll">
    <!--<BookDisplayHeader />-->
    <!--<BookTOC />-->
    <template v-for="(blockId, listIdx) in parlistO.idsArray()">

      <book-block-display
        ref="viewBlocks"
        :key = "listIdx"
        :blockId = "blockId"
        :blockRid = "parlistO.getRIdById(blockId)"
        :blockO = "parlistO.getBlock(blockId)"
        :fntCounter = "fntCounter"
        :lang = "meta.language"
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
      onScrollEv: false,
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
      },
  },
  methods: {
    ...mapActions([
      'loadBook', 'loadBookBlocks', 'loadPartOfBookBlocks',
      'loopPreparedBlocksChain'
    ]),

    onScroll(ev) {
      //console.log('scroll');
      let stopCond = false;
      let firstVisibleId = false;
      let visible = false;
      let idsArray = [];
      for (let blockRef of this.$refs.viewBlocks) {
        //console.log(this.checkVisible(blockRef.$refs.viewBlock));
        visible = this.checkVisible(blockRef.$refs.viewBlock);
        if (visible) {
          stopCond = true;
          if (!firstVisibleId) firstVisibleId = blockRef.blockId;
          if (this.parlistO.getBlockByRid(blockRef.blockRid).loaded === false) {
            idsArray.push(blockRef.blockId);
          }
          //console.log('visible', blockRef.dataset.rid, blockRef.dataset.id, this.parlistO.getBlockByRid(blockRef.dataset.rid).loaded);
        }
        if (!visible && stopCond) break;
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
      if (firstVisibleId!==false && this.$route.params.block !== firstVisibleId) {
        this.onScrollEv = true;
        this.$router.push({
          name: 'BookEditDisplay',
          params: { block: firstVisibleId }
        });

      }
    },

    checkVisible(elm) {
      var rect = elm.getBoundingClientRect();
      var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
      return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    },

    getAllBlocks(metaId, startBlock) {
      this.loadBookBlocks({bookId: metaId})
      .then((answer)=>{
        let scrollId = this.parlistO.idsArray()[0];
        this.parlistO.updateLookupsList(metaId, answer);
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

  },
  mounted: function() {
      //console.log('mounted');
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
              taskType: taskType,
              onPage: 20
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
                    }
                  });
                }
                for (let blockRef of this.$refs.viewBlocks) {
                  blockRef.$forceUpdate();
                }
                this.getAllBlocks(this.parlistO.meta.bookid, startBlock);
              });
            });
          })
        }

      }
  },
  beforeDestroy:  function() {
  },
  watch: {
    '$route' (toRoute, fromRoute, aaa) {
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
