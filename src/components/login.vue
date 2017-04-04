<template>
  <div>
  <div class="user-modal-container active">
    <div class="user-modal">

      <!-- Login Form -->
      <div class="form-login" :class="{ 'active': active == 'login' }" id="form-login">
        <h3 class='title'>Login</h3>
        <div class="error-message" v-text="loginError"></div>
        <input type="text" name="user" placeholder="Email or Username" v-model="loginUser">
        <input type="password" name="password" placeholder="Password" v-model="loginPassword">
        <input type="submit" :class="{ 'disabled': !(loginUser && loginPassword) }" @click="user_login(loginUser, loginPassword)" value="Login" />
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
      user_login: function(username, password) {
        if (!(username && password)) {
          this.loginError = 'Both Password and Username are required'
          return
        }
        var vu_this = this;
        this.auth.login({username, password}).catch(function(error){
          vu_this.loginError = error.message;
        })
      },
      user_passwordreset: function(email) {
        this.auth.forgotPassword(email)
        alert("A login link has been sent by email to: "+ email)
        this.active = 'login'
      }

    },
    created: function() {
      // console.log("Setting up authentication object")

      this.auth.configure({
        // An optional URL to API server, by default a current window location is used.
        serverUrl: 'http://localhost:3000',
        // A list of API endpoints to automatically add the Authorization header to
        endpoints: ['localhost:5984', 'ilm.cloudant.com'], // local couch db and cloudant
        // The authentication providers that are supported by your SuperLogin host
        providers: [],
        // Sets when to check if the session is expired during the setup. // false by default.
        checkExpired: true,
      })

      var vu_this = this
      // login event
      this.auth.on('login', function(session) {
        if (session.password) {
          //console.log("Login successful, session: ", session)
          vu_this.$store.state.currentUser = session;
          vu_this.$store.state.isLoggedIn = true;
        }
      }, function(error){  })
      // logout event
      this.auth.on('logout', function(message) {
        //console.log("Logout: ", message)
        vu_this.$store.state.currentUser = {};
        vu_this.$store.state.isLoggedIn = false;
      }, function(error){  })

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
