import Vue from 'vue'
import App from './App'
import router from './router'
import { store } from './store'
import { sync } from 'vuex-router-sync'
import VueResource from 'vue-resource'
import * as directives from './directives'
//import jQuery from 'jquery'
//import 'expose-loader?jquery!jquery'

import $ from 'jquery';

// for debugging
if (process.env.NODE_ENV === 'development') Vue.config.debug = true

// sync the router with the vuex store.
// this registers `store.state.route`
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
})

Vue.use(VueResource);
