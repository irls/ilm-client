<template>
<ul ref="menu"
    class="click-menu"
    tabindex="-1"
    v-bind:style="{ visibility: viewMenu?'visible':'hidden', top:top, left:left }"
    @click="close">
    <!--@blur="close"-->
    <slot></slot>
    <!--<li>top: {{top}}</li>
    <li>left: {{left}}</li>-->
</ul>
</template>

<script>
import Vue from 'vue'

  export default {
    name: 'block-context-menu',
    props: [
        'update'
    ],
    data() {
      return {
            viewMenu: false,
            top: '0px',
            left: '0px'
        }
     },
    methods: {
        setMenu: function(x, y, target) {

            let dir = this.$refs.menu.getAttribute('dir') || 'top';
            x+= 2;
            if (x + $(this.$refs.menu).outerWidth() > $('.content-scroll-wrapper').outerWidth()) {
              x = $('.content-scroll-wrapper').outerWidth() - $(this.$refs.menu).outerWidth() - 10;
            }
            this.left = x + 'px';
            this.top = y + 'px';
            //this.top = y + window.pageYOffset + 'px';
            //this.top = y - this.$refs.menu.offsetHeight + 'px';

        },

        getSelectionCoords: function() {
          let sel = document.selection, range;
          let x = 0, y = 0, width = 0, height = 0;
          if (sel) {
              if (sel.type != "Control") {
                  range = sel.createRange();
                  x = range.boundingLeft;
                  y = range.boundingTop;
                  width = range.boundingWidth;
                  height = range.boundingHeight;
              }
          } else if (window.getSelection) {
              sel = window.getSelection();
              if (sel.rangeCount) {
                  range = sel.getRangeAt(0).cloneRange();
                  if (range.getBoundingClientRect) {
                      let rect = range.getBoundingClientRect();
                      x = rect.left;
                      y = rect.top;
                      width = rect.right - rect.left;
                      height = rect.bottom - rect.top;
                  }
              }
          }
          return { x: x, y: y, width: width, height: height };
        },

        close: function() {
            this.viewMenu = false;
            this.top = 0 + 'px';
            this.left = 0 + 'px';
            $('.medium-editor-toolbar').each(function(){
                $(this).css('visibility', '');
            });
            this.$emit('close');
        },

        open: function(ev, range, offsetX = 0, offsetY = 0) {
            ev.preventDefault();
            this.$root.$emit('closeBlockContextMenu');
            let coords = {};
            if (range.collapsed == true) {
              coords = this.getSelectionCoords();
              coords.x = coords.x + coords.width;
            } else {
              coords = {
                x: ev.clientX - offsetX,
                y: ev.clientY - offsetY
              }
            }
            coords.y = ev.layerY - offsetY;

            this.viewMenu = true;
            this.setMenu(coords.x, coords.y, ev.target);
            //this.$refs.menu.focus();
            Vue.nextTick(function() {
                this.setMenu(coords.x, coords.y, ev.target);
                let slots = this.$refs.menu.querySelector(`li`);
                if (slots) $('.medium-editor-toolbar-active').each(
                function(){
                  $(this).css('visibility', 'hidden');
                });
                //this.$refs.menu.focus();
            }.bind(this));
        }
    },
    mounted: function() {
      this.$root.$on('closeBlockContextMenu', ()=>{
        if(this.viewMenu) this.close();
      });
      this.$root.$on('closeBlockMenu', ()=>{
        if(this.viewMenu) this.close();
      });
      this.$root.$on('closeFlagPopup', ()=>{
        if(this.viewMenu) this.close();
      });
    }
  }
</script>

<style lang='less' scoped>

.click-menu{
    background: #FAFAFA;
    border: 1px solid #BDBDBD;
    box-shadow: 0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.2),0 1px 5px 0 rgba(0,0,0,.12);
    display: block;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
    width: 250px;
    z-index: 999999;
    outline: none;

    &:empty {
      border: none;
    }
}

.click-menu li {

    margin: 0;
    padding: 5px 10px;
    cursor: default;

    &.separator {
        border-bottom: 1px solid #E0E0E0;
        padding: 0;
    }
}

.click-menu li:last-child {
    border-bottom: none;
}

.click-menu li:hover {
    background: #1E88E5;
    color: #FAFAFA;
}
</style>
