<template>
  <div>
    <div class="table toolbar" v-if="!in_modal">
      <div class="tr">
        <div class='td'>
          <h3 v-if="!all_users"><i class="fa fa-calendar"></i>&nbsp;Work history, {{submissions}} {{submissions | pluralize('Submission')}}</h3>
          <h3 v-else><i class="fa fa-calendar"></i>&nbsp;Total Work history</h3>
        </div>
        <div class="td"></div>
        <div class='td date-filter date-from-filter'>
          <datepicker v-model="filter.from" :value="filter.from" :format="date_filter_format" :clear-button="true"></datepicker>
        </div>
        <div class="td">
          <i class="fa fa-calendar"></i>
        </div>
        <div class="td date-filter date-to-filter">
          <datepicker v-model="filter.to" :value="filter.to" :format="date_filter_format" :clear-button="true"></datepicker>
        </div>
        <div class="td">
          <i class="fa fa-calendar"></i>
        </div>
      </div>
    </div>
    <div v-for="book in work_history_total.books" class="task-history" v-if="!all_users">
      <h3><i class="fa fa-book"></i>&nbsp;{{book.book.title}}</h3>
      <ol class="task-history-row">
        <li v-for="task in book.tasks">
          <a :href="'/books/edit/' + book.book._id">{{task.title}}, {{task.count}} {{task.count | pluralize('task')}}, {{task.estimate}} {{task.estimate | pluralize('hour')}}</a>
        </li>
      </ol>
    </div>
    <accordion v-if="all_users && work_history_total" :one-at-atime="true">
      <div v-for="row in work_history_total" class="task-panel">
        <i class="fa fa-user"></i>
        <panel :is-open="false" :header="row.user.name + ': ' + row.user.roles_combined" v-bind:key="row.user.name">
          <div v-for="book in row.books">
            <h4><i class="fa fa-book"></i>&nbsp;{{book.book.title}}</h4>
            <ol>
              <li v-for="task in book.tasks"><a :href="'/books/edit/' + book.book._id">{{task.title}}, {{task.count}} {{task.count | pluralize('task')}}, {{task.estimate}} {{task.estimate | pluralize('hour')}}</a></li>
            </ol>
          </div>
        </panel>
      </div>
    </accordion>

  </div>
</template>
<script>
import Vue from 'vue'
import Vue2Filters from 'vue2-filters'
import axios from 'axios'
import { datepicker, accordion, panel } from 'vue-strap'
import { mapGetters } from 'vuex'
import ROLES from '../../../static/roles.json'
import api_config from '../../mixins/api_config.js'
var BPromise = require('bluebird');
Vue.use(Vue2Filters)

export default {
  data() {
    return {
      work_history_total: {},
      date_filter_format: 'MMMM/dd/yyyy',
      filter: {
        from: '',
        to: ''
      },
      url: '',
      all_users: false,
      submissions: 0,
      task_types: []
    }
  },

  name: 'taskHistory',

  props: [
    '_task_types',
    'current_user',
    'user_id',
    'in_modal'
  ],

  components: {
    datepicker,
    accordion,
    panel
  },

  mixins: [
    api_config
  ],

  computed: mapGetters([
    'isAdmin', 'allBooks'
  ]),

  mounted() {
    this.all_users = !this.current_user && !this.user_id && this.isAdmin
    this.url = !this.all_users ? (this.user_id ? this.API_URL + 'tasks/history/user/' + this.user_id : this.API_URL + 'tasks/history/my') : this.API_URL + 'tasks/history'
    if (!this._task_types.length) {
      this.getTaskTypes()
        .then(tt => {
          this.getWorkHistory()
        })
    } else {
      this.task_types = this._task_types
      this.getWorkHistory()
    }
  },

  watch: {
    'filter.from': function() {
      this.getWorkHistory()
    },
    'filter.to': function() {
      this.getWorkHistory()
    }
  },

  methods: {
    getWorkHistory() {
      var self = this
      if (self.filter.from && self.filter.to) {
        let from = new Date(self.filter.from)
        let to = new Date(self.filter.to)
        if (from.getTime() > to.getTime()) {
          self.filter.to = self.filter.from
          //$('.date-to-filter input.datepicker-input').val(self.filter.to).trigger('change')
          return false
        }
      }
      axios.get(self.url + '?filter[from]=' + self.filter.from + '&filter[to]=' + self.filter.to)
        .then((response) => {
          if (self.filter.to != $('.date-to-filter input.datepicker-input').val()) {
            $('.date-to-filter input.datepicker-input').val(self.filter.to).trigger('change')
          }
          self.parseWorkHistory(response.data)
        });
    },
    parseWorkHistory(data) {
      //var work_history_formatted = []
      this.submissions = 0
      for (let user_id in data) {
        let user = data[user_id];
        for (let bookid in user.books) {
          let _book = user.books[bookid];
          let book = _book.book
          let meta = this.allBooks.find(b => {
            return b.bookid == bookid;
          });
          book.title = meta ? meta.title : '<book>';
          book._id = bookid;
          for (let taskid in _book.tasks) {
            let task = _book.tasks[taskid]
            let _task = this.task_types.tasks.find(t => {
              return t._id == taskid
            })
            task.title = _task ? _task.title : '<task>'
            task.estimate = this.minutesToHours(task.estimate)
            this.submissions+= task.count
          }
        }
        //work_history_formatted.push(data[user_id])
        user.user.roles_combined = ''
        user.user.roles.forEach(r => {
          let role = ROLES.find(_r => {
            return _r.rank != 'user' && _r.rank == r
          })
          if (role) {
            user.user.roles_combined+= role.name + ', '
          }
        });
        user.user.roles_combined = user.user.roles_combined.replace(/, $/, '')
      }
      if (this.all_users) {
        this.work_history_total = data
      } else {
        let keys = Object.keys(data)
        this.work_history_total = keys.length > 0 ? data[keys[0]] : []
      }
      //console.log(this.work_history_total)
    },
    minutesToHours(minutes, precision) {
      if (minutes % 60 == 0) {
        return parseInt(minutes) / 60
      } else {
        return (parseInt(row.estimate) / 60).toFixed(precision)
      }
    },
    filterChanged() {
      console.log(this.filter)
    },
    getTaskTypes() {
      return axios.get(this.API_URL + 'tasks/types').then(types => {
        this.task_types = types.data
        return BPromise.resolve(this.task_types)
      })
      .catch(error => {
        return BPromise.reject({})
      })
    }
  }
}
</script>
<style>
.toolbar {
   width: 100%;
   position: relative;
   padding-left: .25em;
   padding-right: .25em;
   box-shadow: 0px 0px 3px 2px rgba(178, 191, 224, 0.53);
   padding: 5px;
 }
.toolbar td {
   text-align: left;
   padding-top:0; margin-top:0;
}
.toolbar h3 {
  margin: 0px;
}
.toolbar h3 i.fa {
  font-size: 30px;
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

  padding: 5px;
}
.task-history i.fa {
  font-size: 35px;
}
.task-history-row {
  margin-left: 40px;
  font-size: 20px;
}
.date-filter {
  width: 10em;
}
.panel-title {
  font-size: 20px;
}
.task-panel {
  position: relative;
  font-size: 20px;
}
.task-panel i.fa-user {
  position: absolute;
  top: 7px;
  left: 10px;
  font-size: 25px;
}
.task-panel .panel-heading h4 {
  margin-left: 25px;
}
</style>
