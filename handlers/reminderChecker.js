const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const superagent = require('superagent');
const Canvas = require('@napi-rs/canvas');
require('dotenv').config( { path: `${__dirname}/.env` } );
// if item is in the shop the next day, dont remind them. 
// reminded 2-3 times, after the last time, a button to unwishlist the item
// option to remind them every day until its not in the shop, make sure the user has enabled dms for this option.
module.exports = {
	name: 'reminderChecker',
	async run(client, users) {
		try {

			let nowDate = Math.trunc(Date.now()/1000);
			console.log(nowDate)
			//console.log(client.shopItemList)
			for (let userIndex = 0; userIndex < users.length; userIndex++) {
				let itemList = [];
				let images = [];

				for (item of users[userIndex]['wishlist']) {
					console.log(item['itemID'], users[userIndex]['userID'])
					if (item['remindAgain'] - nowDate <= 0 && item['remindAgain'] !== null) {
						await client.db.collection('wishlists').updateOne( { userID: await users[userIndex]['userID'], 'wishlist.itemID': item['itemID'] }, { $set: { 'wishlist.$.lastTimeReminded': nowDate, 'wishlist.$.remindAgain': null } } );

						let indexItem = client.shopItemList.map(object => object.id.toLowerCase()).indexOf(item['itemID']);
						//console.log(indexItem, item['itemID'])
						itemList.push(`[${client.shopItemList[indexItem].name}](https://fortnite.gg/cosmetics?id=${client.shopItemList[indexItem].id})`)
						images.push(client.shopItemList[indexItem].images.icon)
					};
				};

				if (itemList.length !== 0) {
					let user = await client.db.collection('wishlists').findOne( { userID: users[userIndex]['userID'] } );
					let countNonReminders = 0;
					
					for (item of await user['wishlist']) {
						if (item['remindAgain'] === null) {
							countNonReminders++
						};
					};

					if (countNonReminders === user['wishlist'].length) {
						await client.db.collection('wishlists').updateOne( { userID: users[userIndex]['userID'] }, { $set: { remindAgain: false } } );
					};
					
					const member = await client.guild.members.fetch(users[userIndex]['userID']);
					
					let canvas = Canvas.createCanvas(350, 350);
					let ctx = canvas.getContext('2d');

					// Set canvas dimensions
					canvas.width = 350; 
					canvas.height = 350; 

					let imageHW = 170;
					//console.log(images)
					if (images.length === 1) {
						let image1 = await Canvas.loadImage(images[0]);

						ctx.drawImage(image1, 0, 0, 350, 350);

					} else if (images.length === 2) {
						canvas.width = 350; 
						canvas.height = 170; 
						
						let image1 = await Canvas.loadImage(images[0]);
						let image2 = await Canvas.loadImage(images[1]);

						ctx.drawImage(image1, 0, 0, imageHW, imageHW);
						ctx.drawImage(image2, 170, 0, imageHW, imageHW);

					} else if (images.length === 3) {
						let image1 = await Canvas.loadImage(images[0]);
						let image2 = await Canvas.loadImage(images[1]);
						let image3 = await Canvas.loadImage(images[2]);

						ctx.drawImage(image1, 0, 0, imageHW, imageHW);
						ctx.drawImage(image2, 170, 0, imageHW, imageHW);
						ctx.drawImage(image3, 100, 170, imageHW, imageHW);

					} else if (images.length >= 4) {
						let image1 = await Canvas.loadImage(images[0]);
						let image2 = await Canvas.loadImage(images[1]);
						let image3 = await Canvas.loadImage(images[2]);
						let image4 = await Canvas.loadImage(images[3]);

						ctx.drawImage(image1, 0, 0, imageHW, imageHW);
						ctx.drawImage(image2, 170, 0, imageHW, imageHW);
						ctx.drawImage(image3, 0, 170, imageHW, imageHW);
						ctx.drawImage(image4, 170, 170, imageHW, imageHW);

						if (images.length > 4) {
							Canvas.GlobalFonts.registerFromPath('burbankbigcondensed.otf', 'BurBank');

							ctx.font = '30px BurBank';
							ctx.fillStyle = '#52EFFF';

							ctx.fillText('and more!..', 190, 340);
						};
					};

					const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'reminderImage.png' });

					let row = new ActionRowBuilder()
					.addComponents([
						new ButtonBuilder()
							.setCustomId('wishlistRemindMe')
							.setLabel('Set reminder')
							.setStyle(ButtonStyle.Success)
							.setEmoji( { name: '🔔' } ),

						new ButtonBuilder()
							.setCustomId('unwishlist')
							.setLabel('Unwishlist')
							.setStyle(ButtonStyle.Danger)
							.setEmoji( { name: '💸' } )
						]);
					
					try {
						const embed = new EmbedBuilder()
							.setTitle('Wishlist Fortnite Item Reminder!')
							.setDescription(`*Hey, <@${member.user.id}>*\nSome of the items from your wishlist are in the shop right now! :smile:\n\n**${itemList.join('\n')}**\n\n**This is the one and only reminder you'll get, you can opt in to have another reminder by clicking the set reminder button**`)
							.setFooter( { text: 'If you want more information about a skin, click on the name of the skin' } )
							.setImage('attachment://reminderImage.png')
							.setColor(process.env.defaultColor);

						await member.send( { embeds: [embed], files: [attachment], components: [row] } );

					} catch (err) {
						console.log(err)
						let channel = await client.guild.channels.fetch(process.env.reminderChannel);
						const embed = new EmbedBuilder()
							.setTitle('Wishlist Fortnite Item Reminder!')
							.setDescription(`*Hey, <@${member.user.id}>*\nSome of the items from your wishlist are in the shop right now! :smile:\n\n**${itemList.join('\n')}**\n\nYou should also **keep your DMs open**, we don't want to clog up this channel.`)
							.setImage('attachment://reminderImage.png')
							.setColor(process.env.defaultColor);
						await channel.send( { content: `<@${member.user.id}>`, embeds: [embed], files: [attachment], components: [row] } );
					};
				};
			};

		} catch (err) {
			console.error(err);
		};
	},
};