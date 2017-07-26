<template>
<div class="container-fluid">


    <template v-for="(sublist, page_Idx) in parlist">
    <div class="row" v-for="(block, block_Idx) in sublist">
        <div class='col'>
          <BookBlockView
              :block="block"
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
          meta: 'currentBookMeta'
      })
  },
  mixins: [access, taskControls],
  components: {
      BookBlockView, InfiniteLoading
  },
  methods: {
    ...mapActions(['loadBlocks']),

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
                    let newBlock = { ...this.block, ...el.value }
                    //console.log('el.doc', el.doc);
                    //newBlock.idx = idx;
                    tmp.push(newBlock);
                });

                if (tmp.length>0) this.parlist.push(tmp)//([...tmp]);
                this.$refs.scrollBookDown.$emit('$InfiniteLoading:loaded');
            } else {
                this.$refs.scrollBookDown.$emit('$InfiniteLoading:complete');
            }
            console.log('loaded', result);
        }).catch((err)=>{
            if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.$emit('$InfiniteLoading:complete');
            console.log('Error: ', err.message);
        });
    },

//     loadBlocks: function(page, onpage) {
//       console.log('loadBlocks from:', page * onpage, ' to:', (page + 1) * onpage);
//       return new Promise((resolve, reject) => {
//           setTimeout(() => {
//               if (typeof(this.book.content)==='undefined') return reject({message: 'book not found'});
//               //if (this.parlist.length > 2) this.parlist.splice(0,1);
//               let tmp = [];
//               for (let i = page * onpage; i < (page + 1) * onpage; i++)
//               if (i < this.book.content.length) {
//                   let newBlock = { ...this.block, ...this.book.content[i] }
//                   newBlock.idx = i;
//                   tmp.push(newBlock);
//               }
//               if (tmp.length>0) this.parlist.push(tmp)//([...tmp]);
//               return resolve(tmp.length);
//           }, 1000);
//       })
//     },

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
    saveChanges: function() {
      this.$events.emit('currentEditingBlockId')
      // how do we insert new blocks?
      var vm = this
      var book = vm.$store.state.currentBook
      this.parlist.forEach((block, bl_id) => {
        if (block.edited) {
          // console.log("Replacing edited block #"+bl_id)
          delete block.edited
          book.content[bl_id] = Object.assign({}, block)
        }
      })

      // delete deleted blocks
      book.content = book.content.filter(function(block, bl_id) {
        //if (block._deleted) console.log('Deleting block #', bl_id)
        return !block._deleted
      })
      // split splitted blocks

      // save to DB
      vm.autoload = false
      var db = this.libraryDB() // gets authenticated instance of ilm_content db
      db.get(book._id).then(function(doc){
        doc.content = book.content // does this create a copy or a reference?
        db.put(doc).then(doc => {
          db.get(doc.id).then(newdoc => {
            vm.book = newdoc
            vm.reloadBookDisplay(vm)
            vm.edited = [];
            //console.log('emptied edited list: ', this.edited)
          })
        }).catch(err => console.log(err))
      })

    },



    eventKeyDown: function(key) {
        if (key.code==='Escape' || key.keyCode===27) this.$events.emit('currentEditingBlock_id', key);
    }
  },
  events: {
      'currentEditingBlock_id' : function (key) {
          //console.log("keydown: ", key)
      }
  },
  mounted: function() {
      // --- Remove the old listener to avoid duplication --- //
      // --- Otherwise after hot-update there will be several listeners for window --- //
      window.removeEventListener('keydown', this.eventKeyDown);
      window.addEventListener('keydown', this.eventKeyDown);
  }
}
</script>

<style lang="less" src="./css/ocean.less"></style>
<style lang="less">

</style>
