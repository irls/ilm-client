<template>
  <div class="test-audio-convert-file">
    <template v-if="!isUploading">
      <fieldset class="main-fieldset">
        <legend>Audio file</legend>
        <div class="col-sm-4">
          <form enctype="multipart/form-data" @submit.prevent>
            <div class="col-md-12">
              <div class="col-sm-6">
                <label class='btn btn-default' type="file">
                  <i class="fa fa-folder-open-o" aria-hidden="true"></i>Browse&hellip;
                  <input name="audio_import" type="file" class="file_open" accept="audio/*" v-on:change="onAudioFileChange" />
                </label>
              </div>
              <div class="col-sm-6">
                <button class="btn btn-primary" v-on:click="startConvert" :disabled="!file">Compress</button>
              </div>
              <div class="col-sm-12">
                {{filename}}<template v-if="fileSize">&nbsp;({{fileSize}}&nbsp;Kb)</template>
              </div>
            </div>
          </form>
        </div>
        <div class="col-sm-12">
          <div class="col-sm-3">
            <fieldset class="params-fieldset">
              <legend>Compression</legend>
              <table>
                <tr>
                  <td>
                    -b:a
                  </td>
                  <td>
                    -ar
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td>
                    <input v-model="convertConfig.compress.rate" type="number" />&nbsp;&nbsp;k
                  </td>
                  <td>
                    <input v-model="convertConfig.compress.frequency" type="number" />
                  </td>
                  <td>
                    <button class="btn btn-default" v-on:click="resetConfig('compress')">Reset</button>
                  </td>
                </tr>
              </table>
            </fieldset>
          </div>
          <div class="col-sm-4">
            <fieldset class="params-fieldset">
              <legend>Normalization</legend>
              <table>
                <tr>
                  <td>Target loudness</td>
                  <td>Loudness Range</td>
                  <td>True peak</td>
                  <td></td>
                </tr>
                <tr>
                  <td><input v-model="convertConfig.normalize.input_i" type="number" step="0.1" /></td>
                  <td><input v-model="convertConfig.normalize.input_lra" type="number" step="1" /></td>
                  <td><input v-model="convertConfig.normalize.input_tp" type="number" step="0.1" /></td>
                  <td><button class="btn btn-default" v-on:click="resetConfig('normalize')">Reset</button></td>
                </tr>
              </table>
            </fieldset>
          </div>
          <div class="col-sm-12">
            <fieldset class="params-fieldset">
              <legend>Noise removal</legend>
              <div class="col-sm-12">
                <label :class="[{'not-active': convertConfig.noise_removal.type !== 'anlmdn'}]">
                  Filter anlmdn (Non-Local Means)
                  <input type="radio" v-model="convertConfig.noise_removal.type" value="anlmdn" />
                </label>
                <label :class="[{'not-active': convertConfig.noise_removal.type !== 'afftdn'}]">
                  Filter afftdn (Fast Fourier transform)
                  <input type="radio" v-model="convertConfig.noise_removal.type" value="afftdn" />
                </label>
              </div>
              <div class="col-sm-8">
                <table v-if="convertConfig.noise_removal.type === 'anlmdn'">
                  <tr>
                    <td>
                      <span title="denoising strength, Default value is 0.00001">strength</span><br>
                      (1e-05&nbsp;-&nbsp;10)
                    </td>
                    <td>
                      <span title="patch radius duration, Default value is 2 milliseconds">patch</span><br>
                      (0.001&nbsp;-&nbsp;0.1)
                    </td>
                    <td>
                      <span title="research radius duration, Default value is 6 milliseconds">research</span><br>
                      (0.002&nbsp;-&nbsp;0.3)
                    </td>
                    <td>
                      <span title="smooth factor. Default value is 11">smooth</span><br>
                      (1&nbsp;-&nbsp;15)
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td><input v-model="convertConfig.noise_removal.s" /></td>
                    <td><input v-model="convertConfig.noise_removal.p" /></td>
                    <td><input v-model="convertConfig.noise_removal.r" /></td>
                    <td><input v-model="convertConfig.noise_removal.m" /></td>
                    <td><button class="btn btn-default" v-on:click="resetConfig('noise_removal')">Reset</button></td>
                  </tr>
                </table>
                <table v-if="convertConfig.noise_removal.type === 'afftdn'">
                  <tr>
                    <td>
                      <span title="noise reduction in dB, Default value is 12 dB">noise_reduction</span><br>
                      (0.01&nbsp;-&nbsp;97)
                    </td>
                    <td>
                      <span title="noise floor in dB, Default value is -50 dB">noise_floor</span><br>
                      (-80&nbsp;-&nbsp;-20)
                    </td>
                    <td>
                      <span title="noise type, w - white noise, v - vinyl noise, s - shellac noise, c - custom noise, defined in bn option, Default value is white noise">noise_type</span><br>
                      (w/v/s/c)
                    </td>
                    <td>
                      <span title="custom band noise profile for every one of 15 bands">band_noise</span><br>
                    </td>
                    <td>
                      <span title="residual floor in dB, Default value is -38 dB">residual_floor</span><br>
                      (-80&nbsp;-&nbsp;-20)
                    </td>
                    <td>
                      <span title="Enable noise floor tracking. By default is disabled. With this enabled, noise floor is automatically adjusted">track_noise</span><br>
                      (1/0)
                    </td>
                    <td>
                      <span title="Enable residual tracking. By default is disabled">track_residual</span><br>
                      (1/0)
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td><input v-model="convertConfig.noise_removal.nr" /></td>
                    <td><input v-model="convertConfig.noise_removal.nf" /></td>
                    <td><input v-model="convertConfig.noise_removal.nt" /></td>
                    <td><input v-model="convertConfig.noise_removal.bn" /></td>
                    <td><input v-model="convertConfig.noise_removal.rf" /></td>
                    <td><input v-model="convertConfig.noise_removal.tn" /></td>
                    <td><input v-model="convertConfig.noise_removal.tr" /></td>
                    <td><button class="btn btn-default" v-on:click="resetConfig('noise_removal')">Reset</button></td>
                  </tr>
                </table>
              </div>
            </fieldset>
          </div>
        </div>
      </fieldset>
      <div class="item-table">
        <div class="item-row item-header">
          <div class="item-cell">Description</div>
          <div class="item-cell">Size&nbsp;(Kb)</div>
          <div class="item-cell">Reduction</div>
          <div class="item-cell">Actions</div>
        </div>
        <template v-for="itemK in itemKeys">
          <div class="item-row" v-if="items[itemK].buffer">
            <div class="item-cell">{{items[itemK].name}}</div>
            <div class="item-cell">
              {{items[itemK].size}}
            </div>
            <div class="item-cell">
              -{{items[itemK].reduction}}%
            </div>
            <div class="item-cell">
              <i class="fa fa-stop-circle" v-on:click="stop()" v-if="isPlaying && playingItem === itemK"></i>
              <i class="fa fa-play-circle" v-on:click="play(itemK)" v-else></i>
            </div>
          </div>
          <div class="item-row" v-if="items[itemK].error">
            <div class="item-cell">
              {{items[itemK].error.substring(0, 100)}}
            </div>
          </div>
        </template>
      </div>
    </template>
    <div class="preloader-small" v-else>
    </div>
  </div>
