import axios from 'axios';

export default {
  namespaced: true,
  state: {},
  getters: {},
  actions: {
    cancelAlign({state, dispatch}, [bookid, blockid = null]) {
      let api_url = `${state.API_URL}align_queue/${bookid}`;
      if (blockid) {
        api_url+= `/${blockid}`;
      }

      axios.delete(api_url, {}, {}).then((response) => {
        dispatch('getBookAlign');
      }).catch((err) => {
        dispatch('getBookAlign');
      });
    },
    alignBook({dispatch, rootState}, data) {
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/selection_alignment`, data, {
        validateStatus: function (status) {
          return status === 200 || status === 504;
        }
      })
      .then((response) => {
        dispatch('getBookAlign', {}, {root: true});
        dispatch('setCurrentBookCounters', [], {root: true});
        dispatch('resetSelectionAudiosrcConfig');
        return Promise.resolve(response);
      })
      .catch((err) => {
        dispatch('getBookAlign', {}, {root: true});
        console.log('error: ', err);
        return Promise.resolve({});
      });
    },
    alignTTS({rootState, dispatch}) {
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/selection_alignment`, {
        start: rootState.blockSelection.start._id,
        end: rootState.blockSelection.end._id,
        audiofiles: false,
        realign: true,
        voicework: 'all_with_tts',
        voices: rootState.currentBookMeta.voices
      }, {
        validateStatus: function (status) {
          return status == 200 || status == 504;
        }
      })
      .then((response) => {
        dispatch('getBookAlign', {}, {root: true});
        dispatch('setCurrentBookCounters', [], {root: true});
        dispatch('resetSelectionAudiosrcConfig');
        return Promise.resolve(response);
      }).catch((err) => {
        dispatch('getBookAlign', {}, {root: true});
        return Promise.reject(err);
      });
    },
    resetSelectionAudiosrcConfig({rootState}) {
      if (rootState.blockSelection.start && rootState.blockSelection.start._id && rootState.blockSelection.end && rootState.blockSelection.end._id) {
        let crossId = rootState.blockSelection.start._id;
        for (let idx = 0; idx < rootState.storeList.size; idx++) {
          let block = rootState.storeList.get(crossId);
          if (block) {
            block.resetAudiosrcConfig();
            if (block.blockid === rootState.blockSelection.end._id) {
              break;
            }
            crossId = rootState.storeListO.getOutId(block.blockid);
            if (!crossId) {
              break;
            }
          } else {
            break;
          }
        }
      }
    }
  },
  mutations: {}
}