let rangeUtils = {

  nextNode: function(node) {
      if (node.hasChildNodes()) {
          return node.firstChild;
      } else {
          while (node && !node.nextSibling) {
              node = node.parentNode;
          }
          if (!node) {
              return null;
          }
          return node.nextSibling;
      }
  },

  getRangeSelectedNodes: function(range) {
      var node = range.startContainer;
      var endNode = range.endContainer;

      // Special case for a range that is contained within a single node
      if (node == endNode) {
          return [node];
      }

      // Iterate nodes until we hit the end container
      var rangeNodes = [];
      while (node && node != endNode) {
          rangeNodes.push( node = this.nextNode(node) );
      }

      // Add partially selected nodes at the start of the range
      node = range.startContainer;
      while (node && node != range.commonAncestorContainer) {
          rangeNodes.unshift(node);
          node = node.parentNode;
      }

      return rangeNodes;
  },

  getSelectedNodes: function() {
      if (window.getSelection) {
          var sel = window.getSelection();
          if (!sel.isCollapsed) {
              return this.getRangeSelectedNodes(sel.getRangeAt(0));
          }
      }
      return [];
  },

  getSelectedTags: function() {
      if (window.getSelection) {
          var sel = window.getSelection();
          if (!sel.isCollapsed) {
              let result = [];
              this.getRangeSelectedNodes(sel.getRangeAt(0)).forEach((el)=>{
                if (el.nodeType === 1) result.push(el);
              })
              return result;
          }
      }
      return [];
  }

}

export {
  rangeUtils
}
