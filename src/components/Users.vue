<template>
  <div>

    <div class="table toolbar">
      <div class="tr">
        <div class='td'>
          <i class="fa fa-users"></i>
        </div>
        <div class='td'>
          <h4>{{users.length}} Active Users</h4>
        </div>
        <div class='td'>
          <select class="userselect form-control">
            <option value="12" selected="">Show All</option>
            <option value="13">Show Active</option>
            <option value="14">Show Inactive</option>
          </select>
        </div>
        <div class='td auto'></div>
        <div class='td'>
          <!-- <a href="#"><i class="fa fa-calendar-check-o"></i> All Work History</a> -->
          <!-- Edit Button -->
          <button @click='' class='btn btn-default'>
            <i class="fa fa-calendar-check-o"></i>  All Work History
          </button>  &nbsp;
        </div>
        <div class='td'>
          <input type="text" class="form-control" v-model="filterKey" placeholder="Filter">
        </div>
        <div class='td'>
          <!-- <a href="#" @click="userAddModalActive = true"><i class="fa fa-user-plus"></i> New User</a> -->
          <button @click='userAddModalActive = true' class='btn btn-default'>
            <i class="fa fa-user-plus"></i>  New User
          </button>  &nbsp;
        </div>
      </div>
    </div>



    <form class="user-form">
      <div v-for="user in pagedUsers" class="user-form-box">
        <div class="t-box"><span><i class="fa fa-user"></i>{{user.name}}</span></div>
        <div class="t-box"><span>{{user.email}}</span></div>
        <div class="t-box">
          <select-roles
            :selected="user.roles"
            @select="updateUser(user._id, 'roles', $event)"
          ></select-roles>
        </div>
        <div class="t-box">
          <select-languages
            :selected="user.languages || []"
            @select="updateUser(user._id, 'languages', $event)"
          ></select-languages>
        </div>
        <div class="t-box"><a href="#"><span><i class="fa fa-calendar-check-o"></i>Work History</span></a></div>

        <div class="t-box"><a href="#"><span><i class="fa fa-unlock"></i>Reset Password</span></a></div>

        <!-- <button @click='' class='btn btn-default t-box'>
          <i class="fa fa-unlock"></i>  Reset Password
        </button>  &nbsp; -->

        <div class="t-box" @click="updateUser(user._id, 'enable', !user.enable)">
          <template v-if="user.enable"><span>Active </span><i class="fa fa-toggle-on"></i></template>
          <template v-else><span>Disabled </span><i class="fa fa-toggle-off"></i></template>
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
import SelectRoles from './generic/SelectRoles'
import SelectLanguages from './generic/SelectLanguages'
import UserAddModal from './users/UserAddModal'
import Pagination from './generic/Pagination'
import { filteredData, pagedData } from '../filters'
import PouchDB from 'pouchdb'
import superlogin from 'superlogin-client'
import { mapGetters } from 'vuex'

const API_ALLUSERS = process.env.ILM_API + '/api/v1/users'

export default {

  name: 'Users',

  components: {
    UserAddModal,
    SelectRoles,
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
    },
    
    ...mapGetters([
      'isLoggedIn',
      'isAdmin',
      'isEditor',
      'isLibrarian'
    ]),

  },
  mounted () {
    var self = this
    /*axios.get(API_ALLUSERS)
    .then(response => {
      self.users = response.data
    })
    .catch(err => {
      console.log('Error: ', err);
    })*/
    PouchDB.sync('ilm_users', superlogin.getDbUrl('ilm_users'), { live: true }).on('change', change => {
      self.updateUsersList()
    }).catch(err => {
      //console.log('Error sync ilm_users')
      //console.log(err)
    })
    self.updateUsersList()
  },

  created () {
    
  },
  
  methods: {
    updateUser(user_id, field, new_value) {
      
      var ilmUsers = PouchDB('ilm_users')
      var user = ilmUsers.get(user_id).then(user => {
        
        if (!_.isEqual(user[field], new_value)) {
          user[field] = new_value
          var dbPath = superlogin.getDbUrl('ilm_users')
          if (process.env.DOCKER) dbPath = dbPath.replace('couchdb', 'localhost')

          var db = new PouchDB(dbPath)
          var api = db.hoodieApi()

          api.update(user_id, {
            [field]: new_value
          }).then(doc => {
            
          }).catch(err => {
            console.log('error DB pdate: ', err)
          })
        }
      }).catch(error => {})
      return false
    },
    
    updateUsersList() {
      var self = this
      let ilmUsers = PouchDB('ilm_users').hoodieApi()
      ilmUsers.findAll()
      .then(users => {
        self.users = users
      }).catch(err => {
        console.log('Error getting all users', err)
      })
    }
  },
  
  watch: {
    
  }

}
</script>


<style scoped>
.toolbar {
   width: 100%;
   height: 4em;
   position: relative;
   padding-left: .25em;
   padding-right: .25em;
   box-shadow: 0px 0px 3px 2px rgba(178, 191, 224, 0.53);
   margin-top: -10px;
 }
.toolbar td {
   text-align: left;
   padding-top:0; margin-top:0;
 }
.toolbar td.right {
  text-align: right;
  position: inline;
  padding-top: 11px;
  float: right;
  padding-right: 10px;
}

.table {
  display: table;
  /*border-spacing: 15px;*/
  padding: 0;
}
.tr {
 display: table-row;
}
.td {
  display: table-cell;
  vertical-align: middle;
  white-space: nowrap;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  padding: 5px;
}

.td input.form-control {display: inline-block !important;}

.tr .td:nth-child(1) {padding-left:10px; width: 4em;}
  .tr .td:nth-child(1) i {font-size: 24pt; color:#555;}
.tr .td:nth-child(2) {width: 12em;}
  .tr .td:nth-child(2) h4 {font-size: 24px; padding-right: .5em;}
.tr .td:nth-child(3) {font-size: 18px; width: 8em; line-height: 1.5em}
.tr .td:nth-child(4) {width: auto; }
.tr .td:nth-child(5) {width: 10em; text-align: right;}
.tr .td:nth-child(6) {width: 12em;  }
.tr .td:nth-child(7) {width: 8em; padding-right: 10px; }

.user-form-box:nth-of-type(odd) {bakground-color: #f9f9f9}
</style>

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
      .form-control
        width: 150px
        .btn-content
          margin: 2px 0

</style>
