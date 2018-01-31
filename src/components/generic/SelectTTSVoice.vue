<template>
  <v-select
    :options="options"
    options-label="Name"
    options-value="Id"
    v-model="selectedValue"
    name="ttsVoices[]"
    :search="search"
    :placeholder="'Select Voice'"
  ></v-select>
</template>
<script>

import { select } from 'vue-strap'
import { mapGetters, mapActions } from 'vuex'

export default {

  name: 'SelectTTSVoice',

  components: {
    'vSelect': select
  },

  data () {
    return {
      options: [],
      selectedValue: [],
      search: ''
    }
  },

  computed: {
    ...mapGetters(['ttsVoices'])
  },

  methods: {
    ...mapActions(['loadTTSVoices'])
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
    this.loadTTSVoices()
    .then(()=>{
      this.options = this.ttsVoices;
      //console.log('this.options', typeof this.ttsVoices, this.ttsVoices);
    })
    .catch(err=>err)
  }
}
</script>
