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
const ILM_CONTENT_FILES = 'ilm_library_files';
const ILM_TASKS = 'ilm_tasks';

// const API_ALLBOOKS = '/static/books.json'

export const store = new Vuex.Store({
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
    tasksDB: false,

    metaRemoteDB: false,
    contentRemoteDB: false,
    tasksRemoteDB: false,

    books_meta: [],

    currentBookid: '',
    currentBook: {},
    currentBookMeta: {},
    currentBook_dirty: false,
    currentBookMeta_dirty: false,
    currentEditingBlockId: '',
    currentBookFiles: {},

    bookFilters: {filter: '', language: 'en', importStatus: 'staging'},
    editMode: 'Editor',
    allowBookEditMode: false,
    tc_currentBookTasks: {"tasks": [], "job": {}, "assignments": []},
    tc_tasksByBlock: {},
    tc_userTasks: {list: [], total: 0},
    API_URL: process.env.ILM_API + '/api/v1/'
  },

  getters: {
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
    allRolls: state => state.allRolls,
    allBooks: state => state.books_meta,
    bookFilters: state => state.bookFilters,
    currentBookid: state => state.currentBookid,
    currentBook: state => state.currentBook,
    currentBookMeta: state => state.currentBookMeta,
    currentBookFiles: state => state.currentBookFiles,
    bookEditMode: state => state.editMode,
    allowBookEditMode: state => state.currentBookid && (state.isAdmin || state.isLibrarian || state.allowBookEditMode),
    allowArchiving: state => state.isAdmin || state.isProofer,
    tc_currentBookTasks: state => state.tc_currentBookTasks,
    tc_tasksByBlock: state => state.tc_tasksByBlock,
    tc_userTasks: state => state.tc_userTasks,
    contentDBWatch: state => state.contentDBWatch,
    authors: state => {
      let result = [];
      if (state.currentBookMeta.authors) {
        state.currentBookMeta.authors.forEach((author)=>{
          result.push({ text: author.name, color: author.color })
        })
      }
      return result;
    }
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

    SET_CURRENTBOOK_FILES (state, files) {
      state.currentBookFiles = {};
      state.currentBookFiles.coverimg = 'http://' + [
        process.env.ILM_DB,
        ILM_CONTENT_FILES,
        files._id,
        'coverimg'
      ].join('/') + '?' + new Date().getTime();
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
      state.isNarrator = superlogin.confirmRole('narrator')
      state.isProofer = superlogin.confirmRole('proofer')
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
      let tc_userTasks = 0;
      state.tc_tasksByBlock = {};
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
                if (assignments.indexOf('block_narrate') === -1) {
                  assignments.push('block_narrate');
                }
                break;
              case '': // approve book
                assignments.push('content');
                assignments.push('content_approve');
                break;

            }
            if (t.blockid) {
              if (typeof state.tc_tasksByBlock[t.blockid] === 'undefined') {
                state.tc_tasksByBlock[t.blockid] = [];
              }
              state.tc_tasksByBlock[t.blockid].push(t)
            }
          })
          state.tc_currentBookTasks = {job: job, tasks: job.tasks, assignments: assignments}
        }
      }
      state.tc_userTasks.total = tc_userTasks;
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
        commit('set_localDB', { dbProp: 'tasksDB', dbName: 'tasksDB' });
        commit('set_remoteDB', { dbProp: 'metaRemoteDB', dbName: ILM_CONTENT_META });
        commit('set_remoteDB', { dbProp: 'contentRemoteDB', dbName: ILM_CONTENT });
        commit('set_remoteDB', { dbProp: 'filesRemoteDB', dbName: ILM_CONTENT_FILES });
        commit('set_remoteDB', { dbProp: 'tasksRemoteDB', dbName: ILM_TASKS });

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
        state.tasksDB.replicate.from(state.tasksRemoteDB)
        .on('complete', (info) => {
          state.tasksDB.sync(state.tasksRemoteDB, {live: true, retry: true})
          .on('change', (change) => {
            //console.log('Tasks DB change', change);
            dispatch('tc_loadBookTask');
          })
        });
    },

    // logout event
    disconnectDB ({ state, commit }) {
      axios.defaults.headers.common['Authorization'] = false;
      window.setTimeout(() => {
          if (state.metaDB) state.metaDB.destroy()
          if (state.contentDB) state.contentDB.destroy()
          if (state.tasksDB) state.tasksDB.destroy()
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
      //console.log('loading currentBook: ', book_id)
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

        state.filesRemoteDB.get(book_id).then(files => {
          commit('SET_CURRENTBOOK_FILES', files);
        }).catch((err)=>{})
      }).catch((err)=>{})


    },

    reloadBookMeta ({commit, state, dispatch}) {
        if (state.currentBookMeta._id) {
            state.metaDB.get(state.currentBookMeta._id).then((meta) => {
                commit('SET_CURRENTBOOK_META', meta)
                state.filesRemoteDB.get(state.currentBookMeta._id).then(files => {
                  commit('SET_CURRENTBOOK_FILES', files);
                });
            })
        }
    },

    getBookMeta ({state}, bookid) {
        return state.metaDB.get(bookid);
    },

    getBlock ({commit, state, dispatch}, block_id) {
        return state.contentDB
        .get(block_id)
        .then(res => res)
        .catch(err => err);
    },

    loadBlocks ({commit, state, dispatch}, params) {
        let skip = params.page * params.onpage;
        if (typeof params.skipOffset !== 'undefined') {
          skip+= params.skipOffset;
        }
        return state.contentDB
        .query('filters_byBook/byBook', {
            startkey: [params.book_id],
            endkey: [params.book_id, {}],
            include_docs: true,
            skip: skip,
            limit: params.onpage
        }).then(function (res) {
            res.rows.forEach(b => {
              if (b.doc.audiosrc) {
                b.doc.audiosrc = process.env.ILM_API + b.doc.audiosrc;
              }
            });
            return res.rows;
        })
        .catch(err => err);
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
            //console.log('contentDBWatch Cancelled');
        }).on('error', function (err) {
            console.log(err);
        });
        commit('set_contentDBWatch', contentDBWatch);
        return true;
    },

    putBlock ({commit, state, dispatch}, block) {
        let cleanBlock = block.clean();
        //console.log('putBlock', cleanBlock);
        return state.contentDB.get(cleanBlock._id)
        .then(function(doc) {
          return state.contentDB.put(cleanBlock)
          .then((response) => {
            // handle response
          });
        })
        .catch((err) => {
            console.log('Block save error:', err);
        });

    },

    putMetaAuthors ({commit, state, dispatch}, authors) {
      let metaAuthors = [];
      authors.forEach((item)=>{
        metaAuthors.push({ name: item.text, color: item.color });
      })
      state.metaDB.get(state.currentBookMeta._id).then(function(doc) {
        doc.authors = metaAuthors;
        return state.metaDB.put(doc);
      }).catch((err) =>{
        console.log('Meta save error:', err);
      });
    },

    getAudioBook ({state}, bookid) {
      return axios.get(state.API_URL + 'books/' + bookid + '/audiobooks')
        .then(audio => {
          if (audio.data && audio.data.rows && audio.data.rows[0]) {
            return audio.data.rows[0].doc;
          } else {
            return {};
          }
        })
        .catch(error => {
          return {};
        });
    },

    tc_loadBookTask({state, commit}) {
      axios.get(state.API_URL + 'tasks')
        .then((list) => {
          state.tc_tasksByBlock = {}
          state.tc_userTasks = {list: list.data.rows, total: 0}
          commit('TASK_LIST_LOADED')
        })
        .catch((err) => {})
    },

    tc_setCurrentBookTasks({state}) {
      for (let jobid in state.tc_userTasks.list) {
        let job = state.tc_userTasks.list[jobid]
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
    },

    tc_approveBookTask({state, commit}, task) {
      axios.post(state.API_URL + 'task/' + task.blockid + '/approve_block',
      {
        'bookId': task.bookid || false,
        'taskId': task._id || false,
        'taskStep': task.nextStep || 'narrate-block',
        'taskType': task.type || false
      })
      .then((list) => {
        state.tc_tasksByBlock = {}
        state.tc_userTasks = {list: list.data.rows, total: 0}
        commit('TASK_LIST_LOADED')
      })
      .catch((err) => {})
    }


  }
})
