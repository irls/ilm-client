const TRANSLATE_NUMERATION = {
  'ar': {
    0: "٠",
    1: "١",
    2: "٢",
    3: "٣",
    4: "٤",
    5: "٥",
    6: "٦",
    7: "٧",
    8: "٨",
    9: "٩"
  },
  'fa': {
    0: "۰",
    1: "۱",
    2: "۲",
    3: "۳",
    4: "۴",
    5: "۵",
    6: "۶",
    7: "۷",
    8: "۸",
    9: "۹"
  }
}

const translateNumber = (num = 1, lang = 'en') => {
  if (TRANSLATE_NUMERATION[lang]) {
    const translateNumLang = TRANSLATE_NUMERATION[lang];
    let numArr = ('' + num).split('');
    numArr = numArr.map((n)=>{
      if (translateNumLang[n]) {
        return translateNumLang[n];
      }
      return n;
    });
    return numArr.join('');
  }
  return '' + num;
}

const translateContentParts = (content, lang = 'en') => {
  if (content.length && lang !== 'en') {
    const ftnRegExp = new RegExp(`(<sup data-idx=\"[^"]*\">)(<w id="[^"]*" data-sugg=\"\">)*([^<>]*)(<\/w>)*(<\/sup>)`, 'mig');
    content = content.replace(ftnRegExp, (match, $1, $2, $3, $4, $5)=>{
      return `${$1}${$2 ? $2 : ''}${translateNumber($3, lang)}${$4 ? $4 : ''}${$5}`
    });
  }
  return content;
}

export default {
  translateNumber,
  translateContentParts
}
