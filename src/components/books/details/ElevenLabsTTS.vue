<template>
  <div class="eleven-labs-tts">
    <fieldset>
      <legend>
        Align text with TTS audio
      </legend>
      <AlignAudioSpeed
        :audio_type="'tts'"
        :is_catalog_active="is_active"
        :selected_voice_params="selected_voice_params"
        :is_voice_wpm_calculating="is_voice_wpm_calculating"
        @onCalculateVoiceWpm = "onCalculateVoiceWpm"/>

      <div v-if="all_voices.length > 0">
        <h4 class="audio-voice-caption">Character voice:</h4>
        <div class="audio-voice-selection">
          <select-tts-voice
            :pre_selected="defaultVoice('paragraph')"
            :voices="all_voices"
            :block_type="'paragraph'"
            :generating_example="generating_example"
            :playing_type="audio_playing_type"
            @onSelect="onVoiceChange"
            @play="playVoiceExample"
            @stop="stopVoiceExample"
          ></select-tts-voice>
        </div>
      </div>

      <!--https://isddesign.atlassian.net/wiki/spaces/ILM/pages/4186407098/TTS+Audio+speed#11Labs-TTS-audio-speed
      https://isddesign.atlassian.net/browse/ILM-7167
      Reduce selected voice to the one-->
      <table v-if="false" class="table table-striped table-bordered table-voices">
        <thead>
          <tr>
            <th>Block</th><th>Voice</th>
          </tr>
        </thead>
        <tbody v-if="all_voices.length > 0">
          <tr>
            <td>Title</td>
            <td>
              <select-tts-voice
                :pre_selected="defaultVoice('title')"
                :voices="all_voices"
                :block_type="'title'"
                :generating_example="generating_example"
                :playing_type="audio_playing_type"
                @onSelect="onVoiceChange"
                @play="playVoiceExample"
                @stop="stopVoiceExample"
              ></select-tts-voice>
            </td>
          </tr>
          <tr>
            <td>Header</td>
            <td>
              <select-tts-voice
                :pre_selected="defaultVoice('header')"
                :voices="all_voices"
                :block_type="'header'"
                :generating_example="generating_example"
                :playing_type="audio_playing_type"
                @onSelect="onVoiceChange"
                @play="playVoiceExample"
                @stop="stopVoiceExample"
              ></select-tts-voice>
            </td>
          </tr>
          <tr>
            <td>Paragraph</td>
            <td>
              <select-tts-voice
                :pre_selected="defaultVoice('paragraph')"
                :voices="all_voices"
                :block_type="'paragraph'"
                :generating_example="generating_example"
                :playing_type="audio_playing_type"
                @onSelect="onVoiceChange"
                @play="playVoiceExample"
                @stop="stopVoiceExample"
              ></select-tts-voice>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="selection-info">
        <div class="blocks-info">
          <template v-if="!blockSelection.start._id">
            0 blocks selected
          </template>
          <template v-else>
            {{alignCounter.countTTS}} TTS block(s) in range
            <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> -
            <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a>
          </template>
        </div>
        <div class="align-blocks-section">
          <button :class="['align-blocks', {'align-blocks-gray':alignProcess}]" :disabled="isAlignButtonDisabled" v-on:click="startAlign" title="Align Text with TTS Audio"></button>
          <!--<button class="cancel-align" v-if="alignProcess" v-on:click="cancelAlign()" title="Cancel Alignment">
            <i class="fa fa-ban"></i>-->
          </button>
        </div>
      </div>
    </fieldset>
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
  </div>
