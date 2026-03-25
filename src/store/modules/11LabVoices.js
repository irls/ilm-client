import axios from "axios";
//import lodash from "lodash";
import { v4 as uuidv4 } from 'uuid';

export default {
  namespaced: true,
  state: {
    moduleChangeTrigger: false,

    voicesListLoading: false,
    voicesList: {
      loaded: false,
      list: []
    },
    initCharactersList: {
      loaded: false,
      list: [],
      bookid: '',
      id: ''
    },
    charactersList: {
      loaded: false,
      list: [],
      bookid: '',
      id: ''
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
    getSelectedVoice: state => {
      return state.voicesList.list.find((_v)=>{
        return _v.isSelected === true;
      });
    },
    mapCharactersList: state => {
      if (state.charactersList.loaded) {
        return state.charactersList.list;
      }
      return [];
    },
    mapInitCharactersList: state => {
      if (state.initCharactersList.loaded) {
        return state.initCharactersList.list;
      }
      return [];
    },
    isCharactersListLoaded: state => {
      return state.charactersList.loaded;
    },
    getSelectedInitCharacter: state => {
      return state.initCharactersList.list.find((_v)=>{
        return _v.isSelected === true;
      });
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
      const { characters, id, bookid } = payload;
      state.initCharactersList.id = id;
      state.initCharactersList.bookid = bookid;
      state.initCharactersList.list = characters.map((char)=>({...char}));
      state.initCharactersList.loaded = true;
    },

    set_charactersList(state, payload) {
      const { characters, id, bookid } = payload;
      state.charactersList.id = id;
      state.charactersList.bookid = bookid;
      state.charactersList.list = characters.map((char)=>({...char}));
      state.charactersList.loaded = true;
    },

    set_charactersListFromInit(state) {
      state.charactersList.list = state.initCharactersList.list.map((char)=>({...char}));
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

    set_characterVoiceSelected(state, payload) {
      const { voice, character } = payload;
      if (state.voicesList.loaded) {
        state.charactersList.list = state.charactersList.list.map((_v, _idx)=>{
          if (character.uuid && _v.uuid === character.uuid) {
            _v.voice_id = voice.voice_id;
            _v.voice = voice;
          } /*else if (_idx === idx) {
            _v.filters = {..._v.filters, ...filters}
          }*/
          return _v;
        });
        state.moduleChangeTrigger = !state.moduleChangeTrigger;
      }
    },

    set_voiceSelected(state, payload) {
      const { voice } = payload;
      if (voice && state.voicesList.loaded) {
        state.voicesList.list = state.voicesList.list.map((_v, _idx)=>{
          _v.isSelected = false;
          if (_v.voice_id && _v.voice_id === voice.voice_id) {
            _v.isSelected = true;
          }
          return _v;
        });
        state.moduleChangeTrigger = !state.moduleChangeTrigger;
      }
    },

    set_initCharacterSelected(state, payload) {
      const { character } = payload;
      if (state.initCharactersList.loaded) {
        state.initCharactersList.list = state.initCharactersList.list.map((_v, _idx)=>{
          if (character.uuid && _v.uuid === character.uuid) {
            _v.isSelected = true;
          } else {
            _v.isSelected = false;
          }
        return _v;
        });
        state.moduleChangeTrigger = !state.moduleChangeTrigger;
      }
    }
  },
  actions: {

    loadBookCharacters({rootState, commit}, bookid) {
      return axios.get(`${rootState.API_URL}tts/eleven_labs/${bookid}/characters`)
      .then(response => {
        const { characters, id, bookid } = response.data;
        let loop = characters.length;
        while (loop--) {
          characters[loop].uuid = uuidv4();
          characters[loop].isEditing = false;
          characters[loop].isSelected = false;
        }
        commit('set_initCharactersList', { characters, id, bookid });
        commit('set_charactersList', { characters, id, bookid });
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

    saveBookCharacters({rootState, state, commit}, payload) {
      const {bookid, charIdx} = payload;
      const prepareArray = state.charactersList.list.map((_v, _idx)=>({
        name: _v.name,
        voice_id: _v.voice_id,
        filters: _v.filters
      }));

      commit('set_initCharactersList', {
        characters: [...state.charactersList.list],
        id: state.charactersList.id,
        bookid: state.charactersList.bookid
      });

      return axios.put(`${rootState.API_URL}tts/eleven_labs/${bookid}/characters`, {
        id: state.charactersList.id,
        bookid: state.charactersList.bookid,
        characters: prepareArray
      })
      .then(response => {
        console.log(`${__filename.slice(-30)}:saveBookCharacters:response: `, response.data);
      }).catch(err=>{
        console.error('saveBookCharacters', err);
      })
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

    applyFilterVoices({rootState, state, rootGetters, commit}, idx = 0) {
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
        preparedFilters.language = language;
      }
      if (gender.length) {
        preparedFilters.gender = gender;
      }
      if (age.length) {
        preparedFilters.age = age;
      }
      if (hq.length) {
        preparedFilters.hq = hq[0];
      }
      if (accent.length) {
        preparedFilters.accent = accent;
      }
      if (nativeLanguage.length) {
        preparedFilters.sec_language = nativeLanguage;
      }
      if (notice.length) {
        preparedFilters.notice_period = notice;
      }

      console.log(`applyFilterVoices::: `, preparedFilters);

      commit('set_voicesListLoading', true);
      return axios.get(`${rootState.API_URL}tts/eleven_labs/voices`, {
        params: preparedFilters
      })
      .then(response => {
        commit('set_voicesList', response.data);
        commit('set_voicesListLoading', false);
        if (state.charactersList.list[idx]?.voice_id) {
          commit('set_voiceSelected', { voice: state.charactersList.list[idx].voice })
        }
      });
    },

    checkVoiceIfApplied({rootState}, voice) {
      return axios.get(`${rootState.API_URL}tts/eleven_labs/${encodeURIComponent(voice.id)}/aligned_blocks`)
      .then(response => {
        return response.data?.count;
      }).catch(err=>{
        console.error('checkVoiceIfApplied', err);
        return Promise.reject(err);
      })
    },

    deleteVoice({rootState, state, commit}, params) {
      const { idx, bookid } = params;
      return axios.delete(`${rootState.API_URL}tts/eleven_labs/${bookid}/characters/${idx}`)
      .then(response => {
        const { id, bookid } = response.data;
        const characters = state.initCharactersList.list.filter((_v, _idx)=>{
          return _idx !== idx;
        });

        commit('set_initCharactersList', { characters, id, bookid });
        commit('set_charactersList', { characters, id, bookid });
      }).catch(err=>{
        console.error('deleteVoice', err);
        return Promise.reject(err);
      })
    }
  }
}
