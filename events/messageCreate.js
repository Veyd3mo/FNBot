const { EmbedBuilder } = require('discord.js');
require('dotenv').config( { path: `${__dirname}/.env` } );
// 92640224101797888
module.exports = {
	name: 'messageCreate',
	async run(message) {
		try {
			if (message.inGuild() === true) {
				let config = await message.client.db.collection('config').findOne( { guildID: message.guild.id } );
				if (message.author.id === process.env.clientID) return;
				
				if (message.author.id === '92640224101797888' && config['clown'] === true) {
					message.react('🤡');
				}
			}
			

		} catch (err) {
			console.error(err);
		};
	},
};