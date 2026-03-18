<template>
<div class="search-results-main-wrapper">
  <div v-if="!isReqFltrsSelected" class="search-results-filter-non-selected">
    Voice filtering requires Language, Gender and Age to be selected.
  </div>
  <div v-if="!isReqFltrsSelected" class="search-results-filter-empty">
    No voices match the selected criteria. Please refine your filters and try again.
  </div>

  <div v-if="!voicesListLoading" class="search-results-list-wrapper">
    <ul>
      <li v-for="(voice, idx) in mapVoicesList" :data-id="voice.id" :key="voice.id">
        <div class="result-list-item">
          <div class="result-list-description-row">
            <div class="result-list-play-button">
              <button class="audio-btn -play"></button>
            </div>
            <div class="result-list-name">
              <p class="list-details-name">{{voice.name}}</p>
              <p class="list-details-descr">{{voice.description}}</p>
            </div>
          </div>
          <div class="result-list-tags-row">
            <div class="result-tags-item">Language - {{voice.language}}</div>
            <div class="result-tags-item">Accent - {{voice.accent}}</div>
            <div class="result-tags-item">Primary - {{voice.accent}}</div>
            <div class="result-tags-item">{{voice.gender}}</div>
            <div class="result-tags-item">{{voice.age}}</div>
            <div class="result-tags-item">{{voice.category}}</div>
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
      // activeIndex: {
      //   type: Number,
      //   default: 0
      // },
      // onAddTab: {
      //   type: Function,
      //   default: function(){}
      // }
    },
    data() {
      return {
      };
    },
    watch: {},
    mounted() {},
    updated() {},
    methods: {
    },
    computed: {
      ...mapGetters({
        voicesListLoading:  'elevenLabsVoicesModule/voicesListLoading',
        mapVoicesList:      'elevenLabsVoicesModule/mapVoicesList',
        voiceFilters:       'elevenLabsVoicesFilters/voiceFilters',
        isReqFltrsSelected: 'elevenLabsVoicesFilters/isReqFltrsSelected'
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
    overflow-y: scroll;

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
