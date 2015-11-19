#!/usr/bin/env node

(function () {
	"use strict";
	var path = require('optManager').getopt.create([]).parseSystem().argv[0];
	var lio = require('lio').getLIO([
		{
			type: 'input',
			path: path,
			name: 'conf',
			delimeter: '\t'
		}
	]);
	var DOM = require('nodeDOM');

	var DOM = new DOM(),
	    document = DOM.createHTMLDocument('', DOM.createDocumentType('html', '-//W3C//DTD XHTML 1.0 Strict//EN', 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd')),
	    html = document.documentElement,
	    link = document.createElement('link');

	html.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
	html.setAttribute('xml:lang', 'en');
	html.setAttribute('lang', 'en');
	document.head.setAttribute('profile', 'http://selenium-ide.openqa.org/profiles/test-case');
	document.getElementsByTagName('meta')[0].setAttribute('http-equiv', 'Content-Type');
	document.head.appendChild(link);
	link.setAttribute('rel', 'selenium.base');
	link.setAttribute('href', 'http://192.168.1.1/');

	var table = document.createElement('table'),
	    thead = document.createElement('thead'),
	    tbody = document.createElement('tbody'),
	    hrow = document.createElement('tr'),
	    htd = document.createElement('td');
	table.setAttribute('cellpadding', '1');
	table.setAttribute('cellspacing', '1');
	table.setAttribute('border', '1');
	table.appendChild(thead);
	table.appendChild(tbody);
	thead.appendChild(hrow);
	hrow.appendChild(htd);
	htd.setAttribute('rowspan', '1');
	htd.setAttribute('colspan', '3');
	

	function setTitle (title) {
		document.title = title;
		var c;
		while (c = htd.firstChild)
			htd.removeChild(c);
		htd.appendChild(document.createTextNode(document.title));
	}

	document.body.appendChild(table);

	function parseCommands (values) {
		function _col (val) {
			var td = document.createElement('td');
			td.appendChild(document.createTextNode(val));
			return td;
		}
		var fragment = document.createDocumentFragment();
		for (var key in values)
			values[key] = ('' + values[key]).split('<>');
		var commands = values.command || [''],
		    expects = values.expect || [''];
		values = values.value || [''];
		
		for (var c = 0, cl = commands.length; c < cl; ++c) {
			var command = commands[c];
			for (var v = 0, vl = values.length; v < vl; ++v) {
				var value = values[v],
				    tr = document.createElement('tr');
				tr.appendChild(_col(command));
				tr.appendChild(_col(value));
				tr.appendChild(_col(expects[c * vl + v] || ''));
				fragment.appendChild(tr);
			}
		}
		return fragment;
	}
	var conf = lio.conf,
	    i = 1,
	    values,
	    SETS = {},
	    setMaking = null;
	conf.getHeader();

	while (values = conf.getValues(i++)) {
		var command = values.command,
		    value = values.value || '';
		if (!command)
			continue;
		if (SETS[command]) {
			var set = SETS[command].cloneNode(true);
			if (setMaking)
				SETS[setMaking].appendChild(set);
			else
				tbody.appendChild(set);
		} else {
			switch (command) {
				case 'title': setTitle(value); break;
				case 'href': link.setAttribute('href', value); break;
				case 'startSet':
					if (setMaking)
						throw "Str " + i + ": Incorrect structure: trying start set while not finished one.";
					if (SETS[value])
						throw "Str " + i + ": Set name " + value + " already exists.";
					setMaking = value;
					SETS[value] = document.createDocumentFragment();
					break;
				case 'endSet':
					if (!setMaking)
						throw "Str " + i + ": Incorrect structure: trying finish unstarted set.";
					setMaking = null;
					break;
				default:
					values = parseCommands(values);
					if (setMaking)
						SETS[setMaking].appendChild(values);
					else
						tbody.appendChild(values);
			}
		}
	}
	document.drawDocument([path.replace(/\.\w*/, ''), 'html'].join('.'), 'selenium', true);
})()