'use strict';

const request = require('request');

const STATE_TREE = {
	"INITIAL_MESSAGE": {
		"message": "You're in a room. You see a key next to a door. Do you pick it up or open the door?",
		"options": [
			{ text: "Pick up the key", payload: "KEY" },
			{ text: "Open the door", payload: "DOOR" },
			
		]
	},
	"KEY": {
		"message": "You pick up the key.",
		"inventory": "Key",
		"options": [
			{ text: "Continue", payload: "AFTERKEY" },
		]
	},
	"AFTERKEY": {
		"message": "You're in a room. Do you open the door?",
		"options": [
			{ text: "Open the door", payload: "DOOR" },
		]
	},
	"DOOR": {
		"message": "The door is locked.",
		"options": [
			{ text: "Continue", payload: "INITIAL_MESSAGE" },
			{ text: "Use the key", payload: "DOOROPEN", require: "Key" },
		]
	},
	"DOOROPEN": {
		"message": "The door opens...",
		"options": [
			{ text: "Restart", payload: "INITIAL_MESSAGE" }
		]
	}
}

var SENDER_STATES = [];
var INVENTORIES = [];

class Game {

	getColor(appFBID, callback) {

		// Get from https://developers.facebook.com/tools/explorer/
		var appAccessToken = '295913870821880|wZ0-d9Vlqy83egpH-lxtLmyqpAs';

		request(
			`https://graph.facebook.com/v2.9/${appFBID}/ids_for_pages?page=302357206851919&access_token=${appAccessToken}`,
			(error, response, body) => {
				var data = JSON.parse(body).data;
				if (data.length > 0) {
					var pageID = data[0].id;
					callback(null, SENDER_STATES[pageID]);
				} else {
					callback('Error, no matched ID found');
				}
			}
		);

	}

	processPayload(senderID, payload, callback) {

		console.log(`payload = ${payload}`);

		SENDER_STATES[senderID] = payload;
		
		if (INVENTORIES[senderID] == null) INVENTORIES[senderID] = [];

		var state = STATE_TREE[payload];
		var buttons = state.options
		.filter(option => option.require == null || INVENTORIES[senderID].indexOf(option.require) >= 0)
		.map(option => ({
			title: option.text,
			payload: option.payload,
			type: 'postback'
		}));
		
		if (state.inventory != null) {
			INVENTORIES[senderID].push(state.inventory);
			console.log('Added to inventory: ' + state.inventory);
		}

		callback({
		    recipient: {
		      	id: senderID
		    },
		    message: {
		    	attachment: {
		    		type: "template",
		    		payload: {
						template_type: "button",
						text: state.message,
						buttons: buttons
			        }
		        }
		    }
	    });
	    
	    
	}
}

module.exports = Game;


