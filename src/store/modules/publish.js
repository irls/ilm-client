import axios from 'axios';
import lodash from 'lodash';

export default {
  namespaced: true,
  state: {
    allPublicationErrors: {book: {}, blocks: []},
    blocksHtmlErrors: []
  },
  getters: {
    allPublicationErrors: state => {
      return state.allPublicationErrors;
    },
    blocksHtmlErrors: state => {
      return state.blocksHtmlErrors;
    }
  },
  mutations: {
    set_publicationErrors(state, [updated_blocks = []]) {
      if (!updated_blocks || !updated_blocks.length) {
        state.allPublicationErrors.blocks = [];
      } else {
        let updated_blockids = [];
        updated_blocks.forEach(updated_block => {
          updated_blockids.push(updated_block.blockid);
        });
        updated_blocks.filter(updated_block => {
          return !updated_block.html_errors || updated_block.html_errors.length === 0;
        }).forEach(updated_block => {
          state.allPublicationErrors.blocks = state.allPublicationErrors.blocks.filter(block_error => {
            let hasBookError = (this.getters.currentBookMeta.publication_errors && this.getters.currentBookMeta.publication_errors.blocks && this.getters.currentBookMeta.publication_errors.blocks.find(book_error => {
              return block_error.blockid === book_error.blockid && block_error.message === book_error.message;
            }));
            return block_error.blockid !== updated_block.blockid || hasBookError;
          });
        });
      }
      if (this.getters.currentBookMeta) {
        if (this.getters.currentBookMeta.publication_errors && (this.getters.currentBookMeta.publication_errors.book || this.getters.currentBookMeta.publication_errors.blocks) && (!updated_blocks || updated_blocks.length === 0)) {
          state.allPublicationErrors = lodash.cloneDeep(this.getters.currentBookMeta.publication_errors);
        }
        let check_blocks = [];
        if (updated_blocks && updated_blocks.length > 0) {
          check_blocks = updated_blocks;
        } else {
          check_blocks = lodash.cloneDeep(state.blocksHtmlErrors);
        }
        check_blocks./*filter(block => {
          return !block.disabled;
        }).*/forEach(block => {
          if (block.html_errors) {
            lodash.cloneDeep(block.html_errors).forEach(html_error => {
              if (html_error.hasOwnProperty('footnoteIdx')) {
                html_error.message = `fn ${html_error.footnoteIdx + 1} ${html_error.message}`;
              }
              if (html_error.hasOwnProperty('partIdx')) {
                html_error.message = `sb ${html_error.partIdx + 1} ${html_error.message}`;
              }
              let error_data = Object.assign(html_error, {blockid: block.blockid});
              let errorIndex = state.allPublicationErrors.blocks.findIndex(blk => {
                return blk.blockid === error_data.blockid && blk.footnoteIdx === html_error.footnoteIdx && blk.partIdx === html_error.partIdx;
              });
              if (errorIndex >= 0) {
                state.allPublicationErrors.blocks[errorIndex] = error_data;
              } else {
                state.allPublicationErrors.blocks.push(error_data);
              }
            });
          }
        });
        if (this.getters['setBlocksDisabled/disabledBlocks'].blocks.length > 0) {
          let disabledBlockids = [];
          this.getters['setBlocksDisabled/disabledBlocks'].blocks.forEach(block => {
            disabledBlockids.push(block.blockid);
          });
          state.allPublicationErrors.blocks = state.allPublicationErrors.blocks.filter(block => {
            return !disabledBlockids.includes(block.blockid);
          });
        }
      }
    },
    block_removed(state, block) {
      if (state.allPublicationErrors && state.allPublicationErrors.blocks) {
        state.allPublicationErrors.blocks = state.allPublicationErrors.blocks.filter(blk => {
          return blk.blockid !== block.blockid;
        });
      }
    },
    set_blocksHtmlErrors(state, html_errors) {
      state.blocksHtmlErrors = html_errors;
    },
    clear_htmlErrors(state) {
      state.allPublicationErrors.blocks = [];
      Object.keys(state.allPublicationErrors.book).forEach(fieldKey => {
        state.allPublicationErrors.book[fieldKey] = "";
      });
    }
  },
  actions: {
    publishBook({state, rootState}) {
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookMeta.bookid}/publish`)
        .then(resp => {
          if (resp.status == 200 && resp.data.ok) {
            rootState.currentBookMeta.isInTheQueueOfPublication = true;
            rootState.currentBookMeta.publication_errors = {};
          }
        });
    },
    checkBlocksHTMLErrors({state, rootState, commit, dispatch}) {
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookMeta.bookid}/check_blocks_html_errors`)
        .then(response => {
          if (response.status === 200) {
            if (response.data.length > 0) {
              commit('set_publicationErrors', [response.data]);
              response.data.forEach(block => {
                let storeBlock = rootState.storeList.get(block.blockid);
                if (storeBlock) {
                  storeBlock.html_errors = block.html_errors;
                }
              });
              rootState.storeListO.refresh();
            }
            dispatch('loadHtmlErrorsBlocks');
          }
        });
    },
    publishCollectionBook({state, rootState, commit}) {
      if (rootState.currentBookMeta) {
        if (!rootState.currentBookMeta.isInTheQueueOfPublication) {
          return axios.get(`${rootState.API_URL}books/${rootState.currentBookMeta.bookid}/add_in_collection_publish`)
          .then(resp => {
            if (resp.status == 200) {
              rootState.currentBookMeta.isInTheQueueOfPublication = true;
              //commit('SET_BOOK_PUBLISH_BUTTON_STATUS', false, {root: true});
            }
            return resp;
          });
        } else {
          return axios.get(`${rootState.API_URL}books/${rootState.currentBookMeta.bookid}/rem_from_collection_publish`)
          .then(resp => {
            if (resp.status == 200) {
              rootState.currentBookMeta.isInTheQueueOfPublication = false;
            }
            return resp;
          });
        }
      }
    },
    reReadPublicationErrors({state, commit}, [blocks = []]) {
      commit('set_publicationErrors', [blocks]);
    },
    loadHtmlErrorsBlocks({rootState, commit}) {
      if (rootState.currentBookMeta.bookid) {
        return axios.get(`${rootState.API_URL}books/${rootState.currentBookMeta.bookid}/block/html_errors`)
          .then(response => {
            commit('set_blocksHtmlErrors', response.data);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
    }
  }
}