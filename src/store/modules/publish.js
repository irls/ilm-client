import axios from 'axios';
import lodash from 'lodash';

export default {
  namespaced: true,
  state: {
    allPublicationErrors: {book: {}, blocks: []}
  },
  getters: {
    allPublicationErrors: state => {
      return state.allPublicationErrors;
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
        state.allPublicationErrors.blocks = state.allPublicationErrors.blocks.filter(block => {
          return !updated_blockids.includes(block.blockid);
        });
      }
      if (this.getters.currentBookMeta) {
        if (this.getters.currentBookMeta.publication_errors && (this.getters.currentBookMeta.publication_errors.book || this.getters.currentBookMeta.publication_errors.blocks)) {
          state.allPublicationErrors = lodash.cloneDeep(this.getters.currentBookMeta.publication_errors);
        }
        let check_blocks = [];
        if (updated_blocks && updated_blocks.length > 0) {
          check_blocks = updated_blocks;
        } else {
          check_blocks = Array.from(this.getters.storeList).filter(block => {
            return block[1].html_errors.length > 0;
          }).map(blk => {
            return blk[1];
          });
        }
        check_blocks.filter(block => {
          return !block.disabled;
        }).forEach(block => {
          if (block.html_errors) {
            block.html_errors.forEach(html_error => {
              if (html_error.hasOwnProperty('footnoteIdx')) {
                html_error.message = `fn ${html_error.footnoteIdx + 1} ${html_error.message}`;
              }
              if (html_error.hasOwnProperty('partIdx')) {
                html_error.message = `sb ${html_error.partIdx + 1} ${html_error.message}`;
              }
              state.allPublicationErrors.blocks.push(Object.assign(html_error, {blockid: block.blockid}));
            });
          }
        });
      }
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
    checkBlocksHTMLErrors({state, rootState, commit}) {
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
    }
  }
}