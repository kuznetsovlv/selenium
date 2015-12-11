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
	var utils = require('utils');

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

	var conf = lio.conf,
	    i = 1,
	    values,
	    SETS = {},
	    setMaking = null,
		forLoop = null,
		loop = [];
	conf.getHeader();

	function objToCommandList (obj) {
		if (obj.command === 'forLoop')
			return [obj];
		for (var key in obj)
			obj[key] = ('' + obj[key]).split('<>');
		var commands = obj.command || [''],
		    expects = obj.expect || [''],
		    values = obj.value || [''],
		    list = [];
		for (var c = 0, cl = commands.length; c < cl; ++c) {
			var command = commands[c];
			for (var v = 0, vl = values.length; v < vl; ++v) {
				var value = values[v];
				list.push({command: command, value: value, expect: expects[c * vl + v] || ''});
			}
		}
		return list;
	}

	function parseLoop (loop) {
		var vars = loop.shift(),
		    list = [],
		    r = /(?:\([^()]*\))/g,
		    res;
		while ((res = r.exec(vars))) {
			var tmp = res[0].split('<>');
			tmp[0] = tmp[0].substr(1);
			tmp[tmp.length - 1] = tmp[tmp.length - 1].substr(0, tmp[tmp.length - 1].length - 1);
			list.push(tmp);
		}
		vars = [];
		var tmp = list[0];
		for (var i = 1, length = list.length; i < length; ++i) {
			var item = list[i],
			    obj = {};
			for (var j = 0, l = tmp.length; j < l; ++j)
				obj[tmp[j]] = item[j] || '';
			vars.push(obj);
		}

		var res = [];
		tmp = []
		for (var i = 0, length = loop.length; i < length; ++i) {
			var item = loop[i];
			if (item.command === 'forLoop') {
				var loops = 1, newLoop = [item.value];
				while (item = loop[++i]) {
					switch (item.command) {
						case 'forLoop': ++loops; break;
						case 'endForLoop': --loops; break;
					}
					if (!loops)
						break;
					newLoop.push(item);
				}
				item = parseLoop(newLoop);
			} else {
				item = objToCommandList(item);
			}
			for (var j = 0, l = item.length; j < l; ++j)
				tmp.push(item[j]);
		}

		for (var i = 0, length = vars.length; i < length; ++i) {
			var v = vars[i];
			for (var j = 0, l = tmp.length; j < l; ++j) {
				var item = utils.clone(tmp[j]);
				for (var key in item) {
					if (item[key] in v)
						item[key] = v[item[key]];
				}
				res.push(item);
			}
		}
		return res;
	}

	function toDOM (list) {
		function _col (val) {
			var td = document.createElement('td');
			td.appendChild(document.createTextNode(val));
			return td;
		}
		for (var i = 0, l = list.length; i < l; ++i) {
			var obj = list[i];
			if (SETS[obj.command]) {
				toDOM (SETS[obj.command]);
				continue;
			}
			switch (obj.command) {
				case 'endSet': throw "Incorrect structure: trying finish unstarted set in a loop.";
				case 'endForLoop': throw "Incorrect structure: trying finish unstarted forLoop in a set.";
				case 'forLoop':
					var loops = 1, loop = [obj.value];
					while (obj = list[++i]) {
						switch (obj.command) {
							case 'forLoop': ++loops; break;
							case 'endForLoop': --loops; break;
						}
						if (!loops)
							break;
						loop.push(obj);
					}
					if (loops)
						throw "Unclosed loop found!";
					toDOM(parseLoop(loop));
					break;
				default:
					if (!obj.command)
						continue;
					var tr = document.createElement('tr');
					tr.appendChild(_col(obj.command));
					tr.appendChild(_col(obj.value));
					tr.appendChild(_col(obj.expect || ''));
					tbody.appendChild(tr);
			}
		}
	}

	while (values = conf.getValues(i++)) {
		switch (values.command) {
			case 'title': setTitle(values.value); break;
			case 'href': link.setAttribute('href', values.value); break;
			case 'startSet':
				if (SETS[values.value])
					throw "Str " + i + ": Set name " + value + " already exists.";
				var set = [];
				SETS[values.value] = set;
				while ((values = conf.getValues(i++)) && (values.command !== 'endSet')) {
					if (values.command === 'startSet')
						throw "Str " + i + ": Incorrect structure: trying start set while not finished one.";
					values = objToCommandList(values);
					for (var j = 0, l = values.length; j < l; ++j)
						set.push(values[j]);
				}
				break;
			case 'endSet': throw "Str " + i + ": Incorrect structure: trying finish unstarted set.";
			case 'endForLoop': throw "Str " + i + ": Incorrect structure: trying finish unstarted forLoop.";
			case 'forLoop':
				var loops = 1, loop = [values.value];
				while (values = conf.getValues(i++)) {
					switch (values.command) {
						case 'forLoop': ++loops; break;
						case 'endForLoop': --loops; break;
					}
					if (!loops)
						break;
					loop.push(values);
				}
				if (loops)
					throw "Unclosed loop found!";
				toDOM(parseLoop(loop));
				break;
			default: toDOM(objToCommandList(values));
		}
	}
	document.drawDocument([path.replace(/\.\w*/, ''), 'html'].join('.'), 'selenium', true);
})()