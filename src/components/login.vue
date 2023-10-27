<template>
<div>
  <div class="user-modal-container active">
    <div class="user-modal">

      <!-- Login Form -->
      <div class="form-login" :class="{ 'active': active == 'login' }" id="form-login">
        <h3 class='title'>Login</h3>
        <input type="text" name="user" placeholder="Email or Username" v-model="loginUser"
          @keyup="keycheck"
        />
        <input type="password" name="password" placeholder="Password" v-model="loginPassword"
          @keyup="keycheck"
        />
        <div class="error-message" v-text="loginError"></div>
        <input type="submit" :class="{ 'disabled': this.loginTimer }" @click="login" value="Login" />
        <div class="links"> <a @click="setActive('password')">Forgot your password?  <i class="fa fa-arrow-right"></i></a></div>
      </div>

      <!-- Password Reset Request -->
      <div class="form-password" :class="{ 'active': active == 'password' }">
        <h3 class='title'>Reset password</h3>
        <div class="error-message" v-text="passwordError"></div>
        <input type="text" name="email" placeholder="Email" v-model="passwordEmail" v-on:input="clearPasswordMessage()">
        <div class="error-message" v-text="passwordResetError"></div>
        <div class="success-message" v-text="passwordResetSuccess"></div>
        <input type="submit"
               :class="{'disabled': !passwordEmail || passwordResetSuccess.length > 0}"
               :disabled="passwordResetSuccess.length > 0"
          @click="passwordreset(passwordEmail)"
          value='Send new password'>
        <div class="links">
          <a @click="setActive('login')">
            <i class="fa fa-arrow-left"></i> Back to Login
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { mapActions } from 'vuex';
import superlogin from 'superlogin-client';
import axios from 'axios';

export default {

  data () {
    return {
      active: 'login',

      // Modal text fields
      loginUser: '',
      loginPassword: '',
      passwordEmail: '',

      // Modal error messages
      loginError: '',
      loginTimer: null,
      passwordError: '',
      passwordResetError: '',
      passwordResetSuccess: '',
      //loginLogout: new userActions()
    }
  },

  components: {
  },

  created () {
  },

  methods: {
    ...mapActions('userActions', [
      'user_login', 'user_passwordreset'
    ]),

    login () {
      if (!(this.loginUser && this.loginPassword)) {
        this.loginError = 'Define both password and email or username';
        return;
      }

      if (this.loginTimer) {
        return;
      }

      this.user_login([this.loginUser, this.loginPassword])
        .then(()=>{
          return Promise.resolve();
        })
        .catch(error => {
          if (error.timer) {

            let lockTime = error.timer;
            this.loginError = this.getLoginTimeCaption(lockTime);

            this.loginTimer = setInterval(()=>{
              lockTime -= 1000;
              this.loginError = this.getLoginTimeCaption(lockTime);
              if (lockTime <= 0) {
                clearInterval(this.loginTimer);
                this.loginTimer = null;
                this.loginError = '';
              }
            }, 1000);

          } else {
            this.loginError = error.message;
          }
        });

    },

    passwordreset (email) {
      this.passwordResetError = '';
      if (email.length === 0){
        this.passwordResetError = 'Define email';
      } else {
        if (!/\S+@\S+\.\S+/.test(email)) {
          this.passwordResetError = 'Incorrect email format';
        } else {
          return this.user_passwordreset(email)
            .then((response) => {
              if (response.ok === true) {
                this.passwordResetSuccess = 'New password was sent to your email';
              } else {
              }
            })
            .catch((e) => {
              this.passwordResetError = 'ILM account for this email is not found';
            });
        }
      }
    },

    keycheck (event) {
      if (this.loginTimer) return;
      if (this.loginUser.length && this.loginPassword.length) {
        this.loginError = '';
      }
      if (event.key === 'Enter') this.login()
    },

    clearPasswordMessage() {
      this.passwordResetError = '';
      this.passwordResetSuccess = '';
    },

    setActive(value) {
      this.active = value;
      this.loginError = '';
      this.passwordError = '';
      this.passwordResetError = '';
      this.passwordResetSuccess = '';
      this.passwordEmail = '';
    },

    getLoginTimeCaption (lockTime) {
      let loginTimeCaption;
      let timeInSec = lockTime / 1000;
      if (timeInSec > 60) {
        loginTimeCaption = Math.ceil(timeInSec / 60) + ' minutes';
      } else {
        loginTimeCaption = Math.round(timeInSec) + ' seconds';
      }
      return `Your account is currently locked. Wait ${loginTimeCaption} and try again`;
    }

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
  margin: 10px 0px 0px 0px;
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

.error-message {
  color: red;
  margin: .5em;
  border-radius: 5px;
  /*text-shadow: -1px -1px 10px rgba(255, 255, 0, 1);*/
}
.success-message {
  color: green;
  margin: .5em;
  border-radius: 5px;
}

.title {margin-bottom: 1em; margin-top:.75em;}

</style>
