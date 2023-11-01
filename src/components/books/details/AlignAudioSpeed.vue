<template>
  <div class="audio-speed-data" v-if="isComponentEnabled">
    <Accordion :activeIndex="accordionContainerExpanded">
      <AccordionTab :header="audioSpeedSettingLabel">
        <div class="audio-speed-type">
          <div class="audio-speed-option">
            <label>
              <input type="radio" v-model="align_wpm_type" value="original"/><span>Original</span>
            </label>
          </div>
          <div class="audio-speed-option">
            <label>
              <input type="radio" v-model="align_wpm_type" value="custom"/><span>Custom ({{custom_wpm_min}}&nbsp;-&nbsp;{{custom_wpm_max}}&nbsp;wpm)</span>
            </label>
          </div>
        </div>
        <template v-if="align_wpm_type === 'custom'">
          <div class="wpm-slider-container">
            <Slider v-model="custom_wpm" 
              :min="custom_wpm_min" 
              :max="custom_wpm_max" 
              :step="1"
              v-on:change="settingsChangedDebounced" />
          </div>
          <div class="custom-wpm-controls">
            <button class="minus" :disabled="custom_wpm <= custom_wpm_min" v-on:click="decreaseCustomWPM"></button>
            <input type="number" :value="custom_wpm" class="custom-wpm-input" v-on:change="inputWPMManually" v-on:focusout="inputWPMFocusout" v-on:keydown="inputWPMKeydown" />
            <button class="plus" :disabled="custom_wpm >= custom_wpm_max" v-on:click="increaseCustomWPM"></button>
          </div>
        </template>
        <template v-else>
          <div class="wpm-slider-container">
            <Slider v-model="custom_wpm" :min="custom_wpm_min" :max="custom_wpm_max" disabled />
          </div>
          <div class="custom-wpm-controls">
            <button class="minus" disabled></button>
            <input type="number"  class="custom-wpm-input" disabled />
            <button class="plus" disabled></button>
          </div>
        </template>
      </AccordionTab>
    </Accordion>
  </div>
