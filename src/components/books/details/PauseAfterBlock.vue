<template>
  <div v-bind:key="blockType + '_pause_after'" :class="['pause-after-container', 'mode-' + bookMode]">
    <template v-if="blockTypesInRange.length > 1">
      <template v-if="range.length > 1">
        <div class="range-info">From {{range[0]}} to {{range[range.length - 1]}} sec. is applied to {{blockTypesInRange.length}} {{blockTypeLabel}} in range <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> - <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a></div>
      </template>
      <template v-else>
        <div class="range-info">{{range[0]}} sec. is applied to {{blockTypesInRange.length}} {{blockTypeLabel}} in range <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> - <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a></div>
      </template>
    </template>
    <template v-if="bookMode !== 'proofread'">
      <Slider v-model="pause"
        :step="interval"
        :min="min" :max="max"
        @change="inputPauseDebounced"
        :class="['block-pause-slider']" />
      <br/>
    </template>

    <div class="hidden">pause: "{{pause}}", {{pause}}, range: {{range}}</div><!-- class="hidden" -->
    <div class="hidden">{{pause === min}},{{pause === max}}</div>
    <div class="col-md-12">
      <div class="pause-after-input col-md-8">
        <template v-if="bookMode === 'proofread'">
          <input  class="pause-after" type="number" disabled
            v-if="range.length > 1"/>
          <input type="number" class="pause-after" :value="pause" disabled v-else />
        </template>
        <template v-else>

          <button @click="decreasePause" :disabled="pause === min" class="minus"></button>

          <input :value="pause"
            class="pause-after" type="number"
            :min="min" :max="max"
            :step="interval"
            @change="inputPauseManually" />

          <button @click="increasePause" class="plus" :disabled="pause === max"></button>
        </template>
      </div>
      <div class="listen-block col-md-4" v-if="listenBlockDisplay">
        <label>Listen</label>
        <i class="fa fa-play-circle-o" disabled v-if="listenBlockDisabled"></i>
        <i class="fa fa-play-circle-o" v-else @click="listenBlock"></i>
        <div class="hidden">{{nowPlaying}},{{pause}}</div>
      </div>
    </div>
  </div>
