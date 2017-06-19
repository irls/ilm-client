<template>
  <vue-tabs>
    <v-tab title="My Tasks" :beforeChange="onTabChange">
      <div class="table toolbar">
        <div class="tr">
          <div class='td'>
            <h3><i class="fa fa-arrow-circle-o-right"></i>&nbsp;{{tasks.total}} Current tasks in your Queue</h3>
          </div>
          <div class='td'>
            <button @click='taskAddModalActive = true' class='btn btn-default' v-if="isAdmin || isLibrarian">
              <i class="fa fa-plus"></i>&nbsp;New Task
            </button>
          </div>
        </div>
      </div>
      <task-add-modal 
        :show="taskAddModalActive"
        :users="users"
        @closed="taskAddModalClose">
        
      </task-add-modal>
      <!-- Import Books Modal Popup -->
      <BookImport v-if="show_import_book_modal" :multiple="false" @close_modal="importBookClose" :userTaskId="import_book_task_id" />
      <div v-for="task in tasks.list" class="tasks-box table">
        <div class="task-type tr">
          <div class="td">
            <h2><i class="fa fa-book"></i>&nbsp;{{task.type}}&nbsp;({{task.total}})</h2>
          </div>
        </div>
        <div v-for="subtask in task.list" class="subtasks-box tr">
          <div class="subtask-title-box td">
            <h4>({{subtask.list.length}})&nbsp;{{subtask.type}}</h4>
          </div>
          <div class="subtask-items-box td">
            <div v-for="item in subtask.list" class="subtask-item-box">
              <button class="btn btn-default" v-if="!item.book_id && subtask.type_id == 1" v-on:click="importBook(item.task_id)">
                <i class="fa fa-pencil"></i>
                Import book "{{item.book_title}}"
              </button>
              <a v-else :href="'/books/edit/' + item.book_id">{{item.book_title}}&nbsp;<i class="fa fa-arrow-circle-o-right"></i></a>
            </div>
          </div>
        </div>
      </div>
    </v-tab>
    <v-tab title="Work History">
      <TaskHistory :task_types="task_types" :current_user="true"></TaskHistory>
    </v-tab>
    <v-tab v-if="isAdmin" title="Total work history">
      <TaskHistory :task_types="task_types" :current_user="false"></TaskHistory>
    </v-tab>
  </vue-tabs>
</template>

<script>
import { VueTabs, VTab } from 'vue-nav-tabs'
import 'vue-nav-tabs/dist/vue-tabs.min.css'
import axios from 'axios'
import TaskAddModal from './tasks/TaskAddModal'
import TaskHistory from './tasks/TaskHistory'
import superlogin from 'superlogin-client'
import BookImport from './books/BookImport'
import { mapGetters } from 'vuex'
var BPromise = require('bluebird');
const API_URL = process.env.ILM_API + '/api/v1/'
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
        'reader': [],
        'narrator': []
      },
      show_import_book_modal: false,
      import_book_task_id: ''
    }
  },
  
  components: {
    VueTabs,
    VTab,
    TaskAddModal,
    BookImport,
    TaskHistory
  },
  
  computed: mapGetters([
    'isAdmin',
    'isLibrarian'
  ]),
  
  mounted() {
    var self = this
    self.getTaskTypes().then(function(){
      self.getTasks()
    })
    self.getTaskUsers()
  },
  
  methods: {
    getTasks() {
      //axios.get(process.env.ILM_API + '/api/v1/tasks')
      var self = this
      axios.get(API_URL + 'tasks').then(tasks => {
        //console.log(self.task_types, tasks)
        let tasks_formatted = {total: 0, list: []}
        tasks.data.rows.forEach((record) => {
          let subtype = self.task_types.tasks.find((s_type) => {
            return s_type._id == record.type
          })
          //console.log(subtype, record.type)
          let type = self.task_types.categories.find((tt) => {
            return tt._id == subtype.category_id
          })
          let existing_record = tasks_formatted.list.find((t) => {
            return t.type_id == type._id
          })
          if (!existing_record) {
            if (type) {
              tasks_formatted.list.push({
                type: type.title,
                type_id: type._id,
                list: [],
                total: 0
              })
              existing_record = tasks_formatted.list[tasks_formatted.list.length - 1]
            }
          }
          if (existing_record) {
            let existing_subtype_record = existing_record.list.find((erl) => {
              return erl.type_id == subtype._id
            })
            if (!existing_subtype_record) {
              existing_record.list.push({
                type: subtype.title,
                type_id: subtype._id,
                list: []
              })
              existing_subtype_record = existing_record.list[existing_record.list.length - 1]
            }
            existing_subtype_record.list.push({
              book_title: record.title,
              book_id: record.bookid,
              task_id: record._id
            })
            tasks_formatted.total++
            existing_record.total++
          }
        })
        self.tasks = tasks_formatted
        //console.log(self.tasks)
      })
      .catch(error => {})
    },
    taskAddModalClose(create) {
      this.taskAddModalActive = false
      if (create) {
        this.getTasks()
      }
    },
    getTaskTypes() {
      var self = this
      return axios.get(API_URL + 'tasks/types').then(types => {
        self.task_types = types.data
        return BPromise.resolve(self.task_types)
      })
      .catch(error => {
        return BPromise.reject({})
      })
    },
    getTaskUsers() {
      var self = this
      axios.get(API_URL + 'tasks/users').then(users => {
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
    },
    importBook(task_id) {
      this.import_book_task_id = task_id
      this.show_import_book_modal = true
    },
    importBookClose(response) {
      let self = this
      self.show_import_book_modal = false
      //console.log(response)
      self.getTasks()
      self.import_book_task_id = ''
    },
    onTabChange() {
      return true
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
