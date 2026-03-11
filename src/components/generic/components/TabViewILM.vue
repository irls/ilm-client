<template>
    <div :class="contentClasses">
        <div class="p-tabview-nav-container">
          <button v-show="scrollable && !backwardIsDisabled" ref="prevBtn" :class="prevButtonClasses" :disabled="backwardIsDisabled" @click="navBackward" type="button">
            <span class="pi pi-chevron-left"></span>
          </button>
                <div ref="content" class="p-tabview-nav-content" @scroll="onScroll">
                    <ul ref="nav" class="p-tabview-nav" role="tablist">
                        <li role="presentation"
                          v-for="(tab, i) of tabs" :key="getKey(tab, i)"
                          :class="[{'p-highlight': (d_activeIndex === i), 'p-disabled': isTabDisabled(tab)}, tabDisabledClass(tab), tabHeadClass(tab)]">
                            <a role="tab" class="p-tabview-nav-link"
                              :id="'t-'+tabId(tab)"
                              @click="onTabClick($event, i)"
                              @keydown="onTabKeydown($event, i)"
                              :tabindex="isTabDisabled(tab) ? null : '0'" :aria-selected="d_activeIndex">
                                <span class="p-tabview-title" v-if="tab.header">{{tab.header}}</span>
                                <TabPanelHeaderSlot :tab="tab" v-if="tab.$scopedSlots.header"/>
                            </a>
                        </li>
                        <li v-if="showAddTab" role="presentation" class="add-tab-button">
                          <div class="p-tabview-title add-tab">
                            <button class="btn btn-primary" :disabled="false" @click="onAddTabClick">
                              <i class="glyphicon glyphicon-remove-circle"></i>
                            </button>
                          </div>
                        </li>
                        <li class="divider-line"> </li>
                        <li ref="inkbar" class="p-tabview-ink-bar"></li>
                    </ul>
                </div>
                <button v-show="scrollable && !forwardIsDisabled" ref="nextBtn" :class="nextButtonClasses" :disabled="forwardIsDisabled" @click="navForward" type="button">
            <span class="pi pi-chevron-right"></span>
          </button>
        </div>
        <div class="p-tabview-panels">
            <slot></slot>
        </div>
    </div>
</template>

<script>
import DomHandler from 'primevue/utils/DomHandler';
import ObjectUtils from 'primevue/utils/ObjectUtils';

const TabPanelHeaderSlot = {
    functional: true,
    props: {
        tab: {
            type: null,
            default: null
        }
    },
    render(createElement, context) {
        return [context.props.tab.$scopedSlots['header']()];
    }
};

export default {
    props: {
        activeIndex: {
            type: Number,
            default: 0
        },
        scrollable: {
            type: Boolean,
            default: false
        },
        showAddTab: {
            type: Boolean,
            default: false
        },
        onAddTab: {
            type: Function,
            default: function(){}
        }
    },
    data() {
        return {
            allChildren: [],
            d_activeIndex: this.activeIndex,
            backwardIsDisabled: true,
            forwardIsDisabled: true
        };
    },
    watch: {
        activeIndex(newValue) {
            this.d_activeIndex = newValue;
            this.updateScrollBar(newValue);
        }
    },
    mounted() {
        this.allChildren = this.$children;
        this.updateInkBar();
    },
    updated() {
        this.updateInkBar();
        if (this.forwardIsDisabled) this.updateButtonState();
    },
    methods: {
        onResize() {
          this.updateInkBar();
          this.updateButtonState();
        },
        onTabClick(event, i) {
            if (!this.isTabDisabled(this.tabs[i]) && i !== this.d_activeIndex) {
                this.d_activeIndex = i;
                this.$emit('update:activeIndex', this.d_activeIndex);

                this.$emit('tab-change', {
                    originalEvent: event,
                    index: i,
                    header: this.tabs[i].header
                });

                this.updateScrollBar(i);
            }

            this.$emit('tab-click', {
                originalEvent: event,
                index: i
            });
        },
        onTabKeydown(event, i) {
            if (event.which === 13) {
                this.onTabClick(event, i);
            }
        },
        onAddTabClick() {
          this.$emit('onAddTab');
        },
        updateInkBar() {
          if (this.$refs.nav.children.length > 1) {
            let tabHeader = this.$refs?.nav?.children[this.d_activeIndex];
            if (tabHeader) {
              this.$refs.inkbar.style.width = DomHandler.getWidth(tabHeader) + 'px';
              this.$refs.inkbar.style.left =  DomHandler.getOffset(tabHeader).left - DomHandler.getOffset(this.$refs.nav).left + 'px';
            }
          }
        },
        updateScrollBar(index) {
            let tabHeader = this.$refs.nav.children[index];
            tabHeader.scrollIntoView({ block: 'nearest' });
        },
        updateButtonState() {
            const content = this.$refs.content;
            const { scrollLeft, scrollWidth } = content;
            const width = DomHandler.getWidth(content);
            this.backwardIsDisabled = scrollLeft <= 0;
            this.forwardIsDisabled = Math.round(scrollLeft) >= scrollWidth - width;
        },
        getKey(tab, index) {
            return tab.header ? ObjectUtils.resolveFieldData(tab, tab.header) : index;
        },
        isTabDisabled(tab) {
            return tab.disabled;
        },
        tabDisabledClass(tab) {
            return tab?.$attrs['data-tab-class'] || '';
        },
        tabHeadClass(tab) {
            return tab?.$attrs['data-tab-head-class'] || '';
        },
        tabIndex(tab) {
            return 1*(tab?.$attrs['data-idx'] || 0);
        },
        tabId(tab) {
            return tab.$attrs['id'] || '';
        },
        onScroll(event) {
            this.scrollable && this.updateButtonState();
            event.preventDefault();
        },
        getVisibleButtonWidths() {
            const { prevBtn, nextBtn } = this.$refs;
            return [prevBtn, nextBtn].reduce((acc, el) => el ? acc + DomHandler.getWidth(el) : acc, 0);
        },
        navBackward() {
            const content = this.$refs.content;
            const width = DomHandler.getWidth(content) - this.getVisibleButtonWidths();
            const pos = content.scrollLeft - width;
            content.scrollLeft = pos <= 0 ? 0 : pos;
        },
        navForward() {
            const content = this.$refs.content;
            const width = DomHandler.getWidth(content) - this.getVisibleButtonWidths();
            const pos = content.scrollLeft + width;
            const lastPos = content.scrollWidth - width;
            content.scrollLeft = pos >= lastPos ? lastPos : pos;
        }
    },
    computed: {
      contentClasses() {
        return ['p-tabview p-component', {'p-tabview-scrollable': this.scrollable}];
      },
      prevButtonClasses() {
        return ['p-tabview-nav-prev p-tabview-nav-btn p-link', {'p-disabled': this.backwardIsDisabled}]
      },
      nextButtonClasses() {
        return ['p-tabview-nav-next p-tabview-nav-btn p-link', {'p-disabled': this.forwardIsDisabled}]
      },
      tabs() {
        let tabs = [];
        if (this.allChildren) {
          tabs = this.allChildren
          .filter(child => child.$vnode.tag.indexOf('tabpanel') !== -1);
        }
        return tabs;
      }
    },
    components: {
      'TabPanelHeaderSlot': TabPanelHeaderSlot
    },
    directives: {
    }
}
</script>

