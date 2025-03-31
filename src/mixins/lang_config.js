//import axios from 'axios'
import API_CONFIG  from './api_config.js'
//import access from './access.js';

//console.log('1', data());
//console.log('1', API_CONFIG.data().API_URL);

function getLanguages(){
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  let filePath = API_CONFIG.data().API_URL + 'settings/languages';
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
    result = JSON.parse(result);
  }
  return result;
}

let Languages = getLanguages();

export {
  Languages
}
