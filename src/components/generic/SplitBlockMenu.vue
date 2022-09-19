<template>
  <div>
    <div class="open-split-menu" v-on:click="toggleMenu()"></div>
    <ul class="click-menu" v-if="showMenu">
      <li class="icon-menu-item" v-if="allowRejoin" v-on:click="reJoin()">
        <i class="icon-menu -re-join"></i>Re-join narration split
      </li>
      <li class="icon-menu-item" v-if="allowSplit" v-on:click="split()">
        <i class="icon-menu -split-to-par"></i>Split into 2 paragraphs
      </li>
      <li class="icon-menu-item" v-if="allowRejoinAll" v-on:click="reJoinAll()">
        <i class="icon-menu -re-join"></i>Re-join all narration split
      </li>
    </ul>
  </div>
</template>
<script>
  export default {
    data() {
      return {
        showMenu: false
      }
    },
    name: 'split-block-menu',
    props: ['allowRejoin', 'allowSplit', 'allowRejoinAll', 'disabled', 'checkBeforeOpen', 'blockid', 'blockPartIdx'],
    mounted() {
      this.$root.$on('for-splitmenu:close', this.checkClose);
    },
    destroyed() {
      this.$root.$off('for-splitmenu:close', this.checkClose);
    },
    methods: {
      toggleMenu() {
        if (this.disabled) {
          this.showMenu = false;
          return;
        }
        if (!this.checkBeforeOpen()) {
          return;
        }
        this.showMenu = !this.showMenu;
        if (this.showMenu) {
          setTimeout(() => document.addEventListener('click', this.toggleMenu), 0);
        } else {
          document.removeEventListener('click', this.toggleMenu);
        }
      },
      reJoin() {
        this.$emit('reJoin');
        this.toggleMenu();
      },
      split() {
        this.$emit('split');
        this.toggleMenu();
      },
      reJoinAll() {
        this.$emit('reJoinAll');
        this.toggleMenu();
      },
      checkClose(blockPart) {
        if (this.showMenu) {
          this.toggleMenu();
        }
      }
    },
    watch: {
      disabled: {
        handler(val) {
          if (val && this.showMenu) {
            this.toggleMenu();
          }
        }
      }
    }
  }
</script>
<style lang="less">
  .open-split-menu {
    cursor: pointer;
    float: left;
    font-size: 20px;
  }
  .open-split-menu:after {
    content: '\2807';
  }
  .-re-join, .-split-to-par, .-re-join{
    font-size: 16px;
  }

</style>
