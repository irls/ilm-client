<template>
  <div class="audio-import-modal">
    <div class="modal-header">
      <div>
        <h4 class="modal-title">{{importTitle}}</h4>
      </div>
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close')" v-if="!isUploading || uploadErrors.length || audiobookReport">
      <i class="close-modal" aria-hidden="true"></i>
      </button>
    </div>
    <div class="modal-body">
      <form id="audio_select" v-show="!isUploading" enctype="multipart/form-data" @submit.prevent>
        <div class="clearfix">
          <div class="col-sm-12">
            <h5>
              <template v-if="type === 'import'">
                Browse for audio files or type a playlist URL
              </template>
              <template v-if="type === 'replace'">
                Browse for FLAC audiofiles
              </template>
              <template v-if="type === 'parse_replace'">
                Browse for a ZIP with WAV file and JSON audio map
              </template>
            </h5>
          </div>
          <div class="col-sm-12 upload-files">
            <div class="col-sm-3">
              <dropzone id="audio-dropzone" ref="uploadDropzone" 
                :options="dropzoneOptions" 
                @vdropzone-file-added="onAudioFileChange"
                @vdropzone-total-upload-progress="onUploadProgress"
                @vdropzone-success="onUploadSuccess"
                @vdropzone-complete="onUploadComplete"
                @vdropzone-error="onUploadError"
                @vdropzone-queue-complete="onUploadFinished">
                Browse
              </dropzone>
            </div>
            <template v-if="type === 'import'">
              <div class="col-sm-9">
                <div class="input-group">
                  <input type="text" class="form-control playlist-url" placeholder="Playlist URL" v-model="audioURL" />
                </div>
              </div>
            </template>
            <span v-if="$refs.upload">
            {{$refs.upload.uploaded}}
            </span>
          </div>
          <div class="col-sm-12">
            <ul class="audiofiles-list">
              <li v-for="file in audioFiles">
                {{ file.name }} - {{ humanFileSize(file.size, true) }}
              </li>
           </ul>
          </div>
          <div class="audio-import-quality">
            <div class="audio-import-quality-item">
              Audio quality
            </div>
            <div class="audio-import-quality-item">
              <label>
                <input type="radio" name="audio-quality" v-model="audioImportQuality" value="raw" />
                <div class="audio-quality -raw">Raw</div>
              </label>
            </div>
            <div class="audio-import-quality-item">
              <label>
                <input type="radio" name="audio-quality" v-model="audioImportQuality" value="improved" />
                <div class="audio-quality -improved">Improved</div>
              </label>
            </div>
            <div class="audio-import-quality-item">
              <label>
                <input type="radio" name="audio-quality" v-model="audioImportQuality" value="mastered" />
                <div class="audio-quality -mastered">Mastered</div></label>
            </div>
          </div>
          <div class="col-sm-12">
          </div>
        </div>
      </form>
      <div id='uploadingMsg' v-show='isUploading'>
        <template v-if="!audiobookReport && !uploadErrors.length">
         <h2>{{uploadProgress}}&nbsp;<i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i></h2>
         <ul class="audiofiles-list">
            <li v-for="file in audioFiles">
              {{ file.name }} - {{ file.progress ? file.progress : 0 }}%
            </li>
         </ul>
        </template>
        <template v-else>
          <div v-html="audiobookReport"></div>
          <template v-if="uploadFinished">
            <div class="copy-report" v-if="allowCopyReport">
              <textarea class="copy-report-content" ref="copy-report-content" ></textarea>
              <button class="btn btn-primary" v-if="allowCopyReport" v-on:click="copyReport">Copy Report</button>
            </div>
            <div v-html="reportFooter" class="copy-report" v-if="reportFooter.length"></div>
          </template>
        </template>
        <div v-for="err in uploadErrors" class="upload-error">{{err.error}}</div>
      </div>
    </div>
    <div class="modal-footer">
      <template v-if="(audiobookReport && uploadFinished) || uploadErrors.length">
        <button class="btn btn-default" v-on:click="uploadOk()">Ok, got it</button>
      </template>
      <template v-else-if="!isUploading">
        <button class="btn btn-primary modal-default-button" @click="onFormSubmit" :class="{disabled : saveDisabled}">Import</button>
        <button class="btn btn-default modal-default-button" @click="$emit('close')">Cancel</button>
      </template>
    </div>
    <modal name="duplicate-files-warning" :resizeable="false" :clickToClose="false" height="auto">
        <div class="modal-header"></div>
        <div class="modal-body">
          <div v-if="uploadFilesDuplicates[0]">
            {{uploadFilesDuplicates[0].name}} already exists. Do you want to replace it?
          </div>
        </div>
        <!-- custom buttons -->
        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="cancelDuplicateAudio()">Cancel</button>
          <button type="button" class="btn btn-confirm" @click="replaceDuplicateAudio()">Replace</button>
        </div>
    </modal>
  </div>

