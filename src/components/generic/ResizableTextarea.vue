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
        textareaValue: '',
        initHeight: 20
      }
    },
    methods: {
      resizeTextarea (event) {
        event.target.style.height = 'auto'
        if (!this.checkRows()) {
          event.target.style.height = (event.target.scrollHeight) + 'px'
          event.target.style.overflowY = 'hidden';
        }
      },
      initSize() {
        this.$el.setAttribute('style', 'height:20px;');
        this.$el.setAttribute('style', 'height:auto;');
        if (!this.checkRows()) {
          this.$el.setAttribute('style', 'height:' + (this.$el.scrollHeight) + 'px;overflow-y:hidden;');
        }
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
      },
      checkRows() {
        if (this.initHeight && this.rows) {
          let rows = this.$el.scrollHeight / this.initHeight;
          if (rows > this.rows) {
            this.$el.style.height = this.initHeight * this.rows + 'px';
            this.$el.style.overflowY = 'scroll';
            return true;
          }
        }
        return false;
      }
    },
    mounted () {
      this.$nextTick(() => {
        //this.initSize();
        //if (this.initValue) {
        if (this.$el.scrollHeight) {
          this.initHeight = this.$el.scrollHeight;
        }
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
    props: ['initValue', 'disabled', 'rows']
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