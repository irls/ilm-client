
const _ = require('lodash');
const _id = require('uniqid');
import superlogin from 'superlogin-client';
import { BookBlock }    from './bookBlock';

class LookupBlock {
  constructor(block) {
    this.rid = block.rid;
    this.blockid = block.blockid;
    this.in = block.in[0];
    this.out = block.out[0];
    this.type = block.type || 'par';
    this.status = block.status || {};
    this.secnum   = block.secnum   || '';
    this.parnum   = block.parnum   || '';
    this.isNumber = block.isNumber || false;
    this.isManual = block.isManual || false;
    this.isHidden = block.isHidden  || false;
    this.index = block.hasOwnProperty('index') ? block.index : -1;
    this.checked = false;
  }
}

class BookBlocks {
  constructor(init) {
    this.lookupList = {};
    this.blocksList = {};

    this.listIds = [];
    this.listIdsCache = {rid: false, list: []};
    this.listRIds = [];
    this.listObjs = [];

    this.meta = {};

    this.startId = false;
    this.startRId = false;
    this.startRIdStore = window.localStorage.getItem("startRId") || false;
    this.bookid = null;
  }

  idsViewArray(length = 10, beforeCount = 0) {
    if (this.listRIds.length == 0) return [];
    if (this.listIdsCache.rid === this.startRId && this.listIdsCache.list.length) {
      return this.listIdsCache.list;
    }
    if (this.startRId) {
      this.listIdsCache.rid = this.startRId;
      this.listIdsCache.list = [];
      let forwardSeqId = this.startRId;
      let backSeqId = this.lookupList[this.startRId].in;
      for (var i=0; i<=(beforeCount-1); i++) {
        if (this.lookupList.hasOwnProperty(backSeqId) && backSeqId !== this.meta.rid) {
          this.listIdsCache.list.unshift({blockRid: backSeqId, blockId: this.lookupList[backSeqId].blockid});
          backSeqId = this.lookupList[backSeqId].in;
        }
      }
      for (var i=0; i<=(length-1); i++) {
        if (this.lookupList.hasOwnProperty(forwardSeqId)) {
          this.listIdsCache.list.push({blockRid: forwardSeqId, blockId: this.lookupList[forwardSeqId].blockid});
          forwardSeqId = this.lookupList[forwardSeqId].out;
          if (forwardSeqId == this.meta.rid) return this.listIdsCache.list;
        }
      }
    }
    return this.listIdsCache.list;
  }

  idsViewBeforeArray(beforeCount = 0) {
    let result = [];
    if (this.startRId) {
      let backSeqId = this.lookupList[this.startRId].in;
      for (var i=0; i<=(beforeCount-1); i++) {
        if (this.lookupList.hasOwnProperty(backSeqId) && backSeqId !== this.meta.rid) {
          result.unshift({blockRid: backSeqId, blockId: this.lookupList[backSeqId].blockid});
          backSeqId = this.lookupList[backSeqId].in;
        }
      }
    }
    return result
  }

  idsArray() {
    return this.listIds;
  }

  rIdsArray() {
    return this.listRIds;
  }

  idsArrayRange(startId, endId) {
    let startIdx, endIdx;
    if (startId.charAt(0) == '#') { // Orient RID
      startIdx = this.listRIds.indexOf(startId)
    } else {
      startIdx = this.listIds.indexOf(startId)
    }
    if (endId.charAt(0) == '#') { // Orient RID
      endIdx = this.listRIds.indexOf(endId)
    } else {
      endIdx = this.listIds.indexOf(endId)
    }
    return this.listIds.slice(startIdx, endIdx+1);
  }

  ridsArrayRange(startId, endId) {
    let startIdx, endIdx;
    if (startId.charAt(0) == '#') { // Orient RID
      startIdx = this.listRIds.indexOf(startId)
    } else {
      startIdx = this.listIds.indexOf(startId)
    }
    if (endId.charAt(0) == '#') { // Orient RID
      endIdx = this.listRIds.indexOf(endId)
    } else {
      endIdx = this.listIds.indexOf(endId)
    }
    return this.listRIds.slice(startIdx, endIdx+1);
  }