</template>
<script>
  import { mapGetters, mapActions } from 'vuex';
  import lodash from 'lodash';
  export default {
    data() {
      return {
        file: null,
        filename: "",
        isUploading: false,
        items: {
          //noc: {},
          //nc: {},
          //c: {}
        },
        audio_element: null,
        isPlaying: false,
        playingItem: null,
        audioSource: null,
        defaultConfig: {
          compress: {rate: 40, frequency: 22050},
          normalize: {input_i: -20, input_lra: 3.0, input_tp: -3.0},
          noise_removal: {
            type: 'anlmdn',
            s: '', p: '', r: '', m: '',// anlmdn parameters
            nr: "", nf: "", nt: "", bn: "", rf: "", tn: "", tr: ""// afftdn parameters
          }
        },
        convertConfig: {
          
        }
      }
    },
    props: ['activeTab'],
    mounted() {
      this.audio_element = document.createElement('audio');
    },
    beforeMount() {
      
      this.convertConfig = lodash.cloneDeep(this.defaultConfig);
    },
    beforeDestroy() {
      if (this.isPlaying) {
        this.stop();
      }
    },
    methods: {
      ...mapActions('testAudioConvert', ['convert']),
      onAudioFileChange(e) {
        let fieldName = e.target.name;
        let fileList = e.target.files || e.dataTransfer.files;
        if (fileList[0]) {
          this.file = fileList[0];
          this.filename = this.file.name;
        }
      },
      startConvert() {
        if (this.file) {
          this.stop();
          let formData = new FormData();
          formData.append('audiofile', this.file, this.filename);
          formData.append(`config`, JSON.stringify(this.convertConfig));
          this.isUploading = true;
          return this.convert(formData)
            .then(items => {
              this.isUploading = false;
              this.items = items;
            })
            .catch(err => {
              this.isUploading = false;
            });
        }
      },
      play(item) {
        this.stop()
          .then(() => {
            //this.audio_element.src = URL.createObjectURL(this.items[item].buffer);
            //const source = new MediaSource();
            //const stream = new MediaStream([new Blob(this.items[item].buffer.data)]);
            //this.audio_element.srcObject = stream;
            //const blob = new Blob([this.items[item].buffer.data], { type: "audio/m4a" });
            //const url = window.URL.createObjectURL(blob);
            //this.audio_element.src = url;
            //this.audio_element.play();
            //let context = new (window.AudioContext || window.webkitAudioContext)();
            //let source = context.createBufferSource();

            //source.buffer = this.items[item].buffer.data;
            //source.connect(context.destination);
            //source.start(0);
            let audioContext = new (window.AudioContext || window.webkitAudioContext);
            this.audioSource = audioContext.createBufferSource();
            //source.buffer = this.items[item].buffer;
            //source.start(0)
            //const fr = new FileReader();
            //fr.readAsArrayBuffer(this.items[item].buffer.data);
            //fr.addEventListener("load", e => {
              //const decoderPromise = super.fileLoad(e);
              //decoderPromise.then(audioBuffer => {
                //resolve(audioBuffer);
              //}).catch(reject);
              this.audioSource.addEventListener('ended', () => {
                //console.log('HERE ended')
                this.audioSource = null;
                this.isPlaying = false;
                this.playingItem = null;
              });
              const audioData = this.toArrayBuffer(this.items[item].buffer.data);
                audioContext.decodeAudioData(audioData, audioBuffer => {
                  //this.audioBuffer = audioBuffer;
                  this.audioSource.buffer = audioBuffer;
                  try {
                    this.audioSource.connect(audioContext.destination);
                    this.audioSource.start(0, 0, audioBuffer.duration)
                    this.isPlaying = true;
                    this.playingItem = item;
                  } catch (e) {
                    console.log(e)
                  }
                }, err => {
                  if (err === null) {
                    // Safari issues with null error
                    reject(Error("MediaDecodeAudioDataUnknownContentType"));
                  } else {
                    reject(err);
                  }
                });
            //});
        });
      },
      stop() {
        return new Promise((resolve, reject) => {
          if (this.audioSource) {
            this.audioSource.addEventListener('ended', () => {
              return resolve();
            })
            this.audioSource.stop();
          } else {
            return resolve();
          }
        });
      },
      toArrayBuffer(buf) {
        const ab = new ArrayBuffer(buf.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < buf.length; ++i) {
          view[i] = buf[i];
        }
        return ab;
      },
      roundFloat(floatNumber, precision = 2) {
        return parseFloat(parseFloat(floatNumber).toFixed(precision));
      },
      resetConfig(type) {
        this.convertConfig[type] = lodash.cloneDeep(this.defaultConfig[type]);
      }
    },
    computed: {
      itemKeys: {
        get() {
          return Object.keys(this.items);
        },
        cache: false
      },
      fileSize: {
        get() {
          if (this.file && this.file.size) {
            return this.roundFloat(this.file.size / 1024);
          }
          return '';
        }
      }
    },
    watch: {
      'activeTab': {
        handler() {
          this.stop();
        }
      }
    }
  }
</script>
<style lang="less">
  .test-audio-convert-file {
    form {
      /*max-width: 500px;*/
    }
    input[type="file"] {
      display: none;
    }
    fieldset {
      border: 1px solid #b9b6b6;
      position: relative;
      margin: 10px;
      padding: 20px 5px;
      &.params-fieldset {
        label {
          padding: 2px 12px;
          &.not-active {
            color: gray;
          }
        }
      }
      input[type="number"] {
        width: 60%;
      }
      table {
        input {
          width: 80%;
          display: inline-block;
        }
      }
    }
    .preloader-small {
      background: url(/static/preloader-snake-small.gif);
      width: 100%;
      height: 200px;
      left: 0px;
      top: 100px;
      background-repeat: no-repeat;
      background-position: center;
    }
  }
</style>