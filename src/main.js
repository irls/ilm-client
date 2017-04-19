import Vue from 'vue'
import App from './App'
import router from './router'
import { store } from './store'
import { sync } from 'vuex-router-sync'
import VueResource from 'vue-resource'
import * as directives from './directives'
import superlogin from 'superlogin-client'
import PouchDB from 'pouchdb'
import hoodieApi from 'pouchdb-hoodie-api'

sync(store, router)
// register global directives.
Object.keys(directives).forEach(key => {
  Vue.directive(key, directives[key])
})

/* eslint-disable */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
  created: function() {

    
  }
})

Vue.use(VueResource);
