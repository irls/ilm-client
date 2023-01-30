<template>

  <modal id="userAddModal" effect="fade" @closed="closed" name="add-user-modal" :clickToClose="false" :resizeable="false" height="auto" width="400" shiftY="0" top="0" >
    <section class="modal-js-dialog">
    <div class="modal-header">
      <button type="button" class="close" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title">Add User</h4><i class="fa fa-user user-icon"></i>
    </div>
    <div class="modal-body">
      <div v-if="error" class="error-message" v-text="error"></div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-user"></i></span>
        <div class="user-modal-wrapper">
          <input type="text" :class="['form-control', {'-has-error': errors.username}]" :maxlength="30" placeholder="Username" v-model="username" @input="cleanWarningMsg('username')">
          <span >{{username.length}}/30</span>
        </div>
          <div v-if="errors.username" v-for="err in errors.username" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group"><span class="input-group-addon"></span>
        <div class="user-modal-wrapper">
           <input type="text" :maxlength="30" placeholder="Real Name" class="form-control" v-model="name">
           <span >{{name.length}}/30</span>
        </div>
      </div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-envelope-o"></i></span>
        <div class="user-modal-wrapper">
          <input type="text" :class="['form-control', {'-has-error': errors.email}]" :maxlength="40" placeholder="Email" name="email" v-model="email" @input="cleanWarningMsg('email')">
          <span >{{email.length}}/40</span>
        </div>
          <div v-if="errors.email" v-for="err in errors.email" class="error-message" v-text="err"></div>
      </div>
      <!-- <div class="form-group"><span class="input-group-addon"></span>
          <input type="password" class="form-control" placeholder="Password" v-model="password">
          <div v-if="errors.password" v-for="err in errors.password" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group"><span class="input-group-addon"></span>
          <input type="password" class="form-control" placeholder="Confirm Password" v-model="confirmPassword">
          <div v-if="errors.confirmPassword" v-for="err in errors.confirmPassword" class="error-message" v-text="err"></div>
      </div> -->
      <div class="form-group"><span class="input-group-addon"></span>
        <select-roles
          :selected="roles"
          @select="val => { roles = val }"
          :inModal="true"
        ></select-roles>
      </div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-globe"></i></span>
        <select-languages
          ref="languagesSelector"
          :selected="languages"
          @select="val => { languages = val }"
          :inModal="true"
        ></select-languages>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" type="button" @click="ok">Submit </button>
    </div>
    </section>
  </modal>

</template>

<script>

import Vue from 'vue'
import v_modal from 'vue-js-modal';
Vue.use(v_modal, { dialog: true });
//import { modal } from 'vue-strap'
import SelectRoles from './../generic/SelectRoles'
import SelectLanguages from './../generic/SelectLanguages'
import modalMixin from './../../mixins/modal';
import { mapActions } from 'vuex';

export default {

  name: 'UserAddModal',

  mixins: [modalMixin],

  components: {
//     modal,
    SelectRoles,
    SelectLanguages
  },

  props: {
    show: Boolean
  },

  data () {
    return {
      name: "",
      username: "",
      email: "",
      roles: [],
      languages: [],
      selecteRoles: [],
      selecteLanguages: [],
      errors: {},
      error: '',
    }
  },
  
  mounted() {
    
  },

  watch: {
    show (val) {
      if (val) {
        this.name = ""
        this.username = ""
        this.email = ""
        this.roles = []
        this.languages = []
        this.errors = {}
        this.error = ''
        this.$modal.show('add-user-modal');
      } else this.$modal.hide('add-user-modal');
    }
  },

  methods: {
    ok () {
      this.errors = {};
      this.error = '';
      let newUser = {
        name: this.name,
        username: this.username,
        email: this.email,
        roles: this.roles,
        languages: this.languages,
      };
      return this.createUser(newUser)
        .then((response) => {
          this.$emit('closed', true);
        })
        .catch((error) => {
          if (error instanceof Object) {
            this.errors = error;
          } else {
            this.error = error;
          }
        });
    },
    cancel () {
      //this.$modal.hide('add-user-modal');
      this.$emit('closed', false)
    },
    cleanWarningMsg (type) {
      if (type === 'username') return this.errors.username = undefined;
      else if (type === 'email') return this.errors.email = undefined;
    },
    ...mapActions('userActions', ['createUser'])
  }

}
</script>

<style lang="stylus">
#userAddModal
  i
    margin-right: 10px

  .v--modal-box.v--modal
    overflow: visible
    width: 555px !important;
    left: 30% !important;

  .modal-js-dialog
    margin: 10px

    .modal-header
      position: relative
      border-bottom: 0 solid #e5e5e5
      width: 525px
      .modal-title
        display: inline-block
        font-size: 18px
        margin-top: 17px
        margin-left: 10px
        color: #00d1ff
        text-align: left
        float: left
      .fa.fa-user.user-icon
        font-size: 39px
        border: 1px solid
        width: 50px
        height: 50px
        text-align: center
        border-radius: 100%
        padding: 4px
        position: absolute
        right: 10px
        top: 34px
      .close
        margin-top: -2px

    .modal-body
      margin-top: 20px;
      padding: 10px;
      .form-group
        margin-bottom: 10px
        width: 510px;
        .input-group-addon
          width: 1%
          float: left
          background: 0 0
          border: 0
          font-size: 18px
          vertical-align: middle
          margin-right: 10px;
        .form-control
        select
          display: inline-block
          width: 85%
          margin: 0 10px
        select
          min-width: 134px
          max-width: 100%
          border-radius: 0
          padding: 5px
          border: 1px solid #efecec!important
          height: 31px
          color: #333
          margin: 0 10px
        .form-control
          width: 455px
          .btn-content
            margin: 2px 0
    .modal-footer
      width: 525px
  .v--modal
    top: 0px !important;

.error-message {
  color: red; margin: .5em;
  border-radius: 5px;
  margin-left: 12%;
}
input {
  &.-has-error {
    border: 1px solid red;
  }
}
.user-modal-wrapper {
  width: 455px;
  background #FFFFFF;
  display: flex;
  margin-inline-start: 44px;
  margin-inline-end: 11px;
  align-items: center;
  position: relative;
  input {
    flex-grow: 1;
    min-width: 0
    width: auto;
    margin: 0 !important;
    height: 32px;
  }
  span {
    flex-shrink: 0;
    padding: 0 10px;
    position: absolute;
    right: 0;
    height: 32px;
    line-height: 32px;
    width: 55px;
    text-align right;
    color: #99999b;
  }
}

</style>
