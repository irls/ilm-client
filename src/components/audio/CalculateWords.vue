<template>
  <div class="calculate-words">
    <div class="text-container">
      <textarea rows="10" cols="50" v-model="text"></textarea>
    </div>
    <div class="counters-container">
      <table v-if="totalCounters && totalCounters.wordsCount">
        <tr>
          <td>Total words:</td>
          <td>{{totalCounters.wordsCount}}</td>
        </tr>
        <tr>
          <td>Average word length:</td>
          <td>{{totalCounters.averageLength}}</td>
        </tr>
        <template v-if="totalCounters.audioInfo.duration">
          <tr>
            <td>Audio length:</td>
            <td>{{totalCounters.audioInfo.duration}}&nbsp;({{totalCounters.audioInfo.duration_sec}}&nbsp;sec.)</td>
          </tr>
          <tr>
            <td>WPM:</td>
            <td>{{totalCounters.wpm}}</td>
          </tr>
        </template>
      </table>
    </div>
    <div>
      <label class="btn btn-default">
        <i class="fa fa-folder-open"></i>Browse
        <input type="file" v-on:change="onAudiofileChange" />
      </label>
      {{filename}}
    </div>
    <div v-if="!isUploading">
      <button class="btn btn-primary" v-on:click="submit" :disabled="!text">Submit</button>
    </div>
  </div>
</template>
<script>
  import api_config from '../../mixins/api_config.js';
  export default {
    data() {
      return {
        text: '',
        file: null,
        filename: '',
        isUploading: false,
        totalCounters: {}
      }
    },
    mixins: [api_config],
    methods: {
      submit() {
        //console.log(this.text, this.file);
        this.totalCounters = {};
        let formData = new FormData();
        if (this.filename) {
          formData.append('audiofile', this.file, this.filename);
        }
        formData.append(`text`, this.text);
        this.isUploading = true;
        let api = this.$store.state.auth.getHttp();
        
        return api.post(`${this.API_URL}tts/eleven_labs/calculate_words`, formData)
          .then(response => {
            this.isUploading = false;
            this.totalCounters = response.data;
          })
          .catch(err => {
            this.isUploading = false;
          });
      },
      onAudiofileChange(e) {
        let files = e.target.files || e.dataTransfer.files;
        if (files) {
          this.file = files[0];
          this.filename = this.file.name;
        }
      }
    }
  }
</script>
<style lang="less">
  .calculate-words {
    margin: 10px;
    overflow-y: scroll;
    &>div {
      padding: 10px;
    }
    .text-container, .counters-container {
      display: inline-block;
    }
    textarea {
      font-size: 18px;
      resize: none;
    }
    input[type="file"] {
      display: none;
    }
    table {
      td {
        padding: 2px 3px;
        font-weight: bold;
      }
    }
  }
</style>