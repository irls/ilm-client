<template>
  <div class="sidebar">

    <div id='bookmeta' v-if="currentBook" class="sidebar-bookmeta">
      <div class='booktopinfo'>
        <template v-if="isAdmin">
          <button class="hidden" v-on:click="removeBook()">Remove</button>
        </template>
      </div>

      <div class="container-fluid">
        <div class="row"> <!--style="height: 0"-->
          <div class="download-area col-sm-6">
          </div>
        </div>
      </div>

      <BookDownload v-if="showModal" @close="showModal = false" />

      <div class="book-listing">
        <vue-tabs ref="panelTabs" class="meta-edit-tabs">
          <vue-tab title="Assignments" id="assignments">
            <BookAssignments
              @audioImportOk="checkAfterAudioImport"
              ></BookAssignments>
          <fieldset class='description brief'>
            <legend>Description </legend>
            <textarea v-model='jobDescription' @input="updateJobDescription($event)" :disabled="!adminOrLibrarian" maxlength="2000" class="jobinfo-description"></textarea>
          </fieldset>
          <fieldset class='hashtags' :disabled="!adminOrLibrarian">
            <legend>Project tags</legend>
            <VTagSuggestion :key="handleHashTags" ref="hashTags" :tags="currentBook.hashTags || []" :suggestions="hashTagsSuggestions" :suggestionLength="100" @removeItem="removeTag" @addItem="addTag"/>
          </fieldset>
            <BookWorkflow
              v-if="adminOrLibrarian"
              :isPublishingQueue="isPublishingQueue"
              ></BookWorkflow>
          <fieldset class='Export' v-if="isAllowExportAudio" :disabled="getDemoStatus == 'progress'">
            <legend>Export book </legend>
              <div v-if="getDemoStatus == 'progress' " class="align-preloader -small">&nbsp;</div>
              <div v-if="getDemoStatus == 'rebuild'" style="margin-bottom: 5px;">Last build: {{this.convertTime(currentBook.demo_time)}}</div>
              <div>
                <button class="btn btn-primary" v-if="getDemoStatus == 'build' || getDemoStatus == 'failed'" v-on:click="downloadDemo()" :disabled="!isAllowExportAudio || getDemoStatus == 'progress'">Build</button>
                <button class="btn btn-primary" v-if="getDemoStatus == 'rebuild' || getDemoStatus == 'progress'" v-on:click="downloadDemo()" :disabled="!isAllowExportAudio || getDemoStatus == 'progress'">Rebuild</button>
              </div>
              <hr  v-if="getDemoStatus == 'rebuild' || getDemoStatus == 'progress'">
              <div v-if="getDemoStatus == 'rebuild' || getDemoStatus == 'progress'">
                <template v-if="displayDownloadDemo">
                  Download: <br />
                  <a class="btn btn-primary" style="margin-bottom: 5px;" :disabled="getDemoStatus == 'progress'" :href="this.API_URL + 'export/' + this.currentBook._id + '/exportMp3'" target="_blank" v-if="currentBook.demo_zip_mp3">Compressed {{currentBook.demo_zip_mp3_size | prettyBytes }}</a>
                  <a class="btn btn-primary" style="margin-bottom: 5px;" :disabled="getDemoStatus == 'progress'" :href="this.API_URL + 'export/' + this.currentBook._id + '/exportFlac'" target="_blank" v-if="currentBook.demo_zip_flac">Full Book {{currentBook.demo_zip_flac_size | prettyBytes }}</a>
                  <a class="btn btn-primary" style="margin-bottom: 5px;" v-if="(getDemoStatus == 'rebuild' || getDemoStatus == 'progress') && currentBook.demo_zip_narration_size >=23 && currentBook.demo_zip_narration" :disabled="getDemoStatus == 'progress'" :href="this.API_URL + 'export/' + this.currentBook._id + '/exportNarration'" target="_blank">Narration {{currentBook.demo_zip_narration_size | prettyBytes }}</a>
                </template>
                <hr>
                <div v-if="currentBook.demo"><a :href="this.SERVER_URL + currentBook.demo" target="_blank">{{this.SERVER_URL + currentBook.demo}}</a> <br /><!-- <button class="btn btn-primary" v-if="getDemoStatus == 'rebuild' || getDemoStatus == 'progress'" :disabled="getDemoStatus == 'progress'" v-clipboard="() => this.SERVER_URL + currentBook.demo" >Copy Link</button>--> <button class="btn btn-primary" v-on:click="deactivateDemoLink()"> Deactivate</button></div>
                <div v-if="!currentBook.demo">Public Demo Book link has been deactivated</div>
                <span v-if="getDemoStatus == 'failed'"> Demo Book generation has failed. Please try again.</span>
              </div>
          </fieldset>
          <CompleteAudioExport
            :convertTime="convertTime"
            :goToBlock="goToBlock"></CompleteAudioExport>
          <BookPublish @checkPublish="checkPublish" ></BookPublish>
          <SplitPreview v-if="allowBookSplitPreview"
            :convertTime="convertTime"></SplitPreview>
          </vue-tab>
          <vue-tab title="Meta" id="book-content">
            <fieldset>
              <legend>Book Metadata </legend>
              <table class='properties'>

                <tr class='bookid'>
                  <td>Book ID</td>
                  <td class='disabled'>{{currentBook.bookid}}</td>
                </tr>

                <tr class="extid">
                  <td>External book ID</td>
                  <td class='disabled'>{{currentBook.extid}}
                    <!-- <input v-model="currentBook.extid" @input="updateExtid($event)" :disabled="!allowMetadataEdit" :class="[{'has-error': validationErrors['extid'].length}]"/>
                           <span class="validation-error" v-for="err in validationErrors['extid']">{{err}}</span> -->
                  </td>
                </tr>

                <tr class='title'>
                  <td>Title</td>
                  <td><input v-model='currentBook.title' v-on:input="debounceUpdate('title', $event.target.value, $event, false)" :disabled="!allowMetadataEdit" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['title'] }">
                      <span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['title']" class="validation-error">Define Title</span>
                  </td>
                </tr>

                <tr class='title' v-if="currentBook.language !== 'en'">
                  <td>Title en</td>
                  <td><input v-model='currentBook.title_en' v-on:input="debounceUpdate('title_en', $event.target.value, $event, false) " :disabled="!allowMetadataEdit" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['title_en'] }">
                      <span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['title_en']" class="validation-error">Define Title EN</span>
                  </td>
                </tr>

                <tr class='subtitle'>
                  <td>Subtitle</td>
                  <td><input v-model='currentBook.subtitle' v-on:input="debounceUpdate('subtitle', $event.target.value, $event, false);" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='author-link-container'>
                  <td colspan="2">

                  <fieldset v-for="(author, i) in currentBook.author_link" class='author-link authors-list'>
                  <legend>Author</legend>

                    <table class='author-link-table'>
                      <tr class='author-link author-name'>
                        <td>Author</td>
                        <td>

                          <input v-model='currentBook.author_link[i].name'
                                 @input="editAuthorLink($event, i, 'name')"
                                :disabled="!allowMetadataEdit"
                                :class="['author-name', { 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author_link'] }]"/>
                          <Dropdown
                            :value="currentBook.author_link[i]"
                            :options="author_link_arr"
                            :disabled="!allowMetadataEdit"
                            :filter="true"
                            :showClear="currentBook.author_link[i].id !== null"
                            @change="changeAuthorLink($event, i, author)"
                            dataKey="id"
                            optionLabel="name">
                            <template #value="slotProps">
                                <div class="" v-if="slotProps.value">
                                  <!--<div v-if="slotProps.value.name">{{slotProps.value.name}}</div>-->
                                  <!--<div v-else>{{slotProps.value}}</div>-->
                                </div>
                                <span v-else>
                                  <!--{{slotProps.placeholder}}-->
                                </span>
                            </template>
                            <template #option="slotProps">
                                <div class="">
                                  <div>{{slotProps.option.name}}</div>
                                </div>
                            </template>
                          </Dropdown>

                        </td>
                      </tr>
                      <tr class='author-link author-name' v-if="currentBook.language !== 'en'">
                        <td>Author EN</td>
                        <td>

                          <input v-model='currentBook.author_link[i].name_en'
                                 @input="editAuthorLink($event, i, 'name_en')"
                                :disabled="!allowMetadataEdit"
                                :class="['author-name', { 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author_link'] }]" />
                          <Dropdown
                            :value="currentBook.author_link[i]"
                            :options="author_link_arr"
                            :disabled="!allowMetadataEdit"
                            :filter="true"
                            :showClear="currentBook.author_link[i].id !== null"
                            @change="changeAuthorLink($event, i, author)"
                            dataKey="id"
                            optionLabel="name_en">
                            <template #value="slotProps">
                                <div class="" v-if="slotProps.value">
                                  <!--<div v-if="slotProps.value.name">{{slotProps.value.name}}</div>-->
                                  <!--<div v-else>{{slotProps.value}}</div>-->
                                </div>
                                <span v-else>
                                  <!--{{slotProps.placeholder}}-->
                                </span>
                            </template>
                            <template #option="slotProps">
                                <div class="">
                                  <div>{{slotProps.option.name_en}}</div>
                                </div>
                            </template>
                          </Dropdown>

                        </td>
                      </tr>
                      <tr class='author-link author-slug'>
                        <td>Author Slug</td>
                        <td>

                          <input v-model='currentBook.author_link[i].slug'
                                 @input="editAuthorLink($event, i, 'slug')"
                                :disabled="true || !allowMetadataEdit"
                                :class="['author-slug', { 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author_link'] }]" />

                          <span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author_link']" class="validation-error" style="text-align: right !important;">Define Author</span>

                        </td>
                      </tr>
                      <tr class='author-link rem-author' v-if="currentBook.author_link.length > 1 && allowMetadataEdit">
                        <td colspan="2">
                          <div v-if="allowMetadataEdit" class='author-link rem-author'>
                            <button v-on:click="removeAuthorLink($event, i)" :disabled="!allowMetadataEdit" >
                              <i class="fa fa-minus-circle" style="margin-right: -18px;"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </table>


                  </fieldset>

                  <div v-if="allowMetadataEdit" class='author-link add-author'>
                      <button v-on:click="addAuthorLink" :disabled="!allowMetadataEdit">
                        <i class="fa fa-plus-circle"></i>
                      </button>
                    </div>

                  </td>
                </tr>

                <!--<tr class='author'>
                  <td>Author</td>
                  <td style="text-align: left !important;">

                    <input v-model='currentBook.author[0]' v-on:change="debounceUpdate('author', [...currentBook.author], $event);" :disabled="!allowMetadataEdit" v-if="currentBook.author.length === 0" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author'] }">
                    <div class="dropdown" v-if="currentBook.author.length === 0 && allowMetadataEdit">
                      <div v-on:click="showUnknownAuthor = -1 * showUnknownAuthor;" class="dropdown-button" ><i class="fa fa-angle-down" ></i></div>
                      <div class="dropdown-content" v-if="showUnknownAuthor == 1" v-on:click="showUnknownAuthor=-1; currentBook.author[0] = 'Unknown'; debounceUpdate('author', [...currentBook.author]);" >Unknown</div>
                    </div>
                    <template v-for="(author, i) in currentBook.author" >
                      <input v-model='currentBook.author[i]'
                      v-on:keyup="debounceUpdate('author.'+i, $event.target.value, $event);"
                      v-on:keydown="debounceUpdate('author.'+i, $event.target.value, $event);"
                      :disabled="!allowMetadataEdit"
                      v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author'] }">
                      <div class="dropdown" v-if=" i == 0 && allowMetadataEdit">
                        <div v-on:click="showUnknownAuthor = -1 * showUnknownAuthor;" class="dropdown-button"><i class="fa fa-angle-down" ></i></div>
                        <div class="dropdown-content" v-if="showUnknownAuthor == 1 && allowMetadataEdit" v-on:click="showUnknownAuthor=-1; currentBook.author[0] = 'Unknown'; debounceUpdate('author', [...currentBook.author]);" >Unknown</div>
                      </div>
                      <button v-if="i !== 0 && allowMetadataEdit" v-on:click="removeAuthor(i)" :class="{'disabled': i == 0 && currentBook.author.length == 1}" :disabled="!allowMetadataEdit" ><i class="fa fa-minus-circle" style="margin-right: -18px;"></i></button>
                      <br/>
                    </template>
                    <p v-if="allowMetadataEdit" style="text-align: right; margin: 0; padding: 0;"><button v-on:click="addAuthor" :disabled="!allowMetadataEdit" style="margin-right: 6px;"><i class="fa fa-plus-circle"></i></button></p>
                    <span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author']" class="validation-error" style="text-align: right !important;">Define Author</span>
                  </td>
                </tr>

                <tr class='author' v-if="currentBook.language !== 'en'">
                  <td>Author en</td>
                  <td style="text-align: left !important;"><input v-model='currentBook.author_en' v-on:change="debounceUpdate('author_en', $event.target.value, $event) " :disabled="!allowMetadataEdit" style="width: 90%;" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author_en'] }">
                    <div class="dropdown" v-if="allowMetadataEdit">
                      <div v-on:click="showUnknownAuthorEn = -1 * showUnknownAuthorEn;" class="dropdown-button"><i class="fa fa-angle-down" ></i></div>
                      <div class="dropdown-content" v-if="showUnknownAuthorEn == 1" v-on:click="showUnknownAuthorEn=-1; currentBook.author_en = 'Unknown'; debounceUpdate('author_en', 'Unknown');" >Unknown</div>
                    </div>
                    <span style="text-align: right !important;" v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author_en']" class="validation-error">Define Author EN</span>

                  </td>
                </tr>-->

                <tr class='language'>
                  <td>Language</td>
                  <td>
                    <select class="form-control" :value='currentBook.language' @change="debounceUpdate('language', $event.target.value, $event)" :key="currentBookid" :disabled="!allowMetadataEdit || currentBookMeta.collection_id || lockLanguage">
                      <option v-if="!languages.hasOwnProperty(currentBook.language)" :value="currentBook.language">{{ currentBook.language }}</option>
                      <option v-for="(value, key) in languages" :value="key">{{ value }}</option>
                    </select>
                  </td>
                </tr>


              </table>
            </fieldset>
            <fieldset class='description brief' style="text-align: right;">
              <legend style="text-align: left;">URL slug</legend>
                  <input v-model='currentBook.slug'
                  v-on:change="lockLanguage = true; debounceUpdate('slug', $event.target.value,  $event);"
                  v-on:keyup="clearError('slug', $event)"
                  :disabled="!allowMetadataEdit || currentBook.slug_status == -1 "
                  :style="[currentBook.slug_status === 1 ? {'color': '#999'} : {'color': '#000'}]"
                  maxlength="100" style="width: 100%;"
                  :title="currentBook.slug_status == -1 ? 'URL slug is not editable because Book has been published' : currentBook.slug"
                  :class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['slug'] }" />
                  <br><span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['slug']" class="validation-error">Define URL Slug</span>
            </fieldset>

            <fieldset>
              <table class='properties'>
                <tr class='size'>
                  <td>Size</td>
                  <td class="pull-left">{{ Math.round(currentBook.wordcount / 300) }} pages</td>
                </tr>

                <tr class='category'>
                  <td>Reader category</td>
                  <td class="category-wrapper">
                    <select id="categorySelection" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['category'] }" class="form-control" v-model='currentBook.alt_meta.reader.category' @change="debounceUpdate('alt_meta.reader.category', $event.target.value, $event)" :key="currentBookid" :disabled="categoryEditDisabled">
                      <!--<template v-for="(data, index) in subjectCategories">-->
                        <!--<optgroup :label="data.group">-->
                          <option v-for="(value, ind) in subjectCategories.reader" :value="value">{{ value }}</option>
                        <!--</optgroup>-->
                      <!--</template>-->
                    </select>
                    <i class="ico ico-clear-filter btn-inside" aria-hidden="true"
                      v-if="currentBook.alt_meta.reader.category && !categoryEditDisabled"
                      @click="currentBook.alt_meta.reader.category = null; debounceUpdate('alt_meta.reader.category', '', $event)"></i>
                    <span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['category']" class="validation-error">Define Category</span>
                  </td>
                </tr>
                <tr class='category'>
                <td>Ocean category</td>
                  <td class="category-wrapper">
                    <select id="categorySelection" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['category'] }" class="form-control" v-model='currentBook.alt_meta.ocean.category' @change="debounceUpdate('alt_meta.ocean.category', $event.target.value, $event)" :key="currentBookid" :disabled="categoryEditDisabled">
                      <!--<template v-for="(data, index) in subjectCategories">-->
                        <!--<optgroup :label="data.group">-->
                          <option v-for="(value, ind) in subjectCategories.ocean" :value="value">{{ value }}</option>
                        <!--</optgroup>-->
                      <!--</template>-->
                    </select>
                    <i class="ico ico-clear-filter btn-inside" aria-hidden="true"
                      v-if="currentBook.alt_meta.ocean.category && !categoryEditDisabled"
                      @click="currentBook.alt_meta.ocean.category = null; debounceUpdate('alt_meta.ocean.category', '', $event)"></i>
                  </td>
                </tr>
                <tr class='difficulty'>
                  <td>Difficulty</td>
                  <td>
                    <input v-model="currentBook.difficulty" :disabled="!allowMetadataEdit"
                           v-on:change="debounceUpdate('difficulty', $event.target.value, $event, true)" id="difficultySelection" :class="{ 'has-error': (this.validationErrorDifficulty) ,
                            'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['difficulty'] }">
                    <span class="validation-error" >{{(this.validationErrorDifficulty )}}</span>
