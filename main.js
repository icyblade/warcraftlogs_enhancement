// ==UserScript==
// @name         Warcraft Logs Enhancement
// @namespace    https://github.com/icyblade/warcraftlogs_enhancement
// @version      0.1
// @description  Some Enhancement Scripts of Warcraft Logs
// @author       swqsldz, kingofpowers, icyblade
// @match        https://www.warcraftlogs.com/*
// @run-at       document-idle
// ==/UserScript==

var attributes = ['critSpell', 'hasteSpell', 'mastery', 'versatilityDamageDone'];

for (var i = attributes.length - 1; i >= 0; i--) {

    $('<th class="sorting ui-state-default">' + attributes[i] + '</th>').insertBefore('th.zmdi.zmdi-flag.sorting.ui-state-default');
}


for (var i = 0; i < attributes.length; i++) {
    $('<td class="attr-' + attributes[i] + '"></td>').insertAfter('td.unique-gear');
}


var regex = /\/reports\/([\S\s]+?)#fight=([0-9]+)/;


var PlayerList = new Array();

$('td.unique-gear').parent().each(function() {

    var player = new Object();

    player.tid = $(this).attr('id');
    player.name = $(this).find('.players-table-name .main-table-player').text();
    var href = $(this).find('.players-table-name .main-table-player').attr('href');

    player.logID = href.match(regex)[1];
    player.fightID = href.match(regex)[2];

    PlayerList.push(player);

});

function loadFights(index) {


    $.ajax({

        type: 'GET',
        url: 'https://www.warcraftlogs.com/reports/fights_and_participants/' + PlayerList[index].logID + '/0',
        dataType: 'json',

        success: function(data) {

            console.info(index);
            callback_fights(data, index);
        }


    });

}


function loadStats(tid, logID, fightID, timeStamp, sourceID) {

    $.ajax({

        type: 'GET',
        url: 'https://www.warcraftlogs.com/reports/summary_events/' + logID + '/' + fightID + '/' + timeStamp + '/' + (timeStamp + 3000) + '/' + sourceID + '/0/Any/0/-1.0.-1/0',
        dataType: 'json',

        success: function(data) {

            callback_stats(data, tid, logID, fightID, timeStamp, sourceID);
        }


    });
}

function callback_stats(data, tid, logID, fightID, timeStamp, sourceID) {

    for (var key in attributes) {
        try {

            $('#' + tid + ' .attr-' + attributes[key]).html(data.events[0][attributes[key]]);
        } catch (e) {

            console.info(e);
            console.info(tid);
            console.info(data);
        }
    }



}


function callback_fights(data, idx) {


    PlayerList[idx].fight = data;

    for (var j in PlayerList[idx].fight.friendlies) {
        if (PlayerList[idx].fight.friendlies[j].name == PlayerList[idx].name) {
            PlayerList[idx].sourceID = PlayerList[idx].fight.friendlies[j].id;
            break;
        }
    }

    for (var j in PlayerList[idx].fight.fights) {
        if (PlayerList[idx].fight.fights[j].id == PlayerList[idx].fightID) {
            PlayerList[idx].timeStamp = PlayerList[idx].fight.fights[j].start_time;
            break;
        }
    }

    loadStats(PlayerList[idx].tid, PlayerList[idx].logID, PlayerList[idx].fightID, PlayerList[idx].timeStamp, PlayerList[idx].sourceID);

    idx++;


    if (idx >= PlayerList.length) {
        console.info(PlayerList);
        return;
    }


    loadFights(idx);


}

loadFights(0);
