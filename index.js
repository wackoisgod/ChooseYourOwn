'use strict';

const Bot = require('fb-local-chat-bot');
const bodyParser = require('body-parser');
const express = require('express');

const config = require('./config.json');

const app = express();

Bot.init(
	config.pageAccessToken,
	config.validationToken,
	config.debug,
	!config.debug);

Bot.on('text', event => {
	const senderId = event.sender.id;
	Bot.sendText(senderId, 'yo whatup you crazy kid');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/webhook', Bot.router());
app.listen(5000);
