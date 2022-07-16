import { loggableSubtreeString } from '../test/utils';
import {TSumNode, ISumBSTBase, SubtreeKey, SubtreeSumKey, SubtreeCountKey, TraversalData} from './types';

export class PrefixSumBSTBase<T> implements ISumBSTBase<T> {
    public root: TSumNode<T>|undefined = undefined;

    constructor(
        public haveSameId: (x: T, y: T) => boolean,
        public getSummableValue: (x: T) => number,
        public getOrdering: (x: T, y: T) => number,
    ) {}

    public insert(x: T) {
        const insertNode = this._newNode(x);

        if (this.root === undefined) {
            this.root = insertNode;
            return;
        }

        let currentNode: TSumNode<T>|undefined = this.root;
        let trailingNode: TSumNode<T>;
        let isLessThan: boolean;
        do {
            /**
             * On insert the new node will not end up with any children, so
             * it's only necessary to increment the left/right sums of the nodes
             * that it passes on its way down.
             */
            trailingNode = currentNode;
            isLessThan = this.getOrdering(insertNode.data, currentNode.data) < 0;
            if (isLessThan) {
                // insertNode < currentNode, so add to the value of currentNode.leftSum
                currentNode.leftSum += insertNode.value;
                currentNode.leftCount += 1;
                currentNode = currentNode.left;
            } else {
                // insertNode >= currentNode, so add to the value of currentNode.rightSum
                currentNode.rightSum += insertNode.value;
                currentNode.rightCount += 1;
                currentNode = currentNode.right;
            }

        } while (currentNode !== undefined);

        if (isLessThan) trailingNode.left = insertNode;
        else trailingNode.right = insertNode;
        insertNode.parent = trailingNode;
        insertNode.isLessThanParent = isLessThan;
    }

    public delete(deletionData: T) {
        if (this.root === undefined) return false;

        let found = false;
        let currentNode: TSumNode<T>|undefined = this.root;
        let isLessThan: boolean;
        do {
            if (this.haveSameId(deletionData, currentNode.data)) {
                found = true;
                break;
            }
            isLessThan = this.getOrdering(deletionData, currentNode.data) < 0;
            if (isLessThan) {
                currentNode = currentNode.left;
            } else {
                currentNode = currentNode.right;
            }
        } while (currentNode !== undefined);

        if (found && currentNode) {
            this._replaceDeletedNode(currentNode);
        }
        
        return found;
    }

    /*
    Find the lowest node with an inclusive cumulative sum that is greater than or equal to the argument.
    */
    public findSupremum(targetPrefixSum: number): TraversalData<T>|undefined {
        const {lastGreater} = this._findNearestToCumulativeValue(targetPrefixSum, 'sum');
        return lastGreater;
    }

    /*
    Find the greatest node with an inclusive cumulative sum that is less than or equal to the argument.
    */
    public findInfimum(targetPrefixSum: number): TraversalData<T>|undefined {
        const {lastLesser} = this._findNearestToCumulativeValue(targetPrefixSum, 'sum');
        return lastLesser;
    }

    /*
    Find the inclusive cumulative sum of the all elements at or below the index provided
    */
    public findInclusivePrefixSumAtIndex(targetIndex: number): TraversalData<T>|undefined {
        if (!this.root || this.root.leftCount + this.root.rightCount + 1 <= targetIndex) {
            // target index does not exist
            return undefined;
        }
        // targetIndex + 1, since index is 0-based
        const {lastLesser} = this._findNearestToCumulativeValue(targetIndex + 1, 'count');
        // since indexes will be an exact match, lastLesser and lastGreater are equal
        return lastLesser;
    }

    /*
    Find the cumulative values at a particular node
    */
    public findInclusivePrefixSumByNode(data: T): TraversalData<T>|undefined {
        return this._getCumulativeValuesByExactMatch(data);
    }

