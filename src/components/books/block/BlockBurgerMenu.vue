<template>
  <div v-if="showMenu" class="multi-block-burger-menu">
    <li v-if="isShowArchivedFlags" v-on:click="toggleArchFlags()">
      <i class="fa fa-eye" aria-hidden="true"></i>
        Show archived flags
    </li>
    <li v-else @click.prevent="toggleArchFlags()">
      <i class="fa fa-eye-slash" aria-hidden="true"></i>
        Hide archived flags
    </li>
    <li class="separator"></li>
    <template v-if="allowMultiAction">
      <li v-on:click="deleteBlocks()">
        <i class="fa fa-trash" aria-hidden="true"></i>
        Delete {{ selectedBlocksCount }} blocks
      </li>
    </template>
    <template v-else>
      <li class="disabled">
        <i class="fa fa-trash" aria-hidden="true"></i>
        Delete (max. 20 blocks)
      </li>
    </template>
    <template v-if="allowMultiJoin">
      <li v-if="hasLockInSelection">
        <i class="fa menu-preloader"></i>
        Join {{ selectedBlocksCount }} blocks
      </li>
      <li v-on:click="joinBlocks()" v-else>
        <i class="-re-join" aria-hidden="true"></i>
        Join {{ selectedBlocksCount }} blocks
      </li>
    </template>
    <template v-else>
      <li class="disabled">
        <i class="-re-join" aria-hidden="true"></i>
        Join (max. 20 unvoiced blocks)
      </li>
    </template>
    <li class="separator"></li>
    <li @click.stop="() => {return false}">
      <i class="fa fa-language" aria-hidden="true"></i>
      Language: 
      <select v-model="selectedLanguage" v-on:change="setLanguage">
        <option></option>
        <option v-for="(val, key) in languages" :value="key">{{ val }}</option>
      </select>
    </li>
  </div>
