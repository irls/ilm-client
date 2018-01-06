<template>
  <div :class="['ilm-global-style', metaStyles]">
    <BookDisplayHeader />
    <BookTOC />
    <div v-for="(block, blid) in parlist" :class="['ilm-block']">
      <div v-if="block.type == 'illustration'">
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
              //console.log('style', style, 'val', this.meta.styles[style]);
              if (this.meta.styles[style].length) result.push(this.meta.styles[style]);
            }
            result = result.join(' ');
          }
          return result;
      }
  },
  methods: {
    ...mapActions(['loadBlocks', 'loadBlocksChain']),
    onInfiniteScroll() {
      let first_id = false;
      if (this.parlist.length > 0) first_id = this.parlist[this.parlist.length-1].chainid;
      else if (this.meta.startBlock_id) first_id = this.meta.startBlock_id;
      this.loadBlocksChain({
          book_id: this.meta._id,
          first_id: first_id,
          onpage: 20
      })
      .then((result)=>{
          if (result.length > 0) {
              result.forEach((el, idx, arr)=>{
                  let newBlock = new BookBlock(el);
                  this.parlist.push(newBlock);
              });
            if (result.length < 20) {
              if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.complete();
            } else {
              if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.loaded();
            }
          } else {
              if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.complete();
          }
          this.isAllLoaded = this.$refs.infiniteLoading.isComplete;
          //console.log('loaded', result);
      })
      .catch((err)=>{
        if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.stateChanger.complete();
        console.log('Error: ', err.message);
      });
    },
  },
}
</script>
