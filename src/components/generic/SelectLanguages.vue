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
    :class="['languages-select', 'user-languages-select ' + classList]"
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
    'isDisabled',
    'inModal'
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
    },
    classList: {
      get() {
        if (this.inModal) {
          return '-in-modal';
        }
        return '';
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
  .user-languages-select {
    &.-in-modal {
      .dropdown-menu {
        height: auto;
        /*max-height: 70vh;*/
        overflow-y: auto;
        overflow-x: hidden;
        /*top: -150px;*/
        /*height: auto;*/
        left: 490px;
        top: -12px;
        max-width: 300px;
        input.form-control {
          width: 200px !important;
        }
      }
      &.open {
        .dropdown-toggle {
          &:after {
            content: ' ';
            position: absolute;
            right: 10px;
            top: 42%;
            margin: -1px 0 0;
            border-left: 4px dashed;
            /*border-top: 4px solid;*/
            border-top: 4px solid transparent;
            border-bottom: 4px solid transparent;
          }
        }
      }
    }
    .dropdown-toggle {
      max-width: 455px;
    }
  }
</style>