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
      filter: '',
      booksIds: [],
      multiProjectTag: [],
      jobStatus: ['active']
    },
    defaultCollectionsFilters: {
      filter: '',
      booksIds: [],
      multiProjectTag: [],
      jobStatus: ['active']
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

    mapFilterProjectTag:            state => state.mapFilterProjectTag,

    mapFilterJobStatus: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) {
        return [];//state.mapFilterJobStatus;
      }
      const availableJobStatuses = new Set();
      rootGetters.allBooks.forEach((book)=>{
        availableJobStatuses.add(book.job_status);
      });
      if (false) {
        state.mapFilterJobStatus.forEach((el)=>{
          availableJobStatuses.add(el.value);
        });
      }
      if (state.booksFilters.jobStatus.length) {
        state.booksFilters.jobStatus = state.booksFilters.jobStatus.filter((code)=>availableJobStatuses.has(code));
      }
      if (state.multiBookFilters.jobStatus.length) {
        state.multiBookFilters.jobStatus = state.multiBookFilters.jobStatus.filter((obj)=>availableJobStatuses.has(obj.value));
      }
      return Array.from(availableJobStatuses).map((code)=>{
        const captionFound = state.mapFilterJobStatus.find((el)=>el.value === code);
        return {caption: (captionFound ? captionFound.caption : code), value: code}
      });
    },

    mapFilterImportStatus: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) {
        return [];//state.mapFilterImportStatus;
      }
      const availableImportStatuses = new Set();
      rootGetters.allBooks.forEach((book)=>{
        availableImportStatuses.add(book.importStatus);
      });
      if (false) {
        state.mapFilterImportStatus.forEach((el)=>{
          availableImportStatuses.add(el.value);
        });
      }
      if (state.booksFilters.importStatus.length) {
        state.booksFilters.importStatus = state.booksFilters.importStatus.filter((code)=>availableImportStatuses.has(code));
      }
      if (state.multiBookFilters.importStatus.length) {
        state.multiBookFilters.importStatus = state.multiBookFilters.importStatus.filter((obj)=>availableImportStatuses.has(obj.value));
      }
      return Array.from(availableImportStatuses).map((code)=>{
        const captionFound = state.mapFilterImportStatus.find((el)=>el.value === code);
        return {caption: (captionFound ? captionFound.caption : code), value: code}
      });
    },

    mapFilterLanguages: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) {
        return [];//Object.entries(Languages).map(([code, name])=>({caption: name, value: code}));
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
          const strParts = [
            book.title, book.subtitle, book.slug,
            bookAuthors, book.bookid, book.category,
            book.hashTags, book.executors.editor._id,
            book.executors.editor.name, book.executors.editor.title
            //book.description
          ];
          const str = prepareForFilter(strParts.join(' '));
          const find = prepareForFilter(state.booksFilters.filter);
          return (str.indexOf(find) > -1)
        })
        //.filter(book => {
        //  const str = prepareForFilter(`${book.hashTags} ${book.executors.editor._id} ${book.executors.editor.name} ${book.executors.editor.title}`);
        //  const find = prepareForFilter(state.booksFilters.projectTag);
        //  return (str.indexOf(find) > -1)
        //})
        //.filter(book => !book.collection_id)

      state.collectionsFilters.booksIds = filteredbooks.map((book)=>book.bookid);
      return filteredbooks;
    },

    filteredCollections: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.bookCollections.length) return [];
      const filteredCollections = rootGetters.bookCollections
            .filter(coll => (state.booksFilters.language.length == 0 || (state.booksFilters.language).indexOf(coll.language) >= 0))
            .filter(coll => {
              const collAuthors = Array.isArray(coll.author) ? coll.author.join('|') : coll.author;
              const strParts = [
                coll.title, coll.subtitle, coll.slug,
                collAuthors, coll.category, coll._id
              ];
              const str = prepareForFilter(strParts.join(' '));
              const find = prepareForFilter(state.collectionsFilters.filter);
              return (str.indexOf(find) > -1)
            })
            .filter(coll => {
              if (state.booksFilters.filter.length > 0) {
                if (state.collectionsFilters.booksIds.length > 0) {
                  if (coll.bookids.length > 0) {
                    const intersection = state.collectionsFilters.booksIds.filter(b => coll.bookids.includes(b));
                    return intersection.length > 0;
                  }
                  return false;
                }
                return false;
              }
              return true;
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
          const strParts = [
            book.title, book.subtitle, book.slug,
            bookAuthors, book.bookid, book.category,
            book.hashTags, book.executors.editor._id,
            book.executors.editor.name, book.executors.editor.title
            //book.description
          ];
          const str = prepareForFilter(strParts.join(' '));
          const find = prepareForFilter(state.booksFilters.filter);
          return (str.indexOf(find) > -1)
        })
      return filteredbooks;
    }
  },
  mutations: {
    set_multiBookFilters(state, payload) {
      state.multiBookFilters = payload;
    },

    set_booksFilters (state, obj) { // replace any property of bookFilters
      for (const prop in obj) {
        if (['filter', 'multiProjectTag', 'importStatus', 'language', 'jobStatus'].indexOf(prop) > -1) {
          state.booksFilters[prop] = obj[prop];
        }
      }
    },

    set_clearBookFilters (state) {
      state.booksFilters = Object.assign({}, state.defaultBooksFilters);
    },

    set_collectionsFilters (state, obj) {
      for (const prop in obj) {
        if (['filter', 'multiProjectTag', 'booksIds'].indexOf(prop) > -1) {
          state.collectionsFilters[prop] = obj[prop];
        }
      }
    },

    set_clearCollectionsFilters (state) {
      state.collectionsFilters = Object.assign({}, state.defaultCollectionsFilters);
    },
  },

  actions: {}
}