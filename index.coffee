path = require 'path'
url = require 'url'

express = require 'express'
Glob = (require 'glob').Glob
StoryBot = require './bot'

config = require './config'

imageGlob = (folder) ->
	pattern = "./images/#{folder}/*.@(jp?(e)g|png|gif|bmp|tif?(f))";
	glob = new Glob pattern, sync:on

	baseUrl = url.parse config.serverURL
	if config.debug
		delete baseUrl.host
		baseUrl.protocol = 'http:'
		baseUrl.hostname = 'localhost'
		baseUrl.port = config.port

	return glob.found.map (imagePath) ->
		baseUrl.pathname = imagePath
		return url.format(baseUrl)

randomizer = (images) -> -> images[Math.floor (Math.random() * images.length)]

story =
	START:
		image: randomizer imageGlob 'door'
		action: (user) ->
			user.warscore = 0
			user.mil1 = 0
			user.mil2 = 0
			user.mil3 = 0
			user.people1 = 0
			user.people2 = 0
			user.people3 = 0
			user.econ1 = 0
			user.econ2 = 0
			user.econ3 = 0
			user.sci1 = 0
			user.sci2 = 0
			user.sci3 = 0
			user.diplo1 = 0
			user.diplo2 = 0
			user.diplo3 = 0

			user.sendText 'Welcome to WarBot, knave!'
			# user.sendImage story.START.image()

			return 'PROLOGUE' # Tell the game that it should immediately run 'PROLOGUE'.

	PROLOGUE:
		# Advisors are arguing with each other
		message: 'THIS IS AN OUTRAGE. We are now at war with one of our closest allies and nobody here has any idea what they\'re doing! Your majesty, your court cannot decide an appropriate course of action, so you must absolve all doubt and choose a path for the future of our country.'
		options: [
			{text: 'Choose', action: 'MIL1'}
		]

	MIL1:
		# Military states his case and presents options
		message: 'The enemy severely outnumbers us, and our forces are not yet primed for battle. We can regain composure by the time the enemy reaches us, but there is an opportunity for our ally, Denmark, to take the enemy capital while we hold off the bulk of the enemy forces. Is that a risk you’re willing to take?' 
		options: [
			{
				text: 'Yes'
				action: (user) ->
					user.warscore += 1
					user.mil1 = 0
					return 'MIL2'
			}
			{
				text: 'No'
				action: (user) ->
					user.mil1 = 1
					return 'MIL2'
			}
		]

	MIL2:
		# Military states his case and presents options
		message: 'When the enemy reaches us, should we defend the outermost provinces, the river surrounding our lands, or the castle keep? We may lose land and stability based on this decision.'
		options: [
			{
				text: 'Provinces'
				action: (user) ->
					user.mil2 = 0
					return 'MIL3'
			}
			{
				text: 'River'
				action: (user) ->
					user.warscore += 1
					user.mil2 = 1
					return 'MIL3'
			}
			{
				text: 'Keep'
				action: (user) ->
					user.warscore -= 1
					user.mil2 = 2
					return 'MIL3'
			}
		]

	MIL3:
		message: 'Should we win the initial battle, do we attack the enemy’s naval trade port, the ruling king’s fortress, or spread out and control the commoners?'
		options: [
			{
				text: 'Port'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 0
					return 'PEOPLE1'
			}
			{
				text: 'Commoners'
				action: (user) ->
					user.mil3 = 1
					return 'PEOPLE1'
			}
			{
				text: 'Fortress'
				action: (user) ->
					user.warscore -= 1
					user.mil3 = 2
					return 'PEOPLE1'
			}
		]

	PEOPLE1:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	PEOPLE2:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	PEOPLE3:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	ECON1:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	ECON2:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	ECON3:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	SCI1:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	SCI2:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	SCI3:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	DIPLO1:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	DIPLO2:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	DIPLO3:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

	NARRATOR1:
		message: 'The door opens...'
		options: [
			{text: 'Restart', action: 'START'}
		]

StoryBot.app.use '/images', express.static path.join __dirname, 'images'
StoryBot.initialize config, story
