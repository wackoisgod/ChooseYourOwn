'use strict';

const fs = require('fs');
const https = require('https');
const path = require('path');

const bodyParser = require('body-parser');
const Bot = require('fb-local-chat-bot');
const chalk = require('chalk');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
//app.use(helmet()); 

const states = {};

let startState = 'START';
let storyTree = {
	START: {
		message: 'Hello! This is an automated message, but we wanted to let you know we\'ll get back to you as soon as we can.\n\nThanks!'
	}
};

const log = {
	info: (...args) => console.log(chalk.white.bold('INFO:'), ...args),
	warn: (...args) => console.warn(chalk.yellow.bold('WARNING:'), ...args),
	error: (...args) => console.error(chalk.red.bold('ERROR:'), ...args)
};

class User {
	constructor(id) {
		this._id = id;
		this._state = null;
		this._generateNonce();
	}

	toString() {
		return `<messenger-user:${this._id}@${this._state}>`;
	}

	sendText(...strings) {
		if (strings && strings.length > 0) {
			const message = strings.join(' ').trim();
			if (message.length > 0) {
				Bot.sendText(this._id, message);
			}
		}
	}

	sendImage(uri) {
		if (uri) {

			Bot.sendImage(this._id, uri);
		}
	}

	sendButtons(text, options) {
		if (!text || (text = text.trim()).length === 0) {
			return;
		}

		const botButtons = [];

		if (options && options.length > 0) {
			for (const option of options) {
				if (option && option.length === 2) {
					botButtons.push(Bot.createPostbackButton(option[0], `${option[1]}@@${this._nonce}`));
				} else {
					log.warn('user', chalk.bold(this._id), 'was to be sent an invalid button option:', option);
				}
			}
		}

		if (botButtons.length > 0) {
			Bot.sendButtons(this._id, text, botButtons);
		} else {
			Bot.sendText(this._id, text);
		}
	}

	execute(...actions) {
		for (const rootAction of actions) {
			log.error(actions);
			let nextAction = rootAction;
			while (nextAction) {
				const action = nextAction;
				nextAction = null;

				const decodedAction = action.match(/^(.+?)(?:::(\d+))?$/);
				const storyItem = storyTree[decodedAction[1]];

				if (!storyItem) {
					log.warn('user', chalk.bold(this._id), 'attempted to execute invalid action; resetting session (was: ', chalk.magenta(action), ')');
					this.sendText('Oh no! There was a problem handling whatever it is you just did. I\'ve let the developers know.');
					delete states[this._id]; // We merely delete and not initializeUser() since we don't want to (potentially) spam them
					return;
				}

				// Was it an option payload?
				if (decodedAction[2] && storyItem.options && storyItem.options[decodedAction[2]]) {
					const option = storyItem.options[decodedAction[2]];
					nextAction = this._expand(option.action);
				} else {
					// Run the state's action
					nextAction = this._expand(storyItem.action);
				}

				this._state = action;
			}
		}

		if (this._state) {
			// Does it have options?
			const storyEntry = storyTree[this._state];
			if (!storyEntry) {
				return;
			}

			const message = this._expand(storyEntry.message);

			const options = [];
			if (storyEntry.options) {
				for (let i = 0; i < storyEntry.options.length; i++) {
					const option = storyEntry.options[i];

					let enabled = true;
					if (option.enableIf) {
						enabled = option.enableIf(this);
					}

					if (enabled) {
						const payload = `${this._state}::${i}`;
						const text = this._expand(option.text);
						options.push([text, payload]);
					}
				}
			}

			this.sendButtons(message, options);
		}
	}

	_generateNonce() {
		this._nonce = Math.random().toString(36);
		return true;
	}

	_consumeNonce(nonce) {
		return nonce === this._nonce ? this._generateNonce() : false;
	}

	_expand(val) {
		return typeof val === 'function' ? val(this) : val;
	}
}

function initializeUser(id) {
	delete states[id];

	const userObj = new User(id);
	states[id] = userObj;

	userObj.execute(startState);
}

Bot.on('text', event => {
	const id = event.sender.id;
	initializeUser(id);
});

Bot.on('postback', event => {
	const id = event.sender.id;
	const payload = event.postback.payload;
	const user = states[id];

	if (!user) {
		log.warn('user', chalk.bold(id), 'performed a postback but didn\'t have a state; resetting session');
		initializeUser(id);
		return;
	}

	if (!payload) {
		log.warn('user', chalk.bold(id), 'did not supply a payload with a postback; resetting session (was: ', chalk.magenta(user._state), ')');
		initializeUser(id);
		return;
	}

	// Validate nonce
	const matches = payload.match(/^(.+?)@@(.+)$/);
	if (!matches) {
		log.warn('user', chalk.bold(id), 'supplied a payload without a nonce; resetting session (was: ', chalk.magenta(user._state), ')');
		initializeUser(id);
		return;
	}

	if (!user._consumeNonce(matches[2])) {
		// We don't worry about logging here since this happens when users hit an old button; something
		// that is bound to happen at some point, and potentially quite frequently.
		return;
	}

	// Finally, execute the postback action.
	const action = matches[1];
	user.execute(action);
});

morgan.token('fb-text', req => req.body.message || '');
morgan.token('fb-payload', req => req.body.payload || '');
morgan.token('fb-senderid', req => req.body.senderID || '');

function initialize(config, story, beginningState) {
	startState = beginningState || 'START';
	storyTree = story || storyTree;

	log.info('initializing story bot system with', chalk.bold(Object.keys(storyTree).length), 'state(s)');
	log.info('all users will start at state:', chalk.bold(startState));

	const debugMode = Boolean(config.debug);
	if (debugMode) {
		log.info('bot is in', chalk.yellow('debug mode'));
	}

	Bot.init(config.pageAccessToken, config.validationToken, debugMode, !debugMode);

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));

	app.get('/_ah/health', (req, res) => {
		res.send('ok');
	});

	app.use(morgan([
		':date[clf]:',
		chalk.magenta.dim(':remote-addr'),
		chalk.bold(':method'),
		':url',
		chalk.cyan(':status'),
		'- :response-time ms',
		'-',
		chalk.green(':fb-senderid'),
		'-',
		chalk.green(':fb-payload'),
		'-',
		chalk.green(':fb-text'),
		'- :url',
		chalk.dim('(:user-agent)')
	].join(' ')));

	app.use('/webhook', Bot.router());
	//app.use('/.well-known', express.static(path.join(__dirname, 'static/well-known')));  // Certbot challenge URL

	if (process.env.LE_URL && process.env.LE_CONTENT) {
  		app.use(process.env.LE_URL, function(req, res) {
    		return res.send(process.env.LE_CONTENT)
  		});
	}

	const server = config.https
		? https.createServer({
			key: fs.readFileSync(config.privateKey),
			cert: fs.readFileSync(config.certificate)
		}, app)
		: app;

	const port = process.env.PORT || config.port || 5000; 
	server.listen(port);
	log.info('listening on port', chalk.bold(port));

	log.info('ready!');
}

module.exports = {
	app,
	initialize
};
