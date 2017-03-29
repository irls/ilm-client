<template>
  <select v-model="selectedValue" class="form-control">
    <option disabled value="">Editor Languages</option>
    <option
      v-for="option in options"
      :value="option.code">
      {{option.name}}
    </option>
  </select>
</template>

<script>
import LANGUAGES from '../../../static/languages.json'

export default {

  name: 'SelectLanguages',

  data () {
    return {
      options: LANGUAGES,
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
