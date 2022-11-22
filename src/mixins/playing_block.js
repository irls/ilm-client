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
      this.playingBlock.playingPauseAfter = false;
      this.playingBlockId = blockId;
    },
    
    pausePlayingBlock(blockid, partIdx) {
      if (this.playingBlock.blockid === blockid && (this.playingBlock.partIdx === null || this.playingBlock.partIdx === partIdx)) {
        this.playingBlock.state = 'pause';
      }
    },
    
    resumePlayingBlock() {
      this.playingBlock.state = 'play';
    },
    
    stopPlayingBlock(blockid) {
      if (this.playingBlock.blockid === blockid) {
        this.playingBlock.blockid = null;
        this.playingBlock.partIdx = null;
        this.playingBlock.state = null;
        this.playingBlock.playingPauseAfter = false;
      }
    },
    
    playPause(blockid, length) {
      this.setPlayingBlock(blockid);
      this.playingBlock.playingPauseAfter = true;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          return resolve();
        }, length * 1000);
      });
    },
    
    playSubblockPause(blockid, length) {
      this.setPlayingBlock(blockid);
      this.playingBlock.playingPauseAfter = true;
    },
    
    stopPause() {
      if (this.playingBlock.playingPauseAfter) {
        this.playingBlock.state = 'pause';
      }
    },
    
    resumePause() {
      if (this.playingBlock.playingPauseAfter) {
        this.playingBlock.state = 'play';
      }
    },
    
    checkPlayingBlock(blockid) {
      return this.playingBlock.state === 'play' && this.playingBlock.blockid === blockid;
    }
  }
}