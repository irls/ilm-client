<template>
  <div>

    <div class="user">
      <div class="container">
        <div class="row">
          <div class="col-md-5">
            <h4><i class="fa fa-users"></i>{{users.length}} Active Users</h4>
            <select>
              <option value="12" selected="">Show All</option>
              <option value="13">Show Active</option>
              <option value="14">Show Inactive</option>
            </select>
          </div>
          <div class="col-md-7 user-right">
            <i class="fa fa-calendar-check-o"></i><a href="#">All Work History</a>
            <span>Filter: </span><input type="text" v-model="filterKey">
            <a href="#" @click="userAddModalActive = true"><i class="fa fa-user-plus"></i>New User</a>
          </div>
        </div>
      </div>
    </div>

    <form class="user-form">
      <div v-for="user in pagedUsers" class="user-form-box">
        <div class="t-box"><span><i class="fa fa-user"></i>{{user.name}}</span></div>
        <div class="t-box"><span>{{user.email}}</span></div>
        <div class="t-box">
          <select-privileges
            class="form-control"
            :selected="user.privilege"
            @select="val => { user.privilege = val }"
          ></select-privileges>
        </div>
        <div class="t-box">
          <select-languages
            class="form-control"
            :selected="user.language"
            @select="val => { user.language = val }"
          ></select-languages>
        </div>
        <div class="t-box"><span><i class="fa fa-calendar-check-o"></i>Work History</span></div>
        <div class="t-box"><span><i class="fa fa-unlock"></i>Pass Reset</span></div>
        <div class="t-box" @click="user.enable=!user.enable">
          <template v-if="user.enable"><span>Enable </span><i class="fa fa-toggle-on"></i></template>
          <template v-else><span>Disable </span><i class="fa fa-toggle-off"></i></template>
        </div>
      </div>
    </form>

    <pagination
      :length="filteredUsers.length"
      :currentPage="currentPage"
      :rowsPerPage="rowsPerPage"
      @goToPage="page => { currentPage = page }"
    ></pagination>

    <user-add-modal
      :show="userAddModalActive"
      @closed="userAddModalActive = false"
    ></user-add-modal>

  </div>
</template>

<script>

import axios from 'axios'
import SelectPrivileges from './generic/SelectPrivileges'
import SelectLanguages from './generic/SelectLanguages'
import UserAddModal from './users/UserAddModal'
import Pagination from './generic/Pagination'
import { filteredData, pagedData } from '../filters'

const API_ALLUSERS = '/static/users.json'

export default {

  name: 'Users',

  components: {
    UserAddModal,
    SelectPrivileges,
    SelectLanguages,
    Pagination
  },

  data () {
    return {
      users: [],
      filterKey: '',
      currentPage: 0,
      rowsPerPage: 2,
      userAddModalActive: false
    }
  },

  computed: {

    pagedUsers (val) {
      return pagedData(this.filteredUsers, this.currentPage, this.rowsPerPage)
    },

    filteredUsers () {
      return filteredData(this.users, this.filterKey)
    }

  },

  created () {
    axios.get(API_ALLUSERS)
    .then(response => {
      this.users = response.data.users
    })
    .catch(err => {
      console.log('Error: ', err)
    })
  }

}
</script>

<style lang="stylus">
.user i
.user-right a
  margin-right: 10px
.user i
  font-size: 18px
.user-right
  text-align: right
.fa
  font-size: 18px

.user
  .container
    width: 100%
    h4
      display: inline-block
      i
        color: #333
    select
    input
      margin: 0 10px
    select
      min-width: 134px
      max-width: 100%
      border-radius: 0
      padding: 5px
      border: 1px solid #efecec!important
      height: 31px
      color: #333

    .fa-user-plus
      margin-left: 5px
      color: #00d1ff

.user-form
  background: #fff
  display: block
  width: 100%
  float: left
  margin-top: 10px
  .user-form-box
    float: left
    width: 100%
    border-bottom: 1px solid #f2f1f1
    .t-box
      display: inline-block
      min-width: 14%
      float: left
      padding: 10px
      text-align: center
      i
        vertical-align: middle
        margin: 0 5px
      span
        display: inline-block
        margin: 6px 0
      select
        min-width: 134px
        max-width: 100%
        border: 1px solid #efecec!important

</style>
