const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const superagent = require('superagent');
const reminderChecker = require('../handlers/reminderChecker');
require('dotenv').config( { path: `${__dirname}/.env` } );
// player stats command
module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows available commands and info about the bot.'),
    
        async run(interaction) {
            file = new AttachmentBuilder('exampleImage.png');
            const embed = new EmbedBuilder()
                .setTitle('How to use the bot')
                .setDescription("**Disclaimer: This bot is still being worked on in the background with more features to come, if you have any feedback DM <@358628423855374336> or @ them in the chat**\n\nUse ``/wishlist <itemID>`` to wishlist an item, you will be given a notification when it's in store, you will then have the option to opt in for another reminder or unwishlist any selected item.\n\n***Tip**: Use the [fortnite.gg website](https://fortnite.gg/cosmetics?type=outfit) to grab the id of an item*\n\nUse ``/checkwishlist`` to see what items are currently in your wishlist.\n\n``/unwishlist <itemID>`` to unwishlist an item.\n\nAlas, keep DMs open just so the bot doesn't clog up the channel notifying you for your wishlisted items and thank you for everyone's support and suggestions so far, hoping to see more <a:nodders:793597488631513109>")
                .setImage('attachment://exampleImage.png')
                .setFooter( {text: 'Created By: Maxiemo\nEmotional Support: Horizon', icon_url: interaction.client.avatarURL} )
                //.setFooter( {text: 'Created By: Maxiemo', icon_url: interaction.client.avatarURL} )
                .setColor(process.env.defaultColor);
                
            await interaction.reply( { embeds: [embed], files: [file]} );
            return;
        },
};