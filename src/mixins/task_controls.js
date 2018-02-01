import axios from 'axios'
import api_config from './api_config.js'
import {mapGetters} from 'vuex';

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
      tc_getBlockTask(blockid) {
        let tasks = this.$store.state.tc_currentBookTasks.tasks.find((t) => {
          return t.blockid == blockid;
        })
        if (tasks && tasks.isArray) return tasks[0];
        return tasks;
      },
      tc_isShowRejectBlockAction(blockid) {
        return this.tc_hasTask('content_approve') && this.$store.state.tc_currentBookTasks.rejected_blocks.content.indexOf(blockid) === -1;
      },
      tc_isShowCorrectBlockAction(blockid) {
        return this.$store.state.tc_tasksByBlock[blockid] && this.$store.state.tc_tasksByBlock[blockid].type == 6
      },
      tc_isShowEdit(blockid) {
        return !this.currentBookMeta.publishedVersion && (this.tc_hasTask('content_cleanup')
              || this.$store.state.isAdmin
              || this.$store.state.isEditor)
      },
      tc_isShowApproveContentFixAction(blockid) {
        return this.$store.state.tc_tasksByBlock[blockid] && this.$store.state.tc_tasksByBlock[blockid].type == 7;
      },
      tc_showBlockNarrate(block_id) {
        if (!this.$store.state.tc_tasksByBlock[block_id]) {
          return false;
        }
        return this.$store.state.tc_tasksByBlock[block_id].find(t => {
          return t.type === 'narrate-block';
        });
      },
      tc_hasBlockTask(block_id, type) {
        if (!this.$store.state.tc_tasksByBlock[block_id]) {
          return false;
        }
        return this.$store.state.tc_tasksByBlock[block_id].find(t => {
          return t.type === type;
        });
      }
    },
    computed: {
      ...mapGetters(['currentBookMeta'])
    }
}
