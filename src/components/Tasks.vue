<template>
  <vue-tabs>
    <v-tab title="My Tasks">
      <div class="table toolbar">
        <div class="tr">
          <div class='td'>
            <h3><i class="fa fa-arrow-circle-o-right"></i>&nbsp;{{tasks.total}} Current tasks in your Queue</h3>
          </div>
          <div class='td'>
            <button @click='taskAddModalActive = true' class='btn btn-default'>
              <i class="fa fa-plus"></i>&nbsp;New Task
            </button>
          </div>
        </div>
      </div>
      <task-add-modal 
        :show="taskAddModalActive"
        :task_types="task_types"
        :users="users"
        @closed="taskAddModalClose">
        
      </task-add-modal>
      <div v-for="task in tasks.list" class="tasks-box table">
        <div class="task-type tr">
          <div class="td">
            <h2><i class="fa fa-book"></i>&nbsp;{{task.type}}&nbsp;({{task.list.length}})</h2>
          </div>
        </div>
        <div v-for="subtask in task.list" class="subtasks-box tr">
          <div class="subtask-title-box td">
            <h4>({{subtask.list.length}})&nbsp;{{subtask.type}}</h4>
          </div>
          <div class="subtask-items-box td">
            <div v-for="item in subtask.list" class="subtask-item-box">
              <a :href="'/books/edit/' + item.book_id">{{item.book_title}}&nbsp;<i class="fa fa-arrow-circle-o-right"></i></a>
            </div>
          </div>
        </div>
      </div>
    </v-tab>
    <v-tab title="Work History"></v-tab>
  </vue-tabs>
</template>

<script>
import { VueTabs, VTab } from 'vue-nav-tabs'
import 'vue-nav-tabs/dist/vue-tabs.min.css'
import axios from 'axios'
import TaskAddModal from './tasks/TaskAddModal'
const TASKS_URL = '/static/tasks.json'//process.env.ILM_API + '/api/v1/tasks'
const TASK_TYPES_URL = '/static/task_types.json'//process.env.ILM_API + '/api/v1/tasks/types'
const TASK_USERS_URL = process.env.ILM_API + '/api/v1/tasks/users'
export default {
  data () {
    return {
      msg: 'Assignments',
      taskAddModalActive: false,
      tasks: {
        list: [],
        total: 0
      },
      task_types: [],
      users: {
        'editor': [],
        'proofer': [],
        'engineer': [],
        'reader': []
      }
    }
  },
  
  components: {
    VueTabs,
    VTab,
    TaskAddModal
  },
  
  mounted() {
    this.getTasks()
    this.getTaskTypes()
    this.getTaskUsers()
  },
  
  methods: {
    getTasks() {
      //axios.get(process.env.ILM_API + '/api/v1/tasks')
      var self = this
      axios.get(TASKS_URL).then(tasks => {
        self.tasks = tasks.data
      })
      .catch(error => {})
    },
    taskAddModalClose(create) {
      this.taskAddModalActive = false
    },
    getTaskTypes() {
      var self = this
      axios.get(TASK_TYPES_URL).then(types => {
        self.task_types = types.data
      })
      .catch(error => {})
    },
    getTaskUsers() {
      var self = this
      axios.get(TASK_USERS_URL).then(users => {
        for (var role in self.users) {
          self.users[role] = []
          for (var i in users.data) {
            if (users.data[i].roles.indexOf(role) != -1) {
              self.users[role].push(users.data[i])
            }
          }
        }
      })
      .catch(error => {})
    }
  }
}
</script>


<style scoped>
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
.toolbar td.right {
  text-align: right;
  position: inline;
  padding-top: 11px;
  float: right;
  padding-right: 10px;
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
  white-space: nowrap;
  padding: 5px;
}
.tasks-box {
  width: 100%;
  margin-left: 35px;
}
.tasks-box .task-type {
  
}
.subtasks-box {
  display: table-row;
}
.subtask-title-box {
  padding: 5px 25px 5px 5px;
  width: 5em;
}
.subtask-items-box {
  
}
.subtask-item-box {
  padding: 5px 10px;
}
.tasks-box .task-type i.fa {
  font-size: 35px;
  margin-left: -35px;
}
.subtask-list-box {
  display: inline-block;
}
.subtasks-box:nth-of-type(even) {
  background-color: #f9f9f9;
}
</style>
