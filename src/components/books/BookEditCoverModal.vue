<template>

  <modal id="bookEditCoverModal" :value="show" effect="fade" @closed="closed">
    <div slot="modal-header" class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title"><i class="fa fa-book"></i>Edit Cover</h4></div>
    </div>
    <div slot="modal-body" class="modal-body">
      <div class="row">
        <div class="col-md-4">
          <div class="book-cover"><img :src="tmp.coverimg"></div>
        </div>
        <div class="col-md-8">
          <div class="book-list">
            <input type="text" placeholder="Citadel Of Faith" v-model="tmp.title">
            <span><i class="fa fa-font"></i><i class="fa fa-font"></i></span>
          </div>
          <div class="book-list">
            <img src="assets/img/book-slider.png">
            <span><i class="fa fa-plus"></i><i class="fa fa-folder-open-o"></i></span>
          </div>
          <div class="book-list">
            <input type="text" placeholder="Shogi Effendi" v-model="tmp.author">
            <span><i class="fa fa-font"></i><i class="fa fa-font"></i></span>
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
import modalMixin from './../../mixins/modal'

export default {

  name: 'BookEditCoverModal',

  mixins: [modalMixin],

  components: {
    modal
  },

  props: {
    show: Boolean,
    img: Object
  },

  data () {
    return {
      tmp: {
        coverimg: '',
        title: '',
        author: ''
      }
    }
  },

  watch: {
    show () {
      this.tmp.coverimg = this.img.coverimg
      this.tmp.title = this.img.title
      this.tmp.author = this.img.author
    }
  },

  methods: {
    ok () {
      this.img.title = this.tmp.title
      this.img.author = this.tmp.author
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
    width: 400px
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
      .book-cover
        img
          width: 100%

</style>
