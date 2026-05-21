// Mock for remark-gfm
function remarkGfm() {
  return (tree) => tree;
}

module.exports = remarkGfm;
module.exports.default = remarkGfm;
