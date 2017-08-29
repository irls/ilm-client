<template>
<div class="container-fluid">

    <template v-for="(sublist, page_Idx) in parlist">
    <div class="row" v-for="(block, block_Idx) in sublist">
        <div class='col'>
          <BookBlockView
              :block="block"
              :putBlock ="putBlockProxy"
              :getBlock ="getBlockProxy"
              :recorder ="recorder"
              @startRecording="startRecording"
              @stopRecording="stopRecording"
          />
        </div>
        <!--<div class='col'>-->
    </div>
    <!--<div class="row"-->
    </template>

    <infinite-loading v-if="autoload" :on-infinite="onScrollBookDown" ref="scrollBookDown"></infinite-loading>

</div>
<!--<div class="container">-->
</template>

<script>

import { mapGetters, mapState, mapActions } from 'vuex'
import BookBlockView from './BookBlockView'
import InfiniteLoading from 'vue-infinite-loading'
import Vue from 'vue'
import access from "../../mixins/access.js"
import taskControls from '../../mixins/task_controls.js'
import mediaStreamRecorder from 'recordrtc'
import api_config from '../../mixins/api_config.js'
import axios from 'axios'
import { BookBlock }    from '../../store/bookBlock'

export default {
  data () {
    return {
      page: 0,
      parlist: [],
      autoload: true,
      recorder: false
    }
  },
  computed: {
      // --- From store --- //
      ...mapState({
          //bookBlock: 'bookBlock'
      }),
      ...mapGetters({
          book: 'currentBook',
          meta: 'currentBookMeta',
          watchBlk: 'contentDBWatch'
      })
  },
  mixins: [access, taskControls, api_config],
  components: {
      BookBlockView, InfiniteLoading
  },
  methods: {
    ...mapActions(['loadBlocks', 'watchBlocks', 'putBlock', 'getBlock']),

    test() {
        //this.parlist.splice(0,1);
        //console.log(this.parlist);
        window.scrollTo(0, document.body.scrollHeight-500);
    },

    onScrollBookUp() {
      console.log('onScrollBookUp, page: ', this.page);
      if (this.page>1) {
          this.page--;
      } else {
          this.$refs.scrollBookUp.$emit('$InfiniteLoading:loaded');
      }
      console.log('onScrollBookUp');
    },

    onScrollBookDown() {
        //console.log('onScrollBookDown, page:', this.page);
        //console.log( this.meta._id );
        this.loadBlocks({
            book_id: this.meta._id,
            page: this.page++,
            onpage: 20
        }).then((result)=>{
            let tmp = [];
            if (result.length > 0) {
                result.forEach((el, idx, arr)=>{
                    //let newBlock = Object.assign(new this.newBlock(), el.doc);
                    let newBlock = new BookBlock(el.doc);
                    tmp.push(newBlock);
                });
                if (tmp.length>0) this.parlist.push(tmp)//([...tmp]);

                this.$refs.scrollBookDown.$emit('$InfiniteLoading:loaded');
            } else {
                this.$refs.scrollBookDown.$emit('$InfiniteLoading:complete');
            }
            //console.log('loaded', result);
        }).catch((err)=>{
            if (this.$refs.scrollBookDown) this.$refs.scrollBookDown.$emit('$InfiniteLoading:complete');
            console.log('Error: ', err.message);
        });
    },

    refreshBlock (change) {
        this.parlist.forEach((el, idx0, arr)=>{
            el.forEach((block, idx1)=>{
                if (block._id === change.id) {
                    if (change.doc.audiosrc) {
                      change.doc.audiosrc = process.env.ILM_API + change.doc.audiosrc;
                    }
                    Vue.set(this.parlist[idx0], idx1, new BookBlock(change.doc));
                }
            });
        });
        this.initRecorder();
    },

//       return new Promise((resolve, reject) => {
//           setTimeout(() => {
//               if (typeof(this.book.content)==='undefined') return reject({message: 'book not found'});
//           }, 1000);
//       })


    hasClass: function(block, cssclass) {
      let list = block.classes.toLowerCase().trim().split(' ');
      return (list.indexOf(cssclass.toLowerCase()) > -1)
    },
    showID: function(block) {
      return ((block.type==='par') && this.hasClass(block, 'parnum'))
    },

    hideParNum: function(block) {
      alert('Removing Paragraph Number'+ block.id)
    },
    showParNum: function(block) {
      alert('Adding Paragraph Number'+ block.id)
    },
    insertBlockBelow: function (block) {
      alert('Inserting new Block after '+block.id)
    },
    removeBlock: function(block) {
      alert('Merging block into '+block.id)
    },
    editBlockId: function(block) {
      alert('Editing block id '+block.id)
    },

    putBlockProxy: function (block) {
      return this.putBlock(block)
      .then(()=>{})
      .catch((err)=>{})
    },

    getBlockProxy: function (block_id) {
      return this.getBlock(block_id)
      .then((res)=>{
        this.parlist.forEach((el, idx0, arr)=>{
          el.forEach((block, idx1)=>{
            if (block._id === res._id) {
              Vue.set(this.parlist[idx0], idx1, new BookBlock(res));
            }
          });
        });
      })
      .catch((err)=>{
        console.log(err);
      })
    },

    eventKeyDown: function(key) {
        if (key.code==='Escape' || key.keyCode===27) this.$events.emit('currentEditingBlock_id', key);
    },
    onMediaSuccess_msr(stream) {
      this.recorder = new mediaStreamRecorder(stream, {
        recorderType: mediaStreamRecorder.MediaStreamRecorder,
        mimeType: 'audio/ogg'
      });
    },
    initRecorder() {
      if (!this.recorder && this.tc_hasTask('block_narrate')) {
        navigator.getUserMedia({
          audio: true
        }, this.onMediaSuccess_msr, function (e) {
          console.error('media error', e);
        });
      }
    },
    startRecording(block_id) {
      //this.recorder.start();
      this.recorder.startRecording();
    },
    stopRecording(block_id, blockAudio) {
      let api_url = this.API_URL + 'book/block/' + block_id + '/audio';
      let api = this.$store.state.auth.getHttp();
      this.recorder.stopRecording(function(audioUrl) {
        //console.log("HERE: ", audioUrl);
        //audio.src = audioURL;

        //var recordedBlob = recordRTC.getBlob();
        this.getDataURL(function(dataURL) {

          //console.log('Data URL: ', dataURL);
          let formData = new FormData();
          formData.append('audio', dataURL.split(',').pop());
          api.post(api_url, formData, {})
            .then(response => {
              if (response.status == 200) {
                blockAudio.src = process.env.ILM_API + response.data.audiosrc + '?' + (new Date()).toJSON();
                blockAudio.map = response.data.content;
              }
            })
            .catch(err => {});
        });
      });
    }
  },
  events: {
      currentEditingBlock_id : function (key) {
          //console.log("keydown: ", key)
      }
  },
  mounted: function() {
      window.addEventListener('keydown', this.eventKeyDown);

      this.watchBlocks({book_id: this.meta._id})
      .then(()=>{
          this.watchBlk.on('change', (change) => {
              this.refreshBlock(change);
          })
      });
      this.initRecorder();
  },
  beforeDestroy:  function() {
    window.removeEventListener('keydown', this.eventKeyDown);
  }
}
</script>

<style lang="less" src="./css/ocean.less"></style>
<style lang="less">

</style>
