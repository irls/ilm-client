<template>
<div class="search-results-main-wrapper">
  <div v-if="!isReqFltrsSelected && isVoicesListLoaded" class="search-results-filter-non-selected">
    Voice filtering requires Language, Gender and Age to be selected.
  </div>
  <div v-if="isReqFltrsSelected && isVoicesListLoaded && mapVoicesList.length == 0"
    class="search-results-filter-empty">
      No voices match the selected criteria. Please refine your filters and try again.
  </div>

  <div v-if="!isVoicesListLoading" class="search-results-list-wrapper">
    <ul>
      <li v-for="(voice, idx) in mapVoicesList"
        :data-id="voice.voice_id" :key="voice.id">
        <div :class="['result-list-item', {'selected': voice.isSelected}]"
          @click="searchRowClick($event, voice)" >
          <div class="result-list-description-row">
            <div class="result-list-play-button">
              <button v-if="!isAudioPplaying(voice.voice_id)" class="audio-btn -play" @click="playVoiceExample($event, voice)"></button>
              <button v-if="isAudioPplaying(voice.voice_id)" class="audio-btn -pause" @click="pauseVoiceExample($event, voice)"></button>
            </div>
            <div class="result-list-name">
              <p class="list-details-name">{{voice.name}}</p>
              <p class="list-details-descr">{{voice.description}}</p>
            </div>
          </div>
          <div class="result-list-tags-row">
            <div class="result-tags-item">Language - {{labelLanguage(voice.language)}}</div>
            <div class="result-tags-item">Accent - {{labelAccent(voice.accent)}}</div>
            <div class="result-tags-item">Primary - {{labelLanguage(voice.verified_languages[0].language)}}</div>
            <div class="result-tags-item">{{labelGender(voice.gender)}}</div>
            <div class="result-tags-item">{{labelAge(voice.age)}}</div>
            <div class="result-tags-item" v-if="labelHQ(voice.category)">{{labelHQ(voice.category)}}</div>
            <div class="result-tags-item">{{labelNotice(voice.notice_period)}}</div>
          </div>
        </div>

        <p style="display: none;">{{voice.preview_url}}</p>
        <p style="display: none;">{{voice.voice_id}}</p>
      </li>
    </ul>
  </div>

</div>
<!--<div class="search-results-main-wrapper">-->
</template>

<script>

import _     from 'lodash';
import Vue   from 'vue';

import { mapGetters, mapActions } from 'vuex';
import { Languages } from "@src/mixins/lang_config.js"

export default {
    name: 'ElevenLabSearchResults',
    props: {
      character: {
        type: Object,
        default: null
      },
      activeIndex: {
        type: Number,
        default: 0
      },
      rowClick: {
        type: Function,
        default: function(){}
      },
      play: {
        type: Function,
        default: function(){}
      },
      stop: {
        type: Function,
        default: function(){}
      },
      audio_playing: {
        type: [String, Boolean],
        default: false
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
      playVoiceExample(event, voice) {
        event.stopPropagation();
        this.$emit('play', {event, voice, character: this.character})
      },
      pauseVoiceExample(event, voice) {
        event.stopPropagation();
        this.$emit('stop', {event, voice, character: this.character})
      },
      searchRowClick(event, voice) {
        this.$emit('rowClick', {event, voice, character: this.character})
      },
      isAudioPplaying (voice_id) {
        return this.audio_playing
            && this.audio_playing.trim().length
            && this.audio_playing.trim() === voice_id;
      },
      labelLanguage(langCode) {
        const filter = this.voiceFilterLanguages.find((_v)=>{
          return _v.value === langCode;
        });
        if (filter && filter.caption) return filter.caption;
        return langCode;
      },
      labelAccent(accentCode) {
        const filter = this.voiceFilterAccents.find((_v)=>{
          return _v.value === accentCode;
        });
        if (filter && filter.caption) return filter.caption;
        return accentCode;
      },
      labelGender(genderCode) {
        const filter = this.voiceFilterLibraries.gender.find((_v)=>{
          return _v.value === genderCode;
        });
        if (filter && filter.caption) return filter.caption;
        return genderCode;
      },
      labelAge(ageCode) {
        const filter = this.voiceFilterLibraries.age.find((_v)=>{
          return _v.value === ageCode;
        });
        if (filter && filter.caption) return filter.caption;
        return ageCode;
      },
      labelNotice(noticeCode) {
        const filter = this.voiceFilterLibraries.notice.find((_v)=>{
          return _v.value === ''+noticeCode;
        });
        if (filter && filter.caption) return filter.caption;
        return noticeCode;
      },
      labelHQ(hqCode) {
        const isHQ = hqCode && hqCode === 'high_quality';
        if (isHQ) {
          const filter = this.voiceFilterHQ.find((_v)=>{
            return _v.value === 'hq';
          });
          if (filter && filter.caption) return filter.caption;
        }
        return false;
      },
    },
    computed: {
      ...mapGetters({
        isVoicesListLoading: 'elevenLabsVoicesModule/isVoicesListLoading',
        isVoicesListLoaded:  'elevenLabsVoicesModule/isVoicesListLoaded',
        mapVoicesList:       'elevenLabsVoicesModule/mapVoicesList',

        voiceFilters:         'elevenLabsVoicesFilters/voiceFilters',
        isReqFltrsSelected:   'elevenLabsVoicesFilters/isReqFltrsSelected',
        voiceFilterLanguages: 'elevenLabsVoicesFilters/mapVoiceFilterLanguages',
        voiceFilterAccents:   'elevenLabsVoicesFilters/mapVoiceFilterAccents',
        voiceFilterLibraries: 'elevenLabsVoicesFilters/mapVoiceFilterLibraries',
        voiceFilterHQ:        'elevenLabsVoicesFilters/mapVoiceFilterHQ'
      }),
    },
    components: {
    },
    directives: {
    }
}
</script>

<style lang="less" scoped>

.search-results-main-wrapper {
  flex-grow: 1;
  min-height: 0; /* CRITICAL FIX: Allows it to shrink below content size */
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  margin-top: 10px;

  .search-results-filter-non-selected {
    color: red;
    text-align: center;
    padding-top: 10px;
  }

  .search-results-filter-empty {
    text-align: center;
    padding-top: 10px;
  }

  .search-results-list-wrapper {
    height: 100%;
    overflow-y: auto;

    ul {
      list-style-type: none;
      padding: 10px;
    }

    .result-list-item {
      padding-bottom: 12px;
      cursor: pointer;

      &:hover {
        background: #f4f4f4;
      }
      &.selected {
        background: #8FBC8F;
      }

      .result-list-description-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding-bottom: 8px;

        .result-list-name {
          flex-grow: 1;
          min-height: 0; /* CRITICAL FIX: Allows it to shrink below content size */

          p {
            margin-bottom: 0.5rem;
          }

          p.list-details-name {
            font-weight: 600;
          }
        }

        .result-list-play-button {
          padding-right: 10px;
          .audio-btn {
            cursor: pointer;
            border: none;
            width: 34px;
            height: 34px;
            margin: 0px;
            border-radius: 4px;

            &.-play {
              background: url(/static/audio_editor/play.png);
            }
            &.-pause {
              background: url(/static/audio_editor/pause.png);
            }
          }
        }
      }

      .result-list-tags-row {
        display: flex;
        flex-direction: row;

        .result-tags-item {
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          margin-right: 0.5rem;
          background: #edebe9;
          color: #323130;
        }
      }
    }

  }
}

</style>

<!--<style lang="less">

</style>-->
