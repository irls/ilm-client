<template>
<div class="character-select-main-wrapper">
  <div class="character-select-list-wrapper">
    <ul>
      <li v-for="(char, idx) in characters"
        :data-id="char.voice_id" :key="char.uuid">
        <div v-if="char.voice && char.voice_id"
          :class="['result-list-item', {'selected': char.isSelected}]"
          @click="charRowClick($event, char)" >

          <div class="result-list-description-row">

            <div class="result-list-play-button">
              <button v-if="!isAudioPlaying(char.voice_id)" class="audio-btn -play" @click="playVoiceExample($event, char)"></button>
              <button v-if="isAudioPlaying(char.voice_id)" class="audio-btn -pause" @click="pauseVoiceExample($event, char)"></button>
            </div>
            <div class="list-details-name"
              v-ilm-tooltip.bottom="{value: char.name, classList: {tooltip: 'white-tooltip'}}">
              <span v-if="!char.isEditing"
                class="p-tabview-title-character"
                :contenteditable="char.isEditing"
                v-text="char.name"
                @dblclick="onTitleDblClick($event, char)">
              </span>
              <span v-if="char.isEditing"
                class="p-tabview-title-character"
                :contenteditable="char.isEditing"
                ref="voiceTitleEditRef"
                @keypress="onTitleKeyPress($event, char)"
                @keydown="onTitleKeydown($event, char)"
                @input="onTitleEdit($event, char)"
                @blur="onTitleBlur($event, char)">
              </span>
            </div>
            <div class="list-details-descr"
              v-ilm-tooltip.bottom="{value: char.voice.name, classList: {tooltip: 'white-tooltip'}}">{{char.voice.name}}</div>
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
    <div class="modal-body" v-if="removeCharacterParams">
      <three-dot-loader-div v-if="removeCharacterIsLoading" :marginLeft="'49%'" />
      <section v-else >
        <p v-if="removeCharacterAlignedCount">“{{removeCharacterParams.name}}” has been aligned with {{removeCharacterAlignedCount}} blocks.</p>
        <p v-if="removeCharacterAlignedCount">Are you sure you want to delete the voice?</p>
        <p v-if="!removeCharacterAlignedCount">Delete “{{removeCharacterParams.name}}” voice?</p>
      </section>

    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" v-on:click="onCharacterRemove">Delete</button>
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

