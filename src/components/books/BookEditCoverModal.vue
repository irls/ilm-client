<template>
 <!-- <transition name="modal"> -->
  <modal id="bookEditCoverModal" name="bookEditCoverModal" :adaptive="true" height="auto" :clickToClose="false" @opened="opened">

    <div class="modal-header">
      <div class="header-title">
        <img src='/static/bookstack.svg' class='book-logo'> <h3 class="header-h">Book Cover</h3>
      </div>
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-on:click="hideModal">
        <i class="fa fa-times-circle-o" aria-hidden="true"></i>
      </button>
    </div>

    <div class="modal-body">

      <!-- Selection tabs for Upload or Create forms -->
      <!-- <div class="row tabs">
        <ul class="nav nav-tabs">
          <li :class="{active: uploadMode}"><a data-toggle="tab" href="#upload_pane" @click="uploadMode = !uploadMode">Upload</a></li>
          <li :class="{active: !uploadMode}"><a data-toggle="tab" href="#create_pane" @click="uploadMode = !uploadMode">Create New</a></li>
        </ul>
      </div> -->

      <div class="tab-content">
        <!-- Selection tabs for Upload or Create forms -->

        <div id="upload_pane" :class="['tab-pane fade in image-upload-wrapper', {active: uploadMode}]">
          <div class="row">
            <div class="col-md-12">

              <div class="col-sm-4">
                <img :src="uploadImage" class="preview_upload" v-show="uploadImage.length>0" />
                <!-- <img :src="uploadImageBlank" class="preview_upload" v-show="uploadImage.length<1" /> -->
                <div class='coverimg-wrap' v-show="uploadImage.length<1"></div>
              </div>

              <div class="col-sm-8">
                <div class="input-group">
                  <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                  <input type="text" class="form-control" placeholder="URL" v-model="uploadImage" v-on:input="onImageChange" />
                </div>

                 <br> &nbsp;&nbsp;&nbsp;  or <br><br>


                <p v-if="errorCoverFileType" ><span class="alert alert-warning">Please select image file for cover</span></p>
                <label class='btn btn-default' type="file">
                  <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse for bookcover file &hellip;
                  <input name="coverFile" type="file" 
                    v-show="false" 
                    accept="image/*"  
                    @change="onFilesChange($event)"><br>
                </label>
              </div>

            </div>
          </div>
        </div>

        <div id="create_pane" class="tab-pane fade in"  :class="{active: !uploadMode}">
          <div class="row">

            <!-- left column, display preview -->
            <div class="col-md-4">
              <div id="bookCoverPreviewMain">
                <div class="bookCoverPreviewWrap">
                  <div class="book-cover"><img :src="tmp.coverimg"></div>
                  <div ref="livePreviewTitle" id="livePreviewTitle" class="ql-editor" v-draggable="tmp.title"></div>
                  <div ref="livePreviewAuthor" id="livePreviewAuthor" class="ql-editor" v-draggable="tmp.author"></div>
                </div>
              </div>
            </div>

            <!-- right column edit controls -->
            <div class="col-md-8">
              <div class="book-list">
                <!-- <div ref="quillContainerTitle" id="quillContainerTitle"></div> -->
              </div>
              <div class="book-list bookCoverCarouselWrap">
                <!--<carousel-3d :display="7" :width="90" :height="115.5">
                  <slide v-for="(bc, index) in bookcovers" :key="index" :index="index">
                    <img :src="bc.src" @click="selectBookCover(index)">
                  </slide>
                </carousel-3d>-->
                <span class="addBookCoverBtnWrap">
                  <i class="fa fa-plus"></i><i class="fa fa-folder-open-o"></i>
                  <input type="file" @change="addBookCover"/>
                </span>
              </div>
              <div class="book-list">
                <!-- <div ref="quillContainerAuthor" id="quillContainerAuthor"></div> -->
              </div>
            </div>

          </div> <!-- row? -->
        </div> <!-- Create Pane -->

      </div> <!-- tabbed content for create -->

      <div id='uploadingMsg' v-show='isUploading'>
         <h2> {{uploadProgress}}   &nbsp; <i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i> </h2>
      </div>

    </div> <!-- modal body -->

    <div class="modal-footer">
      <button class="btn btn-primary" type="button" 
        @click="save" 
        :disabled="!saveEnabled">Save</button>
    </div>

  </modal>

