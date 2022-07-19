# A Binary Search Tree for working with Prefix Sums
Given an ordered list numbers (or elements that can be mapped to numbers), the prefix sum at a given index is defined as the sum of numbers at or before that index.

This binary search tree provides methods that enable efficient computations (`O(log N)`) related to prefix sums. For example, `findSupremum` takes a value for a target prefix sum as an argument, and returns the nearest node that is at or above that value. `findInclusivePrefixSumByNode` enables you to find the prefix sum at the index of the node that was passed in as an argument.

## Notes
The `findInfimum` and `findSupremum` methods assume that the prefix sum over elements is monotonic. In other words, don't use those methods if the values being summed over can be both negative and positive. The `findInclusivePrefixSumAtIndex` and `findInclusivePrefixSumByNode` methods should work in any case.