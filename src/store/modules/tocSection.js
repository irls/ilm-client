import axios from 'axios';

export default {
  namespaced: true,
  state: {
    bookTocSectionsXHR: null,
    bookTocSectionsTimer: null,
    tocSectionBook: {},
    bookTocSections: [],
    pendingSectionUpdate: false,
  },
  getters: {
    tocSectionBook: state => {
      return state.tocSectionBook;
    },
    bookTocSections: state => {
      return state.bookTocSections;
    },
    currentBookTocCombined: (state, getters, rootState) => {
      let currentBookTocCombined = [];
      if (!rootState.adminOrLibrarian) {
        return rootState.currentBookToc.data;
      }
      if (!state.bookTocSections || state.bookTocSections.length === 0) {
        return rootState.currentBookToc.data;
      }
      rootState.currentBookToc.data.forEach(toc => {
        let section = state.bookTocSections.find(s => {
          return s.startBlockid === toc.blockid;
        });
        currentBookTocCombined.push(Object.assign(toc, {section: section ? section : {}}));
      });
      let firstToc = rootState.currentBookToc.data.find(toc => {
        return toc.blockid === state.bookTocSections[0].startBlockid;
      });
      if (!firstToc) {
        currentBookTocCombined.unshift(Object.assign({}, {section: state.bookTocSections[0]}));
      }
      return currentBookTocCombined;
    },
    pendingSectionUpdate: state => {
      return state.pendingSectionUpdate;
    }
  },
  mutations: {
    set_toc_section_book(state, tocSectionBook) {
      state.tocSectionBook = tocSectionBook && tocSectionBook.id ? tocSectionBook : {isBuilding: false};
    },
    set_book_toc_sections(state, sections) {
      let language = this.getters.currentBookMeta ? this.getters.currentBookMeta.language : 'en';
      sections.forEach(section => {
        let blk = this.getters.storeList.get(section.startBlockid);
        if (blk) {
          section.firstSectionBlock = {...blk};
        } else {
          section.firstSectionBlock = {};
        }
        if (!section.firstSectionBlock.language) {
          section.firstSectionBlock.language = language;
        }
      });
      state.bookTocSections = sections;
    },
  },
  actions: {
    loadBookTocSections({state, dispatch, commit, rootState}, [bookid = null]) {
      if (rootState.adminOrLibrarian) {
        const reqBookid = bookid ? bookid : rootState.currentBookid;
        //console.log(`loadBookTocSections.reqBookid: `, reqBookid);
        if (!reqBookid) return Promise.resolve({});
        state.bookTocSectionsXHR = axios.get(`${rootState.API_URL}toc_section/book/${reqBookid}/all`);
        //state.pendingSectionUpdate = true;
        return state.bookTocSectionsXHR
          .then(data => {
            //console.log(data);
            state.bookTocSectionsXHR = null;
            //state.pendingSectionUpdate = false;
            if (reqBookid === rootState.currentBookid) {
              commit('set_book_toc_sections', data.data.sections);
              commit('set_toc_section_book', data.data.book);
            }
            if (!this.bookTocSectionsTimer) {
              this.bookTocSectionsTimer = setInterval(() => {
                if (!state.bookTocSectionsXHR) {
                  dispatch('loadBookTocSections', [])
                    .then(() => {})
                    .catch(err => {});
                }
              }, 30000);
            }
          })
          .catch(err => {
            state.bookTocSectionsXHR = null;
            //state.pendingSectionUpdate = false;
            return Promise.reject(err);
          });
      }
    },
    
    updateBookTocSection({state, dispatch, rootState}, [id, update]) {
      if (rootState.adminOrLibrarian) {
        state.bookTocSectionsXHR = axios.put(`${rootState.API_URL}toc_section/${encodeURIComponent(id)}`, update);
        state.pendingSectionUpdate = true;
        return state.bookTocSectionsXHR.then(updated => {
            state.bookTocSectionsXHR = null;
            state.pendingSectionUpdate = false;
            return dispatch('loadBookTocSections', []);
          })
          .catch(err => {
            state.bookTocSectionsXHR = null;
            state.pendingSectionUpdate = false;
            return Promise.reject(err);
          });
      }
    },

    createBookTocSection({state, dispatch, rootState}, data) {
      if (rootState.adminOrLibrarian) {
        state.bookTocSectionsXHR = axios.post(`${rootState.API_URL}toc_section`, data);
        state.pendingSectionUpdate = true;
        return state.bookTocSectionsXHR
          .then(created => {
            state.bookTocSectionsXHR = null;
            state.pendingSectionUpdate = false;
            return dispatch('loadBookTocSections', []);
          })
          .catch(err => {
            state.bookTocSectionsXHR = null;
            state.pendingSectionUpdate = false;
            return Promise.reject(err);
          });
      }
    },

    removeTocSection({state, dispatch, rootState}, id) {
      state.bookTocSectionsXHR = axios.delete(`${rootState.API_URL}toc_section/${encodeURIComponent(id)}`);
      state.pendingSectionUpdate = true;
      return state.bookTocSectionsXHR.then((response) => {
          state.bookTocSectionsXHR = null;
          state.pendingSectionUpdate = false;
          return dispatch('loadBookTocSections', []);
        })
        .catch(err => {
          state.bookTocSectionsXHR = null;
          state.pendingSectionUpdate = false;
          return Promise.reject(err);
        });
    },

    exportTocSection({state, dispatch, rootState}, id) {
      state.bookTocSectionsXHR = axios.post(`${rootState.API_URL}toc_section/${encodeURIComponent(id)}/export`);
      return state.bookTocSectionsXHR.then(response => {
          state.bookTocSectionsXHR = null;
          return Promise.resolve();
        })
        .catch(err => {
          state.bookTocSectionsXHR = null;
          return Promise.reject(err);
        });
    },

    exportTocSectionBook({state, dispatch, rootState}) {
      if (rootState.currentBookid) {
        state.tocSectionBook.isBuilding = true;
        state.bookTocSectionsXHR = axios.post(`${rootState.API_URL}toc_section/book/${rootState.currentBookid}/export`);
        return state.bookTocSectionsXHR.then(response => {
          state.bookTocSectionsXHR = null;
          return Promise.resolve();
        })
        .catch(err => {
          state.bookTocSectionsXHR = null;
          return Promise.reject(err);
        });
      }
    },
    
    updateTocSectionBook({state, rootState, dispatch, commit}, [id, update]) {
      if (rootState.adminOrLibrarian) {
        state.pendingSectionUpdate = true;
        let updateRequest;
        if (id) {
          updateRequest = axios.put(`${rootState.API_URL}toc_section_book/${encodeURIComponent(id)}`, update);
        } else {
          update.bookid = rootState.currentBookid;
          updateRequest = axios.post(`${rootState.API_URL}toc_section_book`, update)
        }
        return updateRequest
          .then(response => {
            state.pendingSectionUpdate = false;
            if (response.status === 200) {
              commit('set_toc_section_book', response.data);
              dispatch('loadBookTocSections', []);
            }
          })
          .catch(err => {
            state.pendingSectionUpdate = false;
            return Promise.reject(err);
          });
      }
    },
    
    checkUpdatedBlock({dispatch, state}, [blockid]) {
      
      let inToc = state.bookTocSections.find(section => {
        return section.startBlockid === blockid;
      });
      if (inToc) {
        dispatch('loadBookTocSections', []);
      }
    }
  }
}