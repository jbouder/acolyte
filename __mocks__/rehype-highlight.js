// Mock for rehype-highlight
function rehypeHighlight() {
  return function (tree) {
    return tree;
  };
}

module.exports = rehypeHighlight;
module.exports.default = rehypeHighlight;
