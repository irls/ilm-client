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
        <div class="audio-voice-header">
          <h4 class="audio-voice-caption">Character voice:</h4>
          <div class="audio-voice-select">
            <span @click="elevenLabFiltersModalShow = true"
              class="audio-voice-select-btn">Select voices</span>
          </div>
        </div>
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

        <eleven-lab-filters-modal v-if="elevenLabFiltersModalShow"
          @close_modal="elevenLabFiltersModalShow = false"
          :languages="[]">
        </eleven-lab-filters-modal>

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
    <!--<GenerateVoice
      ref="generateVoice"
      :playing_generated_example = "playing_generated_example"
      :book_voices = "book_voices"
      @stopVoiceExample = "stopVoiceExample"
    />-->
  </div>
</template>
<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from 'vuex';
  import SelectTTSVoice from '../../generic/SelectTTSVoice_el';
  import Slider from 'primevue/slider';
  import lodash from 'lodash';

  import AlignAudioSpeed from './tts/AlignAudioSpeed.vue';
  import ElevenLabFiltersModal from './tts/11LabFiltersModal.vue';
  //import GenerateVoice   from './tts/GenerateVoice.vue';
  //import v_modal from 'vue-js-modal';

  //Vue.use(v_modal, { dialog: true });
  const ALIGN_TIMEOUT = 3*1000;

  export default {
    data() {
      return {
        all_voices: [],
        audio_element: null,
        book_voices: [],
        editing_voice_id: null,
        editing_voice_name: '',
        audio_playing: false,
        generating_example: null,
        audio_playing_type: null,
        audio_playing_voice: null,
        alignWpmSettings: {
          type: 'custom',
          wpm: 140
        },
        alignStartedTimeout: null,
        is_voice_wpm_calculating: false,
        playing_generated_example: false,
        elevenLabFiltersModalShow: false
      }
    },
    components: {
      'select-tts-voice': SelectTTSVoice,
      'Slider': Slider,
      'AlignAudioSpeed': AlignAudioSpeed,
      'eleven-lab-filters-modal': ElevenLabFiltersModal
      //'GenerateVoice': GenerateVoice
    },
    props: ['is_active'],
    computed: {
      ...mapGetters(['currentBookMeta', 'blockSelection', 'alignCounter', 'aligningBlocks', 'currentBookid', 'user']),
      ...mapGetters('ttsModule', ['tts_voices']),
      alignProcess: {
        get() {
          let hasBlock = this.aligningBlocks.find(blk => {
            return blk.voicework === 'tts';
          });
          return hasBlock;
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
          if (this.$refs?.generateVoice) {
            this.$refs.generateVoice.resetNewVoiceSettings();
          }
        });
      window.addEventListener('resize', this.setMaxContainerHeight);
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

      alignWpmSettingsChanged(data) {
        this.alignWpmSettings.type = data.type;
        this.alignWpmSettings.wpm = data.wpm;
      },
      ...mapActions(['updateBookMeta']),
      ...mapActions('ttsModule', ['getNewVoiceSettings', 'getTTSVoices', 'removeVoice', 'updateVoice', 'calculateVoiceWpm'])
    },

    watch: {
      'currentBookid': {
        handler(val) {
          if (val) {
            this.loadBookVoices();
            if (this.$refs?.generateVoice) {
              this.$refs.generateVoice.resetNewVoiceSettings();
            }
          }
        }
      },
      'is_active': {
        handler(val) {
          if (val) {
            this.setMaxContainerHeight();
          }
        }
      },
      'alignProcess': {
        handler(val, oldVal) {
          if (val) {
            this.is_voice_wpm_calculating = true;
          }
        }
      },
      'aligningBlocks': {
        handler(val, oldVal) {
          if (val.length < oldVal.length) {
            const hasBlock = oldVal.find(blk => {
              return blk.voicework === 'tts';
            });
            if (hasBlock) {
              this.onCalculateVoiceWpm();
            }
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
  .eleven-labs-tts {
    .audio-voice-header {
      display: flex;
      flex-direction: row;
      height: 40px;
    }

    .audio-voice-caption {
      margin-left: 20px;
      flex-grow: 1;
    }

    .audio-voice-select {
      align-items: center;
      display: flex;
      padding-right: 6px;
      padding-top: 1px;

      .audio-voice-select-btn {
        color: #337AB7;
        font-weight: 400;

        &:hover {
          text-decoration: underline;
          cursor: pointer;
        }
      }
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
        padding: 6px 5px;
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
