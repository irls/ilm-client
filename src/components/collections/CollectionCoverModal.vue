<template>
  <div>
    <modal name="import-collection-cover"
      transition="nice-modal-fade"
      :adaptive="false"
      width="700px"
      height="430px"
      @before-open="modalOpened"
      @before-close="modalClosed"
      :class="'upload-collection-cover-modal'">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-on:click="close()">
          <i class="fa fa-times-circle-o" aria-hidden="true"></i>
        </button>
        <img src='/static/bookstack.svg' class='book-logo'> <h3 class="header-h">Collection Cover</h3>
      </div>
      <div class="modal-body">
        <div id="upload_pane" class="tab-pane fade in">
          <div class="row">
            <div class="col-md-12">

              <div class="col-sm-4">
                <img :src="uploadURL" class="preview-upload" v-show="uploadURL.length>0" />
              </div>

              <div class="col-sm-8">
                <div class="input-group">
                  <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                  <input ref="form" type="text" class="form-control" placeholder="URL" v-model="uploadURL" />
                  <button class="input-group-addon" data-dismiss="modal" aria-label="Reset" @click="resetInput">
                  <i class="fa fa-trash-o" aria-hidden="true"></i> </button>
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
        <button class="btn btn-primary" v-on:click="cencel()">Cencel</button>
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
          uploadURL: ''
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
/*
        resetInput () {
         // this.$refs.form.reset()
          this.$refs["form"].value = "";
        },
*/
        resetInput () {
          this.uploadURL = "";
        },
        
        createImage (file) {
          // console.log('*** Creating new image', file)
          this.uploadImage = file;
          var reader = new FileReader();
          
          reader.onload = e => {this.uploadURL = e.target.result};
          reader.readAsDataURL(file);
        },
        save() {
          if (!this.uploadImage && !this.uploadURL) {
            return;
          }
          
          let formData = new FormData();
          if (this.uploadImage) {
            formData.append('coverimg', this.uploadImage, 'coverimg');
          }
          formData.append('coverimgURL', this.uploadURL);
          
          return this.updateCollectionCoverimg(formData)
            .then(response => {
              this.close();
            });
        },
//
        cencel() {
          this.$emit('closed');
          this.$modal.hide('import-collection-cover')
        },
//
        ...mapActions(['reloadCollection', 'updateCollectionVersion', 'updateCollectionCoverimg'])
      },
      computed: {
        ...mapGetters(['currentCollection'])
      },
      watch: {
        /*uploadImage: {
          handler(val) {
            if (val) {
              this.uploadURL = '';
            } else {
              $('.upload-image-input').val('');
            }
          }
        },
        uploadURL: {
          handler(val) {
            if (val) {
              this.uploadImage = '';
            }
          }
        }*/
      }
  }
</script>
<style lang="less">
  .upload-collection-cover-modal {
    .book-logo {
      width: 35px;
    }
    .modal-header {
      padding: 10px 20px;
      text-align: center;
      h3 {
        display: inline-block;
      }
    }
    .preview-upload {
      max-width: 200px;
      height: 250px;
    }
    .tab-pane {
      display: block !important;
    }
    .input-group {
      display: flex;
      margin: 1px 3px;
    }
  }
</style>