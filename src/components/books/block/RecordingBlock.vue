<template>
  <div :class="['recording-block', '-langblock-' + lang]">
    <!-- <div class="row"> -->
      <div class="recording-text" v-html="text" ref="recordingText">

      </div>
    <!-- </div> -->
    <div class="table-body">
      <div class="table-row">
        <div class="table-cell cancel-recording -left">
          <span class="btn btn-default" @click="_cancelRecording">
            <span class="icon"></span>
            <span class="text">
            Cancel
            </span>
          </span>

        </div>
        <div class="table-cell -left">
          <div class="table-cell pause-recording" @click="_pauseRecording" v-if="!isPaused">
              <span class="btn btn-default">
                <span class="icon"></span>
                <span class="text">
                  Pause
                </span>
              </span>
          </div>
        </div>
        <div class="table-cell -left">
          <div class="table-cell resume-recording" @click="_resumeRecording" v-else>
              <span class="btn btn-default">
                <span class="icon"></span>

                <span class="text">
                  Resume
                </span>
              </span>
          </div>
          <div class="table-cell recording-in-progress recordStartCounterDep"  style="display: none;" v-if="!isPaused">
            <span class="icon"></span>

            <span class="text">
              Recording in progress
            </span>
          </div>
          <div class="table-cell recording-on-pause recordStartCounterDep"  style="display: none;"  v-else>
            <span class="icon"></span>

            <span class="text">
              Recording paused
            </span>
          </div>



        </div>

        <div class="table-cell">
          <div class="table-row -right">
            <div class="table-cell save-recording">
              <span class="btn btn-primary" @click="_stopRecording()">
                <span class="save-icon"><span class="vector1"></span><span class="vector2"></span><span class="vector3"></span></span>
                <span class="text">
                Save
                </span>
              </span>
            </div>
            <div class="table-cell save-recording-and-next" @click="_stopRecording(true)">
              <span class="btn btn-primary">
                <span class="text">
                  Save and Next <span style="padding-left: 5px; font-weight: bold">&gt;</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="recording-block-toolbar" class="toolbar-container"></div>
  </div>
</template>
<script>
  import {  SuggestPreview, MediumEditor } from '../../generic/ExtMediumEditor';
  export default {
    data() {
      return {
        isPaused: false,
        editor: null
      }
    },
    props: ['text', 'cancelRecording', 'stopRecording', 'pauseRecording', 'resumeRecording', 'lang'],
    methods: {
      _cancelRecording() {
        this.isPaused = false;
        this.cancelRecording();
        this.$emit('close');
      },
      _stopRecording(start_next = false) {
        this.isPaused = false;
        this.stopRecording(start_next);
        this.$emit('close');
      },
      _pauseRecording() {
        this.isPaused = true;
        this.pauseRecording();
      },
      _resumeRecording() {
        this.isPaused = false;
        this.resumeRecording();
      }
    },
    mounted: function() {
      this.$refs.recordingText.style['max-height'] = window.innerHeight - 100 + 'px';

      let extensions = {
        'suggestPreview': new SuggestPreview()
      };
      this.editor = new MediumEditor('.recording-text', {
        toolbar: {
          buttons: [],
          relativeContainer: document.getElementById('recording-block-toolbar'),
        },
        buttonLabels: 'fontawesome',
        quotesList: [],
        extensions: extensions,
        disableEditing: true,
        imageDragging: false
      });
    }
  }
</script>
<style lang="less">

.resume-recording{
  height: 38px;
  padding-left: 15px;
}
.resume-recording .btn {
  height: 38px;
}
.cancel-recording .text{
  position: relative;
  top: -1px;
}

.cancel-recording .btn {
  height: 38px;
}

.cancel-recording i {
  padding-top: 2px;
}

.pause-recording, .save-recording-and-next,.save-recording, .resume-recording{
  height: 38px;
  width: 110px;
  left: 0px;
  top: 0px;
  border-radius: 4px;
}
.pause-recording {
  padding-right: 0px;
  padding-left: 15px;
}
.save-recording {
  width: 87px;
  padding-right: 10px;
  padding-left: 15px;
}
.resume-recording .btn{
  height: 38px;
  padding-top: 0px;
}
.cancel-recording .btn{
  height: 38px;
  padding-top: 0px;
}
.pause-recording .btn {
  height: 38px;
  padding-top: 0px;
}
.save-recording .btn {
  height: 38px;
  padding-top: 0px;
}
.save-recording-and-next .btn {
  height: 38px;
  padding-top: 0px;
}

.pause-recording .text,.save-recording .text,.save-recording-and-next .text{
  font-family: Helvetica;
  font-size: 16px;
  font-weight: 400;
  line-height: 37px;
  letter-spacing: 0em;
  text-align: left;

}
.pause-recording .icon{
  height: 24px;
  width: 24px;
  display: inline-block;
  top: 7px;
  background-image: url(/static/RecordingBlock/pause.png);
  //border-radius: 0px;
  position: relative;
}
.resume-recording .icon{
  height: 24px;
  width: 24px;
  display: inline-block;
  top: 7px;
  background-image: url(/static/RecordingBlock/resume.png);
  //border-radius: 0px;
  position: relative;
}
.cancel-recording .icon{
  height: 24px;
  width: 24px;
  display: inline-block;
  top: 3px;
  background-image: url(/static/RecordingBlock/cancel.png);
  //border-radius: 0px;
  position: relative;
}
.recording-in-progress .icon{
  height: 37px;
  width: 37px;
  display: inline-block;
  //top: 7px;
  background-image: url(/static/RecordingBlock/RecordingInProgress.png);
  position: relative;
  background-size:37px;
  animation: recording-in-progress-animation 1s;
  animation-iteration-count: infinite;
}
@keyframes recording-in-progress-animation {
  from {opacity: 20%;}
  to {opacity: 120%;}
}
.recording-on-pause .icon{
  height: 37px;
  width: 37px;
  display: inline-block;
  //top: 7px;
  background-image: url(/static/RecordingBlock/RecordingPaused.png);
  position: relative;
  background-size:37px;
}
.recording-in-progress .text{
  color: #C51216;
  padding-left: 5px;
  top: -13px;
  position: relative;
  display: inline-block;
  padding-top: 0px;
}
.recording-on-pause .text{
  color: #828282;
}

.recording-in-progress{
  padding-left: 26px;
}
.recording-on-pause{
  padding-left: 26px;
}

  .recording-block {
    &.-langblock-fa, &.-langblock-ar {
      .recording-text {
        text-align: justify;
      }
    }
    .recording-text {
      font-size: 17pt;
      padding: 15px 30px;
      font-family: GentiumPlus, serif;
      overflow-y: auto;
      width: fit-content;
    }
    .table-body {
      padding: 20px;
    }
    .cancel-recording {
      color: red;
      .btn.btn-default {
        border-color: red;
        color: red;
      }
      .fa {
        color: red;
      }
    }
    /*br {
      display: block;
      margin: 15px 0;
      line-height: 24px;
      content: " ";
    }*/
    .part-separator {
      height: 12px;
    }
  }
</style>
