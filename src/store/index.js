import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import superlogin from 'superlogin-client'
import hoodie from 'pouchdb-hoodie-api'
import PouchDB from 'pouchdb'
PouchDB.plugin(hoodie)

// const ilm_library = new PouchDB('ilm_library')
// const ilm_library_meta = new PouchDB('ilm_library_meta')

Vue.use(Vuex)

const API_ALLBOOKS = '/static/books.json'

export const store = new Vuex.Store({
  state: {
    isLoggedIn: false,
    auth: superlogin,
    books_meta: [],

    currentBookid: '',
    currentBook: {},
    currentBookMeta: {},
    currentBook_dirty: false,
    currentBookMeta_dirty: false,


    bookFilters: {filter: '', language: 'en', importStatus: 'staging'},
    editMode: 'Editor',
  },

  getters: {
    allBooks (state) {
      return state.books_meta
    },
    currentBookFilters (state) {
      return state.bookFilters
    },
    currentBook (state) {
      return state.currentBook
    },
    bookEditMode (state) {
      return state.editMode
    }
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

    SET_CURRENTBOOK (state, meta) {
      //console.log('SET_CURRENTBOOK', meta)
      // state.currentBookid = meta._id
      //state.currentBook = book
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
      state.isLoggedIn = state.auth.authenticated()
    }


  },

  actions: {
    updateBooksList(context) {
      let ilm_library_meta = PouchDB('ilm_library_meta').hoodieApi()
      ilm_library_meta.findAll(item => (item.type==='book_meta' && !item.hasOwnProperty('_deleted')))
        .then((books) => context.commit('SET_BOOKLIST', books))
    },
    emptyDB(context) {
      PouchDB('ilm_library_meta').destroy();
    },

    deleteCurrentBook(context) {
      // get _id for both book and meta
      // set _deleted=true on both
      // clear currentBookid
    },
    loadBook (context, bookid) {
      //console.log("loading currentBook: ", bookid)
      // if (!bookid) return  // if no currentbookid, exit
      // if (bookid === context.state.currentBookid) return // skip if already loaded

      // if currentbook exists, check if currrent book needs saving
      var state = context.state
      let oldBook = (state.currentBook && state.currentBook._id);

      if (oldBook && state.currentBook_dirty || state.currentBookMeta_dirty) {
        // save old state
      }

      // check if new book is in cache
      // if cached locally, load
      // now query to see if book matches latest _rev
      // if not, load latest version and replace
      PouchDB(state.auth.getDbUrl('ilm_library_meta')).get(bookid).then(function(meta) {
        PouchDB(state.auth.getDbUrl('ilm_library')).get(bookid).then(function(book) {
          //console.log('meta: ', meta)
          //console.log('book: ', book)
          context.state.currentBook = book
          context.commit('SET_CURRENTBOOK', meta)
        })
      })

    },
  }
})
