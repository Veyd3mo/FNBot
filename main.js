const fs = require("fs");
const { Client, Collection, GatewayIntentBits, Partials, ActivityType, EmbedBuilder } = require('discord.js');
const fnapicom = require('fnapicom');
const shopChecker = require("./handlers/shopChecker.js");
const reminderChecker = require("./handlers/reminderChecker.js");
const { MongoClient, ServerApiVersion } = require('mongodb');
const superagent = require('superagent');
require('dotenv').config( { path: ".env" } )
// https://github.com/Fortnite-API/nodejs-wrapper/blob/master/src/client/Client.ts
const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.DirectMessages], 
	partials: [
		Partials.GuildMember,
		Partials.ThreadMember,
		Partials.User,
		Partials.Channel,
		Partials.Message] });

client.once('ready', async () => {
	const mongoClient = new MongoClient(process.env.mongoDBUrl, { 
		serverApi: {
			version: ServerApiVersion.v1,
			strict: true,
			deprecationErrors: true,
		},
		family: 4,
		maxPoolSize: 100,
		minPoolSize: 20,
		retryReads: true,
		socketTimeoutMS: 360000,
		connectTimeoutMS: 360000,
		retryWrites: true
	  });
	  
	await mongoClient.connect();
	client.db = mongoClient.db('DB');
	console.log('Connected to database');

	
	client.FNClient = new fnapicom.Client({
		language: fnapicom.Language.English,
		apiKey: process.env.APIKEY,
	});
	
	client.commands = new Collection();
	client.buttons = new Collection();
	client.guild = await client.guilds.fetch(process.env.guildID);

	for (const file of fs.readdirSync('./commands/')) {
		const command = require(`./commands/${file}`);
		client.commands.set(command.data.name, command);	
	};
	console.log('Commands set successfully...');
	
	for (const dir of fs.readdirSync('./buttons/' )) {
		for (const file of fs.readdirSync(`./buttons/${dir}`)) {
			const button = require(`./buttons/${dir}/${file}`);

			client.buttons.set(button.customID, button)
		};
	};
	console.log('Buttons set successfully...');

	for (const file of fs.readdirSync('./events/' ).filter(file => file.endsWith('.js'))) {
		const event = require(`./events/${file}`);
		
		client.on(event.name, (...args) => event.run(...args));
	};
	console.log('Events set successfully...');

	client.user.presence.set({
        activities: [{ 
          name: "wishes coming true",
          type: ActivityType.Listening
        }],
        status: "idle"
    });
	//let shopItemList = await superagent.get(`https://fortnite-api.com/v2/shop/br/combined`).then(response => JSON.parse(response.text));

	//console.log(shopItemList.data.featured.entries.map(object => object.items).flat().map(object => object.id))//.flatMap(object => object.id))//.map(object => object['itemID']))

	client.shopCheckerRunning = false;
	client.remindAgainItems = [];
	client.unwishlistItems = [];

	//client.fortniteShop = await superagent.get(`https://fortnite-api.com/v2/shop/br/combined`).then(response => JSON.parse(response.text));
	async function refreshShop() {
		let fortniteShop = await client.FNClient.shop()
		shopItemList = [];

		for (item of fortniteShop.data.entries) {
			if (Object.keys(item).includes('tracks')) {
				shopItemList.push(item.tracks)
			} else if (Object.keys(item).includes('brItems')) {
				shopItemList.push(item.brItems)
			} else if (Object.keys(item).includes('cars')) {
				shopItemList.push(item.cars)
			} else if (Object.keys(item).includes('legoKits')) {
				shopItemList.push(item.legoKits)
			}
		}
		return client.shopItemList = shopItemList.flat();
	}
	await refreshShop();
	shopChecker.run(client);
	
	let intervalShop = setInterval(async () => {
		let nowTime = new Date(Date.now());
		let formattedTime = `${nowTime.getUTCHours()}:${nowTime.getUTCMinutes()}`;
		//let formattedTime = '0:0'
		if (formattedTime === '0:0' && client.shopCheckerRunning === false) {
			console.log('checking shop')
			client.shopCheckerRunning = true;
			await refreshShop();
			shopChecker.run(client);
			// 0:1
		} else if (formattedTime === '0:1' && client.shopCheckerRunning === true) {
			console.log('checking shop done')
			client.shopCheckerRunning = false;
		};
	}, 2000);

	let intervalReminder = setInterval(async () => {
		let users = await client.db.collection('wishlists').find( { remindAgain: true } ).toArray();
		let personalReminders = await client.db.collection('reminders').find().toArray();
		
		if (users.length !== 0) {
			await reminderChecker.run(client, users);
		};

		if (personalReminders.length !== 0) {
			let nowDate = Math.trunc(Date.now()/1000);

			for (user of personalReminders) {
				for (reminder of user['reminders']) {

					if (reminder['remindOn'] - nowDate <= 0) {
						try {
							let member = await client.guild.members.fetch(user['userID']);
							const embed = new EmbedBuilder()
								.setTitle('Reminder! 🔔')
								.setDescription(`I've been asked to remind you about ${reminder['reason']}`)
								.setColor(process.env.defaultColor);
							
							await member.send( { embeds: [embed] } );

						} catch(err) {
							let channel = await client.guild.channels.fetch(process.env.reminderChannel);
							const embed = new EmbedBuilder()
								.setTitle('Reminder! 🔔')
								.setDescription(`I've been asked to remind you about ${reminder['reason']}`)
								.setColor(process.env.defaultColor);
							
							await channel.send( { embeds: [embed] } );
						}

						await client.db.collection('reminders').updateOne( { userID: user['userID'] }, { $pull: { reminders: { reason: reminder['reason'], remindOn: reminder['remindOn'] } } } );
						
					};
				};
			};
		};

	}, 2000);
	
	console.log('SO Ready!');
});

client.login(process.env.TOKEN);

// https://discord.com/api/oauth2/authorize?client_id=1205332103030382643&permissions=8&scope=bot%20applications.commands