<!--                    <span class="validation-error" >{{(validationErrors[currentBook.bookid]['weight'] && validationErrors[currentBook.bookid]['weight'])}}</span>-->
                  </td>
                </tr>

                <tr class='trans'>
                  <td>Translated by</td>
                  <td><input v-model='currentBook.translator'  v-on:change="debounceUpdate('translator', $event.target.value, $event, true)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='transfrom'>
                  <td>Translated from</td>
                  <!--<td><input v-model="currentBook.transfrom" :placeholder="suggestTranslatedId"></td>-->
                  <td>
                    <div class="trans-from-wrapper">
                      <select id="select-field" class="form-control" v-model='currentBook.transfrom' v-on:change="debounceUpdate('transfrom', $event.target.value, $event, true)" :key="currentBookid" :disabled="!allowMetadataEdit">
                        <option v-for="(value, key) in languages" :value="key">{{ value }}</option>
                      </select>
                      <i class="pi pi-times" v-if="languages.hasOwnProperty(currentBook.transfrom)" v-on:click="debounceUpdate('transfrom', '', $event, true)"></i>
                    </div>
                  </td>
                </tr>

                <tr class='collection'>
                  <td>Collection</td>
                  <!-- <td><input v-model="currentBook.transfrom" :placeholder="suggestTranslatedId"></td> -->
                  <td>
                    <select @input="updateCollection($event)" :disabled="!allowMetadataEdit" class="form-control" v-model="currentBook.collection_id">
                      <option v-model="currentBook.collection_id" v-for="c in collectionsList" :value="c._id">{{c.title}}</option>
                    </select>
                  </td>
                </tr>
                <tr class='weight'>
                  <td>Weight</td>
                  <td>
                    <input v-model='currentBook.weight' v-on:change="debounceUpdate('weight', $event.target.value, $event, true)"
                           :disabled="!allowMetadataEdit" :class="[{'has-error': this.validationErrorWeight }]"/>
                    <span class="validation-error" >{{validationErrorWeight}}</span>
                  </td>
                </tr>
              </table>
            </fieldset>
          <Genre
            :allowMetadataEdit="allowMetadataEdit"
            :requiredError="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['genres']"
            @genresUpdate="checkGenresErrors" />
          <fieldset class='description brief'>
            <legend>Book cover</legend>
            <template v-if="allowMetadataEdit">
              <div class='coverimg pull-right' @click="bookEditCoverModalActive = true">
                <img height="80" v-if="currentBookFiles.coverimg" v-bind:src="currentBookFiles.coverimg" />
                <div v-else class='coverimg-wrap'></div>
              </div>
              <button class="btn btn-primary pull-right" @click="bookEditCoverModalActive = true"><i class="fa fa-pencil" style="color:white"></i></button>
            </template>
            <template v-else>
              <div class="coverimg pull-right">
                <img height="80" v-if="currentBookFiles.coverimg" v-bind:src="currentBookFiles.coverimg" />
              </div>
            </template>
          </fieldset>

          <fieldset class='description brief'>
            <legend>Brief description</legend>
            <resizable-textarea @valueChanged="debounceUpdate('description_short', $event.target.value, $event)"
              :initValue="currentBook.description_short"
              ref="descriptionShort"
              :disabled="!allowMetadataEdit">
            </resizable-textarea>
          </fieldset>

          <fieldset class='description long'>
            <legend>Long description</legend>
            <resizable-textarea @valueChanged="debounceUpdate('description', $event.target.value, $event)"
              :initValue="currentBook.description"
              ref="descriptionLong"
              :disabled="!allowMetadataEdit">
            </resizable-textarea>
          </fieldset>
        </vue-tab>
          <vue-tab title="TOC" id="book-toc">
            <BookToc ref="bookToc"
              :isActive="activeTabIndex === TAB_TOC_INDEX"
            ></BookToc>
          </vue-tab>
          <vue-tab title="Audio" id="audio-integration" :disabled="!tc_displayAudiointegrationTab()">
            <BookAudioIntegration ref="audioIntegration"
                :isActive="activeTabIndex == TAB_AUDIO_INDEX"
                @onTtsSelect="ttsUpdate"
                @goToBlock="goToBlock"
              ></BookAudioIntegration>
          </vue-tab>

        <vue-tab title="Styles" :id="'styles-switcher'" :disabled="!tc_displayStylesTab() && !proofreadModeReadOnly">
            <div class="styles-catalogue">

              <vue-tabs ref="blockTypesTabs" class="block-style-tabs" :class="{ disabled: proofreadModeReadOnly }" @tab-change="styleTabChange">
                <vue-tab title="Book" :id="'global-styles-switcher'">
                  <fieldset class="block-style-fieldset global-style">
                  <legend>Book styles</legend>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => debounceUpdate('styles.global', '') } : {}">
                      <i v-if="!currentBook.styles || !currentBook.styles.global || currentBook.styles.global === ''"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    ILM</label>
                  </div>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => debounceUpdate('styles.global', 'global-ocean') } : {}">
                      <i v-if="currentBook.styles && currentBook.styles.global === 'global-ocean'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    Ocean</label>
                  </div>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => debounceUpdate('styles.global', 'global-ffa') } : {}">
                      <i v-if="currentBook.styles && currentBook.styles.global === 'global-ffa'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                      FFA</label>
                  </div>
                  </fieldset>

                  <fieldset class="block-style-fieldset automatic-numeration">
                  <legend>Automatic numeration</legend>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => debounceUpdate('numbering', 'x') } : {}">
                      <i v-if="currentBook.numbering === 'x'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    x</label>
                  </div>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => debounceUpdate('numbering', 'x_x') } : {}">
                      <i v-if="currentBook.numbering === 'x_x'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    x.x</label>
                  </div>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => debounceUpdate('numbering', 'none') } : {}">
                      <i v-if="currentBook.numbering === 'none'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                      Off</label>
                  </div>
                  </fieldset>
                  <fieldset class="block-style-fieldset trim-silence-config">
                    <legend>Trim silence</legend>
                    <label class="block-style-label"
                       v-on="trimSilenceConfigCalculated === 'audio_tts_narration' ?
                      {click: () => setTrimSilenceConfig('tts_narration')} :
                      {click: () => setTrimSilenceConfig('audio_tts_narration')}">
                      <template>
                        <i
                          v-bind:class="{'fa fa-square-o': trimSilenceConfigCalculated === 'audio_tts_narration',
                          'fa fa-check-square-o -checked': trimSilenceConfigCalculated === 'tts_narration'}"
                        ></i>
                      </template>
                      Don’t trim file import blocks
                    </label>
                  </fieldset>

                </vue-tab>

                <vue-tab :title="prepareStyleTabLabel(blockType)"
                  :disabled="!displayStyleTab(blockType)"
                  v-for="(val, blockType) in blockTypesByMode"
                  :id="'block-type-'+blockType" :key="blockType">

                  <fieldset class="block-style-fieldset block-num-fieldset"
                  v-if="numProps.has(blockType) && ['header'].indexOf(blockType) > -1">
                    <legend>Numeration</legend>
                    <label class="block-style-label"
                      @click="selSecNum(blockType, 'secNum', numProps.get(blockType).get('secNum'))">
                      <template v-if="numProps.get(blockType).get('secNum') == 'mixed'">
                        <i class="fa fa-plus-square-o" aria-hidden="true"></i>
                      </template>
                      <template v-else>
                        <i v-if="numProps.get(blockType).get('secNum') == false" class="fa fa-square-o" aria-hidden="true"></i>
                        <i v-else class="fa fa-check-square-o -checked" aria-hidden="true"></i>
                      </template>
                      Numbered section
                    </label>
                    <label v-if="numProps.get(blockType).get('secNum') === false" class="block-style-label">
                      <i class="fa fa-square-o"></i>
                      Hide from display
                    </label>
                    <label v-else class="block-style-label"
                      @click="selSecNum(blockType, 'secHide', numProps.get(blockType).get('secHide'))">
                      <template v-if="numProps.get(blockType).get('secHide') == 'mixed'">
                        <i class="fa fa-plus-square-o" aria-hidden="true"></i>
                      </template>
                      <template v-else>
                        <i v-if="numProps.get(blockType).get('secHide') == false" class="fa fa-square-o" aria-hidden="true"></i>
                        <i v-else class="fa fa-check-square-o -checked" aria-hidden="true"></i>
                      </template>
                      Hide from display
                    </label>
                  </fieldset>

                  <fieldset v-if="blockType === 'header' && styleTabs.get(blockType)" class="block-style-fieldset">
                    <legend>{{styleCaption('header', 'level')}}</legend>
                    <ul class="no-bullets">
                      <li v-for="(sVal, styleKey) in blockTypes[blockType]['level']">
                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="[sVal]"
                          :styleKey="'level'"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="dummySelectStyle"
                        ></block-style-labels>
                      </li>
                    </ul>
                  </fieldset>
                  <fieldset v-if="(blockType === 'title') && styleTabs.get(blockType)" class="block-style-fieldset block-num-fieldset" >
                    <legend>{{styleCaption(blockType, 'style')}}</legend>
                    <ul>
                      <li v-for="(sVal, styleKey) in blockTypes[blockType]['style']">
                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="[sVal]"
                          :styleKey="'style'"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="dummySelectStyle"
                        ></block-style-labels>
                      </li>
                    </ul>
                  </fieldset>

                  <fieldset v-if="(blockType === 'title') && styleTabs.get(blockType)" class="block-style-fieldset block-num-fieldset">
                    <legend>{{styleCaption(blockType, 'table of contents')}}</legend>
                    <ul v-for="(styleObj, styleKey) in blockTypes[blockType]['table of contents']"  class="no-bullets">
                      <li v-for="(sVal, sIdx) in styleObj">
                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="[sVal]"
                          :styleKey="'table of contents'+'.'+styleKey"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="dummySelectStyle"
                        ></block-style-labels>
                      </li>
                    </ul>
                  </fieldset>
                  <fieldset v-if="(blockType === 'header') && styleTabs.get(blockType)" class="block-style-fieldset" >
                    <legend>{{styleCaption(blockType, 'toc')}}</legend>
                    <ul  class="no-bullets">
                      <li v-for="(sVal, sIdx) in blockTypes[blockType]['table of contents'].isInToc">
                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="[sVal]"
                          :styleKey="'table of contents.isInToc'"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="dummySelectStyle"
                        ></block-style-labels>
                      </li>
                    </ul>
                  </fieldset>
                  <fieldset v-if="(blockType === 'header') && styleTabs.get(blockType)" class="block-style-fieldset" >
                    <legend>{{styleCaption(blockType, 'toc level')}}</legend>
                    <ul class="no-bullets">
                      <li v-for="(sVal, sIdx) in blockTypes[blockType]['table of contents'].tocLevel">
                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="[sVal]"
                          :styleKey="'table of contents.tocLevel'"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="dummySelectStyle"
                        ></block-style-labels>
                      </li>
                    </ul>
                  </fieldset>
                  <fieldset class="block-style-fieldset block-num-fieldset"
                  v-if="numProps.has(blockType) && ['par'].indexOf(blockType) > -1">
                    <legend>Numeration</legend>
                    <label class="block-style-label"
                      @click="selSecNum(blockType, 'parNum', numProps.get(blockType).get('parNum'))">
                      <template v-if="numProps.get(blockType).get('parNum') == 'mixed'">
                        <i class="fa fa-square-o" aria-hidden="true"></i>
                      </template>
                      <template v-else>
                        <i v-if="numProps.get(blockType).get('parNum') == false" class="fa fa-square-o" aria-hidden="true"></i>
                        <i v-else class="fa fa-check-square-o -checked" aria-hidden="true"></i>
                      </template>
                      Numbered
                    </label>
                    <label v-if="numProps.get(blockType).get('parNum') === false" class="block-style-label">
                      <i class="fa fa-square-o"></i>
                      Hide from display
                    </label>
                    <label v-else class="block-style-label"
                      @click="selSecNum(blockType, 'secHide', numProps.get(blockType).get('secHide'))">
                      <template v-if="numProps.get(blockType).get('secHide') == 'mixed'">
                        <i class="fa fa-plus-square-o" aria-hidden="true"></i>
                      </template>
                      <template v-else>
                        <i v-if="numProps.get(blockType).get('secHide') == false" class="fa fa-square-o" aria-hidden="true"></i>
                        <i v-else class="fa fa-check-square-o -checked" aria-hidden="true"></i>
                      </template>
                      Hide from display
                    </label>
                  </fieldset>
                  <i v-if="bookMode !== 'narrate'">Please keep defaults unless you have a compelling reason to change them</i>
                  <i v-else>Pause adjustment is only applicable to Narration blocks, which are not currently being edited</i>
                  <fieldset v-if="pausesAfterProps.get(blockType) && blockType !== 'illustration'" class="block-style-fieldset block-num-fieldset block-pause-fieldset">
                    <legend>Pause after block (sec.)</legend>
                    <!-- <block-style-labels
                      :blockType="blockType"
                      :styleArr="['none', '0.6', '1', '2', '4']"
                      :styleKey="'pause_before'"
                      :styleTabs="pausesBeforeProps"
                      :styleValue="styleValue"
                      @selectStyleEv="selectPauseBefore"
                    ></block-style-labels> -->
                    <pause-after-block v-if="activeTabIndex === TAB_STYLE_INDEX && activeStyleTab === blockType"
                      v-bind:key="blockType + 'pause_after_container'"
                      :blockType="blockType"
                      :styleValue="styleValue"
                      :styleProps="pausesAfterProps"
                      @setPauseAfter="selectPauseAfter"
                      ref="pauseAfterControl"></pause-after-block>
                  </fieldset>
                  <template v-for="(styleArr, styleKey) in blockTypes[blockType]">

                    <fieldset v-if="styleTabs.has(blockType) && styleTabs.get(blockType).has(styleKey) && styleArr.length && styleKey !== 'table of contents' && !(styleKey == 'level' && blockType == 'header') && !(styleKey == 'style' && blockType == 'title')" :key="styleKey" class="block-style-fieldset">
                      <legend>{{styleCaption(blockType, styleKey)}}</legend>

                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="styleArr"
                          :styleKey="styleKey"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="dummySelectStyle"
                        ></block-style-labels>


                      </fieldset>

                  </template>
                </vue-tab>

              </vue-tabs>

            </div>
        </vue-tab>
      </vue-tabs>
      </div>
    </div>

    <book-edit-cover-modal
      :show="bookEditCoverModalActive"
      @closed="bookEditCoverModalActive = false"
      :img="currentBookFiles"
    ></book-edit-cover-modal>

    <modal :show.sync="generatingAudiofile" :backdrop="false" effect="fade">
      <div slot="modal-header" class="modal-header">
        <h4>Export audio</h4>
      </div>
      <div slot="modal-body" class="modal-body download-audiofile">
          <template  v-if="!currentBook.mergedAudiofile">
            <div>Generating audiofile</div>
            <div class="align-preloader"></div>
          </template>
          <div v-else>
            <a class="btn btn-primary" :href="mergedAudiofileLink" target="_blank">Download</a>
          </div>
      </div>
      <div slot="modal-footer" class="modal-footer">
        <a v-if="currentBook.mergedAudiofile" v-on:click="generatingAudiofile = false" class="btn btn-default">Cancel</a>
      </div>
    </modal>
    <div v-if="showUnknownAuthor == 1" class="outside" v-on:click="showUnknownAuthor = -1"></div>
    <div v-if="showUnknownAuthorEn == 1" class="outside" v-on:click="showUnknownAuthorEn = -1"></div>
  </div>

