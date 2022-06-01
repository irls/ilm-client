import superlogin from 'superlogin-client';
import axios from 'axios';
const store = require('./index');

let actionsInstance;

class userActions {
  constructor() {
    this.API_URL = process.env.ILM_API + '/api/v1/';
    this.sessionInterval = null;
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
        if (this.sessionInterval) {
          clearInterval(this.sessionInterval);
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
        this.sessionInterval = setInterval(() => {
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
      if (this.sessionInterval) {
        clearInterval(this.sessionInterval);
      }
      store.store.dispatch('disconnectDB');
      location.href = '/';
    })
  }
  
  user_passwordreset(email) {
    if (email) {
      return axios.post(`${this.API_URL}new-password`, {email: email})
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
  }
  
  user_login(login, password) {

    return store.store.dispatch('destroyDB')
    .then(()=>{
      return superlogin.login({
        username: login.trim().toLowerCase(),
        password: password
      })
      .catch(error => {
        return Promise.reject(error);
      });
    })
  }
  
  create(newUser) {
    return axios.post(`${this.API_URL}users`, newUser)
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
  }
  
  update(user_id, data) {
    return axios.patch(`${this.API_URL}users/${user_id}`, data)
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
  }
  
  getAll() {
    return axios.get(`${this.API_URL}users`)
      .then(response => {
        return Promise.resolve(response.data);
      })
      .catch(err => {
        return Promise.reject(err);
      });
  }
}

module.exports = () => {
  return actionsInstance || (actionsInstance = new userActions());
}