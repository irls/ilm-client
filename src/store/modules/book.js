import axios from "axios";
import lodash from "lodash";

export default {
  namespaced: true,
  state: {
    collectionBooksLoading: false
  },
  getters: {
    collectionBooksLoading: state => {
      return state.collectionBooksLoading;
    }
  },
  mutations: {
    set_collectionBooksLoading(state, loading) {
      state.collectionBooksLoading = loading;
    }
  },
  actions: {
    createCopy({rootState, dispatch}, [bookid, tobookid]) {
      return axios.post(`${rootState.API_URL}books/${bookid}/copy/${tobookid}`)
        .then(response => {
          //return Promise.all([
            //dispatch('loadBook', tobookid, {root: true})
          //])
            //.then(() => {
              return response.data;
            //});
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    getCopyBookid({rootState}, [bookid]) {
      return axios.get(`${rootState.API_URL}books/${bookid}/copy_id`)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    getUniqBookId({state, rootState}, { title, language, author = null, parentId = null } = {}, ) {
      const reqParams = { title, language, author };
      if (title.length == 0) {
        return Promise.resolve({});
      }
      if (parentId && parentId.length) {
        reqParams.parentId = parentId;
      }
      return axios.post(`${rootState.API_URL}books/uniqBookId`, reqParams)
      .then(response => {
        return response.data;
      })
      .catch(err => {
        return Promise.reject(err);
      })
    },

    rewrite({rootState, dispatch}, request = {}) {
      let postRequest = lodash.cloneDeep(request);
      if (rootState.blockSelection.start._id && rootState.blockSelection.end._id) {
        postRequest.start_id = rootState.blockSelection.start._id;
        postRequest.end_id = rootState.blockSelection.end._id;
      }
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/rewrite`, postRequest)
        .then(response => {
          return dispatch('getProcessQueue', {}, { root: true });
            //dispatch('setCurrentBookCounters')
        });
    },

    revert({rootState, dispatch}) {
      let request = {};
      if (rootState.blockSelection.start._id && rootState.blockSelection.end._id) {
        request.start_id = rootState.blockSelection.start._id;
        request.end_id = rootState.blockSelection.end._id;
      }
      return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/revert`, request)
        .then(response => {
          return dispatch('getProcessQueue', {}, { root: true });
            //dispatch('setCurrentBookCounters')
        });
    },

    getTextBlocks({rootState}) {
      let url = `${rootState.API_URL}books/${rootState.currentBookid}/text_blocks`;
      if (rootState.blockSelection.start._id && rootState.blockSelection.end._id) {
        url+= `?start_id=${rootState.blockSelection.start._id}`;
        url+= `&end_id=${rootState.blockSelection.end._id}`;
      }
      return axios.get(url)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    getRewritedBlocks({rootState}) {
      let url = `${rootState.API_URL}books/${rootState.currentBookid}/rewrited_blocks`;
      if (rootState.blockSelection.start._id && rootState.blockSelection.end._id) {
        url+= `?start_id=${rootState.blockSelection.start._id}`;
        url+= `&end_id=${rootState.blockSelection.end._id}`;
      }
      return axios.get(url)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    filterBooks({rootState, dispatch}, {filter = '', secFilter = '', language = [], importStatus = [], jobStatus = [], page = 0, collection_id = null, onPage = 100, sort = {field: 'title', dir: 'asc'}}) {
      let booksFilter = [];
      if (filter) {
        booksFilter.push(`filter[][title]=${filter}`);
      }
      if (secFilter) {
        booksFilter.push(`filter[][hashTags]=${secFilter}`);
      }
      if (Array.isArray(language) && language.length > 0) {
        booksFilter.push(`filter[][language]=${language}`);
      }
      if (Array.isArray(importStatus) && importStatus.length > 0) {
        booksFilter.push(`filter[][importStatus]=${importStatus}`);
      }
      if (Array.isArray(jobStatus) && jobStatus.length > 0) {
        booksFilter.push(`filter[][jobStatus]=${jobStatus}`);
      }
      if (collection_id) {
        booksFilter.push(`filter[][collection_id]=${collection_id}`);
      }
      booksFilter.push(`sort=${JSON.stringify(sort)}`);
      booksFilter.push(`page=${page}`);
      booksFilter.push(`onpage=${onPage}`);
      return axios.get(`${rootState.API_URL}books?${booksFilter.join('&')}`)
        .then(response => {
          return response.data;
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    loadCurrentCollectionBooks({rootState, dispatch, commit}, params) {
      if (rootState.currentCollection && rootState.currentCollection._id) {
        commit('set_collectionBooksLoading', true);
        return dispatch('filterBooks', Object.assign(lodash.cloneDeep(params), { collection_id: rootState.currentCollection._id }))
          .then(response => {
            rootState.currentCollection.books_list = response.books;
            commit('set_currentCollectionPagination', response.pagination, { root: true });
            rootState.currentCollection.books_list.forEach(b => {
              b.pub_ver = b.publishedVersion && b.publishedVersion !== 'false' ? b.publishedVersion : '';
              b.cur_ver = typeof b.version !== 'undefined' && b.version !== b.publishedVersion ? b.version || '1.0' : (b.publishedVersion ? '' : '1.0');

              if (b.hasOwnProperty('publishLog') && b.publishLog != null && b.publishLog != false && b.publishLog != undefined){
                if (b.publishLog.publishTime != false && b.publishLog.publishTime != undefined){
                  var pDate = new Date(b.publishLog.publishTime);
                  var publishDate = '' + pDate.getFullYear() + '.' + ('0' + (pDate.getMonth() + 1)).slice(-2) + '.' + ('0' + (pDate.getDate() )).slice(-2);
                } else {
                  var publishDate = '';
                }

                if (b.publishLog.updateTime != false && b.publishLog.updateTime != undefined){
                  var uDate = new Date(b.publishLog.updateTime);
                  var updateDate = '' + uDate.getFullYear() + '.' + ('0' + (uDate.getMonth() + 1)).slice(-2) + '.' + ('0' + (uDate.getDate() )).slice(-2);
                } else {
                  var updateDate = '';
                }

                if (b.publishedVersion && b.publishedVersion == b.version){
                  updateDate = '';
                }

                if (b.pub_ver){
                    b.pub_ver = publishDate + ' v. ' + b.pub_ver;
                } else {
                      b.pub_ver = publishDate;
                }
                if (b.cur_ver){
                    b.cur_ver = updateDate + ' v. ' + b.cur_ver;
                } else {
                    b.cur_ver = updateDate;
                }
              } else {
                if (b.pub_ver){
                    b.pub_ver = ' v. ' + b.pub_ver;
                }
                if (b.cur_ver){
                    b.cur_ver = ' v. ' + b.cur_ver;
                }
              }
              if (b.importStatus == 'staging' && b.blocksCount <= 2){
                if (!b.hasOwnProperty('publishLog') || b.publishLog == null){
                  b.importStatus = 'staging_empty'
                } else if (!b.publishLog.updateTime){
                  b.importStatus = 'staging_empty'
                }
              }
            });
            commit('set_collectionBooksLoading', false);
            return response.books;
          });
      }
      return Promise.resolve();
    },

    loadBooksFilters({rootState, commit}) {
      return axios.get(`${rootState.API_URL}books_filters`)
        .then(response => {
          commit('gridFilters/set_jobStatusFilterList', response.data.jobStatuses, { root: true });
          commit('gridFilters/set_importStatusFilterList', response.data.importStatuses, { root: true });
          commit('gridFilters/set_languageFilterList', response.data.languages, { root: true });
        });
    }
  }
}