</template>

<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import { BlockTypes, BlockTypesAlias } from '../../store/bookBlock'
import superlogin           from 'superlogin-client'
import BookDownload         from './BookDownload'
import BookEditCoverModal   from './BookEditCoverModal'
import BookAudioIntegration from './BookAudioIntegration'
import BookToc              from './BookToc'
import _                    from 'lodash'
import axios                from 'axios'
import { modal, accordion, panel } from 'vue-strap'
import Dropdown             from 'primevue/dropdown';
import task_controls        from '../../mixins/task_controls.js'
import api_config           from '../../mixins/api_config.js'
import access               from '../../mixins/access.js'
import { Languages }        from "../../mixins/lang_config.js"
import time_methods         from '../../mixins/time_methods.js';
import number_methods       from "../../mixins/number_methods.js"
import toc_methods          from '../../mixins/toc_methods.js';
import { VueTabs, VTab }    from 'vue-nav-tabs'
import CoupletWarningPopup from "./CoupletWarningPopup.vue";
//import VueTextareaAutosize from 'vue-textarea-autosize'
import BookAssignments      from './details/BookAssignments';
import BookWorkflow         from './details/BookWorkflow';
import BookPublish          from './details/BookPublish';
import SplitPreview         from './details/SplitPreview';
import BlockStyleLabels     from './details/BlockStyleLabels';
import CompleteAudioExport  from './details/CompleteAudioExport';
import PauseAfterBlock      from './details/PauseAfterBlock';
import VTagSuggestion       from './details/HashTag';
import ResizableTextarea    from '../generic/ResizableTextarea';
import Genre                from './details/Genre';
import v_modal              from 'vue-js-modal';

Vue.use(v_modal, {dialog: true});

var BPromise = require('bluebird');

//Vue.use(VueTextareaAutosize)

