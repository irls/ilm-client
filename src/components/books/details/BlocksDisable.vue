<template>
  <div class="blocks-disable-wrapper">
    <div class="red-message" v-if="!hasSelection">
      Define block range
    </div>
    <div v-else>
      {{selectedBlocks.length}}&nbsp;block(s) in range
      <a v-on:click="goToBlock(blockSelection.start._id)" class="go-to-block">{{blockSelection.start._id_short}}</a>
      &nbsp;-&nbsp;
      <a v-on:click="goToBlock(blockSelection.end._id)" class="go-to-block">{{blockSelection.end._id_short}}</a>
    </div>
    <button class="btn btn-primary" :disabled="!selectedEnabledBlocks || disabledBlocksApply" v-on:click="disable()">
      Disable
      <template v-if="selectedEnabledBlocks">({{selectedEnabledBlocks}})</template>
    </button>
    <button class="btn btn-primary" :disabled="!selectedDisabledBlocks || disabledBlocksApply" v-on:click="enable()">
      Enable
      <template v-if="selectedDisabledBlocks">({{selectedDisabledBlocks}})</template>
    </button>
  </div>
</template>
<script>
  import { mapGetters, mapActions } from 'vuex';
  export default {
    name: 'BlocksDisable',
    methods: {
      ...mapActions('setBlocksDisabled', ['setDisabledValue']),
      disable() {
        return this.setDisabledValue([true]);
      },
      enable() {
        return this.setDisabledValue([false]);
      },
      goToBlock(blockid) {
        this.$root.$emit('for-bookedit:scroll-to-block', blockid);
      }
    },
    computed: {
      ...mapGetters({blockSelection: 'blockSelection', selectedBlocks: 'selectedBlocks'}),
      ...mapGetters('setBlocksDisabled', ['disabledBlocksApply']),
      selectedEnabledBlocks: {
        get() {
          let selected = [];
          if (this.selectedBlocks.length > 0) {
            selected = this.selectedBlocks.filter(blk => {
              return !blk.disabled;
            });
          }
          return selected.length;
        },
        cache: false
      },
      selectedDisabledBlocks: {
        get() {
          let selected = [];
          if (this.selectedBlocks.length > 0) {
            selected = this.selectedBlocks.filter(blk => {
              return blk.disabled;
            });
          }
          return selected.length;
        },
        cache: false
      },
      hasSelection: {
        get() {
          return this.selectedBlocks.length > 0;
        },
        cache: false
      }
    }
  }
</script>
<style lang="less">
  .blocks-disable-wrapper {
    border-bottom: 1px solid #b9b6b6;
    /* width: 100%; */
    margin: 0px -10px 0px -10px;
    padding: 0px 10px 10px 10px;

    .red-message {
      color: red;
    }
  }
</style>
