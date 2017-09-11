<template>
<div class="container-fluid">

    <template v-for="(sublist, page_Idx) in parlist">
    <div class="row" v-for="(block, block_Idx) in sublist">
        <div class='col'>
          <BookBlockView
              :block="block"
              :putBlock ="putBlockProxy"
              :getBlock ="getBlockProxy"
              :recorder ="recorder"
              :blockOrderChanged ="blockOrderChanged"
              @stopRecordingAndNext="stopRecordingAndNext"
              @insertBefore="insertBlockBefore"
              @insertAfter="insertBlockAfter"
              @deleteBlock="deleteBlock"
          />
        </div>
        <!--<div class='col'>-->
    </div>
    <!--<div class="row"-->
    </template>

    <infinite-loading v-if="autoload" :on-infinite="onScrollBookDown" ref="scrollBookDown"></infinite-loading>
    <div id="narrateStartCountdown" class="modal fade in">
      <div>
        <strong>3</strong>
      </div>
    </div>
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
import mediaStreamRecorder from 'recordrtc'
import api_config from '../../mixins/api_config.js'
import axios from 'axios'

export default {
  data () {
    return {
      page: 0,
      parlist: [],
      autoload: true,
      recorder: false,
      parlistSkip: 0,
      blockOrderChanged: false,
      isAllLoaded: false
    }
  },
  computed: {
      // --- From store --- //
      ...mapState({
          //bookBlock: 'bookBlock'
      }),
      ...mapGetters({
          book: 'currentBook',
          meta: 'currentBookMeta',
          watchBlk: 'contentDBWatch',
          newBlock: 'newBlock'
      })
  },
  mixins: [access, taskControls, api_config],
  components: {
      BookBlockView, InfiniteLoading
  },
  methods: {
    ...mapActions(['loadBlocks', 'watchBlocks', 'putBlock', 'getBlock']),

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
            onpage: 20,
            skipOffset: this.parlistSkip
        }).then((result)=>{
            let tmp = [];
            if (result.length > 0) {
                result.forEach((el, idx, arr)=>{
                    //let newBlock = {...this.bookBlock, ...el.doc }
                    let newBlock = Object.assign(new this.newBlock(), el.doc);
                    tmp.push(newBlock);
                });
                if (tmp.length>0) this.parlist.push(tmp)//([...tmp]);

                this.$refs.scrollBookDown.$emit('$InfiniteLoading:loaded');
            } else {
                this.$refs.scrollBookDown.$emit('$InfiniteLoading:complete');
            }
            this.isAllLoaded = this.$refs.scrollBookDown.isComplete;
            //console.log('loaded', result);
        }).catch((err)=>{
            if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.$emit('$InfiniteLoading:complete');
            console.log('Error: ', err.message);
        });
    },

    refreshBlock (change) {
        let prev_block = null;
        this.parlist.forEach((el, idx0, arr)=>{
            el.forEach((block, idx1)=>{
                if (block._id === change.id) {
                    if (change.doc.audiosrc) {
                      change.doc.audiosrc = process.env.ILM_API + change.doc.audiosrc;
                    }
                    if (change.deleted === true) {
                      let par = el.slice(0, idx1);
                      let next = el.slice(idx1);
                      
                      next.forEach(_b => {
                        if (_b._id != change.id) {
                          par.push(_b);
                        }
                      });
                      this.setBlockOrderChanged(true);
                      Vue.set(this.parlist, idx0, par);
                      this.initEditors(change.doc);
                    } else {
                      Vue.set(this.parlist[idx0], idx1, { ...this.parlist[idx0][idx1], ...change.doc});
                    }
                } else if (prev_block && block.index > change.doc.index && prev_block.index < change.doc.index) {// new block
                  let par = el.slice(0, idx1);
                  let next = el.slice(idx1);
                  par.push(change.doc);
                  next.forEach(_b => {
                    par.push(_b);
                  });
                  this.setBlockOrderChanged(true);
                  Vue.set(this.parlist, idx0, par);
                  this.initEditors(change.doc, true);
                } else if (!prev_block && idx0 == 0 && idx1 == 0 && change.doc.index < block.index) {// new block before list
                  let par = this.parlist[idx0];
                  par.unshift(change.doc);
                  this.setBlockOrderChanged(true);
                  Vue.set(this.parlist, idx0, par);
                  this.initEditors(change.doc, true);
                }
                prev_block = block;
            });
        });
        if (prev_block && this.isAllLoaded && change.doc.index > prev_block.index) {// new block in the bottom
          let par = this.parlist[this.parlist.length - 1];
          par.push(change.doc);
          Vue.set(this.parlist, this.parlist.length - 1, par);
          this.initEditors(change.doc, true);
        }
        this.initRecorder();
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

    putBlockProxy: function (block) {
      return this.putBlock(block)
      .then(()=>{})
      .catch((err)=>{})
    },

    getBlockProxy: function (block_id) {
      return this.getBlock(block_id)
      .then((res)=>{
        this.parlist.forEach((el, idx0, arr)=>{
          el.forEach((block, idx1)=>{
            if (block._id === res._id) {
              Vue.set(this.parlist[idx0], idx1, { ...this.parlist[idx0][idx1], ...res});
            }
          });
        });
      })
      .catch((err)=>{
        console.log(err);
      })
    },

    eventKeyDown: function(key) {
        if (key.code==='Escape' || key.keyCode===27) this.$events.emit('currentEditingBlock_id', key);
    },
    onMediaSuccess_msr(stream) {
      this.recorder = new mediaStreamRecorder(stream, {
        recorderType: mediaStreamRecorder.MediaStreamRecorder,
        mimeType: 'audio/ogg'
      });
    },
    initRecorder() {
      if (!this.recorder && this.tc_hasTask('block_narrate')) {
        navigator.getUserMedia({
          audio: true
        }, this.onMediaSuccess_msr, function (e) {
          console.error('media error', e);
        });
      }
    },
    stopRecordingAndNext(block) {
      let next = this.findNextBlock(block);
      if (next) {
        let el = this.$children.find(c => {
          return c.$el.id == next._id;
        });
        if (el) {
          el.startRecording();
        }
      }
    },
    initEditors(block, on_added) {
      let self = this;
      let t = setInterval(function() {
        let check = on_added === true ? $('[id="' + block._id + '"]').length > 0 : $('[id="' + block._id + '"]').length == 0;
        if (check) {
          clearInterval(t);
          self.$children.forEach(c => {
            if (c.block && c.block.index >= block.index) {
              c.initEditor(true);
            }
          });
        }
      }, 100);
    },
    findNextBlock(block) {
      let next = false;
      for (let i = 0; i < this.parlist.length; ++i) {
        next = this.parlist[i].find(p => { 
          return p.index > block.index;
        });
        if (next) {
          return next;
        }
      }
      return next;
    },
    insertBlockBefore(block_id) {
      this.insertBlock(block_id, 'before');
    },
    insertBlockAfter(block_id) {
      this.insertBlock(block_id, 'after');
    },
    insertBlock(block_id, direction) {
      let par = false;
      let index = false;
      let block;
      for (let i = 0; i < this.parlist.length; ++i) {
        block = this.parlist[i].find(p => { 
          return p._id == block_id;
        });
        if (block) {
          par = this.parlist[i];
          index = i;
          i = this.parlist.length;
        }
      }
      //console.log(index, par, block._id);
      if (index !== false && par && block) {
        let api_url = this.API_URL + 'book/block';
        let api = this.$store.state.auth.getHttp();
        api.post(api_url, {
          block_id: block_id,
          direction: direction
        })
          .then(response => {
            ++this.parlistSkip;
          })
      }
    },
    deleteBlock(block_id) {
      let api_url = this.API_URL + 'book/block/' + block_id;
        let api = this.$store.state.auth.getHttp();
        api.delete(api_url, {})
          .then(response => {
            --this.parlistSkip;
          })
    },
    setBlockOrderChanged(val) {
      this.blockOrderChanged = val;
      let self = this;
      setTimeout(function() {
        self.blockOrderChanged = !val;
      }, 1000);
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
          });
      });
      this.initRecorder();
      window.onscroll = function() {
        $('#narrateStartCountdown').css('top', document.body.scrollTop + 'px');
        $('#narrateStartCountdown').css('height', '100%')
      }
  }
}
</script>

<style lang="less" src="./css/ocean.less"></style>
<style lang="less">
  #narrateStartCountdown {
      display: none;
      position: absolute;
      width: 100%;
      
      strong {
          margin: 0px 50%;
          display: block;
          width: 100%;
          font-size: 100px;
          top: 50%;
          position: absolute;
          color: #f2d3d3;
      }
  }
  .recording-background {
      background-color: rgba(0,0,0,0.5);
  }
  .recording-block {
      background-color: white;
      border-radius: 5px;
  }
</style>
