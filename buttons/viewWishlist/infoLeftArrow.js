const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, RESTJSONErrorCodes } = require('discord.js');
const superagent = require('superagent');
const command = require('../../commands/checkWishlist.js');
require('dotenv').config( { path: ".env" } )

module.exports = {
    customID: 'infoLeftArrow',
    
    async run(interaction) {        
        const activeUser = command.usersCurrently.map(subarray => subarray[0]).find(userID => userID === interaction.user.id);

        if (!activeUser) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Uh Oh..')
                .setDescription('Hey, hey, hey? What you clicking random buttons for, eh? Stop trynna ruin someone\'s progress with yo stinky lil mouse\nThis message was not for you. <:cinnamon:1062826210842919012>')
                .setColor(process.env.errorColor);

            await interaction.reply( { embeds: [errorEmbed], ephemeral: true} );
            return;
        };
        let userIndex = command.usersCurrently.flatMap(userID => userID[0]).findIndex(userID => userID === interaction.user.id);
        let currentUser = command.usersCurrently[userIndex];

        let wishlistItems = currentUser[1];
        let itemIndex = currentUser[2] = currentUser[2] - 1;

        //let itemObject =  await superagent.get(`https://fortnite-api.com/v2/cosmetics/br/${wishlistItems[itemIndex].itemID}`).then(response => JSON.parse(response.text));

        let embed = new EmbedBuilder()
            .setTitle(`${interaction.user.displayName}'s Wishlist`)
            .addFields(
                { name: 'ID', value: `${wishlistItems[itemIndex].itemID}` },
                { name: 'Name', value: `${wishlistItems[itemIndex].itemName}` },
                { name: 'Description', value: `${wishlistItems[itemIndex].itemDescription}`},
                //{ name: 'Price', value: `*Will add later down the line*`}
            )
            .setImage(wishlistItems[itemIndex].itemImage)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setColor(process.env.defaultColor)
        
        let row;
        if (itemIndex === 0) {
            row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('infoLeftArrow')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
                    .setEmoji( { name: '◀' } ),
                
                new ButtonBuilder()
                    .setCustomId('infoRightArrow')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji( { name: '▶' } )
            ]);
        } else {
            row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('infoLeftArrow')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji( { name: '◀' } ),
                
                new ButtonBuilder()
                    .setCustomId('infoRightArrow')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji( { name: '▶' } )
            ]);
        };

        await interaction.update( { embeds: [embed], components: [row] } );

       
    },
}