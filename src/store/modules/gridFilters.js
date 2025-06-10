import {
  prepareForFilter,
  cleanDiacritics,
  splitPrepareForFilter,
  prepareRegexpForArFaLetters
}  from '@src/filters/search.js';
import { Languages }       from "@src/mixins/lang_config.js"

export default {
  namespaced: true,
  state: {
    fltrChangeTrigger: false,

    booksFilters: {
      filter: '',
      secFilter: '',
      multiProjectTag: [],
      importStatus: [],
      language: [],
      jobStatus: ['active'],
      booksIds: [],
    },
    defaultBooksFilters: {
      filter: '',
      secFilter: '',
      importStatus: [],
      multiProjectTag: [],
      language: [],
      jobStatus: ['active'],
      booksIds: [],
    },
    collectionsFilters: {
      filter: '',
      booksIds: [],
      multiProjectTag: [],
      jobStatus: ['active']
    },
    defaultCollectionsFilters: {
      filter: '',
      booksIds: [],
      multiProjectTag: [],
      jobStatus: ['active']
    },

    multiBookFilters: {
      language: [],
      jobStatus: [{caption: 'Active', value: 'active'}],
      importStatus: [],
      multiProjectTag: []
    },

    mapFilterJobStatus: [
      {caption: 'Active',    value: 'active'},
      {caption: 'Archived',  value: 'archived'},
      {caption: 'Completed', value: 'completed'},
      {caption: 'Suspended', value: 'suspended'}
    ],

    mapFilterImportStatus: [
      {caption: 'No content',   value: 'staging_empty'},
      {caption: 'Text Cleanup', value: 'staging'},
      {caption: 'Narration',    value: 'narrating'},
      {caption: 'Proofreading', value: 'proofing'},
      {caption: 'Mastering',    value: 'mastering'},
      {caption: 'Done',         value: 'completed'}
    ],

    mapFilterProjectTag: [
      {caption: 'Reader',  value: 'Reader'},
      {caption: 'Ocean',   value: 'Ocean'},
      {caption: 'ST',      value: 'ST'},
      {caption: 'OOL',     value: 'OOL'},
      {caption: 'Testing', value: 'Testing'},
      {caption: 'Traning', value: 'Traning'},
    ],
  },
  getters: {
    fltrChangeTrigger:           state => state.fltrChangeTrigger,
    booksFilters:                state => state.booksFilters,
    collectionsFilters:          state => state.collectionsFilters,
    multiBookFilters:            state => state.multiBookFilters,

    mapFilterProjectTag:         state => state.mapFilterProjectTag,

    mapFilterJobStatus: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) {
        return [];//state.mapFilterJobStatus;
      }
      const availableJobStatuses = new Set();
      rootGetters.allBooks.forEach((book)=>{
        availableJobStatuses.add(book.job_status);
      });
      if (false) {
        state.mapFilterJobStatus.forEach((el)=>{
          availableJobStatuses.add(el.value);
        });
      }
      if (state.booksFilters.jobStatus.length) {
        state.booksFilters.jobStatus = state.booksFilters.jobStatus.filter((code)=>availableJobStatuses.has(code));
      }
      if (state.multiBookFilters.jobStatus.length) {
        state.multiBookFilters.jobStatus = state.multiBookFilters.jobStatus.filter((obj)=>availableJobStatuses.has(obj.value));
      }
      return Array.from(availableJobStatuses).map((code)=>{
        const captionFound = state.mapFilterJobStatus.find((el)=>el.value === code);
        return {caption: (captionFound ? captionFound.caption : code), value: code}
      });
    },

    mapFilterImportStatus: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) {
        return [];//state.mapFilterImportStatus;
      }
      const availableImportStatuses = new Set();
      rootGetters.allBooks.forEach((book)=>{
        availableImportStatuses.add(book.importStatus);
      });
      if (false) {
        state.mapFilterImportStatus.forEach((el)=>{
          availableImportStatuses.add(el.value);
        });
      }
      if (state.booksFilters.importStatus.length) {
        state.booksFilters.importStatus = state.booksFilters.importStatus.filter((code)=>availableImportStatuses.has(code));
      }
      if (state.multiBookFilters.importStatus.length) {
        state.multiBookFilters.importStatus = state.multiBookFilters.importStatus.filter((obj)=>availableImportStatuses.has(obj.value));
      }
      return Array.from(availableImportStatuses).map((code)=>{
        const captionFound = state.mapFilterImportStatus.find((el)=>el.value === code);
        return {caption: (captionFound ? captionFound.caption : code), value: code}
      });
    },

    mapFilterLanguages: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) {
        return [];//Object.entries(Languages).map(([code, name])=>({caption: name, value: code}));
      }
      const availableLanguages = new Set();
      rootGetters.allBooks.forEach((book)=>{
        availableLanguages.add(book.language);
      });
      rootGetters.bookCollections.forEach((book)=>{
        availableLanguages.add(book.language);
      });
      if (state.booksFilters.language.length) {
        state.booksFilters.language = state.booksFilters.language.filter((lang)=>availableLanguages.has(lang));
      }
      if (state.multiBookFilters.language.length) {
        state.multiBookFilters.language = state.multiBookFilters.language.filter((obj)=>availableLanguages.has(obj.value));
      }
      return Array.from(availableLanguages).map((code)=>({caption: Languages[code] ? Languages[code] : code, value: code}));
    },

    filteredBooksCounter: (state, getters) => {
      return getters.filteredBooks.length;
    },
    filteredCollectionsCounter: (state, getters) => {
      return getters.filteredCollections.length;
    },
    filteredCollectionBooksCounter: (state, getters) => {
      return getters.filteredCollectionBooks.length;
    },

    filteredBooks: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.allBooks.length) return [];
      const filteredbooks = rootGetters.allBooks
        .filter(book => (state.booksFilters.language.length == 0 || (state.booksFilters.language).indexOf(book.language) >= 0))
        .filter(book => (state.booksFilters.importStatus.length == 0 || (state.booksFilters.importStatus).indexOf(book.importStatus) >= 0))
        .filter(book => (state.booksFilters.jobStatus.length == 0 || (state.booksFilters.jobStatus).indexOf(book.job_status) >= 0))
        .filter(book => {
          const bookAuthors = Array.isArray(book.author_link) ? book.author_link.filter(author => {
            return author.name || author.name_en;
          }).reduce((authors, author) => {
            if (author.name) {
              authors.push(author.name);
            }
            if (author.name_en) {
              authors.push(author.name_en);
            }
            return authors;
          }, []).join('|') : '';
          const bookCategories = Object.keys(book.alt_meta).reduce((acc, key)=>{
            if (book.alt_meta[key].category && book.alt_meta[key].category.length) {
              acc.push(book.alt_meta[key].category);
            }
            return acc;
          }, []);
          const strParts = [
            book.title, book.subtitle, book.slug,
            bookAuthors, book.bookid, ...bookCategories,
            //book.hashTags, book.executors.editor._id,
            //book.executors.editor.name, book.executors.editor.title
            //book.description
          ];
          const str = prepareForFilter(strParts.join(' '));
          const find = splitPrepareForFilter(state.booksFilters.filter);
          return find.every((fString)=>{
            const prepareWord = prepareRegexpForArFaLetters(fString);
            const wordRedExp = new RegExp(prepareWord);
            return wordRedExp.test(str);
          });
        })
        .filter(book => {
         const str = prepareForFilter(`${book.hashTags} ${book.executors.editor._id} ${book.executors.editor.name} ${book.executors.editor.title} ${book.filter_tags}`);
         const find = splitPrepareForFilter(state.booksFilters.secFilter);
         return find.every((fString)=>str.indexOf(fString) >= 0);
        })
        /*.filter(book => { [Vue warn]: You may have an infinite update loop in a component render function.
          if (state.collectionsFilters.filter.length > 0) {
            if (state.booksFilters.booksIds.length > 0) {
              return state.booksFilters.booksIds.indexOf(book.bookid) >= 0;
            }
            return false;
          }
          return true;
        })*/

      //state.collectionsFilters.booksIds = filteredbooks.map((book)=>book.bookid);
      return filteredbooks;
    },

    filteredCollections: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.bookCollections.length) return [];
      const filteredCollections = rootGetters.bookCollections
            .filter(coll => (state.booksFilters.language.length == 0 || (state.booksFilters.language).indexOf(coll.language) >= 0))
            .filter(coll => {
              const collAuthors = Array.isArray(coll.author_link) ? coll.author_link.filter(author => {
                return author.name || author.name_en;
              }).reduce((authors, author) => {
                if (author.name) {
                  authors.push(author.name);
                }
                if (author.name_en) {
                  authors.push(author.name_en);
                }
                return authors;
              }, []).join('|') : '';
              const collCategories = Object.keys(coll.alt_meta).reduce((acc, key)=>{
                if (coll.alt_meta[key].category && coll.alt_meta[key].category.length) {
                  acc.push(coll.alt_meta[key].category);
                }
                return acc;
              }, []);
              const strParts = [
                coll.title, coll.subtitle, coll.slug,
                collAuthors, ...collCategories, coll._id
              ];
              const str = prepareForFilter(strParts.join(' '));
              const find = splitPrepareForFilter(state.collectionsFilters.filter);
              return find.every((fString)=>{
                const prepareWord = prepareRegexpForArFaLetters(fString);
                const wordRedExp = new RegExp(prepareWord);
                return wordRedExp.test(str);
              });
            })
            /*.filter(coll => { [Vue warn]: You may have an infinite update loop in a component render function.
              if (state.booksFilters.filter.length > 0) {
                if (state.collectionsFilters.booksIds.length > 0) {
                  if (coll.bookids.length > 0) {
                    const intersection = state.collectionsFilters.booksIds.filter(b => coll.bookids.includes(b));
                    return intersection.length > 0;
                  }
                  return false;
                }
                return false;
              }
              return true;
            })*/
      //state.booksFilters.booksIds = filteredCollections.reduce((acc, coll)=>[...acc, ...coll.bookids], []);
      return filteredCollections;
    },

    filteredCollectionBooks: (state, getters, rootState, rootGetters) => {
      if (!rootGetters.currentCollection._id) return [];
      const filteredbooks = rootGetters.currentCollection.books_list
        .filter(book => (state.booksFilters.language.length == 0 || (state.booksFilters.language).indexOf(book.language) >= 0))
        .filter(book => (state.booksFilters.importStatus.length == 0 || (state.booksFilters.importStatus).indexOf(book.importStatus) >= 0))
        .filter(book => (state.booksFilters.jobStatus.length == 0 || (state.booksFilters.jobStatus).indexOf(book.job_status) >= 0))
        .filter(book => {
          const bookAuthors = Array.isArray(book.author_link) ? book.author_link.filter(author => {
            return author.name || author.name_en;
          }).reduce((authors, author) => {
            if (author.name) {
              authors.push(author.name);
            }
            if (author.name_en) {
              authors.push(author.name_en);
            }
            return authors;
          }, []).join('|') : '';
          const bookCategories = Object.keys(book.alt_meta).reduce((acc, key)=>{
            if (book.alt_meta[key].category && book.alt_meta[key].category.length) {
              acc.push(book.alt_meta[key].category);
            }
            return acc;
          }, []);
          const strParts = [
            book.title, book.subtitle, book.slug,
            bookAuthors, book.bookid, ...bookCategories,
            //book.hashTags, book.executors.editor._id,
            //book.executors.editor.name, book.executors.editor.title
            //book.description
          ];
          const str = prepareForFilter(strParts.join(' '));
          const find = splitPrepareForFilter(state.booksFilters.filter);
          return find.every((fString)=>{
            const prepareWord = prepareRegexpForArFaLetters(fString);
            const wordRedExp = new RegExp(prepareWord);
            return wordRedExp.test(str);
          });
        })
        .filter(book => {
          const str = prepareForFilter(`${book.hashTags} ${book.executors.editor._id} ${book.executors.editor.name} ${book.executors.editor.title}`);
          const find = splitPrepareForFilter(state.booksFilters.secFilter);
          return find.every((fString)=>{
            const prepareWord = prepareRegexpForArFaLetters(fString);
            const wordRedExp = new RegExp(prepareWord);
            return wordRedExp.test(str);
          });
        })
      return filteredbooks;
    }
  },
  mutations: {
    set_multiBookFilters(state, payload) {
      state.multiBookFilters = payload;
    },

    set_booksFilters (state, obj) { // replace any property of bookFilters
      for (const prop in obj) {
        if (['filter', 'secFilter', 'multiProjectTag', 'importStatus', 'language', 'jobStatus'].indexOf(prop) > -1) {
          state.booksFilters[prop] = obj[prop];
        }
      }
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_clearBookFilters (state) {
      state.booksFilters = Object.assign({}, state.defaultBooksFilters);
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_collectionsFilters (state, obj) {
      for (const prop in obj) {
        if (['filter', 'multiProjectTag', 'booksIds'].indexOf(prop) > -1) {
          state.collectionsFilters[prop] = obj[prop];
        }
      }
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_clearCollectionsFilters (state) {
      state.collectionsFilters = Object.assign({}, state.defaultCollectionsFilters);
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },

    set_fltrChangeTrigger (state) {
      state.fltrChangeTrigger = !state.fltrChangeTrigger;
    },
  },

  actions: {}
}
