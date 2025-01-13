const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
require('dotenv').config( {path: `${__dirname}/.env`})

const commands = [];

for (const file of fs.readdirSync('./commands/')) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
};

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
//delete
rest.put(Routes.applicationGuildCommands(process.env.clientID, process.env.guildID), { body: [commands] })
	.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
	.catch(console.error);