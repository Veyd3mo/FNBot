const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const superagent = require('superagent');
const reminderChecker = require('../handlers/reminderChecker');
require('dotenv').config( { path: `${__dirname}/.env` } );
// player stats command
module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwishlist')
        .setDescription('Unwishlist any item from your wishlist.')
        .addStringOption(option => 
            option.setName('id')
            .setDescription('Input the ID of the item that you want to unwishlist.')
            .setRequired(true)),
    
        async run(interaction) {
            const itemID = interaction.options.getString('id');
            let user = await interaction.client.db.collection('wishlists').findOne( { userID: await interaction.user.id } );
            let userWishlist = user['wishlist'].map(object => object['itemID']);

            if (!userWishlist.includes(itemID.toLowerCase())) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Uh Oh..')
                    .setDescription("The item you're trying to unwishlist is not in your wishlist! Make sure you have the right ID, check what you have in your wishlist by using ``/checkwishlist``")
                    .setColor(process.env.defaultColor);
                
                await interaction.reply( { embeds: [embed], ephemeral: true } );
                return;
            }

            await interaction.client.db.collection('wishlists').updateOne( { userID: await interaction.user.id }, { $pull: { wishlist: { 'itemID': itemID.toLowerCase() } } } );

            const embed = new EmbedBuilder()
                .setTitle('✅ Success!')
                .setDescription(`The item with the id **${itemID}** has been unwishlisted!`)
                .setColor(process.env.defaultColor);
                
            await interaction.reply( { embeds: [embed], ephemeral: true } );
            return;
        },
};