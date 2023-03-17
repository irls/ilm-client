import { prepareForFilter, cleanDiacritics } from '@src/filters/search.js';
import { Languages }                         from "@src/mixins/lang_config.js"

export default {
  namespaced: true,
  state: {

    booksFilters: {
      filter: '',
      projectTag: '',
      multiProjectTag: [],
      importStatus: [],
      language: [],
      jobStatus: ['active']
    },
    defaultBooksFilters: {
      filter: '',
      projectTag: '',
      importStatus: [],
      multiProjectTag: [],
      language: [],
      jobStatus: ['active']
    },
    collectionsFilters: {
      title: '',
      language: '',
      jobStatus: 'active',
      projectTag: ''
    },

    multiBookFilters: {
      language: [],
      jobStatus: [{caption: 'Active', value: 'active'}],
      importStatus: [],
      multiProjectTag: []
    },

    mapFilterJobStatus: [
      {caption: 'Active',    value: 'active'},
      {caption: 'Archived',  value: 'archived'},
      {caption: 'Completed', value: 'completed'},
      {caption: 'Suspended', value: 'suspended'}
    ],

    mapFilterImportStatus: [
      {caption: 'No content',   value: 'staging_empty'},
      {caption: 'Text Cleanup', value: 'staging'},
      {caption: 'Narration',    value: 'narrating'},
      {caption: 'Proofreading', value: 'proofing'},
      {caption: 'Mastering',    value: 'mastering'},
      {caption: 'Done',         value: 'completed'}
    ],

    mapFilterProjectTag: [
      {caption: 'Reader',  value: 'Reader'},
      {caption: 'Ocean',   value: 'Ocean'},
      {caption: 'ST',      value: 'ST'},
      {caption: 'OOL',     value: 'OOL'},
      {caption: 'Testing', value: 'Testing'},
      {caption: 'Traning', value: 'Traning'},
    ],
  },
  getters: {
    booksFilters:                   state => state.booksFilters,
    collectionsFilters:             state => state.collectionsFilters,
    multiBookFilters:               state => state.multiBookFilters,
    mapFilterJobStatus:             state => state.mapFilterJobStatus,
    mapFilterImportStatus:          state => state.mapFilterImportStatus,
    mapFilterProjectTag:            state => state.mapFilterProjectTag,

    mapFilterLanguages: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) {
        return Object.entries(Languages).map(([code, name])=>({caption: name, value: code}));
      }
      const availableLanguages = new Set();
      rootGetters.allBooks.forEach((book)=>{
        availableLanguages.add(book.language);
      });
      rootGetters.bookCollections.forEach((book)=>{
        availableLanguages.add(book.language);
      });
      if (state.booksFilters.language.length) {
        state.booksFilters.language = state.booksFilters.language.filter((lang)=>availableLanguages.has(lang));
      }
      if (state.multiBookFilters.language.length) {
        state.multiBookFilters.language = state.multiBookFilters.language.filter((obj)=>availableLanguages.has(obj.value));
      }
      return Array.from(availableLanguages).map((code)=>({caption: Languages[code] ? Languages[code] : code, value: code}));
    },

    filteredBooksCounter: (state, getters) => {
      return getters.filteredBooks.length;
    },
    filteredCollectionsCounter: (state, getters) => {
      return getters.filteredCollections.length;
    },
    filteredCollectionBooksCounter: (state, getters) => {
      return getters.filteredCollectionBooks.length;
    },

    filteredBooks: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) return [];
      const filteredbooks = rootGetters.allBooks
        .filter(book => (state.booksFilters.language.length == 0 || (state.booksFilters.language).indexOf(book.language) >= 0))
        .filter(book => (state.booksFilters.importStatus.length == 0 || (state.booksFilters.importStatus).indexOf(book.importStatus) >= 0))
        .filter(book => (state.booksFilters.jobStatus.length == 0 || (state.booksFilters.jobStatus).indexOf(book.job_status) >= 0))
        .filter(book => {
          const bookAuthors = Array.isArray(book.author) ? book.author.join('|') : book.author;
          const str = prepareForFilter(`${book.title} ${book.subtitle} ${book.slug} ${bookAuthors} ${book.bookid} ${book.category}`); // ${book.description}
          const find = prepareForFilter(state.booksFilters.filter);
          return (str.indexOf(find) > -1)
        })
        .filter(book => {
          const str = prepareForFilter(`${book.hashTags} ${book.executors.editor._id} ${book.executors.editor.name} ${book.executors.editor.title}`);
          const find = prepareForFilter(state.booksFilters.projectTag);
          return (str.indexOf(find) > -1)
        })
        //.filter(book => !book.collection_id)
      return filteredbooks;
    },

    filteredCollections: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.bookCollections.length) return [];
      let filteredCollections = rootGetters.bookCollections
          .filter(coll => (state.booksFilters.language.length == 0 || (state.booksFilters.language).indexOf(coll.language) >= 0))
          .filter(coll => {
            const collAuthors = Array.isArray(coll.author) ? coll.author.join('|') : coll.author;
            let str = prepareForFilter(`${coll.title} ${coll.subtitle} ${coll.slug} ${collAuthors} ${coll._id} ${coll.category}`); // ${coll.description}
            let find = prepareForFilter(state.booksFilters.filter);
            return (str.indexOf(find) > -1)
          })
      return filteredCollections;
    },

    filteredCollectionBooks: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.currentCollection._id) return [];
      const filteredbooks = rootGetters.currentCollection.books_list
        .filter(book => (state.booksFilters.language.length == 0 || (state.booksFilters.language).indexOf(book.language) >= 0))
        .filter(book => (state.booksFilters.importStatus.length == 0 || (state.booksFilters.importStatus).indexOf(book.importStatus) >= 0))
        .filter(book => (state.booksFilters.jobStatus.length == 0 || (state.booksFilters.jobStatus).indexOf(book.job_status) >= 0))
        .filter(book => {
          const bookAuthors = Array.isArray(book.author) ? book.author.join('|') : book.author;
          const str = prepareForFilter(`${book.title} ${book.subtitle} ${book.slug} ${bookAuthors} ${book.bookid} ${book.category}`); // ${book.description}
          const find = prepareForFilter(state.booksFilters.filter);
          return (str.indexOf(find) > -1)
        })
        .filter(book => {
          const str = prepareForFilter(`${book.hashTags} ${book.executors.editor._id} ${book.executors.editor.name} ${book.executors.editor.title}`);
          const find = prepareForFilter(state.booksFilters.projectTag);
          return (str.indexOf(find) > -1)
        })
        //.filter(book => !book.collection_id)
      return filteredbooks;
    }
  },
  mutations: {
    set_multiBookFilters(state, payload) {
      state.multiBookFilters = payload;
    },

    set_booksFilters (state, obj) { // replace any property of bookFilters
      for (var prop in obj) if (['filter', 'projectTag', 'multiProjectTag', 'importStatus', 'language', 'jobStatus'].indexOf(prop) > -1) {
        state.booksFilters[prop] = obj[prop]
      }
    },

    set_clearBookFilters (state) {
      state.bookFilters = Object.assign({}, state.defaultBooksFilters);
    },

    set_collectionsFilters (state, filter) {
      for(var field in filter) {
        state.collectionsFilters[field] = filter[field];
      }
      //console.log(state.collectionsFilter)
    },
  },

  actions: {}
}