  checkFirst() {
    let firstRId = this.getFirstRid();
    if (firstRId) return true;
    if (this.startRId && this.lookupList.hasOwnProperty(this.startRId)) {
      return this.lookupList[this.startRId].in == this.meta.rid;
    }
    return false;
  }

  checkLast() {
    let lastRId = this.getLastRid();
    if (lastRId) return true;
    if (this.startRId) {
      let idsViewArray = this.idsViewArray();
      let rid = this.getRIdById(idsViewArray[idsViewArray.length-1]);
      if (this.lookupList.hasOwnProperty(rid)) {
        return this.lookupList[rid].out == this.meta.rid;
      }
    }
    return false;
  }

  isFirst(blockId) {
    let rid;
    if (blockId.charAt(0) == '#') { // Orient RID
      rid = blockId;
    } else {
      rid = this.getRIdById(blockId);
    }
    if (rid) {
      return this.lookupList[rid].in == this.meta.rid;
    }
    return false;
  }

  isLast(blockId) {
    let rid;
    if (blockId.charAt(0) == '#') { // Orient RID
      rid = blockId;
    } else {
      rid = this.getRIdById(blockId);
    }
    if (rid) {
      return this.lookupList[rid].out == this.meta.rid;
    }
    return false;
  }

  getInId(blockId) {
    if (blockId && blockId.length) {
      let rid;
      if (blockId.charAt(0) == '#') { // Orient RID
        rid = blockId;
      } else {
        rid = this.getRIdById(blockId);
      }
      if (rid && this.lookupList.hasOwnProperty(this.lookupList[rid].in)) {
        if (this.lookupList[rid].in == this.meta.rid) return false;
        return this.lookupList[this.lookupList[rid].in].blockid;
      }
    }
    return false;
  }

  getOutId(blockId) {
    if (blockId && blockId.length) {
      let rid;
      if (blockId.charAt(0) == '#') { // Orient RID
        rid = blockId;
      } else {
        rid = this.getRIdById(blockId);
      }
      if (rid && this.lookupList.hasOwnProperty(this.lookupList[rid].out)) {
        if (this.lookupList[rid].out == this.meta.rid) return false;
        return this.lookupList[this.lookupList[rid].out].blockid;
      }
    }
    return false;
  }

  setStartId(blockId) {
    if (!blockId) return false;
    if (this.startId && this.startId == blockId) return false;

    if (blockId.charAt(0) == '#') { // Orient RID
      this.startId = this.lookupList[blockId].blockid;
      this.startRId = blockId;
    } else {
      this.startId = blockId;
      this.startRId = this.getRIdById(blockId);
    }
    this.listIdsCache.rid = false;
    return true;
  }

  cleanLookupsList(bookId) {
    if (bookId !== this.meta.bookid) {
      this.lookupList = {};
      this.blocksList = {};
      this.listIds = [];
      this.listRIds = [];
      return true;
    }
    return false
  }

  setLookupsList(bookId, bookList) {
    //console.log('setLookupsList', bookList);
    this.lookupList = {};
    this.blocksList = {};
    this.listIds = [];
    this.listRIds = [];
    this.listObjs = [];
    if (bookList.meta && bookList.meta['@rid'] && bookList.blocks && bookList.blocks.length) {
      this.meta = bookList.meta;
      this.meta.rid = bookList.meta['@rid'];
      if (Array.isArray(bookList.blocks)) {
        bookList.blocks.forEach((block)=>{
          this.listIds.push(block.blockid);
          this.listRIds.push(block.rid);
          this.listObjs.push({
            blockRid: block.rid, blockId: block.blockid,
            visible: false, blockView: {}
          });
          this.lookupList[block.rid] = new LookupBlock(block);
          //this.blocksList[block.blockid] = new BookBlock(block);
        })
        this.setStartId(bookList.blocks[0].rid)
      }
    }
  }

