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
        <label>Setting range...{{SelectionModalProgress}}%</label> <i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i>
      </div>
      <div class="form-group">
        <label>Speed {{SelectionModalProgressIterations}}</label>
        <input type="range" id="volume" v-model="SelectionModalProgressIterations"  @change="SelectionModalProgressIterationsChanged()" min="10" max="1000">
      </div>
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
      SelectionModalProgressIterations:10
    }
  },
  mounted() {
    this.SelectionModalProgressIterations = 10;

    let name = 'SelectionModalProgressIterations';
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
      let c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) {
        this.SelectionModalProgressIterations = parseInt(c.substring(nameEQ.length,c.length));
      }
    }

  },
  methods: {
    SelectionModalProgressIterationsChanged () {
      let days = 30;
      let expires = "";
      if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
      }
      let name = 'SelectionModalProgressIterations';
      document.cookie = name + "=" + (this.SelectionModalProgressIterations || "")  + expires + "; path=/";
      this.$store.dispatch('setSelectionModalProgressIterations',this.SelectionModalProgressIterations);
    },


    ...mapActions([
    ]),
  },
  computed: {
    ...mapGetters({
      SelectionModalProgress: 'getSelectionModalProgress',
    })
    // progress () {
    //   return basket.state.fruits.length
    //   // Or return basket.getters.fruitsCount
    //   // (depends on your design decisions).
    // }
  },
  watch: {
    // 'SelectionModalProgress': function() {
    //   console.log(this.$store.state.SelectionModalProgress)
    // }
  }
  //   progress (newCount, oldCount) {
  //     console.log(`We have ${newCount} progress now, yay!`)
  //   }
  // }
}
</script>
<style scoped>
#SelectionModal .modal-header{
  display: none;
}
#SelectionModal .modal-footer{
  display: none;
}
#SelectionModal .form-group{
  font-size: 26px;
  text-align: center;
  padding-top: 13px;
}

#SelectionModal .fa {
  font-size: 30px;
}
/*#SelectionModal .preloader {*/
/*  background: url(/static/preloader-snake-transparent-small.gif);*/
/*  width: 34px;*/
/*  height: 34px;*/
/*  display: inline-block;*/
/*  background-repeat: no-repeat;*/
/*  text-align: center;*/
/*  background-position: 0 0;*/
/*  !*background-size: 83%;*!*/
/*  margin-bottom: -3px;*/
/*  margin-right: -1px;*/
/*}*/


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
