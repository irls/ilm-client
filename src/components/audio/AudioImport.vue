<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">

          <div class="modal-header">
            
            <slot name="header">
              <div class="header-title">
                <label class="header-h"><img src='/static/bookstack.svg' class='book-logo'></label>
                <h3 class="header-h">Import New Audio</h3></div>
            </slot>
          </div>

          
          <div class="modal-body clearfix">
            <slot name="body">

              <h4> Book Text </h4>

                <div class="col-sm-12">
                  <div class="col-sm-7">
                    <div class="input-group">
                      <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                      <input type="text" class="form-control" placeholder="URL" v-model="file_name_book" />
                    </div>

                  </div>
                  <div class="col-sm-5">
                    or &nbsp;&nbsp;&nbsp;
                    <button class='btn btn-default' type="file">
                      <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;
                      <input name="book_import" type="file" class="file_open" @change="onBookFileChange"/>
                    </button>
                  </div>
                  <span class="help-block"> &nbsp; &nbsp; Book file or ZIP with files and images  </span>
                </div>

                <br><br><br>

                <div class="col-sm-12">
                  <div class="col-sm-6">
                    <div class="form-group">
                      <label for="booktype">Book Type:</label>
                      <select class="form-control" id="booktype" v-model="type_book">
                        <option>Gutenberg HTML</option>
                        <option>Ocean HTML</option>
                        <option>Gutenberg Text</option>
                        <option>Plain Text</option>
                      </select>
                    </div>
                  </div>

                </div>
                <br><br><br><br>


                <h4> Book Audio </h4>


                <div class="col-sm-12">
                  <div class="col-sm-7">
                    <div class="input-group">
                      <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                      <input type="text" class="form-control" placeholder="URL" v-model="file_name_audio" />
                    </div>
                  </div>
                  <div class="col-sm-5">
                    or &nbsp;&nbsp;&nbsp;
                    <button class='btn btn-default' type="file">
                      <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;
                      <input name="audio_import" type="file" class="file_open" @change="onAudioFileChange"/>
                    </button>
                  </div>
                  <span class="help-block"> &nbsp; &nbsp; Audio file, ZIP files or playlist </span>
                </div>

                <br><br><br><br>

                <button class="btn btn-primary modal-default-button" @click="onUpload">
                  <i class="fa fa-plus" aria-hidden="true"></i> &nbsp;  Import Book
                </button>

            </slot>
          </div>    

        </div>
      </div>
    </div>
  </transition>

</template>


<script>
import Vue from 'vue'
const dataBook = new FormData();
const dataAudio = new FormData();

export default {
  data() {
    return {
      file_name_book : '',
      file_name_audio : '',
      flag_book_browse : false,
      flag_audio_browse : false,
      type_book : '',
      auth: this.$store.state.auth,
    }
  },
  components: {
    Vue
  },
  methods: {

    onBookFileChange: function(e) {
      var files = e.target.files || e.dataTransfer.files;
      if (!files.length)
        return;
      dataBook.set('files', files);
      this.file_name_book = files[0].name;
      this.flag_book_browse = true;
      console.log(this.type_book);
    },

    onAudioFileChange: function(e) {
      var files = e.target.files || e.dataTransfer.files;
      if (!files.length)
        return;
      dataAudio.set('files', files);
      this.file_name_audio = files[0].name;
      this.flag_audio_browse = true;
      console.log(this.type_book);
    },

    onUpload: function() {
      console.log(this.auth._session.token);
      console.log(this.auth._session.password);
      
      var url = 'http://localhost:3000/api/v1/books';
      var author = 'Bearer ' + this.auth._session.token + ':' + this.auth._session.password;
      Vue.http.headers.common['Authorization'] = author;

      if (this.flag_book_browse) {
        if (this.flag_audio_browse) {
          // file browser of book, audio
          this.$http.post(url, { 'book': dataBook, 'audio': dataAudio, 'type_book': this.type_book }).then((response) => {
            // result
            alert(response.toString());
            
          });
        } else {
          // file browser of book, url of audio
        }
      } else {
        if (this.flag_audio_browse) {
          // url of book, file browser of audio
        } else {
          // url of book, audio
        }
      }

      // close
      this.$emit('close');
          
    }

  },
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
  border-radius: 2px;
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



</style>
