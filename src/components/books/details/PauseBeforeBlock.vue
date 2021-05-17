<template>
  <div v-bind:key="blockType + '_pause_before'" class="pause-before-container">
    <vue-slider v-model="pause" 
        :min="min" 
        :max="max" 
        :interval="interval" 
        :width="'auto'" 
        tooltip="none"
        :lazy="true"
        ref="pause_before_slider"
        @input="pauseValueChange"
        @drag-end="pauseValueChange"></vue-slider>
    <div class="hidden">pause: "{{pause}}", range: {{range}}</div>
    <div class="pause-before-input">
      <button @click="decreasePause" :disabled="pause === min" class="minus"></button>
      <input  class="pause-before" type="number" disabled
        v-if="blockTypesInRange.length > 1"/>
      <input  class="pause-before" type="number" v-model="pause"
        :min="min"
        :max="max"
        :step="interval"
        v-else/>
      <button @click="increasePause" class="plus" :disabled="pause === max"></button>
    </div>
    <template v-if="blockSelection.start._id !== blockSelection.end._id">
      <template v-if="blockTypesInRange.length > 1">
        From {{range[0]}} to {{range[range.length - 1]}} sec. is applied to {{blockTypesInRange.length}} {{blockTypeLabel}} in range {{blockSelection.start._id_short}} - {{blockSelection.end._id_short}}
      </template>
      <template v-else>
        {{range[0]}} sec. is applied to {{blockTypesInRange.length}} {{blockTypeLabel}} in range {{blockSelection.start._id_short}} - {{blockSelection.end._id_short}}
      </template>
    </template>
  </div>
