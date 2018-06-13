<template>
<div class="content-scroll-wrapper" :class="[{'recording-background': recordingState == 'recording'}]" v-hotkey="keymap" ref="contentScrollWrapRef" v-on:scroll="handleScroll">
  <div v-on:wheel="throttleScrollContent"
    :class="['container-fluid ilm-global-style', metaStyles]">

    <!--<div class="content-scroll" ref="contentScrollRef" v-bind:style="{ top: scrollTop + 'px' }" >-->

      <div v-show="upScreenTop"
      class="infinite-loading-container -up"
      v-bind:style="{ top: upScreenTop + 'px' }"><!--&& isBlocked && blockers.indexOf('loadBookUp') >-1"-->
        <div><i class="loading-default"></i></div>
      </div>

      <!--<template v-for="(sublist, page_Idx) in parlist">-->
      <div class="row content-scroll-item" :class="[{'recording-block': recordingBlockId == blockId}]"
        v-for="blockId in Array.from(parlistC.keys())"
        v-bind:style="{ top: screenTop + 'px' }"
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
              :prevId="getPrevId(blockId)"
              :mode="mode"
              @stopRecordingAndNext="stopRecordingAndNext"
              @insertBefore="insertBlockBefore"
              @insertAfter="insertBlockAfter"
              @deleteBlock="deleteBlock"
              :joinBlocks="joinBlocks"
              @setRangeSelection="setRangeSelection"
              @blockUpdated="blockUpdated"
              @recordingState="setRecordingState"
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
  <!--<div class="container-fluid">   -->
  <div class="custom-scroll">
  <div class="vue-scrollbar__up"
    @click.prevent="()=>{return true;}"
    @touchstart="scrollByBarStart('up')"
    @mousedown="scrollByBarStart('up')"
    @touchend="scrollByBarEnd()"
    @mouseup="scrollByBarEnd()"
    @mouseout="scrollByBarEnd()">
    <i aria-hidden="true" class="fa fa-angle-up"></i>
  </div>
  <vue-scrollbar classes="" ref="scrollBarRef" :onChangePosition="scrollByBar" direction="vertical"
  :onEndDragEvent="endScrollDragging" :onScrollBarClick="scrollBarClick">
  <div class="scroll-me" ref="scrollBarWrapRef">
  <div v-for="(sBlockId, sBlockIdx) in scrollBarBlocks" :key="sBlockId" :id="'scroll-'+sBlockId" :data-id="sBlockId" ref="scrollBlocksRefs"
  :style="{height: scrollBarBlockHeight+'px'}"></div>
  <div class="clearfix"></div>
  </div>
  </vue-scrollbar>
  <div class="vue-scrollbar__down"
    @click.prevent="()=>{return true;}"
    @touchstart="scrollByBarStart('down')"
    @mousedown="scrollByBarStart('down')"
    @touchend="scrollByBarEnd()"
    @mouseup="scrollByBarEnd()"
    @mouseout="scrollByBarEnd()">
    <i aria-hidden="true" class="fa fa-angle-down"></i>
  </div>
  </div>
  <!--<div class="custom-scroll">-->
</div>
<!--<div class="content-scroll-wrapper">-->
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
import vueSlider from 'vue-slider-component';

import VueHotkey from 'v-hotkey';
Vue.use(VueHotkey);

