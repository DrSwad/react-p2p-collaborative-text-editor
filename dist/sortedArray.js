"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _sortedCmpArray = _interopRequireDefault(require("sorted-cmp-array"));
// Extending SortedArray functionality from 'sorted-cmp-array'.
// Adding a 'get' method for retrieving elements.
class SortedArray extends _sortedCmpArray.default {
  get(idx) {
    return this.arr[idx];
  }
}
var _default = exports.default = SortedArray;