<template>
  <div>
    <modal name="import-collection-cover">
      <div slot="modal-header" class="modal-header">
        <div class="header-title">
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <i class="fa fa-times-circle-o" aria-hidden="true"></i>
          </button>
          <img src='/static/bookstack.svg' class='book-logo'> <h3 class="header-h">Collection Cover</h3>
        </div>
      </div>

      <div slot="modal-body" class="modal-body">

        <!-- Selection tabs for Upload or Create forms -->
        <div class="row tabs">
          <ul class="nav nav-tabs">
            <li :class="{active: uploadMode}"><a data-toggle="tab" href="#upload_pane" @click="uploadMode = !uploadMode">Upload</a></li>
            <li :class="{active: !uploadMode}"><a data-toggle="tab" href="#create_pane" @click="uploadMode = !uploadMode">Create New</a></li>
          </ul>
        </div>

        <div class="tab-content">
          <!-- Selection tabs for Upload or Create forms -->

          <div id="upload_pane" class="tab-pane fade in"  :class="{active: uploadMode}">
               <div class="row">
              <div class="col-md-12">

                <div class="col-sm-4">
                  <img :src="uploadImage" class="preview_upload" v-show="uploadImage.length>0" />
                  <img :src="uploadImageBlank" class="preview_upload" v-show="uploadImage.length<1" />
                </div>

                <div class="col-sm-8">
                  <div class="input-group">
                    <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                    <input type="text" class="form-control" placeholder="URL" v-model="uploadImage" />
                  </div>

                  <br> &nbsp;&nbsp;&nbsp;  or <br><br>

                  <label class='btn btn-default' type="file">
                    <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse for bookcover file &hellip;
                    <input name="coverFile" type="file" v-show="false" accept="image/*"  @change="onFilesChange($event)"><br>
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
                
                <div class="book-list">
                  <!-- <div ref="quillContainerAuthor" id="quillContainerAuthor"></div> -->
                </div>
              </div>

            </div> <!-- row? -->
          </div> <!-- Create Pane -->

        </div> <!-- tabbed content for create -->

      </div> <!-- modal body -->

      <div id='uploadingMsg' v-show='isUploading'>
        <h2> {{uploadProgress}}   &nbsp; <i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i> </h2>
      </div>

      <div slot="modal-footer" class="modal-footer">
        <button class="btn btn-primary" type="button">Save</button>
      </div>
    </modal>
  </div>
</template>
<script>
  import modal from 'vue-js-modal';
  import Vue from 'vue';
  Vue.use(modal);
  export default {
      name: 'CollectionCoverModal',
      data() {
        return {
          uploadMode: true,
          uploadImage: '',
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
          editorAuthor: null
        }
      },
      mounted() {
        
      },
      methods: {
        show() {
          this.$modal.show('import-collection-cover');
        }
      }
  }
</script>
<style lang="less">
</style>