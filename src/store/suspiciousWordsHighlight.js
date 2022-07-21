//import axios from 'axios';

const SUSPICIOUS_WORD_CLASS = 'suspicious-word';
let element = document.createElement('span');

class SuspiciousWordsHighlight {
  constructor () {
    this.suspiciousWordsCharacters = [];
    this.suspiciousTextRegex = new RegExp(`[]`, 'im');
  }
  
  setSuspiciousWordsCharacters(suspiciousWordsCharacters) {
    this.suspiciousWordsCharacters = suspiciousWordsCharacters;
    let suspiciousCharacters = this.suspiciousWordsCharacters.join(`\\`);
    if (suspiciousCharacters.length > 0) {
      suspiciousCharacters = `\\${suspiciousCharacters}`;
    }
    this.suspiciousTextRegex = new RegExp(`[${suspiciousCharacters}]`, 'im');
    this.clearRegex = new RegExp(`(<[^>]+class=.*?)${SUSPICIOUS_WORD_CLASS}`, 'img');
    this.checkRegex = new RegExp(`(<[^>]+class=.*?)${SUSPICIOUS_WORD_CLASS}`, 'im');
  }
  
  getSuspiciousTextRegex() {
    return this.suspiciousTextRegex;
  }
  
  clearSuspiciousHighlight(block) {
    if (block.content) {
      block.content = this.clearText(block.content);
    }
    if (block.parts) {
      block.parts.forEach(p => {
        p.content = this.clearText(p.content);
      });
    }
    if (block.footnotes) {
      block.footnotes.forEach(ftn => {
        ftn.content = this.clearText(ftn.content);
      });
    }
    if (block.description) {
      block.description = this.clearText(block.description);
    }
    return block;
  }
  
  clearText(text) {
    if (this.checkRegex.test(text)) {
      text = text.replace(this.clearRegex, '$1').replace(/ class=\"\"/img, '');
    }
    return text;
  }
  
  setSuspiciousHighlight(block) {
    if (block.content) {
      block.content = this.addHighlight(block.content);
    }
    if (Array.isArray(block.parts)) {
      block.parts.forEach(blk => {
        blk.content = this.addHighlight(blk.content);
      });
    }
    if (Array.isArray(block.footnotes)) {
      block.footnotes.forEach((footnote, ftnIdx) => {
        footnote.content = this.addHighlight(footnote.content);
      });
    }
    if (block.description) {
      block.description = this.addHighlight(block.description);
    }
    return block;
  }
  
  getSuspiciousWordClass() {
    return SUSPICIOUS_WORD_CLASS;
  }
  
  addHighlight (text) {
    element.innerHTML = text;
    return this.addElementHighlight(element).innerHTML;
  }
  
  addElementHighlight(el) {
    if (this.suspiciousTextRegex.test(el.innerText)) {
      el.querySelectorAll('w').forEach(word => {
        if (word.innerText && this.suspiciousTextRegex.test(word.innerText)) {
          word.classList.add(SUSPICIOUS_WORD_CLASS);
        } else if (word.nextSibling && word.nextSibling.nodeType === 3 && this.suspiciousTextRegex.test(word.nextSibling.nodeValue)) {
          word.classList.add(SUSPICIOUS_WORD_CLASS);
        }
      });
    }
    return el;
  }
  
  clearElementHighlight(el) {
    el.innerHTML = this.clearText(el.innerHTML);
    return el;
  }
}

export {
  SuspiciousWordsHighlight
}