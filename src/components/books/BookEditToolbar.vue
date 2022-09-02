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

    <button v-if="(currRoute === 'BookEdit' || currRoute === 'CollectionBookEdit') && hasBookSelected()" class='btn btn-default' @click='toggleSearchVisible' v-tooltip.top="'Search'"><i class="fa fa-lg fa-search"></i></button>
    <OverlayPanel ref="searchPanel" :dismissable="false">
      <div class="search-box">
        <div class="search">
          <input ref="searchInBookInput" v-model="bookSearch.string" v-on:paste.prevent="onPaste" v-on:keyup.enter="scrollSearchDown" v-on:keyup.escape="toggleSearchVisible" type="text" class="form-control search-in-book" placeholder="Search"></input>
        </div>
        <div class="results"><span v-show="bookSearch.string.length > 2">{{getSearchCounters}}</span></div>
        <div class="buttons">
          <i class="fa fa-chevron-down" aria-hidden="true" @click='scrollSearchDown'></i>
          <i class="fa fa-chevron-up" aria-hidden="true" @click='scrollSearchUp'></i>
          <i class="fa fa-times" aria-hidden="true" @click='closeSearchBox'></i>
        </div>
      </div>
    </OverlayPanel>

    <button v-if='hasBookSelected()' class='btn btn-default btn-meta' @click='toggleMetaVisible'><i :class="[metaVisible ? 'fa-chevron-right': 'fa-chevron-left', 'fa fa-lg collapsebtn']" aria-hidden="true"></i>Details</button>

  </div>
</div>
</template>

<script>
import Vue from 'vue';
import ButtonRadioGroup from '../generic/ButtonRadioGroup';
import access from "../../mixins/access.js";
import taskControls from '../../mixins/task_controls.js';
import apiConfig from '../../mixins/api_config.js';
import { dropdown } from 'vue-strap';
import {mapGetters, mapActions} from 'vuex';
import OverlayPanel from 'primevue/overlaypanel';
import Tooltip from 'primevue/tooltip';
import { replaceSuperscript, replaceHTMLSpecials } from '@src/filters/search.js';

export default {
  data () {
    return {
      editModes: {
        //'BookEdit': 'Edit' ,
        //'BookNarrate': 'Narrate',
        //'BookProofread': 'Proofread',
        //'BookEditDisplay': 'Display'
      },
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

    getSearchCounters: function () {
      let searchPointer = this.bookSearch.searchPointer;
      if (this.bookSearch.resultCounter > 0) searchPointer += 1;
      return `${searchPointer}/${this.bookSearch.resultCounter}`;
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
    ...mapGetters([
      'currentBookMeta',
      'currentBookid',
      'currentBook',
      'storeListO',
      'isBlocked',
      'blockSelection',
      'adminOrLibrarian',
      'bookSearch'
    ])
  },
  methods: {

    viewSelect: function(val) {
      if (this.$route.params.block) {
        this.$router.push({ name: val, params: { block: this.$route.params.block } });
      } else if (this.storeListO.meta && this.currentBookid == this.storeListO.meta.bookid && this.storeListO.startId) {
        this.$router.push({ name: val, params: { block: this.storeListO.startId } });

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
    setSelectedRoute() {
      if (this.$route && this.editModesAvailable) {
        for (let i in this.editModesAvailable) {
          if (this.$route.name === i && this.$refs.modesButton.selected !== this.$route.name) {
            this.$refs.modesButton.selected = this.$route.name;
          }
        }
      }
    },
    toggleSearchVisible(ev) {
      this.bookSearch.string = "";
      this.$refs.searchPanel.toggle(ev);
      Vue.nextTick(()=>{
        if (this.$refs.searchInBookInput && this.$refs.searchPanel.visible) {
          this.$refs.searchInBookInput.focus();
        }
      });
    },
    scrollSearchDown(ev) {
      this.$root.$emit('from-book-edit-toolbar:scroll-search-down');
    },
    scrollSearchUp(ev) {
      this.$root.$emit('from-book-edit-toolbar:scroll-search-up');
    },
    closeSearchBox(ev) {
      this.bookSearch.string = "";
      this.$refs.searchPanel.hide(ev);
    },
    onPaste(ev) {
      const clipboard = (ev.clipboardData || window.clipboardData)
      let paste = clipboard.getData('text/html');
      paste = paste.length ? paste : clipboard.getData('text/plain');
      const wordXreg = new RegExp("<body[\\s\\S]+<\\/body>", 'mi');
      if (wordXreg.test(paste)) {
        paste = wordXreg.exec(paste)[0];
      }
      console.log(`paste000: `, paste);
      //-- Gutenberg -- { --//
      paste = paste.replace(/<a[^>]*?>[^<]*?<\/a>/mig, '');
      paste = paste.replace(/<span\sclass="pagenum".*?<\/span>/mig, '');
      paste = paste.replace(/(<\/p>)(<p)/mig, '$1 $2');
      paste = paste.replace(/\s*style=\"[^\">]*\"/mig, '');
      //-- } -- end -- Gutenberg --//
      //console.log(`paste001: `, paste);
      paste = paste.replace(/<\/*\s*span>/mig, '');
      //console.log(`paste111: `, paste);
      paste = replaceHTMLSpecials(paste);
      paste = replaceSuperscript(paste);
      //console.log(`paste222: `, paste);
      paste = paste.replace(/(<([^>]+)>)/ig, '');
      paste = paste.replace(/[\r\n]+/mig, ' ').replace(/\s\s+/g, ' ');
      console.log(`paste: `, paste);

      const start = ev.target.selectionStart;
      const finish = ev.target.selectionEnd;

      if (start || finish) {
        const splitArray = [
          this.bookSearch.string.slice(0, start), this.bookSearch.string.slice(finish)
        ]
        this.bookSearch.string = (splitArray[0]+paste+splitArray[1]).trim();
      }
      else {
        this.bookSearch.string = paste.trim();
      }

    },
    ...mapActions(['setBlockSelection'])
  },
  components: {
    ButtonRadioGroup,
    dropdown,
    OverlayPanel,
  },
  directives: {
    'tooltip': Tooltip
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
      this.setSelectedRoute();
      if (['BookEdit', 'CollectionBookEdit'].indexOf(toRoute.name) == -1) {
        this.bookSearch.string = "";
        this.$refs.searchPanel.hide();
      }
    },
    'editModesAvailable': {
      handler(val) {
        this.setSelectedRoute();
      }
    }
  },
  mounted() {
    this.bookSearch.string = "";
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
      margin-left: 20px;
    &:focus {
      background: rgb(255, 255, 255);
      border-color: rgb(204, 204, 204);
    }
    .collapsebtn {
      margin-right: 5px;
    }
  }

  &.booksbtn {
    margin-right: 20px;
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

.search-box {
  display: flex;
  align-items: flex-start;
  flex-wrap: nowrap;
  height: 33px;

  .search {
    width: 300px;
    padding-right: 1rem;
  }

  .results {
    padding-top: 8px;
    padding-right: 1rem;
  }

  .buttons {
    user-select: none;
    .fa {
      margin-left: 3px;
      padding-top: 8px;

      &.fa-times {
        margin-left: 7px;
      }
    }
  }
}
/*.search-box {
  min-width: 400px;
  height: 33px;

  .search {
    width: 70%;
  }
  .results {
    min-width: 30px;
    padding-top: 8px;
  }
  .buttons {
    &.right {
      float: right;
    }
    .fa {
      margin-left: 3px;
      padding-top: 8px;

      &.fa-times {
        margin-left: 7px;
      }
    }
  }
}*/

</style>
