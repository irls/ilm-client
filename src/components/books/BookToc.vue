<template>
  <fieldset class="toc-items-list">
    <legend>Table of contents</legend>
    <template v-if="isBlocked && blockers.indexOf('loadBookToc') >-1">
      <div class="preloader-spinner"></div>
    </template>
    <template v-else>
      <div v-if="pendingSectionUpdate" class="pending-section-update"></div>
      <TOCSettingsModal v-if="tocSettingsModalActive"
        @close="closeSettings"
        @save="saveSettings" />
      <div class="toc-buttons">
        <div class="toc-button">
          <template v-if="adminOrLibrarian">
            <button class="btn btn-default toggle-sections-mode" v-on:click="toggleSectionsMode()" v-if="!sectionsMode" title="Show sections">
              <i class="fa fa-eye-slash"></i>
              Sections
            </button>
            <button class="btn btn-default toggle-sections-mode" v-on:click="toggleSectionsMode()" title="Hide sections" v-else>
              <i class="fa fa-eye"></i>
              Sections
            </button>
          </template>
        </div>
        <div class="toc-button -toc-actions">
          <template v-if="sectionsMode && adminOrLibrarian">
            <span class="btn btn-primary book-generating" v-if="tocSectionBook.isBuilding">
              <span class="book-generating-spinner"></span>
            </span>
            <template v-else>
              <button class="btn btn-default btn-build-book toc-book-settings" v-on:click="openSettings($event)" title="Name and Title generation pattern">
              </button>
              <button class="btn btn-primary btn-build-book toc-export" v-if="buildBookButtonEnabled" v-on:click="exportBook($event)" title="Build">
              </button>
              <span class="btn btn-primary btn-build-book -disabled toc-export" title="Build" v-else>
              </span>
              <a class="btn btn-primary btn-download-book" :href="downloadBookLink()" target="_blank" v-if="tocSectionBook.zipPath && !tocSectionBook.isBuilding" title="Download">
              </a>
              <span class="btn btn-primary -disabled btn-download-book" title="Download" v-else>
              </span>
            </template>
          </template>
        </div>
        <div class="toc-button -refresh-toc">
          <button class="btn btn-default refresh-toc" v-on:click="loadBookTocProxy(true)" title="Refresh">
            <i class="fa fa-refresh refresh-toc"></i>
          </button>
        </div>
      </div>
      <div v-if="tocSectionBook.zipTime && sectionsMode" class="book-zip-time">
        Latest build: {{convertTime(new Date(tocSectionBook.zipTime).toISOString(), true)}}
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
                <td colspan="6" v-on:dblclick="sectionEditMode(toc.section, 'slug', $event)" v-on:click="sectionEditMode(toc.section, 'slug', $event)" :class="['hidden-container', {'-edit-mode': editingSectionId === toc.section.id, '-is-building': toc.section.isBuilding}]">
                  <div class="section-options">
                    <div class="-option -index">
                      {{toc.section.index}}
                    </div>
                    <div :class="['-option -name', '-lang-' + toc.section.firstSectionBlock.language]">
                      <template v-if="editingSectionId === toc.section.id && editingFieldName === 'slug'">
                        <input type="text" :class="['edit-section-slug', {'-has-error': validationErrors['slug'][toc.section.id]}]" 
                          v-model="editingFieldValue"
                          v-on:keyup.enter="blurEditingField(null)"
                          v-on:change="updateSectionField(editingFieldValue)"
                          v-on:blur="blurEditingField(null)"
                          v-on:input="editingFieldChanged($event)" />
                      </template>
                      <label :title="toc.section.slug" :class="['section-slug', {'-manual': toc.section.manualSlug, 'no-section-title': !toc.section.slug}]" v-else>{{toc.section.slug ? toc.section.slug : 'Define Name'}}</label>
                    </div>
                    <div class="options-container">
                      <div class="section-generating-hover -visible" v-if="toc.section.isBuilding"></div>
                      <div class="-option -remove -hidden">
                        <i class="fa fa-remove" disabled title="Delete section" v-if="toc.section.isBuilding || tocSectionBook.isBuilding"></i>
                        <i class="fa fa-remove" v-on:click="removeSection(toc.section.id)" title="Delete section" v-else></i>
                      </div>
                      <div :class="['-option', '-build', '-hidden', {'-building': toc.section.isBuilding}]">
                        <!-- {{toc.section.zipPath}},{{toc.section.zipPath && !toc.section.buildModified ? true : false}} -->
                        <div class="section-generating" v-if="toc.section.isBuilding"></div>
                        <template v-else>
                          <i class="" :title="toc.section.zipPath ? 'Rebuild' : 'Build'" disabled v-if="toc.section.zipPath && !toc.section.buildModified"></i>
                          <i class="" :title="toc.section.zipPath ? 'Rebuild' : 'Build'" v-on:click="exportSection(toc.section.id, $event)" v-else></i>
                        </template>
                      </div>
                      <a class="-option -download -hidden" :href="downloadSectionLink(toc.section.id)" target="_blank" v-if="toc.section.zipPath && !toc.section.isBuilding && !tocSectionBook.isBuilding">
                        <i class="" title="Download"></i>
                      </a>
                      <a class="-option -download -hidden" v-else>
                        <i class="" title="Download" disabled></i>
                      </a>
                      </div>
                  </div>
                    <span class="validation-error" v-if="validationErrors['slug'][toc.section.id]">
                      {{validationErrors['slug'][toc.section.id].text}}
                    </span>
                </td>
              </tr>
            </template>
            <tr :class="['toc-section-title', '-num-' + toc.section.index, '-lang-' + toc.section.firstSectionBlock.language]" v-if="displayTitle && toc.section && toc.section.id">
              <td colspan="6" v-on:click="sectionEditMode(toc.section, 'title', $event)" v-on:dblclick="sectionEditMode(toc.section, 'title', $event)">
                <template v-if="editingSectionId === toc.section.id && editingFieldName === 'title'">
                  <input type="text" :class="['edit-section-title', {'-has-error': validationErrors['title'][toc.section.id]}]"
                    v-model="editingFieldValue"
                    v-on:keyup.enter="blurEditingField(null)"
                    v-on:change="updateSectionField(editingFieldValue)"
                    v-on:blur="blurEditingField(null)"
                    v-on:input="editingFieldChanged($event)" />
                </template>
                <template v-else>
                  <div class="section-title">
                    <label :class="['section-title', {'no-section-title': !toc.section.title, '-manual': toc.section.manualTitle}]" :title="toc.section.title">{{toc.section.title || 'Define Title'}}</label>
                  </div>
                </template>
              </td>
            </tr>
            <tr :class="['toc-section-title-en', '-num-' + toc.section.index]" v-if="displayTitleEnSection(toc.section)">
              <td colspan="6" v-on:click="sectionEditMode(toc.section, 'titleEn', $event)" v-on:dblclick="sectionEditMode(toc.section, 'titleEn', $event)">
                <template v-if="editingSectionId === toc.section.id && editingFieldName === 'titleEn'">
                  <input type="text" :class="['edit-section-titleEn', {'-has-error': validationErrors['titleEn'][toc.section.id]}]"
                    v-model="editingFieldValue"
                    v-on:keyup.enter="blurEditingField(null)"
                    v-on:change="updateSectionField(editingFieldValue)"
                    v-on:blur="blurEditingField(null)"
                    v-on:input="editingFieldChanged($event)" />
                </template>
                <template v-else>
                  <label :class="['section-title-en', {'no-section-title': !toc.section.titleEn}]" :title="toc.section.titleEn">{{toc.section.titleEn || 'Define Title English'}}</label>
                </template>
              </td>
            </tr>
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
                <template v-if="(!toc.section || !toc.section.id) && sectionsMode && displayTOC">
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
      sectionsMode: false,
      tocSectionCombined: [],
      editingSectionId: null,
      validationErrors: {
        slug: {},
        title: {},
        titleEn: {},
      },
      editingFieldValue: '',
      editingFieldName: '',
      tocSettingsModalActive: false,
      displaySettings: {
        title: false,
        titleEn: false,
        toc: true
      },
      validationErrorsText: {
        unique: {
          slug: 'Section name is not unique',
          title: '',
        },
        empty: {
          slug: 'Define section Name'
        }
      }
    }
  },

  props: [
    /*'bookId',*/
  ],
  
  components: {
    TOCSettingsModal
  },
  
  mixins: [api_config, time_methods],


  computed: {
    ...mapGetters(['isBlocked', 'blockers', 'currentBookToc', 'currentBookid', 'adminOrLibrarian']),
    ...mapGetters('tocSections', ['tocSectionBook', 'currentBookTocCombined', 'bookTocSections', 'pendingSectionUpdate']),
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
      this.clearErrors();
      this.sectionEditMode(null);
      this.loadBookTocSections([]);
      this.loadBookToc({bookId: this.currentBookid, isWait: isWait})
      .then((res)=>{
        
      })
      .catch((err)=>{
        
      });
    },
    
    toggleSectionsMode() {
      this.sectionsMode = !this.sectionsMode;
    },
    
    sectionEditMode(section, field, event) {
      if (event && event.target) {
        if (event.target.classList && event.target.classList.contains('fa')) {
          return;
        }
        if (event.target.nodeName === 'I') {
          return;
        }
        if (event.target.type === 'text') {
          return;
        }
      }
      let checkEvent = new Promise((resolve, reject) => {
        if (section && event && event.type === 'click') {
          setTimeout(() => {
            if (!this.editingSectionId || (section.id && section.id !== this.editingSectionId) || (!section.id && section !== this.editingSectionId) || this.editingFieldName !== field) {
              return resolve(true);
            }
            return resolve(false);
          }, 100);
        } else {
          return resolve(true);
        }
      });
      return checkEvent
        .then((setSection) => {
          if (!setSection) {
            return false;
          }
          let cursorPosition = null;
          if (section) {
            try {
              let selection = window.getSelection().getRangeAt(0);
              cursorPosition = selection.startOffset;
              //if (selection.startContainer)
              //console.log(selection.startContainer.nodeName);
            } catch (e) {

            }
          }
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
                if (this.tocSectionBook.isBuilding || section.isBuilding) {
                  return false;
                }
                if (this.editingSectionId !== section.id || field !== this.editingFieldName) {
                  if (this.editingSectionId && this.hasError()) {
                    this.showNameError();
                    return false;
                  }
                  this.setEditingSection(section, field);
                  this.focusEditingField(false, cursorPosition);
                }
                return resolve();
              } else {
                if (!this.editingSectionId || !this.hasError(this.editingSectionId, this.editingFieldName)) {
                  this.setEditingSection(null);
                }
                return resolve();
              }
            });
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
                if (this.displayTitleEnSection(targetSection)) {
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
                  if (this.displayTitleEnSection(targetSection)) {
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
                } else if (this.displayTitleEnSection(targetSection)) {
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
            let nextSection;
            if (isPrev) {
              for (let i = targetSection.index - 1; i >=0; --i) {
                if (!nextSection) {
                  let section = this.currentBookTocCombined.find(toc => {
                    return toc.section && toc.section.index === i;
                  });
                  if (section) {
                    if (section.section && (targetField !== 'titleEn' || (section.section.firstSectionBlock && section.section.firstSectionBlock.language !== 'en'))) {
                      nextSection = section;
                    }
                  }
                }
              }
            } else {
              for (let i = targetSection.index + 1; i <= this.currentBookTocCombined.length; ++i) {
                if (!nextSection) {
                  let section = this.currentBookTocCombined.find(toc => {
                    return toc.section && toc.section.index === i;
                  });
                  if (section) {
                    if (section.section && (targetField !== 'titleEn' || (section.section.firstSectionBlock && section.section.firstSectionBlock.language !== 'en'))) {
                      nextSection = section;
                    }
                  }
                }
              }
            }
            if (nextSection) {
              targetSection = nextSection.section;
            }
          }
          if (targetField && targetSection) {
            event.preventDefault();
            let currentField = document.querySelector('[class^=edit-section-]');
            if (currentField) {
              currentField.dispatchEvent(new Event('change'));
            }
            this.sectionEditMode(null);
            Vue.nextTick(() => {
              this.sectionEditMode(targetSection, targetField)
                .then(() => {
                  Vue.nextTick(() => {
                    let editingField = document.querySelector('[class^=edit-section-]');
                    if (editingField) {
                      editingField.select();
                    }
                  });
                });
            });
          }
        }
      }
    },
    
    validateSectionField(value, field, section_id = null) {
      if (field !== 'slug') {// only slug now checked for unique and not empty
        return true;
      }
      if (!section_id) {
        section_id = this.editingSectionId;
      }
      let editingSection = this.currentBookTocCombined.find(tc => {
        return tc.section && tc.section.id === section_id;
      }).section;
      if (!editingSection) {
        return false;
      }
      delete this.validationErrors[field][editingSection.id];
      //if (!value) {
        //return true;
      //}
      if (!value) {
        this.validationErrors[field][editingSection.id] = {text: this.validationErrorsText.empty[field], type: 'empty'};
        this.$forceUpdate();
        return false;
      }
      let section = this.currentBookTocCombined.find(tc => {
        return tc.section && tc.section[field] === value && tc.section.id !== section_id;
      });
      if (section) {
        this.validationErrors[field][editingSection.id] = {text: this.validationErrorsText.unique[field], type: 'unique'};
        this.$forceUpdate();
        return false;
      }
      this.$forceUpdate();
      return true;
    },
    
    updateSection(update) {
      if (this.editingSectionId) {
        let updateSectionId = this.editingSectionId;
        let editingFieldName = this.editingFieldName;
        return this.updateBookTocSection([updateSectionId, update])
          .then(response => {
            if (updateSectionId === this.editingSectionId && editingFieldName === this.editingFieldName) {
              this.sectionEditMode(null);
            }
            return Promise.resolve();
          });
      }
    },
    
    updateSectionField(value) {
      value = value.trim();
      if (this.editingSectionId) {
        let section = this.bookTocSections.find(sect => {
          return sect.id === this.editingSectionId;
        });
        if (section) {
          if (!value || this.validateSectionField(value, this.editingFieldName)) {
            if (section[this.editingFieldName] !== this.editingFieldValue) {
              let update = {buildModified: section.zipPath ? true : false};
              update[this.editingFieldName] = value;
              if (value) {
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
              }
              let reCheckErrors = this.editingFieldName === 'slug';
              return this.updateSection(update)
                .then(() => {
                  if (reCheckErrors) {
                    Object.keys(this.validationErrors.slug).forEach(sectionId => {
                      if (sectionId !== section.id) {
                        let sect = this.bookTocSections.find(s => {
                          return s.id === sectionId;
                        });
                        if (sect) {
                          this.validateSectionField(sect.slug, 'slug', sectionId);
                        }
                      }
                    })
                  }
                  return Promise.resolve();
                })
                .catch(err => {
                  let slugError = err ? err.message : '';
                  let slugErrorType = '';
                  if (err && err.response && err.response.data) {
                    switch (err.response.data) {
                      case 'slug_not_unique':
                        slugError = 'Section name is not unique';
                        slugErrorType = 'unique';
                        break;
                    }
                  }
                  if (slugError) {
                    //tc.section.slug = slug;
                    this.sectionEditMode(section, this.editingFieldName)
                      .then(() => {
                        //this.editingFieldValue = '';
                        //Vue.nextTick(() => {
                          this.editingFieldValue = value;
                          this.validationErrors.slug[section.id] = {text: slugError, type: slugErrorType};
                          this.$forceUpdate();
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
              this.sectionEditMode(section, this.editingFieldName);
            //}, 5000);
          }
        }
      }
    },
    
    createSectionFromItem(blockid) {
      return this.createBookTocSection({startBlockid: blockid, bookid: this.currentBookToc.bookId});
    },
    
    exportSection(id, ev) {
      let section = this.bookTocSections.find(se => {
        return se.id === id;
      });
      if (!section) {
        return false;
      }
      if (!this.validationErrors.slug[section.id]) {
        if (!this.validateSectionField(section.slug, 'slug', section.id)) {
          this.showNameError();
          return false;
        }
      }
      if (this.checkOnAction(id, ev)) {
        section.isBuilding = true;
        return this.exportTocSection(id);
      }
    },
    
    exportBook(ev) {
      let slugErrors = Object.keys(this.validationErrors.slug).length;
      if (slugErrors > 0 || !this.fullValidate()) {
        this.showNameError();
        return false;
      }
      this.exportTocSectionBook();
    },
    
    downloadSectionLink(sectionId) {
      return this.getAPILink(`toc_section_export/${encodeURIComponent(sectionId)}/download`);
    },
    
    downloadBookLink() {
      return this.getAPILink(`toc_section_export/book/${this.currentBookToc.bookId}/download`);
    },
    
    hasError(section_id = null, field = null) {
      let hasError = false;
      Object.keys(this.validationErrors).forEach(k => {
        if (!hasError && this.validationErrors[k]) {
          if (!field || k === field) {
            if (!section_id && Object.keys(this.validationErrors[k]).length > 0) {
              hasError = true;
            } else if (section_id && this.validationErrors[k][section_id]) {
              hasError = true;
            }
          }
        }
      });
      return hasError;
    },
    
    editingFieldChanged(event) {
      delete this.validationErrors[this.editingFieldName][this.editingSectionId];
    },
    
    checkOnAction(sectionId = null, ev = null) {
      if (this.hasError(sectionId)) {
        this.showNameError();
        if (ev) {
          ev.preventDefault();
        }
        return false;
      }
      return true;
    },
    
    showNameError() {
      let slugErrors = Object.keys(this.validationErrors.slug);
      if (slugErrors.length > 0) {
        let empty = [];
        let unique = [];
        slugErrors.forEach(sectionId => {
          let section = this.bookTocSections.find(sc => {
            return sc.id === sectionId;
          });
          if (section) {
            switch (this.validationErrors.slug[sectionId].type) {
              case 'empty':
                empty.push(section.index);
                break;
              case 'unique':
                unique.push(section.index);
                break;
            }
          }
        });
        if (empty.length > 0) {
          if (empty.length > 5) {
            empty = empty.slice(0, 3).concat(['... ' + empty.pop()]);
          }
          this.$root.$emit('show-modal', {
            title: 'Define section name',
            text: `Book section(s) ${empty.join(', ')} Name is not defined`,
            buttons: [
              {
                title: 'Ok',
                handler: () => {
                  this.$root.$emit('hide-modal');
                },
                class: ['btn', 'btn-primary'],
              }
            ]
          });
        } else if (unique.length > 0) {
          if (unique.length > 5) {
            unique = unique.slice(0, 3).concat(['... ' + unique.pop()]);
          }
          this.$root.$emit('show-modal', {
            title: 'Duplicate section name',
            text: `Book section(s) ${unique.join(', ')} Name is not unique`,
            buttons: [
              {
                title: 'Ok',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //this.focusEditingField('middle');
                },
                class: ['btn btn-primary']
              }
            ]
          });
        }
      }
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
        this.validationErrors[k] = {};
      });
    },
    
    focusEditingField(scrollTo = false, cursorPosition = null) {
      Vue.nextTick(() => {
        let el = document.getElementsByClassName('edit-section-' + this.editingFieldName);
        if (el && el[0]) {
          if (cursorPosition !== null) {
            this.setCursorPosition(cursorPosition);
          }
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
    
    setCursorPosition(caretPos) {
      if (caretPos === null) {
        return;
      }
      let elem = document.getElementsByClassName('edit-section-' + this.editingFieldName);

      if(elem && elem[0]) {
        elem = elem[0];
        if(elem.createTextRange) {
          let range = elem.createTextRange();
          range.move('character', caretPos);
          range.select();
        } else {
          if(elem.selectionStart) {
            elem.focus();
            elem.setSelectionRange(caretPos, caretPos);
          }
          else {
            elem.focus();
          }
        }
      }
    },
    
    blurEditingField() {
      let tc = this.currentBookTocCombined.find(toc => {
        return toc.section && toc.section.id === this.editingSectionId;
      });
      if (tc && tc.section && tc.section[this.editingFieldName] === this.editingFieldValue && !this.validationErrors[this.editingFieldName][this.editingSectionId]) {
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
      let update = {};
      if (this.tocSectionBook.namePattern !== settings.namePattern) {
        this.tocSectionBook.namePattern = settings.namePattern;
        update.namePattern = settings.namePattern;
      }
      if (this.tocSectionBook.titlePattern !== settings.titlePattern) {
        this.tocSectionBook.titlePattern = settings.titlePattern;
        update.titlePattern = settings.titlePattern;
      
      }
      return this.updateTocSectionBook([this.tocSectionBook.id, update])
        .then(updated => {
          //this.bookTocSections.forEach(section => {
            //console.log(section.id, section.slug);
          //});
          Object.keys(this.validationErrors).forEach(typeError => {
            this.validationErrors[typeError] = {};
          });
        });
    },
    fullValidate() {
      let errors = 0;
      this.currentBookTocCombined.forEach(toc => {
        if (toc.section && toc.section.id) {
          errors+= this.validateSectionField(toc.section.slug, 'slug', toc.section.id) ? 0 : 1;
        }
      });
      return errors > 0 ? false : true;
    },
    
    displayTitleEnSection(section) {
      return this.displayTitleEn && section && section.id && section.firstSectionBlock.language !== 'en';
      
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
      /*if (this.$route.params.hasOwnProperty('bookid')) {
        if (this.currBookId !== this.$route.params.bookid) {
          this.currBookId = this.$route.params.bookid;
          this.loadBookTocProxy();
          this.loadBookTocSections([this.currBookId]);
        }
      }*/
    },
    'currentBookid': {
      handler() {
        this.sectionsMode = false;
        this.tocSettingsModalActive = false;
        this.validationErrors = {
          slug: {},
          title: {},
          titleEn: {},
        };
        this.displaySettings = {
          title: false,
          titleEn: false,
          toc: true
        };
        if (this.currentBookid) {
          this.loadBookTocProxy(true);
          this.loadBookTocSections([]);
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
    position: static;
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
          font-weight: 400;
        }
        .toc-section-title, .toc-section-title-en {
          max-width: 290px;
          label {
            margin-left: 25px;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            max-width: 295px;
          }
          div.section-title {
            width: 295px;
            max-width: 295px;
          }
          &.-lang-fa, &.-lang-ar {
            label, input {
              direction: rtl;
              max-width: 295px;
              /*margin-left: 0px;*/
              /*padding-right: 90px;*/
            }
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
            padding: 0px 5px 0px 0px;
            margin: 0px 5px;
          }
          &.-name {
            background: linear-gradient(
                transparent, 
                transparent 45%, 
                rgb(93, 93, 93) 55%, 
                transparent 55%, transparent
                );
            /*padding: 3px 5px 3px 0px;*/
            width: 295px;
            max-width: 295px;
            color: gray;
            padding: 0px 5px 0px 0px;
            margin: 0px 5px;
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
            /*.fa[disabled] {
              color: #d6d6d6;
            }*/
            i {
              background: url(/static/toc/download-section.png);
              width: 24px;
              height: 24px;
              display: inline-block;
              vertical-align: middle;
              &[disabled] {
                background: url(/static/toc/download-section-disabled.png);
              }
            }
          }
          &.-build {
            /*.fa[disabled] {
              color: #d6d6d6;
            }*/
            i {
              background: url(/static/toc/build-section.png);
              width: 24px;
              height: 24px;
              display: inline-block;
              vertical-align: middle;
              cursor: pointer;
              &[disabled] {
                background: url(/static/toc/build-section-disabled.png);
              }
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
        .options-container {
          width: 93px;
          height: 32px;
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
      /*label {
        &.section-slug, &.section-title, &.section-title-en {
          user-select: none;
          -moz-user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
        }
      }*/
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
        &.-disabled {
          /*background: url(/static/toc/build-disabled.png);*/
          background-color: rgba(51, 122, 183, 0.5);
          /*background-repeat: no-repeat;
          background-position: center;*/
          border: none;
        }
      }
      &.btn-download-book {
        background: url(/static/toc/download.png);
        width: 45px;
        height: 34px;
        background-repeat: no-repeat;
        background-position: center;
        background-color: #337AB7;
        &.-disabled {
          background-color: rgba(51, 122, 183, 0.5);
          border: none;
        }
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
        height: 25px;
        vertical-align: middle;
        background-repeat: no-repeat;
        background-position: center;
      }
    }
    .section-generating-hover {
      width: 85px;
      height: 20px;
      background-repeat: no-repeat;
      background-image: url(/static/preloader-horizontal-gray.png);
      display: inline-block;
      /*vertical-align: middle;*/
      background-position: bottom;
      /*position: absolute;*/
    }
    .book-zip-time {
      margin: 5px 2px;
    }
    .toc-buttons {
      display: table-row;
      position: sticky;
      top: 44px;
      /*top: 0px;*/
      background-color: white;
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
      &.-is-building:not(:hover) {
        .-hidden {
          &.-option {
            width: 0px;
            padding: 0px;
            height: 0px;
            margin: 0px;
            i, div {
              width: 0px;
              height: 0px;
              margin: 0px;
            }
            &.-download {
              i {
                width: 0px;
                height: 0px;
                margin: 0px;
              }
            }
          }
        }
      }
      &.-is-building:hover {
        .section-generating-hover {
          width: 0px;
          display: none;
        }
      }
    }
    .toc-display-settings {
      padding: 10px 7px 5px 7px;
      position: sticky;
      top: 78px;
      /*top: 35px;*/
      background-color: white;
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
  .pending-section-update {
    width: 445px;
    height: 100vh;
    position: absolute;
    background: rgba(0, 0, 0, 0.2);
    opacity: 1;
    z-index: 100;
    top: 85px;
    background-image: url(/static/preloader-arrows.gif);
    background-repeat: no-repeat;
    background-position: center;
  }
</style>