</template>
<script>
  import Slider    from 'primevue/slider';
  import { mapGetters, mapActions } from 'vuex';
  import Vue from 'vue';
  import _ from 'lodash'
  export default {
    name: "PauseAfterBlock",
    components: { Slider },
    props: ["blockType", "styleValue", "styleProps"],
    data() {
      return {
        pause: 0,
        min: 0,
        max: 4,
        interval: 0.1,
        precision: 1,
        range: [],
        blockList: [],
        player: null,
        nowPlaying: false
      }
    },
    mounted() {
      this.resetPause();
    },
    methods: {
      inputPauseDebounced: _.debounce(function (pauseVal) {
        if (this.allowConfirmPopup) {
          this.confirmPauseUptdMessage(this.range);
        } else {
          this.pauseValueChange(pauseVal);
        }
      }, 300),

      pauseValueChange(pauseVal) {
        const blk = Array.isArray(this.blockTypesInRange) ? this.blockTypesInRange.find(b => {
          return b.pause_after != pauseVal;
        }) : false;
        if (blk) {
          this.pause = pauseVal;
          this.range = [pauseVal];
          this.$emit('setPauseAfter', this.blockType, pauseVal);
        }
      },

      recalcPauseAfterRange(reset_pause = false) {
        let range = [];
        let selectedProps = this.styleProps.get(this.blockType);
        if (selectedProps) {
          let pauses = selectedProps.get('pause_after');
          if (pauses) {
            range = Array.from(pauses.keys()).map((v) => {
              if (v === 'none') {
                v = 0;
              }
              return +(+v).toFixed(this.precision)
            });
          }
        }
        this.range = range.sort((a, b) => {
          return a > b ? 1 : -1;
        });

        //console.log('recalc range', this.pause, this.range, reset_pause);
        if (this.range.length === 1 && this.pause !== this.range[0] && reset_pause) {
          this.pause = +(+this.range[0]).toFixed(this.precision);
        }
      },
      flatPauseAfterRange(){
        this.range = this.range.map(()=>0);
      },
      resetPause() {
        //console.log('resetPause', this.pause, this.range);
        this.recalcPauseAfterRange();
        let val = 0;
        if (this.range.length === 1 && this.range[0] !== 'none') {
          val = +(+this.range[0]).toFixed(this.precision);
        }

        if (this.pause !== val) {
          this.pause = val;
        };
      },
      increasePause() {
        if (this.allowConfirmPopup) {
          this.confirmPauseUptdMessage(this.range);
        } else {
          const newVal = this.pause + this.interval;
          this.pause = +newVal.toFixed(this.precision);
          this.inputPauseDebounced(this.pause);
        }
      },
      decreasePause() {
        if (this.allowConfirmPopup) {
          this.confirmPauseUptdMessage(this.range);
        } else {
          const newVal = this.pause - this.interval;
          this.pause = +newVal.toFixed(this.precision);
          this.inputPauseDebounced(this.pause);
        }
      },
      inputPauseManually(ev) {
        ev.preventDefault();
        if (this.allowConfirmPopup) {
          this.confirmPauseUptdMessage(this.range);
        } else {
          let newVal = +(+ev.target.value).toFixed(this.precision);
          newVal = newVal > this.max ? this.max : newVal;
          newVal = newVal < this.min ? this.min : newVal;
          this.pause = newVal;
          this.inputPauseDebounced(this.pause);
        }
      },
      listenBlock() {
        let length = 3;
        if (this.blockTypesInRange.length === 1) {
          let nextBlock = this.storeList.get(this.storeListO.getOutId(this.selectedBlock.blockid));
          let selectedBlockAudiosrc;
          if (!this.selectedBlock.getIsSplittedBlock()) {
            selectedBlockAudiosrc = this.selectedBlock.getAudiosrc('m4a');
          } else {
            selectedBlockAudiosrc = this.selectedBlock.getPartAudiosrc(this.selectedBlock.parts.length - 1, 'm4a');
          }
          if (selectedBlockAudiosrc) {
            if (!this.player) {
              this.player = document.createElement('audio');
            }
            //this.audio_element.play();
            if (this.player) {
              let playCurrent = new Promise((resolve, reject) => {
                this.player.onended = () => {
                  //this.player.src = null;
                  this.stopAudio();
                  return resolve();
                }
                this.player.onerror = () => {
                  return resolve();
                };
                this.player.onloadedmetadata = () => {
                  if (!isNaN(this.player.duration)) {
                    if (this.player.duration > length) {
                      this.player.currentTime = this.player.duration - length;
                    }
                    this.player.play();
                  }
                };
                this.nowPlaying = this.selectedBlock.blockid;
                this.player.src = selectedBlockAudiosrc;
              });
              playCurrent
                .then(() => {
                  this.nowPlaying = 'pause';
                  setTimeout(() => {
                    if (nextBlock) {
                      let audiosrc;
                      if (nextBlock.getIsSplittedBlock()) {
                        audiosrc = nextBlock.getPartAudiosrc(0, 'm4a');
                      } else {
                        audiosrc = nextBlock.getAudiosrc('m4a');
                      }
                      if (audiosrc) {
                        this.nowPlaying = nextBlock.blockid;
                        this.player.ontimeupdate = () => {
                          if (this.player.currentTime >= length) {
                            this.stopAudio();
                          }
                        };
                        this.player.onended = () => {
                          //this.player.src = null;
                          this.stopAudio();
                        }
                        this.player.onloadedmetadata = () => {
                          this.player.play();
                        };
                        this.player.src = audiosrc;
                      } else {
                        this.nowPlaying = false;
                      }
                    } else {
                      this.nowPlaying = false;
                    }
                  }, this.pause * 1000);
                });
              /*if (map[0] + map[1] < (2 * length + 1) * 1000) {
                this.player.playBlock('content-' + this.block._id + '-part-0');
              } else {

                this.player.audio_element.onpause = () => {
                  //console.log('PAUSE')
                  let delay = 1000;
                  if (this.player.load_delay) {
                    delay+=this.player.load_delay;
                  }
                  this.$root.$emit('for-bookedit:scroll-to-block-end', this.block._id);
                  setTimeout(() => {
                    this.player.playRange(`content-${this.block._id}-part-0`, map[0] + map[1] - length * 1000, map[0] + map[1]);
                  }, delay);

                  //console.log(this.player);
                  this.player.audio_element.onpause = null;
                };
                this.player.playRange(`content-${this.block._id}-part-0`, 0, length * 1000);
              }*/

            }
          }
        }
      },
      stopAudio() {
        if (this.player) {
          this.nowPlaying = false;
          this.player.pause();
          this.player.onloadedmetadata = null;
          this.player.onerror = null;
          this.player.onended = null;
          this.player.ontimeupdate = null;
        }
      },
      goToBlock(blockId) {
        this.$root.$emit('for-bookedit:scroll-to-block', blockId);
      },
      confirmPauseUptdMessage(range) {
        this.$root.$emit('show-modal', {
          title: 'Confirm pause update',
          text: `Current values are from ${range[0]} to ${range[range.length - 1]} in the selected range of ${this.blockTypesInRange.length} blocks.<br>Are you sure you want to update "pause after" on the range?`,
          buttons: [
            {
              title: 'Cancel',
              handler: () => {
                this.pause = 0;
                this.$root.$emit('hide-modal');
              },
              'class': 'btn btn-default'
            },
            {
              title: 'Confirm',
              handler: () => {
                this.pause = 0;
                this.flatPauseAfterRange();
                this.$root.$emit('hide-modal');
                // this.updates ();
              },
              'class': 'btn btn-primary'
            }
          ],
          class: ['modal-width align-modal']
        });
      },

    },
    computed: {
      allowConfirmPopup: {
        get() {
          const checkPause = (this.range[0] && this.range[0] !== 'none') ? this.range[0] : 0;
          return this.range.length > 1 && !this.range.every((pause)=>pause == checkPause);
        },
      },

      pauseAfterSelection: {
        get() {
          let range = this.pausesAfterRange;
          if (range.length === 1 && range[0] !== 'none') {
            return range[0];
          }
          return 0;
        }
      },
      pausesAfterRange: {
        get() {
          let range = [];
          let selectedProps = this.styleProps.get(this.blockType);
          if (selectedProps) {
            let pauses = selectedProps.get('pause_after');
            if (pauses) {
              range = Array.from(pauses.keys());
            }
          }
          return range.sort((a, b) => {
            return parseFloat(a) > parseFloat(b) ? 1 : -1;
          });
        }
      },
      blockTypeLabel: {
        get() {
          let type = this.blockType === 'par' ? 'paragraph' : this.blockType;
          return type.charAt(0) + type.slice(1) + 's';
        }
      },
      blockTypesInRange: {
        get() {
          if (Array.isArray(this.selectedBlocks)) {
            let blocks = this.selectedBlocks.filter(b => {
              return b.type === this.blockType;
            });
            return blocks;
          }
          return [];
        }
      },
      selectedBlock: {
        get() {
          return Array.isArray(this.blockTypesInRange) ? this.blockTypesInRange[0] : null;
        },
        cache: false
      },
      listenBlockDisabled: {
        get() {
          let audiosrc;
          if (this.selectedBlock) {
            if (this.selectedBlock.getIsSplittedBlock()) {
              audiosrc = this.selectedBlock.getPartAudiosrc(this.selectedBlock.parts.length - 1, 'm4a');
            } else {
              audiosrc = this.selectedBlock.getAudiosrc('m4a');
            }
          }
          return this.blockTypesInRange.length > 1 || this.nowPlaying || !this.selectedBlock || !audiosrc;
        },
        cache: false
      },
      listenBlockDisplay: {
        get() {
          let blocks = Array.isArray(this.blockTypesInRange) ? this.blockTypesInRange : [];
          if (blocks.length === 1 && this.selectedBlock.voicework === 'no_audio') {
            return false;
          }
          let audioBlocks = blocks.find(b => {
            return b.voicework !== 'no_audio';
          });
          return audioBlocks && !['hr', 'illustration'].includes(this.blockType);
        },
        cache: false
      },
      ...mapGetters({
        blockSelection: 'blockSelection',
        storeList: 'storeList',
        storeListO: 'storeListO',
        bookMode: 'bookMode',
        selectedBlocks: 'filteredSelectedBlocks'
      })
    },
    watch: {
      'blockSelection.start._id': {
        handler(val, oldVal) {
          if (val) {
            this.resetPause();
          }
        }
      },
      'blockSelection.end._id': {
        handler(val, oldVal) {
          let singleSelection = !oldVal && val === this.blockSelection.start._id;
          if (this.blockSelection.start._id && this.blockSelection.end._id && (this.blockSelection.start._id !== this.blockSelection.end._id || !singleSelection)) {
            this.resetPause();
          }
        }
      },
      'blockSelection.refresh': {
        handler() {
          Vue.nextTick(() => {
              this.recalcPauseAfterRange(true);
          });
        }
      }
    }
  }
