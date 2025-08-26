import axios from "axios";
import lodash from "lodash";

export default {
  namespaced: true,
  state: {},
  getters: {},
  mutations: {},
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
    }
  }
}
