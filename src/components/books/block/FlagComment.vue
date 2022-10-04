<template>
  <span v-html="contentHtml" v-on:mouseenter="onMouseEnter" v-on:mouseleave="onMouseLeave"></span>
</template>
<script>
  import Vue from 'vue';
  import moment from 'moment';
  import Tooltip from 'primevue/tooltip';

  export default {
    data() {
      return {
        urlRx: /((\b(?:https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]))/mig,
        links: []
      }
    },
    props: ['comment'],
    directives: {
      'tooltip': Tooltip
    },
    methods: {
      onMouseEnter(ev) {
        // const container = ev.target;
        // this.links = container.querySelectorAll('a');
        // for (let link of this.links) {
        //   Tooltip.bind(link, {value: link.getAttribute('href'), modifiers: {top: true}});
        // }
      },
      onMouseLeave(ev) {
        // for (let link of this.links) {
        //   Tooltip.unbind(link);
        // }
      }
    },
    computed: {
      contentHtml: {
        get() {
          return `<i>${this.comment.creator}</i>&nbsp;(${this.created_at}): ${this.content}`;
        }
      },
      created_at: {
        get() {
          return moment(this.comment.created_at).format("D MMM");
        }
      },
      content: {
        get() {
          return (
            this.comment.comment
            .replace(this.urlRx, '<a href="$1" target="_blank" data-except-link-prevent v-tooltip="\'Enter your username\'" >Link</a>')
          )
        }, cache: false
      },
    }
  }
</script>
<style lang="less">
  .p-tooltip.p-component.p-tooltip-top {
    z-index: 1;
    max-width: 30em;
  }
</style>
