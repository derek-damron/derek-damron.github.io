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

var groupNamesOrder = ['A', 'B', 'C', 'D'];

function getGroupNamesContaining(id) {
	var out = [];
	for (var i = 0; i < groupNamesOrder.length; i++) {
		var g = groupNamesOrder[i];
		if (crystalGroups[g].indexOf(id) !== -1) out.push(g);
	}
	return out;
}

function getCrystalIdsInGroups(groupNames) {
	var seen = {};
	for (var i = 0; i < groupNames.length; i++) {
		var ids = crystalGroups[groupNames[i]];
		if (ids) for (var j = 0; j < ids.length; j++) seen[ids[j]] = true;
	}
	return Object.keys(seen).sort();
}

function getAllCrystalIds() {
	return getCrystalIdsInGroups(groupNamesOrder);
}

function getRemainingCrystalIds(stateById) {
	var all = getAllCrystalIds();
	return all.filter(function (id) { return stateById[id] && stateById[id] !== 'inactive'; }).sort();
}

function findGroupWithExactCrystals(crystalIds) {
	var set = {};
	for (var i = 0; i < crystalIds.length; i++) set[crystalIds[i]] = true;
	var idsSorted = Object.keys(set).sort();
	for (var g = 0; g < groupNamesOrder.length; g++) {
		var groupId = groupNamesOrder[g];
		var groupIds = crystalGroups[groupId].slice().sort();
		if (groupIds.length === idsSorted.length && groupIds.every(function (x, i) { return x === idsSorted[i]; })) return groupId;
	}
	return null;
}

function applyRemainingGroupToHighest(stateById) {
	var remaining = getRemainingCrystalIds(stateById);
	var group = findGroupWithExactCrystals(remaining);
	if (group) {
		var ids = crystalGroups[group];
		for (var i = 0; i < ids.length; i++) stateById[ids[i]] = 'active';
	}
}

function applyMoveUp(id, stateById) {
	var groups = getGroupNamesContaining(id);
	if (groups.length === 1) {
		var toEnable = getCrystalIdsInGroups(groups);
		for (var i = 0; i < toEnable.length; i++) stateById[toEnable[i]] = 'active';
		var allIds = getAllCrystalIds();
		for (var j = 0; j < allIds.length; j++) {
			if (toEnable.indexOf(allIds[j]) === -1) stateById[allIds[j]] = 'inactive';
		}
	} else if (groups.length === 2) {
		var toDisable = getCrystalIdsInGroups(groups);
		for (var k = 0; k < toDisable.length; k++) stateById[toDisable[k]] = 'inactive';
	}
	applyRemainingGroupToHighest(stateById);
}

