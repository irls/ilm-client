import {
  prepareForFilter,
  cleanDiacritics,
  splitPrepareForFilter,
  prepareRegexpForArFaLetters
}  from '@src/filters/search.js';
import { Languages }       from "@src/mixins/lang_config.js"

export default {
  namespaced: true,
  state: {
    fltrChangeTrigger: false,

    booksFilters: {
      filter: '',
      secFilter: '',
      multiProjectTag: [],
      importStatus: [],
      language: [],
      jobStatus: ['active'],
      booksIds: [],
    },
    defaultBooksFilters: {
      filter: '',
      secFilter: '',
      importStatus: [],
      multiProjectTag: [],
      language: [],
      jobStatus: ['active'],
      booksIds: [],
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
    languageFilterList: {
      loaded: false,
      list: []
    },
    importStatusFilterList: {
      loaded: false,
      list: []
    },
    jobStatusFilterList: {
      loaded: false,
      list: []
    }
  },
  getters: {
    fltrChangeTrigger:           state => state.fltrChangeTrigger,
    booksFilters:                state => state.booksFilters,
    collectionsFilters:          state => state.collectionsFilters,
    multiBookFilters:            state => state.multiBookFilters,

    mapFilterProjectTag:         state => state.mapFilterProjectTag,

    mapFilterJobStatus: (state, getters, rootState, rootGetters) => {
      if (state.jobStatusFilterList.loaded) {
        return state.jobStatusFilterList.list;
      }
      return [];
    },

    mapFilterImportStatus: (state, getters, rootState, rootGetters) => {
      if (state.importStatusFilterList.loaded) {
        return state.importStatusFilterList.list;
      }
      return [];
    },

    mapFilterLanguages: (state, getters, rootState, rootGetters) => {
      if (state.languageFilterList.loaded) {
        return state.languageFilterList.list;
      }
      return [];
    },

    filteredBooksCounter: (state, getters, rootState, rootGetters) => {
      return rootGetters.allBooksPagination.total;
    },
    filteredCollectionsCounter: (state, getters, rootState, rootGetters) => {
      return rootGetters.collectionsPagination.total;
    },
    filteredCollectionBooksCounter: (state, getters) => {
      return getters.filteredCollectionBooks.length;
    },

    filteredBooks: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) return [];
      const filteredbooks = rootGetters.allBooks
      return filteredbooks;
    },

    filteredCollections: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.bookCollections.length) return [];
      const filteredCollections = rootGetters.bookCollections
      return filteredCollections;
    },

    filteredCollectionBooks: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.currentCollection._id) return [];
      const filteredbooks = rootGetters.currentCollection.books_list
      return filteredbooks;
    }
  },
  mutations: {
    set_multiBookFilters(state, payload) {
      state.multiBookFilters = payload;
    },

    set_booksFilters (state, obj) { // replace any property of bookFilters
      for (const prop in obj) {
        if (['filter', 'secFilter', 'multiProjectTag', 'importStatus', 'language', 'jobStatus', 'page'].indexOf(prop) > -1) {
          state.booksFilters[prop] = obj[prop];
        }
      }
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_clearBookFilters (state) {
      state.booksFilters = Object.assign({}, state.defaultBooksFilters);
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_collectionsFilters (state, obj) {
      for (const prop in obj) {
        if (['filter', 'multiProjectTag', 'booksIds', 'page'].indexOf(prop) > -1) {
          state.collectionsFilters[prop] = obj[prop];
        }
      }
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_clearCollectionsFilters (state) {
      state.collectionsFilters = Object.assign({}, state.defaultCollectionsFilters);
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_fltrChangeTrigger (state) {
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_jobStatusFilterList (state, list) {
      state.jobStatusFilterList.list = list.map(code => {
        const captionFound = state.mapFilterJobStatus.find((el)=>el.value === code);
        return {caption: (captionFound ? captionFound.caption : code), value: code};
      });
      state.jobStatusFilterList.loaded = true;
    },

    set_importStatusFilterList (state, list) {
      state.importStatusFilterList.list = list.map(code => {
        const captionFound = state.mapFilterImportStatus.find((el)=>el.value === code);
        return {caption: (captionFound ? captionFound.caption : code), value: code}
      });
      state.importStatusFilterList.loaded = true;
    },

    set_languageFilterList (state, list) {
      state.languageFilterList.list = list.map((code)=>({caption: Languages[code] ? Languages[code] : code, value: code}));
      state.languageFilterList.loaded = true;
    }
  },

  actions: {}
}
