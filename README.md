

## Notes
The `findInfimum` and `findSupremum` methods assume that the prefix sum over elements is monotonic. In other words, don't use those methods if the values being summed over can be both negative and positive. The `findInclusivePrefixSumAtIndex` and `findInclusivePrefixSumByNode` methods should work in any case.