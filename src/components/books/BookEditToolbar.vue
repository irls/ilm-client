<template>
  <table class="toolbar"><tr>
    <td>
      <h3 v-if="$store.state.currentBook" class='title'>
        <i class="fa fa-pencil"></i> {{$store.state.currentBook.title}} </h3>
    </td>

    <td class='right'>
      <div class='right'>

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
          <button class="btn btn-default">Re-Import</button>
        </template>

        <!-- <ButtonRadioGroup id='viewmode' :values="editModes" @changeEditMode='viewSelect' :selected="editMode" :default="editMode"></ButtonRadioGroup> -->

      </div>
    </td>
</tr></table>
</template>

<script>
import ButtonRadioGroup from '../generic/ButtonRadioGroup'
import access from "../../mixins/access.js"
import taskControls from '../../mixins/task_controls.js';
import apiConfig from '../../mixins/api_config.js'
import { dropdown } from 'vue-strap';

export default {
  data () {
    return {
      editMode: 'Editor',
      editModes: {
        'Editor': 'Editor',
        'HTML': 'HTML',
        'JSON': 'JSON',
        'Display': 'Display'
      },
      //currentBook: this.$store.state.currentBook,

    }
  },
  mixins: [access, taskControls, apiConfig],
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
    }
  },
  components: {
    ButtonRadioGroup,
    dropdown
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


<style scoped >

.toolbar {width: 100%; height: 4em; box-shadow: 0px 0px 3px 2px rgba(178, 191, 224, 0.53); }
.toolbar tr {}
.toolbar td {padding: 5px; width: auto; position: relative;}
.toolbar td.right {text-align: right;  width: 60%; padding-right: 1em;}
.toolbar button, .toolbar select {display: inline !important;}

div.right {text-align: right;}

h3 {
  padding-left: .35em; margin-top:.4em;
}
h3 i.fa-pencil {
  opacity: .75;
  color: #337ab7;
  padding-right: .3em;
}

.tools {
  text-align: right !important;
  position: inline !important;
  padding-top: 15px; border: 1px solid green;
  float: right
}
select {
  margin-top: -.25em;
  width: 8em; padding:0;
  height: 2em;
}

button_ {
  background: white;
  border: 1px solid silver;
  border-radius: 3px;
  padding: 3px; padding-right: 5px;
}
button:hover {
  color: darkgreen;
  background: #F0FFF0;
}

#viewmode, button.booksbtn {
  display: inline; float: right; padding-left: 10px; padding-right: 10px;
}

h3.title i {
  font-size: 24pt;
}

</style>
