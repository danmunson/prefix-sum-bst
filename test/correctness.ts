import { PrefixSumBSTBase } from "../src/PrefixSumBSTBase";
import { TSumNode } from "../src/types";
import {assert} from 'chai';

export type TestData = {
    value: number,
    randomSortFactor?: number,
    id: string,
}

export function correctBST(node: TSumNode<TestData>, ) {
    if (node.left) {
        assert(node.left.value < node.value);
        correctBST(node.left);
    }
    if (node.right) {
        assert(node.right.value >= node.value);
        correctBST(node.right);
    }
}

export function correctSubtreeSums(node: TSumNode<TestData>) {
    let actualLeftSum = 0;
    let actualRightSum = 0;

    if (node.left) {
        actualLeftSum = correctSubtreeSums(node.left);
        assert.strictEqual(node.leftSum, actualLeftSum);
    }
    if (node.right) {
        actualRightSum = correctSubtreeSums(node.right);
        assert.strictEqual(node.rightSum, actualRightSum);
    }

    return node.value + actualLeftSum + actualRightSum;
}
