<template>
  <div class="ilm-upload-image">
    <div class="ilm-upload-image__preview">
      <img v-if="image" :src="image" :height="imgHeight" :width="imgWidth" alt="">
    </div>
    <label :for="id" class="ilm-upload-image__label">
      <UploadFile
        ref="illustrationInput"
        :id="id"
        :name="id"
        accept="image/*"
        @input="onChange"
      />
      <div class="ilm-upload-image__drop">Click here or drag image here</div>
    </label>
    <!--    <button v-if="getImage(id)" class="btn btn-default ilm-upload-image__remove" @click.stop="removeImage(id)">Remove image</button>-->

  </div>
</template>

<script>
  import UploadFile from './UploadFile'

  const DEFAULT_IMAGE_HEIGHT = 100;
  const DEFAULT_IMAGE_WIDTH = 300;

  import { mapGetters, mapActions } from 'vuex'

  export default {
    name: 'UploadImage',
    components: {
      UploadFile,
    },
    props: {
      value: {
        type: [File,String, Boolean],
        default: ''
      },
      //blockID or any unique ID
      id: {
        type: String,
        required: true
      },
      height: {
        type: [Number], //in px
        default: DEFAULT_IMAGE_HEIGHT,
      },
      width: {
        type: [Number], //in px
        default: DEFAULT_IMAGE_WIDTH,
      }
    },
    computed:{
      ...mapGetters('uploadImage',{
        getImage: 'image',
        getHeight: 'height',
        getWidth: 'width',
        imagesMap: 'imagesMap'
      }),
      imgHeight(){
        return this.getHeight(this.id) || this.height
      },
      imgWidth(){
        return 'auto'//this.getWidth(this.id) || this.width
      },
      image(){
        //get temp image if exists or original image url
        return this.getImage(this.id) || this.value

      },
      key(){
        return `${this.imgHeight}_${this.imgWidth}`
      },
      blockTmpImage: {
        get() {
          return this.imagesMap[this.id];
        }
      }
    },
    methods: {
      ...mapActions('uploadImage',['setImage', 'removeImage']),
      onChange(data){
        if(!data.file){
          return;
        }
        this.createImageNode(data).then(res => {

          this.setImage({
            id: this.id,
            data: {
              file: data.file,
              height: res.height,
              width: res.width,
              objectURL: res.src
            }
          })


        })
        this.$emit('input', true)

      },
      //TODO pmove to helpers
      createImageNode(data = null){
        return new Promise((resolve, reject) => {
          if(!data.file) {
            return reject();
          }
          let img = new Image;
          img.src = data.objectURL;

          img.onload = () => {
            return resolve(img);
          };
        })
      },
    },
    watch: {
      'blockTmpImage': {
        handler(val) {
          if (!val) {
            this.$refs.illustrationInput.clear();
          }
        }
      }
    }
  }
</script>
<style lang="less" scoped>
  .ilm-upload-image{
    position:relative;
    margin: 0 auto;

    &__label {
      position:relative;
      display: block;
    }
    &__change,
    &__remove {
      display: block;
      margin: 0 auto;
    }
    &__drop{
      text-align: center;
      margin: 1em auto;
      padding: .5em;
      border: 4px dashed rgba(66, 66, 66, 0.15);
      height: 70px;
      border-radius: 0;
      font-size: 20pt;
      font-weight: normal;
      cursor:move;
      z-index:100;
      &:hover {
        opacity: 0.5;
      }
    }
  }
</style>
