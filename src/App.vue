<template>
  <div id="app">
    <MainMenu v-if="$store.state.isLoggedIn"></MainMenu>
    <router-view v-if="$store.state.isLoggedIn"></router-view>
    <Login v-if="!$store.state.isLoggedIn"></Login>
    <!-- <CanvasAbsolute/> -->
  </div>
</template>



<script>
import MainMenu from './components/MainMenu'
import Login from "./components/login"

export default {
  name: 'app',
  components: {
    MainMenu, Login
    // , CanvasAbsolute
  },
  methods: {
    // loadBook: function(bookid) {
    //   this.$store.dispatch('loadBook', bookid)
    // }
  },
  watch: {
    '$route' () {
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.$store.dispatch('loadBook', this.$route.params.bookid)
        this.$events.emit('SET_CURRENTBOOK_EVENT')
      }

    }
  },
  created: function() {
    // initiate books list
    this.$store.dispatch('updateBooksList')
  }
}
</script>



<style>
  /*#app {width: 98%; margin-left: 1%; margin-right: 1%}*/
  html {
      overflow: scroll;
      overflow-x: hidden;
      min-width: 769px;

  }
  ::-webkit-scrollbar {
      width: 0px;  /* remove scrollbar space */
      background: transparent;  /* optional: just make scrollbar invisible */
  }
  /* optional: show position indicator in red */
  ::-webkit-scrollbar-thumb {
      background: #FF0000;
  }
  body {
    background-color: white;
    padding: 5px !important;
  }
</style>
