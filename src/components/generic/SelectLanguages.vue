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
    class="languages-select"
  ></v-select>
</template>
<script>

import { select } from 'vue-strap'
import { Languages } from "../../mixins/lang_config.js"

export default {

  name: 'select-tts-voice',

  components: {
    'vSelect': select
  },

  data () {
    return {
      //options: lang_list,
      selectedValue: [],
      search: '',
      lang_list: Languages
    }
  },

  props: [
    'selected',
    'isDisabled'
  ],
  
  computed: {
    options: {
      get() {
        if (!this.lang_list) {
          return [];
        }
        let langs = [];
        for (let code in this.lang_list) {
          langs.push({code: code, name: this.lang_list[code]});
        }
        return langs;
      }
    }
  },

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
<style lang="less">
  .languages-select {
    &.disabled {
      .dropdown-menu {
        display: none;
      }
    }
  }
</style>