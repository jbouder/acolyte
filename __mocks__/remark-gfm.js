// Mock for remark-gfm
function remarkGfm() {
  return function (tree) {
    return tree;
  };
}

module.exports = remarkGfm;
module.exports.default = remarkGfm;