<!-- </transition> -->
</template>

<script>

import v_modal from 'vue-js-modal';
//import { Carousel3d, Slide } from 'vue-carousel-3d'
import modalMixin from './../../mixins/modal'
import api_config from './../../mixins/api_config'
import BOOKCOVERS from '../../../static/bookcovers.json'
// import Canvas2Image from 'canvas2image'
//import html2canvas from 'html2canvas'
import axios from 'axios'
import PouchDB from 'pouchdb'
import superlogin from 'superlogin-client'

import { mapGetters, mapActions }    from 'vuex'
import Vue from 'vue';

const html2canvas = {};

// const quillOptions = {
//   modules: {
//     toolbar: [
//       ['bold', 'italic'],
//       // [{ 'size': ['normal', 'large'] }],
//       [{ 'color': [] }],
//       [{ 'font': [] }],
//       [{ 'direction': 'rtl' }]
//       //  [{ 'align': [] }]
//     ]
//   },
//   // formats: [{align: 'center'}],
//   placeholder: '',
//   theme: 'snow'
// }

Vue.use(v_modal, {dialog: true, dynamic: true});

export default {
  name: 'BookEditCoverModal',

  mixins: [modalMixin, api_config],

  components: {
    
  },

  // props: {
  //   show: Boolean,
  //   img: Object
  // },
  props: ['show', 'img'],

  data () {
    return {
      bookcovers: BOOKCOVERS,
      errorCoverFileType: false,
      uploadMode: true,
      uploadImage: '',
      uploadFile: false,
      uploadImageBlank: 'https://dl.dropboxusercontent.com/u/382588/share/book_blank_sm.png',
      isUploading: false,
      uploadProgress: '',

      tmp: {
        coverimg: '',
        title: {
          text: 'Title',
          top: 33,
          left: 0,
          scale: 1
        },
        author: {
          text: 'Author',
          top: 192,
          left: 0,
          scale: 1
        }

      },
      quillTitle: null,
      quillAuthor: null,
      editorTitle: null,
      editorAuthor: null,
      fileChanged: false
    }
  },

  watch: {
    show (val) {
      // this.tmp.coverimg = this.img.coverimg
      this.tmp.title.text = this.img.title
      // this.tmp.title.top = this.img.title.top || 0
      // this.tmp.title.left = this.img.title.left || 0
      // this.tmp.title.scale = this.img.title.scale || 1
      this.tmp.author.text = this.img.author
      // this.tmp.author.top = this.img.author.top || 0
      // this.tmp.author.left = this.img.author.left || 0
      // this.tmp.author.scale = this.img.author.scale || 1


      // this.quillTitle.pasteHTML(this.tmp.title.text)
      // this.quillAuthor.pasteHTML(this.tmp.author.text)

      // console.log("Showing cover editor with book: ", this.img)
      if (val) {
        
        this.showModal();
      } else {
        this.hideModal();
      }
    }


  },

  activated () {
    //  this.uploadImage = this.img.coverimg
  },

  mounted () {
    // const vm = this

    // Quill for Title
    // vm.quillTitle = new Quill(vm.$refs.quillContainerTitle, Object.assign(quillOptions, { placeholder: 'title' }))
    // vm.editorTitle = document.querySelector('#quillContainerTitle .ql-editor')
    // vm.quillTitle.on('text-change', function () {
    //   vm.$refs.livePreviewTitle.innerHTML = vm.editorTitle.innerHTML
    // })

    // Quill for Author
    // vm.quillAuthor = new Quill(vm.$refs.quillContainerAuthor, Object.assign(quillOptions, { placeholder: 'author' }))
    // vm.editorAuthor = document.querySelector('#quillContainerAuthor .ql-editor')
    // vm.quillAuthor.on('text-change', function () {
    //   vm.$refs.livePreviewAuthor.innerHTML = vm.editorAuthor.innerHTML
    // })
  },

  methods: {
    ...mapActions([
      'updateBookCover'
    ]),
    addBookCover (e) {
      console.log('addedBookCover', e.target.files[0])
    },

    // Make bookcover selectable on vue-carousel-3d
    selectBookCover (index) {
      this.tmp.coverimg = this.bookcovers[index].src
      this.tmp.title.top = this.bookcovers[index].title.top
      this.tmp.title.left = this.bookcovers[index].title.left
      this.tmp.title.scale = this.bookcovers[index].title.scale
      this.tmp.author.top = this.bookcovers[index].author.top
      this.tmp.author.left = this.bookcovers[index].author.left
      this.tmp.author.scale = this.bookcovers[index].title.scale
    },

    // for this BookEditCoverModal Component -------------------------------------------------------
    opened () {
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })

      this.uploadImage = this.img.coverimg || '';
    },

    onFilesChange (e) {
      this.errorCoverFileType = false
      var files = e.target.files || e.dataTransfer.files
      // console.log('*** onFilesChange', files)

      if (!files.length) return
      //if (files[0].type.substr(0,5) == 'image') {
      if (files[0].type == 'image/jpg' || files[0].type == 'image/jpeg' || files[0].type == 'image/png' || files[0].type == 'image/gif') {
        this.createImage(files[0])
      } else {
        this.errorCoverFileType = true;
        setTimeout(()=>{this.errorCoverFileType = false; console.log('end of timeout');}, 5000)
      }
      this.onImageChange();
    },

    createImage (file) {
      this.uploadFile = file;
      // console.log('*** Creating new image', file)
      var reader = new FileReader()
      reader.onload = e => { 
        this.uploadImage = e.target.result;
      }
      reader.readAsDataURL(file)
    },

    uploadNewImageData () {
      if (this.isUploading) {
        return;
      }
      //console.log('bookid:', bookid)
      // the book id is critical for the path
      let formData = new FormData();
      if (this.uploadFile) {
        formData.append('coverimg', this.uploadFile, 'coverimg');
      }
      formData.append('coverimgURL', this.uploadImage);

      var config = {
        onUploadProgress: (progressEvent) => {
          var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          this.uploadProgress = "Uploading Files... " + percentCompleted + "%";
        }
      }

      this.isUploading = true;
      this.fileChanged = false;
      this.uploadProgress = 'Uploading file';
      return this.updateBookCover({formData: formData, config: config})
        .then(doc => {
          this.isUploading = false;
          this.uploadProgress = '';
          this.uploadFile = null;
          return Promise.resolve();
        }).catch(err => {
          this.isUploading = false;
          this.uploadProgress = '';
          this.uploadFile = null;
          return Promise.resolve();
        })
    },

    uploadNewImageURL (url) {
      // console.log('loading url: ', url)
      var vm = this
      return new Promise((resolve, reject) => {
        var image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = function () {
          var canvas = document.createElement('canvas')
          canvas.width = this.naturalWidth // or 'width' if you want a special/scaled size
          canvas.height = this.naturalHeight // or 'height' if you want a special/scaled size
          canvas.getContext('2d').drawImage(this, 0, 0)
          resolve(vm.uploadNewImageData(canvas.toDataURL('image/png')))
        }
        image.src = url
      })
    },

    closeWithDelay () {
      this.hideModal();
    },

    save() {
      if (this.uploadMode) { // user uploded or browesed for image

        this.uploadNewImageData().then(() => {
          this.closeWithDelay();
        });
      } else {
        // generate PNG image from preview using something like html2canvas
        this.captureBookImage()
      }
    },

    captureBookImage () {
      var source = document.getElementById('bookCoverPreviewMain')
      var img = document.getElementById('bookImagePreview')
      var scale = 1
      img.width = source.clientWidth // display at same size
      this.captureCanvas(source, scale).then(function(newCanvas){
        // console.log("got here ok")
        img.src = newCanvas.toDataURL() // defaults to png
      })
    },

    // Capture and scale functionality
    // https://jsfiddle.net/nkhsLbpf/30/
    captureCanvas (source, scale) {
      return new Promise((resolve, reject) => {
        // isolate source with temp copy to root (causes flash)
        var temp = document.body.appendChild(source.cloneNode(true))
        temp.style.position = 'fixed'
        temp.style.top = '0'
        temp.style.left = '0'
        temp.style.zIndex = '-100000'
        document.body.style.position = 'relative'
        // set up custom renderer
        var renderer = function (width, height) {
          html2canvas.CanvasRenderer.apply(this, arguments)
          this.canvas.width = this.width = width * scale
          this.canvas.height = this.height = height * scale
          this.ctx.scale(scale, scale)
        }
        renderer.prototype = Object.create(html2canvas.CanvasRenderer.prototype)
        html2canvas(temp, {
          renderer: renderer,
          onrendered: newCanvas => {
            document.body.removeChild(temp)
            resolve(newCanvas)
          },
          useCORS: true,
          width: temp.offsetWidth * scale,
          height: temp.offsetHeight * scale
        })
      })
    },

    cancel () {
      this.closed()
    },
    
    showModal() {
      this.$modal.show('bookEditCoverModal');
    },
    hideModal() {
      this.$modal.hide('bookEditCoverModal');
      this.$emit('closed');
    },
    onImageChange() {
      if (this.uploadFile || this.uploadImage) {
        this.fileChanged = true;
      }
    }
  },
  computed: {
    ...mapGetters(['currentBookMeta']),
    saveEnabled: {
      get() {
        return !this.isUploading && this.fileChanged;
      },
      cache: false
    }
  }

}
</script>

