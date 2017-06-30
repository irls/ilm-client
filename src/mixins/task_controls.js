import axios from 'axios'
import api_config from './api_config.js'

export default {
    data() {
      return {
        tc_test: 'Test property'
      }
    },
    mounted() {
      
    },
    mixins: [api_config],
    methods: {
      
      tc_hasTask(type) {
        return this.$store.state.tc_currentBookTasks.assignments && this.$store.state.tc_currentBookTasks.assignments.indexOf(type) !== -1;
      },
      tc_getTask(type) {
        let task = this.$store.state.tc_currentBookTasks.tasks.find((t) => {
          return t.type == type
        })
        return task ? task : {}
      },
      tc_isShowRejectBlockAction(blockid) {
        return this.tc_hasTask('content_approve') && this.$store.state.tc_currentBookTasks.rejected_blocks.content.indexOf(blockid) === -1;
      },
      tc_isShowCorrectBlockAction(blockid) {
        return this.$store.state.tc_tasksByBlock[blockid] && this.$store.state.tc_tasksByBlock[blockid].type == 6
      },
      tc_isShowEdit(blockid) {
        return this.tc_hasTask('content_cleanup') || (this.$store.state.tc_tasksByBlock[blockid] && [6].indexOf(this.$store.state.tc_tasksByBlock[blockid].type) !== -1)
      },
      tc_isShowApproveContentFixAction(blockid) {
        return this.$store.state.tc_tasksByBlock[blockid] && this.$store.state.tc_tasksByBlock[blockid].type == 7;
      },
      tc_allowMetadataEdit() {
        return this.tc_hasTask('metadata_cleanup') || this.tc_hasTask('metadata_fix')
      }
    }
}