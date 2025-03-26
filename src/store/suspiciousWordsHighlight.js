//import axios from 'axios';

let swhInstance;

const SUSPICIOUS_WORD_CLASS = 'suspicious-word';
const SUSPICIOUS_SILENCE_CLASS = "suspicious-silence";
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
    this.clearRegex = new RegExp(`(<[^>]+class=.*?)${SUSPICIOUS_WORD_CLASS|SUSPICIOUS_SILENCE_CLASS}`, 'img');
    this.checkRegex = new RegExp(`(<[^>]+class=.*?)${SUSPICIOUS_WORD_CLASS|SUSPICIOUS_SILENCE_CLASS}`, 'im');
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
    if (Array.isArray(block.audio_silences) && block.audio_silences.length > 0) {
      block.content = this.addSuspiciousSilenceHighlight(block.content, block.audio_silences);
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

  addSuspiciousSilenceHighlight(text, silences) {
    element.innerHTML = text;
    return this.addElementSuspiciousSilenceHighlight(element, silences).innerHTML;
  }
  
  addElementHighlight(el, silences = []) {
    if (this.suspiciousTextRegex.test(el.innerText)) {
      el.querySelectorAll('w').forEach(word => {
        if (word.innerText && this.suspiciousTextRegex.test(word.innerText)) {
          word.classList.add(SUSPICIOUS_WORD_CLASS);
        } else {
          let textSibling = this.getTextSibling(word);
          if (textSibling && this.suspiciousTextRegex.test(textSibling.nodeValue)) {
            word.classList.add(SUSPICIOUS_WORD_CLASS);
          }
        }
      });
      el.querySelectorAll('sup, i, b, u').forEach(word => {
        let textSibling = this.getTextSibling(word);
        if (textSibling && this.suspiciousTextRegex.test(textSibling.nodeValue)) {
          if (word.nodeName === 'SUP') {
            if (word.previousElementSibling) {
              word.previousElementSibling.classList.add(SUSPICIOUS_WORD_CLASS);
            }
          } else {
            let words = word.querySelectorAll('w');
            if (words.length > 0) {
              let wordEl = words[words.length - 1];
              wordEl.classList.add(SUSPICIOUS_WORD_CLASS);
            }
          }
        }
      });
    }
    if (Array.isArray(silences) && silences.length > 0) {
      this.addElementSuspiciousSilenceHighlight(el, silences);
    }
    return el;
  }

  addElementSuspiciousSilenceHighlight(el, silences) {
    el.querySelectorAll('w').forEach(wordEl => {
      //console.log(wordEl.dataset, silences);
      if (wordEl.dataset.map) {
        let map = wordEl.dataset.map.split(',');
        if (map && map.length === 2) {
          map[0] = parseInt(map[0]);
          map[1] = parseInt(map[1]) + map[0];
          let silence = silences.find(sl => {
            return (sl.start <= map[0] && sl.end >= map[0]) || (sl.start <= map[1] && sl.end >= map[1]) || (sl.start >= map[0] && sl.end <= map[1]);
          });
          if (silence) {
            wordEl.classList.add(SUSPICIOUS_SILENCE_CLASS);
          }
        }
      }
    });
    return el;
  }
  
  clearElementHighlight(el) {
    el.innerHTML = this.clearText(el.innerHTML);
    return el;
  }
  
  getTextSibling(el) {
    if (el.nextSibling && el.nextSibling.nodeType === 3) {
      return el.nextSibling;
    }
    return null;
  }
}

var getInstance = function() {
  if (!swhInstance) {
    swhInstance = new SuspiciousWordsHighlight();
  }
  return swhInstance;
}

module.exports = getInstance()