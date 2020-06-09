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
              <label > {{ entry.code }}</label>
            </div>
            <input type="text" maxlength="2" v-show="edit === index" v-model="entry.code" @blur="edit = false" @keyup.enter="edit === false"  style="width: 200px;">
          </td>
          <td >
            <div v-show="edit !== index" style="width: 200px;">
              <label > {{ entry.name }}</label>
            </div>
            <input type="text" v-show="edit === index" v-model="entry.name" @blur="edit = false" @keyup.enter="edit === false"  style="width: 200px;">
          </td>
          <td >
            <button type="button" class="btn btn-success" @click="editingLang(index)"><i class="fa fa-pencil" ></i></button>
            <button type="button" class="btn btn-danger"  @click="deleteLang(index)"><i class="fa fa-trash" ></i></button>
            <button type="button" class="btn btn-primary" @click="moveLangUp(index)"><i class="fa fa-arrow-up" ></i></button>
            <button type="button" class="btn btn-primary" @click="moveLangDown(index)"><i class="fa fa-arrow-down" ></i></button>
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
  </div>
</template>

<script>

import axios from 'axios'
import superlogin from 'superlogin-client'
import LANGUAGES from '../../static/languages.json';
import { alert } from 'vue-strap'

const API_ALLUSERS = process.env.ILM_API + '/api/v1/users'
import Vue from 'vue';

//Vue.use(Vuetable);

export default {

  name: 'Settings',

  components: {
  },

  data () {
    return {
      languages: LANGUAGES,
      edit: false,
      langNewCode: '',
      langNewName: ''
    }
  },

  computed: {
    languagesList() {
      return LANGUAGES;
    }
  },
  mounted () {
    var self = this
    //self.updateUsersList()
  },

  created () {

  },

  methods: {
    focused: function() {
      console.log('focused')
    },
    editingLang: function(index) {
	  this.edit = index;
    },
    deleteLang: function(index) {
      Vue.delete(this.languagesList, index);
      console.log(this.languagesList);
    },
    addLang: function() {
      Vue.set(this.languagesList, this.languagesList.length, {code:this.langNewCode, name: this.langNewName})
      console.log(this.languagesList);
      this.langNewCode = '';
      this.langNewName = '';
    },
    moveLangUp: function(index) {
      this.languagesList.splice(index-1, 0, this.languagesList.splice(index, 1)[0]);
    },
    moveLangDown: function(index) {
      this.languagesList.splice(index+1, 0, this.languagesList.splice(index, 1)[0]);
    },


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
  background-color: #4CAF50;
  color: white;
}
.settings-table .fa {
  color: #fff
}
</style>
