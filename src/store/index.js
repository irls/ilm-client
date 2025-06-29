import Vue from 'vue'
import Vuex from 'vuex'
import superlogin from 'superlogin-client'
import hoodie from 'pouchdb-hoodie-api'
import PouchDB from 'pouchdb'
import lodash from 'lodash'
import {BookBlock} from './bookBlock'
import {BookBlocks} from './bookBlocks'
import {liveDB} from './liveDB'
import { Collection } from './collection'
import suspiciousWordsHighlight from './suspiciousWordsHighlight';
const _ = require('lodash')
import axios from 'axios';
PouchDB.plugin(hoodie)
import uploadImage from './uploadImage'
import testAudioConvert from './modules/testAudioConvert';
import setBlocksDisabled from './modules/setBlocksDisabled';
import userActions from './modules/user';
import alignActions from './modules/align';
import tasks from './modules/tasks';
import audioExport from './modules/audioExport';
import gridFilters from './modules/gridFilters';
import tocSections from './modules/tocSection';
import ttsModule from './modules/tts';
import genreModule from './modules/genre';
import publishModule from './modules/publish';
import authorsModule from './modules/authors';
import authorsMapModule from './modules/authorsMap';
import calculateLevelsModule from "./modules/calculateLevels";
import suggestionsModule from './modules/suggestions';
import booksModule from "./modules/book";
import filterTagsModule from "./modules/filterTag";
// const ilm_content = new PouchDB('ilm_content')
// const ilm_content_meta = new PouchDB('ilm_content_meta')

Vue.use(Vuex)


Vue.prototype.globalJobInfo ={};
Vue.prototype.user_id = null;

const ILM_CONTENT = 'ilm_content';
const ILM_CONTENT_META = 'ilm_content_meta';
const ILM_CONTENT_FILES = 'ilm_library_files';
const ILM_TASKS = 'ilm_tasks';
const ILM_LIBRARIES = 'ilm_libraries';
const POUCH_CFG = {
    ajax: {
        timeout: 120000/*,
        heartbeat: 20000*/
    }
};

const authorsLangFarsi =
{
 bab:      'باب',
 baha:     'بهاءالّله',
 abd:      'عبدالبهاء',
 shoghi:   'شوقی',
 sacred:   'sacred',
 bible:    'انجيل',
 muhammad: 'محمد',
 quran:    'قرآن',
 jesus:    'عیسی',
 ali:      'علی',
 tradition: 'حدیث',
 husayn:   'حسین'
};

const audioTasksQueueRunSize = 10;
const localAudioTasks = ['manual_boundaries', 'unpin_right'];

// const API_ALLBOOKS = '/static/books.json'

function defer() {
  var res, rej;
  var promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });
  promise.resolve = res;
  promise.reject = rej;
  return promise;
}

export const store = new Vuex.Store({
  modules: {
    uploadImage,
    testAudioConvert,
    setBlocksDisabled,
    userActions,
    alignActions,
    tasks,
    gridFilters,
    audioExport,
    tocSections,
    ttsModule,
    genreModule,
    publishModule,
    authorsModule,
    authorsMapModule,
    calculateLevelsModule,
    suggestionsModule,
    booksModule,
    filterTagsModule
  },
  state: {
    SelectionModalProgress:0,
    audioRenaming : false,
    auth: superlogin,
    isLoggedIn: false,
    isAdmin: false,
    isEditor: false,
    isLibrarian: false,
    isBookkeeper: false,
    isEngineer: false,
    isReader: false,
    isNarrator: false,
    isProofer: false,
    allowCollectionsEdit: false,
    allowPublishCurrentBook: false,
    publishButtonStatus: false,
    allRolls: [],
    hashTagsSuggestions: [],

    authorsLangFarsi: authorsLangFarsi,

    metaDB: false,
    metaDBcomplete: false,
    tasksDB: false,
    librariesDB: false,

    metaRemoteDB: false,
    tasksRemoteDB: false,
    librariesRemoteDB: false,

    books_meta: [],

    currentBookid: '',
    currentBook: {},
    selectionModalActive:false,
    currentBookMeta: {},
    currentEditingBlockId: '',
    currentBookFiles: { coverimg: false },
    currentBookBlocksLeft: 0,
    currentBookBlocksLeftId: 'AAA',
    currentBookToc: {bookId: '', data: []},
    currentAudiobook: {},

    bookSearch: {string: '', resultCounter: 0, searchPointer: 0},

    editMode: 'Editor',
    allowBookEditMode: false,
    tc_currentBookTasks: {"tasks": [], "job": {}, "assignments": [], "can_resolve_tasks": [], "is_proofread_unassigned": false},
    tc_tasksByBlock: {},
    tc_userTasks: {list: [], total: 0},
    API_URL: process.env.ILM_API + '/api/v1/',
    bookCollectionsAll: [],
    bookCollections: [],
    currentCollection: {},
    currentCollectionId: false,
    allowPublishCurrentCollection: false,
    libraries: [],
    currentLibrary: {},
    currentLibraryId: false,

    user: {},
    currentBookCounters: {not_marked_blocks: '0', not_marked_blocks_missed_audio: '0', narration_blocks: '0', not_proofed_audio_blocks: '0', approved_audio_in_range: '0', approved_tts_in_range: '0', changed_in_range_audio: '0', change_in_range_tts: '0', voiced_in_range: '0', voiceworks_for_remove: '0', total_blocks: '0', enabled_blocks: '0'},

    blockers: [],
    reqSignals: {
      metaUpdate: null, //new AbortController()
    },

    lockedBlocks: [],
    aligningBlocks: [],
    storeList: new Map(), // global parlist
    storeListO: new BookBlocks(),
    storeListUpdateCounter: 0,
    blockSelection: {
      start: {},//block
      end: {},//block
      refresh: false//for liveDB
    },
    alignCounter: {
      count: 0,
      countAudio: 0,
      countTTS: 0,
      blocks: []
    },
    selectionXHR: null,
    partOfBookBlocksXHR: null,
    tasksXHR: 0,
    approveBlocksList: [],
    replicatingDB: {},
    taskTypes: {tasks: [], categories: []},
    adminOrLibrarian: false,
    adminOrProofer: false,
    currentJobInfo: {
      can_resolve_tasks: [],
      mastering: null,
      mastering_complete: null,
      proofing: null,
      published: null,
      text_cleanup: null,
      is_proofread_unassigned: null,
      tasks_counter: [],
      executors: {editor: null, proofer: null, narrator: null},
      description: '',
      id: null,
      completed: null,
      workflow: {
        status: null,
        archived: null
      },
      locked_blocks: {proofer: [], narrator: [], editor: []},
      is_narrate_unassiged: false
    },
    taskTypes: {tasks: [], categories: []},
    liveDB: new liveDB((status) => {
      if( store.state.livedbStatus!=null && status){
        store.state.liveDB.stopWatch('metaV');
        store.dispatch('liveDBMetaUpdate');
      }
      store.state.livedbStatus = status;

    }),

    bookCategories: [],
    // bookDifficulties: [
    //   '1',
    //   '2',
    //   '3',
    //   '4',
    //   '5',
    //   '6',
    //   '7',
    //   '8',
    //   '9',
    //   '10',
    //   '11',
    //   '12'
    // ],
    bookDifficultyDefault:'6',
    loadBookWait: null,
    loadBookTaskWait: {},
    jobInfoRequest: null,
    jobInfoTimer: null,
    jobStatusError: '',
    bookMode: null,
    processQueueWatch: null,
    allowBookSplitPreview: false,
    taskBlockMap: {map: {}, refresh: null, allowNext: true},
    taskUsers: {
      'editor': [],
      'proofer': [],
      'engineer': [],
      'reader': [],
      'narrator': []
    },
    audioTasksQueue: {
      time: null,
      queue: [],
      running: null,
      log: [],
      block: {
        blockId: null,
        partIdx: null,
        checkId: null
      }
    },
    updateAudiobookProgress: false,
    coupletSeparator: '',
    selectedBlocks: [],
    updatingNumeration: false,
    alignBlocksLimit: null,
    allowAlignBlocksLimit: true,
    livedbStatus : null,
    livedbEnabled : true,
    watched:{
      'metaV':null
    },
    setSelectedBlocksAsyncResult : [],
    suspiciousWordsHighlight: suspiciousWordsHighlight,
    blockAudiosrcConfig: {

    },

    audioFadeConfig: {

    },
    playingBlock: {
      state: null,
      blockid: null,
      partIdx: null,
      playingPauseAfter: false
    },
    pauseAfterBlockXhr: null,
    pauseLiveDBBlocks: [],// blocks with pending updates, shall be skipped from liveDB updates
    selectionRecount: false,
    modifiedBlockids: []
  }, // end state

  getters: {
    getSelectionModalProgress: state=>state.SelectionModalProgress,
    livedbStatus: state => state.livedbStatus,
    livedbEnabled: state => state.livedbEnabled,
    auth: state => state.auth,
    isLoggedIn: state => state.isLoggedIn,
    isAdmin: state => state.isAdmin,
    isEditor: state => state.isEditor,
    isNarrator: state => state.isNarrator,
    isProofer: state => state.isProofer,
    isLibrarian: state => state.isLibrarian,
    isBookkeeper: state => state.isBookkeeper,
    isEngineer: state => state.isEngineer,
    isReader: state => state.isReader,
    allowPublishCurrentBook: state => state.allowPublishCurrentBook,
    publishButtonStatus: state => state.publishButtonStatus,
    allRolls: state => state.allRolls,
    allBooks: state => {
      if (!state.books_meta) {
        return [];
      }
      state.books_meta.forEach(b => {
        b.pub_ver = b.publishedVersion && b.publishedVersion !== 'false' ? b.publishedVersion : '';
        b.cur_ver = typeof b.version !== 'undefined' && b.version !== b.publishedVersion ? b.version || '1.0' : (b.publishedVersion ? '' : '1.0');

        if (b.hasOwnProperty('publishLog') && b.publishLog != null && b.publishLog != false && b.publishLog != undefined){
          if (b.publishLog.publishTime != false && b.publishLog.publishTime != undefined){
            var pDate = new Date(b.publishLog.publishTime);
            var publishDate = '' + pDate.getFullYear() + '.' + ('0' + (pDate.getMonth() + 1)).slice(-2) + '.' + ('0' + (pDate.getDate() )).slice(-2);
          } else {
            var publishDate = '';
          }

          if (b.publishLog.updateTime != false && b.publishLog.updateTime != undefined){
            var uDate = new Date(b.publishLog.updateTime);
            var updateDate = '' + uDate.getFullYear() + '.' + ('0' + (uDate.getMonth() + 1)).slice(-2) + '.' + ('0' + (uDate.getDate() )).slice(-2);
          } else {
            var updateDate = '';
          }

          if (b.publishedVersion && b.publishedVersion == b.version){
            updateDate = '';
          }

          if (b.pub_ver){
              b.pub_ver = publishDate + ' v. ' + b.pub_ver;
          } else {
                b.pub_ver = publishDate;
          }
          if (b.cur_ver){
              b.cur_ver = updateDate + ' v. ' + b.cur_ver;
          } else {
              b.cur_ver = updateDate;
          }
        } else {
          if (b.pub_ver){
              b.pub_ver = ' v. ' + b.pub_ver;
          }
          if (b.cur_ver){
              b.cur_ver = ' v. ' + b.cur_ver;
          }
        }

        if (b.importStatus == 'staging' && b.blocksCount <= 2){
          if (!b.hasOwnProperty('publishLog') || b.publishLog == null){
            b.importStatus = 'staging_empty'
          } else if (!b.publishLog.updateTime){
            b.importStatus = 'staging_empty'
          }
        }
      });
      return state.books_meta;
    },
    bookSearch: state => state.bookSearch,
    currentBookid: state => state.currentBookid,
    currentBook: state => state.currentBook,
    selectionModalActive: state => state.selectionModalActive,
    currentBookMeta: state => state.currentBookMeta,
    currentBookFiles: state => state.currentBookFiles,
    currentBookBlocksLeft: state => state.currentBookBlocksLeft,
    currentBookBlocksLeftId: state => state.currentBookBlocksLeftId,
    bookEditMode: state => state.editMode,
    allowBookEditMode: state => state.currentBookid,
    allowArchiving: state => state.isProofer,
    tc_currentBookTasks: state => state.tc_currentBookTasks,
    tc_tasksByBlock: state => state.tc_tasksByBlock,
    tc_userTasks: state => state.tc_userTasks,
    audiobookWatch: state => state.audiobookWatch,
    allowCollectionsEdit: state => {
      if (state.currentCollection.isInTheQueueOfPublication) {
        return false;
      }
      return state.isAdmin || state.isLibrarian
    },
    bookCollections: state => state.bookCollections,
    currentCollection: state => state.currentCollection,
    currentCollectionId: state => state.currentCollectionId,
    allowPublishCurrentCollection: state => state.allowPublishCurrentCollection,
    authors: state => {
      let result = [];
      if (state.currentBookMeta.authors) {
        state.currentBookMeta.authors.forEach((author)=>{
          result.push({ text: author.name, text_farsi: authorsLangFarsi[author.name], color: author.color })
        })
      }
      return result;
    },
    libraries: state => state.libraries,
    currentLibrary: state => state.currentLibrary,
    user: state => state.user,
    currentBookCounters: state => state.currentBookCounters,

    isBlocked: state => state.blockers.length > 0,
    blockers: state => state.blockers,
    isBlockLocked: state => (id, partIdx = null) => {
      //if (typeof localStorage === 'undefined') {
        //return false;
      //}
      let locked = false;
      if (state.lockedBlocks.length > 0 && partIdx === null) {
        //let lock = localStorage.getItem('lock_' + id);
        //console.log(lock, id)
        let l = state.lockedBlocks.find(_l => _l._id === id);
        locked = l ? true : false;
      }
      if (!locked && state.aligningBlocks.length > 0) {
        let l = state.aligningBlocks.find(_l => _l._id === id && ((_l.partIdx === partIdx && !(partIdx !== null && _l.split_pending)) || (partIdx === null && _l.split_pending)));
        locked = l ? true : false;
      }
      return locked;
    },
    isBlockOrPartLocked: state => id => {
      let part = state.aligningBlocks.find(b => {
        return b._id === id;
      });
      if (!part) {
        let block = state.storeList.get(id);
        if (block) {
          part = block.isSaving || block.isUpdating;
          if (!part) {
            part = Array.isArray(block.parts) ? block.parts.find(p => {
              return p.isUpdating || p.isSaving;
            }) : false;
          }
        }
      }
      return part ? true : false;
    },
    blockLockType: state => (id) => {
      if (state.aligningBlocks.length > 0) {
        let l = state.aligningBlocks.find(b => {
          return b._id === id;
        });
        if (l) {
          return 'align';
        }
      }
      if (state.lockedBlocks.length > 0) {
        let l = state.lockedBlocks.find(_l => _l._id === id);
        if (l) {
          return l.type;
        }
      }
      return '';
    },

    storeList: state => state.storeList, // global parlist
    storeListO: state => state.storeListO, // global parlistO
    blockSelection: state => state.blockSelection,
    alignCounter: state => state.alignCounter,
    lockedBlocks: state => state.lockedBlocks,
    hasLocks: state => (type) => {
      //console.log(state.lockedBlocks, Object.keys(state.lockedBlocks).length)
      if (type === 'align') {
        return state.aligningBlocks.length > 0;
      } else if (state.lockedBlocks.length > 0) {
        let l = state.lockedBlocks.filter(l => l.type === type)
        return l && l.length > 0;
      } else {
        return false;
      }
    },
    aligningBlocks: state => state.aligningBlocks,
    currentAudiobook: state => state.currentAudiobook,
    currentBookToc: state => state.currentBookToc,
    approveBlocksList: state => state.approveBlocksList,
    taskTypes: state => state.taskTypes,
    adminOrLibrarian: state => state.adminOrLibrarian,
    adminOrProofer: state => state.adminOrProofer,
    hashTagsSuggestions: state => state.hashTagsSuggestions,
    currentJobInfo: state => state.currentJobInfo,
    taskTypes: state => state.taskTypes,
    liveDB: state => state.liveDB,
    bookCategories: state => state.bookCategories,
    bookDifficulties: state => state.bookDifficulties,
    bookDifficultyDefault: state => state.bookDifficultyDefault,
    tasks_counter: state => state.currentJobInfo.tasks_counter,
    jobStatusError: state => state.jobStatusError,
    activeTasksCount: state => {
      let count = 0;
      if (state.adminOrLibrarian && state.currentJobInfo.tasks_counter && Array.isArray(state.currentJobInfo.tasks_counter)) {
        state.currentJobInfo.tasks_counter.forEach(tc => {
          if (tc && tc.data && tc.data.tasks && Array.isArray(tc.data.tasks)) {
            tc.data.tasks.forEach(t => {
              count+= t.count ? parseInt(t.count) : 0;
            });
          }
        });
      }
      return count;
    },
    bookMode: state => state.bookMode,
    allowBookSplitPreview: state => state.allowBookSplitPreview,
    bookSplitDemoTime: state => {
      if (state.currentBookMeta) {
        return state.currentBookMeta.split_demo_time;
      } else {
        return null;
      }
    },
    taskBlockMap: state => {
      return state.taskBlockMap;
    },
    storeListById: (state) => blockid => {
      return state.storeList.get(blockid)
    },
    bookCompleteAudioTime: state => {
      if (state.currentBookMeta) {
        return state.currentBookMeta.complete_audio_time;
      } else {
        return null;
      }
    },
    taskUsers: state => {
      return state.taskUsers;
    },
    audioTasksQueue: state => {
      return state.audioTasksQueue;
    },
    checkRunningAudioTask: state => (check_id) => {
      if (!state.audioTasksQueue.running || check_id !== state.audioTasksQueue.block.blockId || (state.audioTasksQueue.running && state.audioTasksQueue.log.indexOf(state.audioTasksQueue.running.time) === -1)) {
        return false;
      }
      return true;
    },
    audioTasksQueueBlock: state => () => {
      if (state.audioTasksQueue.block.blockId) {
        return state.storeList.get(state.audioTasksQueue.block.blockId);
      } else {
        return null;
      }
    },
    audioTasksQueueBlockOrPart: state => () => {
      if (state.audioTasksQueue.block.blockId) {
        let block = state.storeList.get(state.audioTasksQueue.block.blockId);
        if (block) {
          if (block.getIsSplittedBlock() && state.audioTasksQueue.block.partIdx !== null) {
            return block.parts[state.audioTasksQueue.block.partIdx];
          } else {
            return block;
          }
        }
      }
      return null;
    },
    isAudioEditAligning: state => {
      if (state.audioTasksQueue.block.blockId && state.aligningBlocks.length > 0) {
        let blk = state.aligningBlocks.find(b => {
          return b._id === state.audioTasksQueue.block.blockId && (state.audioTasksQueue.block.partIdx === null || state.audioTasksQueue.block.partIdx === b.partIdx);
        });
        return blk ? true : false;
      }
      return false;
    },
    audioEditorLockedSimultaneous: state => {
      return 'Save or discard text modifications before editing the audio';
    },
    blockLockedSimultaneous: state => {
      return 'Save or discard audio modifications before editing the block';
    },
    coupletSeparator: state => {
      return state.coupletSeparator;
    },
    selectedBlocks: state => {
      return state.selectedBlocks;
    },
    updatingNumeration: state => {
      return state.updatingNumeration;
    },
    currentBookCollection: state => {
      if (Array.isArray(state.bookCollections) && state.currentBookMeta && state.currentBookMeta.collection_id) {
        let collection = state.bookCollections.find(c => {
          return c._id === state.currentBookMeta.collection_id;
        });
        return collection ? collection : {};
      }
      return {};
    },
    allowAlignBlocksLimit: state => {
      return state.allowAlignBlocksLimit;
    },
    alignBlocksLimit: state => {
      return state.alignBlocksLimit;
    },
    alignBlocksLimitMessage: state => {
      if (!state.allowAlignBlocksLimit) {
        return `Сoncurrent alignment capacity is limited to ${state.alignBlocksLimit} blocks`;
      }
      return '';
    },
    filteredSelectedBlocks: state => {
      switch (state.bookMode) {
        case 'edit':
        case 'proofread':
          return state.selectedBlocks;
          break;
        case 'narrate':
          let filteredSelectedBlocks = [];
          state.selectedBlocks.forEach(block => {
            if (block.allowNarrate(state.bookMode)) {
              filteredSelectedBlocks.push(block);
            }
          });
          return filteredSelectedBlocks;
          break;
      }
      return [];
    },
    suspiciousWordsHighlight: state => {
      return state.suspiciousWordsHighlight;
    },
    blockAudiosrcConfig: state => {
      return state.blockAudiosrcConfig;
    },
    audioFadeConfig: state => {
      return state.audioFadeConfig;
    },
    playingBlock: state => {
      return state.playingBlock;
    },
    bookMetaById: state => (bookId) => {
      if (!state.books_meta) {
        return null;
      }
      return state.books_meta.find(meta => meta.bookid == bookId);
    },

    isBookWasPublishedInCollection: state => (payload) => {
      //console.log(`isBookWasPublishedInCollection: `, payload.bookId, payload.currCollId);
      const {bookId, currCollId = false} = payload;
      const prevCollection = state.bookCollectionsAll.find(collection => {
        const { pubBooksEntities = [] } = collection;
        if (pubBooksEntities.length == 0) return false;
        return pubBooksEntities.find((pubBook)=>{
          return pubBook.bookId === bookId
        });
      });
      //console.log(`prevCollection: `, prevCollection);
      if (prevCollection) {
        if (currCollId && currCollId === prevCollection._id) {
          return false;
        }
        const res = prevCollection.pubBooksEntities.find((book)=>book.bookId===bookId);
        res.title = prevCollection.title;
        res._id = prevCollection._id;
        return res;
      } else return false;
    },

    selectionRecount: state => state.selectionRecount,
    isBookReaderCategory: (state, getters) => {
      if (!state.currentBookMeta) {
        return false;
      }
      let checkItem = state.currentBookMeta;
      if (state.currentBookMeta.collection_id && getters.currentBookCollection._id) {
        checkItem = getters.currentBookCollection;
      }
      if (checkItem.alt_meta) {
        return checkItem.alt_meta.reader && checkItem.alt_meta.reader.category ? true : false;
      }
      let categories = Array.isArray(state.bookCategories) ? state.bookCategories.find(category => {
        return category.group === 'Reader';
      }) : null;
      return categories && categories.categories.includes(checkItem.category);
    },
    selectedBlocksData: state => {
      let data = [];
      if (state.blockSelection.start._id && state.blockSelection.end._id) {
        let crossId = state.blockSelection.start._id;
        for (let idx = 0; idx < state.storeList.size; idx++) {
          let block = state.storeList.get(crossId);
          if (block) {
            data.push(block);
            if (block._id === state.blockSelection.end._id) {
              break;
            }
            crossId = state.storeListO.getOutId(block.blockid);
          } else break;
        }
      }
      return data;
    },
    modifiedBlockids: state => {
      return state.modifiedBlockids;
    },
    getBookByIdAlias: state => (bookid_alias = null) => {
      if (bookid_alias && state.books_meta.length) {
        const book = state.books_meta.find((book)=>{
          return bookid_alias === book.bookid_alias
        })
        return book && book.bookid ? book.bookid : null;
      }
      return null;
    }
  },

  mutations: {
    SET_LIVEDB_CHECKBOX(state,checkbox) {
      state.liveDB.stop();
      if(checkbox){
        state.livedbEnabled = true;
        state.liveDB = new liveDB((status) => {
          if( store.state.livedbStatus!=null && status){
            state.liveDB.stopWatch('metaV');
            store.dispatch('liveDBMetaUpdate');
          }
          store.state.livedbStatus = status;
        })

      }else{
        state.livedbEnabled = false;
        store.state.livedbStatus = false;
      }
    },

    SET_AUDIO_RENAMING(state, status) {
      state.audioRenaming = status;
    },

    set_localDB (state, payload) {
        state[payload.dbProp] = new PouchDB(payload.dbName, POUCH_CFG);
    },

    set_remoteDB (state, payload) {
        let dbPath = superlogin.getDbUrl(payload.dbName);
        if (process.env.DOCKER) {
            dbPath = dbPath.replace('couchdb', 'localhost')
        }
        state[payload.dbProp] = new PouchDB(dbPath, POUCH_CFG);
    },

    set_currentAudiobook (state, audiobook) {
      state.currentAudiobook = audiobook;
      //console.log('CURRENT AUDIOBOOK', state.currentAudiobook)
    },

    // initiateBooks (state, books) {
    //   state.books = books
    //   if (state.route.params.hasOwnProperty('bookid')) state.currentBookid = state.route.params.bookid
    // },

    SET_CURRENTBOOK (state, book) {
      state.currentBook = book
    },

    SET_CURRENTBOOK_ID (state, bookId) {
      state.currentBookid = bookId;
    },

    SET_CURRENTBOOK_META (state, meta) {
      // console.log('SET_CURRENTBOOK_META', state.currentBookMeta, meta);
      // state.currentBookid = meta._id
      // state.currentBook = book
      // state.currentBook_dirty = false
      // state.currentBookMeta_dirty = false
      if (!meta || (state.currentBookMeta && state.currentBookMeta.bookid !== meta.bookid)) {
        this.commit('clear_blockSelection');
      }
      if (meta) {
        if (meta.publishedVersion === 'false') {
          meta.publishedVersion = false;
        }
        if (meta.voices instanceof Object) {
          Object.keys(meta.voices).forEach(k => {
            if (k.indexOf('@') === 0) {// remove service parameters from voices object
              delete meta.voices[k];
            }
          });
        }
        let checkVoiceDefaults = false;
        if (state.currentBookMeta && meta && state.currentBookMeta.bookid === meta.bookid) {
          checkVoiceDefaults = true;
          if (state.currentBookMeta.voices && !meta.voices) {
            meta.voices = state.currentBookMeta.voices;
          }
        }
        if (meta.styles instanceof Object) {
          Object.keys(meta.styles).forEach(k => {
            if (k.indexOf('@') === 0) {
              delete meta.styles[k];
            }
          });
        }
        if (!meta.styles || (meta.styles && Object.keys(meta.styles).length === 0)) {
          meta.styles = {
            global: ''
          };
        }
        if (!Array.isArray(meta.child_books)) {
          meta.child_books = [];
        }
        if (state.books_meta && Array.isArray(state.books_meta) && state.books_meta.length > 0) {
          let index = state.books_meta.findIndex(obj => {
            return obj.bookid === meta.bookid;
          });
          if (index) {
            state.books_meta[index] = state.books_meta[index] ? Object.assign(state.books_meta[index], meta) : meta;
            state.books_meta.push(meta)
            state.books_meta.pop();// force re draw lists
          }
        }
        /*Object.keys(meta).forEach(k => {
          if (!_.isEqual(meta[k], state.currentBookMeta[k])) {
            //console.log(`${k}: "${JSON.stringify(state.currentBookMeta[k])}" to "${JSON.stringify(meta[k])}"`);
            //state.currentBookMeta[k] = meta[k];
          }
        });*/
        state.currentBookMeta = meta;
        state.currentBookMeta._id = meta.bookid;
        state.currentBookid = meta.bookid
        if (!state.currentBookMeta.isMastered) {
          state.currentBookMeta.isMastered = false;
        }
        if (!state.currentBookMeta.numbering) {
          state.currentBookMeta.numbering = 'x_x';
        }
        if (meta.hasOwnProperty('collection_id') && (!meta.collection_id || meta.collection_id === null || meta.collection_id.length == 0)) {
          state.currentBookMeta.collection_id = false;
        }
        if (meta.hasOwnProperty('coverimgURL')) {
          this.commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileURL: meta.coverimgURL});
        } else {
          this.commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileURL: false});
        }
        if (checkVoiceDefaults) {
          this.commit('ttsModule/set_book_defaults');
        }
      } else {
        state.currentBookMeta = {};
        state.currentBookid = '';
        this.dispatch('stopWatchLiveQueries');
      }
      this.commit('set_currentbook_executors');
    },

