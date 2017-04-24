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
		message: 'It is a dark day for your country. We are now suddenly at war with one of our closest allies! Your majesty, your court cannot decide an appropriate course of action, so you must absolve all doubt and choose a path for the future of our country.'
		options: [
			{text: 'Choose', action: 'MIL1'}
		]

	MIL1:
		# Military states his case and presents options
		message: 'The enemy severely outnumbers us, and our forces are not yet primed for battle. We can regain composure by the time the enemy reaches us, but there is an opportunity for our allies to take the enemy capital while we hold off the bulk of the enemy forces. Is that a risk you’re willing to take?'
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
		message: 'If we win the initial battle, do we attack the enemy’s naval trade port, the ruling king’s fortress, or spread out and control the commoners?'
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
		message: 'Our people are growing worrisome about what little they know of the conflict, we must send a strong message of anger and conviction. However, the frightened commoners may flee the country and leave our resources bare, so we might choose to send no message at all. '
		options: [
			{
				text: 'Anger'
				action: (user) ->
					user.warscore += 1
					user.people1 = 0
					return 'PEOPLE2'
			}
			{
				text: 'No Message'
				action: (user) ->
					user.mil3 = 1
					return 'PEOPLE2'
			}
		]

	PEOPLE2:
		message: 'The country in need must demand wartime taxes in order to preserve all that we have worked toward. This can only go on for so long before destroying our people’s spirits and country from the inside. Should we enact full or half wartime taxes to remain competitive?'
		options: [
			{
				text: 'Full'
				action: (user) ->
					user.people2 = 1
					return 'PEOPLE3'
			}
			{
				text: 'Half'
				action: (user) ->
					user.warscore += 1
					user.people2 = 2
					return 'PEOPLE3'
			}
		]

	PEOPLE3:
		message: 'A beloved king that loves it’s people would do anything to help save them. Should we spare them the cruel subjugation of our enemies by protecting even common folk within our keep, or not show misleading expectations that no king could possibly maintain for long?'
		options: [
			{
				text: 'Save Them'
				action: (user) ->
					user.mil3 = 1
					return 'ECON1'
			}
			{
				text: 'Don\'t'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 2
					return 'ECON1'
			}
		]

	ECON1:
		message: 'Our economy is the strongest asset in our country, and our valuable trade routes are being plundered by the enemy overseas. It would take too long to build our own navy, so we must consider hiring mercenaries that get the job done. We have little amounts of enemy intel on fleet numbers, so should we amass a modest or formidable force?'
		options: [
			{
				text: 'Weak'
				action: (user) ->
					user.mil3 = 1
					return 'ECON2'
			}
			{
				text: 'Strong'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 2
					return 'ECON2'
			}
		]

	ECON2:
		message: 'Our kingdom and the enemy are within the grounds of the Holy Roman Empire, but the emperor is rarely involved in mediating internal warfare these days. We can bribe the emperor to assist us with a small imperial force, but it could completely deplete our current funds.'
		options: [
			{
				text: 'Bribe'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 1
					return 'ECON3'
			}
			{
				text: 'Half'
				action: (user) ->
					user.mil3 = 2
					return 'ECON3'
			}
		]

	ECON3:
		message: 'We could issue an embargo on the enemy, preventing trade between our two countries. This would show the world we are a strong independent country, at the risk of actually losing significant amounts of income. '
		options: [
			{
				text: 'Embargo'
				action: (user) ->
					user.mil3 = 1
					return 'SCI1'
			}
			{
				text: 'Don\'t'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 2
					return 'SCI1'
			}
		]

	SCI1:
		message: 'Our lands can benefit from recent advancements in artillery or cavalry systems, but we only have enough funding allocated for one. Artillery is best suited for offensive siege tactics, whereas cavalry can be rapidly deployed across the country to protect our provinces. Which should we buy?'
		options: [
			{
				text: 'Artillery'
				action: (user) ->
					user.mil3 = 1
					return 'SCI2'
			}
			{
				text: 'Cavalry'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 2
					return 'SCI2'
			}
		]

	SCI2:
		message: 'Recent calculations show that star-shaped fortresses, or trace italienne, are the most defensible buildings known to man. We can rapidly assert our bastions to reflect these scientific advancements, at the risk of total failure to construct in time. Should we take a chance on new technology?'
		options: [
			{
				text: 'Yes'
				action: (user) ->
					user.mil3 = 1
					return 'Sci3'
			}
			{
				text: 'No'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 2
					return 'SCI3'
			}
		]

	SCI3:
		message: 'The caliver, a gun with a more superior design, is a powerful penetrator of steel-plated armors, and we can increase the rationing of such equipment at the expense of not buying armor plates for our own troops. Should we buy the guns or armor?'
		options: [
			{
				text: 'Guns'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 1
					return 'DIPLO1'
			}
			{
				text: 'Armor'
				action: (user) ->
					user.mil3 = 2
					return 'DIPLO1'
			}
		]

	DIPLO1:
		message: 'Our allies are many yet small. We should gain the favor of a larger nation, such as France, in order to intimidate our larger opponent. With such favor, comes great expectation to shift trade agreements in their obvious benefit. Should we enter into a mutual agreement for a strong immediate return?'
		options: [
			{
				text: 'Yes'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 1
					return 'DIPLO2'
			}
			{
				text: 'No'
				action: (user) ->
					user.mil3 = 2
					return 'DIPLO2'
			}
		]

	DIPLO2:
		message: 'Within every group of people lies extremists. We can send spies into the enemy country and fund rebellion groups in order to cause dissent within enemy ranks. The rebellion will also cause angry mobs and attack anyone at will, weakening our own presence. Should we support chaos, or order?'
		options: [
			{
				text: 'Chaos'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 1
					return 'DIPLO3'
			}
			{
				text: 'Order'
				action: (user) ->
					user.warscore -= 1
					user.mil3 = 2
					return 'DIPLO3'
			}
		]

	DIPLO3:
		message: 'Diplomacy is a matter of exchanging power with words. We hold a destructive, semi-evident secret that the enemy king keeps, but in it’s truth, our country is at fault. We could reveal it in truth, or we could fabricate the truth to reflect another rival being at fault. Unfortunately the truth is slowly becoming uncovered, and our statement will work only until the war is over. '
		options: [
			{
				text: 'Lie'
				action: (user) ->
					user.warscore -= 1
					user.mil3 = 1
					return 'NARRATOR1'
			}
			{
				text: 'Truth'
				action: (user) ->
					user.warscore += 1
					user.mil3 = 2
					return 'NARRATOR1'
			}
		]

	NARRATOR1:
		message: 'The final bullet shot, the last building pillaged, and the end to 3 years of war, your decisions amount to one final outcome. Your advisors pile into the room to notify you of the results.'
		options: [
			{
				text: 'Results'
				action: (user) ->
					user.mil3 = 1
					return 'RESULTS'
			}
		]

	RESULTS:
		message: (user) ->
			switch
				when -5 <= user.warscore < 5 then 'Your military was crushed immediately. Your defensive positions failed. Your support fell through. What’s left is only a remnant.'
				when 5 <= user.warscore < 10 then 'Eh you were alright' # TODO
				when 10 <= user.warscore then 'Wow you were actually good' # TODO
		action: 'FINAL_SCORE'

	FINAL_SCORE:
		message: (user) -> "Your final score was #{user.warscore}"

StoryBot.app.use '/images', express.static path.join __dirname, 'images'
StoryBot.initialize config, story
