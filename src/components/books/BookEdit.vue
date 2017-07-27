<template>
<div class="container-fluid">


    <template v-for="(sublist, page_Idx) in parlist">
    <div class="row" v-for="(block, block_Idx) in sublist">
        <div class='col'>
          <BookBlockView
              v-bind:block="block"
              v-bind:putBlock ="updBlock"
          />
        </div>
        <!--<div class='col'>-->
    </div>
    <!--<div class="row"-->
    </template>

    <infinite-loading v-if="autoload" :on-infinite="onScrollBookDown" ref="scrollBookDown"></infinite-loading>

</div>
<!--<div class="container">-->
</template>

<script>

import { mapGetters, mapState, mapActions } from 'vuex'
import BookBlockView from './BookBlockView'
import InfiniteLoading from 'vue-infinite-loading'
import Vue from 'vue'
import access from "../../mixins/access.js"
import taskControls from '../../mixins/task_controls.js'

export default {
  data () {
    return {
      page: 0,
      parlist: [],
      autoload: true
    }
  },
  computed: {
      // --- From store --- //
      ...mapState({
          block: 'bookBlock'
      }),
      ...mapGetters({
          book: 'currentBook',
          meta: 'currentBookMeta',
          watchBlk: 'contentDBWatch'
      })
  },
  mixins: [access, taskControls],
  components: {
      BookBlockView, InfiniteLoading
  },
  methods: {
    ...mapActions(['loadBlocks', 'watchBlocks', 'putBlock']),

    test() {
        //this.parlist.splice(0,1);
        //console.log(this.parlist);
        window.scrollTo(0, document.body.scrollHeight-500);
    },

    onScrollBookUp() {
      console.log('onScrollBookUp, page: ', this.page);
      if (this.page>1) {
          this.page--;
      } else {
          this.$refs.scrollBookUp.$emit('$InfiniteLoading:loaded');
      }
      console.log('onScrollBookUp');
    },

    onScrollBookDown() {
        console.log('onScrollBookDown, page:', this.page);
        console.log( this.meta._id );
        this.loadBlocks({
            book_id: this.meta._id,
            page: this.page++,
            onpage: 20
        }).then((result)=>{
            let tmp = [];
            if (result.length > 0) {
                result.forEach((el, idx, arr)=>{
                    let newBlock = { ...this.block, ...el.doc }
                    tmp.push(newBlock);
                });
                if (tmp.length>0) this.parlist.push(tmp)//([...tmp]);

                this.$refs.scrollBookDown.$emit('$InfiniteLoading:loaded');
            } else {
                this.$refs.scrollBookDown.$emit('$InfiniteLoading:complete');
            }
            //console.log('loaded', result);
        }).catch((err)=>{
            if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.$emit('$InfiniteLoading:complete');
            console.log('Error: ', err.message);
        });
    },

    refreshBlock (change) {
        console.log("refreshBlock: ", change)

        this.parlist.forEach((el, idx0, arr)=>{
            el.forEach((block, idx1)=>{
                if (block._id === change.id) {
                    Vue.set(this.parlist[idx0], idx1, { ...this.parlist[idx0][idx1], ...change.doc});
                }
            });
        });
    },

//       return new Promise((resolve, reject) => {
//           setTimeout(() => {
//               if (typeof(this.book.content)==='undefined') return reject({message: 'book not found'});
//           }, 1000);
//       })


    hasClass: function(block, cssclass) {
      let list = block.classes.toLowerCase().trim().split(' ');
      return (list.indexOf(cssclass.toLowerCase()) > -1)
    },
    showID: function(block) {
      return ((block.type==='par') && this.hasClass(block, 'parnum'))
    },

    hideParNum: function(block) {
      alert('Removing Paragraph Number'+ block.id)
    },
    showParNum: function(block) {
      alert('Adding Paragraph Number'+ block.id)
    },
    insertBlockBelow: function (block) {
      alert('Inserting new Block after '+block.id)
    },
    removeBlock: function(block) {
      alert('Merging block into '+block.id)
    },
    editBlockId: function(block) {
      alert('Editing block id '+block.id)
    },

    updBlock: function (block) {
        this.putBlock(block)
        .then(()=>{})
        .catch((err)=>{})
    },



    eventKeyDown: function(key) {
        if (key.code==='Escape' || key.keyCode===27) this.$events.emit('currentEditingBlock_id', key);
    }
  },
  events: {
      currentEditingBlock_id : function (key) {
          //console.log("keydown: ", key)
      }
  },
  mounted: function() {
      console.log('Mounted?');
      // --- Remove the old listener to avoid duplication --- //
      // --- Otherwise after hot-update there will be several listeners for window --- //
      window.removeEventListener('keydown', this.eventKeyDown);
      window.addEventListener('keydown', this.eventKeyDown);

      this.watchBlocks({book_id: this.meta._id})
      .then(()=>{
          this.watchBlk.on('change', (change) => {
              this.refreshBlock(change);
          })
      });
  }
}
</script>

<style lang="less" src="./css/ocean.less"></style>
<style lang="less">

</style>
