import {TSumNode, ISumBSTBase, SubtreeKey, SubtreeSumKey, SubtreeCountKey} from './types';

export class SumBSTBase<T> implements ISumBSTBase<T> {
    public root: TSumNode<T> = undefined;

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

        let currentNode: TSumNode<T> = this.root;
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
        trailingNode.isLessThanParent = isLessThan;
    }

    public delete(deletionData: T) {
        if (this.root === undefined) return false;

        let found = false;
        let currentNode: TSumNode<T> = this.root;
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

        if (found) {
            const deletedNode = currentNode;
            this._propagateSubtractionUpwards(deletedNode);
            this._replaceDeletedNode(deletedNode);
        }
        
        return found;
    }

    /*
    Find the lowest node with a cumulative sum that is greater than or equal to the argument.
    */
    public findSupremum(sum: number): TSumNode<T> {
        // TODO
        return {} as any;
    }

    /*
    Find the greatest node with a cumulative sum that is less than or equal to the argument.
    */
    public findInfimum(sum: number): TSumNode<T> {
        // TODO
        return {} as any;
    }

    /*
    Find the inclusive cumulative sum of the all elements at or below the index provided
    */
    public findInclusiveCumulativeSum(index: number): number {
        // TODO
        return 0;
    }

    protected _leftRotate(node: TSumNode<T>) {
        this._rotate(node, 'left');
    }

    protected _rightRotate(node: TSumNode<T>) {
        this._rotate(node, 'right');
    }

    protected _rotate(node: TSumNode<T>, rotationDirection: SubtreeKey) {
        if (!node.parent) return;

        const parent = node.parent;
        const nodeTargetSubtreeKey = rotationDirection;
        const nodeTargetSubtreeSumKey = this._sumKey(nodeTargetSubtreeKey);
        const nodeTargetSubtreeCountKey = this._countKey(nodeTargetSubtreeKey);

        const parentTargetSubtreeKey: SubtreeKey = rotationDirection === 'left' ? 'right' : 'left';
        const parentTargetSubtreeSumKey = this._sumKey(parentTargetSubtreeKey);
        const parentTargetSubtreeCountKey = this._countKey(parentTargetSubtreeKey);


        // temp vars
        const grandparentRef = parent.parent;
        const isLessThanGrandparent = parent.isLessThanParent;
        const nodeTargetSubtreeSum = node[this._sumKey(nodeTargetSubtreeKey)];
        const nodeTargetSubtreeCount = node[this._countKey(nodeTargetSubtreeKey)];
        
        // rotate
        parent[parentTargetSubtreeKey] = node[nodeTargetSubtreeKey];
        parent.parent = node;
        parent.isLessThanParent = rotationDirection === 'right';
        node[nodeTargetSubtreeKey] = parent; // node is now the new parent
        node.parent = grandparentRef;
        node.isLessThanParent = isLessThanGrandparent;

        // update sums
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
        let replacementNode = deletedNode.left || deletedNode.right;
        if (!replacementNode) return undefined;

        const whichSubtree: SubtreeKey = replacementNode.isLessThanParent ? 'left' : 'right';
        // if the node we're starting with is on the deleted node's left subtree
        // then we want the rightmost element in the deleted node's left subtree
        const searchDirection: SubtreeKey = whichSubtree === 'left' ? 'right' : 'left';
        const intermediates = [];
        while (replacementNode[searchDirection]) {
            intermediates.push(replacementNode);
            replacementNode = replacementNode[searchDirection];
        }

        // deal with the special case of a child being the replacement node
        if (intermediates.length === 0) {
            // this child was situated on the opposite side of [searchDirection] of parent
            // so it inherits [searchDirection]
            replacementNode[searchDirection] = deletedNode[searchDirection];
            // update sums and counts
            const sumKey = this._sumKey(searchDirection);
            const countKey = this._countKey(searchDirection);
            replacementNode[sumKey] = deletedNode[sumKey];
            replacementNode[countKey] = deletedNode[countKey];
        } else {
            // sever replacement node
            replacementNode.parent[searchDirection] = undefined;
            replacementNode.left = deletedNode.left;
            replacementNode.right = deletedNode.right;

            // update sums and counts
            for (const node of intermediates) {
                node[this._sumKey(searchDirection)] -= replacementNode.value;
                node[this._countKey(searchDirection)] -= 1;
            }
            replacementNode[this._sumKey(searchDirection)] = deletedNode[this._sumKey(searchDirection)];
            replacementNode[this._countKey(searchDirection)] = deletedNode[this._countKey(searchDirection)];
            // suppose replacement node was in the left subtree of the deleted node
            // now, the replacement node has the same leftSum as the deleted node, minus its own value
            replacementNode[this._sumKey(whichSubtree)] = deletedNode[this._sumKey(searchDirection)] - replacementNode.value;
            replacementNode[this._countKey(whichSubtree)] = deletedNode[this._countKey(searchDirection)] - 1;
        }

        replacementNode.parent = deletedNode.parent;
        replacementNode.isLessThanParent = deletedNode.isLessThanParent;
    }

    // private _propagateSubtractionUpwards(initialNode: TSumNode<T>, initialSumKey: SubtreeSumKey, value: number) {
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
}