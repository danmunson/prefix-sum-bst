import { assert } from "chai";
import { PrefixSumBSTBase } from "../src/PrefixSumBSTBase";
import { correctBST, correctSubtreeSums, TestData } from "./correctness";

const randomExponent = 123;
const randomModulus = 45678901; // prime, nice

function makeSequence(upperLimit: number): TestData[] {
    const shuffledSeq = Array(upperLimit).fill(undefined)
        .map((x, i) => ({
            value: i + 1,
            randomSortFactor: ((i + 123) ** randomExponent) % randomModulus,
            id: `id-${i + 1}`,
        }))
        .sort((x, y) => x.randomSortFactor - y.randomSortFactor);

    return shuffledSeq;
}

function sumOfOneThru(N: number) {
    return (N * (N + 1)) / 2;
}

describe('basic correctness', () => {
    let bst: PrefixSumBSTBase<TestData>;
    beforeEach(() => {
        bst = new PrefixSumBSTBase<TestData>(
            (x, y) => x.id === y.id,
            (x) => x.value,
            (x, y) => x.value - y.value,
        );
        makeSequence(100).forEach((data) => {
            bst.insert(data);
        });
    });

    it('correctBST', () => {
        // first add duplicates
        makeSequence(50).forEach((data) => {
            bst.insert(data);
        });
        // check bst correctness
        correctBST(bst.root!);
    });

    it('correctSubtreeSums', () => {
        const fullSum = correctSubtreeSums(bst.root!);
        assert.strictEqual(fullSum, sumOfOneThru(100));
    });

    it('findInfimum', () => {
        const result = bst.findInfimum(sumOfOneThru(75) + 1);
        assert.strictEqual(result?.node.data.id, 'id-75');
    });

    it('findSupremum', () => {
        const result = bst.findSupremum(sumOfOneThru(75) + 1);
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

describe('preserves subtree sums', () => {
    describe('under insertion', () => {});
    describe('under deletion', () => {});
    describe('under rotation', () => {});
});
