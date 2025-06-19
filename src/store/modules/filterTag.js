import axios from 'axios';

export default {
  namespaced: true,
  state: {
    filter_tags: []
  },
  getters: {
    filter_tags: state => {
      return state.filter_tags;
    },
    notAssignedFilterTags: (state, getters, rootState) => {
      if (rootState.currentBookMeta) {
        if (!rootState.currentBookMeta.filter_tags) {
          return state.filter_tags;
        }
        return state.filter_tags.filter(tag => {
          return !rootState.currentBookMeta.filter_tags.includes(tag.name);
        });
      }
      return state.filter_tags;
    }
  },
  mutations: {
    set_filter_tags(state, tags) {
      state.filter_tags = tags;
    }
  },
  actions: {
    loadFilterTags({state, dispatch, commit, rootState}) {
      
      return axios.get(`${rootState.API_URL}filter_tag/all`)
        .then(data => {
          commit('set_filter_tags', data.data);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
  }
}