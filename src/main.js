import Vue from 'vue'
import App from './App'
import router from './router'
import { store } from './store'
import { sync } from 'vuex-router-sync'

sync(store, router)


/* eslint-disable */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
  created: function() {
    this.$store.dispatch('initiateBooks')
  }
})
