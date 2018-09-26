<template>
  <div :class="['ilm-global-style ilm-book-styles container-fluid', metaStyles]" @scroll="onScroll">
    <!--<BookDisplayHeader />-->
    <!--<BookTOC />-->
    <template v-for="(blockId, listIdx) in parlistO.idsArray()">
    <template v-for="blockView in blockViewPrepare(blockId)">
    <div :key="blockId" :id="blockId" :data-id="blockId" :data-rid="parlistO.getRIdById(blockId)" ref="viewBlocks" :class="['ilm-block', 'ilm-display', blockOutPaddings(blockView)]">

      <div v-if="blockView.type == 'illustration'" :class="blockView.getClass()">
        <img :class="blockView.getClass()" :src="blockView.getIllustration()"/>
        <div class="description"
        :class="['content-description', blockView.getClass()]"
        v-if="blockView.description.length"
        v-html="blockView.description">
        </div>
      </div>
      <div v-else-if="blockView.type == 'hr'">
        <hr :class="[blockView.getClass()]"/>
      </div>
      <div v-else >
        <div
          v-if="blockView.parnum && blockView.parnum.length"
          v-html="blockView.parnum"
          :class="['parnum']">
        </div>
        <div
          @click="handleFootnote($event)"
          :class="[blockView.getClass()]"
          :id="blockId"
          :data-parnum="blockView.parnum"
          :lang="blockView.language || meta.language"
          :data-type="blockView.type"
          v-html="blockView.content">
        </div>
        <div class="footnotes"
          v-if="blockView.footnotes.length > 0">
          <div class="-hidden" ref="footNotes"
            v-for="(footnote, footnoteIdx) in blockView.footnotes">
            <div class="-num">[fn{{footnote.ftnIdx+1}}]</div>
            <div class="-text"
              v-html="footnote.content">
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="clearfix"></div>
    </template>
    </template>
  </div>
</template>

<script>
import Vue from 'vue'
import BookDisplayHeader from './BookDisplayHeader'
//import BookTOC from './BookTOC'
import { mapGetters, mapState, mapActions } from 'vuex'
import { BookBlock, setBlockParnum }    from '../../store/bookBlock'

