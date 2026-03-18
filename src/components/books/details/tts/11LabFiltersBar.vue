<template>
<div class="voice-filters-main-wrapper">
  <div class="voice-filters-first-row" ref="voiceFiltersFirstRow">
    <!-- Voice Filter -->
    <div class="voice-filters-text-filter">
      <input placeholder="Filter by voice name or description"
        ref="voiceFilters.filter" type="text"
        :class="['form-control voice-filter', {filled: voiceFilters.filter!=''}]"
        @keyup="filterChangeVoiceDescriptionDebounce('filter', $event)"
        @paste="filterChangeVoiceDescriptionDebounce('filter', $event)" ></input>
      <i class="ico ico-clear-filter btn-inside" aria-hidden="true"
        v-if="voiceFilters.filter!=''"
        @click="cleanFilterVal('voiceFilters.filter'); filterVoiceChange('filter');"></i>
    </div>

    <!-- Language Dropdown -->
    <MultiSelect v-if="mapVoiceFilterLanguages.length > 0"
      v-model="multiSelectVoiceModel.language"
      :selectionLimit="1" class="multi-select-language"
      :options="mapVoiceFilterLanguages" optionLabel="caption"
      data-captions="Languages" placeholder="Language"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <!-- Accent Dropdown -->
    <MultiSelect v-if="lengthVoiceFilterAccents > 0"
      v-model="multiSelectVoiceModel.accent"
      class="multi-select-accent"
      :options="mapVoiceFilterAccents" optionLabel="caption"
      data-captions="Accents" placeholder="Accent"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <div class="or-divider"><span>or</span></div>

    <!-- Native language Dropdown -->
    <MultiSelect v-if="mapVoiceFilterLanguages.length > 0"
      v-model="multiSelectVoiceModel.nativeLanguage"
      class="multi-select-native-lang"
      :options="mapVoiceFilterLanguages" optionLabel="caption"
      data-captions="Native languages" placeholder="Native language"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <!-- Gender Dropdown -->
    <MultiSelect v-if="mapVoiceFilterLibraries.gender.length > 0"
      v-model="multiSelectVoiceModel.gender"
      :selectionLimit="1" class="multi-select-gender"
      :options="mapVoiceFilterLibraries.gender" optionLabel="caption"
      data-captions="Genders" placeholder="Gender"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <!-- Age Dropdown -->
    <MultiSelect v-if="mapVoiceFilterLibraries.age.length > 0"
      v-model="multiSelectVoiceModel.age"
      :selectionLimit="1" class="multi-select-age"
      :options="mapVoiceFilterLibraries.age" optionLabel="caption"
      data-captions="Ages" placeholder="Age"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <!-- HQ Dropdown -->
    <MultiSelect v-if="mapVoiceFilterHQ.length > 0"
      v-model="multiSelectVoiceModel.hq"
      :selectionLimit="1" class="multi-select-hq"
      :options="mapVoiceFilterHQ" optionLabel="caption"
      data-captions="HQ" placeholder="HQ"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <!-- Notice Dropdown -->
    <MultiSelect v-if="mapVoiceFilterLibraries.notice.length > 0"
      v-model="multiSelectVoiceModel.notice"
      class="multi-select-notice"
      :options="mapVoiceFilterLibraries.notice" optionLabel="caption"
      data-captions="Notices" placeholder="Notice"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />
  </div>
  <!--<div class="voice-filters-first-row"-->
  <div class="voice-filters-second-row" ref="voiceFiltersSecondRow">
    <button class="btn btn-default" v-on:click="cleanFilterVal('voiceFilters.filter'); resetFilters(); filterVoiceChange('filter');">Reset filters</button>
    <button class="btn btn-primary" v-on:click="applyFilters">Filter</button>
  </div>
  <!--<div class="voice-filters-second-row"-->

</div>
<!--<div class="voice-filters-main-wrapper">-->
</template>

<script>

import _     from 'lodash';
import Vue   from 'vue';

import { mapGetters, mapActions } from 'vuex';
import { Languages } from "@src/mixins/lang_config.js"

import MultiSelect from 'primevue/multiselect';

