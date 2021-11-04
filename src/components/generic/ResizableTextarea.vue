<template>
  <textarea class="resizable-textarea" 
    v-on:change="onValueChanged($event)"
    v-model="textareaValue"
    :disabled="disabled">
    
  </textarea>
</template>
<script>
  export default {
    name: 'resizable-textarea',
    data() {
      return {
        textareaValue: ''
      }
    },
    methods: {
      resizeTextarea (event) {
        event.target.style.height = 'auto'
        event.target.style.height = (event.target.scrollHeight) + 'px'
      },
      initSize() {
        this.$el.setAttribute('style', 'height:' + (this.$el.scrollHeight) + 'px;overflow-y:hidden;')
      },
      onValueChanged(event) {
        this.$emit('valueChanged', event);
      },
      setValue(value) {
        this.textareaValue = value ? value : "";
      }
    },
    mounted () {
      this.$nextTick(() => {
        this.initSize();
      })

      this.$el.addEventListener('input', this.resizeTextarea)
    },
    beforeDestroy () {
      this.$el.removeEventListener('input', this.resizeTextarea)
    },
    render () {
      return this.$slots.default[0]
    },
    props: ['initValue', 'disabled']
  }
</script>
<style lang="less">
  .resizable-textarea {
    width: 100%;
    padding: 0;
    margin: 0;
    border: none;
    min-height: 180px;
    resize: vertical;
    outline: 0;
  }
</style>