// ==UserScript==
// @name         Warcraft Logs Enhancement
// @namespace    https://github.com/icyblade/warcraftlogs_enhancement
// @version      0.1
// @description  Some Enhancement Scripts of Warcraft Logs
// @author       swqsldz, kingofpowers, icyblade
// @match        https://www.warcraftlogs.com/*
// @run-at       document-idle
// ==/UserScript==

var attributes = ['Crit', 'Haste', 'Mastery', 'Versatility'];

for (let i = 0; i < attributes.length; i++) {
    $('<th class="sorting ui-state-default">'+attributes[i]+'</th>').insertBefore('th.zmdi.zmdi-flag.sorting.ui-state-default');
    $('<td class="attr-'+attributes[i]+'"></td>').insertAfter('td.unique-gear');
}
