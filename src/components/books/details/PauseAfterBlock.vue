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
      <vue-slider v-model="pause"
                  :min="min"
                  :max="max"
                  :interval="interval"
                  :width="'auto'"
                  tooltip="none"
                  :lazy="true"
                  :silent="true"
                  :debug="false"
                  ref="pause_after_slider"
                  @input="pauseValueChange(range)"
                  @drag-end="pauseDragEnd"></vue-slider>
    </template>
    <div class="hidden">pause: "{{pause}}", {{parseFloatToFixed(pause)}}, range: {{range}}</div><!-- class="hidden" -->
    <div class="hidden">{{parseFloatToFixed(pause) === min}},{{parseFloatToFixed(pause) === max}}</div>
    <div class="col-md-12">
      <div class="pause-after-input col-md-8">
        <template v-if="bookMode === 'proofread'">
          <input  class="pause-after" type="number" disabled
            v-if="range.length > 1"/>
          <input type="number" class="pause-after" v-model="pause" disabled v-else />
        </template>
        <template v-else>
          <button v-if="range.length > 1" @click="confirmPauseUptdMessage(range,this.callModal)" class="minus"></button>
          <button v-else @click="decreasePause" :disabled="parseFloatToFixed(pause) === min" class="minus"></button>
          <input  class="pause-after" type="number" @click="confirmPauseUptdMessage(range,this.callModal)"
            v-if="range.length > 1"/>
          <input  class="pause-after" type="number" v-model="pauseInput"
            :min="min"
            :max="max"
            :step="interval"
            v-on:change="onPauseInput"
            v-on:focusout="onFocusout"
            v-else/>
          <button v-if="range.length > 1" @click="confirmPauseUptdMessage(range)" class="plus"></button>
          <button v-else @click="increasePause" class="plus" :disabled="parseFloatToFixed(pause) === max"></button>
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
  import VueSlider from 'vue-slider-component';
  import { mapGetters, mapActions } from 'vuex';
  import Vue from 'vue';
  //import _ from 'lodash'
  export default {
    name: "PauseAfterBlock",
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
        blockList: [],
        player: null,
        nowPlaying: false,
        lastEvent: null,
        lastIncrement: null,
        setUndefined: false,
        callModal: false,
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
      });*/
      //this.blockList = blockList;
    },
    activated: function() {
      console.log(`ACTIVATED`, this.blockType)
    },
    methods: {
      setPauseAfter(val) {
        //console.log(val, typeof val);
        if (val && val % 1 !== 0) {
          val = parseFloat(parseFloat(val).toFixed(1));
        }
        this.$emit('setPauseAfter', this.blockType, val);
      },
      pauseValueChange(val) {
        this.confirmPauseUptdMessage(this.range,this.callModal);
          //console.log(val, this.selectedBlock.pause_before, this.pauseUpdateEmitted);
        if (this.setUndefined) {
          this.setUndefined = false;
        }
        if (this.pauseUpdateEmitted) {
          if (val !== this.lastIncrement) {
            this.lastIncrement = null;
          }
          let blk = Array.isArray(this.blockTypesInRange) ? this.blockTypesInRange.find(b => {
            return b.pause_after != val;
          }) : false;
          if (blk) {
            //console.log('ON INPUT', val, typeof val);
            val = this.parseFloatToFixed(val);
            //if (this.pause != val) {
            //this.lastEvent = `${val}-${Date.now()}`;
            //let currentEvent = this.lastEvent;
            if (this.lastIncrement === null) {
              this.$emit('setPauseAfter', this.blockType, val);
              this.range = [val];
            } else {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  if (this.lastIncrement === val) {
                    this.$emit('setPauseAfter', this.blockType, val);
                    this.range = [val];
                    //setTimeout(() => {// avoid updates from live_db
                      //this.lastIncrement = null;
                    //}, 300);
                  }
                }, 300);
              });
            }
            //}
          }
        }
      },
      pauseDragEnd(val) {
        this.confirmPauseUptdMessage();
        //console.log('DRAG END');
        //console.log(arguments)
        if (val && typeof val.getValue === 'function') {
          this.pauseValueChange(val.getValue(),this.range);
          this.pauseUpdateEmitted = false;
        }
      },
      recalcPauseAfterRange(reset_pause = false) {
        if (this.pauseAfterBlockUpdate) {
          return false;
        }
        if (this.range.length === 1 && this.lastIncrement !== null) {
          return false;
        }
        let range = [];
        let selectedProps = this.styleProps.get(this.blockType);
        if (selectedProps) {
          let pauses = selectedProps.get('pause_after');
          if (pauses) {
            range = Array.from(pauses.keys()).map((v) => {
              if (v === 'none') {
                v = 0;
              }
              return this.parseFloatToFixed(v);
            });
          }
        }
        this.range = range.sort((a, b) => {
          return a > b ? 1 : -1;
        });
        console.log(selectedProps)
        console.log(range)
        console.log(this.range)
        //console.log('recalc range', this.pause, this.range[0], reset_pause);
        if (this.range.length === 1 && this.pause !== this.range[0] && reset_pause) {
          this.pauseUpdateEmitted = false;
          this.pause = this.range[0];
        }
      },
      resetPause() {
        this.pauseUpdateEmitted = false;
        this.recalcPauseAfterRange();
        let val;
        if (this.range.length === 1 && this.range[0] !== 'none') {
          val = this.parseFloatToFixed(this.range[0]);
        } else {
          setTimeout(() => {
            this.callModal = true;
          }, 800);
          val = 0;
        }
        let changedVal = this.pause != val;
        //console.log('reset', this.pause, val);
        this.pause = val;
        if (!changedVal) {
          this.pauseUpdateEmitted = true;
        }
      },
      increasePause() {
        if (this.setUndefined) {
          this.setUndefined = false;
          this.pause = 0;
          this.pauseUpdateEmitted = true;
          this.pauseValueChange(this.pause);
        } else {
          if (this.range.length > 1) {
            this.pause = this.min;
            this.pauseUpdateEmitted = true;
            this.pauseValueChange(this.pause);
            this.resetPause();
          } else if (this.pause <= this.max - this.interval) {
            this.lastIncrement = this.parseFloatToFixed(this.parseFloatToFixed(this.pause) + this.interval);
            this.pause = this.lastIncrement;
          }
        }

      },
      decreasePause() {
        if (this.setUndefined) {
          this.setUndefined = false;
          this.pause = 0;
          this.pauseUpdateEmitted = true;
          this.pauseValueChange(this.pause);
        } else {
          if (this.pause >= this.min + this.interval) {
            this.lastIncrement = this.parseFloatToFixed(this.parseFloatToFixed(this.pause) - this.interval);
            this.pause = this.lastIncrement;
          }
        }
      },
      defer(func, val, time = 300) {
        this.lastEvent = `${val}-${Date.now()}`;
        let currentEvent = this.lastEvent;
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (currentEvent === this.lastEvent) {
              func.call(this);
            }
          }, time);
        });
      },
      parseFloatToFixed(val, precision = 1) {
        if (val && (val % 1 !== 0 || typeof val === 'string')) {
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
      onPauseInput($ev) {
        //console.log($ev.target.value);
        let value = parseFloat($ev.target.value);
        if ((isNaN(value) || !value) && !this.setUndefined) {
          value = 0;
        }
        if (this.setUndefined) {
          this.setUndefined = false;
        }
        this.pause = this.parseFloatToFixed(value);
      },
      onFocusout($ev) {
        if (/[^\d\.\,]/.test($ev.target.value)) {
          $ev.target.value = this.pause;
        }
      },
      confirmPauseUptdMessage(range , callModal) {
        if(!callModal)
          return;
        this.$root.$emit('show-modal', {
          title: 'Confirm pause update',
          text: `Current values are from ${range[0]} to ${range[range.length - 1]} in the selected range of ${this.blockTypesInRange.length} blocks.<br>Are you sure you want to update "pause after" on the range?`,
          buttons: [
            {
              title: 'Cancel',
              handler: () => {
                this.$root.$emit('hide-modal');
              },
              'class': 'btn btn-default'
            },
            {
              title: 'Confirm',
              handler: () => {
                this.$root.$emit('hide-modal');
                this.updates ();
              },
              'class': 'btn btn-primary'
            }
          ],
          class: ['modal-width align-modal']
        });
      },
      updates () {
        this.range = 1;
        this.setUndefined = true;
        this.callModal = false;
//        this.pauseInput.get();
      }
    },
    computed: {
      pauseAfterSelection: {
        get() {
          let range = this.pausesAfterRange;
          if (range.length === 1 && range[0] !== 'none') {
            return range[0];
          }
          return 0;
        },
        set(val) {
          this.setPauseAfter(val);
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
      pauseInput: {
        get() {
          if(this.setUndefined){
            this.pause = undefined;
          }
          return this.pause;
        },
        set(val) {
          /*console.log(arguments);
          let wait = _.debounce((key,event) => {
            console.log(key, event, val);
          },  500);
          wait();*/
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
        selectedBlocks: 'filteredSelectedBlocks',
        pauseAfterBlockUpdate: 'pauseAfterBlockUpdate'
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
      /*'blockSelection': {
        handler(val) {
          this.resetPause();
          this.recalcBlocks();
        },
        deep: true
      },*/
      'blockSelection.start._id': {
        handler(val, oldVal) {
          this.lastIncrement = null;
          if (val) {
            this.resetPause();
            this.recalcBlocks();
          }
        }
      },
      'blockSelection.end._id': {
        handler(val, oldVal) {
          let singleSelection = !oldVal && val === this.blockSelection.start._id;
          if (this.blockSelection.start._id && this.blockSelection.end._id && (this.blockSelection.start._id !== this.blockSelection.end._id || !singleSelection)) {
            this.lastIncrement = null;
            this.resetPause();
            this.recalcBlocks();
          }
        }
      },
      'blockSelection.refresh': {
        handler() {
          Vue.nextTick(() => {
            if (this.lastIncrement === null) {
              this.recalcPauseAfterRange(true);
            }
          });
        }
      },
      'styleProps': {
        handler() {
          //this.recalcPauseAfterRange(true);
          //this.pauseUpdateEmitted = false;
          //this.resetPause();
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
  .modal-width {
    width: 450px !important;
  }
  .pause-after-container {
    position: relative;
    .vue-slider-component.vue-slider-horizontal {
      z-index: 0;
    }
    #cover-slider {
      background: transparent;
      border: #00d1ff;
      width: 100%;
      height: 18px;
      position: absolute;
      top: 42px;
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
