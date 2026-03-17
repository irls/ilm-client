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

    defaultVoiceFilters: {
      page: 0,
      filter: '',
      language: [],
      accent: [],
      nativeLanguage: [],
      hq: [],
      age: [],
      gender: [],
      notice: []
    },

    voiceFilters: {
      page: 0,
      filter: '',
      language: [],
      accent: [],
      nativeLanguage: [],
      hq: [],
      age: [],
      gender: [],
      notice: []
    },

    defaultMultiSelectVoiceModel: {
      language: [],
      accent: [],
      nativeLanguage: [],
      hq: [],
      age: [],
      gender: [],
      notice: []
    },

    multiSelectVoiceModel: {
      language: [],
      accent: [],
      nativeLanguage: [],
      hq: [],
      age: [],
      gender: [],
      notice: []
    },

    // mapFilterJobStatus: [
    //   {caption: 'Active',    value: 'active'},
    //   {caption: 'Archived',  value: 'archived'},
    //   {caption: 'Completed', value: 'completed'},
    //   {caption: 'Suspended', value: 'suspended'}
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
    },
    hqFilterList: {
      loaded: true,
      list: [{caption: 'HQ', value: 'hq'}]
    },
  },
  getters: {
    fltrChangeTrigger:           state => state.fltrChangeTrigger,
    voiceFilters:                state => state.voiceFilters,
    multiSelectVoiceModel:       state => state.multiSelectVoiceModel,

    mapVoiceFilterLanguages: (state, getters, rootState, rootGetters) => {
      if (state.languageFilterList.loaded) {
        return state.languageFilterList.list;
      }
      return [];
    },

    mapVoiceFilterAccents: (state, getters, rootState, rootGetters) => {
      if (state.voiceFilters.language.length && state.accentFilterList.loaded) {
        return Object.entries(state.accentFilterList.list).reduce((acc, [key, _val])=>{
          if (state.voiceFilters.language.indexOf(key) > -1) {
            acc = [...acc, ..._val];
          }
          return acc;
        }, []).sort((a, b) => a.order - b.order);
      }
      return [];
    },

    lengthVoiceFilterAccents: (state, getters, rootState, rootGetters) => {
      return Object.keys(state.accentFilterList).length;
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

    mapVoiceFilterHQ: (state, getters, rootState, rootGetters) => {
      if (state.hqFilterList.loaded) {
        return state.hqFilterList.list;
      }
      return [];
    },

    isReqFltrsSelected: (state, getters, rootState, rootGetters) => {
      const reqFltrs = ['language', 'gender', 'age'];
      return reqFltrs.every((field)=>state.voiceFilters[field].length);
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
    set_multiSelectVoiceModel(state, payload) {
      state.multiSelectVoiceModel = payload;
    },

    set_voiceFilters (state, obj) { // replace any property of voiceFilters
      for (const prop in obj) {
        const filtersLabels = Object.keys(state.defaultVoiceFilters);
        if (filtersLabels.indexOf(prop) > -1) {
          state.voiceFilters[prop] = obj[prop];
        }
      }
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_resetVoiceFilters (state) {
      state.voiceFilters = Object.assign({}, state.defaultVoiceFilters);
      state.multiSelectVoiceModel = Object.assign({}, state.defaultMultiSelectVoiceModel);
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_fltrChangeTrigger (state) {
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_languageFilterList (state, list) {
      state.languageFilterList.list = list.map((lang)=>({
        caption: lang.label ? lang.label : lang.name,
        value: lang.name
      }));
      state.languageFilterList.loaded = true;
    },

    set_accentFilterList (state, list) {
      state.accentFilterList.list = Object.keys(list).reduce((acc, key)=>{
        acc[key] = list[key].map((_val)=>({
          caption: _val.label ? _val.label : _val.name,
          value: _val.name,
          order: _val.order,
        }));
        return acc;
      }, {})

      state.accentFilterList.loaded = true;
    },

    set_librariesFilterList (state, obj) {
      state.librariesFilterObj.age = obj?.age?.map((_val)=>({
        caption: _val.label ? _val.label : _val.name,
        value: _val.name
      }));
      state.librariesFilterObj.gender = obj?.gender?.map((_val)=>({
        caption: _val.label ? _val.label : _val.name,
        value: _val.name
      }));
      state.librariesFilterObj.notice = obj?.notice?.map((_val)=>({
        caption: _val.label ? _val.label : _val.name,
        value: _val.name
      }));
      state.librariesFilterObj.loaded = true;
    }
  },

  actions: {}
}
