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
            :selected="user.privilege"
            @select="val => { user.privilege = val }"
          ></select-privileges>
        </div>
        <div class="t-box">
          <select-languages
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

<style scoped>
/* TODO remove unnecessary code */
.t-box i,div#no-more-tables p,p.user-profile i,td.user-table i {
    vertical-align: middle
}

.header-blue {
    background: 0 0;
    padding-bottom: 0;
    font-family: 'Source Sans Pro',sans-serif
}

@media (max-width: 767px) {
    .header-blue {
        padding-bottom:80px
    }
}

.header-blue .navbar {
    background: #262626;
    padding-top: 12px;
    padding-bottom: 0;
    color: #fff;
    border-radius: 0;
    box-shadow: none;
    border: none;
    border-bottom: 4px solid #f85050;
    margin-bottom: 0
}

.header-blue .navbar .navbar-collapse,.header-blue .navbar .navbar-form,.header-blue .navbar .navbar-toggle {
    border-color: rgba(255,255,255,.3)
}

@media (max-width: 767px) {
    .header-blue .navbar {
        padding-top:0;
        padding-bottom: 0
    }

    .header-blue .navbar .navbar-header {
        padding-top: 10px;
        padding-bottom: 10px
    }

    .header-blue .navbar .navbar-right {
        margin-bottom: 20px
    }

    .header-blue .navbar .navbar-form .search-field {
        display: inline-block;
        width: 80%
    }
}

.header-blue .navbar .navbar-brand {
    font-weight: 700;
    color: inherit
}

.header-blue .navbar .navbar-brand:hover {
    color: #f0f0f0
}

.header-blue .navbar .navbar-collapse p {
    margin-top: 10px;
    margin-bottom: 0
}

.header-blue .navbar .navbar-collapse p .login {
    color: #d9d9d9;
    margin-right: 10px;
    text-decoration: none
}

.header-blue .navbar .navbar-collapse p .login:hover {
    color: #fff
}

.header-blue .navbar .navbar-toggle:hover,.header-blue .navbar-toggle:focus {
    background: 0 0
}

.header-blue .navbar .navbar-toggle .icon-bar {
    background-color: #eee
}

.header-blue .navbar .navbar-nav>.active>a,.header-blue .navbar .navbar-nav>.open>a {
    background: 0 0;
    box-shadow: none
}

.header-blue .navbar.navbar-default .navbar-nav>.active>a,.header-blue .navbar.navbar-default .navbar-nav>.active>a:focus,.header-blue .navbar.navbar-default .navbar-nav>.active>a:hover {
    color: #fff;
    box-shadow: none;
    background: 0 0;
    pointer-events: none
}

.header-blue .navbar.navbar .navbar-nav>li>a {
    padding-left: 18px;
    padding-right: 18px
}

.header-blue .navbar.navbar-default .navbar-nav>li>a {
    color: #d9d9d9
}

.header-blue .navbar.navbar-default .navbar-nav>li>a:focus,.header-blue .navbar.navbar-default .navbar-nav>li>a:hover {
    color: #fff;
    background-color: transparent
}

.header-blue .navbar .navbar-nav>li>.dropdown-menu {
    margin-top: -5px;
    box-shadow: 0 4px 8px rgba(0,0,0,.1);
    background-color: #fff;
    border-radius: 2px
}

.header-blue .navbar .dropdown-menu>li>a,.header-blue .navbar .dropdown-menu>li>a:focus {
    line-height: 2;
    font-size: 14px;
    color: #37434d
}

.header-blue .navbar .dropdown-menu>li>a:focus,.header-blue .navbar .dropdown-menu>li>a:hover {
    background: #ebeff1
}

.header-blue .action-button,.header-blue .action-button:active {
    border: 1px solid rgba(255,255,255,0);
    color: #ebeff1;
    box-shadow: none;
    text-shadow: none;
    padding: 6px 15px;
    background: 0 0;
    transition: background-color .25s;
    outline: 0
}

.header-blue .action-button:hover {
    color: #fff
}

.header-blue .action-button.btn-lg {
    padding: 7px 18px
}

.header-blue .navbar .navbar-form label {
    color: #ccc
}

.header-blue .navbar .navbar-form .search-field {
    background: 0 0;
    border: none;
    border-bottom: 1px solid transparent;
    border-radius: 0;
    box-shadow: none;
    color: inherit;
    transition: border-bottom-color .3s
}

.header-blue .navbar .navbar-form .search-field:focus {
    border-bottom: 1px solid #ccc
}

.header-blue .hero {
    margin-top: 60px
}

@media (max-width: 767px) {
    .header-blue .hero {
        margin-top:20px;
        text-align: center
    }
}

.header-blue .hero h1 {
    color: #fff;
    font-size: 40px;
    margin-top: 190px;
    margin-bottom: 24px;
    font-weight: 300
}

@media (max-width: 991px) {
    .header-blue .hero h1 {
        margin-top:0;
        margin-bottom: 15px;
        line-height: 1.4
    }
}

