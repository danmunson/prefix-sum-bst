export interface TSumNode<T> {
    parent?: TSumNode<T>
    left?: TSumNode<T>
    right?: TSumNode<T>
    isLessThanParent?: boolean
    data: T
    value: number
    leftSum: number
    rightSum: number
    leftCount: number
    rightCount: number
}

export type SubtreeKey = keyof TSumNode<any> & 'left'|'right';
export type SubtreeSumKey = keyof TSumNode<any> & 'leftSum'|'rightSum';
export type SubtreeCountKey = keyof TSumNode<any> & 'leftCount'|'rightCount';

export type TraversalData<T> = {
    node: TSumNode<T>,
    inclusivePrefixSum: number,
    inclusivePrefixCount: number,
};

export interface ISumBSTBase<T> {
    root: TSumNode<T>|undefined

    haveSameId: (x: T, y: T) => boolean
    getOrdering: (x: T, y: T) => number
    getSummableValue: (x: T) => number
    insert: (x: T) => void
    delete: (x: T) => void

    findSupremum: (v: number) => TraversalData<T>|undefined
    findInfimum: (v: number) => TraversalData<T>|undefined
    findInclusivePrefixSumAtIndex: (i: number) => TraversalData<T>|undefined
    findInclusivePrefixSumByNode: (x: T) => TraversalData<T>|undefined
}