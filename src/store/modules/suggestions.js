import axios from 'axios';

export default {
  namespaced: true,
  state: {
    suggestions: []
  },
  getters: {
    suggestions: state => (category = null) => {
      return state.suggestions.filter(suggestion => {
        return category ? suggestion.category === category : !suggestion.category;
      });
    }
  },
  mutations: {
    setSuggestions(state, suggestions) {
      state.suggestions = suggestions;
    }
  },
  actions: {
    get({rootState}, [id]) {
      return axios.get(`${rootState.API_URL}suggestions/${encodeURIComponent(id)}`)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    getAll({rootState, commit, state}) {
      return axios.get(`${rootState.API_URL}suggestions`)
        .then(response => {
          commit('setSuggestions', response.data);
          return state.suggestions;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    create({rootState}, [suggestionData]) {
      return axios.post(`${rootState.API_URL}suggestions`, suggestionData)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    remove({rootState}, [id]) {
      return axios.delete(`${rootState.API_URL}suggestions/${encodeURIComponent(id)}`)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    update({rootState, state, commit}, [id, update]) {
      return axios.put(`${rootState.API_URL}suggestions/${encodeURIComponent(id)}`, update)
        .then(response => {
          //commit('updateAuthor', [id, response.data]);
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
  }
}