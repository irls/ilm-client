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
    if (this.flags.length) this.flags.forEach ((flag, flagIdx)=>{
      if (flag.parts.length) flag.parts.forEach ((part)=>{
        let user_Id = superlogin.getSession().user_id;
        if (part.newComment.length) part.comments.push ({
          creator: user_Id,
          created_at: (new Date()).toJSON(),
          comment: part.newComment
        });
        part.newComment = '';
      })
      else this.flags.splice(flagIdx, 1);
    });
    return _.pick(this, defBlock);
  }

  genFlagId() {
    return _id(this._id + ':');
  }

  newFlag(range, type) {
    let _id = this.genFlagId();
    let _at = (new Date()).toJSON();
    let user_Id = superlogin.getSession().user_id;
    let flagPart = new FlagPart({
      creator: user_Id,
      created_at: _at,
      type: type,
      content: range.cloneContents().textContent,
      updated_at: _at
    })

    this.flags.push ({
      _id: _id,
      creator: user_Id,
      created_at: _at,
      parts: [flagPart]
    });

    //console.log('addFlag', JSON.stringify(this.flags));
    return _id;
  }

  addFlag(_id, range, type) {
    //console.log('addFlag', _id);
    this.flags.forEach((flag, flagIdx)=>{
      if (flag._id === _id) {
        let _at = (new Date()).toJSON();
        let user_Id = superlogin.getSession().user_id;
        let flagPart = new FlagPart({
          creator: user_Id,
          created_at: _at,
          type: type,
          content: range.cloneContents().textContent,
          updated_at: _at
        })
        flag.parts.push(flagPart);
        //console.log('addFlag', flagPart);
      }
    });
  }

  addPart(_id, content, type) {
    this.flags.forEach((flag, flagIdx)=>{
      if (flag._id === _id) {
        let _at = (new Date()).toJSON();
        let user_Id = superlogin.getSession().user_id;
        let flagPart = new FlagPart({
          creator: user_Id,
          created_at: _at,
          type: type,
          content: content,
          updated_at: _at
        })
        flag.parts.push(flagPart);
      }
    });
  }

  isNeedAlso(_id) {
    let checker = {};
    this.flags.forEach((flag)=>{
      if (flag._id === _id) flag.parts.forEach((part)=>{
        checker[part.type] = true;
      });
    });
    //console.log('isNeedAlso', _id, checker);
    if (Object.keys(checker).length > 1) return false;
    return true;
  }

  calcFlagStatus(_id) {
    let checker = {'open': 0, 'resolved': 0, 'hidden': 0};
    this.flags.forEach((flag)=>{
      if (flag._id === _id) flag.parts.forEach((part)=>{
        checker[part.status] += 1;
      });
    });
    //console.log('calcFlagStatus', checker);
    if (checker.open > 0) return 'open';
    if (checker.resolved > 0) return 'resolved';
    return 'hidden';
  }

  countArchParts(_id) {
    let count = 0;
    this.flags.forEach((flag)=>{
      if (flag._id === _id) flag.parts.forEach((part)=>{
        if (part.status == 'hidden') count++;
      });
    });
    return count;
  }

}

class FlagPart {
  constructor(init) {
    this.creator = init.creator;
    this.created_at = init.created_at;
    this.status = init.status || 'open';
    this.type = init.type;
    this.content = init.content;
    this.comments = init.comments || [];
    this.updated_at = init.updated_at;
    this.newComment = '';
    this.collapsed = false;
  }
}

export {
  BookBlock
}
