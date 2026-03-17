<template>
<div class="voice-filters-main-wrapper">
  <div class="voice-filters-first-row" ref="voiceFiltersFirstRow">
    <!-- Voice Filter -->
    <div v-if="showVoiceFilters" class="voice-filters-text-filter">
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
    <MultiSelect v-if="mapVoiceFilterLanguages.length > 1"
      v-model="multiVoiceFilters.language"
      :options="mapVoiceFilterLanguages" optionLabel="caption"
      data-captions="Languages" placeholder="Language"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <!-- Accent Dropdown -->
    <MultiSelect v-if="mapVoiceFilterAccents.length > 1"
      v-model="multiVoiceFilters.accent"
      :options="mapVoiceFilterAccents" optionLabel="caption"
      data-captions="Languages" placeholder="Accent"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <!-- Age Dropdown -->
    <MultiSelect v-if="mapVoiceFilterLibraries.age.length > 1"
      v-model="multiVoiceFilters.age"
      :options="mapVoiceFilterLibraries.age" optionLabel="caption"
      data-captions="Languages" placeholder="Age"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <!-- Gender Dropdown -->
    <MultiSelect v-if="mapVoiceFilterLibraries.gender.length > 1"
      v-model="multiVoiceFilters.gender"
      :options="mapVoiceFilterLibraries.gender" optionLabel="caption"
      data-captions="Languages" placeholder="Gender"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />

    <!-- Notice Dropdown -->
    <MultiSelect v-if="mapVoiceFilterLibraries.notice.length > 1"
      v-model="multiVoiceFilters.notice"
      :options="mapVoiceFilterLibraries.notice" optionLabel="caption"
      data-captions="Languages" placeholder="Notice"
      display="chip" :showToggleAll="false"
      @change="filterVoiceChange" />
  </div>
</div>
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
      scrollable: {
        type: Boolean,
        default: false
      },
      onAddTab: {
        type: Function,
        default: function(){}
      }
    },
    data() {
      return {
        showVoiceFilters: true,
        languages: Languages,
      };
    },
    watch: {},
    mounted() {
      console.log(`${__filename.slice(-30)}:mounted:elevenLabsVoicesFilters: `);
    },
    updated() {},
    methods: {
      filterVoiceChange (key, $event) {
        const newFilters = Object.entries(this.multiVoiceFilters).reduce((acc, [key, val])=>{
          acc[key] = val.map((el)=>el.value);
          return acc;
        }, {});
        if (key && key === 'filter') {
          newFilters.page = 0;
          newFilters.filter = $event ? $event.target.value : '';
        }
        this.$store.commit('elevenLabsVoicesFilters/set_voiceFilters', newFilters);


        this.changeFilterVisual();
      },

      filterChangeVoiceDescriptionDebounce: _.debounce(function (key, $event) {
        this.filterVoiceChange(key, $event)
      }, 300),

      cleanFilterVal (key) {
        // To unlink chain between the input value and the model because of debounce
        if (this.$refs[key]) {
          this.$refs[key].value = '';
        }
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
        voiceFilters:            'elevenLabsVoicesFilters/voiceFilters',
        multiVoiceFilters:       'elevenLabsVoicesFilters/multiVoiceFilters',
        mapVoiceFilterLanguages: 'elevenLabsVoicesFilters/mapVoiceFilterLanguages',
        mapVoiceFilterAccents:   'elevenLabsVoicesFilters/mapVoiceFilterAccents',
        mapVoiceFilterLibraries: 'elevenLabsVoicesFilters/mapVoiceFilterLibraries',
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
    }

    .p-component.p-multiselect {
      margin-bottom: 10px;
    }
  }
}

</style>
