<template>
  <transition
    name="modal"
  >
   <div
     class="modal-mask"
   >
     <div
       class="modal-wrapper"
     >
       <div
         class="modal-container"
         style="width: 454px;"
       >
         <div
           class="modal-header couplet-modal"
           style="letter-spacing: 0.02em;
           line-height: 16.1px;
           font-weight: 700;"
         >
           Confirm Couplet update
         </div>
         <div
           class="modal-body couplet-modal"
           style="font-weight: 400;
           line-height: 150%;"
         >
           Couplet block style converts
           <br>
           forward slash /, pipe |, 3 spaces, tab, or any combination of them into a unified couplet line separator /
           <br>
           Save changes?
           <br>
           <div
             class="warn"
             style=""
           >
             <label
              class="labelDontShow"
              style="font-weight: 100"
             >
               <input
                 type="checkbox"
                 v-model="isDontShowAgain"
                 style="width: 18px;
                 height: 18px;
                 vertical-align: middle;
                 margin: 0 0 0 0;
                 margin-right: 15px;"
               >
               Don't show this message again
             </label>
           </div>
         </div>
         <div
           class="modal-footer"
           style="display: flex; text-align: justify;
           width: 100%;
           padding: 0px;
           margin-left: 0px;"
         >
           <button
             class="btn btn-default modal-button"
             type="button"
             aria-label="Close"
             @click="closePopup"
             id="cancelCoupletUpdate"
             style="
             background-color: #FFFFFF;
             font-size: 12px;
             line-height: 15px;
             color: #333333;"
           >
             Cancel
           </button>
           <button
             class="btn btn-default modal-button"
             type="button"
             @click="saveChanges"
             id="saveCoupletUpdates"
             style="background-color: #337AB7;
             line-height: 17px;
             color: #FFFFFF;
             margin-left: 0px;"
           >
             Save
           </button>
         </div>
       </div>
     </div>
   </div>
  </transition>
</template>

<script>
import modal from 'vue-js-modal';
import modalMixin from './../../mixins/modal';
export default {
  name: "CoupletWarningPopup",
  components: {
    modal,
    alert,
  },
  mixins: [modalMixin],
  data() {
    return {
      isDontShowAgain: false,
    }
  },
  methods: {
    closePopup() {
      this.$emit('close', this.isDontShowAgain);
    },
    saveChanges() {
      this.$emit('save', this.isDontShowAgain);
    }
  },
}
</script>

<style scoped>
.warn {
  padding-top: 15px;
  font-family: Arial, Helvetica, sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 150%;
}
.labelDontShow {
  font-weight: 0;
}
.couplet-modal {
  padding-top: 15px;
  padding-left: 20px;
  font-size: 14px;
  font-style: normal;
  font-family: Arial, Helvetica, sans-serif;
}
.modal-button {
  width: 50%;
  height: 40px;
  letter-spacing: 0.02em;
  padding: 0px;
  font-family: Inter;
  font-weight: 400;
}
</style>