<style lang="stylus" scoped>
#bookEditCoverModal
  i
    margin-right: 10px;
  .modal-dialog
    width: 700px
    margin-top: 10%

    .modal-header
      position: relative
      border-bottom: 0 solid #e5e5e5
      .modal-title
        display: inline-block
        font-size: 18px
        margin-top: 17px
        /*color: #00d1ff*/
        text-align: left
        float: left

    .modal-body
      margin-top: 0px
      .bookCoverPreviewWrap
        position: relative
        overflow: hidden
        .book-cover
          img
            width: 100%
        .ql-editor
          position: absolute
          width: 100%
          height: auto
          text-align: center
          background-color: transparent
          cursor: move
          border: 1px dashed transparent
          &:hover
            border-color: rgba(#ccc, .7)
            background-color: rgba(#fff, .1)


      .bookCoverCarouselWrap
        display: flex
        align-items: center
        .carousel-3d-container
          width: 80%
          height: auto!important
          min-height: 130px
          .carousel-3d-slider
            width: 90px!important
            height: 115px!important
            .carousel-3d-slide
              background-color: transparent
              border: none
        .addBookCoverBtnWrap
          position: relative
          input
            cursor: pointer
            position: absolute
            top: 0
            left: 0
            right: 0
            bottom: 0
            opacity: 0
          &:hover
            color: green
.ql-editor
  width: 100%
  height: 300px


</style>

<style scoped>
  button.close i.fa {
    font-size: 18pt; padding-right: 0; margin-right:-20px;
  }

  .book-logo {
    width:50px;
    height:50px;
  }
  .header-h {
    display: inline;
  }
  .header-title {
    padding-left: 0px;
    display: inline;
  }
  div.modal-header {
    padding:10px; margin:0;
    padding-right:0;
    padding-bottom: 0;
    border-bottom: 1px solid #e5e5e5 !important;
  }
  div.modal-dialog {
    min-width: 700px !important;
  }
  .ql-snow .ql-formats {
    margin-right: 8px !important;
  }
  .ql-snow .ql-formats button {
    padding-right: 0px;
  }

  #livePreviewTitle, #livePreviewAuthor {
    font-weight: bold; margin-left: .15em;
    font-family: Garamond, Baskerville, "Baskerville Old Face", "Hoefler Text", "Times New Roman", serif;
    font-size: 18pt;
    line-height: 1em;
    color:	rgba(139,69,19, .5);
    text-shadow: 0px 1px 0px rgba(256,256,256, .3),
                  0px -1px 0px rgba(0,0,0,.2),
                  0px 0px 2px rgba(255,215,0, 0.5);
  }
  #livePreviewAuthor {
    font-size: 16pt;
  }

  #bookCoverSmall {
    min-width: 200px; min-height: 300px; border: 1px dashed gray;
  }

  /*Tabs control*/

  .row.tabs {
    margin-top:0; margin-bottom: 2em;
    margin-left: 0;
  }

  img.preview_upload {width: 150px; margin-right:1em; margin-top:-.75em; padding:0;}
  .image-upload-wrapper {
    height: 200px;
  }



</style>
