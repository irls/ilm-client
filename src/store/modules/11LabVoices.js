import axios from "axios";
//import lodash from "lodash";

export default {
  namespaced: true,
  state: {
    voicesListLoading: false,
    voicesList: {
      loaded: false,
      list: []
    }
  },
  getters: {
    voicesListLoading: state => {
      return state.voicesListLoading;
    },
    mapVoicesList: state => {
      if (state.voicesList.loaded) {
        return state.voicesList.list;
      }
      return [];
    }
  },
  mutations: {
    set_voicesListLoading(state, loading) {
      state.voicesListLoading = loading;
    },
    set_voicesList(state, payload) {
      state.voicesList.list = payload;
      state.voicesList.loaded = true;
    }
  },
  actions: {
    loadVoicesFilters({rootState, commit}) {
      return axios.get(`${rootState.API_URL}tts/eleven_labs/voice_filters`)
      .then(response => {
        commit('elevenLabsVoicesFilters/set_languageFilterList',  response.data.languages, { root: true });
        commit('elevenLabsVoicesFilters/set_accentFilterList',    response.data.accents,   { root: true });
        commit('elevenLabsVoicesFilters/set_librariesFilterList', response.data.libraries, { root: true });
      });
    }
  }
}
