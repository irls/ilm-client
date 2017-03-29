<template>

  <modal :value="show" effect="fade" @closed="closed">
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

<style>

</style>
