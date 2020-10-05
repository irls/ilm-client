<template>
<section>
<label v-for="sVal in styleArr"
  @click="selectStyle(blockType, styleKey, sVal)"
  class="block-style-label"
  :key="blockType + styleKey.replace(/\s/g, '') + sVal"
  :id="blockType + styleKey.replace(/\s/g, '') + sVal">
  <!--{{styleKey}}->{{sVal}}->{{parseStyle(styleTabs.get(blockType), styleKey)}}-->
  <template v-if="parseStyle(styleTabs.get(blockType), styleKey).size > 1">
    <i class="fa fa-dot-circle-o"
    v-if="parseStyle(styleTabs.get(blockType), styleKey).has(sVal.length?sVal:'none')"
    ></i>
    <i v-else class="fa fa-circle-o"></i>
  </template>

  <template v-else>
    <i v-if="parseStyle(styleTabs.get(blockType), styleKey).has(sVal.length?sVal:'none')"
    class="fa fa-check-circle-o"></i>
    <i v-else class="fa fa-circle-o"></i>
  </template>

  <template v-if="!sVal.length">{{styleValue(blockType, styleKey, 'none')}}</template>
  <template v-else-if="styleTabs['lang']">{{styleValue(blockType, styleKey, sVal, styleTabs['lang'])}}</template>
  <template v-else-if="sVal.length">{{styleValue(blockType, styleKey, sVal, 'en')}}</template>

</label>
</section>
</template>
<script>
  export default {
    name: 'BlockStyleLabels',
    data() {
      return {}
    },
    props: ['blockType', 'styleArr', 'styleKey', 'styleTabs', 'styleValue'],
    mixins: [],
    computed: {
    },
    methods: {
      selectStyle(blockType, styleKey, sVal) {
        //console.log('selectStyle', blockType, styleKey, sVal);
        if (!this.parseStyle(this.styleTabs.get(blockType), styleKey).has(sVal.length?sVal:'none') || this.parseStyle(this.styleTabs.get(blockType), styleKey).size > 1) {
          this.$emit('selectStyleEv', blockType, styleKey, sVal);
        }
      },
      parseStyle(parentMap, styleKey) {
        //console.log('this.styleTabs', this.styleTabs['lang']);
        //console.log('styleKey', styleKey);
        let tmpArr = styleKey.split('.');
        let result = parentMap.get(tmpArr.shift());
        while (tmpArr.length > 0) {
          result = result.get(tmpArr.shift());
        }
        result = result || [];
        return (result instanceof Map) ? result : new Map(result);

      }
    }
  }
</script>
<style scoped lang="less">
.block-style-tabs {
    .block-style-fieldset {
      float: left;
      width: 32%;

      &.block-num-fieldset {

        width: 97%;
        clear: both;
        display: block;

        i.fa-check-square-o.-checked {
          color: #303030;
          &:hover {
            color: #303030;
          }
        }

        i.fa-square-o:hover,
        i.fa-check-square-o:hover,
        i.fa-plus-square-o:hover {
          color: gray;
        }

        .block-style-label {
          width: 50%;
          float: left;
        }

        ul, li {
          padding: 0;
          margin: 0;
          list-style: none;
        }
        ul {
          display: flex;
          flex-wrap: wrap;
          &:not(:first-of-type) {
            border-top: 1px solid #b9b6b6;
            margin-top: 5px;
            padding-top: 10px;
          }
        }
        li {
          margin-inline-end: 20px;
          .block-style-label {
            float: none;
            width: auto;
          }
        }
      }
      &.block-pause-fieldset {
        .block-style-label {
          width: 22%;
          &:last-child {
            width: auto;
          }
        }
      }
    }

    .tab-container {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .block-style-label {
      display: block;
      line-height: 12px;
      font-weight: normal;
      cursor: pointer;
      input[type='radio'] {
        margin-left: 0px;
        margin-right: 5px;
      }
      span {
        float: none;
        width: auto;
      }
      i.fa-check-circle-o {
        color: #303030;
      }
      i.fa-dot-circle-o:hover, i.fa-circle-o:hover {
        color: gray;
      }
    }
  }
</style>
