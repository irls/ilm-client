<template>
  <transition name="modal">
    <div class="modal-mask" v-if="isModal" ><!--@click="$emit('close_modal')"-->
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

            <form id="book_select" v-show="!isUploading" enctype="multipart/form-data" @submit.prevent ref="book_select">

              <!--<h4> Book Text </h4>-->
                <div class="row">
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

                      <input name="bookFiles" type="file" v-show="false" accept="text/*,application/zip,.docx,.txt,.md" :multiple="multiple"
                      @change="onFilesChange($event)">

                    </label>
                  </div>
                </div><!--<div class="row">-->

                <div class="row">
                  <div class="col-sm-12" v-show='!hasUploadError'>
                    <span class="help-block">Book file or ZIP with files and images, Docx or Markdown with text</span>
                  </div>
                  <div class="col-sm-12" v-show='hasUploadError'>
                    <div class="alert alert-danger">
                      <button type="button" class="close" @click="closeAlert"><span>×</span></button>
                      <i aria-hidden="true" class="fa fa-exclamation-triangle alert-icon-float-left"></i>
                      <div class="alert-text-float-right" v-if="bookUploadCommonError">
                        <p>{{bookUploadCommonError}}.</p>
                      </div>
                      <div class="alert-text-float-right" v-if="bookUploadCheckError">
                        <p v-for='(errMsg) in bookUploadCheckError' v-html="errMsg+'.'"></p>
                      </div>
                      <div class="clearfix"></div>
                    </div>
                  </div>
                </div><!--<div class="row">-->

                <!--<div class="col-sm-12">
                  <div class="col-sm-6">
                    <div class="form-group">
                      <label for="booktype">Book Type:</label>

                      <select class="form-control" id="booktype" v-model="bookType">
                        <option v-for='(type, index) in bookTypes' v-bind:value="index">{{type}}</option>
                      </select>

                    </div>
                  </div>
                </div>
                <br><br><br><br>-->

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

                <div class="row" v-if="importTaskId">
                  <div class="col-sm-8">
                    <ul id="selectedBooks">
                      <li v-for="book in selectedBooks">
                        {{ book.name }} - {{ humanFileSize(book.size, true) }}
                      </li>
                    </ul>
                  </div>
                  <div class="col-sm-4">
                    <button class="btn btn-primary modal-default-button" @click.prevent='onFormSubmit' :class="{disabled : saveDisabled}" :disabled="saveDisabled">
                      <i class="fa fa-plus" aria-hidden="true"></i>&nbsp;Import Book
                    </button>
                  </div>
                </div><!--<div class="row">-->
                <div class="row" v-else>
                  <div class="col-sm-12">
                    <span v-if="!importTaskId" class="label label-danger">Book should be imported from task. You have no import book task assigned</span>
                  </div>
                </div>
            </form>

            <div id='uploadingMsg' v-show='isUploading'>
               <h2> {{uploadProgress}}   &nbsp; <i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i> </h2>
            </div>

          </div>
        </div>
      </div>
    </div>


    <div v-else > <!--v-if="isModal"-->
      <div v-show="!isUploading">
      <form id="book_select" enctype="multipart/form-data" @submit.prevent ref="book_select">
        <div class="row">
          <div class="col-sm-8 help-block">
            <span v-show="!hasUploadError">Book file or ZIP with files and images, Docx, txt or Markdown with text</span>

            <div v-show='hasUploadError'>
              <div class="alert alert-danger">
                <button type="button" class="close" @click="closeAlert"><span>×</span></button>
                <i aria-hidden="true" class="fa fa-exclamation-triangle alert-icon-float-left"></i>
                <div class="alert-text-float-right" v-if="bookUploadCommonError">
                  <p>{{bookUploadCommonError}}.</p>
                </div>
                <div class="alert-text-float-right" v-if="bookUploadCheckError.length>0">
                  <p v-for='(errMsg) in bookUploadCheckError' v-html="errMsg+'.'"></p>
                </div>
                <div class="clearfix"></div>
              </div>
            </div>

          </div>
          <div class="col-sm-4">
            <label class='btn btn-default' type="file">
              <i class="fa fa-folder-open-o" aria-hidden="true"></i>&nbsp;&nbsp;Browse&hellip;

              <input name="bookFiles" type="file" v-show="false"
                accept="text/*,application/zip,.txt,.docx,.md"
                :multiple="multiple"
                @change="onFilesChange($event)">

            </label>

            <ul id="dummyBooks" v-if="selectedBooks.length==0">
              <li class="book-import-list">
                <input type="checkbox" id="dummyBooksCheck" v-model="isDummyBook">
                <label for="dummyBooksCheck">Create blank book template</label>
              </li>
            </ul>

            <ul id="selectedBooks">
              <li class="book-import-list" v-for="book in selectedBooks">
                <i class="fa fa-remove" v-on:click="formReset(true)"></i>{{ book.name }} - {{ humanFileSize(book.size, true) }}
              </li>
            </ul>

          </div>
        </div>
        <div class="row"></div>
      </form>
      </div>
      <div id='uploadingMsg' v-show='isUploading'>
        <h2> {{uploadProgress}}   &nbsp; <i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i> </h2>
      </div>
    </div>
  </transition>
</template>


<script>

