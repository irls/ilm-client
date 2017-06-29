import axios from 'axios'
import api_config from './api_config.js'

export default {
    data() {
      return {
        tc_test: 'Test property',
        tc_currentBookTasks: {"tasks": [], "task": {}},//list of tasks linked to current book for current user
        tc_tasksByBlock: {}
      }
    },
    mounted() {
      this.tc_loadBookTask()
    },
    mixins: [api_config],
    methods: {
      tc_loadBookTask() {
        var self = this
        if (this.$store.state.currentBookid) {
          axios.get(self.API_URL + 'tasks/book/' + this.$store.state.currentBookid)
            .then((list) => {
              self.tc_tasksByBlock = {}
              list.data.tasks.forEach(t => {
                if (t.comment) {
                  t.comment = t.comment.replace('\n', '<br>');
                }
                if (t.blockid) {
                  self.tc_tasksByBlock[t.blockid] = t
                }
              })
              
              self.tc_currentBookTasks = list.data

            })
            .catch((err) => {})
        }
      },
      tc_hasTask(type) {
        return this.tc_currentBookTasks.assignments && this.tc_currentBookTasks.assignments.indexOf(type) !== -1;
      },
      tc_getTask(type) {
        let task = this.tc_currentBookTasks.tasks.find((t) => {
          return t.type == type
        })
        return task ? task : {}
      }
    }
}