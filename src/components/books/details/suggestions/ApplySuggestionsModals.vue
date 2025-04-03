<template>
  <div class="apply-suggestions-modal">
    <div class="modal-header">
      <div>
        <h4 class="modal-title">{{modalTitle}}</h4>
      </div>
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="onClose">
        <i class="close-modal" aria-hidden="true"></i>
      </button>
    </div>
    <div class="modal-body">
      <div>
        <span v-html="suggestionTitle"></span>
      </div>
      <div>
        <RadioButton v-model="updateSelection" inputId="ingredient1" name="pizza" value="Mushroom" />
        <label for="ingredient1">Mushroom</label>
        <RadioButton v-model="updateSelection" inputId="ingredient2" name="pizza" value="Mushroo" />
        <label for="ingredient2">Mushroom</label>
        <RadioButton v-model="updateSelection" inputId="ingredient3" name="pizza" value="Mushro" />
        <label for="ingredient3">Mushroom</label>
      </div>
      <div>
        <Checkbox v-model="isDontShow" inputId="ingredient4" binary />
        <label for="ingredient4"> Onion </label>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary modal-default-button">Import</button>
      <button class="btn btn-default modal-default-button" @click="onClose">Cancel</button>
    </div>
  </div>
</template>

<script>

import Vue from 'vue';
import v_modal from 'vue-js-modal';
import RadioButton from 'primevue/radiobutton';
import Checkbox from 'primevue/checkbox';
import api_config from '../../../../mixins/api_config.js';
import access from '../../../../mixins/access.js';
import { mapGetters, mapActions } from 'vuex';
import { BookBlock }     from '../../../../store/bookBlock.js'
Vue.use(v_modal, { dialog: true, dynamic: true });

export default {
  data() {
    return {
      isDontShow: false,
      updateSelection: 'Mushroom'
    }
  },
  components: {
    Vue, RadioButton, Checkbox
  },
  mixins: [api_config, access],
  props: {
    'suggestion': {
      type: Object,
      default: {}
    },
    'userChoiceSelected': {
      type: Function,
      default: ()=>Promise.resolve({})
    }
  },
  beforeMount: function() {
  },
  mounted: function () {
  },
  computed: {
    modalTitle: {
      get() {
        if (this.suggestion.isEdit) {
          return 'Edit suggestion'
        }
        return 'Add suggestion';
      },
      cache: false
    },
    suggestionTitle: {
      get() {

        const suggLen = this.suggestion.suggestion.trim().length;
        let title = '';

        switch(this.suggestion.action) {
          case 'add' : {
            title = 'Add' + (suggLen > 0 ? ' suggestion' : ' empty suggestion');
            title += suggLen > 0 ? ` <i>"${this.suggestion.suggestion}"</i> for` : ' for';
            title += ` <b>"${this.suggestion.text}"</b> to:`
          } break;
          case 'edit' : {
            title = 'Update suggestion';
            title += suggLen > 0 ? ` <i>"${this.suggestion.suggestion}"</i> for` : ' for';
            title += ` <b>"${this.suggestion.text}"</b> in:`
          } break;
          case 'delete' : {
            title = 'Delete suggestion';
            title += suggLen > 0 ? ` <i>"${this.suggestion.suggestion}"</i> for` : ' for';
            title += ` <b>"${this.suggestion.text}"</b> from:`
          } break;
          default : {
          } break;
        };

        return title;

      },
      cache: false
    },
    ...mapGetters('suggestionsModule', [
      'suggestions'
    ]),
  },
  methods: {
    onClose: function() {

      const contact = 'Suuuuuuggestion';
      this.userChoiceSelected(contact);

      this.$emit('close');
    }
  },
  watch: {

  }
}
</script>

<style scoped lang="less">
  .apply-suggestions-modal {
    [class^="col-sm-"] {
      padding: 4px 4px 4px 0px;
    }
    .modal-header {
      padding: 10px 10px 10px 28px;
      button.close {
        margin-top: -25px;
      }
      button.close i.close-modal {
        font-size: 18px;
        padding-right: .5em;
        &:before {
          content: "\00d7";
        }
      }
    }
    .modal-body {
      padding: 0px 30px;
    }
    .modal-header {
      border-bottom: none;
      h4 {
        font-size: 16px;
        font-weight: 700;
      }
    }
    .modal-footer {
      border-top: none;
      .btn-default {
        width: 88px;
      }
      .btn-primary {
        width: 84px;
      }
      .btn {
        margin: 0px 7px;
      }
    }
  }
</style>
