import { PrefixSumBSTBase } from "./PrefixSumBSTBase";
import {
    TSumNode,
    ISumBSTBase,
    SubtreeKey,
    SubtreeSumKey,
    SubtreeCountKey,
    TraversalData
} from './types';

export type RBNode<T> = TSumNode<T> & {isRed: boolean};

export class PrefixSumRBTree<T> extends PrefixSumBSTBase<T> {
    public root!: RBNode<T>;
    
    public insert(x: T): RBNode<T> {
        // perform normal insert operation
        const insertNode = super.insert(x) as RBNode<T>;
        // fix up the tree
        this._fixRBTree(insertNode);
        this.root!.isRed = false;
        return insertNode;
    }

    protected _fixRBTree(node: RBNode<T>): void {
        
    }

    protected _newNode(data: T): RBNode<T> {
        // new nodes are always colored red
        return {...super._newNode(data), isRed: true};
    }
}

