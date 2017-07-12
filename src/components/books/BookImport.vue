<template>
  <transition name="modal">
    <div class="modal-mask" @click="$emit('close_modal')" >
      <div class="modal-wrapper">
        <div class="modal-container" @click="$event.stopPropagation()">

          <div class="modal-header">
            <div class="header-title">
              <img src='/static/bookstack.svg' class='book-logo'> <h3 class="header-h">Import New Book</h3>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close_modal')">
              <i class="fa fa-times-circle-o" aria-hidden="true"></i>
              </button>
            </div>
          </div>



            <div class="modal-body clearfix">

            <form id="book_select" v-show="!isUploading" enctype="multipart/form-data" @submit.prevent>

              <h4> Book Text </h4>
                <div class="col-sm-12">
                  <div class="col-sm-7">
                    <div class="input-group">
                      <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                      <input type="text" class="form-control" placeholder="URL" v-model="bookURL"/>
                    </div>
                  </div>

                  <div class="col-sm-5">
                    or &nbsp;&nbsp;&nbsp;
                    <label class='btn btn-default' type="file">
                      <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;

                      <input name="bookFiles" type="file" v-show="false" accept="text/*,application/zip" :multiple="multiple" @change="onFilesChange($event)">

                    </label>
                  </div>
                  <span class="help-block"> &nbsp; &nbsp; Book file or ZIP with files and images  </span>
                </div>

                <br><br><br>

                <div class="col-sm-12">
                  <div class="col-sm-6">
                    <div class="form-group">
                      <label for="booktype">Book Type:</label>

                      <select class="form-control" id="booktype" v-model="bookType">
                        <option v-for='(type, index) in bookTypes' v-bind:value="index">{{type}}</option>
                      </select>

                    </div>
                  </div>
                </div>
                <br><br><br><br>

                <!-- <h4> Book Audio </h4>

                <div class="col-sm-12">
                  <div class="col-sm-7">
                    <div class="input-group">
                      <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                      <input type="text" class="form-control" placeholder="URL" v-model="audioURL"/>
                    </div>
                  </div>
                  <div class="col-sm-5">
                    or &nbsp;&nbsp;&nbsp;
                    <label class='btn btn-default' type="file">
                      <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;


                      <input name='audioFiles' type="file" v-show="false" multiple @change="onFilesChange($event)" accept="audio/*,application/zip">


                    </label>
                  </div>
                  <span class="help-block"> &nbsp; &nbsp; Audio file, ZIP files or playlist </span>
                </div>

                <br><br><br><br> -->

                <ul id="selectedBooks">
                  <li v-for="book in selectedBooks">
                    {{ book.name }} - {{ humanFileSize(book.size, true) }}
                  </li>
               </ul>
                <button v-if="userTaskId" class="btn btn-primary modal-default-button" @click='onFormSubmit' :class="{disabled : saveDisabled}">
                  <i class="fa fa-plus" aria-hidden="true"></i> &nbsp;  Import Book
                </button>
                <span v-if="!userTaskId" class="label label-danger">Book should be imported from task. You have no import book task assigned</span>

            </form>

            <div id='uploadingMsg' v-show='isUploading'>
               <h2> {{uploadProgress}}   &nbsp; <i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i> </h2>
            </div>

          </div comment="clearfix">
        </div>
      </div>
      <alert :value="bookUploadError != false" placement="top" duration="3000" type="danger" width="400px">
        <span class="icon-ok-circled alert-icon-float-left"></span>

        <p>{{bookUploadError}}.</p>
      </alert>
    </div>
  </transition>
</template>


<script>

import { alert } from 'vue-strap'
import axios from 'axios'

const API_URL = process.env.ILM_API + '/api/v1/'

export default {
  data() {
    return {
        isUploading: false,
        bookURL: '',
        bookType: 0,
        audioURL: '',
        bookTypes: [
          'Gutenberg HTML',
          'Ocean HTML',
          'Gutenberg Text',
          'Plain Text',
        ],
        uploadFiles: {bookFiles: 0, audioFiles: 0},
        formData: new FormData(),
        uploadProgress: "Uploading Files...",
        bookUploadError: false,
        userTaskIdLocal: null,
        selectedBooks: []
    }
  },
  props: {
      'multiple': {
        type: Boolean,
        default: true
      },
      'userTaskId': {
        type: String,
        default: null
      }
  },
  components: {
    alert
  },
  mounted() {
    this.userTaskIdLocal = this.userTaskId
  },
  computed: {
    selectedBookType: function() {
      return this.bookTypes[this.bookType];
    },
    saveDisabled: function() {
      //return (!this.bookURL && !this. bookFile);
      //console.log(this.uploadFiles.bookFiles, this.bookURL.length)

      return (this.uploadFiles.bookFiles==0 && this.bookURL.length==0)
    }
  },
  methods: {
    formReset(){
      this.isUploading= false
      this.bookURL= ''
      this.audioURL= ''
      // clear formData
      let entries = this.formData.entries()
      for(let pair of entries) this.formData.delete(pair[0])
      this.uploadFiles = {bookFiles: 0, audioFiles: 0}
    },
    onFilesChange(e) {
      let fieldName = e.target.name
      let fileList = e.target.files || e.dataTransfer.files
      this.selectedBooks = [];
      this.formData = new FormData();
      for(let file of fileList) {
          this.selectedBooks.push({name: file.name, size: file.size});
      }
      Array
        .from(Array(fileList.length).keys())
        .map(x => {
          this.formData.append(fieldName, fileList[x], fileList[x].name);
          this.uploadFiles[fieldName]++
        });
    },

    onFormSubmit() {
      let vu_this = this
      let api = this.$store.state.auth.getHttp()

      this.formData.append('bookType', this.bookTypes[this.bookType]);
      if (!this.uploadFiles.bookFiles && this.bookURL.length) this.formData.append('bookURL', this.bookURL);
      if (!this.uploadFiles.audioFiles && this.audioURL.length) this.formData.append('audioURL', this.audioURL);
      this.formData.append('taskId', this.userTaskId);
      
      var config = {
        onUploadProgress: function(progressEvent) {
          var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
          vu_this.uploadProgress = "Uploading Files... " + percentCompleted + "%";
        }
      }

      this.isUploading = true
      api.post('/api/v1/books', this.formData, config).then(function(response){
        if (response.status===200) {
          // hide modal after one second
          vu_this.uploadProgress = "Upload Successful"
          if (vu_this.userTaskIdLocal && response.data instanceof Array && response.data[0] && response.data[0].ok == true) {
            axios.put(API_URL + 'task/' + vu_this.userTaskIdLocal + '/link_book', {})
              .then((link_response) => {
                setTimeout(function(){ vu_this.$emit('close_modal', response) }, 1000)
              })
              .catch((err) => {
                setTimeout(function(){ vu_this.$emit('close_modal', response) }, 1000)
              })
          } else {
            setTimeout(function(){ vu_this.$emit('close_modal', response) }, 1000)
          }
        } else {
          // not sure what we should be doing here
          vu_this.formReset()
        }
      }).catch((err) => {
        console.log(err)
        vu_this.bookUploadError = err.response.data.message
        vu_this.formReset()
        setTimeout(function(){ vu_this.$emit('close_modal') }, 3000)
      });

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
    }
  },
}
</script>


<style scoped>

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

.book-logo {
  width:50px;
  height:50px;
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


#uploadingMsg {text-align: center; padding-bottom: 1em;}
#uploadingMsg h2 i {font-size: 24pt; color: silver}

button.close i.fa {font-size: 18pt; padding-right: .5em;}


</style>
