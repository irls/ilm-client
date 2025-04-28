import axios from 'axios';

export default {
  namespaced: true,
  state: {
    suggestions: [],
    applySuggestions: [],
    isDoNotDisturb: false,
    lastAction: ''
  },
  getters: {
    suggestions: state => (category = null) => {
      return state.suggestions.filter(suggestion => {
        return category ? suggestion.category === category : !suggestion.category;
      });
    },
    applySuggestions: state => (category = null) => {
      let applySuggestions = state.applySuggestions.find(suggestions => {
        return suggestions.category === category;
      });
      return applySuggestions ? applySuggestions : {};
    },
    getAllSuggestions: state => state.suggestions,
    getIsDoNotDisturb: state => state.isDoNotDisturb,
    getLastAction: state => state.lastAction,
  },
  mutations: {
    setSuggestions(state, suggestions) {
      state.suggestions = suggestions;
    },
    createdSuggestion(state, suggestion) {
      state.suggestions.unshift(suggestion);
    },
    setDoNotDisturb(state, value) {
      state.isDoNotDisturb = !!value;
    },
    setLastAction(state, value) {
      state.lastAction = value;
    },
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
    create({rootState, commit}, [suggestionData]) {
      suggestionData.bookid = rootState.currentBookMeta.bookid;
      return axios.post(`${rootState.API_URL}suggestions`, suggestionData)
        .then(response => {
          commit('createdSuggestion', response.data);
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
    update({rootState, state, commit, dispatch}, [id, update]) {
      return axios.put(`${rootState.API_URL}suggestions/${encodeURIComponent(id)}`, update)
        .then(response => {
          //commit('updateAuthor', [id, response.data]);
          return dispatch('getAll')
            .then(() => {
              return response.data;
            });
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    canApplySuggestions({rootState, state}, {
      category = null,
      start_id = null,
      end_id = null
    }) {
      let request = {};
      request.bookid = rootState.currentBookMeta.bookid;
      if (category) {
        request.category = category;
      }
      if (start_id && end_id) {
        request.start = start_id;
        request.end = end_id;
      }
      else if (rootState.blockSelection && rootState.blockSelection.start && rootState.blockSelection.start._id) {
        request.start = rootState.blockSelection.start._id;
        request.end = rootState.blockSelection.end._id;
      }
      let modifiedIds = rootState.modifiedBlockids;
      if (modifiedIds.length > 0) {
        request.exclude_ids = modifiedIds;
      }

      return axios.get(`${rootState.API_URL}suggestions/apply`, { params: request })
        .then(response => {
          let suggestionsIndex = state.applySuggestions.findIndex(suggestion => {
            return suggestion.category === category;
          });
          if (suggestionsIndex >= 0) {
            state.applySuggestions[suggestionsIndex] = response.data;
          } else {
            state.applySuggestions.push(response.data);
          }
          return response.data;
        })
        .catch(err => {
          console.log(err.message);
          return Promise.reject(err);
        });
    },
    countApplicableSuggestions({rootState, state}, {
      category = null,
      start_id = null,
      end_id = null,
      exclude_ids = [],
      text = '',
      suggestion = '',
      isAddNew = false,
      sourceBlock = {}
    }) {
      const queryPath = isAddNew ? 'count' : 'count-already-applied';
      let request = {};
      request.bookid = rootState.currentBookMeta.bookid;
      if (category) {
        request.category = category;
      }
      if (start_id && end_id) {
        request.start = start_id;
        request.end = end_id;
      }
      else if (rootState.blockSelection && rootState.blockSelection.start && rootState.blockSelection.start._id) {
        request.start = rootState.blockSelection.start._id;
        request.end = rootState.blockSelection.end._id;
      }
      let modifiedIds = rootState.modifiedBlockids;
      if (modifiedIds.length > 0) {
        exclude_ids = [...exclude_ids, ...modifiedIds];
      }
      if (exclude_ids.length) {
        request.exclude_ids = exclude_ids;
      }
      if (text && text.length) {
        request.text = text;
        request.suggestion = suggestion;
      }

      if (sourceBlock.blockid) {
        request.source_blockid = sourceBlock.blockid;
      }

      return axios.get(`${rootState.API_URL}suggestions/${queryPath}`, { params: request })
        .then(response => {
          let suggestionsIndex = state.applySuggestions.findIndex(suggestion => {
            return suggestion.category === category;
          });
          if (suggestionsIndex >= 0) {
            state.applySuggestions[suggestionsIndex] = response.data;
          } else {
            state.applySuggestions.push(response.data);
          }
          return response.data;
        })
        .catch(err => {
          console.log(err.message);
          return Promise.reject(err);
        });
    },
    postSuggestions({rootState, dispatch}, [category = null]) {
      let request = {};
      request.bookid = rootState.currentBookMeta.bookid;
      if (category) {
        request.category = category;
      }
      if (rootState.blockSelection && rootState.blockSelection.start && rootState.blockSelection.start._id) {
        request.start = rootState.blockSelection.start._id;
        request.end = rootState.blockSelection.end._id;
      }
      let modifiedIds = rootState.modifiedBlockids;
      if (modifiedIds.length > 0) {
        request.exclude_ids = modifiedIds.join(',');
      }
      let request_query = [];
      Object.keys(request).forEach(key => {
        request_query.push(`${key}=${request[key]}`);
      });
      return axios.post(`${rootState.API_URL}suggestions/apply`, request)
        .then(response => {
          return dispatch('getProcessQueue', {}, {root: true})
            .then(() => {
              return response.data;
            });
        })
        .catch(err => {
          console.log(err.message);
          return Promise.reject(err);
        });
    },

    postApplySuggestionsFromBlock({rootState, dispatch}, {
      method = 'POST',
      category = null,
      start_id = null,
      end_id = null,
      exclude_ids = [],
      text = '',
      suggestion = '',
      first_word = false
    }) {
      let request = { first_word, bookid: rootState.currentBookMeta.bookid };
      if (start_id && end_id) {
        request.start = start_id;
        request.end = end_id;
      }
      else if (rootState.blockSelection && rootState.blockSelection.start && rootState.blockSelection.start._id) {
        request.start = rootState.blockSelection.start._id;
        request.end = rootState.blockSelection.end._id;
      }
      let modifiedIds = rootState.modifiedBlockids;
      if (modifiedIds.length > 0) {
        exclude_ids = [...exclude_ids, ...modifiedIds];
      }
      if (exclude_ids.length) {
        request.exclude_ids = exclude_ids;
      }
      if (text && text.length) {
        request.text = text;
        request.suggestion = suggestion;
      }

      console.log(`postApplySuggestionsFromBlock:params:: `, request);

      let axiosRequest = Promise.resolve({});

      switch(method) {
        case 'POST' : {
          axiosRequest = axios.post(`${rootState.API_URL}suggestions/from-block`, request)
        } break;
        case 'PUT' : {
          axiosRequest = axios.put(`${rootState.API_URL}suggestions/from-block`, request)
        } break;
        case 'DELETE' : {
          axiosRequest = axios.delete(`${rootState.API_URL}suggestions/from-block`, { params: request })
        } break;
      };

      return axiosRequest
        .then(response => {
          return dispatch('getProcessQueue', {}, {root: true})
            .then(() => {
              return response.data;
            });
        })
        .catch(err => {
          console.log(err.message);
          return Promise.reject(err);
        });
    }
  }
}