function _debounce (func, timeout = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

function _cacheDebounce (beforeHook, timeHook, bookid, timeout = 500) {
  let timer, accum = [];
  return (...args) => {
    if (beforeHook.apply(this, args)) {
      clearTimeout(timer);
      let prevIdx = accum.findIndex((el)=>el[0] === args[0]);
      if (prevIdx >= 0) {
        accum[prevIdx] = args;
      } else {
        accum.push(args);
      }
      timer = setTimeout(() => {
        timeHook.apply(this, [{bookid: bookid}, ...accum]);
        accum = []
      }, timeout);
    }
  };
};

export default {

  name: 'BookMetaEdit',

  components: {
    BookDownload,
    BookEditCoverModal,
    BookToc,
    BookAudioIntegration,
    'vue-tabs': VueTabs,
    'vue-tab': VTab,
    modal,
    accordion,
    panel,
    Dropdown,
    BookAssignments,
    BookWorkflow,
    BookPublish,
    SplitPreview,
    BlockStyleLabels,
    CompleteAudioExport,
    PauseAfterBlock,
    VTagSuggestion,
    'resizable-textarea': ResizableTextarea,
    CoupletWarningPopup,
    Genre
  },

  data () {
    return {
      requiredFields:[],
      pubTypes: [
        'Public', 'Hidden', 'Encumbered', 'Research', 'Private'
      ],
      styleTitles: {
        'title_style': 'Subtype',
        'header_level': 'Subtype',
      },
      styleTabLabels: {
        'hr': 'line'
      },
      styleNotNumbered: ['sitalcent', 'editor-note', 'signature', 'reference'],
      languages: Languages,
      dirty: {
      },
      visible: true,
      showModal: false,
      showModal_audio: false,
      bookEditCoverModalActive: false,
      currentBook: { author: [], alt_meta: {reader: {}, ocean: {}} },
      masteringTask: {},
      importTask: {},
      linkTaskError: '',
      isOwner: false,
      approveMetadataComment: '',
      showSharePrivateBookModal: false,
      textCleanupProcess: false,
      finishPublishedProcess: false,
      //audiobook: {},
      unlinkCollectionWarning: false,
      blockTypes: BlockTypes,
      generatingAudiofile: false,
      audiobookChecker: false,
      showUnknownAuthor: -1,
      showUnknownAuthorEn: -1,
      lockLanguage: false,
      arbitraryHashtags: '',
      handleHashTags: 0,

      // set blocks properties
      styleTabs: new Map(),
      numProps: new Map(),
      activeTabIndex: 0,
      isPublishing: false,
      isPublishingQueue: false,
      publicationStatus: false,
      isExporting:false,
      //validationErrors: {extid: [], weight: []},
      validationErrors: {},
      validationErrorDifficulty: '',
      validationErrorWeight: '',
      updateAllowed: false,
      TAB_ASSIGNMENT_INDEX: 0,
      TAB_META_INDEX: 1,
      TAB_TOC_INDEX: 2,
      TAB_AUDIO_INDEX: 3,
      TAB_STYLE_INDEX: 4,
      users: {
        'editor': [],
        'proofer': [],
        'engineer': [],
        'reader': [],
        'narrator': []
      },
      authorsLangFarsi:    // move to config
      {
       'bab':      'باب',
       'baha':     'بهاءالّله',
       'abd':      'عبدالبهاء',
       'shoghi':   'شوقی',
       'sacred':   'sacred',
       'bible':    'انجيل',
       'muhammad': 'محمد',
       'quran':    'قرآن',
       'jesus':    'عیسی',
       'ali':      'علی',
       'tradition': 'حدیث',
       'husayn':   'حسین'
      },
      pausesAfterProps: new Map(),
      STYLE_TABS: {
        0: 'book',
        1: 'title',
        2: 'header',
        3: 'par',
        4: 'illustration',
        5: 'hr'
      },
      activeStyleTab: '',
      jobDescription: '',
      blockType: '',
      styleKey: '',
      styleVal: '',
    }
  },

  props: [

  ],

  computed: {

    ...mapGetters({
      currentBookid: 'currentBookid',
      currentBookMeta: 'currentBookMeta',
      currentBookFiles: 'currentBookFiles',
      isLibrarian: 'isLibrarian',
      isEditor: 'isEditor',
      isAdmin: 'isAdmin',
      bookCollections: 'bookCollections',
      allowPublishCurrentBook: 'allowPublishCurrentBook',
      currentBookBlocksLeft: 'currentBookBlocksLeft',
      currentBookBlocksLeftId: 'currentBookBlocksLeftId',
      currentBookAudioExportAllowed: 'currentBookAudioExportAllowed',
      currentBookCounters: 'currentBookCounters',
      tc_currentBookTasks: 'tc_currentBookTasks',
      //tc_tasksByBlock: 'tc_tasksByBlock',
      storeList: 'storeList',
      storeListO: 'storeListO',
      blockSelection: 'blockSelection',
      alignCounter: 'alignCounter',
      audiobook: 'currentAudiobook',
      subjectCategories: 'bookCategories',
      // subjectDifficulties: 'bookDifficulties',
      bookDifficultyDefault: 'bookDifficultyDefault',
      tasks_counter: 'tasks_counter',
      taskTypes: 'taskTypes',
      adminOrLibrarian: 'adminOrLibrarian',
      allowBookSplitPreview: 'allowBookSplitPreview',
      mode: 'bookMode',
      aligningBlocks: 'aligningBlocks',
      currentBookCollection: 'currentBookCollection',
      hashTagsSuggestions: 'hashTagsSuggestions',
      playingBlock: 'playingBlock',
      isBookReaderCategory: 'isBookReaderCategory',
      author_link_arr: 'authorsMapModule/author_link_arr',
    }),
    proofreadModeReadOnly: {
      get() {
          // return this.mode === 'proofread' || (this._is('proofer') && ['Collection'].indexOf(this.$route.name) > -1) ;
          // ILM-3992:
          return this.mode === 'proofread'  ;
      }
    },
    getHashTags: {
      get() {
        if (this.currentBook.hashTags && Array.isArray(this.currentBook.hashTags)) {
          let hashtags = this.currentBook.hashTags;
          return hashtags.join(', ');
        } else return '';
      },
      set(val) {
        return val;
      }

    },

    collectionsList: {
      get() {
        let list = [];
        this.bookCollections.forEach(c => {
          if (c.language == this.currentBookMeta.language) {
            if (c.title.trim().length == 0) {
              const coll = Object.assign({}, c);
              coll.title = coll._id;
              list.push(coll);
            }
            else list.push(c);
          }
        });
        list.sort((a, b) => a.title.localeCompare(b.title));
        return [...[{'_id': '', 'title' :'---Remove from collection---'}], ...list];
      }
    },
    getDemoStatus(){ // build, rebuild, progress, failed
        let errorGenerateTime = 1 * 60 * 60000;   // 1 hr * 60 min * 60000 msec;
        let currTime = new Date().getTime();

        if (!this.currentBookMeta.demo_time) return 'build';

        if (Number(this.currentBookMeta.demo_time) < 0){
            if (Number(currTime) + Number(this.currentBookMeta.demo_time) > errorGenerateTime){
              console.log('failed');
              return 'failed';
            } else {
              return 'progress';
            }
        }
        return 'rebuild';
    },
    suggestTranslatedId: function () {
      if (this.currentBook) return this.currentBook.bookid.split('-').slice(0, -1).join('-') + '-?'
    },
    isAllowExportAudio: {
      get() {
        if (this._is('admin') || this._is('librarian') || this._is('editor', true)) {
          return true;
        }
        return false;
      }
    },
    mergedAudiofileLink: {
      get() {
        if (this.currentBook.mergedAudiofile) {
          return process.env.ILM_API + this.currentBook.mergedAudiofile
        } else {
          return '';
        }
      }
    },
    blocksToApproveCounter: {
      get() {
        return this.tc_blocksToApproveCount();
      }
    },
    selectionStart() {
      return this.blockSelection.start._id ? this.blockSelection.start._id : false;
    },
    selectionEnd() {
      return this.blockSelection.end._id ? this.blockSelection.end._id : false;
    },
    allowMetadataEdit: {
      get() {
        //do not allow to edit metadata while book is in Publish Queue:
        const {isInTheQueueOfPublication, isIntheProcessOfPublication} = this.currentBookMeta;
        if (isInTheQueueOfPublication === true || isIntheProcessOfPublication === true) {
          return false;
        }
        return this.tc_allowMetadataEdit();
      }
    },
    blockTypesByMode: {
      get() {
        let types = Object.assign({}, this.blockTypes);
        //console.log(types);
        if (this.bookMode === 'narrate') {
          delete types['hr'];
          delete types['illustration'];
          Object.keys(types).forEach(k => {
            types[k] = {};
          });
        }
        return types;
        }
    },
    trimSilenceConfigCalculated: {
      get() {
        if (this.currentBookMeta && this.currentBookMeta.trim_silence_config) {
          if (this.currentBookMeta.trim_silence_config.audio_file && this.currentBookMeta.trim_silence_config.tts && this.currentBookMeta.trim_silence_config.narration) {
            return 'audio_tts_narration';
          } else if (this.currentBookMeta.trim_silence_config.tts && this.currentBookMeta.trim_silence_config.narration && !this.currentBookMeta.trim_silence_config.audio_file) {
            return 'tts_narration';
          }
        }
        return '';
      }
    },

    currentBookCategory: {
      get() {
        /*if (typeof this.currentBookCollection.category !== 'undefined') {
          return this.currentBookCollection.category;
        }*/
        return this.currentBook.category;
      },
      set(value) {
        this.currentBook.category = value;
      }
    },

    categoryEditDisabled: {
      get() {
        if (!this.allowMetadataEdit) {
          return true;
        }
        /*if (typeof this.currentBookCollection.category !== 'undefined') {
          return true;
        }*/
        return false;
      }
    },

    displayDownloadDemo: {
      get() {
        return this.currentBook.demo_zip_mp3 && this.currentBook.demo_zip_flac;
      },
      cache: false
    }
  },

  mixins: [task_controls, api_config, access, time_methods, number_methods, toc_methods],

  mounted() {
    this.$root.$on('from-bookblockview:voicework-type-changed', this.getAudioBook);

    this.getAudioBook({bookid: this.currentBookid})
      .then(() => {
        if (this.currentAudiobook) {

        }
      });
    this.setCurrentBookCounters();
    this.$root.$on('from-block-edit:set-style', this.listenSetStyle);
    this.$root.$on('from-block-edit:set-style-switch', this.listenSetStyleSwitch);
    /*document.addEventListener("click", this.onClickOutside);*/
    if (this.selectionStart && this.selectionEnd) {
      this.collectCheckedStyles(this.selectionStart, this.selectionEnd)
    }
    $('body').on('click', '.vue-tabs.meta-edit-tabs li.tab', () => {
      this.activeTabIndex = this.$refs.panelTabs ? this.$refs.panelTabs.activeTabIndex : null;
      if (this.activeTabIndex === 1 && this.$refs.descriptionShort) {
        Vue.nextTick(() => {
          this.$refs.descriptionShort.setValue(this.currentBook.description_short);
          //this.$refs.descriptionShort.initSize();
        });
      }
      if (this.activeTabIndex === 1 && this.$refs.descriptionLong) {
        Vue.nextTick(() => {
          this.$refs.descriptionLong.setValue(this.currentBook.description);
          //this.$refs.descriptionLong.initSize();
        });
      }
      if (this.activeTabIndex === this.TAB_STYLE_INDEX) {
        if (this.bookMode === 'narrate') {
          Vue.nextTick(() => {
            if ($(`.block-style-tabs.vue-tabs .nav.nav-tabs li.hidden`).length === 0) {
              this.$refs.blockTypesTabs.hideTab(0);
            }
          });
        }
      }
    });
    this.$refs.blockTypesTabs.hideTab = (index) => {
      let container = this.$refs.blockTypesTabs.$children[index];
      if (container && container.$el) {
        let tab = document.querySelector(`[aria-controls="${container.$el.id}"]`);
        if (tab) {
          tab.classList.add('hidden');
          tab.setAttribute('disabled', true);
          container.$el.classList.add('hidden');
          container.$el.setAttribute('disabled', true);
          if (this.$refs.blockTypesTabs.activeTabIndex === index) {
            let activate = this.$refs.blockTypesTabs.tabs.find((t, i) => {
              return i !== index && t.disabled === false;
            });
            if (activate) {
              //this.$refs.blockTypesTabs.activateTab(this.$refs.blockTypesTabs.tabs.indexOf(activate));
              $($(`.block-style-tabs.vue-tabs .nav.nav-tabs li`)[this.$refs.blockTypesTabs.tabs.indexOf(activate)]).trigger('click');
            } else {
              //this.$refs.blockTypesTabs.activateTab(index === 0 ? 1 : 0);
              //$($(`.block-style-tabs.vue-tabs .nav.nav-tabs li`)[index === 0 ? 1 : 0]).trigger('click');
            }
          }
        }
      }
    }
    this.$refs.blockTypesTabs.showTab = (index) => {
      let container = this.$refs.blockTypesTabs.$children[index];
      if (container && container.$el) {
        let tab = document.querySelector(`[aria-controls="${container.$el.id}"]`);
        if (tab) {
          tab.classList.remove('hidden');
          tab.removeAttribute('disabled');
          container.$el.removeAttribute('disabled');
          container.$el.classList.remove('hidden');
        }
      }
    }
    this.jobDescription = this.currentJobInfo.description;
  },
  beforeDestroy: function () {
    this.$root.$off('uploadAudio');
    this.$root.$off('audiobookUpdated');
    this.$root.$off('from-bookblockview:voicework-type-changed', this.getAudioBook);
    //this.$root.$off('book-reimported');
    this.$root.$off('from-block-edit:set-style', this.listenSetStyle);
    this.$root.$off('from-block-edit:set-style-switch', this.listenSetStyleSwitch);
  },

  watch: {

    currentBookMeta: {
      handler (val, oldVal) {
        if (oldVal.bookid === '' || oldVal.bookid !== val.bookid) {
          this.init();
          this.lockLanguage = false;
          //this.handleHashTags++;  // to force reload hashTags template
          this.$refs['hashTags'].name = '';
        } else {
          for (const [key, value] of Object.entries(val)) {
            if (this.currentBook.hasOwnProperty(key)) {
              this.currentBook[key] = value;
            }
          }
        }
      },
      deep: true
    },
    /*currentBookFiles: {
      handler (val) {
        this.currentBook.coverimg = this.currentBookFiles.coverimg
      },
      deep: true
    },
    currentBookBlocksLeft: {
      handler(val) {}
    },*/
    audiobook: {
      handler(val) {

      },
      deep: true
    },
    'unlinkCollectionWarning': {
      handler(val) {
        if (val === true) {
          this.$root.$emit('show-modal', {
            title: 'Remove book from collection?',
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.cancelCollectionUpdate();
                },
              },
              {
                title: 'Remove',
                handler: () => {
                  this.updateCollection();
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
        } else {
          this.$root.$emit('hide-modal');
        }
      }
    },

    'blockSelection.start._id': {
      handler(val, oldVal) {
        this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id);
      }
    },
    'blockSelection.end._id': {
      handler(val, oldVal) {
        let singleSelection = !oldVal && val === this.blockSelection.start._id;
        if (this.blockSelection.start._id && this.blockSelection.end._id && (this.blockSelection.start._id !== this.blockSelection.end._id || !singleSelection)) {
          this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id);
        }
      }
    },
    'blockSelection.refresh': {
      handler(val, oldVal) {
        if (val) {
          //console.log('WATCH blockSelection.refresh', val, oldVal);
          this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id);
        }
      }
    },
    '$route': {
      handler(val) {
        //console.log('ROUTE CHANGE')
        let newIndex = false;

        switch (this.activeTabIndex) {
          case this.TAB_ASSIGNMENT_INDEX:
            break;
          case this.TAB_META_INDEX:
            break;
          case this.TAB_AUDIO_INDEX:
            if (!this.tc_displayAudiointegrationTab()) {
              newIndex = this.TAB_ASSIGNMENT_INDEX;
              //console.log('HERE')
            }
            break;
          case this.TAB_STYLE_INDEX:
            if (!this.tc_displayStylesTab()) {
              newIndex = this.TAB_ASSIGNMENT_INDEX;
            }
            break;
        }
        if (newIndex !== false) {
          this.activeTabIndex = newIndex;
          this.$refs.panelTabs.findTabAndActivate(newIndex);
        }
        this.$forceUpdate();
      }
    },
    'aligningBlocks.length': {
      handler(val, oldVal) {
        if (val < oldVal && this.blockSelection.start._id) {// e.g. pause_before can be changed after realignment
          //console.log('ALIGNING', val);
          this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
        }
      }
    },
    'bookMode': {
      handler() {
        if (this.bookMode === 'narrate') {
          this.$refs.blockTypesTabs.hideTab(0);
        } else {
          this.$refs.blockTypesTabs.showTab(0);
        }
        if (this.blockSelection.start._id && this.blockSelection.end._id) {
          //this.$refs.blockTypesTabs.render();
          this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id);
        }
      }
    },
    'currentJobInfo.description': {
      handler(val) {
        if (!document.activeElement || !document.activeElement.classList.contains('jobinfo-description')) {
          this.jobDescription = this.currentJobInfo.description;
        }
      }
    },

    'currentBook.slug': {
      handler(val) {
        if (this.currentBook.slug) {
          if (this.requiredFields && this.requiredFields[this.currentBook.bookid] && this.requiredFields[this.currentBook.bookid]['slug']) {
            delete this.requiredFields[this.currentBook.bookid]['slug'];
          }
        }
      }
    }

  },

  created () {
    this.init();
  },

  methods: {

    init () {
      this.validationErrorDifficulty ='';
      this.validationErrorWeight = '';

      let checkId = this.currentBook.bookid;
      this.updateAllowed = false;
      setTimeout(() => {
        if (!checkId || this.currentBook.bookid === checkId) {
          this.updateAllowed = true;//autosize plugin send updates on initialization
        }
      }, 1500)
      for (let id in this.$store.state.tc_currentBookTasks.tasks) {
        let record = this.$store.state.tc_currentBookTasks.tasks[id]
        if (record.type == 'import-book') {
          this.importTask = record
        } else if (record.type === 'master-audio') {
          this.masteringTask = record;
        }
      }
      this.currentBook = Object.assign({}, this.currentBookMeta);
      //this.currentBook.coverimg = this.currentBookFiles.coverimg;
      this.isOwner = this.currentBook.owner == superlogin.getSession().user_id;
      if (this.currentBook.author && !Array.isArray(this.currentBook.author)) {
        this.currentBook.author = [this.currentBook.author];
      }

      //this.loadAudiobook();
      /*this.setCurrentBookBlocksLeft(this.currentBook._id)
        .then(() => {

        });*/
      if (this.$refs.descriptionShort && this.currentBook) {
        this.$refs.descriptionShort.setValue(this.currentBook.description_short);
      }
      if (this.$refs.descriptionLong && this.currentBook) {
        this.$refs.descriptionLong.setValue(this.currentBook.description);
      }

      this.debounceUpdate = _cacheDebounce(this.beforeMetaUpdateHook, this.updateMetaHook, this.currentBook.bookid, 800);

      this.$store.dispatch('authorsMapModule/getAuthorsList', { lang: this.currentBookMeta.language || 'en' });
    },
    /*
    //close unknown author if clicked outside
    onClickOutside(event) {
      console.log('event', event);
      this.showUnknownAuthor = -1;
      this.showUnknownAuthorEn = -1;
    },*/
    checkPublish(){
        this.requiredFields[this.currentBookMeta.bookid] = [];

        let defaultCategory = ['story', 'Stories']; // means there is no category assigned

        const alt_meta = this.currentBookMeta.alt_meta;
        let checkCategory = (
          alt_meta.reader
          && alt_meta.reader.category
          && alt_meta.reader.category.trim().length
          && !defaultCategory.includes(alt_meta.reader.category)
        );
        checkCategory = checkCategory || (
          alt_meta.ocean
          && alt_meta.ocean.category
          && alt_meta.ocean.category.trim().length
          && !defaultCategory.includes(alt_meta.ocean.category)
        );
        checkCategory = checkCategory || (
          this.currentBookMeta.collection_id
          && this.currentBookMeta.collection_id.length
        ); // override by collection

        if(!checkCategory) {
          this.requiredFields[this.currentBookMeta.bookid]['category'] = true;
        }
        //this.requiredFields[this.currentBookMeta.bookid]['alt_meta.ocean.category'] = true;

        if (this.currentBookMeta.title == ''){
          this.requiredFields[this.currentBookMeta.bookid]['title'] = true;
        }

        //if (this.currentBookMeta.author.join("").length == 0){
        //  this.requiredFields[this.currentBookMeta.bookid]['author'] = true;
        //}

        //if (this.currentBookMeta.language != 'en' && (this.currentBookMeta.author_en == '' || !this.currentBookMeta.hasOwnProperty('author_en'))){
        //  this.requiredFields[this.currentBookMeta.bookid]['author_en'] = true;
        //}

        const isAuthorLink = this.currentBookMeta.author_link.some((author)=>{
          return author.name.length && author.slug.length //&& author.id;
        });
        if (!isAuthorLink) {
          this.requiredFields[this.currentBookMeta.bookid]['author_link'] = true;
        }

        if (this.currentBookMeta.language != 'en' && (this.currentBookMeta.title_en == '' || !this.currentBookMeta.hasOwnProperty('title_en'))){
          this.requiredFields[this.currentBookMeta.bookid]['title_en'] = true;
        }

        if (this.currentBookMeta.slug == '' || !this.currentBookMeta.hasOwnProperty('slug')){
          this.requiredFields[this.currentBookMeta.bookid]['slug'] = true;
        }

        if (this.isBookReaderCategory && (!Array.isArray(this.currentBookMeta.genres) || this.currentBookMeta.genres.length === 0)) {
          this.requiredFields[this.currentBookMeta.bookid]['genres'] = true;
        }
    },

    updateCollection(event) {
      let collectionId = event && event.target.value ? event.target.value : null;
      if (event && !collectionId) {
        this.unlinkCollectionWarning = true;
      } else {
        this.unlinkCollectionWarning = false;
        return this.updateBookCollection(collectionId)
          .then(response => {
            if (response.status === 200) {
              //console.log(`this.$route.name: `, this.$route.name, ' collectionId:', this.$route.params.collectionid);
              if (collectionId) {
                if (this.$route.name == 'BooksGrid') {
                  this.$store.dispatch('loadCollection', collectionId);
                }
                if (this.$route.name == 'CollectionBook' && this.$route.params.hasOwnProperty('collectionid')) {
                  if (this.$route.params.collectionid !== collectionId) {
                    //this.$router.replace({
                    //  name: 'CollectionBook',
                    //  params: {collectionid: collectionId, bookid: this.currentBook.bookid}
                    //});
                    this.$router.replace({
                      name: 'CollectionBooks',
                      params: {collectionid: this.$route.params.collectionid}
                    });
                  }
                }
              } else {
                if (this.$route.name == 'CollectionBook' && this.$route.params.hasOwnProperty('collectionid')) {
                  this.updateBooksList();
                  this.$router.replace({
                    name: 'CollectionBooks',
                    params: {collectionid: this.$route.params.collectionid}
                  });
                } else {
                  this.$store.dispatch('loadCollection', false);
                }
              }
            }
          })
          .catch(err => {
            this.unlinkCollectionWarning = false;
            console.log(err);
          })
      }
    },

    cancelCollectionUpdate() {
      this.unlinkCollectionWarning = false;
      this.currentBook.collection_id = this.currentBookMeta.collection_id;
    },

    ttsUpdate(key, value) {
      this.debounceUpdate(key, value)
    },

    removeTag(i){
      if (!this.adminOrLibrarian)
        return;

      this.currentBook.hashTags.splice(i,1)
      this.debounceUpdate('hashTags', this.currentBook.hashTags)
    },
    addTag(tag){
      if (!this.adminOrLibrarian)
        return;

      if (this.currentBook.hashTags)
        this.currentBook.hashTags.push(tag);
      else
        this.currentBook.hashTags = [tag];
      this.debounceUpdate('hashTags', this.currentBook.hashTags)
    },

    debounceUpdate () {
      // template function, will redefine in init() method for debounce.
      // this.debounceUpdate = _cacheDebounce(this.beforeMetaUpdateHook, this.updateMetaHook, this.currentBook.bookid, 500);
    },

    beforeMetaUpdateHook (...args) {
      let [key, value = null, _event = false, disable = false] = args;
      let checkErrorKey = /^author\./.test(key) ? 'author' : key;

      if (this.requiredFields[this.currentBook.bookid]
      && this.requiredFields[this.currentBook.bookid][checkErrorKey]) {
        if (checkErrorKey != 'author'){
          delete this.requiredFields[this.currentBook.bookid][checkErrorKey];
        } else {
          if (this.currentBookMeta.author.join("").length !== 0){
            delete this.requiredFields[this.currentBook.bookid][checkErrorKey];
          }
        }
      }

      if (this.currentBook.language == 'en' && (key == 'title' || key == 'author'))
      {
        try {
          delete this.requiredFields[this.currentBook.bookid]['slug'];
        } catch (err) {}
      }
      if (this.currentBook.author != 'en' && (key == 'title_en' || key == 'author_en'))
      {
        try {
          delete this.requiredFields[this.currentBook.bookid]['slug'];
        } catch (err) {}
      }

      if (key == 'difficulty') {

        let validationErrors = '';

        let re = /^\d{1,2}(\.\d{1,2})?$/i;

        if ( !this.currentBook.difficulty.match(re) ){
          validationErrors = 'Allowed range 1 - 14.99';
        }

        if ( parseFloat(this.currentBook.difficulty) > 14.99 ){
          validationErrors = 'Allowed range 1 - 14.99';
        }
        if ( parseFloat(this.currentBook.difficulty) < 1){
          validationErrors = 'Allowed range 1 - 14.99';
        }

        if(validationErrors != this.validationErrors['difficulty'] ){
          this.validationErrorDifficulty = validationErrors;
        }
        if(validationErrors && _event && disable){
          _event.target.toggleAttribute('disable');
          return false;
        }

      }

      if (key == 'weight') {
        let validationErrors = '';
        const maxValue = 10.99;
        const minValue = 1.00;
        const value = _event.target.value.replace(/ /g, '');
        const failFormat = !/^\d{1,2}(\.\d{1,2})?$/.test(value);

        if (Number(value) == value && value % 1 !== 0) {
          if (value > maxValue || value < minValue || (value.split('.')[1]).toString().length > 2 || failFormat) {
            //ILM-3622:
            validationErrors = 'Allowed range ' + minValue + ' - ' + maxValue ;
          }
        } else {
          if (value !== '' && (Number(value) != value || (value > maxValue || value < minValue) || failFormat)) {
            //ILM-3622:
            validationErrors = 'Allowed range ' + minValue + ' - ' + maxValue ;
          }
        }

        if(validationErrors != this.validationErrors['difficulty'] ){
          this.validationErrorWeight = validationErrors;
        }

        if(validationErrors && _event && disable){
          _event.target.toggleAttribute('disable');
          return false;
        }

      }

      //-- Set values immediately because of controls -- { --//
      if (key === 'numbering') {
        this.currentBook[key] = value;
      }

      let keys = key.split('.');
      if (keys.length == 2) {
        if (keys[0] && ['styles'].includes(keys[0])) {
          this.currentBook[keys[0]][keys[1]] = value;
        }
      }
      //-- } -- end -- Set values immediately because of controls --//

      if (keys[0] == 'alt_meta' && keys.length == 3) { // case of .alt_meta.ocean.category
        if (keys[2] == 'category') {
          try {
            delete this.requiredFields[this.currentBook.bookid]['category'];
          } catch (err) {}
        }
      }

      if (_event && _event.target) {
        if (disable) {
          _event.target.disabled = true;
        }
      }

      this.$store.dispatch('abortRequest', 'metaUpdate');

      return true;
    },

    updateMetaHook (bookCheck, ...args) {
      let targets = [];
      const update = args.reduce((acc, arg)=>{
        let [key, value = null, _event = false, disable = false] = arg;
        //console.log(`updateMetaHook.key.value._event: `, key,value,_event);
        if (_event && _event.target) {
          if (value === null) {
            value = _event.target.value;
          }
          if (disable) {
            targets.push(_event.target);
          }
        }

        let keys = key.split('.');

        if (keys[0] == 'alt_meta' && keys.length == 3) { // case of .alt_meta.ocean.category
          acc[keys[0]] = this.currentBook[keys[0]] || {};
          acc[keys[0]][keys[1]] = this.currentBook[keys[0]][keys[1]] || {};
          acc[keys[0]][keys[1]][keys[2]] = (value !== '' ? value : null);
          return acc;
        }
        if (keys.length == 2) {
          key = keys[0];
          const prevVal = this.currentBook[keys[0]];
          prevVal[keys[1]] = value;
          value = prevVal;
        }

        acc[key] = value;

        return acc;
      }, {});

      //console.log(`debounceUpdate.update: `, bookCheck.bookid, this.currentBook.bookid, update);
      update.bookid = bookCheck.bookid;
      return this.updateBookMeta(update)
      .then((response)=>{

        targets.forEach((target)=>{
          target.disabled = false
        });

        if (response && response.bookid === this.currentBook.bookid) {// ILM-5595 very quickly switch-over to another book, check bookid in URL or in state property currentBookid
          this.currentBook = Object.assign(this.currentBookMeta, response);
          this.currentBook.coverimg = this.currentBookFiles.coverimg;

          this.lockLanguage = false;
          if (Object.keys(update).includes('numbering')) {
            this.$root.$emit('from-meta-edit:set-num', this.currentBookid, update.numbering);
          }

          if (Object.keys(update).includes('language')) {
            setTimeout(() => {
              this.reloadBook()
              .then(() => {
                this.$root.$emit('book-reimported');
                this.isBatchProgress = false;
              })
            }, 1500)
          }
        }
        return response;
      })
      .catch(err => {
        if (err instanceof Error) {
          console.error(err);
          //return BPromise.reject(err);
        };
        return true;
      });
    },

    liveUpdate (key, value, event) {
      // Removed regards with ILM-3683:
      //bad conflict fix
      //  if(this.proofreadModeReadOnly)
      //      return ;
      //bad conflict fix

      //console.log(`liveUpdate: `, key, value, event);

      if (this.requiredFields[this.currentBook.bookid]
      && this.requiredFields[this.currentBook.bookid][key]) {
        if (key != 'author'){
          delete this.requiredFields[this.currentBook.bookid][key];
        } else {
          if (this.currentBookMeta.author.join("").length !== 0){
            delete this.requiredFields[this.currentBook.bookid][key];
          }
        }
      }

      if (this.currentBook.language == 'en' && (key == 'title' || key == 'author'))
      {
        try {
          delete this.requiredFields[this.currentBook.bookid]['slug'];
        } catch (err) {}
      }
      if (this.currentBook.author != 'en' && (key == 'title_en' || key == 'author_en'))
      {
        try {
          delete this.requiredFields[this.currentBook.bookid]['slug'];
        } catch (err) {}
      }

      let keys = key.split('.');
      key = keys[0];
      if (keys.length > 1) {
          this.currentBook[keys[0]][keys[1]] = value;
          value = this.currentBook[keys[0]];
      }

      let update = {
        [key]: value
      }

      //console.log(`updateBookMeta.update: `, update);

      return this.updateBookMeta(update)
      .then((response)=>{

        if (event) {
          event.target.disabled  = false ;
        }

        //console.log(`response: `, response);
        //console.log(`update.response: `, key, update[key], response[key]);
        //this.currentBook[key] = response[key];

        this.lockLanguage = false;
        if (key == 'numbering') {
          this.$root.$emit('from-meta-edit:set-num', this.currentBookid, value);
        }

        return response;

      })
      .catch(err => {
        if (err instanceof Error) {
          console.error(err);
          return BPromise.reject(err);
        };
        return true;
      });

    },

    languageName (code) {
      if (this.languages[code]) return this.languages[code]
    },
    publishedToggle () {
      this.currentBook.published = !this.currentBook.published
    },
    shareBook () {
      if (confirm('This will share the book with the entire library. Usually this is done after rudimentary formatting and text cleanup. Are you sure it is ready?')) {
        this.currentBook.published = 'false'
        this.currentBook.pubType = 'Hidden'
        this.currentBook.version = '1.0'
        this.currentBook.importStatus = 'shared'
      }
    },
    newVersion () {
      this.currentBook.version = (parseFloat(this.currentBook.version) + 0.1).toFixed(1).toString()
    },
    toggleVisibility () {
      this.visible = !this.visible
    },

    downloadBook () {
      this.showModal = true
    },

    uploadAudio () {
      this.showModal_audio = true
    },

    sharePrivateBook() {
      this.textCleanupProcess = true
      var self = this
      self.showSharePrivateBookModal = false
        //axios.put(API_URL + 'books/' + self.currentBook._id + '/share_private')
        self.debounceUpdate('private', false)
          .then((doc) => {
            axios.put(self.API_URL + 'task/' + self.currentBook._id + '/finish_cleanup')
              .then((doc) => {
                self.textCleanupProcess = false
                if (!doc.data.error) {
                  self.currentBook.private = false
                  self.tc_currentBookTasks.assignments.splice(self.tc_currentBookTasks.assignments.indexOf('content_cleanup'));
                  self.$store.dispatch('tc_loadBookTask')
                  self.$store.dispatch('getCurrentJobInfo');
                  self.$root.$emit('set-alert', 'Text cleanup task finished')
                } else {
                  self.debounceUpdate('private', true)
                  this.$root.$emit('set-error-alert', doc.data.error);
                }
              })
              .catch((err, test) => {
                self.textCleanupProcess = false
                self.debounceUpdate('private', true)
              })
          })
          .catch((err) => {
            self.textCleanupProcess = false
          })
    },

    addAuthor() {
      this.currentBook.author.push('');
      this.debounceUpdate('author', [...this.currentBook.author], false);
    },

    removeAuthor(i) {
      if (i > 0 || this.currentBook.author.length > 1) {
        this.currentBook.author.splice(i, 1);
        this.debounceUpdate('author', [...this.currentBook.author], false);
      }
    },

    changeAuthorLink(ev, i) {
      const {
        id = null,
        name = '',
        name_en = '',
        slug = '',
      } = ev.value || {};
      this.currentBook.author_link[i] = {id, name, name_en, slug};
      this.debounceUpdate('author_link', [...this.currentBook.author_link], false);
    },

    editAuthorLink(ev, i, field) {
      this.currentBook.author_link[i].id = null;
      this.debounceUpdate('author_link', [...this.currentBook.author_link], false);
    },

    addAuthorLink(ev) {
      this.currentBook.author_link.push({
        id: null,
        name: '',
        name_en: '',
        slug: '',
        // alt_names: [],
        // language: 'en'
      });
      this.debounceUpdate('author_link', [...this.currentBook.author_link], false);
    },

    removeAuthorLink(ev, i) {
      if (i > 0 || this.currentBook.author_link.length > 1) {
        this.currentBook.author_link.splice(i, 1);
        this.debounceUpdate('author_link', [...this.currentBook.author_link], false);
      }
    },

    publish() {
      // this.isPublishing = false;
      // this.isPublishingQueue = true;
      return axios.post(this.API_URL + 'books/' + this.currentBookMeta.bookid + '/publish')
      .then(resp => {
        if (resp.status == 200 && resp.data.ok) {
          this.currentBook.isInTheQueueOfPublication = true;
          this.currentBookMeta.isInTheQueueOfPublication = true;
        }
        //console.log(resp);
      });
    },

    publishContent() {
      return axios.get(this.API_URL + 'books/' + this.currentBookMeta.bookid + '/publish_content')
    },

    goToUnresolved(with_task = false) {

      let route = {
        name: this.$route.name,
        params: {
          book: this.$route.params.bookid
        }
      }

      if (this.blocksToApproveCounter === 0) {
        return route;
      }

      if (this.$route.matched.some(record => {
        return record.meta.mode === 'edit' || record.meta.mode === 'narrate'
      })) {
        route.params.block = 'unresolved';

        if (with_task) {
          route.params.task_type = true;
          if (this.currentJobInfo.text_cleanup) route.params.task_type = 'text-cleanup';
        }
      //this.$router.push({name: this.$route.name, params:  params});
      }
      return route;
    },

    setAllowExportAudio() {
      this.allowExportAudio = false;
      if (this.isEditor && this.currentBookMeta._id) {
        if (this.tc_hasTask('audio_mastering')) {
          this.allowExportAudio = true;
        } else {
          let self = this;
          return axios.get(this.API_URL + 'books/' + this.currentBookMeta._id + '/allow_audio_export')
            .then(response => {
              if (response.status == 200 && typeof response.data.allow !== 'undefined') {
                self.allowExportAudio = response.data.allow;
              } else {
                self.allowExportAudio = false;
              }
              return true;
            })
            .catch(err => {
              self.allowExportAudio = false;
              return false;
            });
        }
      }
    },

    startGenerateAudiofile() {
      this.currentBook.mergedAudiofile = null;
      this.debounceUpdate('mergedAudiofile', null);
      this.generatingAudiofile = true;
      axios.get(this.API_URL + 'books/' + this.currentBook.bookid + '/audiobooks/download')
      //:href="API_URL + 'books/' + currentBook.bookid + '/audiobooks/download'" target="_blank"
    },

    removeBook() {
      if (this.isAdmin) {
        axios.delete(this.API_URL + 'books/' + this.currentBook.bookid)
      }
    },

    collectCheckedStyles(startId, endId, isSwitch = true) {
      let result = new Map();
      let nums = new Map();
      let lang = 'en'; // for transfer to block styles panel;
      let pausesAfter = new Map();

      //console.log('collectCheckedStyles', startId, endId);

      if (this.storeListO.getBlock(startId)) {
        let idsArrayRange = this.storeListO.ridsArrayRange(startId, endId);
        idsArrayRange.forEach((blockRid)=>{
        //console.log('blockId', blockId);

          let oBlock = this.storeListO.get(blockRid);

          if (oBlock) {
            let pBlock = this.storeList.get(oBlock.blockid);
            if (pBlock) {
              if (!result.has(oBlock.type)) result.set(oBlock.type, new Map());

              if (pBlock.language && pBlock.language.length) {
                //return this.block.language;
                if (pBlock.language != 'en') lang = pBlock.language;
              } else {
                if (this.currentBookMeta.language != 'en') lang = this.currentBookMeta.language;
              }

              for (let styleKey in this.blockTypes[oBlock.type]) {
                if (!result.get(oBlock.type).has(styleKey)) result.get(oBlock.type).set(styleKey, new Map());

                let styleSubKey = this.blockTypes[oBlock.type][styleKey];
                if (typeof styleSubKey == 'object' && !Array.isArray(styleSubKey)) {
                  for (let subKey in styleSubKey) {
                    if (!result.get(oBlock.type).get(styleKey).has(subKey)) {
                      result.get(oBlock.type).get(styleKey).set(subKey, new Map());
                    }
                    if (pBlock.classes[styleKey] && pBlock.classes[styleKey][subKey]) {
                      result.get(oBlock.type).get(styleKey).get(subKey).set(pBlock.classes[styleKey][subKey], true);
                    } else {
                      result.get(oBlock.type).get(styleKey).get(subKey).set(this.blockTypes[oBlock.type][styleKey][subKey][0], true);
                    }
                  };
                } else {
                  if (pBlock.classes[styleKey]) {
                    result.get(oBlock.type).get(styleKey).set(pBlock.classes[styleKey], true);
                  } else {
                    result.get(oBlock.type).get(styleKey).set('none', true);
                  }
                }
              }

              if (!nums.has(oBlock.type))
                nums.set(oBlock.type, new Map([
                  ['secNum',  !(oBlock.isNumber === false)],
                  ['secHide', !(oBlock.isHidden === false)],
                  ['parNum',  !(oBlock.isNumber === false)],
                  ['parHide', !(oBlock.isHidden === false)],
                ]));

              //console.log('nums.get(pBlock.type)', nums.get(pBlock.type), !(pBlock.secnum === false));

              if (nums.get(oBlock.type).get('secNum') !== 'mixed') {
                if (oBlock.hasOwnProperty('secnum')) {
                  if (!(oBlock.isNumber === false) !== nums.get(oBlock.type).get('secNum')) {
                    nums.get(oBlock.type).set('secNum', 'mixed');
                  } else {
                    nums.get(oBlock.type).set('secNum', !(oBlock.isNumber === false));
                  }
                } else {
                  nums.get(oBlock.type).set('secNum', false);
                }
              }
              if (nums.get(oBlock.type).get('secHide') !== 'mixed') {
                if (oBlock.hasOwnProperty('isHidden')) {
                  if (!(oBlock.isHidden === false) !== nums.get(oBlock.type).get('secHide')) {
                    nums.get(oBlock.type).set('secHide', 'mixed');
                  } else {
                    nums.get(oBlock.type).set('secHide', !(oBlock.isHidden === false));
                  }
                } else {
                  nums.get(oBlock.type).set('secHide', false);
                }
              }
              if (nums.get(oBlock.type).get('parNum') !== 'mixed') {
                if (oBlock.hasOwnProperty('isNumber')) {
                  if (!(oBlock.isNumber === false) !== nums.get(oBlock.type).get('parNum')) {
                    nums.get(oBlock.type).set('parNum', 'mixed');
                  } else {
                    nums.get(oBlock.type).set('parNum', !(oBlock.isNumber === false));
                  }
                } else {
                  nums.get(oBlock.type).set('parNum', false);
                }
              }
              if (this.bookMode !== 'narrate' || pBlock.allowNarrate(this.bookMode)) {
                if (!pausesAfter.has(oBlock.type)) {
                  pausesAfter.set(oBlock.type, new Map());
                  pausesAfter.get(oBlock.type).set('pause_after', new Map());
                  /*pausesBefore.get(oBlock.type).get('pauses_before').set(new Map([
                    ['none', !pBlock.pause_before],
                    [0.6, pBlock.pause_before == 0.6],
                    [1, pBlock.pause_before == 1],
                    [2, pBlock.pause_before == 2],
                    [4, pBlock.pause_before == 4]
                  ]));*/
                }
                pausesAfter.get(oBlock.type).get('pause_after').set(pBlock.pause_after ? `${pBlock.pause_after}` : 'none', true);
                //pausesBefore.get(oBlock.type).get('pause_before').set(pBlock.pause_before ? pBlock.pause_before : '0.6', true);
              }
            }
          }

        });
      }

      if (lang != 'en'){
        result.lang = lang;
      }

      if (this.bookMode !== 'narrate') {

        this.styleTabs = result;
        this.numProps = nums;
      } else {
        this.styleTabs = new Map();
        this.numProps = new Map();
      }
      this.pausesAfterProps = pausesAfter;

      //console.log('result', result);
      //console.log('nums', nums);

      Vue.nextTick(()=>{

        if (result.size == 0) {
          $('.block-style-tabs').find('li[name="tab"]').first().trigger( "click" );
        } else if (isSwitch) {
          //$(`a[aria-controls="#block-type-${result.keys().next().value}"]`).parent().trigger( "click" );
          if (this.bookMode !== 'narrate') {
            if (!this.activeStyleTab || !Array.from(result.keys()).includes(this.activeStyleTab)) {
              $(`li#t-block-type-${result.keys().next().value}`).trigger( "click" );
            }
          } else {
            if (pausesAfter.size > 0) {
              if (!this.activeStyleTab || !Array.from(pausesAfter.keys()).includes(this.activeStyleTab)) {
                $(`li#t-block-type-${pausesAfter.keys().next().value}`).trigger( "click" );
              }
            } else {
              $('.block-style-tabs').find('li[name="tab"]').first().trigger( "click" );
            }
          }
        }

      });
    },

    selectStyle(blockType, styleKey, styleVal) {
      if(this.proofreadModeReadOnly) {
        return;
      }
      let updateBookVersion = false;
      let styleKeyArr = styleKey.split('.');
      styleKey = styleKeyArr.shift();
      //console.log('selectStyle-', 'blockType:', blockType, 'styleKey:', styleKey, 'styleVal:', styleVal);
      let updateToc = (styleKey == 'table of contents' || (blockType == 'title' && styleKey == 'style') );
      let updateNum = !(styleKey == 'paragraph type' && ['sitalcent', 'editor-note', 'reference', 'signature'].indexOf(styleVal) >-1);
      let updatePromises = [], updateNums = [];
      if (this.blockSelection.start._id && this.blockSelection.end._id) {
        if (this.storeList.has(this.blockSelection.start._id)) {
          let idsArrayRange = this.storeListO.ridsArrayRange(this.blockSelection.start._id, this.blockSelection.end._id);
          idsArrayRange.forEach((blockRid)=>{
            let oBlock = this.storeListO.get(blockRid);
            if (oBlock) {
              let pBlock = this.storeList.get(oBlock.blockid);
              if (styleKey !== 'paragraph type') updateNum = oBlock.isNumber;

              if (pBlock) {
                if (!updateBookVersion && !pBlock.disabled) {
                  updateBookVersion = true;
                }
                pBlock.classes = this.mixin_buildTOCStyle({blockType, styleKey, styleVal, classes: pBlock.classes}); // ILM-2533
              }

              /*if (pBlock && blockType == 'title') { // ILM-2533
                if (styleKey == 'style') {
                  if (styleVal != '') {
                    pBlock.classes['table of contents'] = {isInToc: 'off'};
                  } else {
                    pBlock.classes['table of contents'] = {isInToc: 'on'};
                  }
                }
                if (styleKey == 'table of contents' && styleVal == 'on') {
                  pBlock.classes['style'] = '';
                } else {
                  //pBlock.classes['style'] = this.blockTypes[blockType]['style'][1];
                }
              }
              if (pBlock && blockType == 'header') { // ILM-2533
                if (styleKey == 'level')
                  switch(styleVal) {
                    case 'h1' : {
                      pBlock.classes['table of contents'] = {isInToc: 'on', tocLevel: 'toc1'};
                    } break;
                    case 'h2' : {
                      pBlock.classes['table of contents'] = {isInToc: 'on', tocLevel: 'toc2'};
                    } break;
                    case 'h3' : {
                      pBlock.classes['table of contents'] = {isInToc: 'on', tocLevel: 'toc3'};
                    } break;
                    case 'h4' : {
                      pBlock.classes['table of contents'] = {isInToc: 'off', tocLevel: 'toc4'};
                    } break;
                  };
                if (styleKey == 'table of contents') {
                  if (typeof pBlock.classes['table of contents'] !== 'object') {
                    pBlock.classes['table of contents'] = {};
                  }
                  switch(styleVal) {
                    case 'toc4' : {
                      pBlock.classes['table of contents']['isInToc'] = 'off'
                    } break;
                    default: {
                      pBlock.classes['table of contents']['isInToc'] = 'on'
                    }
                  };
                }
              }*/

              if (this.styleNotNumbered.indexOf(pBlock.classes[styleKey]) == -1 && this.styleNotNumbered.indexOf(styleVal) != -1){
                pBlock.parnum = false;
                pBlock.isNumber = false;
              }

              if (this.styleNotNumbered.indexOf(pBlock.classes[styleKey]) != -1 && this.styleNotNumbered.indexOf(styleVal) == -1){
                pBlock.parnum = true;
                pBlock.isNumber = true;
              }

              if (pBlock && pBlock.type == blockType) {
                  if (styleVal.length) {
                    if (styleKeyArr.length) {
                      if (typeof pBlock.classes[styleKey] !== 'object') {
                        pBlock.classes[styleKey] = {};
                        pBlock.classes[styleKey][styleKeyArr.slice().shift()] = styleVal;
                      } else {
                        pBlock.classes[styleKey][styleKeyArr.slice().shift()] = styleVal;
                      }
                    }
                    else pBlock.classes[styleKey] = styleVal;
                    if (blockType === 'header' && styleKey === 'level') {
                      updateToc = true;
                      //pBlock.classes['table of contents'] = {};//'toc' + styleVal.replace(/\D/, '');
                    }
                  }
                else pBlock.classes[styleKey] = '';
                //console.log(oBlock.blockid, 'isNumber', oBlock.isNumber,  'updateNum', updateNum);
                if (oBlock.isNumber !== updateNum) {
                  updateNums.push(oBlock.rid);
                  pBlock.isNumber = updateNum;
                  oBlock.isNumber = updateNum;
                  updatePromises.push(this.putNumBlock(pBlock));
                } else {
                  //pBlock.status = pBlock.status || {};
                  //pBlock.status.marked = false;
                  //console.log(styleKey, styleVal, pBlock.isChanged, pBlock.content);
                  let updateBody = {
                    blockid: pBlock.blockid,
                    bookid: pBlock.bookid,
                    classes: pBlock.classes,
                    rid: pBlock._rid
                    //status: pBlock.status
                  };
                  let isCouplet = styleKey === "whitespace" && styleVal === "couplet";
                  if (isCouplet) {// send content for update, to parse content for couplet
                    updateBody['content'] = pBlock.content;
                  }
                  updatePromises.push(this.putBlockPart([updateBody, false, pBlock.getIsChanged() || pBlock.getIsAudioChanged() || (this.playingBlock.blockid === pBlock.blockid && this.playingBlock.partIdx !== null)])
                    .then(() => {
                      if (isCouplet) {
                        this.$root.$emit(`block-state-refresh-${pBlock.blockid}`);
                      }
                      return Promise.resolve();
                    }));
                }
              }
            }
          })
          if (updateBookVersion) {
            this.updateBookVersion({major: true});
          }
        }
        Promise.all(updatePromises)
          .then(()=>{
            if (updateNums.length > 0) {
              this.putNumBlockOBatch({bookId: this.currentBookid})
              .then(()=>{
                this.$root.$emit('from-meta-edit:set-num');
                console.log("$emit('from-meta-edit:set-num')");
                if (updateToc) {
                  this.$root.$emit('from-book-meta:upd-toc', true);
                }
                this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
              });
            } else {
              if (updateToc) {
                this.$root.$emit('from-book-meta:upd-toc', true);
              }
              this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
            }
          })
      }
    },

    dummySelectStyle(blockType, styleKey, styleVal) {
      if(styleVal !== "couplet" ||
        document.cookie.includes('dontShowAgainCoupletWarning=true')) {
        this.selectStyle(blockType, styleKey, styleVal);
      } else {
        let coupletInfo = {};
        this.$modal.show(CoupletWarningPopup, {
          coupletInfo: coupletInfo
        },
        {
          height: 'auto',
          width: '440px',
          clickToClose: false
        },
        {
          'closed': (e) => {
            if (coupletInfo && coupletInfo.success) {
              this.saveCoupletChanges(coupletInfo.isDontShowAgain);
            } else {
              this.cancelCoupletUpdate(coupletInfo && coupletInfo.isDontShowAgain);
            }
          }
        });
        this.blockType = blockType;
        this.styleKey = styleKey;
        this.styleVal = styleVal;
      }
    },

    saveCoupletChanges(isDontShowAgain) {
      this.closeCoupletWarningPopup();
      this.saveUserChoiceToCookie(isDontShowAgain);
      this.selectStyle(this.blockType, this.styleKey, this.styleVal);
    },

    saveUserChoiceToCookie(isDontShowAgain) {
      if (isDontShowAgain &&
        !document.cookie.includes('dontShowAgainCoupletWarning=true')) {
        document.cookie = 'dontShowAgainCoupletWarning=true';
      }
    },

    closeCoupletWarningPopup() {
      this.isCoupletWarningPopupActive = false;
    },

    cancelCoupletUpdate(isDontShowAgain) {
      this.saveUserChoiceToCookie(isDontShowAgain);
      this.closeCoupletWarningPopup();
    },

    selectPauseAfter(blockType, styleVal) {
      //console.log('selectPauseAfter', blockType, styleVal);
      if (this.proofreadModeReadOnly) {
        return;
      }
      if (this.blockSelection.start._id && this.blockSelection.end._id) {
        if (this.storeList.has(this.blockSelection.start._id)) {
          /*let idsArrayRange = this.storeListO.ridsArrayRange(this.blockSelection.start._id, this.blockSelection.end._id);
          idsArrayRange.forEach((blockRid)=>{
            let oBlock = this.storeListO.get(blockRid);
            if (oBlock && oBlock.type === blockType) {
              let pBlock = this.storeList.get(oBlock.blockid);
              pBlock.pause_after = styleVal;
            }
          })*/
          this.updateBookVersion({major: true});
        }
        return this.setPauseAfter([blockType, styleVal])
          .then((update) => {
            if (update) {
              this.tc_loadBookTask(this.currentBookMeta._id);
              this.getCurrentJobInfo();
              Vue.nextTick(() => {
                this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
                //this.$refs.pauseAfterControl[0].recalcPauseAfterRange(true);
              });
            }
          });
      }
    },

    listenSetStyle () {
      //console.log('listenSetStyle', this.selectionStart, this.selectionEnd);
      if (this.selectionStart && this.selectionEnd) {
        this.collectCheckedStyles(this.selectionStart, this.selectionEnd, false);
      }
    },

    listenSetStyleSwitch () {
      //console.log('listenSetStyleSwitch', this.selectionStart, this.selectionEnd);
      if (this.selectionStart && this.selectionEnd) {
        this.collectCheckedStyles(this.selectionStart, this.selectionEnd, true);
      }
    },

    selSecNum (blockType, valKey, currVal) {
        if(this.proofreadModeReadOnly)
            return;
      //console.log('selSecNum', blockType, valKey, currVal);
      let updatePromises = [];
      if (this.blockSelection.start._id && this.blockSelection.end._id) {
        if (this.storeList.has(this.blockSelection.start._id)) {
          let putBlockOpromise = [];
          let idsArrayRange = this.storeListO.ridsArrayRange(this.blockSelection.start._id, this.blockSelection.end._id);
          let oBlock;

          idsArrayRange.forEach((blockRid)=>{
            oBlock = this.storeListO.get(blockRid);
            if (oBlock && oBlock.type == blockType) {
              switch(valKey) {
                  case 'secHide' : {
                    if (currVal == 'mixed' || currVal === false) {
                      oBlock.isHidden = true;
                    } else {
                      oBlock.isHidden = false;
                    }
                  } break;

                  case 'secNum' : {
                    if (currVal == 'mixed' || currVal === false) {
                      oBlock.isNumber = true;
                    } else {
                      oBlock.isNumber = false;
                    }
                  } break;

                  case 'parNum' : {
                    if (currVal == 'mixed' || currVal === false) {
                      oBlock.isNumber = true;
                    } else {
                      oBlock.isNumber = false;
                    }
                  } break;
                  default : {
                  } break;
              };

              if (oBlock.rid) {
                let upd = {
                  rid: oBlock.rid,
                  isHidden: oBlock.isHidden,
                  isNumber: oBlock.isNumber
                }
                putBlockOpromise.push(this.putBlockO(upd));
              }
            }
          });

          Promise.all([putBlockOpromise]).then((res)=>{
            if (valKey == 'secNum' || valKey == 'parNum') {
              let blockO = this.storeListO.getBlock(this.blockSelection.start._id);
              this.$root.$emit('from-meta-edit:set-num', this.currentBookid, this.currentBook.numbering, blockO.rid)
            } else {
              this.$root.$emit('from-meta-edit:set-num');
            }
            this.updateBookVersion({major: true})
            if (valKey == 'secHide' && blockType == 'header') {
              this.$root.$emit('from-book-meta:upd-toc', true);
            }
          })
        }

        this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
      }
    },

    downloadDemo() {
        let currTime = new Date().getTime();
        this.currentBookMeta.demo_time = -1 * currTime;
        return axios.get(this.API_URL + 'books/' + this.currentBook._id + '/demo')
               .then(resp => {
                 //this.isExporting = false;
               });
    },

    deactivateDemoLink() {
      console.log('inside deactivate');
      return axios.get(this.API_URL + 'books/' + this.currentBook._id + '/deactivateDemoLink')
             .then(resp => {
               //this.isExporting = false;
             });
    },

    downloadExportMp3() {
        return this.API_URL + 'export/' + this.currentBook._id + '/exportMp3';
    },

    downloadExportFlac() {
        return this.API_URL + 'export/' + this.currentBook._id + '/exportFlac';
    },

    prepareStyleTabLabel(title) {
      if (this.styleTabLabels.hasOwnProperty(title)) {
        let caption = this.styleTabLabels[title];
        return caption;
      }
      return title;
    },

    styleCaption(type, key) {
      if (this.styleTitles.hasOwnProperty(`${type}_${key}`)) {
        let caption = this.styleTitles[`${type}_${key}`];
        return caption.charAt(0).toUpperCase() + caption.slice(1);
      }
      return key.charAt(0).toUpperCase() + key.slice(1);
    },

    styleValue(type, key, val, lang='en') {
      key = key.split('.').shift(); // in case of "table of contents.level"
      //console.log('styleValue:', type, key, val);

      if (BlockTypesAlias[type] && BlockTypesAlias[type][key] && BlockTypesAlias[type][key]['values'] && BlockTypesAlias[type][key]['values'][val]) {
        return BlockTypesAlias[type][key]['values'][val];
      } else {
        if (this.authorsLangFarsi.hasOwnProperty(val) && (lang == 'fa' || lang == 'ar')){
          return this.authorsLangFarsi[val];
        } else {
          return val;
        }

      }
    },

    finishPublished() {
      this.finishPublishedProcess = true;
      return axios.post(this.API_URL + 'task/' + this.currentBook._id + '/finish_published')
        .then(response => {
          this.finishPublishedProcess = false;
          this.updateBookVersion({major: true})
          this.tc_loadBookTask();
          this.getCurrentJobInfo();
        })
        .catch(err => {
          this.finishPublishedProcess = false;
          return false;
        });
    },

    updateExtid: _.debounce(function(event) {
      if (event.target.value && event.target.value.length != 32) {
        this.validationErrors[this.currentBook.bookid]['extid'] = ['Length must be equal to 32 symbols.']
      } else if (/[^a-z\d]+/.test(event.target.value) || /\d+\.$/.test(event.target.value)) {
        this.validationErrors[this.currentBook.bookid]['extid'] = ['Only lowercase letters (a-z) and numbers.']
      } else {
        this.validationErrors[this.currentBook.bookid]['extid'] = [];
        this.debounceUpdate('extid', event.target.value);
      }
    }, 500),

    updateHashTags (event) {
      let array = event.target.value.split(', ');
      this.currentBook.hashTags = array;
      this.debounceUpdate('hashTags', this.currentBook.hashTags)
    },

    getTaskType(typeId) {
      let t = this.taskTypes.tasks.find(_t => {
        return _t._id === typeId;
      });
      if (t) {
        return t.title;
      } else {
        return '';
      }
    },

    checkAfterAudioImport() {
      if (this.activeTabIndex !== this.TAB_AUDIO_INDEX && this.$refs.panelTabs && this.$refs.panelTabs.tabs[this.TAB_AUDIO_INDEX] && !this.$refs.panelTabs.tabs[this.TAB_AUDIO_INDEX].disabled) {
        this.activeTabIndex = this.TAB_AUDIO_INDEX;
        this.$refs.panelTabs.findTabAndActivate(this.TAB_AUDIO_INDEX);
        this.$forceUpdate();
      }
    },

    updateJobDescription: _.debounce(function(event) {
      this.updateJob({id: this.currentJobInfo.id, description: event.target.value});
    }, 500),

    goToBlock(blockId, ev) {
      this.$router.push({name: this.$route.name, params: {}});
      this.$router.push({name: this.$route.name, params:  { block: blockId }});
    },

    styleTabChange(index, component) {
      //console.log('styleTabChange', index, component.id, component)
      this.activeStyleTab = component.title === 'line' ? 'hr' : component.title;
    },

    displayStyleTab(blockType) {
      if (this.bookMode !== 'narrate') {
        return (this.styleTabs.has(blockType));
      }
      return this.pausesAfterProps.has(blockType);
    },

    setTrimSilenceConfig(val, ev) {
      switch (val) {
        case 'audio_tts_narration':
          return this.debounceUpdate('trim_silence_config', {audio_file: true, tts: true, narration: true}, ev);
          break;
        case 'tts_narration':
          return this.debounceUpdate('trim_silence_config', {audio_file: false, tts: true, narration: true}, ev);
          break;
      }
    },

    clearError(field, event) {
      if (this.requiredFields && this.requiredFields[this.currentBook.bookid] && this.requiredFields[this.currentBook.bookid][field]) {
        if (event && event.target && event.target.value) {
          delete this.requiredFields[this.currentBook.bookid][field];
          this.$forceUpdate();
        }
      }
    },

    checkGenresErrors() {
      if (this.requiredFields[this.currentBookMeta.bookid]) {
        delete this.requiredFields[this.currentBookMeta.bookid].genres;
        this.$forceUpdate();
      }
    },

    ...mapActions(['getAudioBook', 'updateBookVersion', 'setCurrentBookCounters', 'putBlock', 'putBlockO', 'putNumBlock', 'putNumBlockO', 'putNumBlockOBatch', 'freeze', 'unfreeze', 'blockers', 'tc_loadBookTask', 'getCurrentJobInfo', 'updateBookMeta', 'updateJob', 'updateBookCollection', 'putBlockPart', 'reloadBook', 'setPauseAfter', 'updateBooksList'])
  }
}

