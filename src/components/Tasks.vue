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
              <i class="fa fa-plus"></i>&nbsp;New Job
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
      <div class="table tasks-box">
      <section v-for="job in tasks.list">
        <div class="tr">
          <div class="td task-type">
            <h2><i class="fa fa-book" data-toggle="tooltip" v-bind:title="job.description"></i>&nbsp;{{job.title}}&nbsp;({{job.total}})&nbsp;<i :class="[job.tasksVisible ? 'fa-chevron-up' : 'fa-chevron-down' , 'fa collapsebtn']" aria-hidden="true" @click='job.tasksVisible = !job.tasksVisible'></i></h2>
          </div>
          <!--<div class="td"></div>-->
        </div>
        <transition name="fade">
        <section v-if="job.tasksVisible">
          <div v-for="task in job.tasks" class="tr subtasks-box">
            <div class="task-title-box td">
              <h4>({{task.count}})&nbsp;{{task.title}}</h4>
            </div>

            <div class="subtask-items-box td">
              <div class="subtask-item-box">
                <button class="btn btn-default" v-if="!job.bookid && task.type == 1" v-on:click="importBook(job._id)">
                  <i class="fa fa-pencil"></i>Import book "{{job.title}}"
                </button>
                <a v-else :href="'/books/edit/' + job.bookid">{{job.bookid}}&nbsp;<i class="fa fa-arrow-circle-o-right"></i></a>
              </div>
            </div>
          </div>
        </section>
        </transition>
      </section>
      <!--<section v-for="job in tasks.list">-->
      </div>
      <!--<div class="table  tasks-box">-->
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
import { mapGetters, mapActions } from 'vuex'
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
      axios.get(API_URL + 'tasks').then(tasks => {
        let tasks_formatted = {total: 0, list: []};
        let jobs = tasks.data.rows;
        for (let jobId in jobs) {

          this.getBookMeta(jobs[jobId].bookid).then(meta => {
              jobs[jobId].title = meta.title;
          }).catch(error => {});

          tasks_formatted.list.push(jobs[jobId]);
          jobs[jobId].total = jobs[jobId].tasks.length;
          tasks_formatted.total += jobs[jobId].total;
          jobs[jobId].tasksVisible = false;

          jobs[jobId].tasks = jobs[jobId].tasks.reduce((acc, val)=>{
            let key = 'type_'+val.type;
            if (acc.hasOwnProperty(key)) acc[key].count ++;
            else {
                val.title = this.task_types.tasks.find((s_type) => {
                    return s_type._id == val.type
                }).title;
                acc[key] = {count:1, ...val};
            }
            return  acc;
          }, {} );

        }
        this.tasks = tasks_formatted;
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
    },

    ...mapActions([
        'getBookMeta'
    ])
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

.task-type.td {
  width: 500px;
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
.tasks-box .task-type i.fa.fa-book{
  font-size: 35px;
  margin-left: -35px;
}
.subtasks-box:nth-of-type(even) {
  background-color: #f9f9f9;
}

.collapsebtn {
    width: 30px; height: 30px;
    display: inline-block;
    background: white;
    padding: 5px;
    border: .5px solid rgb(204, 212, 226);
    border-radius: 25px;
    box-shadow: 0px 0px 5px 1px rgba(0,0,0,0.2);
    color: rgba(204, 212, 226, 1);
    cursor: pointer;

    &:hover {
      color: green;
    }
}
</style>