    protected _rotateUp(node: TSumNode<T>) {
        if (!node.parent) return;

        const parent = node.parent;
        const [rotationDirection, parentTargetSubtreeKey]: [SubtreeKey, SubtreeKey] = (
            node.isLessThanParent ? ['right', 'left'] : ['left', 'right']
        );
        const parentTargetSubtreeSumKey = this._sumKey(parentTargetSubtreeKey);
        const parentTargetSubtreeCountKey = this._countKey(parentTargetSubtreeKey);

        const nodeTargetSubtreeKey = rotationDirection;
        const nodeTargetSubtreeSumKey = this._sumKey(nodeTargetSubtreeKey);
        const nodeTargetSubtreeCountKey = this._countKey(nodeTargetSubtreeKey);

        // temp vars
        const nodeTargetSubtree = node[nodeTargetSubtreeKey];
        const grandparentRef = parent.parent;
        const isLessThanGrandparent = parent.isLessThanParent;
        const grandparentSubtreeKey: SubtreeKey = isLessThanGrandparent ? 'left' : 'right';
        const nodeTargetSubtreeSum = node[this._sumKey(nodeTargetSubtreeKey)];
        const nodeTargetSubtreeCount = node[this._countKey(nodeTargetSubtreeKey)];
        
        // rotate
        parent[parentTargetSubtreeKey] = nodeTargetSubtree;
        if (nodeTargetSubtree) {
            nodeTargetSubtree.parent = parent;
            nodeTargetSubtree.isLessThanParent = rotationDirection === 'right';
        }

        parent.parent = node;
        parent.isLessThanParent = rotationDirection !== 'right';
        node[nodeTargetSubtreeKey] = parent; // node is now the new parent
        node.parent = grandparentRef;
        node.isLessThanParent = isLessThanGrandparent;
        if (grandparentRef) {
            grandparentRef[grandparentSubtreeKey] = node;
        } else {
            // no grandparent, so node is the new root
            this.root = node;
        }

        // update naming
        const newParent = node;
        const formerParent = parent;

        // the new "targetSubtree" of the former parent was assigned to it directly
        // so the same happens with corresponding sums
        formerParent[parentTargetSubtreeSumKey] = nodeTargetSubtreeSum;
        formerParent[parentTargetSubtreeCountKey] = nodeTargetSubtreeCount;

        // the formerParent's sums are now correct, so we can compute newParent's subtree values directly
        newParent[nodeTargetSubtreeSumKey] = formerParent.value + formerParent.leftSum + formerParent.rightSum;
        newParent[nodeTargetSubtreeCountKey] = 1 + formerParent.leftCount + formerParent.rightCount;
    }

    protected _replaceDeletedNode(deletedNode: TSumNode<T>) {
        const grandparent = deletedNode.parent;
        const grandparentSubtreeKey: SubtreeKey = deletedNode.isLessThanParent ? 'left' : 'right';
        let replacementNode = deletedNode.left || deletedNode.right;

        const whichSubtree: SubtreeKey = replacementNode?.isLessThanParent ? 'left' : 'right';
        // if the node we're starting with is on the deleted node's left subtree
        // then we want the rightmost element in the deleted node's left subtree
        const searchDirection: SubtreeKey = whichSubtree === 'left' ? 'right' : 'left';
        const intermediates = [];
        while (replacementNode && replacementNode[searchDirection]) {
            intermediates.push(replacementNode);
            replacementNode = replacementNode[searchDirection];
        }

        if (replacementNode) {
            // deal with the special case of a child being the replacement node
            if (intermediates.length === 0) {
                // this child was situated on the opposite side of [searchDirection] of parent
                // so it inherits [searchDirection]
                replacementNode[searchDirection] = deletedNode[searchDirection];
                if (replacementNode[searchDirection]) {
                    replacementNode[searchDirection]!.parent = replacementNode;
                }
                // update sums and counts
                const sumKey = this._sumKey(searchDirection);
                const countKey = this._countKey(searchDirection);
                replacementNode[sumKey] = deletedNode[sumKey];
                replacementNode[countKey] = deletedNode[countKey];
            } else {
                // extract replacement node from tree by assigning its child (
                //      of which there can be at most 1, and only on the subtree opposite
                //      the search direction, since after all the replacement node
                //      is defined as being the [searchDirection-most] node in a subtree
                // ) to its parent
                replacementNode.parent![searchDirection] = replacementNode[whichSubtree];
                if (replacementNode[whichSubtree]) {
                    replacementNode[whichSubtree]!.parent = replacementNode.parent;
                }

                replacementNode.left = deletedNode.left;
                if (replacementNode.left) replacementNode.left.parent = replacementNode;

                replacementNode.right = deletedNode.right;
                if (replacementNode.right) replacementNode.right.parent = replacementNode;

                // update sums and counts for the subtree the replacement node was extracted from
                for (const node of intermediates) {
                    node[this._sumKey(searchDirection)] -= replacementNode.value;
                    node[this._countKey(searchDirection)] -= 1;
                }
                replacementNode[this._sumKey(searchDirection)] = deletedNode[this._sumKey(searchDirection)];
                replacementNode[this._countKey(searchDirection)] = deletedNode[this._countKey(searchDirection)];
                // suppose replacement node was in the left subtree of the deleted node
                // now, the replacement node has the same leftSum as the deleted node, minus its own value
                replacementNode[this._sumKey(whichSubtree)] = deletedNode[this._sumKey(whichSubtree)] - replacementNode.value;
                replacementNode[this._countKey(whichSubtree)] = deletedNode[this._countKey(whichSubtree)] - 1;
            }

            replacementNode.parent = deletedNode.parent;
            replacementNode.isLessThanParent = deletedNode.isLessThanParent;
        }

        if (grandparent) {
            grandparent[grandparentSubtreeKey] = replacementNode;
            this._propagateSubtractionUpwards(deletedNode);
        } else {
            // if the deleted node had no parent, then it was the root
            this.root = replacementNode;
        }
    }

