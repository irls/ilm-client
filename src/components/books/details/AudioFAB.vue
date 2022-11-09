<template>
  <div class="fab-container" v-if="hasPlayingBlock">
    <div :class="['audio-fab', '-' + playingBlock.state]" v-on:click="onAudioFab()">
      <i class="fab-play" v-if="playingBlock.state === 'pause'"></i>
      <i class="fab-pause" v-if="playingBlock.state === 'play'"></i>
    </div>
  </div>
</template>
<script>
  import playing_block from '../../../mixins/playing_block.js';
  import { mapGetters } from 'vuex';
  export default {
    mixins: [playing_block],
    computed: {
      ...mapGetters(['playingBlock']),
      hasPlayingBlock: {
        get() {
          return this.playingBlock && this.playingBlock.blockid;
        },
        cache: false
      }
    },
    methods: {
      onAudioFab() {
        this.$emit('onAudioFab');
      }
    }
  }
</script>
<style lang="less">
.fab-container {
  float: right;
  text-align: right;
  float: right;
  /*margin: 0px 0px -10px 0px;*/
  position: relative;
  .audio-fab {
    /*background: url('/static/fab-all.png'); */
    /*width: 20px; */
    /*height: 20px; */
    position: absolute; 
    z-index: 9999;
    right: 50px;
    top: calc(~'100% - 80px');
    cursor: pointer;
    i, i:hover {
      font-size: 45px;
      color: #307AB4;
      background-color: #307AB4;
      box-sizing: border-box;
      position: relative;
      display: block;
      transform: scale(var(--ggs,1));
      width: 40px;
      height: 40px;
      border: 2px solid;
      border-radius: 20px
    }
    .fab-play::before {
      content: "";
      display: block;
      box-sizing: border-box;
      position: absolute;
      width: 0;
      height: 18px;
      border-top: 9px solid transparent;
      border-bottom: 9px solid transparent;
      border-left: 12px solid white;
      top: 9px;
      left: 14px
    }
    .fab-pause::before {
      content: "";
      display: block;
      box-sizing: border-box;
      position: absolute;
      width: 12px;
      height: 15px;
      left: 12px;
      top: 10px;
      border-left: 4px solid white;
      border-right: 4px solid white;
    }
  }
}
</style>