<template>
  <vue-tabs>
    <v-tab title="Calculate WPM">
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
            <input type="file" accept="audio/*" v-on:change="onAudiofileChange" />
          </label>
          {{filename}}
        </div>
        <div v-if="!isUploading">
          <button class="btn btn-primary" v-on:click="submit" :disabled="!text">Submit</button>
        </div>
      </div>
    </v-tab>
    <v-tab title="Eleven Labs history">
      <div class="tts-history">
        <label class="btn btn-primary" v-on:click="getHistory()">
          <i class="fa fa-refresh"></i>Update
        </label>
        <label class="btn btn-primary" v-if="ttsHistory.has_more" v-on:click="getHistory(ttsHistory.last_history_item_id)">
          Next list <i class="fa fa-chevron-right"></i>
        </label>
        <span class="tts-history-loading" v-if="loadingHistory"></span>
        <table v-if="ttsHistory.history" class="tts-history-items">
          <thead>
            <th>Item</th>
            <th>Voice</th>
            <th>Text</th>
            <th>Date</th>
          </thead>
          <tr v-for="historyItem in ttsHistory.history">
            <td>
              <a class="tts-history-item-id" :href="downloadAudioLink(historyItem.history_item_id)" target="_blank">{{historyItem.history_item_id}}</a>
            </td>
            <td>
              {{historyItem.voice_name}}
            </td>
            <td>
              {{historyItem.text}}
            </td>
            <td>
              {{historyItem.date_formatted}}
            </td>
          </tr>
        </table>
      </div>
    </v-tab>
  </vue-tabs>
</template>
<script>
  import { VueTabs, VTab } from 'vue-nav-tabs';
  import { mapGetters, mapActions } from 'vuex';
  import api_config from '../../mixins/api_config.js';
  export default {
    data() {
      return {
        text: '',
        file: null,
        filename: '',
        isUploading: false,
        totalCounters: {},
        ttsHistory: {},
        loadingHistory: false
      }
    },
    mixins: [api_config],
    components: {
      VueTabs,
      VTab
    },
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
      },
      
      getHistory(start_from = null) {
        //console.log(this.loadHistory)
        this.ttsHistory = {};
        this.loadingHistory = true;
        return this.loadHistory([start_from])
          .then(response => {
            this.loadingHistory = false;
            this.ttsHistory = response;
          });
      },
      
      downloadAudioLink(item_id) {
        return this.getAPILink(`tts_download/eleven_labs/history/${item_id}`);
      },
      
      ...mapActions('ttsModule', ['loadHistory'])
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
  .tts-history {
    overflow-y: scroll;
    max-height: 80vh;
    .tts-history-loading {
      display: inline-block;
      background: url(/static/preloader-bubble-20-gray.gif);
      width: 20px;
      height: 20px;
      background-repeat: no-repeat;
      background-position-y: center;
    }
    .tts-history-items {
      thead {
        background-color: #F0F0F0;
        position: sticky;
        top: 35px;
      }
      tr {
        &:nth-child(odd) {
          background-color: #F0F0F0;
        }
      }
      td {
        padding: 2px 4px;
        .tts-history-item-id {
          color: #337ab7;
          cursor: pointer;
        }
      }
    }
    label {
      position: sticky;
      top: 0px;
      i {
        display: inline-block;
        padding: 0px 3px;
        color: white;
        &:hover {
          color: white;
        }
      }
    }
  }
</style>