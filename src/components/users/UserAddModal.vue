<template>

  <modal id="userAddModal" :value="show" effect="fade" @closed="closed">
    <div slot="modal-header" class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title"><i class="fa fa-user"></i>Add User</h4><i class="fa fa-user user-icon"></i></div>
    </div>
    <div slot="modal-body" class="modal-body">
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-user"></i></span>
          <input type="text" class="form-control" placeholder="User Name">
      </div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-envelope-o"></i></span>
          <input type="text" class="form-control" placeholder="Email" name="email">
      </div>
      <div class="form-group"><span class="input-group-addon"></span>
        <select-privileges
          :selected="selectePrivilege"
          @select="val => { selectePrivilege = val }"
        ></select-privileges>
      </div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-globe"></i></span>
        <select-languages
          :selected="selecteLanguage"
          @select="val => { selecteLanguage = val }"
        ></select-languages>
      </div>
    </div>
    <div slot="modal-footer" class="modal-footer">
      <button class="btn btn-primary" type="button" @click="ok">Submit </button>
    </div>
  </modal>

</template>

<script>

import { modal } from 'vue-strap'
import SelectPrivileges from './../generic/SelectPrivileges'
import SelectLanguages from './../generic/SelectLanguages'
import modalMixin from './../../mixins/modal'

export default {

  name: 'UserAddModal',

  mixins: [modalMixin],

  components: {
    modal,
    SelectPrivileges,
    SelectLanguages
  },

  props: {
    show: Boolean
  },

  data () {
    return {
      selectePrivilege: '',
      selecteLanguage: ''
    }
  },

  watch: {
    show () {
      this.selectePrivilege = ''
      this.selecteLanguage = ''
    }
  },

  methods: {
    ok () {
      console.log('ok')
      this.closed()
    },
    cancel () {
      console.log('cancel')
      this.closed()
    }
  }

}
</script>

<style lang="stylus">
#userAddModal
  i
    margin-right: 10px;
  .modal-dialog
    width: 400px
    margin-top: 10%

    .modal-header
      position: relative
      border-bottom: 0 solid #e5e5e5
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

    .modal-body
      margin-top: 20px
      .form-group
        margin-bottom: 10px
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
</style>
