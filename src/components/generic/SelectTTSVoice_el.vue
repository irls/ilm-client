<template>
<div class="voice-select-el">
  <button class="test-tts-voice" v-on:click="playAudio"></button>
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
      'voices', 'pre_selected', 'block_type'
    ],

    computed: {

    },

    methods: {
      onInput() {
        this.$emit('onSelect', this.block_type, this.value);
      },

      playAudio() {
        this.$emit('play', this.value);
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

