<template>
  <transition name="modal">
    <div class="modal-mask" @click="$emit('close_audioimport')" >
      <div class="modal-wrapper">
        <div class="modal-container" @click="$event.stopPropagation()">

          <div class="modal-header">

            <slot name="header">
              <div class="header-title">
                <label class="header-h"><img src='/static/audiostack.png' class='audio-logo'></label>
                <h3 class="header-h">Import New Audiobook</h3></div>

                <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close_audioimport')">
                <i class="fa fa-times-circle-o" aria-hidden="true"></i>
                </button>

            </slot>
          </div>

          <form id="audio_select" v-show="!isUploading" enctype="multipart/form-data" @submit.prevent>

          <div class="modal-body clearfix">



            <slot name="body">

            <img class="bookcover" :src="book.coverimg" />
            <h3 class="booktitle"> For: <i>{{book.title}}</i></h3>
            <h4 class="bookauthor"> by {{book.author}} </h4>

                <br><br><br>

                <h4> Book Audio File </h4>

                <div class="col-sm-12">
                  <div class="col-sm-7">
                    <div class="input-group">
                      <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                      <input type="text" class="form-control" placeholder="URL" v-model="file_name_audio" />
                    </div>
                  </div>
                  <div class="col-sm-5">
                    or &nbsp;&nbsp;&nbsp;
                    <button class='btn btn-default' type="file">
                      <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;
                      <input name="audio_import" type="file" class="file_open" accept="audio/*" @change="onAudioFileChange"/>
                    </button>
                  </div>
                  <span class="help-block"> &nbsp; &nbsp; Audio file, ZIP files or playlist </span>
                </div>

                <br><br><br><br>

                <button class="btn btn-primary modal-default-button" @click="onFormSubmit"
                :class="{disabled : saveDisabled}">
                  <i class="fa fa-plus" aria-hidden="true"></i> &nbsp;  Import Audio
                </button>

            </slot>

          </div>

          </form>

          <div id='uploadingMsg' v-show='isUploading'>
             <h2> {{uploadProgress}}   &nbsp; <i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i> </h2>
          </div>



        </div>
      </div>
    </div>
  </transition>

</template>


<script>
import Vue from 'vue'
const formData = new FormData();

export default {
  data() {
    return {
      isUploading: false,
      uploadFiles: 0,
      uploadProgress: "Uploading Files...",
      audioURL: '',
      audioFiles: [],

      file_name_book : '',
      file_name_audio : '',
      flag_book_browse : false,
      flag_audio_browse : false,
      type_book : '',
      auth: this.$store.state.auth,
    }
  },
  components: {
    Vue
  },
  props: ['book'],
  computed: {
    currentBook: function () {
      return this.$store.getters.currentBook
    },
    saveDisabled: function() {
      return (this.uploadFiles === 0)
    }
  },
  methods: {
    formReset(){
      this.isUploading= false
      this.audioURL= ''
      // clear formData
      let entries = formData.entries()
      for(let pair of entries) formData.delete(pair[0])
      this.uploadFiles = 0
    },

    onAudioFileChange (e) {
      let fieldName = e.target.name
      let fileList = e.target.files || e.dataTransfer.files
      Array
        .from(Array(fileList.length).keys())
        .map(x => {
          formData.append(fieldName, fileList[x], fileList[x].name);
          this.uploadFiles++
        });
    },

    onFormSubmit () {
      // console.log(this.book, this.currentBook)
      let vm = this
      let api_url = '/api/v1/books/' + this.book.bookid + '/audiobooks';
      let api = this.$store.state.auth.getHttp()
      if (!this.audioURL.length) formData.append('audioURL', this.audioURL);

      var config = {
        onUploadProgress: function(progressEvent) {
          var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
          vm.uploadProgress = "Uploading Files... " + percentCompleted + "%";
        }
      }

      this.isUploading = true
      api.post(api_url, formData, config).then(function(response){
        if (response.status===200) {
          // hide modal after one second
          vm.uploadProgress = "Upload Successful"
          setTimeout(function(){ vm.$emit('close_audioimport') }, 1000)
        } else {
          // not sure what we should be doing here
          vm.formReset()
        }
      }).catch((err) => {
        console.log('error: '+ err)
        vm.formReset()
        setTimeout(function(){ vm.$emit('close_audioimport') }, 1000)
      });




      //
      //
      // var author = 'Bearer ' + this.auth._session.token + ':' + this.auth._session.password;
      // Vue.http.headers.common['Authorization'] = author;
      //
      // if (this.flag_book_browse) {
      //   if (this.flag_audio_browse) {
      //     // file browser of book, audio
      //     this.$http.post(url, { 'book': dataBook, 'audio': dataAudio, 'type_book': this.type_book }).then((response) => {
      //       // result
      //       alert(response.toString());
      //
      //     });
      //   } else {
      //     // file browser of book, url of audio
      //   }
      // } else {
      //   if (this.flag_audio_browse) {
      //     // url of book, file browser of audio
      //   } else {
      //     // url of book, audio
      //   }
      // }

      // close
      //this.$emit('close_audioimport');

    }

  },
}
</script>


<style scoped>

div.coverimg {
    width: 80px;
    padding:0; padding-right: 8px;
    float: left;
    margin-left: 3px; margin-top: 0;
    padding-bottom: 10px;}
  img.coverimg {
    max-width: 60px;
  }
  .author,  h4.title {margin: 0; padding-bottom: 10px; }
  .subtitle {margin-top:0;}

.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 500px;
  margin: 0px auto;
  padding: 0px 0px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header h3 {
  margin-top: 0;
  color: #2e6da4;
   /*#42b983;*/
}

.modal-header {
  padding-left: 0px;
  padding-right: 0px;
  padding-bottom:5px;
}

.audio-logo {
  /*width:50px;
  height:50px;*/
}

.modal-body {
  margin: 0px 0;
}

.modal-footer {

}

.modal-default-button {
  float: right;
}

.import-title {
  padding-left: 10px;
  padding-right:10px;
  border-bottom : solid 1px lightgrey;
  margin-bottom : 10px;
}

.file_open {
  opacity: 0;
  position: absolute;
  top: 5px;
  left: -80px;
  cursor:pointer;
}

#btn_open {
  cursor: pointer;
}

.header-title {
  padding-left: 10px;
  display: inline;
}

.header-h {
  display: inline;
  position: relative;
  width: 60px; height: 50px;
}

.header-h img {
  padding-bottom: 10px;
  postion: absolute !important;
  top:0; left: 0;
  width: 40px;
}

.info-field {
  padding: 10px;
}

.dropbox {
  border: solid 1px lightgrey;
  width: 100%;
  height: 100px;
}


/* after visibility */
.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}


.fa:hover {
  color: inherit;
}

button.close i.fa {font-size: 18pt; padding-right: .5em;}
.booktitle {font-family: times; padding-top:0; margin-top:0;}
.bookauthor {font-family: times; color: gray; text-indent: 2.5em}
.bookcover {float: right; max-width: 100px; max-height: 140px;
  border-radius: 2px; margin: 10px;
  box-shadow: 0px 1px 3px 2px rgba(100,100,100,.25);
  padding-top:0; margin-top:0;
}

#uploadingMsg {text-align: center; padding-bottom: 1em;}
#uploadingMsg h2 i {font-size: 24pt; color: silver}

</style>
