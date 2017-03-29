<template>
  <select v-model="selectedValue" class="form-control">
    <option disabled value="">Select Privilege</option>
    <option
      v-for="option in options"
      :value="option.rank">
      {{option.name}}
    </option>
  </select>
</template>

<script>
import PRIVILEGES from '../../../static/privileges.json'

export default {

  name: 'SelectLanguages',

  data () {
    return {
      options: PRIVILEGES,
      selectedValue: ''
    }
  },

  props: [
    'selected'
  ],


  watch: {
    selected (val) {
      this.selectedValue = this.selected
    },
    selectedValue (val) {
      this.$emit('select', val)
    }
  },

  mounted () {
    this.selectedValue = this.selected
  }

}
</script>
