<template>
  <fieldset class="toc-items-list">
    <legend>Table of contents</legend>
    <template v-if="isBlocked && blockers.indexOf('loadBookToc') >-1">
      <div class="preloader-spinner"></div>
    </template>
    <template v-else>
      <button class="btn btn-primary"><i class="fa fa-refresh refresh-toc" v-on:click="loadBookTocProxy(true)"></i>Refresh</button>
      <button class="btn btn-default toggle-sections-mode" v-on:click="toggleSectionsMode()">
        <i class="fa fa-eye-slash" v-if="!sectionsMode"></i>
        <i class="fa fa-eye" v-else></i>
        Sections
      </button>
      <!-- {{bookTocSections}} -->
      <div v-if="currentBookTocCombined.length > 0" class="toc-list">
        <!--<div :class="['toc-item', toc.level]" v-for="(toc, tocIdx) in tocs" v-bind:key="tocIdx">
          <span :class="['toc-item-number', toc.level]">{{toc.secnum?toc.secnum:''}}</span>
          <span class="toc-item-link" @click="goToBlock(toc._id, $event)">{{toc.content}}</span>
        </div>-->
        <table class="toc-list-table table-striped">
          <template v-for="(toc, tocIdx) in currentBookTocCombined" >
            <template v-if="toc.section && toc.section.id && sectionsMode">
              <tr>
                <td colspan="4" v-on:dblclick="sectionEditMode(toc.section)">
                  <div class="section-options">
                    <div class="-option -index">
                      {{toc.section.index}}
                    </div>
                    <div class="-option -name">
                      <input type="text" v-if="editingSectionId === toc.section.id" v-model="editingSlug"
                        v-on:keyup.enter="updateSlug(editingSlug)"
                        v-on:change="updateSlug(editingSlug)"
                        v-on:blur="updateSlug(editingSlug)" />
                      <label v-else>{{toc.section.slug}}</label>
                    </div>
                    <div class="-option -divider"></div>
                    <div class="-option -remove"></div>
                  </div>
                </td>
              </tr>
            </template>
            <!-- <tr>
              <td colspan="4">
                <div style="display: table; width: 100%; height: 20px;">
                  <div style="display: table-cell;">1</div>
                  <div style="display: table-cell;">test-text-input-label</div>
                  <div style="display: table-cell;"></div>
                  <div style="display: table-cell;"><i class="fa fa-remove"></i></div>
                </div>
              </td>
            </tr> -->
            <tr :class="['toc-item', toc.level]" v-bind:key="tocIdx">
              <!--<template v-if="!toc.level">
                <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
                <td colspan="4" class="toc-item-link" @click="goToBlock(toc._id, $event)">{{toc.content}}</td>
              </template>-->
              <template v-if="toc.level == 'toc1'">
                <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
                <td colspan="4" :class="['toc-item-link', toc.inTocStyle]" @click="goToBlock(toc.blockid, $event)">{{toc.content}}</td>
              </template>
              <template v-if="toc.level == 'toc2'">
                <td></td>
                <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
                <td colspan="3" :class="['toc-item-link', toc.inTocStyle]" @click="goToBlock(toc.blockid, $event)">{{toc.content}}</td>
              </template>
              <template v-if="toc.level == 'toc3'">
                <td></td><td></td>
                <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
                <td colspan="2" :class="['toc-item-link', toc.inTocStyle]" @click="goToBlock(toc.blockid, $event)">{{toc.content}}</td>
              </template>
              <template v-if="toc.level == 'toc4'">
                <td></td><td></td><td></td>
                <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
                <td :class="['toc-item-link', toc.inTocStyle]" @click="goToBlock(toc.blockid, $event)">{{toc.content}}</td>
              </template>
            </tr>
          </template>
        </table>
      </div>
      <div v-else class="empty-tocs">
        No Table of contents
      </div>
    </template>
  </fieldset>
</template>
<script>

//import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'