    protected _propagateSubtractionUpwards(deletedNode: TSumNode<T>) {
        const toSubtract = deletedNode.value;
        let node: TSumNode<T>|undefined = deletedNode;
        let sumKey: SubtreeSumKey;
        let countKey: SubtreeCountKey;

        while (node.parent) {
            sumKey = node.isLessThanParent ? 'leftSum' : 'rightSum';
            countKey = node.isLessThanParent ? 'leftCount' : 'rightCount';
            node.parent[sumKey] -= toSubtract;
            node.parent[countKey] -= 1;
            node = node.parent;
        }
    }

    protected _newNode(data: T): TSumNode<T> {
        const value = this.getSummableValue(data);
        return {
            data,
            value,
            leftSum: 0,
            rightSum: 0,
            leftCount: 0,
            rightCount: 0,
        };
    }

    protected _sumKey(direction: SubtreeKey): SubtreeSumKey {
        return direction === 'right' ? 'rightSum' : 'leftSum';
    }

    protected _countKey(direction: SubtreeKey): SubtreeCountKey {
        return direction === 'right' ? 'rightCount' : 'leftCount';
    }

    /*
    Traversing down the BST looking for "target cumulative value"
    
        (A) Target types can be indexes (a.k.a every value is 1) or sums
            where the "summableValue" is used

        (B) Every time a rightward traversal occurs
            because:
                target >= cumulativeSum + getValue(node)
            then: 
                cumulativeSum += getValue(node)
            reasoning:
                we have found a point at which we know this node and its left subtree
                are all less than the sought-after count value
        
        (C) Every time a leftward traversal occurs
            because:
                target < cumulativeSum + getValue(node)
            then: 
                do nothing
            because:
                we have NOT found a point at which we know this node and its left subtree
                are all less than the sought-after count value
    */

    protected _findNearestToCumulativeValue(targetValue: number, targetType: 'count'|'sum') {
        let node = this.root;
        let inclusivePrefixSum = 0;
        let inclusivePrefixCount = 0;
        let lastLesser: TraversalData<T>|undefined = undefined;
        let lastGreater: TraversalData<T>|undefined = undefined;

        while (node) {
            const thisNodePrefixSum = inclusivePrefixSum + node.leftSum + node.value;
            const thisNodeIndex = inclusivePrefixCount + node.leftCount + 1;
            const toCompare = targetType === 'count' ? thisNodeIndex : thisNodePrefixSum;

            if (targetValue === toCompare) {
                // Exact match, so return both
                lastGreater = {node, inclusivePrefixSum: thisNodePrefixSum, inclusivePrefixCount: thisNodeIndex};
                lastLesser = lastGreater;
                break;
            } else if (targetValue > toCompare) {
                // the node we are at is LESS than the target we seek
                // so (B) applies
                inclusivePrefixSum = thisNodePrefixSum;
                inclusivePrefixCount = thisNodeIndex;
                lastLesser = {node, inclusivePrefixSum, inclusivePrefixCount};
                // traverse right
                node = node.right;
            } else {
                // the node we are at is GREATER than the target we seek
                // so (C) applies
                lastGreater = {node, inclusivePrefixSum, inclusivePrefixCount};
                // traverse left
                node = node.left;
            }
        }

        return {
            lastLesser,
            lastGreater,
        };
    }

    protected _getCumulativeValuesByExactMatch(data: T): TraversalData<T>|undefined {
        let node = this.root;
        let inclusivePrefixSum = 0;
        let inclusivePrefixCount = 0;

        while (node) {
            const thisNodePrefixSum = inclusivePrefixSum + node.leftSum + node.value;
            const thisNodeIndex = inclusivePrefixCount + node.leftCount;

            // is the node we are looking for less than (aka right)
            const isLessThan = this.getOrdering(data, node.data) < 0;

            if (this.haveSameId(data, node.data)) {
                // Exact match, so return both
                return {node, inclusivePrefixSum: thisNodePrefixSum, inclusivePrefixCount: thisNodeIndex};
            } else if (!isLessThan) {
                // Greater than, aka
                // the node we are at is LESS than the node we seek
                // so (B) applies
                inclusivePrefixSum = thisNodePrefixSum;
                inclusivePrefixCount = thisNodeIndex;
                // traverse right
                node = node.right;
            } else {
                // traverse left
                node = node.left;
            }
        }

        return undefined;
    }
}
