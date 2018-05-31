<template>
  <v-select
    :options="options"
    options-label="name"
    options-value="rank"
    v-model="selectedValue"
    name="roles[]"
    :search="search"
    multiple
    :placeholder="'Select Roles'"
    :disabled="isDisabled"
  ></v-select>
</template>

<script>

import { select } from 'vue-strap'
import ROLES from '../../../static/roles.json'

export default {

  name: 'SelectRoles',

  components: {
    'vSelect': select
  },

  data () {
    return {
      options: ROLES,
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
