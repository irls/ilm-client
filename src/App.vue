<template>
  <div id="app">
    <MainMenu v-if="isLoggedIn"></MainMenu>
    <router-view v-if="isLoggedIn"></router-view>
    <Login v-if="!isLoggedIn"></Login>

    <nav :class="['navbar', 'fixed-bottom', 'navbar-light', 'bg-faded', {'hidden': !showAudioeditor}, audioeditorMode]" >
      <div v-if="preloader" :class="['audio-process-run', 'preloader-' + preloaderType]"></div>
      <AudioEditor ref="audioEditor"></AudioEditor>
    </nav>
    <!-- <CanvasAbsolute/> -->
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import MainMenu from './components/MainMenu'
import Login from './components/login'
import AudioEditor from './components/AudioEditor'

export default {

  name: 'App',

  data() {
    return {
      preloader: false,
      preloaderType: ''
    }
  },

  components: {
    MainMenu, Login, AudioEditor
    // , CanvasAbsolute
  },

  computed: {
    showAudioeditor: {
      get() {
        return this.$refs.audioEditor && !this.$refs.audioEditor.isEmpty;
      },
      cache: false
    },
    audioeditorMode: {
      get() {
        return '-mode-' + (this.$refs.audioEditor ? this.$refs.audioEditor.mode : '');
      },
      cache: false
    },
    ...mapGetters(['isLoggedIn', 'currentCollectionId']),
  },

  watch: {
    '$route' () {
      this.$root.$emit('for-audioeditor:force-close');
      let mode = this.$route.meta && this.$route.meta.mode ? this.$route.meta.mode : null;
      if (this.$route.name === 'BookEditDisplay') {
        mode = 'display';
      }
      this.$store.commit('set_book_mode', mode);
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.loadBook(this.$route.params.bookid)
      } else {
        this.loadBook(false);
      }
      if (this.$route.params.hasOwnProperty('collectionid')) {
        if (this.$route.params.collectionid !== this.currentCollectionId) {
          this.loadCollection(this.$route.params.collectionid);
        }
      } else {
        this.loadCollection(false);
      }
      if (this.$route.params.hasOwnProperty('libraryid')) {
        this.loadLibrary(this.$route.params.libraryid);
      } else {
        this.loadLibrary(false);
      }
    }
  },

  created () {
    window.addEventListener('beforeunload', this.stopWatchLiveQueries)
    let mode = this.$route.meta && this.$route.meta.mode ? this.$route.meta.mode : null;
    if (this.$route.name === 'BookEditDisplay') {
      mode = 'display';
    }
    this.$store.commit('set_book_mode', mode);
  },

  methods: {
    ...mapActions(['loadBook', 'updateBooksList', 'loadCollection', 'loadLibrary']),
    //doesn't work from store in case with beforeDestroy
    stopWatchLiveQueries(){
      this.$store.state.liveDB.stopWatch('metaV');
      this.$store.state.liveDB.stopWatch('job');
      this.$store.state.liveDB.stopWatch('blockV');
      this.$store.state.liveDB.stopWatch('task');
    },
  },
  beforeDestroy () {
    window.removeEventListener('beforeunload', this.stopWatchLiveQueries)
  }
}
</script>

<style lang="less">
  html, body, #app {
    height: 100%;
    overflow: hidden;
  }
  #app {
    display:flex;
    flex-direction: column;

    .fixed-bottom {
      position: relative;
      border: 1px solid black;
      border-radius: 0px;
      width: 100%;
      min-height: 215px;
      height: auto;
      margin-bottom: 0px;
      z-index: 990;
      &.-mode-file {
          min-height: 183px;
      }
    }
  }

  .area-wrapper {
    flex-grow: 2;
    overflow-y:auto;

    padding-top: 0px;

    margin-bottom: 0px;
    padding-bottom: 0px;

  }


  #app {
    /*primeVue components fixes*/
    .p-component {
      font-size: 1.4rem;
    }
    .p-component .vue-codemirror * {
      box-sizing: initial;
    }
  }

  .p-component.p-tooltip {
    .p-tooltip-text {
      font-size: 1.4rem;
    }
  }

</style>