//     CLEAN_CURRENTBOOK_FILES (state) {
//       state.currentBookFiles = {coverimg: false};
//     },

    SET_CURRENTBOOK_FILES (state, fileObj) {
      if (fileObj && fileObj.fileURL) {
        //state.currentBookFiles[fileObj.fileName] = process.env.ILM_API + fileObj.fileURL + '?time='  + Date.now();
        state.currentBookFiles[fileObj.fileName] = process.env.ILM_API + fileObj.fileURL + '?v=' + (state.currentBookMeta['@version'] || Date.now());
      } else state.currentBookFiles[fileObj.fileName] = false;
      //console.log(`state.currentBookFiles[${fileObj.fileName}] : `, state.currentBookFiles[fileObj.fileName] );
    },

    SET_CURRENT_COLLECTION (state, _id) {
      //console.log(`SET_CURRENT_COLLECTION: `, _id);
      let currentCollection = null;
      if (_id) {
        let collection = state.bookCollections.find(c => {
          return c._id === _id;
        });
        if (collection) {
          currentCollection = collection;
        }
      }
      if (!(currentCollection instanceof Collection)) {
        currentCollection = new Collection({});
      }
      state.currentCollection = currentCollection;
      if (state.currentCollection) state.currentCollection.sortBooks();
      state.currentCollectionId = _id;
    },

    SET_CURRENT_LIBRARY (state, library) {
      state.currentLibrary = library;
      state.currentLibraryId = library._id ? library._id : false;
    },

    SET_CURRENTBOOKBLOCKS_LEFT (state, blocksCount) {
      state.currentBookBlocksLeft = blocksCount;
    },

    SET_CURRENTBOOKBLOCKS_LEFT_ID (state, blockId) {
      state.currentBookBlocksLeftId = blockId;
    },

    setEditMode (state, editMode) {
      state.editMode = editMode
    },

    SET_BOOKLIST (state, books) {
      state.books_meta = books;
      this.commit('set_currentbook_executors');
      this.commit('PREPARE_BOOK_COLLECTIONS');
    },

    RESET_LOGIN_STATE (state) {
      state.isLoggedIn = superlogin.authenticated()
      state.isAdmin = superlogin.confirmRole('admin')
      state.isEditor = superlogin.confirmRole('editor')
      state.isNarrator = superlogin.confirmRole('narrator')
      state.isProofer = superlogin.confirmRole('proofer')
      state.isLibrarian = superlogin.confirmRole('librarian')
      state.isBookkeeper = superlogin.confirmRole('bookkeeper')
      state.isEngineer = superlogin.confirmRole('engineer')
      state.isReader = superlogin.confirmRole('reader')
      // state.allRolls =
      let session = superlogin.getSession();
      Vue.prototype.user_id = session ? session.user_id : null;
    },

    SET_CURRENTBOOK_META_RAW (state, meta) {
      state.currentBookMeta = meta
    },

    TASK_LIST_LOADED (state) {
      let tc_userTasks = 0;
      state.tc_tasksByBlock = {};
      state.tc_currentBookTasks = {"tasks": [], "job": {}, "assignments": [], "can_resolve_tasks": [], "is_proofread_unassigned": false};
      for (let jobid in state.tc_userTasks.list) {
        let job = Object.assign({}, state.tc_userTasks.list[jobid])
        tc_userTasks+= job.tasks.length
        if (job.bookid == state.currentBookid) {
          /*if (t.comment) {
            t.comment = t.comment.replace('\n', '<br>');
          }
          if (t.blockid) {
            state.tc_tasksByBlock[t.blockid] = t
          }*/
          let assignments = []
          job.tasks.forEach(t => {
            switch (t.type) {
              case 'text-cleanup': // cleanup text
                assignments.push('metadata');
                assignments.push('metadata_cleanup');
                assignments.push('content');
                assignments.push('content_cleanup');
                if (job.type == 'with-audio') {
                  if (!state.currentBookMeta.hasMasteredAudio) {
                    assignments.push('upload_audio');
                  }
                }
                break;
              case 'narrate-block':
              case 'fix-block-narration':
                if (assignments.indexOf('block_narrate') === -1) {
                  assignments.push('block_narrate');
                }
                break;
              case 'master-audio':
                assignments.push('audio_mastering');
                break;
              case '': // approve book
                assignments.push('content');
                assignments.push('content_approve');
                break;

            }
            if (t.blockid) {
              state.tc_tasksByBlock[t.blockid] = t;
            }
          })
          state.tc_currentBookTasks = {job: job, tasks: job.tasks, assignments: assignments, can_resolve_tasks: job.can_resolve_tasks ? job.can_resolve_tasks : [], is_proofread_unassigned: job.is_proofread_unassigned ? job.is_proofread_unassigned : false}
        }
      }
      state.tc_userTasks.total = tc_userTasks;
      this.commit('set_taskBlockMap');
    },
    PREPARE_BOOK_COLLECTIONS(state) {
      state.bookCollections = [];
      if (state.isAdmin || state.isLibrarian) {
        state.bookCollections = state.bookCollectionsAll;
      } else if (state.tc_userTasks) {
        let collections = [];
        for (let jobid in state.tc_userTasks.list) {
          state.bookCollectionsAll.forEach(c => {
            if (c.books && typeof c.books[state.tc_userTasks.list[jobid].bookid] !== 'undefined') {
              if ((state.tc_userTasks.list[jobid].tasks && state.tc_userTasks.list[jobid].tasks.length > 0) || state.tc_userTasks.list[jobid].completed_tasks > 0) {
                let exists = collections.find(_c => _c._id === c._id);
                if (!exists) {
                  collections.push(c);
                }
              }
            }
          });
        }
        state.bookCollections = collections;
      }
      let booksList = this.getters.allBooks;
      state.bookCollections.forEach((c, idx) => {
        let pages = 0;
        let books = [];
        if (c.bookids && Array.isArray(c.bookids)) {
          c.bookids.forEach(b => {
            let book = booksList.find(_b => _b.bookid === b);
            if (book) {
              pages+= book.wordcount ? Math.round(book.wordcount / 300) : 0;
              books.push(book);
            }
          });
        }

        c.pages = pages;
        if (c.coverimgURL && c.coverimgURL.indexOf('http') !== 0) {
          c.coverimgURL = process.env.ILM_API + c.coverimgURL;
        }
        c.books_list = books;
        state.bookCollections[idx] = new Collection(c);
        //state.bookCollections[idx].sortBooks();
      });
      //if (state.currentCollectionId && !state.currentCollection._id) {
        this.commit('SET_CURRENT_COLLECTION', state.currentCollectionId);
      //}
    },
    SET_ALLOW_BOOK_PUBLISH(state, allow) {
      state.allowPublishCurrentBook = allow;
    },
    SET_BOOK_PUBLISH_BUTTON_STATUS(state, status) {
      state.publishButtonStatus = status;
    },
    // TODO: use next two mutations instead of previous two
    CHECK_SET_ALLOW_BOOK_PUBLISH(state) {// change property status with check
      this.commit('SET_ALLOW_BOOK_PUBLISH', state.currentJobInfo.workflow.status !== 'archived' && state.adminOrLibrarian);
    },
    CHECK_SET_BOOK_PUBLISH_BUTTON_STATUS(state) {// change property status with check
      let publishButton = state.currentJobInfo.text_cleanup === false && !(typeof state.currentBookMeta.version !== 'undefined' && state.currentBookMeta.version === state.currentBookMeta.publishedVersion);
      this.commit('SET_BOOK_PUBLISH_BUTTON_STATUS', publishButton);
    },
    // END TODO
    SET_ALLOW_COLLECTION_PUBLISH(state, allow) {
      state.allowPublishCurrentCollection = allow;
    },
    SET_LIBRARIES(state, libraries) {
      if (state.isAdmin) {
        state.libraries = libraries;
      } else if (state.isLibrarian) {
        let libraries_list = [];
        libraries.forEach(l => {
          if (l.librarians) {
            let librarian = l.librarians.find(l => l.id == state.auth.getSession().user_id);
            if (librarian) {
              libraries_list.push(l)
            }
          }
        });
        state.libraries = libraries_list;
      } else {
        state.libraries = [];
      }
    },

    SET_CURRENTBOOK_COUNTER(state, counter) {
      state.currentBookCounters[counter.name] = counter.value;
    },

    set_blocker (state, bName) {
      if (state.blockers.indexOf(bName) == -1) state.blockers.push(bName);
    },
    clear_blocker (state, bName) {
      let idx = state.blockers.indexOf(bName);
      //console.log('clear_blocker', bName, idx, state.blockers);
      if (idx > -1) state.blockers.splice(idx, 1);
    },
    add_block_lock(state, data) {
      if (data.block) {
        if (typeof localStorage !== 'undefined') {
          data.set_at = Date.now()
          let lock = localStorage.getItem('lock_' + data.block.blockid);
          if (lock) {
            try {
              lock = JSON.parse(lock);
              if (lock.watch && data.watch) {
                lock.watch.forEach(w => {
                  if (data.watch.indexOf(w) === -1) {
                    data.watch.push(w);
                  }
                });
              }
              if (lock.type && data.type && lock.type !== data.type) {
                return;
              }
            } catch(err) {
              lock = data;
            }
            lock = Object.assign(lock, data);
          } else {
            lock = data;
          }
          //localStorage.setItem('lock_' + data.block.blockid, JSON.stringify(lock));
          let r = state.lockedBlocks.find(l => {
            return l._id === data.block.blockid && (!data.type || l.type === data.type);
          });
          if (!r) {
            state.lockedBlocks.push({_id: data.block.blockid, type: lock.type});
          }
        }
      }
    },
    clear_block_lock(state, data) {
      if (data.block.blockid) {
        let remove_lock = () => {
          let rIndex = state.lockedBlocks.findIndex(l => {
            return l._id === data.block.blockid && (!data.type || l.type === data.type);
          });
          if (rIndex >= 0) {
            state.lockedBlocks.splice(rIndex, 1);
          }
        };
        if (typeof localStorage !== 'undefined') {
          /*let lock = state.blockLocks[data.block._id];
          if (lock) {
            if (lock.block._rev !== data.block._rev) {
              delete state.blockLocks[data.block._id];
            }
          }*/
          let lock = localStorage.getItem('lock_' + data.block.blockid);
          if (lock) {
            try {
              lock = JSON.parse(lock);
            } catch(err) {
              localStorage.removeItem('lock_' + data.block.blockid);
              //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                //delete state.lockedBlocks[data.block._id];
              //}
              //state.lockedBlocks = [];
              //let r = state.lockedBlocks.find(l => l._id === data.block._id);
              //if (r) {
                //state.lockedBlocks.splice(state.lockedBlocks.indexOf(r), 1);
              //}
              remove_lock();
              return;
            }
            if (data.force) {
              localStorage.removeItem('lock_' + data.block.blockid)
              //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                //delete state.lockedBlocks[data.block._id];
              //}
              //state.lockedBlocks = [];
              remove_lock();
            } else if (lock.watch && lock.watch.length) {
              let watch = [];
              lock.watch.forEach((w, i) => {
                if (_.isEqual(lock.block[w], data.block[w])) {
                  watch.push(lock.watch[i]);
                } else {
                  //console.log('WATCH CHANGED, OLD', lock.block[w], 'NEW', data.block[w])
                }
              });
              lock.watch = watch;
              if (lock.watch.length == 0) {
                localStorage.removeItem('lock_' + data.block.blockid);
                //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                  //delete state.lockedBlocks[data.block._id];
                //}
                //state.lockedBlocks = [];
                remove_lock();
              } else {
                //localStorage.setItem('lock_' + data.block.blockid, JSON.stringify(lock));
                //state.lockedBlocks[data.block._id] = {type: lock.type};
                let r = state.lockedBlocks.find(l => l._id === data.block.blockid);
                if (!r) {
                  state.lockedBlocks.push({_id: data.block.blockid, type: lock.type});
                }
              }
            } else if (lock.block._rev !== data.block._rev) {
              localStorage.removeItem('lock_' + data.block.blockid);
              //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                //delete state.lockedBlocks[data.block._id];
              //}
              //state.lockedBlocks = [];
              remove_lock();
            }
            if (lock.set_at && Date.now() - lock.set_at > 30 * 60 * 1000) {
              localStorage.removeItem('lock_' + data.block.blockid);
              //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                //delete state.lockedBlocks[data.block._id];
              //}
              //state.lockedBlocks = [];
              remove_lock();
            }
          } else {
            remove_lock();
          }
        }
      }
    },
    check_block_lock (state, data) {
      if (data.block && data.block.blockid) {
        if (typeof localStorage !== 'undefined') {
          if (localStorage.hasOwnProperty('lock_' + data.block.blockid)) {
            try {
              let item = localStorage.getItem('lock_' + data.block.blockid);
              item = JSON.parse(item);
              //state.lockedBlocks[data.block._id] = {type: item.type};
              let r = state.lockedBlocks.find(l => l._id === data.block.blockid);
              if (!r) {
                state.lockedBlocks.push({_id: data.block.blockid, type: item.type});
              }
            } catch(err) {

            }
          }
        }
      }
    },
    set_aligning_blocks(state, blocks = []) {
      state.aligningBlocks = [];
      if (blocks.length) blocks.forEach(b => {
        state.aligningBlocks.push({_id: b.blockid ? b.blockid : b._id, partIdx: b.partIdx, split_pending: b.split_pending ? true : false, voicework: b.voicework});
      });
    },
    add_aligning_block(state, block) {
      state.aligningBlocks.push({_id: block.blockid ? block.blockid : block._id, partIdx: block.partIdx, split_pending: block.split_pending ? true : false});
    },
    set_storeList (state, blockObj) {
      //console.log('set_storeList', Date.now());
      if (state.storeList) {
        let firstObj = state.storeList.values().next().value;
        if (!(firstObj && firstObj.bookid == blockObj.bookid)) {
          state.storeList = new Map();
        }
      } else {
        state.storeList = new Map();
      }

      state.storeList.set(blockObj.blockid, blockObj);
      state.storeListUpdateCounter +=1;
    },

    clear_storeList (state) {
      state.storeList = new Map();
    },

    clear_storeListO (state) {
      state.storeListO = new BookBlocks();
    },

    reset_storeListO (state) {
      state.storeListO.startRId = state.storeListO.listRIds[0] || false;
      state.storeListO.startId = state.storeListO.listIds[0] || false;
    },

    // async set_block_selection({ state, commit, dispatch },selection) {
    //   console.log('set_block_selection:start')
    //
    //   state.blockSelection.start = typeof selection.start !== 'undefined' ? selection.start : {};
    //   state.blockSelection.end = typeof selection.end !== 'undefined' ? selection.end : {};
    //   const blockIdRgx = /.*(?:\-|\_){1}([a-zA-Z0-9]+)$/;
    //
    //   if (state.blockSelection.start._id) {
    //     let _id_short = blockIdRgx.exec(state.blockSelection.start._id);
    //     _id_short = (_id_short && _id_short.length == 2) ? _id_short[1] : state.blockSelection.start._id;
    //     if (_id_short.length > 7) {
    //       _id_short = _id_short.substr(0, 4) + '...' + _id_short.substr(_id_short.length - 4, 4);
    //     }
    //     state.blockSelection.start._id_short = _id_short;
    //   }
    //   if (state.blockSelection.end._id) {
    //     let _id_short = blockIdRgx.exec(state.blockSelection.end._id);
    //     _id_short = (_id_short && _id_short.length == 2) ? _id_short[1] : state.blockSelection.end._id;
    //     if (_id_short.length > 7) {
    //       _id_short = _id_short.substr(0, 4) + '...' + _id_short.substr(_id_short.length - 4, 4);
    //     }
    //     state.blockSelection.end._id_short = _id_short;
    //   }
    //   console.log('set_block_selection:end')
    //
    //   await dispatch('set_selected_blocks');
    //   // resolve();
    // },

    set_align_counter(state, counter) {
      state.alignCounter.count = typeof counter.count !== 'undefined' ? counter.count : 0;
      state.alignCounter.countTTS = typeof counter.countTTS !== 'undefined' ? counter.countTTS : 0;
      state.alignCounter.countAudio = typeof counter.countAudio !== 'undefined' ? counter.countAudio : 0;
      state.alignCounter.blocks = typeof counter.blocks !== 'undefined' ? counter.blocks : [];
      //let countAudio = state.alignCounter.count - state.alignCounter.countTTS;
      //state.alignCounter.countAudio = countAudio >= 0 ? countAudio : 0;
      this.commit('set_allowAlignBlocksLimit');
    },
    set_job_status_error(state, error) {
      state.jobStatusError = error;
    },

    set_book_mode(state, mode) {
      state.bookMode = mode || null;
      // this.dispatch('set_selected_blocks');
    },

    set_taskBlockMap(state) {

      let taskMap = {};
      state.tc_tasksByBlock = {};
      [...state.tc_currentBookTasks.tasks, ...state.currentJobInfo.can_resolve_tasks].forEach(t => {
        //console.log(`${t.blockid}, ${t.type}`)
        if (typeof taskMap[t.type] === 'undefined') {
          taskMap[t.type] = {next: null, prev: null, blocks: []};
        }
        taskMap[t.type].blocks.push({blockId: t.blockid, blockRid: t.block});
        state.tc_tasksByBlock[t.blockid] = t;
      });
      state.taskBlockMap.map = taskMap;
      state.taskBlockMap.refresh = Date.now();
    },

    set_taskBlockMapAllowNext(state, allow) {
      state.taskBlockMap.allowNext = allow;
    },
    set_updateAudiobookProgress(state, val) {
      state.updateAudiobookProgress = val ? true : false;
    },
    set_couplet_separator(state, val) {
      state.coupletSeparator = val;
    },
    // async set_selected_blocks(context) {
    //   debugger
    //   if(context.storeList.size>5){
    //     return await context.dispatch('set_selected_blocksAsync');
    //
    //      // state.set_selected_blocksAsync(state);
    //   }
    //   let blockList = [];
    //   if (context.blockSelection.start && context.blockSelection.start._id && context.blockSelection.end && context.blockSelection.end._id) {
    //     let crossId = context.blockSelection.start._id;
    //     for (let idx = 0; idx < context.storeList.size; idx++) {
    //       let block = context.storeList.get(crossId);
    //       if (block) {
    //         blockList.push(block);
    //
    //         if (block.blockid == context.blockSelection.end._id) {
    //           break;
    //         }
    //         crossId = ccontext.storeListO.getOutId(block.blockid);
    //         if (!crossId) {
    //           break;
    //         }
    //       } else break;
    //     }
    //   }
    //   context.selectedBlocks = blockList;
    // },

    set_currentbook_executors(state) {
      if (state.currentBookMeta && state.currentBookMeta._id) {
        if (!state.currentBookMeta.executors) {
          let book = state.books_meta.find(book => {
            return book.bookid === state.currentBookMeta._id;
          });
          if (book) {
            state.currentBookMeta.executors = book.executors;
          }
        }
      }
    },

    updateBookExecutors(state, [bookid, executors]) {
      let bookIndex = state.books_meta.findIndex(book => {
        return book.bookid === bookid;
      });
      if (bookIndex !== -1) {
        state.books_meta[bookIndex].executors = executors;
        this.commit('set_currentbook_executors');
      }
    },
    set_alignBlocksLimit(state, value) {
      state.alignBlocksLimit = value;
      this.commit('set_allowAlignBlocksLimit');
    },

    set_allowAlignBlocksLimit(state) {
      state.allowAlignBlocksLimit = state.alignBlocksLimit ? state.alignCounter.countAudio <= state.alignBlocksLimit : true;
    },

    set_user(state, user) {
      state.user = user;
    },

    set_blockAudiosrcConfig(state, audiosrc_config) {
      state.blockAudiosrcConfig = audiosrc_config;
    },

    set_audioFadeConfig(state, config) {
      state.audioFadeConfig = config;
    },

    clear_blockSelection(state) {
      if (state.blockSelection.start._id && state.blockSelection.end._id) {
        let idsArrayRange = state.storeListO.ridsArrayRange(state.blockSelection.start._id, state.blockSelection.end._id);
        idsArrayRange.forEach((blockRid)=>{
          let oBlock = state.storeListO.get(blockRid);
          if (oBlock) {
            oBlock.checked = false;
          }
        });
        this.dispatch('setBlockSelection', {start: {}, end: {}});
      }
    },
    pause_liveDBBlock(state, [blockId, blockRid]) {
      let index = state.pauseLiveDBBlocks.findIndex(record => {
        return record.blockid === blockId;
      });
      if (index === -1) {
        state.pauseLiveDBBlocks.push({
          blockid: blockId,
          rid: blockRid
        });
      }
    },
    resume_liveDBBlock(state, blockId, blockRid) {
      let index = state.pauseLiveDBBlocks.findIndex(record => {
        return record.blockid === blockId;
      });
      if (index !== -1) {
        setTimeout(() => {
          state.pauseLiveDBBlocks.splice(index, 1);
        }, 500);// server's timeout for update
      }
    },
    set_publicationErrors(state, [update_blocks = []]) {
      this.commit('publishModule/set_publicationErrors', [update_blocks]);
    },
    block_removed(state, [block]) {
      this.commit('publishModule/block_removed', block);
    },
    add_modified_block(state, blockid) {
      if (!state.modifiedBlockids.includes(blockid)) {
        state.modifiedBlockids.push(blockid);
      }
    },
    remove_modified_block(state, blockid) {
      let blockidIndex = state.modifiedBlockids.indexOf(blockid);
      if (blockidIndex !== -1) {
        state.modifiedBlockids.splice(blockidIndex, 1);
      }
    }
  },

  actions: {
    async selectionModalDisable({ state, commit, dispatch }) {
      state.selectionModalActive = false;
    },
    async selectionModalDisableShow({ state, commit, dispatch }) {
      state.selectionModalActive = true;
    },
    async setSelectionModalProgressWidth({ state, commit, dispatch },value = 0 ) {
      value = Math.round(value);
      state.SelectionModalProgress = value>=100?100:value;
    },

    async set_block_selection({ state, commit, dispatch },selection) {

      state.blockSelection.start = typeof selection.start !== 'undefined' ? selection.start : {};
      state.blockSelection.end = typeof selection.end !== 'undefined' ? selection.end : {};
      const blockIdRgx = /.*(?:\-|\_){1}([a-zA-Z0-9]+)$/;

      if (state.blockSelection.start._id) {
        let _id_short = blockIdRgx.exec(state.blockSelection.start._id);
        _id_short = (_id_short && _id_short.length == 2) ? _id_short[1] : state.blockSelection.start._id;
        if (_id_short.length > 7) {
          _id_short = _id_short.substr(0, 4) + '...' + _id_short.substr(_id_short.length - 4, 4);
        }
        state.blockSelection.start._id_short = _id_short;
      }
      if (state.blockSelection.end._id) {
        let _id_short = blockIdRgx.exec(state.blockSelection.end._id);
        _id_short = (_id_short && _id_short.length == 2) ? _id_short[1] : state.blockSelection.end._id;
        if (_id_short.length > 7) {
          _id_short = _id_short.substr(0, 4) + '...' + _id_short.substr(_id_short.length - 4, 4);
        }
        state.blockSelection.end._id_short = _id_short;
      }

      await dispatch('set_selected_blocks');
      // resolve();
    },
    set_selected_blocksAsyncIteration({commit, state, dispatch},payload) {
      let idx = payload.idx;
      let size = payload.size;
      let crossId = payload.crossId;
      let resolve = payload.resolve;
      let iterationCount = 0;
      let iterationMax = 50;
      let status = 'ok';

      // let name = 'SelectionModalProgressIterations';
      // let nameEQ = name + "=";
      // let ca = document.cookie.split(';');
      // for(let i=0;i < ca.length;i++) {
      //   let c = ca[i];
      //   while (c.charAt(0)==' ') c = c.substring(1,c.length);
      //   if (c.indexOf(nameEQ) == 0) {
      //     iterationMax = parseInt(c.substring(nameEQ.length,c.length));
      //   }
      // }

      while (iterationCount<iterationMax && idx<=size && status == 'ok'){


        let block = state.storeList.get(crossId);
        if (block) {
          state.setSelectedBlocksAsyncResult.push(block);

          if (block.blockid == state.blockSelection.end._id) {
            status = 'break';
          }
          crossId = state.storeListO.getOutId(block.blockid);
          if (!crossId) {
            status = 'break';
          }
        }
        else{
          status = 'break';
        }
        iterationCount++;
        idx++;
      }

      let width = Math.ceil(idx/(size/100));
      width = (34*1)+34*(width/100);

      dispatch('setSelectionModalProgressWidth',width)
      //console.log(`set_selected_blocksAsyncIteration ${idx}`)

      if(idx<=size && status == 'ok'){
        setTimeout( function() {
          dispatch('set_selected_blocksAsyncIteration',{idx, size,crossId,resolve}) },50);
      }else{
        resolve();
      }
    },


    async set_selected_blocksAsync({commit, state, dispatch}) {

      state.setSelectedBlocksAsyncResult = [];
      // dispatch('setSelectionModalProgressWidth')

      let promises = [];

      if (state.blockSelection.start && state.blockSelection.start._id && state.blockSelection.end && state.blockSelection.end._id) {
        let crossId = state.blockSelection.start._id;
        let this_ = this;
        promises.push(new Promise((resolve, reject) => {
          let size = state.storeList.size;
          let idx = 0;
          dispatch('set_selected_blocksAsyncIteration',{idx,size, crossId,resolve})
        }))
      }
      return Promise.all(promises).then(function() {
        state.selectedBlocks = state.setSelectedBlocksAsyncResult;
      });


    },

    async set_selected_blocks({ state, commit, dispatch }) {
      // debugger
      // if(state.storeList.size>5){
        return await dispatch('set_selected_blocksAsync');

        // state.set_selected_blocksAsync(state);
      // }
      let blockList = [];
      if (state.blockSelection.start && state.blockSelection.start._id && state.blockSelection.end && state.blockSelection.end._id) {
        let crossId = state.blockSelection.start._id;
        for (let idx = 0; idx < state.storeList.size; idx++) {
          let block = state.storeList.get(crossId);
          if (block) {
            blockList.push(block);

            if (block.blockid == state.blockSelection.end._id) {
              break;
            }
            crossId = state.storeListO.getOutId(block.blockid);
            if (!crossId) {
              break;
            }
          } else break;
        }
      }
      state.selectedBlocks = blockList;

    },
    setAudioRenamingStatus({ state, commit, dispatch },status) {
      commit('SET_AUDIO_RENAMING',status);
    },

    emptyDB (context) {
      //PouchDB('ilm_content_meta').destroy()
    },

    // login event
    connectDB ({ state, commit, dispatch }, session) {

        // check if any response contains 401
        axios.interceptors.response.use(function (response) {
            return response;
          }, function (error) {
            let session = state.auth.getSession();
            if ((error.response && error.response.status === 401) && session && session.token) {// if response is absent then it means that server is stopped
              location.href = '/';
            } else {
              return Promise.reject(error);
            }
          });

        dispatch('startJobInfoTimer');
        state.liveDB.setSubscriberId(state.auth.getSession().token);
        state.adminOrLibrarian = superlogin.confirmRole('admin') || superlogin.confirmRole('librarian');
        state.adminOrProofer =  superlogin.confirmRole('admin') || superlogin.confirmRole('proofer');
        commit('RESET_LOGIN_STATE');

        //commit('set_localDB', { dbProp: 'metaDB', dbName: 'metaDB' });
        //commit('set_localDB', { dbProp: 'contentDB', dbName: 'contentDB' });
        //commit('set_localDB', { dbProp: 'tasksDB', dbName: 'tasksDB' });
        //commit('set_localDB', { dbProp: 'librariesDB', dbName: 'librariesDB' });

        //commit('set_remoteDB', { dbProp: 'metaRemoteDB', dbName: ILM_CONTENT_META });
        //commit('set_remoteDB', { dbProp: 'contentRemoteDB', dbName: ILM_CONTENT });
        //commit('set_remoteDB', { dbProp: 'filesRemoteDB', dbName: ILM_CONTENT_FILES });
        //commit('set_remoteDB', { dbProp: 'tasksRemoteDB', dbName: ILM_TASKS });
        //commit('set_remoteDB', { dbProp: 'librariesRemoteDB', dbName: ILM_LIBRARIES });

        // state.librariesDB.replicate.from(state.librariesRemoteDB)
        //   .on('complete', () => {
        //     dispatch('updateLibrariesList');
        //     state.librariesDB.sync(state.librariesRemoteDB, {live: true, retry: true})
        //       .on('change', () => {
        //         dispatch('updateLibrariesList');
        //     });
        //   });

        axios.get(state.API_URL + 'me')
          .then(response => {
            if (response) {
              if (response.status == 200) {
                state.user = response.data;
              }
            }
          })
          .catch(err => console.log(err));

        axios.get(state.API_URL + 'hashTags')
          .then(response => {
            if (response) {
              if (response.status == 200) {
                state.hashTagsSuggestions = response.data;
                //console.log('hashTags', response.data);
              }
            }
          })
          .catch(err => console.log(err));

        dispatch('getTaskTypes')
          .then(() => {
            dispatch('tc_loadBookTask', 'all');
          });

        dispatch('getConfig', 'custom')
            .then(config => {
              state.allowBookSplitPreview = config && config.book_split_preview_users && config.book_split_preview_users.indexOf(state.auth.getSession().user_id) !== -1;
              commit('set_couplet_separator', config.couplet_separator);
              commit('set_blockAudiosrcConfig', config.block_audiosrc_config);
            })

        dispatch('getBookCategories');
        dispatch('getCollections');
        dispatch('getAlignBlocksLimit');

        state.liveDB.startWatch('collection', 'collection', {bookid: 'collection'}, (data) => {
          //console.log(`liveDB.startWatch.collection.data: `, data);
          if (data.action) {
            switch (data.action) {
              case 'change':
                if (data.collection) {
                  //console.log(`state.bookCollectionsAll: `, state.bookCollectionsAll.map((c)=>({id: c.id, ver: c.version})));
                  const cIdx = state.bookCollectionsAll.findIndex(c => {
                    return c.id === data.collection.id;
                  });
                  if (cIdx > -1) {
                    const collection = state.bookCollectionsAll[cIdx];
                    if (collection.version < data.collection.version) {
                      //console.log(`updCollection ${data.collection.id}: coll.ver:`, collection.version, ` upd.ver`, data.collection.version, /*collection*/);
                      if (collection.validationErrors
                        && collection.validationErrors.slug
                        && data.collection.slug.trim().length) {
                        delete collection.validationErrors.slug;
                      }
                      state.bookCollectionsAll[cIdx] = new Collection({...collection, ...data.collection});
                      commit('PREPARE_BOOK_COLLECTIONS');
                    }
                  }
                }
                break;
              case 'create':
                if (data.collection && data.collection._id !== state.currentCollectionId) {
                  dispatch('getCollections');
                }
                break;
              case 'delete':
                if (data.collection) {
                  let collection = state.bookCollectionsAll.find(c => {
                    return c._id === data.collection._id;
                  });
                  if (collection) {
                    if (data.collection._id === state.currentCollectionId) {
                      commit('SET_CURRENT_COLLECTION', false);
                    }
                    state.bookCollectionsAll.splice(state.bookCollectionsAll.indexOf(collection), 1);
                    commit('PREPARE_BOOK_COLLECTIONS');
                  }
                }
                break;
            }
          }
        });

        //console.log(`liveDB.startWatch.pubMetaV: `);
        state.liveDB.startWatch('pubMetaV', 'pubMetaV', {bookid: 'pubMetaV'}, (data) => {
          //console.log(`liveDB.startWatch.pubMetaV.data: `, data);
          const cIdx = state.bookCollectionsAll.findIndex(c => {
            return c.id === data.meta.collection;
          });

          if (cIdx > -1) {
            const bIdx = state.books_meta.findIndex(c => {
              return c.bookid === data.meta.bookid;
            });
            if (bIdx > -1 && state.books_meta[bIdx]['@version'] < data.meta['@version']) {
              console.log(`liveDB pubMetaV update: state.books_meta[${bIdx}]: `, state.books_meta[bIdx]['@version'], data.meta['@version']);
              state.books_meta[bIdx].isInTheQueueOfPublication = data.meta.isInTheQueueOfPublication;
              state.books_meta[bIdx].isIntheProcessOfPublication = data.meta.isIntheProcessOfPublication;
              state.books_meta[bIdx].publicationStatus = data.meta.publicationStatus;
              state.books_meta[bIdx].published = data.meta.published;
              state.books_meta[bIdx].publishedVersion = data.meta.publishedVersion;
              state.books_meta[bIdx].version = data.meta.version;
              state.books_meta[bIdx].publishLog = data.meta.publishLog;
              state.books_meta[bIdx].slug_status = data.meta.slug_status;
              commit('PREPARE_BOOK_COLLECTIONS');
            }
            // const collection = state.bookCollectionsAll[cIdx];
            // if (collection.version < data.collection.version) {
            //   console.log(`updCollection ${data.collection.id}: coll.ver:`, collection.version, ` upd.ver`, data.collection.version);
            //   state.bookCollectionsAll[cIdx] = data.collection;
            //   commit('PREPARE_BOOK_COLLECTIONS');
            // }

          }
       });

       dispatch('getSuspiciousWordsCharacters');
       dispatch('getAudioFadeConfig');
       dispatch('updateBooksList');
       dispatch('authorsModule/getAll');
    },

    destroyDB ({ state, commit, dispatch }) {
      return new Promise((resolve, reject) => {

        //if (!state.isLoggedIn) return resolve();

        commit('set_localDB', { dbProp: 'metaDB', dbName: 'metaDB' });
        //commit('set_localDB', { dbProp: 'contentDB', dbName: 'contentDB' });
        //commit('set_localDB', { dbProp: 'tasksDB', dbName: 'tasksDB' });
        commit('set_localDB', { dbProp: 'librariesDB', dbName: 'librariesDB' });
        state.tc_currentBookTasks = {"tasks": [], "job": {}, "assignments": [], "can_resolve_tasks": [], "is_proofread_unassigned": false};

        if (state.metaDB) state.metaDB.destroy()
        //if (state.contentDB) state.contentDB.destroy()
        //if (state.tasksDB) state.tasksDB.destroy()
        if (state.librariesDB) state.librariesDB.destroy()

        console.log('destroyDB');
        window.setTimeout(() => {
          console.log('destroyDB Done');
          return resolve();
        }, 50)
      });
    },

    stopWatchLiveQueries({state}, vertex){
      if(vertex) {
        state.liveDB.stopWatch(vertex)
        return;
      }
      state.watched['metaV'] = null;

      state.liveDB.stopWatch('metaV');
      state.liveDB.stopWatch('job');
      state.liveDB.stopWatch('blockV');
      state.liveDB.stopWatch('collection');
      state.liveDB.stopWatch('pubMetaV');
    },
    // logout event
    disconnectDB ({ state, commit }) {
      state.liveDB.stopWatchAll();
      axios.defaults.headers.common['Authorization'] = false;
      //window.setTimeout(() => {
          //if (state.metaDB) state.metaDB.destroy()
          //if (state.contentDB) state.contentDB.destroy()
          //if (state.tasksDB) state.tasksDB.destroy()
          if (state.librariesDB) state.librariesDB.destroy()
          commit('RESET_LOGIN_STATE');
      //}, 500)
    },

    updateBooksList ({state, commit, dispatch}) {
      console.log(`updateBooksList: `);
      return axios.get(state.API_URL + 'books')///user/' + state.auth.getSession().user_id
        .then((answer) => {
          commit('SET_BOOKLIST', answer.data.books)
          //dispatch('tc_loadBookTask')
          return Promise.resolve();
        })
    },

    deleteCurrentBook (context) {
      // get _id for both book and meta
      // set _deleted=true on both
      // clear currentBookid
    },

    loadBookBlocks({commit, state, dispatch}, params) {
      let skip = params.skip ? `/${params.skip}` : '';
      let url = state.API_URL + `books/blocks/${params.bookId}`;
      return axios.get(url)
      .then((response) => {
        dispatch('startBookWatch', params.bookId)
        commit('SET_CURRENTBOOK_COUNTER', {name: 'total_blocks', value: null});
        commit('SET_CURRENTBOOK_COUNTER', {name: 'enabled_blocks', value: null});
        state.storeListO.setLookupsList(params.bookId, response.data);
        if (response.data.blocks && response.data.blocks.length > 0) {
          response.data.blocks.forEach(el => {
            if (!state.storeList.has(el._id)) {
              commit('set_storeList', new BookBlock(el));
            } else {
              //this.parlistO.setLoaded(el.rid);
            }
          });
        }
        commit('set_publicationErrors', []);
        return response.data;
      })
      .catch(err => err)
    },

    startBookWatch({state, commit, dispatch}, bookid) {
      //console.log('state.liveDB.startWatch', bookid);
      if (!bookid) {
        bookid = state.currentBookid
      }
      if (bookid) {
        state.liveDB.startWatch(bookid + '-blockV', 'blockV', {bookid: bookid}, (data) => {
          //console.log('DATA', bookid + '-blockV', data, Array.isArray(data));
          if (data) {
            let needRefresh = [];
            if (Array.isArray(data)) {
              data.forEach((d)=>{
                needRefresh.push(dispatch('set_liveDB_block_update', d));
              })
            } else if (data.block) {
              needRefresh.push(dispatch('set_liveDB_block_update', data));
            }
            Promise.all(needRefresh)
            .then((results)=>{
              if (results.some((res)=>res===true)) {
                state.storeListO.refresh();
                state.blockSelection.refresh = !state.blockSelection.refresh;
              }
              //console.log(`Promise.all(needRefresh).results: `, results, results.some((res)=>res===true));
            })
            //state.blockSelection.refresh = !state.blockSelection.refresh;
            //dispatch('tc_loadBookTask', state.currentBookid);
          }
        });
        state.liveDB.startWatch(bookid + '-task', 'task', {bookid: bookid}, (data) => {
          //console.log('task', data);
          if (data.task && (data.action == 'change' || data.action == 'delete')) {
            dispatch('tc_loadBookTask', state.currentBookid);
          }
        });
      }
    },

    loadPartOfBookBlocks({commit, state, dispatch}, params) {
      if (state.partOfBookBlocksXHR != null) {
        return state.partOfBookBlocksXHR;
      }
      if (typeof params.onPage === 'undefined') {
        params.onPage = 10;
      }

      let req = state.API_URL + `books/blocks/${params.bookId}/onpage/${params.onPage}`;
      if (params.block) {
        if (params.block === 'unresolved' && params.taskType) {
          req += `/search/${params.taskType}`
        } else {
          req += `/from/${params.block}`
        }
      }
      state.partOfBookBlocksXHR = axios.get(req)
      .then((response) => {
        state.partOfBookBlocksXHR = null;
        return response.data;
      })
      .catch(err => {
        state.partOfBookBlocksXHR = null;
        return err;
      });
      return state.partOfBookBlocksXHR;
    },

    loadBook ({commit, state, dispatch, getters}, book_id) {
      if (state.loadBookWait) {
        return state.loadBookWait
      }

      const actualBookID = getters.getBookByIdAlias(book_id);
      if (actualBookID) {
        book_id = actualBookID;
      }

      // if (!book_id) return  // if no currentbookid, exit
      // if (book_id === context.state.currentBookid) return // skip if already loaded

      // if currentbook exists, check if currrent book needs saving
      if (book_id != state.currentBookid) {
        state.jobInfoRequest = null;// force reload tasks
        commit('set_currentAudiobook', {});
        commit('SET_ALLOW_BOOK_PUBLISH', false);
        commit('SET_CURRENTBOOK_COUNTER', {name: 'voiced_in_range', value: 0});
        commit('SET_CURRENTBOOK_COUNTER', {name: 'total_blocks', value: 0});
        commit('SET_CURRENTBOOK_COUNTER', {name: 'enabled_blocks', value: 0});
        commit('publishModule/clear_htmlErrors');
      }
      //let oldBook = (state.currentBook && state.currentBook._id)

//       if (oldBook && state.currentBook_dirty || state.currentBookMeta_dirty) {
//         // save old state
//       }

      if (book_id && book_id === state.currentBookid) {
        return Promise.resolve(state.currentBookMeta);
      }

      if (book_id) {
        commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileURL: ''});
        //console.log('state.metaDBcomplete', state.metaDBcomplete);
        //let metaDB = state.metaRemoteDB;
        dispatch('stopWatchLiveQueries', 'blockV');
        let bookMeta = new Promise((resolve, reject) => {
          axios.get(state.API_URL + 'books/book_meta/' + book_id)
            .then((answer) => {
              resolve(answer.data.meta);
            });
        });
        state.loadBookWait = bookMeta
        return bookMeta
        .then((answer) => {
          state.loadBookWait = null;
          if (answer.job_status_error) {
            return Promise.reject(answer);
          }
          let bookMeta = state.books_meta.find(bookMeta => {
            return bookMeta.bookid === book_id;
          });
          if (bookMeta) {
            answer.executors = bookMeta.executors;
          }
          commit('SET_CURRENTBOOK_META', answer);
          if (state.loadBookTaskWait[`user_${state.user._id}`]) {
            dispatch('tc_loadBookTask', answer.bookid);
          }
          let publishButton = state.currentJobInfo.text_cleanup === false && !(typeof answer.version !== 'undefined' && answer.version === answer.publishedVersion);
          commit('SET_BOOK_PUBLISH_BUTTON_STATUS', publishButton);

          commit('TASK_LIST_LOADED')
          dispatch('setCurrentBookCounters', ['narration_blocks', 'not_proofed_audio', 'not_marked_blocks_missed_audio', 'not_marked_blocks', 'total_blocks', 'enabled_blocks']);
          dispatch('startAlignWatch');
          dispatch('startAudiobookWatch');
          dispatch('getCurrentJobInfo', true);
          commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileURL: answer.coverimgURL});
          //dispatch('loadBookToc', {bookId: book_id});
          dispatch('stopWatchLiveQueries', 'metaV');
          dispatch('stopWatchLiveQueries', 'job');

          state.watched['metaV'] = book_id;

          //console.log(`state.liveDB.startWatch(${book_id} + '-metaV', 'metaV',: `, );
          state.liveDB.startWatch(book_id + '-metaV', 'metaV', {bookid: book_id}, (data) => {
            //console.log('metaV watch:', book_id, data.meta['@version'], state.currentBookMeta['@version'], data.meta);
            if (data && data.meta && data.meta.bookid === state.currentBookMeta.bookid) {
              let bookMetaIdx = state.books_meta.findIndex((m)=>m.bookid==data.meta.bookid);
              if (bookMetaIdx > -1  && data.meta['@version'] > state.books_meta[bookMetaIdx]['@version']) {
                console.log('liveDB metaV update:', book_id, state.currentBookMeta['@version'], state.books_meta[bookMetaIdx]['@version'], data.meta['@version']);
                state.books_meta[bookMetaIdx] = Object.assign(state.books_meta[bookMetaIdx], data.meta);
                commit('SET_CURRENTBOOK_META', state.books_meta[bookMetaIdx]);
                let allowPublish = state.adminOrLibrarian;
                commit('SET_ALLOW_BOOK_PUBLISH', allowPublish);
                let publishButton = state.currentJobInfo.text_cleanup === false && !(typeof state.currentBookMeta.version !== 'undefined' && state.currentBookMeta.version === state.currentBookMeta.publishedVersion);
                commit('SET_BOOK_PUBLISH_BUTTON_STATUS', publishButton);
                if (data.meta.hasOwnProperty('coverimgURL')) {
                  commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileURL: data.meta.coverimgURL});
                }
                dispatch('getCurrentJobInfo');
              }
              commit('publishModule/set_publicationErrors', []);
            }
          });
          state.liveDB.startWatch(book_id + '-job', 'job', {bookid: book_id}, (data) => {
            if (data && data.job && data.job.bookid === state.currentBookMeta.bookid) {
              if (data.job.status != 'active' && state.currentBookMeta.job_status == 'active') {
                console.log('SET STATUS BY LIVE S', state.currentBookMeta.job_status)
                commit('set_job_status_error', data.job.status);
                dispatch('tc_loadBookTask', state.currentBookMeta.bookid);
              }
            }
          });
          dispatch('publishModule/loadHtmlErrorsBlocks');
          return Promise.resolve(answer);
        }).catch((err)=>{
          state.loadBookWait = null;
          //console.log('metaDB.get Error: ', err);
          return dispatch('checkError', err);
        })
      } else {
        commit('SET_CURRENTBOOK_META', false);
        return Promise.resolve()
      }
    },

    updateBookCover({commit, state, dispatch}, data) {
      if (state.currentBookMeta.bookid) {
        return axios.post(state.API_URL + 'books/' + state.currentBookMeta.bookid + '/coverimg', data.formData, data.config)
        .then(doc => {
          dispatch('updateBookVersion', {minor: true})
          .then(()=>{
            commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileURL: doc.data.coverimgURL});
            return Promise.resolve();
          })
        }).catch(err => {
          return Promise.reject(err);
        })
      }
    },

    removeBookCover({commit, state, dispatch}, data) {
      if (state.currentBookMeta.bookid) {
        return axios.delete(state.API_URL + 'books/' + state.currentBookMeta.bookid + '/coverimg', data.formData, data.config)
        .then(doc => {
          dispatch('updateBookVersion', {minor: true})
          .then(()=>{
            const index = state.books_meta.findIndex(meta => {
              return meta.bookid === state.currentBookMeta.bookid;
            });
            if (typeof index !== 'undefined' && state.books_meta[index].coverimgURL) {
              delete state.books_meta[index].coverimgURL;
            }
            commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileURL: ''});
            return Promise.resolve();
          })
        }).catch(err => {
          return Promise.reject(err);
        })
      }
    },

    loadBookToc({state, commit, dispatch}, params) {
      if (state.currentBookToc.bookId === params.bookId && !params.isWait) return state.currentBookToc;
      if (state.blockers.indexOf('loadBookToc') !== -1 && state.currentBookToc.bookId !== params.bookId) {
        dispatch('unfreeze', 'loadBookToc');
      }
      if (state.blockers.indexOf('loadBookToc') !== -1) {
        return state.currentBookToc;
      }
      dispatch('freeze', 'loadBookToc');
      return axios.get(state.API_URL + `books/toc/${params.bookId}` + (params.isWait ? '/wait':''))
      .then((response) => {
        if (params.bookId === state.currentBookid) {
          state.currentBookToc.bookId = params.bookId;
          state.currentBookToc.data = response.data;
        }
        dispatch('unfreeze', 'loadBookToc');
        return response;
      })
      .catch(err => {
        dispatch('unfreeze', 'loadBookToc')
        return err;
      })
    },

    updateBlockToc({state, dispatch}, params) {
      dispatch('freeze', 'loadBookToc');
      return axios.put(state.API_URL + `books/toc/${params.bookid}/block/${encodeURIComponent(params.rid)}`)
      .then((response) => {
        //state.currentBookToc.bookId = params.bookId;
        state.currentBookToc.data = response.data;
        dispatch('unfreeze', 'loadBookToc');
        dispatch('tocSections/loadBookTocSections', []);
        return response;
      })
      .catch(err => {
        dispatch('unfreeze', 'loadBookToc')
        return err;
      })
    },

    updateBookVersion({state, dispatch}, update) {
      let currMeta = state.currentBookMeta;
      if (currMeta.hasOwnProperty('publishLog')){
          update.publishLog = currMeta.publishLog || {publishTime: false, updateTime: false};
          update.publishLog.updateTime = Date();
          //console.log('update', update.publishLog);
      } else {
          update.publishLog = {publishTime: false, updateTime: Date()}
      }

      if (currMeta.bookid) {
        if (currMeta.published === true) {
          return dispatch('updateBookMeta', update)
        } else if (update.major && update.major == true) {
          if (typeof currMeta.version !== 'undefined' && currMeta.publishedVersion) {
            let cVers = currMeta.version.split('.');
            let pVers = currMeta.publishedVersion.split('.');
            if (cVers && cVers.length == 2 && pVers && pVers.length == 2)
            if (parseInt(cVers[0]) === parseInt(pVers[0])) {
              delete update['major'];
              update['version'] = (parseInt(cVers[0]) + 1) + '.0';
            }
          }
          if (update['version'] && update['version'] !== currMeta['version']) {
            return dispatch('updateBookMeta', update);
          }
        }
      }
      return Promise.resolve();
    },

    incrementBookMetaRecordVersion({state}) {
      if (state.currentBookMeta) {
        const bookMetaIdx = state.books_meta.findIndex((m)=>m.bookid==state.currentBookMeta.bookid);
        if (bookMetaIdx > -1) {
          state.books_meta[bookMetaIdx]['@version'] += 1;
        }
      }
    },

    updateBookMeta({state, dispatch, commit}, update) {
      //console.log(`updateBookMeta.update: `, update);

      update = {...update};
      if (!update.hasOwnProperty('bookid')) {
        update.bookid = state.currentBookMeta._id;
      }

      let currMeta = {...state.currentBookMeta};
      if (!currMeta.hasOwnProperty('publishLog')){
        currMeta.publishLog = {publishTime: false, updateTime: false}
      }

      let updateVersion = {minor: true};
      if (update['styles'] || update['numbering']) {
        // add meta changes in flow of versioning
        updateVersion = {major: true};
      } else {
        if (update.major && update.major == true) updateVersion = {major: true}
      }

      if (!(Object.keys(update).length === 2
        && (typeof update.authors !== 'undefined' || typeof update.masteringRequired !== 'undefined' || typeof update.voices !== 'undefined')
        && typeof update.bookid !== 'undefined')) {// updating authors from quote or masteringRequired
        //console.log('Update version');
        if (typeof currMeta.version !== 'undefined' && currMeta.version === currMeta.publishedVersion && currMeta.published === true) {
          let versions = currMeta.version.split('.');
          if (update.hasOwnProperty('hashTags')){
          	versions = false;
          }

          if (versions && versions.length == 2) {
            if (updateVersion.minor) {
              versions[1] = (parseInt(versions[1]) + 1);
            }
            if (updateVersion.major) {
              versions[0] = (parseInt(versions[0]) + 1);
              versions[1] = 0;
            }

            update['version'] = versions[0] + '.' + versions[1];
            update['pubType'] = 'Unpublished';
            update['published'] = false;
              //'status': 'staging',
              //'demo': false,
            update['isInTheQueueOfPublication'] = false;
            update['isIntheProcessOfPublication'] = false;
          }
        } else if (updateVersion.major && updateVersion.major == true) {
          if (typeof currMeta.version !== 'undefined' && currMeta.publishedVersion) {
            let cVers = currMeta.version.split('.');
            let pVers = currMeta.publishedVersion.split('.');
            if (cVers && cVers.length == 2 && pVers && pVers.length == 2)
            if (parseInt(cVers[0]) === parseInt(pVers[0])) {
              delete update['major'];
              update['version'] = (parseInt(cVers[0]) + 1) + '.0';
            }
          }
        }
        if (!update.hasOwnProperty('private')) {
          let publishLogAction = {
            publishTime : false,
            updateTime : Date()
          };
          if (currMeta.publishLog && currMeta.publishLog.publishTime) {
            publishLogAction.publishTime = currMeta.publishLog.publishTime;
          }
          update.publishLog = publishLogAction;
        }
      } else {
        delete update.major;
      }

      //let newMeta = Object.assign(state.currentBookMeta, update);
      //commit('SET_CURRENTBOOK_META', newMeta);
      //console.log('update', update);
      //return Promise.resolve('No data updated');

      if (!state.currentBookMeta.genres_manual) {
        let updateGenres = Object.keys(update).find(updateField => {
          return ['title', 'author_link'].includes(updateField)/* && !_.isEqual(update[updateField], state.currentBookMeta[updateField])*/;
        });
        if (!updateGenres) {
          if (update.alt_meta && update.alt_meta.reader && update.alt_meta.reader.category) {
              updateGenres = true;
            }
        }
        if (updateGenres) {
          commit('genreModule/set_autoGenerateInProgress', true);
        }
      }

      const BOOKID = update.bookid || state.currentBookMeta._id;

      dispatch('signalRequest', 'metaUpdate');
      //console.log(`SEND REQUEST:: `, BOOKID);
      return axios.put(`${state.API_URL}meta/${BOOKID}`, update, { signal: state.reqSignals.metaUpdate.signal })
        .then(response => {
          dispatch('tocSections/loadBookTocSections', []);
          if (response.data["@class"] && response.status == 200) {
            //console.log('updateBookMeta @version', response.data['@version'], update);
            let bookMetaIdx = state.books_meta.findIndex((m)=>m.bookid===BOOKID);
            if (bookMetaIdx > -1) {
              update['@version'] = response.data['@version'];
              state.books_meta[bookMetaIdx] = Object.assign(state.books_meta[bookMetaIdx], update);
            }

            const checkBookid = state.route.params.hasOwnProperty('bookid') ? state.route.params.bookid : state.currentBookid;
            if (response.data.bookid === checkBookid) {// ILM-3773 very quickly switch-over to another book, check bookid in URL or in state property currentBookid
              state.currentBookMeta['@version'] = response.data['@version'];

              if (update['version'] && response.data.collection_id) {
                dispatch('updateCollectionVersion', Object.assign({id: response.data.collection_id}, update));
              }

              let allowPublish = state.adminOrLibrarian && state.currentJobInfo.workflow.status !== 'archived';
              commit('SET_ALLOW_BOOK_PUBLISH', allowPublish);
              commit('SET_CURRENTBOOK_META', response.data);
              let publishButton = state.currentJobInfo.text_cleanup === false && !(typeof state.currentBookMeta.version !== 'undefined' && state.currentBookMeta.version === state.currentBookMeta.publishedVersion);
              commit('SET_BOOK_PUBLISH_BUTTON_STATUS', publishButton);
            }
            if (state.currentBookMeta.collection_id && state.currentCollection) {
              //state.currentCollection.updateBook(response.data);
              commit('PREPARE_BOOK_COLLECTIONS');
            }

            //console.log(`updateBookMeta.state.currentBookMeta: `, state.currentBookMeta);
            commit('genreModule/set_autoGenerateInProgress', false);
            return Promise.resolve(response.data);
          } else {
            return Promise.resolve('No data updated');
          }
        })
        .catch(err => {
          if (err.message && err.message === 'canceled') {
            //console.log(`CANCELED::: `);
            let bookMetaIdx = state.books_meta.findIndex((m)=>m.bookid===BOOKID);
            if (bookMetaIdx > -1) {
              state.books_meta[bookMetaIdx]['@version'] += 1;
              //state.currentBookMeta['@version'] += 1;
            }
          }
          return dispatch('checkError', err);
        })
    },

    loadCollection({commit, state, dispatch}, id) {
      if (id) {
        return dispatch('getCollection', id)
          .then(collection => {
            let cIndex = state.bookCollectionsAll.findIndex(c => {
              return c._id === id;
            });
            if (cIndex !== -1) {
              state.bookCollectionsAll[cIndex] = collection;
            }
            commit('PREPARE_BOOK_COLLECTIONS');
            commit('SET_CURRENT_COLLECTION', id);
            return Promise.resolve();
          })
          .catch(err => {
            return Promise.reject(err);
          });
      } else {
        commit('SET_CURRENT_COLLECTION', false);
        return Promise.resolve();
      }
    },

    reloadCollection({state, commit, dispatch}) {
      if (state.currentCollectionId) {
          commit('SET_CURRENT_COLLECTION', state.currentCollectionId);
          dispatch('allowCollectionPublish');
      }
    },

    updateCollectionVersion({state, dispatch}, update) {
      /*let id = update.id || state.currentCollection._id;
      if (id) {
        state.collectionsRemoteDB.get(state.currentCollection._id)
          .then(collection => {
            if (typeof collection.version !== 'undefined' && collection.version === collection.publishedVersion && collection.published === true) {
              let versions = collection.version.split('.');
              if (versions && versions.length == 2) {
                if (update.minor) {
                  versions[1] = (parseInt(versions[1]) + 1);
                }
                if (update.major) {
                  versions[0] = (parseInt(versions[0]) + 1);
                  versions[1] = 0;
                }
                    collection['version'] = versions[0] + '.' + versions[1];
                    collection['published'] = false;
                    collection['state'] = 'unpublished';
                    state.collectionsRemoteDB.put(collection)
                      .then(() => {
                        dispatch('reloadCollection');
                      });
              }
            } else {
              dispatch('reloadCollection');
            }

          });
      }*/
    },

    allowCollectionPublish({state, commit}) {
      let allow_by_role = superlogin.confirmRole('librarian') || superlogin.confirmRole('admin');
      if (allow_by_role && state.currentCollection && state.currentCollection.books && state.currentCollection.books.length > 0 && state.books_meta) {
        let allow = typeof state.currentCollection.version === 'undefined' || state.currentCollection.version !== state.currentCollection.publishedVersion;
        if (allow) {
          state.currentCollection.bookids.forEach(b => {
            if (allow) {
              let _b = state.books_meta.find(__b => __b._id === b);
              if (_b) {
                allow = _b.published === true;
              }
            }
          });
        }
        commit('SET_ALLOW_COLLECTION_PUBLISH', allow);
      } else {
        commit('SET_ALLOW_COLLECTION_PUBLISH', false);
      }
    },

    updateLibrariesList ({state, commit, dispatch}) {
      state.librariesDB.hoodieApi().findAll()
        .then(libraries => {
          commit('SET_LIBRARIES', libraries);
          dispatch('reloadLibrary');
        })
    },

    loadLibrary({commit, state, dispatch}, id) {
      if (id) {
        state.currentLibraryId = id;
        state.librariesDB.get(id).then(library => {
          commit('SET_CURRENT_LIBRARY', library);
        }).catch((err)=>{

        })
      } else {
        commit('SET_CURRENT_LIBRARY', {});
      }
    },

    reloadLibrary({state, commit, dispatch}) {
      if (state.currentLibraryId) {
        state.librariesDB.get(state.currentLibraryId).then(library => {
          commit('SET_CURRENT_LIBRARY', library);
        }).catch((err)=>{
          console.log(err);
        })
      }
    },

    getBookMeta ({state}, bookid) {
        return axios.get(state.API_URL + 'books/book_meta/' + bookid)
          .then(response => {
            return Promise.resolve(response.data);
          })
          .catch(err => {
            console.log(err);
            return Promise.reject(err);
          });
    },

    getBlock ({commit, state, dispatch}, block_id) {
      let block = state.storeList.get(block_id);
      return axios.get(state.API_URL + 'book/block/' + encodeURIComponent(block._rid))
        .then(response => {
          return Promise.resolve(response.data);
        })
        .catch(err => {
          console.log(err);
          return Promise.reject(err);
        });
    },

    getBlocks ({commit, state, dispatch}, blocksIds) {
      if (!blocksIds) {
        return Promise.resolve([]);
      }

      const chunkSize = 100;
      let chunks = [];
      for (let i = 0; i < blocksIds.length; i += chunkSize) {
        chunks.push(blocksIds.slice(i, i + chunkSize));
      }

      let result = [];
      const chunksPromiseArr = chunks.map((chunk)=>{
        return axios.get(state.API_URL + 'books/blocks_data/' + state.currentBookid + '?ids=' + chunk.join(','))
        .then(res => {
          res.data.forEach(b => {
            result.push(b);
          });
          return result;
        })
        .catch(err => {
          console.log(err);
          return err;
        });
      })

      return Promise.all(chunksPromiseArr).
      then(()=>{
        return result
      })
      .catch(err => err);
    },

    loopBlocksChain ({commit, state, dispatch}, params) {
      let requests = [];
      let results = {rows: [], finish: false, blockId: false};

      requests.push(defer());

      (function loop(i, block_id) {

        if ((typeof params.onpage === 'undefined' || i < params.onpage) && block_id) {
          dispatch('getBlock', block_id)
          .then((b)=>{
            if (b && b._id) {
              results.rows.push(b);
              loop(i+1, b.chainid);
            } else requests[0].resolve();
          })
          .catch((err)=>{
            //console.log('loop_BlocksChain Catch: ', err);
            results.finish = true;
            requests[0].resolve();
          })
        }
        else requests[0].resolve();
      })(0, params.startId); // start

      return Promise.all(requests)
      .then(() => {
        //console.log('loopBlocksChain results', results);
        return Promise.resolve(results);
      });
    },

    loopPreparedBlocksChain ({commit, state, dispatch}, params) {
      let results = {rows: []};
      return dispatch('getBlocks', params.ids)
      .then((rows)=>{
        results.rows = rows;
        return results;
      })
    },

    searchBlocksChain ({commit, state, dispatch}, params) {
      let requests = [];
      let results = {rows: [], finish: false, blockId: false};
      let task_type = params.search.task_type || false;

      requests.push(defer());

      let metadata_cleanup = state.currentJobInfo.text_cleanup;
      let audio_mastering = state.currentJobInfo.mastering;
      //console.log('searchBlocksChain 1', task_type, params);
      //console.log('searchBlocksChain 2', metadata_cleanup, audio_mastering);

      return axios.post(state.API_URL + 'books/' + params.book_id + '/unresolved',
      {
        'bookId': params.book_id || false,
        'startId': params.startId || false,
        'taskType': params.search.task_type || false,
        'metadataCleanup': metadata_cleanup,
        'audioMastering': audio_mastering,
        'onpage': 10
      })
      .then((result) => {
        return Promise.resolve(result.data);
      })
      .catch(err => {
        return Promise.reject(err);
      })
    },

    loadBlocksChain ({commit, state, dispatch}, params) {
      //console.log('load_BlocksChain', params);
      if (params.startId) {
        if (params.hasOwnProperty('search')) {
          return dispatch('searchBlocksChain', params);
        } else {
          return dispatch('loopBlocksChain', params);
        }
      }

    },

    _putBlock ({state}, block) {
      //console.log('_putBlock block', block);
      return state.contentRemoteDB
        .put(block)
        .then(res => Promise.resolve(res))
        .catch((err) => {
          console.log('_putBlock err', err);
          if (err.status == 404) {
          return state.contentDB
            .put(block)
            .then(res => Promise.resolve(res))
            .catch(err => Promise.reject(err));
          } else return Promise.reject(err);
        });
    },

    putBlock ({commit, state, dispatch}, [block, realign = false]) {
      let cleanBlock = _.cloneDeep(block);
      if (typeof block.clean === 'function') {
        cleanBlock = block.clean();
      }
      delete cleanBlock.parnum;
      delete cleanBlock.secnum;
      delete cleanBlock.isNumber;
      commit('set_blocker', 'putBlock');
      let url = state.API_URL + 'book/block/' + block.blockid;
      if (realign) {
        url+= '?realign=true';
      }
      let currentBlockO = state.storeListO.get(cleanBlock.blockid);
      // let's update update time in meta:
      //dispatch('updateBookMeta', {})
      cleanBlock = state.suspiciousWordsHighlight.clearSuspiciousHighlight(cleanBlock);
      return axios.put(url,
        {
          'block': cleanBlock,
        })
          .then(response => {
            //console.log('putBlock', response);
            if (response.data) {
              dispatch('tocSections/checkUpdatedBlock', [block.blockid]);
              return dispatch('checkInsertedBlocks', [currentBlockO.out, Array.isArray(response.data.out) ? response.data.out[0] : response.data.out])
                .then(() => {
                  return Promise.resolve(response);
                });
            } else {
              return Promise.resolve(response);
            }
          })
          .then((response) => {
            commit('clear_blocker', 'putBlock');
            block._rev = response.data.rev;
            dispatch('tc_loadBookTask', block.bookid);
            dispatch('getCurrentJobInfo')
              .then(() => {
                if (state.currentJobInfo && state.currentJobInfo.published && !response.data.disabled) {
                  dispatch('updateBookVersion', {major: true});
                }
              });

            //TODO in future call common method from live_db update
            if (response.data && response.data.blockid && state.storeList.has(response.data.blockid)) {
              let oldBlock = state.storeList.get(response.data.blockid);
              oldBlock.content = response.data.content;
              oldBlock.parts = response.data.parts;
              oldBlock.footnotes = response.data.footnotes;
              oldBlock.status = response.data.status;
              oldBlock.type = response.data.type;
              oldBlock.language = response.data.language;
              oldBlock.classes = response.data.classes;
              response.data.audiosrc_config = oldBlock.audiosrc_config;
              store.commit('set_storeList', oldBlock);
              state.storeListO.refresh();

              state.storeListO.updBlockByRid(response.data.id, {
                status: response.data.status,
                type: response.data.type
              });
            }
            if (typeof cleanBlock.type !== 'undefined' && state.blockSelection && state.blockSelection.start && state.blockSelection.start._id) {// changed type of the block
              dispatch('set_selected_blocks');
              dispatch('getAlignCount');
            }
            commit('set_publicationErrors', [[response.data]]);
            return Promise.resolve(response.data);
          })
          .catch(err => {
            commit('clear_blocker', 'putBlock');
            dispatch('checkError', err);
            return Promise.reject(err);
          });
    },
    putBlockProofread({state, dispatch, commit}, block) {
      commit('set_blocker', 'putBlock');
      let update = {
        block: {
          blockid: block.blockid,
          bookid: block.bookid,
          flags: block.flags
        }
      };
      if (typeof block.parts !== 'undefined' && Array.isArray(block.parts) && block.parts.length > 1) {
        update.block.parts = block.parts;
      }
      if (typeof block.content !== 'undefined') {
        update.block.content = block.content;
      }
      let storeBlock = state.storeList.get(block.blockid);
      return axios.put(state.API_URL + 'book/block/' + encodeURIComponent(storeBlock._rid) + '/proofread', update)
        .then((response) => {
          commit('clear_blocker', 'putBlock');
          dispatch('tc_loadBookTask', block.bookid);
          dispatch('getCurrentJobInfo');
          if (storeBlock && storeBlock.audiosrc_config) {// stored only locally
            response.data.audiosrc_config = storeBlock.audiosrc_config;
          }
          return Promise.resolve(response.data);
        })
        .catch(err => {
          commit('clear_blocker', 'putBlock');
          dispatch('checkError', err);
          return Promise.reject(err);
        });
    },
    putBlockNarrate({state, dispatch, commit}, [block, realign, partIdx]) {
      commit('set_blocker', 'putBlock');

      let storeBlock = state.storeList.get(block.blockid);
      let url = `${state.API_URL}book/block/${encodeURIComponent(storeBlock._rid)}/narrate`;
      if (realign) {
        url+= '?realign=true';
      }
      let update = {
        block: {
          blockid: block.blockid,
          bookid: block.bookid,
          flags: block.flags,
          content: block.content
        }
      };
      if (typeof partIdx !== 'undefined') {
        update.block.partIdx = partIdx;
        if (typeof block.content_changed !== 'undefined') {
          update.block.content_changed = block.content_changed;
        }
      } else {
        update.block.parts = block.parts;
      }
      if (typeof block.parts !== 'undefined' && Array.isArray(block.parts) && block.parts.length > 1) {
        update.block.parts = block.parts;
      }
      if (Array.isArray(block.manual_boundaries)) {
        update.block.manual_boundaries = block.manual_boundaries;
      }
      if (block.audiosrc) {
        update.block.audiosrc = block.audiosrc;
        update.block.audiosrc_ver = block.audiosrc_ver;
      }
      let isSplitting = update.block.content ? update.block.content.match(/<i class="pin"><\/i>/img) : [];
      isSplitting = isSplitting ? isSplitting.length : 0;
      return axios.put(url, update)
        .then((response) => {
          if (storeBlock && storeBlock.audiosrc_config) {// stored only locally
            response.data.audiosrc_config = storeBlock.audiosrc_config;
          }
          if (isSplitting && storeBlock.parts.length !== response.data.parts.length) {
            /*response.data.parts.forEach((p, pIdx) => {
              if (pIdx < blockIdx || pIdx > blockIdx + isSplitting) {
                response.data.parts[pIdx] = storeBlock.parts[pIdx - isSplitting];
              }
            });*/
            storeBlock.parts.forEach((p, pIdx) => {
              if (pIdx < partIdx && (p.isChanged || p.isAudioChanged)) {
                response.data.parts[pIdx] = p;
              } else if (pIdx > partIdx && (p.isChanged || p.isAudioChanged)) {
                response.data.parts[pIdx + isSplitting] = Object.assign(response.data.parts[pIdx + isSplitting], {
                  content: p.content,
                  inid: p.inid,
                  isAudioChanged: p.isAudioChanged,
                  isChanged: p.isChanged,
                  manual_boundaries: p.manual_boundaries,
                  _id: p._id
                });
              }
            });
          } else if (Array.isArray(storeBlock.parts)) {
            storeBlock.parts.forEach((p, pIdx) => {
              if ((p.isChanged || p.isAudioChanged) && pIdx !== partIdx) {
                response.data.parts[pIdx] = p;
              }
              if (p.inid) {
                response.data.parts[pIdx].inid = p.inid;
              }
            });
          }
          let updatedBlock = new BookBlock(response.data);
          commit('set_storeList', updatedBlock);
          if (storeBlock.getIsChanged()) {
            if (Array.isArray(storeBlock.flags) && storeBlock.flags.length > 0) {// if pending flag update present
              storeBlock.flags.forEach(f => {
                dispatch('updateStoreFlag', [storeBlock.blockid, f._id, f]);
              });
            }
            if (Array.isArray(storeBlock.flags) && storeBlock.flags.length < updatedBlock.flags.length) {// if pending flag remove present
              updatedBlock.flags.forEach((f, fIdx) => {
                let _f = storeBlock.flags.find(fl => {
                  return fl._id === f._id;
                });
                if (!_f) {
                  updatedBlock.flags.splice(fIdx, 1);
                }
              });
            }
          }
          return dispatch('getBookAlign')
            .then(() => {
              commit('clear_blocker', 'putBlock');
              return Promise.resolve(response.data);
            })
        })
        .catch(err => {
          commit('clear_blocker', 'putBlock');
          dispatch('checkError', err);
          return Promise.reject(err);
        });
    },

    putNumBlock ({commit, state, dispatch}, block) {
      let cleanBlock;
      if (typeof block.clean === 'function') {
        cleanBlock = block.clean();
      } else {
        cleanBlock = Object.assign({}, block);
      }
      commit('set_blocker', 'putNumBlock');
      return axios.put(state.API_URL + 'book/block/' + block.blockid,
        {
          'block': cleanBlock,
        })
          .then(response => {
            commit('clear_blocker', 'putNumBlock');
            block._rev = response.data.rev;
            dispatch('tc_loadBookTask', block.bookid);
            dispatch('getCurrentJobInfo')
              .then(() => {
                if (state.currentJobInfo && state.currentJobInfo.published) {
                  dispatch('updateBookVersion', {major: true});
                }
              });
            return Promise.resolve(response.data);
          })
          .catch(err => {
            commit('clear_blocker', 'putNumBlock');
            dispatch('checkError', err);
            return Promise.reject(err);
          });
    },

    putBlockPart ({commit, state, dispatch}, [update, realign, keep_block = false]) {
      let cleanBlock = Object.assign({}, update);
      delete cleanBlock.parnum;
      delete cleanBlock.secnum;
      delete cleanBlock.isNumber;
      if (!cleanBlock.blockid) {
        return Promise.reject(new Error('blockid is not set'));
      }
      commit('set_blocker', 'putBlock');
      let url = `${state.API_URL}book/block/${cleanBlock.blockid}`;
      if (realign) {
        url+= '?realign=true';
      }
      let currentBlockO = state.storeListO.get(cleanBlock.blockid);
      let currentBlock = state.storeList.get(cleanBlock.blockid);
      return axios.put(url,
        {
          'block': cleanBlock,
        })
          .then(response => {
            //console.log('putBlockPart', response);
            if (response.data) {
              dispatch('checkInsertedBlocks', [currentBlockO.out, Array.isArray(response.data.out) ? response.data.out[0] : response.data.out]);
            }
            commit('clear_blocker', 'putBlock');
            dispatch('getCurrentJobInfo');
            dispatch('tc_loadBookTask', response.data.bookid);
            state.storeListO.updBlockByRid(response.data.id, {
              status: response.data.status
            });
            if (currentBlock.audiosrc_config) {// stored only locally
              response.data.audiosrc_config = currentBlock.audiosrc_config;
            }
            if (!keep_block) {
              commit('set_storeList', new BookBlock(response.data));
            }
            return Promise.resolve(response.data);
          })
          .catch(err => {
            commit('clear_blocker', 'putBlock');
            dispatch('checkError', err);
            return Promise.reject(err);
          });
    },

    putBlockO({commit, state}, params) {
      let rid = encodeURIComponent(params.rid);
      let req = state.API_URL + `books/blocks/block/${rid}`;
      return axios.put(req, params)
      .then((response) => {
        if (response.data.updated && response.data.updated > 0) {
          let block = state.storeListO.getBlockByRid(params.rid);
          if (block) {
            //block.isManual = true;
            state.storeListO.updBlockByRid(params.rid, params);
            return block.blockid;
          }
        }
        //console.log('response.data', response.data);
        if (Array.isArray(response.data)) response.data.forEach((blockO)=>{
          state.storeListO.updBlockByRid(blockO.rid, blockO);
        })
        return response.data;
      })
    },

    putNumBlockO({commit, state, dispatch}, params) {
      let rid = encodeURIComponent(params.rid);
      let bookId = encodeURIComponent(params.bookId);
      let req = state.API_URL + `books/blocks/num/${bookId}/${rid}`;
      state.updatingNumeration = true;
      return axios.put(req, params)
      .then((response) => {
        state.updatingNumeration = false;
        dispatch('tocSections/loadBookTocSections', []);
        if (response.data.updated && response.data.updated > 0) {
          let block = state.storeListO.getBlockByRid(params.rid);
          if (block) {
            block.isManual = true;
            return block.blockid;
          }
        }
        //console.log('response.data', response.data);
        if (Array.isArray(response.data)) {
          response.data.forEach((blockO)=>{
            state.storeListO.updBlockByRid(blockO.rid, blockO);
          })
        }
        return response.data;
      })
    },

    putNumBlockOBatch({commit, state}, params) {
      let bookId = encodeURIComponent(params.bookId);
      //let bookNum = encodeURIComponent(params.bookNum);
      let req = state.API_URL + `books/blocks/batch/num/${bookId}`;
      return axios.put(req, params)
      .then((response) => {
        if (Array.isArray(response.data)) response.data.forEach((blockO)=>{
          state.storeListO.updBlockByRid(blockO.rid, blockO);
        })
        return response.data;
      })
    },

    putMetaAuthors ({commit, state, dispatch}, authors) {
      let metaAuthors = [];
      authors.forEach((item)=>{
        metaAuthors.push({ name: item.text, color: item.color });
      })
      let upd = {authors: metaAuthors};
      return dispatch('updateBookMeta', upd);
    },

    tc_loadBookTask({state, commit, dispatch}, bookid) {
      //console.log('tc_loadBookTask, bookid', bookid);
      let key = bookid ? `book_${bookid}` : `user_${state.user._id}`;
      if (state.loadBookTaskWait[key]) {
        return state.loadBookTaskWait[key];
      }
      let address = state.API_URL + 'tasks';
      bookid = bookid || state.currentBookid || null;
      if (bookid && bookid !== 'all') {
        address+='?bookid=' + bookid
      }
      state.loadBookTaskWait[key] = axios.get(address)
      return state.loadBookTaskWait[key]
        .then((list) => {
          state.loadBookTaskWait[key] = null;
          state.tc_tasksByBlock = {}
          let oldCount = state.tc_userTasks.total;
          if (!bookid || !state.tc_userTasks.list) {
            state.tc_userTasks = {list: list.data, total: 0}
          } else {
            if (bookid && (!list.data || Object.keys(list.data).length === 0)) {
              Object.keys(state.tc_userTasks.list).forEach(k => {
                let t = state.tc_userTasks.list[k];
                if (t && t.bookid === bookid) {
                  delete state.tc_userTasks.list[k];
                }
              })
            } else {
              state.tc_userTasks.list = Object.assign(state.tc_userTasks.list, list.data);
              //console.log(state.tc_userTasks.list)
            }
          }
          commit('TASK_LIST_LOADED')
          if (oldCount === 0 && bookid && bookid !== 'all') {
            state.tc_userTasks.total = 0;
          }
          commit('PREPARE_BOOK_COLLECTIONS');
          dispatch('recountApprovedInRange');
          return list;
        })
        .catch(err => {
          state.loadBookTaskWait[key] = null;
          console.log(err)
        })
    },
    tc_approveBookTask({state, commit, dispatch}, task) {
      let request = {
        'bookId': task.bookid || false,
        'taskId': task.id || false,
        'taskStep': task.nextStep || 'narrate-block',
        'taskType': task.type || false
      };
      if (task.blockid) {
        state.approveBlocksList.push(task.blockid);
        let block = state.storeList.get(task.blockid);
        if (block) {
          request.blockRid = block._rid;
        }
      }
      return axios.post(state.API_URL + 'task/' + task.blockid + '/approve_block',
      request)
      .then((response) => {
        return dispatch('checkResponse', response)
          .then(list => {
            if (task.blockid) {
              state.approveBlocksList.forEach((_b, i) => {
                if (_b === task.blockid) {
                  state.approveBlocksList.splice(i, 1);
                }
              })
            }
            //console.log('APPROVE TC', list)
            //state.tc_tasksByBlock = {}
            //state.tc_userTasks = {list: list.data.rows, total: 0}
            //commit('TASK_LIST_LOADED')
            if(Array.isArray(state.tc_currentBookTasks.tasks)) {// temporary remove current block task to disable it
              state.tc_currentBookTasks.tasks = state.tc_currentBookTasks.tasks.filter((t, i) => {
                return t.blockid !== task.blockid;
              });
            }
            if (Array.isArray(state.currentJobInfo.can_resolve_tasks)) {
              state.currentJobInfo.can_resolve_tasks = state.currentJobInfo.can_resolve_tasks.filter((t, i) => {
                return t.blockid !== task.blockid;
              });
            }
            if (state.tc_tasksByBlock[task.blockid]) {
              delete state.tc_tasksByBlock[task.blockid];
            }
            if (!state.tc_currentBookTasks.tasks || state.tc_currentBookTasks.tasks.length === 0) {
              state.tc_currentBookTasks.is_proofread_unassigned = false;
            }
            //state.tc_currentBookTasks = {"tasks": [], "job": {}, "assignments": []};
            //if (state.replicatingDB.ilm_tasks !== true) {
              dispatch('tc_loadBookTask', task.bookid);
            //}
            //dispatch('getCurrentJobInfo');
            dispatch('getCurrentJobInfo');
            if (task.blockid) {
              let block = state.storeList.get(task.blockid);
              if (block) {
                block.setPauseAfter(response.data.pause_after);
              }
              let blockO = state.storeListO.get(task.blockid);
              if (blockO.checked) {
                state.blockSelection.refresh = Date.now();// to update pause after
              }
            }
            return Promise.resolve(list);
          })
      })
      .catch(err => {
        return Promise.reject(err);
      });
    },

    setMetaData ({state, commit, dispatch}, data)
    {
      let keys = data.key.split('.');
      let key = keys[0];
      if (keys.length > 1) {
        state.currentBookMeta[keys[0]][keys[1]] = value;
        value = state.currentBookMeta[keys[0]];
      }

      let update = {
        [key]: data.value
      }

      var api = state.metaDB.hoodieApi();

      return api.update(state.currentBookMeta._id, update).then(doc => {
        //console.log('success DB update: ', doc)
        return dispatch('updateBookVersion', {minor: true})
        .then(() => {
          return Promise.resolve(doc);
        })
        .catch(err => {
          //console.log(err);
          return Promise.reject(err);
        });
      }).catch(err => {
        //console.log('error DB pdate: ', err)
        return Promise.reject(err);
      })
    },

    setCurrentBookCounters({state, commit, dispatch}, counters = []) {
      /*if (counters.length == 0 || counters.indexOf('narration_blocks') !== -1) {
        dispatch('_setNarrationBlocksCounter');
      }
      if (counters.length == 0 || counters.indexOf('not_marked_blocks') !== -1) {
        dispatch('_setNotMarkedAsDoneBlocksCounter');
      }
      if (counters.length == 0 || counters.indexOf('not_proofed_audio_blocks') !== -1) {
        dispatch('_setNotProofedAudioBlocksCounter');
      }*/
      if (counters.length == 0) {
        counters = ['narration_blocks', 'not_proofed_audio', 'not_marked_blocks'];
      }
      if (state.currentBookid) {
        counters.forEach(c => {
          //commit('SET_CURRENTBOOK_COUNTER', {name: c, value: '0'});
        });
        let bookid = state.currentBookid;
        let params = '';
        counters.forEach(c => {
          if (typeof c == 'object') {
            let filterKey = Object.keys(c)[0];
            params+='counters[]=' + filterKey + '&';
            Object.entries(c[filterKey]).map(([key, value]) => {
              let filterObj = {};
              filterObj[key] = value;
              params+='filters[]=' + JSON.stringify(filterObj) + '&';
            });
          } else params+='counters[]=' + c + '&';
        });
        //console.log(state.API_URL + 'books/' + bookid + '/counter/?' + params.replace(/\&$/,''));
        return axios.get(state.API_URL + 'books/' + bookid + '/counter/?' + params.replace(/\&$/,''))
          .then(response => {
            if (response.data && response.data.count && Object.keys(response.data.count).length > 0) {
              Object.keys(response.data.count).forEach(k => {
                commit('SET_CURRENTBOOK_COUNTER', {name: k, value: response.data.count[k]});
              });
            }
          })
          .catch(err => {

          });
      }
    },

    _setNarrationBlocksCounter({state, commit}) {
      commit('SET_CURRENTBOOK_COUNTER', {name: 'narration_blocks', value: '0'});
      if (state.currentBookid) {
        let bookid = state.currentBookid;
        return axios.get(state.API_URL + 'books/' + bookid + '/counter/narration_blocks')
          .then(result => {
            commit('SET_CURRENTBOOK_COUNTER', {name: 'narration_blocks', value: result.data.count});
          })
          .catch(err => console.log(err));
      }
    },

    _setNotMarkedAsDoneBlocksCounter({state, commit}) {
      if (state.currentBookid) {
        let bookid = state.currentBookid;
        axios.get(state.API_URL + 'books/' + bookid + '/not_marked', {})
              .then(response => {
                commit('SET_CURRENTBOOK_COUNTER', {name: 'not_marked_blocks', value: response.data ? response.data.count : '0'});
              })
              .catch(err => {
                commit('SET_CURRENTBOOK_COUNTER', {name: 'not_marked_blocks', value: '0'})
                console.log(err)
              });
      } else {
        commit('SET_CURRENTBOOK_COUNTER', {name: 'not_marked_blocks', value: '0'})
      }
    },
    _setNotProofedAudioBlocksCounter({state, commit}) {
      commit('SET_CURRENTBOOK_COUNTER', {name: 'not_proofed_audio_blocks', value: '0'});
      if (state.currentBookid) {
        let tasks = [];
        let bookid = state.currentBookid;
        return axios.get(state.API_URL + 'books/' + bookid + '/counter/not_proofed_audio')
          .then(response => {
            commit('SET_CURRENTBOOK_COUNTER', {name: 'not_proofed_audio_blocks', value: response.data.count});
          })
          .catch(err => {

          });
      }
    },

    freeze({commit}, bName) {
      commit('set_blocker', bName);
    },

    unfreeze({commit}, bName) {
      commit('clear_blocker', bName);
    },

    addBlockLock({commit}, data) {
      commit('add_block_lock', data);
    },

    clearBlockLock({commit}, data) {
      commit('clear_block_lock', data);
    },

    async setBlockSelection({state, commit, dispatch}, selection) {
      if (!_.isEqual(state.blockSelection, selection)) {
        this.selectionRecount = true;
        await dispatch('set_block_selection',selection)
        await dispatch('getAlignCount', selection);
        await dispatch('recountApprovedInRangeAsync', selection);
        this.selectionRecount = false;
      }
    },

    getAlignCount({state, commit}, selection) {
      if (!selection) {
        selection = state.blockSelection;
      }
      if (selection.start && selection.start._id &&
                selection.end && selection.end._id) {
        let api_url = state.API_URL + 'books/' + state.currentBookid + '/selection_alignment';
        let query = 'start=' + selection.start._id + '&end=' + selection.end._id;
        let realign = /*state.tc_currentBookTasks.assignments &&
                (state.tc_currentBookTasks.assignments.indexOf('audio_mastering') !== -1 ||
                  (state.tc_currentBookTasks.assignments.indexOf('content_cleanup') !== -1 && state.currentBookCounters.not_marked_blocks === 0))*/true;
        //if (realign) {
          //query+='&voicework=all_audio&realign=true';
        //} else { // In case of normal task (with tts counter)
          query+='&voicework=all_audio&realign=true';
        //}
        state.selectionXHR = Date.now();
        let run = state.selectionXHR;
        return axios.get(api_url + '?' + query, {})
          .then(response => {
            if (response.status == 200 && run === state.selectionXHR) {
              commit('set_align_counter', {
                count: response.data.count,
                countTTS: response.data.countTTS,
                countAudio: response.data.countAudio,
                blocks: response.data.blocks
              });
            }
            return Promise.resolve();
          })
          .catch(err => Promise.reject(err));
      } else {
        commit('set_align_counter', {
          count: 0,
          countTTS: 0,
          blocks: []
        });
      }
    },
    getChangedBlocks({state}, data) {
      if (state.blockSelection.start._id && state.blockSelection.end._id) {
        let crossId = state.blockSelection.start._id;
        let ids = [];
        for (var idx=0; idx < state.storeList.size; idx++) {
          let block = state.storeList.get(crossId);
          if (block) {
            if (block.isChanged) {
              if ((block.voicework === 'audio_file' && data.voicework === 'audio_file') ||
                      (block.voicework === 'tts' && data.voicework === 'tts')) {
                ids.push(block._id);
              }
            }
            if (block._id == state.blockSelection.end._id) {
              break;
            }
            crossId = state.storeListO.getOutId(block.blockid);
          } else break;
        }
        return Promise.resolve(ids);
      }
    },

    async recountApprovedInRangeAsyncIteration({state, commit,dispatch}, {crossId,idx,size,d,selection,resolve,bar} ) {

      let iterationCount = 0;
      let iterationMax = 50;
      let status = 'ok';


      // let name = 'SelectionModalProgressIterations';
      // let nameEQ = name + "=";
      // let ca = document.cookie.split(';');
      // for(let i=0;i < ca.length;i++) {
      //   let c = ca[i];
      //   while (c.charAt(0)==' ') c = c.substring(1,c.length);
      //   if (c.indexOf(nameEQ) == 0) {
      //     iterationMax = parseInt(c.substring(nameEQ.length,c.length));
      //   }
      // }

      if(!bar)
        bar = $('.progress .progress-bar');

      while (idx<=size && status == 'ok' && iterationCount<iterationMax){

        let block = state.storeList.get(crossId);
        if (block) {

          if (block.audiosrc) {
            ++d.voiced_in_range;
          }

          let hasAssignment = state.currentJobInfo.mastering  || state.currentJobInfo.text_cleanup;
          let hasTask = state.tc_currentBookTasks.tasks.find((t) => {
            return t.blockid == block._id;
          })
          if (!hasTask && state.adminOrLibrarian) {
            hasTask = state.currentJobInfo.can_resolve_tasks.find((t) => {
              return t.blockid == block._id;
            });
          }
          if ((block.status && block.status.marked) || (!hasAssignment && !hasTask)) {
            switch (block.voicework) {
              case 'audio_file' :
                ++d.approved;
                break;
              case 'tts':
                ++d.approved_tts;
                break;
              case 'narration':
                ++d.approved_narration;
                break;
            }
            if (block.voicework !== 'tts' && block.footnotes && Array.isArray(block.footnotes) && block.footnotes.length > 0) {
              let ftn = block.footnotes.find(f => {
                return f.voicework === 'tts';
              });
              if (ftn) {
                ++d.approved_tts;
              }
            }
          }
          if (block.isChanged) {
            if (block.voicework === 'audio_file') {
              ++d.changed_in_range;
            }
            if (block.voicework === 'tts') {
              ++d.changed_in_range_tts;
            }
            if (block.voicework === 'narration') {
              ++d.changed_in_range_narration;
            }
          }
          if (block._id == selection.end._id) {
            status = 'break';
          }
          crossId = state.storeListO.getOutId(block.blockid);
          if (!crossId) {
            status = 'break';
          }
        } else {
          status = 'break';
        }
        idx++;
        iterationCount++;
      }


      if(idx<=size && status == 'ok'){
        let width = Math.ceil(idx/(size/100));
        width = (34*2)+34*(width/100);
        dispatch('setSelectionModalProgressWidth',width)
        console.log(`recountApprovedInRangeAsyncIteration ${idx}`)

        setTimeout( function() {
          dispatch('recountApprovedInRangeAsyncIteration',{crossId,idx,size,d,selection,resolve,bar}) },50);
      }else{

        resolve(d);
      }
    },

    async recountApprovedInRangeAsync({state, commit,dispatch}, selection = null) {

      let d = {};
      d.approved = 0;
      d.approved_tts = 0;
      d.approved_narration = 0;
      d.changed_in_range = 0;
      d.changed_in_range_tts = 0;
      d.changed_in_range_narration = 0;
      d.voiced_in_range = 0;

      if (!selection) {
        selection = state.blockSelection;
      }

      let promises = [];
      if (selection.start && selection.start._id && selection.end && selection.end._id) {
        let crossId = selection.start._id;
        promises.push(new Promise((resolve, reject) => {
          let size = state.storeList.size;
          let idx = 0;
          dispatch('recountApprovedInRangeAsyncIteration',{crossId,idx,size,d,selection,resolve})
        }))

      }else{
        promises.push(new Promise((resolve, reject) => {
          if (state.storeList.size > 0) {
            d.voiced_in_range = Array.from(state.storeList).filter(block => {
              return block[1].audiosrc != '';
            }).length;
            resolve(d)
          }else
            resolve(d)

        }))
      }

      return Promise.all(promises).then(function(result) {
        result = result.pop();
        let audio_mastering = state.tc_currentBookTasks.assignments && state.tc_currentBookTasks.assignments.indexOf('audio_mastering') !== -1;
        if (audio_mastering) {
          result.approved+= result.approved_narration;
          result.changed_in_range+=result.changed_in_range_narration;
        }
        commit('SET_CURRENTBOOK_COUNTER', {name: 'approved_audio_in_range', value: result.approved});
        commit('SET_CURRENTBOOK_COUNTER', {name: 'approved_tts_in_range', value: result.approved_tts});
        commit('SET_CURRENTBOOK_COUNTER', {name: 'changed_in_range_audio', value: result.changed_in_range});
        commit('SET_CURRENTBOOK_COUNTER', {name: 'changed_in_range_tts', value: result.changed_in_range_tts});

        commit('SET_CURRENTBOOK_COUNTER', {name: 'voiced_in_range', value: result.voiced_in_range});

      });
    },

    recountApprovedInRange({state, commit}, selection = null) {
      let approved = 0;
      let approved_tts = 0;
      let approved_narration = 0;
      let changed_in_range = 0;
      let changed_in_range_tts = 0;
      let changed_in_range_narration = 0;
      if (!selection) {
        selection = state.blockSelection;
      }
      if (selection.start && selection.start._id && selection.end && selection.end._id) {
        let crossId = selection.start._id;
        for (var idx=0; idx < state.storeList.size; idx++) {
          let block = state.storeList.get(crossId);
          if (block) {
            let hasAssignment = state.currentJobInfo.mastering  || state.currentJobInfo.text_cleanup;
            let hasTask = state.tc_currentBookTasks.tasks.find((t) => {
              return t.blockid == block._id;
            })
            //if (!hasAssignment && state.adminOrLibrarian) {
              //hasAssignment = state.currentJobInfo.completed;
            //}
            if (!hasTask && state.adminOrLibrarian) {
              hasTask = state.currentJobInfo.can_resolve_tasks.find((t) => {
                return t.blockid == block._id;
              });
            }
            if ((block.status && block.status.marked) || (!hasAssignment && !hasTask)) {
              switch (block.voicework) {
                case 'audio_file' :
                  ++approved;
                  break;
                case 'tts':
                  ++approved_tts;
                  break;
                case 'narration':
                  ++approved_narration;
                  break;
              }
              if (block.voicework !== 'tts' && block.footnotes && Array.isArray(block.footnotes) && block.footnotes.length > 0) {
                let ftn = block.footnotes.find(f => {
                  return f.voicework === 'tts';
                });
                if (ftn) {
                  ++approved_tts;
                }
              }
            }
            if (block.isChanged) {
              if (block.voicework === 'audio_file') {
                ++changed_in_range;
              }
              if (block.voicework === 'tts') {
                ++changed_in_range_tts;
              }
              if (block.voicework === 'narration') {
                ++changed_in_range_narration;
              }
            }
            if (block._id == selection.end._id) {
              break;
            }
            crossId = state.storeListO.getOutId(block.blockid);
            if (!crossId) {
              break;
            }
          } else break;
        }
      }
      let audio_mastering = state.tc_currentBookTasks.assignments && state.tc_currentBookTasks.assignments.indexOf('audio_mastering') !== -1;
      if (audio_mastering) {
        approved+= approved_narration;
        changed_in_range+=changed_in_range_narration;
      }
      commit('SET_CURRENTBOOK_COUNTER', {name: 'approved_audio_in_range', value: approved});
      commit('SET_CURRENTBOOK_COUNTER', {name: 'approved_tts_in_range', value: approved_tts});
      commit('SET_CURRENTBOOK_COUNTER', {name: 'changed_in_range_audio', value: changed_in_range});
      commit('SET_CURRENTBOOK_COUNTER', {name: 'changed_in_range_tts', value: changed_in_range_tts});
    },
    clearLocks({state, commit}, data) {
      if (data.type) {
        if (state.lockedBlocks.length > 0) {
          let list = state.lockedBlocks.filter(r =>  r.type === data.type);
          list.forEach(r =>  {
            commit('clear_block_lock', {block: {_id: r._id}, force: true})
          })
        }
      }
    },
    startAlignWatch({state, commit, dispatch}) {
      if (state.currentBookid) {
        //console.log('startAlignWatch', state.currentBookid);
        dispatch('getBookAlign', {watchId: state.currentBookid, repeat: 15000});
      }
    },
    getBookAlign({state, commit, dispatch}, {watchId = false, repeat = false} = {}) {
      //console.log('getBookAlign', 'state.currentBookid', state.currentBookid, 'watchId', watchId, 'repeat', repeat);
      if (state.currentBookid && (!watchId || watchId === state.currentBookid)) {
        //console.log(state.API_URL + 'align_queue/' + state.currentBookid);
        let api_url = state.API_URL + 'align_queue/' + state.currentBookid;
        return axios.get(api_url, {})
          .then(response => {
            if (response.status == 200) {
              let oldBlocks = state.aligningBlocks;
              let blocks = response.data.blocks;
              commit('alignActions/setAligningBooks', response.data.books);
              commit('alignActions/setAligningBlocks', response.data.blocks);
              let checks = [];
              if (oldBlocks.length > 0) {
                oldBlocks.forEach(b => {
                  let aligningBlock = blocks.find(bb => bb.blockid == b._id);
                  let aligningSubblock = null;// null means not splitted block alignment
                  if (b.partIdx !== null) {
                    aligningSubblock = blocks.find(bb => {
                      return bb.blockid === b._id && bb.partIdx === b.partIdx;
                    });
                    if (!aligningSubblock) {
                      aligningSubblock = false;// false means splitted block part was aligned
                    }
                  }
                  if (!aligningBlock || aligningSubblock === false) {
                    let blockStore = state.storeList.get(b._id);
                    let blockStoreO = state.storeListO.get(b._id);
                    if (blockStore) {
                      //blockStore.content+=' realigned';
                      checks.push(dispatch('getBlock', b._id)
                        .then(block => {
                          // splitted block part was aligned, more parts are still aligning
                          if (aligningBlock && aligningSubblock === false) {
                            blockStore.parts[b.partIdx] = block.parts[b.partIdx];
                            return {};
                          }
                          if (Array.isArray(blockStore.parts) && block && Array.isArray(block.parts) && blockStore.parts.length !== block.parts.length && b.partIdx !== null) {
                            let addedSubblocks = block.parts.length - blockStore.parts.length;
                            blockStore.parts.forEach((p, pIdx) => {
                              if (pIdx < b.partIdx && (p.isChanged || p.isAudioChanged)) {
                                block.parts[pIdx] = p;
                              } else if (pIdx > b.partIdx && (p.isChanged || p.isAudioChanged)) {
                                block.parts[pIdx + addedSubblocks] = p;
                              }
                            });
                          }
                          if (blockStore.isChanged) {

                            if (Array.isArray(blockStore.footnotes) && Array.isArray(block.footnotes) && blockStore.footnotes.length !== block.footnotes.length) {
                              block.footnotes = blockStore.footnotes;
                            }
                          }
                          if (Array.isArray(block.parts) && Array.isArray(blockStore.parts) && block.parts.length === blockStore.parts.length) {
                            let hasChangedPart = blockStore.parts.find(p => {
                              return p.isChanged;
                            });
                            if (hasChangedPart) {
                              if (Array.isArray(blockStore.flags) && Array.isArray(block.flags) && blockStore.flags.length !== block.flags.length) {
                                block.flags = blockStore.flags;
                              }
                            }
                            blockStore.parts.forEach((p, i) => {
                              if (p.inid) {
                                block.parts[i].inid = p.inid;
                              }
                              if (p.isChanged || p.isAudioChanged) {
                                block.parts[i] = p;
                              }
                            });
                          }
                          if (state.audioTasksQueue.block.blockId && state.audioTasksQueue.block.blockId === block.blockid && state.audioTasksQueue.block.partIdx !== null) {
                            blockStore = state.storeList.get(b._id);
                            if (Array.isArray(blockStore.parts) && blockStore.parts.length > 0 && Array.isArray(block.parts) && block.parts.length === blockStore.parts.length) {
                              blockStore.parts.forEach((p, i) => {
                                if (p.isAudioChanged) {
                                  block.parts[i] = p;
                                }
                              });
                            }
                          }
                          if (state.bookMode === 'edit') {
                            block = state.suspiciousWordsHighlight.setSuspiciousHighlight(block);
                          }
                          if (blockStore.audiosrc_config) {
                            block.audiosrc_config = blockStore.audiosrc_config;
                          }
                          return dispatch('tasks/getByBlockid', [block.blockid])
                          .then(() => {
                            store.commit('set_storeList', new BookBlock(block));
                            dispatch('checkInsertedBlocks', [blockStoreO.out, Array.isArray(block.out) ? block.out[0] : block.out])
                            return Promise.resolve();
                          })
                        })
                        .catch(err => {
                          console.log(err);
                          return Promise.resolve();
                        })
                      );
                    }
                  }
                });
              }
              return Promise.all(checks)
                .then(() => {
                  if (blocks && (oldBlocks.length != blocks.length)) {
                    dispatch('getAudioBook');
                    dispatch('getCurrentJobInfo');
                  }
                  commit('set_aligning_blocks', response.data.blocks);
                  if (checks.length > 0) {
                    dispatch('_setNotMarkedAsDoneBlocksCounter');
                    dispatch('recountApprovedInRange');
                    state.storeListO.refresh();
                  }
                  return Promise.resolve();
                })
                .then(() => {
                  if (checks.length > 0) {
                    dispatch('set_selected_blocks');
                  }
                  return Promise.resolve({status: 'ok'});
                })
                .catch(err => {
                  return {status: 'error', error: err};
                });
            }
            return Promise.resolve({status: 'ok'});
          })
          .catch(err => {
            //console.log(err);
            return Promise.resolve({status: 'error', error: err});
          })
          .then(response => {
            if (response && response.error) {
              console.log(response.error);
            }
            if (repeat) {
              if (watchId === state.currentBookid) {
                setTimeout(() => {
                  dispatch('getBookAlign', {watchId: watchId, repeat: repeat});
                }, repeat);
              }
            }
          });
      }
    },

    startAudiobookWatch({state, dispatch}) {
      if (state.currentBookid) {
        dispatch('getAudioBook', {watchId: state.currentBookid, repeat: 17500});
      }
    },

    getAudioBook ({state, commit, dispatch}, {bookid = false, watchId = false, repeat = false}={}) {
      if (state.updateAudiobookProgress) {
        if (repeat && watchId === state.currentBookid) {
            setTimeout(() => {
              dispatch('getAudioBook', {bookid: bookid, watchId: watchId, repeat: repeat})
            }, repeat);
        }
        return Promise.resolve();
      }
      //console.log('getAudioBook', bookid, state.currentBookid, watchId);
      if (!bookid) {
        bookid = state.currentBookid;
      }
      if (bookid && (!watchId || watchId === state.currentBookid)) {
        let set = bookid === state.currentBookid;
        let counters = dispatch('setCurrentBookCounters', ['narration_blocks', 'not_marked_blocks_missed_audio', 'not_marked_blocks']);

        //console.log(state.API_URL + 'books/' + bookid + '/audiobooks');
        let request = axios.get(state.API_URL + 'books/' + bookid + '/audiobooks')
          .then(audio => {
            if (audio.data) {
              if (set && !state.updateAudiobookProgress && !state.audioRenaming) {
                commit('set_currentAudiobook', audio.data);
              }
              return Promise.resolve(audio.data);
            } else {
              return Promise.resolve({});
            }
          })
          .catch(error => {
            return Promise.resolve({});
          });
        return Promise.all([request, counters])
        .then((answer)=>{
            //console.log('answer', answer);
            if (repeat) {
              if (watchId === state.currentBookid) {
                setTimeout(() => {
                  dispatch('getAudioBook', {bookid: bookid, watchId: watchId, repeat: repeat})
                }, repeat)
              }
            }
            return Promise.resolve(answer[0]);
        })
        .catch(err => {
          if (repeat && watchId === state.currentBookid) {
            setTimeout(() => {
              dispatch('getAudioBook', {bookid: bookid, watchId: watchId, repeat: repeat})
            }, repeat)
          }
        });
      } return {};
    },

    startJobInfoTimer({state, dispatch}) {
      let interval = 10000;
      //let interval = 60000;
      //console.log('startJobInfoTimer', state.jobInfoTimer);
      setTimeout(() => {
        if (!state.jobInfoTimer || Date.now() - state.jobInfoTimer >= interval) {
          dispatch('getCurrentJobInfo')
          .then(()=>{
            dispatch('startJobInfoTimer');
          });
        } else {
          dispatch('startJobInfoTimer');
        }
      }, interval);
    },

    getCurrentJobInfo({state, commit}, clear) {
      const default_currentJobInfo = {
        can_resolve_tasks: [],
        mastering: null,
        proofing: null,
        published: null,
        text_cleanup: null,
        is_proofread_unassigned: null,
        tasks_counter: [],
        executors: {editor: null, proofer: null, narrator: null},
        description: '',
        id: null,
        completed: null,
        workflow: {
          status: null,
          archived: null
        },
        locked_blocks: {proofer: [], narrator: [], editor: []},
        is_narrate_unassiged: false
      };
      if (state.jobInfoRequest) {
        return state.jobInfoRequest;
      }
      //commit('SET_ALLOW_BOOK_PUBLISH', false);
      if (state.currentBookid) {
        state.jobInfoRequest = axios.get(state.API_URL + 'tasks/book/' + state.currentBookid + '/job_info')
        if (clear) {
          state.currentJobInfo.tasks_counter = [];
          state.currentJobInfo.workflow = {status: null, archived: null};
        }
        return state.jobInfoRequest
          .then(data => {
            state.jobInfoTimer = Date.now();
            state.jobInfoRequest = null;
            state.currentJobInfo = data.data.id ? data.data : {can_resolve_tasks: [],
              mastering: null,
              proofing: null,
              published: null,
              text_cleanup: null,
              is_proofread_unassigned: null,
              tasks_counter: [],
              executors: {editor: null, proofer: null, narrator: null},
              description: '',
              id: null,
              completed: null,
              workflow: {
                status: null,
                archived: null
              },
              locked_blocks: {proofer: [], narrator: [], editor: []},
              is_narrate_unassiged: false};

            let publishButton = state.currentJobInfo.text_cleanup === false && !(typeof state.currentBookMeta.version !== 'undefined' && state.currentBookMeta.version === state.currentBookMeta.publishedVersion);
            commit('SET_BOOK_PUBLISH_BUTTON_STATUS', publishButton);

            if (state.currentJobInfo.workflow.status !== 'archived' && state.adminOrLibrarian ) {
              commit('SET_ALLOW_BOOK_PUBLISH', true);
            }
            commit('set_taskBlockMap');
            Vue.prototype.globalJobInfo = state.currentJobInfo;
            return Promise.resolve();
          })
          .catch(err => {
            state.jobInfoRequest = null;
            console.log(err);
            return Promise.reject(err);
          })
      }
    },
    getTaskTypes({state}) {
      return axios.get(state.API_URL + 'tasks/types').then(types => {
        state.taskTypes = types.data
        return Promise.resolve(state.taskTypes)
      })
      .catch(error => {
        return Promise.reject({})
      })
    },
    reimportBook({state, commit, dispatch}, data) {
      if (!state.currentBookid) {
        return Promise.reject({err: {response: {data: {message: 'Book is not selected'}}}});
      }
      return axios.post(state.API_URL + 'books/' + state.currentBookid + '/reimport', data.data, data.config).then((response) => {
          if (response.status === 200) {
            commit('clear_storeList');
            commit('clear_storeListO');
            let bookid = state.currentBookid;
            state.currentBookid = null;
            return dispatch('loadBook', bookid)
              .then(() => {
                return Promise.resolve(response);
              });
          }
          return Promise.resolve(response);
        }).catch((err) => {
          if (err && err.job_status_error) {
            commit('set_job_status_error', err.job_status_error);
            return Promise.resolve({});
          } else if (err && err.response && err.response.data && err.response.data.job_status_error) {
            commit('set_job_status_error', err.response.data.job_status_error);
            return Promise.resolve({});
          }
          return Promise.reject(err);
        });
    },
    updateJob({state}, update) {
      return axios.put(state.API_URL + 'jobs/' + encodeURIComponent(update.id), update)
        .then(() => {
          return Promise.resolve();
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    completeTextCleanup({state, dispatch}) {
      if (!state.currentBookMeta.bookid) {
        return Promise.reject({error: 'Book is not selected'});
      }
      return dispatch('updateBookMeta', {private: false})
        .then((doc) => {
          return axios.put(state.API_URL + 'task/' + state.currentBookMeta.bookid + '/finish_cleanup')
            .then((doc) => {
              if (doc.data && !doc.data.error) {
                state.tc_currentBookTasks.assignments.splice(state.tc_currentBookTasks.assignments.indexOf('content_cleanup'));
                dispatch('getProcessQueue');
                return Promise.all([dispatch('tc_loadBookTask', state.currentBookMeta.bookid),
                  dispatch('getCurrentJobInfo'),
                  dispatch('setCurrentBookCounters')])
                  .then(() => {
                    state.currentBookMeta.private = false;
                    return Promise.resolve(doc);
                  })
                  .catch(err => {
                    state.currentBookMeta.private = false;
                    return Promise.resolve(doc);
                  })
              } else {
                dispatch('updateBookMeta', {private: true})
              }
              return Promise.resolve(doc);
            })
            .catch((err) => {
              dispatch('updateBookMeta', {private: true});
              return Promise.reject(err);
            })
        })
        .catch((err) => {
          return Promise.reject(err);
        })
    },
    completeAudioMastering({state, dispatch}) {
      if (!state.currentBookMeta.bookid) {
        return Promise.reject({error: 'Book is not selected'});
      }
      return axios.put(state.API_URL + 'task/' + state.currentBookMeta.bookid + '/finish_mastering')
        .then((doc) => {
          if (!doc.data.error) {
            dispatch('tc_loadBookTask', state.currentBookMeta.bookid)
            dispatch('getCurrentJobInfo');
          } else {

          }
          return Promise.resolve(doc);
        })
        .catch((err) => {
          return Promise.reject(err);
        })
    },
    completeBatchApproveEditAndAlign({state, dispatch}) {
      if (!state.currentBookMeta.bookid) {
        return Promise.reject({error: 'Book is not selected'});
      }
      if (!(state.isAdmin || state.isLibrarian)){
        return Promise.resolve({data: {}});
      }

      return dispatch('updateBookMeta', {private: false})
        .then(() => {
          return axios.put(state.API_URL + 'books/' + state.currentBookMeta.bookid + '/batch_approve_edit_align')
            .then((doc) => {
              if (doc.data && !doc.data.error) {
                state.tc_currentBookTasks.assignments.splice(state.tc_currentBookTasks.assignments.indexOf('content_cleanup'));
                dispatch('getProcessQueue');
                return Promise.all([dispatch('tc_loadBookTask', state.currentBookMeta.bookid),
                  dispatch('getCurrentJobInfo'),
                  dispatch('setCurrentBookCounters')])
                  .then(() => {
                    state.currentBookMeta.private = false;
                    return Promise.resolve(doc);
                  })
                  .catch(err => {
                    state.currentBookMeta.private = false;
                    return Promise.resolve(doc);
                  })
              } else {
                dispatch('updateBookMeta', {private: true})
              }
              return Promise.resolve(doc);
            })
            .catch((err) => {
              dispatch('updateBookMeta', {private: true});
              return Promise.reject(err);
            })
        })
        .catch((err) => {
          return Promise.reject(err);
        })
    },
    completeBatchApproveModifications({state, dispatch}) {
      if (!state.currentBookMeta.bookid) {
        return Promise.reject({error: 'Book is not selected'});
      }
      if (!(state.isAdmin || state.isLibrarian)){
            return Promise.resolve({data: {}});
      }

      return dispatch('updateBookMeta', {private: false})
        .then((doc) => {
          return axios.put(state.API_URL + 'books/' + state.currentBookMeta.bookid + '/batch_approve_modifications')
            .then((doc) => {
              if (!doc.data.error) {
                state.tc_currentBookTasks.assignments.splice(state.tc_currentBookTasks.assignments.indexOf('content_cleanup'));
                dispatch('getProcessQueue');
                return Promise.all([dispatch('tc_loadBookTask', state.currentBookMeta.bookid),
                  dispatch('getCurrentJobInfo'),
                  dispatch('setCurrentBookCounters')])
                  .then(() => {
                    state.currentBookMeta.private = false;
                    return Promise.resolve(doc);
                  })
                  .catch(err => {
                    state.currentBookMeta.private = false;
                    return Promise.resolve(doc);
                  })
              } else {
                dispatch('updateBookMeta', {private: true})
              }
              return Promise.resolve(doc);
            })
            .catch((err) => {
              dispatch('updateBookMeta', {private: true});
              return Promise.reject(err);
            })
        })
        .catch((err) => {
          return Promise.reject(err);
        })
    },

    updateBookCollection({state, commit, dispatch}, collectionId = null) {
      if (!state.currentBookMeta.bookid) {
        return Promise.reject({error: 'book not selected'});
      }
      if (collectionId) {
        let api_url = state.API_URL + 'collection/' + collectionId + '/link_books';
        let oldCollectionId = state.currentBookMeta.collection_id;
        return axios.post(api_url, {books_ids: [state.currentBookMeta.bookid]}, {})
          .then((response) => {
            if (response.status===200) {
              let getOldCollection = new Promise((resolve, reject) => {
                if (oldCollectionId) {
                  return dispatch('getCollection', oldCollectionId)
                    .then(oldCollection => {
                      return resolve(oldCollection);
                    });
                } else {
                  return resolve({});
                }
              });
              return Promise.all([
                dispatch('getCollection', collectionId),
                getOldCollection
              ])
                .then(prepared => {
                  let [collection, oldCollection] = prepared;
                  state.currentBookMeta.collection_id = collectionId;
                  let index = state.books_meta.findIndex(b => {
                    return b.bookid === state.currentBookMeta.bookid;
                  });
                  if (typeof index !== 'undefined') {
                    //state.books_meta.splice(index, 1);
                    //commit('SET_BOOKLIST', list);
                    state.books_meta[index].collection_id = collectionId;
                  }
                  [collection, oldCollection].forEach(coll => {
                    if (coll._id) {
                      index = state.bookCollections.findIndex(c => {
                        return c._id === coll._id;
                      });
                      if (!index !== -1) {
                        state.bookCollections[index] = coll;
                      }
                    }
                  });
                  commit('PREPARE_BOOK_COLLECTIONS');
                  return Promise.resolve(response);
                });
            } else {

            }
            return Promise.resolve(response);
          }).catch((err) => {
            return Promise.reject(err);
          });
      } else if (state.currentBookMeta.collection_id) {
        let collection_id = state.currentBookMeta.collection_id;
        let api_url = state.API_URL + 'collection/' + collection_id + '/unlink_books';
        return axios.post(api_url, {books_ids: [state.currentBookMeta.bookid]}, {})
          .then((response) => {
          if (response.status === 200) {
            state.currentBookMeta.collection_id = null;
            let collectionIndex = state.bookCollections.findIndex(c => {
              return c._id === collection_id;
            });
            if (collectionIndex !== -1) {
              state.bookCollections[collectionIndex].bookids = response.data.bookids;
              commit('PREPARE_BOOK_COLLECTIONS');
            }
          } else {

          }
          return Promise.resolve(response);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
    },
    setJobStatus({state, dispatch, commit}, status) {
      if (!state.currentJobInfo.id) {
        return Promise.reject({error: 'Book is not selected'});
      }
      let oldStatus = state.currentBookMeta.job_status;
      state.currentBookMeta.job_status = status;
      return axios.post(state.API_URL + 'jobs/' + encodeURIComponent(state.currentJobInfo.id) + '/status/' + status)
        .then(() => {
          if (state.currentBookMeta.bookid) {
            state.currentBookMeta.job_status = status;
          }
          //dispatch('updateBooksList');
          if (state.currentBookMeta.bookid) {
            dispatch('tc_loadBookTask', state.currentBookMeta.bookid);
            state.currentBookid = null;
            return dispatch('loadBook', state.currentBookMeta.bookid)
              .then(() => {
                return Promise.resolve();
              });
          }
          return Promise.resolve();
        })
        .catch(err => {
          state.currentBookMeta.job_status = oldStatus;
          return Promise.reject(err);
        })
    },
    insertBlock({state, commit, dispatch}, data) {
      return axios.post(state.API_URL + 'book/block', {
          block_id: data.blockid,
          direction: data.direction,
          block: data.newBlock
        })
        .then(response => {
          if (response && response.data && response.data.block && response.data.block.job_status_error) {
            commit('set_job_status_error', response.data.block.job_status_error);
          } else {
            if (response && response.data && response.data.new_block) {
              let new_block = response.data.new_block;
              if (!state.storeListO.get(new_block.blockid)) {
                state.storeListO.addBlock(new_block);
              }
              if (!state.storeList.get(new_block.blockid)) {// can be already added by syncgronization
                commit('set_storeList', new BookBlock(new_block));
              }
              if (state.selectedBlocks && state.selectedBlocks.length > 0) {
                let listIds = state.storeListO.idsArray();
                let firstIndex = listIds.indexOf(state.selectedBlocks[0].blockid);
                let insertedIndex = listIds.indexOf(new_block.blockid);
                let lastIndex = listIds.indexOf(state.selectedBlocks[state.selectedBlocks.length - 1].blockid);
                if (insertedIndex > firstIndex && insertedIndex < lastIndex) {
                  state.storeListO.get(new_block.blockid).checked = true;
                  dispatch('set_selected_blocks');
                  dispatch('getAlignCount');
                }
              }
            }
            return Promise.resolve(response);
          }
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    blocksJoin({state, commit, dispatch}, data) {
      let rangeOutId = state.storeListO.getOutId(data.donorBlock_id);
      let rangeInId = state.storeListO.getInId(data.donorBlock_id);
      return axios.post(state.API_URL + 'book/block_join/', {
          resultBlock_id: data.resultBlock_id,
          donorBlock_id: data.donorBlock_id
        })
        .then(response => {
          if (state.blockSelection.start && data.donorBlock_id === state.blockSelection.start._id) {
            if (state.blockSelection.start._id === state.blockSelection.end._id) {
              dispatch('set_block_selection', {start: {}, end: {}});
            } else {
              if (rangeOutId) {
                dispatch('set_block_selection', Object.assign(state.blockSelection, {
                  start: {_id: rangeOutId}
                }));
              }
            }
          } else if (state.blockSelection.end && data.donorBlock_id === state.blockSelection.end._id) {
            if (state.blockSelection.start._id === state.blockSelection.end._id) {
              dispatch('set_block_selection', {start: {}, end: {}});
            } else {
              if (rangeInId) {
                dispatch('set_block_selection', Object.assign(state.blockSelection, {
                  end: {_id: rangeInId}
                }));
              }
            }
          }
          if (!state.currentJobInfo.text_cleanup) {
            dispatch('tc_loadBookTask', state.currentBookid);
          }
          return Promise.all([
            dispatch('getBookAlign'),
            dispatch('setBlocksDisabled/getDisabledBlocks')
          ])
            .then(() => {
              if (response.data && response.data.blocks) {
                if (response.data.blocks.donorBlock && response.data.blocks.donorBlock.id) {
                  state.storeListO.delExistsBlock(response.data.blocks.donorBlock.id);
                  state.storeList.delete(response.data.blocks.donorBlock.blockid);
                  commit('block_removed', [response.data.blocks.donorBlock]);
                }
                if (response.data.blocks.updatedBlock) {
                  commit('set_publicationErrors', [[response.data.blocks.updatedBlock]]);
                }
              }
              return dispatch('checkResponse', response);
            });
        })
        .catch(err => {
          return Promise.reject(err);
        })
    },
    removeBlock({state, commit, dispatch}, block) {
      return axios.delete(state.API_URL + 'book/block/' + encodeURIComponent(block._rid))
        .then(response => {
          if (state.blockSelection.start && block.blockid === state.blockSelection.start._id) {
            if (state.blockSelection.start._id === state.blockSelection.end._id) {
              dispatch('set_block_selection', {start: {}, end: {}});
            } else {
              let outId = state.storeListO.getOutId(block.blockid);
              if (outId) {
                dispatch('set_block_selection', Object.assign(state.blockSelection, {
                  start: {_id: outId}
                }));
              }
            }
          } else if (state.blockSelection.end && block.blockid === state.blockSelection.end._id) {
            if (state.blockSelection.start._id === state.blockSelection.end._id) {
              dispatch('set_block_selection', {start: {}, end: {}});
            } else {
              let inId = state.storeListO.getInId(block.blockid);
              if (inId) {
                dispatch('set_block_selection', Object.assign(state.blockSelection, {
                  end: {_id: inId}
                }));
              }
            }
          }
          //dispatch('recountVoicedBlocks');
          commit('block_removed', [block]);
          return dispatch('checkResponse', response);
        })
        .catch(err => {
          return dispatch('checkError', err);
        })
    },
    saveNarrated({state, commit, dispatch}, data) {
      return axios.post(state.API_URL + 'book/block/' + data.blockid + '/audio', data, {})
        .then(response => {
          //console.log(response);
          //return dispatch('getBookAlign')
            //.then(() => {
            return dispatch('tasks/getByBlockid', [data.blockid])
              .then(() => {
                return Promise.resolve(response);
              });
            //});
        })
        .catch(err => {
          return dispatch('checkError', err);
        });
    },
    checkError({state, commit}, err) {
      if (err && err.response && err.response.data && err.response.data.job_status_error) {
        commit('set_job_status_error', err.response.data.job_status_error);
      } else if (err && err.job_status_error) {
        commit('set_job_status_error', err.job_status_error);
      }
      return Promise.reject(err);
    },
    checkResponse({state, commit}, response) {
      if (response && response.data && response.data.job_status_error) {
        commit('set_job_status_error', response.data.job_status_error);
        return Promise.reject(response);
      } else {
        return Promise.resolve(response);
      }
    },
    createDummyBook({state, commit}, data) {
      return axios.post(state.API_URL + 'books/dummy', data, {})
      .then(response => {
          //console.log(response);
          return Promise.resolve(response);
        })
        .catch(err => {
          return Promise.reject();
        });
    },
    updateBlockPart({state, dispatch, commit}, [id, update, blockIdx, realign]) {
      let url = `books/blocks/${encodeURIComponent(id)}/part/${blockIdx}`;
      if (realign) {
        url+= '?realign=true';
      }
      let isSplitting = update.content ? update.content.match(/<i class="pin"><\/i>/img) : [];
      isSplitting = isSplitting ? isSplitting.length : 0;
      update = state.suspiciousWordsHighlight.clearSuspiciousHighlight(update);

      return axios.put(state.API_URL + url, update)
        .then((response) => {
          let storeBlock = state.storeList.get(response.data.blockid);
          if (storeBlock.audiosrc_config) {// stored only locally
            response.data.audiosrc_config = storeBlock.audiosrc_config;
          }
          if (isSplitting && storeBlock.parts.length !== response.data.parts.length) {
            /*response.data.parts.forEach((p, pIdx) => {
              if (pIdx < blockIdx || pIdx > blockIdx + isSplitting) {
                response.data.parts[pIdx] = storeBlock.parts[pIdx - isSplitting];
              }
            });*/
            storeBlock.parts.forEach((p, pIdx) => {
              if (pIdx < blockIdx && (p.isChanged || p.isAudioChanged)) {
                response.data.parts[pIdx] = p;
              } else if (pIdx > blockIdx && (p.isChanged || p.isAudioChanged)) {
                //response.data.parts[pIdx + isSplitting] = p;
                response.data.parts[pIdx + isSplitting] = Object.assign(response.data.parts[pIdx + isSplitting], {
                  content: p.content,
                  inid: p.inid,
                  isAudioChanged: p.isAudioChanged,
                  isChanged: p.isChanged,
                  manual_boundaries: p.manual_boundaries,
                  _id: p._id
                });
              }
            });
          } else if (Array.isArray(storeBlock.parts)) {
            storeBlock.parts.forEach((p, pIdx) => {
              if ((p.isChanged || p.isAudioChanged) && pIdx !== blockIdx) {
                response.data.parts[pIdx] = p;
              }
            });
          }
          if (state.bookMode === 'edit') {
            state.suspiciousWordsHighlight.setSuspiciousHighlight(response.data);
          }
          commit('set_storeList', new BookBlock(response.data));
          commit('set_publicationErrors', [[response.data]]);
          state.storeListO.refresh();
          return Promise.all([
            dispatch('getBookAlign'),
            dispatch('getCurrentJobInfo'),
            dispatch('tc_loadBookTask', state.currentBookMeta.bookid)
          ])
          .then(() => {
            return Promise.resolve(response.data);
          });
        });
    },
    getProcessQueue({state, dispatch, commit}) {
      if (state.currentBookMeta.bookid) {
        let lockedBlocks = lodash.cloneDeep(state.lockedBlocks);
        return axios.get(state.API_URL + 'process_queue/' + state.currentBookMeta.bookid)
          .then(response => {
            //locks
            let oldIds = {};
            if (typeof response.data !== 'undefined' && Array.isArray(response.data)) {
              lockedBlocks.forEach(b => {
                let r = response.data.find(_r => {
                  return _r.blockid === b._id && _r.taskType === b.type;
                });
                if (!r) {
                  oldIds[b._id] = b.type;
                }
              });
              let clearLocks = Promise.resolve();
              if (Object.keys(oldIds).length > 0) {
                clearLocks = dispatch('getBlocks', Object.keys(oldIds))
                  .then((blocks) => {
                    blocks.forEach(block => {
                      commit('set_storeList', new BookBlock(block));
                      commit('clear_block_lock', {block: {blockid: block.blockid}, type: oldIds[block.blockid]});
                    });
                    return {};
                  });
              }
              return clearLocks
                .then(() => {
                  if (response.data.length > 0) {
                    response.data.forEach(r => {
                      let voicework, updateType, blockType;
                      if (r.taskType === 'changeVoiceWork') {
                        ({updateType, voicework, blockType} = JSON.parse(r.content));
                      }
                      delete r.content;
                      dispatch('addBlockLock', {
                        block: r,
                        type: r.taskType,
                        inProcess: true,
                        blockType,
                        updateType,
                        voicework
                      });
                    });
                    dispatch('startProcessQueueWatch');
                  }
                  if (state.lockedBlocks.length === 0) {
                    dispatch('stopProcessQueueWatch');
                    dispatch('tc_loadBookTask');
                  }
                  //console.log(state.lockedBlocks)
                });
            }
            return response.data;
          })
          .catch(err => {
            console.log(err.message, err.stack);
            return Promise.reject(err);
          });
      }
    },
    startProcessQueueWatch({state, dispatch}) {
      if (!state.processQueueWatch) {
        state.processQueueWatch = setInterval(() => {
          dispatch('getProcessQueue');
        }, 20000);
      }
    },
    stopProcessQueueWatch({state}) {
      if (state.processQueueWatch) {
        clearInterval(state.processQueueWatch);
        state.processQueueWatch = null;
      }
    },
    generateSplitDemo({state, commit}) {
      if (state.currentBookMeta.bookid) {
        state.currentBookMeta.split_demo_time = -1;
        return axios.post(state.API_URL + 'books/split_demo/' + state.currentBookMeta.bookid)
          .then((response) => {
            if (response.data.bookid === state.currentBookMeta.bookid) {
              commit('SET_CURRENTBOOK_META', response.data);
            }
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
    },
    getConfig({state}, config) {
      return axios.get(`${state.API_URL}config/${config}`).then(data => {
        return Promise.resolve(data.data);
      })
      .catch(error => {
        return Promise.reject({})
      })
    },

    liveDBMetaUpdate({state, commit, dispatch}) {
      if(store.state.watched.metaV){
        store.state.liveDB.startWatch(store.state.watched.metaV + '-metaV', 'metaV', {bookid: store.state.watched.metaV}, (data) => {
          commit('SET_CURRENTBOOK_META', data.meta)
        })
        setTimeout(() => {
          return axios.get(`${state.API_URL}livedb/update/meta/${store.state.watched.metaV}`)
        }, 1000)
      }
    },
    reloadBook({state, commit, dispatch}) {
      commit('clear_storeList');
      commit('clear_storeListO');
      let bookid = state.currentBookid;
      state.currentBookid = null;
      return dispatch('loadBook', bookid)
        .then((response) => {
          return Promise.resolve(response);
        })
    },
    generateCompleteAudio({state, commit}, blockcount) {
      if (state.currentBookMeta.bookid) {
        state.currentBookMeta.complete_audio_time = -1;
        let selection = {};
        if (state.blockSelection.start._id) {
          selection.start = state.blockSelection.start._id;
        } else if (state.storeList.entries().next().value) {
          selection.start = state.storeList.entries().next().value[0]
        }
        if (state.blockSelection.end._id) {
          selection.end = state.blockSelection.end._id;
        } else {
          let countUntilLastBlock = 0;
          for (const element of state.storeList.entries()) {
            if(countUntilLastBlock == state.storeList.size - 1 ){selection.end = element[0]}
            countUntilLastBlock++;
          }
        }
        selection.lastBuildBlocksCount = blockcount ? blockcount : 0;
        return axios.post(`${state.API_URL}books/complete_audio/${state.currentBookMeta.bookid}`, {
          selection: selection,
          format: 'm4a'
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }
    },
    getTaskUsers({state, commit}) {
      return axios.get(`${state.API_URL}tasks/users`).then(users => {
        if (Array.isArray(users.data)) {
          let user_id = state.auth.getSession().user_id;
          users.data.sort((a, b) => {
            /*if (a._id === 'unassigned') {
              return -1;
            }
            if (b._id === 'unassigned') {
              return 1;
            }*/
            if (a._id === user_id) {
              return -1;
            }
            if (b._id === user_id) {
              return 1;
            }
            let a_name = a.name ? a.name : a._id;
            let b_name = b.name ? b.name : b._id;
            return a_name.toLocaleLowerCase() > b_name.toLocaleLowerCase() ? 1 : -1;
          });
        }
        //state.taskUsers = users.data;
        for (let role in state.taskUsers) {
          state.taskUsers[role] = [];
          //let's add unassigned user to narrators:
          for (let i in users.data) {
            if (users.data[i].roles.indexOf(role) != -1 && users.data[i].enable === true) {
              state.taskUsers[role].push(users.data[i])
            }
          }
        }
        return Promise.resolve();
      })
      .catch(error => {
        return Promise.reject(error);
      })
    },
    recountVoicedBlocks({state, commit}, selection = null) {
      let voiced_in_range = 0;
      if (!selection) {
        selection = state.blockSelection;
      }
      if (selection.start && selection.start._id && selection.end && selection.end._id) {
        let crossId = selection.start._id;
        for (var idx=0; idx < state.storeList.size; idx++) {
          let block = state.storeList.get(crossId);
          if (block) {
            if (block.audiosrc) {
              ++voiced_in_range;
            }
            if (block._id == selection.end._id) {
              break;
            }
            crossId = state.storeListO.getOutId(block.blockid);
            if (!crossId) {
              break;
            }
          } else break;
        }
        commit('SET_CURRENTBOOK_COUNTER', {name: 'voiced_in_range', value: voiced_in_range});
      } else {
        if (state.storeList.size > 0) {
          voiced_in_range = Array.from(state.storeList).filter(block => {
            return block[1].audiosrc != '';
          }).length;
          commit('SET_CURRENTBOOK_COUNTER', {name: 'voiced_in_range', value: voiced_in_range});
        }
      }
    },
    revertAudio({state, dispatch}, [blockid, partIdx]) {
      return axios.post(`${state.API_URL}book/block/${blockid}${partIdx !== null ? '/' + partIdx : ''}/audio/revert/${state.bookMode}`)
        .then((res) => {
          return dispatch('getBookAlign')
            .then(() => {
              return Promise.resolve(res);
            });

        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    setAudioTasksBlockId({state, dispatch}, [blockId, checkId, partIdx]) {
      if (blockId !== state.audioTasksQueue.block.blockId || partIdx !== state.audioTasksQueue.block.partIdx) {
        dispatch('clearAudioTasks', true);
        state.audioTasksQueue.running = null;
        state.audioTasksQueue.block.blockId = blockId;
        state.audioTasksQueue.block.checkId = checkId;
        state.audioTasksQueue.block.partIdx = typeof partIdx === 'undefined' ? null : partIdx;
      }
    },
    addAudioTask({state, dispatch, commit}, [type, options, wordMap]) {
      let time = Date.now();
      let block = state.storeList.get(state.audioTasksQueue.block.blockId);
      let queueBlock = state.audioTasksQueue.block;
      let part = queueBlock.partIdx === null ? block : block.parts[queueBlock.partIdx];
      let record = {
        type: type,
        options: options,
        time: time,
        wordMap: wordMap,
        modified: part.isAudioChanged,
        //audiosrc: part.audiosrc,
        //audiosrc_ver: Object.assign({}, part.audiosrc_ver)
      };
      if (queueBlock.partIdx === null) {
        block.isAudioChanged = true;
      } else {
        block.parts[queueBlock.partIdx].isAudioChanged = true;
      }
      if (localAudioTasks.indexOf(type) === -1) {
        state.audioTasksQueue.queue.push(record);
      }
      state.audioTasksQueue.time = time;
      state.audioTasksQueue.log.push(record);
      if ((state.audioTasksQueue.queue.length >= audioTasksQueueRunSize/* || record.type === 'fade'*/) && !state.audioTasksQueue.running) {
        dispatch('applyTasksQueue', [audioTasksQueueRunSize, state.audioTasksQueue.block.blockId, state.audioTasksQueue.block.partIdx]);
      }
      //this.$root.$emit('from-audioeditor:tasks-queue-push', this.blockId, this.audioTasksQueue.queue);
    },
    popAudioTask({state}) {
      let log = state.audioTasksQueue.log.pop();
      if (localAudioTasks.indexOf(log.type) === -1) {
        state.audioTasksQueue.queue.pop();
      }
      if (state.audioTasksQueue.log.length > 0) {
        state.audioTasksQueue.time = state.audioTasksQueue.log[state.audioTasksQueue.log.length - 1].time;
      } else {
        state.audioTasksQueue.time = null;
      }
    },
    clearAudioTasks({state}, cancel_running = true) {
      state.audioTasksQueue.queue = [];
      state.audioTasksQueue.log = [];
      state.audioTasksQueue.time = null;
      if (cancel_running) {
        state.audioTasksQueue.running = null;
      }
      state.audioTasksQueue.block.blockId = null;
    },
    shiftAudioTask({state}) {
      state.audioTasksQueue.queue.shift();
      if (state.audioTasksQueue.queue.length > 0) {
        state.audioTasksQueue.time = state.audioTasksQueue.queue[state.audioTasksQueue.queue.length - 1].time;
      } else {
        state.audioTasksQueue.time = null;
      }
    },
    undoTasksQueue({state, dispatch}) {
      let queueBlock = state.audioTasksQueue.block;
      let block = state.storeList.get(queueBlock.blockId);
        if (block) {
        if (block.getIsSplittedBlock()) {
          block.undoPartContent(queueBlock.partIdx);
          block.undoPartManualBoundaries(queueBlock.partIdx);
          if (state.audioTasksQueue.log.length > 1) {
            //block.undoPartAudiosrc(queueBlock.blockPartIdx);
            let log = state.audioTasksQueue.log[state.audioTasksQueue.log.length - 2];
            if (log.audiosrc) {
              block.parts[queueBlock.partIdx].audiosrc = log.audiosrc;
              block.parts[queueBlock.partIdx].audiosrc_ver = log.audiosrc_ver || {};
            }
          }
          //this.$root.$emit('for-audioeditor:load', this.block.getPartAudiosrc(this.blockPartIdx, 'm4a'), this.block.getPartContent(this.blockPartIdx), false, this.blockPart);
        } else {
          //console.log(state.audioTasksQueue.log[state.audioTasksQueue.log.length - 1], state.audioTasksQueue.log[0]);
          block.undoContent();
          block.undoManualBoundaries();
          //block.undoAudiosrc();
          if (state.audioTasksQueue.log.length > 1) {
            let log = state.audioTasksQueue.log[state.audioTasksQueue.log.length - 2];
            if (log.audiosrc) {
              block.audiosrc = log.audiosrc;
              block.audiosrc_ver = log.audiosrc_ver || {};
            }
          }
        }
        dispatch('popAudioTask');
      }
    },
    applyTasksQueue({state, dispatch}, [runSize, blockid, partIdx]) {
      if (!blockid) {
        blockid = state.audioTasksQueue.block.blockId;
      }
      if (!partIdx) {
        partIdx = state.audioTasksQueue.block.partIdx;
      }
      if (runSize === null) {
        runSize = state.audioTasksQueue.queue.length;
      }
      if (state.audioTasksQueue.queue.length === 0) {
        return Promise.resolve();
      }
      let block = state.storeList.get(blockid);
      let content = block.getPartContent(partIdx || 0);
      let queue = state.audioTasksQueue.queue.slice(0, runSize);
      let queueBlock = state.audioTasksQueue.block;
      queue.forEach((q, i) => {
        if (i < queue.length - 1) {
          delete q.wordMap;
        }
      })
      state.audioTasksQueue.running = Object.assign({}, queue[queue.length - 1]);
      return axios.post(`${state.API_URL}book/block/${encodeURIComponent(block._rid)}${partIdx !== null ? '/' + partIdx : ''}/apply_queue`, {
        queue: queue,
        block: {
          content: content,
          audiosrc: block.getPartAudiosrc(partIdx || 0, false, false),
          modified: queue[0].modified
        }
      })
        .then((res) => {
          state.audioTasksQueue.queue.splice(0, runSize);
          state.audioTasksQueue.running = null;
          let data = [];
          if (Array.isArray(res.data)) {
            data = res.data.filter(r => {
              return r.time <= state.audioTasksQueue.time;
            })
            data.forEach(r => {
              let l = state.audioTasksQueue.log.find(l => {
                return l.time === r.time;
              });
              if (l) {
                l.audiosrc = r.audiosrc;
                //l.audiosrc_ver = r.audiosrc_ver;
                l.process_info = r.process_info ? r.process_info : {};
              }
            });
          }
          if (data.length > 0) {
            block.setPartAudiosrc(state.audioTasksQueue.block.partIdx || 0, data[data.length - 1].audiosrc, {});
            let historyKey = queueBlock.partIdx === null ? '' : `parts.${queueBlock.partIdx}.`;
            //let j = block.history[historyKey + 'audiosrc'].length;
            if (Array.isArray(block.history[historyKey + 'audiosrc'])) {
              /*for (let i = data.length - 1, j = block.history[historyKey + 'audiosrc'].length - 1; i >= 0 && j >= 0; --i, --j) {
                //console.log(i, j);
                ['audiosrc', 'audiosrc_ver'].forEach(k => {
                  let h = block.history[`${historyKey}${k}`][j];
                  if (h) {
                    block.history[`${historyKey}${k}`][j] = data[i][k];
                  }
                });
              }*/
              block.history[historyKey + 'audiosrc'].pop();
              block.history[historyKey + 'audiosrc_ver'].pop();
            }
            //console.log(block.history);
          }
          //console.log(state.audioTasksQueue);
          let hasFadeAction = state.audioTasksQueue.queue.find(r => {
            return r.type === 'fade';
          });
          if ((state.audioTasksQueue.queue.length >= 5/* || hasFadeAction*/) && !state.audioTasksQueue.running) {
            dispatch('applyTasksQueue', [null]);
          }
          return Promise.resolve(data);

        })
        .catch(err => {
          state.audioTasksQueue.running = null;
          return Promise.reject(err);
        });
    },
    saveBlockAudio({state, dispatch}, [realign, preparedData]) {
      let block = state.storeList.get(state.audioTasksQueue.block.blockId);
      let alignBlock = state.audioTasksQueue.block;
      let api_url = `${state.API_URL}book/block/${encodeURIComponent(block._rid)}/audio_edit${alignBlock.partIdx === null ? '' : '/part/' + alignBlock.partIdx}`;
      let data = {
        audiosrc: preparedData.audiosrc || block.getPartAudiosrc(alignBlock.partIdx || 0, false, false),
        content: preparedData.content || block.getPartContent(alignBlock.partIdx || 0),//content: this.blockContent(),
        manual_boundaries: block.getPartManualBoundaries(alignBlock.partIdx || 0),
        mode: state.bookMode,
        recording_pauses: block.getPartRecordingPauses(alignBlock.partIdx || 0),
        audio_silences: block.getPartAudioSilences(alignBlock.partIdx || 0),
      };
      if (Array.isArray(state.audioTasksQueue.log)) {
        state.audioTasksQueue.log.filter(l => {
          return l.process_info && Object.keys(l.process_info).length > 0;
        })
        .forEach(l => {
          if (l.process_info.cut_at_start === true) {
            data.audio_blockid_prev = null;
          }
          if (l.process_info.cut_at_end === true) {
            data.audio_blockid_next = null;
          }
        });
      }
      if (block.getIsSplittedBlock()) {
        block.parts[alignBlock.partIdx].isSaving = true;
      } else {
        block.isSaving = true;
      }
      if (realign) {
        api_url+= '?realign=true';
      }
      return axios.post(api_url, data, {})
        .then(response => {
          return new Promise((resolve, reject) => {
            if (realign) {
              return dispatch('getBookAlign')
                .then(() => {
                  return resolve(response);
                });
            } else {
              return resolve(response);
            }
          });
        })
        .then(response => {
          //return Promise.resolve(response);
          dispatch('getCurrentJobInfo');
          if (response.status == 200) {
            if (block.getIsSplittedBlock()) {
              let part = response.data.parts[alignBlock.partIdx];
              block.setPartContent(alignBlock.partIdx, part.content);
              block.setPartAudiosrc(alignBlock.partIdx, part.audiosrc, part.audiosrc_ver);
              block.setPartManualBoundaries(alignBlock.partIdx, part.manual_boundaries || []);
              block.setPartAudiosrcOriginal(alignBlock.partIdx, part.audiosrc_original || null);
              block.setPartContentChanged(alignBlock.partIdx, part.content_changed || false);
              block.isAudioChanged = false;
              //this.isChanged = false;
              block.parts[alignBlock.partIdx].isAudioChanged = false;
              if (Array.isArray(response.data.parts) && response.data.parts.length !== block.parts.length) {
                block.parts = response.data.parts;
              }
              //return Promise.resolve(response);
            } else {
              //if (this.isCompleted) {
                //this.tc_loadBookTask();
              //}

              if (block.status.marked != response.data.status.marked) {
                block.status.marked = response.data.status.marked;
              }
              block.isAudioChanged = false;
              //this.block.isChanged = false;
              block.content = response.data.content;
              block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
              //this.blockAudio.map = response.data.content;
              //this.blockAudio.src = this.block.getAudiosrc('m4a');
              //block.isSaving = false;
              block.manual_boundaries = response.data.manual_boundaries || [];
              block.audiosrc_original = response.data.audiosrc_original;
              if (Array.isArray(response.data.parts)) {
                block.parts = response.data.parts;
              }
              /*Vue.nextTick(() => {
                if (Array.isArray(this.block.flags) && this.block.flags.length > 0) {
                  this.block.flags.forEach(f => {
                    this.updateFlagStatus(f._id);
                  });
                  //console.log(this.$refs.blockContent.innerHTML)
                }
              })*/
              //return this.putBlock(this.block);
              //return Promise.resolve(response);
            }
            return dispatch('tasks/getByBlockid', [block.blockid]).then(() => response);
          }
        })
        .catch(err => {
          /*this.isSaving = false;
          this.checkError(err);
          this.$root.$emit('for-audioeditor:set-process-run', false);
          this.$root.$emit('set-error-alert', err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Failed to apply your correction. Please try again.');*/
          return Promise.reject(err)
        });
    },
    updateStoreFlag({state}, [blockid, flagId, updated]) {
      let block = state.storeList.get(blockid);
      if (block) {
        let storeFlag = block.flags.find(f => {
          return f._id === flagId;
        });
        let index = block.flags.indexOf(storeFlag);
        if (storeFlag && index !== -1) {
          block.flags[index] = updated;
        } else {
          block.flags.push(updated);
        }
      }
    },
    discardAudioChanges({state}) {
      let block = state.storeList.get(state.audioTasksQueue.block.blockId);
      let queueBlock = state.audioTasksQueue.block;
      let api_url = `${state.API_URL}book/block/${encodeURIComponent(block._rid)}/audio_edit`;
      if (queueBlock.partIdx !== null) {
        api_url+= '/part/' + queueBlock.partIdx;
      }
      return axios.delete(api_url, {}, {})
        .then(response => {
          if (response.status == 200 && response.data) {
            let part = queueBlock.partIdx !== null ? response.data.parts[queueBlock.partIdx] : response.data;
            block.setPartContent(queueBlock.partIdx || 0, part.content);
            block.setPartAudiosrc(queueBlock.partIdx || 0, part.audiosrc, part.audiosrc_ver);
            block.setPartManualBoundaries(queueBlock.partIdx || 0, part.manual_boundaries || []);
            if (queueBlock.partIdx !== null) {
              block.parts[queueBlock.partIdx].isAudioChanged = false;
              block.clearPartHistory(queueBlock.partIdx);
            } else {
              block.isAudioChanged = false;
              block.clearHistory();
            }
          }
          return Promise.resolve(response);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    mergeBlockParts({state, commit, dispatch}, [blockid, partFrom, partTo, blockRid]) {
      return axios.post(`${state.API_URL}books/blocks/${encodeURIComponent(blockRid)}/parts/${partFrom}/merge/${partTo}`, {mode: state.bookMode})
        .then((response) => {
          let storeBlock = state.storeList.get(blockid);
          if (storeBlock && Array.isArray(storeBlock.parts) && storeBlock.parts.length > 2) {
            storeBlock.parts.forEach((p, pIdx) => {
              if (p.isChanged || p.isAudioChanged) {
                if (pIdx < partFrom) {
                  response.data.parts[pIdx] = p;
                } else if (pIdx > partTo) {
                  response.data.parts[pIdx - 1] = p;
                }
              }
            });
          }
          commit('set_storeList', new BookBlock(response.data));
          dispatch('getCurrentJobInfo');
          dispatch('tc_loadBookTask', state.currentBookid);
          commit('set_publicationErrors', [[response.data]]);
          return Promise.resolve(response.data);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    setPauseAfter({state}, [blockType, value]) {
      if (state.blockSelection.start._id && state.blockSelection.end._id) {
        return axios.post(`${state.API_URL}books/${state.currentBookid}/blocks/pause_after`, {
          range: {
            start_id: state.blockSelection.start._id,
            end_id: state.blockSelection.end._id
          },
          block_type: blockType,
          value: value === 'none' ? null : value,
          mode: state.bookMode
        })
        .then((response) => {
          if (Array.isArray(response.data)) {
            response.data.forEach(b => {
              let block = state.storeList.get(b.blockid);
              if (block) {
                block.setUpdated(b.updated);
                block.setPauseAfter(b.pause_after);
                block.status.marked = b.status.marked;
              }
            });
          }
          return Promise.resolve(true);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }
    },
    updateAudiobook({state, commit, dispatch}, [id, data, bookid = null]) {
      let url = `${state.API_URL}books/${state.currentBookid ? state.currentBookid : bookid}/audiobooks/chunks`;
      if (id) {
        url+= `/${encodeURIComponent(id)}`;
      }
      commit('set_updateAudiobookProgress', true);
      return axios.post(url, data, {})
        .then(response => {
          commit('set_updateAudiobookProgress', false);
          if (response && response.data && response.data.audio && response.data.audio.id) {
            commit('set_currentAudiobook', response.data.audio);
            axios.put(`${state.API_URL}task/${state.currentBookid ? state.currentBookid : bookid}/audio_imported`, {})
              .then((link_response) => {
                //vm.closeForm(response)
                dispatch('tc_loadBookTask', state.currentBookid);
              })
              .catch((err) => {
                //vm.closeForm(response)
              })
          }

          return Promise.resolve(response);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    changeBlocksVoicework({state, dispatch, commit}, [block, voicework, updateType]) {
      dispatch('startProcessQueueWatch');
      return axios.post(`${state.API_URL}book/block/${state.currentBookid}/${block._uRid}/set_voicework`, {
        voicework: voicework,
        updateType: updateType
      })
        .then(response => {
          if (response.status === 200) {
            if (response && response.data && response.data.blocks) {
              //if (response.data.blocks.length <= 300) {
                response.data.blocks.forEach((block, idx) => {
                  state.storeListO.updBlockByRid(block.rid, {
                    status: block.status
                  });
                  try {
                    let blk = state.storeList.get(block.blockid);
                    blk.voicework = block.voicework;
                    blk.audiosrc = block.audiosrc;
                    blk.audiosrc_ver = block.audiorc_ver;
                    blk.pause_after = block.pause_after;

                    if (blk.isChanged) {
                      response.data.blocks[idx] = _.assign(response.data.blocks[idx], {
                        footnotes: blk.footnotes,
                        isChanged: blk.isChanged,
                        type: blk.type,
                      });
                    }
                  } catch (e) {

                  }
                });
                dispatch('getCurrentJobInfo');
                dispatch('getAlignCount');
                if (state.blockSelection.start._id) {
                  state.blockSelection.refresh = Date.now();
                  dispatch('set_selected_blocks');
                }
              //}
            }
          }
          state.currentBookCounters.voiceworks_for_remove = 0;
          return Promise.resolve(response);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    getBlocksInRange({state}, [start_id, end_id]) {
      return axios.get(`${state.API_URL}books/${state.currentBookid}/blocks_range?start_id=${encodeURIComponent(start_id)}&end_id=${encodeURIComponent(end_id)}`)
        .then(response => {
          if (response.status === 200) {
            return Promise.resolve(response.data);
          }
        });
    },

    checkInsertedBlocks({state, dispatch, commit}, [old_out, new_out]) {
      return new Promise((resolve, reject) => {
        if (old_out !== new_out) {
          dispatch('getAudioBook');
          return dispatch('getBlocksInRange', [old_out, new_out])
            .then(blocks => {
              if (Array.isArray(blocks)) {
                blocks.forEach(blk => {
                  if (blk.id !== old_out) {
                    commit('set_storeList', new BookBlock(blk));
                    if (!state.storeListO.get(blk.blockid)) {
                      state.storeListO.addBlock(blk);
                    } else {
                      state.storeListO.updBlockByRid(blk.id, blk);
                    }
                    if (state.selectedBlocks && state.selectedBlocks.length > 0) {
                      let listIds = state.storeListO.idsArray();
                      let firstIndex = listIds.indexOf(state.selectedBlocks[0].blockid);
                      let insertedIndex = listIds.indexOf(blk.blockid);
                      let lastIndex = listIds.indexOf(state.selectedBlocks[state.selectedBlocks.length - 1].blockid);
                      if (insertedIndex > firstIndex && insertedIndex < lastIndex) {
                        state.storeListO.get(blk.blockid).checked = true;
                        dispatch('set_selected_blocks');
                        dispatch('getAlignCount');
                      }
                    }
                  }
                })
                dispatch('putNumBlockOBatch', {bookId: state.currentBookid});
                if (blocks.length > 1) {
                  dispatch('tc_loadBookTask', state.currentBookid);
                }
                dispatch('getBookAlign');
                commit('set_publicationErrors', [blocks]);
              }
              return resolve(true);
            });
        }
        return resolve(false);
      });
    },

    getBookCategories({state}) {
      return axios.get(state.API_URL + 'books/categories').then(categories => {
        const reader_categories = categories.data.filter(cat=>cat.group==='Reader');
        const ocean_categories = categories.data.filter(cat=>cat.group==='Ocean');
        state.bookCategories = {
          reader: reader_categories[0].categories,
          ocean: ocean_categories[0].categories,
        }
        return Promise.resolve(state.bookCategories)
      })
      .catch(error => {
        return Promise.reject({})
      })
    },
    getCollections({state, commit, dispatch}) {
      return axios.get(`${state.API_URL}collection`)
        .then(response => {
          if (response && response.data) {
            state.bookCollectionsAll = response.data;
            commit('PREPARE_BOOK_COLLECTIONS');
            dispatch('reloadCollection');
            return Promise.resolve();
          }
        })
        .catch(err => {

        });
    },

    createCollection({state, dispatch}, data) {
      return axios.post(`${state.API_URL}collection`, data)
        .then(response => {
          if (response && response.data) {
            return dispatch('getCollections')
              .then(() => {
                return Promise.resolve(response.data);
              });
          }
          return Promise.resolve();
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    updateCollection({state, commit}, data) {
      if (!state.currentCollection._id) {
        return Promise.reject(new Error('No collection selected'));
      }
      return axios.put(`${state.API_URL}collection/${state.currentCollection._id}`, data)
        .then((response) => {
          let updObj = {};
          if (response && response.data) {
            Object.keys(data).filter(k => {
              return !state.currentCollection.validationErrors[k];
            }).forEach(k => {
              updObj[k] = data[k];
            });
            const updKeys = [
              'version', 'pubVersion',
              'currVersion', 'currVersionDate',
              'slug', 'slug_status', 'author_link'
            ];

            for (let key of updKeys) {
              if (response.data.hasOwnProperty(key)) {
                updObj[key] = response.data[key];
              }
            }

            const cIdx = state.bookCollectionsAll.findIndex(c => {
              return c.id === state.currentCollection.id;
            });

            if (cIdx > -1) {
              const collection = state.bookCollectionsAll[cIdx];
              state.bookCollectionsAll[cIdx] = new Collection({...collection, ...response.data});
              commit('PREPARE_BOOK_COLLECTIONS');
            }
          }
          return updObj;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    removeCollection({state, commit}) {
      if (!state.currentCollection._id) {
        return Promise.reject(new Error('No collection selected'))
      }
      return axios.delete(`${state.API_URL}collection/${state.currentCollection._id}`)
        .then((response) => {
          let c = state.bookCollectionsAll.findIndex(_c => {
            return _c.id === state.currentCollection.id;
          });
          if (c) {
            state.bookCollectionsAll[c] = response.data;
            commit('PREPARE_BOOK_COLLECTIONS');
          }
          return Promise.resolve(response);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    linkBooksToCollection({state, dispatch, commit}, bookids) {
      if (!state.currentCollection._id) {
        return Promise.reject(new Error('No collection selected'))
      }
      return axios.post(`${state.API_URL}collection/${state.currentCollection._id}/link_books`,
        {
          books_ids: bookids
        })
        .then((response) => {
          return dispatch('getCollections')
          .then(() => {
            bookids.forEach(bookid => {
              let index = state.books_meta.findIndex(b => {
                return b.bookid === bookid;
              });
              if (typeof index !== 'undefined') {
                //state.books_meta.splice(index, 1);
                //commit('SET_BOOKLIST', list);
                state.books_meta[index].collection_id = state.currentCollection._id;
              }
            });
            commit('PREPARE_BOOK_COLLECTIONS');
            return Promise.resolve(response);
          });
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    updateCollectionCoverimg({state}, imgData) {
      if (!state.currentCollection._id) {
        return Promise.reject(new Error('No collection selected'))
      }
      return axios.put(`${state.API_URL}collection/${state.currentCollection._id}/coverimg`, imgData)
        .then((response) => {
          if (response.data) {
            state.currentCollection.coverimgURL = process.env.ILM_API + response.data.coverimgURL;
          }
        })
        .catch(err => {

        });
    },

    getCollection({state}, _id) {
      return axios.get(`${state.API_URL}collection/${_id}`)
        .then(response => {
          return Promise.resolve(response.data);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    getAlignBlocksLimit({state, commit}) {
      return axios.get(`${state.API_URL}align_config/blocks_limit`)
        .then(response => {
          let value = response.data.limit ? parseInt(response.data.limit) : 0;
          if (value) {
            commit('set_alignBlocksLimit', value);
          }
          return Promise.resolve(value);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    splitBlockToBlocks({state, dispatch, commit}, [blockid, update]) {
      if (!state.currentBookid) {
        return Promise.resolve();
      }
      let currentBlockO = state.storeListO.get(blockid);
      let currentOut = currentBlockO.out;
      let storeBlock = state.storeList.get(blockid);
      storeBlock.isSaving = true;
      update.mode = state.bookMode;
      commit('pause_liveDBBlock', [blockid, currentBlockO.id]);
      return axios.post(`${state.API_URL}books/${state.currentBookid}/blocks/${blockid}/split_to_blocks`, update)
        .then(response => {
          commit('set_publicationErrors', [[response.data]]);
          dispatch('checkInsertedBlocks', [currentOut, Array.isArray(response.data.out) ? response.data.out[0] : response.data.out])
            .then(numUpdated => {

              state.storeListO.updBlockByRid(response.data.id, {out: response.data.out, updated: response.data.updated});
              if (!numUpdated) {
                dispatch('putNumBlockOBatch', {bookId: state.currentBookid});
              }
              commit('resume_liveDBBlock', blockid, storeBlock._rid);
            });
          commit('set_storeList', new BookBlock(response.data));
          dispatch('getCurrentJobInfo');
          dispatch('tc_loadBookTask', state.currentBookid);
          dispatch('setBlocksDisabled/getDisabledBlocks');
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    splitBlockToSubblocks({state, commit, dispatch}, [blockid, update, blockRid]) {
      if (!state.currentBookid) {
        return Promise.resolve();
      }
      update.mode = state.bookMode;
      let currentBlockO = state.storeListO.get(blockid);
      let currentOut = currentBlockO.out;

      return axios.post(`${state.API_URL}books/${state.currentBookid}/blocks/${encodeURIComponent(blockRid)}/split_to_subblocks`, update)
        .then(response => {
          dispatch('checkInsertedBlocks', [currentOut, Array.isArray(response.data.out) ? response.data.out[0] : response.data.out]);
          let storeBlock = state.storeList.get(blockid);
          let isBlockPart = typeof update.partIdx !== 'undefined';
          if (isBlockPart && storeBlock.parts.length !== response.data.parts.length) {
            storeBlock.parts.forEach((p, pIdx) => {
              if (pIdx < update.partIdx && (p.isChanged || p.isAudioChanged)) {
                response.data.parts[pIdx] = p;
              } else if (pIdx > update.partIdx && (p.isChanged || p.isAudioChanged)) {
                //response.data.parts[pIdx + isSplitting] = p;
                response.data.parts[pIdx + update.partIdx] = Object.assign(response.data.parts[pIdx + update.partIdx], {
                  content: p.content,
                  inid: p.inid,
                  isAudioChanged: p.isAudioChanged,
                  isChanged: p.isChanged,
                  manual_boundaries: p.manual_boundaries,
                  _id: p._id
                });
              }
            });
          }
          commit('set_storeList', new BookBlock(response.data));
          state.storeListO.refresh();
          dispatch('getCurrentJobInfo');
          dispatch('tc_loadBookTask', state.currentBookid);
          commit('set_publicationErrors', [[response.data]]);
          return Promise.resolve();
        })
        .catch(err => {
          console.log(err);
          return Promise.reject(err);
        });
    },

    splitBySubblock({state, dispatch, commit}, [blockid, partIdx, blockRid]) {
      if (!state.currentBookid) {
        return Promise.resolve();
      }
      let currentBlockO = state.storeListO.get(blockid);
      let currentOut = currentBlockO.out;
      let storeBlock = state.storeList.get(blockid);
      storeBlock.isSaving = true;
      commit('pause_liveDBBlock', [blockid, currentBlockO.id]);
      return axios.post(`${state.API_URL}books/${state.currentBookid}/blocks/${encodeURIComponent(blockRid)}/split_by_subblock`, {
        partIdx: partIdx,
        mode: state.bookMode
      })
        .then(response => {

          dispatch('checkInsertedBlocks', [currentOut, Array.isArray(response.data.out) ? response.data.out[0] : response.data.out])
            .then(numUpdated => {
              state.storeListO.updBlockByRid(response.data.id, {out: response.data.out, updated: response.data.updated});
              if (!numUpdated) {
                dispatch('putNumBlockOBatch', {bookId: state.currentBookid});
              }
              commit('resume_liveDBBlock', blockid, storeBlock._rid);
            });
          commit('set_storeList', new BookBlock(response.data));
          dispatch('getCurrentJobInfo');
          dispatch('tc_loadBookTask', state.currentBookid);
          dispatch('setBlocksDisabled/getDisabledBlocks');
          commit('set_publicationErrors', [[response.data]]);
          return Promise.resolve();
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    mergeAllBlockParts({state, commit, dispatch}, [blockid, blockRid]) {
      if (!state.currentBookid) {
        return Promise.resolve();
      }
      return axios.post(`${state.API_URL}books/${state.currentBookid}/blocks/${encodeURIComponent(blockRid)}/parts/merge_all`, {mode: state.bookMode})
        .then((response) => {
          commit('set_storeList', new BookBlock(response.data));
          dispatch('getCurrentJobInfo');
          dispatch('tc_loadBookTask', state.currentBookid);
          commit('set_publicationErrors', [[response.data]]);
          return Promise.resolve(response.data);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    loginAdminAs({state}, [user_id]) {
      return axios.post(`${process.env.ILM_API}/auth/login_admin_as`, {
        user_id: user_id
      })
        .then(response => {
          return Promise.resolve(response.data);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    findNextAudioblock({state}, [blockid, audioOnly = false]) {
      let crossId = state.storeListO.getOutId(blockid);
      if (crossId) {
        for (let idx = 0; idx < state.storeList.size; idx++) {
          let block = state.storeList.get(crossId);
          if (block) {
            let hasPart = block.voicework === 'narration' && block.parts.length > 0 ? block.parts.find(p => {
              return p.audiosrc;
            }) : false;
            if ((block.audiosrc || hasPart || (block.type === 'hr' && !audioOnly)) && !block.disabled) {
              return Promise.resolve(block);
            }
            crossId = state.storeListO.getOutId(block.blockid);
            if (!crossId) {
              break;
            }
          } else {
            break;
          }
        }
      }
      return Promise.resolve(null);
    },

    getSuspiciousWordsCharacters({state}) {
      return axios.get(`${state.API_URL}suspicious_words_characters`)
        .then(response => {
          if (response.status === 200) {
            state.suspiciousWordsHighlight.setSuspiciousWordsCharacters(response.data);
          }
        });
    },

    getAudioFadeConfig({state, commit}) {
      return axios.get(`${state.API_URL}audio_config/fade`)
        .then(response => {
          commit('set_audioFadeConfig', response.data);
          return Promise.resolve(response.data);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    set_liveDB_block_update({commit, state, dispatch}, data) {
      //console.log(`set_liveDB_block_update.data: `, data);
      if (state.bookMode === 'edit') {
        state.suspiciousWordsHighlight.setSuspiciousHighlight(data.block);
      }
      const blockStore = state.storeList.get(data.block.blockid);
      /*if (blockStore && data.block) {
        if (Date.parse(blockStore.updated) > Date.parse(blockStore.updated)) {
          ['pause_after'].forEach(field => {// do not update these fields, maybe just return from update
            data.block[field] = blockStore[field];
          });
        }
      }*/
      if (data.block.blockid
        && state.audioTasksQueue.block.blockId
        && state.audioTasksQueue.block.blockId === data.block.blockid
        && state.audioTasksQueue.block.partIdx !== null) {

        if (blockStore && Array.isArray(blockStore.parts) && blockStore.parts.length > 0 && Array.isArray(data.block.parts) && data.block.parts.length === blockStore.parts.length) {
          blockStore.parts.forEach((p, i) => {
            if (p.isAudioChanged) {
              data.block.parts[i] = p;
            }
          });
          let hasChanges = blockStore.parts.find(p => {
            return p.isChanged;
          });
          if (hasChanges) {
            if (Array.isArray(blockStore.flags)) {
              data.block.flags = blockStore.flags;// do not update flags for edited block
            }
          }
        }
      }
      if (data.action === 'create' && data.block) {
        if (!state.storeListO.get(data.block.id)) {
          let inId = data.block.in;
          if (Array.isArray(inId)) {
            inId = inId[0];
          }
          if (inId) {
            let paused = state.pauseLiveDBBlocks.find(blk => {
              return blk.rid = inId;
            });
            if (paused) {
              data.block.isSaving = true;
            }
          }
          state.storeListO.addBlock(data.block);//add if added, remove if removed, do not touch if updated
        }
      } else if (data.action === 'change' && data.block) {
        if (blockStore) {
          let paused = state.pauseLiveDBBlocks.find(blk => {
            return blk.blockid === blockStore.blockid;
          });
          if (paused) {
            return;
          }
          if (blockStore.audiosrc_config) {// stored only locally
            data.block.audiosrc_config = blockStore.audiosrc_config;
          }
          /*let hasChangedPart = Array.isArray(blockStore.parts) ? blockStore.parts.find(p => {
            return p.isChanged;
          }) : false;*/
          if (blockStore.isSaving || blockStore.getIsChanged() || blockStore.getIsAudioChanged()) {
            //console.log('isSaving hasChangedPart');
            return;
          }
          let changes = [];// collect changes
          ['classes', 'pause_after']/*Object.keys(data.block)*/.forEach(k => {// fields check can be removed, added now added to avoid unnecessary checks
            if (blockStore.hasOwnProperty(k) && !_.isEqual(blockStore[k], data.block[k])) {
              changes.push(k);
            }
          });
          data.block.sync_changes = changes;
          if (new Date(blockStore.updated) <= new Date(data.block.updated)) {
            state.storeListO.updBlockByRid(data.block.id, data.block);
            if (state.selectedBlocks && state.selectedBlocks.length > 0) {
              let listIds = state.storeListO.idsArray();
              let firstIndex = listIds.indexOf(state.selectedBlocks[0].blockid);
              let currentIndex = listIds.indexOf(data.block.blockid);
              let lastIndex = listIds.indexOf(state.selectedBlocks[state.selectedBlocks.length - 1].blockid);
              if (currentIndex >= firstIndex && currentIndex <= lastIndex) {
                state.blockSelection.refresh = Date.now();
              }
            }
            //state.storeListUpdateCounter +=1;
          }
        }
      } else if (data.action === 'delete') {
        state.storeListO.delExistsBlock(data.block['@rid'])
      }

      if (data.block && data.block.blockid && state.storeList.has(data.block.blockid)) {
        //console.log(`data.block.updated: `, Date.parse(data.block.updated),`blockStore.updated: `, Date.parse(blockStore.updated));
        if (Date.parse(data.block.updated) > Date.parse(blockStore.updated)) {
          let block = state.storeList.get(data.block.blockid);
          if (Array.isArray(block.parts) && Array.isArray(data.block.parts) && block.parts.length === data.block.parts.length) {
            block.parts.forEach((p, i) => {
              if (p.inid) {
                data.block.parts[i].inid = p.inid;
              }
            });
          }
          if (block.isChanged) {
            if (block.status && data.block.status && block.status.assignee === data.block.status.assignee) {
                if (block.voicework != data.block.voicework) {
                  block.voicework = data.block.voicework;
                  block.audiosrc = data.block.audiosrc;
                  block.audiosrc_ver = data.block.audiosrc_ver;
                  commit('set_storeList', new BookBlock(block));
                  return true;
                }
              } else {
                commit('set_storeList', new BookBlock(data.block));
                return true;
              }
          } else {
            commit('set_storeList', new BookBlock(data.block));
            return true;
          }
        }
      } else if (data.block && data.block.blockid) {
        commit('set_storeList', new BookBlock(data.block));
        return true;
      }
      return false;
    },

    signalRequest({state}, signalName) {
      state.reqSignals[signalName] = new AbortController();
    },

    abortRequest({state}, signalName) {
      if (state.reqSignals[signalName] && state.reqSignals[signalName].abort) {
        state.reqSignals[signalName].abort();
        state.reqSignals[signalName] = null;
      }
      //state.reqSignals[signalName] = new AbortController();
    },

    loadSilenceSample({state}) {
      return axios.get(state.API_URL + 'get_silence_sample', {
        responseType: 'arraybuffer'
      })
        .then(response => {
          return response.data;
        })
    },

    uploadBook({state, dispatch}, [data, config]) {
      return axios.post(`${state.API_URL}books`, data, config)
        .then(response => {
          dispatch('updateBooksList');
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
  }
})
