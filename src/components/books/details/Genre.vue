<template>
  <!-- <div class="genres"> -->
  <fieldset class="genres" v-if="isActive">
    <legend>Genre</legend>
    <div class="genres-list">
      <template v-for="bookGenre in bookGenres">
        <div class="genre-chip">
          <div>{{bookGenre}}<template v-if="adminOrLibrarian">&nbsp;<span class="remove-item" v-on:click="remove(bookGenre)">&times;</span></template></div>
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
          <div class="genre-chip">
            <div v-on:click="selectGenre(genre.name)">{{genre.name}}</div>
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
    computed: {
      ...mapGetters(['currentBookMeta', 'bookCategories', 'adminOrLibrarian']),
      ...mapGetters('genreModule', ['genres', 'notAssignedGenres', 'autoGenerateInProgress']),
      bookGenres: {
        get() {
          return this.currentBookMeta.genres ? this.currentBookMeta.genres : [];
        },
        cache: false
      },
      isActive: {
        get() {
          if (this.currentBookMeta.alt_meta && this.currentBookMeta.alt_meta.reader && this.currentBookMeta.alt_meta.reader.category) {
            return true;
          }
          let categories = this.bookCategories.find(category => {
            return category.group === 'Reader';
          });
          return categories && categories.categories.includes(this.currentBookMeta.category);
        },
        cache: false
      }
    },
    mounted() {
      this.loadGenres();
    },
    methods: {
      ...mapActions(['updateBookMeta']),
      ...mapActions('genreModule', ['loadGenres', 'autoGenerate']),
      ...mapMutations('genreModule', ['set_autoGenerateInProgress']),
      selectGenre(genre) {
        if (this.adminOrLibrarian) {
          let genres = this.currentBookMeta.genres || [];
          if (!genres.includes(genre) && genres.length < 3) {
            genres.push(genre);
            return this.updateBookMeta({genres: genres, genres_manual: true});
          }
        }
      },
      toggleGenresVisible() {
        this.genresVisible = !this.genresVisible;
      },
      generateGenres() {
        if (!this.autoGenerateInProgress) {
          this.set_autoGenerateInProgress(true);
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
        if (this.adminOrLibrarian) {
          let genres = this.currentBookMeta.genres || [];
          let present = genres.indexOf(genre);
          if (present !== -1) {
            genres.splice(present, 1);
            return this.updateBookMeta({genres: genres, genres_manual: true});
          }
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
      font-size: 12px;
      margin-bottom: 4px;
    }
    .genres-list {
      border: 1px solid #f0f0f0;
      padding: 4px;
      margin: 5px 0px;
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