import axios from 'axios';

export default {
  namespaced: true,
  state: {},
  getters: {},
  mutations: {},
  actions: {
    getByBlockid({state, rootState}, [blockid]) {
      return axios.get(`${rootState.API_URL}tasks/book/${rootState.currentBookid}/block/${blockid}`)
        .then(response => {
          if (Array.isArray(response.data)) {
            response.data.forEach(task => {
              if (!rootState.tc_tasksByBlock[blockid] || rootState.tc_tasksByBlock[blockid].id !== task.id) {
                rootState.tc_tasksByBlock[blockid] = task;
              }
              if (rootState.user && rootState.user._id === task.executor) {
                let _task = rootState.tc_currentBookTasks.tasks.find(t => {
                  return t.id === task.id;
                });
                if (!_task) {
                  rootState.tc_currentBookTasks.tasks.push(task);
                }
              }
              //console.log(rootState.tc_tasksByBlock);
              //console.log(rootState.tc_userTasks)
            });
          }
        })
        .catch(err => {
          return Promise.reject(err);
        })
    },
    getUniqBookId({state, rootState}, { title, language, author = null } = {}) {
      const reqParams = { title, language, author };
      if (title.length == 0) {
        return Promise.resolve({});
      }
      return axios.post(`${rootState.API_URL}task/uniqBookId`, reqParams)
      .then(response => {
        return response.data;
      })
      .catch(err => {
        return Promise.reject(err);
      })
  }
  }
}
