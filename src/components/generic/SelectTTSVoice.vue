<template>
<div>
  <i class="fa fa-play-circle button-play-tts disabled" @click="playAudio"></i>
  <div class="js-select2-wrapper">
    <select class="js-select2" >
      <slot></slot>
    </select>
  </div>
</div>
</template>
<script>

  import $ from 'jquery'
  import 'select2'
  import 'select2/dist/css/select2.css'

//import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'

export default {

  name: 'SelectTTSVoice',

  data () {
    return {
      options: [],
      value: '',
      text: false,
      audio64: '',
      config: {
        allowClear: false,
        placeholder: 'Please select a voice'
      }
    }
  },

  props: [
    'pre_selected', 'pre_options', 'pre_volume'
  ],
//     data example:
//       {
//       "text": "Group 2",
//       "children" : [
//         {
//             "id": 3,
//             "text": "Option 2.1"
//         },
//         {
//             "id": 4,
//             "text": "Option 2.2"
//         }
//       ]
//     }

  computed: {
    ...mapGetters(['ttsVoices', 'blockSelection'])
  },

  methods: {
    ...mapActions(['getTTSVoices', 'getTestSpeech']),

    applyAudio(val) {
      if (val.length) {
        //console.log('applyAudio', this.text);
        let text = this.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
        this.getTestSpeech({voiceId: val, text: text})
        .then((response)=>{
          this.audio64 = 'data:audio/ogg;base64,'+ response.data;
        })
        .catch(err=>err);
      } else {
        this.audio64 = false;
      }
    },

    playAudio() {
      if (this.audio64) {
        let df = document.createDocumentFragment();
        let snd = new Audio(this.audio64);
        snd.volume = this.pre_volume || 1.0;
        df.appendChild(snd); // keep in fragment until finished playing
        snd.addEventListener('ended', function () {df.removeChild(snd);});
        snd.play();
      }
    },

    setVoiceTest(start, end) {
      let block = start || end;
      let text = '';
      if (block && block.content) {
        text = block.content.replace(/<[^>]*>?/g, "").substring(0, 32);
      } else {
        text = false;
      }
      if (this.text !== text) {
        this.text = text;
        if (this.value) {
          this.applyAudio(this.value);
        }
      }
    }
  },

  mounted () {
    if (!this.pre_options) {
      this.getTTSVoices()
      .then(()=>{
        this.options = this.ttsVoices;
      })
      .catch(err=>err);
    } else {
      this.options = this.pre_options;
    }

    //console.log('this.value', this.value);
    let $this = this;
    $(this.$el).ready(() => {
      $(this.$el).find('.js-select2')
      .select2({
        data: this.options,
        ...this.config
      })
      .val(this.value)
      .trigger('change')
      // emit event on change.
      .on('select2:select', (e) => {
        //console.log('select2:select', e.target.value);
        this.$emit('onSelect', e.target.value);
        if (this.value !== e.target.value) {
          this.applyAudio(e.target.value);
          this.value = e.target.value;
        }
      })
      .on('select2:unselecting', function () {
        // according to https://github.com/select2/select2/issues/3320
        $(this).one('select2:opening', function(ev) { ev.preventDefault(); });
        //console.log('select2:unselecting', this.value);
        $this.value = '';
        $this.$emit('onSelect', '');
      });
    })

    if (this.pre_selected) {
      this.value = this.pre_selected;
      if ((this.blockSelection.start && this.blockSelection.start._id) || (this.blockSelection.end && this.blockSelection.end._id)) {
        this.setVoiceTest(this.blockSelection.start, this.blockSelection.end);
      } else {
        this.applyAudio(this.value);
      }
    }
    this.$root.$on('from-bookedit:set-voice-test', (start, end) => {
      this.setVoiceTest(start, end);
    });
  },

  watch: {
    pre_options: function (options) {
      // update options
      $(this.$el).find('.js-select2')
      .empty()
      .select2({ data: options, ...this.config })
      .val(this.value)
      .trigger('change');
    }
  },

  destroyed: function () {
    const el = $(this.$el).find('.js-select2');
    if (el && el.select2) {
      el.off().select2('destroy');
    }
    this.$root.$off('from-bookedit:set-voice-test');
    //console.log('destroyed');
  }
}
</script>
<style lang="less">
  .js-select2 {
    width: 200px;
  }
  .js-select2-wrapper {
    width: 200px;
    display: inline-block;
  }
  .fa.button-play-tts {
    font-size: 21pt;
    vertical-align: middle;
    margin-right: 10px;
  }
</style>
