// import {
//   prepareForFilter,
//   cleanDiacritics,
//   splitPrepareForFilter,
//   prepareRegexpForArFaLetters
// }  from '@src/filters/search.js';
//import { Languages }       from "@src/mixins/lang_config.js"

import axios from "axios";

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
      obj: {}
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
    defaultVoiceFilters:         state => state.defaultVoiceFilters,
    multiSelectVoiceModel:       state => state.multiSelectVoiceModel,

    mapVoiceFilterLanguages: (state, getters, rootState, rootGetters) => {
      if (state.languageFilterList.loaded) {
        return state.languageFilterList.list;
      }
      return [];
    },

    mapVoiceFilterAccents: (state, getters, rootState, rootGetters) => {
      if (state.voiceFilters.language.length && state.accentFilterList.loaded) {
        return Object.entries(state.accentFilterList.obj).reduce((acc, [key, _val])=>{
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
      return {
        age: [],
        gender: [],
        notice: []
      };
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
      state.accentFilterList.obj = Object.keys(list).reduce((acc, key)=>{
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
    },

    set_initFilters (state, fObj) {
      state.voiceFilters = Object.assign({}, state.defaultVoiceFilters);
      state.multiSelectVoiceModel = Object.assign({}, state.defaultMultiSelectVoiceModel);
      if (fObj) {
        // state.voiceFilters
        let initFilters = {};
        for (const [key] of Object.entries(state.defaultVoiceFilters)) {
          if (fObj[key]) {
            if (Array.isArray(state.defaultVoiceFilters[key])) {
              initFilters[key] = Array.isArray(fObj[key]) ? fObj[key] : [fObj[key]];
            } else {
              initFilters[key] = fObj[key];
            }
          }
        }
        state.voiceFilters = {...state.defaultVoiceFilters, ...initFilters};
        console.log(`set_initFilters:state.voiceFilters:: `, state.voiceFilters);
        // state.multiSelectVoiceModel
        for (const [key] of Object.entries(state.multiSelectVoiceModel)) {
          const searchArr = Array.isArray(fObj[key]) ? fObj[key] : (fObj[key] ? [fObj[key]] : []);
          if (searchArr.length) {
            // age gender notice
            if (state.librariesFilterObj[key]) {
              const values = state.librariesFilterObj[key].filter((_v)=>searchArr.indexOf(_v.value) > -1);
              if (values.length) {
                state.multiSelectVoiceModel[key] = values;
              }
            }
            // language nativeLanguage
            let values = state.languageFilterList.list.filter((_v)=>searchArr.indexOf(_v.value) > -1);
            if (values.length) {
              state.multiSelectVoiceModel[key] = values;
            }
            // hq
            values = state.hqFilterList.list.filter((_v)=>searchArr.indexOf(_v.value) > -1);
            if (values.length) {
              state.multiSelectVoiceModel[key] = values;
            }
            // accent
            if (fObj.language) {
              const langSearchArr = Array.isArray(fObj.language) ? fObj.language : [fObj.language];
              values = Object.entries(state.accentFilterList.obj).reduce((acc, [_langKey, _val])=>{
                if (langSearchArr.indexOf(_langKey) > -1) {
                  _val = _val.filter((_v)=>searchArr.indexOf(_v.value) > -1);
                  return [...acc, ..._val];
                }
                return acc;
              }, []);
              if (values.length) {
                state.multiSelectVoiceModel[key] = values;
              }
            }
          }
        }
        state.fltrChangeTrigger = !state.fltrChangeTrigger;
      }
    }
  },

  actions: {
    loadVoicesFilters({rootState, commit}) {
      return axios.get(`${rootState.API_URL}tts/eleven_labs/voice_filters`)
      .then(response => {
        commit('set_languageFilterList',  response.data.languages);
        commit('set_accentFilterList',    response.data.accents);
        commit('set_librariesFilterList', response.data.libraries);
        //commit('elevenLabsVoicesFilters/set_librariesFilterList', response.data.libraries, { root: true });
      })
      .catch(err=>{
        console.error(err)
      })
    },
  }
}
