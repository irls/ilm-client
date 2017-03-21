<template>
  <div>
    <h1>{{ msg }}</h1>
  </div>
</template>




<script>
import superlogin from 'superlogin-client'


export default {
  data () {
    return {
      msg: 'Users'
    }
  },
  methods: {
    login: function() {

      //this.msg = 'got here!'

      //console.log('ILM server auth');
      var config = {
        // An optional URL to API server, by default a current window location is used.
        serverUrl: 'http://localhost:3000',
        // The base URL for the SuperLogin routes with leading and trailing slashes (defaults to '/auth/')
        baseUrl: '/auth/',
        // A list of API endpoints to automatically add the Authorization header to
        // By default the host the browser is pointed to will be added automatically
        endpoints: ['127.0.0.1:5986', 'ilm.cloudant.com'], // local couch db and cloudant
        // Set this to true if you do not want the URL bar host automatically added to the list
        noDefaultEndpoint: false,
        // Where to save your session token: localStorage ('local') or sessionStorage ('session'), default: 'local'
        storage: 'local',
        // The authentication providers that are supported by your SuperLogin host
        providers: [],
        // Sets when to check if the session is expired during the setup.
        // false by default.
        checkExpired: true,
        // A float that determines the percentage of a session duration, after which SuperLogin will automatically refresh the
        // token. For example if a token was issued at 1pm and expires at 2pm, and the threshold is 0.5, the token will
        // automatically refresh after 1:30pm. When authenticated, the token expiration is automatically checked on every
        // request. You can do this manually by calling superlogin.checkRefresh(). Default: 0.5
        refreshThreshold: 0.5
      }


      //this.msg = 'and here!'
      superlogin.on('login', function(session) {
        //context.commit('setloginSession', session)
        this.msg = "hello login"
      }, function(error){
        this.msg = error
      })

      superlogin.configure(config)

      let credentials = {
        username: 'chad',
        password: 'vanilla'
      }
      superlogin.login(credentials).then(function(result, err){
        if (result) this.msg = result
        else this.msg = err
      })


    }

  },
  created: function() {

    this.login()
    //this.msg = "what the heck?"


  }
}
</script>


<style scoped>
</style>
