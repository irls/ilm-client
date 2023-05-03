<template>
  <textarea class="resizable-textarea" 
    v-on:change="onValueChanged($event)"
    v-on:blur="onBlur($event)"
    v-on:keypress="onKeypress($event)"
    v-on:keyup="onKeyup($event)"
    v-model="textareaValue"
    :disabled="disabled"
    rows="1">
    
  </textarea>
</template>
<script>
  import Vue from 'vue';
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
        this.$el.setAttribute('style', 'height:20px;');
        this.$el.setAttribute('style', 'height:auto;');
        this.$el.setAttribute('style', 'height:' + (this.$el.scrollHeight) + 'px;overflow-y:hidden;');
      },
      onValueChanged(event) {
        this.$emit('valueChanged', event);
      },
      setValue(value) {
        this.textareaValue = value ? value : "";
        Vue.nextTick(() => {
          this.initSize();
        })
      },
      onBlur(event) {
        this.$emit('onBlur', event);
      },
      onKeypress(event) {
        this.$emit('onKeypress', event);
      },
      onKeyup(event) {
        this.$emit('onKeyup', event);
      }
    },
    mounted () {
      this.$nextTick(() => {
        //this.initSize();
        //if (this.initValue) {
          this.setValue(this.initValue);
        //}
      });

      this.$el.addEventListener('input', this.resizeTextarea);
    },
    beforeDestroy () {
      this.$el.removeEventListener('input', this.resizeTextarea);
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
    /*min-height: 20px;*/
    resize: vertical;
    outline: 0;
  }
</style>