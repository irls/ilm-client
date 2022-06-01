<template>

  <modal id="workHistoryModal" :value="show" effect="fade" @closed="closed">
    <div slot="modal-header" class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title"><i class="fa fa-calendar-check-o"></i>Work history</h4></div>
    </div>
    <div slot="modal-body" class="modal-body">
      
      <div v-if="workHistory.user_id">
        <taskHistory :user_id="workHistory.user_id" :in_modal="true"></taskHistory>
      </div>
    </div>
    <div slot="modal-footer" class="modal-footer">
      <button class="btn btn-primary" type="button" @click="closed">OK</button>
    </div>
  </modal>

</template>

<script>

import { modal } from 'vue-strap'
import modalMixin from './../../mixins/modal'
import taskHistory from '../tasks/TaskHistory'

export default {

  name: 'WorkHistoryModal',

  mixins: [modalMixin],

  components: {
    modal, taskHistory
  },

  props: {
    show: Boolean,
    workHistory: Object
  },

  data () {
    return {
    }
  },

  watch: {
    show() {
      
    }
  },

  methods: {
    cancel () {
      this.$emit('closed', false)
    }
  }

}
</script>

<style lang="stylus">
#workHistoryModal
  i
    margin-right: 10px;
  .modal-dialog
    width: 600px
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
        .form-control
          min-width: 312px
          .btn-content
            margin: 2px 0
.error-message {color: red; margin: .5em;
  border-radius: 5px;
  margin-left: 12%;
}

</style>


