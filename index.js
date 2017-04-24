'use strict';

const url = require('url');

const Glob = require('glob').Glob;
const StoryBot = require('./bot.js');

const config = require('./config.json');

const story = {
	START: {
		image: randomizer(imageGlob('door')),
		action: user => {
			user.inventory = {
				key: false
			};

			user.warscore = 0;
			user.mil1 = 0;
			user.mil2 = 0;
			user.mil3 = 0;
			user.people1 = 0;
			user.people2 = 0;
			user.people3 = 0;
			user.econ1 = 0;
			user.econ2 = 0;
			user.econ3 = 0;
			user.sci1 = 0;
			user.sci2 = 0;
			user.sci3 = 0;
			user.diplo1 = 0;
			user.diplo2 = 0;
			user.diplo3 = 0;

			user.sendText('Welcome to WarBot, knave!');
			// user.sendImage(story.START.image());

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
		action: user => {
			user.warscore += 1;
			user.mil1 = 0;
			return 'MIL2';
		}
	},
	MIL2NO: {
		action: user => {
			user.warscore += 0;
			user.mil1 = 1;
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
		action: user => {
			user.warscore += 0;
			user.mil2 = 0;
			return 'MIL3';
		}
	},
	MIL3RIVER: {
		action: user => {
			user.warscore += 1;
			user.mil2 = 1;
			return 'MIL3';
		}
	},
	MIL3KEEP: {
		action: user => {
			user.warscore += -1;
			user.mil2 = 2;
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
		action: user => {
			user.warscore += 1;
			user.mil3 = 0;
			return 'PEOPLE1';
		}
	},
	PEOPLE1COMMONERS: {
		action: user => {
			user.warscore += 0;
			user.mil3 = 1;
			return 'PEOPLE1';
		}
	},
	PEOPLE1FORTRESS: {
		action: user => {
			user.warscore += -1;
			user.mil3 = 2;
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

// StoryBot.initialize(config, story);
StoryBot.initialize(config);
