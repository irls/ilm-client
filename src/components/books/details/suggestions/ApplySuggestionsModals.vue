<template>
  <div class="apply-suggestions-modal">
    <div class="modal-header">
      <div>
        <h4 class="modal-title">{{importTitle}}</h4>
      </div>
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close')">
        <i class="close-modal" aria-hidden="true"></i>
      </button>
    </div>
    <div class="modal-body">
    </div>
    <div class="modal-footer">
    </div>
  </div>
</template>

<script>

import Vue from 'vue';
import v_modal from 'vue-js-modal';
import api_config from '../../../../mixins/api_config.js';
import access from '../../../../mixins/access.js';
import { mapGetters, mapActions } from 'vuex';
import { BookBlock }     from '../../../../store/bookBlock.js'
Vue.use(v_modal, { dialog: true, dynamic: true });

export default {
  data() {
    return {
    }
  },
  beforeMount: function() {
  },
  mounted: function () {
  },
  components: {
    Vue
  },
  mixins: [api_config, access],
  props: {
    'book': {
      type: Object,
      default: {}
    },
    'multiple': {
      type: Boolean,
      default: true
    }
  },
  computed: {
    importTitle: {
      get() {
        return 'importTitle';
      },
      cache: false
    },
    ...mapGetters('suggestionsModule', [
      'suggestions'
    ]),
  },
  methods: {

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
