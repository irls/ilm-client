import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      
    }
  },
  
  computed: {
    ...mapGetters(['playingBlock'])
  },
  
  methods: {
    setPlayingBlock(blockId, partIdx = null) {
      this.playingBlock.blockid = blockId;
      this.playingBlock.partIdx = partIdx;
      this.playingBlock.state = 'play';
      this.playingBlockId = blockId;
    },
    
    pausePlayingBlock() {
      this.playingBlock.state = 'pause';
    },
    
    resumePlayingBlock() {
      this.playingBlock.state = 'play';
    },
    
    stopPlayingBlock(blockid) {
      if (this.playingBlock.blockid === blockid) {
        this.playingBlock.blockid = null;
        this.playingBlock.partIdx = null;
        this.playingBlock.state = null;
      }
    }
  }
}