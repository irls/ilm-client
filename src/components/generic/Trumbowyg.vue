<template>
  <div id="trumbowyg-editor"></div>
</template>

<style lang="scss">
  @import './trumbowyg.scss';
</style>
<style scoped>
  .trumbowyg-editor {padding: 10px;}
</style>

<script>
  import 'trumbowyg';
  export default {
    mounted() {
      $.trumbowyg.svgPath = this.svgPath;
      $('#trumbowyg-editor')
        .trumbowyg({
          lang: this.language,
          btns: [
              ['viewHTML'],
              // ['formatting'],
               'btnGrp-semantic',
              ['superscript', 'subscript'],
              ['link'],
              // ['insertImage'],
              //  'btnGrp-justify',
               'btnGrp-lists',
              // ['horizontalRule'],
              ['removeformat'],
              // ['fullscreen']
          ],
          removeformatPasted: true,
          autogrow: true,
          events: {
            'insertParagraph': function (evt) {
              if (evt.which === 13 || evt.keyCode === 13)
                  evt.shiftKey = true;
            }
          },
        })
        .on('tbwchange', this.onChange);
      $('#trumbowyg-editor').trumbowyg('html', this.content);
    },
    props: {
      content: {
        type: String,
        default: '',
      },
      language: {
        type: String,
        default: 'en',
      },
      svgPath: {
        type: String,
        default: '/ui/icons.svg',
      },
    },
    methods: {
      onChange() {
        const content = $('#trumbowyg-editor').trumbowyg('html');
        this.$emit('tbwchange', content);
      },
    },
  };
</script>
