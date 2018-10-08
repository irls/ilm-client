import axios from 'axios'
import api_config from './api_config.js'
import access from './access.js';
import {mapGetters} from 'vuex';

export default {
    data() {
      return {
        tc_test: 'Test property'
      }
    },
    mounted() {

    },
    mixins: [api_config, access],
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
        return this._is('editor', true)
      },
      tc_isShowApproveContentFixAction(blockid) {
        return this.$store.state.tc_tasksByBlock[blockid] && this.$store.state.tc_tasksByBlock[blockid].type == 7;
      },
      tc_showBlockNarrate(block_id) {
        if (!this.$store.state.tc_tasksByBlock[block_id]) {
          return false;
        }
        return this.$store.state.tc_tasksByBlock[block_id].find(t => {
          return ['narrate-block', 'fix-block-narration'].indexOf(t.type) !== -1;
        });
      },
      tc_hasBlockTask(block_id, type) {
        if (!this.$store.state.tc_tasksByBlock[block_id]) {
          return false;
        }
        return this.$store.state.tc_tasksByBlock[block_id].find(t => {
          return t.type === type;
        });
      },
      tc_getBlockTaskOtherRole(blockid) {
        if (this.$store.state.tc_currentBookTasks.can_resolve_tasks) {
          let tasks = this.$store.state.tc_currentBookTasks.can_resolve_tasks.find((t) => {
            return t.blockid == blockid;
          })
          if (tasks && tasks.isArray) return tasks[0];
          return tasks;
        } else {
          return false;
        }
      },
      tc_showBlockAudioEdit(blockid) {
        if (this._is('editor', true) || this.tc_hasTask('content_cleanup') || this.tc_hasTask('audio_mastering')) {
          return true;
        }
        if (!this.$store.state.tc_tasksByBlock[blockid]) {
          return false;
        }
        return this.$store.state.tc_tasksByBlock[blockid].find(t => {
          return ['narrate-block', 'fix-block-narration', 'fix-block-text', 'approve-new-block', 'approve-modified-block'].indexOf(t.type) !== -1;
        });
      }
    },
    computed: {
      ...mapGetters(['currentBookMeta'])
    }
}
