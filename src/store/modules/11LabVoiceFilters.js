// import {
//   prepareForFilter,
//   cleanDiacritics,
//   splitPrepareForFilter,
//   prepareRegexpForArFaLetters
// }  from '@src/filters/search.js';
//import { Languages }       from "@src/mixins/lang_config.js"

export default {
  namespaced: true,
  state: {
    fltrChangeTrigger: false,

    voiceFilters: {
      filter: '',
      multiProjectTag: [],
      importStatus: [],
      language: [],
      jobStatus: ['active'],
      booksIds: [],
    },

    defaultVoiceFilters: {
      filter: '',
      importStatus: [],
      multiProjectTag: [],
      language: [],
      jobStatus: ['active'],
      booksIds: [],
    },

    multiVoiceFilters: {
      language: [],
      jobStatus: [{caption: 'Active', value: 'active'}],
      importStatus: [],
      multiProjectTag: []
    },

    // mapFilterJobStatus: [
    //   {caption: 'Active',    value: 'active'},
    //   {caption: 'Archived',  value: 'archived'},
    //   {caption: 'Completed', value: 'completed'},
    //   {caption: 'Suspended', value: 'suspended'}
    // ],
    //
    // mapFilterImportStatus: [
    //   {caption: 'No content',   value: 'staging_empty'},
    //   {caption: 'Text Cleanup', value: 'staging'},
    //   {caption: 'Narration',    value: 'narrating'},
    //   {caption: 'Proofreading', value: 'proofing'},
    //   {caption: 'Mastering',    value: 'mastering'},
    //   {caption: 'Done',         value: 'completed'}
    // ],

    languageFilterList: {
      loaded: false,
      list: []
    },
    accentFilterList: {
      loaded: false,
      list: []
    },
    librariesFilterObj: {
      loaded: false,
      age: [],
      gender: [],
      notice: []
    }
  },
  getters: {
    fltrChangeTrigger:           state => state.fltrChangeTrigger,
    voiceFilters:                state => state.voiceFilters,
    multiVoiceFilters:           state => state.multiVoiceFilters,

    // mapFilterJobStatus: (state, getters, rootState, rootGetters) => {
    //   if (state.jobStatusFilterList.loaded) {
    //     return state.jobStatusFilterList.list;
    //   }
    //   return [];
    // },

    mapVoiceFilterLanguages: (state, getters, rootState, rootGetters) => {
      if (state.languageFilterList.loaded) {
        return state.languageFilterList.list;
      }
      return [];
    },

    mapVoiceFilterAccents: (state, getters, rootState, rootGetters) => {
      if (state.accentFilterList.loaded) {
        return state.accentFilterList.list;
      }
      return [];
    },

    mapVoiceFilterLibraries: (state, getters, rootState, rootGetters) => {
      if (state.librariesFilterObj.loaded) {
        return {
          age: state.librariesFilterObj.age,
          gender: state.librariesFilterObj.gender,
          notice: state.librariesFilterObj.notice
        }
      }
      return [];
    },

    // filteredBooksCounter: (state, getters, rootState, rootGetters) => {
    //   return rootGetters.allBooksPagination.total;
    // },
    //
    // filteredBooks: (state, getters, rootState, rootGetters) => {
    //   if (!rootGetters.allBooks.length) return [];
    //   const filteredbooks = rootGetters.allBooks
    //   return filteredbooks;
    // },
  },
  mutations: {
    set_multiVoiceFilters(state, payload) {
      state.multiVoiceFilters = payload;
    },

    set_voiceFilters (state, obj) { // replace any property of bookFilters
      for (const prop in obj) {
        if (['filter', 'multiProjectTag', 'importStatus', 'language', 'jobStatus', 'page'].indexOf(prop) > -1) {
          state.voiceFilters[prop] = obj[prop];
        }
      }
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_clearVoiceFilters (state) {
      state.booksFilters = Object.assign({}, state.defaultBooksFilters);
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_fltrChangeTrigger (state) {
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_languageFilterList (state, list) {
      state.languageFilterList.list = list.map((lang)=>({caption: lang.label ? lang.label : lang.name, value: lang.name}));
      state.languageFilterList.loaded = true;
    },

    set_accentFilterList (state, list) {
      console.log(`set_accentFilterList::: `, list);
      // state.accentFilterList.list = list.map((lang)=>({caption: lang.label ? lang.label : lang.name, value: lang.name}));
      // state.accentFilterList.loaded = true;
    },

    set_librariesFilterList (state, obj) {
      state.librariesFilterObj.age = obj?.age?.map((_val)=>({caption: _val.label ? _val.label : _val.name, value: _val.name}));
      state.librariesFilterObj.gender = obj?.gender?.map((_val)=>({caption: _val.label ? _val.label : _val.name, value: _val.name}));
      state.librariesFilterObj.notice = obj?.notice?.map((_val)=>({caption: _val.label ? _val.label : _val.name, value: _val.name}));
      state.librariesFilterObj.loaded = true;
    }
  },

  actions: {}
}
