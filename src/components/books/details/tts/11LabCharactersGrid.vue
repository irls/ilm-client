<template>
<div class="character-select-main-wrapper">
  <div v-if="!isVoicesListLoading" class="character-select-list-wrapper">
    <ul>
      <li v-for="(char, idx) in characters"
        :data-id="char.voice_id" :key="char.uuid">
        <div :class="['result-list-item', {'selected': char.isSelected}]"
          @click="charRowClick($event, char)" >

          <div class="result-list-description-row">

            <div class="result-list-play-button">
              <button v-if="!isAudioPlaying(char.voice_id)" class="audio-btn -play" @click="playVoiceExample($event, char)"></button>
              <button v-if="isAudioPlaying(char.voice_id)" class="audio-btn -pause" @click="pauseVoiceExample($event, char)"></button>
            </div>
            <div class="list-details-name">{{char.name}}</div>
            <div class="list-details-descr">{{char.voice.name}}</div>
            <div class="list-details-trash">
              <i class="fa fa-trash" @click="removeCharacterApprove(idx)"></i>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>

  <modal name="characters-message"
    class="eleven-labs-characters-modal"
    height="auto" :width="400" :resizeable="false">
    <div class="modal-header">Delete voice</div>
    <div class="modal-body">
      <p v-if="removeCharacterParams">Delete “{{removeCharacterParams.name}}” voice?</p>
      <p v-if="removeCharacterParams">Delete “{{removeCharacterParams.name}}” tab?</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" v-on:click="onCharacterRemove">Confirm</button>
      <button class="btn btn-default" v-on:click="removeCharacterCancel">Cancel</button>
    </div>
  </modal>

</div>
<!--<div class="character-select-main-wrapper">-->
</template>

<script>

import _       from 'lodash';
import Vue     from 'vue';
import v_modal from 'vue-js-modal';
Vue.use(v_modal, {dialog: true});

import { mapGetters, mapActions } from 'vuex';
import { Languages } from "@src/mixins/lang_config.js"

export default {
    name: 'ElevenLabCharactersGrid',
    props: {
      characters: {
        type: Array,
        default: null
      },
      onCharSelect: {
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
        removeCharacterParams: null,
      };
    },
    watch: {},
    mounted() {},
    updated() {},
    methods: {
      playVoiceExample(event, char) {
        event.stopPropagation();
        this.$emit('play', {event, voice: char.voice, character: char})
      },

      pauseVoiceExample(event, char) {
        event.stopPropagation();
        this.$emit('stop', {event, voice: char.voice, character: char})
      },

      charRowClick(event, char) {
        this.$emit('onCharSelect', {event, voice: char.voice, character: char})
      },

      isAudioPlaying (voice_id) {
        return this.audio_playing
            && this.audio_playing.trim().length
            && this.audio_playing.trim() === voice_id;
      },

      removeCharacterApprove(idx) {
        if (this.characters[idx]) {
          this.removeCharacterParams = {
            i: idx, name: this.characters[idx]?.name
          }
          this.showModal('characters-message');
        }
      },

      removeCharacterCancel() {
        this.removeCharacterParams = null;
        this.hideModal('characters-message');
      },

      onCharacterRemove() {
        //this.showModal('characters-message');
      },

      showModal(name) {
        this.$modal.show(name);
      },

      hideModal(name) {
        this.$modal.hide(name);
      },
  },
    computed: {
      ...mapGetters({
        isVoicesListLoading: 'elevenLabsVoicesModule/isVoicesListLoading',
        isVoicesListLoaded:  'elevenLabsVoicesModule/isVoicesListLoaded',
        mapVoicesList:       'elevenLabsVoicesModule/mapVoicesList',

        voiceFilters:        'elevenLabsVoicesFilters/voiceFilters',
        isReqFltrsSelected:  'elevenLabsVoicesFilters/isReqFltrsSelected'
      }),
    },
    components: {
    },
    directives: {
    }
}
</script>

<style lang="less" scoped>

.character-select-main-wrapper {
  flex-grow: 1;
  min-height: 0; /* CRITICAL FIX: Allows it to shrink below content size */

  /*border: 1px solid #e5e5e5;
  border-radius: 3px;*/
  border: 0;
  margin-top: 0px;
  max-height: 200px;
  overflow-y: auto;

  .character-select-list-wrapper {
    height: 100%;

    ul {
      list-style-type: none;
      padding: 0px;

      li:nth-child(odd) {
        background: #EFEFEF;
      }
    }

    .result-list-item {
      cursor: pointer;

      .list-details-trash {
        i {
            color: red;
            visibility: hidden;
          }
      }

      &:hover {
        background: #FFF8DC;

        .list-details-trash {
          i {
            visibility: visible;
          }
        }
      }
      &.selected {
        background: #8FBC8F;
      }

      .result-list-description-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0 4px 0 8px;

        .list-details-name {
          font-weight: 600;
          width: 35%;
          height: 40px;
          border-right: 1px solid #D9D9D9;
          padding: 9px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .list-details-descr {
          width: 60%;
          height: 40px;
          padding: 9px 0 9px 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .list-details-trash {
          width: 5%;
          height: 40px;
          padding: 11px 0px 1px 4px;
          /*i {
            color: red;
            visibility: hidden;
          }*/
        }

        .result-list-play-button {
          padding-right: 8px;
          height: 34px;

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

.eleven-labs-characters-modal {
  .modal-header {
    border: 0;
    font-weight: 600;
    padding-bottom: 0;
  }

  .modal-footer {
    padding: 0;
    border: 0;
    display: flex;
    flex-direction: row;

    .btn {
      width: 50%;
      height: 46px;
      margin: 0;
    }
  }
}

</style>

<!--<style lang="less">

</style>-->
