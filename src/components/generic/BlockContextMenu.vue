<template>
<ul ref="menu"
    class="click-menu"
    tabindex="-1"
    v-bind:style="{ visibility: viewMenu?'visible':'hidden', top:top, left:left }"
    @blur="closeMenu"
    @mouseleave="closeMenu"
    @click="closeMenu">
    <slot></slot>
    <li>top: {{top}}</li>
    <li>left: {{left}}</li>
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
            //console.log('x:', x, 'y:', y);
            //console.log('window.pageYOffset', window.pageYOffset);

            let dir = this.$refs.menu.getAttribute('dir') || 'top';

            this.left = x + 2 + 'px';
            this.top = y + window.pageYOffset + 'px';

        },

        closeMenu: function() {
            this.viewMenu = false;
            this.top = 0 + 'px';
            this.left = 0 + 'px';
        },

        open: function(e) {
            e.preventDefault();
            this.viewMenu = true;
            this.setMenu(e.x, e.y, e.target);
            this.$refs.menu.focus();

            Vue.nextTick(function() {
                this.setMenu(e.x, e.y, e.target);
                this.$refs.menu.focus();
            }.bind(this));

            //console.log('target', e.target);
            //console.log('target.offsetParent', e.target.offsetParent);
            //console.log('selection', window.getSelection());
        }
    },
    watch: {

    },
    computed: {

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
