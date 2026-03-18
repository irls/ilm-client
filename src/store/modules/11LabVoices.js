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
    isVoicesListLoading: state => {
      return state.voicesListLoading;
    },
    isVoicesListLoaded: state => {
      return state.voicesList.loaded;
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
    },
    set_voicesListEmpty(state) {
      state.voicesList.list = [];
      state.voicesList.loaded = false;
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
    },

    act_filterVoices({rootState, rootGetters, commit}) {
      const isReqFltrsSelected = rootGetters['elevenLabsVoicesFilters/isReqFltrsSelected'];
      const {
        filter,
        language,
        gender,
        age,
        hq,
        accent,
        nativeLanguage,
        notice
      } = rootGetters['elevenLabsVoicesFilters/voiceFilters'];
      const preparedFilters = {};

      if (!isReqFltrsSelected) {
        commit('set_voicesListEmpty');
        return Promise.resolve();
      }

      if (filter.trim().length) {
        preparedFilters.filter = filter.trim()
      }
      if (language.length) {
        preparedFilters.language = language[0];
      }
      if (gender.length) {
        preparedFilters.gender = gender[0];
      }
      if (age.length) {
        preparedFilters.age = age[0];
      }
      if (hq.length) {
        preparedFilters.hq = hq[0];
      }
      // if (accent.length) {
      //   preparedFilters.accent = accent;
      // }
      // if (nativeLanguage.length) {
      //   preparedFilters.nativeLanguage = nativeLanguage;
      // }
      // if (notice.length) {
      //   preparedFilters.notice = notice;
      // }

      console.log(`act_filterVoices::: `, preparedFilters);

      commit('set_voicesListLoading', true);

      return axios.get(`${rootState.API_URL}tts/eleven_labs/voices`, {
        params: preparedFilters
      })
      .then(response => {
        commit('set_voicesList', response.data);
        commit('set_voicesListLoading', false);
      });
    }
  }
}
