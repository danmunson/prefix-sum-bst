import { assert } from "chai";
import { PrefixSumBSTBase } from "../src/PrefixSumBSTBase";
import { TSumNode } from "../src/types";
import {
    assertCorrectBST,
    assertCorrectSubtreeSums,
    makeShuffledSequence,
    makeTestNode,
    sumOfOneThru,
    TestData
} from "./correctness";

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
            deleteNodes(bst, [25, 50, 75]);
            assertCorrectBST(bst.root!);
            let fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100) - (25 + 50 + 75));
            assert.strictEqual(fullValues.count, 97);

            // delete root as special case
            const rootValue = bst.root!.data.value;
            deleteNodes(bst, [rootValue]);
            assertCorrectBST(bst.root!);
            fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100) - (25 + 50 + 75 + rootValue));
            assert.strictEqual(fullValues.count, 96);

            // find & delete leaf nodes as special case
            const leafNode = findLeafNode(bst.root!);
            const leafValue = leafNode.data.value;
            deleteNodes(bst, [leafValue]);
            assertCorrectBST(bst.root!);
            fullValues = assertCorrectSubtreeSums(bst.root!);
            assert.strictEqual(fullValues.sum, sumOfOneThru(100) - (25 + 50 + 75 + rootValue + leafValue));
            assert.strictEqual(fullValues.count, 95);

        });

        it('deleted root', () => {
            
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
            const result = bst.findInclusivePrefixSumByNode({id: 'id-34', value: 34});
            assert.strictEqual(result?.inclusivePrefixSum, sumOfOneThru(34));
        });

        it('findInclusivePrefixSumAtIndex', () => {
            const result = bst.findInclusivePrefixSumAtIndex(49);
            assert.strictEqual(result?.inclusivePrefixSum, sumOfOneThru(50))
        });
    });
});
