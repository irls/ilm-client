'use strict';

const cleanDiacritics = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
};

const punctuationRules = (char) => {
  const replaceWithNone1 = /['`´’'ªº\s]/i;
  const replaceWithNone2 = /[.,:;\/\|\\=+\-*~_#!¡?¿$%^&{}()„‟"‚‘‛«»‹›]/i;
  const replaceWithNone3 = /[\u300c\u300d\u300e\u300f\u301d\u301e\u301f\ufE41\ufE42\ufE43\ufE44\uff02\uff07\uff62\uff63]/i;
//  const replaceWithSpace = /[]/i;
  switch (true) {
    case replaceWithNone1.test(char):
        return '';
    case replaceWithNone2.test(char):
        return '';
    case replaceWithNone3.test(char):
        return '';
//     case replaceWithSpace.test(char):
//         return ' ';
    default:
        return char;
  }
};

const specialRules = (char) => {
  switch (char) {
    case 'æ': case 'ä':
        return 'ae';
    case 'å':
        return 'aa';
    case 'œ': case 'ö':
        return 'oe';
    case 'ü':
        return 'ue';
    case 'ß':
        return 'ss';
    default:
        return char;
  }
};

const replaceSpecials = (str) => {
  let result = '', i, l;
  str = str.toLocaleLowerCase();
  for (i = 0, l = str.length; i < l; i = i + 1) {
    result = result + punctuationRules(specialRules(str.charAt(i)));
  }
  return result.trim(); //.replace(/\s\s+/g, ' ')
};

const prepareForFilter = (str) => {
  return cleanDiacritics(replaceSpecials(str));
}

export { prepareForFilter, cleanDiacritics, replaceSpecials }
