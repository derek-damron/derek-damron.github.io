(function () {
	var select = document.getElementById('nightreign-nightlord');
	var table = document.querySelector('.nightreign-table');
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

	// Build unique boss options from NIGHT 1 and NIGHT 2 data rows only
	var bosses = [];
	dataRows.forEach(function (row) {
		var night = row.getAttribute('data-night') || '';
		var name = row.getAttribute('data-name') || '';
		if ((night === 'NIGHT 1' || night === 'NIGHT 2') && name && bosses.indexOf(name) === -1) {
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
		dataRows.forEach(function (row) {
			var nightlord = row.getAttribute('data-nightlord') || '';
			var name = row.getAttribute('data-name') || '';
			
			var nightlordMatch = nightlordValue === '' || nightlord === nightlordValue;
			var bossMatch = selectedBoss === '' || name === selectedBoss;
			
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

	// Protanopia-friendly colors toggle (persisted in localStorage)
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
})();
