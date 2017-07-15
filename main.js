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
const attrToPercent = {
0:{'Crit':5,'perCrit':400,'Haste':0,'perHaste':375,'Mastery':8,'perMastery':712,'Versatility':0,'perVersatility':475},
63:{'Crit':20,'Mastery':6,'perMastery':533.1}
};

var PlayerList = new Array();

function initialize() {
	PlayerList = new Array();
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
        if(typeof(href)=="undefined"){
        	return;
        }
        player.logID = href.match(regex)[1];
        player.fightID = href.match(regex)[2];

        PlayerList.push(player);
    });
}

function loadPlayerSummary(index){
	console.log('https://www.warcraftlogs.com/reports/summary/' + PlayerList[index].logID + '/' + PlayerList[index].fightID + '/' + PlayerList[index].timestamp + '/' + (PlayerList[index].timestamp + 3000) + '/' + PlayerList[index].sourceID + '/0/Any/0/-1.0.-1/0')
    $.ajax({
        type: 'GET',
        url: 'https://www.warcraftlogs.com/reports/summary/' + PlayerList[index].logID + '/' + PlayerList[index].fightID + '/' + PlayerList[index].timestamp + '/' + (PlayerList[index].timestamp + 3000) + '/' + PlayerList[index].sourceID + '/0/Any/0/-1.0.-1/0',
        dataType: 'text',
        success: function(data) {
            callback_playersummary(data, index);
        }
    });
}

function callback_playersummary(data,index){
	var summary=new Array();
	//while((str2=rx.exec(k))!=null){console.log(str2);console.log(str2[3]);}
	console.log(index+"loaded");
	var regex_attr=/<span class="composition-entry">([a-zA-Z]+): <span class=estimate><span class=estimate>([0-9\,]+)<\/span>/g;
	while((stat=regex_attr.exec(data))!=null)
	{
		switch(stat[1])
		{
			case 'Strength':
			case 'Agility':
			case 'Intellect':
				summary['MainStat']=stat[2];
				break;
			case 'Crit':
				summary['Crit']=stat[2];
				break;
			case 'Haste':
				summary['Haste']=stat[2];
				break;
			case 'Mastery':
				summary['Mastery']=stat[2];
				break;
			case 'Versatility':
				summary['Versatility']=stat[2];
				break;
			case 'Stamina':
				break;
			default:
				//console.log(stat[1]);
				break;
		}
	}
	//var regex_trait=/<a target="_new" href="\/\/www.wowhead.com\/spell=[0-9]+\?rank=([0-9]+)"[^<]+<img[^>]+><span id="artifact\-ability\-([0-9]+)\-0" class="school\-1" style="">([^<]+)<\/span>/g;
	var regex_trait=/<a target="_new" href="\/\/www.wowhead.com\/spell=([0-9]+)\?rank=[0-9]"[^<]+<img src="([^"]+)"[^<]+<span[^<]+<\/span[^<]+<\/a[^<]+<td class="primary rank">([0-9]+)<\/td[^<]+<\/tr>/g;
	//Concordance of the Legionfall
	var relicnum=0;
	while((trait=regex_trait.exec(data))!=null)
	{
		if(trait[3]>4 && trait[1]!=239042){ // spell 239042 Concordance of the Legionfall
			while(trait[3]>4){
				trait[3]--;
				relicnum++;
				summary['relic'+relicnum]={'spellid':trait[1],'img':trait[2]};
			}
		}
		if(trait[1]==239042){
			summary['legionfall_level']=trait[3];
		}
	}
	var regex_item=/<td class="primary rank">([0-9]+)<\/td[^<]+<td nowrap class="num">(Trinket|Weapon)<td [^<]+<a target="_new" href="\/\/legion.wowhead.com\/item=([0-9]+)" rel="bonus=([0-9:]+);"/g;
	var trinketnum=0;
	while((item=regex_item.exec(data))!=null)
	{
		if(item[2]=='Trinket'){
			trinketnum++;
			summary['Trinket'+trinketnum]={ 'id':item[3],'level':item[1],'bonus':item[3] };
		}else{
			summary['WeaponLevel']=item[1];
		}
	}
	console.log(summary);
}

function loadFights(index) {
    $.ajax({
        type: 'GET',
        url: 'https://www.warcraftlogs.com/reports/fights_and_participants/' + PlayerList[index].logID + '/0',
        dataType: 'json',
        success: function(data) {
            //console.log(index);
            callback_fights(data, index);
        }
    });
}

function loadStats(rowID, logID, fightID, timestamp, sourceID) {
    $.ajax({
        type: 'GET',
        url: 'https://www.warcraftlogs.com/reports/summary_events/' + logID + '/' + fightID + '/' + timestamp + '/' + (timestamp + 3000) + '/' + sourceID + '/0/Any/0/-1.0.-1/0',
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

    //loadStats(PlayerList[idx].rowID, PlayerList[idx].logID, PlayerList[idx].fightID, PlayerList[idx].timestamp, PlayerList[idx].sourceID);
	loadPlayerSummary(idx);
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
        //console.log('delay');
        setTimeout(delayLoadAttributes, 1000);
    } else {
        loadAttributes();
    }
}

delayLoadAttributes();
