import axios from "axios";
import lodash from "lodash";

export default {
  namespaced: true,
  state: {
    massSetLanguageProcess: false
  },
  getters: {
    massSetLanguageProcess: state => {
      return state.massSetLanguageProcess;
    }
  },
  mutations: {
    lockSelectedBlocks(state) {
      if (this.getters.blockSelection.start._id && this.getters.blockSelection.end._id) {
        let crossId = this.getters.blockSelection.start._id;
        for (let idx = 0; idx < this.getters.storeList.size; idx++) {
          let block = this.getters.storeList.get(crossId);
          if (block) {
            this.commit('add_block_lock', { block: block });
            if (block._id === this.getters.blockSelection.end._id) {
              break;
            }
            crossId = this.getters.storeListO.getOutId(block.blockid);
          } else {
            break;
          }
        }
      }
      
    },
    unlockSelectedBlocks(state) {
      if (this.getters.blockSelection.start._id && this.getters.blockSelection.end._id) {
        let crossId = this.getters.blockSelection.start._id;
        for (let idx = 0; idx < this.getters.storeList.size; idx++) {
          let block = this.getters.storeList.get(crossId);
          if (block) {
            this.commit('clear_block_lock', { block: block });
            if (block._id === this.getters.blockSelection.end._id) {
              break;
            }
            crossId = this.getters.storeListO.getOutId(block.blockid);
          } else {
            break;
          }
        }
      }
    }
  },
  actions: {
    massSetLanguage({state, rootState, commit}, [ language ]) {
      commit('lockSelectedBlocks');
      state.massSetLanguageProcess = true;
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/set_block_language`, {
        start_id: rootState.blockSelection.start._id,
        end_id: rootState.blockSelection.end._id,
        language: language
      })
        .then(response => {
          commit('unlockSelectedBlocks');
          state.massSetLanguageProcess = false;
          if (Array.isArray(response.data)) {
            response.data.forEach(b => {
              let block = rootState.storeList.get(b.blockid);
              if (block) {
                block.setUpdated(b.updated);
                block.setLanguage(b.language);
                block.status.marked = b.status.marked;
              }
            });
          }
          return response.data;
        })
        .catch(err => {
          commit('unlockSelectedBlocks');
          state.massSetLanguageProcess = false;
          return Promise.reject(err);
        });
    },

    massDelete({state, rootState, dispatch, commit}) {
      let blockids = rootState.selectedBlocks.reduce((acc, block) => {
        acc.push(block.blockid);
        return acc;
      }, []);
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/mass_delete`, {
        blockids: blockids
      })
        .then(response => {
          commit('clear_blockSelection', null, { root: true });
          return dispatch('getProcessQueue', {}, { root: true });
        });
    },

    massJoin({state, rootState, dispatch}, [selected_ids = [], line_breaks = false]) {
      if (!selected_ids || !selected_ids.length) {
        selected_ids = rootState.selectedBlocks.reduce((acc, block) => {
          acc.push(block.blockid);
          return acc;
        }, []);
      }
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/mass_join`, {
        blockids: selected_ids,
        line_breaks: line_breaks
      })
        .then(response => {
          if (rootState.blockSelection.start._id && rootState.blockSelection.end._id) {
            dispatch('setBlockSelection', {
              start: { _id: rootState.blockSelection.start._id }, 
              end: { _id: rootState.blockSelection.start._id }
            }, { root: true });
          }
          return dispatch('getProcessQueue', {}, { root: true });
        });
    }
  }
}
