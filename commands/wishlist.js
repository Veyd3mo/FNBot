const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const shopChecker = require("../handlers/shopCheckerIndividual.js");
const reminderChecker = require('../handlers/reminderChecker');
require('dotenv').config( { path: `${__dirname}/.env` } );
// player stats command
module.exports = {
    data: new SlashCommandBuilder()
        .setName('wishlist')
        .setDescription('Use the fortnite.gg website to obtain id\'s easily for the item you want.')
        .addStringOption(option => 
            option.setName('id')
            .setDescription('Input the ID of the item that you want to be notified for when it appears in the shop.')
            .setRequired(true)),
        

    async run(interaction) {
        const itemID = interaction.options.getString('id').toLowerCase();
        let userWishlist = await interaction.client.db.collection('wishlists').findOne( { userID: await interaction.user.id } );

        if (!userWishlist) { 
            let dataObject = {
                userID: await interaction.user.id,
                remindAgain: false,
                wishlist: []
            }

            await interaction.client.db.collection('wishlists').insertOne(dataObject);
            userWishlist = await interaction.client.db.collection('wishlists').findOne( { userID: await interaction.user.id } );
        };
        // remind me again, bought the item button
        try {
            //const item = await superagent.get(`https://fortnite-api.com/v2/cosmetics/br/${itemID}`).then(response => JSON.parse(response.text));
            const item = await interaction.client.FNClient.brCosmeticByID( itemID )

            let image;

            if (item.data.images.featured === undefined) {
                image = item.data.images.icon
            } else {
                image = item.data.images.featured
            };

            if (userWishlist['wishlist'].map(object => object['itemID']).includes(itemID)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Uh Oh..')
                    .setDescription(`This item already exists in your wishlist!\nDon't worry, I will make sure to notify you if it appears in the store. :smile:`)
                    .setColor(process.env.errorColor);
                
                await interaction.reply( { embeds: [embed], ephemeral: true } );
                return;
    
            /*} else if (item.data.shopHistory === undefined) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Uh Oh..')
                    .setDescription(`This item has never been in the shop! This could mean it was a battle pass reward or limited time event reward. Unfortunately, this item cannot be wishlisted. :pensive:`)
                    .setImage(image)
                    .setColor(process.env.errorColor);
                
                await interaction.reply( { embeds: [embed], ephemeral: true } );
                return;*/

            } else {
                await interaction.client.db.collection('wishlists').updateOne( { userID: await interaction.user.id }, { $push: { wishlist: { 'itemID': itemID, itemName: item.data.name, itemDescription: item.data.description, itemImage: image, 'notify': true, lastTimeReminded: null, remindAgain: null} } } );
                //console.log(item.data.name, item.data.images.featured)

                const embed = new EmbedBuilder()
                    .setTitle('✅ Success!')
                    .setDescription(`The item **${item.data.name}** has been added to your wishlist, I'll be sure to keep my eyes peeled and notify you if it's in the shop! :smile:`)
                    .setImage(image)
                    .setColor(process.env.defaultColor);
                
                await interaction.reply( { embeds: [embed], ephemeral: true } );
                shopChecker.run(await interaction.client, await interaction.user.id);
                return;
            };
            

        } catch (err) {
            console.log(err)
            file = new AttachmentBuilder('exampleImage.png');

            const embed = new EmbedBuilder()
                .setTitle('❌ Uh Oh..')
                .setDescription(`This item doesn't exist!\nDouble check you have the right ID. :smile:\n\n**Recommendation:** Check your cosmetic ID's on https://fortnite.gg/cosmetics?type=outfit`)
                .setImage('attachment://exampleImage.png')
                .setColor(process.env.errorColor);
                
            await interaction.reply( { embeds: [embed], files: [file], ephemeral: true } );
            return;
        }
    },
};