<template>
<div :class="['container-fluid ilm-global-style', metaStyles]">

    <!--<template v-for="(sublist, page_Idx) in parlist">-->
    <div class="row" v-for="(block, block_Idx) in parlist" v-bind:key="block_Idx">
        <div class='col'>
          <BookBlockView ref="blocks"
              :block="block"
              :putBlock ="putBlockProxy"
              :getBlock ="getBlockProxy"
              :putBlockPart ="putBlockPartProxy"
              :reCount  ="reCountProxy"
              :recorder ="recorder"
              :block_Idx = "block_Idx"
              @stopRecordingAndNext="stopRecordingAndNext"
              @insertBefore="insertBlockBefore"
              @insertAfter="insertBlockAfter"
              @deleteBlock="deleteBlock"
              :joinBlocks="joinBlocks"
              @setRangeSelection="setRangeSelection"
              @blockUpdated="blockUpdated"
          />
        </div>
        <!--<div class='col'>-->
    </div>
    <!--<div class="row"-->
    <modal v-model="doJoinBlocks.show" effect="fade" cancel-text="Close" title="Join blocks saving">
      <div slot="modal-body" class="modal-body">Save changes and join blocks?</div>
      <div slot="modal-footer" class="modal-footer">
        <button type="button" class="btn btn-default" @click="doJoinBlocks.show = false;">Cancel</button>
        <button v-if="doJoinBlocks.direction == 'previous'" type="button" class="btn btn-primary" @click="joinBlocks()">Save &amp; Join</button>
        <button v-if="doJoinBlocks.direction == 'next'" type="button" class="btn btn-primary" @click="joinBlocks()">Save &amp; Join</button>
      </div>
    </modal>
    <modal v-model="unableJoinMessage" effect="fade" cancel-text="Close" title="Join blocks error">
      <div slot="modal-body" class="modal-body">Blocks with different types can't be joined</div>
      <div slot="modal-footer" class="modal-footer">
        <button type="button" class="btn btn-default" @click="unableJoinMessage = false">Close</button>
      </div>
    </modal>

    <!--</template>-->

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
import { BookBlock, setBlockParnum }    from '../../store/bookBlock';
import { modal }        from 'vue-strap';

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
      parCounter: { pref: 0, prefCnt: 0, curr: 1 },
      blocksListQuery: false,
      unableJoinMessage: false,
      doJoinBlocks: {
        show: false,
        action: false,
        block: {},
        block_Idx: false
      }
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
      BookBlockView, InfiniteLoading,
      modal,
  },
  methods: {
    ...mapActions(['loadBook', 'loadBlocks', 'loadBlocksChain', 'watchBlocks', 'putBlock', 'getBlock', 'putBlockPart', 'getBlockByChainId', 'setMetaData']),

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
        //console.log('onScrollBookDown');
        //console.log( this.meta._id );

        if (this.meta._id) {
          if (this.$route.params.hasOwnProperty('block') && this.$route.params.block) {
            this.getBloksUntil(this.$route.params.block);
          } else {
            this.getBlocks().then(res=>res).catch(err=>err);
          }
        } else {
          if (this.$route.params.hasOwnProperty('bookid')) {
            this.loadBook(this.$route.params.bookid)
            .then(()=>{
              if (this.$route.params.hasOwnProperty('block') && this.$route.params.block) {
                this.getBloksUntil(this.$route.params.block);
              } else {
                this.getBlocks().then(res=>res).catch(err=>err);
              }
            })
          }
        }


    },

    getBlocks(query) {
      query = query || false;
      if (this.meta._id) {
        let first_id = false;
        if (this.parlist.length > 0) first_id = this.parlist[this.parlist.length-1].chainid;
        else if (this.meta.startBlock_id) first_id = this.meta.startBlock_id;
        return this.loadBlocksChain({
          book_id: this.meta._id,
          first_id: first_id,
          onpage: 20, query: query
        })
        .then((result)=>{
          if (result.rows.length > 0) {
              result.rows.forEach((el, idx, arr)=>{
                let newBlock = new BookBlock(el);
                this.parlist.push(newBlock);
              });
            if (result.finish) {
              if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.stateChanger.complete();
            } else {
              if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.stateChanger.loaded();
            }
          } else {
              if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.stateChanger.complete();
          }
          this.isAllLoaded = this.$refs.scrollBookDown ? this.$refs.scrollBookDown.isComplete : false;
          this.reCountProxy();
          //this.unresId = result.unresId;
          return Promise.resolve(result.blockId);
        })
        .catch((err)=>{
          if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.stateChanger.complete();
          console.log('Error: ', err.message);
          return Promise.reject(err);
        });
      } else return Promise.reject(new Error('Empty meta._id'));
    },

    getBloksUntil (query) {

      let result = false;
      if (this.parlist.length) this.parlist.forEach((block, idx, arr)=>{

        switch(query) {
          case 'unresolved': {
            if (!result && !block.markedAsDone) result = block._id;
          } break;
          default : {
            if (!result && block._id === query) result = block._id;
          } break;
        };

      });

      if (!result) {
        this.getBlocks(query)
        .then((blockId)=>{
          if (blockId && blockId !== true) {
            if (query == 'unresolved') {
              this.$router.push({name: this.$route.name, params: { block: blockId } });
            }
            Vue.nextTick(()=>{
              this.scrollToBlock(blockId);
            });
          }

        })
        .catch((err)=>{
          console.log('err:', err);
          return err;
        })
      } else {
        this.$router.push({name: this.$route.name, params: { } });
        this.scrollToBlock(result);
      }
    },

    refreshBlock (change) {
      //console.log('refreshBlock', change.doc);
      this.parlist.forEach((block, idx, arr)=>{
        if (block._id === change.id) {
          if (change.doc.audiosrc) {
            change.doc.audiosrc = process.env.ILM_API + change.doc.audiosrc;
          }
          if (change.deleted === true) {
            this.parlist.splice(idx, 1);
          } else {
            let _rev = this.parlist[idx]._rev;
            if (this.parlist[idx].partUpdate) {
              this.parlist[idx]._rev = change.doc._rev;
            } else {
              Vue.set(this.parlist, idx, new BookBlock(change.doc));
              this.parlist[idx].isUpdated = true;
            }
          }
        }
      });
      this.initRecorder();
      this.reCountProxy();
    },

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
        this.parlist.forEach((block, idx, arr)=>{
          if (block._id === res._id) {
            Vue.set(this.parlist, idx, new BookBlock(res));
          }
        });
      })
      .catch((err)=>{
        console.log(err);
      })
    },

    reCountProxy: function () {
      this.parCounter = { pref: 0, prefCnt: 0, curr: 1 };
      this.parlist.forEach((block, idx, arr)=>{
        block.parnum = setBlockParnum(block, this.parCounter);
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
      if (!this.recorder && this._is('narrator')) {
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
      let domObj = document.getElementById(id);
      if (domObj) {
        let offset = domObj.getBoundingClientRect()
        window.scrollTo(0, window.pageYOffset + offset.top - 110);
      }
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
      let curr = Object.assign({}, block);
      do {
        curr = this.parlist.find(p => {
          return p._id == curr.chainid;
        });
        if (curr) {
          if (task) {
            switch (task) {
              case 'narrate':
                if (this.tc_showBlockNarrate(curr._id)) {
                  next = curr;
                }
                break;
            }
          }
        }
      } while (curr && !next);
      return next;
    },

    createEmptyBlock(bookid, block_id) {
      let newBlock = {
        _id: bookid + '_' + Date.now(),
        _rev: '1-newrevisionnumber',
        bookid: bookid,
        chainid: block_id,
        tag: 'p',
        type: 'par',
        parnum: '',
        content: '',
        voicework: 'no_audio',
        status: {
          assignee: 'editor',
          proofed: false
        }
      }
      if (this.tc_hasTask('content_cleanup')) {
        newBlock.status['stage'] = 'cleanup';
        newBlock.markedAsDone = false;
        newBlock.voicework = 'audio_file';
      } else {
        newBlock.status['not_process'] = true;
        newBlock.markedAsDone = false;
      }
      
      return new BookBlock(newBlock);
    },

    insertBlockBefore(block, block_Idx) {
      //this.insertBlock(block._id, 'before');
      this.getBlockByChainId(block._id)
      .then((blockBefore)=>{
          //console.log('blockBefore', blockBefore);
          let newBlock = this.createEmptyBlock(block.bookid, block._id);
          this.parlist.splice(block_Idx, 0, newBlock);
          this.putBlock(newBlock)
          .then((createdBlock)=>{
            if (blockBefore) {
              blockBefore.chainid = newBlock._id;
              console.log('blockBefore', blockBefore.chainid);
              this.putBlockPart({
                block: new BookBlock(blockBefore),
                field: 'chainid'
              })
              .then(()=>{});
            } else {
              this.setMetaData({ key: 'startBlock_id', value: newBlock._id})
              .then(()=>{});
            }
            if (!this.tc_hasTask('content_cleanup')) {
              this._createBlockSubtask(createdBlock.id, 'approve-new-block', 'editor')
            }
          })
          .catch((err)=>err)
      })
      .catch((err)=>err)
    },

    insertBlockAfter(block, block_Idx) {
      //this.insertBlock(block_id, 'after');
      let newBlock = this.createEmptyBlock(block.bookid, block.chainid);
      this.parlist.splice(block_Idx+1, 0, newBlock);
      this.putBlock(newBlock)
      .then((createdBlock)=>{
        block.chainid = newBlock._id;
        if (!this.tc_hasTask('content_cleanup')) {
          this._createBlockSubtask(createdBlock.id, 'approve-new-block', 'editor')
        }
        this.putBlockPart({
          block: new BookBlock(block),
          field: 'chainid'
        }).then(()=>{});
      })
      .catch((err)=>{})
    },
    blockUpdated(blockid) {
      if (this._is('editor') && !this.tc_hasTask('content_cleanup') && !this.tc_getBlockTask(blockid)) {
        this._createBlockSubtask(blockid, 'approve-modified-block', 'editor');
      }
    },
    _createBlockSubtask(blockid, type, executor) {
      axios.post(this.API_URL + 'task/subtask_by_book', {
        bookid: this.meta._id,
        params: {
          type: type,
          executor: executor,
          blockid: blockid
        }
      })
        .then((response) => {

        })
        .catch((err) => {})
    },

    deleteBlock(block, block_Idx) {
//       let api_url = this.API_URL + 'book/block/' + block_id;
//         let api = this.$store.state.auth.getHttp();
//         api.delete(api_url, {})
//           .then(response => {
//             --this.parlistSkip;
//           })
      this.getBlockByChainId(block._id)
      .then((blockBefore)=>{
          //console.log('blockBefore', blockBefore);
          this.parlist.splice(block_Idx, 1);
          block._deleted =  true;
          this.putBlock(block)
          .then(()=>{
            if (blockBefore) {
              blockBefore.chainid = block.chainid;
              this.putBlockPart({
                block: new BookBlock(blockBefore),
                field: 'chainid'
              }).then(()=>{});
            } else {
              this.setMetaData({ key: 'startBlock_id', value: block.chainid})
              .then(()=>{});
            }
          })
          .catch((err)=>{})
      })
      .catch((err)=>err)
    },
    joinBlocks(block, block_Idx, direction) {
      let api_url = this.API_URL + 'book/block_join/';
      let api = this.$store.state.auth.getHttp();

      block = block || this.doJoinBlocks.block;
      block_Idx = block_Idx || this.doJoinBlocks.block_Idx;
      direction = direction || this.doJoinBlocks.direction;

      this.doJoinBlocks.block_Idx = false;
      this.doJoinBlocks.block = {};

      //console.log('joinBlocks', block, block_Idx, direction);
      let checkArr = ['par', 'title', 'header'];

        switch(direction) {
          case 'previous' : {
            return this.getBlockByChainId(block._id)
            .then((blockBefore)=>{
              //if (!checkArr.includes(block.type) || !checkArr.includes(blockBefore.type)) {
              if (block.type !== blockBefore.type) {
                this.unableJoinMessage = true;
                return Promise.reject('type');
              }
              if (!this.$refs.blocks[block_Idx-1]) {
                this.unableJoinMessage = true;
                return Promise.reject('type');
              }
              if (!this.doJoinBlocks.show
              && (this.$refs.blocks[block_Idx].isChanged || this.$refs.blocks[block_Idx-1].isChanged))
              {
                this.doJoinBlocks.block = block;
                this.doJoinBlocks.block_Idx = block_Idx;
                this.doJoinBlocks.direction = direction;
                this.doJoinBlocks.show = true;
              }
              else
              {
                this.doJoinBlocks.block = {};
                this.$refs.blocks[block_Idx].assembleBlockProxy()
                .then(()=>{
                  this.$refs.blocks[block_Idx-1].assembleBlockProxy()
                  .then(()=>{
                    return api.post(api_url, {
                      resultBlock_id: blockBefore._id,
                      donorBlock_id: block._id
                    })
                    .then(()=>{
                      this.doJoinBlocks.show = false;
                      this.doJoinBlocks.block = {};
                      this.doJoinBlocks.block_Idx = false;
                      return Promise.resolve();
                    })
                    .catch((err)=>{
                      this.doJoinBlocks.show = false;
                      this.doJoinBlocks.block = {};
                      this.doJoinBlocks.block_Idx = false;
                      return Promise.reject(err);
                    })
                  })
                })
              }
            })
          } break;
          case 'next' : {
            return this.getBlock(block.chainid)
            .then((blockAfter)=>{
              if (block.type !== blockAfter.type) {
                this.unableJoinMessage = true;
                return Promise.reject('type');
              }
              if (!this.$refs.blocks[block_Idx+1]) {
                this.unableJoinMessage = true;
                return Promise.reject('type');
              }
              if (!this.doJoinBlocks.show
              && (this.$refs.blocks[block_Idx].isChanged || this.$refs.blocks[block_Idx+1].isChanged))
              {
                this.doJoinBlocks.block = block;
                this.doJoinBlocks.block_Idx = block_Idx;
                this.doJoinBlocks.direction = direction;
                this.doJoinBlocks.show = true;
              }
              else
              {
                this.doJoinBlocks.block = {};
                this.$refs.blocks[block_Idx].assembleBlockProxy()
                .then(()=>{
                  this.$refs.blocks[block_Idx+1].assembleBlockProxy()
                  .then(()=>{
                    return api.post(api_url, {
                      resultBlock_id: block._id,
                      donorBlock_id: blockAfter._id
                    })
                    .then(()=>{
                      this.doJoinBlocks.show = false;
                      this.doJoinBlocks.block = {};
                      this.doJoinBlocks.block_Idx = false;
                      return Promise.resolve();
                    })
                    .catch((err)=>{
                      this.doJoinBlocks.show = false;
                      this.doJoinBlocks.block = {};
                      this.doJoinBlocks.block_Idx = false;
                      return Promise.reject(err);
                    })
                  })
                })
              }
            })
          } break;
        };

    },
//     setBlockOrderChanged(val) {
//       this.blockOrderChanged = val;
//       let self = this;
//       setTimeout(function() {
//         self.blockOrderChanged = !val;
//       }, 1000);
//     },
//     refreshBlocksProperties(par_index) {
//       let ids = [];
//       this.parlist[par_index].forEach(b => {
//         ids.push(b._id);
//       });
//       this.$children.forEach(c => {
//         if (c.block && ids.indexOf(c.block._id) !== -1) {
//           this.refreshBlockProperties(c);
//         }
//       });
//     },
//     refreshBlockProperties(el) {
//       el.updateFlagStatus(el.block._id);
//     },
//     onBlockNumberChange(block, par_index) {
//       let self = this;
//       Vue.nextTick(function() {
//         self.refreshBlocksProperties(par_index);
//         self.initEditors(block, par_index);
//       });
//       this.setBlockOrderChanged(true);
//     },
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
      this.$root.$on('book-reimported', ()=>{

        console.log("$on('book-reimported')");

        Vue.set(this, 'parlist', new Array());
        this.getBlocks();

      });
      this.$root.$on('for-bookedit:scroll-to-block', (id)=>{
        this.scrollToBlock(id);
      })
  },

  beforeDestroy:  function() {
    window.removeEventListener('keydown', this.eventKeyDown);
  },
  watch: {
//     'meta._id': {
//       handler() {
//         this.page = 0;
//         this.parlistSkip = 0;
//         this.getBlocks();
//       }
//     },
    'allBooks': {
      handler() {
        this.setBlockWatch();
      }
    },
    '$route' (toRoute, fromRoute) {
      //console.log('$route', toRoute);
      if (this.$route.params.hasOwnProperty('block') && this.$route.params.block) {
        this.getBloksUntil(this.$route.params.block);
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