</script>
<style lang="less">
  .modal-width {
    width: 450px !important;
  }
  .pause-after-container {
    position: relative;

    .p-slider.block-pause-slider {
      z-index: 0;
      margin: 0px 8px;
      border-radius: 4px;

      &:not(.p-disabled):hover {
        background-color: #c8c6c4;
      }

      &.p-slider-horizontal {
        height: 6px;
      }

      span.p-slider-range {
        transition: all 0.2s ease 0s;
        border-radius: 4px;
        background-color: #3498db;
        &:hover {
          background-color: #3498db;
        }
      }

      span.p-slider-handle {
        transition: all 0.2s ease 0s;
        border: none;
        box-shadow:.5px .5px 2px 1px rgba(0,0,0,.32);
        cursor: pointer;
      }

    }

    .vue-slider-component.vue-slider-horizontal {
      z-index: 0;
    }
    .pause-after-input {
      text-align: left;
      padding: 0px;
      input[type="number"] {
        -webkit-appearance: textfield;
        -moz-appearance: textfield;
        appearance: textfield;
      }

      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
      }

      /*.number-input {
        border: 0;
        display: inline-flex;
      }*/

      .pause-after {
        box-sizing: border-box;
      }

      button {
        outline:none;
        -webkit-appearance: none;
        background-color: transparent;
        border: none;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        cursor: pointer;
        margin: 0;
        position: relative;
        /*box-shadow: 0px 0px 1px #474747;
        border-radius: 50%;*/
        vertical-align: super;
        &.minus:disabled, &.plus:disabled {
          background-color: inherit !important;
          &:before, &:after {
            color: gray;
            background-color: gray;
          }
        }
      }

      button:before,
      button:after {
        display: inline-block;
        position: absolute;
        content: '';
        width: 1rem;
        height: 2px;
        background-color: #3498db;
        transform: translate(-50%, -50%);
      }
      button.plus:after {
        transform: translate(-50%, -50%) rotate(90deg);
      }

      input[type=number] {
        max-width: 5rem;
        padding: .5rem;
        /*border: none;*/
        border-width: 1px 1px;
        /*font-size: 2rem;*/
        height: 2rem;
        font-weight: bold;
        text-align: center;
        color:#3498db;
        &:disabled {
          font-style: normal;
        }
      }
    }
    .listen-block {
      label {
        display: inline-block;
        font-weight: normal;
        /*padding: 9px 8px;*/
        vertical-align: sub;
      }
      i {
        font-size: 25px !important;
        vertical-align: text-top;
        color: #3498db;
        &[disabled="disabled"] {
          color: gray;
          background-color: inherit !important;
          cursor: inherit;
        }
      }
    }
    a {
      cursor: pointer;
    }
    .col-md-12 {
      padding: 0px;
    }
    &.mode-proofread {
      .listen-block {
        i {
          vertical-align: top;
        }
      }
    }
  }
</style>
