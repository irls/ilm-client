<template>
  <div v-if="lockedType === 'align'" class="cancel-block-align">
    <button class="btn btn-default" v-if="allowAlignCancel" v-on:click="cancelAlign">
      <!--<i class="fa fa-times-circle-o"></i>--><i class="glyphicon glyphicon-remove-circle"></i>
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
          return lockedBlock && ['narration', 'audio_file', 'tts'].indexOf(this.block.voicework) > -1;
        }
      },
      ...mapGetters(['aligningBlocks'])
    },
    methods: {
      cancelAlign() {
        return this.cancelAlignment([this.block.bookid, this.block.blockid, this.blockPartIdx])
      },
      ...mapActions('alignActions', ['cancelAlignment'])
    }
  }
</script>
<style lang="less">
  .cancel-block-align {
    float: right;
    margin: 2px;
    button, button:hover {
      color: rgb(197, 94, 93);
      border: 1px solid rgb(197, 94, 93);
      border-radius: 5px;
      font-size: 10px;
      padding: 3.5px 4px 2px 4px;
      i {
        color: rgb(197, 94, 93);
        vertical-align: middle;
        font-size: 20px;
      }
    }
  }
</style>
