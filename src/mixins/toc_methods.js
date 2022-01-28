export default {
  data() {
    return {

    }
  },
  methods: {
    mixin_buildTOCStyle({blockType, styleKey, styleVal, classes} = {}) {
      //console.log(`mixin_buildTOCStyle: `, blockType, styleKey, styleVal, JSON.stringify(classes));
      //const newClasses = { ...classes }; //clone
      const newClasses = classes;

      if (blockType == 'title') { // ILM-2533
        if (newClasses.level) {
          delete newClasses.level;
        }
        if (styleKey == 'style') {
          newClasses.style = styleVal;
          if (styleVal != '') {
            newClasses['table of contents'] = {isInToc: 'off'};
          } else {
            newClasses['table of contents'] = {isInToc: 'on'};
          }
        }
        if (styleKey == 'table of contents') {
          if (styleVal == 'on') {
            newClasses.style = '';
          } else {
            //newClasses['style'] = this.blockTypes[blockType]['style'][1];
          }
          newClasses['table of contents'] = {isInToc: styleVal};
        }
      }
      if (blockType == 'header') { // ILM-2533
        if (styleKey == 'level') {
          newClasses.level = styleVal;
          switch(styleVal) {
            case 'h1' : {
              newClasses['table of contents'] = {isInToc: 'on', tocLevel: 'toc1'};
            } break;
            case 'h2' : {
              newClasses['table of contents'] = {isInToc: 'on', tocLevel: 'toc2'};
            } break;
            case 'h3' : {
              newClasses['table of contents'] = {isInToc: 'on', tocLevel: 'toc3'};
            } break;
            case 'h4' : {
              newClasses['table of contents'] = {isInToc: 'off', tocLevel: 'toc4'};
            } break;
          };
        }
        if (styleKey == 'table of contents') {
          if (typeof newClasses['table of contents'] !== 'object') {
            newClasses['table of contents'] = {};
          }
          if (['toc1','toc2','toc3','toc4'].indexOf(styleVal) >-1 ) {
            newClasses['table of contents'].tocLevel = styleVal;
          }
          switch(styleVal) {
            case 'toc4' : case 'off' :{
              newClasses['table of contents'].isInToc = 'off'
            } break;
            default: {
              newClasses['table of contents'].isInToc = 'on'
            } break;
          };
        }
      }
      //console.log(`mixin_buildTOCStyle.classes: `, JSON.stringify(newClasses));
      return newClasses;
    }
  }
}
