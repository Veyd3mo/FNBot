const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, RESTJSONErrorCodes, StringSelectMenuBuilder } = require('discord.js');
const superagent = require('superagent');
const moment = require('moment');
require('dotenv').config( { path: `${__dirname}/.env` } );

module.exports = {
	name: 'interactionCreate',
	async run(interaction) {

		if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.run(interaction);

            } catch (error) {
                console.log(error)
                let owner = await interaction.client.users.fetch(process.env.ownerID);
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Uh Oh..')
                    .setDescription('Something went wrong with this command!\nThe bot developer has been notified about this\napologies for any inconvinence.')
                    .setFooter( { text: `Any issues or questions, please contact ${owner.tag}` } )
                    .setColor(process.env.errorColor);
                
                await interaction.reply( { embeds: [errorEmbed], ephemeral: true} );
                return;
            };
        };

        if (interaction.isButton()) {
            const button = interaction.client.buttons.get(interaction.customId);
            
            if (!button) return;

            try {
                await button.run(interaction);

            } catch (error) {
               
            // TODO: Remember to uncomment this you fool
            console.log(error, 'button');
                let owner = await interaction.client.users.fetch(process.env.ownerID);
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Uh Oh..')
                    .setDescription('Something went wrong with this button!\nThe bot developer has been notified about this\napologies for any inconvinence.')
                    .setFooter( { text: `Any issues or questions, please contact ${owner.tag}` } )
                    .setColor(process.env.errorColor);
                
                await interaction.reply( { embeds: [errorEmbed], ephemeral: true} );
                return;
            };
        };

        // Remind again select menu
        if (interaction.isStringSelectMenu()) {
            /*const target = interaction.message.embeds[0].footer.text
            console.log(target)
            if (interaction.user.id !== target) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Uh Oh..')
                    .setDescription('Hey, hey, hey? What you clicking random buttons for, eh? Stop trynna ruin someone\'s progress with yo stinky lil mouse\nThis message was not for you. <:cinnamon:1062826210842919012>')
                    .setColor(process.env.errorColor);
    
                await interaction.reply( { embeds: [errorEmbed], ephemeral: true} );
                return;
            };*/
            try {
                console.log('start', interaction.values)
                if (interaction.values.includes('selectionFinished')) {
                    
                    if (interaction.values.length === 1) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('❌ Uh Oh..')
                            .setDescription(`**You didn't select any items!**\nPlease select at least **one** item from the select menu.`)
                            //.setFooter( { text: `Any issues or questions, please contact` } )
                            .setColor(process.env.errorColor);
                    
                        await interaction.reply( { embeds: [errorEmbed], ephemeral: true} );
                        return;
                    };

                    await interaction.client.remindAgainItems.push([interaction.user.id, interaction.values.filter(item => item !== 'selectionFinished')]);

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
                    
                    await interaction.showModal(modal);
                };
                
                if (interaction.values.includes('selectionUnwishlisted')) {

                    if (interaction.values.length === 1) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('❌ Uh Oh..')
                            .setDescription(`**You didn't select any items!**\nPlease select at least **one** item from the select menu.`)
                            //.setFooter( { text: `Any issues or questions, please contact` } )
                            .setColor(process.env.errorColor);
                    
                        await interaction.reply( { embeds: [errorEmbed], ephemeral: true} );
                        return;
                    };

                    let itemInfo = [];
                    
                    for (itemID of interaction.values.filter(item => item !== 'selectionUnwishlisted')) {
                        let itemObject = await interaction.client.FNClient.brCosmeticByID( itemID );
                        //let itemObject =  await superagent.get(`https://fortnite-api.com/v2/cosmetics/br/${itemID}`).then(response => JSON.parse(response.text));
                        itemInfo.push(`**${itemObject.data.name}** | ${itemObject.data.description}`)
                        await interaction.client.db.collection('wishlists').updateOne( { userID: await interaction.user.id }, { $pull: { wishlist: { 'itemID': itemID} } } );
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('✅ Success!')
                        .setDescription(`You have unwishlisted these items.\n\n${itemInfo.join('\n')}`)
                        //.setFooter( { text: `Any issues or questions, please contact` } )
                        .setColor(process.env.defaultColor);
                    
                    await interaction.reply( { embeds: [embed], ephemeral: true} );
                    return;
                }
            } catch (err) {
                console.log(err)
            }
        };

        // Reminder submissions
        if (interaction.isModalSubmit()) {
            try {
                const reminderNumber = interaction.fields.getTextInputValue('reminderNumber');

                if (isNaN(reminderNumber)) {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Uh Oh..')
                        .setDescription('**You did not input a number!**\nPlease input a whole number of when you want to be reminded. (e.g 1 = in 1 hour)')
                        //.setFooter( { text: `Any issues or questions, please contact` } )
                        .setColor(process.env.errorColor);
                
                    await interaction.reply( { embeds: [errorEmbed], ephemeral: true } );
                    return;
                };

                const userIndex = interaction.client.remindAgainItems.flatMap(userID => userID[0]).findIndex(userID => userID === interaction.user.id);
                const userItems = interaction.client.remindAgainItems[userIndex][1];

                let endDate = Math.trunc(moment(Date.now()).add(reminderNumber, 'hours')/1000);

                for (item of userItems) {                    
                    await interaction.client.db.collection('wishlists').updateOne( { userID: interaction.user.id, 'wishlist.itemID': item }, { $set: { 'wishlist.$.remindAgain': endDate } } );
                };

                await interaction.client.db.collection('wishlists').updateOne( { userID: interaction.user.id }, { $set: { remindAgain: true } } );

                const embed = new EmbedBuilder()
                    .setTitle('✅ Success!')
                    .setDescription(`You will be reminded in <t:${endDate}:R> (at <t:${endDate}:t>)`)
                    //.setFooter( { text: `Any issues or questions, please contact` } )
                    .setColor(process.env.defaultColor);

                await interaction.reply( { embeds: [embed], ephemeral: true} );

                await interaction.client.remindAgainItems.splice(userIndex, 1);
                return;

            } catch (error) {
                // TODO: Remember to uncomment this you fool
                console.log(error, 'modal');
                    let owner = await interaction.client.users.fetch(process.env.ownerID);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('Uh Oh..')
                        .setDescription('Something went wrong with this button!\nThe bot developer has been notified about this\napologies for any inconvinence.')
                        .setFooter( { text: `Any issues or questions, please contact ${owner.tag}` } )
                        .setColor(process.env.errorColor);
                    
                    await interaction.reply( { embeds: [errorEmbed], ephemeral: true} );
                    return;
            };
        }

	},
};