  appendLookupsList(bookId, bookList) {
//     console.log('appendLookupsList');
    if (Array.isArray(bookList.blocks)) bookList.blocks.forEach((block)=>{
      if (!this.lookupList[block.rid]) {
        this.listIds.push(block.blockid);
        this.listRIds.push(block.rid);
        this.listObjs.push({
          blockRid: block.rid, blockId: block.blockid,
          visible: false, blockView: {}
        });
        this.lookupList[block.rid] = new LookupBlock(block);
        //this.blocksList[block.blockid] = new BookBlock(block);
      }
    })
  }

  updateLookupsList(bookId, bookList) {
//     console.log('appendLookupsList');
    let listIds = [];
    let listRIds = [];
    let listObjs = [];
    if (Array.isArray(bookList.blocks)) bookList.blocks.forEach((block, blockIdx)=>{
      listIds.push(block.blockid);
      listRIds.push(block.rid);
      listObjs.push({
        blockRid: block.rid,
        blockId: block.blockid,
        //loaded: (this.listObjs[blockIdx] ? this.listObjs[blockIdx].loaded : false),
        visible: (this.listObjs[blockIdx] ? this.listObjs[blockIdx].visible : false)/*,
        blockView: (this.listObjs[blockIdx] ? this.listObjs[blockIdx].blockView : {})
        height: (this.listObjs[blockIdx] ? this.listObjs[blockIdx].height : 0),
        */
      });
      if (!this.lookupList[block.rid]) {
        this.lookupList[block.rid] = new LookupBlock(block);
        //this.blocksList[block.blockid] = new BookBlock(block);
      }
    })
    this.listIds = listIds;
    this.listRIds = listRIds;
    this.listObjs = listObjs;
  }

  getFirstRid(){
    if (this.lookupList[this.listRIds[0]] && this.lookupList[this.listRIds[0]].in == this.meta.rid) {
      return this.lookupList[this.listRIds[0]].rid;
    }
    for (var key in this.lookupList) {
      if (this.lookupList[key].in == this.meta.rid) return this.lookupList[key].rid;
    }
    return false;
  }

  getLastRid(){
    let lastRid = this.listRIds[this.listRIds.length-1];
    if (this.lookupList[lastRid] && this.lookupList[lastRid].out == this.meta.rid) {
      return this.lookupList[lastRid].rid;
    }
    for (var key in this.lookupList) {
      if (this.lookupList[key].out == this.meta.rid) return this.lookupList[key].rid;
    }
    return false;
  }

  getRIdById(blockId){
    for (var key in this.lookupList) {
      if (this.lookupList[key].blockid == blockId) return this.lookupList[key].rid;
    }
    return false;
  }

  getBlock(blockId){
    let idIdx = this.listIds.indexOf(blockId);
    if (idIdx > -1) {
      let rid = this.listRIds[idIdx];
      if (rid) return this.lookupList[rid];
    }
    for (var key in this.lookupList) {
      if (this.lookupList[key].blockid == blockId) return this.lookupList[key];
    }
    return false;
  }

  getBlockByRid(iRId){
    if (this.lookupList.hasOwnProperty(iRId)) {
      return this.lookupList[iRId];
    }
    return false;
  }

  get(blockId){
    if (blockId) {
      let rid;
      if (blockId.charAt(0) == '#') { // Orient RID
        rid = blockId;
      } else {
        rid = this.getRIdById(blockId);
      }
      if (rid && this.lookupList.hasOwnProperty(rid)) {
        return this.lookupList[rid];
      }
    }
    return false;
  }

  has(blockId){
    if (blockId && blockId.charAt) {
      let rid;
      if (blockId.charAt(0) == '#') { // Orient RID
        rid = blockId;
      } else {
        rid = this.getRIdById(blockId);
      }
      if (rid && this.lookupList.hasOwnProperty(rid)) {
        return true;
      }
    }
    console.log('has not', blockId);
    return false;
  }