</template>


<script>
import Vue from 'vue'
import api_config from '../../mixins/api_config.js'
import time_methods from '../../mixins/time_methods'
import {dateFormat} from '../../filters';
import v_modal from 'vue-js-modal';
import dropzone from 'vue2-dropzone';
import {mapGetters, mapActions} from 'vuex';
import { BookBlock }     from '../../store/bookBlock'
Vue.use(v_modal, { dialog: true, dynamic: true });

export default {
  data() {
    return {
      isUploading: false,
      uploadFiles: 0,
      uploadProgress: "Uploading Files...",
      audioURL: '',
      audioFiles: [],
      autoAlign: false,

      file_name_book : '',
      file_name_audio : '',
      flag_book_browse : false,
      flag_audio_browse : false,
      type_book : '',
      auth: this.$store.state.auth,
      uploadFinished: false,
      formData: new FormData(),
      uploadFilesDuplicates: [],
      confirmedDuplicates: [],
      uploadErrors: [],
      dropzoneOptionsCommon: {
        url: this.API_URL + 'books/' + this.book.bookid + '/audiobooks/chunk', 
        chunking: true, 
        chunkSize: 1024 * 1024, 
        autoProcessQueue: false, 
        createImageThumbnails: false, 
        headers: {'Authorization': 'Bearer ' + this.$store.getters.auth.getSession().token + ':' + this.$store.getters.auth.getSession().password}, 
        dictDefaultMessage: '<label class="btn btn-default" for="start-file-choose"><i class="fa fa-folder-open-o" aria-hidden=\"true\" id=\"start-file-choose\"></i>&nbsp;Browse&hellip;</label>',
        forceChunking: true,
        maxFilesize: 1024 * 1024 * 10
      },
      choosingFile: false,
      audioImportType: "copy",
      audioImportQuality: "raw",
      uploadUrl: '',
      acceptFiles: null,
    }
  },
  beforeMount: function() {
    this.uploadUrl = this.API_URL + 'books/' + this.book.bookid + '/audiobooks/chunk';
    switch (this.type) {
      case 'import':
        this.acceptFiles = 'audio/*';
        break;
      case 'replace':
        this.audioImportType = 'replace';
        this.acceptFiles = 'audio/flac';
        break;
      case 'parse_replace':
        this.audioImportType = 'parse_replace';
        this.acceptFiles = 'zip,application/octet-stream,application/zip,application/x-zip,application/x-zip-compressed';
        break;
    }
  },
  mounted: function () {
    this.dropzoneOptionsCommon.url = this.uploadUrl;
    this.dropzoneOptionsCommon.headers = {'Authorization': 'Bearer ' + this.$store.getters.auth.getSession().token + ':' + this.$store.getters.auth.getSession().password};
    this.checkMultipleFileInput();
  },
  components: {
    Vue, dropzone
  },
  mixins: [api_config, time_methods],
  props: {
    'book': {
      type: Object,
      default: {}
    },
    'multiple': {
      type: Boolean,
      default: true
    },
    'allowDownload': {
      type: Boolean,
      default: true
    },
    'type': {
      type: String,
      default: 'import'
    },
    'uploadInfo': {
      type: Object,
      default: {}
    }
  },
  computed: {
    currentBook: function () {
      return this.$store.getters.currentBook
    },
    saveDisabled: function() {
      return (this.uploadFiles === 0 && this.audioURL.length == 0)
    },
    audiobookReport: {
      get() {
        if (this.audiobook.report) {
          if (this.uploadFinished) {
            let report = this.getParsedReport();
            if (report instanceof Object) {
              let reportHtml = '<ul class="import-audio-report">';
              if (report.replaced && Array.isArray(report.replaced.files) && report.replaced.files.length > 0) {
                reportHtml+= `<li>${report.replaced.files.length} audio file(s) replaced on the matching blocks. No follow-up required</li>`;
              }
              if (report.aligned && Array.isArray(report.aligned.files) && report.aligned.files.length > 0) {
                reportHtml+= `<li>${report.aligned.files.length} audio file(s) realigned with the matching blocks. Word alignment need to be verified<ul class="audiofiles-list">`;
                report.aligned.files.forEach(filename => {
                  reportHtml+= `<li>${filename}</li>`;
                })
                reportHtml+= `</ul></li>`;
              }
              if (report.not_matched && Array.isArray(report.not_matched.files) && report.not_matched.files.length > 0) {
                reportHtml+= `<li>${report.not_matched.files.length} audio file(s) could not be replaced because no matching blocks found<ul class="audiofiles-list">`;
                report.not_matched.files.forEach(filename => {
                  reportHtml+= `<li>${filename}</li>`;
                });
                reportHtml+= `</ul></li>`;
              }
              if (report.not_replaced && Array.isArray(report.not_replaced.files) && report.not_replaced.files.length > 0) {
                reportHtml+= `<li>${report.not_replaced.files.length} audio file(s) could not be replaced because of pending tasks<ul class="audiofiles-list">`;
                report.not_replaced.files.forEach(filename => {
                  reportHtml+= `<li>${filename}</li>`;
                });
                reportHtml+= `</ul></li>`;
              }
              if (report.copied) {
                reportHtml+= `<li>${report.copied} audio file(s) copied to the catalog and will be available shortly after processing</li>`;
              }
              let hasDuplicates = report.duplicates && Array.isArray(report.duplicates.files) && report.duplicates.files.length > 0;
              let hasSkipped = report.skipped && Array.isArray(report.skipped.files) && report.skipped.files.length > 0;
              if (hasDuplicates) {
                reportHtml+= `<li>${report.duplicates.files.length} duplicate audio file(s) replaced with:<ul class="audiofiles-list">`;
                report.duplicates.files.forEach(filename => {
                  reportHtml+= `<li>${filename}</li>`;
                });
                reportHtml+= `</ul></li>`;
              }
              if (hasSkipped) {
                reportHtml+= `<li>${report.skipped.files.length} duplicate audio file(s) rejected<ul class="audiofiles-list">`;
                report.skipped.files.forEach(af => {
                  reportHtml+= `<li>${af}</li>`;
                });
                reportHtml+= `</ul></li>`;
              }
              if (Array.isArray(report.errors_parse_replace) && report.errors_parse_replace.length > 0) {
                reportHtml+= `<li>Audio can’t be parsed. WAV audio file, specified in the JSON audio map is not found in:<ul class="audiofiles-list">`;
                report.errors_parse_replace.forEach(err => {
                  reportHtml+= `<li>${err.dir}</li>`;
                });
                reportHtml+= `</ul></li>`;
              }
              reportHtml+='</ul>';
              if (report.copied && !hasDuplicates && !hasSkipped) {
                reportHtml = reportHtml.replace(/<\/?(ul|li)[^>]*>/img, '');
              }
              return reportHtml;
            }
          } else {
            return '';
          }
        }
        return this.audiobook.report;
      },
      cache: false
    },
    allowCopyReport: {
      get() {
        if (this.audiobook.report && this.uploadFinished && this.audiobook.report.length > 0) {
          let report = this.getParsedReport();
          if (report instanceof Object) {
            let hasReport = false;
            let checkReport = ['aligned', 'not_replaced', 'not_matched', 'duplicates', 'skipped'];
            checkReport.forEach(key => {
              if (!hasReport && report[key] && Array.isArray(report[key].files) && report[key].files.length > 0) {
                hasReport = true;
              }
            });
            if (Array.isArray(report.errors_parse_replace) && report.errors_parse_replace.length > 0) {
              hasReport = true;
            }
            return hasReport;
          }
          return false;
        }
        return false;
      },
      cache: false
    },
    reportFooter: {
      get() {
        return "";
      },
      cache: false
    },
    importTitle: {
      get() {
        if (this.audiobookReport) {
          return 'Import Audio Report';
        }
        switch (this.type) {
          case 'import':
            return 'Import audio';
            break;
          case 'replace':
            return 'Replace audio';
            break;
          case 'parse_replace':
            return 'Parse & Replace audio';
            break;
        }
        return '';
      },
      cache: false
    },
    dropzoneOptions: {
      get() {
        let options = {
          url: this.uploadUrl, 
          acceptedFiles: this.acceptFiles,
        };
        let browseButtonLabel = '';
        switch (this.type) {
          case 'import':
            browseButtonLabel = `Browse audio`;
            break;
          case 'replace':
            browseButtonLabel = `Browse FLAC`;
            break;
          case 'parse_replace':
            browseButtonLabel = `Browse ZIP`;
            //options.maxFiles = 1;
            break;
        }
        options.dictDefaultMessage = `<button class="btn btn-default browse-audio">${browseButtonLabel}</button>`;
        return Object.assign(this.dropzoneOptionsCommon, options);
      }
    },
    ...mapGetters({
      audiobook: 'currentAudiobook',
      aligningBlocks: 'aligningBlocks'
    })
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

    onAudioFileChange (file) {
      //console.log(arguments);
      //return;
      //let fieldName = e.target.name
      let fileList = [file];//e.target.files || e.dataTransfer.files//e.file
      for(let file of fileList) {
        let allow = true;
        if (!file.type) {
          allow = false;
        }
        if (this.type === 'parse_replace') {
          allow = file.type.toLowerCase().indexOf('zip') !== -1;
        } else {
          switch (this.acceptFiles) {
            case 'audio/*':
              if (!/^audio\/.*$/.test(file.type.toLowerCase())) {
                allow = false;
              }
              break;
            case 'audio/flac':
              if (file.type.toLowerCase() !== this.acceptFiles) {
                allow = false;
              }
              break;
            case 'application/zip':
              break;
          }
        }
        if (allow && !this.multiple) {
          let addedFiles = this.$refs.uploadDropzone.getAddedFiles();
          if (addedFiles && addedFiles.length > 1) {
            for (let i = 0; i < addedFiles.length - 2; ++i) {
              this.$refs.uploadDropzone.removeFile(addedFiles[i]);
            }
          }
          this.audioFiles = [];
          this.formData = new FormData();
          this.uploadFiles = 0;
        }
        if (allow) {
          this.addFileToUpload(file);
          this.checkMultipleFileInput();
        }
      }
    },
    addFileToUpload(file) {
      this.audioFiles.push({name: file.name, size: file.size, uuid:file.upload.uuid});
      this.formData.append('audio_import', file, file.name);
      this.uploadFiles++
    },

    onFormSubmit () {
      if (this.saveDisabled) {
        return '';
      }
      let addedFiles = this.$refs.uploadDropzone.getQueuedFiles();
      if (addedFiles && addedFiles.length > 0) {
        addedFiles.forEach(file => {
          if (file.size === 0) {
            this.$refs.uploadDropzone.removeFile(file);
          }
        });
      }
      this.audiobook.report = "";
      this.uploadFinished = false;
      this.isUploading = true;
      if (this.$refs.uploadDropzone.getQueuedFiles().length === 0 && !this.audioURL) {
        this.closeForm();
        return;
      }
      this.$store.commit('set_updateAudiobookProgress', true);
      if (this.audioFiles.length === 0 && this.audioURL) {
        this.onUploadFinished();
      } else {
        this.$refs.uploadDropzone.processQueue();
      }

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
      let file = this.uploadFilesDuplicates.shift();
      //console.log(file, this.$refs.uploadDropzone.getQueuedFiles(), this.$refs.uploadDropzone)
      this.$refs.uploadDropzone.removeFile(file);
      //console.log(this.$refs.uploadDropzone.getQueuedFiles());
    },
    replaceDuplicateAudio() {
      this.addFileToUpload(this.uploadFilesDuplicates.shift());
    },
    showModal(name) {
      this.$modal.show(name);
    },
    hideModal(name) {
      this.$modal.hide(name);
    },
    onUploadProgress() {
      //console.log(arguments)
      let total = 0;
      //console.log('get uploading files', this.$refs.uploadDropzone.getUploadingFiles());
      let uploadingFiles = this.$refs.uploadDropzone.getUploadingFiles();// files still uploading
      uploadingFiles.forEach(f => {
        let processed = 0;
        f.upload.chunks.forEach(c => {
          if (c.status === 'success') {
            processed++;
          }
        });
        processed = Math.round(processed * 100 / f.upload.totalChunkCount);
        //console.log(f.name + ' ' + f.upload.progress, f.status, processed, f);
        //console.log('before debug: ', this.audioFiles, f.upload.uuid);
        
        //let af = this.audioFiles.find(_af => _af.name === f.name);
        let af = this.audioFiles.find(af => af.uuid === f.upload.uuid);

        if (af) {
          af.progress = processed;
          af.uuid = f.upload.uuid;
          total+= processed;
        } else {
          
        }
      });
      if (uploadingFiles.length > 0) {// add 100% for each uploaded file
        this.audioFiles.forEach(af => {
          if (af.progress === 100) {
            total+=100;
          }
        });
      }
      let allProgress = Math.round(total / this.audioFiles.length);
      if (allProgress > 100) {// more than 100 means justn now uploaded in uploadingFiles
        allProgress = 100;
      }
      this.uploadProgress = allProgress + '%';
    },
    onUploadFinished() {
      //console.log(arguments)
      //this.uploadFinished = true;
      //this.isUploading = false;
      let toUpload = {
        files: []
      };
      this.audioFiles.forEach(af => {
        if (af.ready === true) {
          //console.log('af ready!!!', af);
          toUpload.files.push(af);
        }
      });
      if (this.audioURL.length) toUpload.url = this.audioURL;
      toUpload.audioImportType = this.audioImportType;
      toUpload.audioImportQuality = this.audioImportQuality;
      
      let uploadPromise;
      
      if (toUpload.files.length === 0 && !toUpload.url) {
        return Promise.resolve();
      }
      this.uploadProgress = '100%';// force set all to ready
      this.audioFiles.forEach(af => {
        af.progress = '100';
      });
      
      if (this.type === 'parse_replace') {
        uploadPromise = this.parseReplaceAudio([toUpload]);
      } else {
        uploadPromise = this.updateAudiobook([this.audiobook.id ? this.audiobook.id : null, toUpload, this.book ? this.book.bookid : null]);
      }

      //this.isUploading = true
      return uploadPromise
        .then(response => {
          if (response.status===200) {
            this.uploadFinished = true
            this.uploadErrors = [];
            if (response.data.audio && typeof response.data.audio._id !== 'undefined') {
              this.uploadProgress = response.data.newFilesCount + " Audiofiles processing"
            }
            if (response.data.errors) {
              if (Array.isArray(response.data.errors)) {
                this.uploadProgress = '';
                this.uploadErrors = response.data.errors;
              }
            }
          } else {
            // not sure what we should be doing here
            this.formReset()
          }
        })
        .catch(err => {
          this.formReset();
          setTimeout(() => { this.$emit('close') }, 1000);
        });
    },
    onUploadSuccess() {
    },
    onUploadComplete(file) {
      let f = this.audioFiles.find(af => af.uuid === file.upload.uuid);
      if (f) {
        //console.log('inside:', f.uuid, file.upload.uuid);
        f.ready = file.status === 'success';
        f.progress = 100;
      }
    },
    onUploadError(file, error, xhr) {
      console.log('upload error');
      console.log(arguments);
      //file.status = 'added';
      //this.$refs.uploadDropzone.removeAllFiles(true);
      //this.$refs.uploadDropzone.manuallyAddFile(file, '');
      this.checkMultipleFileInput();
    },
    copyReport() {
      let content = 'Import Audio Report\n\n' + this.convertTime(new Date(), true) + '\n\n';
      let el = this.$refs['copy-report-content'];
      let report = this.getParsedReport();
      if (report instanceof Object) {
        let reportHtml = '';
        if (report.replaced && Array.isArray(report.replaced.files) && report.replaced.files.length > 0) {
          reportHtml+= `${report.replaced.files.length} audio file(s) replaced on the matching blocks. No follow-up required` + '\n\n';
        }
        if (report.aligned && Array.isArray(report.aligned.files) && report.aligned.files.length > 0) {
          reportHtml+= `${report.aligned.files.length} audio file(s) realigned with the matching blocks. Word alignment need to be verified\n`;
          report.aligned.files.forEach(filename => {
            reportHtml+= ` - ${filename}\n`;
          })
          reportHtml+= `\n`;
        }
        if (report.not_matched && Array.isArray(report.not_matched.files) && report.not_matched.files.length > 0) {
          reportHtml+= `${report.not_matched.files.length} audio file(s) could not be replaced because no matching blocks found\n`;
          report.not_matched.files.forEach(filename => {
            reportHtml+= ` - ${filename}\n`;
          })
          reportHtml+= `\n`;
        }
        if (report.not_replaced && Array.isArray(report.not_replaced.files) && report.not_replaced.files.length > 0) {
          reportHtml+= `${report.not_replaced.files.length} audio file(s) could not be replaced because of pending tasks\n`;
          report.not_replaced.files.forEach(filename => {
            reportHtml+= ` - ${filename}\n`;
          });
          reportHtml+= `\n`;
        }
        if (report.copied) {
          reportHtml+= `${report.copied} audio file(s) copied to the catalog and will be available shortly after processing\n\n`;
        }
        let hasDuplicates = report.duplicates && Array.isArray(report.duplicates.files) && report.duplicates.files.length > 0;
        if (hasDuplicates) {
          reportHtml+= `${report.duplicates.files.length} duplicate audio file(s) replaced with:\n`;
          report.duplicates.files.forEach(filename => {
            reportHtml+= ` - ${filename}\n`;
          });
          reportHtml+= `\n`;
        }
        let hasSkipped = report.skipped && Array.isArray(report.skipped.files) && report.skipped.files.length > 0;
        if (hasSkipped) {
          reportHtml+= `${report.skipped.files.length} duplicate audio file(s) rejected\n`;
          report.skipped.files.forEach(af => {
            reportHtml+= ` - ${af}\n`;
          });
          reportHtml+= `\n`;
        }
        if (Array.isArray(report.errors_parse_replace) && report.errors_parse_replace.length > 0) {
          reportHtml+= `Audio can’t be parsed. WAV audio file, specified in the JSON audio map is not found in:\n`;
          report.errors_parse_replace.forEach(err => {
            reportHtml+= ` - ${err.dir}\n`;
          });
          reportHtml+= `\n`;
        }
        content+= reportHtml;
        el.innerHTML = content;
        el.select();
        document.execCommand('copy');
        el.innerText = '';
      }
      return;
    },
    getParsedReport() {
      if (this.audiobook.report) {
        try {
          return JSON.parse(this.audiobook.report);
          
        } catch (e) {
          return this.audiobook.report;
        }
      }
      return "";
    },
    uploadOk() {
      this.uploadInfo.success = true;
      this.$emit('close');
    },
    checkMultipleFileInput() {
      if (!this.multiple) {
        Vue.nextTick(() => {
          let fileInput = document.querySelector('input[type="file"].dz-hidden-input');
          if (fileInput) {
            fileInput.multiple = false;
          }
        });
      }
    },
    ...mapActions(['updateAudiobook', 'tc_loadBookTask', 'getBlocks', 'getBookAlign']),
    ...mapActions('audioExport', ['parseReplaceAudio'])

  },
  watch: {
    'uploadFilesDuplicates.length': {
      handler(val, oldVal) {
        if (val !== 0 && oldVal === 0) {
          this.showModal('duplicate-files-warning');
        } else if (val === 0 && oldVal !== 0) {
          this.hideModal('duplicate-files-warning');
        }
      }
    },
    'audiobook.report.length': {
      handler(val, oldVal) {
        if (!oldVal && val) {
          let report = this.getParsedReport();
          if (report instanceof Object && report.replaced && Array.isArray(report.replaced.blocks) && report.replaced.blocks.length > 0) {
            this.getBlocks(report.replaced.blocks)
              .then(blocks => {
                this.$root.$emit('bookBlocksUpdates', {blocks: blocks});
              });
          }
          if (report instanceof Object && report.aligned && Array.isArray(report.aligned.files) && report.aligned.files.length > 0) {
            this.getBookAlign()
              .then((res) => {
                let getIds = [];
                report.aligned.blocks.forEach(blk => {
                  if (!this.aligningBlocks.includes(blk)) {
                    getIds.push(blk);
                  }
                });
                if (getIds.length > 0) {
                  this.getBlocks(getIds)
                    .then(blocks => {
                      blocks.forEach(blk => {
                        this.$store.commit('set_storeList', new BookBlock(blk));
                        this.$root.$emit(`reload-audio-editor:${blk.blockid}`);
                      });
                    })
                }
              });
          }
        }
      }
    }
  }
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
  padding: 10px 0px;
}

