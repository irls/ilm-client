<template>
  <div>
    <div>
      <input v-model="audioUrl"/>
      <button @click="load()">Load</button>
    </div>
    <div>
      <button @click="cut()">Cut</button>
      <input v-model="silenceLength" type="number" step="0.1"/>
      <button @click="insertSilence()">Insert silence</button>
      <input v-model="filename"/>
      <button @click="save()">Save</button>
      <div id="waveform"></div>
      <div id="wave-timeline"></div>
    </div>
  </div>
</template>
<script>
  //import WaveSurfer from 'wavesurfer.js';
  //import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.js';
  //import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.js';
  import api_config from '../../mixins/api_config.js';
  export default {
    data() {
      return {
        context: null,
        audioUrl: 'https://ilm-server-dev.dev2.us/audiofiles/align_test_0003_en/align_test_0003_en-bl2s/align_test_0003_en-bl2s.m4a',
        soundBuffer: null,
        wavesurfer: null,
        selection: {},
        silenceLength: 0.5,
        filename: 'test.m4a'
      };
    },
    components: {
      //WaveSurfer
    },
    mixins: [api_config],
    mounted() {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'violet',
        progressColor: 'purple',
        plugins: [
          RegionsPlugin.create({
            maxRegions: 1
          }),
          TimelinePlugin.create({
            container: "#wave-timeline",
            timeInterval: 0.1
          })
        ]
      });
      this.wavesurfer.on('region-created', (a) => {
        this.selection = a;
      });
    },
    methods: {
      load() {
        let api = this.$store.state.auth.getHttp();
        api.get(this.audioUrl, {
          responseType: 'arraybuffer'
        })
          .then((response) => {
            //console.log(response);
            this.context.decodeAudioData(response.data, (buffer) => {
              this.soundBuffer = buffer;
              /*for (var t = this.soundBuffer.sampleRate, i = (this.soundBuffer.length,
            this.soundBuffer.duration,
            this.soundBuffer.numberOfChannels), n = [str_leftc, str_rightc], o = 0; o < i; ++o) {
                var s = activeAudioLayerControl.createSequenceEditor(n[o])
                  , a = CreateNewAudioSequence(t, e.getChannelData(o));
                s.setAudioSequence(a),
                s.zoomToFit()
            }*/
            });
          })
          .catch(err => {
            console.log('ERROR');
            console.log(err);
          });
          this.wavesurfer.load(this.audioUrl);
          this.wavesurfer.on('ready', () => {
            console.log('HERE', this.wavesurfer);
            console.log(WaveSurfer.regions)
            this.wavesurfer.enableDragSelection({
              color: 'rgba(0, 128, 0, 0.1)'
            });
          });
      },
      cut() {
        console.log(this.wavesurfer.regions)
        var selection = this.selection;
        if(selection){
          /*var original_buffer = this.wavesurfer.backend.buffer;
          var new_buffer      = this.wavesurfer.backend.ac.createBuffer(original_buffer.numberOfChannels, original_buffer.length - (selection.end * original_buffer.sampleRate), original_buffer.sampleRate);

          var first_list_index        = (selection.start * original_buffer.sampleRate);
          var second_list_index       = (selection.end * original_buffer.sampleRate);
          var second_list_mem_alloc   = (original_buffer.length - (selection.end * original_buffer.sampleRate));

          var new_list        = new Float32Array( parseInt( first_list_index ));
          var second_list     = new Float32Array( parseInt( second_list_mem_alloc ));
          var combined        = new Float32Array( original_buffer.length );

          original_buffer.copyFromChannel(new_list, 0);
          original_buffer.copyFromChannel(second_list, 0, second_list_index)

          combined.set(new_list)
          combined.set(second_list, first_list_index)

          new_buffer.copyToChannel(combined, 0);
          
          //original_buffer.splice(first_list_index, second_list_index);

          //this.wavesurfer.clearWave();
          this.wavesurfer.loadDecodedBuffer(new_buffer);*/
          var original_buffer = this.wavesurfer.backend.buffer;

          var first_list_index        = (selection.start * original_buffer.sampleRate);
          var second_list_index       = (selection.end * original_buffer.sampleRate);
          var second_list_mem_alloc   = (original_buffer.length - (selection.end * original_buffer.sampleRate));
          
          var new_buffer      = this.wavesurfer.backend.ac.createBuffer(original_buffer.numberOfChannels, parseInt( first_list_index ) + parseInt( second_list_mem_alloc ), original_buffer.sampleRate);

          var new_list        = new Float32Array( parseInt( first_list_index ));
          var second_list     = new Float32Array( parseInt( second_list_mem_alloc ));
          var combined        = new Float32Array( parseInt( first_list_index ) + parseInt( second_list_mem_alloc ) );

          original_buffer.copyFromChannel(new_list, 0);
          original_buffer.copyFromChannel(second_list, 0, second_list_index)

          combined.set(new_list)
          combined.set(second_list, first_list_index)

          new_buffer.copyToChannel(combined, 0);
          
          //original_buffer.splice(first_list_index, second_list_index);

          this.wavesurfer.empty();
          this.wavesurfer.clearRegions();
          this.wavesurfer.loadDecodedBuffer(new_buffer);
        }else{
          console.log('did not find selection');
        }
      },
      insertSilence() {
        var original_buffer = this.wavesurfer.backend.buffer;
        let time = this.wavesurfer.getCurrentTime();

        var first_list_index        = parseInt(time * original_buffer.sampleRate);
        var second_list_index       = parseInt((time + this.silenceLength) * original_buffer.sampleRate);
        var second_list_mem_alloc   = (original_buffer.length - first_list_index);
        console.log(this.wavesurfer.backend.ac)

        var new_buffer      = this.wavesurfer.backend.ac.createBuffer(original_buffer.numberOfChannels, original_buffer.length + parseInt((this.silenceLength) * original_buffer.sampleRate), original_buffer.sampleRate);

        var new_list        = new Float32Array( parseInt( first_list_index ));
        var silence         = new Float32Array( this.silenceLength * original_buffer.sampleRate );
        var second_list     = new Float32Array( parseInt( second_list_mem_alloc ));
        var combined        = new Float32Array( original_buffer.length + parseInt((time) * original_buffer.sampleRate) );

        original_buffer.copyFromChannel(new_list, 0);
        original_buffer.copyFromChannel(second_list, 0, first_list_index)

        combined.set(new_list)
        combined.set(silence, first_list_index);
        combined.set(second_list, second_list_index)

        new_buffer.copyToChannel(combined, 0);

        //original_buffer.splice(first_list_index, second_list_index);

        this.wavesurfer.empty();
        this.wavesurfer.clearRegions();
        this.wavesurfer.loadDecodedBuffer(new_buffer);
      },
      save() {
        let api = this.$store.state.auth.getHttp();
        let api_url = `${this.API_URL}save_edited_audio`;
        var new_list        = new Float32Array( parseInt( this.wavesurfer.backend.buffer.length ));

        this.wavesurfer.backend.buffer.copyFromChannel(new_list, 0);
        api.post(api_url, {
          file: {
            name: this.filename,
            buffer: new Blob(new_list, {type: "audio/wav"})
          }
        });
      }
    }
  }
</script>
<style lang="less">
</style>