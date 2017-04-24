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
		image: randomizer(imageGlob('door')),
		action: state => {
			state.inventory = {
				key: false
			};

			state.warscore = 0;
			state.mil1 = 0;
			state.mil2 = 0;
			state.mil3 = 0;
			state.people1 = 0;
			state.people2 = 0;
			state.people3 = 0;
			state.econ1 = 0;
			state.econ2 = 0;
			state.econ3 = 0;
			state.sci1 = 0;
			state.sci2 = 0;
			state.sci3 = 0;
			state.diplo1 = 0;
			state.diplo2 = 0;
			state.diplo3 = 0;

			Bot.sendText(state.id, 'Welcome to WarBot, knave!');
			// Bot.sendImage(state.id, stateTree.START.image());

			return 'PROLOGUE'; // Tell the game that it should immediately run 'PROLOGUE'.
		}
	},
	PROLOGUE: {
		message: 'THIS IS AN OUTRAGE. We are now at war with one of our closest allies and nobody here has any idea what they\'re doing! Your majesty, your court cannot decide an appropriate course of action, so you must absolve all doubt and choose a path for the future of our country.', // Advisors are arguing with each other
		options: [
			{text: 'Choose', action: 'MIL1'}
		]
	},
	MIL1: {
		message: 'The enemy severely outnumbers us, and our forces are not yet primed for battle. We can regain composure by the time the enemy reaches us, but there is an opportunity for our ally, Denmark, to take the enemy capital while we hold off the bulk of the enemy forces. Is that a risk you’re willing to take?', // Military states his case and presents options
		options: [
			{text: 'Yes', action: 'MIL2YES'},
			{text: 'No', action: 'MIL2NO'}
		]
	},
	MIL2YES: {
		action: state => {
			state.warscore += 1;
			state.mil1 = 0;
			return 'MIL2';
		}
	},
	MIL2NO: {
		action: state => {
			state.warscore += 0;
			state.mil1 = 1;
			return 'MIL2';
		}
	},
	MIL2: {
		message: 'When the enemy reaches us, should we defend the outermost provinces, the river surrounding our lands, or the castle keep? We may lose land and stability based on this decision.', // Military states his case and presents options
		options: [
			{text: 'Provinces', action: 'MIL3PROVINCES'},
			{text: 'River', action: 'MIL3RIVER'},
			{text: 'Keep', action: 'MIL3KEEP'}
		]
	},
	MIL3PROVINCES: {
		action: state => {
			state.warscore += 0;
			state.mil2 = 0;
			return 'MIL3';
		}
	},
	MIL3RIVER: {
		action: state => {
			state.warscore += 1;
			state.mil2 = 1;
			return 'MIL3';
		}
	},
	MIL3KEEP: {
		action: state => {
			state.warscore += -1;
			state.mil2 = 2;
			return 'MIL3';
		}
	},
	MIL3: {
		message: 'Should we win the initial battle, do we attack the enemy’s naval trade port, the ruling king’s fortress, or spread out and control the commoners?',
		options: [
			{text: 'Port', action: 'PEOPLE1PORT'},
			{text: 'Commoners', action: 'PEOPLE1COMMONERS'},
			{text: 'Fortress', action: 'PEOPLE1FORTRESS'}
		]
	},
	PEOPLE1PORT: {
		action: state => {
			state.warscore += 1;
			state.mil3 = 0;
			return 'PEOPLE1';
		}
	},
	PEOPLE1COMMONERS: {
		action: state => {
			state.warscore += 0;
			state.mil3 = 1;
			return 'PEOPLE1';
		}
	},
	PEOPLE1FORTRESS: {
		action: state => {
			state.warscore += -1;
			state.mil3 = 2;
			return 'PEOPLE1';
		}
	},
	PEOPLE1: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	PEOPLE2: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	PEOPLE3: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	ECON1: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	ECON2: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	ECON3: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	SCI1: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	SCI2: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	SCI3: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	DIPLO1: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	DIPLO2: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	DIPLO3: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	},
	NARRATOR1: {
		message: 'The door opens...',
		options: [
			{text: 'Restart', action: 'START'}
		]
	}
};

function validateStateEntry(name, previous) {
	if (stateTree[name]) {
		return name;
	}

	console.error(`${chalk.red.bold('ERROR:')} invalid state returned from action: ${chalk.bold(name)} (currently at state ${chalk.bold(previous)})`);
	Bot.sendText('Oh no! There was a problem with that option. We\'ll get a fix out soon!');
	return 'START'; // Nothing else we can do!
}

function sendState(senderId) {
	const buttons = [];
	const userState = states[senderId];
	let stateEntry = stateTree[userState._state];

	generateNonce(senderId);

	let nextAction = null;
	while (stateEntry.action && (nextAction = stateEntry.action(userState))) {
		nextAction = validateStateEntry(nextAction, userState._state);
		stateEntry = stateTree[nextAction];
		userState._state = nextAction;
	}

	for (const option of stateEntry.options) {
		let enable = true;
		if (option.enableIf) {
			enable = option.enableIf(userState);
		}

		if (enable) {
			const noncedPayload = applyNonce(senderId, option.action);
			const button = Bot.createPostbackButton(option.text, noncedPayload);
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

function applyNonce(senderId, payload) {
	return `${payload}@@${states[senderId].nonce}`;
}

function generateNonce(senderId) {
	states[senderId].nonce = (Math.random() * 100000000).toString(32);
}

function consumeNonce(senderId, payload) {
	const spl = payload.split(/@@(.+)/);

	const userState = states[senderId];
	if (spl[1] === userState.nonce) {
		userState.nonce = '___no_nonce___';
		return spl[0];
	}

	return null;
}

function initializeUser(senderId) {
	// Initialize a 'new' user's state
	states[senderId] = {
		_id: senderId,
		_state: 'START'
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

	if (!states[senderId]) {
		initializeUser(senderId);
		return;
	}

	const payload = consumeNonce(senderId, event.postback.payload);
	if (!payload) {
		// Invalid nonce; user hit an old button twice.
		return;
	}

	const userState = states[senderId];

	if (!(payload in stateTree)) {
		sendState(senderId);
		console.warn(`${chalk.yellow.bold('WARNING:')} invalid payload received from user ${chalk.magenta(senderId)}: ${chalk.bold(payload)} (currently at state ${chalk.bold(userState._state)})`);
		Bot.sendText(senderId, 'Oh no! There was a problem processing that selection. I\'ve notified my creators.');
		return;
	}

	userState._state = payload;

	sendState(senderId);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/webhook', Bot.router());
app.use('/images', express.static('images'));

const port = process.env.PORT || config.port || 5000;
app.listen(port);
console.log(`listening on port ${chalk.bold(port)}`);
