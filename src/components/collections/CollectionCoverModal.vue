<template>
  <div>
    <modal name="import-collection-cover"
      transition="nice-modal-fade"
      :adaptive="true"
      height="auto"
      :clickToClose="false"
      @before-open="modalOpened"
      @before-close="modalClosed"
      :class="'upload-collection-cover-modal'">
      <div class="modal-header">
        <div class="header-title">
          <img src='/static/bookstack.svg' class='book-logo'>
          <h3 class="header-h">Collection Cover</h3>
        </div>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-on:click="close()">
          <i class="fa fa-times-circle-o" aria-hidden="true"></i>
        </button>
      </div>
      <div class="modal-body">
        <div id="upload_pane" :class="['tab-pane fade in image-upload-wrapper', { active: uploadMode }]">
          <div class="row">
            <div class="col-md-12">
              <div class="col-sm-4">
                <img :src="uploadURL" class="preview-upload" v-show="uploadURL.length>0" />
              </div>
            <div class="col-sm-8">
              <div class="group">
                <div class="input-group">
                  <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                  <input type="text" class="form-control" placeholder="URL"  v-model="uploadURL" />
                </div>
                  <button class="btn btn-default" @click="remove" ><i class="fa fa-trash-o"></i></button>
                </div>
                <br> &nbsp;&nbsp;&nbsp;  or <br><br>
                <label class='btn btn-default' type="file">
                  <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse for bookcover file &hellip;
                  <input name="coverFile" type="file" v-show="false" accept="image/*" class="upload-image-input" @change="onFilesChange($event)"><br>
                </label>

            </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" v-on:click="cancel()">Cancel</button>
        <button class="btn btn-primary" v-on:click="save()">Save</button>
      </div>
    </modal>
  </div>
</template>
<script>
  import modal from 'vue-js-modal';
  import {mapGetters, mapActions} from 'vuex';
  import Vue from 'vue';
  Vue.use(modal);
  export default {
      name: 'CollectionCoverModal',
      data() {
        return {
          uploadImage: '',
          uploadURL: '',
          uploadMode: true,
        }
      },
      mounted() {

      },
      methods: {
        show() {
          this.uploadImage = '';
          this.uploadURL = this.currentCollection.coverimgURL ? this.currentCollection.coverimgURL : '';
          this.$modal.show('import-collection-cover');
        },
        close() {
          this.$emit('closed');
          this.$modal.hide('import-collection-cover')
        },
        modalOpened() {
          $('.fixed-wrapper .navtable').css('z-index', 0);
          $('.toolbar-wrapper .toolbar').css('z-index', 0);
        },
        modalClosed() {
          $('.fixed-wrapper .navtable').css('z-index', 999);
          $('.toolbar-wrapper .toolbar').css('z-index', 999);
        },
        onFilesChange (e) {
          var files = e.target.files || e.dataTransfer.files;
          // console.log('*** onFilesChange', files)
          if (!files.length) {
            return;
          }
          this.createImage(files[0]);
        },

        createImage (file) {
          // console.log('*** Creating new image', file)
          this.uploadImage = file;
          var reader = new FileReader();

          reader.onload = e => {this.uploadURL = e.target.result};
          reader.readAsDataURL(file);
        },

        remove() {
          this.uploadURL = '';
          this.currentCollection.coverimgURL = '';
        },

        save() {

          let formData = new FormData();
          if (this.uploadImage) {
            formData.append('coverimg', this.uploadImage, 'coverimg');
          }
          formData.append('coverimgURL', this.uploadURL || this.uploadURL == '' );

          return this.updateCollectionCoverimg(formData)
            .then(response => {
              this.close();
            });

        },

        cancel() {
          this.$emit('closed');
          this.$modal.hide('import-collection-cover')
        },

        hideModal() {
      this.$modal.hide('import-collection-cover');
      this.$emit('closed');
    },

        ...mapActions(['reloadCollection', 'updateCollectionVersion', 'updateCollectionCoverimg'])
      },
      computed: {
        ...mapGetters(['currentCollection']),


      },
  }

</script>
<style lang="less" scoped>
  .upload-collection-cover-modal {
    button.close i.fa {
      font-size: 18pt;
      padding-right: 0;
      margin-right: 10px;
    }

    i {
      margin-right: 10px;
    }

    .book-logo {
      width: 50px;
      height: 50px;
    }

    .header-h {
      display: inline;
    }

    .header-title {
      padding-left: 0px;
      display: inline;
    }

    div.modal-header {
      padding: 10px;
      margin: 0;
      padding-right: 0;
      padding-bottom: 0;
      border-bottom: 1px solid #e5e5e5 !important;
    }
    .tab-pane {
      display: block !important;
    }
    .group {
      display: flex;
    }
    .input-group {
      margin-right: 5px;
    }
    .row.tabs {
      margin-top: 0;
      margin-bottom: 2em;
      margin-left: 0;
    }
    img.preview-upload {
      max-height: 200px;
      max-width: 160px;
      margin-right: 1em;
      padding: 0;
    }
    .image-upload-wrapper {
      height: 200px;
    }
  }
</style>