import ThreeDotLoaderDiv from '@src/components/generic/ThreeDotLoaderDiv.vue';

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
        removeCharacterAlignedCount: 0,
        removeCharacterIsLoading: false,
        backupCharacterName: '',
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
          this.removeCharacterIsLoading = true;
          this.$store.dispatch('elevenLabsVoicesModule/checkVoiceIfApplied', this.characters[idx]?.voice)
          .then((alignedCount)=>{
            this.removeCharacterAlignedCount = alignedCount;
            this.removeCharacterIsLoading = false;
            this.showModal('characters-message');
          })
          .catch(err=>{
            console.error('removeCharacterApprove', err);
            this.removeCharacterIsLoading = false;
            this.removeCharacterParams = null;
            this.hideModal('characters-message');
          })
        }
      },

      removeCharacterCancel() {
        this.removeCharacterParams = null;
        this.removeCharacterIsLoading = false;
        this.hideModal('characters-message');
      },

      onCharacterRemove() {
        if (this.removeCharacterParams) {
          const params = {
            idx: this.removeCharacterParams?.i,
            bookid: this.currentBookid
          };
          this.removeCharacterIsLoading = true;
          this.$store.dispatch('elevenLabsVoicesModule/deleteVoice', params)
          .then(()=>{
            this.$emit('onCharDelete', this.removeCharacterParams);
            this.removeCharacterIsLoading = false;
            this.removeCharacterParams = null;
            this.hideModal('characters-message');
          })
          .catch(err=>{
            console.error('onCharacterRemove', err);
            this.removeCharacterIsLoading = false;
            this.removeCharacterParams = null;
            this.hideModal('characters-message');
          })
        }
      },

      showModal(name) {
        this.$modal.show(name);
      },

      hideModal(name) {
        this.$modal.hide(name);
      },

      async onTitleBlur(event, character) {
        event.target.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        this.$store.commit('elevenLabsVoicesModule/set_initCharactersListNonEdit');
        this.$store.commit('elevenLabsVoicesModule/set_charactersListItemValue', {
          values: { name: character.name }, character
        });
        await this.$store.dispatch('elevenLabsVoicesModule/saveBookCharacters', {
          bookid: this.currentBookid, charIdx: 0
        });
        this.$emit('onCharSelect', {event, voice: character.voice, character});
      },

      onTitleDblClick(event, char) {
        this.$store.commit('elevenLabsVoicesModule/set_initCharactersListItemEdit', char);

        Vue.nextTick(()=>{
          const activeRef = this.$refs.voiceTitleEditRef.find(el=>el.getAttribute('contenteditable')==='true');
          if (activeRef) {
            activeRef.innerText = char.name;
            this.setCaretToEnd(activeRef);
            this.backupCharacterName = char.name;
          }
        })
      },

      setCaretToEnd(element) {
        if (!element) return;
        const range = document.createRange();
        const selection = window.getSelection();
        selection.removeAllRanges();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.addRange(range);
        element.focus();
      },

      onTitleKeyPress(event, character) {
        const text = event.target.innerText;
        if (event?.key === 'Enter') {
          event.preventDefault();
          if (document.querySelector('.list-details-name>[contenteditable="true"]')) {
            document.querySelector('.list-details-name>[contenteditable="true"]').blur();
          }
          return;
        }
        if (text.length > 30) {
          event.preventDefault();
          return false;
        }
      },

      onTitleKeydown(event, character) {
        if (event?.key === 'Escape') {
          event.preventDefault();
          if (this.backupCharacterName) {
            this.$store.commit('elevenLabsVoicesModule/set_initCharactersListItemValue', {
              values: { name: this.backupCharacterName }, character
            });
            if (document.querySelector('.list-details-name>[contenteditable="true"]')) {
              document.querySelector('.list-details-name>[contenteditable="true"]').blur();
            }
          }
          return;
        }
      },

      onTitleEdit(event, character) {
        let innerText = event.target.innerText;
        if (event.inputType === "historyUndo" && this.backupCharacterName) {
          innerText = this.backupCharacterName;
        }
        this.$store.commit('elevenLabsVoicesModule/set_initCharactersListItemValue', {
          values: { name: innerText }, character
        });
      },
  },
    computed: {
      ...mapGetters({
        currentBookid:       'currentBookid',

        isVoicesListLoading: 'elevenLabsVoicesModule/isVoicesListLoading',
        isVoicesListLoaded:  'elevenLabsVoicesModule/isVoicesListLoaded',
        mapVoicesList:       'elevenLabsVoicesModule/mapVoicesList',

        voiceFilters:        'elevenLabsVoicesFilters/voiceFilters',
        isReqFltrsSelected:  'elevenLabsVoicesFilters/isReqFltrsSelected'
      }),
    },
    components: {
      'three-dot-loader-div': ThreeDotLoaderDiv
    },
    directives: {},
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
          white-space: nowrap;
          overflow: hidden;
          padding: 9px 0;

          span.p-tabview-title-character {
            white-space: nowrap;
            margin-left: 1px;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 90%;
            height: 100%;
            display: inline-block;

            &[contenteditable="true"] {
              text-overflow: clip;
              overflow: hidden;
              background: white;
              cursor: text;
              outline-color: #ddd;
              outline-style: solid;
              outline-width: 1px;
              /*padding: 0.5rem;*/
              margin-left: 1px;
              margin-right: -5px;
              margin-top: 0px;

            }
          }
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

  .modal-body {
    min-height: 50px;
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
