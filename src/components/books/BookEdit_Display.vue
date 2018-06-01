<template>
  <div :class="['ilm-global-style container-fluid', metaStyles]">
    <!--<BookDisplayHeader />-->
    <!--<BookTOC />-->
    <template v-for="(block, blockId) in parlist">
    <div :key="block._id" :class="['ilm-block', 'ilm-display', blockOutPaddings(block)]">
      <div v-if="block.type == 'illustration'" :class="block.getClass()">
        <img :class="block.getClass()" :src="block.getIllustration()"/>
        <div class="description"
        :class="['content-description', block.getClass()]"
        v-if="block.description.length"
        v-html="block.description">
        </div>
      </div>
      <div v-else-if="block.type == 'hr'">
        <hr :class="[block.getClass()]"/>
      </div>
      <div v-else >
        <div
          v-if="block.parnum && block.parnum.length"
          v-html="block.parnum"
          :class="['parnum']">
        </div>
        <div
          @click="handleFootnote($event)"
          :class="[block.getClass()]"
          :id="block.id"
          :data-parnum="block.parnum"
          :lang="block.language || meta.language"
          :data-type="block.type"
          v-html="block.content">
        </div>
        <div class="footnotes"
          v-if="block.footnotes.length > 0">
          <div class="-hidden" ref="footNotes"
            v-for="(footnote, footnoteIdx) in block.footnotes">
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
    <infinite-loading @infinite="onInfiniteScroll" ref="infiniteLoading"></infinite-loading>
  </div>
</template>

<script>
import BookDisplayHeader from './BookDisplayHeader'
//import BookTOC from './BookTOC'
import InfiniteLoading from 'vue-infinite-loading'
import { mapGetters, mapState, mapActions } from 'vuex'
import { BookBlock, setBlockParnum }    from '../../store/bookBlock'

export default {
  name: 'BookEditDisplay',
  data () {
    return {
      parlist: [],
      page: 0,
      parCounter: { pref: 0, prefCnt: 0, curr: 1 },
      fntCounter: 0
    }
  },
  components: {
    BookDisplayHeader, InfiniteLoading,  /*BookTOC,*/
  },
  computed: {
      ...mapGetters({
        book: 'currentBook',
        meta: 'currentBookMeta'
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
    ...mapActions(['loadBlocks', 'loadBlocksChain', 'loadBook']),

    onInfiniteScroll() {
      if (this.meta._id) {
        this.getBlocks();
      } else {
        if (this.$route.params.hasOwnProperty('bookid')) {
          this.loadBook(this.$route.params.bookid)
          .then(()=>{
            this.getBlocks();
          })
        }
      }
    },
    getBlocks() {
      if (this.meta._id) {
        let first_id = false;
        if (this.parlist.length > 0) first_id = this.parlist[this.parlist.length-1].chainid;
        else if (this.meta.startBlock_id) first_id = this.meta.startBlock_id;
        this.loadBlocksChain({
            book_id: this.meta._id,
            startId: first_id,
            onpage: 20
        })
        .then((result)=>{
            if (result.rows.length > 0) {
                result.rows.forEach((el, idx, arr)=>{
                    let newBlock = new BookBlock(el);
                    newBlock.content = newBlock.content.replace(
                      /[\s]*?<sup[\s]*?data-pg[\s]*?=[\s]*?['"]+(.*?)['"]+.*?>.*?<\/sup>/gm,
                      '<span data-pg="$1"></span>'
                    );
                    let ftnIdx = 0;
                    newBlock.content = newBlock.content.replace(
                      /[\s]*?<sup[\s]*?data-idx[\s]*?=[\s]*?['"]+(.*?)['"]+.*?>.*?<\/sup>/gm,
                      (idx)=>{
                        newBlock.footnotes[ftnIdx].ftnIdx = this.fntCounter;
                        ftnIdx++;
                        return `<sup data-idx="${this.fntCounter++}">[${this.fntCounter}]</sup>`
                      }
                    );
                    //'<sup data-idx="$1">[$1]</sup>'
                    this.parlist.push(newBlock);
                });
              console.log('result', result);
              if (result.finish) {
                if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.complete();
              } else {
                if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.loaded();
              }
            } else {
                if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.complete();
            }
            this.isAllLoaded = this.$refs.infiniteLoading.isComplete;
            this.reCountProxy();
        })
        .catch((err)=>{
          if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.complete();
          console.log('Error: ', err.message);
        });
      }
    },
    reCountProxy: function () {
      this.parCounter = { pref: 0, prefCnt: 0, curr: 1 };
      this.parlist.forEach((block, idx, arr)=>{
        block.parnum = setBlockParnum(block, this.parCounter);
      })
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
}
</script>

<style lang="less" scoped>
.container-fluid {
  padding-top: 15px;
  overflow-y: auto;
}
</style>
