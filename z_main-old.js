// main.js

(function () {

	// config
	var MAP = [
		{
			raw: 'Date',
			key: 'date',
			clean: function (value) {
				return value;
			},
			format: function (value) {
				return value;
			}
		},
		{
			raw: 'Transaction Description',
			key: 'transactionDescription',
			clean: function (value) {
				return value;
			},
			format: function (value) {
				return value;
			}
		},
		{
			raw: 'Amount',
			key: 'amount',
			clean: function (value) {
				if (value === undefined) {
					return 0.00;
				}

				var num = value;

				if (typeof num === 'string') {
					num = parseFloat(value.replace('$',''));
				}

				return num;
			},
			format: function (value) {
				value = Math.round((value + 0.00001) * 100) / 100;
				value = value.toFixed(2);
				return (value < 0) ? '-$' + value.toString().slice(1,value.length) : '$'+value;
			}
		},
		{
			raw: 'Category',
			key: 'category',
			clean: function (value) {
				return value;
			},
			format: function (value) {
				return value;
			}
		}
	];
	var DEBUG = true;

	// app variables
	var DATA = [];

	function init () {
		$('#parse').on('click', parse);
		$('#clear').on('click', clear);
	}

	function parse () {
		var $fileInput = $('input[type=file]');

		if ($fileInput.val()) {
			$fileInput.parse({
				config: {
					header: true,
					complete: onParseComplete,
					skipEmptyLines: true
				},
				error : onParseError
			});
		}

		else alert('No file selected.');
	}

	function onParseError (err, file, inputElem, reason) {
		alert('There was an error parsing: ' + reason);
	}

	function clear () {
		var $fileInput = $('input[type=file]');

		if ($fileInput && $fileInput[0].value) {
			$fileInput[0].value = '';
		}

		var $categories = $('#categories');

		if ($categories.length) {
			$categories.empty();
		}
	}

	function withdrawalsOnly () {
		return $('#withdrawals-only').is(':checked');
	}

	function onParseComplete (results) {
		if (DEBUG) console.log(results);

		cleanData(results.data);
		makeCategoryTables();
		sumCategories();
	}

	function cleanData (resultData) {
		resultData.forEach(function (row) {

			if (DEBUG) console.log(row);

			var o = {};
			MAP.forEach(function (map) {
				o[map.key] = map.clean(row[map.raw]);
			});
			DATA.push(o);

		});

		if (withdrawalsOnly()) {
			DATA = DATA.filter(d => d.transactionDescription.toLowerCase().indexOf('withdrawal') > -1);
		}

		if (DEBUG) console.log("DATA", DATA);
	}

	function makeCategoryTables () {
		var categories = [];

		DATA.forEach(function (row) {
			var category = row.category;

			if (categories.indexOf(category) === -1) {
				if (category !== undefined) {
					categories.push(category);
				}
			}
		});

		categories.sort();

		categories.forEach(function (category) {
			var tableData = [];

			DATA.forEach(function (row) {
				if (row.category === category) {
					tableData.push(row);
				}
			});

			// default sort by date
			tableData.sort(function (a,b) {
				var DateA = new Date(a.date.trim());
				var DateB = new Date(b.date.trim());
				if (DateA < DateB) return -1;
				if (DateA > DateB) return 1;
				return 0;
			});

			$('#categories').append(makeCategoryTable(tableData, category));
		});
	}

	function makeCategoryTable (tableData, category) {
		var table = document.createElement('table');
		var thead = document.createElement('thead');
		var tbody = document.createElement('tbody');

		var theadRow = document.createElement('tr');

		MAP.forEach(function(map) {
			var th = document.createElement('th');
			th.textContent = map.raw;
			theadRow.appendChild(th);
		});

		thead.appendChild(theadRow);

		var theadRow = document.createElement('tr');
		var filter = document.createElement('input');
		var filterLabel = document.createElement('label');

		filter.setAttribute('type', 'text');
		filter.className = 'description-filter';
		filter.setAttribute('placeholder', 'Filter descriptions...');

		filterLabel.textContent = 'Filter';
		filterLabel.appendChild(filter);

		theadRow.appendChild(document.createElement('th'));
		theadRow.appendChild(filterLabel);
		theadRow.appendChild(document.createElement('th'));
		theadRow.appendChild(document.createElement('th'));

		thead.appendChild(theadRow);

	    tableData.forEach(function (datum) {
	    	var row = document.createElement('tr');

	    	MAP.forEach(function (map) {
	    		var cell = document.createElement('td');
	    		cell.textContent = map.format(datum[map.key]);
	    		cell.className = map.raw.toLowerCase().split(' ').join('-');
	    		row.appendChild(cell);
	    	});

	    	tbody.appendChild(row);
	    });

	    table.appendChild(thead);
	    table.appendChild(tbody);
	    table.className = 'category category-' + category.toLowerCase().split(' ').join('-');
	    table.setAttribute('data-category', category);

	    return table;
	}

	function sumCategories () {
		$('table[data-category]').each(function () {
			var $table = $(this);
			var category = $table.data('category');
			var sum = 0.00;

			sum = DATA.filter(d => d.category === category)
				.map(d => d.amount)
				.reduce((a,b) => a + b, sum);

			sum = MAP.filter(m => m.key === 'amount')[0].format(sum);

			$table.before($('<h2></h2>').text(category), $('<h3></h3>').text(sum));
		});
	}

	$(document).ready(init);

})();
