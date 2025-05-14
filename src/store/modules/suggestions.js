import axios from 'axios';
import { cleanFilter } from "../../filters/search";

export default {
  namespaced: true,
  state: {
    suggestions: [],
    applySuggestions: [],
    isDoNotDisturb: {
      add: [],
      edit: [],
      delete: []
    },
    lastAction: '',
    counters: {
      matchBlocksCounter: 0,
      matchFirstWordBlocksCounter: 0
    }
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
    getIsDoNotDisturb: state => (action, word) => {
      if (!state.isDoNotDisturb.hasOwnProperty(action)) {
        return false;
      }
      let checkWord = cleanFilter(word);
      return state.isDoNotDisturb[action].find(record => {
        return record.word === checkWord && record.matchBlocksCounter === state.counters.matchBlocksCounter > 0 && record.matchFirstWordBlocksCounter === state.counters.matchFirstWordBlocksCounter > 0;
      });
    },
    getLastAction: (state, getters) => (action, word) => {
      if (!state.isDoNotDisturb.hasOwnProperty(action)) {
        return '';
      }
      let actionRecord = getters.getIsDoNotDisturb(action, word);
      if (actionRecord) {
        return actionRecord.updateAction;
      }
      return '';
    },
    counters: state => state.counters,
  },
  mutations: {
    setSuggestions(state, suggestions) {
      state.suggestions.length = 0;
      state.suggestions.push.apply(state.suggestions, suggestions);
    },
    createdSuggestion(state, suggestion) {
      state.suggestions.unshift(suggestion);
    },
    setDoNotDisturb(state, [action, word, updateAction]) {
      if (action === false) {
        Object.keys(state.isDoNotDisturb).forEach(action => {
          state.isDoNotDisturb[action] = [];
        });
      } else {
        let checkWord = cleanFilter(word);
        if (state.isDoNotDisturb.hasOwnProperty(action)) {
          if (!this.getters["suggestionsModule/getIsDoNotDisturb"](action, word)) {
            state.isDoNotDisturb[action].push({
              word: checkWord, 
              matchBlocksCounter: state.counters.matchBlocksCounter > 0, 
              matchFirstWordBlocksCounter: state.counters.matchFirstWordBlocksCounter > 0,
              updateAction: updateAction
            });
          }
        }
      }
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
    },

    getSuggestionCounters({state, rootState, dispatch}, [suggestion, sourceBlock]) {
      const start_id = rootState.storeListO.idsArray()[0];
      const end_id = rootState.storeListO.idsArray()[rootState.storeListO.idsArray().length - 1];
      const exclude_ids = [];
      const isAddNew = suggestion.action === 'add';
      //const exclude_ids = this.currentBlockId.length ? [this.currentBlockId] : [];

      return dispatch('countApplicableSuggestions', {
        start_id,
        end_id,
        exclude_ids,
        text: suggestion.text,
        suggestion: suggestion.suggestion,
        isAddNew,
        sourceBlock: sourceBlock
      })
      .then((fullBlockCounters)=>{
        console.log(`fullBlockCounters::: `, fullBlockCounters);
        state.counters.matchBlocksCounter = fullBlockCounters.blocks;
        state.counters.matchFirstWordBlocksCounter = fullBlockCounters.firstWordBlocks;
        //if (this.isDoNotDisturb) {
          //this.updateAction = this.getLastAction;
        //}
        return {};
      })
      .catch((err)=>{
        console.error(err.message || err);
        return {};
      });
    }
  }
}
