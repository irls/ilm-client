<template>
  <transition name="modal">
    <div class="modal-mask" @click="$emit('close_modal')">
      <div class="modal-wrapper">
        <div class="modal-container" @click="$event.stopPropagation()">

          <div class="modal-header">
            <div class="header-title">
              <img src='/static/bookstack.svg' class='book-logo'> <h3 class="header-h">Re-Import Book</h3>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close_modal')">
                <i class="fa fa-times-circle-o" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="modal-body clearfix">

            <div class="col-sm-12">
              <!--<div class="col-sm-5">
                <div class="form-group">
                  <label for="booktype">Book Type:</label>

                  <select :class="['form-control', {'alert alert-warning': errors.bookType}]" id="booktype" v-model="bookType" @change="validate">
                    <option v-for='(type, index) in bookTypes' v-bind:value="index">{{type}}</option>
                  </select>
                  <span v-if="errors.bookType" class="alert alert-warning">{{errors.bookType}}</span>

                </div>
              </div>-->
              <!-- <div class="col-sm-7">
                <div class="input-group">
                  <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                  <input type="text" class="form-control" placeholder="URL" v-model="bookURL"/>
                </div>
              </div> -->
              <div class="col-sm-12">
                <!-- or &nbsp;&nbsp;&nbsp; -->
                <label class='btn btn-default' type="file">
                  <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;

                  <input name="bookFiles" type="file" v-show="false" accept="text/*,application/zip,.docx,.md" multiple="false" @change="onFilesChange($event)">

                </label>
                <span class="help-block">Book file or ZIP with files and images, Docx or Markdown with text</span>
              </div>

            </div>

            <div class="col-sm-12">
            <div v-if="uploadFile" class="col-sm-12">
              {{ uploadFile.name }} - {{ humanFileSize(uploadFile.size, true) }}
            </div>
            </div>

            <div class="col-sm-12 pull-right">
              <button class="btn btn-primary modal-default-button" @click='onFormSubmit' :class="{disabled : saveDisabled}">
                <i class="fa fa-plus" aria-hidden="true"></i> &nbsp;  Import Book
              </button>
            </div>

            <div id='uploadingMsg' v-show='isUploading' class="col-sm-12">
              <h2> {{uploadProgress}}   &nbsp; <i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i> </h2>
            </div>

          </div>
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
          import api_config from '../../mixins/api_config.js'

          const API_URL = process.env.ILM_API + '/api/v1/'

  export default {
    data() {
      return {
        isUploading: false,
        bookType: '',
        bookTypes: {
          gutenberg_html: 'Gutenberg HTML',
          ilm_ocean_html: 'ILM/Ocean HTML',
          gutenberg_zip: 'Gutenberg ZIP',
          ilm_zip: 'ILM ZIP'
        },
        uploadFile: false,
        formData: new FormData(),
        uploadProgress: "Uploading Files...",
        bookUploadError: false,
        fileValue: '',
        errors: {}
      }
    },
    mixins: [api_config],
    props: {
      bookId: {
        type: String,
        default: false
      }
    },
    components: {
      alert
    },
    mounted() {

    },
    computed: {
      selectedBookType: function () {
        return this.bookTypes[this.bookType];
      },
      saveDisabled: function () {
        //return (!this.bookURL && !this. bookFile);
        //console.log(this.uploadFiles.bookFiles, this.bookURL.length)

        return (this.uploadFile == false)
      }
    },
    methods: {
      formReset() {
        this.isUploading = false
        // clear formData
        let entries = this.formData.entries()
        for (let pair of entries)
          this.formData.delete(pair[0])
        //document.getElementById('bookFiles').value = null
        this.uploadFile = false;
      },
      onFilesChange(e) {
        let fileList = e.target.files || e.dataTransfer.files
        this.formData = new FormData();
        this.formData.append('book', fileList[0], fileList[0].name);
        this.uploadFile = fileList[0];
      },

      onFormSubmit() {
        this.validate();
        if (Object.keys(this.errors).length > 0) {
          return false;
        }
        let vu_this = this
        let api = this.$store.state.auth.getHttp()

        this.formData.append('type', this.bookType);

        var config = {
          onUploadProgress: function (progressEvent) {
            var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            vu_this.uploadProgress = "Uploading Files... " + percentCompleted + "%";
          }
        }

        this.isUploading = true
        api.post(this.API_URL + 'books/' + this.bookId + '/reimport', this.formData, config).then(function (response) {
          if (response.status === 200) {
            // hide modal after one second
            vu_this.uploadProgress = "Upload Successful"
            vu_this.$root.$emit('book-reimported');
            vu_this.closeForm(true)
          } else {
            // not sure what we should be doing here
            vu_this.formReset()
          }
        }).catch((err) => {
          console.log(err)
          vu_this.bookUploadError = err.response.data.message
          vu_this.formReset()
          setTimeout(function () {
            vu_this.$emit('close_modal')
          }, 3000)
        });

      },
      humanFileSize(bytes, si) {
        var thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
          return bytes + ' B';
        }
        var units = si
                ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
                : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        var u = -1;
        do {
          bytes /= thresh;
          ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
      },
      closeForm(response) {
        let self = this
        setTimeout(function () {
          self.formReset()
          self.$emit('close_modal', response)
        }, 1000)
      },
      validate() {
        //if (this.bookType === '') {
        //  this.errors['bookType'] = 'Required';
        //} else {
          this.errors['bookType'] = false;
          delete this.errors['bookType'];
        //}
      }
    },
    watch: {

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

  .book-import-list { list-style-type: none; }
  .book-import-list i { padding: 0px 5px 0px 0px; }


</style>

