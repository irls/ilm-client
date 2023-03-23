import axios from 'axios';

export default {
  namespaced: true,
  state: {},
  getters: {},
  actions: {
    blockAudioExport({state, rootState, dispatch}, [type]) {
      if (!rootState.currentBookid) {
        return false;
      }
      rootState.currentBookMeta.block_audio_export = rootState.currentBookMeta.block_audio_export || {};
      rootState.currentBookMeta.block_audio_export.in_process = true;
      let request = {
        range: {
          start: null,
          end: null,
        },
        type: type
      }
      if (rootState.blockSelection && rootState.blockSelection.start && rootState.blockSelection.start._id) {
        request.range.start = rootState.blockSelection.start._id;
        request.range.end = rootState.blockSelection.end._id;
      } else {
        let blockids = Array.from(rootState.storeList.keys());
        request.range = {start: blockids[0], end: blockids[blockids.length - 1]};
      }
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/block_audio_export`, request)
        .then(() => {
          
        })
        .catch(err => {
          
        });
    },
    parseReplaceAudio({state, rootState, commit}, [toUpload]) {
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/parse_replace_audio`, toUpload)
        .then(response => {
          commit('set_updateAudiobookProgress', false, {root: true});
          return Promise.resolve(response);
        });
    }
  }
}