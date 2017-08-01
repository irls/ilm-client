import Vue from 'vue'
import Vuex from 'vuex'
import superlogin from 'superlogin-client'
import hoodie from 'pouchdb-hoodie-api'
import PouchDB from 'pouchdb'
const _ = require('lodash')
import axios from 'axios'
PouchDB.plugin(hoodie)

// const ilm_content = new PouchDB('ilm_content')
// const ilm_content_meta = new PouchDB('ilm_content_meta')

Vue.use(Vuex)

const ILM_CONTENT = 'ilm_content';
const ILM_CONTENT_META = 'ilm_content_meta';

// const API_ALLBOOKS = '/static/books.json'

const BookBlock = new Vuex.Store({
    state: {
        parnum: false,
        deleted: false
    }
});

export const store = new Vuex.Store({
  modules: {
      bookBlock: BookBlock
  },
  state: {
    auth: superlogin,
    isLoggedIn: false,
    isAdmin: false,
    isEditor: false,
    isLibrarian: false,
    isBookkeeper: false,
    isEngineer: false,
    isReader: false,
    allRolls: [],

    metaDB: false,
    contentDB: false,
    contentDBWatch: false,

    metaRemoteDB: false,
    contentRemoteDB: false,

    books_meta: [],

    currentBookid: '',
    currentBook: {},
    currentBookMeta: {},
    currentBook_dirty: false,
    currentBookMeta_dirty: false,
    currentEditingBlockId: '',

    bookFilters: {filter: '', language: 'en', importStatus: 'staging'},
    editMode: 'Editor',
    allowBookEditMode: false,
    tc_currentBookTasks: {"tasks": [], "job": {}, "assignments": []},
    tc_tasksByBlock: {},
    tc_userTasks: [],
    API_URL: process.env.ILM_API + '/api/v1/'
  },

  getters: {
    auth: state => state.auth,
    isLoggedIn: state => state.isLoggedIn,
    isAdmin: state => state.isAdmin,
    isEditor: state => state.isEditor,
    isLibrarian: state => state.isLibrarian,
    isBookkeeper: state => state.isBookkeeper,
    isEngineer: state => state.isEngineer,
    isReader: state => state.isReader,
    allRolls: state => state.allRolls,
    allBooks: state => state.books_meta,
    bookFilters: state => state.bookFilters,
    currentBookid: state => state.currentBookid,
    currentBook: state => state.currentBook,
    currentBookMeta: state => state.currentBookMeta,
    bookEditMode: state => state.editMode,
    allowBookEditMode: state => state.currentBookid && (state.isAdmin || state.isLibrarian || state.allowBookEditMode),
    tc_currentBookTasks: state => state.tc_currentBookTasks,
    tc_tasksByBlock: state => state.tc_tasksByBlock,
    contentDBWatch: state => state.contentDBWatch
  },

  mutations: {

    set_localDB (state, payload) {
        state[payload.dbProp] = new PouchDB(payload.dbName);
    },

    set_remoteDB (state, payload) {
        let dbPath = superlogin.getDbUrl(payload.dbName);
        if (process.env.DOCKER) {
            dbPath = dbPath.replace('couchdb', 'localhost')
        }
        state[payload.dbProp] = new PouchDB(dbPath);
    },

    set_contentDBWatch (state, syncPointer) {
        state.contentDBWatch =syncPointer;
    },

    stop_contentDBWatch (state) {
        if (state.contentDBWatch) {
            state.contentDBWatch.cancel();
            state.contentDBWatch = false;
        }
    },

    SET_CURRENTBOOK_FILTER (state, obj) { // replace any property of bookFilters
      for (var prop in obj) if (['filter', 'language', 'importStatus'].indexOf(prop) > -1) {
        state.bookFilters[prop] = obj[prop]
        // console.log("Setting bookfilter."+prop, obj[prop])
        // console.log(state.bookFilters)
      }
    },

    // initiateBooks (state, books) {
    //   state.books = books
    //   if (state.route.params.hasOwnProperty('bookid')) state.currentBookid = state.route.params.bookid
    // },

    SET_CURRENTBOOK (state, book) {
      state.currentBook = book
    },

    SET_CURRENTBOOK_META (state, meta) {
      // state.currentBookid = meta._id
      // state.currentBook = book
      state.currentBookMeta = meta
      state.currentBook_dirty = false
      state.currentBookMeta_dirty = false
      state.currentBookid = meta._id

    },

    setEditMode (state, editMode) {
      state.editMode = editMode
    },

    SET_BOOKLIST (state, books) {
      state.books_meta = books
    },

    RESET_LOGIN_STATE (state) {
      state.isLoggedIn = superlogin.authenticated()
      state.isAdmin = superlogin.confirmRole('admin')
      state.isEditor = superlogin.confirmRole('editor')
      state.isLibrarian = superlogin.confirmRole('librarian')
      state.isBookkeeper = superlogin.confirmRole('bookkeeper')
      state.isEngineer = superlogin.confirmRole('engineer')
      state.isReader = superlogin.confirmRole('reader')
      // state.allRolls =
    },

    updateBookMeta (state, meta) {
      state.currentBookMeta = meta
    },

    ALLOW_BOOK_EDIT_MODE (state, allow) {
      state.allowBookEditMode = allow;
    },

    TASK_LIST_LOADED (state) {
      for (let jobid in state.tc_userTasks) {
        let job = state.tc_userTasks[jobid]
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
              case 2: // cleanup text
                assignments.push('metadata');
                assignments.push('metadata_cleanup');
                assignments.push('content');
                assignments.push('content_cleanup');
                break;
              case 4: // approve book
                assignments.push('content');
                assignments.push('content_approve');
                break;

            }
          })
          state.tc_currentBookTasks = {job: job, tasks: job.tasks, assignments: assignments}
        }
      }
      state.allowBookEditMode = state.tc_currentBookTasks.tasks.length > 0;
    }

  },

  actions: {

    emptyDB (context) {
      PouchDB('ilm_content_meta').destroy()
    },

    // login event
    connectDB ({ state, commit, dispatch }, session) {
        console.log('connectDB');
        commit('RESET_LOGIN_STATE');
        commit('set_localDB', { dbProp: 'metaDB', dbName: 'metaDB' });
        commit('set_localDB', { dbProp: 'contentDB', dbName: 'contentDB' });
        commit('set_remoteDB', { dbProp: 'metaRemoteDB', dbName: ILM_CONTENT_META });
        commit('set_remoteDB', { dbProp: 'contentRemoteDB', dbName: ILM_CONTENT });

        state.metaDB.replicate.from(state.metaRemoteDB)
        .on('complete', (info)=>{
            dispatch('updateBooksList');
            state.metaDB.sync(state.metaRemoteDB, {live: true, retry: true})
            .on('change', (change)=>{
                console.log('metaDB change', change);
                dispatch('updateBooksList');
                dispatch('reloadBookMeta');
            })
            .on('error', (err)=>{
              // handle errors
            })
        });

        state.contentDB.replicate.from(state.contentRemoteDB)
        .on('complete', (info)=>{
            state.contentDB.sync(state.contentRemoteDB, {live: true, retry: true})
            .on('change', (change)=>{
                console.log('contentDB change', change);
            })
            .on('error', (err)=>{
              // handle errors
            })
        });
    },

    // logout event
    disconnectDB ({ state, commit }) {
      axios.defaults.headers.common['Authorization'] = false;
      window.setTimeout(() => {
          if (state.metaDB) state.metaDB.destroy()
          if (state.contentDB) state.contentDB.destroy()
          commit('RESET_LOGIN_STATE');
      }, 500)
    },

    updateBooksList ({state, commit, dispatch}) {
      console.log('updateBooksList');
      let ilmLibraryMeta = state.metaDB.hoodieApi()
      ilmLibraryMeta.findAll(item => (item.type === 'book_meta' && !item.hasOwnProperty('_deleted') && (item.editor == state.auth.getSession().user_id || item.private == false)))
        .then(books => {
          commit('SET_BOOKLIST', books)
          dispatch('tc_loadBookTask')
        })
    },

    deleteCurrentBook (context) {
      // get _id for both book and meta
      // set _deleted=true on both
      // clear currentBookid
    },

    loadBook ({commit, state, dispatch}, book_id) {
       console.log('loading currentBook: ', book_id)
      // if (!book_id) return  // if no currentbookid, exit
      // if (book_id === context.state.currentBookid) return // skip if already loaded

      // if currentbook exists, check if currrent book needs saving
      let oldBook = (state.currentBook && state.currentBook._id)

      if (oldBook && state.currentBook_dirty || state.currentBookMeta_dirty) {
        // save old state
      }

      state.metaDB.get(book_id).then(meta => {
        commit('SET_CURRENTBOOK_META', meta)
        commit('TASK_LIST_LOADED')
//         state.contentDB.get(book_id).then(book => {
//           commit('SET_CURRENTBOOK', book)
//
//         })
      }).catch((err)=>{})
    },

    reloadBookMeta ({commit, state, dispatch}) {
        console.log('reloadBookMeta', state.currentBookMeta._id);
        if (state.currentBookMeta._id) {
            state.metaDB.get(state.currentBookMeta._id).then((meta) => {
                commit('SET_CURRENTBOOK_META', meta)
            })
        }
    },

    getBookMeta ({}, bookid) {
        return state.metaDB.get(bookid);
    },

    loadBlocks ({commit, state, dispatch}, params) {
        return state.contentDB
        .query('filters_byBook/byBook', {
            startkey: [params.book_id],
            include_docs: true,
            skip: params.page * params.onpage,
            limit: params.onpage
        }).then(function (res) {
            return res.rows;
        }).catch(function (err) {
            return err;
        });
    },

    watchBlocks ({commit, state, dispatch}, params) {
        commit('stop_contentDBWatch');
        let contentDBWatch = state.contentDB.changes({
            since: 'now',
            live: true,
            include_docs: true,
            filter: function (doc) {
                return doc.bookid === params.book_id;
            }
        });
        contentDBWatch.removeAllListeners('change');
        contentDBWatch
        .on('complete', function(info) {
            console.log('contentDBWatch Cancelled');
        }).on('error', function (err) {
            console.log(err);
        });
        commit('set_contentDBWatch', contentDBWatch);
        return true;
    },

    putBlock ({commit, state, dispatch}, block) {

      let defBlock = [
          '_id',
          '_rev',
          'tag',
          'content',
          'classes',
          'type',
          'bookid',
          'index'
      ]

        let cleanBlock = _.pick(block, defBlock);
        console.log('putBlock', cleanBlock);
        state.contentDB.get(cleanBlock._id).then(function(doc) {
            return state.contentDB.put(cleanBlock);
        }).then((response)=>{
          // handle response
        }).catch((err) =>{
            console.log('Block save error:', err);
        });

    },

    tc_loadBookTask({state, commit}) {
      axios.get(state.API_URL + 'tasks')
        .then((list) => {
          state.tc_tasksByBlock = {}
          state.tc_userTasks = list.data.rows
          commit('TASK_LIST_LOADED')
        })
        .catch((err) => {})
    },

    tc_setCurrentBookTasks({state}) {
      for (let jobid in state.tc_userTasks) {
        let job = state.tc_userTasks[jobid]
        if (job.bookid == state.currentBookid) {
          /*if (t.comment) {
            t.comment = t.comment.replace('\n', '<br>');
          }
          if (t.blockid) {
            state.tc_tasksByBlock[t.blockid] = t
          }*/
          state.tc_currentBookTasks = {job: job, tasks: job.tasks}
        }
      }
      commit('ALLOW_BOOK_EDIT_MODE', state.tc_currentBookTasks.tasks.length > 0);
    }

  }
})
