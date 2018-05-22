<template>
  <v-select
    :options="options"
    options-label="name"
    options-value="code"
    v-model="selectedValue"
    name="languages[]"
    :search="search"
    multiple
    :placeholder="'Editor Languages'"
    :disabled="isDisabled"
  ></v-select>
</template>
<script>

import { select } from 'vue-strap'
import LANGUAGES from '../../../static/languages.json'

export default {

  name: 'select-tts-voice',

  components: {
    'vSelect': select
  },

  data () {
    return {
      options: LANGUAGES,
      selectedValue: [],
      search: ''
    }
  },

  props: [
    'selected',
    'isDisabled'
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
