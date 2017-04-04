<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">

          <div class="modal-header">
            <!-- <slot name="header">
              <div class="import-title">
                <label>Book Imports</label>
              </div>
            </slot> -->
            <slot name="header">
              <div class="header-title">
                <label class="header-h"><img src='/static/bookstack.svg' class='book-logo'></label>
                <h3 class="header-h">Import New Book</h3></div>
            </slot>
          </div>

          <div class="modal-body clearfix">
            <slot name="body">
              <h4> Book Text </h4>

              <form enctype="multipart/form-data">


                <div class="col-sm-12">
                  <div class="col-sm-7">
                    <div class="input-group">
                      <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                      <input type="text" class="form-control" placeholder="URL"/>
                    </div>

                  </div>
                  <div class="col-sm-5">
                    or &nbsp;&nbsp;&nbsp;
                    <button class='btn btn-default' type="file">
                      <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;
                    </button>
                  </div>
                  <span class="help-block"> &nbsp; &nbsp; Book file or ZIP with files and images  </span>
                </div>

                <br><br><br>

                <div class="col-sm-12">
                  <div class="col-sm-6">
                    <div class="form-group">
                      <label for="booktype">Book Type:</label>
                      <select class="form-control" id="booktype">
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
                      <input type="text" class="form-control" placeholder="URL"/>
                    </div>
                  </div>
                  <div class="col-sm-5">
                    or &nbsp;&nbsp;&nbsp;
                    <button class='btn btn-default' type="file">
                      <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;
                    </button>
                  </div>
                  <span class="help-block"> &nbsp; &nbsp; Audio file, ZIP files or playlist </span>
                </div>

                <br><br><br><br>

                <button class="btn btn-primary modal-default-button" @click="$emit('close')">
                  <i class="fa fa-plus" aria-hidden="true"></i> &nbsp;  Import Book
                </button>



                <!-- <div class="info-field">
                  <div class="col-sm-6">
                    <input type="text" class="form-control" placeholder="URL">
                    <button class="btn btn-default">Submit</button>
                  </div>
                  <div class="col-sm-2">

                  </div>
                </div>

                <div class="info-field">
                  <div class="col-sm-6">
                    <input type="text" class="form-control" placeholder="Browse for File">
                 </div>
                  <div id="file_open_div" class="col-sm-2">
                    <input type="file" class="file_open" @change="onFileChange">
                    <button id="btn_open" class="btn btn-default">Browse</button>
                  </div>
                </div> -->

              </form>


            </slot>
          </div>

          <!-- <div class="modal-footer">
            <slot name="footer">
              <label>Drop file here</label>
              <div class="dropbox">
              </div>
              <br>
              <button class="btn btn-default modal-default-button" @click="$emit('close')">Close</button>
            </slot>
          </div> -->
        </div>
      </div>
    </div>
  </transition>

</template>


<script>

import axios from 'axios'

const BASE_URL = 'http://localhost:8080';

export default {
  data() {
    return {
        image: ''
    }
  },
  components: {
    axios
  },
  methods: {

    onFileChange(e) {
      console.log("upload");
      var fieldName = "upload_book";
      var fileList = e.target.files;
      console.log(fieldName);
      console.log(fileList[0]);
      if (fileList.length)
        return;
      const formData = new FormData();
      Array
        .from(Array(fileList.length).keys())
        .map(x => {
          formData.append(fieldName, fileList[x], fileList[x].name);
        });
      alert(formData);
      upload(formData);
    },

    upload(formData) {
      const url = `${BASE_URL}/upload_books/upload`;
      return axios.post(url, formData)
      // get data
      .then(x => x.data)
      // add url field
      .then(x => x.map(bk => Object.assign({},
          bk, { url: `${BASE_URL}/upload_books/${bk.id}` })));
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