.header-blue .hero p {
    color: rgba(18,18,18,.8);
    font-size: 20px;
    margin-bottom: 30px;
    font-weight: 300;
    padding: 0 10px
}

.header-blue .phone-holder {
    text-align: right
}

h4.modal-title,span.modal-sub-title {
    text-align: left;
    float: left;
    display: inline-block
}

.header-blue div.iphone-mockup {
    position: relative;
    max-width: 300px;
    margin: 20px;
    display: inline-block
}

.header-blue .iphone-mockup img.device {
    width: 100%;
    height: auto
}

.header-blue .iphone-mockup .screen {
    position: absolute;
    width: 88%;
    height: 77%;
    top: 12%;
    border-radius: 2px;
    left: 6%;
    border: 1px solid #444;
    overflow: hidden;
    /*background: url(screen-content-iphone-6.jpg) center;*/
    background-size: cover
}

.header-blue .iphone-mockup .screen:before {
    content: '';
    background-color: #fff;
    position: absolute;
    width: 70%;
    height: 140%;
    top: -12%;
    right: -60%;
    transform: rotate(-19deg);
    opacity: .2
}

label#mylabel,label.mylabel {
    width: 50px
}

span.modal-sub-title {
    border-bottom: 1px solid #3fd1ff;
    width: 100%;
    padding-bottom: 16px
}

h4.modal-title {
    font-size: 18px;
    margin-top: 17px;
    color: #00d1ff
}

div.modal-header {
    position: relative;
    border-bottom: 0 solid #e5e5e5
}

p.user-profile {
    position: absolute;
    bottom: -39px;
    right: 0
}

p.user-profile i {
    border: 1px solid #00d1ff;
    width: 60px;
    height: 60px;
    text-align: center;
    border-radius: 100%;
    font-size: 50px;
    color: #999
}

div.modal-body {
    margin-top: 20px
}

div.user .container {
    width: 100%
}

.user h3 {
    margin: 0;
    display: inline-block
}

.user-right {
    text-align: right
}

@media only screen and (max-width: 800px) {
    #no-more-tables table,#no-more-tables tbody,#no-more-tables td,#no-more-tables th,#no-more-tables thead,#no-more-tables tr {
        display:block
    }

    #no-more-tables thead tr {
        position: absolute;
        top: -9999px;
        left: -9999px
    }

    #no-more-tables tr {
        border: 1px solid #ccc
    }

    #no-more-tables td {
        border: none;
        border-bottom: 1px solid #eee;
        position: relative;
        padding-left: 50%;
        white-space: normal;
        text-align: left
    }

    #no-more-tables td:before {
        position: absolute;
        top: 6px;
        left: 6px;
        width: 45%;
        padding-right: 10px;
        white-space: nowrap;
        text-align: left;
        font-weight: 700;
        content: attr(data-title)
    }
}

.fa {
    font-size: 18px
}

div.table-header p {
    padding: 10px;
    display: inline-block
}

div.table-header {
    background-color: #fff;
    padding: 15px 12px;
    line-height: 0
}

body {
    background-color: #f2f1f1
}

input {
    border-radius: 0;
    border: 1px solid #f1f2f3;
    padding: 5px
}

table.table p {
    display: inline-block;
    padding: 0 10px
}

div#no-more-tables {
    padding: 0 15px
}

div#no-more-tables p {
    display: inline-block;
    padding: 0 5px
}

div#no-more-tables i {
    font-size: 17px
}

td {
    text-align: center
}

i.fa.fa-user-plus {
    margin-left: 5px;
    color: #00d1ff
}

td.user-table {
    color: #f85050
}

td.table-lock i {
    color: #f58e14
}

td.table-clander i {
    color: #17d017
}

i.fa.fa-users {
    color: #333
}

i.fa.fa-calendar {
    color: #4fd14f
}

div#no-more-tables td {
    border-bottom: 1px solid #ece9e9!important;
    padding: 10px;
    border: 0
}

td.user-table i {
    border: 1px solid #2eb7d4;
    border-radius: 100%;
    background: #fff;
    width: 25px;
    height: 25px;
    line-height: 20px
}

tr {
    transition: all .4s linear 0s
}

tr:hover {
    background: #e3effb!important
}

.right-filter {
    text-align: right
}

.onoffswitch {
    position: relative;
    width: 40px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    float: right;
    margin-left: -18px
}

.onoffswitch-checkbox {
    display: none
}

.onoffswitch-label {
    display: block;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 20px;
    height: 25px
}

.onoffswitch-inner {
    display: block;
    width: 200%;
    margin-left: -100%;
    transition: margin .3s ease-in 0s
}

.onoffswitch-inner:after,.onoffswitch-inner:before {
    display: block;
    float: left;
    width: 50%;
    height: 30px;
    padding: 0;
    line-height: 30px;
    font-size: 14px;
    font-family: Trebuchet,Arial,sans-serif;
    font-weight: 700;
    box-sizing: border-box
}

.onoffswitch-inner:before {
    content: "";
    padding-left: 10px;
    background-color: #34A7C1;
    color: #FFF
}

