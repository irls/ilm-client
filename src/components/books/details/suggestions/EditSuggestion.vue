<template>
  <div class="edit-suggestion">
    <div>
      <input type="text" v-model="suggestion.text" v-on:change="textChange" placeholder="Add text" />
    </div>
    <div>
      <input type="text" v-model="suggestion.suggestion" placeholder="Add Suggestion" />
    </div>
    <div>
      <select-tts-voice ref="voice_select"
        :pre_selected="suggestion.voice_id ? suggestion.voice_id : ''"
        :voices="all_voices"
        :block_type="'paragraph'"
        :generating_example="null"
        :playing_type="null"
        @onSelect="onVoiceChange"
        @play="playVoiceExample"
        @stop="stopVoiceExample"
      ></select-tts-voice>
      <button class="clear-suggestion" v-on:click="cancel"></button>
      <button class="save-suggestion" :disabled="saveDisabled" v-on:click="save()" title="Save Suggestion"></button>
    </div>
  </div>
</template>
<script>

  import Vue from "vue";
  import { mapActions, mapGetters } from 'vuex';
  import lodash from 'lodash';
  import v_modal from "vue-js-modal";
  import SelectTTSVoice from '@src/components/generic/SelectTTSVoice_el';

  Vue.use(v_modal, { dialog: true, dynamic: true });

  export default {
    data() {
      return {
        all_voices: [],
        audio_element: null,
        audio_playing: false,
        reset: false
      }
    },
    props: {
      'suggestion': {
        type: Object,
        default() {
          return {
            text: "",
            suggestion: ""
          }
        }
      }
    },
    components: {
      'select-tts-voice': SelectTTSVoice
    },
    computed: {
      saveDisabled: {
        get() {
          return this.suggestion.text.trim().length === 0;
        },
        cache: false
      },
      ...mapGetters('ttsModule', ['tts_voices']),
      ...mapGetters('suggestionsModule', ['suggestions', 'findSuggestion'])
    },
    mounted() {
      this.loadBookVoices();
    },
    methods: {
      loadBookVoices() {
        //this.all_voices = [];
        return this.getTTSVoices()
          .then(()=>{
            let allVoices = lodash.cloneDeep(this.tts_voices);
            this.book_voices = [];
            [...allVoices].forEach(voice => {
              if (voice.bookid === this.currentBookid) {
                this.book_voices.push(lodash.cloneDeep(voice));
              }
            });
            allVoices.forEach(voice => {
              if (voice.category) {
                voice.name = `${voice.name} / ${voice.category}`;
              }
            });
            this.all_voices = allVoices;
            return {};
          });
      },
      onVoiceChange() {
        this.suggestion.voice_id = null;
        this.suggestion.voice_example = '';
      },
      playVoiceExample(voice_id, attempt = 0) {
        if (attempt >= 2 || !voice_id || !this.suggestion.suggestion) {
          return;
        }
        this.stopVoiceExample();
        //if (this.audio_playing) {
          //return;
        //}
        this.checkCreateAudioElement();
        if (this.suggestion.voice_example) {
          this.audio_element.src = process.env.ILM_API + this.suggestion.voice_example;
          this.audio_element.play();
          return;
        }
        return this.generateExample([voice_id, this.suggestion.suggestion])
          .then(response => {
            this.suggestion.voice_example = response;
            this.suggestion.voice_id = voice_id;
            return this.playVoiceExample(voice_id, ++attempt)
          })
          .catch(err => {
            console.log(err);
          });
      },
      stopVoiceExample() {
        if (this.audio_element) {
          this.audio_element.pause();
          this.clearPlayingAudio();
        }
      },
      checkCreateAudioElement() {
        if (!this.audio_element) {
          this.audio_element = document.createElement('audio');
          this.audio_element.addEventListener('ended', () => {
            this.clearPlayingAudio();
          });
          this.audio_element.addEventListener('pause', () => {
            this.clearPlayingAudio();
          });
          //this.audio_element.addEventListener('loadstart', () => {
            //this.clearPlayingAudio();
          //});
        }
      },
      clearPlayingAudio() {
        this.audio_playing = false;
      },
      save() {
        if (!this.suggestion.text.trim()) {
          return;
        }
        let suggestion = this.findSuggestion(this.suggestion.category, this.suggestion.text);
        if (suggestion && suggestion.id && suggestion.id !== this.suggestion.id) {
          this.$modal.show("dialog", {
            title: 'Duplicated suggestion',
            text: `“${this.suggestion.text}“ suggestion already exists.`,
            buttons: [
              {
                title: 'Ok',
                handler: () => {
                  this.$modal.hide('dialog');
                },
                class: 'btn btn-primary'
              }
            ]
          });
          return;
        }
        this.$emit('save', this.suggestion);
      },
      cancel() {
        this.$emit('cancel');
      },
      textChange(ev) {
        this.$forceUpdate();
      },
      ...mapActions('ttsModule', ['getTTSVoices', 'generateExample'])
    },
    watch: {
      "reset": {
        handler(val) {
          if (val) {
            this.$refs['voice_select'].value = '';// trick to reset selection
            this.reset = false;
          }
        }
      }
    }
  }
</script>
<style lang="less">
  .edit-suggestion {
    border-top: 2px solid #D9D9D9;
    &>div {
      width: 90%;
      padding: 2px 4px;
      margin: 2px 4px;
    }
    input[type="text"] {
      width: 100%;
      height: 34px;
      border: 1px solid #D9D9D9;
      border-radius: 5px;
    }
    .voice-select-el {
      display: inline-block;
      width: 70%;
      .test-tts-voice {
        background: url(/static/tts-catalog/play-big.png);
        width: 34px;
        height: 34px;
        border: none;
        margin: 0px 5px;
      }
    }
    .clear-suggestion {
      background: url(/static/suggestions/clear.png);
      width: 40px;
      height: 34px;
      border: none;
      vertical-align: middle;
    }
    .save-suggestion {
      background: url(/static/tts-catalog/save-voice.png);
      width: 41px;
      height: 34px;
      border: none;
      margin: 0px 5px;
      vertical-align: middle;
      &:disabled {
        opacity: 0.5;
      }
    }
  }
</style>