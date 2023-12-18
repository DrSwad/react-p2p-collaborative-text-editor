import sorted from 'sorted-cmp-array';

// Extending SortedArray functionality from 'sorted-cmp-array'.
// Adding a 'get' method for retrieving elements.
class SortedArray extends sorted {
  get(idx) {
    return this.arr[idx];
  }
}

export default SortedArray;
