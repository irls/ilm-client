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
const ILM_COLLECTIONS = 'ilm_collections';
const ILM_LIBRARIES = 'ilm_libraries';

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
    allowCollectionsEdit: false,
    allowPublishCurrentBook: false,
    allRolls: [],

    metaDB: false,
    contentDB: false,
    contentDBWatch: false,
    tasksDB: false,
    collectionsDB: false,
    librariesDB: false,

    metaRemoteDB: false,
    contentRemoteDB: false,
    tasksRemoteDB: false,
    collectionsRemoteDB: false,
    librariesRemoteDB: false,

    books_meta: [],

    currentBookid: '',
    currentBook: {},
    currentBookMeta: {},
    currentBook_dirty: false,
    currentBookMeta_dirty: false,
    currentEditingBlockId: '',
    currentBookFiles: { coverimg: false },
    currentBookBlocksLeft: 0,
    currentBookBlocksLeftId: 'AAA',

    bookFilters: {filter: '', language: 'en', importStatus: 'staging'},
    editMode: 'Editor',
    allowBookEditMode: false,
    tc_currentBookTasks: {"tasks": [], "job": {}, "assignments": []},
    tc_tasksByBlock: {},
    tc_userTasks: {list: [], total: 0},
    API_URL: process.env.ILM_API + '/api/v1/',
    bookCollectionsAll: [],
    bookCollections: [],
    collectionsFilter: {title: '', language: ''},
    currentCollection: {},
    currentCollectionFiles: { coverimg: false },
    currentCollectionId: false,
    allowPublishCurrentCollection: false,
    libraries: [],
    currentLibrary: {},
    currentLibraryId: false,

    user: {}
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
    allowPublishCurrentBook: state => state.allowPublishCurrentBook,
    allRolls: state => state.allRolls,
    allBooks: state => {
      if (state.isAdmin || state.isLibrarian) {
        return state.books_meta;
      } else {
        let books = [];
        //console.log(state.tc_userTasks);
        if (state.tc_userTasks && state.tc_userTasks.list) {
          for (let t_id in state.tc_userTasks.list) {
            if (state.tc_userTasks.list[t_id].tasks && state.tc_userTasks.list[t_id].tasks.length > 0) {
              let exists = books.find(_b => _b._id == state.tc_userTasks.list[t_id].bookid);
              if (!exists) {
                let b = state.books_meta.find(_b => state.tc_userTasks.list[t_id].bookid == _b._id);
                if (b) {
                  //console.log('Adding book', b._id);
                  books.push(b);
                }
              }
            }
          };
        }
        return books;//state.books_meta
      }
    },
    bookFilters: state => state.bookFilters,
    currentBookid: state => state.currentBookid,
    currentBook: state => state.currentBook,
    currentBookMeta: state => state.currentBookMeta,
    currentBookFiles: state => state.currentBookFiles,
    currentBookBlocksLeft: state => state.currentBookBlocksLeft,
    currentBookBlocksLeftId: state => state.currentBookBlocksLeftId,
    bookEditMode: state => state.editMode,
    allowBookEditMode: state => state.currentBookid && (state.isAdmin || state.isLibrarian || state.allowBookEditMode) && state.currentBookMeta.status != 'import_text',
    allowArchiving: state => state.isAdmin || state.isProofer,
    tc_currentBookTasks: state => state.tc_currentBookTasks,
    tc_tasksByBlock: state => state.tc_tasksByBlock,
    tc_userTasks: state => state.tc_userTasks,
    contentDBWatch: state => state.contentDBWatch,
    allowCollectionsEdit: state => state.isAdmin || state.isLibrarian,
    bookCollections: state => state.bookCollections,
    currentCollection: state => state.currentCollection,
    currentCollectionFiles: state => state.currentCollectionFiles,
    collectionsFilter: state => state.collectionsFilter,
    allowPublishCurrentCollection: state => state.allowPublishCurrentCollection,
    authors: state => {
      let result = [];
      if (state.currentBookMeta.authors) {
        state.currentBookMeta.authors.forEach((author)=>{
          result.push({ text: author.name, color: author.color })
        })
      }
      return result;
    },
    libraries: state => state.libraries,
    currentLibrary: state => state.currentLibrary,
    user: state => state.user
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
        state.contentDBWatch = syncPointer;
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
      state.currentBook_dirty = false
      state.currentBookMeta_dirty = false
      if (meta) {
        state.currentBookMeta = meta
        state.currentBookid = meta._id
        if (!state.currentBookMeta.styles) {
          state.currentBookMeta.styles = {};
        }
        if (!state.currentBookMeta.isMastered) {
          state.currentBookMeta.isMastered = false;
        }
      } else {
        state.currentBookMeta = {}
        state.currentBookid = ''
      }
    },

