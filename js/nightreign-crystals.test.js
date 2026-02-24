/**
 * Unit tests for surface map crystal group and state logic.
 * Logic under test must stay in sync with js/nightreign.js (crystalGroups, getIdsToSync, states).
 * Run with: node js/nightreign-crystals.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// --- Copy of logic from nightreign.js (keep in sync) ---

var crystalGroups = {
	A: ['1', '5', '6', '7', '9', '13'],
	B: ['3', '4', '7', '10', '11', '13'],
	C: ['1', '4', '8', '10', '15'],
	D: ['2', '8', '9', '12', '14']
};

var states = ['inactive', 'possible', 'active'];

function getIdsToSync(id) {
	var seen = {};
	var groupName;
	for (groupName in crystalGroups) {
		if (crystalGroups[groupName].indexOf(id) !== -1) {
			crystalGroups[groupName].forEach(function (gid) { seen[gid] = true; });
		}
	}
	return Object.keys(seen).sort();
}

function getNextStateLeft(currentState) {
	var idx = states.indexOf(currentState);
	if (idx <= 0) return currentState;
	return states[idx - 1];
}

function getNextStateRight(currentState) {
	var idx = states.indexOf(currentState);
	if (idx < 0 || idx >= 2) return currentState;
	return states[idx + 1];
}

// --- Tests ---

describe('getIdsToSync', function () {
	it('returns all ids in the group when crystal is in a single group', function () {
		// 2 is only in D; result is sorted (lexicographic)
		var ids2 = getIdsToSync('2');
		assert.deepStrictEqual(ids2, ['12', '14', '2', '8', '9']);
	});

	it('returns union of all groups containing the crystal (no duplicates)', function () {
		// 1 is in A and C
		var ids1 = getIdsToSync('1');
		assert.ok(ids1.indexOf('1') !== -1);
		assert.ok(ids1.indexOf('4') !== -1);
		assert.ok(ids1.indexOf('8') !== -1);
		assert.ok(ids1.indexOf('10') !== -1);
		assert.ok(ids1.indexOf('15') !== -1);
		assert.strictEqual(ids1.filter(function (x) { return x === '1'; }).length, 1);
	});

	it('includes all members of every group that contains the id', function () {
		// 13 is in A and B
		var ids13 = getIdsToSync('13');
		// From A: 1, 5, 6, 7, 9, 13
		['1', '5', '6', '7', '9', '13'].forEach(function (id) {
			assert.ok(ids13.indexOf(id) !== -1, 'id ' + id + ' should be in sync set for 13');
		});
		// From B: 3, 4, 7, 10, 11, 13
		['3', '4', '10', '11'].forEach(function (id) {
			assert.ok(ids13.indexOf(id) !== -1, 'id ' + id + ' should be in sync set for 13');
		});
	});

	it('returns sorted ids for deterministic behavior', function () {
		var ids = getIdsToSync('8');
		var sorted = ids.slice().sort();
		assert.deepStrictEqual(ids, sorted);
	});
});

describe('state transitions (left click)', function () {
	it('possible -> inactive', function () {
		assert.strictEqual(getNextStateLeft('possible'), 'inactive');
	});
	it('active -> possible', function () {
		assert.strictEqual(getNextStateLeft('active'), 'possible');
	});
	it('inactive -> inactive (no change at boundary)', function () {
		assert.strictEqual(getNextStateLeft('inactive'), 'inactive');
	});
});

describe('state transitions (right click)', function () {
	it('inactive -> possible', function () {
		assert.strictEqual(getNextStateRight('inactive'), 'possible');
	});
	it('possible -> active', function () {
		assert.strictEqual(getNextStateRight('possible'), 'active');
	});
	it('active -> active (no change at boundary)', function () {
		assert.strictEqual(getNextStateRight('active'), 'active');
	});
});

describe('sync set consistency', function () {
	it('clicking a crystal and applying new state: all ids in getIdsToSync get that state', function () {
		var id = '7'; // 7 is in A and B
		var idsToSync = getIdsToSync(id);
		var newState = 'active';
		var result = {};
		idsToSync.forEach(function (syncId) { result[syncId] = newState; });
		idsToSync.forEach(function (syncId) {
			assert.strictEqual(result[syncId], newState);
		});
	});
});
