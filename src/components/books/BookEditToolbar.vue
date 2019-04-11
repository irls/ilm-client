<template>
<div class="toolbar">

  <h3 v-if="currentBook" class='title'>
    <i class="fa fa-minus-square-o -smaller-uncheck" aria-hidden="true"
      v-if="blockSelection.start._id"
      v-on:click="clearRangeSelection()"></i>
    <i v-else :class="['fa fa-pencil', isBlocked ? '-blocked':'-free']"></i>
    {{currentBookMeta.title}}
  </h3>

  <div class="pull-right">

    <!-- Back to Books Button -->
    <button @click="goBack" class='booksbtn btn btn-default'>
      <i class="fa fa-chevron-left fa-lg"></i> Back <i class="fa fa-book "></i>
    </button>

    <template v-if="tc_allowEditingComplete()">
      <button class="btn btn-default" @click="$root.$emit('book-reimport-modal')">Re-Import</button>
    </template>

    <ButtonRadioGroup ref="modesButton" :values="editModesAvailable" :default="currRoute" @onChange='viewSelect'></ButtonRadioGroup>

    <button v-if='hasBookSelected()' class='btn btn-default btn-meta' @click='toggleMetaVisible'><i :class="[metaVisible ? 'fa-chevron-right': 'fa-chevron-left', 'fa fa-lg collapsebtn']" aria-hidden="true"></i>Details</button>

  </div>
</div>
</template>

<script>
import ButtonRadioGroup from '../generic/ButtonRadioGroup'
import access from "../../mixins/access.js"
import taskControls from '../../mixins/task_controls.js';
import apiConfig from '../../mixins/api_config.js'
import { dropdown } from 'vue-strap';
import {mapGetters, mapActions} from 'vuex';

export default {
  data () {
    return {
      editModes: {
        'BookEdit': 'Edit' ,
        'BookNarrate': 'Narrate',
        'BookProofread': 'Proofread',
        'BookEditDisplay': 'Display'
      }
    }
  },
  mixins: [access, taskControls, apiConfig],
  props: [
    'hasBookSelected',
    'toggleMetaVisible',
    'metaVisible'
  ],
  computed: {

    currRoute: function () {
      let result = ''
      return this.$route.name;
    },

    editModesAvailable: {
      get() {
        let modes;
        if (this.$route.path.indexOf('/collections') === 0) {
          modes = {
            'CollectionBookEdit': 'Edit',
            'CollectionBookNarrate': 'Narrate',
            'CollectionBookProofread': 'Proofread',
            'CollectionBookEditDisplay': 'Display'
          }
          if (!this.tc_showProofreadTab()) {
            delete modes['CollectionBookProofread'];
          }
          if (!this.tc_showNarrateTab()) {
            delete modes['CollectionBookNarrate'];
          }
          if (!this.tc_showEditTab()) {
            delete modes['CollectionBookEdit'];
          }
        } else {
          modes = {
            'BookEdit': 'Edit' ,
            'BookNarrate': 'Narrate',
            'BookProofread': 'Proofread',
            'BookEditDisplay': 'Display'
          }
          if (!this.tc_showProofreadTab()) {
            delete modes['BookProofread'];
          }
          if (!this.tc_showNarrateTab()) {
            delete modes['BookNarrate'];
          }
          if (!this.tc_showEditTab()) {
            delete modes['BookEdit'];
          }
        }
        return modes;
      }
    },
    ...mapGetters(['currentBookMeta', 'currentBookid', 'currentBook', 'storeListO', 'isBlocked', 'blockSelection', 'adminOrLibrarian'])
  },
  methods: {

    viewSelect: function(val) {
      if (this.$route.params.block) {
        this.$router.push({ name: val, params: { block: this.$route.params.block } });
      } else if (this.storeListO.meta && this.currentBookid == this.storeListO.meta.bookid && this.storeListO.firstVisibleId) {
        this.$router.push({ name: val, params: { block: this.storeListO.firstVisibleId } });

      } else this.$router.push({ name: val });
    },
    goBack: function() {
      if (this.currentBookMeta && this.currentBookMeta.collection_id) {
        let currentBookid = this.$store.state.currentBookid
        let path = '/collections/' + this.currentBookMeta.collection_id + '/' + (currentBookid?currentBookid:'')
        this.$router.push(path)
      } else {
        let currentBookid = this.$store.state.currentBookid
        let path = '/books' + (currentBookid?'/'+currentBookid:'')
        this.$router.push(path)
      }
    },
    getCurrentBookUrl(format) {
      return this.API_URL + 'books/' + this.$store.state.currentBookid +  "/download/" + format;
    },
    clearRangeSelection() {
      this.setBlockSelection({start: {}, end: {}});
    },
    ...mapActions(['setBlockSelection'])
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
  },
  watch: {
    '$route' (toRoute, fromRoute) {
      if (toRoute && this.$refs.modesButton) {
        for (let i in this.$refs.modesButton.values) {
          if (toRoute.name === i && this.$refs.modesButton.selected !== toRoute.name) {
            this.$refs.modesButton.selected = toRoute.name;
          }
        }
      }
    },
  },
  mounted() {
    
  },
  destroyed: function () {

  },
  beforeDestroy: function() {
    
  }
}
</script>


<style lang="less" scoped >

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

/*select {
  margin-top: -.25em;
  width: 8em; padding:0;
  height: 2em;
}*/


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

.fa {
  &.fa-pencil {
    vertical-align: middle;
    line-height: 27pt;

    &.-blocked {
      color: red;
    }
    &.-free {
      color: green;
    }
  }
  &.-smaller-uncheck {
    vertical-align: middle;
    line-height: 27pt;
    padding-left: 2px;
    width: 27px;
  }
}

</style>