</template>
<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from 'vuex';

  import { Languages } from "../../../mixins/lang_config.js"
  import DeleteBlockWarning from './DeleteBlockWarning.vue';
  import JoinBlocksWarning from './JoinBlocksWarning.vue';

  import v_modal from 'vue-js-modal';
  
  Vue.use(v_modal, { dialog: true });

  export default {
    data() {
      return {
        languages: Languages,
        selectedLanguage: ''
      }
    },
    props: ['isHideArchFlags', 'block'],
    computed: {
      showMenu: {
        get() {
          return this.isMultiBlocksSelected && this.isBlockSelected(this.block.blockid);
        },
        cache: false
      },
      selectedBlocksCount: {
        get() {
          return this.selectedBlocksData.length;
        },
        cache: false
      },
      allowMultiAction: {
        get() {
          return this.selectedBlocksCount <= 20;
        },
        cache: false
      },
      allowMultiJoin: {
        get() {
          if (!this.allowMultiAction) {
            return false;
          }
          if (this.selectedBlocksCount > 2) {
            let voiced = this.selectedBlocksData.find(block => {
              return block.audiosrc && block.audiosrc.length > 0;
            });
            if (voiced) {
              return false;
            }
          }
          return true;
        },
        cache: false
      },
      hasLockInSelection: {
        get() {
          let locked = this.selectedBlocksData.find(blk => {
            return this.isBlockLocked(blk.blockid);
          });
          return locked ? true : false;
        },
        cache: false
      },
      isShowArchivedFlags: {
        get() {
          return this.selectedBlocksData.find(block => {
            return block.isHideArchFlags;
          }) ? true : false;
        },
        cache: false
      },
      ...mapGetters(['blockSelection', 'isMultiBlocksSelected', 'isBlockSelected', 'selectedBlocksData', 'isBlockLocked', 'storeList', 'storeListO', 'audioTasksQueueBlock'])
    },
    methods: {
      setLanguage() {
        this.$parent.close();
        return this.massSetLanguage([this.selectedLanguage]);
      },
      joinBlocks() {
        if (!this.allowMultiAction) {
          return false;
        }
        let checkBlocks = this.getSelectedBlocks();// force re read actual blocks
        let typeDiffers = checkBlocks.find(blk => {
          return checkBlocks.find(block => {
            return blk.type !== block.type;
          });
        });
        if (typeDiffers) {
          this.$root.$emit('join_type_differs');
          return false;
        }
        let voiceworkDiffers = checkBlocks.find(blk => {
          return checkBlocks.find(block => {
            return blk.voicework !== block.voicework;
          });
        });
        if (voiceworkDiffers) {
          this.$root.$emit('join_voicework_differs');
          return false;
        }
        let hasChanges = checkBlocks.find(blk => {
          return blk.getIsChanged() || blk.hasChangedPart() || blk.isAudioChanged;
        });
        if (hasChanges) {
          this.$root.$emit('join_has_changes');
          return false;
        }
        let joinInfo = {};
        this.$modal.show(JoinBlocksWarning, {
          joinInfo: joinInfo,
          join_count: this.selectedBlocksCount
        },
        {
          height: 'auto',
          width: '460px',
          clickToClose: false
        },
        {
          'closed': (e) => {
            if (joinInfo && joinInfo.success) {
              this.checkAudioEditing();
              return this.massJoin([[], joinInfo.line_breaks])
                .then(() => {
                  return Promise.resolve(true);
                });
            } else {
              return Promise.resolve(false);
            }
          }
        });
      },
      deleteBlocks() {
        if (!this.allowMultiAction) {
          return false;
        }
        let deleteInfo = {};
        this.$modal.show(DeleteBlockWarning, {
          deleteInfo: deleteInfo,
          delete_count: this.selectedBlocksCount
        },
        {
          height: 'auto',
          width: '440px',
          clickToClose: false
        },
        {
          'closed': (e) => {
            if (deleteInfo && deleteInfo.success) {
              this.checkAudioEditing();
              return this.massDelete()
                .then(() => {
                  return Promise.resolve(true);
                });
            } else {
              return Promise.resolve(false);
            }
          }
        });
      },
      toggleArchFlags() {
        if (!this.isShowArchivedFlags) {
          this.selectedBlocksData.filter(block => {
            return !block.isHideArchFlags;
          }).forEach(block => {
            console.log(block.isHideArchFlags);
            block.set_isHideArchFlags(true);
          });
        } else {
          this.selectedBlocksData.filter(block => {
            return block.isHideArchFlags;
          }).forEach(block => {
            block.set_isHideArchFlags(false);
          });
        }
      },
      getSelectedBlocks() {
        let data = [];
        if (this.blockSelection.start._id && this.blockSelection.end._id) {
          let crossId = this.blockSelection.start._id;
          for (let idx = 0; idx < this.storeList.size; idx++) {
            let block = this.storeList.get(crossId);
            if (block) {
              data.push(block);
              if (block._id === this.blockSelection.end._id) {
                break;
              }
              crossId = this.storeListO.getOutId(block.blockid);
            } else break;
          }
        }
        return data;
      },
      checkAudioEditing() {
        let editingBlock = this.audioTasksQueueBlock();
        if (editingBlock && editingBlock.blockid) {
          let block = this.selectedBlocksData.find(blk => {
            return blk.blockid === editingBlock.blockid;
          });
          if (block) {
            this.$root.$emit('for-audioeditor:force-close');
          }
        }
      },
      ...mapActions('blocksModule', ['massSetLanguage', 'massDelete', 'massJoin'])
    }
  }
</script>
<style lang="less">
  .multi-block-burger-menu {
    .-re-join {
      background: url(/static/mass-join.png);
      background-size: 14px;
      width: 14px;
      height: 14px;
      display: inline-block;
    }
    li.disabled {
      color: #A8A9AB;
      i {
        color: #A8A9AB;
      }
      .-re-join {
        background: url(/static/mass-join-disabled.png);
        background-size: 14px;
      }
    }
  }
</style>