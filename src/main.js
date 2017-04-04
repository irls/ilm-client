import Vue from 'vue'
import App from './App'
import router from './router'
import { store } from './store'
import { sync } from 'vuex-router-sync'
import VueResource from 'vue-resource'

sync(store, router)


/* eslint-disable */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
  created: function() {
    this.$store.dispatch('initiateBooks')
    //this.$store.dispatch('ilmAuth')
  }
})

Vue.use(VueResource);