import VueScrollbar from '../generic/vue2-scrollbar/vue-scrollbar';
require('../generic/vue2-scrollbar/vue2-scrollbar.css');

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

      scrollBarBlocks: [],
      scrollBarTop: 0,
      scrollBarBlockHeight: 100,
      scrollBarBlockTimer: null,

      lazyLoaderDir: 'up',
      isNeedUp: true,
      isNeedDown: true,
      recordingState: '',
      recordingBlockId: null

    }
  },
  props: ['mode'],
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
        return result;
      },
      keymap: function() {
        return {
          // 'esc+ctrl' is OK.
          'ctrl+home': (ev)=>{
            //console.log('ctrl+home');
            this.scrollToBlock(this.meta.startBlock_id);
          },
          'ctrl+end': (ev)=>{
            //console.log('ctrl+end')
            if (this.meta.endBlock_id) {
              this.scrollToBlock(this.meta.endBlock_id)
            }
              else
            {
              let currId, crossId = this.meta.startBlock_id || this.startId;
              if (crossId) for (var idx=0; idx < this.parlist.size; idx++) {
                let block = this.parlist.get(crossId);
                if (block) {
                  currId = crossId;
                  crossId = block.chainid;
                } else break;
              }
              if (currId) this.scrollToBlock(currId);
            }
          },
          'ctrl+up': (ev)=>{
            //console.log('ctrl+up arrow');
            let jumpStep = Math.floor(this.parlist.size * 0.1);
            let currId, crossId = this.startId;
            if (crossId) for (var idx=0; idx < jumpStep; idx++) {
              let block = this.findPrevBlock(crossId);
              if (block) {
                currId = block._id;
                crossId = block._id;
              } else break;
            }
            if (currId) this.scrollToBlock(currId);
          },
          'ctrl+down': (ev)=>{
            //console.log('ctrl+down arrow');
            let jumpStep = Math.floor(this.parlist.size * 0.1);
            let currId, crossId = this.startId;
            if (crossId) for (var idx=0; idx < jumpStep; idx++) {
              let block = this.parlist.get(crossId);
              if (block) {
                currId = crossId;
                crossId = block.chainid;
              } else break;
            }
            if (currId) this.scrollToBlock(currId);
          },
          'pgup': (ev)=>{
            //console.log('page up');
            ev.preventDefault();
            let pBlock = this.findPrevBlock(this.startId);
            if (pBlock) this.scrollToBlock(pBlock._id);
          },
          'pgdn': (ev)=>{
            //console.log('page down');
            ev.preventDefault();
            let nextId = this.parlist.get(this.startId).chainid;
            if (this.parlist.has(nextId)) this.scrollToBlock(nextId);
          },
//           'enter': {
//             keydown: ()=>{console.log('enter+keydown')},
//             keyup: ()=>{console.log('enter+keyup')}
//           }
        }
      }
  },
  mixins: [access, taskControls, api_config],
  components: {
      BookBlockView, InfiniteLoading,
      modal, vueSlider, VueScrollbar
  },
  methods: {
    ...mapActions(['loadBook', 'loadBlocks', 'loadBlocksChainUp', 'loadBlocksChain', 'searchBlocksChain', 'watchBlocks', 'putBlock', 'getBlock', 'putBlockPart', 'getBlockByChainId', 'setMetaData', 'freeze', 'unfreeze', 'tc_loadBookTask', 'addBlockLock', 'clearBlockLock', 'setBlockSelection', 'recountApprovedInRange']),

    test() {
        window.scrollTo(0, document.body.scrollHeight-500);
    },

    refreshTmpl() {
      // a hack to update template
      //Vue.set(this, 'screenTop', this.screenTop + 0.1);
      let startId = this.startId;
      this.startId = false;
      this.startId = startId;
      //this.$forceUpdate();
      this.updateScrollSlider();
    },

    loadBookMeta() {
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.freeze('loadBookMeta');
        //console.log('loadBookMeta', this.$route.params.bookid);
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
      //console.log('lazyLoad', this.isNeedUp, this.isNeedDown, this.lazyLoaderDir);
      //console.log('parlist', Array.from(this.parlist.keys()));
      //console.log('lazyLoaderDir1', firstId, lastId);

      this.isNeedUp = firstId || this.isNeedUp;
      this.isNeedDown = lastId || this.isNeedDown;

      //console.log('lazyLoader',this.isNeedUp, this.isNeedDown);

      if (!this.isBlocked && (this.isNeedUp || this.isNeedDown)) {
        switch(this.lazyLoaderDir) {
          case 'down' : {
            if (this.isNeedDown)
            {
              lastId = this.isNeedDown;
              if (this.isNeedDown === true) lastId = Array.from(this.parlistC.keys()).pop();
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
            this.updateScrollSlider(this.isNeedUp);
          });
        }
        result.blockId = result.rows[0]._id;
        this.reCountProxy();
        return Promise.resolve(result);
      })
      .catch((err)=>{
        console.log('BlocksUp Error: ', err.message);
        this.refreshTmpl();
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
            this.updateScrollSlider();
          });
        } else this.hasScrollDown = false;
        result.blockId = result.rows[result.rows.length-1]._id;
        this.reCountProxy();
        return Promise.resolve(result);
      })
      .catch((err)=>{
        console.log('BlocksDown Error: ', err.message);
        this.refreshTmpl();
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
            if (oldBlock.checked === true) {
              newBlock.checked = true;
            }
            if (oldBlock.isChanged || oldBlock.isAudioChanged || oldBlock.isIllustrationChanged) {
              if (oldBlock.status && newBlock.status && oldBlock.status.assignee === newBlock.status.assignee) {
                oldBlock._rev = change.doc._rev;
                if (oldBlock.voicework != newBlock.voicework) {
                  oldBlock.voicework = newBlock.voicework;
                  oldBlock.audiosrc = newBlock.audiosrc;
                  oldBlock.audiosrc_ver = newBlock.audiosrc_ver;
                }
                if (oldBlock.chainid !== newBlock.chainid) {// next block was removed
                  oldBlock.chainid = newBlock.chainid;
                }
                if (oldBlock.realigned !== newBlock.realigned) {
                  this.clearBlockLock({block: change.doc});
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
              this.$store.commit('set_storeList', newBlock);
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
      this.recountApprovedInRange();
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

    reCountProxy: function (numMask = false) {
      this.parCounter = { pref: 0, prefCnt: 0, curr: 1 };
      let crossId = (this.isNeedUp && this.isNeedUp!==true) ? this.isNeedUp : this.meta.startBlock_id;//this.startId;
      //console.log(numMask, this.meta.numeration);
      numMask = numMask || this.meta.numeration;
      for (var idx=0; idx < this.parlist.size; idx++) {
        let block = this.parlist.get(crossId);
        if (block) {
          block.parnum = setBlockParnum(block, this.parCounter, numMask);
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
        mimeType: 'audio/ogg',
        disableLogs: true
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
    setRecordingState(state, blockId) {
      this.recordingState = state;
      if (state == 'recording') {
        this.recordingBlockId = blockId;
        this.scrollToBlock(blockId);
      } else {
        this.recordingBlockId = null;
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
                  this.addBlockLock({block: blockBefore, watch: ['realigned'], type: 'join'})
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
                        this.updateScrollSlider();
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
                  this.addBlockLock({block: block, watch: ['realigned'], type: 'join'})
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
                        this.updateScrollSlider();
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
                  newSelection.start = block;
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
      //this.recountApprovedInRange();
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

    throttleScrollContent: _.throttle(function (ev) {
      this.scrollContent(ev);
    }, 30),

    scrollContent(ev, step = 50)
    {
      if (this.recordingState == 'recording') {
        return;
      }
      //this.screenTop -= ((ev.deltaY!==false) ? (ev.deltaY > 0 ? 47 : -47) : 0);
      //if (true) return;

      let wrapHeight = this.$refs.contentScrollWrapRef.getBoundingClientRect().height;

      //console.log('currTop', currTop, 'dataHeight', dataHeight);
      //console.log('ev.deltaY', ev.deltaY);
      //console.log('ev', ev);
      if (ev.deltaY !== false && ev.hasOwnProperty('preventDefault')) ev.preventDefault();

      if (ev.deltaY < 0 && this.blockers.indexOf('loadBookUp') >-1) return;
      if (ev.deltaY > 0 && this.blockers.indexOf('loadBookDown') >-1) return;

      step = (ev.deltaY!==false) ? (ev.deltaY > 0 ? step : -1*step) : 0;

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
              if (this.blockSelection.start._id && this.blockSelection.end._id) { // re-check blocks
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
                if (this.blockSelection.start._id && this.blockSelection.end._id)
                { // re-check blocks
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

    scrollToBlock(id, position = 'top')
    {
      if (this.parlist.has(id)) {
        this.screenTop = 0;
        this.startId = id;
      } else {
        this.loadBookDown(false, id)
        .then((blockId)=>{
          this.setBlockWatch();
          this.screenTop = 0;
          this.startId = id;
        });
      }
    },

    getPrevId(id) {
      for (let val of this.parlist.values()) {
        if (val.chainid === id) {
          return val._id;
        }
      }
      return false;
    },

    listenSetNum(bookId, numMask) {
      //console.log('listenSetNum', bookId, numMask);
      this.reCountProxy(numMask);
    },

    throttleScrollUpdate: _.throttle(function () {
      if (this.$refs.scrollBarRef) {
        this.$refs.scrollBarRef.calculateSize();
        this.scrollBarUpdatePosition(this.startId);
      }
    }, 400),

    updateScrollSlider(startId = false)
    {
      let resultArr = [];
      let crossId = startId || this.meta.startBlock_id;
      //console.log('startId', startId, 'crossId', crossId);
      if (crossId) for (var idx=0; idx < this.parlist.size; idx++) {
        let block = this.parlist.get(crossId);
        if (block) {
          resultArr.push(crossId);
          crossId = block.chainid;
        } else break;
      }
      if (resultArr.length) {
        this.scrollBarBlocks = resultArr;
        if (this.$refs.scrollBarRef) this.$refs.scrollBarRef.calculateSize();

        Vue.nextTick(()=>{
          this.throttleScrollUpdate();
        });
      }
    },

    scrollBarUpdatePosition(startId)
    {
      startId = startId || this.startId;
      let currIdx = this.scrollBarBlocks.indexOf(startId);
      //console.log('scrollBarUpdatePosition', currIdx, this.scrollBarBlocks.length);
      if (currIdx > -1) {
        let scrollBarTop = 0;

        try {
          let firstHeight = document.getElementById('s-'+ startId).getBoundingClientRect().height;
          scrollBarTop = (currIdx * this.scrollBarBlockHeight) + Math.floor(Math.abs(this.screenTop) * this.scrollBarBlockHeight / firstHeight);
        } catch (err) {
          scrollBarTop = currIdx * this.scrollBarBlockHeight;
        }

        //console.log('scrollToY1', startId, currIdx, scrollBarTop, this.scrollBarBlocks.length);
        this.$refs.scrollBarRef.scrollToY(scrollBarTop);
      }
    },

    endScrollDragging(top, left) {

      let currIdx = this.scrollBarBlocks.indexOf(this.startId);

      let scrollBarTop = 0;
      try {
        let firstHeight = document.getElementById('s-'+this.startId).getBoundingClientRect().height;
        scrollBarTop = (currIdx * this.scrollBarBlockHeight) + Math.floor(Math.abs(this.screenTop) * this.scrollBarBlockHeight / firstHeight);
      } catch (err) {
        scrollBarTop = currIdx * this.scrollBarBlockHeight;
      }

      this.$refs.scrollBarRef.scrollToY(scrollBarTop);
    },

    scrollByBar(top, left, dir, allowBodyScroll) {
      //console.log('scrollByBar', top, direction, allowBodyScroll);

      //let currIdx = Math.floor(top/this.scrollBarBlockHeight);
      //let currId = this.scrollBarBlocks[currIdx];

      switch(dir) {
        case 'up' : {
          this.scrollContent({deltaY: -1}, 70);
        } break;
        case 'down' : {
          if (!allowBodyScroll) this.scrollContent({deltaY: 1}, 70);
          else if (top == 0) this.scrollContent({deltaY: -1}, 70);
        } break;
      };
    },

    scrollByBarButton(dir = 'up') {
      switch(dir) {
        case 'up' : {
          this.scrollContent({deltaY: -1}, 70);
        } break;
        case 'down' : {
          this.scrollContent({deltaY: 1}, 70);
        } break;
      };
    },

    scrollByBarStart(dir = 'up') {
      if (this.scrollBarBlockTimer) clearInterval(this.scrollBarBlockTimer);
      this.scrollByBarButton(dir);
      this.scrollBarBlockTimer = window.setInterval(()=>{
        this.scrollByBarButton(dir);
      }, 100);
    },

    scrollByBarEnd() {
      if (this.scrollBarBlockTimer) clearInterval(this.scrollBarBlockTimer);
    },

    scrollBarClick(top, left) {
      let currIdx = Math.floor(top/this.scrollBarBlockHeight);
      let currId = this.scrollBarBlocks[currIdx];
      //console.log('scrollBarClick', top, currId);
      this.scrollToBlock(currId);
    },

    handleScroll(ev) {
      //console.log('handleScroll');
      this.$refs.contentScrollWrapRef.scrollTo(0,0);
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
          if (this.mode === 'narrate' && !this.tc_hasTask('block_narrate')) {
            this.$router.push({name: 'BookEdit', params: {}});
          }
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
        this.setBlockSelection({start: {}, end: {}});

        this.$store.commit('clear_storeList');

        this.$router.push({name: this.$route.name, params: {}});
        this.loadBookMeta()
        .then(()=>{
          this.tc_loadBookTask()
          .then(()=>{
            this.startId = false;
            this.loadBookDown(false, false, 10)
            .then(()=>{
              this.setBlockWatch();
              this.$root.$emit('from-book-meta:upd-toc', true);
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

      this.$root.$on('from-meta-edit:set-num', this.listenSetNum);
  },

  beforeDestroy:  function() {
    window.removeEventListener('keydown', this.eventKeyDown);
    this.setBlockSelection({start: {}, end: {}});
    this.isNeedUp = false;
    this.isNeedDown = false;
    this.$root.$off('bookBlocksUpdates');
    this.$root.$off('for-bookedit:scroll-to-block');
    this.$root.$off('book-reimported');
    this.$root.$off('from-meta-edit:set-num', this.listenSetNum);
  },
  watch: {
    'meta._id': {
      handler(newVal, oldVal) {
        console.log('watch meta._id', newVal, oldVal);
        if (newVal) {
          this.tc_loadBookTask()
          .then(()=>{
            if (this.mode === 'narrate' && !this.tc_hasTask('block_narrate')) {
              this.$router.push({name: 'BookEdit', params: {}});
            }
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
    },
    'startId': {
      handler(newVal, oldVal) {
        //console.log('this.startId', newVal);
        if (this.$refs.scrollBarRef && !this.$refs.scrollBarRef.dragging) {
          if (newVal && this.scrollBarBlocks.length) {
            this.scrollBarUpdatePosition(newVal);
          } else this.updateScrollSlider();
        }

      }
    },
    'mode': {
      handler(val) {
        this.recordingState == '';
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
      div.completed {
          background-color: inherit;
      }
  }
  .recording-block {
      .-content {
        background-color: white;
        border-radius: 5px;
        .content-wrap {
          overflow-y: scroll;
          max-height: 80vh;
        }
      }
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
    flex-grow: 2;

    display:flex;
    flex-direction: row;

    position: relative;
    overflow-y: hidden;
    overflow-x: auto;

    .container-fluid {
      padding-top: 15px;
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
  sg[data-suggestion=""] {
    w {
        background: yellow !important;
    }
  }


</style>
