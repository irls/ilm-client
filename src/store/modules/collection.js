import axios from "axios";
import lodash from "lodash";

export default {
  namespaced: true,
  state: {
    allCollections: []
  },
  getters: {
    allCollections: state => {
      return state.allCollections;
    }
  },
  mutations: {
    set_allCollections(state, list) {
      state.allCollections = list;
    }
  },
  actions: {

    filterCollections({rootState}, {filter = "", language = [], page = 0, onPage = 100, sort = {field: 'title', dir: 'asc'}}) {
      let collectionsFilter = [];
      if (filter) {
        collectionsFilter.push(`filter[][title]=${filter}`);
      }
      if (Array.isArray(language) && language.length > 0) {
        collectionsFilter.push(`filter[][language]=${language}`);
      }
      collectionsFilter.push(`sort=${JSON.stringify(sort)}`);
      collectionsFilter.push(`page=${page}`);
      collectionsFilter.push(`onpage=${onPage}`);
      return axios.get(`${rootState.API_URL}collection?${collectionsFilter.join('&')}`)
        .then(response => {
          return response.data;
        });
    },

    loadAllCollections({dispatch, commit}) {
      return dispatch('filterCollections', {page: null, onPage: null})
        .then(response => {
          commit('set_allCollections', response.collections.reduce((acc, curr) => {
            acc.push({_id: curr._id, title: curr.title, language: curr.language});
            return acc;
          }, []));
        });
    }
  }
}