</template>
<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from 'vuex';
  import SelectTTSVoice from '../../generic/SelectTTSVoice_el';
  import Slider from 'primevue/slider';
  import lodash from 'lodash';
  import AlignAudioSpeed from './AlignAudioSpeed.vue';
  //import v_modal from 'vue-js-modal';

  //Vue.use(v_modal, { dialog: true });
  const ALIGN_TIMEOUT = 3*1000;

  export default {
    data() {
      return {
        all_voices: [],
        new_voice: {
          gender: '',
          age: '',
          accent: '',
          accent_strength: 0,
          name: ''
        },
        new_name_maxlength: 30,
        generating_voice: false,
        generated_voice_url: '',
        generated_voice_id: null,
        audio_element: null,
        book_voices: [],
        editing_voice_id: null,
        editing_voice_name: '',
        creating_voice: false,
        audio_playing: false,
        generating_example: null,
        audio_playing_type: null,
        audio_playing_voice: null,
        playing_generated_example: false,
        alignWpmSettings: {
          type: 'custom',
          wpm: 140
        },
        alignStartedTimeout: null,
        is_voice_wpm_calculating: false
      }
    },
    components: {
      'select-tts-voice': SelectTTSVoice,
      'Slider': Slider,
      'AlignAudioSpeed': AlignAudioSpeed
    },
    props: ['is_active'],
    computed: {
      ...mapGetters(['currentBookMeta', 'blockSelection', 'alignCounter', 'aligningBlocks', 'currentBookid', 'user']),
      ...mapGetters('ttsModule', ['new_voice_settings', 'tts_voices']),
      alignProcess: {
        get() {
          let hasBlock = this.aligningBlocks.find(blk => {
            return blk.voicework === 'tts';
          });
          return hasBlock;
        },
        cache: false
      },
      saveNewVoiceDisabled: {
        get() {
          return this.generated_voice_url.length === 0 || this.new_voice.name.length === 0 || this.new_voice.name.replace(/\s+/, '').length === 0;
        },
        cache: false
      },
      isAlignButtonDisabled: {
        get() {
          return this.alignCounter.countTTS === 0 || this.alignStartedTimeout !== null;
        }
      },
      selected_voice_params: {
        get() {
          return this.all_voices.find((voice)=>voice.voice_id === this.currentBookMeta.voices['paragraph']);
        }
      }
    },
    mounted() {
      this.loadBookVoices();
      this.getNewVoiceSettings()
        .then(() => {
          this.resetNewVoiceSettings();
        });
      window.addEventListener('resize', this.setMaxContainerHeight);
      let accentElement = document.querySelector('.generate-voice .slider-container');
      accentElement.addEventListener('click', () => {
        let sliderHandler = accentElement.querySelector('.p-slider-handle');
        sliderHandler.focus();
      });
      this.$root.$on('from-audioeditor:visible', this.setMaxContainerHeight);
      this.$root.$on('from-audioeditor:content-loaded', this.setMaxContainerHeight);
    },
    destroyed() {
      this.$root.$off('from-audioeditor:visible', this.setMaxContainerHeight);
      this.$root.$off('from-audioeditor:content-loaded', this.setMaxContainerHeight);
    },
    methods: {
      waitUntilNextAlignAllowed() {
        this.alignStartedTimeout = window.setTimeout(()=>{
          clearTimeout(this.alignStartedTimeout);
          this.alignStartedTimeout = null;
        }, ALIGN_TIMEOUT);
      },
      defaultVoice(type) {
        return this.currentBookMeta.voices ? this.currentBookMeta.voices[type] : '';
      },
      onVoiceChange(type, voice_id) {
        if (this.audio_playing_type === type) {
          this.stopVoiceExample();
        }
        this.currentBookMeta.voices[type] = voice_id;
        this.updateBookMeta({voices: this.currentBookMeta.voices});

        //if (this.selected_voice_params && !this.selected_voice_params.wpm) {
          // this.calculateVoiceWpm([this.selected_voice_params.voice_id])
          // .then((voice)=>{
          //   this.all_voices = this.all_voices.map((_v)=>{
          //     if (_v.voice_id === voice.voice_id) {
          //       _v.wpm = voice.wpm;
          //     }
          //     return _v;
          //   });
          // });
        //}
      },
      onCalculateVoiceWpm() {
        if (this.selected_voice_params && !this.selected_voice_params.wpm) {
          this.is_voice_wpm_calculating = true;
          this.calculateVoiceWpm([this.selected_voice_params.voice_id])
          .then((voice)=>{
            this.all_voices = this.all_voices.map((_v)=>{
              if (_v.voice_id === voice.voice_id) {
                _v.wpm = voice.wpm;
              }
              return _v;
            });
            this.is_voice_wpm_calculating = false;
          });
        }
      },
      startAlign() {
        this.$emit('alignTts');
        this.waitUntilNextAlignAllowed();
      },
      cancelAlign() {
        this.$emit('cancelAlign');
      },
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
      playGeneratedVoice() {
        //if (this.audio_playing) {
          //return;
        //}
        this.stopVoiceExample()
        if (this.generated_voice_url) {
          this.checkCreateAudioElement();
          //console.log(process.env.ILM_API + this.generated_voice_url);
          this.audio_element.src = process.env.ILM_API + this.generated_voice_url;
          this.audio_playing = true;
          this.audio_element.play();
          this.playing_generated_example = true;
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
        this.audio_playing_type = null;
        this.audio_playing_voice = null;
        this.playing_generated_example = false;
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
      deleteVoice(id) {
        return this.removeVoice(id)
          .then(() => {
            this.loadBookVoices();
          });
      },
      checkDeleteVoice(voice) {
        this.$root.$emit('show-modal', {
          title: 'Delete voice',
          text: 'Delete  ' + voice.name + '?',
          buttons: [
            {
              title: 'Delete',
              handler: () => {
                this.$root.$emit('hide-modal')
                this.deleteVoice(voice.id);
              },
              class: 'bnt btn-primary'
            },
            {
              title: 'Cancel',
              handler: () => {
                this.$root.$emit('hide-modal');
              },
              class: 'btn btn-default'
            }
          ]
        });
      },
      setEditingVoice(voice) {
        if (voice === null) {
          this.editing_voice_id = null;
          this.editing_voice_name = '';
          return;
        }
        if (voice.id !== this.editing_voice_id) {
          this.editing_voice_id = voice.id;
          this.editing_voice_name = voice.name;
          Vue.nextTick(() => {
            let element = document.querySelector('.book-voices .editing-voice-name');
            if (element) {
              element.focus();
            }
          });
        }
      },
      saveVoice() {
        if (this.editing_voice_id) {
          let update = {name: this.editing_voice_name.trim()};
          if (this.editing_voice_name.length === 0 || this.editing_voice_name.replace(/\s+/, '').length === 0) {
            this.setEditingVoice(null);
            return;
          }
          let id = this.editing_voice_id;
          let voice = this.book_voices.find(v => {
            return v.id === this.editing_voice_id;
          });
          if (voice) {
            voice.name = update.name;
          }
          this.setEditingVoice(null);
          return this.updateVoice([id, update])
            .then(() => {
              this.loadBookVoices();
            })
        }
      },
      playVoiceExample(voice_id, block_type = null, attempt = 0) {
        if (attempt >= 2) {
          return;
        }
        this.stopVoiceExample();
        //if (this.audio_playing) {
          //return;
        //}
        this.checkCreateAudioElement();
        let voice = this.all_voices.find(v => {
          return v.voice_id === voice_id;
        });
        if (voice && voice.voice_example) {
          this.audio_element.src = process.env.ILM_API + voice.voice_example;
          this.audio_playing = voice.voice_id;
          this.audio_playing_type = block_type;
          if (!block_type) {
            this.audio_playing_voice = voice.voice_id;
          }
          this.audio_element.play();
          return;
        }
        if (voice && !voice.example) {
          this.generating_example = voice.voice_id;
          return this.generateExample([voice.id])
            .then(response => {
              this.generating_example = null;
              return this.loadBookVoices();
            })
            .then(() => {
              return this.playVoiceExample(voice_id, ++attempt)
            })
            .catch(err => {
              this.generating_example = null;
              console.log(err);
            });
        }
      },
      stopVoiceExample() {
        if (this.audio_element) {
          this.audio_element.pause();
          this.clearPlayingAudio();
        }
      },
      setMaxContainerHeight() {
        // on open and resize set height to have scroll
        let containerHeight = 0;
        let container = document.querySelector('.sidebar');// main container for all section
        let element = document.querySelector('.eleven-labs-tts');
        if (container && element) {
          containerHeight = container.offsetHeight;
          let tabs = container.querySelector('.p-tabview-nav-content');// menu tabs
          if (tabs) {
            containerHeight-= tabs.offsetHeight;
          }
          let header = document.querySelector('.audio-integration-accordion .p-accordion-header');// headers in accordion
          if (header) {
            containerHeight-= header.offsetHeight * 3;
          }
          containerHeight-= 50;// margins and paddings
        }
        if (containerHeight && containerHeight > 0) {
          element.style['max-height'] = `${containerHeight}px`;
        };
      },
      goToBlock(blockid) {
        this.$root.$emit('for-bookedit:scroll-to-block', blockid);
      },
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
      alignWpmSettingsChanged(data) {
        this.alignWpmSettings.type = data.type;
        this.alignWpmSettings.wpm = data.wpm;
      },
      ...mapActions(['updateBookMeta']),
      ...mapActions('ttsModule', ['getNewVoiceSettings', 'getTTSVoices', 'generateVoice', 'saveGeneratedVoice', 'removeVoice', 'updateVoice', 'generateExample', 'calculateVoiceWpm'])
    },

    watch: {
      'currentBookid': {
        handler(val) {
          if (val) {
            this.loadBookVoices();
            this.resetNewVoiceSettings();
          }
        }
      },
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
      'is_active': {
        handler(val) {
          if (val) {
            this.setMaxContainerHeight();
          }
        }
      }
    }
  }
</script>
<style lang="less" scoped>
      .audio-voice-selection {
        background-color: rgb(238, 238, 238);
        padding-top: 4px;
        padding-bottom: 4px;

        .voice-select-el {
          margin-left: 20px;
           display: flex;
          align-items: center;
        }
      }
</style>
<style lang="less">
  .eleven-labs-tts {
    overflow-y: auto;
    &::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
      border-radius: 10px;
      background-color: #F5F5F5;
    }
    &::-webkit-scrollbar {
      width: 12px;
      background-color: #F5F5F5;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 10px;
      -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
      background-color: #555;
    }
    fieldset {
      border: 1px solid #b9b6b6;
      legend {
        margin: 0px;
        border: none;
        width: auto;
        font-size: 1.2rem;
      }
    }
    .audio-voice-caption {
      margin-left: 20px;
    }

    table {
      width: 95%;
      max-width: 95%;
      td {
        width: 30%;
      }

      td:nth-child(2) {
        width: 70%;
      }
    }
    .table.table-voices {
      margin: 0px 2px;

      thead {
        tr {

        }
        th {
          background-color: silver;
          padding-top: 2px;
          padding-bottom: 2px;
          border-bottom: none;
        }
      }
      tbody {
        tr:nth-child(odd) {
          background-color:#eee;
        }
        td {
          vertical-align: middle;
        }
      }
    }
    .selection-info {
      padding: 10px 15px;
      .blocks-info {
        display: inline-block;
        width: 70%;
        padding: 10px 5px;
        a {
          cursor: pointer;
        }
      }
      .align-blocks-section {
        text-align: right;
        display: inline-block;
        width: 25%;
        .align-blocks {
          background: url(/static/audio_editor/align.png);
          width: 41px;
          height: 34px;
          border: none;
          vertical-align: middle;
          padding: 8px 5px;
          &[disabled] {
            opacity: 0.5;
            cursor: not-allowed;
          }
          &.align-blocks-gray:not([disabled]) {
            /*opacity: 0.7;*/
          }
        }
        .cancel-align {
          width: 41px;
          height: 34px;
          padding: 8px 5px;
        }
        button {
          vertical-align: middle;
        }
      }
    }
    table.generate-voice {
      tbody {
        tr:nth-child(odd) {
          background-color:#eee;
        }
        td {
          vertical-align: middle;
          padding: 2px 5px;

          select {
            border: 1px solid #b9b6b6;
            color: #333;
            height: 31px;
            padding: 5px;
            width: 200px;
            border-radius: 5px;
            background-color: white;
          }
        }
        td:nth-child(2) {
          text-align: right;
          padding-right: 20px;
        }
      }
      .slider-container {
        padding: 0px 5px;
      }
    }
    .new-voice-data {
      padding: 5px 0px;
      .play-voice {
        background: url(/static/tts-catalog/play-big.png);
        width: 34px;
        height: 34px;
        border: none;
        margin: 0px 5px;
        &.-stop {
          background: url(/static/tts-catalog/stop-big.png);
        }
        &:focus {
          border: none;
          outline: none;
        }
      }
      .save-voice {
        background: url(/static/tts-catalog/save-voice.png);
        width: 41px;
        height: 34px;
        border: none;
        margin: 0px 5px;
        &[disabled] {
          cursor: not-allowed;
          opacity: 0.5;
        }
      }
      button {
        vertical-align: middle;
      }
      .new-voice-name {
        width: 290px;
        border-radius: 3px;
        border: 1px solid #D1D1D1;
        height: 34px;
        &::placeholder {
          font-style: italic;
          color: #99999b;
        }
        &:focus {
          outline: none;
        }
      }
      .name-length {
        display: inline-block;
        margin-left: -47px;
        width: 40px;
        text-align: right;
        color: #99999b;
      }
    }
    .book-voices {
      .book-voice {
        .book-voice-option {
          display: inline-block;
          vertical-align: middle;
          padding: 5px 7px;
          &.-name {
            width: 290px;
            padding: 1px 2px;
          }
          &.-play {
            padding-left: 11px;
          }
          .play-voice {
            background: url(/static/tts-catalog/play-small.png);
            width: 24px;
            height: 24px;
            border: none;
            &.-stop {
              background: url(/static/tts-catalog/stop-small.png);
            }
          }
          .delete-voice {
            background-image: url(/static/tts-catalog/delete-voice.png);
            width: 41px;
            height: 34px;
            border: 1px solid #D1D1D1;
            border-radius: 5px;
            background-color: #F0F0F0;
            background-repeat: no-repeat;
            background-position: center;
            &:focus {
              outline: none;
            }
          }
          .editing-voice-name {
            width: 100%;
            border-radius: 3px;
            border: 1px solid #D1D1D1;
            height: 34px;
            &:focus {
              border: 1px solid #D1D1D1;
              outline: none;
            }
          }
        }
      }
    }
    .preloader {
      background: url(/static/preloader-snake-small.gif);
      width: 34px;
      height: 34px;
      display: inline-block;
      background-repeat: no-repeat;
      background-position: center;
      vertical-align: middle;
      margin: 0px 5px;
      /*&.-generating-voice {
        margin: 0px 5px;
      }
      &.-creating-voice {

      }*/
      &.-generating-example {
        background: url(/static/preloader-snake-transparent-tiny.gif);
        background-repeat: no-repeat;
        background-position: center;
        width: 24px;
        margin: 0px 10px 0px 0px;
      }
    }
  }
  .vue-dialog {
    button {
      border: inherit;
      outline: none;
      &:focus {
        border: none;
        outline: none;
      }
    }
  }
</style>
