'use strict';

const cleanDiacritics = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
};

const punctuationRules = (char) => {
  const replaceWithNone1 = /['`´’'ªº]/i; //\s
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

const replaceSpecials = (str) => {
  let result = '', i, l;
  str = str.toLocaleLowerCase();
  for (i = 0, l = str.length; i < l; i = i + 1) {
    result = result + punctuationRules(specialRules(str.charAt(i)));
  }
  return result.trim(); //.replace(/\s\s+/g, ' ')
};

const replaceParsing = (str) => {
  let result = '', i, l;

  let strArray = str.split('</w>');

  strArray = strArray.reduce((acc, string)=>{
    const split = string.split(/(<w[^<>]+>)/i);
    if (split.length > 2) {
      acc.push([
        split[1],
        prepareForFilter(split[2].replace(/(<([^>]+)>)/gi, '')).replace(/\s\s+/g, ' ')
      ])
    }
    return acc;
  }, []);

  //console.log(`strArray: `, strArray);
  return strArray;
};

const prepareForFilter = (str) => {
  return cleanDiacritics(replaceSpecials(str));
}

export { prepareForFilter, cleanDiacritics, replaceSpecials, replaceParsing }
