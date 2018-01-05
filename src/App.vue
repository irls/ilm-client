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
      if (this.$route.params.hasOwnProperty('libraryid')) {
        this.loadLibrary(this.$route.params.libraryid);
      } else {
        this.loadLibrary(false);
      }
    }
  },

  created () {

  },

  methods: {
    ...mapActions(['loadBook', 'updateBooksList', 'loadCollection', 'loadLibrary'])
  }
}
</script>
