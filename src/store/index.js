import Vue from 'vue'
import Vuex from 'vuex'
// import axios from 'axios'
import superlogin from 'superlogin-client'
import hoodie from 'pouchdb-hoodie-api'
import PouchDB from 'pouchdb'
import axios from 'axios'
PouchDB.plugin(hoodie)

// const ilm_library = new PouchDB('ilm_library')
// const ilm_library_meta = new PouchDB('ilm_library_meta')

Vue.use(Vuex)

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
    tc_currentBookTasks: {"tasks": [], "task": {}},
    tc_tasksByBlock: {},
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
    tc_tasksByBlock: state => state.tc_tasksByBlock
  },

  mutations: {

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
    }

  },

  actions: {

    updateBooksList (context) {
      let ilmLibraryMeta = PouchDB('ilm_library_meta').hoodieApi()
      ilmLibraryMeta.findAll(item => (item.type === 'book_meta' && !item.hasOwnProperty('_deleted') && (item.owner == context.state.auth.getSession().user_id || item.private == false)))
        .then(books => context.commit('SET_BOOKLIST', books))
    },

    emptyDB (context) {
      PouchDB('ilm_library_meta').destroy()
    },

    deleteCurrentBook (context) {
      // get _id for both book and meta
      // set _deleted=true on both
      // clear currentBookid
    },

    loadBook ({commit, state, dispatch}, bookid) {
      // console.log('loading currentBook: ', bookid)
      // if (!bookid) return  // if no currentbookid, exit
      // if (bookid === context.state.currentBookid) return // skip if already loaded

      // if currentbook exists, check if currrent book needs saving
      let oldBook = (state.currentBook && state.currentBook._id)

      if (oldBook && state.currentBook_dirty || state.currentBookMeta_dirty) {
        // save old state
      }

      // check if new book is in cache
      // if cached locally, load
      // now query to see if book matches latest _rev
      // if not, load latest version and replace
      var dbPathA = superlogin.getDbUrl('ilm_library_meta')
      if (process.env.DOCKER) dbPathA = dbPathA.replace('couchdb', 'localhost')
      var dbPathB = superlogin.getDbUrl('ilm_library')
      if (process.env.DOCKER) dbPathB = dbPathB.replace('couchdb', 'localhost')

      PouchDB(dbPathA).get(bookid).then(meta => {
        PouchDB(dbPathB).get(bookid).then(book => {
          commit('SET_CURRENTBOOK', book)
          commit('SET_CURRENTBOOK_META', meta)
          dispatch('tc_loadBookTask')
        })
      })
    },

    getBookMeta ({}, bookid) {
        var dbPathA = superlogin.getDbUrl('ilm_library_meta')
        if (process.env.DOCKER) dbPathA = dbPathA.replace('couchdb', 'localhost')
        return PouchDB(dbPathA).get(bookid);
    },

    tc_loadBookTask({state, commit}) {
      if (state.currentBookid) {
        axios.get(state.API_URL + 'tasks/book/' + state.currentBookid)
          .then((list) => {
            state.tc_tasksByBlock = {}
            list.data.tasks.forEach(t => {
              if (t.comment) {
                t.comment = t.comment.replace('\n', '<br>');
              }
              if (t.blockid) {
                state.tc_tasksByBlock[t.blockid] = t
              }
            })

            state.tc_currentBookTasks = list.data
            commit('ALLOW_BOOK_EDIT_MODE', state.tc_currentBookTasks.tasks.length > 0);
          })
          .catch((err) => {})
      }
    }

  }
})
