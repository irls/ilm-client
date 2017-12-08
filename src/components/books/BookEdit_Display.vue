<template>
  <div :class="['ilm-global-style', metaStyles]" >
    <BookDisplayHeader />
    <BookTOC />
    <div v-for="(block, blid) in parlist" :class="['ocean']">
      <div v-if="block.type == 'illustration'">
        <img :class="block.getClass()" :src="block.getIllustration()"/>
      </div>
      <div v-else-if="block.type == 'hr'">
        <hr :class="[block.getClass()]"/>
      </div>
      <div v-else
        :class="block.getClass()"
        :id="block.id"
        :data-parnum="block.parnum"
        :lang="block.language || meta.language"
        :data-type="block.type"
        v-html="block.content"></div>
    </div>
    <infinite-loading @infinite="onInfiniteScroll" ref="infiniteLoading"></infinite-loading>
  </div>
</template>

<script>
import BookDisplayHeader from './BookDisplayHeader'
import BookTOC from './BookTOC'
import InfiniteLoading from 'vue-infinite-loading'
import { mapGetters, mapState, mapActions } from 'vuex'
import { BookBlock }    from '../../store/bookBlock'

export default {
  name: 'BookEditDisplay',
  data () {
    return {
      parlist: [],
      page: 0
    }
  },
  components: {
    BookDisplayHeader, BookTOC, InfiniteLoading
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
              console.log('style', style, 'val', this.meta.styles[style]);
              if (this.meta.styles[style].length) result.push(this.meta.styles[style]);
            }
            result = result.join(' ');
          }
          return result;
      }
  },
  methods: {
    ...mapActions(['loadBlocks']),
    onInfiniteScroll() {
      console.log('Loading blocks')
      this.loadBlocks({
            book_id: this.meta._id,
            page: this.page++,
            onpage: 20
        }).then((result)=>{
            console.log('Loading blocks finished')
            if (result.length > 0) {
                result.forEach((el, idx, arr)=>{
                    //let newBlock = Object.assign(new this.newBlock(), el.doc);
                    let newBlock = new BookBlock(el.doc);
                    this.parlist.push(newBlock);
                });

                if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.loaded();
            } else {
                if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.complete();
            }
            this.isAllLoaded = this.$refs.infiniteLoading.isComplete;
            //console.log('loaded', result);
        }).catch((err)=>{
            if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.complete();
            console.log('Error: ', err.message);
        });

    },
  },

}
</script>


<style scope>
/*.ocean {
  width: 100%; padding: 1em;
  font-family: 'gentium', serif; font-size: 1.5em;
  text-align: justify; justify-content: space-between;
  color: black;
}
@font-face {
  font-family: 'gentium';
  src: url('/static/fonts/GentiumPlus-R.woff') format('woff') /* Pretty Modern Browsers */
/*}
.ocean.showparnum {
  padding-left: 2em;
}
.ocean div[data-type] {
  margin-bottom: 1em;
}
img.illustration {
  max-height: 80vh;
  margin: 10px auto !important;
  text-align: center;
  display: block;
}*/
</style>
<style lang='less' src='./css/ilm_base.less' scope></style>