export default {

  name: 'BookToc',

  data () {
    return {
      currBookId: this.bookId,
      loading: false,
      sectionsMode: false,
      tocSectionCombined: [],
      editingSectionId: null,
      validationErrors: {
        slug: ''
      },
      editingSlug: ''
    }
  },

  props: [
    'bookId',
  ],


  computed: {
    ...mapGetters(['isBlocked', 'blockers', 'currentBookToc', 'bookTocSections', 'currentBookTocCombined'])
  },

  methods: {
    ...mapActions(['freeze', 'unfreeze', 'loadBookToc', 'loadBookTocSections', 'updateBookTocSection']),

    goToBlock(blockId, ev) {
      //console.log('goToBlock', blockId, this.$route.name);
      /*if ([
        'CollectionBookEdit',
        'CollectionBookEditDisplay',
        'BookEdit',
        'BookEditDisplay',
        'BookNarrate',
        'CollectionBookNarrate'].indexOf(this.$route.name) !== -1) {*/
        this.$router.push({name: this.$route.name, params: {}});
        this.$router.push({name: this.$route.name, params:  { block: blockId }});
      //}
    },
    loadBookTocProxy(isWait = false) {
      //if (!isWait) this.freeze('loadBookToc');
      if (this.loading) {
        return false;
      }
      this.loading = true;
      this.loadBookToc({bookId: this.currBookId, isWait: isWait})
      .then((res)=>{
        this.loading = false;
        this.unfreeze('loadBookToc');
      })
      .catch((err)=>{
        this.loading = false;
        this.unfreeze('loadBookToc');
      });
    },
    
    toggleSectionsMode() {
      this.sectionsMode = !this.sectionsMode;
    },
    
    sectionEditMode(section) {
      if (section) {
        this.editingSectionId = section.id;
        this.editingSlug = section.slug;
      } else {
        this.editingSectionId = null;
        this.editingSlug = '';
      }
    },
    
    validateSlug(slug) {
      this.validationErrors['slug'] = '';
      if (!slug) {
        return true;
      }
      let section = this.currentBookTocCombined.find(tc => {
        return tc.section && tc.section.slug === slug;
      });
      if (section) {
        this.validationErrors['slug'] = 'Section name is not unique';
        return false;
      }
      return true;
    },
    
    updateSection(update) {
      if (this.editingSectionId) {
        return this.updateBookTocSection([this.editingSectionId, update])
          .then(response => {
            this.sectionEditMode(null);
            return Promise.resolve();
          });
      }
    },
    
    updateSlug(slug) {
      if (this.editingSectionId && this.validateSlug(slug)) {
        return this.updateSection({slug: slug, manualSlug: slug ? true : false});
      }
    }
  },

  mounted () {
    //console.log('mounted TOC', this.currBookId);
    this.loadBookTocProxy(true);
    this.loadBookTocSections();
    this.$root.$on('from-book-meta:upd-toc', this.loadBookTocProxy)
  },

  watch: {
    '$route' () {
      //console.log('$route', this.currBookId, this.$route.params.bookid);
      if (this.$route.params.hasOwnProperty('bookid')) {
        if (this.currBookId !== this.$route.params.bookid) {
          this.currBookId = this.$route.params.bookid;
          this.loadBookTocProxy();
        }
      }
    }
  },

  destroyed: function () {
    this.$root.$off('from-book-meta:upd-toc', this.loadBookTocProxy)
  }
}
</script>
<style lang="less">
 fieldset.toc-items-list {
    padding-left: 5px;

    .table-striped>tr:nth-of-type(odd) {
      background-color: #f9f9f9;
    }

    legend {
      width: auto;
      border-bottom: 0;
      font-size: 12px;
      margin-bottom: 0;
    }
    .preloader-spinner {
      width: 100%;
      height: 100px;
      background: url(/static/preloader-snake-small.gif);

      background-repeat: no-repeat;
      text-align: center;
      background-position: center center;
      /*background-size: 83%;*/
    }
    .empty-tocs {
      width: 100%;
      height: 100px;
    }
    .toc-list {
      display: table;
      width: 100%;
      .toc-item {
        display: table-row;

        .toc-item-number {
          display: table-cell;
          padding-right: 5px;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
        }
        .toc-item-link {
          display: table-cell;
          cursor: pointer;
          text-decoration: underline;
          color: #337ab7;
          &.off {
            color: gray;
          }
        }
      }
      .toc-list-table {
        width: 100%;
      }
      .section-options {
        display: table;
        width: 100%;
        .-option {
          display: table-cell;
          &.option-divider {
            
          }
        }
      }
    }
    .refresh-toc {
      margin: 0px 3px;
      color: white;
      cursor: pointer;
      vertical-align: middle;
    }
    .toggle-sections-mode {
      i.fa {
        color: black;
      }
    }
  }
</style>
