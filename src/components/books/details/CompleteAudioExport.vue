<template>
  <fieldset class="complete-audio" v-if="allowExport">
    <legend>Export selected range</legend>
    <div>
      <button class="btn btn-primary" v-if="!currentBookMeta.complete_audio" v-on:click="startGenerateCompleteAudio" :disabled="isGenerating">Build</button>
      <button class="btn btn-primary" v-else v-on:click="startGenerateCompleteAudio" :disabled="isGenerating">Rebuild</button>
      &nbsp;&nbsp;{{blocksCountForExport}} block(s)
      <span v-if="blockSelection.start && blockSelection.start._id">
        in range
        <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> -
        <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a>
      </span>
    </div>
    <div class="align-preloader -small" v-if="isGenerating"></div>
    <template v-else>
      <div v-if="currentBookMeta.complete_audio_time && currentBookMeta.complete_audio_time !== -1" class="build-time">
        <span>Latest build: {{convertTime(currentBookMeta.complete_audio_time, true)}}
          <p v-if="currentBookMeta.firstBlockRange"> {{currentBookMeta.lastBuildBlocksCount}} block(s)
           <a v-on:click="goToBlock(currentBookMeta.firstBlockRange)">{{getIdShort(currentBookMeta.firstBlockRange)}}</a> -
           <a v-on:click="goToBlock(currentBookMeta.lastBlockRange)">{{getIdShort(currentBookMeta.lastBlockRange)}} </a>
        </p>
        </span>
      </div>
    </template>
    <div>
      <a :href="this.API_URL + 'download/complete_audio?path=' + currentBookMeta.complete_audio" v-if="currentBookMeta.complete_audio && !isGenerating" target="_blank" class="btn btn-primary">
        Download
      </a>
      <a v-else class="btn btn-primary disabled">
        Download
      </a>
    </div>
  </fieldset>
</template>
<script>
  import {mapGetters, mapActions} from 'vuex';
  import api_config from '../../../mixins/api_config.js';
  import access from '../../../mixins/access.js'
  export default {
    name: 'CompleteAudioExport',
    data() {
      return {}
    },
    props: ['convertTime', 'goToBlock'],
    mixins: [api_config, access],
    computed: {
      isGenerating: {
        get() {
          let dt = new Date(this.bookCompleteAudioTime);
          return this.bookCompleteAudioTime === -1 || (this.bookCompleteAudioTime && dt.getTime() <= 0);
        },
        cache: false
      },
      allowExport: {
        get() {
          if (this._is('admin') || this._is('librarian') || this._is('editor', true)) {
            return true;
          }
          return false;
        },
        cache: false
      },
      blocksCountForExport: {
        get() {
          if (this.selectedBlocks.length > 0) {
            return this.selectedBlocks.filter(blk => {
              return !blk.disabled;
            }).length;
          } else {
            if (this.currentBookCounters.enabled_blocks !== null) {
              return this.currentBookCounters.enabled_blocks;
            }
            let blocks = Array.from(this.storeList.values());
            return blocks.filter(blk => {
              return !blk.disabled;
            }).length;
          }
        }
      },
      ...mapGetters(['currentBookMeta', 'currentBookCounters', 'blockSelection', 'bookCompleteAudioTime', 'selectedBlocks', 'storeList'])
    },
    methods: {
      ...mapActions(['generateCompleteAudio']),
      startGenerateCompleteAudio () {
        this.generateCompleteAudio([this.blocksCountForExport])
      },
      getIdShort (nameBlock) {
        const blockIdRgx = /.*(?:\-|\_){1}([a-zA-Z0-9]+)$/;
        let _id_short = blockIdRgx.exec(nameBlock);
        _id_short = (_id_short && _id_short.length == 2) ? _id_short[1] : nameBlock;
        if (_id_short.length > 7) {
          _id_short = _id_short.substr(0, 4) + '...' + _id_short.substr(_id_short.length - 4, 4);
        }
        return _id_short;
      },
    },
  }
</script>
<style lang="less">
  fieldset.complete-audio {
    legend {
      margin-bottom: 5px;
      border: none;
      width: auto;
      font-size: 1.2rem;
    }
    div {
      margin: 7px 0px;
      &.build-time {
        height: 30px;
        margin-top: 15px;
      }
    }
    a {
      cursor: pointer;
    }
    p {
      display:inline;
    }
  }
</style>
