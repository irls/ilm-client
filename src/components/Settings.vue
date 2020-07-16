<template>
  <div class="area-wrapper" style="margin-left: 15px;">
    <h3>Language List</h3> 
    <table  class="settings-table">
      <thead>
        <tr>
          <th>
            Key
          </th>
          <th>
            Value
          </th>
          <th>
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(entry, index) in languagesList">
          <td >
            <div v-show="edit !== index" style="width: 200px;">
              <label > {{ entry[0] }}</label>
            </div>
            <input type="text" maxlength="2" v-show="edit === index" v-model="entry[0]" @blur="edit = false" @keyup.enter="edit === false"  style="width: 200px;">
          </td>
          <td >
            <div v-show="edit !== index" style="width: 200px;">
              <label > {{ entry[1] }}</label>
            </div>
            <input type="text" v-show="edit === index" v-model="entry[1]" @blur="edit = false" @keyup.enter="edit === false"  style="width: 200px;">
          </td>
          <td >
            <button type="button" class="btn btn-success" @click="edit = false" v-if="edit === index"><i class="fa fa-pencil"></i></button>
            <button type="button" class="btn btn-success" @click="editingLang(index)" v-if="edit !== index" :disabled="edit !== false"><i class="fa fa-pencil" ></i></button>
            <button type="button" class="btn btn-danger"  @click="deleteLang(index)" :disabled="edit !== false"><i class="fa fa-trash" ></i></button>
            <button v-if="index < languagesList.length-1" type="button" class="btn btn-primary" @click="moveLangDown(index)" :disabled="edit !== false"><i class="fa fa-arrow-down" ></i></button>
            <span v-if="index == languagesList.length-1" style="margin-right: 38px;">&nbsp;</span>
            <button v-if="index != 0" type="button" class="btn btn-primary" @click="moveLangUp(index)" :disabled="edit !== false"><i class="fa fa-arrow-up" ></i></button>
          </td>
        </tr> 
        <tr >
          <td >
            <input type="text" v-model="langNewCode" id="lang-add-code" style="width: 200px;">
          </td>
          <td >
            <input type="text" v-model="langNewName" id="lang-add-name" style="width: 200px;">
          </td>
          <td >
            <button type="button" class="btn btn-success" @click="addLang()" :disabled="langNewCode == ''"><i class="fa fa-plus" ></i></button>
          </td>
        </tr> 

      </tbody>
    </table>
    <br/>
    <button type="button" class="btn btn-success" @click="saveLangList()" >Save changes</button>

  </div>
</template>

<script>

import axios from 'axios'
import superlogin from 'superlogin-client'
import api_config from '../mixins/api_config';
import { Languages }      from "../mixins/lang_config.js"
import { alert } from 'vue-strap'

//const API_ALLUSERS = process.env.ILM_API + '/api/v1/users'
import Vue from 'vue';

export default {

  name: 'Settings',

  components: {
  },

  data () {
    return {
      //languages: LANGUAGES,
      languages: Languages,
      edit: false,
      langNewCode: '',
      langNewName: ''
    }
  },

  computed: {
    languagesList() {
      return Object.entries(Languages)
    }
  },
  mounted () {
    var self = this
    //self.updateUsersList()
  },

  created () {

  },
  mixins: [api_config],
  methods: {
    focused: function() {
    },
    editingLang: function(index) {
	  this.edit = index;
    },
    deleteLang: function(index) {
      Vue.delete(this.languagesList, index);
      this.langListRefresh();
    },
    addLang: function() {
      Vue.set(this.languagesList, this.languagesList.length, [this.langNewCode, this.langNewName]);
      this.langNewCode = '';
      this.langNewName = '';
    },
    moveLangUp: function(index) {
      this.languagesList.splice(index-1, 0, this.languagesList.splice(index, 1)[0]);
      this.langListRefresh();
    },
    moveLangDown: function(index) {
      this.languagesList.splice(index+1, 0, this.languagesList.splice(index, 1)[0]);
      this.langListRefresh();
    },
    langListRefresh: function(){
      this.edit = 0;
      this.edit = false;
    },
    saveLangList: function(){
      var result = {};
      let i = 0;
      for (i = 0; i < this.languagesList.length; i++){
        result[this.languagesList[i][0]] = this.languagesList[i][1];
      }
      axios.post(this.API_URL + '/settings/languages', {
        languages: result,
        params: {
        }
      })
        .then((response) => {
          this.tc_loadBookTask(this.meta._id);
          this.getCurrentJobInfo();
        })
        .catch((err) => {})

    }
  },
  watch: {
  }
}
</script>

<style lang="less" scoped>

.area-wrapper {
  margin: 10px 
}

.settings-table {
  border-collapse: collapse;
  width: 50%;
}

.settings-table td, .settings-table th {
  border: 1px solid #ddd;
  padding: 8px;
}

.settings-table tr:nth-child(even){background-color: #f2f2f2;}

.settings-table tr:hover {background-color: #ddd;}

.settings-table th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  background-color: silver;
  color: white;
}
.settings-table .fa {
  color: #fff
}
</style>
