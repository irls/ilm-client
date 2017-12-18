<template>
<div :class="['container-fluid ilm-global-style', metaStyles]">

    <template v-for="(sublist, page_Idx) in parlist">
    <div class="row" v-for="(block, block_Idx) in sublist" v-bind:key="block_Idx">
        <div class='col'>
          <BookBlockView
              :block="block"
              :putBlock ="putBlockProxy"
              :getBlock ="getBlockProxy"
              :putBlockPart ="putBlockPartProxy"
              :reCount  ="reCountProxy"
              :recorder ="recorder"
              :blockOrderChanged ="blockOrderChanged"
              @stopRecordingAndNext="stopRecordingAndNext"
              @insertBefore="insertBlockBefore"
              @insertAfter="insertBlockAfter"
              @deleteBlock="deleteBlock"
              @joinBlocks="joinBlocks"
              @setRangeSelection="setRangeSelection"
          />
        </div>
        <!--<div class='col'>-->
    </div>
    <!--<div class="row"-->
    </template>

    <infinite-loading v-if="autoload" @infinite="onScrollBookDown" ref="scrollBookDown"></infinite-loading>

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
import { BookBlock }    from '../../store/bookBlock';

//import IlmCss from './css/ilm'

export default {
  data () {
    return {
      page: 0,
      parlist: [],
      autoload: true,
      recorder: false,
      parlistSkip: 0,
      blockOrderChanged: false,
      isAllLoaded: false,
      selectionStart: {},
      selectionEnd: {},
      parCounter: { pref: 0, prefCnt: 0, curr: 1 }
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
          allBooks: 'allBooks'
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
  mixins: [access, taskControls, api_config],
  components: {
      BookBlockView, InfiniteLoading
  },
  methods: {
    ...mapActions(['loadBlocks', 'watchBlocks', 'putBlock', 'getBlock', 'putBlockPart']),

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
          this.$refs.scrollBookUp.stateChanger.loaded()
      }
      console.log('onScrollBookUp');
    },

    onScrollBookDown() {
        //console.log('onScrollBookDown, page:', this.page);
        //console.log( this.meta._id );
        this.getBlocks();
    },

    setBlockParnum(block) {
      let result = false;
      switch(block.type) {
        case 'header' : {
          this.parCounter.curr = 1;

          if (block.secnum === false) {
            this.parCounter.pref = false;
            break;
          }
          if (block.secnum.length === 0) {
            this.parCounter.prefCnt++;
            this.parCounter.pref = this.parCounter.prefCnt;
            break;
          }
          if (!isNaN(block.secnum)) { // Number
            this.parCounter.prefCnt = parseInt(block.secnum);
            this.parCounter.pref = this.parCounter.prefCnt;
          } else { // String
            this.parCounter.pref = block.secnum;
          }
        } break;
        case 'par' : {
          if (block.parnum===false) {
            break;
          }
          if (this.parCounter.pref === false) {
            result = '';
            break;
          }
          result = this.parCounter.pref+'.'+this.parCounter.curr;
          this.parCounter.curr++;
        } break;
      };
      return result;
    },

    getBlocks() {
      if (this.meta._id) {
        this.loadBlocks({
              book_id: this.meta._id,
              page: this.page++,
              onpage: 20,
              skipOffset: this.parlistSkip
          }).then((result)=>{
              let tmp = [];
              if (result.length > 0) {
                  result.forEach((el, idx, arr)=>{
                      let newBlock = new BookBlock(el.doc);
                      newBlock.parnum = this.setBlockParnum(newBlock);
                      tmp.push(newBlock);
                  });
                  if (tmp.length>0) this.parlist.push(tmp)

                  if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.stateChanger.loaded();
              } else {
                  if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.stateChanger.complete();
              }
              this.isAllLoaded = this.$refs.scrollBookDown ? this.$refs.scrollBookDown.isComplete : false;
          }).catch((err)=>{
              if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.stateChanger.complete();
              console.log('Error: ', err.message);
          });
      }
    },

    refreshBlock (change) {
        //console.log('refreshBlock', change.doc);
        let prev_block = null;
        this.parlist.forEach((el, idx0, arr)=>{
            el.forEach((block, idx1)=>{
                if (block._id === change.id) {
                    if (change.doc.audiosrc) {
                      change.doc.audiosrc = process.env.ILM_API + change.doc.audiosrc;
                    }
                    if (change.deleted === true) {
                      el.splice(idx1, 1);
                      this.onBlockNumberChange(change.doc, idx0)
                    } else {
                      if (this.parlist[idx0][idx1].partUpdate) {
                        this.parlist[idx0][idx1]._rev = change.doc._rev;
                      } else {
                        Vue.set(this.parlist[idx0], idx1, new BookBlock(change.doc));
                      }
                    }
                } else if (prev_block && block.index > change.doc.index && prev_block.index < change.doc.index) {// new block
                  let existing = el.find(_b => {
                    return _b._id == change.doc._id;
                  })
                  if (!existing) {
                    el.splice(idx1, 0, new BookBlock(change.doc))
                    this.onBlockNumberChange(change.doc, idx0)
                  }
                } else if (!prev_block && idx0 == 0 && idx1 == 0 && change.doc.index < block.index) {// new block before list
                  let existing = el.find(_b => {
                    return _b._id == change.doc._id;
                  })
                  if (!existing) {
                    this.parlist[idx0].unshift(new BookBlock(change.doc));
                    this.onBlockNumberChange(change.doc, idx0);
                  }
                }
                prev_block = block;
            });
        });
        if (prev_block && this.isAllLoaded && change.doc.index > prev_block.index) {// new block in the bottom
          this.parlist[this.parlist.length - 1].push(new BookBlock(change.doc));
          this.onBlockNumberChange(change.doc, this.parlist.length - 1);
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

    putBlockPartProxy: function (blockData) {
      return this.putBlockPart(blockData)
      .then(()=>{})
      .catch((err)=>{})
    },

    getBlockProxy: function (block_id) {
      return this.getBlock(block_id)
      .then((res)=>{
        this.parlist.forEach((el, idx0, arr)=>{
          el.forEach((block, idx1)=>{
            if (block._id === res._id) {
              Vue.set(this.parlist[idx0], idx1, new BookBlock(res));
            }
          });
        });
      })
      .catch((err)=>{
        console.log(err);
      })
    },

    reCountProxy: function () {
      this.parCounter = { pref: 0, prefCnt: 0, curr: 1 };
      this.parlist.forEach((el, idx0, arr)=>{
        el.forEach((block, idx1)=>{
          block.parnum = this.setBlockParnum(block);
          //console.log(block._id, block.type, block.secnum, block.parnum);
        })
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
      let next = this.findNextBlock(block, 'narrate');
      if (next) {
        let el = this.$children.find(c => {
          return c.$el.id == next._id;
        });
        if (el) {
          this.scrollToBlock(next._id);
          el.startRecording();
        }
      }
    },
    scrollToBlock(id) {
      let offset = document.getElementById(id).getBoundingClientRect()
      window.scrollTo(0, window.pageYOffset + offset.top - 110);
    },
    initEditors(block, par_index) {
      let ids = [];
      this.parlist[par_index].forEach(b => {
        ids.push(b._id);
      });
      this.$children.forEach(c => {
        if (c.block && c.block.index >= block.index && ids.indexOf(c.block._id) !== -1) {
          c.initEditor(true);
        }
      });
    },
    findNextBlock(block, task) {
      let next = false;
      for (let i = 0; i < this.parlist.length; ++i) {
        next = this.parlist[i].find(p => {
          let isNext = p.index > block.index;
          if (task) {
            switch (task) {
              case 'narrate':
                isNext = isNext && this.tc_showBlockNarrate(p._id);
                break;
            }
          }
          return isNext;
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
    joinBlocks(block, direction) {
      let api_url = this.API_URL + 'book/block_join/';
      let api = this.$store.state.auth.getHttp();
      api.post(api_url, {
        block_id: block._id,
        direction: direction
      });
    },
    setBlockOrderChanged(val) {
      this.blockOrderChanged = val;
      let self = this;
      setTimeout(function() {
        self.blockOrderChanged = !val;
      }, 1000);
    },
    refreshBlocksProperties(par_index) {
      let ids = [];
      this.parlist[par_index].forEach(b => {
        ids.push(b._id);
      });
      this.$children.forEach(c => {
        if (c.block && ids.indexOf(c.block._id) !== -1) {
          this.refreshBlockProperties(c);
        }
      });
    },
    refreshBlockProperties(el) {
      el.updateFlagStatus(el.block._id);
    },
    onBlockNumberChange(block, par_index) {
      let self = this;
      Vue.nextTick(function() {
        self.refreshBlocksProperties(par_index);
        self.initEditors(block, par_index);
      });
      this.setBlockOrderChanged(true);
    },
    setRangeSelection(block, type, status) {
      switch (type) {
        case 'start':
          if (status) {
            if (!this.selectionEnd || !this.selectionEnd._id || this.selectionEnd.index >= block.index) {
              this.selectionStart = block;
              this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
            }
            $('.set-range-start').prop('checked', false);
            $('#' + this.selectionStart._id + ' .set-range-start').prop('checked', true);
          } else {
            this.selectionStart = {};
            this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
          }
          break;
        case 'end':
          if (status) {
            if (!this.selectionStart || !this.selectionStart._id || this.selectionStart.index <= block.index) {
                this.selectionEnd = block;
                this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
              }
              $('.set-range-end').prop('checked', false);
              $('#' + this.selectionEnd._id + ' .set-range-end').prop('checked', true);
            } else {
              this.selectionEnd = {};
              this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
            }
          break;
      }
    },
    setEnd(block, status) {

    },
    setBlockWatch() {
      this.watchBlocks({book_id: this.meta._id})
        .then(()=>{
          this.watchBlk.on('change', (change) => {
              this.refreshBlock(change);
          });
        });
    }
  },
  events: {
      currentEditingBlock_id : function (key) {
          //console.log("keydown: ", key)
      }
  },
  mounted: function() {
      window.addEventListener('keydown', this.eventKeyDown);

      this.setBlockWatch();
      this.initRecorder();
      window.onscroll = function() {
        $('#narrateStartCountdown').css('top', document.scrollingElement.scrollTop + 'px');
        $('#narrateStartCountdown').css('height', '100%')
      }
      let self = this;
      this.$root.$on('book-reimported', function() {
        self.page = 0;
        Vue.set(self, 'parlist', []);
        self.parlistSkip = 0;
        Vue.nextTick(function() {
          self.getBlocks();
        });
      });
      this.$root.$on('for-bookedit:scroll-to-block', function(id) {
        self.scrollToBlock(id);
      })
  },

  beforeDestroy:  function() {
    window.removeEventListener('keydown', this.eventKeyDown);
  },
  watch: {
    'meta._id': {
      handler() {
        this.page = 0;
        this.parlistSkip = 0;
        this.getBlocks();
      }
    },
    'allBooks': {
      handler() {
        this.setBlockWatch();
      }
    }
  }
}
</script>
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
  .infinite-status-prompt {
    margin-bottom: 175px;
  }
  .fixed-bottom {
    /*display: none;*/
    position: fixed;
    /*margin-left: -10px;*/
    width: 99%;
    bottom: 0px;
    border: 1px solid black;
    border-radius: 0px;
    height: 222px;
  }
  a.go-to-block {
    cursor: pointer;
  }

</style>
