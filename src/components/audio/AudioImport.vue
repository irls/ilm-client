<template>
  <transition name="modal">
    <div class="modal-mask" @click="$emit('close')" >
      <div class="modal-wrapper">
        <div class="modal-container" @click="$event.stopPropagation()">

          <div class="modal-header">

            <slot name="header">
              <div class="header-title">
                <label class="header-h"><img src='/static/audiostack.png' class='audio-logo'></label>
                <h3 class="header-h">Import New Audiobook</h3></div>

                <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close')">
                <i class="fa fa-times-circle-o" aria-hidden="true"></i>
                </button>

            </slot>
          </div>

          <form id="audio_select" v-show="!isUploading" enctype="multipart/form-data" @submit.prevent>

          <div class="modal-body clearfix">



            <slot name="body">

            <img class="bookcover" :src="book.coverimg" />
            <h3 class="booktitle"> For: <i>{{book.title}}</i></h3>
            <h4 class="bookauthor"> by {{book.author.join(',')}} </h4>

                
                <div v-if="audiobook._id && allowDownload" class="col-sm-12">
                  <h3>
                  Original audio
                  </h3>
                  <div class="col-sm-12">
                    <h4>Uploaded by {{audiobook.creator}} at {{dateFormated(audiobook.createdAt, 'd F')}}</h4>
                  </div>
                  <div class="col-sm-8">
                    <h5>{{audiobook.importFiles.length}} files total</h5>
                  </div>
                  <div class="col-sm-4">
                    <!-- <a class="download-audio-link" :href="SERVER_URL + audiobook.url"><i class="fa fa-download"></i>Download</a> -->
                    <a class="download-audio-link" :href="API_URL + 'books/' + book.bookid + '/audiobooks/' + audiobook._id + '/download'" target="blank"><i class="fa fa-download"></i>Download</a>
                  </div>
                </div>
                
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
                    <label class='btn btn-default' type="file">
                      <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;
                      <input name="audio_import" type="file" class="file_open" accept="audio/*" @change="onAudioFileChange" :multiple="multiple" />
                    </label>
                  </div>
                  <span class="help-block"> &nbsp; &nbsp; Audio file, ZIP files or playlist </span>
                </div>

                <br><br><br><br>
                
                <ul id="audioFiles">
                  <li v-for="file in audioFiles">
                    {{ file.name }} - {{ humanFileSize(file.size, true) }}
                  </li>
               </ul>
                <button class="btn btn-primary modal-default-button" @click="onFormSubmit"
                :class="{disabled : saveDisabled}">
                  <i class="fa fa-plus" aria-hidden="true"></i> &nbsp;  Import Audio
                </button>

            </slot>

          </div>

          </form>

          <div id='uploadingMsg' v-show='isUploading'>
             <h2> {{uploadProgress}}&nbsp;
               <i v-if='!uploadFinished' class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i>
               <i v-else class="fa fa-check"></i>
             </h2>
          </div>



        </div>
      </div>
      <modal v-model="showDuplicateFilesWarning" effect="fade">
        <div class="modal-body">
          <div v-if="uploadFilesDuplicates[0]">
            {{uploadFilesDuplicates[0].name}} already exists. Do you want to replace it?
          </div>
        </div>
        <!-- custom buttons -->
        <div slot="modal-footer" class="modal-footer">
          <button type="button" class="btn btn-default" @click="cancelDuplicateAudio()">Cancel</button>
          <button type="button" class="btn btn-confirm" @click="replaceDuplicateAudio()">Replace</button>
        </div>
      </modal>
    </div>
  </transition>

</template>


