<template>
<div v-on:wheel="debounceScrollContent" ref="contentScrollWrapRef"
  :class="['container-fluid content-scroll-wrapper ilm-global-style', metaStyles]">

  <!--<div class="content-scroll" ref="contentScrollRef" v-bind:style="{ top: scrollTop + 'px' }" >-->

    <div v-show="upScreenTop"
    class="infinite-loading-container -up"
    v-bind:style="{ top: upScreenTop + 'px' }"><!--&& isBlocked && blockers.indexOf('loadBookUp') >-1"-->
      <div><i class="loading-default"></i></div>
    </div>

    <!--<template v-for="(sublist, page_Idx) in parlist">-->
    <div class="row content-scroll-item"
      v-for="blockId in Array.from(parlistC.keys())"
      v-bind:style="{ 'top': screenTop + 'px' }"
      v-bind:id="'s-'+ parlistC.get(blockId)._id"
      v-bind:key="blockId">
      <div class='col'><!--v-if="block.isVisible"-->
        <BookBlockView ref="blocks"
            :block="parlist.get(blockId)"
            :blockId = "blockId"
            :putBlock ="putBlockProxy"
            :getBlock ="getBlockProxy"
            :putBlockPart ="putBlockPartProxy"
            :reCount  ="reCountProxy"
            :recorder ="recorder"
            :blockReindexProcess="blockReindexProcess"
            :getBloksUntil="getBloksUntil"
            :allowSetStart="allowSetStart"
            :allowSetEnd="allowSetEnd"
            :_recountApprovedInRange="_recountApprovedInRange"
            :prevId="getPrevId(blockId)"
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
    <!--<div class="row"--> <!--v-show="hasScrollDown"-->
    <div v-show="downScreenTop"
      class="infinite-loading-container -down"
      v-bind:style="{ top: downScreenTop + 'px' }"><!--&& isBlocked && blockers.indexOf('loadBookDown') >-1"-->
      <div><i class="loading-default"></i></div>
    </div>
    <!--<div v-else class="infinite-loading-container -down">
      <div>End of book</div>
    </div>-->
    <!--<infinite-loading ref="scrollBookDown" v-if="scrolledDown"></infinite-loading>-->
  <!--</div>-->
  <!--<div class="content-scroll"-->
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

    <!--<infinite-loading v-if="autoload" @infinite="onScrollBookDown" ref="scrollBookDown"></infinite-loading>-->

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
import _ from 'lodash';

//import IlmCss from './css/ilm'

