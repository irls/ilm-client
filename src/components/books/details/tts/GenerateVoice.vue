<template>
  <fieldset>
    <legend>
      Generate voice
    </legend>
    <table class="generate-voice table-stripped table-bordered">
      <tbody>
        <tr>
          <td>
            Gender
          </td>
          <td>
            <select v-model="new_voice.gender">
              <option v-for="gender in new_voice_settings.gender" :value="gender.value">{{gender.name}}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>
            Age
          </td>
          <td>
            <select v-model="new_voice.age">
              <option v-for="age in new_voice_settings.age" :value="age.value">{{age.name}}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>
            Accent
          </td>
          <td>
            <select v-model="new_voice.accent">
              <option v-for="accent in new_voice_settings.accent" :value="accent.value">{{accent.name}}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>
            Accent<br>Strength
          </td>
          <td>
            <div class="slider-container">
              <Slider v-if="new_voice_settings.accent_strength" v-model="new_voice.accent_strength"
                :min="new_voice_settings.accent_strength.min"
                :max="new_voice_settings.accent_strength.max"
                :step="0.1"></Slider>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="new-voice-data">
      <span v-if="generating_voice" class="preloader -generating-voice"></span>
      <template v-else>
        <button class="play-voice -stop" v-on:click="stopVoiceExample" v-if="playing_generated_example"></button>
        <button class="play-voice" v-on:click="startGenerateVoice()" v-else></button>
      </template>
      <input type="text" v-model="new_voice.name" :maxlength="new_name_maxlength" class="new-voice-name" placeholder="Define Voice Name" />
      <span class="name-length">{{new_voice.name.length}}/{{new_name_maxlength}}</span>
      <span class="preloader -creating-voice" v-if="creating_voice"></span>
      <button class="save-voice" :disabled="saveNewVoiceDisabled" v-on:click="saveNewVoice()" v-else title="Save Voice"></button>
    </div>
    <div class="book-voices">
      <div class="book-voice" v-for="voice in book_voices">
        <div class="book-voice-option -play">
          <span class="preloader -generating-example" v-if="generating_example === voice.voice_id"></span>
          <template v-else>
            <button class="play-voice -stop" v-if="audio_playing_voice === voice.voice_id" v-on:click="stopVoiceExample"></button>
            <button class="play-voice" v-on:click="playVoiceExample(voice.voice_id)" v-else></button>
          </template>
        </div>
        <div class="book-voice-option -name" v-on:dblclick="setEditingVoice(voice)">
          <input v-model="editing_voice_name" v-if="editing_voice_id === voice.id" class="editing-voice-name"
            :maxlength="new_name_maxlength"
            v-on:change="saveVoice()"
            v-on:blur="setEditingVoice(null)" />
          <span class="book-voice-name" v-else>{{voice.name}}</span>
        </div>
        <div class="book-voice-option">
          <button class="delete-voice" v-on:click="checkDeleteVoice(voice)" title="Delete Voice"></button>
        </div>
      </div>
    </div>
  </fieldset>
</template>
<script>
  import Vue from 'vue';
  import { mapGetters, mapActions, mapMutations } from 'vuex';
  import lodash from 'lodash';
  import Slider from 'primevue/slider';
  export default {
    data() {
      return {
        new_voice: {
          gender: '',
          age: '',
          accent: '',
          accent_strength: 0,
          name: ''
        },
        creating_voice: false,
        new_name_maxlength: 30,
        generating_voice: false,
        generated_voice_url: '',
        generated_voice_id: null,
      }
    },
    components: {
      'Slider': Slider,
    },
    props: [
      'playing_generated_example',
      'book_voices'
    ],
    mixins: [],
    mounted() {
    },
    computed: {
      saveNewVoiceDisabled: {
        get() {
          return this.generated_voice_url.length === 0 || this.new_voice.name.length === 0 || this.new_voice.name.replace(/\s+/, '').length === 0;
        },
        cache: false
      },
      ...mapGetters('ttsModule', ['new_voice_settings']),
    },
    methods: {
      //...mapActions('userActions', ['updateUser'])
      ...mapActions('ttsModule', ['getNewVoiceSettings', 'getTTSVoices', 'generateVoice', 'saveGeneratedVoice', 'removeVoice', 'updateVoice', 'generateExample', 'calculateVoiceWpm']),
      resetNewVoiceSettings() {
        if (this.new_voice_settings.gender) {
          this.new_voice.gender = this.new_voice_settings.gender[0].value;
        }
        if (this.new_voice_settings.age) {
          this.new_voice.age = this.new_voice_settings.age[0].value;
        }
        if (this.new_voice_settings.accent) {
          this.new_voice.accent = this.new_voice_settings.accent[0].value;
        }
        if (this.new_voice_settings.accent_strength) {
          this.new_voice.accent_strength = this.new_voice_settings.accent_strength.min;
        }
        this.new_voice.name = '';
      },
      startGenerateVoice() {
        if (this.generated_voice_url) {
          this.playGeneratedVoice();
        } else {
          this.generating_voice = true;
          let request = lodash.cloneDeep(this.new_voice);
          //request.accent_strength /= 100;
          //console.log(request);
          //return {};
          return this.generateVoice(request)
            .then(response => {
              this.generated_voice_url = response.generated_voice_url;
              this.generated_voice_id = response.generated_voice_id;
              this.generating_voice = false;
              this.playGeneratedVoice();
            })
            .catch(err => {
              this.generating_voice = false;
            })
        }
      },
      saveNewVoice() {
        let voice = lodash.cloneDeep(this.new_voice);
        voice.generated_voice_id = this.generated_voice_id;
        voice.voice_name = voice.name;
        voice.category = 'generated';
        this.creating_voice = true;
        return this.saveGeneratedVoice(voice)
          .then(() => {
            this.creating_voice = false;
            this.generated_voice_id = null;
            this.new_voice.name = '';
            this.generated_voice_url = '';
            this.loadBookVoices();
          })
          .catch(err => {
            this.creating_voice = false;
          });
      },
      playGeneratedVoice() {
        //if (this.audio_playing) {
          //return;
        //}
        this.$emit('stopVoiceExample');
        if (this.generated_voice_url) {
          this.checkCreateAudioElement();
          //console.log(process.env.ILM_API + this.generated_voice_url);
          this.audio_element.src = process.env.ILM_API + this.generated_voice_url;
          this.audio_playing = true;
          this.audio_element.play();
          this.playing_generated_example = true;
        }
      },
    },
    watch: {
      /*'type': {
        handler(val) {
          this.align_wpm_type = this.type;
        }
      },*/
      'new_voice.gender': {
        handler() {
          this.generated_voice_url = '';
        },
        deep: true
      },
      'new_voice.age': {
        handler() {
          this.generated_voice_url = '';
        },
        deep: true
      },
      'new_voice.accent': {
        handler() {
          this.generated_voice_url = '';
        },
        deep: true
      },
      'new_voice.accent_strength': {
        handler() {
          this.generated_voice_url = '';
        },
        deep: true
      },
    }
  }
</script>
<style lang="less" scoped>

</style>
