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
    updateAuthor({rootState, state, commit}, [id, update, language = null]) {
      ['verified_names', 'alt_names'].forEach(updateKey => {
        if (update[updateKey]) {
          update[updateKey] = update[updateKey].filter((verified_name, verified_name_idx) => {
            return verified_name.trim().length > 0 && !(update[updateKey].find((verifiedName, verifiedNameIdx) => {
              return verifiedName.trim() === verified_name.trim() && verifiedNameIdx < verified_name_idx;
            }));
          });
        }
      });
      return axios.put(`${rootState.API_URL}authors/${encodeURIComponent(id)}${language ? '/' + language : ''}`, update)
        .then(response => {
          commit('updateAuthor', [id, response.data]);
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    createAuthorFromBook({rootState, dispatch}, [authorData]) {
      let authorAdd = {
        slug: authorData.slug,
      };
      if (authorData.name_en) {
        authorAdd.name = authorData.name_en;
        authorAdd.name_lang = [
          {
            name: authorData.name,
            language: rootState.currentBookMeta.language
          }
        ]
      } else {
        authorAdd.name = authorData.name;
      }
      return dispatch('createAuthor', [authorAdd]);
    },
    createAuthorLangFromBook({rootState, dispatch, state}, [id, authorLang]) {
      let lang = rootState.currentBookMeta.language;
      return axios.post(`${rootState.API_URL}authors/${encodeURIComponent(id)}/${lang}`, authorLang)
        .then(response => {
          return response.data;
        });
    }
  }
}