import axios from "axios";
//import lodash from "lodash";
import { v4 as uuidv4 } from 'uuid';

export default {
  namespaced: true,
  state: {
    voicesListLoading: false,
    voicesList: {
      loaded: false,
      list: []
    },
    initCharactersList: {
      loaded: false,
      list: []
    },
    charactersList: {
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
    },
    mapCharactersList: state => {
      if (state.charactersList.loaded) {
        return state.charactersList.list;
      }
      return [];
    },
    isCharactersListLoaded: state => {
      return state.charactersList.loaded;
    },
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
    },

    set_initCharactersList(state, payload) {
      state.initCharactersList.list = payload;
      state.initCharactersList.loaded = true;
    },

    set_charactersList(state, payload) {
      state.charactersList.list = payload;
      state.charactersList.loaded = true;
    },

    set_charactersListNonEdit(state) {
      state.charactersList.list = state.charactersList.list.map((_v)=>{
        _v.isEditing = false;
        return _v;
      });
    },

    set_charactersListItemEdit(state, character) {
      state.charactersList.list = state.charactersList.list.map((_v)=>{
        _v.isEditing = (_v.uuid == character.uuid)
        return _v;
      });
    },

    set_charactersListItemValue(state, payload) {
      const { values, character } = payload;
      const item = state.charactersList.list?.find((_v)=>_v.uuid == character.uuid);

      if (item) {
        for (const [key, value] of Object.entries(values)) {
          item[key] = value;
        }
      }
    },

    set_charactersListAddItem(state) {
      state.charactersList.list.push({
        filters: {},
        name: 'new Character',
        voice: {},
        voice_id: null,
        uuid: uuidv4(),
        isEditing: false
      })
    },

    set_charactersListRemoveItem(state, idx) {
      state.charactersList.list = state.charactersList.list.filter((_v, _idx)=>_idx != idx);
    },

    set_charactersListUpdateItem(state, payload) {
      const { idx, uuid = null, filters} = payload;
      state.charactersList.list = state.charactersList.list.map((_v, _idx)=>{
        if (uuid && _v.uuid === uuid) {
          _v.filters = {..._v.filters, ...filters};
        } else if (_idx === idx) {
          _v.filters = {..._v.filters, ...filters}
        }
        return _v;
      })
    },
  },
  actions: {

    loadBookCharacters({rootState, state, commit, dispatch}, bookid) {
      return axios.get(`${rootState.API_URL}tts/eleven_labs/${bookid}/characters`)
      .then(response => {
        const { characters } = response.data;
        let loop = characters.length;
        while (loop--) {
          characters[loop].uuid = uuidv4();
          characters[loop].isEditing = false;
        }
        commit('set_initCharactersList',  characters);
        commit('set_charactersList',  characters);
      });
    },

    applyInitVoicesFilters({state, commit}, idx = 0) {
      if (state.initCharactersList.list.length) {
        commit(
          'elevenLabsVoicesFilters/set_initFilters',
          state.initCharactersList.list[idx]?.filters,
          { root: true }
        );
      }
    },

    applySavedVoicesFilters({state, commit}, idx = 0) {
      if (state.charactersList.list.length) {
        commit(
          'elevenLabsVoicesFilters/set_initFilters',
          state.charactersList.list[idx]?.filters,
          { root: true }
        );
      }
    },

    applyFilterVoices({rootState, rootGetters, commit}) {
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

      console.log(`applyFilterVoices::: `, preparedFilters);

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