.onoffswitch-inner:after {
    content: "";
    padding-right: 10px;
    background-color: #EEE;
    color: #999;
    text-align: right
}

.onoffswitch-switch {
    display: block;
    width: 17px;
    margin: 4px;
    background: #FFF;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 14px;
    border-radius: 20px;
    transition: all .3s ease-in 0s;
    height: 17px
}

.onoffswitch-checkbox:checked+.onoffswitch-label .onoffswitch-inner {
    margin-left: 0
}

.onoffswitch-checkbox:checked+.onoffswitch-label .onoffswitch-switch {
    right: 0
}

span.onoffswitch-inner:before {
    background-color: #25e629
}

span.onoffswitch-inner:after {
    background-color: #999
}

.onswitch {
    width: 40px;
    position: relative;
    float: right;
    margin-top: -1px
}

.input--hoshi {
    overflow: hidden;
    position: relative;
    z-index: 1;
    display: inline-block;
    margin: 1em 1em 0;
    width: calc(100% - 2em)
}

.input__field--hoshi {
    margin-top: 0;
    padding: 7px;
    width: 100%;
    background: 0 0;
    color: #595F6E;
    border: 1px solid #f1f2f3;
    height: 34px
}

.input__label-content--hoshi {
    position: absolute
}

.input__label--hoshi::after,.input__label--hoshi::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 34px;
    border-bottom: 1px solid #f1f2f3
}

.input__label--hoshi::after {
    margin-top: 2px;
    border-bottom: 4px solid red;
    -webkit-transform: translate3d(-100%,0,0);
    transform: translate3d(-100%,0,0);
    -webkit-transition: -webkit-transform .3s;
    transition: transform .3s
}

.input__label--hoshi-color-1::after {
    border-color: #00a9ff
}

.input__label--hoshi-color-2::after {
    border-color: #0fa
}

.input__label--hoshi-color-3::after {
    border-color: #f50
}

.input--filled .input__label--hoshi::after,.input__field--hoshi:focus+.input__label--hoshi::after {
    -webkit-transform: translate3d(0,0,0);
    transform: translate3d(0,0,0)
}

.input--filled .input__label-content--hoshi,.input__field--hoshi:focus+.input__label--hoshi .input__label-content--hoshi {
    -webkit-animation: anim-1 .3s forwards;
    animation: anim-1 .3s forwards
}

@keyframes anim-1 {
    50% {
        opacity: 0;
        -webkit-transform: translate3d(1em,0,0);
        transform: translate3d(1em,0,0)
    }

    51% {
        opacity: 0;
        -webkit-transform: translate3d(-1em,-40%,0);
        transform: translate3d(-1em,-40%,0)
    }

    100% {
        opacity: 1;
        -webkit-transform: translate3d(0,-40%,0);
        transform: translate3d(0,-40%,0)
    }
}

span.input.input--hoshi i {
    position: absolute;
    top: 10px;
    left: 7px;
    color: #777
}

.hoshi-right,span.select-class {
    position: relative
}

.hoshi-right {
    float: right;
    width: 90%;
    height: 34px
}

.modal-dialog {
    width: 400px;
    margin-top: 10%
}

span.input.input--hoshi .form-control {
    float: right;
    width: 90%;
    border-radius: 0;
    border: 1px solid #f1f2f3;
    box-shadow: 0 0 0
}

.form-group {
    margin-bottom: 000
}

button.btn.btn-default {
    background: #214a80;
    border: none;
    padding: 6px 15px;
    box-shadow: none;
    text-shadow: none;
    outline: 0;
    color: #fff;
    border-radius: 0;
    transition: all .4s linear 0s
}

button.btn.btn-default:hover {
    background: #00d1ff
}

select {
    border: 1px solid #efecec!important;
    height: 31px;
    color: #333
}

span.select-class i {
    position: absolute;
    right: 7px;
    top: 0
}

span.input.input--hoshi .select-class {
    width: 100%;
    display: table
}

.t-box,.t-box span,.user h4 {
    display: inline-block
}

span.input.input--hoshi .select-class i {
    float: right;
    width: 20px;
    left: auto
}

input:focus,select:focus {
    outline: 0;
    box-shadow: 0 3px 8px 0 rgba(0,0,0,.2),0 0 0 1px rgba(0,0,0,.08)
}

a.navbar-brand.navbar-link {
    background: #080808
}

nav.navbar.navbar-default {
    padding: 0
}

select {
    min-width: 134px;
    max-width: 100%;
    border-radius: 0;
    padding: 5px
}

.header-blue .row {
    margin: 0
}

.user select,input {
    margin: 0 10px
}

.user i,.user-right a {
    margin-right: 10px
}

.t-box i {
    margin: 0 5px
}

.t-box {
    min-width: 14%;
    float: left;
    padding: 10px;
    text-align: center
}

.t-box span {
    margin: 6px 0
}

.user-form {
    background: #fff;
    display: block;
    width: 100%;
    float: left;
    margin-top: 10px
}

.user-form-box {
    float: left;
    width: 100%;
    border-bottom: 1px solid #f2f1f1
}

</style>
