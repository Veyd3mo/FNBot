const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, RESTJSONErrorCodes, StringSelectMenuBuilder } = require('discord.js');
const superagent = require('superagent');
require('dotenv').config( { path: ".env" } )
// show stuff that hasnt been in the store before
// apply for creator code
// search for an item and see when it was last in the shop and original price and discounted price if available
module.exports = {
    customID: 'wishlistRemindMe',

    async run(interaction) {
        const target = interaction.message.embeds[0].description.split(' ')[1].replace(/([A-Z|a-z]|[<@>*])/ig, '').trim('')
        if (interaction.user.id !== target) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Uh Oh..')
                .setDescription('Hey, hey, hey? What you clicking random buttons for, eh? Stop trynna ruin someone\'s progress with yo stinky lil mouse\nThis message was not for you. <:cinnamon:1062826210842919012>')
                .setColor(process.env.errorColor);

            await interaction.reply( { embeds: [errorEmbed], ephemeral: true} );
            return;
        };

        try {
            let user = await interaction.client.db.collection('wishlists').findOne( { userID: await interaction.user.id } );
            let selectMenuOptions = []
        
            selectMenuOptions.push({
                label: `✅ Finished Selecting`,
                description: `Click this button once you've selected all the items you want to be reminded of again.`,
                value: `selectionFinished`
            });
			
            for (item of user['wishlist']) {
                let indexItem = interaction.client.shopItemList.map(object => object.id.toLowerCase()).indexOf(await item['itemID']);
                
                if (indexItem !== -1) {
                    selectMenuOptions.push({
                        label: `${interaction.client.shopItemList[indexItem].name}`,
                        description: `${interaction.client.shopItemList[indexItem].description}`,
                        value: `${interaction.client.shopItemList[indexItem].id.toLowerCase()}`
                    });
                };
            };

            const message = new EmbedBuilder()
                .setTitle('.. What are we doing? Remind Me Again?')
                .setDescription(`Click on the items below that you want to be reminded of in the future.\nOnce you've selected the items, **click 'Finish Selecting'** and **close the select menu** so you can input when you'd like to be reminded!\n\n***Keep in mind, you CAN select multiple items.***\n`)
                //.setFooter( { text: `${interaction.user.id}` } )
                .setColor(process.env.defaultColor);

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`${interaction.user.id}_wishlistRemindMe`)
                    .setPlaceholder('Select the item(s) you want to be reminded again')
                    .setMaxValues(selectMenuOptions.length)
                    .addOptions(selectMenuOptions)
            );
            
            await interaction.reply( { embeds: [message], ephemeral: true, components: [row] } );
            /*
            const modal = new ModalBuilder()
                .setCustomId('reminderModal')
                .setTitle('Insert when you want to be reminded');
            
            const reminderInput = new TextInputBuilder()
                .setCustomId('reminderNumber')
                .setLabel("When do you want to be reminded?")
                .setPlaceholder("e.g 1 = in 1 hour")
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            const reminderRow = new ActionRowBuilder().addComponents(reminderInput);
            modal.addComponents(reminderRow);
            
            await interaction.showModal(modal);*/

            //await interaction.reply( { embeds: [embed], ephemeral: true } )

        } catch (error) {
            console.log(error)

            //await interaction.reply( { embeds: [errorEmbed], ephemeral: true} );
            return;
        };
    },
}