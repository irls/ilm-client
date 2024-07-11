import axios from 'axios';

export default {
  namespaced: true,
  state: {
    disabledBlocks: {blocks: [], ranges: []},
    disabledBlocksQuery: false,
    disabledBlocksApply: false
  },
  getters: {
    disabledBlocks: state => {
      return state.disabledBlocks;
    },
    disabledBlocksQuery: state => {
      return state.disabledBlocksQuery;
    },
    disabledBlocksApply: state => {
      return state.disabledBlocksApply;
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
      state.disabledBlocksApply = true;
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/blocks/disabled`,
      {
        startId: rootState.blockSelection.start._id,
        endId: rootState.blockSelection.end._id,
        disabled: disabled
      })
        .then((response) => {
          state.disabledBlocksApply = false;
          if (response.data && Array.isArray(response.data)) {
            response.data.forEach(blk => {
              let blkStore = rootState.storeList.get(blk.blockid);
              if (blkStore) {
                blkStore.disabled = blk.disabled;
              }
              let blkSelected = rootState.selectedBlocks.find(sb => {
                return sb.blockid === blk.blockid;
              });
              if (blkSelected) {
                blkSelected.disabled = blk.disabled;
              }
            });
          }
          dispatch('getDisabledBlocks');
          dispatch('loadBookToc', {bookId: rootState.currentBookid, isWait: true}, {root: true});
          dispatch('tocSections/loadBookTocSections', [], {root: true});
          if (rootState.currentJobInfo && rootState.currentJobInfo.published) {
            dispatch('updateBookVersion', {major: true}, {root: true});
          }
          return Promise.resolve();
        })
        .catch(err => {
          state.disabledBlocksApply = false;
          return Promise.reject(err);
        });
    },
    getDisabledBlocks({state, rootState, commit}) {
      state.disabledBlocksQuery = true;
      return axios.get(`${rootState.API_URL}books/${rootState.currentBookid}/blocks/disabled`)
        .then(response => {
          commit('setDisabledBlocks', response.data);
          state.disabledBlocksQuery = false;
          commit('set_publicationErrors', [], {root: true});
          return Promise.resolve();
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
  }
}