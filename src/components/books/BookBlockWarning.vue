<template>
  <div id="bookBlockWarning" v-if="meta.isInTheQueueOfPublication || meta.isIntheProcessOfPublication">
    <div id="holder">
      <div id="text">
        <div id="union">
        </div>

        Book is being published. Changes may not be saved at the current time
      </div>

      <div id="Rectangle92">
      </div>

    </div>
  </div>
</template>

<style>

.content-meta-wrapper .content-scroll-wrapper{
  overflow-y:hidden;
}
#booksarea .content-meta-wrapper .scroll-wrapper .container-fluid {
  overflow-x:unset ;
  overflow-y:unset ;
}
#bookBlockWarning #holder{
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  height: 62px;
  width: 100%;
  background-color: #fdf0e0;
  border-radius: 4px;
  font-family: 'Arial';
  font-size: 18px;
}

#bookBlockWarning #holder #text {
  font-family: 'Arial';
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.87);
  position: relative;
  margin: 0 auto;
  width: 600px;
  vertical-align: middle;
  height: 60px;
  text-align: center;
  top: 18px;
}
#bookBlockWarning #holder  {
}

#bookBlockWarning #holder #Rectangle92 {
  float: left;
  width: 4px;
  height: 100%;
  border-radius: 4px 0 0 4px;
  background: #F69E3A;
  display: inline;
  position: relative;
  top: -61px;

}

#bookBlockWarning #union{
  position: absolute;
  width: 22.4px;
  height: 19.6px;
  background-image:url("/static/audio_editor/union.png");
  background-repeat: no-repeat;
  left: -28px;
  top: 2px;
}


</style>
<script>


export default {
  props: ['meta'],
}
</script>
