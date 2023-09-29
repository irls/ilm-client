import superlogin from 'superlogin-client';
import axios from 'axios';
import lodash from 'lodash';
const store = require('../index');

let actionsInstance;

let sessionInterval = null;
superlogin.configure({
  serverUrl: process.env.ILM_API,
  endpoints: [process.env.ILM_DB],
  providers: [],
  checkExpired: true
})

superlogin.removeAllListeners('login');
// login event
superlogin.once('login', (session) => {
  if (session && session.expires) {
    if (sessionInterval) {
      clearInterval(sessionInterval);
    }
    let interval = (session.expires - Date.now()) / 2;
    if ((session.expires - Date.now()) / 2 < 0 || interval < 30000) {
      superlogin.refresh();
    }
    if (interval < 30000) {
      interval = 30000;
    }
    if (interval > 1000 * 60 * 60 * 3) {// 3 hours
      interval = 1000 * 60 * 60 * 3;
    }
    sessionInterval = setInterval(() => {
      //console.log(session.token, session.password)
      //console.log(this.$store.state.auth.getSession())
      superlogin.refresh()
        .then(() => {})
        .catch(err => {
          superlogin.logout()
            .then(() => {
              location.href = '/';
            })
            .catch(() => {
              location.href = '/';
            });
        });
    }, interval);
    //console.log('SET INTERVAL TO', interval)
  }
  if (session.token) {
    //console.log(session.token, session.password, session)
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + session.token + ':' + session.password;
    store.store.dispatch('connectDB');
  }
});

// logout event
superlogin.on('logout', (message) => {
  //console.log('logout?');
  if (sessionInterval) {
    clearInterval(sessionInterval);
  }
  store.store.dispatch('disconnectDB');
  location.href = '/';
})

const alignWpmSettingsDefaults = {
  tts: {
    type: 'custom',
    wpm: 140
  },
  audio_file: {
    type: 'original',
    wpm: 0
  }
}

export default {
  namespaced: true,
  state: {},
  getters: {
    userAlignWpmSettings: (state, getters, rootState) => (voicework) => {
      let settings = rootState.user.alignWpmSettings || {};
      settings = settings[rootState.currentBookid] || {};
      if (settings[voicework]) {
        //if (settings[voicework].wpm === 0) {// zero means assigned original
          //delete settings[voicework].wpm;
        //}
        return lodash.assign(lodash.cloneDeep(alignWpmSettingsDefaults[voicework]), lodash.cloneDeep(settings[voicework]));
      }
      return lodash.cloneDeep(alignWpmSettingsDefaults[voicework]);
    }
  },
  mutations: {},
  actions: {
  
    user_passwordreset({rootState}, email) {
      if (email) {
        return axios.post(`${rootState.API_URL}new-password`, {email: email})
          .then((response) => {
            if (response.data.ok === true) {

            } else {
            }
            return Promise.resolve(response.data);
          })
          .catch((e) => {
            return Promise.reject(e);
          });
      } else {
        return Promise.reject(new Error('Email is not defined'));
      }
    },

    user_login({dispatch}, [login, password]) {

      return dispatch('destroyDB', [], {root: true})
      .then(()=>{
        return superlogin.login({
          username: login.trim().toLowerCase(),
          password: password
        })
        .catch(error => {
          return Promise.reject(error);
        });
      })
    },

    createUser({rootState}, newUser) {
      return axios.post(`${rootState.API_URL}users`, newUser)
        .then((response) => {
          if (response.status === 200) {
            return Promise.resolve();
          } else {
            return Promise.reject(response.validationErrors);
          }
        })
        .catch((error) => {
          if (error.response && error.response.data) {
            return Promise.reject(error.response.data.validationErrors);
          } else {
            return Promise.reject('Failed');
          }
        });
    },

    updateUser({rootState, commit}, [user_id, data]) {
      return axios.patch(`${rootState.API_URL}users/${user_id}`, data)
        .then((response) => {
          if (response.status === 200) {
            if (user_id === rootState.user._id) {
              commit('set_user', response.data, {root: true});
            }
            return Promise.resolve();
          } else {
            return Promise.reject(response.validationErrors);
          }
        })
        .catch((error) => {
          if (error.response && error.response.data) {
            return Promise.reject(error.response.data.validationErrors);
          } else {
            return Promise.reject('Failed');
          }
        });
    },

    getAll({rootState}) {
      return axios.get(`${rootState.API_URL}users`)
        .then(response => {
          return Promise.resolve(response.data);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
  }
}