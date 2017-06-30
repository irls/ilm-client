<template>
  <div>
    <div class="table toolbar">
      <div class="tr">
        <div class='td'>
          <h3 v-if="!all_users"><i class="fa fa-calendar"></i>&nbsp;Work history, {{work_history.total}} {{work_history.total | pluralize('Submission')}}</h3>
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
    <div v-for="task in work_history.list" class="task-history" v-if="!all_users">
      <h3><i class="fa fa-book"></i>&nbsp;{{task.type}} - {{task.estimate}} {{task.estimate | pluralize('hour')}}</h3>
      <ol class="task-history-row">
        <li v-for="subtask in task.list">
          <a :href="'/books/edit/' + subtask.bookid">{{subtask.book_title}}, {{subtask.estimate}} {{subtask.estimate | pluralize('hour')}}</a>
        </li>
      </ol>
    </div>
    <accordion v-if="all_users" :one-at-atime="true">
      <div v-for="row in work_history_total" class="task-panel">
        <i class="fa fa-user"></i>
        <panel :is-open="false" :header="row.user + ': ' + row.user_role" v-bind:key="row.user">
          <div v-for="task_type in row.list">
            <h4><i class="fa fa-book"></i>&nbsp;{{task_type.type}} - {{minutesToHours(task_type.estimate)}} {{minutesToHours(task_type.estimate) | pluralize('hour')}}</h4>
            <ol>
              <li v-for="task in task_type.list"><a :href="'/books/edit/' + task.bookid">{{task.book_title}}, {{minutesToHours(task.estimate)}} {{minutesToHours(task.estimate) | pluralize('hour')}}</a></li>
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

Vue.use(Vue2Filters)
const API_URL = process.env.ILM_API + '/api/v1/'
export default {
  data() {
    return {
      work_history: {
        list: [],
        total: 0
      },
      work_history_total: [],
      date_filter_format: 'MMMM/dd/yyyy',
      filter: {
        from: '',
        to: ''
      },
      url: '',
      all_users: false
    }
  },

  props: [
    'task_types',
    'current_user'
  ],
  
  components: {
    datepicker,
    accordion,
    panel
  },
  
  computed: mapGetters([
    'isAdmin'
  ]),

  mounted() {
    var self = this
    self.all_users = !self.current_user && self.isAdmin
    self.url = !self.all_users ? API_URL + 'task_history/my' : API_URL + 'task_history'
    self.getWorkHistory()
  },
  
  watch: {
    'filter.from': function() {
      var self = this
      self.getWorkHistory()
    },
    'filter.to': function() {
      var self = this
      self.getWorkHistory()
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
          if (self.all_users) {
            self.parseWorkHistoryAll(response.data)
          } else {
            self.parseWorkHistory(response.data)
          }
        });
    },
    parseWorkHistory(data) {
      var self = this
      //console.log(self.filter, $('.date-to-filter input.datepicker-input').val())
      let work_history_formatted = {
        list: [],
        total: 0
      }
      data.rows.forEach((row) => {
        let subtype = self.task_types.tasks.find((tt) => {
          return tt._id == row.type
        })
        if (subtype) {
          let existing_list_record = work_history_formatted.list.find((l) => {
            return l.type_id == subtype._id
          })
          if (!existing_list_record) {
            work_history_formatted.list.push({
              type_id: subtype._id,
              type: subtype.title,
              list: [],
              estimate: 0
            })
            existing_list_record = work_history_formatted.list[work_history_formatted.list.length - 1]
          }
          row.estimate = self.minutesToHours(row.estimate)
          existing_list_record.list.push(row)
          existing_list_record.estimate+= row.estimate
          work_history_formatted.total++
        }
      })
      self.work_history = work_history_formatted
    },
    parseWorkHistoryAll(data) {
      var self = this
      var work_history_formatted = []
      data.rows.forEach((row) => {
        let existing_user_record = work_history_formatted.find((whr) => {
          return whr.user_id == row.executor
        })
        let subtype = self.task_types.tasks.find((tt) => {
          return tt._id == row.type
        })
        if (!existing_user_record) {
          let user_roles = ''
          ROLES.forEach((role) => {
            if (role.rank != 'user' && row.executor_roles.indexOf(role.rank) !== -1) {
              user_roles+=role.name + ', '
            }
          })
          work_history_formatted.push({
            user_id: row.executor,
            user: row.executor_name,
            user_role: user_roles.replace(/, $/, ''),
            list: []
          })
          existing_user_record = work_history_formatted[work_history_formatted.length - 1]
        }
        let existing_type_record = existing_user_record.list.find((eur) => {
          return eur.type_id == row.type
        })
        if (!existing_type_record) {
          existing_user_record.list.push({
            type_id: row.type,
            type: subtype ? subtype.title : '',
            list: [],
            estimate: 0
          })
          existing_type_record = existing_user_record.list[existing_user_record.list.length - 1]
        }
        existing_type_record.estimate+= row.estimate
        existing_type_record.list.push({
          bookid: row.bookid,
          book_title: row.book_title,
          estimate: row.estimate
        })
      })
      self.work_history_total = work_history_formatted
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