import axios from 'axios';

export default {
  namespaced: true,
  state: {
    authors: []
  },
  getters: {
    authors: state => {
      return state.authors;
    }
  },
  mutations: {
    setAuthors(state, authors) {
      state.authors = authors;
    },
    updateAuthor(state, [id, author]) {
      let authorIndex = state.authors.findIndex(findAuthor => {
        return findAuthor.id === id;
      });
      if (authorIndex !== -1) {
        state.authors[authorIndex] = author;
      }
    }
  },
  actions: {
    getAll({rootState, commit, state}) {
      return axios.get(`${rootState.API_URL}authors`)
        .then(response => {
          commit('setAuthors', response.data);
          return state.authors;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    createAuthor({rootState}, [authorData]) {
      return axios.post(`${rootState.API_URL}authors`, authorData)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    removeAuthor({rootState}, [id]) {
      return axios.delete(`${rootState.API_URL}authors/${encodeURIComponent(id)}`)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    updateAuthor({rootState, state, commit}, [id, update]) {
      return axios.put(`${rootState.API_URL}authors/${encodeURIComponent(id)}`, update)
        .then(response => {
          commit('updateAuthor', [id, response.data]);
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
  }
}