  getBlockByIdx(listIdx){
    let rId = this.listRIds[listIdx];
    return this.lookupList[rId];
  }

  updBlockByRid(iRId, data){
    if (this.lookupList.hasOwnProperty(iRId)) {
      let block = this.lookupList[iRId];
      if (!data.in) delete data.in;
      if (!data.out) delete data.out;
      if (data.in) {
        if (Array.isArray(data.in)) {
          data.in = data.in[0];
        }
      }
      if (data.out) {
        if (Array.isArray(data.out)) {
          data.out = data.out[0];
        }
      }
      if (typeof data.isHidden == 'undefined') delete data.isHidden;
      if (typeof data.isNumber == 'undefined') delete data.isNumber;
      this.lookupList[iRId] = Object.assign(block, data);
      //console.log('updBlockByRid', iRId, data, this.lookupList[iRId]);
      return true;
    }
    return false;
  }

  setVisible(blockId, val = true) {
    let rid;
    if (blockId.charAt(0) == '#') { // Orient RID
      rid = blockId;
    } else {
      rid = this.getRIdById(blockId);
    }
    if (rid) {
      this.lookupList[rid].visible = val;
      this.listObjs.forEach((listObj)=>{
        if (listObj.blockRid === rid) listObj.visible = true;
      })
    }
    //console.log('setVisible', rid, this.lookupList[rid].visible);
  }
  setCheckedAsyncIterator(i,endIdx,resolveCb,$store ) {
    let iterationCount = 0;
    let iterationMax = 10;
    let max = endIdx+1;

    let name = 'SelectionModalProgressIterations';
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
      let c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) {
        iterationMax = parseInt(c.substring(nameEQ.length,c.length));
      }
    }


    if (i <= endIdx ) {
      while (i <= endIdx && iterationCount<iterationMax ) {
        let iRId = this.listRIds[i];
        if (this.lookupList.hasOwnProperty(iRId)) {
          this.lookupList[iRId].checked = true;
        }
        i++;
        iterationCount++;
      }
      let width = Math.ceil(i/(max/100));
      width = 0+25*(width/100);
      $store.dispatch('setSelectionModalProgressWidth',width)
      console.log(`setCheckedAsyncIterator ${i}`)
      let this_ = this;
      setTimeout( function() { this_.setCheckedAsyncIterator(i, endIdx,resolveCb,$store) },100);
    }else{
      resolveCb();
    }

  }

  async setCheckedAsync(startRId, endRId = false,$store) {

    // $store.dispatch('setSelectionModalProgressWidth')
    let renderTime = 1000;

    return new Promise((resolve, reject) => {
      console.log('ILM-5021-0')
      // return resolve;
      let promises = []

      let result = {start: {}, end: {}};
      if (endRId && startRId !== endRId) {

        let startIdx = this.listRIds.indexOf(startRId);
        let endIdx = this.listRIds.indexOf(endRId);
        if (startIdx < endIdx) {
          renderTime = 3000;
          promises.push(new Promise((resolve, reject) => {
            this.setCheckedAsyncIterator(startIdx,endIdx, resolve, $store);
            result.start = { _id: this.lookupList[startRId].blockid };
            result.end = { _id: this.lookupList[endRId].blockid };
          }))

        }

        if (startIdx > endIdx) {
          renderTime = 1000;
          promises.push(new Promise((resolve, reject) => {
            let max = startIdx+1;
            for (var i=endIdx; i<=startIdx; i++) {
              let iRId = this.listRIds[i];
              if (this.lookupList.hasOwnProperty(iRId)) {
                this.lookupList[iRId].checked = true;
              }
              let width = Math.round(i/(max/100));

              $store.dispatch('setSelectionModalProgressWidth',width)
              console.log(`setCheckedAsync inner iteratoin ${i}`)

            }
            result.start = { _id: this.lookupList[endRId].blockid };
            result.end = { _id: this.lookupList[startRId].blockid };

            resolve();
          }));

        }

      }
      else if (this.lookupList.hasOwnProperty(startRId)) {
        this.lookupList[startRId].checked = true;
        result.start = { _id: this.lookupList[startRId].blockid };
        result.end = { _id: this.lookupList[startRId].blockid };
      }

      return Promise.all(promises).then(function() {
        resolve(result)
      });

    })

  }

  setChecked(startRId, endRId = false) {
    let result = {start: {}, end: {}};
    if (endRId && startRId !== endRId) {
      let startIdx = this.listRIds.indexOf(startRId);
      let endIdx = this.listRIds.indexOf(endRId);
      if (startIdx < endIdx) {
        for (var i=startIdx; i<=endIdx; i++) {
          console.log();
          let iRId = this.listRIds[i];
          if (this.lookupList.hasOwnProperty(iRId)) {
            this.lookupList[iRId].checked = true;
          }
        }
        result.start = { _id: this.lookupList[startRId].blockid };
        result.end = { _id: this.lookupList[endRId].blockid };
      }
      if (startIdx > endIdx) {
        for (var i=endIdx; i<=startIdx; i++) {
          let iRId = this.listRIds[i];
          if (this.lookupList.hasOwnProperty(iRId)) {
            this.lookupList[iRId].checked = true;
          }
        }
        result.start = { _id: this.lookupList[endRId].blockid };
        result.end = { _id: this.lookupList[startRId].blockid };
      }
    }
    else if (this.lookupList.hasOwnProperty(startRId)) {
      this.lookupList[startRId].checked = true;
      result.start = { _id: this.lookupList[startRId].blockid };
      result.end = { _id: this.lookupList[startRId].blockid };
    }
    return result;
  }

  setUnCheckedRange() {
    for (var key in this.lookupList) {
      this.lookupList[key].checked = false;
    };
  }

  getPrevIds(blockId, count) {
    //console.log('getPrevIds', blockId, count);
    let resultArr = [];
    if (!blockId || blockId === true) return resultArr;
    if (blockId) {
      let seqRid;
      if (blockId.charAt(0) == '#') { // Orient RID
        seqRid = blockId;
      } else {
        seqRid = this.getRIdById(blockId);
      }
      if (seqRid && this.lookupList.hasOwnProperty(seqRid)) {
        seqRid = this.lookupList[seqRid].in;
        if (seqRid == this.meta.rid) return resultArr;
      }
      if (seqRid) for (var i=0; i<=count-1; i++) {
        if (this.lookupList.hasOwnProperty(seqRid)) {
          resultArr.push(this.lookupList[seqRid].blockid);
          seqRid = this.lookupList[seqRid].in;
          if (seqRid == this.meta.rid) return resultArr;
        }
      }
    }
    return resultArr;
  }

  getNextIds(blockId, count) {
    //console.log('getNextIds', blockId, count);
    let resultArr = [];
    if (!blockId || blockId === true) return resultArr;
    if (blockId) {
      let seqRid;
      if (blockId.charAt(0) == '#') { // Orient RID
        seqRid = blockId;
      } else {
        seqRid = this.getRIdById(blockId);
      }
      if (seqRid && this.lookupList.hasOwnProperty(seqRid)) {
        seqRid = this.lookupList[seqRid].out;
        if (seqRid == this.meta.rid) return resultArr;
      }
      if (seqRid) for (var i=0; i<=count-1; i++) {
        if (this.lookupList.hasOwnProperty(seqRid)) {
          resultArr.push(this.lookupList[seqRid].blockid);
          seqRid = this.lookupList[seqRid].out;
          if (seqRid == this.meta.rid) return resultArr;
        }
      }
    }
    return resultArr;
  }

  delBlock(block) {
    block.rid = block.rid || block['@rid'];
    block.in = block.in || block.in[0];
    block.out = block.out || block.out[0];
    if (this.lookupList.hasOwnProperty(block.rid)) {
      let listIdsIdx = this.listIds.indexOf(block.blockid);
      let listRIdsIdx = this.listRIds.indexOf(block.rid);
      if (this.lookupList.hasOwnProperty(block.in)) {
        this.lookupList[block.in].out = block.out;
      }
      if (this.lookupList.hasOwnProperty(block.out)) {
        this.lookupList[block.out].in = block.in;
      }
      this.listIds.splice(listIdsIdx, 1);
      this.listRIds.splice(listRIdsIdx, 1);
      this.listObjs.splice(listRIdsIdx, 1);
      delete this.lookupList[block.rid];
      this.listIdsCache.rid = false;
    }
    if (block.in == this.meta.rid) {
      return this.lookupList[block.out].blockid;
    }
//     if (block.out == this.meta.rid) {
//       return this.lookupList[block.in].blockid;
//     }
    if (this.startId !== block.blockid) {
      return this.startId;
    } else {
      if (this.lookupList.hasOwnProperty(block.out)) {
        return this.lookupList[block.out].blockid;
      }
      if (this.lookupList.hasOwnProperty(block.in)) {
        return this.lookupList[block.in].blockid;
      }
    }
    return this.startId;
  }

  delExistsBlock(rid) {
    if (this.lookupList.hasOwnProperty(rid)) {
      //console.log('delExistsBlock', this.lookupList[rid]);
      let block = this.lookupList[rid];
      this.delBlock(block);
    }
  }

  addBlock(block) {
    block.rid = block['@rid'];
    block.in = Array.isArray(block.in) ? block.in[0] : block.in;
    block.out = Array.isArray(block.out) ? block.out[0] : block.out;
    delete block['@type'];
    let listIdsIdx = -1;
    let listRIdsIdx = -1;

    this.lookupList[block.rid] = block;

    if (this.lookupList.hasOwnProperty(block.in)) {
      this.lookupList[block.in].out = block.rid;
      listIdsIdx = this.listIds.indexOf(this.lookupList[block.in].blockid);
      listRIdsIdx = this.listRIds.indexOf(this.lookupList[block.in].rid);
      this.listIds.splice( listIdsIdx+1, 0, block.blockid );
      this.listRIds.splice( listRIdsIdx+1, 0, block.rid );
      this.listObjs.splice( listRIdsIdx+1, 0, {blockRid: block.rid, blockId: block.blockid} );
    }

    if (this.lookupList.hasOwnProperty(block.out)) {
      this.lookupList[block.out].in = block.rid;
      if (listIdsIdx == -1 && listRIdsIdx == -1) {
        listIdsIdx = this.listIds.indexOf(this.lookupList[block.out].blockid);
        listRIdsIdx = this.listRIds.indexOf(this.lookupList[block.out].rid);
        this.listIds.splice( listIdsIdx, 0, block.blockid );
        this.listRIds.splice( listRIdsIdx, 0, block.rid );
        this.listObjs.splice( listRIdsIdx, 0, {blockRid: block.rid, blockId: block.blockid} );
      }
    }
    this.listIdsCache.rid = false;
  }

  refresh() {
    let tmp = this.listObjs;
    this.listObjs = [];
    this.listObjs = tmp;
  }

  compareIndex(fromRid, toRid) {
    let from = this.listRIds.indexOf(fromRid);
    let to = this.listRIds.indexOf(toRid);
    if (typeof from !== 'undefined' && typeof to !== 'undefined') {
      return from > to ? 1 : -1;
    } else {
      return 0;
    }
  }
  getBlocksInRange(startId, endId) {
    let crossId = startId;
    let list = [];
    do {
      let block = this.lookupList[this.getRIdById(crossId)];
      if (block) {
        list.push(block.blockid);
        crossId = this.getOutId(block.blockid);
        if (block.blockid === endId) {
          crossId = false;
        }
      } else {
        crossId = false;
      };
    } while (crossId);
    return list;
  }

}

export {
  BookBlocks
}