Vue.filter('prettyBytes', function (num) {
  // jacked from: https://github.com/sindresorhus/pretty-bytes

  if (typeof num !== 'number' || isNaN(num)) {
    //throw new TypeError('Expected a number');
    return 0;
  }

  var exponent;
  var unit;
  var neg = num < 0;
  var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  if (neg) {
    num = -num;
  }

  if (num < 1) {
    return (neg ? '-' : '') + num + ' B';
  }

  exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
  num = (num / Math.pow(1000, exponent)).toFixed(1) * 1;
  unit = units[exponent];

  return (neg ? '-' : '') + num + ' ' + unit;
});
</script>
<style>
select.text-danger#categorySelection, input.text-danger{
  color: #000;
  border: 1px solid red!important;
  border-radius: 0px;
}
.trans-from-wrapper {
  height: 31px;
}
.trans-from-wrapper i{
  position: relative;
  top: -26px;
  left: -5px;
  background: white;
}
.meta-edit-tabs .nav-tabs-navigation {
  position: sticky;
  top: 43px;
  background-color:white;
  z-index: 1;
}

#p-styles-switcher.tab-container {
  padding-top: 0px;
}

.meta-edit-tabs > .nav-tabs-navigation{
  border: 1px solid white;
  position: sticky;
  top: -1px;
  background-color: white;
  z-index: 1;
}

