<template>
  <div id="app">
    <MainMenu v-if="isLoggedIn"></MainMenu>
    <router-view v-if="isLoggedIn"></router-view>
    <Login v-if="!isLoggedIn"></Login>
    <!-- <CanvasAbsolute/> -->
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import MainMenu from './components/MainMenu'
import Login from './components/login'

export default {

  name: 'App',

  components: {
    MainMenu, Login
    // , CanvasAbsolute
  },

  computed: {
      ...mapGetters(['isLoggedIn']),
  },

  watch: {
    '$route' () {
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.loadBook(this.$route.params.bookid)
      } else {
        this.loadBook(false);
      }
      if (this.$route.params.hasOwnProperty('collectionid')) {
        this.loadCollection(this.$route.params.collectionid);
      } else {
        this.loadCollection(false);
      }
    }
  },

  created () {

  },

  methods: {
    ...mapActions(['loadBook', 'updateBooksList', 'loadCollection'])
  }
}
</script>

<style lang="stylus">
/*#app {width: 98%; margin-left: 1%; margin-right: 1%}*/
html
  overflow: scroll;
  overflow-x: hidden;
  min-width: 769px;
::-webkit-scrollbar
    width: 0px;  /* remove scrollbar space */
    background: transparent;  /* optional: just make scrollbar invisible */
/* optional: show position indicator in red */
::-webkit-scrollbar-thumb
    background: #FF0000;
body
  background-color: white;
  padding: 5px !important;
</style>