.audio-logo {
  /*width:50px;
  height:50px;*/
}

.modal-body {
  margin: 0px 0;
}

.modal-footer {
  padding: 10px;
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

.booktitle {font-family: times; padding-top:0; margin-top:0;}
.bookauthor {font-family: times; color: gray; text-indent: 2.5em}
.bookcover {float: right; max-width: 100px; max-height: 140px;
  border-radius: 2px; margin: 10px;
  box-shadow: 0px 1px 3px 2px rgba(100,100,100,.25);
  padding-top:0; margin-top:0;
}

#uploadingMsg {text-align: center; padding: 0px;}
#uploadingMsg h2 i {font-size: 24pt; color: silver}

.download-audio-link {
    display: inline-block;
    background-color: #9fc5f8;
    padding: 10px;
    color: white;
}

.upload-error {
    font-size: 20px;
    color: red;
}

</style>
<style lang="less">
.audiofiles-list {
  max-height: 75px;
  overflow-y: scroll;
  padding: 0px 0px 0px 20px;
  margin: 10px 0px;
  li {
    font-size: 14px;
  }
}
.dz-preview.dz-file-preview {
  display: none;
}
.vue-dropzone.dropzone.dz-clickable {
    display: inline-block;
}
.audio-import-options {
  fieldset.audio-import-options-fieldset {
    border: solid 1px black;
    padding: 4px 15px;
    height: 150px;
    margin: 15px 0px;
    legend {
      padding: 2px 4px;
      font-size: 14px;
    }
    label {
      display: block;
      cursor: pointer;
      input {
        margin: 0px 4px;
      }
      i.fa {
        width: 30px;
        text-align: center;
        &.fa-signal, &.fa-check {
          color: green;
        }
      }
      div {
        width: 30px;
        text-align: center;
        display: inline-block;
      }
    }
  }
  .col-sm-6, .col-sm-7, .col-sm-5 {
    padding: 0px;
  }
}
.upload-files {
  div {
    text-align: right;
    &:first-child {
      text-align: left;
      padding-left: 0px;
    }
  }
}

.modal-default-button {
  float: right;
  &.btn-default {
    margin: 0px 5px;
  }
}
.import-audio-report {
  list-style-type: disc;
  &>li {
    font-size: 16px;
    text-align: left;
  }
}
.copy-report-content {
  height: 0px;
  width: 0px;
  resize: none;
  padding: 0px;
  border-color: transparent;
  float: left;
}
.copy-report {
  text-align: left;
  padding: 5px;
}
.audio-import-modal {
  [class^="col-sm-"] {
    padding: 4px 4px 4px 0px;
  }
  .modal-header {
    padding: 10px 10px 10px 28px;
    button.close {
      margin-top: -25px;
    }
    button.close i.close-modal {
      font-size: 18px;
      padding-right: .5em;
      &:before {
        content: "\00d7";
      }
    }
  }
  .modal-body {
    padding: 0px 30px;
  }
  .browse-audio, .browse-audio:hover {
    border: 1px solid #3187d5;
    border-radius: 5px;
    color: #3187d5;
    padding: 6px 12px;
    background: rgba(49, 135, 213, 0.1);
  }
  .input-group {
    width: 100%;
    .playlist-url {
      background: rgba(238, 238, 238, 0.2);
    }
  }
  .audio-import-quality {
    font-size: 14px;
    display: table-row;
    .audio-import-quality-item {
      display: table-cell;
      vertical-align: top;
      padding: 0px 35px 0px 0px;
    }
    div.audio-quality {
      /* width: 20px; */
      height: 16px;
      display: inline-block;
      background-repeat: no-repeat;
      padding-left: 18px;
      vertical-align: top;
      &.-raw {
        background: url(/static/audio_quality/raw-16.png) no-repeat;
      }
      &.-improved {
        background: url(/static/audio_quality/improved-16.png) no-repeat;
      }
      &.-mastered {
        background: url(/static/audio_quality/mastered-16.png) no-repeat;
      }
    }
    label {
      margin-bottom: 0px;
      font-weight: 400;
    }
  }
  .modal-header {
    border-bottom: none;
    h4 {
      font-size: 16px;
      font-weight: 700;
    }
  }
  .modal-footer {
    border-top: none;
    .btn-default {
      width: 88px;
    }
    .btn-primary {
      width: 84px;
    }
    .btn {
      margin: 0px 7px;
    }
  }
}
</style>
