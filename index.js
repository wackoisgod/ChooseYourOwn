'use strict';

const url = require('url');

const Bot = require('fb-local-chat-bot');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const express = require('express');
const Glob = require('glob').Glob;

const config = require('./config.json');

const app = express();

const states = {};

const stateTree = {
	START: {
		action: state => {
			state.inventory = {
				key: false
			};

			state.state = 'DOOR';

			Bot.sendText(state.id, 'Welcome to AdventureBot, knave!');

			return true; // Tell the game that it should immediately run the next state.
		}
	},
	DOOR: {
		message: state => {
			let message = 'You\'re in a room.';
			if (state.inventory.key) {
				message += ' You see a door.';
			} else {
				message += ' You see a key next to a door. Do you pick it up or open the door?';
			}
			return message;
		},
		options: [
			{text: 'Try to open the door', payload: 'LOCKED_DOOR'},
			{text: 'Pick up the key', payload: 'KEY', enableIf: state => !state.inventory.key},
			{text: 'Use the key', payload: 'DOOROPEN', enableIf: state => state.inventory.key}
		]
	},
	LOCKED_DOOR: {
		message: 'The door is locked.',
		options: [
			{text: 'Continue', payload: 'DOOR'}
		]
	},
	KEY: {
		message: 'You pick up the key.',
		image: randomizer(imageGlob('key')),
		action: state => {
			state.inventory.key = true;
		},
		options: [
			{text: 'Continue', payload: 'DOOR'}
		]
	},
	DOOROPEN: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', payload: 'START'}
		]
	}
};

function sendState(senderId) {
	const buttons = [];
	const userState = states[senderId];
	let stateEntry = stateTree[userState.state];

	while (stateEntry.action && stateEntry.action(userState)) {
		stateEntry = stateTree[userState.state];
	}

	for (const option of stateEntry.options) {
		let enable = true;
		if (option.enableIf) {
			enable = option.enableIf(userState);
		}

		if (enable) {
			const button = Bot.createPostbackButton(option.text, option.payload);
			buttons.push(button);
		}
	}

	const message = typeof stateEntry.message === 'function'
		? stateEntry.message(userState)
		: stateEntry.message;

	if (stateEntry.image) {
		const imageUrl = typeof stateEntry.image === 'function'
			? stateEntry.image(userState)
			: stateEntry.image;

		Bot.sendImage(senderId, imageUrl);
	}

	Bot.sendButtons(senderId, message, buttons);
}

function imageGlob(folder) {
	const pattern = `./images/${folder}/*.@(jp?(e)g|png|gif|bmp|tif?(f))`; // Syntax highlight fix */
	const glob = new Glob(pattern, {sync: true});
	
	const baseUrl = url.parse(config.serverURL);
	if (config.debug) {
		delete baseUrl.host;
		baseUrl.protocol = 'http:';
		baseUrl.hostname = 'localhost';
		baseUrl.port = config.port;
	}

	return glob.found.map(imagePath => {
		baseUrl.pathname = imagePath;
		return url.format(baseUrl);
	});
}

function randomizer(images) {
	return () => images[Math.floor(Math.random() * images.length)];
}

function initializeUser(senderId) {
	// Initialize a 'new' user's state
	states[senderId] = {
		id: senderId,
		state: 'START'
	};

	sendState(senderId);
}

Bot.init(
	config.pageAccessToken,
	config.validationToken,
	config.debug,
	!config.debug);

Bot.on('text', event => {
	const senderId = event.sender.id;
	initializeUser(senderId);
});

Bot.on('postback', event => {
	const senderId = event.sender.id;
	const payload = event.postback.payload;

	if (!states[senderId]) {
		initializeUser(senderId);
		return;
	}

	const userState = states[senderId];

	if (!(payload in stateTree)) {
		sendState(senderId);
		console.warn(`${chalk.yellow.bold('WARNING:')} invalid payload received from user ${chalk.magenta(senderId)}: ${chalk.bold(payload)} (currently at state ${chalk.bold(userState.state)})`);
		Bot.sendText(senderId, 'Oh no! There was a problem processing that selection. I\'ve notified my creators.');
		return;
	}

	userState.state = payload;

	sendState(senderId);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/webhook', Bot.router());
app.use('/images', express.static('images'));
app.listen(config.port);
