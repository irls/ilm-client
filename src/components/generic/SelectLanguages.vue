<template>
  <select v-model="selected" class="form-control">
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
      options: LANGUAGES
    }
  },

  props: [
    'selected'
  ],

  methods: {
  },

  created () {
  }
}
</script>
