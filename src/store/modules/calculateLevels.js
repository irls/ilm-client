import axios from "axios";

export default {
  namespaced: true,
  state: {
    audiofile: null,
    audio_levels: []
  },
  getters: {
    audiofile: state => {
      return state.audiofile;
    },
    audio_levels: state => {
      return state.audio_levels;
    }
  },
  mutations: {
    setAudiofile(state, audiofile) {
      state.audiofile = audiofile;
    },
    setAudioLevels(state, audio_levels) {
      state.audio_levels = audio_levels;
    }
  },
  actions: {
    getLevels({rootState, state, commit}, data) {
      commit("setAudioLevels", [])
      return axios.post(`${rootState.API_URL}get_astats`, data)
        .then(response => {
          commit("setAudioLevels", response.data.stats);
          return state.audio_levels;
        })
    }
  }
}