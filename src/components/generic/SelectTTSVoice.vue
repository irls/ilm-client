<template>

  <select :class="['select2-custom-base', customClass]">
    <slot></slot>
  </select>

</template>
<script>

  import $ from 'jquery'
  import 'select2'
  import 'select2/dist/css/select2.css'

import { mapGetters, mapActions } from 'vuex'

export default {

  name: 'SelectTTSVoice',

  data () {
    return {
      options: [],
      value: '',
      config: {
        allowClear: true,
        placeholder: 'Please select a voice',
        width: 'element'
      }
    }
  },

  props: [
    'customClass', 'selected'
  ],
//     data example:
//       {
//       "text": "Group 2",
//       "children" : [
//         {
//             "id": 3,
//             "text": "Option 2.1"
//         },
//         {
//             "id": 4,
//             "text": "Option 2.2"
//         }
//       ]
//     }

  computed: {
    ...mapGetters(['ttsVoices'])
  },

  methods: {
    ...mapActions(['loadTTSVoices'])
  },

  mounted () {
    this.loadTTSVoices()
    .then(()=>{
      this.options = this.ttsVoices;
    })
    .catch(err=>err);

    $(this.$el).ready(() => {
      $(this.$el).select2({
        data: this.options,
        ...this.config
      })
      .val(this.value)
      .trigger('change')
      // emit event on change.
      .on('change', (e) => {
        this.$emit('select', e.target.value)
      })
      .on('select2:unselecting', function() {
        $(this).one('select2:opening', function(ev) { ev.preventDefault(); });
      }); // according to https://github.com/select2/select2/issues/3320
    })
  },

  watch: {
    options: function (options) {
      // update options
      $(this.$el)
      .empty()
      .select2({ data: options, ...this.config })
      .val(this.value)
      .trigger('change')
    }
  },

  destroyed: function () {
    $(this.$el).off().select2('destroy')
  }
}
</script>
<style lang="less">
  .select2-custom-base {
    width: 200px;
  }
</style>
