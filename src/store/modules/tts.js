import axios from 'axios';

export default {
  namespaced: true,
  state: {
    new_voice_settings: {},
    tts_voices: []
  },
  getters: {
    new_voice_settings: state => {
      return state.new_voice_settings;
    },
    tts_voices: state => {
      return state.tts_voices;
    }
  },
  mutations: {
    set_new_voice_settings(state, settings) {
      state.new_voice_settings = settings;
    },
    
    set_tts_voices(state, voices) {
      state.tts_voices = voices;
    },
    set_book_defaults(state) {
      if (this.getters.currentBookMeta) {
        let defaultVoice = state.tts_voices.find(voice => {
          return voice.default === true;
        });
        this.getters.currentBookMeta.voices = this.getters.currentBookMeta.voices || {};
        ['paragraph', 'title', 'header'].forEach(field => {
          if (!this.getters.currentBookMeta.voices[field]) {
            this.getters.currentBookMeta.voices[field] = '';
          }
        });
        if (defaultVoice) {
          //console.log(defaultVoice);
          Object.keys(this.getters.currentBookMeta.voices).forEach(type => {
            if (!this.getters.currentBookMeta.voices[type] || this.getters.currentBookMeta.voices[type].length < 15) {// length means old TTS voice
              this.getters.currentBookMeta.voices[type] = defaultVoice.voice_id;
            }
          });
          Object.keys(this.getters.currentBookMeta.voices).forEach(type => {
            let voice = state.tts_voices.find(v => {
              return v.voice_id === this.getters.currentBookMeta.voices[type];
            });
            if (!voice) {
              this.getters.currentBookMeta.voices[type] = defaultVoice.voice_id;
            }
          });
        }
      }
    }
  },
  actions: {
    getNewVoiceSettings({state, dispatch, commit, rootState}) {
      return axios.get(`${rootState.API_URL}tts/eleven_labs/new_voice_settings`)
        .then((response) => {
          if (response && response.status === 200) {
            commit('set_new_voice_settings', response.data);
          }
          return Promise.resolve();
        })
        .catch(err => {
          console.log(err);
        });
    },
    
    getTTSVoices({state, commit, rootState}) {
      return axios.get(`${rootState.API_URL}tts/voices/${rootState.currentBookid}`)
      .then((response) => {
        commit('set_tts_voices', response.data);
        commit('set_book_defaults');
        /*if (state.currentBookMeta && state.currentBookMeta.language == 'en') {
          let default_voice = null;
          state.ttsVoices.forEach(group => {
            if (!default_voice && group.children) {
              default_voice = group.children.find(ch => ch.id == 'Brian');
            }
          });
          if (default_voice && Object.keys(state.currentBookMeta.voices).length > 0) {
            for (let type in state.currentBookMeta.voices) {
              if (!state.currentBookMeta.voices[type]) {
                state.currentBookMeta.voices[type] = default_voice.id
              }
            }
          }
        }*/
        return response.data;
      })
      .catch(err => {
        return Promise.reject(err);
      });
    },
    
    generateVoice({state, rootState}, params) {
      return axios.post(`${rootState.API_URL}tts/eleven_labs/generate_voice`, params)
        .then(response => {
          if (response && response.status === 200) {
            return response.data;
          }
          return {};
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    
    saveGeneratedVoice({state, rootState, dispatch}, params) {
      return axios.post(`${rootState.API_URL}tts/eleven_labs/create_voice/${rootState.currentBookid}`, params)
        .then(response => {
          //dispatch('getTTSVoices');
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    
    removeVoice({rootState}, id) {
      return axios.delete(`${rootState.API_URL}tts/eleven_labs/voice/${encodeURIComponent(id)}`)
        .then(response => {
          return response;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    
    updateVoice({rootState}, [id, update]) {
      return axios.post(`${rootState.API_URL}tts/eleven_labs/voice/${encodeURIComponent(id)}`, update)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    
    generateExample({rootState}, id) {
      return axios.post(`${rootState.API_URL}tts/eleven_labs/generate_example/${encodeURIComponent(id)}`)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
  }
}