</template>
<script>
  import Vue from 'vue';
  import { mapGetters, mapActions, mapMutations } from 'vuex';
  import Slider from 'primevue/slider';
  import lodash from 'lodash';
  import Accordion from 'primevue/accordion';
  import AccordionTab from 'primevue/accordiontab';
  import access from '../../../mixins/access';
  export default {
    data() {
      return {
        align_wpm_type: '',
        custom_wpm: 0,
        custom_wpm_min: 100,
        custom_wpm_max: 180,
        accordionContainerExpanded: 1
      }
    },
    components: {
      'Slider': Slider,
      'Accordion': Accordion,
      'AccordionTab': AccordionTab
    },
    props: ['audio_type', 'is_catalog_active'],
    mixins: [access],
    mounted() {
      this.loadUserWpmSettings();
      this.setUserWpmSettings(false);
    },
    computed: {
      audioSpeedSettingLabel: {
        get() {
          return `Audio speed: ${this.align_wpm_type}` + (this.align_wpm_type === 'custom' ? ` ${this.custom_wpm}` + ' wpm' : '');
        },
        cache: false
      },
      isComponentEnabled: {
        get() {
          return this.adminOrLibrarian || this._is('editor', true);
        },
        cache: false
      },
      ...mapGetters('userActions', ['userAlignWpmSettings', 'updatingAudioSpeed']),
      ...mapGetters(['user', 'currentBookid', 'adminOrLibrarian'])
    },
    methods: {
      inputWPMManually(e) {
        e.preventDefault();
        if (isNaN(e.target.value) || e.target.value.length === 0) {
          e.target.value = this.custom_wpm;
          return;
        }
        let newVal = parseInt(e.target.value);
        if (!newVal) {
          newVal = this.custom_wpm_min;
        }
        if (newVal < this.custom_wpm_min) {
          newVal = this.custom_wpm;
        }
        if (newVal > this.custom_wpm_max) {
          newVal = this.custom_wpm;
        }
        this.custom_wpm = newVal;
        if (newVal !== e.target.value) {
          e.target.value = newVal;
        }
        this.settingsChanged();
      },
      inputWPMFocusout(ev) {
        let value = ev.target.value;
        if (value > this.custom_wpm_max && this.custom_wpm === this.custom_wpm_max) {
          ev.target.value = this.custom_wpm;
        } else if (value < this.custom_wpm_min && this.custom_wpm === this.custom_wpm_min) {
          ev.target.value = this.custom_wpm_min;
        }
      },
      inputWPMKeydown() {
        this.set_updatingAudioSpeed(true);
      },
      increaseCustomWPM() {
        if (this.custom_wpm < this.custom_wpm_max) {
          ++this.custom_wpm;
          this.settingsChanged();
        }
      },
      decreaseCustomWPM() {
        if (this.custom_wpm > this.custom_wpm_min) {
          --this.custom_wpm;
          this.settingsChanged();
        }
      },
      settingsChanged() {
        this.$emit('settingsChanged', {
          type: this.align_wpm_type,
          wpm: this.custom_wpm,
        });
      },
      settingsChangedDebounced: lodash.debounce(function(wpm) {
        this.settingsChanged();
        this.setUserWpmSettings();
      }, 300),
      setUserWpmSettings(save = true) {
        this.user.alignWpmSettings = this.user.alignWpmSettings || {};
        this.user.alignWpmSettings[this.currentBookid] = this.user.alignWpmSettings[this.currentBookid] || {};
        let settings = {};
        settings[this.audio_type] = {type: this.align_wpm_type, wpm: this.custom_wpm};
        /*console.log(`${JSON.stringify(settings)};
${JSON.stringify(this.user.alignWpmSettings[this.currentBookid])}`);*/
        let differentSetting = !lodash.isEqual(this.user.alignWpmSettings[this.currentBookid][this.audio_type], settings[this.audio_type]);
        this.user.alignWpmSettings[this.currentBookid] = lodash.assign(this.user.alignWpmSettings[this.currentBookid], settings);
        this.set_updatingAudioSpeed(false);
        if (save && differentSetting) {
          this.updateUser([this.user._id, {alignWpmSettings: this.user.alignWpmSettings}]);
        }
      },
      loadUserWpmSettings() {

        let alignWpmSettings = this.userAlignWpmSettings(this.audio_type);
        //this.alignWpmSettings = lodash.assign(this.alignWpmSettings, alignWpmSettings);

        this.align_wpm_type = alignWpmSettings.type;
        this.custom_wpm = alignWpmSettings.wpm;
      },
      ...mapActions('userActions', ['updateUser']),
      ...mapMutations('userActions', ['set_updatingAudioSpeed'])
    },
    watch: {
      /*'type': {
        handler(val) {
          this.align_wpm_type = this.type;
        }
      },
      'wpm': {
        handler(val) {
          this.custom_wpm = this.wpm;
        }
      }*/
      'align_wpm_type': {
        handler(val, oldVal) {
          if (oldVal) {
            if (this.align_wpm_type === 'original') {// to set slider to position
              this.custom_wpm = 0;
            } else {
              this.custom_wpm = 140;
            }
          }
          this.setUserWpmSettings();
        }
      },
      'custom_wpm': {
        handler(val) {
          if (this.align_wpm_type === 'custom') {
            //this.setUserWpmSettings();
            this.settingsChangedDebounced();
          }
        }
      },
      'currentBookid': {
        handler(val) {
          if (val) {
            this.loadUserWpmSettings();
          }
        }
      },
      'is_catalog_active': {
        handler(val) {
          if (!val) {
            this.accordionContainerExpanded *= -1;
          }
        }
      }
    }
  }
</script>
<style lang="less">
  .audio-speed-data {
    .p-accordion-header {
      outline: none;
      border: none;
      &:focus {
        outline: none;
        border: none;
      }
      .p-accordion-header-link {
        border: none !important;
        outline: none !important;
        &:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          text-decoration: none;
        }
      }
    }
    .audio-speed-type {
      .audio-speed-option {
        display: inline-block;
        padding-right: 20px;
        input {
          margin-right: 10px;
          /*vertical-align: middle;*/
          margin-top: 3px;
        }
        span {
          display: inline-block;
          vertical-align: top;
        }
      }
    }
    .wpm-slider-container {
      margin: 10px 0px;
    }
    .custom-wpm-controls {
      margin: 10px 0px;
      .custom-wpm-input {
        max-width: 5rem;
        padding: 0.5rem;
        /* border: none; */
        border-width: 1px 1px;
        /* font-size: 2rem; */
        height: 2rem;
        font-weight: bold;
        text-align: center;
        color: #3498db;
        appearance: textfield;
        -webkit-appearance: textfield;
        -moz-appearance: textfield;
      }
      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
      }
      button {
        outline:none;
        -webkit-appearance: none;
        background-color: transparent;
        border: none;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        cursor: pointer;
        margin: 0;
        position: relative;
        /*box-shadow: 0px 0px 1px #474747;
        border-radius: 50%;*/
        vertical-align: super;
        &.minus:disabled, &.plus:disabled {
          background-color: inherit !important;
          &:before, &:after {
            color: gray;
            background-color: gray;
          }
        }
      }

      button:before,
      button:after {
        display: inline-block;
        position: absolute;
        content: '';
        width: 1rem;
        height: 2px;
        background-color: #3498db;
        transform: translate(-50%, -50%);
      }
      button.plus:after {
        transform: translate(-50%, -50%) rotate(90deg);
      }
    }
  }
</style>