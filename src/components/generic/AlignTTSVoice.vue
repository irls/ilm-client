<template>
  <div class="vue-js-modal align-tts-voice">
    <div class="modal-header">
      <h4 class="modal-title">Align text with TTS audio</h4>
    </div>
    <div class="modal-body">
      <div class="modal-text">
        Align “{{ patternText }}” with "{{ selectedVoice }}" voice:
      </div>
      <div class="modal-content-flex">
        <div class="modal-content-flex-block">
          <label>
            <input type="radio" name="align-type" value="single" v-model="alignType" />this block
          </label>
          <label>
            <input type="radio" name="align-type" value="unvoiced" :disabled="unvoicedCount === 0" v-model="alignType" />all unvoiced TTS blocks ({{ unvoicedCount }})
          </label>
          <label>
            <input type="radio" name=align-type value="all" :disabled="totalCount === 0" v-model="alignType" />all TTS blocks ({{ totalCount }})
          </label>
        </div>
      </div>
    </div>
    <div class="modal-footer vue-dialog-buttons">
      <template v-if="!addingBlocks">
        <button class="btn btn-default" v-on:click="close">Cancel</button>
        <button class="btn btn-primary" v-on:click="align">Align block(s) ({{ blocksToAlign }})</button>
      </template>
      <template v-else>
        <div class="adding-blocks"></div>
      </template>
    </div>
  </div>
</template>
<script>
  import { mapGetters, mapActions } from 'vuex';
  import Vue from 'vue';
  import UnsavedChangesPopup from './UnsavedChangesPopup.vue';
  import v_modal from 'vue-js-modal';
  Vue.use(v_modal, {dialog: true});
  export default {
    data() {
      return {
        alignType: "single",
        blocksToAlign: 1,
        selectedVoiceId: '',
        addingBlocks: false
      }
    },
    mounted() {
      let blockType = this.selectedBlocks[0].type;
      if (blockType === 'par') {
        blockType = "paragraph";
      }
      this.selectedVoiceId = this.currentBookMeta.voices[blockType];
    },
    computed: {
      unvoicedCount: {
        get() {
          return this.alignTTSVoicesData.not_voiced.length;
        },
        cache: false
      },
      totalCount: {
        get() {
          return this.alignTTSVoicesData.total.length;
        }
      },
      patternText: {
        get() {
          return this.alignTTSVoicesData.match;
        }
      },
      selectedVoice: {
        get() {
          let voice = this.tts_voices.find(_voice => {
            return _voice.voice_id === this.selectedVoiceId;
          });
          return voice ? voice.name : '';
        }
      },
      ...mapGetters(['currentBookMeta', 'selectedBlocks', 'storeList']),
      ...mapGetters('alignActions', ['alignTTSVoicesData']),
      ...mapGetters('ttsModule', ['tts_voices'])
    },
    methods: {
      close() {
        this.$emit('close');
      },
      align() {
        this.addingBlocks = true;
        let modifiedBlocks = [];
        let checkBlocks = [];
        switch (this.alignType) {
          case 'single':
            checkBlocks = [this.selectedBlocks[0]];
            break;
          case 'unvoiced':
            checkBlocks = this.alignTTSVoicesData.not_voiced;
            break;
          case 'all':
            checkBlocks = this.alignTTSVoicesData.total;
            break;
        }
        checkBlocks.forEach(block => {
          let storeBlock = this.storeList.get(block.blockid);
          if (storeBlock.isChanged || storeBlock.isAudioChanged) {
            modifiedBlocks.push(block.blockid);
          }
        });
        if (modifiedBlocks.length > 0) {
          this.$emit('close');
          let callbackProps = {
            saved: false
          }
          this.$modal.show(UnsavedChangesPopup, 
            {
              modifiedBlockids: modifiedBlocks,
              callbackProps: callbackProps
            },
            {
              height: 'auto',
              width: '400px',
              clickToClose: false
            },
            {
              'closed': () => {
                if (callbackProps.saved) {
                  return this.runAlign();
                }
              }
            }
          );
        } else {
          return this.runAlign();
        }
      },
      runAlign() {
        return this.alignTTSVoice([this.alignType, this.selectedVoiceId])
          .then(response => {
            this.addingBlocks = false;
            this.$emit('close');
          });
      },
      ...mapActions('alignActions', ['alignTTSVoice'])
    },
    watch: {
      'alignType': {
        handler(val) {
          switch (this.alignType) {
            case 'single':
              this.blocksToAlign = 1;
              break;
            case 'unvoiced':
              this.blocksToAlign = this.unvoicedCount;
              break;
              case 'all':
                this.blocksToAlign = this.totalCount;
                break;
          }
        }
      }
    }
  }
</script>
<style lang="less">
  .align-tts-voice {
    .modal-footer {
      .btn-primary {
        margin-left: 0px;
      }
    }
    .adding-blocks {
      background: url(/static/preloader-snake-small.gif);
      width: 100%;
      height: 34px;
      background-repeat: no-repeat;
      background-position: center;
    }
  }
</style>