/*.meta-edit-tabs .nav-tabs-navigation .nav > li {
  position: inherit;
}

.meta-edit-tabs .nav-tabs-navigation .nav > li > a {
  position: inherit;
}*/

</style>

<style scoped src='./css/BookProperties.css'></style>
<style>
  .disabled .tab{
    background-color: whitesmoke ;
  }
  .disabled .tab.active{
    background-color: transparent ;
  }
</style>
<style scoped lang="less">

  .btn_download {
    border: 0px;
    background-color: Transparent;
    outline:none;
  }

  img.bookstack {
    width: 60px;
    opacity: .75
  }

  .download-area {
    margin-left:15px; padding-left:0;
  }
  .download-area .btn_download {
    float: right;
  }
  .download-area .btn_audio_upload {
    float: left;  margin: 10px; margin-left: -15px;
  }
  /* Wrapper around entire side editor */
  .sidebar {
    width: 100%;
    margin-top:0px;
    margin-left:0;
    padding-left:0;
    overflow-y: auto;
    height: 100%;
  }
  .sidebar::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    border-radius: 10px;
    background-color: #F5F5F5;
  }
  .sidebar::-webkit-scrollbar {
    width: 12px;
    background-color: #F5F5F5;
  }
  .sidebar::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: #555;
  }

  /* Main book cover image */
  div.coverimg {
    padding:0; margin: 5px; margin-right: 8px;
    float: left;
    margin-left: 3px; margin-top: 0;
    background: white;
    box-shadow: inset 0px 0px 3px 3px rgba(0,0,0,0.06);
    cursor: pointer;
    position: relative;
  }
  div.coverimg-wrap {
    height: 80px;
    width: 60px;
  }
  .author,  h4.title {margin: 0; margin-top:2px; padding-bottom: 0; }
  .subtitle {margin-top:0;}

  /*  Top edit icon for opening the book in an edit mode */
  .edit-button {
    float: right;  cursor: pointer; margin-top: -5px;
  }

  /* Edit area for book description */
  fieldset.description textarea {
    width: 100%; padding: 0; margin:0; border: none;
    /*min-height: 180px;*/
    resize: vertical;
  }
  fieldset.description.brief textarea {
    /*min-height: 50px;*/
  }
  fieldset.approve-metadata textarea {
    width: 100%;
    min-height: 100px;
  }

  /* Properties editor area */
  table.properties {margin:0; padding:0; width:100%; font-size: 1em;
    border-collapse: separate; border-spacing: 3px;
  }
  table.properties td:nth-child(1) {width: 28%; padding: 3px; margin:0}
  table.properties td:nth-child(2) {width: auto; text-align: right;}
  table.properties tr:nth-child(odd) {background-color: #F0F0F0}
  table tr {border: 2px solid white}
  table tr.changed {border: 2px solid wheat}
  table tr input {font-size: 1em; width: 100%}
  tr.subtitle input {font-size: .85em; width: 100%; line-height: 1.85em;}

  /*TODO remove*/
  tr.author input {width: 90%;}
  tr.author button {border: none !important; background-color: inherit; padding: 0}
  tr.author button.disabled i {display: none; border: none;}

  #p-book-content.tab-container[role="tabpanel"] {
    table.properties {
      tr.author-link-container {

        fieldset.authors-list {
          width: 99%;
          padding: 0px 0px 5px 2px;
          margin: 0;
        }

        td {
          padding: 0;
        }

        table.author-link-table {
          width: 100%;

          tr.author-link {
            border: none;
            background-color: white;
            height: 35px;

            &:nth-child(odd) {
              background-color: #F0F0F0;
            }

            td:nth-child(1) {
              padding: 3px;
              width: 28%;
            }

            td:nth-child(2) {
              padding: 2px 0px 2px 2px;
              text-align: left;

              div.p-dropdown.p-component {
                border-radius: 0px 2px 2px 0px;
                /*border-left-width: 0px;*/
                height: 30px;
                margin-left: -10px;
                left: -1px;
                float: right;
              }
            }

            input.author-name {
              width: 86%;
              margin-left: 0;
              margin-right: auto;
              border: 1px solid rgb(118, 118, 118);
              border-radius: 2px 0px 0px 2px;
              /*border-right-width: 0px;*/
            }
          }
        }

        div.add-author, div.rem-author {
          width: 20px;
          height: 21px;
          margin-top: 4px;
          margin-left: auto;
          margin-right: 0;

          button { border: none !important; background-color: inherit; padding: 0 }
          button.disabled i { display: none; border: none; }
        }
      }


      tr.author-link {
  /*      td { width: auto; text-align: left; }
        &.add-author {
          button { border: none !important; background-color: inherit; padding: 0 }
          button.disabled i { display: none; border: none; }
        }*/

  /*      div.p-dropdown.p-component.p-dropdown-clearable {
          height: 31px;
          width: 42px;
          margin-top: -10px;
          top: 10px;
          border-left-width: 0px;

          span.p-dropdown-label.p-inputtext {
            padding-right: 0px;
            padding-left: 0px;
          }

        }*/

  /*      input {
          &.author-name {
            width: 86%;
            margin-right: -5px;
          }
        }*/
      }
    }
  }

  .disabled {font-style: italic; color: gray; font-size: .85em;}

  /* publication info */
  i.pubtoggle {cursor: pointer;}
  button.new-version { font-size: 1em; }
  button.sharebtn {width: 100%}

  .fix-message {
    color: red;
    background-color: yellow;
  }
  .preloader-small {
      background: url(/static/preloader-snake-small.gif);
      width: 34px;
      height: 34px;
  }

  .nav-tabs-navigation {
    margin-top: 3px;
  }

  .tab-content input[type=radio] {
    width: auto;
    display: inline-block;
    margin-top: 8px;
    margin-left: 20px;
    padding-top: 5px;
  }

  .tab-content input[type=radio]:focus {
    box-shadow: none;
  }

  .tab-content .style-label {
    margin-top: 4px;
    margin-bottom: 0px;
    display: inline-block;
    vertical-align: top;
    font-weight: 400;
  }

  .style-label {
    cursor: pointer;
  }

  .sidebar-bookmeta {
    width: 100%;
  }

  .editing-wrapper {
    margin-left: 15px;

    .blocks-counter {
      vertical-align: middle;
      line-height: 34px;
      color: #337ab7;
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    }

    .blocks-counter-value {
      display: inline-block;
      width: 50px;
      float: none;
      font-weight: bold;
      text-align: right;
      margin-right: 8px;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .t-box {
    height: 30px;
    border-left: 1px solid #ddd;
    padding-top: 7px;
    padding-left: 20px;
    vertical-align: middle;

    .btn-switch {
      display: inline-block;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
    }
    span.s-label {
      /*margin-top: 6px;*/
      float: none;
      width: auto;
      cursor: pointer;
      line-height: 24px;
      &.-disabled {
        opacity: .65;
      }
    }
    i.fa-toggle-on, i.fa-toggle-off {
      /*margin-top: 6px;*/
      font-size: 22px;
      height: 22px;
      line-height: 22px;
      vertical-align: top;
    }
    .btn-export-audio {
      margin-left: 10px;
      &.-disabled {
        opacity: .65;
        cursor: not-allowed;
      }
    }
  }
  .modal-body {
    .align-preloader {
      width: 100%;
      background-repeat: no-repeat;
      background-position: center;
    }
    &.download-audiofile {
      text-align: center;
    }
  }

  .tab-container[role="tabpanel"] {
    padding-top: 3px;
  }
  #p-assignments.tab-container[role="tabpanel"],
  #p-book-content.tab-container[role="tabpanel"] {
    fieldset {
      width: 98%;
      padding-left: 5px;
      padding-right: 5px;
      padding-bottom: 3px;
    }
  }

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
      &.global-style {
        width: 22%;
      }
      &.automatic-numeration {
        width: 22%;
      }
      &.trim-silence-config {
        width: 50%;
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
  .block-selection {
    a {
        cursor: pointer;
    }
  }
  .red-message {
      color: red;
  }
  table.properties {
    .has-error {
        border: 1px solid red;
    }
  }
  fieldset  .validation-error {
    width: 100% !important;
    color: red;
    float: left !important;
  }

</style>

<style lang="less">
  div.block-style-tabs .nav-tabs > li > a {
    margin: 0 !important;
  }

  .styles-catalogue {
    li.tab {
      span.title {
        text-transform: capitalize;
      }
    }

    /*.block-style-fieldset {
      legend {
        text-transform: capitalize;
      }
    }*/
  }
  li.tab {
      &.disabled {
          display: none;
      }
  }
  section.tab-container {
    li.tab {
      display: block;
    }
  }

  .outline-0 {
    outline: 0;
  }

  .meta-edit-tabs.vue-tabs {
    height: 100%;

    .tab-content {
      height: 100%;
      margin-top: -44px;
      padding-top: 44px;
    }
  }

  .meta-edit-tabs.vue-tabs .disabled legend{
    font-size: 12px;
    font-style: normal;
    color: gray;
  }
  .meta-edit-tabs.vue-tabs .disabled span{
    font-size: 14px;
    font-style: normal;
  }
  .meta-edit-tabs.vue-tabs .disabled label{
    font-size: 14px;
    font-style: normal;
    min-height: 18px;
  }
  .meta-edit-tabs.vue-tabs .disabled i{
    font-size: 14px;
  }

  .meta-edit-tabs.vue-tabs i.fa-check-circle-o{
    color: #303030;
  }

  .meta-edit-tabs.vue-tabs .disabled i.fa-check-circle-o{
    /*color: #303030;*/
    font-size: 18px;
  }
  .meta-edit-tabs.vue-tabs .disabled i.fa-circle-o{
    font-size: 18px;
  }
  .meta-edit-tabs.vue-tabs .disabled i.fa-check-square-o{
    font-size: 18px;
  }
  .meta-edit-tabs.vue-tabs .disabled i.fa-square-o{
    font-size: 18px;
  }

  /*.author select * {
    padding: 5px;
    margin: 5px;
    font-size: 110%;
  } */

  .dropdown {
    position: relative;
    display: inline-block;
  }

  .dropdown-button {
    border: 1px solid #444;
    border-radius: 2px;
    padding: 4px;
    height: 30px
  }

  .dropdown-content {
    cursor: default;
    top: 30px;
    left:-59px;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 80px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    padding: 5px;
    z-index: 1;
    border: 1px solid #aaa;
  }

  .dropdown-content:hover {
    background: #1e90ff;
    color: #fff;
  }

  td.category-wrapper {
    position: relative;

    .ico-clear-filter {
      position: absolute;
      top: 6px;
      right: 29px;
    }
  }

  .tags-input {
    width: 100%;
  }

  .outside {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0px;
    left: 0px;
  }

  .block-style-tabs {
    .nav-tabs-wrapper {
      li:disabled, li[disabled="true"] {
        display: none;
      }
    }
    .tab-container {
      &:disabled, &[disabled="true"] {
        display: none;
      }
    }
  }

  ul.no-bullets {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  table.properties {
    tr.author-link {
      div.p-dropdown.p-component {
        span.p-dropdown-label.p-inputtext {
          padding-right: 0px;
          padding-left: 16px;
        }
      }
      div.p-dropdown-panel.p-component {
        margin-left: -40%;
      }
    }
  }

</style>
