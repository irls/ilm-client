

const weightRange = [1, 10.99];
const difficultyRange = [1, 14.99];

class Collection {
  constructor(data) {
    this.version     = data.version || 1;
    this._id         = data._id || '';
    this.books       = data.books || {};
    this.state       = data.state || "";
    this.title       = data.title || "";
    this.language    = data.language || "en";
    this.description = data.description || "";
    this.createdAt   = data.createdAt || null;
    this.updatedAt   = data.updatedAt || null;
    this.id          = data.id || null;
    this.coverimg    = data.coverimg || null;
    this.bookids     = data.bookids || [];
    this.coverimgURL = data.coverimgURL || "";
    this.title_en    = data.title_en || '';
    this.subtitle    = data.subtitle || '';
    this.author      = Array.isArray(data.author) ? data.author : [];
    this.author_en   = data.author_en || '';
    this.category    = data.category || '';
    this.alt_meta    = data.alt_meta || { reader:{category: null}, ocean:{category: null}};
    this.slug        = data.slug || '';
    this.translator  = data.translator || '';
    this.difficulty  = data.difficulty || null;
    this.weight      = data.weight || null;
    this.slug_status = data.hasOwnProperty('slug_status') ? data.slug_status : 1;// 1 - auto, 0 - manual
    this.books_list  = data.books_list || [];
    this.pages       = data.pages || 0;

    /*if(typeof this.difficulty == 'number') {
      this.difficulty = this.difficulty.toFixed(2);
    }*/

    this.validationErrors = data.validationErrors || {
      difficulty: '',
      weight: ''
    };

    //-- Publication section -- { --//
    this.isInTheQueueOfPublication = data.isInTheQueueOfPublication || false;
    this.isPublished               = data.isPublished               || false;
    this.currVersion               = data.currVersion               || '';
    this.currVersionDate           = data.currVersionDate           || '';
    this.pubVersion                = data.pubVersion                || '0.0';
    this.pubVersionDate            = data.pubVersionDate            || '';
    this.pubBooksEntities          = data.pubBooksEntities          || [];
    this.pubBooksHistory           = data.pubBooksHistory           || [];
    //-- } -- end -- Publication section --//
  }

  sortBooks() {
    //console.log('SORTING', this._id, this.books_list.length);
    /*this.books_list.forEach(b => {
      if (!b.weight) {
        b.weight = 1;
      }
      if (!b.difficulty) {
        b.difficulty = 1;
      }
    })*/
    this.books_list = this.books_list.sort((a, b) => {
      return 1 * (b.weight || 1) - 1 * (a.weight || 1) || 1 * (b.difficulty || 1) - 1 * (a.difficulty || 1) || a.title.localeCompare(b.title);
      let weightDiff = 1 * a.weight - 1 * b.weight;
      if (weightDiff) {
        return -1;
      } else if (b.weight > a.weight) {
        return 1;
      } else {
        return a.title > b.title ? -1 : 1;
      }
    });
  }

  updateBook(book) {
    if (book && book.bookid) {
      let index = this.books_list.findIndex(b => {
        return b.bookid === book.bookid;
      });
      if (!index !== 0) {
        this.books_list[index] = book;
        this.sortBooks();
      }
    }
  }

  setValidateWeight(value) {
    let errorMessage = 'Allowed range ' + weightRange[0] + ' - ' + weightRange[1];
    this.weight = value;
    if (value && (!/^\d{1,2}([\.\,]\d{1,2})?$/.test(value) || value < weightRange[0] || value > weightRange[1])) {
      this.validationErrors['weight'] = errorMessage;
      return false;
    }
    return true;
  }

  setValidateDifficulty(value) {
    this.difficulty = value;
    if (!value || !/^\d{1,2}([\.\,]\d{1,2})?$/.test(value) || value < difficultyRange[0] || value > difficultyRange[1]) {
      this.validationErrors['difficulty'] = 'Allowed range ' + difficultyRange[0] + ' - ' + difficultyRange[1];
      return false;
    }
    return true;
  }
}

export { Collection }
