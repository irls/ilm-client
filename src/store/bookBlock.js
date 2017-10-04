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
  'type',
  'classes',
  'parnum',
  'audiosrc',
  'footnotes',
  'flags',
  '_deleted',
  'section',
  'illustration'
]

let BlockTypes = {
  title: {
    '': [],
    subtitle: [],
    author: [],
    translator: []
  },
  header: {
    align: ['', 'left', 'center', 'right']
  },
  subhead: {
    'table of contents': ['', 'toc1', 'toc2', 'toc3', 'toc4'],
    align: ['', 'left', 'center', 'right'],
    descriptor: ['', 'date', 'venue', 'subtitle']
  },
  par: {
    font: ['', 'typewriter', 'monospace', 'oldbook', 'modern'],
    size: ['', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large'],
    style: [' ', 'allcaps', 'smallcaps', 'italic', 'bold', 'underline', 'rulebelow', 'bookgraphic'],
    whitespace: ['', 'verse', 'pre'],
    padding: ['', 'nopad', 'nopad-top', 'nopad-bottom', 'extrapad', 'extrapad-top', 'extrapad-bottom'],
    author: ['', 'bab', 'baha', 'abd', 'shoghi', 'sacred', 'bible', 'muhammad', 'quran', 'jesus', 'ali', 'tradition', 'husayn'],
    custom: ['', 'dropcap', 'blockquote', 'sitalcent', 'editor-note', 'question', 'signature', 'reference', 'preamble', 'prayer']
  },
  illustration: {
    size: ['', 'x-small', 'small', 'large', 'x-large'],
    align: ['', 'left', 'center', 'right']
  },
  footnote: {
    '': [],
    fn: []
  },
  hr: {
    size: ['', 'small', 'large']
  }
}

class BookBlock {
  constructor(init) {

    this._id = init._id || '';
    this._rev = init._rev || '';
    this.bookid = init.bookid || '';
    this.index = typeof init.index !== 'undefined' ? init.index : '';

    this.tag = init.tag || '';
    this.content = init.content || '';
    this.type = init.type || '';
    this.classes = init.classes || {};
    if (Array.isArray(this.classes)) this.classes = {};
    this.parnum = init.parnum || false;

    this.audiosrc = init.audiosrc || '';
    this.footnotes = init.footnotes || [];
    this.flags = init.flags || [];

    this.deleted = init.deleted || false;
    this.section = typeof init.section !== 'undefined' ? init.section : false;
    this.illustration = init.illustration;
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
    if (this.audiosrc) {
      this.audiosrc = this.audiosrc.replace(process.env.ILM_API, '');
    }
    if (this.illustration) {
      this.illustration = this.illustration.replace(process.env.ILM_API, '');
      this.illustration = this.illustration.split('?').shift();
    }
    if (Array.isArray(this.classes) && this.classes.length) this.classes = this.classes[0];
    return _.pick(this, defBlock);
  }

  genFlagId(isBlockFlag = false) {
    if (isBlockFlag) return this._id;
    else return _id(this._id + ':');
  }

  newFlag(range, type, isBlockFlag = false) {
    let _id = this.genFlagId(isBlockFlag);
    let _at = (new Date()).toJSON();
    let userId = superlogin.getSession().user_id;
    let flagPart = new FlagPart({
      creator: userId,
      created_at: _at,
      type: type,
      content: (isBlockFlag ? false : range.cloneContents().textContent),
      updated_at: _at
    })

    this.flags.push ({
      _id: _id,
      creator: userId,
      created_at: _at,
      parts: [flagPart]
    });

    //console.log('addFlag', JSON.stringify(this.flags));
    return _id;
  }

  addFlag(_id, range, type) {
    this.flags.forEach((flag, flagIdx)=>{
      if (flag._id === _id) {
        let _at = (new Date()).toJSON();
        let userId = superlogin.getSession().user_id;
        let flagPart = new FlagPart({
          creator: userId,
          created_at: _at,
          type: type,
          content: range.cloneContents().textContent,
          updated_at: _at
        })
        flag.parts.push(flagPart);
      }
    });
  }

  delFlag(_id) {
    this.flags.forEach((flag, flagIdx)=>{
      if (flag._id === _id) {
        this.flags.splice(flagIdx,1);
      }
    });
  }

  addPart(_id, content, type) {
    this.flags.forEach((flag, flagIdx)=>{
      if (flag._id === _id) {
        let _at = (new Date()).toJSON();
        let userId = superlogin.getSession().user_id;
        let flagPart = new FlagPart({
          creator: userId,
          created_at: _at,
          type: type,
          content: content,
          updated_at: _at
        })
        flag.parts.push(flagPart);
      }
    });
  }

  mergeFlags(fromIdx) {

    let fromBlock = this.flags[fromIdx];
    let blockFlagIdx = this.flags.map(f => f._id).indexOf(this._id);

    if (blockFlagIdx < 0) {
      let _id = this.genFlagId(true);
      let _at = (new Date()).toJSON();
      let userId = superlogin.getSession().user_id;
      this.flags.push ({
        _id: _id,
        creator: userId,
        created_at: _at,
        parts: fromBlock.parts
      });
    } else {
      this.flags[blockFlagIdx].parts = this.flags[blockFlagIdx].parts.concat(fromBlock.parts);
    }

    this.flags.splice(fromIdx, 1);
  }

  isNeedAlso(_id) {
    let checker = {};
    this.flags.forEach((flag)=>{
      if (flag._id === _id) flag.parts.forEach((part)=>{
        checker[part.type] = true;
      });
    });
    if (Object.keys(checker).length > 1) return false;
    return true;
  }

  calcFlagStatus(_id) {
    let status = {'open': 0, 'resolved': 0, 'hidden': 0};
    this.flags.forEach((flag)=>{
      if (flag._id === _id) flag.parts.forEach((part)=>{
        status[part.status] += 1;
      });
    });
    if (status.open > 0) return 'open';
    if (status.resolved > 0) return 'resolved';
    return 'hidden';
  }

  calcFlagsSummary() {
    let status = {'open': 0, 'resolved': 0, 'hidden': 0};
    let direction = {'editor': 0, 'narrator': 0};
    if (this.flags && this.flags.length) {
      this.flags.forEach((flag)=>{
        if (flag.parts && flag.parts.length) {
          flag.parts.forEach((part)=>{
            status[part.status] += 1;
            if (part.status == 'open') direction[part.type] += 1;
          });
        }
      });
    }
    let flagsStatus = 'hidden';
    if (status.resolved > 0) flagsStatus = 'resolved';
    if (status.open > 0) flagsStatus = 'open';

    let flagsDirection = 'proofer';
    if (direction.narrator > 0) flagsDirection = 'narrator';
    if (direction.editor > 0) flagsDirection = 'editor';

    return {stat: flagsStatus, dir: flagsDirection}
  }

  countArchParts(_id) {
    let count = 0;
    this.flags.forEach((flag)=>{
      if (flag._id === _id) flag.parts.forEach((part)=>{
        if (part.status === 'hidden') count++;
      });
    });
    return count;
  }

  getIllustration() {
    if (this.illustration) {
      return process.env.ILM_API + this.illustration;
    }
  }

  needsText() {
    return ['hr', 'illustration'].indexOf(this.type) === -1;
  }

  hasAudio() {
    return (this.audiosrc && this.audiosrc.length);
  }

  getClass() {
    let result = this.type;
    if (this.classes && typeof this.classes === 'object') {
      for (let key in this.classes) {
        if (key) {
          if (this.classes[key] && this.classes[key] !== '') result += ' ' + /*key.replace(/\s/g, '-') + '-' +*/ this.classes[key];
          else if (Object.keys(BlockTypes[this.type])[0] === '') result += ' ' + key.replace(/\s/g, '-');
        }
      }
    }

    return result;
  }

  setClass(val) {
    let styleCurr = false;
    if (val) {

      if (Object.keys(BlockTypes[this.type])[0] === '') this.classes = {};

      if (!this.classes[val]) {
        this.classes[val] = ''
      } else {
        styleCurr = this.classes[val];
      }
    } else {
      if (val === '') this.classes = {};
    }
    return styleCurr;
  }

  setClassStyle(classVal, val) {
    if (typeof val !== 'undefined') this.classes[classVal] = val;
    if (val === '') delete this.classes[classVal];
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
  BookBlock,
  BlockTypes
}
