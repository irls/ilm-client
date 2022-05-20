import axios from 'axios';

export default {
  namespaced: true,
  state: {
    API_URL: process.env.ILM_API + '/api/v1/'
  },
  getters: {},
  actions: {
    loadPredefined({state}) {
      return axios.get(`${state.API_URL}test_audio_convert/predefined`)
        .then(response => {
          return Promise.resolve(response.data);
        });
    },
    convert({state}, data) {
      return axios.post(`${state.API_URL}test_audio_convert/convert`, data)
        .then(response => {
          return Promise.resolve(response.data);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
  }
}