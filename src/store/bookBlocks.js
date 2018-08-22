const _ = require('lodash');
const _id = require('uniqid');
import superlogin from 'superlogin-client';
import { BookBlock }    from './bookBlock';

class BookBlocks {
  constructor(init) {
    this.lookupList = {};
    this.blocksList = {};

    this.listIds = [];
    this.listIdsCache = {rid: false, listIds: []};
    this.listRIds = [];

    this.meta = {};

    this.startId = false;
    this.startRId = false;
    this.startRIdStore = window.localStorage.getItem("startRId") || false;
  }

  idsViewArray() {
    if (this.listIdsCache.rid === this.startRId && this.listIdsCache.listIds.length) {
      return this.listIdsCache.listIds;
    }
    if (this.startRId) {
      this.listIdsCache.rid = this.startRId;
      this.listIdsCache.listIds = [];
      let seqId = this.startRId;
      for (var i=0; i<=9; i++) {
        if (this.lookupList.hasOwnProperty(seqId)) {
          this.listIdsCache.listIds.push(this.lookupList[seqId].blockid);
          seqId = this.lookupList[seqId].out;
          if (seqId == this.meta.rid) return this.listIdsCache.listIds;
        }
      }
      window.localStorage.setItem("startRId", this.startRId);
    }
    return this.listIdsCache.listIds;
  }

  idsArray() {
    return this.listIds;
  }

  checkFirst() {
    let firstRId = this.getFirstRid();
    if (firstRId && this.lookupList[firstRId].loaded) return true;
    if (this.startRId && this.lookupList.hasOwnProperty(this.startRId)) {
      return this.lookupList[this.startRId].in == this.meta.rid;
    }
    return false;
  }

  checkLast() {
    let lastRId = this.getLastRid();
    if (lastRId && this.lookupList[lastRId].loaded) return true;
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
    let rid = this.getRIdById(blockId);
    if (rid) {
      return this.lookupList[rid].in == this.meta.rid;
    }
    return false;
  }

  isLast(blockId) {
    let rid = this.getRIdById(blockId);
    if (rid) {
      return this.lookupList[rid].out == this.meta.rid;
    }
    return false;
  }

  getInId(blockId) {
    let rid = this.getRIdById(blockId);
    if (rid && this.lookupList.hasOwnProperty(this.lookupList[rid].in)) {
      if (this.lookupList[rid].in == this.meta.rid) return false;
      return this.lookupList[this.lookupList[rid].in].blockid;
    }
    return false;
  }

  getOutId(blockId) {
    let rid = this.getRIdById(blockId);
    if (rid && this.lookupList.hasOwnProperty(this.lookupList[rid].out)) {
      if (this.lookupList[rid].out == this.meta.rid) return false;
      return this.lookupList[this.lookupList[rid].out].blockid;
    }
    return false;
  }

  setStartId(blockId) {
    if (this.startId && this.startId == blockId) return;
    this.startId = blockId;
    this.startRId = this.getRIdById(blockId);
  }

  setLookupsList(bookId, bookList) {
    this.lookupList = {};
    this.blocksList = {};
    this.listIds = [];
    this.listRIds = [];
    this.meta = bookList.meta;
    this.meta.rid = bookList.meta['@rid'];
    if (Array.isArray(bookList.blocks)) bookList.blocks.forEach((block)=>{
      this.listIds.push(block.blockid);
      this.listRIds.push(block.rid);
      block.in = block.in[0];
      block.out = block.out[0];
      block.loaded = false;
      block.checked = false;
      this.lookupList[block.rid] = block;
      //this.blocksList[block.blockid] = new BookBlock(block);
    })
  }

  appendLookupsList(bookId, bookList) {
    if (Array.isArray(bookList.blocks)) bookList.blocks.forEach((block)=>{
      this.listIds.push(block.blockid);
      this.listRIds.push(block.rid);
      block.in = block.in[0];
      block.out = block.out[0];
      block.loaded = false;
      block.checked = false;
      this.lookupList[block.rid] = block;
      //this.blocksList[block.blockid] = new BookBlock(block);
    })
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
    for (var key in this.lookupList) {
      if (this.lookupList[key].blockid == blockId) return this.lookupList[key];
    }
    return false;
  }

  setLoaded(blockId) {
    let blockRId = this.getRIdById(blockId);
    if (blockRId) this.lookupList[blockRId].loaded = true;
  }

  getPrevIds(blockId, count) {
    let resultArr = [];
    if (blockId) {
      let seqId = this.getRIdById(blockId);
      for (var i=0; i<=count-1; i++) {
        if (this.lookupList.hasOwnProperty(seqId)) {
          resultArr.push(this.lookupList[seqId].blockid);
          seqId = this.lookupList[seqId].in;
          if (seqId == this.meta.rid) return resultArr;
        }
      }
    }
    return resultArr;
  }

  getNextIds(blockId, count) {
    let resultArr = [];
    if (blockId) {
      let seqId = this.getRIdById(blockId);
      for (var i=0; i<=count-1; i++) {
        if (this.lookupList.hasOwnProperty(seqId)) {
          resultArr.push(this.lookupList[seqId].blockid);
          seqId = this.lookupList[seqId].out;
          if (seqId == this.meta.rid) return resultArr;
        }
      }
    }
    return resultArr;
  }

  delBlock(block) {
    block.rid = block['@rid'];
    block.in = block.in[0];
    block.out = block.out[0];
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
      delete this.lookupList[block.rid];
      this.listIdsCache.rid = false;
    }
    if (block.in == this.meta.rid) {
      return this.lookupList[block.out].blockid;
    }
//     if (block.out == this.meta.rid) {
//       return this.lookupList[block.in].blockid;
//     }
    return this.startId;
  }

  addBlock(block) {
    block.rid = block['@rid'];
    block.in = block.in[0];
    block.out = block.out[0];
    let listIdsIdx = false;
    let listRIdsIdx = false;

    if (this.lookupList.hasOwnProperty(block.in)) {
      this.lookupList[block.in].out = block.rid;
      listIdsIdx = this.listIds.indexOf(this.lookupList[block.in].blockid);
      listRIdsIdx = this.listRIds.indexOf(this.lookupList[block.in].rid);
      this.listIds.splice( listIdsIdx-1, 0, block.blockid );
      this.listRIds.splice( listRIdsIdx-1, 0, block.rid );
    }

    if (this.lookupList.hasOwnProperty(block.out)) {
      this.lookupList[block.out].in = block.rid;
      if (!listIdsIdx && !listRIdsIdx) {
        listIdsIdx = this.listIds.indexOf(this.lookupList[block.out].blockid);
        listRIdsIdx = this.listRIds.indexOf(this.lookupList[block.out].rid);
        this.listIds.splice( listIdsIdx, 0, block.blockid );
        this.listRIds.splice( listRIdsIdx, 0, block.rid );
      }
    }

    this.lookupList[block.rid] = block;
    this.listIdsCache.rid = false;
  }

}

export {
  BookBlocks
}
