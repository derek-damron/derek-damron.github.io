(function () {
	var select = document.getElementById('nightreign-nightlord');
	var table = document.querySelector('.nightreign-table');

	// Protanopia-friendly colors toggle (runs first so it works even if other setup returns early)
	var protanopiaCheckbox = document.getElementById('nightreign-protanopia');
	if (protanopiaCheckbox && document.body) {
		var saved = localStorage.getItem('nightreignProtanopia');
		if (saved === 'true') {
			protanopiaCheckbox.checked = true;
			document.body.classList.add('nightreign-protanopia');
		}
		protanopiaCheckbox.addEventListener('change', function () {
			document.body.classList.toggle('nightreign-protanopia', protanopiaCheckbox.checked);
			localStorage.setItem('nightreignProtanopia', protanopiaCheckbox.checked);
		});
	}

	// Bosses / Crystals tabs (run early so panels are correct before other init)
	(function () {
		var tabBosses = document.getElementById('nightreign-tab-bosses');
		var tabCrystals = document.getElementById('nightreign-tab-crystals');
		var panelBosses = document.getElementById('nightreign-panel-bosses');
		var panelCrystals = document.getElementById('nightreign-panel-crystals');
		var storageKey = 'nightreignActiveTab';

		function showBosses() {
			if (tabBosses) {
				tabBosses.setAttribute('aria-selected', 'true');
				tabBosses.classList.add('nightreign-tab-active');
			}
			if (tabCrystals) {
				tabCrystals.setAttribute('aria-selected', 'false');
				tabCrystals.classList.remove('nightreign-tab-active');
			}
			if (panelBosses) {
				panelBosses.classList.remove('nightreign-tab-panel-hidden');
				panelBosses.setAttribute('aria-hidden', 'false');
			}
			if (panelCrystals) {
				panelCrystals.classList.add('nightreign-tab-panel-hidden');
				panelCrystals.setAttribute('aria-hidden', 'true');
			}
			try { sessionStorage.setItem(storageKey, 'nightreign-panel-bosses'); } catch (e) {}
		}

		function showCrystals() {
			if (tabBosses) {
				tabBosses.setAttribute('aria-selected', 'false');
				tabBosses.classList.remove('nightreign-tab-active');
			}
			if (tabCrystals) {
				tabCrystals.setAttribute('aria-selected', 'true');
				tabCrystals.classList.add('nightreign-tab-active');
			}
			if (panelBosses) {
				panelBosses.classList.add('nightreign-tab-panel-hidden');
				panelBosses.setAttribute('aria-hidden', 'true');
			}
			if (panelCrystals) {
				panelCrystals.classList.remove('nightreign-tab-panel-hidden');
				panelCrystals.setAttribute('aria-hidden', 'false');
			}
			try { sessionStorage.setItem(storageKey, 'nightreign-panel-crystals'); } catch (e) {}
		}

		if (tabBosses) tabBosses.addEventListener('click', showBosses);
		if (tabCrystals) tabCrystals.addEventListener('click', showCrystals);

		// Keyboard: Arrow Left/Right between tabs
		var tabs = [tabBosses, tabCrystals];
		tabs.forEach(function (tab, i) {
			if (!tab) return;
			tab.addEventListener('keydown', function (e) {
				if (e.key === 'ArrowLeft' && i > 0) {
					e.preventDefault();
					tabs[i - 1].focus();
					tabs[i - 1].click();
				} else if (e.key === 'ArrowRight' && i < tabs.length - 1) {
					e.preventDefault();
					tabs[i + 1].focus();
					tabs[i + 1].click();
				}
			});
		});

		// Restore last active tab from sessionStorage
		try {
			var saved = sessionStorage.getItem(storageKey);
			if (saved === 'nightreign-panel-crystals') showCrystals();
		} catch (e) {}
	})();

	// Surface map crystal indicators (runs regardless of table/select)
	(function () {
		var nightreignSurfaceMapPoints = [
			{ id: '1', label: 'Crystal 1', left: 14.34, top: 38.69 },
			{ id: '2', label: 'Crystal 2', left: 7.43, top: 57.84 },
			{ id: '3', label: 'Crystal 3', left: 19.35, top: 55.95 },
			{ id: '4', label: 'Crystal 4', left: 28.26, top: 80.22 },
			{ id: '5', label: 'Crystal 5', left: 39.28, top: 84.12 },
			{ id: '6', label: 'Crystal 6', left: 51.98, top: 65.97 },
			{ id: '7', label: 'Crystal 7', left: 33.71, top: 58.06 },
			{ id: '8', label: 'Crystal 8', left: 43.51, top: 51.05 },
			{ id: '9', label: 'Crystal 9', left: 38.50, top: 36.90 },
			{ id: '10', label: 'Crystal 10', left: 30.60, top: 31.34 },
			{ id: '11', label: 'Crystal 11', left: 42.85, top: 14.19 },
			{ id: '12', label: 'Crystal 12', left: 55.87, top: 30.78 },
			{ id: '13', label: 'Crystal 13', left: 73.36, top: 34.57 },
			{ id: '14', label: 'Crystal 14', left: 85.94, top: 34.68 },
			{ id: '15', label: 'Crystal 15', left: 82.60, top: 12.52 }
		];
		var overlay = document.querySelector('.nightreign-surface-map-overlay');
		if (!overlay) return;
		var states = ['inactive', 'possible', 'active'];
		var storageKey = 'nightreignSurfaceMapCrystals';
		var legacyKey = 'nightreignSurfaceMapCrystalD';

		// Overlapping groups: boundary crystals (4, 8, 12) belong to two groups
		var crystalGroups = {
			A: ['1', '5', '6', '7', '9', '13'],
			B: ['3', '4', '7', '10', '11', '13'],
			C: ['1', '4', '8', '10', '15'],
			D: ['2', '8', '9', '12', '14']
		};
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
			return Object.keys(seen);
		}

		function getAllCrystalIds() {
			return nightreignSurfaceMapPoints.map(function (p) { return p.id; });
		}

		function getRemainingCrystalIds(stateObj) {
			var all = getAllCrystalIds();
			return all.filter(function (id) { return stateObj[id] && stateObj[id] !== 'inactive'; });
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

		function applyRemainingGroupToHighest(stateObj) {
			var remaining = getRemainingCrystalIds(stateObj).sort();
			var group = findGroupWithExactCrystals(remaining);
			if (group) {
				var ids = crystalGroups[group];
				for (var i = 0; i < ids.length; i++) stateObj[ids[i]] = 'active';
			}
		}

		function applyMoveUp(id, stateObj) {
			var groups = getGroupNamesContaining(id);
			if (groups.length === 1) {
				var toEnable = getCrystalIdsInGroups(groups);
				for (var i = 0; i < toEnable.length; i++) stateObj[toEnable[i]] = 'active';
				var allIds = getAllCrystalIds();
				for (var j = 0; j < allIds.length; j++) {
					if (toEnable.indexOf(allIds[j]) === -1) stateObj[allIds[j]] = 'inactive';
				}
			} else if (groups.length === 2) {
				var toDisable = getCrystalIdsInGroups(groups);
				for (var k = 0; k < toDisable.length; k++) stateObj[toDisable[k]] = 'inactive';
			}
			applyRemainingGroupToHighest(stateObj);
		}

		function applyMoveDown(id, stateObj) {
			var groups = getGroupNamesContaining(id);
			if (groups.length === 1) {
				var toDisable = getCrystalIdsInGroups(groups);
				for (var i = 0; i < toDisable.length; i++) stateObj[toDisable[i]] = 'inactive';
			} else if (groups.length === 2) {
				var ids = getCrystalIdsInGroups(groups);
				for (var j = 0; j < ids.length; j++) {
					var sid = ids[j];
					var idx = states.indexOf(stateObj[sid]);
					stateObj[sid] = idx <= 0 ? 'inactive' : states[idx - 1];
				}
			}
			applyRemainingGroupToHighest(stateObj);
		}

		function loadState() {
			var raw = localStorage.getItem(storageKey);
			var obj = {};
			if (raw) {
				try {
					obj = JSON.parse(raw);
				} catch (e) {}
			}
			// Migrate legacy single key for D
			var legacy = localStorage.getItem(legacyKey);
			if (legacy && states.indexOf(legacy) !== -1) {
				obj.D = legacy;
				localStorage.removeItem(legacyKey);
				localStorage.setItem(storageKey, JSON.stringify(obj));
			}
			return obj;
		}

		function saveState(obj) {
			localStorage.setItem(storageKey, JSON.stringify(obj));
		}

		function stateName(state) {
			return state.charAt(0).toUpperCase() + state.slice(1);
		}

		function updateButton(btn, id, label, state) {
			var name = stateName(state);
			btn.className = 'nightreign-crystal-indicator state-' + state;
			btn.setAttribute('aria-label', label + ' indicator: ' + name + '. Left-click move left, right-click move right.');
			btn.setAttribute('title', 'Left-click: move left. Right-click: move right. Current: ' + name + '.');
		}

		function applyStateToCrystal(id, state) {
			var point = nightreignSurfaceMapPoints.find(function (p) { return p.id === id; });
			if (!point) return;
			var btn = overlay.querySelector('.nightreign-crystal-indicator[data-id="' + id + '"]');
			if (!btn) return;
			stateById[id] = state;
			updateButton(btn, id, point.label, state);
		}

		var stateById = loadState();

		// On page load, reset all crystals to possible
		nightreignSurfaceMapPoints.forEach(function (point) {
			stateById[point.id] = 'possible';
		});

		nightreignSurfaceMapPoints.forEach(function (point) {
			var id = point.id;
			var label = point.label;
			var state = stateById[id];
			if (!state || states.indexOf(state) === -1) state = 'possible';
			stateById[id] = state;

			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'nightreign-crystal-indicator state-' + state;
			btn.setAttribute('data-id', id);
			btn.style.left = point.left + '%';
			btn.style.top = point.top + '%';
			btn.setAttribute('aria-label', label + ' indicator: ' + stateName(state) + '. Left-click move left, right-click move right.');
			btn.setAttribute('title', 'Left-click: move left. Right-click: move right. Current: ' + stateName(state) + '.');

			var dot = document.createElement('span');
			dot.className = 'nightreign-crystal-indicator-dot';
			btn.appendChild(dot);

			overlay.appendChild(btn);
		});

		saveState(stateById);

		overlay.addEventListener('click', function (e) {
			var btn = e.target && e.target.closest('.nightreign-crystal-indicator');
			if (!btn) return;
			e.preventDefault();
			var id = btn.getAttribute('data-id');
			var point = nightreignSurfaceMapPoints.find(function (p) { return p.id === id; });
			if (!point) return;
			var state = stateById[id];
			if (state === 'inactive') return;
			applyMoveDown(id, stateById);
			nightreignSurfaceMapPoints.forEach(function (point) { applyStateToCrystal(point.id, stateById[point.id]); });
			saveState(stateById);
		});

		overlay.addEventListener('contextmenu', function (e) {
			var btn = e.target && e.target.closest('.nightreign-crystal-indicator');
			if (!btn) return;
			e.preventDefault();
			var id = btn.getAttribute('data-id');
			var point = nightreignSurfaceMapPoints.find(function (p) { return p.id === id; });
			if (!point) return;
			var state = stateById[id];
			if (state === 'active') return;
			applyMoveUp(id, stateById);
			nightreignSurfaceMapPoints.forEach(function (point) { applyStateToCrystal(point.id, stateById[point.id]); });
			saveState(stateById);
		});

		var resetBtn = document.getElementById('nightreign-crystals-reset');
		if (resetBtn) {
			resetBtn.addEventListener('click', function () {
				nightreignSurfaceMapPoints.forEach(function (point) {
					stateById[point.id] = 'possible';
					applyStateToCrystal(point.id, 'possible');
				});
				saveState(stateById);
			});
		}
	})();

	if (!select || !table) return;

	function isHeaderRow(row) {
		var c = (row.getAttribute && row.getAttribute('class')) || row.className || '';
		return c.indexOf('nightreign-night-header') !== -1;
	}
	function hasHiddenClass(row) {
		var c = (row.getAttribute && row.getAttribute('class')) || row.className || '';
		return c.indexOf('hidden') !== -1;
	}

	var tbody = table.querySelector('tbody');
	var allRows = tbody ? tbody.querySelectorAll('tr') : [];
	var dataRows = [];
	var headerRows = [];
	allRows.forEach(function (row) {
		if (isHeaderRow(row)) {
			headerRows.push(row);
		} else {
			dataRows.push(row);
		}
	});

	// Build unique nightlord options from data rows only
	var nightlords = [];
	dataRows.forEach(function (row) {
		var nl = row.getAttribute('data-nightlord') || '';
		if (nl && nightlords.indexOf(nl) === -1) {
			nightlords.push(nl);
		}
	});
	// Keep order from nightreign.json (table rows already follow that order)
	nightlords.forEach(function (nl) {
		var opt = document.createElement('option');
		opt.value = nl;
		opt.textContent = nl;
		select.appendChild(opt);
	});

	// Boss dropdown elements
	var bossDropdown = document.getElementById('nightreign-boss-dropdown');
	var bossTrigger = document.getElementById('nightreign-boss-trigger');
	var bossValue = bossTrigger ? bossTrigger.querySelector('.nightreign-boss-value') : null;
	var bossDropdownContent = document.getElementById('nightreign-boss-dropdown-content');
	var bossSearch = document.getElementById('nightreign-boss-search');
	var bossList = document.getElementById('nightreign-boss-list');
	
	if (!bossDropdown || !bossTrigger || !bossValue || !bossDropdownContent || !bossSearch || !bossList) return;

	var selectedBoss = '';
	var isDropdownOpen = false;

	// Build unique boss options from Night 1 and Night 2 data rows only
	var bosses = [];
	dataRows.forEach(function (row) {
		var night = row.getAttribute('data-night') || '';
		var name = row.getAttribute('data-name') || '';
		if ((night === 'Night 1' || night === 'Night 2') && name && bosses.indexOf(name) === -1) {
			bosses.push(name);
		}
	});
	// Sort alphabetically
	bosses.sort();

	// Populate boss list
	bosses.forEach(function (boss) {
		var li = document.createElement('li');
		li.className = 'nightreign-boss-option';
		li.setAttribute('role', 'option');
		li.setAttribute('data-value', boss);
		li.textContent = boss;
		bossList.appendChild(li);
	});

	var allOptions = bossList.querySelectorAll('.nightreign-boss-option');

	// Filter options based on search input
	function filterBossOptions() {
		var searchValue = bossSearch.value.toLowerCase();
		allOptions.forEach(function (option) {
			var optionText = option.textContent.toLowerCase();
			var matches = optionText.indexOf(searchValue) !== -1;
			option.style.display = matches ? '' : 'none';
		});
	}

	// Update displayed value
	function updateBossDisplay() {
		bossValue.textContent = selectedBoss || 'All';
		bossTrigger.setAttribute('aria-expanded', isDropdownOpen ? 'true' : 'false');
	}

	// Open dropdown
	function openDropdown() {
		isDropdownOpen = true;
		bossDropdownContent.classList.add('open');
		bossSearch.value = '';
		filterBossOptions();
		updateBossDisplay();
		setTimeout(function () {
			bossSearch.focus();
		}, 10);
	}

	// Close dropdown
	function closeDropdown() {
		isDropdownOpen = false;
		bossDropdownContent.classList.remove('open');
		bossSearch.value = '';
		filterBossOptions();
		updateBossDisplay();
	}

	// Select a boss option
	function selectBoss(value) {
		selectedBoss = value;
		closeDropdown();
		filter();
	}

	// Toggle dropdown on trigger click
	bossTrigger.addEventListener('click', function (e) {
		e.stopPropagation();
		if (isDropdownOpen) {
			closeDropdown();
		} else {
			openDropdown();
		}
	});

	// Filter options as user types
	bossSearch.addEventListener('input', filterBossOptions);

	// Handle option clicks
	allOptions.forEach(function (option) {
		option.addEventListener('click', function () {
			var value = option.getAttribute('data-value') || '';
			selectBoss(value);
		});
	});

	// Close dropdown on outside click
	document.addEventListener('click', function (e) {
		if (isDropdownOpen && !bossDropdown.contains(e.target)) {
			closeDropdown();
		}
	});

	// Close dropdown on Escape key
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && isDropdownOpen) {
			closeDropdown();
			bossTrigger.focus();
		}
	});

	// Handle keyboard navigation in search
	bossSearch.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') {
			var firstVisible = Array.from(allOptions).find(function (opt) {
				return opt.style.display !== 'none';
			});
			if (firstVisible) {
				var value = firstVisible.getAttribute('data-value') || '';
				selectBoss(value);
			}
		}
	});

	function filter() {
		var nightlordValue = select.value;
		var groupToShow = null;
		if (selectedBoss) {
			var selectedRow = Array.from(dataRows).find(function (row) {
				return row.getAttribute('data-name') === selectedBoss;
			});
			if (selectedRow) {
				groupToShow = selectedRow.getAttribute('data-group') || null;
			}
		}
		dataRows.forEach(function (row) {
			var nightlord = row.getAttribute('data-nightlord') || '';
			var name = row.getAttribute('data-name') || '';
			var group = row.getAttribute('data-group') || null;
			
			var nightlordMatch = nightlordValue === '' || nightlord === nightlordValue;
			var bossMatch = selectedBoss === '' ||
				name === selectedBoss ||
				(groupToShow && group === groupToShow);
			
			var show = nightlordMatch && bossMatch;
			row.classList.toggle('hidden', !show);
		});
		// Show a section header only if at least one visible data row has that nightlord + night
		headerRows.forEach(function (headerRow) {
			var headerNightlord = headerRow.getAttribute('data-nightlord') || '';
			var headerNight = headerRow.getAttribute('data-night') || '';
			var nightlordMatch = nightlordValue === '' || headerNightlord === nightlordValue;
			if (!nightlordMatch) {
				headerRow.classList.add('hidden');
				return;
			}
			var hasVisibleInGroup = false;
			dataRows.forEach(function (row) {
				if (row.getAttribute('data-nightlord') === headerNightlord &&
					row.getAttribute('data-night') === headerNight &&
					!hasHiddenClass(row)) {
					hasVisibleInGroup = true;
				}
			});
			headerRow.classList.toggle('hidden', !hasVisibleInGroup);
		});
		// Hide a section header if the previous visible row has the same night label (e.g. one "Night 2" when filtering to one boss)
		var lastNight = null;
		allRows.forEach(function (row) {
			if (isHeaderRow(row)) {
				if (!hasHiddenClass(row)) {
					var headerNight = row.getAttribute('data-night') || '';
					if (lastNight === headerNight) {
						row.classList.add('hidden');
					} else {
						lastNight = headerNight;
					}
				}
			} else {
				if (!hasHiddenClass(row)) {
					lastNight = row.getAttribute('data-night') || '';
				}
			}
		});
	}

	select.addEventListener('change', filter);
	// Run filter once so initial view (including section headers) is correct on first paint
	filter();
})();
