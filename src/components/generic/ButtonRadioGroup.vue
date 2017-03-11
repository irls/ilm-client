<template>
  <div class="btn-group" role='group'>
    <button type="button" v-for="(key, val) in values" @click="changeSelectVal(key)"
      :class="[nowSelected==key ? 'btn-primary' : 'btn-default', 'btn']"
      >{{ val }}</button>
  </div>
</template>



<script>
  /* usage:
    <ButtonRadioGroup :values="colors" :selected.sync="color" default="green"></ButtonRadioGroup>
    colors: obj, selected.sync: string var, default: string
  */
  export default {
    data () {
      return {
        nowSelected: '',
      }
    },
    props: ['values','selected','default'],
    methods: {
      changeSelectVal: function(val) {
        this.nowSelected = val;
        this.$emit('changeEditMode', val); 
      }
    },
    created: function() {
      this.nowSelected = this.default;
    }
  }
</script>


<style scoped>
  .btn {outline: none !important;}
</style>
