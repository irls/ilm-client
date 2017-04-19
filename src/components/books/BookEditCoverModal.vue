<template>

  <modal id="bookEditCoverModal" :value="show" effect="fade" @closed="closed" @opened="opened">
    <div slot="modal-header" class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title"><i class="fa fa-book"></i>Edit Cover</h4>
    </div>
    <div slot="modal-body" class="modal-body">

      <div class="row">
        <div class="col-md-4">
          <div class="bookCoverPreviewWrap">
            <div class="book-cover"><img :src="tmp.coverimg"></div>
            <div ref="livePreviewTitle" id="livePreviewTitle" class="ql-editor" v-draggable="tmp.title"></div>
            <div ref="livePreviewAuthor" id="livePreviewAuthor" class="ql-editor" v-draggable="tmp.author"></div>
          </div>
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

</template>

<script>

import { modal } from 'vue-strap'
import { Carousel3d, Slide } from 'vue-carousel-3d'
import Quill from 'quill'
import '../../../node_modules/quill/dist/quill.core.css'
import '../../../node_modules/quill/dist/quill.snow.css'
import modalMixin from './../../mixins/modal'
import BOOKCOVERS from '../../../static/bookcovers.json'

const quillOptions = {
  modules: {
    toolbar: [
      ['bold', 'italic'],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }]
    ]
  },
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

  props: {
    show: Boolean,
    img: Object
  },

  data () {
    return {
      bookcovers: BOOKCOVERS,
      tmp: {
        coverimg: '',
        title: {
          text: 'Sample Title',
          top: 33,
          left: 0,
          scale: 1
        },
        author: {
          text: 'ShoGHI FFFFFNDI',
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

    ok () {
      console.log('ok')
      this.closed()
    },

    cancel () {
      console.log('cancel')
      this.closed()
    }
  }

}
</script>

<style lang="stylus">
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
        color: #00d1ff
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
