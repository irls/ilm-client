<template>
  <div v-if="lockedType === 'align'" class="cancel-block-align">
    <button class="btn btn-default" v-if="allowAlignCancel" v-on:click="cancelAlign">
      <i class="fa fa-ban"></i>
    </button>
  </div>
</template>
<script>
  import {mapGetters, mapActions} from 'vuex';
  export default {
    data() {
      return {}
    },
    props: ['lockedType', 'block', 'blockPartIdx'],
    computed: {
      allowAlignCancel: {
        get() {
          let lockedBlock = this.aligningBlocks.find(blk => {
            return blk._id === this.block.blockid && (this.blockPartIdx === null || blk.partIdx === this.blockPartIdx);
          });
          return lockedBlock && this.block.voicework === 'narration';
        }
      },
      ...mapGetters(['aligningBlocks'])
    },
    methods: {
      cancelAlign() {
        return this.cancelAlignment([this.block.bookid, this.block.blockid, this.blockPartIdx])
      },
      ...mapActions(['cancelAlignment'])
    }
  }
</script>
<style lang="less">
  .cancel-block-align {
    float: right;
    margin: 2px;
    button, button:hover {
      color: red;
      border: 1px solid red;
      border-radius: 5px;
      font-size: 10px;
      padding: 2px 4px;
      i {
        color: red;
        vertical-align: middle;
        font-size: 12px;
      }
    }
  }
</style>