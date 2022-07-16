import { assert } from "chai";
import { PrefixSumBSTBase } from "../src/PrefixSumBSTBase";
import { TSumNode } from "../src/types";
import {
    assertCorrectBST,
    assertCorrectSubtreeSums,
    makeShuffledSequence,
    makeTestNode,
    sumOfOneThru,
    TestData,
    treeHash
} from "./utils";

function insertSequence(bst: PrefixSumBSTBase<TestData>, upperLimit: number) {
    return makeShuffledSequence(upperLimit).forEach((data) => bst.insert(data));
}

function deleteNodes(bst: PrefixSumBSTBase<TestData>, ids: number[]) {
    for (const id of ids) bst.delete(makeTestNode(id));
}

function findLeafNode(node: TSumNode<TestData>): TSumNode<TestData> {
    if (node.left) return findLeafNode(node.left);
    if (node.right) return findLeafNode(node.right);
    return node;
}

function getNodeByValue(bst: PrefixSumBSTBase<TestData>, n: number) {
    const result = bst.findInfimum(sumOfOneThru(n));
    return result?.node;
}

function rotateNodesUpwardByValue(bst: PrefixSumBSTBase<TestData>, values: number[]) {
    const nodes = values.map((x) => getNodeByValue(bst, x));
    for (const node of nodes) {
        assert(node);
        bst['_rotateUp'](node!);
    }
}

describe('Basic correctness', () => {
    let bst: PrefixSumBSTBase<TestData>;

    beforeEach(() => {
        bst = new PrefixSumBSTBase<TestData>(
            (x, y) => x.id === y.id,
            (x) => x.value,
            (x, y) => x.value - y.value,
        );
    });

    /**
     * Confirm that the PrefixSumBST retains its core properties under
     *  - insertion
     *  - deletion
     *  - rotation
     */
    describe('PrefixSumBST structural correctness under modifications', () => {
        beforeEach(() => insertSequence(bst, 100));

        it('basic', () => {
            assertCorrectBST(bst.root!);
            const fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100));
            assert.strictEqual(fullValues.count, 100);
        });

        it('inserted duplicates', () => {
            insertSequence(bst, 50);
            assertCorrectBST(bst.root!);
            const fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100) + sumOfOneThru(50));
            assert.strictEqual(fullValues.count, 150);
        });

        it('deleted values', () => {
            assertCorrectBST(bst.root!);
            // randomly chosen numbers
            const elementsToRemove = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99];
            const removedSum = elementsToRemove.reduce((a, b) => a + b, 0);
            deleteNodes(bst, elementsToRemove);
            assertCorrectBST(bst.root!);
            let fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100) - removedSum);
            assert.strictEqual(fullValues.count, 100 - elementsToRemove.length);

            // delete root as special case
            const rootValue = bst.root!.data.value;
            deleteNodes(bst, [rootValue]);
            assertCorrectBST(bst.root!);
            fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100) - (removedSum + rootValue));
            assert.strictEqual(fullValues.count, 100 - elementsToRemove.length - 1);

            // find & delete leaf nodes as special case
            const leafNode = findLeafNode(bst.root!);
            const leafValue = leafNode.data.value;
            deleteNodes(bst, [leafValue]);
            assertCorrectBST(bst.root!);
            fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100) - (removedSum + rootValue + leafValue));
            assert.strictEqual(fullValues.count, 100 - elementsToRemove.length - 2);
        });

        it('rotation', () => {
            // trying to rotate root should fail
            let initialRootValue = bst.root!.data.value;
            rotateNodesUpwardByValue(bst, [initialRootValue]);
            assert.strictEqual(bst.root!.data.value, initialRootValue); // nothing has changed

            // rotations should act as expected, e.g. parent and child swap relations
            const initialTreeHash = {};
            treeHash(initialTreeHash, bst.root!, '-');

            initialRootValue = bst.root!.data.value;
            let initialLeftChildValue = bst.root!.left?.data.value;
            assert(initialLeftChildValue);

            rotateNodesUpwardByValue(bst, [initialLeftChildValue]);
            assert.strictEqual(bst.root!.data.value, initialLeftChildValue);
            assert.strictEqual(bst.root!.right?.data.value, initialRootValue);

            // rotations are invertable
            rotateNodesUpwardByValue(bst, [initialRootValue]);
            const postRotationsTreeHash = {};
            treeHash(postRotationsTreeHash, bst.root!, '-');
            assert.deepStrictEqual(postRotationsTreeHash, initialTreeHash);

            // all rotations should preserve PrefixSumBST properties
            assertCorrectBST(bst.root!);
            let fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100));
            assert.strictEqual(fullValues.count, 100);

            const nodeValuesToRotate = [
                1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99
            ].filter(x => x !== bst.root!.data.value);
            rotateNodesUpwardByValue(bst, nodeValuesToRotate);

            assertCorrectBST(bst.root!);
            fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100));
            assert.strictEqual(fullValues.count, 100);
        });
    });

    /**
     * Confirm that the PrefixSumBST seeker methods work as expected
     */
    describe('seeker methods', () => {
        beforeEach(() => insertSequence(bst, 100));

        it('findInfimum', () => {
            const result = bst.findInfimum(sumOfOneThru(75) + 1);
            assert.strictEqual(result?.node.data.id, 'id-75');
        });

        it('findInfimum exact', () => {
            const result = bst.findInfimum(sumOfOneThru(75));
            assert.strictEqual(result?.node.data.id, 'id-75');
        });

        it('findSupremum', () => {
            const result = bst.findSupremum(sumOfOneThru(75) + 1);
            assert.strictEqual(result?.node.data.id, 'id-76');
        });

        it('findSupremum exact', () => {
            const result = bst.findSupremum(sumOfOneThru(76));
            assert.strictEqual(result?.node.data.id, 'id-76');
        });

        it('findInclusivePrefixSumByNode', () => {
            let result = bst.findInclusivePrefixSumByNode({id: 'id-34', value: 34});
            assert.strictEqual(result?.inclusivePrefixSum, sumOfOneThru(34));

            result = bst.findInclusivePrefixSumByNode({id: 'id-1000', value: 1000});
            assert.strictEqual(result, undefined);
        });

        it('findInclusivePrefixSumAtIndex', () => {
            let result = bst.findInclusivePrefixSumAtIndex(49);
            assert.strictEqual(result?.inclusivePrefixSum, sumOfOneThru(50));

            result = bst.findInclusivePrefixSumAtIndex(1000);
            assert.strictEqual(result, undefined);
        });
    });
});
