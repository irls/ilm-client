<template>
  <span v-html="contentHtml"></span>
</template>
<script>
  import moment from 'moment';
  export default {
    data() {
      return {
        urlRx: /((\b(?:https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]))/mig,
      }
    },
    props: ['comment'],
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
            .replace(this.urlRx, '<a href="$1" target="_blank" data-except-link-prevent >Link</a>')
          )
        }
      },
    }
  }
</script>
<style lang="less">
</style>
