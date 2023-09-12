<template>
<div class="voice-select-el">
  <span class="preloader -generating-example" v-if="generating_example === value"></span>
  <template v-else>
    <button class="test-tts-voice -stop" v-on:click="stopAudio" v-if="playing_type === block_type"></button>
    <button class="test-tts-voice" v-on:click="playAudio" v-else></button>
  </template>
  <select class="select-voice" v-model="value" v-on:change="onInput">
    <option v-for="voice in voices" :value="voice.voice_id">{{voice.name}}</option>
  </select>
</div>
</template>
<script>

  import { mapGetters, mapActions } from 'vuex'

  export default {

    name: 'SelectTTSVoice',

    data () {
      return {
        value: ''
      }
    },

    props: [
      'voices', 'pre_selected', 'block_type', 'generating_example', 'playing_type'
    ],

    computed: {

    },

    methods: {
      onInput() {
        this.$emit('onSelect', this.block_type, this.value);
      },

      playAudio() {
        this.$emit('play', this.value, this.block_type);
      },
      
      stopAudio() {
        this.$emit('stop');
      }
    },

    mounted () {
      this.options = this.pre_options;
      this.value = this.pre_selected;
    },

    watch: {
      'pre_selected': {
        handler(val) {
          this.value = val;
        }
      }
    }
  }
</script>
<style lang="less">
  .voice-select-el {
    .test-tts-voice {
      background: url(/static/tts-catalog/play-small.png);
      width: 24px;
      height: 24px;
      margin-right: 10px;
      border: none;
      vertical-align: middle;
      &.-stop {
        background: url(/static/tts-catalog/stop-small.png);
      }
    }
    .select-voice {
      border: 1px solid #b9b6b6;
      color: #333;
      height: 31px;
      padding: 5px;
      width: 200px;
      border-radius: 5px;
      background-color: white;
    }
  }
</style>

