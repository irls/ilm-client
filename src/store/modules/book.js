import axios from "axios";

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
    }
  }
}
