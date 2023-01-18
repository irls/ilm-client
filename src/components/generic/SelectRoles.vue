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
    :class="['roles-select', 'user-roles-select ' + classList]"
  ></v-select>
</template>

<script>

import { mapGetters } from 'vuex'
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
    'isDisabled',
    'inModal'
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
  },
  
  computed: {
    classList: {
      get() {
        if (this.inModal) {
          return '-in-modal';
        }
        return '';
      }
    },
    
    /*
    selectedValue: {
      get() {
        return this.user.roles != undefined && this.user.roles != "" ? this.user.roles : 'Select Roles'
      }
    },

    ...mapGetters(['user'])
    */
  }

  }

</script>
<style lang="less">
  .roles-select {
    &.disabled {
      .dropdown-menu {
        display: none;
      }
    }
  }
  .user-roles-select {
    &.-in-modal {
      .dropdown-menu {
        height: auto;
        /*max-height: 70vh;*/
        overflow-y: auto;
        overflow-x: hidden;
        /*height: auto;*/
        left: 340px;
        top: -12px;
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
      max-width: 312px;
    }
  }
</style>