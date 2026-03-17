import axios from "axios";
//import lodash from "lodash";

export default {
  namespaced: true,
  state: {
    // collectionBooksLoading: false,
    voicesList: []
  },
  getters: {
    // collectionBooksLoading: state => {
    //   return state.collectionBooksLoading;
    // }
  },
  mutations: {
    // set_collectionBooksLoading(state, loading) {
    //   state.collectionBooksLoading = loading;
    // }
  },
  actions: {
    loadVoicesFilters({rootState, commit}) {
      return axios.get(`${rootState.API_URL}tts/eleven_labs/voice_filters`)
      .then(response => {
        commit('elevenLabsVoicesFilters/set_languageFilterList',  response.data.languages, { root: true });
        commit('elevenLabsVoicesFilters/set_accentFilterList',      response.data.accents, { root: true });
        commit('elevenLabsVoicesFilters/set_librariesFilterList', response.data.libraries, { root: true });
      });
    }
  }
}
