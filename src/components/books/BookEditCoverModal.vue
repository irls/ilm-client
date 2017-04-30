<template>
 <!-- <transition name="modal"> -->
  <modal id="bookEditCoverModal" :value="show" effect="fade" @closed="closed" @opened="opened">


    <div slot="modal-header" class="modal-header">
      <div class="header-title">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel">
          <i class="fa fa-times-circle-o" aria-hidden="true"></i>
        </button>
        <img src='/static/bookstack.svg' class='book-logo'> <h3 class="header-h">New Book Cover</h3>
      </div>
    </div>


    <div slot="modal-body" class="modal-body">



      <div class="row">
        <div class="col-md-4">


        <div id="bookCoverPreviewMain">
          <div class="bookCoverPreviewWrap">
            <div class="book-cover"><img :src="tmp.coverimg"></div>
            <div ref="livePreviewTitle" id="livePreviewTitle" class="ql-editor" v-draggable="tmp.title"></div>
            <div ref="livePreviewAuthor" id="livePreviewAuthor" class="ql-editor" v-draggable="tmp.author"></div>
          </div>
        </div>

        <img id="bookImagePreview" src='' width="100"></img>


        </div>
        <div class="col-md-8">
          <div class="book-list">
            <div ref="quillContainerTitle" id="quillContainerTitle"></div>
          </div>
          <div class="book-list bookCoverCarouselWrap">
            <carousel-3d :display="7" :width="90" :height="115.5">
              <slide v-for="(bc, index) in bookcovers" :key="index" :index="index">
                <img :src="bc.src" @click="selectBookCover(index)">
              </slide>
            </carousel-3d>
            <span class="addBookCoverBtnWrap">
              <i class="fa fa-plus"></i><i class="fa fa-folder-open-o"></i>
              <input type="file" @change="addBookCover"/>
            </span>
          </div>
          <div class="book-list">
            <div ref="quillContainerAuthor" id="quillContainerAuthor"></div>
          </div>
        </div>
      </div>

    </div>
    <div slot="modal-footer" class="modal-footer">
      <button class="btn btn-primary" type="button" @click="ok">Save</button>
    </div>

  </modal>

<!-- </transition> -->
</template>

<script>

import { modal } from 'vue-strap'
import { Carousel3d, Slide } from 'vue-carousel-3d'
import Quill from 'quill'
import '../../../node_modules/quill/dist/quill.core.css'
import '../../../node_modules/quill/dist/quill.snow.css'
import modalMixin from './../../mixins/modal'
import BOOKCOVERS from '../../../static/bookcovers.json'
// import Canvas2Image from 'canvas2image'
import html2canvas from 'html2canvas'

const quillOptions = {
  modules: {
    toolbar: [
      ['bold', 'italic'],
      // [{ 'size': ['normal', 'large'] }],
      [{ 'color': [] }],
      [{ 'font': [] }],
      [{ 'direction': 'rtl'}],
      //  [{ 'align': [] }]
    ]
  },
  // formats: [{align: 'center'}],
  placeholder: '',
  theme: 'snow'
}

export default {

  name: 'BookEditCoverModal',

  mixins: [modalMixin],

  components: {
    modal,
    Carousel3d,
    Slide
  },

  // props: {
  //   show: Boolean,
  //   img: Object
  // },
  props: ['show', 'img'],

  data () {
    return {
      bookcovers: BOOKCOVERS,
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
      editorAuthor: null
    }
  },

  watch: {
    show () {
      this.tmp.coverimg = this.img.coverimg
      this.tmp.title.text = this.img.title
      // this.tmp.title.top = this.img.title.top || 0
      // this.tmp.title.left = this.img.title.left || 0
      // this.tmp.title.scale = this.img.title.scale || 1
      this.tmp.author.text = this.img.author
      // this.tmp.author.top = this.img.author.top || 0
      // this.tmp.author.left = this.img.author.left || 0
      // this.tmp.author.scale = this.img.author.scale || 1
      this.quillTitle.pasteHTML(this.tmp.title.text)
      this.quillAuthor.pasteHTML(this.tmp.author.text)

      //console.log("Showing cover editor with book: ", this.img)
    }
  },

  mounted () {
    const vm = this

    // Quill for Title
    vm.quillTitle = new Quill(vm.$refs.quillContainerTitle, Object.assign(quillOptions, { placeholder: 'title' }))
    vm.editorTitle = document.querySelector('#quillContainerTitle .ql-editor')
    vm.quillTitle.on('text-change', function () {
      vm.$refs.livePreviewTitle.innerHTML = vm.editorTitle.innerHTML
    })

    // Quill for Author
    vm.quillAuthor = new Quill(vm.$refs.quillContainerAuthor, Object.assign(quillOptions, { placeholder: 'author' }))
    vm.editorAuthor = document.querySelector('#quillContainerAuthor .ql-editor')
    vm.quillAuthor.on('text-change', function () {
      vm.$refs.livePreviewAuthor.innerHTML = vm.editorAuthor.innerHTML
    })
  },

  methods: {

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
    },

    ok() {
      //console.log('ok')
      this.captureBookImage()
      //this.closed()
    },

    captureBookImage () {
      var source = document.getElementById("bookCoverPreviewMain");
      var img = document.getElementById("bookImagePreview");
      var scale = 1
      img.width = source.clientWidth; // display at same size
      this.captureCanvas(source, scale).then(function(newCanvas){
        // console.log("got here ok")
        img.src = newCanvas.toDataURL(); // defaults to png
      })
    },

    // Capture and scale functionality
    // https://jsfiddle.net/nkhsLbpf/30/
    captureCanvas (source, scale) {
      return new Promise(function(resolve, reject) {
        // isolate source with temp copy to root (causes flash)
        var temp = document.body.appendChild(source.cloneNode(true));
        temp.style.position = 'fixed'
        temp.style.top = '0'
        temp.style.left = '0'
        temp.style.zIndex = '-100000'
        document.body.style.position = 'relative' 
        // set up custom renderer
        var renderer = function(width, height) {
          html2canvas.CanvasRenderer.apply(this, arguments);
          this.canvas.width = this.width = width * scale;
          this.canvas.height = this.height = height * scale;
          this.ctx.scale(scale, scale);
        }
        renderer.prototype = Object.create(html2canvas.CanvasRenderer.prototype);
        html2canvas(temp, {
          renderer: renderer,
          onrendered: (newCanvas) => {
            document.body.removeChild(temp);
            resolve(newCanvas)
          },
          useCORS: true,
          width: temp.offsetWidth * scale,
          height: temp.offsetHeight * scale
        });
      })
    },

    cancel () {
      console.log('cancel')
      this.closed()
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
      margin-top: 20px
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

</style>
