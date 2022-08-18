<template>
  <modal
    id="SelectionModal"
    :show="show"
    :backdrop="false"
  >
    <div slot="modal-header" class="modal-header">
    </div>

    <div slot="modal-body" class="modal-body">
      <div class="form-group">
        <label style="font-weight: 500 bold; font-size: 30px;color: rgb(51,51,51);">Setting range... {{SelectionModalProgress}}%</label> <i style="margin-left: 20px; color:rgb(192,192,192)" class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i>
      </div>
<!--      <div class="form-group">-->
<!--        <label>Speed {{SelectionModalProgressIterations}}</label>-->
<!--        <input type="range" id="volume" v-model="SelectionModalProgressIterations"  @change="SelectionModalProgressIterationsChanged()" min="10" max="250">-->
<!--      </div>-->
    </div>

    <div slot="modal-footer" class="modal-footer">
    </div>

  </modal>
</template>
<script>
import { modal, alert } from 'vue-strap'
import { mapGetters, mapActions } from 'vuex'
export default {
  name: 'SelectionModal',
  components: {
    modal,
  },
  props: {
    show: Boolean
  },
  data() {
    return {
    }
  },
  mounted() {
    $('#SelectionModal .modal-dialog')
      .css('position','relative')
      .css('height','100%')
      .css('margin','0 auto')
      .css('padding','0');

    $('#SelectionModal .modal-content')
      .css('margin','0')
      .css('position','absolute')
      .css('top','50%')
      .css('-ms-transform','translateY(-50%)')
      .css('transform','translateY(-50%)')
      .css('height', '100px')
      .css('width', '500px');

  },
  methods: {
    ...mapActions([
    ]),
  },
  computed: {
    ...mapGetters({
      SelectionModalProgress: 'getSelectionModalProgress',
    })
  },
  watch: {

  }

}
</script>
<style scoped>
#SelectionModal .fa:hover{
  cursor: default;
}

#SelectionModal .modal-header{
  display: none;
}
#SelectionModal .modal-footer{
  display: none;
}
#SelectionModal .form-group{
  text-align: center;
  padding-top: 13px;
}
#SelectionModal .form-group label{
  font-size: 24pt;
  color: black;
  font-weight: lighter;
}

#SelectionModal .fa {
  font-size: 30px;
}

.error-message {
  margin-left: 0%;
}
i.add-book {
  float: right;
  margin-top: -40px;
}
.book-row input {
  width: 90%;
  display: inline-block;
}
textarea.job-descr {
  resize: vertical;
}

  .alert-icon-float-left {
    font-size: 40px;
    float: left;
    color: #a94442;
  }

  .alert-text-float-right {
    float: right;
    text-align: left;
    width: 400px;
  }

  .alert.top .alert-text-float-right p {
    text-align: left;
    margin: 5px 0;
    word-break: break-word;
  }

  .modal-footer .non-modal-submit {
    width: 15%;
  }

  .modal-footer .non-modal-form {
    width: 85%;
  }

  .has-error {
    border: 1px solid red;
  }

</style>
