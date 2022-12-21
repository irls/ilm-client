<template>

  <modal id="userEditModal" effect="fade" @closed="closed" name="edit-user-modal" :clickToClose="false" :resizeable="false" height="auto" width="400" >
    <section class="modal-js-dialog">
    <div class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title"><i class="fa fa-user"></i>Edit User</h4><i class="fa fa-user user-icon"></i></div>
    <div class="modal-body">
      <div v-if="error" class="error-message" v-text="error"></div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-user"></i></span>
          <input type="text" class="form-control" placeholder="Username" v-model="user._id" disabled>
          <div v-if="errors.username" v-for="err in errors.username" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group"><span class="input-group-addon"></span>
        <div class="wrapper">
          <input type="text" class="form-control" :maxlength="30" placeholder="Real Name" v-model="user.name">
          <span>{{user.name ? user.name.length : 0}}/30</span>
        </div>
      </div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-envelope-o"></i></span>
        <div class="wrapper">
          <input type="text" class="form-control" :maxlength="40" placeholder="Email" name="email" v-model="user.email">
          <span>{{user.email ? user.email.length : 0}}/40</span>
        </div>
          <div v-if="errors.email" v-for="err in errors.email" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group"><span class="input-group-addon"></span>
        <select-roles
          :selected="user.roles"
          @select="val => { user.roles = val }"
          :inModal="true"
        ></select-roles>
      </div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-globe"></i></span>
        <select-languages
          :selected="user.languages"
          @select="val => { user.languages = val }"
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
import SelectRoles from './../generic/SelectRoles';
import SelectLanguages from './../generic/SelectLanguages';
import modalMixin from './../../mixins/modal';
import { mapActions } from 'vuex';

export default {

  name: 'UserEditModal',

  mixins: [modalMixin],

  components: {
//     modal,
    SelectRoles,
    SelectLanguages
  },

  props: [
    'show',
    'user'
  ],

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

  watch: {
    show (val) {
      if (val) {
        this.errors = {}
        this.error = ''
        this.$modal.show('edit-user-modal');
      } else this.$modal.hide('edit-user-modal');
    }
  },

  methods: {
    ok () {
      this.errors = {};
      this.error = '';

      return this.updateUser([this.user._id, this.user])
        .then((response) => {
          this.$emit('closed', true)
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
      this.$emit('closed', false)
    },
    ...mapActions('userActions', ['updateUser'])
  }

}
</script>

<style lang="stylus">
#userEditModal
  i
    margin-right: 10px

  .v--modal-box.v--modal
    overflow: visible
    width: 555px !important;
    left: 30% !important;

  .modal-js-dialog
    width: 400px
    margin: 10px

    .modal-header
      position: relative
      border-bottom: 0 solid #e5e5e5
      width: 525px
      .modal-title
        display: inline-block
        font-size: 18px
        margin-top: 17px
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
          min-width: 455px
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

.wrapper {
  width: 455px;
  background #FFFFFF;
  display: flex;
  margin-inline-start: 44px;
  margin-inline-end: 11px;
  align-items: center;
  position: relative;
  input {
    flex-grow: 1;
    min-width: 0 !important;
    width: auto !important;
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
    width: 50px;
    text-align right;
    color: #99999b;
  }
}

</style>
