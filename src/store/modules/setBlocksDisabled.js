import axios from 'axios';

export default {
  namespaced: true,
  state: {
    disabledBlocks: {blocks: [], ranges: []}
  },
  getters: {
    disabledBlocks: state => {
      return state.disabledBlocks;
    }
  },
  mutations: {
    setDisabledBlocks(state, blocks) {
      state.disabledBlocks.blocks = blocks && blocks.blocks ? blocks.blocks : [];
      state.disabledBlocks.ranges = blocks && blocks.ranges ? blocks.ranges : [];
    }
  },
  actions: {
    setDisabledValue({state, rootState, dispatch}, [disabled]) {
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/blocks/disabled`,
      {
        startId: rootState.blockSelection.start._id,
        endId: rootState.blockSelection.end._id,
        disabled: disabled
      })
        .then((response) => {
          if (response.data && Array.isArray(response.data)) {
            response.data.forEach(blk => {
              let blkStore = rootState.storeList.get(blk.blockid);
              if (blkStore) {
                blkStore.disabled = blk.disabled;
              }
            });
          }
          dispatch('getDisabledBlocks');
          return Promise.resolve();
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },
    getDisabledBlocks({state, rootState, commit}) {
      return axios.get(`${rootState.API_URL}books/${rootState.currentBookid}/blocks/disabled`)
        .then(response => {
          commit('setDisabledBlocks', response.data);
          return Promise.resolve();
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
  }
}