<template>
  <div class="calculate-levels">
    <fieldset>
      <legend>Calculate levels</legend>
      <form enctype="multipart/form-data" @submit.prevent>
        <div>
          <label class='btn btn-default' type="file">
            <i class="fa fa-folder-open-o" aria-hidden="true"></i>Browse&hellip;
            <input name="audio_import" type="file" class="file_open" accept="audio/*" v-on:change="onAudioFileChange" />
          </label>
        </div>
        <div>
          <button class="btn btn-primary" v-on:click="processFile" :disabled="!file || isUploading">Get levels</button>
        </div>
        <div>
          {{filename}}<template v-if="fileSize">&nbsp;({{fileSize}}&nbsp;Kb)</template>
        </div>
      </form>
    </fieldset>
    <div class="chart-title" v-if="audio_levels.length > 0">
      <label>Volume level, dB</label>
    </div>
    <div class="chart-container">
      <!-- {{ audio_levels }},{{ audio_levels.length }} -->
      <div v-for="(audio_level, audio_level_idx) in audio_levels" class="audio-level" :data-level="parseInt(audio_level.level)" v-ilm-tooltip.top="{value: 'time: ' + parseTime(audio_level.time) + '<br>value: ' + roundFloat(audio_level.level, 0) + 'dB'}">
        <span class="audio-level-value" >
          {{ roundFloat(audio_level.level, 0) }}
        </span>
        <span class="audio-level-time" v-if="audio_level_idx % 2 === 0">
          {{ parseTime(audio_level.time) }}
        </span>
      </div>
    </div>
  </div>
</template>
<script>

  import Vue from "vue";
  import { mapGetters, mapActions, mapMutations } from "vuex";
  import IlmTooltip from '../../directives/ilm-tooltip/ilm-tooltip.js';
  import '../../directives/ilm-tooltip/ilm-tooltip.css';

  export default {
    data() {
      return {
        file: null,
        filename: "",
        isUploading: false
      }
    },
    computed: {
      fileSize: {
        get() {
          if (this.file && this.file.size) {
            return this.roundFloat(this.file.size / 1024);
          }
          return '';
        }
      },
      ...mapGetters('calculateLevelsModule', ['audiofile', 'audio_levels'])
    },
    mounted() {
      //console.log('mounted');
      this.setElementsStyle();
    },
    methods: {
      onAudioFileChange(e) {
        let fileList = e.target.files || e.dataTransfer.files;
        if (fileList[0]) {
          this.file = fileList[0];
          this.filename = this.file.name;
        }
      },
      processFile() {
        if (this.file) {
          let formData = new FormData();
          formData.append('audiofile', this.file, this.filename);
          formData.append("stat_name", "Peak_level");
          this.isUploading = true;
          return this.getLevels(formData)
            .then(items => {
              this.isUploading = false;
              this.setElementsStyle();
            })
            .catch(err => {
              this.isUploading = false;
            });
        }
      },
      roundFloat(floatNumber, precision = 2) {
        return parseFloat(parseFloat(floatNumber).toFixed(precision));
      },
      parseTime(timeValue) {
        let seconds = this.roundFloat(timeValue, 2);
        let minutes = parseInt(seconds / 60).toString();
        if (minutes > 0) {
          seconds = this.roundFloat(seconds % 60, 1);
        }
        return minutes.padStart(2, '0') + ":" + "0".repeat(2 - parseInt(seconds).toString().length) + seconds;
      },
      setElementsStyle() {
        Vue.nextTick(() => {
          document.querySelectorAll(`.chart-container .audio-level`).forEach((element) => {
            let level = parseInt(element.dataset.level);
            element.style.height = 200 - (-2 * level) + "px";
            if (level < -23 && level > -29) {
              element.classList.add("-level-lower");
            } else if (level <= -29 && level > -38) {
              element.classList.add("-level-low");
            } else if (level <= -38) {
              element.classList.add("-level-lowest");
            }
          });
        });
      },
      ...mapActions('calculateLevelsModule', ['getLevels'])
    }
  }
</script>
<style lang="less">
  @element-width: 32px;
  .calculate-levels {
    fieldset {
      border: 1px solid #b9b6b6;
      position: relative;
      margin: 10px;
      padding: 20px 5px;
    }
    input[type="file"] {
      display: none;
    }
    form {
      div {
        margin: 10px;
      }
    }
    .chart-container {
      width: auto;
      white-space: nowrap;
      overflow-x: auto;
      display: flex;
      height: 230px;
      background-color: #80808014;
      .audio-level {
        display: inline-block;
        min-width: @element-width;
        margin: 2px 2px 25px 2px;
        background-color: green;
        align-self: flex-end;
        position: relative;
        display: flex;
        flex-direction: column;          /* top to bottom */
        justify-content: space-between;
        cursor: pointer;
        background: -webkit-linear-gradient(bottom, #c50404 0%, #b9b901 120px, green 130px);
        /*&.-level-lower {
          background-color: #b9b901;
        }
        &.-level-low {
          background-color: #e39300;
        }
        &.-level-lowest {
          background-color: #c50404;
        }*/
        &:hover {
          /*border: 2px solid black;*/
          /*margin: 1px 2px 24px 2px;*/
          opacity: 0.5;
        }
        .audio-level-time {
          position: absolute;
          bottom: -22px;
          width: @element-width;
          text-align: center;
          font-weight: bold;
          padding-left: 5px;
          border-left: 1px solid gray;
          margin-top: 1px;
          opacity: 1 !important;
          &:hover {
            opacity: 1 !important;
          }
        }
        .audio-level-value {
          font-weight: bold;
          color: white;
          /*position: absolute;
          bottom: 0;*/
          align-self: flex-end;
          width: @element-width;
          text-align: center;
          display: inline-block;
          padding-top: 5px;
        }
      }
    }
  }
</style>