<template>
  <div id="app">
    <MainMenu v-if="$store.state.isLoggedIn"></MainMenu>
    <router-view v-if="$store.state.isLoggedIn"></router-view>
    <Login v-if="!$store.state.isLoggedIn"></Login>
  </div>
</template>



<script>
import MainMenu from './components/MainMenu'
import Login from "./components/login"

export default {
  name: 'app',
  components: {
    MainMenu, Login
  },
  methods: {
    setCurrentBookid: function(bookid) {
      this.$store.commit('setCurrentBook', bookid)
    }
  },
  watch: {
    '$route' () {
      //console.log(this.$route)
      if (this.$route.params.hasOwnProperty('bookid'))
        this.setCurrentBookid(this.$route.params.bookid)
    }
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
