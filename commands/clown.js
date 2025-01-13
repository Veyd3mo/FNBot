const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const superagent = require('superagent');
require('dotenv').config( { path: `${__dirname}/.env` } );
// player stats command
module.exports = {
    data: new SlashCommandBuilder()
        .setName('clown')
        .setDescription('🤡')
        .addBooleanOption(option => option
            .setName('enabled')
            .setDescription('Set to enabled or disabled')
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

        async run(interaction) {
            const target = interaction.options.getBoolean('enabled');
            console.log(target)
            let config = await interaction.client.db.collection('config').findOne( { guildID: interaction.guild.id } );

            if (!config) { 
                let dataObject = {
                    guildID: await interaction.guild.id,
                    clown: target
                };

                await interaction.client.db.collection('config').insertOne(dataObject);
            };
            
            await interaction.client.db.collection('config').updateOne( { guildID: await interaction.guild.id }, { $set: { clown: target } } );
            const embed = new EmbedBuilder()
                .setTitle('✅ Success!')
                .setDescription(`Clown reaction has been set to ${target}`)
                .setColor(process.env.defaultColor);
                
            await interaction.reply( { embeds: [embed], ephemeral: true } );
            return;
        },
};