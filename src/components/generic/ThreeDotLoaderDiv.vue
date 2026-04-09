<template>
  <div class="dot-flashing" :style="{ 'margin-left': marginLeft }"></div>
</template>

<script>

export default {
    name: 'ThreeDotLoaderDiv',
    props: {
      'marginLeft': {
        type: String,
        default: '40px'
      }
    },
    data() {
      return {};
    },
    watch: {},
    mounted() {},
    updated() {},
    methods: {
  },
    computed: {
    },
    components: {
    },
    directives: {
    }
}
</script>

<style lang="less" scoped>
.dot-flashing {
  position: relative;
  top: 2px;
  margin-left: 49%;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: black; /*#9880ff;*/
  color: black; /*#9880ff;*/
  animation: dot-flashing 1s infinite linear alternate;
  animation-delay: 0.5s;
}
.dot-flashing::before, .dot-flashing::after {
  content: "";
  display: inline-block;
  position: absolute;
  top: 0;
}
.dot-flashing::before {
  left: -15px;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: black; /*#9880ff;*/
  color: black; /*#9880ff;*/
  animation: dot-flashing 1s infinite alternate;
  animation-delay: 0s;
}
.dot-flashing::after {
  left: 15px;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: black; /*#9880ff;*/
  color: black; /*#9880ff;*/
  animation: dot-flashing 1s infinite alternate;
  animation-delay: 1s;
}

@keyframes dot-flashing {
  0% {
    background-color: black; /*#9880ff;*/
  }
  50%, 100% {
    background-color: rgba(0, 0, 0, 0.2); /*rgba(152, 128, 255, 0.2);*/
  }
}
</style>