import { mapActions } from 'vuex';

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
        bookUploadCommonError: false,
        bookUploadCheckError: [],
        selectedBooks: [],
        fileValue: '',
        isDummyBook: true,
        errorsMsgKeys: {
          duplicates: '<b>Found duplicates</b>',
          wrongVals: '<b>Found wrong id\'s</b>'
        }
    }
  },
  props: {
      'multiple': {
        type: Boolean,
        default: true
      },
      'importTaskId': {
        type: String,
        default: null
      },
      'isModal': {
        type: Boolean,
        default: true
      },
      'forceUpload': {
        type: Boolean,
        default: false
      },
      'bookId': {
        type: String,
        default: null
      }
  },
  components: {
    alert
  },
  mounted() {

  },
  computed: {
    hasUploadError: function() {
      return this.bookUploadCheckError.length > 0 || this.bookUploadCommonError;
    },
    selectedBookType: function() {
      return this.bookTypes[this.bookType];
    },
    saveDisabled: function() {
      return (this.uploadFiles.bookFiles==0 && this.bookURL.length==0)
    }
  },
  methods: {
    formReset(sucess = false){
      this.isUploading = false;
      this.closeAlert();
      if (sucess || this.isModal) {
        this.bookURL= ''
        this.audioURL= ''
        // clear formData
        let entries = this.formData.entries()
        for(let pair of entries) this.formData.delete(pair[0])
        //document.getElementById('bookFiles').value = null
        this.uploadFiles = {bookFiles: 0, audioFiles: 0}
        this.selectedBooks = [];
        if (this.$refs && this.$refs.book_select) {
          this.$refs.book_select.reset();
        }
        this.$emit('books_changed', this.selectedBooks)
      }
    },
    closeAlert() {
      this.bookUploadCommonError = false;
      this.bookUploadCheckError = [];
    },
    onFilesChange(e) {
      this.closeAlert();
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
      this.$emit('books_changed', this.selectedBooks)
    },

    onFormSubmit() {
      this.closeAlert();
      if (/*this.isModal && */this.selectedBooks.length == 0) {// called on Job creation and no file was selected
        //this.$emit('close_modal', false)
        return false;
      }
      
      this.formData.append('bookType', this.bookTypes[this.bookType]);
      if (!this.uploadFiles.bookFiles && this.bookURL.length) this.formData.append('bookURL', this.bookURL);
      if (!this.uploadFiles.audioFiles && this.audioURL.length) this.formData.append('audioURL', this.audioURL);
      this.formData.append('taskId', this.importTaskId);
      this.formData.append('bookId', this.bookId);

      var config = {
        onUploadProgress: (progressEvent) => {
          var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
          this.uploadProgress = "Uploading Files... " + percentCompleted + "%";
        }
      }
      this.isUploading = true
      return this.uploadBook([this.formData, config])
      .then((response) => {
        // hide modal after one second
        this.uploadProgress = "Upload Successful"
        if (this.isModal) {
          this.closeForm(true);
        } else {
          this.formReset(true);
        }
        return Promise.resolve({ok: true});
      }).catch((err) => {
        //console.log('importBook Err:', err);
        this.formReset();
        if (err.response.data.message && err.response.data.message.length) {
          this.bookUploadCommonError = err.response.data.message;
          this.$emit('upload_error', err.response.data.message);
          if (this.isModal) setTimeout(function () {
            this.$emit('close_modal')
          }, 5000)
        } else if (Array.isArray(err.response.data)) {
          this.bookUploadCheckError = [];
          err.response.data.forEach((msg)=>{
            if (typeof msg.error == 'object') {
              for (var prop in msg.error) {
                if (Array.isArray(msg.error[prop]) && msg.error[prop].length) {
                  this.bookUploadCheckError.push(`${this.errorsMsgKeys[prop] ? this.errorsMsgKeys[prop] : prop}: ${(JSON.stringify(msg.error[prop])).split(',').join(', ').replace(/(^\[|\]$)/g, '')}`)
                }
              }
            } else {
              this.bookUploadCheckError.push(`Error: ${msg.error}`);
            }
          })
          this.bookUploadCheckError.reverse();
          //this.$emit('upload_error', bookUploadCheckError);
        }
        return Promise.reject(err);
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
    },
    closeForm(response) {
      let self = this
      setTimeout(function(){
        self.formReset()
        self.$emit('close_modal', response)
      }, 1000)
    },
    ...mapActions(['uploadBook'])
  },
  watch: {
//     forceUpload(val) {
//       if (val === true) {
//         this.onFormSubmit()
//       }
//     }
  }
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
  width: 518px;
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

.book-import-list { list-style-type: none; }
.book-import-list i { padding: 0px 5px 0px 0px; }

  .help-block {
    margin-top: 18px;
    margin-bottom: 18px;
  }

  .alert-danger {
    margin-top: 18px;
  }

  .alert-icon-float-left {
    font-size: 40px;
    float: left;
    color: #a94442;
  }

  .alert .alert-icon-float-left {
    padding-right: 12px;
  }

  .alert .alert-text-float-right {
    text-align: left;
  }

  .alert .alert-text-float-right p {
    text-align: left;
    margin: 3px 0;
    word-break: break-word;
  }

  .alert.top .alert-text-float-right {
    float: right;
    text-align: left;
    width: 400px;
  }

  .alert.top .alert-text-float-right p {
    text-align: left;
    margin: 5px 0;
    word-break: break-word;
  }

  .modal-footer .non-modal-form .alert{

  }

  .modal-footer .non-modal-form .help-block {
    text-align: left;
    margin: 0; padding: 0;
  }

  .modal-footer .non-modal-form #selectedBooks,
  .modal-footer .non-modal-form #dummyBooks {
    margin-top: 10px;
    padding-left: 16px;
    float: left;
    width: 177%;
    text-align: left;
  }
</style>
