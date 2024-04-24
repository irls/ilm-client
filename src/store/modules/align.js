import axios from 'axios';

export default {
  namespaced: true,
  state: {
    aligningBooks: [],
    aligningBlocks: []
  },
  getters: {
    aligningAudiofiles: state => {
      let aligningInBooks = state.aligningBooks.reduce((acc, alignBook) => {
        return acc.concat(alignBook.audiofiles.filter(audiofile => {
          return !alignBook.aligned_audiofiles.includes(audiofile);
        }));
      }, []);
      let aligningInBlocks = state.aligningBlocks.reduce((acc, block) => {
        return acc.concat(block.audiocatalog_map ? Object.keys(block.audiocatalog_map) : []);
      }, []);
      return aligningInBooks.concat(aligningInBlocks);
    }
  },
  mutations: {
    setAligningBooks(state, books = []) {
      state.aligningBooks = books;
    },
    setAligningBlocks(state, blocks = []) {
      state.aligningBlocks = blocks;
    }
  },
  actions: {
    cancelAlignment({state, dispatch, rootState}, [bookid, blockid = null, partIdx = null]) {
      let api_url = `${rootState.API_URL}align_queue/${bookid}`;
      if (blockid) {
        api_url+= `/${blockid}`;
      }
      if (partIdx !== null) {
        api_url+= `/${partIdx}`;
      }

      return axios.delete(api_url, {}, {}).then((response) => {
        return dispatch('getBookAlign', {}, {root: true});
      }).catch((err) => {
        return dispatch('getBookAlign', {}, {root: true});
      });
    },
    alignBook({dispatch, rootState}, data) {
      data.wpm_settings = {};
      if (rootState.user.alignWpmSettings && rootState.user.alignWpmSettings[rootState.currentBookid]) {
        data.wpm_settings = rootState.user.alignWpmSettings[rootState.currentBookid]['audio_file'];
      }
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
      // if user is updating custom speed before align - wait for updates to be applied
      let waitAudioSpeedUpdate = new Promise((resolve, reject) => {
        if (!rootState.userActions.updatingAudioSpeed) {
          return resolve();
        }
        let checks = 0;
        let checkInterval = setInterval(() => {
          if (!rootState.userActions.updatingAudioSpeed || checks >= 10) {
            clearInterval(checkInterval);
            return resolve();
          }
          ++checks;
        }, 50);
      });
      return waitAudioSpeedUpdate
        .then(() => {
          return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/selection_alignment`, {
            start: rootState.blockSelection.start._id,
            end: rootState.blockSelection.end._id,
            audiofiles: false,
            realign: true,
            voicework: 'all_with_tts',
            voices: rootState.currentBookMeta.voices,
            wpm_settings: rootState.user.alignWpmSettings[rootState.currentBookid]['tts']
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
  }
}
