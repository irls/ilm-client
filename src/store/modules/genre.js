import axios from 'axios';

export default {
  namespaced: true,
  state: {
    genres: [],
    autoGenerateInProgress: false
  },
  getters: {
    genres: state => {
      return state.genres;
    },
    notAssignedGenres: (state, getters, rootState) => {
      if (rootState.currentBookMeta) {
        if (!rootState.currentBookMeta.genres) {
          return state.genres;
        }
        return state.genres.filter(genre => {
          return !rootState.currentBookMeta.genres.includes(genre.name);
        });
      }
      return state.genres;
    },
    autoGenerateInProgress: state => {
      return state.autoGenerateInProgress;
    }
  },
  mutations: {
    set_genres(state, genres) {
      state.genres = genres;
    },
    set_autoGenerateInProgress(state, inProgress) {
      state.autoGenerateInProgress = inProgress;
    }
  },
  actions: {
    loadGenres({state, dispatch, commit, rootState}, [ bookid = null, exclude_ids = [] ]) {
      
      let url = !bookid ? `${rootState.API_URL}genre` : `${rootState.API_URL}genre?bookid=${bookid}&exclude_ids=${exclude_ids}`;

      return axios.get(url)
        .then(data => {
          commit('set_genres', data.data);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    loadBookGenres({dispatch, rootState}) {
      return dispatch('loadGenres', [ rootState.currentBookid ]);
    },
    
    autoGenerate({state, rootState, dispatch, commit}) {
      if (rootState.currentBookid) {
        return axios.post(`${rootState.API_URL}books/${rootState.currentBookid}/auto_generate_genres`)
          .then(response => {
            rootState.currentBookMeta.genres = response.data.genres;
            rootState.currentBookMeta.version = response.data.version;
            rootState.currentBookMeta.pubType = response.data.pubType;
            rootState.currentBookMeta.published = response.data.published;
            commit('CHECK_SET_ALLOW_BOOK_PUBLISH', null, {root: true});
            commit('CHECK_SET_BOOK_PUBLISH_BUTTON_STATUS', null, {root: true});
            return response.data;
          });
      }
    }
  }
}