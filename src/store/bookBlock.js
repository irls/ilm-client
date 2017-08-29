const _ = require('lodash');
const _id = require('uniqid');
import superlogin from 'superlogin-client';

let defBlock = [
  '_id',
  '_rev',
  'bookid',
  'index',
  'tag',
  'content',
  'classes',
  'type',
  'parnum',
  'audiosrc',
  'footnotes',
  'flags'
]

class BookBlock {
  constructor(init) {

    this._id = init._id || '';
    this._rev = init._rev || '';
    this.bookid = init.bookid || '';
    this.index = init.index || '';

    this.tag = init.tag || '';
    this.content = init.content || '';
    this.classes = init.classes || [];
    this.type = init.type || '';
    this.parnum = init.parnum || false;

    this.audiosrc = init.audiosrc || '';
    this.footnotes = init.footnotes || [];
    this.flags = init.flags || [];

    this.deleted = init.deleted || false;
  }

  clean() {
    if (this.flags.length) this.flags.forEach ((flag)=>{
      if (flag.parts.length) flag.parts.forEach ((part)=>{
        let user_Id = superlogin.getSession().user_id;
        if (part.newComment.length) part.comments.push ({
          creator: user_Id,
          created_at: (new Date()).toJSON(),
          comment: part.newComment
        });
        part.newComment = '';
      });
    });
    return _.pick(this, defBlock);
  }

  genFlagId() {
    return _id(this._id + ':');
  }

  addFlag(range, type) {
    let _id = this.genFlagId();
    let _at = (new Date()).toJSON();
    let user_Id = superlogin.getSession().user_id;
    let flagPart = {
      creator: user_Id,
      created_at: _at,
      status: 'open',
      type: type,
      content: range.cloneContents().textContent,
      comments: [],
      updated_at: _at,
      newComment: ''
    }

    this.flags.push ({
      _id: _id,
      creator: user_Id,
      created_at: _at,
      parts: [flagPart]
    });

    //console.log('addFlag', JSON.stringify(this.flags));
    return _id;
  }
}

export {
  BookBlock
}