function applyMoveDown(id, stateById) {
	var groups = getGroupNamesContaining(id);
	if (groups.length === 1) {
		var toDisable = getCrystalIdsInGroups(groups);
		for (var i = 0; i < toDisable.length; i++) stateById[toDisable[i]] = 'inactive';
	} else if (groups.length === 2) {
		var ids = getCrystalIdsInGroups(groups);
		for (var j = 0; j < ids.length; j++) {
			var sid = ids[j];
			var idx = states.indexOf(stateById[sid]);
			stateById[sid] = idx <= 0 ? 'inactive' : states[idx - 1];
		}
	}
	applyRemainingGroupToHighest(stateById);
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

describe('getGroupNamesContaining', function () {
	it('returns single group when crystal is in one group', function () {
		assert.deepStrictEqual(getGroupNamesContaining('2'), ['D']);
		assert.deepStrictEqual(getGroupNamesContaining('5'), ['A']);
	});
	it('returns both groups when crystal is in two groups', function () {
		var groups4 = getGroupNamesContaining('4');
		assert.strictEqual(groups4.length, 2);
		assert.ok(groups4.indexOf('B') !== -1 && groups4.indexOf('C') !== -1);
	});
});

describe('getCrystalIdsInGroups', function () {
	it('returns union of crystal IDs for given groups', function () {
		var idsD = getCrystalIdsInGroups(['D']);
		assert.deepStrictEqual(idsD, ['12', '14', '2', '8', '9']);
	});
	it('returns union with no duplicates for overlapping groups', function () {
		var idsAB = getCrystalIdsInGroups(['A', 'B']);
		var seen = {};
		idsAB.forEach(function (id) { seen[id] = (seen[id] || 0) + 1; });
		Object.keys(seen).forEach(function (id) { assert.strictEqual(seen[id], 1, 'no duplicate ' + id); });
	});
});

describe('getRemainingCrystalIds', function () {
	it('returns ids that are not inactive', function () {
		var stateById = { '1': 'inactive', '2': 'possible', '3': 'active' };
		assert.deepStrictEqual(getRemainingCrystalIds(stateById).sort(), ['2', '3']);
	});
	it('returns empty when all inactive', function () {
		var stateById = { '1': 'inactive', '2': 'inactive' };
		assert.strictEqual(getRemainingCrystalIds(stateById).length, 0);
	});
});

describe('findGroupWithExactCrystals', function () {
	it('returns group when crystal set exactly matches one group', function () {
		var dIds = ['12', '14', '2', '8', '9'];
		assert.strictEqual(findGroupWithExactCrystals(dIds), 'D');
	});
	it('returns null when set is partial or mixed', function () {
		assert.strictEqual(findGroupWithExactCrystals(['2', '8']), null);
		assert.strictEqual(findGroupWithExactCrystals(['1', '2', '3']), null);
	});
});

describe('applyMoveUp (one group)', function () {
	it('enables that group and disables all other groups', function () {
		var stateById = {};
		getAllCrystalIds().forEach(function (id) { stateById[id] = 'possible'; });
		applyMoveUp('2', stateById); // 2 is only in D
		var dIds = crystalGroups.D;
		dIds.forEach(function (id) { assert.strictEqual(stateById[id], 'active', 'D should be active'); });
		getAllCrystalIds().forEach(function (id) {
			if (dIds.indexOf(id) === -1) assert.strictEqual(stateById[id], 'inactive', id + ' should be inactive');
		});
	});
});

describe('applyMoveUp (two groups)', function () {
	it('disables all crystals in both groups', function () {
		var stateById = {};
		getAllCrystalIds().forEach(function (id) { stateById[id] = 'possible'; });
		applyMoveUp('4', stateById); // 4 is in B and C
		var bcIds = getCrystalIdsInGroups(['B', 'C']);
		bcIds.forEach(function (id) { assert.strictEqual(stateById[id], 'inactive', id + ' should be inactive'); });
	});
});

describe('applyMoveDown (one group)', function () {
	it('disables all crystals in that group', function () {
		var stateById = {};
		getAllCrystalIds().forEach(function (id) { stateById[id] = 'possible'; });
		applyMoveDown('2', stateById); // 2 is only in D
		crystalGroups.D.forEach(function (id) { assert.strictEqual(stateById[id], 'inactive'); });
	});
});

describe('applyMoveDown (two groups)', function () {
	it('moves both groups one step down', function () {
		var stateById = {};
		getAllCrystalIds().forEach(function (id) { stateById[id] = 'active'; });
		applyMoveDown('4', stateById); // 4 is in B and C
		var bcIds = getCrystalIdsInGroups(['B', 'C']);
		bcIds.forEach(function (id) { assert.strictEqual(stateById[id], 'possible'); });
	});
});

describe('remaining group promoted to highest', function () {
	it('when only one group remains non-inactive that group becomes active', function () {
		var stateById = {};
		getAllCrystalIds().forEach(function (id) { stateById[id] = 'inactive'; });
		crystalGroups.D.forEach(function (id) { stateById[id] = 'possible'; });
		applyRemainingGroupToHighest(stateById);
		crystalGroups.D.forEach(function (id) { assert.strictEqual(stateById[id], 'active'); });
	});
});
