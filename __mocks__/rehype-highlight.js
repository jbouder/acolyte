// Mock for rehype-highlight
function rehypeHighlight() {
  return (tree) => tree;
}

module.exports = rehypeHighlight;
module.exports.default = rehypeHighlight;
