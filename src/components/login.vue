<template>
  <div>
  <div class="user-modal-container active">
    <div class="user-modal">

      <!-- Login Form -->
      <div class="form-login" :class="{ 'active': active == 'login' }" id="form-login">
        <h3 class='title'>Login</h3>
        <div class="error-message" v-text="loginError"></div>
        <input type="text" name="user" placeholder="Email or Username" v-model="loginUser">
        <input type="password" name="password" placeholder="Password" v-model="loginPassword"
          @keyup="keycheck"
        >
        <input type="submit" :class="{ 'disabled': !(loginUser && loginPassword) }" @click="user_login" value="Login" />
        <div class="links"> <a @click="active = 'password'">Forgot your password?  <i class="fa fa-arrow-right"></i></a></div>
      </div>

      <!-- Password Reset Request -->
      <div class="form-password" :class="{ 'active': active == 'password' }">
        <h3 class='title'>Request Forgot Password Link</h3>
        <div class="error-message" v-text="passwordError"></div>
        <input type="text" name="email" placeholder="Email" v-model="passwordEmail">
        <input type="submit" :class="{'disabled': !passwordEmail}" @click="user_passwordreset(passwordEmail)" value='Email Login Link'>
        <div class="links"><a @click="active = 'login'"> <i class="fa fa-arrow-left"></i> Back to Login</a></div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
  import superlogin from 'superlogin-client'
  import Vuex from 'vuex'
  import axios from 'axios'
  import hoodie from 'pouchdb-hoodie-api'
  import PouchDB from 'pouchdb'
  PouchDB.plugin(hoodie)

  export default {
    data () {
      return {
        active: 'login',
        auth: this.$store.state.auth,

        // Modal text fields
        loginUser: '',
        loginPassword: '',
        passwordEmail: '',

        // Modal error messages
        loginError: '',
        passwordError: '',
      }
    },
    methods: {
      user_login: function() {
        if (!(this.loginUser && this.loginPassword)) {
          this.loginError = 'Both Password and Username are required'
          return
        }
        var vu_this = this;
        this.auth.login({username: this.loginUser, password: this.loginPassword}).catch(function(error){
          vu_this.loginError = error.message;
        })
      },
      user_passwordreset: function(email) {
        this.auth.forgotPassword(email)
        alert("A login link has been sent by email to: "+ email)
        this.active = 'login'
      },
      keycheck: function(event) {
        if (event.key == "Enter") this.user_login()
      }

    },
    created: function() {
      this.$store.state.process = process;
      var vu_this = this
      var auth = this.auth
      var ilm_library_meta = new PouchDB('ilm_library_meta')
      this.$store.state.ilm_library_meta = ilm_library_meta

      auth.configure({
        // An optional URL to API server, by default a current window location is used.
        // serverUrl: 'http://localhost:3000',
        serverUrl: process.env.ILM_API,
        // A list of API endpoints to automatically add the Authorization header to
        endpoints: [process.env.ILM_DB], // local couch db and cloudant
        // The authentication providers that are supported by your SuperLogin host
        providers: [],
        // Sets when to check if the session is expired during the setup. // false by default.
        checkExpired: true,
      })

      // login event
      auth.on('login', function(session) {
        if (session.password) {
          //console.log("Login successful, session: ", session)
          vu_this.$store.state.currentUser = session
          vu_this.$store.state.isLoggedIn = true
        }
        //console.log(auth.getDbUrl('ilm_library_meta'))
        PouchDB.sync('ilm_library_meta', auth.getDbUrl('ilm_library_meta'), {live:true})
          .on('change', function(change) {
            console.log(change)
          })

        // // get initial list of book
        var api = ilm_library_meta.hoodieApi()
        api.findAll(item => item.type==='book_meta').then(function(books_meta){
          vu_this.$store.state.books_meta = books_meta 
          console.log("Books loaded: "+ books_meta.length)
        })


      })
      // logout event
      auth.on('logout', function(message) {
        //console.log("Logout: ", message)
        vu_this.$store.state.currentUser = {};
        vu_this.$store.state.isLoggedIn = false;
      })

      //
      // window.setInterval(function(){
      //   // verify user is logged in every 30 seconds
      //   auth.refresh()
      //   auth.checkExpired()
      // }, 60000);




    }
  }
</script>


<style scoped>
.user-modal-container * {
  box-sizing: border-box;
}

.user-modal-container {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  visibility: hidden;
  cursor: pointer;
  overflow-y: auto;
  z-index: 3;
  font-family: 'Lato', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif';
  font-size: 14px;
  background-color: rgba(17, 17, 17, .9);
  -webkit-transition: all 0.25s linear;
  -moz-transition: all 0.25s linear;
  -o-transition: all 0.25s linear;
  -ms-transition: all 0.25s linear;
  transition: all 0.25s linear;
}

.user-modal-container.active {
  opacity: 1;
  visibility: visible;
}

.user-modal-container .user-modal {
  position: relative;
  margin: 50px auto;
  width: 90%;
  max-width: 500px;
  background-color: #f6f6f6;
  cursor: initial;
}

.user-modal-container .form-login,
.user-modal-container .form-register,
.user-modal-container .form-password {
  padding: 5px 25px 25px;
  display: none;
}

.user-modal-container .form-login.active,
.user-modal-container .form-register.active,
.user-modal-container .form-password.active {
  display: block;
}

.user-modal-container ul.form-switcher {
  margin: 0;
  padding: 0;
}

.user-modal-container ul.form-switcher li {
  list-style: none;
  display: inline-block;
  width: 50%;
  float: left;
  margin: 0;
}

.user-modal-container ul.form-switcher li a {
  width: 100%;
  display: block;
  height: 50px;
  line-height: 50px;
  color: #666666;
  background-color: #dddddd;
  text-align: center;
}

.user-modal-container ul.form-switcher li a.active {
  color: #000000;
  background-color: #f6f6f6;
}

.user-modal-container input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #eeeeee;
}

.user-modal-container input[type="submit"] {
  color: #f6f6f6;
  border: 0;
  margin-bottom: 0;
  background-color: #3fb67b;
  cursor: pointer;
}

.user-modal-container input[type="submit"]:hover {
  background-color: #3aa771;
}

.user-modal-container input[type="submit"]:active {
  background-color: #379d6b;
}

.user-modal-container .links {
  text-align: center;
  padding-top: 25px;
}

.user-modal-container .links a {
  color: #3fb67b; cursor: pointer;
}

.user-modal-container input[type="submit"].disabled {
  background-color: #98d6b7;
}

a.switchlink {cursor: pointer;}
a.switchlink.active {cursor: default;}
a.switchlink.active:hover {text-decoration: none;}

.error-message {color: red; margin: .5em;
  border-radius: 5px;
  text-shadow: -1px -1px 10px rgba(255, 255, 0, 1);
}

.title {margin-bottom: 1em; margin-top:.75em;}

</style>