<style scoped>
.p-tabview-nav-container {
    position: relative;
}

.meta-edit-tabs .p-tabview-nav-container {
    /*position: sticky;*/
    top: -0px;
    background-color:white;
    z-index: 2;
    min-height: 37px;
}

.meta-edit-tabs.p-tabview {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.p-tabview-scrollable .p-tabview-nav-container {
    overflow: hidden;
}

.p-tabview-nav-content {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
    overscroll-behavior: contain auto;
    padding-top: 2px;
}

.meta-edit-tabs .p-tabview-nav-content {
  padding-top: 1px;
  min-height: 37px;
}

.p-tabview-nav {
    display: flex;
    margin: 0;
    padding: 0;
    list-style-type: none;
    flex: 1 1 auto;
}

.p-tabview-nav-link {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    position: relative;
    text-decoration: none;
    overflow: hidden;
}

.p-tabview .p-tabview-panels {
    padding: 0;
}

.meta-edit-tabs.p-tabview .p-tabview-panels {
    flex-grow: 1;
    overflow-y: auto;
}

.meta-edit-tabs .divider-line {
  flex-grow: 1;
}

.p-tabview .p-tabview-nav li .p-tabview-nav-link {
    color: #337ab7;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 14px;
    font-weight: 200;
    margin: 0;
    border-width: 0;
}

.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
    color: #333;
    border: none;
}

.p-tabview .p-tabview-nav li {
    border-bottom: 1px solid #ddd;
    /*wide tabs*/ padding: 0 1px;
}

.p-tabview .p-tabview-nav li.add-tab-button {
    padding: 0;
    border-bottom: 1px solid #ddd;
}

.p-tabview .p-tabview-nav li.p-highlight {
    border: 1px solid #ddd;
    border-top-right-radius: 3px;
    border-top-left-radius: 3px;
    border-bottom-color: transparent;
    padding: 0 2px;
}

.p-tabview .p-tabview-nav li.p-highlight.add-tab-button {
    padding: 0;
}

.p-tabview-ink-bar {
    display: none;
    z-index: 1;
}

.p-tabview-nav-link:focus {
    z-index: 1;
}

.p-tabview-title {
    line-height: 1;
    white-space: nowrap;
}

.p-tabview-title.add-tab {
  line-height: 1;
  white-space: nowrap;

  button {
    border-radius: 3px 3px 0 0;
    padding: 6px 6px 1px 5px;
    i {
      color: white;
      transform: rotate(45deg);
      font-size: 22px
    }
  }
}

.p-tabview-nav-btn {
    position: absolute;
    top: 0;
    z-index: 2;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.p-tabview-nav-prev {
    left: 0;
}

.p-tabview-nav-next {
    right: 0;
}

.p-tabview-nav-content::-webkit-scrollbar {
    display: none;
}

.p-tabview .p-tabview-panels .p-tabview-panel.disabled {
  visibility: hidden;
}

.p-tabview.p-component .p-tabview-nav-content .p-tabview-nav .hide-tab-if-disabled.p-disabled {
  display: none;
}


</style>
