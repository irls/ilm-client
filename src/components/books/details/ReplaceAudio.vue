<template>
  <div class="block-audio-export">
    <fieldset>
      <legend>Export selected range</legend>
      <template v-if="!exportData.in_process">
        <div class="">
          <label>
            <input type="radio" name="export_type" v-model="export_type" value="flac" />
            FLAC files block by block
          </label>
          <label>
            <input type="radio" name="export_type" v-model="export_type" value="wav" />
            WAV file with JSON audio map
          </label>
        </div>
        <div class="">
          <button class="btn btn-primary" v-on:click="rebuild()" v-if="blocksCountForExport > 0">{{buildButtonLabel}}</button>
          <span class="btn btn-primary disabled" v-else>{{buildButtonLabel}}</span>
          &nbsp;&nbsp;{{blocksCountForExport}}&nbsp;voiced block(s)
          <template v-if="selectedBlocks.length > 0">
            in range
            <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a>&nbsp;-&nbsp;
            <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a>
          </template>
        </div>
      </template>
      <div v-else class="align-preloader -small"></div>
      <template v-if="exportData.date">
        <div class="">
          Latest build: {{exportDataType}} {{convertTime(exportData.date, true)}}
          <template v-if="exportData.range">
            &nbsp;{{exportData.range.count}}&nbsp;block(s) 
            <!-- <a v-on:click="goToBlock(exportData.range.start)">{{getIdShort(exportData.range.start)}}</a>&nbsp;-&nbsp;
            <a v-on:click="goToBlock(exportData.range.end)">{{getIdShort(exportData.range.end)}}</a> -->
          </template>
        </div>
        <div v-if="exportData.path">
          <a :href="this.API_URL + 'download/complete_audio?path=' + exportData.path" v-if="!exportData.in_process" target="_blank" class="btn btn-primary">
            Download
          </a>
        </div>
      </template>
    </fieldset>
    <fieldset>
      <legend>Replace block audio</legend>
      <div>
        <button class="btn btn-primary" v-on:click="replaceAudioModal()">Replace</button>
        <button class="btn btn-primary" v-on:click="parseAndReplaceAudioModal()">Parse & Replace</button>
      </div>
    </fieldset>
  </div>
</template>
<script>
  import { mapGetters, mapActions } from 'vuex';
  import Vue from 'vue';
  import AudioImportModal from '../../audio/AudioImport.vue';
  import time_methods from '../../../mixins/time_methods.js';
  import blockid_short from '../../../mixins/blockid_short';
  import api_config from '../../../mixins/api_config';
  import v_modal from 'vue-js-modal';
  
  Vue.use(v_modal, {dialog: true});
  export default {
    data() {
      return {
        export_type: 'flac'
      }
    },
    mixins: [time_methods, blockid_short, api_config],
    computed: {
      exportData: {
        get() {
          if (this.currentBookMeta.block_audio_export) {
            return this.currentBookMeta.block_audio_export;
          }
          return {};
        },
        cache: false
      },
      blocksCountForExport: {
        get() {
          if (this.selectedBlocks.length > 0) {
            return this.selectedBlocks.filter(blk => {
              return !blk.disabled && blk.audiosrc && blk.audiosrc.length > 0;
            }).length;
          } else {
            /*if (this.currentBookCounters.enabled_blocks !== null) {
              return this.currentBookCounters.enabled_blocks;
            }*/
            let blocks = Array.from(this.storeList.values());
            return blocks.filter(blk => {
              return !blk.disabled && blk.audiosrc && blk.audiosrc.length > 0;
            }).length;
          }
        },
        cache: false
      },
      buildButtonLabel: {
        get() {
          if (this.exportData && this.exportData.path) {
            return 'Rebuild';
          }
          return 'Build';
        },
        cache: false
      },
      exportDataType: {
        get() {
          if (this.currentBookMeta.block_audio_export) {
            switch (this.currentBookMeta.block_audio_export.type) {
              case 'wav':
                return 'WAV';
                break;
              case 'flac':
                return 'FLAC';
                break;
              default:
                return '';
            }
          }
          return '';
        },
        cache: false
      },
      ...mapGetters(['currentBookMeta', 'selectedBlocks', 'storeList', 'currentBookCounters', 'blockSelection'])
    },
    methods: {
      rebuild() {
        return this.blockAudioExport([this.export_type]);
      },
      goToBlock(blockid) {
        this.$root.$emit('for-bookedit:scroll-to-block', blockid);
      },
      replaceAudioModal() {
        this.$modal.show(AudioImportModal, {
          book: this.currentBookMeta,
          uploadInfo: {},
          type: 'replace'
        }, {
          height: 'auto',
          width: '590px'
        });
      },
      parseAndReplaceAudioModal() {
        this.$modal.show(AudioImportModal, {
          book: this.currentBookMeta,
          uploadInfo: {},
          type: 'parse_replace',
          multiple: false
        }, {
          height: 'auto',
          width: '590px'
        });
      },
      ...mapActions('audioExport', ['blockAudioExport'])
    }
  }
</script>
<style lang="less">
  .block-audio-export {
    fieldset {
      border: 1px solid #b9b6b6;
      position: relative;
      margin-bottom: 10px;
      legend {
        margin: 0px 5px;
      }
      div {
        padding: 8px 10px;
        a {
          cursor: pointer;
        }
      }
    }
    label {
      font-size: 14px;
      font-weight: 400;
      display: block;
    }
  }
</style>