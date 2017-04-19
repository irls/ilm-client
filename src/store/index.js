import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import superlogin from 'superlogin-client'
import PouchDB from 'pouchdb'



const ilm_library = new PouchDB('ilm_library')

Vue.use(Vuex)

const API_ALLBOOKS = '/static/books.json'

export const store = new Vuex.Store({
  state: {
    ilm_library_meta: {},
    currentUser: {},
    currentSession: {},
    isLoggedIn: false,
    auth: superlogin,
    ilm_library: ilm_library,
    // books: [],
    books_meta: [],
    currentBookid: '',
    bookFilters: {filter: '', language: 'en', importStatus: 'shared'},
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
      // return state.books.find(book => book.bookid == state.route.params.bookid)
      // console.log(state.route.params.bookid)
      return state.books.find(book => book.meta.bookid === state.currentBookid)
    },
    bookEditMode (state) {
      return state.editMode
    }
  },

  mutations: {
    setCurrentBookFilter (state, obj) { // replace any property of bookFilters
      for (var prop in obj) if (['filter', 'language', 'importStatus'].indexOf(prop) > -1) {
        state.bookFilters[prop] = obj[prop]
      }
    },
    initiateBooks (state, books) {
      state.books = books
      if (state.route.params.hasOwnProperty('bookid')) state.currentBookid = state.route.params.bookid
    },
    setCurrentBook (state, bookid) {
      state.currentBookid = bookid
    },
    setEditMode (state, editMode) {
      state.editMode = editMode
    }
  },

  actions: {
    initiateBooks (context) {

      //state.ilm_library_meta = new PouchDB('ilm_library_meta')
      // // setup sync
      // superlogin.on('login', function(session){
      //   PouchDB.sync('ilm_library_meta', superlogin.getDbUrl('ilm_library_meta'), {live:true})
      //     .on('change', function(change) {
      //       console.log(change)
      //     })
      // })
      // // get initial list of book
      // var api = this.state.ilm_library_meta.hoodieApi()
      // api.findAll(item => item.type==='book_meta').then(function(books_meta){
      //   this.state.books_meta = books_meta
      //   console.log("Books loaded: "+ books_meta.length)
      // })

    }
  }
})
