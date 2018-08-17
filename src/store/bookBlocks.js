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

  isFirst() {
    if (this.startRId) {
      return this.lookupList[this.startRId].in == this.meta.rid;
    }
    return false;
  }

  isLast() {
    if (this.startRId) {
      let idsViewArray = this.idsViewArray();
      let rid = this.getRIdById(idsViewArray[idsViewArray.length-1]);
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
       //console.log('setLookupsList2', this.lookupList);
  }

  getRIdById(blockId){
    let result = false;
    for (var key in this.lookupList) {
      if (this.lookupList[key].blockid == blockId) result = this.lookupList[key].rid;
    }
    return result;
  }
}

export {
  BookBlocks
}
