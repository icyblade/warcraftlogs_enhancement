// ==UserScript==
// @name         Warcraft Logs Enhancement
// @namespace    https://github.com/icyblade/warcraftlogs_enhancement
// @version      0.2
// @description  Some Enhancement Scripts of Warcraft Logs
// @author       swqsldz, kingofpowers, icyblade
// @match        https://*.warcraftlogs.com/*
// @run-at       document-idle
// ==/UserScript==
const attributes = ['critSpell', 'hasteSpell', 'mastery', 'versatilityDamageDone'];
const columnNames = ['Crit', 'Haste', 'Mastery', 'Versatility'];
const regex = /\/reports\/([\S\s]+?)#fight=([0-9]+)/;
const HOST = 'https://' + window.location.hostname;

var PlayerList = new Array();

function initialize() {
    // initialize attribute columns
    for (let i = 0; i < attributes.length; i++) {
        $('<th class="sorting ui-state-default">' + columnNames[i] + '</th>').insertBefore('th.zmdi.zmdi-flag.sorting.ui-state-default');
    }
    for (let i = 0; i < attributes.length; i++) {
        $('<td class="attr-' + attributes[i] + '"></td>').insertBefore('td.zmdi.zmdi-flag');
    }

    // extract fights from ranking page
    $('td.unique-gear').parent().each(function() {
        var player = new Object();

        player.rowID = $(this).attr('id');
        player.name = $(this).find('.players-table-name .main-table-player').text();

        var href = $(this).find('.players-table-name .main-table-player').attr('href');
        if (typeof(href) == 'undefined') {
        	return;
        }
        player.logID = href.match(regex)[1];
        player.fightID = href.match(regex)[2];

        PlayerList.push(player);
    });
}

function loadFights(index) {
    $.ajax({
        type: 'GET',
        url: HOST + '/reports/fights_and_participants/' + PlayerList[index].logID + '/0',
        dataType: 'json',
        success: function(data) {
            console.log(index);
            callback_fights(data, index);
        }
    });
}

function loadStats(rowID, logID, fightID, timestamp, sourceID) {
    $.ajax({
        type: 'GET',
        url: HOST + '/reports/summary_events/' + logID + '/' + fightID + '/' + timestamp + '/' + (timestamp + 3000) + '/' + sourceID + '/0/Any/0/-1.0.-1/0',
        dataType: 'json',
        success: function(data) {
            callback_stats(data, rowID, logID, fightID, timestamp, sourceID);
        }
    });
}

function callback_stats(data, rowID, logID, fightID, timestamp, sourceID) {
    for (var key in attributes) {
        try {
            $('#' + rowID + ' .attr-' + attributes[key]).html(data.events[0][attributes[key]]);
        } catch (e) {
            console.error(e);
            console.error(rowID);
            console.error(data);
        }
    }
}

function callback_fights(data, idx) {
    PlayerList[idx].fight = data;

    for (let j in PlayerList[idx].fight.friendlies) {
        if (PlayerList[idx].fight.friendlies[j].name == PlayerList[idx].name) {
            PlayerList[idx].sourceID = PlayerList[idx].fight.friendlies[j].id;
            break;
        }
    }

    for (let j in PlayerList[idx].fight.fights) {
        if (PlayerList[idx].fight.fights[j].id == PlayerList[idx].fightID) {
            PlayerList[idx].timestamp = PlayerList[idx].fight.fights[j].start_time;
            break;
        }
    }

    loadStats(PlayerList[idx].rowID, PlayerList[idx].logID, PlayerList[idx].fightID, PlayerList[idx].timestamp, PlayerList[idx].sourceID);

    idx++;

    if (idx >= PlayerList.length) {
        console.log(PlayerList);
        return;
    }

    loadFights(idx);
}

function loadAttributes() {
    initialize();
    loadFights(0);
}

function delayLoadAttributes() {
    if ($('.ranking-table tr:eq(1)').length === 0) {
        console.log('delay');
        setTimeout(delayLoadAttributes, 1000);
    } else {
        loadAttributes();
    }
}

delayLoadAttributes();
