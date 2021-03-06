var MANIFEST = browser.runtime.getManifest();

$('version').textContent = MANIFEST.version;
$('source').setAttribute('href', MANIFEST.homepage_url);

var $powerButton   = $('power-button');
var $filterSearch  = $('searchbar');
//var $filterSort    = $('sort-filters');
//var $filterResults = $('search-results');
var $filterTable   = $(document.querySelector('#filters>tbody'));

var Popup = {
	title: document.title,
	getSearch: function () {
		return $filterSearch.value;
	},
	cacheFilters: function (filters) {
		for (var ID in filters) {
			Filters[ID] = new Filter(filters[ID]);
		}
	},
	main: function (data) {
		Popup.cacheFilters(data.filters);
		$filterTable.removeChildren();
		for (var ID in Filters) {
			$filterTable.append(Popup.createTableRow(Filters[ID]));
		}
		if (!$filterTable.firstElementChild) {
			// table is empty
			$filterTable.append(Popup.createTableRow());
		}
		if (data.options) {
			Popup.updateToggle(data.options.enabled);
		}
	},
	search: function (query) {
		var matches = [];
		$filterTable.childElements().forEach(function ($row) {
			var name = $row.querySelector('span.text').textContent.toLowerCase();
			var id   = $row.getAttribute('id');
			if (!query || name.indexOf(query) > -1) {
				$row.show();
				matches.push(id);
			} else {
				$row.hide();
			}
		});
		return matches;
	},
	updateSearchResults: function () {
		var matches = Popup.search(Popup.getSearch().toLowerCase());
		/*
		if (matches) {
			$filterResults.textContent = matches.length;
			$filterResults.parentElement.show();
		} else {
			$filterResults.parentElement.hide();
		}
		*/
	},
	sort: function () {
		var sortByKey = $filterSort.value;
		var _keys = Object.keys(Filters).sort(function (ID1, ID2) {
			var val1, val2;
			if (sortByKey == 'size') {
				val1 = Filters[ID1].size();
				val2 = Filters[ID2].size();
			} else {
				val1 = Filters[ID1][sortByKey];
				val2 = Filters[ID2][sortByKey];
			}
			return (val1 > val2) ? 1 : (val1 < val2) ? -1 : 0;
		});
		var _Filters = {};
		_keys.forEach(function (ID) {
			_Filters[ID] = Filters[ID];
		});
		Popup.apply({filters: _Filters});
	},
	updateToggle: function (enabled) {
		if (enabled) {
			$('power-button').removeClassName('disabled');
		} else {
			$('power-button').addClassName('disabled');
		}
	},
	createTableRow: function (filter) {
		var $nameColumn    = html('td');
		var $enabledColumn = html('td');
		var $optionsColumn = html('td');
		var $row = html('tr', {}, [$nameColumn, $enabledColumn, $optionsColumn]).addClassName('row');
		if (filter) {
			var $tag = filter.createTag()
			.whenClicked(function (e) {
				filter.edit();
			});
			var $enable = Switch('round', filter.options.active || undefined)
			.whenChanged(function (e) {
				Popup.toggle(filter.id);
				$tag.toggleClassName('disabled');
			});
			$enable.setAttribute('title', i18n.get('popupToggleFilter', [filter.name]));
			
			var $remove = html('button', {}, '✖')
			.addClassName('remove')
			.addClassName('red')
			.whenClicked(function (e) {
				Popup.delete(filter.id);
				$row.remove();
			});
			$remove.setAttribute('title', i18n.get('popupRemoveFilter', [filter.name]));
			
			$nameColumn.appendChild($tag);
			$enabledColumn.appendChild($enable);
			$optionsColumn.appendChild($remove);
		} else {
			var $placeholder = html('tr', {'colspan': 3}, i18n.get('filtersPlaceholder')).addClassName('grey');
			$nameColumn.appendChild($placeholder);
		}
		return $row;
	},
	toggleApp: function () {
		Messenger.send('runtime', 'toggle-app');
		$powerButton.toggleClassName('disabled');
	},
	toggle: function (ID) {
		Messenger.send('runtime', 'toggle-filter', ID);
	},
	'delete': function (ID) {
		var name = Filters[ID].name;
		if (confirm(i18n.get('confirmDelete', [name]))) {
			Messenger.send('runtime', 'delete-filter', ID);
		}
	},
	editor: function () {
		window.open(browser.runtime.getURL('editor.html'), '_blank');
	},
	list: function () {
		window.open(browser.runtime.getURL('master-list.html'), '_blank');
	},
	options: function () {
		window.open(browser.runtime.getURL('options.html'), '_blank');
	}
};

$powerButton.whenClicked(Popup.toggleApp);
$('new-filter').whenClicked(Popup.editor);
$('master-list').whenClicked(Popup.list);
$('open-options').whenClicked(Popup.options);
$filterSearch.whenKeyPressed(Popup.updateSearchResults);
//$filterSort.whenChanged(Popup.sort);

Messenger.context = 'runtime';
Messenger.addListener('apply-reply', Popup.main);
Messenger.send('runtime', 'apply');

i18n.localizeDocument();