<script>
import Vue from 'vue'
import api_config from '../../mixins/api_config.js'
import {dateFormat} from '../../filters';
import {modal} from 'vue-strap';

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
      uploadFinished: false,
      formData: new FormData(),
      uploadFilesDuplicates: [],
      confirmedDuplicates: []
    }
  },
  components: {
    Vue, modal
  },
  mixins: [api_config],
  props: {
    'book': {
      type: Object,
      default: {}
    },
    'multiple': {
      type: Boolean,
      default: true
    },
    'importTask': {
      type: Object,
      default: () => {return {}}
    },
    'audiobook': {
      type: Object,
      default: () => {return {}}
    },
    'allowDownload': {
      type: Boolean,
      default: true
    }
  },
  computed: {
    currentBook: function () {
      return this.$store.getters.currentBook
    },
    saveDisabled: function() {
      return (this.uploadFiles === 0)
    },
    showDuplicateFilesWarning: {
      get() {
        return this.uploadFilesDuplicates.length > 0;
      },
      set() {
        
      }
    }
  },
  methods: {
    formReset(){
      this.isUploading= false
      this.audioURL= ''
      // clear formData
      let entries = this.formData.entries()
      for(let pair of entries) this.formData.delete(pair[0])
      this.uploadFiles = 0
    },

    onAudioFileChange (e) {
      //let fieldName = e.target.name
      let fileList = e.target.files || e.dataTransfer.files
      if (!this.multiple) {
        this.audioFiles = [];
        this.formData = new FormData();
      }
      for(let file of fileList) {
          let exist = false;
          if (this.audiobook._id) {
            exist = this.audiobook.importFiles.find(_f => {
              return _f.origName == file.name;
            });
          }
          if (exist) {
            this.uploadFilesDuplicates.push(file);
          } else {
            let existInCurrent = this.audioFiles.find(_f => {
              return _f.name == file.name;
            })
            if (!existInCurrent) {
              this.addFileToUpload(file);
            }
          }
      }
      
      /*Array
        .from(Array(fileList.length).keys())
        .map(x => {
          this.formData.append(fieldName, fileList[x], fileList[x].name);
          //console.log('Field name: ', fieldName)
          this.uploadFiles++
        });*/
    },
    addFileToUpload(file) {
      this.audioFiles.push({name: file.name, size: file.size});
      this.formData.append('audio_import', file, file.name);
      this.uploadFiles++
    },

    onFormSubmit () {
      // console.log(this.book, this.currentBook)
      let vm = this
      vm.uploadFinished = false
      let api_url = vm.API_URL + 'books/' + this.book.bookid + '/audiobooks';
      let api = this.$store.state.auth.getHttp()
      if (!this.audioURL.length) this.formData.append('audioURL', this.audioURL);

      var config = {
        onUploadProgress: function(progressEvent) {
          var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
          vm.uploadProgress = "Uploading Files... " + percentCompleted + "%";
        }
      }

      this.isUploading = true
      if (!this.audiobook._id) {
        // first upload by editor
        api.post(api_url, this.formData, config).then(function(response){
          if (response.status===200) {
            // hide modal after one second
            vm.uploadProgress = "Upload Successful"
            vm.uploadFinished = true
            vm.$emit('audiofilesUploaded', response.data);
            if (vm.importTask._id && response.data && typeof response.data._id !== 'undefined') {
              api.put(vm.API_URL + 'task/' + vm.importTask._id + '/audio_imported', {})
                .then((link_response) => {
                  vm.closeForm(response)
                })
                .catch((err) => {
                  vm.closeForm(response)
                })
            } else {
              vm.closeForm(response)
            }
          } else {
            // not sure what we should be doing here
            vm.formReset()
          }
        }).catch((err) => {
          console.log('error: '+ err)
          vm.formReset()
          setTimeout(function(){ vm.$emit('close') }, 1000)
        });
      } else {
        // upload updated file by engineer or another file by editor
        //vm.audiobook.importFiles = [];
        this.formData.append('audiobook', JSON.stringify(vm.audiobook));
        api.post(api_url + '/' + vm.audiobook._id, this.formData, config).then(function(response){
          if (response.status===200) {
            // hide modal after one second
            vm.uploadProgress = vm.audioFiles.length + " Audiofiles  uploaded"
            vm.uploadFinished = true
            vm.$emit('audiofilesUploaded', response.data);
            if (vm.importTask._id && response.data && typeof response.data._id !== 'undefined') {
              api.put(vm.API_URL + 'task/' + vm.importTask._id + '/audio_imported', {})
                .then((link_response) => {
                  
                })
                .catch((err) => {
                  
                })
            } else {
              
            }
          } else {
            // not sure what we should be doing here
            vm.formReset()
          }
        }).catch((err) => {
          console.log('error: '+ err)
          vm.formReset()
          setTimeout(function(){ vm.$emit('close') }, 1000)
        });
      }




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
      //this.$emit('close');

    },
    humanFileSize(bytes, si) {
        var thresh = si ? 1000 : 1024;
        if(Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = si
            ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
            : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while(Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1)+' '+units[u];
    },
    closeForm() {
      let self = this
      setTimeout(function(){ self.formReset(); self.$emit('close');  }, 1000)
    },
    dateFormated(date, format) {
      return dateFormat(date, format)
    },
    cancelDuplicateAudio() {
      this.uploadFilesDuplicates.shift();
    },
    replaceDuplicateAudio() {
      this.addFileToUpload(this.uploadFilesDuplicates.shift());
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

.download-audio-link {
    display: inline-block;
    background-color: #9fc5f8;
    padding: 10px;
    color: white;
}

</style>