</template>
<script>
  import VueSlider from 'vue-slider-component';
  import { mapGetters, mapActions } from 'vuex';
  import Vue from 'vue';
  export default {
    name: "PauseBeforeBlock",
    components: {VueSlider},
    props: ["blockType", "styleValue", "styleProps"],
    data() {
      return {
        pause: 0,
        pauseUpdateEmitted: false,
        min: 0,
        max: 4, 
        interval: 0.1,
        range: [],
        blockList: []
      }
    },
    mounted() {
      //console.log(`MOUNTED`, this.selectedValues, this.styleValue(this.blockType, 'pause_before', 'none'))
      //setInterval(() => {
        //this.$refs.pause_before_slider.refresh();
      //}, 1000)
      //setTimeout(() => {
        //this.pause = 2.9;
        //this.$refs.pause_before_slider.setValue(2.9);
      //}, 5000);
      this.resetPause();
      /*let sorted = Array.from(this.storeList).sort((a, b) => {
        return a[1].index > b[1].index ? 1 : -1;
      }).map((a) => {
        return a[1];
      });
      let blockList = [];
      if (this.blockSelection.start && this.blockSelection.start._id && this.blockSelection.end && this.blockSelection.end._id) {
        let crossId = this.blockSelection.start._id;
        for (let idx = 0; idx < this.storeList.size; idx++) {
          let block = this.storeList.get(crossId);
          if (block) {
            if (this.bookMode === 'edit') {
              blockList.push(block);
            } else if (this.bookMode === 'narrate') {
              if (block.voicework === 'narrate') {
                blockList.push(block);
              }
            }
            if (block.blockid == this.blockSelection.end._id) {
              break;
            }
            crossId = this.storeListO.getOutId(block.blockid);
            if (!crossId) {
              break;
            }
          } else break;
        }
      }*/
      //this.blockList = blockList;
    },
    activated: function() {
      console.log(`ACTIVATED`, this.blockType)
    },
    methods: {
      setPauseBefore(val) {
        //console.log(val, typeof val);
        if (val && val % 1 !== 0) {
          val = parseFloat(parseFloat(val).toFixed(1));
        }
        this.$emit('setPauseBefore', this.blockType, val);
      },
      pauseValueChange(val) {
        if (this.pauseUpdateEmitted) {
          if (val && val % 1 !== 0) {
            val = parseFloat(parseFloat(val).toFixed(1));
          }
          this.$emit('setPauseBefore', this.blockType, val);
        }
      },
      recalcPauseBeforeRange() {
        let range = [];
        let selectedProps = this.styleProps.get(this.blockType);
        if (selectedProps) {
          let pauses = selectedProps.get('pause_before');
          if (pauses) {
            range = Array.from(pauses.keys()).map((v) => {
              if (v === 'none') {
                v = 0;
              }
              return v;
            });
          }
        }
        this.range = range.sort((a, b) => {
          return parseFloat(a) > parseFloat(b) ? 1 : -1;
        });
      },
      resetPause() {
        this.pauseUpdateEmitted = false;
        this.recalcPauseBeforeRange();
        let val;
        if (this.range.length === 1 && this.range[0] !== 'none') {
          val = this.range[0];
        } else {
          val = 0;
        }
        let changedVal = this.pause != val;
        this.pause = val;
        if (!changedVal) {
          this.pauseUpdateEmitted = true;
        }
      },
      increasePause() {
        if (this.range.length > 1) {
          this.pause = this.min;
          this.pauseUpdateEmitted = true;
          this.pauseValueChange(this.pause);
          this.resetPause();
        } else if (this.pause <= this.max - this.interval) {
          this.pause = this.parseFloatToFixed(this.pause + this.interval);
        }
      },
      decreasePause() {
        if (this.pause >= this.min + this.interval) {
          this.pause = this.parseFloatToFixed(this.pause - this.interval);
        }
      },
      parseFloatToFixed(val, precision = 1) {
        if (val && val % 1 !== 0) {
          val = parseFloat(parseFloat(val).toFixed(precision));
        }
        return val;
      },
      recalcBlocks() {
        return;
        let blockList = [];
        if (this.blockSelection.start && this.blockSelection.start._id && this.blockSelection.end && this.blockSelection.end._id) {
          let crossId = this.blockSelection.start._id;
          for (let idx = 0; idx < this.storeList.size; idx++) {
            let block = this.storeList.get(crossId);
            if (block) {
              if (this.bookMode === 'edit') {
                blockList.push(block);
              } else if (this.bookMode === 'narrate') {
                if (block.voicework === 'narrate') {
                  blockList.push(block);
                }
              }
              /*let hasAssignment = this.currentJobInfo.mastering  || this.currentJobInfo.text_cleanup;
              let hasTask = this.tc_currentBookTasks.tasks.find((t) => {
                return t.blockid == block._id;
              })
              //if (!hasAssignment && state.adminOrLibrarian) {
                //hasAssignment = state.currentJobInfo.completed;
              //}
              if (!hasTask && this.adminOrLibrarian) {
                hasTask = this.currentJobInfo.can_resolve_tasks.find((t) => {
                  return t.blockid == block._id;
                });
              }
              if ((block.status && block.status.marked) || (!hasAssignment && !hasTask)) {
                switch (block.voicework) {
                  case 'audio_file' :
                    ++approved;
                    break;
                  case 'tts':
                    ++approved_tts;
                    break;
                  case 'narration':
                    ++approved_narration;
                    break;
                }
                if (block.voicework !== 'tts' && block.footnotes && Array.isArray(block.footnotes) && block.footnotes.length > 0) {
                  let ftn = block.footnotes.find(f => {
                    return f.voicework === 'tts';
                  });
                  if (ftn) {
                    ++approved_tts;
                  }
                }
              }
              if (block.isChanged || block.isAudioChanged) {
                if (block.voicework === 'audio_file') {
                  ++changed_in_range;
                }
                if (block.voicework === 'tts') {
                  ++changed_in_range_tts;
                }
                if (block.voicework === 'narration') {
                  ++changed_in_range_narration;
                }
              }*/
              if (block.blockid == this.blockSelection.end._id) {
                break;
              }
              crossId = this.storeListO.getOutId(block.blockid);
              if (!crossId) {
                break;
              }
            } else break;
          }
        }
        this.blockList = blockList;
      }
    },
    computed: {
      pauseBeforeSelection: {
        get() {
          let range = this.pausesBeforeRange;
          if (range.length === 1 && range[0] !== 'none') {
            return range[0];
          }
          return 0;
        },
        set(val) {
          this.setPauseBefore(val);
        }
      },
      pausesBeforeRange: {
        get() {
          let range = [];
          let selectedProps = this.styleProps.get(this.blockType);
          if (selectedProps) {
            let pauses = selectedProps.get('pause_before');
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
      ...mapGetters({
        blockSelection: 'blockSelection',
        storeList: 'storeList',
        storeListO: 'storeListO',
        bookMode: 'bookMode',
        selectedBlocks: 'selectedBlocks'
      })
    },
    watch: {
      'pause': {
        handler(val) {
          Vue.nextTick(() => {
            this.pauseUpdateEmitted = true;
          });
        }
      },
      'blockSelection': {
        handler(val) {
          this.resetPause();
          this.recalcBlocks();
        },
        deep: true
      },
      'styleProps': {
        handler() {
          this.recalcPauseBeforeRange();
        },
        deep: true
      },
      'bookMode': {
        handler() {
          this.recalcBlocks();
        }
      }
    }
  }
</script>
<style lang="less">
  .pause-before-container {
    .pause-before-input {
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

      .pause-before {
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
      }
    }
  }
</style>