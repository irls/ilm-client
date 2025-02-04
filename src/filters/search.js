'use strict';

import { ArabicString } from "arabic-utils";

const bookFilterDelim = '/';

const prepareRegexpForArFaLetters = (str) => {
  const result = str // different letters - similar words look
    .replace(/(\u064A|\u06CC)+/ig, '[\u064A\u06CC]') // (1610; Arabic letter Ya | 1740; Arabic Letter Farsi Yeh)
    .replace(/(\u0643|\u06A9)+/ig, '[\u0643\u06A9]'); // (1603; Arabic letter Kaf | 1705; Arabic letter Keheh)
  return result;
};

const cleanDiacritics = (str) => {
  str = ArabicString(str).removeDiacritics();
  str = ArabicString(str).removeTatweel();
  str = ArabicString(str).normalizeAlef();
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
};

const punctuationRules = (char, isWithSpace = false) => {
  const replaceWithNone1 = /['`´’'ªº\s]/i;
  const replaceWithNone2 = /[….,:;\/\|\\=+\‑\–\-\—*~_#!¡?¿$%^&{}()„‟”“"‚‘‛«»‹›\[\]]/i;
  const replaceWithNone3 = /[\u300c\u300d\u300e\u300f\u301d\u301e\u301f\ufE41\ufE42\ufE43\ufE44\uff02\uff07\uff62\uff63]/i;
  let replaceWithSpace = {test: (char)=>false};
  if (isWithSpace) {
    replaceWithSpace = /[\s….,:;\/\|\\=+\‑\–\-\—*~_#!¡?¿$%^&{}()„‟”“"‚‘‛«»‹›\[\]]/i;
  }
  switch (true) {
    case replaceWithSpace.test(char):
        return ' ';
    case replaceWithNone1.test(char):
        return '';
    case replaceWithNone2.test(char):
        return '';
    case replaceWithNone3.test(char):
        return '';
    default:
        return char;
  }
};

const specialRules = (char) => {
  switch (char) {
    case 'æ':
        return 'ae';
    case 'å':
       return 'a';
    case 'œ':
        return 'oe';
    case 'ß':
        return 'ss';
    default:
        return char;
  }
};


const specialHTMLRules = [
    [new RegExp('&amp;', 'mig'), '&'],
    [new RegExp('&lt;', 'mig'), '<'],
    [new RegExp('&gt;', 'mig'), '>'],
    [new RegExp('&quot;', 'mig'), '"'],
    [new RegExp('&nbsp;', 'mig'), ' '],
    [new RegExp('&#[a-zA-Z0-9]{3,5};', 'mig'), '']
  ]

const replaceHTMLSpecials = (str) => {
  let result = str;
  specialHTMLRules.forEach((rule)=>{
    result = result.replace(rule[0], rule[1])
  });
  return result.trim();
};

const replaceSpecials = (str, isWithSpace = false) => {
  let result = '', i, l;
  str = str.toLocaleLowerCase();
  for (i = 0, l = str.length; i < l; i = i + 1) {
    result = result + punctuationRules(specialRules(str.charAt(i)), isWithSpace);
  }
  return result.trim(); //.replace(/\s\s+/g, ' ')
};

const replaceSuperscript = (str = '') => {
  return str.replace(/class=\"service-info\"/mig, '')
            .replace(/<sup\s+data-idx=\"[^\"]+\"[^>]*>.*?<\/sup>/mig, '')
            .replace(/<sup\s+data-pg=\"[^\"]+\"[^>]*>.*?<\/sup>/mig, '')
            .replace(/<sup>(\s){0,1}.*?(\s){0,1}<\/sup>/mig, '$1$2')
            .replace(/<sub>(\s){0,1}.*?(\s){0,1}<\/sub>/mig, '$1$2');
};

const replaceParsing = (str, isWithSpace = false) => {
  let result = '', i, l;

  str = replaceSuperscript(str)
  let strArray = str.split('</w>');

  strArray = strArray.reduce((acc, string)=>{
    const split = string.split(/(<w[^<>]*>)/i);
    if (split.length > 2) {
      acc.push([
        split[1],
        prepareForFilter(split[2].replace(/(<([^>]+)>)/gi, ''), isWithSpace).replace(/\s\s+/g, ' ')
      ])
    }
    return acc;
  }, []);

  //console.log(`strArray: `, strArray);
  return strArray;
};

const prepareForFilter = (str, isWithSpace = false) => {
  return cleanDiacritics(replaceSpecials(replaceHTMLSpecials(str), isWithSpace));
}

const splitPrepareForFilter = (str, isWithSpace = false) => {
  const strings = str.split(bookFilterDelim);
  return strings.map((string)=>cleanDiacritics(replaceSpecials(replaceHTMLSpecials(string), isWithSpace)));
}

const cleanFilter = (value) => {
  return cleanDiacritics(value.toLowerCase().trim().replace(/[….,:;\/\|\\=+\‑\–\-\—*~_#!¡?¿$%^&{}()„‟”“"‚‘‛«»‹›\[\]\'\’]/img, '').replace(/\s{2,}/img, ' '));
}

export {
  prepareRegexpForArFaLetters,
  prepareForFilter,
  cleanDiacritics,
  replaceSpecials,
  replaceParsing,
  replaceSuperscript,
  replaceHTMLSpecials,
  splitPrepareForFilter,
  cleanFilter
}
