<template>
  <!-- <div class="genres"> -->
  <fieldset class="genres" v-if="isActive">
    <legend>Genre</legend>
    <div :class="['genres-list selected-genres', {'-has-error': requiredError}]">
      <span class="error-text" v-if="requiredError">Define Genres</span>
      <template v-for="bookGenre in bookGenres">
        <div class="genre-chip">
          <div>{{bookGenre}}<template v-if="canRemove(bookGenre)">&nbsp;<span class="remove-item" v-on:click="remove(bookGenre)">&times;</span></template></div>
        </div>
      </template>
      <div class="genres-options" v-if="adminOrLibrarian">
        <span class="auto-generate" v-on:click="generateGenres">Auto-generate</span>
        <span class="auto-generate-in-progress" v-if="autoGenerateInProgress"></span>
        <div :class="['toggle-genres-visible', {'-visible': genresVisible}]" v-on:click="toggleGenresVisible">
          <span>Genres</span><i class="arrow"></i></div>
      </div>
    </div>
    <template v-if="genresVisible">
      <div class="genres-list">
        <template v-for="genre in notAssignedGenres">
          <div class="genre-chip" v-on:click="selectGenre(genre.name)">
            <div>{{genre.name}}</div>
          </div>
        </template>
      </div>
    </template>
  </fieldset>
  <!-- </div> -->
</template>
<script>
  import { mapActions, mapGetters, mapMutations } from 'vuex';
  export default {
    data() {
      return {
        genresVisible: false
      }
    },
    components: {

    },
    props: ['allowMetadataEdit', 'requiredError'],
    computed: {
      ...mapGetters(['currentBookMeta', 'bookCategories', 'adminOrLibrarian', 'isBookReaderCategory']),
      ...mapGetters('genreModule', ['genres', 'notAssignedGenres', 'autoGenerateInProgress']),
      bookGenres: {
        get() {
          return this.currentBookMeta.genres ? this.currentBookMeta.genres : [];
        },
        cache: false
      },
      isActive: {
        get() {
          return this.isBookReaderCategory;
        },
        cache: false
      }
    },
    mounted() {
      this.loadGenres([this.currentBookMeta.bookid ? this.currentBookMeta.bookid : null]);
    },
    methods: {
      ...mapActions(['updateBookMeta']),
      ...mapActions('genreModule', ['loadGenres', 'autoGenerate']),
      ...mapMutations('genreModule', ['set_autoGenerateInProgress']),
      selectGenre(genre) {
        if (this.adminOrLibrarian && this.allowMetadataEdit) {
          let genres = this.currentBookMeta.genres || [];
          if (!genres.includes(genre) && genres.length < 3) {
            this.$emit('genresUpdate');
            genres.push(genre);
            return this.updateBookMeta({genres: genres, genres_manual: true});
          }
        }
      },
      toggleGenresVisible() {
        this.genresVisible = !this.genresVisible;
      },
      generateGenres() {
        if (!this.autoGenerateInProgress && this.allowMetadataEdit) {
          this.set_autoGenerateInProgress(true);
          this.$emit('genresUpdate');
          return this.autoGenerate()
            .then(response => {
              this.set_autoGenerateInProgress(false);
            })
            .catch(err => {
              this.set_autoGenerateInProgress(false);
            });
        }
      },
      remove(genre) {
        if (this.adminOrLibrarian && this.allowMetadataEdit) {
          let genres = this.currentBookMeta.genres || [];
          let present = genres.indexOf(genre);
          if (present !== -1) {
            genres.splice(present, 1);
            return this.updateBookMeta({genres: genres, genres_manual: true});
          }
        }
      },
      canRemove(genre) {
        return this.adminOrLibrarian;
      },
      getBookGenres(exclude_ids = []) {
        this.loadGenres([this.currentBookMeta.bookid, exclude_ids]);
      }
    },
    watch: {
      'currentBookMeta.bookid': {
        handler(val) {
          this.getBookGenres();
        }
      },
      'currentBookMeta.alt_meta.reader.category': {
        handler(val) {
          this.getBookGenres([val]);
        }
      },
      'currentBookMeta.genres_generating': {
        handler(val) {
          this.getBookGenres();
        }
      }
    }
  }
</script>
<style lang="less">
  fieldset.genres {
    border: 1px solid #b9b6b6;
    position: relative;
    margin-bottom: 10px;
    legend {
      padding: 2px 4px 0px 4px;
      margin-bottom: 4px;
      border: none;
      width: auto;
      font-size: 1.2rem;
    }
    .genres-list {
      border: 1px solid #f0f0f0;
      padding: 4px;
      margin: 5px 0px;
      &.-has-error {
        border: 1px solid red;
        .error-text {
          color: red;
          display: inline-block;
          margin: 4px 0px;
        }
      }
    }
    .genre-chip {
      display: inline-block;
      width: auto;
      background-color: #f0f0f0;
      padding: 4px 4px;
      border-radius: 4px;
      margin: 4px;
      cursor: pointer;
      user-select: none;
      .remove-item {
        font-size: 16px;
      }
    }
    .toggle-genres-visible {
      cursor: pointer;
      color: #337ab7;
      float: right;
      display: inline-block;
      user-select: none;
      span {
        display: inline-block;
        vertical-align: text-top;
        padding: 0px 4px;
      }
      i.arrow {
        border: solid #337ab7;
        border-width: 0 1px 1px 0;
        display: inline-block;
        padding: 3px;
        transform: rotate(-45deg);
        -webkit-transform: rotate(-45deg);
        margin: 0px 2px;
        vertical-align: middle;
      }
      &.-visible {
        i.arrow {
          transform: rotate(45deg);
          -webkit-transform: rotate(45deg);
        }
      }
    }
    .auto-generate {
      cursor: pointer;
      color: #337ab7;
    }
    .auto-generate-in-progress {
      background: url(/static/preloader-snake-transparent-tiny.gif);
      display: inline-block;
      width: 14px;
      height: 14px;
      vertical-align: text-top;
    }
  }
</style>