//     CLEAN_CURRENTBOOK_FILES (state) {
//       state.currentBookFiles = {coverimg: false};
//     },

    SET_CURRENTBOOK_FILES (state, fileObj) {
      if (fileObj && fileObj.fileBlob) {
        let url = URL.createObjectURL(fileObj.fileBlob);
        state.currentBookFiles[fileObj.fileName] = url;
      } else state.currentBookFiles[fileObj.fileName] = false;
    },

    SET_CURRENT_COLLECTION (state, collection) {
      state.currentCollection = collection;
      state.currentCollectionId = collection._id ? collection._id : false;
    },

    SET_CURRENTCOLLECTION_FILES (state, fileObj) {
      if (fileObj && fileObj.fileBlob) {
        let url = URL.createObjectURL(fileObj.fileBlob);
        state.currentCollectionFiles[fileObj.fileName] = url;
      } else {
        state.currentCollectionFiles[fileObj.fileName] = false;
      }
    },

    SET_COLLECTIONS_FILTER (state, filter) {
      for(var field in filter) {
        state.collectionsFilter[field] = filter[field];
      }
      //console.log(state.collectionsFilter)
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
    },
    PREPARE_BOOK_COLLECTIONS(state) {
      if (state.isAdmin || state.isLibrarian) {
        state.bookCollections = state.bookCollectionsAll;
      } else if (state.tc_userTasks) {
        if (state.tc_userTasks.total) {
          let collections = [];
          for (let jobid in state.tc_userTasks.list) {
            state.bookCollectionsAll.forEach(c => {
              if (c.books && c.books.indexOf(state.tc_userTasks.list[jobid].bookid) !== -1) {
                if (state.tc_userTasks.list[jobid].tasks && state.tc_userTasks.list[jobid].tasks.length > 0) {
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
      }
      state.bookCollections.forEach(c => {
        let pages = 0;
        c.books.forEach(b => {
          let book = state.books_meta.find(_b => _b._id === b);
          if (book) {
            pages+= book.wordcount ? Math.round(book.wordcount / 300) : 0;
          }
        });

        c.pages = pages;
      });
    },
    SET_ALLOW_BOOK_PUBLISH(state, allow) {
      state.allowPublishCurrentBook = allow;
    },
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
    }

  },

  actions: {

    emptyDB (context) {
      PouchDB('ilm_content_meta').destroy()
    },

    // login event
    connectDB ({ state, commit, dispatch }, session) {
        commit('RESET_LOGIN_STATE');

        commit('set_localDB', { dbProp: 'metaDB', dbName: 'metaDB' });
        commit('set_localDB', { dbProp: 'contentDB', dbName: 'contentDB' });
        commit('set_localDB', { dbProp: 'tasksDB', dbName: 'tasksDB' });
        commit('set_localDB', { dbProp: 'collectionsDB', dbName: 'collectionsDB' });
        commit('set_localDB', { dbProp: 'librariesDB', dbName: 'librariesDB' });

        commit('set_remoteDB', { dbProp: 'metaRemoteDB', dbName: ILM_CONTENT_META });
        commit('set_remoteDB', { dbProp: 'contentRemoteDB', dbName: ILM_CONTENT });
        commit('set_remoteDB', { dbProp: 'filesRemoteDB', dbName: ILM_CONTENT_FILES });
        commit('set_remoteDB', { dbProp: 'tasksRemoteDB', dbName: ILM_TASKS });
        commit('set_remoteDB', { dbProp: 'collectionsRemoteDB', dbName: ILM_COLLECTIONS });
        commit('set_remoteDB', { dbProp: 'librariesRemoteDB', dbName: ILM_LIBRARIES });


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

        state.collectionsDB.replicate.from(state.collectionsRemoteDB)
        .on('complete', (info) => {
          dispatch('updateCollectionsList');
          state.collectionsDB.sync(state.collectionsRemoteDB, {live: true, retry: true})
          .on('change', (change) => {
            dispatch('updateCollectionsList');
          })
        });

        state.librariesDB.replicate.from(state.librariesRemoteDB)
          .on('complete', () => {
            dispatch('updateLibrariesList');
            state.librariesDB.sync(state.librariesRemoteDB, {live: true, retry: true})
              .on('change', () => {
                dispatch('updateLibrariesList');
            });
          });
        axios.get(state.API_URL + 'me')
          .then(response => {
            if (response) {
              if (response.status == 200) {
                state.user = response.data;
              }
            }
          })
          .catch(err => console.log(err));

//          state.librariesDB.replicate.from(state.librariesRemoteDB, {
//          /*filter: '_view',
//          view: 'filters_byLibrarian/byLibrarian',
//          query_params: {
//            key: "librarian2"
//          }*/
//          filter: 'filters_byLibrarian/byLibrarian',
//          query_params: {
//            user_id: "librarian2"
//          }
//        })
//          .on('complete', () => {
//            dispatch('updateLibrariesList');
//
//            setInterval(function() {
//              state.librariesDB.replicate.from(state.librariesRemoteDB, {
//              filter: 'filters_byLibrarian/byLibrarian',
//              query_params: {
//                user_id: "librarian2"
//              }})
//              .on('complete', () => {
//                console.log('COMPLETE');
//                dispatch('updateLibrariesList');
//              })
//              .on('change', (changes) => {
//                console.log(changes);
//                dispatch('updateLibrariesList');
//              });
//            }, 10000);
//            /*state.librariesDB.sync(state.librariesRemoteDB, {
//              live: true,
//              retry: true,
//              filter: 'filters_byLibrarian/byLibrarian',
//          query_params: {
//            user_id: "librarian2"
//          }
//            })
//            .on('change', (change) => {
//              console.log(change);
//              dispatch('updateLibrariesList');
//            });*/
//          });
    },

    destroyDB ({ state, commit, dispatch }) {
      return new Promise((resolve, reject) => {

        //if (!state.isLoggedIn) return resolve();

        commit('set_localDB', { dbProp: 'metaDB', dbName: 'metaDB' });
        commit('set_localDB', { dbProp: 'contentDB', dbName: 'contentDB' });
        commit('set_localDB', { dbProp: 'tasksDB', dbName: 'tasksDB' });
        commit('set_localDB', { dbProp: 'collectionsDB', dbName: 'collectionsDB' });
        commit('set_localDB', { dbProp: 'librariesDB', dbName: 'librariesDB' });

        if (state.metaDB) state.metaDB.destroy()
        if (state.contentDB) state.contentDB.destroy()
        if (state.tasksDB) state.tasksDB.destroy()
        if (state.collectionsDB) state.collectionsDB.destroy()
        if (state.librariesDB) state.librariesDB.destroy()

        console.log('destroyDB');
        window.setTimeout(() => {
          console.log('destroyDB Done');
          return resolve();
        }, 50)
      });
    },

    // logout event
    disconnectDB ({ state, commit }) {
      axios.defaults.headers.common['Authorization'] = false;
      //window.setTimeout(() => {
          if (state.metaDB) state.metaDB.destroy()
          if (state.contentDB) state.contentDB.destroy()
          if (state.tasksDB) state.tasksDB.destroy()
          if (state.collectionsDB) state.collectionsDB.destroy()
          if (state.librariesDB) state.librariesDB.destroy()
          commit('RESET_LOGIN_STATE');
      //}, 500)
    },

    updateBooksList ({state, commit, dispatch}) {
      console.log('updateBooksList');
      let ilmLibraryMeta = state.metaDB.hoodieApi()
      ilmLibraryMeta.findAll(item => (item.type === 'book_meta' && !item.hasOwnProperty('_deleted')))
        .then(books => {
          commit('SET_BOOKLIST', books)
          dispatch('tc_loadBookTask')
        })
    },

    updateCollectionsList({state, commit, dispatch}) {
      let connection = state.collectionsDB.hoodieApi()
      connection.findAll()
        .then(collections => {
          state.bookCollectionsAll = collections
          commit('PREPARE_BOOK_COLLECTIONS');
          dispatch('reloadCollection');
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
      if (book_id) {
        return state.metaDB.get(book_id).then(meta => {
          commit('SET_CURRENTBOOK_META', meta)
          commit('TASK_LIST_LOADED')
          dispatch('getTotalBookTasks');
          state.filesRemoteDB.getAttachment(book_id, 'coverimg')
          .then(fileBlob => {
            commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: fileBlob});
          })
          .catch((err)=>{
            commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: false});
          })
        }).catch((err)=>{})
      } else {
        commit('SET_CURRENTBOOK_META', false);
        return Promise.resolve()
      }


    },

    reloadBookMeta ({commit, state, dispatch}) {
        if (state.currentBookMeta._id) {
            state.metaDB.get(state.currentBookMeta._id).then((meta) => {
                commit('SET_CURRENTBOOK_META', meta)
                dispatch('getTotalBookTasks');
                state.filesRemoteDB.getAttachment(state.currentBookMeta._id, 'coverimg')
                .then(fileBlob => {
                  commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: fileBlob});
                }).catch((err)=>{
                  commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: false});
                })
            })
        }
    },

    updateBookVersion({state, dispatch}, update) {
      if (state.currentBookMeta._id) {
        if (typeof state.currentBookMeta.version !== 'undefined' && state.currentBookMeta.version === state.currentBookMeta.publishedVersion && state.currentBookMeta.published === true) {
          let versions = state.currentBookMeta.version.split('.');
          if (versions && versions.length == 2) {
            if (update.minor) {
              versions[1] = (parseInt(versions[1]) + 1);
            }
            if (update.major) {
              versions[0] = (parseInt(versions[0]) + 1);
              versions[1] = 0;
            }
            state.metaRemoteDB.get(state.currentBookMeta._id)
              .then(meta => {
                //console.log('FROM REMOTE', meta);
                //console.log('LOCAL', test);
                meta['version'] = versions[0] + '.' + versions[1];
                meta['pubType'] = 'Unpublished';
                meta['published'] = false;
                meta['status'] = 'staging';
                state.metaRemoteDB.put(meta)
                  .then(() => {
                    dispatch('reloadBookMeta');
                    if (meta.collection_id) {
                      dispatch('updateCollectionVersion', Object.assign({id: meta.collection_id}, update));
                    }
                  });
              });
          }
        } else {
          dispatch('reloadBookMeta');
        }
      }
    },

    loadCollection({commit, state, dispatch}, id) {
      if (id) {
        state.currentCollectionId = id;
        state.collectionsDB.get(id).then(collection => {
          commit('SET_CURRENT_COLLECTION', collection);
          dispatch('allowCollectionPublish');
          state.filesRemoteDB.getAttachment(state.currentCollectionId, 'coverimg')
          .then(fileBlob => {
            commit('SET_CURRENTCOLLECTION_FILES', {fileName: 'coverimg', fileBlob: fileBlob});
          }).catch((err)=>{
            commit('SET_CURRENTCOLLECTION_FILES', {fileName: 'coverimg', fileBlob: false});
          })
        }).catch((err)=>{

        })
      } else {
        commit('SET_CURRENT_COLLECTION', {});
        commit('SET_ALLOW_COLLECTION_PUBLISH', false);
      }
    },

    reloadCollection({state, commit, dispatch}) {
      if (state.currentCollectionId) {
        state.collectionsDB.get(state.currentCollectionId).then(collection => {
          commit('SET_CURRENT_COLLECTION', collection);
          dispatch('allowCollectionPublish');
          state.filesRemoteDB.getAttachment(state.currentCollectionId, 'coverimg')
          .then(fileBlob => {
            commit('SET_CURRENTCOLLECTION_FILES', {fileName: 'coverimg', fileBlob: fileBlob});
          }).catch((err)=>{
            commit('SET_CURRENTCOLLECTION_FILES', {fileName: 'coverimg', fileBlob: false});
          })
        }).catch((err)=>{
          console.log(err);
        })
      }
    },

    updateCollectionVersion({state, dispatch}, update) {
      let id = update.id || state.currentCollection._id;
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
      }
    },

    allowCollectionPublish({state, commit}) {
      let allow_by_role = superlogin.confirmRole('librarian') || superlogin.confirmRole('admin');
      if (allow_by_role && state.currentCollection && state.currentCollection.books && state.currentCollection.books.length > 0 && state.books_meta) {
        let allow = typeof state.currentCollection.version === 'undefined' || state.currentCollection.version !== state.currentCollection.publishedVersion;
        if (allow) {
          state.currentCollection.books.forEach(b => {
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
        return state.metaDB.get(bookid);
    },

    getBlock ({commit, state, dispatch}, block_id) {
      return state.contentRemoteDB
        .get(block_id)
        .then(res => res)
        .catch((err) => {
          if (err.status == 404) {
          return state.contentDB
            .get(block_id)
            .then(res => res)
            .catch(err => Promise.reject(err));
          } else return Promise.reject(err);
        });
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

    loopBlocksChain ({commit, state, dispatch}, params) {
      let requests = [];
      let results = {rows: [], finish: false, blockId: false};

      if (!params.query) {
        params.query == false;
        results.blockId = true;
      }

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

      requests.push(defer());

      (function loop(i, block_id) {

        if (i < params.onpage || !results.blockId) {

          dispatch('getBlock', block_id)
          .then((b)=>{
            if (b.audiosrc) {
              b.audiosrc = process.env.ILM_API + b.audiosrc;
            }

            results.rows.push(b);

            if (params.query) switch(params.query) {
              case 'unresolved': {
                if (!results.blockId && !b.markedAsDone) {
                  results.blockId = b._id;
                  i = params.onpage - 5;
                }
              } break;
              default : {
                if (!results.blockId && b._id === params.query) {
                  results.blockId = b._id;
                  i = params.onpage - 5;
                }
              } break;
            };

            loop(i+1, b.chainid);
          })
          .catch((err)=>{
            console.log('catch', err);
            results.finish = true;
            requests[0].resolve();
          })
        }
        else requests[0].resolve();
      })(0, params.first_id);

      return Promise.all(requests)
      .then(() => {
        //console.log('loopBlocksChain results', results);
        return Promise.resolve(results);
      });
    },

    loadBlocksChain ({commit, state, dispatch}, params) {
      if (params.first_id) {
        return dispatch('loopBlocksChain', params);
      } else {
        return state.contentDB
        .query('filters_byBook/byBook', {
          startkey: [params.book_id, 0],
          endkey: [params.book_id, 0],
          include_docs: true,
        }).then(function (res) {
          params.first_id = res.rows[0].doc._id;
          return dispatch('loopBlocksChain', params).then((result) => {
            return result;
          });
        })
        .catch(err => err);
      }

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

    _putBlock ({state}, block) {
      console.log('_putBlock block', block);
      return state.contentRemoteDB
        .put(block)
        .then(res => res)
        .catch((err) => {
          console.log('_putBlock err', err);
          if (err.status == 404) {
          return state.contentDB
            .put(block)
            .then(res => res)
            .catch(err => Promise.reject(err));
          } else return Promise.reject(err);
        });
    },

    putBlock ({commit, state, dispatch}, block) {
        let cleanBlock = block.clean();
        //console.log('putBlock', cleanBlock);
        return dispatch('getBlock', cleanBlock._id)
        .then(function(doc) {
          return dispatch('_putBlock', cleanBlock)
          .then((response) => {
            // handle response
          });
        })
        .catch((err) => {
          console.log('putBlock getBlock err', err);
            if (err.status == 404) {
              return dispatch('_putBlock', cleanBlock)
              .then((response) => {
                // handle response
              });
            } else {
              console.log('Block save error:', err);
            }
        });
    },

    putBlockPart ({commit, state, dispatch}, blockData) {
      let cleanBlock = blockData.block.cleanField(blockData.field);
      blockData.block.partUpdate = true;
      //console.log('putBlockPart', cleanBlock);
      if (cleanBlock) {
        return dispatch('getBlock', cleanBlock._id)
        .then(function(doc) {
          return dispatch('_putBlock', _.merge(doc, cleanBlock))
          .then((response) => {
          })
        })
        .catch((err) => {
          console.log('Block save error:', err);
        });
      } else return BPromise.resolve();
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
          commit('PREPARE_BOOK_COLLECTIONS');
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
    },

    getTotalBookTasks({state, commit}) {
      let allow_by_role = superlogin.confirmRole('librarian') || superlogin.confirmRole('admin')
      if (state.currentBookid && allow_by_role) {
        if (typeof state.currentBookMeta.version !== 'undefined' && state.currentBookMeta.version === state.currentBookMeta.publishedVersion) {
          commit('SET_ALLOW_BOOK_PUBLISH', false);
        } else {
          axios.get(state.API_URL + 'tasks/book/' + state.currentBookid + '/total')
            .then((response) => {
              commit('SET_ALLOW_BOOK_PUBLISH', typeof response.data !== 'undefined' && /^[0-9]+$/.test(response.data) && parseInt(response.data) === 0);
            })
            .catch((err) => {})
        }
      } else {
        commit('SET_ALLOW_BOOK_PUBLISH', false);
      }
    },

    setCurrentBookBlocksLeft({state, commit}, bookId) {
      console.log('setCurrentBookBlocksLeft', bookId);

      commit('SET_CURRENTBOOKBLOCKS_LEFT_ID', 'BBB');

      return state.contentDB.query({
        map: function (doc) {
          if (!doc.markedAsDone) {
            emit(doc.bookid);
          }
        },
        reduce: '_count'
      }, {
        key: bookId, reduce: true, group: true
      })
      .then(function (result) {
        //console.log('result', result);
        commit('SET_CURRENTBOOKBLOCKS_LEFT', result.rows[0].value);
        return true;
      })
      .catch((err) => {
        console.log('Block count error:', err);
      });
    },

    getBlockByChainId({state, commit}, chainid) {
      let _query = 'filters_byBlockChainId/byBlockChainId';
      let _params = { key: chainid, include_docs: true };
      console.log('getBlockByChainId', chainid);
      return state.contentRemoteDB.query (_query, _params)
      .then(function (result) {
        //console.log('result', result);
        if (result.rows.length) {
          return result.rows[0].doc;
        } else {
          return false;
        }
      })
      .catch((err) => {
        if (err.status == 404) {
          return state.contentDB.query (_query, _params)
          .then(function (result) {
            //console.log('result', result);
            if (result.rows.length) {
              return result.rows[0].doc;
            } else {
              return false;
            }
          })
          .catch((err) => {
            if (err.status == 404) {
              console.log('Block by chain error:', err);
            } else {
              console.log('Block by chain error:', err);
              return err;
            }
          });
        } else {
          console.log('Block by chain error:', err);
          return err;
        }

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
    }

  }
})