export default {
    name: 'ElevenLabFiltersBar',
    props: {
      activeIndex: {
        type: Number,
        default: 0
      },
      onAddTab: {
        type: Function,
        default: function(){}
      }
    },
    data() {
      return {
      };
    },
    watch: {},
    mounted() {},
    updated() {},
    methods: {
      filterVoiceChange (key, $event) {
        const newFilters = Object.entries(this.multiSelectVoiceModel).reduce((acc, [key, val])=>{
          acc[key] = val.map((el)=>el.value);
          return acc;
        }, {});
        if (key && key === 'filter') {
          newFilters.page = 0;
          newFilters.filter = $event ? $event.target.value : '';
        }
        this.$store.commit('elevenLabsVoicesFilters/set_voiceFilters', newFilters);
        //console.log(`elevenLabsVoicesFilters/set_voiceFilters::: `, newFilters);
        this.changeFilterVisual();
      },

      filterChangeVoiceDescriptionDebounce: _.debounce(function (key, $event) {
        this.filterVoiceChange(key, $event)
      }, 300),

      applyFilters() {
        //this.$emit('applyFilters');
        this.$store.dispatch('elevenLabsVoicesModule/act_filterVoices');
      },

      cleanFilterVal (key) {
        // To unlink chain between the input value and the model because of debounce
        if (this.$refs[key]) {
          this.$refs[key].value = '';
        }
      },

      resetFilters () {
        this.$store.commit('elevenLabsVoicesFilters/set_resetVoiceFilters');
      },

      changeFilterVisual() {
        Vue.nextTick(()=>{
          const vFilters = this.$refs.voiceFiltersFirstRow.querySelectorAll('.p-multiselect-label-container .p-multiselect-label');
          for (const vContainer of vFilters) {
            const vTokens = vContainer.querySelectorAll('.p-multiselect-token');
            const maxTokens = 2;
            for (const [vIndex, vToken] of vTokens.entries()) {
              if (vIndex < maxTokens) {
                vToken.style.display = 'inline-block';
              } else {
                vToken.style.display = 'none';
              }
            }
            const moreCounterVal = vTokens.length - maxTokens;
            const moreCounterPrev = vContainer.querySelector('.p-multiselect-more-counter');
            if (moreCounterVal > 0) {
              if (moreCounterPrev) {
                moreCounterPrev.innerText = `+${moreCounterVal}`;
              } else {
                const counter = document.createElement('span');
                counter.className = 'p-multiselect-more-counter';
                counter.innerText = `+${moreCounterVal}`;
                vContainer.appendChild(counter);
              }
            } else {
              if (moreCounterPrev) {
                vContainer.removeChild(moreCounterPrev);
              }
            }
          }
        })
      },
    },
    computed: {
      ...mapGetters({
        voiceFilters:             'elevenLabsVoicesFilters/voiceFilters',
        multiSelectVoiceModel:    'elevenLabsVoicesFilters/multiSelectVoiceModel',
        mapVoiceFilterLanguages:  'elevenLabsVoicesFilters/mapVoiceFilterLanguages',
        mapVoiceFilterAccents:    'elevenLabsVoicesFilters/mapVoiceFilterAccents',
        lengthVoiceFilterAccents: 'elevenLabsVoicesFilters/lengthVoiceFilterAccents',
        mapVoiceFilterLibraries:  'elevenLabsVoicesFilters/mapVoiceFilterLibraries',
        mapVoiceFilterHQ:         'elevenLabsVoicesFilters/mapVoiceFilterHQ'
      }),
    },
    components: {
      MultiSelect
    },
    directives: {
    }
}
</script>

<style lang="less" scoped>

.voice-filters-main-wrapper {
  .voice-filters-first-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    .voice-filters-text-filter {
      width: 450px;
      margin-bottom: 10px;
      margin-right: 10px;

      input.form-control {
        display: inline;
        box-shadow: none;
        padding-top: 4px;
        padding-bottom: 4px;
        height: 32px;
      }

      input.form-control.voice-filter.filled {
        padding-right: 30px;
      }

      .btn-inside {
        margin-left: -26px;
        margin-top: 5px;
        z-index: 999;
        position: absolute;
      }
    }

    .p-component.p-multiselect {
      margin-bottom: 10px;
      margin-right: 10px;

      min-width: 14rem;
      border-radius: 4px;
      border: 1px solid #ccc;
      box-shadow: none;

      &.multi-select-language {
        min-width: 10rem;
      }
      &.multi-select-accent {

      }
      &.multi-select-gender {
        min-width: 10rem;
      }
      &.multi-select-age {
        min-width: 8rem;
      }
      &.multi-select-hq {
        min-width: 5rem;
      }
      &.multi-select-notice {
        min-width: 8rem;
      }
    }

    .or-divider {
      margin-bottom: 10px;
      margin-right: 10px;
      padding-top: 4px;
    }
  }

  .voice-filters-second-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;

    button.btn {
      margin-left: 15px;
    }
  }
}
</style>

<style lang="less">
.voice-filters-main-wrapper {
  .voice-filters-first-row {
    .p-component.p-multiselect.p-multiselect-chip {
      .p-multiselect-token {
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        margin-right: 0.5rem;
        background: #edebe9;
        color: #323130;

        .p-multiselect-token-icon {
          display: none;
          margin-left: 0.5rem;
        }
      }
    }
  }
  .p-component.p-multiselect {
    .p-multiselect-label.p-placeholder {
      color: #888;
      /*padding: 0.25rem 0.5rem;*/
    }
    &.multi-select-language,
    &.multi-select-gender,
    &.multi-select-age {
      .p-multiselect-label.p-placeholder {
        &:before {
          content: "*";
          color: red;
          vertical-align: middle;
          line-height: 1px;
        }
      }
    }
  }
}
</style>