export default {
  data () {
    return {
      page: 0,
      //parlist: new Map(),
      //autoload: true,
      recorder: false,
      blockOrderChanged: false,
      //isAllLoaded: false,
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
      },
      blockReindexProcess: false,

      startId: false,

      upScreenTop: -85,
      downScreenTop: 0,
      screenTop: 0,

      lazyLoaderDir: 'up',
      isNeedUp: true,
      isNeedDown: true,

    }
  },
  computed: {
      // --- From store --- //
      ...mapGetters({
          book: 'currentBook',
          meta: 'currentBookMeta',
          watchBlk: 'contentDBWatch',
          allBooks: 'allBooks',
          tc_tasksByBlock: 'tc_tasksByBlock',
          isBlocked: 'isBlocked',
          blockers: 'blockers',
          parlist: 'storeList',
          blockSelection: 'blockSelection'
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

      parlistC: function() {
        let result = new Map();
        if (this.startId && this.parlist.has(this.startId)) {
          let seqId = this.startId;
          for (var i=0; i<=9; i++) {
            if (this.parlist.get(seqId)) {
              result.set(seqId, this.parlist.get(seqId));
              seqId = this.parlist.get(seqId).chainid;
            }
          }
        }
        //console.log('parlistC result', Array.from(result.keys()));
        return result;
      }
  },
  mixins: [access, taskControls, api_config],
  components: {
      BookBlockView, InfiniteLoading,
      modal,
  },
  methods: {
    ...mapActions(['loadBook', 'loadBlocks', 'loadBlocksChainUp', 'loadBlocksChain', 'searchBlocksChain', 'watchBlocks', 'putBlock', 'getBlock', 'putBlockPart', 'getBlockByChainId', 'setMetaData', 'freeze', 'unfreeze', 'tc_loadBookTask', 'addBlockLock', 'clearBlockLock', 'setBlockSelection']),

    test() {
        window.scrollTo(0, document.body.scrollHeight-500);
    },

    refreshTmpl() {
      // a hack to update template
      //Vue.set(this, 'screenTop', this.screenTop + 0.1);
      let startId = this.startId;
      this.startId = false;
      this.startId = startId;
    },

    loadBookMeta() {
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.freeze('loadBookMeta');
        console.log('loadBookMeta', this.$route.params.bookid);
        return this.loadBook(this.$route.params.bookid)
        .then(()=>{
          this.unfreeze('loadBookMeta');
        }).catch((err)=>{
          this.unfreeze('loadBookMeta');
        });
      } else return Promise.reject();
    },

    lazyLoad(firstId = false, lastId = false)
    {
      //console.log('lazyLoad');
      //console.log('parlist', Array.from(this.parlist.keys()));
      //console.log('lazyLoaderDir1', firstId, lastId);

      this.isNeedUp = firstId || this.isNeedUp;
      this.isNeedDown = lastId || this.isNeedDown;

      //console.log('lazyLoaderDir2', this.lazyLoaderDir, this.isNeedUp, this.isNeedDown);

      if (!this.isBlocked && (this.isNeedUp || this.isNeedDown)) {
        switch(this.lazyLoaderDir) {
          case 'down' : {
            if (this.isNeedDown)
            {
              lastId = this.isNeedDown;
              this.getBlocks(lastId, 1)
              .then((result)=>{
                if (this.isNeedUp) this.lazyLoaderDir = 'up';
                if (this.isNeedDown) this.isNeedDown = this.parlist.get(result.blockId).chainid;
                this.lazyLoad();
              }).catch(()=>{
                if (this.isNeedUp) this.lazyLoaderDir = 'up';
                this.isNeedDown = false;
                this.lazyLoad();
              })
            } else {
              if (this.isNeedUp) this.lazyLoaderDir = 'up';
              this.lazyLoad();
            }

          } break;
          case 'up' : {
            if (this.isNeedUp)
            {
              //let startId = this.parlist[0]._id;
              firstId = this.isNeedUp;
              if (this.isNeedUp === true) firstId = this.startId;

              this.getBlocksUp(firstId, 1)
              .then((result)=>{
                if (this.isNeedDown) this.lazyLoaderDir = 'down';
                if (this.isNeedUp) this.isNeedUp = result.blockId;
                this.lazyLoad();
              }).catch(()=>{
                if (this.isNeedDown) this.lazyLoaderDir = 'down';
                this.isNeedUp = false;
                this.lazyLoad();
              })
            } else {
              if (this.isNeedDown) this.lazyLoaderDir = 'down';
              this.lazyLoad();
            }
          } break;
        };

        //this.lazyLoad();
      };
    },

    loadBookDown(checkRoute = false, startId = false, onPage = 10) {

      //this.freeze('loadBookDown');

      if (checkRoute && this.$route.params.hasOwnProperty('block') && this.$route.params.block) {
          let routeBlockId = this.$route.params.block;

          if (routeBlockId !== 'unresolved' && this.parlist.has(routeBlockId)) {
            this.startId = routeBlockId;
            this.screenTop = 0;
            this.lazyLoad();
            return Promise.resolve(routeBlockId);
            //this.lazyLoad(false, lastId);
          }

          this.freeze('loadBookDown');
          return this.getBloksUntil(routeBlockId, this.$route.params.task_type)
            .then(blockId=>{
            if (routeBlockId == 'unresolved') {
              this.$router.push({name: this.$route.name, params:  {}});
            }
            this.unfreeze('loadBookDown');
            this.startId = blockId;
            this.lazyLoad();
            return Promise.resolve(blockId);
          }).catch(err=>{
            console.log('loadBookDown->getBloksUntil Error:', err);
            this.unfreeze('loadBookDown'); return err;
          });

      } else {
        startId = startId || this.meta.startBlock_id;
        this.freeze('loadBookDown');
        return this.getBlocks(startId, onPage)
        .then(res=>{
          if (this.startId === false) {
            this.startId = startId; // first load
          }
          this.unfreeze('loadBookDown');
          let lastId = res.rows[res.rows.length-1]._id;
          this.lazyLoad(false, lastId);
          return Promise.resolve(res);
        }).catch(err=>{
          this.unfreeze('loadBookDown'); return err;
        });
      }
    },

    loadBookUp(startId = false) {
      if (this.parlist.size > 0) {
        //startId = startId || this.parlist[0]._id;
        this.freeze('loadBookUp');
        return this.getBlocksUp(startId, 5)
        .then(res=>{
          this.unfreeze('loadBookUp');
          this.lazyLoad(startId);
          return Promise.resolve(startId);
        }).catch(err=>{
          this.unfreeze('loadBookUp');
          return Promise.reject();
        });
      } else return Promise.reject();
    },

    getBlocksUp(startId, onPage = 5) {
      //console.log('getBlocksUp', startId, onPage, this.meta._id);
      return this.loadBlocksChainUp({
        book_id: this.meta._id,
        startId: startId,
        onpage: onPage
      })
      .then((result)=>{
        if (result.rows.length > 0) {
          //console.log('getBlocksUp', result);
          result.rows.forEach((el, idx, arr)=>{
            let newBlock = new BookBlock(el);
            //this.parlist.set(newBlock._id, newBlock);
            this.$store.commit('set_storeList', newBlock);
          });
        }
        result.blockId = result.rows[0]._id
        return Promise.resolve(result);
      })
      .catch((err)=>{
        console.log('BlocksUp Error: ', err.message);
        return Promise.reject(err);
      });
    },

    getBlocks(startId, onPage = 10) {
      //console.log('getBlocks->meta', startId, this.meta);
      return this.loadBlocksChain({
        book_id: this.meta._id,
        startId: startId,
        onpage: onPage
      })
      .then((result)=>{
        if (result.rows.length > 0) {
          result.rows.forEach((el, idx, arr)=>{
            let newBlock = new BookBlock(el);
            //this.parlist.push(newBlock);
            //this.parlist.set(newBlock._id, newBlock);
            this.$store.commit('set_storeList', newBlock);
          });
        } else this.hasScrollDown = false;
        result.blockId = result.rows[result.rows.length-1]._id;
        return Promise.resolve(result);
      })
      .catch((err)=>{
        console.log('BlocksDown Error: ', err.message);
        this.hasScrollDown = false;
        return Promise.reject(err);
      });
    },

    getBloksUntil (startId, task_type = null)
    {
      //console.log('getBloksUntil', startId, task_type);
      //console.log('this.tc_tasksByBlock', this.tc_tasksByBlock);

      return new Promise((resolve, reject)=>{

        if (task_type && task_type !== 'text-cleanup' && task_type !== 'master-audio') {
          if (!Object.keys(this.tc_tasksByBlock).length) {
            return reject();
          }
        }

        if (task_type === 'true') {
          task_type = true;
        }
        if (!task_type && !this._is('editor')) {
          task_type = true;
        }

        let found = false;
        let crossId = (startId === 'unresolved') ? this.startId : this.meta.startBlock_id;

        switch(startId) {
          case 'unresolved': {
          if (this.parlist.size > 0) {
            for (var idx=1; idx < this.parlist.size; idx++)
            {
              let block = this.parlist.get(crossId);
              if (!block) break;
              crossId = block.chainid;
              if (this.tc_hasTask('metadata_cleanup') || this.tc_hasTask('audio_mastering'))
              {
                if (!found && !block.markedAsDone && (!block.status || !block.status.proofed))
                {
                  found = block._id;
                }
              } else {
                let task = this.tc_getBlockTask(block._id);
                if (task && (task_type === true || task.type === task_type))
                {
                  found = block._id;
                }
              }
              if (found) break;
            };
          };

          } break;
          default : {
            if (this.parlist.has(startId)) found = startId;
          } break;
        }

        if (found) {
          return resolve(found);
        } else
        { // if there is no such blocks already in parlist

          if (task_type === 'true') {
            task_type = true;
          }
          if (!task_type && !this._is('editor')) {
            task_type = true;
          }

          switch(startId) {
            case 'unresolved': {
              this.loadBlocksChain({
                book_id: this.meta._id,
                startId: this.startId || this.meta.startBlock_id,
                search: {block_type: 'unresolved',  task_type: task_type}
              }).then((result)=>{
                if (result.rows.length > 0)
                {
                  result.rows.forEach((el, idx, arr)=>{
                    let newBlock = new BookBlock(el);
                    //this.parlist.set(newBlock._id, newBlock);
                    this.$store.commit('set_storeList', newBlock);
                  });
                }

                this.getBlocks(result.blockId)
                .then((res)=>{
                  let lastId = res.rows[res.rows.length-1]._id;
                  this.lazyLoad(this.startId || this.meta.startBlock_id, lastId);
                  return resolve(result.blockId);
                }).catch(err=>{
                  return reject(err);
                });

              }).catch(err=>{
                return reject(err);
              });
            } break;
            default : {
              this.getBlocks(startId)
              .then((res)=>{
                return resolve(startId);
              }).catch((err)=>{
                return reject(err);
              });
            } break;
          }
        }
      });
    },

    refreshBlock (change) {
      console.log('refreshBlock', change);
      //console.log('this.$refs.blocks', this.$refs.blocks);
      //console.log('blockers', this.blockers);
        /*if (change.doc.audiosrc) {
          change.doc.audiosrc = process.env.ILM_API + change.doc.audiosrc;
        }*/

        /*if (change.doc.footnotes) change.doc.footnotes.forEach((f, fIdx)=>{
          if (f.audiosrc) {
            f.audiosrc = process.env.ILM_API + f.audiosrc +'?'+ (new Date()).toJSON();
          }*/
      let oldBlock = this.parlist.get(change.doc._id);
      let updField = change.updField || false;
      if (oldBlock) {
        if (change.deleted === true) {
          this.parlist.delete(change.doc._id);
          this.clearBlockLock({block: change.doc, force: true})
        } else {
          this.clearBlockLock({block: change.doc});
          if (oldBlock.partUpdate) {
            oldBlock._rev = change.doc._rev;
            //this.parlist.set(change.doc._id, new BookBlock(oldBlock));
            this.$store.commit('set_storeList', new BookBlock(oldBlock));
            this.refreshTmpl();
          } else if (updField) {
            //console.log('updField', updField, change.doc[updField], oldBlock[updField]);
            oldBlock[updField] = change.doc[updField];
            oldBlock._rev = change.doc._rev;
            //this.parlist.set(change.doc._id, new BookBlock(oldBlock));
            this.$store.commit('set_storeList', new BookBlock(oldBlock));
            this.refreshTmpl();
          } else {
            let newBlock = new BookBlock(change.doc);

            if (oldBlock.isChanged || oldBlock.isAudioChanged || oldBlock.isIllustrationChanged) {
              if (oldBlock.status && newBlock.status && oldBlock.status.assignee === newBlock.status.assignee) {
                oldBlock._rev = change.doc._rev;
                if (oldBlock.voicework != newBlock.voicework) {
                  oldBlock.voicework = newBlock.voicework;
                  oldBlock.audiosrc = newBlock.audiosrc;
                  oldBlock.audiosrc_ver = newBlock.audiosrc_ver;
                }
              } else {
                //ref.isChanged = false;
                //ref.isAudioChanged = false;
                //ref.isIllustrationChanged = false;
                //this.parlist.set(change.doc._id, newBlock);
                this.$store.commit('set_storeList', newBlock);
              }
            } else {
              //this.parlist.set(change.doc._id, new BookBlock(change.doc));
              this.$store.commit('set_storeList', new BookBlock(change.doc));
              this.refreshTmpl();
            }
          }
        }
      }
      if (this.$refs.blocks) this.$refs.blocks.forEach(($ref)=>{
        $ref.addContentListeners();
      })
      this.initRecorder();
      this.reCountProxy();
      this._recountApprovedInRange();
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
      let oldBlock = this.parlist.get(block_id);
      return this.getBlock(block_id)
      .then((res)=>{
        //this.parlist.set(res._id, new BookBlock(res));
        if (oldBlock) {
          res.checked = oldBlock.checked;
        }
        this.$store.commit('set_storeList', new BookBlock(res));
        this.$root.$emit('from-block-edit:set-style');
        this.refreshTmpl();
        return Promise.resolve(res);
      })
      .catch((err)=>{
        console.log(err);
      })
    },

    reCountProxy: function () {
      this.parCounter = { pref: 0, prefCnt: 0, curr: 1 };
      let crossId = this.meta.startBlock_id;//this.startId;
      for (var idx=0; idx < this.parlist.size; idx++) {
        let block = this.parlist.get(crossId);
        if (block) {
          block.parnum = setBlockParnum(block, this.parCounter);
          crossId = block.chainid;
        } else break;
      }
      //this.parlist.forEach((block, idx, arr)=>{
      //  block.parnum = setBlockParnum(block, this.parCounter);
      //})
    },

    allowSetStart: function(block_id) {
      if (!this.blockSelection.end._id || block_id == this.blockSelection.end._id) {
        return true;
      }
      let crossId = block_id;
      for (var idx=0; idx < this.parlist.size; idx++) {
        let block = this.parlist.get(crossId);
        if (block) {
          if (block._id == this.blockSelection.end._id) {
            return true;
          }
          crossId = block.chainid;
        } else break;
      }
      return false;
    },

    allowSetEnd: function(block_id) {
      if (!this.blockSelection.start._id || block_id == this.blockSelection.start._id) {
        return true;
      }
      let crossId = block_id;
      for (var idx=0; idx < this.parlist.size; idx++) {
        let block = this.parlist.get(crossId);
        if (block) {
          if (block._id == this.blockSelection.start._id) {
            return false;
          }
          crossId = block.chainid;
        } else break;
      }
      return true;
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

    findNextBlock(block, task) {
      let next = false;
      let curr = Object.assign({}, block);
      do {
        curr = this.parlist.get(curr.chainid);
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
      this.freeze('insertBlockBefore');
      let newBlock = this.createEmptyBlock(block.bookid, block._id);
      let api_url = this.API_URL + 'book/block';
      let api = this.$store.state.auth.getHttp();
      api.post(api_url, {
        block_id: block._id,
        direction: 'before',
        block: newBlock
      })
        .then((response)=>{
          let b_new = response.data.new_block;
          let b_old = response.data.block;
          //this.parlist.set(newBlock._id, newBlock);
          this.$store.commit('set_storeList', newBlock);
          this.refreshBlock({doc: b_new, deleted: false});
          if (b_old) {
            this.refreshBlock({doc: b_old, deleted: false});
          }
          this.unfreeze('insertBlockBefore');
          this.refreshTmpl();
        })
        .catch(err => {
          this.unfreeze('insertBlockBefore');
          return err;
        });
    },

    insertBlockAfter(block, block_Idx) {
      //this.insertBlock(block_id, 'after');
      this.freeze('insertBlockAfter');
      let newBlock = this.createEmptyBlock(block.bookid, block.chainid);
      let api_url = this.API_URL + 'book/block';
      let api = this.$store.state.auth.getHttp();
      api.post(api_url, {
        block_id: block._id,
        direction: 'after',
        block: newBlock
      })
        .then((response)=>{
          let b_new = response.data.new_block;
          let b_old = response.data.block;
          //this.parlist.set(newBlock._id, newBlock);
          this.$store.commit('set_storeList', newBlock);
          this.refreshBlock({doc: b_new, deleted: false});
          this.refreshBlock({doc: b_old, deleted: false});
          this.unfreeze('insertBlockAfter');
          this.refreshTmpl();
        })
        .catch(err => {
          this.unfreeze('insertBlockAfter');
          return err;
        });
    },
    blockUpdated(blockid) {
      if (this._is('editor', true) && !this.tc_hasTask('content_cleanup') && !this.tc_hasTask('audio_mastering') && !this.tc_getBlockTask(blockid)) {
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
      //console.log('deleteBlock', block._id);
      this.freeze('deleteBlock');
//       this.getBlockByChainId(block._id)
//       .then((blockBefore)=>{



//           if (blockBefore) {
//             blockBefore.chainid = block.chainid;
//             this.freeze('putBlockPart');
//             this.putBlockPart({
//               block: new BookBlock(blockBefore),
//               field: 'chainid'
//             }).then((response)=>{
//               //this.blockReindexProcess = false
//               this.unfreeze('putBlockPart');
//             }).catch((err)=>{
//               this.unfreeze('putBlockPart');
//               return err;
//             })
//           } else {
//             this.startId = block.chainid;
//             this.setMetaData({ key: 'startBlock_id', value: block.chainid})
//             .then((response)=>{
//               //this.blockReindexProcess = false
//             });
//           }


          let api_url = this.API_URL + 'book/block/' + block._id;
          let api = this.$store.state.auth.getHttp();
          api.delete(api_url, {})
          .then((response)=>{
            //console.log('api response', response);
            if (this.startId == block._id) {
              this.startId = block.chainid;
            }
            this.parlist.delete(block._id);
            this.unfreeze('deleteBlock');
            this.refreshTmpl();
          })
          .catch(err => {
            this.unfreeze('deleteBlock');
            return err;
          });
//       })
//       .catch((err)=>{
//         this.unfreeze('deleteBlock');
//         console.log('deleteBlock Err', err);
//         return err;
//       })
    },
    joinBlocks(block, block_Idx, direction) {
      let api_url = this.API_URL + 'book/block_join/';
      let api = this.$store.state.auth.getHttp();

      block = block || this.doJoinBlocks.block;
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
              if (!this.parlist.has(blockBefore._id)) {
                this.unableJoinMessage = true;
                return Promise.reject('type');
              }

              if (!this.doJoinBlocks.show
                  && (this.parlist.get(block._id).isChanged || this.parlist.get(blockBefore._id).isChanged))
              {
                // save current block reference
                // and show confirmation pop-up to save changes
                this.doJoinBlocks.block = block;
                this.doJoinBlocks.direction = direction;
                this.doJoinBlocks.show = true;
              }
              else
              {
                this.doJoinBlocks.block = {};
                let currBlockRef = this.$refs.blocks.find((blockRef)=>{
                  return blockRef.blockId == block._id;
                });
                let prevBlockRef = this.$refs.blocks.find((blockRef)=>{
                  return blockRef.blockId == blockBefore._id;
                });
                if (currBlockRef && prevBlockRef) {
                  this.addBlockLock({block: blockBefore, watch: ['realigned']})
                  this.freeze('joinBlocks');
                  currBlockRef.assembleBlockProxy()
                  .then(()=>{
                    prevBlockRef.assembleBlockProxy()
                    .then(()=>{
                      this.doJoinBlocks.show = false;
                      this.doJoinBlocks.block = {};
                      return api.post(api_url, {
                        resultBlock_id: blockBefore._id,
                        donorBlock_id: block._id
                      })
                      .then((response)=>{
                        this.clearBlockLock({block: blockBefore, force: true});
                        if (response.data.ok && response.data.blocks) {
                          response.data.blocks.forEach((res)=>{
                            this.refreshBlock({doc: res, deleted: res.deleted});
                          });
                        }
                        this.unfreeze('joinBlocks');
                        return Promise.resolve();
                      })
                      .catch((err)=>{
                        this.clearBlockLock({block: blockBefore, force: true});
                        this.unfreeze('joinBlocks');
                        return Promise.reject(err);
                      })
                    })
                  })
                }
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
              if (!this.parlist.has(block.chainid)) {
                this.unableJoinMessage = true;
                return Promise.reject('type');
              }
              if (!this.doJoinBlocks.show
              && (this.parlist.get(block._id).isChanged || this.parlist.get(block.chainid).isChanged))
              {
                this.doJoinBlocks.block = block;
                this.doJoinBlocks.direction = direction;
                this.doJoinBlocks.show = true;

              }
              else
              {
                this.doJoinBlocks.block = {};
                let currBlockRef = this.$refs.blocks.find((blockRef)=>{
                  return blockRef.blockId == block._id;
                });
                let nextBlockRef = this.$refs.blocks.find((blockRef)=>{
                  return blockRef.blockId == block.chainid;
                });
                if (currBlockRef && nextBlockRef) {
                  this.freeze('joinBlocks');
                  this.addBlockLock({block: block, watch: ['realigned']})
                  currBlockRef.assembleBlockProxy()
                  .then(()=>{
                    nextBlockRef.assembleBlockProxy()
                    .then(()=>{
                      this.doJoinBlocks.show = false;
                      this.doJoinBlocks.block = {};
                      return api.post(api_url, {
                        resultBlock_id: block._id,
                        donorBlock_id: blockAfter._id
                      })
                      .then((response)=>{
                        this.clearBlockLock({block: block, force: true});
                        if (response.data.ok && response.data.blocks) {
                          response.data.blocks.forEach((res)=>{
                            this.refreshBlock({doc: res, deleted: res.deleted});
                          });
                        }
                        this.unfreeze('joinBlocks');
                        return Promise.resolve();
                      })
                      .catch((err)=>{
                        this.clearBlockLock({block: block, force: true});
                        this.unfreeze('joinBlocks');
                        return Promise.reject(err);
                      })
                    })
                  })
                }
              }
             })
          } break;
        };
    },

    setRangeSelection(block, type, status, shift = false) {
      //console.log('setRangeSelection', block, type, status, shift);
      let newSelection = Object.assign({}, this.blockSelection);
      switch (type) {
        case 'start':
          if (status) {
            if (!this.selectionEnd || !this.selectionEnd._id || this.selectionEnd.index >= block.index) {
              this.selectionStart = block;
              this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
            }
            this.parlist.forEach((pBlock)=>{
              pBlock.checkedStart = false;
            });
            //$('.set-range-start').prop('checked', false);
            this.parlist.get(this.selectionStart._id).checkedStart = true;
            //$('#' + this.selectionStart._id + ' .set-range-start').prop('checked', true);
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
              //$('.set-range-end').prop('checked', false);
              this.parlist.forEach((pBlock)=>{
                pBlock.checkedEnd = false;
              });
              //$('#' + this.selectionEnd._id + ' .set-range-end').prop('checked', true);
              this.parlist.get(this.selectionEnd._id).checkedEnd = true;
            } else {
              this.selectionEnd = {};
              this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
            }
          break;
        case 'byOne':
          //console.log('byOne', status, block._id, 'start:', this.selectionStart._id, 'end:', this.selectionEnd._id);
          if (status) { // check
            if (this.blockSelection.start._id) {

              this.setUnCheckedRange();

//               if (!status && this.selectionStart._id == this.selectionEnd._id) { // uncheck
//                 block.checked = false;
//                 this.selectionStart = {};
//                 this.selectionEnd = {};
//                 this.$root.$emit('from-bookedit:set-selection', {}, {});
//                 break;
//               }

              if (shift) {
                let pBlock, currId = block._id, isFound = false;
                while (pBlock = this.findPrevBlock(currId)) {
                  if (pBlock._id === this.blockSelection.start._id) {
                    newSelection.end = block;
                    isFound = true;
                    break;
                  }
                  currId = pBlock._id;
                }

                if (!isFound) {
                  // selected blocks are not found before, so they are after
                  if (!this.blockSelection.end._id) newSelection.end = this.blockSelection.start;
                  newSelection.end = block;
                }

                this.setCheckedRange(newSelection.start._id, newSelection.end._id);

              } else {
                block.checked = true;
                newSelection.start = block;
                newSelection.end = block;
              }

              //this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);

            } else  {
              this.setUnCheckedRange();
              block.checked = true;
              newSelection.start = block;
              newSelection.end = block;
              //this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
            }
            //this.selectionStart = newSelection.start;
            //this.selectionEnd = newSelection.end;
            this.setBlockSelection(newSelection)
            //this.$root.$emit('from-bookedit:set-selection', newSelection.start, newSelection.end);
          } else { // uncheck
            if (this.blockSelection.start._id && this.blockSelection.end._id) {
              if (this.blockSelection.start._id == block._id && block._id == this.blockSelection.end._id) {
                this.setBlockSelection({start: {}, end: {}});
              } else if (block._id == this.blockSelection.start._id) {
                this.setBlockSelection({start: this.parlist.get(block.chainid), end: this.blockSelection.end});
              } else if (block._id == this.selectionEnd._id) {
                this.setBlockSelection({start: this.blockSelection.start, end: this.findPrevBlock(block._id)});
              } else {

//                 let pBlock, beforeCount = 0, afterCount = 0;
//                 let currId = block._id;
//                 while (pBlock = this.findPrevBlock(currId)) {
//                   if (pBlock._id === this.selectionStart._id) {
//                     beforeCount++;
//                     break;
//                   }
//                   currId = pBlock._id;
//                 }
//                 currId = block.chainid
//                 while (pBlock = this.parlist.get(currId)) {
//                   if (pBlock._id === this.selectionEnd._id) {
//                     afterCount++;
//                     break;
//                   }
//                   currId = pBlock.chainid;
//                 }
//
//                 if (afterCount > beforeCount) {
//                   this.selectionStart = block.chainid;
//                 } else {
                  this.setBlockSelection({start: this.blockSelection.start, end: this.findPrevBlock(block._id)});
//                 }
              }
              this.setUnCheckedRange();
              this.setCheckedRange(this.blockSelection.start._id, this.blockSelection.end._id);
              //this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);

            } else {
              //this.$root.$emit('from-bookedit:set-selection', {}, {});
              this.setBlockSelection({start: {}, end: {}})
            }
          }
          break;
      }
      this._recountApprovedInRange();
    },
    _recountApprovedInRange() {
      let approved = 0;
      let approved_tts = 0;
      if (this.blockSelection.start._id && this.blockSelection.end._id && this.tc_hasTask('content_cleanup')) {
        let crossId = this.blockSelection.start._id;
        for (var idx=0; idx < this.parlist.size; idx++) {
          let block = this.parlist.get(crossId);
          if (block) {
            if (block.markedAsDone) {
              switch (block.voicework) {
                case 'audio_file' :
                  ++approved;
                  break;
                case 'tts':
                  ++approved_tts;
                  break;
              }
            }
            if (block._id == this.blockSelection.end._id) {
              break;
            }
            crossId = block.chainid;
          } else break;
        }
      }
      this.$store.commit('SET_CURRENTBOOK_COUNTER', {name: 'approved_audio_in_range', value: approved});
      this.$store.commit('SET_CURRENTBOOK_COUNTER', {name: 'approved_tts_in_range', value: approved_tts});
    },
    findPrevBlock(blockId) {
      let found, BreakException = {}; // a trick to stop forEach
      try {
        this.parlist.forEach((block, _id)=>{
          if (block.chainid === blockId) {
            found = block;
            throw BreakException;
          }
        });
      } catch (e) {
        if (e !== BreakException) throw e;
        else return found;
      }
      return false;
    },
    setCheckedRange(startId, endId) {
      if (this.parlist.has(startId)) {
        let pBlock, currId = startId;
        do {
          pBlock = this.parlist.get(currId);
          if (pBlock) {
            pBlock.checked = true;
            currId = pBlock.chainid;
          }
        } while (pBlock && pBlock._id !== endId);
      }
    },
    setUnCheckedRange(startId = false) {
      this.parlist.forEach((pBlock)=>{
        pBlock.checked = false;
      });
    },
    setBlockWatch() {
      //console.log('!!! setBlockWatch');
      setTimeout(()=>{
        this.watchBlocks({book_id: this.meta._id})
        .then(()=>{
          this.watchBlk.on('change', (change) => {
              this.$root.$emit('blockChange', change.doc);
              this.refreshBlock(change);
          });
        });
      }, 1000);
    },

    debounceScrollContent: _.throttle(function (ev) {
      this.scrollContent(ev);
    }, 30),

    scrollContent(ev)
    {
      //this.screenTop -= ((ev.deltaY!==false) ? (ev.deltaY > 0 ? 47 : -47) : 0);
      //if (true) return;

      let wrapHeight = this.$refs.contentScrollWrapRef.getBoundingClientRect().height;

      //console.log('currTop', currTop, 'dataHeight', dataHeight);
      //console.log('ev.deltaY', ev.deltaY);
      //console.log('ev', ev);
      if (ev.deltaY !== false) ev.preventDefault();

      if (ev.deltaY < 0 && this.blockers.indexOf('loadBookUp') >-1) return;
      if (ev.deltaY > 0 && this.blockers.indexOf('loadBookDown') >-1) return;

      let step = (ev.deltaY!==false) ? (ev.deltaY > 0 ? 47 : -47) : 0;

      if (this.parlistC.size > 0) {
        let firstId, lastId;
        this.parlistC.forEach((value, _id, map)=>{
          if (!firstId) firstId = _id;
          lastId = _id;
        });

        if (ev.deltaY < 0 && this.screenTop >= 0 && firstId == this.meta.startBlock_id)
        { // if this is a very first block
          this.screenTop = 0;
          return;
        }

        let firstHeight;
        try {
          firstHeight = document.getElementById('s-'+firstId).getBoundingClientRect().height;
        } catch (err) {
          this.screenTop -= step;
          return;
        }

        this.screenTop -= step;

        this.upScreenTop = false;
        if (ev.deltaY < 0 && (this.screenTop > 10))
        { // first block moved down -> try to show previous
          let prevBlockId = false;
          this.parlist.forEach((block, _id)=>{
            if (block.chainid == firstId) {
              prevBlockId = block._id;
              return;
            }
          });
          if (prevBlockId) { // already loaded
            this.startId = prevBlockId;
            this.$refs.blocks.forEach(($ref)=>{
              $ref.addContentListeners();
            })
            Vue.nextTick(()=>{
              let prevHeight = document.getElementById('s-'+this.startId).getBoundingClientRect().height;
              if (prevHeight) {
                this.screenTop = this.screenTop - prevHeight;
              };
            });
          } else {
            this.upScreenTop = 1;
            this.loadBookUp(firstId)
            .then(()=>{
              this.parlist.forEach((block, _id)=>{
                if (block.chainid == firstId) {
                  prevBlockId = block._id;
                  return;
                }
              });
              this.startId = prevBlockId;
              this.$refs.blocks.forEach(($ref)=>{
                $ref.addContentListeners();
              });
              if (this.blockSelection.start._id && this.blockSelection.end._id) {
                this.setCheckedRange(this.blockSelection.start._id, this.blockSelection.end._id);
              }
              Vue.nextTick(()=>{
                this.upScreenTop = false;
                let prevHeight = document.getElementById('s-'+this.startId).getBoundingClientRect().height;
                if (prevHeight) {
                  this.screenTop = this.screenTop - prevHeight;
                };
              });
            }).catch(err=>{
              //console.log('scroll Up Catch');
              this.screenTop = 0;
              this.upScreenTop = false;
              return err;
            });
          }
        }
        else if (ev.deltaY > 0 && (this.screenTop + firstHeight + 200) < 0) //ev.deltaY < 0
        { // scroll down
            if (this.parlistC.size <= 1) { // last block reached
              //this.downScreenTop = false;
              this.screenTop += step;
              return;
            }
            this.downScreenTop = 1;
            let nextBlockId = false;
            this.parlist.forEach((block, _id)=>{
              if (_id == this.parlistC.get(lastId).chainid) {
                nextBlockId = _id;
                return;
              }
            });
            if (nextBlockId) { // already loaded
              this.startId = this.parlistC.get(firstId).chainid;
              this.$refs.blocks.forEach(($ref)=>{
                $ref.addContentListeners();
              })
              Vue.nextTick(()=>{
                this.screenTop = this.screenTop + firstHeight;
              });
            } else {
              this.loadBookDown(false, this.parlistC.get(lastId).chainid, 5)
              .then(()=>{
                this.startId = this.parlistC.get(firstId).chainid;
                  this.$refs.blocks.forEach(($ref)=>{
                  $ref.addContentListeners();
                })
                if (this.blockSelection.start._id && this.blockSelection.end._id) {
                  this.setCheckedRange(this.blockSelection.start._id, this.blockSelection.end._id);
                }
                Vue.nextTick(()=>{
                  this.screenTop = this.screenTop + firstHeight;
                });
              }).catch(err=>err);
            }
        }

      } else return;

        var editors = document.getElementsByClassName('medium-editor-toolbar-active');
        if (editors && editors.length) { //move editor toolbar
          editors[0].style.top = editors[0].getBoundingClientRect().top - step +'px';
        }
    },

    scrollToBlock(id, position = 'top') {
      this.screenTop = 0;
      this.startId = id;
    },
    getPrevId(id) {
      for (let val of this.parlist.values()) {
        if (val.chainid === id) {
          return val._id;
        }
      }
      return false;
    }

  },
  events: {
      currentEditingBlock_id : function (key) {
          //console.log("keydown: ", key)
      }
  },
  mounted: function() {
      //this.onScrollBookDown();
      console.log('book mounted', this.meta._id);

      //this.upScreenTop = -85;
      //this.downScreenTop = this.$refs.contentScrollWrapRef.getBoundingClientRect().height;

      if (this.meta._id) {
        this.loadBookDown(true)
        .then(()=>{
          this.setBlockWatch()
        });
      } else {
        /*setTimeout(()=>{*/
          this.loadBookMeta();
      }

      window.addEventListener('keydown', this.eventKeyDown);

      this.initRecorder();
      window.onscroll = function() {
        $('#narrateStartCountdown').css('top', document.scrollingElement.scrollTop + 'px');
        $('#narrateStartCountdown').css('height', '100%')
      }

      this.$root.$on('book-reimported', ()=>{
        //console.log("$on('book-reimported')", this.$refs.blocks);
//         this.$refs.blocks.forEach((block)=>{
//           block._id = null;
//         });
        this.setRangeSelection({}, 'start', false);
        this.setRangeSelection({}, 'end', false);

        this.$store.commit('clear_storeList');

        this.$router.push({name: this.$route.name, params: {}});
        this.loadBookMeta()
        .then(()=>{
          this.tc_loadBookTask()
          .then(()=>{
            this.startId = false;
            this.loadBookDown(false, false, 10)
            .then(()=>{
              this.setBlockWatch()
            });
          });
        })


      });

      this.$root.$on('for-bookedit:scroll-to-block', (id)=>{
        this.scrollToBlock(id);
      });

      this.$root.$on('bookBlocksUpdates', (data) => {
        //console.log('bookBlocksUpdates');
        //this._updateBlocksFromResponse(data);
        let updField = data.updField || false;
        if (Array.isArray(data.blocks)) data.blocks.forEach((res)=>{
          this.refreshBlock({doc: res, deleted: res.deleted || false, updField: updField});
        })
      });
  },

  beforeDestroy:  function() {
    window.removeEventListener('keydown', this.eventKeyDown);
    this.setRangeSelection({}, 'start', false);
    this.setRangeSelection({}, 'end', false);
    this.isNeedUp = false;
    this.isNeedDown = false;
    this.$root.$off('bookBlocksUpdates');
    this.$root.$off('for-bookedit:scroll-to-block');
    this.$root.$off('book-reimported');
    this.$root.$off('from-bookedit:set-selection');
  },
  watch: {
    'meta._id': {
      handler(newVal, oldVal) {
        console.log('watch meta._id', newVal, oldVal);
        if (newVal) {
          this.tc_loadBookTask()
          .then(()=>{
            this.loadBookDown(true)
            .then(()=>{
              this.setBlockWatch()
            });
          });
        }
      }
    },
    'allBooks': {
      handler() {
        this.setBlockWatch();
      }
    },
    '$route' (toRoute, fromRoute) {
      //console.log('$route', toRoute, fromRoute);
      if (this.$route.params.hasOwnProperty('block') && this.$route.params.block) {
        //this.getBloksUntil(this.$route.params.block, this.$route.params.task_type)
        this.loadBookDown(true)
        .then((blockId)=>{
          this.setBlockWatch()
        });
      }
    },
    'tc_tasksByBlock': {
      handler(val, oldVal) {
        if (Object.keys(val).length && !Object.keys(oldVal).length) {
          if (this.$route.params.hasOwnProperty('block') && this.$route.params.block && !this.parlist.length) {
            this.getBloksUntil(this.$route.params.block, this.$route.params.task_type);
          }
        } else {

        }
      }
    },
    'blockSelection': {
      handler(val) {
        if (!this.blockSelection.start._id && !this.blockSelection.end._id) {
          this.setUnCheckedRange();
        }
      },
      deep: true
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
      div.completed {
          background-color: inherit;
      }
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
    min-height: 205px;
    height: auto;
    margin-bottom: 0px;
    &.-mode-file {
        min-height: 183px;
    }
  }
  a.go-to-block {
    cursor: pointer;
  }

  .content-scroll-wrapper {
    height: 100%;
    position: relative;
/*     overflow: hidden; */
    overflow-y: hidden;
    overflow-x: auto;
    .content-scroll {
      position: relative;
      top: 0;
      width: 100%;
      margin-left: -30px;
      padding-left: 30px;
    }
    .content-scroll-item {
      position: relative;
      width: 100%;
    }
  }



  .infinite-loading-container {
    width: 100%;
    text-align: center;
    margin-left: -15px;
    margin-right: -15px;
    &.-up {
      position: absolute;
    }
    &.-down {
      position: relative;
    }
    [class^=loading-] {
      display: inline-block;
      margin: 0;/*15px */
      width: 28px;
      height: 28px;
      font-size: 28px;
      line-height: 28px;
      border-radius: 50%;
    }
  }

  .loading-default {
    position: relative;
    border: 1px solid #999;
    -webkit-animation: loading-rotating ease 1.5s infinite;
    animation: loading-rotating ease 1.5s infinite;

    // rotate animation
    @keyframes loading-rotating {
      0%{
        transform: rotate(0);
      }
      100%{
        transform: rotate(360deg);
      }
    }

    &:before {
      content: "";
      position: absolute;
      display: block;
      top: 0;
      left: 50%;
      margin-top: -3px;
      margin-left: -3px;
      width: 6px;
      height: 6px;
      background-color: #999;
      border-radius: 50%;
    }
  }


</style>
