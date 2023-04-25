<template>
  <fieldset class="toc-items-list">
    <legend>Table of contents</legend>
    <template v-if="isBlocked && blockers.indexOf('loadBookToc') >-1">
      <div class="preloader-spinner"></div>
    </template>
    <template v-else>
      <TOCSettingsModal v-if="tocSettingsModalActive"
        @close="closeSettings"
        @save="saveSettings" />
      <div class="toc-buttons">
        <div class="toc-button">
          <button class="btn btn-default toggle-sections-mode" v-on:click="toggleSectionsMode()" v-if="adminOrLibrarian">
            <i class="fa fa-eye-slash" v-if="!sectionsMode"></i>
            <i class="fa fa-eye" v-else></i>
            Sections
          </button>
        </div>
        <div class="toc-button -toc-actions">
          <template v-if="sectionsMode && adminOrLibrarian">
            <span class="btn btn-primary book-generating" v-if="tocSectionBook.isBuilding">
              <span class="book-generating-spinner"></span>
            </span>
            <template v-else>
              <button class="btn btn-default btn-build-book toc-book-settings" v-on:click="openSettings($event)">
              </button>
              <button class="btn btn-primary btn-build-book toc-export" v-if="buildBookButtonEnabled" v-on:click="exportBook($event)">
              </button>
              <span class="btn btn-primary btn-build-book book-build-disabled toc-export" v-else>
              </span>
              <a class="btn btn-primary btn-download-book" :href="downloadBookLink()" target="_blank" v-if="tocSectionBook.zipPath && !tocSectionBook.isBuilding" v-on:click="checkOnAction(null, $event)">
              </a>
              <span class="btn btn-primary book-build-disabled btn-download-book" v-else>
              </span>
            </template>
          </template>
        </div>
        <div class="toc-button -refresh-toc">
          <button class="btn btn-default refresh-toc" v-on:click="loadBookTocProxy(true)">
            <i class="fa fa-refresh refresh-toc"></i>
          </button>
        </div>
      </div>
      <div v-if="tocSectionBook.zipTime && sectionsMode" class="book-zip-time">
        Latest build: {{convertTime(tocSectionBook.zipTime, true)}}
      </div>
      <!-- {{bookTocSections}} -->
      <div v-if="currentBookTocCombined.length > 0" class="toc-list">
        <div class="toc-display-settings" v-if="sectionsMode">
          <div>
            <label>Display:</label>
          </div>
          <div>
            <label>
              <input type="checkbox" v-model="displaySettings.title" /><span></span>Title
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" v-model="displaySettings.titleEn" /><span></span>Title English
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" v-model="displaySettings.toc" /><span></span>TOC
            </label>
          </div>
        </div>
        <!--<div :class="['toc-item', toc.level]" v-for="(toc, tocIdx) in tocs" v-bind:key="tocIdx">
          <span :class="['toc-item-number', toc.level]">{{toc.secnum?toc.secnum:''}}</span>
          <span class="toc-item-link" @click="goToBlock(toc._id, $event)">{{toc.content}}</span>
        </div>-->
        <table class="toc-list-table table-striped">
          <template v-for="(toc, tocIdx) in currentBookTocCombined" >
            <template v-if="toc.section && toc.section.id && sectionsMode">
              <tr class="toc-section">
                <td colspan="6" v-on:dblclick="sectionEditMode(toc.section, 'slug')" :class="['hidden-container', {'-edit-mode': editingSectionId === toc.section.id}]">
                  <div class="section-options">
                    <div class="-option -index">
                      {{toc.section.index}}
                    </div>
                    <div class="-option -name">
                      <template v-if="editingSectionId === toc.section.id && editingFieldName === 'slug'">
                        <input type="text" :class="['edit-section-slug', {'-has-error': validationErrors['slug']}]" 
                          v-model="editingFieldValue"
                          v-on:keyup.enter="blurEditingField(null)"
                          v-on:change="updateSectionField(editingFieldValue)"
                          v-on:blur="blurEditingField(null)"
                          v-on:input="editingFieldChanged($event)" />
                        <span class="validation-error" v-if="validationErrors['slug']">{{validationErrors['slug']}}</span>
                      </template>
                      <label :title="toc.section.slug" :class="['section-slug', {'-manual': toc.section.manualSlug}]" v-else>{{toc.section.slug}}</label>
                    </div>
                    <div class="section-generating-hover -visible" v-if="toc.section.isBuilding"></div>
                    <div class="-option -remove -hidden">
                      <i class="fa fa-remove" disabled title="Delete section" v-if="toc.section.isBuilding || tocSectionBook.isBuilding"></i>
                      <i class="fa fa-remove" v-on:click="removeSection(toc.section.id)" title="Delete section" v-else></i>
                    </div>
                    <div :class="['-option', '-build', '-hidden', {'-building': toc.section.isBuilding}]">
                      <!-- {{toc.section.zipPath}},{{toc.section.zipPath && !toc.section.buildModified ? true : false}} -->
                      <div class="section-generating" v-if="toc.section.isBuilding"></div>
                      <template v-else>
                        <i class="fa fa-file-archive-o" :title="toc.section.zipPath ? 'Rebuild' : 'Build'" disabled v-if="toc.section.zipPath && !toc.section.buildModified"></i>
                        <i class="fa fa-file-archive-o" :title="toc.section.zipPath ? 'Rebuild' : 'Build'" v-on:click="exportSection(toc.section.id, $event)" v-else></i>
                      </template>
                    </div>
                    <a class="-option -download -hidden" :href="downloadSectionLink(toc.section.id)" target="_blank" v-on:click="checkOnAction(toc.section.id, $event)" v-if="toc.section.zipPath && !toc.section.isBuilding && !tocSectionBook.isBuilding">
                      <i class="fa fa-download" title="Download"></i>
                    </a>
                    <a class="-option -download -hidden" v-else>
                      <i class="fa fa-download" title="Download" disabled></i>
                    </a>
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
            <tr :class="['toc-item', toc.level, 'hidden-container']" v-bind:key="tocIdx">
              <!--<template v-if="!toc.level">
                <td :class="['toc-item-number', toc.level]" width="10">{{toc.secnum?toc.secnum:''}}</td>
                <td colspan="4" class="toc-item-link" @click="goToBlock(toc._id, $event)">{{toc.content}}</td>
              </template>-->
              <td>
                <template v-if="(!toc.section || !toc.section.id) && sectionsMode">
                  <div class="create-toc-section -hidden" v-on:click="createSectionFromItem(toc.blockid)" title="Add section"></div>
                </template>
              </td>
              <template v-if="toc.level == 'toc1'">
                <td :class="['toc-item-number', toc.level]" width="10">
                  <template v-if="displayTOC">
                    {{toc.secnum?toc.secnum:''}}
                  </template>
                </td>
                <td colspan="4" :class="['toc-item-link', toc.inTocStyle]" @click="goToBlock(toc.blockid, $event)">
                  <template v-if="displayTOC">
                    {{toc.content}}
                  </template>
                </td>
              </template>
              <template v-if="toc.level == 'toc2'">
                <td></td>
                <td :class="['toc-item-number', toc.level]" width="10">
                  <template v-if="displayTOC">
                    {{toc.secnum?toc.secnum:''}}
                  </template>
                </td>
                <td colspan="3" :class="['toc-item-link', toc.inTocStyle]" @click="goToBlock(toc.blockid, $event)">
                  <template v-if="displayTOC">
                    {{toc.content}}
                  </template>
                </td>
              </template>
              <template v-if="toc.level == 'toc3'">
                <td></td><td></td>
                <td :class="['toc-item-number', toc.level]" width="10">
                  <template v-if="displayTOC">
                    {{toc.secnum?toc.secnum:''}}
                  </template>
                </td>
                <td colspan="2" :class="['toc-item-link', toc.inTocStyle]" @click="goToBlock(toc.blockid, $event)">
                  <template v-if="displayTOC">
                    {{toc.content}}
                  </template>
                </td>
              </template>
              <template v-if="toc.level == 'toc4'">
                <td></td><td></td><td></td>
                <td :class="['toc-item-number', toc.level]" width="10">
                  <template v-if="displayTOC">
                    {{toc.secnum?toc.secnum:''}}
                  </template>
                </td>
                <td :class="['toc-item-link', toc.inTocStyle]" @click="goToBlock(toc.blockid, $event)">
                  <template v-if="displayTOC">
                    {{toc.content}}
                  </template>
                </td>
              </template>
            </tr>
            <tr :class="['toc-section-title', '-num-' + toc.section.index]" v-if="displayTitle && toc.section && toc.section.id">
              <td colspan="6" v-on:click="sectionEditMode(toc.section, 'title')" v-on:dblclick="sectionEditMode(toc.section, 'title')">
                <template v-if="editingSectionId === toc.section.id && editingFieldName === 'title'">
                  <input type="text" :class="['edit-section-title', {'-has-error': validationErrors['title']}]"
                    v-model="editingFieldValue"
                    v-on:keyup.enter="blurEditingField(null)"
                    v-on:change="updateSectionField(editingFieldValue)"
                    v-on:blur="blurEditingField(null)"
                    v-on:input="editingFieldChanged($event)" />
                </template>
                <template v-else>
                  <label :class="['section-title', {'no-section-title': !toc.section.title, '-manual': toc.section.manualTitle}]">{{toc.section.title || 'Define Title'}}</label>
                </template>
              </td>
            </tr>
            <tr :class="['toc-section-title-en', '-num-' + toc.section.index]" v-if="displayTitleEn && toc.section && toc.section.id">
              <td colspan="6" v-on:click="sectionEditMode(toc.section, 'titleEn')" v-on:dblclick="sectionEditMode(toc.section, 'titleEn')">
                <template v-if="editingSectionId === toc.section.id && editingFieldName === 'titleEn'">
                  <input type="text" :class="['edit-section-titleEn', {'-has-error': validationErrors['titleEn']}]"
                    v-model="editingFieldValue"
                    v-on:keyup.enter="blurEditingField(null)"
                    v-on:change="updateSectionField(editingFieldValue)"
                    v-on:blur="blurEditingField(null)"
                    v-on:input="editingFieldChanged($event)" />
                </template>
                <template v-else>
                  <label :class="[{'no-section-title': !toc.section.titleEn}]">{{toc.section.titleEn || 'Define Title English'}}</label>
                </template>
              </td>
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
import { mapGetters, mapActions } from 'vuex';
import api_config from '../../mixins/api_config.js';
import time_methods from '../../mixins/time_methods.js';
import TOCSettingsModal from './details/TOCSettings.vue';
import Vue from 'vue';

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
        slug: '',
        title: '',
        titleEn: '',
      },
      editingFieldValue: '',
      editingFieldName: '',
      tocSettingsModalActive: false,
      displaySettings: {
        title: true,
        titleEn: false,
        toc: true
      },
      validationErrorsText: {
        unique: {
          slug: 'Section name is not unique',
          title: '',
        }
      }
    }
  },

  props: [
    'bookId',
  ],
  
  components: {
    TOCSettingsModal
  },
  
  mixins: [api_config, time_methods],


  computed: {
    ...mapGetters(['isBlocked', 'blockers', 'currentBookToc', 'bookTocSections', 'currentBookid', 'adminOrLibrarian']),
    ...mapGetters('tocSections', ['tocSectionBook', 'currentBookTocCombined']),
    buildBookButtonEnabled: {
      get() {
        let hasSections = this.currentBookTocCombined.find(toc => {
          return toc.section && toc.section.id;
        });
        return (
                !this.tocSectionBook.zipPath || (this.tocSectionBook.zipPath && this.tocSectionBook.buildModified)
                ) && hasSections;
      },
      cache: false
    },
    displayTOC: {
      get() {
        return this.sectionsMode ? this.displaySettings.toc : true;
      },
      cache: false
    },
    displayTitle: {
      get() {
        return this.sectionsMode ? this.displaySettings.title : false;
      },
      cache: false
    },
    displayTitleEn: {
      get() {
        return this.sectionsMode ? this.displaySettings.titleEn : false;
      },
      cache: false
    }
  },

  methods: {
    ...mapActions(['freeze', 'unfreeze', 'loadBookToc']),
    ...mapActions('tocSections', ['loadBookTocSections', 'updateBookTocSection', 'createBookTocSection', 'removeTocSection', 'exportTocSection', 'exportTocSectionBook', 'updateTocSectionBook']),

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
      this.clearErrors();
      this.sectionEditMode(null);
      this.loadBookTocSections([]);
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
    
    sectionEditMode(section, field) {
      return new Promise((resolve, reject) => {
        Vue.nextTick(() => {
          if (!(section instanceof Object)) {
            let tc = this.currentBookTocCombined.find(toc => {
              return toc.section && toc.section.id === section;
            });
            if (tc && tc.section) {
              section = tc.section;
            }
          }
          if (section) {
            if (this.editingSectionId !== section.id || field !== this.editingFieldName) {
              if (this.hasError()) {
                this.showNameError();
                return false;
              }
              this.setEditingSection(section, field);
            }
            this.focusEditingField();
            return resolve();
          } else {
            if (!this.hasError()) {
              this.setEditingSection(null);
            }
            return resolve();
          }
        });
      });
    },
    
    setEditingSection(section, field) {
      if (section && section.id) {
        this.editingSectionId = section.id;
        this.editingFieldValue = section[field];
        this.editingFieldName = field;
        Vue.nextTick(() => {
          let el = document.getElementsByClassName('edit-section-' + this.editingFieldName);
          if (el && el[0]) {
            el[0].addEventListener('keydown', this.moveToNextField);
          }
        });
      } else {
        this.editingSectionId = null;
        this.editingFieldValue = '';
        this.editingFieldName = '';
      }
    },
    
    moveToNextField(event) {
      if (event) {
        let isPrev = event.key === 'ArrowUp';
        let isNext = event.key === 'ArrowDown';
        if (isPrev || isNext) {
          let targetSection = this.currentBookTocCombined.find(toc => {
            return toc.section && toc.section.id === this.editingSectionId;
          }).section;
          let targetField;
          if (!event.ctrlKey) {
            if (this.editingFieldName === 'titleEn') {// move to title field
              if (isPrev) {
                if (this.displayTitle) {
                  targetField = 'title';
                } else {
                  targetField = 'slug';
                }
              } else if (isNext) {
                targetSection = this.currentBookTocCombined.find(toc => {
                  return toc.section && toc.section.index === targetSection.index + 1;
                });
                if (targetSection) {
                  targetSection = targetSection.section;
                  targetField = 'slug';
                }
              }
            } else if (this.editingFieldName === 'title') {
              if (isPrev) {
                targetField = 'slug';
              } else if (isNext) {
                if (this.displayTitleEn) {
                  targetField = 'titleEn';
                } else {
                  targetSection = this.currentBookTocCombined.find(toc => {
                    return toc.section && toc.section.index === targetSection.index + 1;
                  });
                  if (targetSection) {
                    targetSection = targetSection.section;
                    targetField = 'slug';
                  }
                }
              }
            } else if (this.editingFieldName === 'slug') {
              if (isPrev) {
                targetSection = this.currentBookTocCombined.find(toc => {
                  return toc.section && toc.section.index === targetSection.index - 1;
                });
                if (targetSection) {
                  targetSection = targetSection.section;
                  targetField = 'titleEn';
                  if (this.displayTitleEn) {
                    targetField = 'titleEn';
                  } else if (this.displayTitle) {
                    targetField = 'title';
                  } else {
                    targetField = 'slug';
                  }
                }
              } else if (isNext) {
                if (this.displayTitle) {
                  targetField = 'title';
                } else if (this.displayTitleEn) {
                  targetField = 'titleEn';
                } else {
                  targetSection = this.currentBookTocCombined.find(toc => {
                    return toc.section && toc.section.index === targetSection.index + 1;
                  });
                  if (targetSection) {
                    targetSection = targetSection.section;
                      targetField = 'slug';
                    }
                  }
              }
            }
          } else {
            targetField = this.editingFieldName;
            let targetIndex = isPrev ? targetSection.index - 1 : targetSection.index + 1;
            targetSection = this.currentBookTocCombined.find(toc => {
              return toc.section && toc.section.index === targetIndex;
            });
            if (targetSection) {
              targetSection = targetSection.section;
            }
          }
          if (targetField && targetSection) {
            event.preventDefault();
            this.sectionEditMode(null);
            Vue.nextTick(() => {
              this.sectionEditMode(targetSection, targetField);
            });
          }
        }
      }
    },
    
    validateSectionField(value, field) {
      this.validationErrors[field] = '';
      if (!value) {
        return true;
      }
      if (field !== 'slug') {
        return true;
      }
      let checkField = null;
      switch (field) {
        case 'slug':
          checkField = this.editingSectionId;
          break;
        case 'title':
          checkField = this.editingTitleId;
          break;
        case 'titleEn':
          checkField = this.editingTitleEnId;
          break;
      }
      let section = this.currentBookTocCombined.find(tc => {
        return tc.section && tc.section[field] === value && tc.section.id !== checkField;
      });
      if (section) {
        this.validationErrors[field] = this.validationErrorsText.unique[field];
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
    
    updateSectionField(value) {
      value = value.trim();
      if (this.editingSectionId) {
        let tc = this.currentBookTocCombined.find(toc => {
          return toc.section && toc.section.id === this.editingSectionId;
        });
        if (tc && tc.section) {
          if (this.validateSectionField(value, this.editingFieldName)) {
            if (tc.section[this.editingFieldName] !== this.editingFieldValue) {
              let update = {buildModified: tc.section.zipPath ? true : false};
              update[this.editingFieldName] = value;
              let isManual = value ? true : false;
              switch (this.editingFieldName) {
                case 'slug':
                  update.manualSlug = isManual;
                  break;
                case 'title':
                  update.manualTitle = isManual;
                  break;
                //case 'titleEn':
                  //update.manualTitleEn = isManual;
                  //break;
              }
              return this.updateSection(update)
                .then(() => {
                  return Promise.resolve();
                })
                .catch(err => {
                  let slugError = err ? err.message : '';
                  if (err && err.response && err.response.data) {
                    switch (err.response.data) {
                      case 'slug_not_unique':
                        slugError = 'Section name is not unique';
                        break;
                    }
                  }
                  if (slugError) {
                    //tc.section.slug = slug;
                    this.sectionEditMode(tc.section, this.editingFieldName)
                      .then(() => {
                        //this.editingFieldValue = '';
                        //Vue.nextTick(() => {
                          this.editingFieldValue = slug;
                          this.validationErrors.slug = slugError;
                          //let el = document.getElementsByClassName('edit-section-slug');
                          //if (el && el[0]) {
                            //el[0].value = '';
                            //el[0].value = slug + ' ';
                            //el[0].onchange();
                            /*if ("createEvent" in document) {
                              var evt = document.createEvent("HTMLEvents");
                              evt.initEvent("change", false, true);
                              el[0].dispatchEvent(evt);
                            } else {
                              el[0].fireEvent("onchange");
                            }*/
                          //}
                        //});
                      });
                  }
                });
            }
            this.sectionEditMode(null);
          } else {
            //setTimeout(() => {
              this.sectionEditMode(tc.section, this.editingFieldName);
            //}, 5000);
          }
        }
      }
    },
    
    createSectionFromItem(blockid) {
      return this.createBookTocSection({startBlockid: blockid, bookid: this.currentBookToc.bookId});
    },
    
    exportSection(id, ev) {
      if (this.checkOnAction(id, ev)) {
        let toc = this.currentBookTocCombined.find(tocC => {
          return tocC.section && tocC.section.id === id;
        });
        if (toc) {
          toc.section.isBuilding = true;
        }
        return this.exportTocSection(id);
      }
    },
    
    exportBook(ev) {
      if (this.checkOnAction(null, ev)) {
        this.exportTocSectionBook();
      }
    },
    
    downloadSectionLink(sectionId) {
      return this.getAPILink(`toc_section_export/${encodeURIComponent(sectionId)}/download`);
    },
    
    downloadBookLink() {
      return this.getAPILink(`toc_section_export/book/${this.currentBookToc.bookId}/download`);
    },
    
    hasError() {
      let hasError = false;
      Object.keys(this.validationErrors).forEach(k => {
        if (!hasError && this.validationErrors[k]) {
          hasError = true;
        }
      });
      return hasError;
    },
    
    editingFieldChanged(event) {
      this.validationErrors[this.editingFieldName] = '';
    },
    
    checkOnAction(sectionId = null, ev = null) {
      if ((sectionId === null || this.editingSectionId === sectionId) && this.hasError()) {
        this.showNameError();
        if (ev) {
          ev.preventDefault();
        }
        return false;
      }
      return true;
    },
    
    showNameError() {
      let currentSection = null;
      let tc = this.currentBookTocCombined.find(toc => {
        return toc.section && toc.section.id === this.editingSectionId;
      });
      if (tc && tc.section && tc.section.id) {
        currentSection = tc.section;
      }
      this.$root.$emit('show-modal', {
        title: 'Duplicate section name',
        text: `Book section ${currentSection ? currentSection.index : ''} name is not unique.`,
        buttons: [
          {
            title: 'Ok',
            handler: () => {
              this.$root.$emit('hide-modal');
              this.focusEditingField('middle');
            },
            class: ['btn btn-primary']
          }
        ]
      });
    },
    removeSection(id) {
      return this.removeTocSection(id)
        .then(() => {
          if (id === this.editingSectionId) {
            this.clearErrors();
            this.sectionEditMode(null);
          }
        });
    },
    
    clearErrors() {
      Object.keys(this.validationErrors).forEach(k => {
        this.validationErrors[k] = '';
      });
    },
    
    focusEditingField(scrollTo = false) {
      Vue.nextTick(() => {
        let el = document.getElementsByClassName('edit-section-' + this.editingFieldName);
        if (el && el[0]) {
          el[0].focus();
          if (scrollTo === 'middle') {
            el[0].scrollIntoView({
              behaviour: 'auto',
              block: 'center',
              inline: 'center'
            });
          }
        }
      });
    },
    
    blurEditingField() {
      let tc = this.currentBookTocCombined.find(toc => {
        return toc.section && toc.section.id === this.editingSectionId;
      });
      if (tc && tc.section && tc.section[this.editingFieldName] === this.editingFieldValue && !this.validationErrors[this.editingFieldName]) {
        this.sectionEditMode(null);
      }
    },
    openSettings() {
      //this.$modal.show(TOCSettingsModal);
      this.tocSettingsModalActive = true;
    },
    closeSettings() {
      this.tocSettingsModalActive = false;
    },
    saveSettings(settings) {
      this.tocSettingsModalActive = false;
      this.tocSectionBook.namePattern = settings.namePattern;
      this.tocSectionBook.titlePattern = settings.titlePattern;
      return this.updateTocSectionBook([this.tocSectionBook.id, {
          namePattern: settings.namePattern,
          titlePattern: settings.titlePattern
      }])
    }
  },

  mounted () {
    //console.log('mounted TOC', this.currBookId);
    this.loadBookTocProxy(true);
    //this.loadBookTocSections([]);
    this.$root.$on('from-book-meta:upd-toc', this.loadBookTocProxy)
  },

  watch: {
    '$route' () {
      //console.log('$route', this.currBookId, this.$route.params.bookid);
      if (this.$route.params.hasOwnProperty('bookid')) {
        if (this.currBookId !== this.$route.params.bookid) {
          this.currBookId = this.$route.params.bookid;
          this.loadBookTocProxy();
          this.loadBookTocSections([this.currBookId]);
        }
      }
    },
    'currentBookid': {
      handler() {
        this.sectionsMode = false;
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
        .no-section-title {
          color: rgba(0, 0, 0, 0.5);
          font-style: italic;
        }
        .toc-section-title, .toc-section-title-en {
          label {
            margin-left: 25px;
          }
        }
      }
      .section-options {
        display: table;
        width: 100%;
        .-option {
          display: table-cell;
          margin: 3px 5px;
          padding: 3px 5px;
          &.-index {
            color: #337ab7;
            font-weight: bold;
            font-size: 17px;
          }
          &.-name {
            background: linear-gradient(
                transparent, 
                transparent 45%, 
                rgb(93, 93, 93) 55%, 
                transparent 55%, transparent
                );
            padding: 3px 5px 3px 0px;
            width: 300px;
            max-width: 300px;
            color: gray;
            label {
              margin: 0px;
              background-color: white;
              padding: 0px 3px 0px 0px;
              max-width: 98%;
              white-space: nowrap;
              overflow: hidden;
              vertical-align: sub;
              text-overflow: ellipsis;
            }
            input {
              width: 100%;
              color: black;
            }
            .edit-section-slug {
              &.-has-error {
                border: 2px solid red;
                outline-color: red;
                &:focus {
                  border: 2px solid red;
                  outline-color: red;
                }
              }
            }
          }
          &.-remove {
            i {
              color: red;
              &[disabled] {
                color: gray;
              }
            }
          }
          &.-download {
            .fa[disabled] {
              color: #d6d6d6;
            }
          }
          &.-build {
            .fa[disabled] {
              color: #d6d6d6;
            }
            &.-building {
              vertical-align: middle;
            }
          }
        }
        &:hover {
          .-option {
            &.-name {
              color: black;
            }
          }
          .-option.-name {
            background: linear-gradient(
                transparent, 
                transparent 45%, 
                rgb(7, 7, 7) 55%, 
                transparent 55%, transparent
                );
          }
        }
      }
      tr.toc-section, tr.toc-section-title, tr.toc-section-title-en {
        background-color: white;
      }
      .create-toc-section {
        width: 20px;
        height: 20px;
        /*background-size: 20px; */
        background-repeat: no-repeat;
        background-color: gray;
        -webkit-mask-image: url(/static/split-blocks.svg);
        mask-image: url(/static/split-blocks.svg);
        cursor: pointer;
      }
      .section-slug, .section-title {
        &.-manual {
          color: #337ab7;
        }
      }
      .-edit-mode {
        .section-options {
          .-option {
            &.-name {
              background: none;
              padding: 3px 0px 3px 0px;
            }
          }
        }
      }
    }
    i.refresh-toc {
      margin: 0px 3px;
      cursor: pointer;
      vertical-align: middle;
    }
    .toggle-sections-mode {
      i.fa {
        color: black;
      }
    }
    .btn-primary {
      i.fa {
        color: white;
      }
    }
    .btn {
      font-size: 14px;
      padding: 4px 10px;
      height: 34px;
      font-weight: 400;
      i.fa {
        vertical-align: middle;
      }
      &.book-build-disabled {
        color: #b1b1b1;
        i.fa {
          color: #b1b1b1;
        }
      }
      &.toc-book-settings {
        border: 1px solid #337AB7;
        i.fa {
          color: white;
        }
        background: url(/static/toc/settings.png);
        width: 47px;
        height: 34px;
        background-repeat: no-repeat;
        background-position: center;
      }
      &.toc-export {
        background: url(/static/toc/build.png);
        width: 50px;
        height: 34px;
        background-repeat: no-repeat;
        background-position: center;
        background-color: #337AB7;
      }
      &.btn-download-book {
        background: url(/static/toc/download.png);
        width: 45px;
        height: 34px;
        background-repeat: no-repeat;
        background-position: center;
        background-color: #337AB7;
      }
    }
    .section-generating {
      width: 20px;
      height: 20px;
      background-repeat: no-repeat;
      background-image: url(/static/preloader-bubble-20-gray.png);
      display: inline-block;
    }
    .book-generating {
      color: #b1b1b1;
      font-size: 12px;
      padding: 3px 10px;
      .book-generating-spinner {
        background-image: url(/static/preloader-bubble-20-white.png);
        display: inline-block;
        width: 20px;
        height: 20px;
        vertical-align: middle;
      }
    }
    .section-generating-hover {
      width: 84px;
      height: 20px;
      background-repeat: no-repeat;
      background-image: url(/static/preloader-horizontal-gray.png);
      display: inline-block;
      vertical-align: middle;
      background-position: bottom;
      position: absolute;
    }
    .book-zip-time {
      margin: 5px 2px;
    }
    .toc-buttons {
      display: table-row;
      .toc-button {
        display: table-cell;
        margin: 0px 5px;
        padding: 0px 5px;
        width: 105px;
        &.-toc-actions {
          width: 160px;
        }
        &.-refresh-toc {
          width: 115px;
          text-align: right;
        }
      }
    }
    span.validation-error {
      width: 100% !important;
      color: red;
      float: left !important;
    }
    .hidden-container {
      .-hidden {
        visibility: hidden;
      }
      .-visible {
        visibility: visible;
      }
      &:hover {
        .-hidden {
          visibility: visible;
        }
        .-visible {
          visibility: hidden;
        }
      }
    }
    .toc-display-settings {
      padding: 10px 7px 5px 7px;
      div {
        display: inline-block;
        width: auto;
        padding: 2px 14px 2px 0px;
        label {
          font-size: 14px;
          font-weight: 400;
          position: relative;
        }
        input[type="checkbox"] {
          /*width: 18px;
          height: 18px;
          margin: 0px 5px 0px 0px;
          vertical-align: middle;*/
          width: 0px;
          height: 0px;
          visibility: hidden;
        }
        input[type="checkbox"] + span {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 1px solid #CCCCCC;
          border-radius: 2px;
          vertical-align: middle;
          margin: 0px 5px 0px 0px;
        }
        input[type="checkbox"]:checked + span {
          background-color: #337AB7;
          &:after {
            content: '';
            position: absolute;
            width: 11px;
            height: 6px;
            background: transparent;
            top: 5px;
            left: 4px;
            border: 2px solid white;
            border-top: none;
            border-right: none;
            transform: rotate(-45deg);
          }
        }
      }
    }
  }
</style>
