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
        value: i,
        randomSortFactor: genRandom(i),
        id: `id-${i}`,
    };
}

export function makeShuffledSequence(upperLimit: number): TestData[] {
    const shuffledSeq = Array(upperLimit).fill(undefined)
        .map((x, i) => makeTestNode(i + 1))
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

        // pre-assertion diagnostics
        if (node.leftSum !== leftValues.sum || node.leftCount !== leftValues.count) {
            const leftSubtreeSet: Set<string> = new Set();
            collectSubtreeMembers(leftSubtreeSet, node.left);
            console.log(`Left subtree of ${node.data.id}`, [...leftSubtreeSet]);
        }

        assert.strictEqual(
            node.leftSum, leftValues.sum,
            `Left sum of ${node.data.id} is set to ${node.leftSum}, should be ${leftValues.sum}`
        );
        assert.strictEqual(
            node.leftCount, leftValues.count,
            `Left count of ${node.data.id} is set to ${node.leftCount}, should be ${leftValues.count}`
        );
    }
    if (node.right) {
        rightValues = assertCorrectSubtreeSums(node.right);
        assert.strictEqual(
            node.rightSum, rightValues.sum,
            `Right sum of ${node.data.id} is set to ${node.rightSum}, should be ${rightValues.sum}`
        );
        assert.strictEqual(
            node.rightCount, rightValues.count,
            `Right count of ${node.data.id} is set to ${node.rightCount}, should be ${rightValues.count}`
        );
    }

    return {
        sum: node.value + leftValues.sum + rightValues.sum,
        count: 1 + leftValues.count + rightValues.count,
    };
}

function collectSubtreeMembers(set: Set<string>, node: TSumNode<TestData>) {
    set.add(node.data.id);
    if (node.right) collectSubtreeMembers(set, node.right);
    if (node.left) collectSubtreeMembers(set, node.left);
}

export function loggableSubtreeString(node: TSumNode<TestData>) {
    const loggableObject = {};
    updateLoggableSubtree(loggableObject, node);
    return JSON.stringify(loggableObject, null, 4);
}

function updateLoggableSubtree(loggableObject: any, node: TSumNode<TestData>|undefined) {
    if (!node) return;
    loggableObject.value = node.value;
    loggableObject.leftSum = node.leftSum;
    loggableObject.right = {};
    updateLoggableSubtree(loggableObject.right, node.right);
    loggableObject.left = {};
    updateLoggableSubtree(loggableObject.left, node.left);
}

export function treeHash(
    record: Record<string, string>,
    node: TSumNode<TestData>,
    key: string
) {
    record[key] = node.data.id;
    if (node.left) treeHash(record, node.left, key + 'l');
    if (node.right) treeHash(record, node.right, key + 'r');
}
