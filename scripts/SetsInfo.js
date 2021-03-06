// Creating a minimized set info file

// Loading sets
var fs = require('fs');
var sets = require('../db/AllSets.json');

// Main Loop
for(var set in sets){
	sets[set]['nb_cards'] = sets[set].cards.length
	delete sets[set].cards;
}

// Writing in file
fs.writeFileSync('./db/SetInfos.json', JSON.stringify(sets));