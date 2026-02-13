(function () {
	var select = document.getElementById('nightreign-nightlord');
	var table = document.querySelector('.nightreign-table');
	if (!select || !table) return;

	var tbody = table.querySelector('tbody');
	var rows = tbody ? tbody.querySelectorAll('tr') : [];

	// Build unique nightlord options from row data
	var nightlords = [];
	rows.forEach(function (row) {
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

	function filter() {
		var value = select.value;
		rows.forEach(function (row) {
			var nightlord = row.getAttribute('data-nightlord') || '';
			var show = value === '' || nightlord === value;
			row.classList.toggle('hidden', !show);
		});
	}

	select.addEventListener('change', filter);
	// Do not run filter() on load – table stays hidden until user selects a value
})();
