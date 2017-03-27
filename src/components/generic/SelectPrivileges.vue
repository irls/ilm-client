<template>
  <select v-model="selected" class="form-control">
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
      options: PRIVILEGES
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
