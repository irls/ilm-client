<template>
<ul ref="menu"
    class="flag-popup"
    tabindex="-1"
    v-bind:class="{ '-under': under, '-over': !under }"
    v-bind:style="{ visibility: viewMenu?'visible':'hidden', top:top, left:left }">
    <!--@blur="close"
    @mouseleave="close"
    @click="close">-->
    <slot></slot>
</ul>
</template>

<script>
import Vue from 'vue'

  export default {
    name: 'block-flag-popup',
    props: [
        'update',
        'canDeleteFlagPart',
        'delFlagPart',
        'resolveFlagPart',
        'reopenFlagPart'
    ],
    data() {
      return {
          viewMenu: false,
          top: '0px',
          left: '0px',
          under: true,
          flagId: false,
          lastEvent: false
        }
     },
    methods: {
        setMenu: function(x, y, target) {

            let dir = this.$refs.menu.getAttribute('dir') || 'top';
            let rect = target.getBoundingClientRect();

            switch(dir) {
              case 'top' :
              {
                  if (rect.top < this.$refs.menu.offsetHeight) {
                      this.under = false;
                      this.top = rect.bottom + window.scrollY + 0 + 'px';
                  } else {
                      this.under = true;
                      this.top = rect.top + window.scrollY - this.$refs.menu.offsetHeight - 5 + 'px';
                  }
                  this.left = rect.left + 'px';
              }
              break;
              default : // case bottom
              {
                  if (window.innerHeight < y + this.$refs.menu.offsetHeight) {
                      this.top = - this.$refs.menu.offsetHeight - 5 + 'px';
                  } else {
                      this.top = target.offsetHeight + 'px';
                  }
                  this.left = 0 + 'px';
              }
              break;
          };
        },

        close: function() {
          this.viewMenu = false;
          this.top = 0 + 'px';
          this.left = 0 + 'px';
        },

        open: function(ev, flagId) {
          if (ev.preventDefault) ev.preventDefault();
          this.$root.$emit('closeFlagPopup', flagId);

          if (this.viewMenu == true && flagId === this.flagId) return this.close();

          this.lastEvent = ev;
          this.flagId = flagId;
          this.viewMenu = true;
          this.setMenu(ev.clientX, ev.clientY, ev.target);

          Vue.nextTick(function() {
              this.setMenu(ev.clientX, ev.clientY, ev.target);
          }.bind(this));
        },

        reset: function() {
          let ev = this.lastEvent;
          this.setMenu(ev.clientX, ev.clientY, ev.target);

          Vue.nextTick(function() {
              this.setMenu(ev.clientX, ev.clientY, ev.target);
          }.bind(this));
        }
    },
    mounted: function() {
      this.$root.$on('closeFlagPopup', (flagId)=>{
        if (flagId !== this.flagId) this.close();
      });
      this.$root.$on('closeBlockMenu', ()=>{
        this.close();
      });
      this.$root.$on('closeBlockContextMenu', ()=>{
        this.close();
      });
    }
  }
</script>

<style lang='less' scoped>

.flag-popup{
    background: #FAFAFA;
    border: 1px solid #BDBDBD;
    box-shadow: 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
    display: block;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
    z-index: 999999;
    outline: none;

/*    max-height: 350px;
    overflow:scroll;
    overflow-x:hidden;
    overflow: hidden;*/

    &.-over::before, &.-under::after {
      content: "";
      position: absolute;
      width: 0;
      height: 0;
      box-sizing: border-box;
      transform-origin: 0 0;

    }

    &.-under::after {
      left: 4px;
      transform: rotate(-45deg);
      border: 6px solid black;
      border-color: transparent transparent #FAFAFA #FAFAFA;
      bottom: -12px;
      box-shadow: -2px 2px 2px 0 rgba(0, 0, 0, 0.25);
    }

    &.-over::before {
      left: 18px;
      transform: rotate(135deg);
      border: 6px solid black;
      border-color: transparent transparent #FAFAFA #FAFAFA;
      top: 1px;
      box-shadow: -2px 2px 2px 0 rgba(0, 0, 0, 0.15);
    }
}

.flag-popup {
  margin: 0;
  padding: 5px 10px;
  font-size: 16px;
  width: 340px;
  text-align: left;

  textarea {
    resize: none;
  }

  li {
    margin: 0;
    cursor: default;

    &.separator {
      border-bottom: 1px solid #E0E0E0;
      padding: 0;
    }

    &:last-child {
      border-bottom: none;
    }

    .flag-header {
      font-size: 22px;
    }

    .flag-content {
      font-size: 14px;
      margin-bottom: 5px;
    }

    .flag-control {
      cursor: pointer;
      font-size: 16px;
      line-height: 32px;
    }

    .flag-comment {
      margin-bottom: 3px;
    }

    .glyphicon {
      &.flag-resolved {
        color: green;
        margin-right: 5px;
      }
      &.flag-open {
        color: red;
        margin-right: 5px;
      }
      &.flag-hidden {
        color: grey;
        margin-right: 5px;
      }
    }
  }
  .flag-control {
    font-size: 16px;
    line-height: 26px;
  }
  .flag-comment {
    width: 100%;
  }
}

/*.flag-popup li:hover {
    background: #1E88E5;
    color: #FAFAFA;
}*/

</style>
