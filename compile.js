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

	function parseCommands (values, vars) {
		function _col (val) {
			var td = document.createElement('td');
			td.appendChild(document.createTextNode(val));
			return td;
		}
		var fragment = document.createDocumentFragment();
		for (var key in values) {
			var tmp = ('' + values[key]).split('<>');
			tmp.forEach(function (elem, i, arr) {
				if (elem in vars)
					arr[i] = vars[elem];
			});
			values[key] = tmp;
		}
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
	    setMaking = null,
		forCircle = null,
		circle = [];
	conf.getHeader();

	function valuesToCommand (values, vars, strNum, endCircle) {
		var command = values.command,
		    value = values.value || '';
		if (!command)
			return;
		if (SETS[command]) {
			var set = SETS[command].cloneNode(true);
			if (forCircle && !endCircle) {
				var tmp = set.firstChild;
				while (tmp && tmp.children) {
					circle.push({
						command: tmp.children[0].firstChild.data || '',
						value: tmp.children[1].firstChild.data || '',
						expect: tmp.children[2].firstChild.data || ''
					});
					tmp = tmp.nextSibling;
				}
			} else if (setMaking) {
				SETS[setMaking].appendChild(set);
			} else {
				tbody.appendChild(set);
			}
		} else {
			switch (command) {
				case 'title': setTitle(value); break;
				case 'href': link.setAttribute('href', value); break;
				case 'forCircle':
					if (forCircle)
						throw "Str " + strNum + ": Incorrectstructure: trying start forCircle while not finished one.";
					forCircle = [];
					var r = /(?:\([^()]*\))/g,
					    res;
					while ((res = r.exec(value))) {
						var tmp = res[0].split('<>');
						tmp[0] = tmp[0].substr(1);
						tmp[tmp.length - 1] = tmp[tmp.length - 1].substr(0, tmp[tmp.length - 1].length - 1);
						forCircle.push(tmp);
					}
					break;
				case 'endForCircle':
					if (!forCircle)
						throw "Str " + strNum + ": Incorrect structure: trying finish unstarted forCircle.";
					var varList = forCircle[0],
					    valength = varList.length,
					    vars = {};
					for (var i = 1, f = forCircle.length; i < f; ++i) {
						var elem = forCircle[i];
						for (var j = 0; j < valength; ++j)
							vars[varList[j]] = elem[j];
						for (var j = 0, l = circle.length; j < l; ++j) {
							var tmp = circle[j],
							    elem = {};
							for (var key in tmp)
								elem[key] = tmp[key];
							valuesToCommand(elem, vars, strNum, true);
						}
					}
					forCircle = null;
					circle = [];
					break;
				case 'startSet':
					if (setMaking)
						throw "Str " + strNum + ": Incorrect structure: trying start set while not finished one.";
					if (SETS[value])
						throw "Str " + strNum + ": Set name " + value + " already exists.";
					setMaking = value;
					SETS[value] = document.createDocumentFragment();
					break;
				case 'endSet':
					if (!setMaking)
						throw "Str " + strNum + ": Incorrect structure: trying finish unstarted set.";
					setMaking = null;
					break;
				default:
					if(forCircle && !endCircle) {
						circle.push(values);
					} else {
					values = parseCommands(values, vars);
						if (setMaking)
							SETS[setMaking].appendChild(values); 
						else
							tbody.appendChild(values);
					}
			}
		}
	}

	while (values = conf.getValues(i)) {
			valuesToCommand(values, {}, i++, false);
	}
	document.drawDocument([path.replace(/\.\w*/, ''), 'html'].join('.'), 'selenium', true);
})()