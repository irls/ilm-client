<template>
<div class="toolbar">

  <h3 v-if="$store.state.currentBook" class='title'>
    <i class="fa fa-pencil"></i> {{$store.state.currentBookMeta.title}}</h3>

  <div class="pull-right">

    <!-- Back to Books Button -->
    <button @click="goBack" class='booksbtn btn btn-default'>
      <i class="fa fa-chevron-left fa-lg"></i> Back <i class="fa fa-book "></i>
    </button>

    <template v-if="tc_hasTask('content_cleanup')">
      <dropdown text="Download" type="default">
          <li>
            <a :href="getCurrentBookUrl('html')"
              target="_blank" class="" >As HTML</a>
          </li>
          <li>
            <a :href="getCurrentBookUrl('zip')"
              target="_blank" class="">As ZIP</a>
          </li>
      </dropdown>

      <button class="btn btn-default" @click="showBookReimport = true">Re-Import</button>

      <BookReimport v-if="showBookReimport"
        :multiple="false"
        @close_modal="reimportBookClose"
        :bookId="getBookid()" />
    </template>

    <ButtonRadioGroup id='viewmode' :values="editModes" @changeEditMode='viewSelect' :selected="editMode" :default="editMode"></ButtonRadioGroup>

    <button v-if='hasBookSelected()' class='btn btn-default btn-meta' @click='toggleMetaVisible'><i :class="[metaVisible ? 'fa-chevron-right': 'fa-chevron-left', 'fa fa-lg collapsebtn']" aria-hidden="true"></i>Meta</button>

  </div>
</div>
</template>

<script>
import ButtonRadioGroup from '../generic/ButtonRadioGroup'
import access from "../../mixins/access.js"
import taskControls from '../../mixins/task_controls.js';
import apiConfig from '../../mixins/api_config.js'
import { dropdown } from 'vue-strap';
import BookReimport from './BookReimport'

export default {
  data () {
    return {
      editMode: 'Editor',
      editModes: {
        'Editor': 'Editor',
        //'HTML': 'HTML',
        //'JSON': 'JSON',
        'Display': 'Display'
      },
      //currentBook: this.$store.state.currentBook,
      showBookReimport: false
    }
  },
  mixins: [access, taskControls, apiConfig],
  props: [
    'hasBookSelected',
    'toggleMetaVisible',
    'metaVisible'
  ],
  methods: {
    currentBook: function() {
      return this.$store.state.currentBook
    },
    getEditMode: function() {
      let editMode = this.$store.state.editMode
      return editMode
    },
    viewSelect: function(val) {
      this.editMode = val
      this.$store.commit('setEditMode', this.editMode)
    },
    goBack: function() {
      let currentBookid = this.$store.state.currentBookid
      let path = '/books' + (currentBookid?'/'+currentBookid:'')
      this.$router.push(path)
    },
    getCurrentBookUrl(format) {
      return this.API_URL + 'books/' + this.$store.state.currentBookid +  "/" + format;
    },
    getBookid() {
      return this.$store.state.currentBookid
    },
    reimportBookClose() {
      this.showBookReimport = false;
    }
  },
  components: {
    ButtonRadioGroup,
    dropdown,
    BookReimport
  },
  // watch: {
  //   'this.editMode' () {
  //     this.editModeChange()
  //     console.log('Watcher for editmode')
  //   }
  // },
  // events: {
  //   changeEditMode: function(editMode) {
  //     this.editMode = editMode
  //     console.log('Caught event changeEditMode', editMode)
  //   }
  // },
  created: function () {
    if (!this.isAdmin) delete this.editModes.JSON;
  }
}
</script>


<style lang="less" scoped >

.toolbar {
  width:inherit;
  position: fixed;
  z-index: 9999;
  margin-top: -20px;
  background: #FFFFFF;
}

h3 {
  margin: 0;
  padding-top: 0;
  display: inline-block;
}

.btn {
  margin-right: .5em;

  &.btn-meta {
      margin-left: 40px;
    &:focus {
      background: rgb(255, 255, 255);
      border-color: rgb(204, 204, 204);
    }
    .collapsebtn {
      margin-right: 5px;
    }
  }

  &.booksbtn {
    margin-right: 40px;
  }
}

select {
  margin-top: -.25em;
  width: 8em; padding:0;
  height: 2em;
}


button:hover {
  color: darkgreen;
  background: #F0FFF0;
}

/*#viewmode, button.booksbtn {
  display: inline; float: right; padding-left: 10px; padding-right: 10px;
}*/

h3.title i {
  font-size: 24pt;
}

</style>
