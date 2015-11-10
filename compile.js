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
		},
		{
			type: 'output',
			path: [path.replace(/\.\w*/, ''), 'html'].join('.'),
			name: 'output'
		}
	]);
	function toHTML (obj, tag, t) {
		var tabs = '',
		    end = '</' + tag + '>';
		for (var i = 0; i < t; ++i)
			tabs += '\t';
		var line = '<' + tag;
		for (var key in obj) {
			if (key === 'text')
				continue;
			var v = obj[key];
			if (typeof v === 'object')
				continue;
			line += (' ' + key + '="' + v + '"');
			delete obj[key];
		}
		if (!Object.keys(obj).length)
			return output.printLine(tabs + line + '/>');
		line += '>';
		if ('text' in obj && typeof obj.text !== 'object') {
			line += obj.text;
			delete obj.text;
		}
		if (!Object.keys(obj).length)
			return output.printLine(tabs + line + end);
		output.printLine(tabs + line);
		for (var key in obj) {
			var v = obj[key],
			    _t = key === 'td' ? t + 1 : t;
			if (v instanceof Array)
				for (var i = 0, l = v.length; i < l; ++i)
					toHTML(v[i], key, _t);
			else
				toHTML(v, key, _t);
		}
		output.printLine(tabs + end);
	}
	function parseCommands (values) {
		var cmds = [];
		for (var key in values)
			values[key] = ('' + values[key]).split('<>');
		var commands = values.command || [''],
		    expects = values.expect || [''];
		values = values.value || [''];
		for (var c = 0, cl = commands.length; c < cl; ++c) {
			var command = commands[c];
			for (var v = 0, vl = values.length; v < vl; ++v) {
				var value = values[v];
				for (var e = 0, el = expects.length; e < el; ++e) {
					cmds.push({td: [{text: command}, {text: value}, {text: expects[e]}]});
				}
			}
		}
		return cmds;
	}
	var html = {
		xmlns: "http://www.w3.org/1999/xhtml",
		'xml:lang': "en",
		lang: "en",
		head: {
			profile: "http://selenium-ide.openqa.org/profiles/test-case",
			meta: {'http-equiv': "Content-Type", content: "text/html; charset=UTF-8"},
			link: {rel: "selenium.base", href: "http://192.168.1.1"},
			title: {text: ""}
		},
		body: {
			table: {
				cellpadding: 1,
				cellspacing: 1,
				border: 1,
				thead: {
					tr: {
						td: {
							rowspan: 1,
							colspan: 3
						}
					}
				},
				tbody: {
					tr: []
				}
			}
		}
	};
	var conf = lio.conf,
	    i = 1,
	    values,
	    output = lio.output,
	    tr = [];
	output.printLine('<?xml version="1.0" encoding="UTF-8"?>');
	output.printLine('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">');
	conf.getHeader();

	while (values = conf.getValues(i++)) {
		var value = values.value || '';
		switch (values.command) {
			case 'title': html.head.title.text = value; html.body.table.thead.tr.td.text = value; break;
			case 'href': html.head.link.href = value; break;
			default: tr = tr.concat(parseCommands(values));//tr.push({td: [{text: command}, {text: value}, {text: expect}]});
		}
	}
	html.body.table.tbody.tr = tr;
	toHTML(html, 'html', 0);
})()