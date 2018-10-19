<template>
<div class="content-scroll-wrapper" :class="[{'recording-background': recordingState == 'recording'}]" v-hotkey="keymap" ref="contentScrollWrapRef" v-on:scroll="handleScroll">
  <div v-on:wheel.prevent="smoothScrollContent"
    :class="['container-fluid ilm-book-styles ilm-global-style', metaStyles]">

    <!--<div class="content-scroll" ref="contentScrollRef" v-bind:style="{ top: scrollTop + 'px' }" >-->

      <div v-show="isBlocked && !parlistO.checkFirst()"
      class="infinite-loading-container -up"
      v-bind:style="{ top: upScreenTop + 'px' }"><!--&& isBlocked && blockers.indexOf('loadBookUp') >-1"-->
        <div><i class="loading-default"></i></div>
      </div>

      <!--<template v-for="(sublist, page_Idx) in parlist">-->
      <div class="row content-scroll-item" :class="[{'recording-block': recordingBlockId == viewObj.blockId}]"
        v-for="(viewObj, blockIdx) in parlistO.idsViewArray()"
        v-bind:style="{ top: screenTop + 'px' }"
        v-bind:id="'s-'+ viewObj.blockId"
        v-bind:key="viewObj.blockId"><!--{{parlistO.getInId(viewObj.blockRid)}} -> {{viewObj.blockId}}{{viewObj.blockRid}} -> {{parlistO.getOutId(viewObj.blockRid)}}-->
        <div class='col' v-if="parlist.has(viewObj.blockId)"><!--v-if="block.isVisible"-->
          <BookBlockView ref="blocks"
              :block="parlist.get(viewObj.blockId)"
              :blockO="parlistO.getBlockByRid(viewObj.blockRid)"
              :blockId = "viewObj.blockId"
              :putBlock ="putBlockProxy"
              :getBlock ="getBlockProxy"
              :putBlockPart ="putBlockPartProxy"
              :putBlockO ="putBlockOProxy"
              :putNumBlockO ="putNumBlockOProxy"
              :recorder ="recorder"
              :blockReindexProcess="blockReindexProcess"
              :getBloksUntil="getBloksUntil"
              :allowSetStart="allowSetStart"
              :allowSetEnd="allowSetEnd"
              :prevId="parlistO.getInId(viewObj.blockRid)"
              :mode="mode"
              :approveWaiting="approveWaiting"
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
      <div v-show="isBlocked && !parlistO.checkLast()"
        class="infinite-loading-container -down"
        v-bind:style="{ top: downScreenTop + 'px' }"><!--&& isBlocked && blockers.indexOf('loadBookDown') >-1"-->
        <div><i class="loading-default"></i></div>
      </div>
      <div class="end-of-book" v-show="parlistO.checkLast()">
        End Of Book
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
      <modal v-model="doJoinBlocks.showAudio" effect="fade" cancel-text="Cancel" title="Join blocks saving">
        <div slot="modal-body" class="modal-body">Discard unsaved audio changes?</div>
        <div slot="modal-footer" class="modal-footer">
          <button type="button" class="btn btn-default" @click="doJoinBlocks.showAudio = false;">Cancel</button>
          <button type="button" class="btn btn-primary" @click="joinBlocks()">Discard</button>
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
  <div class="custom-scroll" v-if="scrollBarBlocks.length > 0">
  <div class="vue-scrollbar__up"
    @click.prevent="()=>{return true;}"
    @mousedown="scrollByBarStart('up')"
    @mouseup="scrollByBarEnd()"
    @mouseout="scrollByBarEnd()">
    <i aria-hidden="true" class="fa fa-angle-up"></i>
    <!--@touchstart="scrollByBarStart('up')"
    @touchend="scrollByBarEnd()"-->
  </div>
  <vue-scrollbar classes="" ref="scrollBarRef" :onChangePosition="scrollByBar" direction="vertical"
  :onEndDragEvent="endScrollDragging" :onScrollBarClick="scrollBarClick">
  <div class="scroll-me" ref="scrollBarWrapRef">
  <div v-for="(sBlockId, sBlockIdx) in scrollBarBlocks" :id="'scroll-'+sBlockId" :data-id="sBlockId" ref="scrollBlocksRefs"
  :style="{height: scrollBarBlockHeight+'px'}"></div>
  <div class="clearfix"></div>
  </div>
  </vue-scrollbar>
  <div class="vue-scrollbar__down"
    @click.prevent="()=>{return true;}"
    @mousedown="scrollByBarStart('down')"
    @mouseup="scrollByBarEnd()"
    @mouseout="scrollByBarEnd()">
    <i aria-hidden="true" class="fa fa-angle-down"></i>
    <!--@touchstart="scrollByBarStart('down')"
    @touchend="scrollByBarEnd()"-->
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
import { BookBlock }    from '../../store/bookBlock';
import { BookBlocks }    from '../../store/bookBlocks';
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
        showAudio: false,
        action: false,
        block: {},
        block_Idx: false
      },
      blockReindexProcess: false,

      startId: false,
      //parlistC: new Map(),
      //parlistO: new BookBlocks(),

      upScreenTop: -85,
      downScreenTop: 0,
      screenTop: 0,

      scrollBarBlocks: [],
      scrollBarTop: 0,
      scrollBarBlockHeight: 150,
      scrollBarBlockTimer: null,

      lazyLoaderDir: 'up',
      isNeedUp: true,
      isNeedDown: true,
      recordingState: '',
      recordingBlockId: null,
      approveWaiting: false

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
          parlistO: 'storeListO',
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

      keymap: function() {
        return {
          // 'esc+ctrl' is OK.
          'ctrl+home': (ev)=>{
            //console.log('ctrl+home');
            let firstRid = this.parlistO.getFirstRid();
            console.log('firstRid', firstRid);
            if (firstRid) {
              let block = this.parlistO.getBlockByRid(firstRid);
              if (block) this.scrollToBlock(block.blockid);
            }
          },
          'ctrl+end': (ev)=>{
            //console.log('ctrl+end')
            let lastRid = this.parlistO.getLastRid();
            if (lastRid) {
              let block = this.parlistO.getBlockByRid(lastRid);
              if (block) this.scrollToBlock(block.blockid);
            }
          },
          'ctrl+up': (ev)=>{
            //console.log('ctrl+up arrow');
            let jumpStep = Math.floor(this.parlist.size * 0.1);
            let currId, crossId = this.startId;
            if (crossId) for (var idx=0; idx < jumpStep; idx++) {
              let blockId = this.parlistO.getInId(crossId);
              if (blockId) {
                currId = blockId;
                crossId = blockId;
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
            let blockId = this.parlistO.getInId(this.startId);
            if (blockId) this.scrollToBlock(blockId);
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
    ...mapActions([
    'loadBook', 'loadBookBlocks', 'loadPartOfBookBlocks',
    'loopPreparedBlocksChain', 'putBlockO', 'putNumBlockO',
    'putNumBlockOBatch',

    'searchBlocksChain', 'watchBlocks', 'putBlock', 'getBlock', 'putBlockPart', 'getBlockByChainId', 'setMetaData', 'freeze', 'unfreeze', 'tc_loadBookTask', 'addBlockLock', 'clearBlockLock', 'setBlockSelection', 'recountApprovedInRange', 'loadBookToc', 'setCurrentBookCounters']),

    test() {
        window.scrollTo(0, document.body.scrollHeight-500);
    },

    refreshTmpl() {
      // a hack to update template
      //Vue.set(this, 'screenTop', this.screenTop + 0.1);
      /*let startId = this.startId;
      this.startId = false;
      this.startId = startId;*/
      //this.updateScrollSlider();
      //console.log('refreshTmpl');
      //this.parlistO.setStartId(this.startId);
      this.$forceUpdate();
      //this.updateVisibleBlocks();
    },

    loadBookMeta() {
      let checkMeta = this.parlistO.meta || {};
      checkMeta = checkMeta.bookid || false;
      if (this.$route.params.hasOwnProperty('bookid')) {
        if (!checkMeta || checkMeta!==this.$route.params.bookid) {
          this.freeze('loadBookMeta');
          return this.loadBook(this.$route.params.bookid)
          .then((meta)=>{
            //console.log('loadBook then meta', meta);
            this.unfreeze('loadBookMeta');
            return this.searchBlockUnresolved()
            .then((blockId)=>{

              let startBlock = blockId || this.$route.params.block || false;
              let taskType = this.$route.params.task_type || false;

              return this.loadPartOfBookBlocks({
                bookId: this.$route.params.bookid,
                block: startBlock,
                taskType: taskType
              }).then((answer)=>{
                this.parlistO.setLookupsList(this.meta._id, answer);
                let idsArray = this.parlistO.idsArray();
                this.isNeedUp = idsArray[0];
                this.isNeedDown = idsArray[idsArray.length-1];
                this.$router.replace({name: this.$route.name, params: {}});
                return Promise.resolve(answer);
              })
            })
          }).catch((err)=>{
            this.unfreeze('loadBookMeta');
            return Promise.reject(err);
          });
        } else return Promise.resolve({ blocks:[] }); // already loaded
      } else return Promise.reject('No bookid');
    },

    lazyLoad(firstId = false, lastId = false)
    {
      //console.log('lazyLoad', this.isNeedUp, this.isNeedDown, this.lazyLoaderDir);
      //console.log('parlist', Array.from(this.parlist.keys()));
      //console.log('lazyLoaderDir1', firstId, lastId);

      this.isNeedUp = firstId || this.isNeedUp;
      this.isNeedDown = lastId || this.isNeedDown;
      let idsViewArray = this.parlistO.idsViewArray();

      if (!this.isBlocked && (this.isNeedUp || this.isNeedDown)) {
        switch(this.lazyLoaderDir) {
          case 'down' : {
            this.isNeedDown = this.parlistO.getOutId(this.isNeedDown);
            if (this.isNeedDown)
            {

              this.getBlock(this.isNeedDown)
              .then((result)=>{
                if (!this.parlist.has(result._id)) {
                  let newBlock = new BookBlock(result);
                  this.$store.commit('set_storeList', newBlock);
                  this.parlistO.setLoaded(result._id);
                  if (this.isNeedUp) this.lazyLoaderDir = 'up';
                  this.lazyLoad();
                }
              });
            } else {
              if (this.isNeedUp) this.lazyLoaderDir = 'up';
              this.lazyLoad();
            }

          } break;
          case 'up' : {
            this.isNeedUp = this.parlistO.getInId(this.isNeedUp);
            if (this.isNeedUp)
            {
              this.getBlock(this.isNeedUp)
              .then((result)=>{
                if (!this.parlist.has(result._id)) {
                  let newBlock = new BookBlock(result);
                  this.$store.commit('set_storeList', newBlock);
                  this.parlistO.setLoaded(result._id);
                  if (this.isNeedDown) this.lazyLoaderDir = 'down';
                  this.lazyLoad();
                }
              });
            } else {
              if (this.isNeedDown) this.lazyLoaderDir = 'down';
              this.lazyLoad();
            }
          } break;
        };

        //this.lazyLoad();
      };
    },

    loadPreparedBookDown(idsArray) { // mostly first page load

      let startId = idsArray[0] || this.meta.startBlock_id;
      this.freeze('loadBook');
      return this.loopPreparedBlocksChain({ids: idsArray})
      .then((result)=>{
        if (result.rows && result.rows.length > 0) {
          //console.log('loadPreparedBookDown result', result.rows);
          result.rows.forEach((el, idx, arr)=>{
            if (!this.parlist.has(el._id)) {
              let newBlock = new BookBlock(el);
              this.$store.commit('set_storeList', newBlock);
              this.parlistO.setLoaded(el._id);
              //this.updateScrollSlider(false);
            }
          });
          if (this.startId === false) {
            this.startId = startId; // first load
            this.parlistO.setStartId(startId);
          }
          this.unfreeze('loadBook');
          result.blockId = result.rows[result.rows.length-1]._id;
          return Promise.resolve(res);
        } else {
          this.unfreeze('loadBook');
          return Promise.reject();
        }
      }).catch(err=>{
        this.unfreeze('loadBook'); return err;
      });
    },

    searchBlockUnresolved() { //TODO Temporary solution
      let task_type = this.$route.params.task_type || false;
      if (!task_type) return Promise.resolve(false);
      if (task_type && task_type !== 'master-audio') {
        if (!Object.keys(this.tc_tasksByBlock).length) {
          return Promise.resolve(false);
        }
      }//&& task_type !== 'text-cleanup'

      if (task_type === 'true') {
        task_type = true;
      }
      if (!task_type && !this._is('editor')) {
        task_type = true;
      }
      return this.$store.dispatch('searchBlocksChain', {
        book_id: this.meta._id,
        startId: this.startId || this.meta.startBlock_id,
        search: {block_type: 'unresolved',  task_type: task_type}
      }).then((result)=>{
        return result.blockId;
      });
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
            //this.startId = blockId;
            this.scrollToBlock(blockId);
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
          let lastId = res.rows.length ? res.rows[res.rows.length-1]._id : false;
          this.lazyLoad(false, lastId);
          return Promise.resolve(res);
        }).catch(err=>{
          this.unfreeze('loadBookDown'); return err;
        });
      }
    },

    getBlocks(startId, onPage = 10) {
      return this.loadBlocksChain({
        book_id: this.meta._id,
        startId: startId,
        onpage: onPage
      })
      .then((result)=>{
        if (result.rows && result.rows.length > 0) {
          result.rows.forEach((el, idx, arr)=>{
            if (!this.parlist.has(el._id)) {
              let newBlock = new BookBlock(el);
              this.$store.commit('set_storeList', newBlock);
              //this.updateScrollSlider(false);
            }
          });
          result.blockId = result.rows[result.rows.length-1]._id;
        } else {
          this.hasScrollDown = false;
          return Promise.reject();
        }
        return Promise.resolve(result);
      })
      .catch((err)=>{
        console.log('BlocksDown Error: ', err);
        //this.updateScrollSlider(false);
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
        let crossId = /*(startId === 'unresolved') ? this.startId :*/ this.meta.startBlock_id;
        switch(startId) {
          case 'unresolved': {
          if (this.parlist.size > 0) {
            for (var idx=0; idx < this.parlist.size; idx++)
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
                  let lastId = result.rows[result.rows.length-1]._id;
                  this.lazyLoad(result.blockId || this.meta.startBlock_id, lastId);
                  return resolve(result.blockId);
                }
                else {
                  if (this.parlist.has(result.blockId)) return resolve(result.blockId);
                  this.getBlocks(result.blockId)
                  .then((res)=>{
                    let lastId = res.rows.length ? res.rows[res.rows.length-1]._id : false;
                    this.lazyLoad(this.startId || this.meta.startBlock_id, lastId);
                    return resolve(result.blockId);
                  }).catch(err=>{
                    return reject(err);
                  });
                }

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
      //console.log('refreshBlock', change);
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
            this.$store.commit('set_storeList', new BookBlock(oldBlock));
            this.refreshTmpl();
          } else if (updField) {
            oldBlock[updField] = change.doc[updField];
            oldBlock._rev = change.doc._rev;
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
                if (oldBlock.chainid !== newBlock.chainid) {// next block was removed
                  oldBlock.chainid = newBlock.chainid;
                }
                //if (oldBlock.realigned !== newBlock.realigned) {
                  //this.clearBlockLock({block: change.doc});
                //}
              } else {
                this.$store.commit('set_storeList', newBlock);
              }
            } else {
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
      //console.log('putBlockProxy', block);
      return this.putBlock(block)
      .then(()=>{
        this.updateVisibleBlocks();
      })
      .catch((err)=>{})
    },

    putBlockPartProxy: function (blockData) {
      //console.log('putBlockPartProxy', blockData);
      return this.putBlockPart(blockData)
      .then(()=>{})
      .catch((err)=>{})
    },

    putBlockOProxy: function (blockData) {
      //console.log('putBlockOProxy', blockData);
      return this.putBlockO(blockData)
      .then((blocks)=>{
        //console.log('putBlockOProxy then');
        this.updateVisibleBlocks();
        return Promise.resolve(blocks)
      })
      .catch((err)=>{})
    },

    putNumBlockOProxy: function (blockData) {
      return this.putNumBlockO(blockData)
      .then((blocks)=>{
        this.updateVisibleBlocks();
        return Promise.resolve(blocks)
      })
      .catch((err)=>{})
    },

    putNumBlockOBatchProxy: function (numData) {
      return this.putNumBlockOBatch(numData)
      .then((blocks)=>{
        //console.log('putNumBlockOProxy then');
        this.updateVisibleBlocks();
        return Promise.resolve(blocks)
      })
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
        //content: '',
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
          //this.setBlockSelection({start: {}, end: {}});
          let b_new = response.data.new_block;
          let b_old = response.data.block;
          this.$store.commit('set_storeList', newBlock);
          this.refreshBlock({doc: b_new, deleted: false});
          if (b_old) {
            this.refreshBlock({doc: b_old, deleted: false});
          }
          if (response.data.blockO) {
            let blockO = response.data.blockO;
            this.parlistO.addBlock(blockO);

            this.putNumBlockOBatchProxy({bookId: block.bookid});

            this.scrollBarBlocks = this.parlistO.idsArray();
            if (!this.parlistO.getInId(blockO.blockid)) {
              this.startId = blockO.blockid;
            }
            //this.updateScrollSlider();
          }
          this.unfreeze('insertBlockBefore');
          //this.updateScrollSlider();
          //this.refreshTmpl();
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
          //this.setBlockSelection({start: {}, end: {}});
          let b_new = response.data.new_block;
          let b_old = response.data.block;
          this.$store.commit('set_storeList', newBlock);
          this.refreshBlock({doc: b_new, deleted: false});
          this.refreshBlock({doc: b_old, deleted: false});
          if (response.data.blockO) {
            let blockO = response.data.blockO;
            this.parlistO.addBlock(blockO);

            this.putNumBlockOBatchProxy({bookId: block.bookid});

            this.scrollBarBlocks = this.parlistO.idsArray();
            if (!this.parlistO.getOutId(blockO.blockid)) {
              let firstId = this.parlistO.idsViewArray()[0];
              this.startId = this.parlistO.getOutId(firstId);
              //this.startId = blockO.blockid;
            } //else this.refreshTmpl();
            this.updateScrollSlider();
          }
          this.unfreeze('insertBlockAfter');
          //this.updateScrollSlider();
          //this.refreshTmpl();
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
      let api_url = this.API_URL + 'book/block/' + block._id;
      let api = this.$store.state.auth.getHttp();
      api.delete(api_url, {})
      .then((response)=>{
        //this.setBlockSelection({start: {}, end: {}});
        if (response.data) {

          let newStartId = this.parlistO.delBlock(response.data);
          if (newStartId !== this.startId) {
            // in case when first or last block in book was deleted
            this.startId = newStartId;
            this.parlistO.setStartId(newStartId);
          } //else this.refreshTmpl();
          this.parlist.delete(block._id);
          this.scrollBarBlocks = this.parlistO.idsArray();
          this.updateScrollSlider();
        }

        this.putNumBlockOBatchProxy({bookId: block.bookid});

        this.unfreeze('deleteBlock');
        //this.updateScrollSlider();
        //this.refreshTmpl();
      })
      .catch(err => {
        this.unfreeze('deleteBlock');
        return err;
      });

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
            return this.getBlock(this.parlistO.getInId(block._id))
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


              let elBlock = this.$children.find(c => {
                return c.$el.id == block._id;
              });
              let elNext = this.$children.find(c => {
                return c.$el.id == blockBefore._id;
              });

              if (!this.doJoinBlocks.show
                  && (this.parlist.get(block._id).isChanged || this.parlist.get(blockBefore._id).isChanged))
              {
                // save current block reference
                // and show confirmation pop-up to save changes
                this.doJoinBlocks.block = block;
                this.doJoinBlocks.direction = direction;
                this.doJoinBlocks.show = true;
              } else if (!this.doJoinBlocks.showAudio &&
                      (this.parlist.get(block._id).isAudioChanged ||
                      this.parlist.get(blockBefore._id).isAudioChanged ||
                      (elBlock && elBlock.audioEditFootnote.isAudioChanged) ||
                      (elNext && elNext.audioEditFootnote.isAudioChanged))) {
                this.doJoinBlocks.block = block;
                this.doJoinBlocks.direction = direction;
                this.doJoinBlocks.showAudio = true;
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
                  currBlockRef.isAudioChanged = false;
                  let el = this.$children.find(c => {
                    return c.$el.id == currBlockRef._id;
                  });
                  if (el) {
                    el.evFromAudioeditorClosed(currBlockRef._id);
                  }
                  this.$root.$emit('for-audioeditor:force-close');
                  currBlockRef.assembleBlockProxy()
                  .then(()=>{
                    prevBlockRef.isAudioChanged = false;
                    let el = this.$children.find(c => {
                      return c.$el.id == prevBlockRef._id;
                    });
                    if (el) {
                      el.evFromAudioeditorClosed(prevBlockRef._id);
                    }
                    prevBlockRef.assembleBlockProxy()
                    .then(()=>{
                      this.doJoinBlocks.show = false;
                      this.doJoinBlocks.showAudio = false;
                      this.doJoinBlocks.block = {};
                      return api.post(api_url, {
                        resultBlock_id: blockBefore._id,
                        donorBlock_id: block._id
                      })
                      .then((response)=>{
                        //this.setBlockSelection({start: {}, end: {}});
                        this.clearBlockLock({block: blockBefore, force: true});
                        if (response.data.ok && response.data.blocks) {
                          response.data.blocks.forEach((res)=>{
                            this.refreshBlock({doc: res, deleted: res.deleted});
                          });
                        }
                        if (response.data.blocks && response.data.blocks[2]) {
                          this.parlistO.delBlock(response.data.blocks[2]);
                          this.scrollBarBlocks = this.parlistO.idsArray();
                          this.updateScrollSlider();
                        }

                        this.putNumBlockOBatchProxy({bookId: block.bookid});
                        this.refreshTmpl();
                        this.unfreeze('joinBlocks');
                        this.updateScrollSlider();
                        return Promise.resolve();
                      })
                      .catch((err)=>{
                        this.refreshTmpl();
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
              let elBlock = this.$children.find(c => {
                return c.$el.id == block._id;
              });
              let elNext = this.$children.find(c => {
                return c.$el.id == block.chainid;
              });
              if (!this.doJoinBlocks.show
              && (this.parlist.get(block._id).isChanged || this.parlist.get(block.chainid).isChanged))
              {
                this.doJoinBlocks.block = block;
                this.doJoinBlocks.direction = direction;
                this.doJoinBlocks.show = true;

              } else if (!this.doJoinBlocks.showAudio &&
                      (this.parlist.get(block._id).isAudioChanged ||
                      this.parlist.get(block.chainid).isAudioChanged ||
                      (elBlock && elBlock.audioEditFootnote.isAudioChanged) ||
                      (elNext && elNext.audioEditFootnote.isAudioChanged))) {
                this.doJoinBlocks.block = block;
                this.doJoinBlocks.direction = direction;
                this.doJoinBlocks.showAudio = true;
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
                  currBlockRef.isAudioChanged = false;
                  let el = this.$children.find(c => {
                    return c.$el.id == currBlockRef._id;
                  });
                  if (el) {
                    el.evFromAudioeditorClosed(currBlockRef._id);
                  }
                  this.$root.$emit('for-audioeditor:force-close');
                  currBlockRef.assembleBlockProxy()
                  .then(()=>{
                    nextBlockRef.isAudioChanged = false;
                    let el = this.$children.find(c => {
                      return c.$el.id == nextBlockRef._id;
                    });
                    if (el) {
                      el.evFromAudioeditorClosed(nextBlockRef._id);
                    }
                    nextBlockRef.assembleBlockProxy()
                    .then(()=>{
                      this.doJoinBlocks.show = false;
                      this.doJoinBlocks.showAudio = false;
                      this.doJoinBlocks.block = {};
                      return api.post(api_url, {
                        resultBlock_id: block._id,
                        donorBlock_id: blockAfter._id
                      })
                      .then((response)=>{
                        //this.setBlockSelection({start: {}, end: {}});
                        this.clearBlockLock({block: block, force: true});
                        if (response.data.ok && response.data.blocks) {
                          response.data.blocks.forEach((res)=>{
                            this.refreshBlock({doc: res, deleted: res.deleted});
                          });
                        }
                        if (response.data.blocks && response.data.blocks[2]) {
                          this.parlistO.delBlock(response.data.blocks[2]);
                          this.scrollBarBlocks = this.parlistO.idsArray();
                          this.updateScrollSlider();
                        }

                        this.putNumBlockOBatchProxy({bookId: block.bookid});
                        //this.refreshTmpl();
                        this.unfreeze('joinBlocks');
                        //this.updateScrollSlider();
                        return Promise.resolve();
                      })
                      .catch((err)=>{
                        this.refreshTmpl();
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
          //console.log('byOne', status, block.rid, 'start:', this.blockSelection.start._id, 'end:', this.blockSelection.end._id);

          let blockSel = {_id: block.blockid};
          this.parlistO.setUnCheckedRange();
          if (status) { // check
            if (shift && this.blockSelection.start._id) {
              let startRId = this.parlistO.getRIdById(this.blockSelection.start._id);
              newSelection = this.parlistO.setChecked(startRId, block.rid);
            } else {
              newSelection = this.parlistO.setChecked(block.rid);
            }
            //console.log('newSelection', newSelection.start._id, newSelection.end._id);
            this.setBlockSelection(newSelection);
          }
          else { // uncheck
            if (this.blockSelection.start._id && this.blockSelection.end._id && this.blockSelection.start._id !== this.blockSelection.end._id) {
              newSelection = this.parlistO.setChecked(block.rid);
              this.setBlockSelection(newSelection);
            }
            else this.setBlockSelection({start: {}, end: {}});
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
      return false;idsViewArray
    },
    updateVisibleBlocks() {
      if (this.$refs.blocks && this.$refs.blocks.length) {
        this.$refs.blocks.forEach(($ref)=>{
          //$ref.isUpdated = true;
          //$ref.isUpdated = false;
          $ref.$forceUpdate();
        })
      }
    },
    setUnCheckedRange() {
      this.parlistO.setUnCheckedRange()
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

    smoothScrollContent: _.throttle(function (ev) {
      this.scrollContent(ev);
    }, 50),

    scrollContent(ev, step = 60)
    {
      if (this.recordingState == 'recording') {
        return;
      }

      if (ev.deltaY !== false && ev.hasOwnProperty('preventDefault')) ev.preventDefault();

      if (ev.deltaY < 0 && this.blockers.indexOf('loadBook') >-1) return;
      if (ev.deltaY > 0 && this.blockers.indexOf('loadBook') >-1) return;

      step = (ev.deltaY!==false) ? (ev.deltaY > 0 ? step : -1*step) : 0;

      let idsViewArray = this.parlistO.idsViewArray();
      let lenDomBlocks = idsViewArray.length;
      //if (lenDomBlocks <= 1) return;

      let firstDomBlock = document.getElementById('s-'+idsViewArray[0].blockId);
      if (!firstDomBlock) return;
      let firstDomRect= firstDomBlock.getBoundingClientRect();

      let firstBlock = this.parlistO.getBlockByRid(idsViewArray[0].blockRid);
      let lastBlock = this.parlistO.getBlockByRid(idsViewArray[lenDomBlocks-1].blockRid);

      let topShift = 96;

      if (ev.deltaY < 0) { // scroll UP
        if (firstBlock.in == this.parlistO.meta.rid && firstDomRect.top >= topShift)
        { // if this is a very first block
          // this.screenTop = 0;
          return;
        }

        this.screenTop -= step;

        if (firstDomRect.bottom > 0) {
          let prevBlock = this.parlistO.getBlockByRid(firstBlock.in);
          if (prevBlock) {
            if (this.parlist.has(prevBlock.blockid)) { // already loaded
              this.startId = prevBlock.blockid;
              this.parlistO.setStartId(this.startId);

              Vue.nextTick(() => {
                firstDomBlock = document.getElementById('s-'+this.startId);
                firstDomRect= firstDomBlock.getBoundingClientRect();

                this.screenTop = this.screenTop - firstDomRect.height;

                this.$refs.blocks.forEach(($ref)=>{
                  $ref.addContentListeners();
                })
              });

            } else {
              let idsArray = this.parlistO.getPrevIds(firstBlock.in, 5);
              this.loadPreparedBookDown(idsArray)
              .then(()=>{
                this.startId = prevBlock.blockid;
                this.parlistO.setStartId(this.startId);

                Vue.nextTick(() => {
                  firstDomBlock = document.getElementById('s-'+this.startId);
                  firstDomRect= firstDomBlock.getBoundingClientRect();

                  this.screenTop = this.screenTop - firstDomRect.height;

                  this.$refs.blocks.forEach(($ref)=>{
                    $ref.addContentListeners();
                  })
                });

              }).catch(err=>{
                this.screenTop = 0;
                return err;
              });
            }
          }
        }
      } else if (ev.deltaY > 0) { // scroll DOWN

        if (lastBlock.out == this.parlistO.meta.rid) {
          let lastDomBlock = document.getElementById('s-'+idsViewArray[lenDomBlocks-1].blockId);
          let lastDomRect = lastDomBlock.getBoundingClientRect();
          if (lastDomRect.bottom <= topShift + 100) {
            return; //last block reached
          }
        }

        this.screenTop -= step;

        if (firstDomRect.bottom < 0) {
          let nextBlock = this.parlistO.getBlockByRid(lastBlock.out);
          if (nextBlock) {
            if (this.parlist.has(nextBlock.blockid)) { // already loaded

              this.startId = this.parlistO.getBlockByRid(firstBlock.out).blockid;
              this.parlistO.setStartId(this.startId);

              this.screenTop = this.screenTop + firstDomRect.height;

              this.$refs.blocks.forEach(($ref)=>{
                $ref.addContentListeners();
              })
            } else {
              let idsArray = this.parlistO.getNextIds(lastBlock.out, 5);
              this.loadPreparedBookDown(idsArray)
              .then(()=>{

                this.startId = this.parlistO.getBlockByRid(firstBlock.out).blockid;
                this.parlistO.setStartId(this.startId);

                this.screenTop = this.screenTop + firstDomRect.height;

                this.$refs.blocks.forEach(($ref)=>{
                  $ref.addContentListeners();
                })

              }).catch(err=>{
                this.screenTop = 0;
                return err;
              });
            }
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
        this.parlistO.setStartId(id);
      } else {
        let idsArray = this.parlistO.getNextIds(id, 5);
        this.loadPreparedBookDown(idsArray)
        .then((blockId)=>{
          this.setBlockWatch();
          this.lazyLoad(id);
          this.screenTop = 0;
          this.startId = id;
          this.parlistO.setStartId(id);
        });
      }
    },

    scrollToBlockEnd(id) {
      try {
        let blockOffset = $('#' + id).offset().top;
        let firstHeight = $('#content-' + id).height();
        if (firstHeight + blockOffset > window.innerHeight) {
          this.screenTop-=firstHeight - 200;
        }
      } catch (err) {
        //this.screenTop -= step;
        return;
      }
    },

    listenSetNum(bookId, numMask, blockRid) {
      //console.log('listenSetNum', bookId, numMask);
      if (bookId) this.putNumBlockOBatchProxy({bookId: bookId, bookNum: numMask, blockRid: blockRid});
      else this.updateVisibleBlocks();
      //this.refreshTmpl();
    },

    throttleScrollUpdate: _.throttle(function () {
      if (this.$refs.scrollBarRef) {
        this.$refs.scrollBarRef.calculateSize();
        this.scrollBarUpdatePosition(this.startId);
      }
    }, 400),

    updateScrollSlider(startId = false)
    {
      if (this.$refs.scrollBarRef) {
        this.$refs.scrollBarRef.calculateSize();
        this.scrollBarUpdatePosition(this.startId);
      }
    },

    scrollBarUpdatePosition(startId)
    {
      startId = startId || this.startId;
      let currIdx = this.parlistO.idsArray().indexOf(startId);
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

      let currIdx = this.parlistO.idsArray().indexOf(this.startId);

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
    },

    _toggleApproveWaiting(val) {
      this.approveWaiting = val;
    },

    bookReimported() {
      this.setBlockSelection({start: {}, end: {}});

      this.$store.commit('clear_storeList');
      this.$store.commit('clear_storeListO');
      this.startId = false;
      this.setCurrentBookCounters(['not_marked_blocks']);
      this.refreshTmpl();

      this.$router.push({name: this.$route.name, params: {}});
      this.loadBookMeta() // also handle route params
      .then((initBlocks)=>{
        if (this.meta._id) {
          this.tc_loadBookTask()
          .then(()=>{
            this.loadPreparedBookDown(this.parlistO.idsArray(), 10).then(()=>{
              this.startId = this.parlistO.idsArray[0];
              this.scrollToBlock(this.startId);
              this.loadBookBlocks({bookId: this.meta._id})
              .then((res)=>{
                this.parlistO.updateLookupsList(this.meta._id, res);
                this.scrollBarBlocks = this.parlistO.idsArray();
                this.updateScrollSlider();
                this.setBlockWatch();
                this.loadBookToc({bookId: this.meta._id, isWait: true});
                this.lazyLoad();
              });
            });
          });
        }
      });
    },

    bookBlocksUpdates(data) {
      let updField = data.updField || false;
      if (Array.isArray(data.blocks)) data.blocks.forEach((res)=>{
        this.refreshBlock({doc: res, deleted: res.deleted || false, updField: updField});
      })
    }

  },
  events: {
      currentEditingBlock_id : function (key) {
          //console.log("keydown: ", key)
      }
  },
  beforeMount: function() {
    if (this.$route.params.hasOwnProperty('bookid')) {
      if (!(this.parlistO.meta && this.parlistO.meta.bookid && this.parlistO.meta.bookid == this.$route.params.bookid)) {
        this.$store.commit('clear_storeList');
        this.$store.commit('clear_storeListO');
      }
    }
  },
  mounted: function() {
      //this.onScrollBookDown();
      //console.log('book mounted', this.meta._id);
      this.loadBookMeta() // also handle route params
      .then((initBlocks)=>{
        if (this.meta._id && initBlocks.blocks.length) {
          this.tc_loadBookTask()
          .then(()=>{
            this.loadPreparedBookDown(this.parlistO.idsArray())
            .then(()=>{
              this.refreshTmpl();
              this.loadBookBlocks({bookId: this.meta._id})
              .then((res)=>{
                this.parlistO.updateLookupsList(this.meta._id, res);
                this.scrollBarBlocks = this.parlistO.idsArray();
                this.updateScrollSlider();
                this.lazyLoad();
                this.setBlockWatch()
                if (this.mode === 'narrate' && !this.tc_hasTask('block_narrate')) {
                  this.$router.push({name: 'BookEdit', params: {}});
                }
              });
            });
          });
        } else {
          this.scrollBarBlocks = this.parlistO.idsArray();
          this.updateScrollSlider();

          if (this.$route.params.hasOwnProperty('block')) {
            this.scrollToBlock(this.$route.params.block);
            this.$router.replace({name: this.$route.name, params: {}});
            this.updateVisibleBlocks();
          } else {
            this.$router.replace({name: this.$route.name, params: {block: this.meta.startBlock_id}});// force view update when switching from display mode
          }
        }
      });

      window.addEventListener('keydown', this.eventKeyDown);

      this.initRecorder();
      window.onscroll = function() {
        $('#narrateStartCountdown').css('top', document.scrollingElement.scrollTop + 'px');
        $('#narrateStartCountdown').css('height', '100%')
      }

      this.$root.$on('book-reimported', this.bookReimported);
      this.$root.$on('for-bookedit:scroll-to-block', this.scrollToBlock);
      this.$root.$on('bookBlocksUpdates', this.bookBlocksUpdates);
      this.$root.$on('from-meta-edit:set-num', this.listenSetNum);
      this.$root.$on('block-approving', this._toggleApproveWaiting);


      $('body').on('click', '.medium-editor-toolbar-anchor-preview-inner, .ilm-block a', (e) => {// click on links in blocks
        e.preventDefault();
      });

      this.$root.$on('for-bookedit:scroll-to-block-end', this.scrollToBlockEnd);
  },

  beforeDestroy:  function() {
    window.removeEventListener('keydown', this.eventKeyDown);
    this.setBlockSelection({start: {}, end: {}});
    this.isNeedUp = false;
    this.isNeedDown = false;
    this.$root.$off('bookBlocksUpdates', this.bookBlocksUpdates);
    this.$root.$off('for-bookedit:scroll-to-block', this.scrollToBlock);
    this.$root.$off('book-reimported', this.bookReimported);
    this.$root.$off('from-meta-edit:set-num', this.listenSetNum);
    this.$root.$off('block-approving', this._toggleApproveWaiting)
  },
  watch: {
    'meta._id': {
      handler(newVal, oldVal) {
        console.log('watch meta._id', newVal, oldVal);
//         if (newVal) {
//           this.tc_loadBookTask()
//           .then(()=>{
//             if (this.mode === 'narrate' && !this.tc_hasTask('block_narrate')) {
//               this.$router.push({name: 'BookEdit', params: {}});
//             }
//             this.loadBookDown(true)
//             .then(()=>{
//               this.setBlockWatch();
//               //this.loadBookBlocks(newVal);
//             });
//           });
//         }
      }
    },
    'allBooks': {
      handler() {
        this.setBlockWatch();
      }
    },
    '$route' (toRoute, fromRoute) {
      //console.log('$route', toRoute, fromRoute);
      if (toRoute.params.hasOwnProperty('task_type') && toRoute.params.task_type) {
        let taskType = toRoute.params.task_type;
        this.loadPartOfBookBlocks({
          bookId: this.$route.params.bookid,
          block: 'unresolved',
          taskType: taskType,
          onPage: 1
        }).then((answer)=>{
          //this.startId = answer.blocks[0].blockid;
          //console.log('answer', answer);
          this.scrollToBlock(answer.blocks[0].blockid);
          this.$router.replace({name: this.$route.name, params: {}});
        })
      }
      if (this.$route.params.hasOwnProperty('block') && this.$route.params.block!=='unresolved') {
        this.scrollToBlock(this.$route.params.block);
        this.$router.replace({name: this.$route.name, params: {}});
      }
    },
    'tc_tasksByBlock': {
      handler(val, oldVal) {
        //console.log('tc_tasksByBlock', val, oldVal);
        if (Object.keys(val).length && !Object.keys(oldVal).length) {
          if (
            this.$route.params.hasOwnProperty('block') &&
            this.$route.params.block !== 'unresolved' &&
            !this.parlist.length
          ) {
            this.getBloksUntil(this.$route.params.block, this.$route.params.task_type);
          }
        } else {

        }
      }
    },
    'blockSelection': {
      handler(val) {
        //console.log('blockSelection', 'start:', val.start, 'end:', val.end);
        if (!this.blockSelection.start._id && !this.blockSelection.end._id) {
          this.parlistO.setUnCheckedRange();
        }
      },
      deep: true
    },
    'startId': {
      handler(newVal, oldVal) {
        //console.log('this.startId', newVal);
        if (typeof newVal !== 'undefined') {
          if (this.$refs.scrollBarRef && !this.$refs.scrollBarRef.dragging) {
            if (newVal && this.scrollBarBlocks.length) {
              this.scrollBarUpdatePosition(newVal);
            } else this.updateScrollSlider();
          }
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

  .cancel-align {
      border: 1px solid red;
      border-radius: 8px;
      background-color: white;
      i.fa {
          color: red;
      }
      font-size: 12px;
      padding: 6px 12px;
  }


</style>
