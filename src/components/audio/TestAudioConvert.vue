<template>
  <div class="test-audio-convert">
    <vue-tabs @tab-change="onTabChange">
      <v-tab title="Test on audio">
        <TestAudioConvertFile
          :activeTab="activeTab"
          />
      </v-tab>
      <v-tab title="Predefined examples">
        <div class="item-table">
          <div class="item-row item-header">
            <div class="item-cell">Name</div>
            <div class="item-cell">Description</div>
            <div class="item-cell">Size(kb)</div>
            <div class="item-cell">Action</div>
          </div>
          <template v-for="(item, index) in items">
            <div class="item-row">
              <div class="item-cell">
                {{item.name}}
              </div>
              <div class="item-cell item-description">
                Original flac
              </div>
              <div class="item-cell">
                {{item.size}}
              </div>
              <div class="item-cell">
                <i class="fa fa-stop-circle" v-if="is_playing && getItemId(index) === playing_item" v-on:click="stop()"></i>
                <i class="fa fa-play-circle" v-on:click="playItem(index)" v-else></i>
              </div>
            </div>
            <div class="item-row" v-for="(converted, cIndex) in item.converted">
              <div class="item-cell"></div>
              <div class="item-cell item-description">
                {{converted.description}}
              </div>
              <div class="item-cell">
                {{converted.size}}&nbsp;({{converted.compressSize}}%)
              </div>
              <div class="item-cell">
                <i class="fa fa-stop-circle" v-if="is_playing && getItemId(index, cIndex) === playing_item" v-on:click="stop()"></i>
                <i class="fa fa-play-circle" v-on:click="playItem(index, cIndex)" v-else></i>
              </div>
            </div>
          </template>
        </div>
      </v-tab>
    </vue-tabs>
  </div>
</template>
<script>
  import { VueTabs, VTab } from 'vue-nav-tabs';
  import { mapGetters, mapActions } from 'vuex';
  import TestAudioConvertFile from './TestAudioConvertFile';
  export default {
    data() {
      return {
        items: [],
        audio_element: {duration: null},
        playing_item: null,
        is_playing: false,
        activeTab: 0
      }
    },
    components: {
      VueTabs,
      VTab,
      TestAudioConvertFile
    },
    mounted() {
      this.loadPredefined()
        .then(items => {
          this.items = items;
        });
      this.audio_element = document.createElement('audio');
      this.audio_element.addEventListener('pause', () => {
        console.log('PAUSED')
        this.is_playing = false;
        this.playing_item = null;
      });
    },
    methods: {
      ...mapActions('testAudioConvert',['loadPredefined']),
      playItem(itemIndex, convertedIndex = null) {
        let item = this.items[itemIndex];
        let link = convertedIndex === null ? item.link : item.converted[convertedIndex].link;
        this.audio_element.src = link;
        this.audio_element.play()
          .then(() => {
            this.is_playing = true;
          });
        this.playing_item = this.getItemId(itemIndex, convertedIndex);
      },
      stop() {
        this.audio_element.pause();
      },
      getItemId(itemIndex, convertedIndex = null) {
        return `${itemIndex}${convertedIndex === null ? '' : '_' + convertedIndex}`
      },
      onTabChange(index) {
        this.activeTab = index;
      }
    },
    computed: {
      
    }
  }
</script>
<style lang="less">
  .test-audio-convert {
    overflow-y: auto;
    .item-table {
      display: table;
      margin: 5px;
      .item-header {
        font-weight: bold;
        font-size: 15px;
      }
      .item-row {
        display: table-row;
        .item-cell {
          display: table-cell;
          vertical-align: middle;
          padding: 7px 5px;
          font-size: 14px;
          border: 1px solid green;
          text-align: left;
        }
        .item-description {
          font-size: 10px;
          white-space: pre;
        }
      }
    }
  }
</style>