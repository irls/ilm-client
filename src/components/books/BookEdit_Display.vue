<template>
  <div class='ocean showparnum'>
    <BookDisplayHeader />
    <BookTOC />
    <div v-for="(block, blid) in parlist"
        :class="block.classes.join(' ')"
        :id="block.id"
        :data-parnum="block.parnum"
        :lang="block.language || meta.language"
        :data-type="block.type"
        v-html="block.content"></div>
    <infinite-loading :on-infinite="onInfiniteScroll" ref="infiniteLoading"></infinite-loading>
  </div>
</template>

<script>
import BookDisplayHeader from './BookDisplayHeader'
import BookTOC from './BookTOC'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  name: 'BookEditDisplay',
  data () {
    return {
      book: this.$store.state.currentBook,
      meta: this.$store.state.currentBookMeta,
      parlist: [],
    }
  },
  components: {
    BookDisplayHeader, BookTOC, InfiniteLoading
  },
  methods: {
    onInfiniteScroll() {
      let index = this.parlist.length
      let step = 3 // number of paragaphs to grab at a time
      //this.parlist = this.parlist.concat(this.book.content.slice(index, index+step));
      //this.$refs.infiniteLoading.$emit('$InfiniteLoading:loaded');

      let tmp = []
      for (let i = index; i < index + step; i++) if (i<this.book.content.length) {
        tmp.push(Object.assign(this.book.content[i]))
      }
      if (tmp.length>0) {
        this.parlist = this.parlist.concat(tmp);
        this.$refs.infiniteLoading.$emit('$InfiniteLoading:loaded');
      } else this.$refs.infiniteLoading.$emit('$InfiniteLoading:complete');

    },
  },

}
</script>


<style scope>
.ocean {
  width: 100%; padding: 1em;
  font-family: 'gentium', serif; font-size: 1.5em;
  text-align: justify; justify-content: space-between;
  color: black;
}
@font-face {
  font-family: 'gentium';
  src: url('/static/fonts/GentiumPlus-R.woff') format('woff') /* Pretty Modern Browsers */
}
.ocean.showparnum {
  padding-left: 2em;
}
.ocean div[data-type] {
  margin-bottom: 1em;
}
</style>
<style lang='less' src='./css/ocean.less' scope></style>