export default {
  name: 'BookEditDisplay',
  data () {
    return {
      page: 0,
      startId: false,
      fntCounter: 0
    }
  },
  components: {
    BookDisplayHeader, /*InfiniteLoading,  BookTOC,*/
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

    blockViewPrepare(blockId, blockRid) {
      console.log('blockViewPrepare');
      if (this.parlist.has(blockId)) {
        let viewObj = new BookBlock(this.parlist.get(blockId));//Object.assign({}, this.parlist.get(blockId));
        viewObj.content = viewObj.content.replace(
          /[\s]*?<sup[\s]*?data-pg[\s]*?=[\s]*?['"]+(.*?)['"]+.*?>.*?<\/sup>/mig,
          '<span data-pg="$1"></span>'
        );
        //<sup class="service-info" data-pg="xxiii"><w class="service-info" data-sugg="">pg </w><w class="service-info" data-sugg="">xxiii</w></sup>
        viewObj.content = viewObj.content.replace(
          /[\s]*?<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-pg=['"]{1}(.*?)['"]{1}[^>]*>.*?<\/sup>/mig,
          '<span class="service-info" data-pg="$1"></span>'
        );

        let ftnIdx = 0;
        viewObj.content = viewObj.content.replace(
          /[\s]*?<sup[\s]*?data-idx[\s]*?=[\s]*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/gm,
          (idx)=>{
            if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
              viewObj.footnotes[ftnIdx].ftnIdx = this.fntCounter;
            }
            ftnIdx++;
            return `<sup data-idx="${this.fntCounter++}">[${this.fntCounter}]</sup>`
          }
        );
        //<sup class="service-info" data-idx="2"><w class="service-info" data-sugg="">2</w></sup>
        viewObj.content = viewObj.content.replace(
          /[\s]*?<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-idx[\s]*?=[\s]*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/gm,
          (idx)=>{
            if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
              viewObj.footnotes[ftnIdx].ftnIdx = this.fntCounter;
            }
            ftnIdx++;
            return `<sup class="service-info" data-idx="${this.fntCounter++}">[${this.fntCounter}]</sup>`
          }
        );

//         let rid = this.parlistO.getRIdById(blockId);
//         let blockO = this.parlistO.getBlockByRid(rid);
//         if (blockO.type == 'header' && blockO.secnum.toString().length > 0) {
//           viewObj.parnum = blockO.secnum;
//         }
//         else if (blockO.type == 'par' && blockO.parnum.toString().length > 0) {
//           viewObj.parnum = blockO.parnum;
//         }
//         else viewObj.parnum = false;

        return [viewObj];
      }
      return [{ getClass: ()=>'', footnotes: [] }];
    },

    onScroll(ev) {
      //console.log('scroll', ev);
      let stopCond = false;
      let firstVisibleId = false;
      let visible = false;
      let idsArray = [];
      for (let blockRef of this.$refs.viewBlocks) {
        visible = this.checkVisible(blockRef);
        if (visible) {
          stopCond = true;
          if (!firstVisibleId) firstVisibleId = blockRef.dataset.id;
          if (this.parlistO.getBlockByRid(blockRef.dataset.rid).loaded === false) {
            idsArray.push(blockRef.dataset.id);
          }
          //console.log('visible', blockRef.dataset.rid, blockRef.dataset.id, this.parlistO.getBlockByRid(blockRef.dataset.rid).loaded);
        }
        if (!visible && stopCond) break;
      }
      if (idsArray.length) {
        this.getBlocks(idsArray)
        .then((answer)=>{
          //console.log('getBlocks answer', answer);
          this.$forceUpdate();
        })
      }
      //console.log('firstVisibleId', firstVisibleId);
      if (this.$route.params.block !== firstVisibleId) this.$router.push({name: 'BookEditDisplay', params: {block: firstVisibleId}});
    },

    checkVisible(elm) {
      var rect = elm.getBoundingClientRect();
      var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
      return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    },

    getAllBlocks(metaId, startBlock) {
      this.loadBookBlocks({bookId: metaId})
      .then((answer)=>{
        console.log('1', this.parlistO.idsArray());
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
    handleFootnote: function (ev) {
      if (ev.target.dataset.idx && this.$refs.footNotes[ev.target.dataset.idx]) {
        let className = this.$refs.footNotes[ev.target.dataset.idx].className;
        if (className == '-hidden') {
          this.$refs.footNotes[ev.target.dataset.idx].className = '';
        } else this.$refs.footNotes[ev.target.dataset.idx].className = '-hidden';
      }
    },
    blockOutPaddings: function (block) {
//       let match = block.getClass().match(/out[^\s]*/ig);
//       return (match && match.length) ? match.join(' ') : '';
      return (block.classes && block.classes.hasOwnProperty('outsize-padding')) ? block.classes['outsize-padding'] : ''
    },
  },
  mounted: function() {

      if (this.$route.params.hasOwnProperty('bookid')) {
        let bookid = this.$route.params.bookid;
        if (!this.meta._id || bookid !== this.parlistO.meta.bookid) {
          this.$store.commit('clear_storeList');
          this.$store.commit('clear_storeListO');
          this.loadBook(bookid)
          .then((meta)=>{
            console.log('then meta', meta);

            let startBlock = this.$route.params.block || false;
            this.startId = startBlock;

            return this.loadPartOfBookBlocks({
              bookId: this.$route.params.bookid,
              block: startBlock,
              taskType: false,
              onPage: 20
            }).then((answer)=>{
              this.parlistO.setLookupsList(answer.meta.bookid, answer);
              if (this.startId == false) this.startId = this.parlistO.idsArray()[0];
              this.loopPreparedBlocksChain({ids: this.parlistO.idsArray()})
              .then((result)=>{
              console.log('result', result);
                if (result.rows && result.rows.length > 0) {
                  result.rows.forEach((el, idx, arr)=>{
                    if (!this.parlist.has(el._id)) {
                      let newBlock = new BookBlock(el);
                      this.$store.commit('set_storeList', newBlock);
                      this.parlistO.setLoaded(el._id);
                    }
                  });
                }
                this.getAllBlocks(this.parlistO.meta.bookid, startBlock);
              });
              //console.log('this.parlistO.meta', this.parlistO.meta);
              //console.log('parlistO.idsArray()', this.parlistO.idsArray());
            });
          })
        }

      }
  },
  beforeDestroy:  function() {
  },
  watch: {
//     '$route' (toRoute, fromRoute) {
//       //console.log('$route', toRoute, fromRoute);
//     }
  },
}
</script>

<style lang="less" scoped>
.container-fluid {
  padding-top: 15px;
  overflow-y: auto;
}
</style>
