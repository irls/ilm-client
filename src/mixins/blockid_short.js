const blockIdRgx = /.*(?:\-|\_){1}([a-zA-Z0-9]+)$/;
export default {
  data() {
    return {
      
    };
  },
  methods: {
    getIdShort(blockid) {
      if (blockid) {
        let _id_short = blockIdRgx.exec(blockid);
        _id_short = (_id_short && _id_short.length == 2) ? _id_short[1] : blockid;
        if (_id_short.length > 7) {
          _id_short = _id_short.substr(0, 4) + '...' + _id_short.substr(_id_short.length - 4, 4);
        }
        return _id_short;
      }
      return '';
    }
  }
}