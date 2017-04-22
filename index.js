'use strict';

const Bot = require('fb-local-chat-bot');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const express = require('express');

const config = require('./config.json');

const app = express();

const states = {};

const stateTree = {
	INITIAL_MESSAGE: {
		message: 'You\'re in a room. You see a key next to a door. Do you pick it up or open the door?',
		action: state => {
			state.inventory = {
				key: false
			};
		},
		options: [
			{text: 'Pick up the key', payload: 'KEY'},
			{text: 'Open the door', payload: 'DOOR'}
		]
	},
	KEY: {
		message: 'You pick up the key.',
		action: state => state.inventory.key = true,
		options: [
			{text: 'Continue', payload: 'AFTERKEY'}
		]
	},
	AFTERKEY: {
		message: 'You\'re in a room. Do you open the door?',
		options: [
			{text: 'Open the door', payload: 'DOOR'}
		]
	},
	DOOR: {
		message: 'The door is locked.',
		options: [
			{text: 'Continue', payload: 'INITIAL_MESSAGE'},
			{text: 'Use the key', payload: 'DOOROPEN', enableIf: state => state.inventory.key}
		]
	},
	DOOROPEN: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', payload: 'INITIAL_MESSAGE'}
		]
	}
};

function sendState(senderId) {
	const buttons = [];
	const userState = states[senderId];
	const stateEntry = stateTree[userState.state];

	if (stateEntry.action) {
		stateEntry.action(userState);
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

	Bot.sendButtons(senderId, stateEntry.message, buttons);
}

function initializeUser(senderId) {
	// Initialize a 'new' user's state
	states[senderId] = {
		state: 'INITIAL_MESSAGE'
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
app.listen(5000);
