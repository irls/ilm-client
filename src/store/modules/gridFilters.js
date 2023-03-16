import { prepareForFilter, cleanDiacritics } from '@src/filters/search.js';

export default {
  namespaced: true,
  state: {
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
    multiBookFilters:               state=>state.multiBookFilters,
    mapFilterJobStatus:             state=>state.mapFilterJobStatus,
    mapFilterImportStatus:          state=>state.mapFilterImportStatus,
    mapFilterProjectTag:            state=>state.mapFilterProjectTag,

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
        .filter(book => (rootState.bookFilters.language.length == 0 || (rootState.bookFilters.language).indexOf(book.language) >= 0))
        .filter(book => (rootState.bookFilters.importStatus.length == 0 || (rootState.bookFilters.importStatus).indexOf(book.importStatus) >= 0))
        .filter(book => (rootState.bookFilters.jobStatus.length == 0 || (rootState.bookFilters.jobStatus).indexOf(book.job_status) >= 0))
        .filter(book => {
          const bookAuthors = Array.isArray(book.author) ? book.author.join('|') : book.author;
          const str = prepareForFilter(`${book.title} ${book.subtitle} ${book.slug} ${bookAuthors} ${book.bookid} ${book.category}`); // ${book.description}
          const find = prepareForFilter(rootState.bookFilters.filter);
          return (str.indexOf(find) > -1)
        })
        .filter(book => {
          const str = prepareForFilter(`${book.hashTags} ${book.executors.editor._id} ${book.executors.editor.name} ${book.executors.editor.title}`);
          const find = prepareForFilter(rootState.bookFilters.projectTag);
          return (str.indexOf(find) > -1)
        })
        //.filter(book => !book.collection_id)
      return filteredbooks;
    },

    filteredCollections: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.bookCollections.length) return [];
      let filteredCollections = rootGetters.bookCollections
          .filter(coll => (rootState.bookFilters.language.length == 0 || (rootState.bookFilters.language).indexOf(coll.language) >= 0))
          .filter(coll => {
            const collAuthors = Array.isArray(coll.author) ? coll.author.join('|') : coll.author;
            let str = prepareForFilter(`${coll.title} ${coll.subtitle} ${coll.slug} ${collAuthors} ${coll._id} ${coll.category}`); // ${coll.description}
            let find = prepareForFilter(rootState.bookFilters.filter);
            return (str.indexOf(find) > -1)
          })
      return filteredCollections;
    },

    filteredCollectionBooks: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.currentCollection._id) return [];
      const filteredbooks = rootGetters.currentCollection.books_list
        .filter(book => (rootState.bookFilters.language.length == 0 || (rootState.bookFilters.language).indexOf(book.language) >= 0))
        .filter(book => (rootState.bookFilters.importStatus.length == 0 || (rootState.bookFilters.importStatus).indexOf(book.importStatus) >= 0))
        .filter(book => (rootState.bookFilters.jobStatus.length == 0 || (rootState.bookFilters.jobStatus).indexOf(book.job_status) >= 0))
        .filter(book => {
          const bookAuthors = Array.isArray(book.author) ? book.author.join('|') : book.author;
          const str = prepareForFilter(`${book.title} ${book.subtitle} ${book.slug} ${bookAuthors} ${book.bookid} ${book.category}`); // ${book.description}
          const find = prepareForFilter(rootState.bookFilters.filter);
          return (str.indexOf(find) > -1)
        })
        .filter(book => {
          const str = prepareForFilter(`${book.hashTags} ${book.executors.editor._id} ${book.executors.editor.name} ${book.executors.editor.title}`);
          const find = prepareForFilter(rootState.bookFilters.projectTag);
          return (str.indexOf(find) > -1)
        })
        //.filter(book => !book.collection_id)
      return filteredbooks;
    }
  },
  mutations: {
    multiBookFilters(state, payload) {
      state.multiBookFilters = payload;
    }
  },
  actions: {}
}
