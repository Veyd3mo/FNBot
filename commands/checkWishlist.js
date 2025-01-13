const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const superagent = require('superagent');
require('dotenv').config( { path: `${__dirname}/.env` } );

module.exports = {
    usersCurrently: [],
    data: new SlashCommandBuilder()
        .setName('checkwishlist')
        .setDescription('Check the items on your wishlist right now.'),
        /*.addStringOption(option =>
            option.setName('category')
            .setDescription('Search for bans, kicks, timeouts or all.')
            .setRequired(true)
            .addChoices(
                { name: 'bans', value: 'bans' },
                { name: 'kicks', value: 'kicks' },
                { name: 'timeouts', value: 'timeouts' },
                { name: 'all', value: 'all'} 
            )
        )*/
        
    async run(interaction) {
        try {
            
            let userIndex = this.usersCurrently.flatMap(userID => userID[0]).findIndex(userID => userID === interaction.user.id);

            if (userIndex !== -1) {
                this.usersCurrently.splice(userIndex, 1);
            };

            userIndex = this.usersCurrently.flatMap(userID => userID[0]).findIndex(userID => userID === interaction.user.id);

            let user = await interaction.client.db.collection('wishlists').findOne( { userID: await interaction.user.id } );
            //let itemObject =  await superagent.get(`https://fortnite-api.com/v2/cosmetics/br/${user['wishlist'][0].itemID}`).then(response => JSON.parse(response.text));
            let image;
            
            let embed = new EmbedBuilder()
                .setTitle(`${interaction.user.displayName.charAt(0).toUpperCase()}${interaction.user.displayName.substring(1)}'s Wishlist`)
                .addFields(
                    { name: 'ID', value: `${user['wishlist'][0].itemID}` },
                    { name: 'Name', value: `${user['wishlist'][0].itemName}` },
                    { name: 'Description', value: `${user['wishlist'][0].itemDescription}`},
                    //{ name: 'Price', value: `*Will add later down the line*`}
                )
                .setImage(user['wishlist'][0].itemImage)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setColor(process.env.defaultColor)

            let row;
            if (user['wishlist'].length === 1) {
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
                            .setDisabled(true)
                            .setEmoji( { name: '▶' } )
                    ]);
            } else {
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
            };

            this.usersCurrently.push([interaction.user.id, user['wishlist'], 0]);
            userIndex = this.usersCurrently.flatMap(userID => userID[0]).findIndex(userID => userID === interaction.user.id);

            await interaction.reply( { embeds: [embed], components: [row] } );
            console.log(this.usersCurrently);
            setTimeout(async () => {
                this.usersCurrently.splice(userIndex, 1);
                await interaction.deleteReply(await interaction.fetchReply()).catch();
            }, 3 * 60000);

            return;
        } catch(err) {
            console.log(err)
        }
    },
};