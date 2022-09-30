<template>
  <span v-html="contentHtml"></span>
</template>
<script>
  import moment from 'moment';
  export default {
    data() {
      return {}
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
          //return '<a>asasas</a>';
          return this.comment.comment;
        }
      },
    }
  }
</script>
<style lang="less">
</style>
