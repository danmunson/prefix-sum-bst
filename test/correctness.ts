import { TSumNode } from "../src/types";
import {assert} from 'chai';

export type TestData = {
    value: number,
    randomSortFactor?: number,
    id: string,
}

export function genRandom(i: number) {
    const randomExponent = 123;
    const randomModulus = 45678901; // prime, nice
    return ((i + 123) ** randomExponent) % randomModulus;
}

export function makeTestNode(i: number) {
    return {
        value: i + 1,
        randomSortFactor: genRandom(i),
        id: `id-${i + 1}`,
    };
}

export function makeShuffledSequence(upperLimit: number): TestData[] {
    const shuffledSeq = Array(upperLimit).fill(undefined)
        .map((x, i) => makeTestNode(i))
        .sort((x, y) => x.randomSortFactor - y.randomSortFactor);

    return shuffledSeq;
}

export function sumOfOneThru(N: number) {
    return (N * (N + 1)) / 2;
}

export function assertCorrectBST(node: TSumNode<TestData>, ) {
    if (node.left) {
        assert(node.left.value < node.value);
        assertCorrectBST(node.left);
    }
    if (node.right) {
        assert(node.right.value >= node.value);
        assertCorrectBST(node.right);
    }
}

export function assertCorrectSubtreeSums(node: TSumNode<TestData>) {
    let leftValues = {sum: 0, count: 0};
    let rightValues = {sum: 0, count: 0};

    if (node.left) {
        leftValues = assertCorrectSubtreeSums(node.left);
        assert.strictEqual(node.leftSum, leftValues.sum);
        assert.strictEqual(node.leftCount, leftValues.count);
    }
    if (node.right) {
        rightValues = assertCorrectSubtreeSums(node.right);
        assert.strictEqual(node.rightSum, rightValues.sum);
        assert.strictEqual(node.rightCount, rightValues.count);
    }

    return {
        sum: node.value + leftValues.sum + rightValues.sum,
        count: 1 + leftValues.count + rightValues.count,
    };
}
