const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const moment = require('moment');
require('dotenv').config( { path: `${__dirname}/.env` } );
// player stats command
module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder for yourself.')
        .addStringOption(option => 
            option.setName('reason')
            .setDescription('Input the reason for your reminder')
            .setRequired(true))

        .addIntegerOption(option => option
            .setName('number')
            .setDescription('Input the number value of when you want to remind yourself')
            .setRequired(true))

        .addStringOption(option => 
            option.setName('duration')
            .setDescription('Set if you want it to be in minutes, hours or days')
            .addChoices(
                { name: 'Minutes', value: 'm' },
                { name: 'Hours', value: 'h' },
                { name: 'Days', value: 'd' }
            )
            .setRequired(true)
        ),

        async run(interaction) {
            const reason = interaction.options.getString('reason');
            const reminderNumber = interaction.options.getInteger('number');
            const duration = interaction.options.getString('duration');
            console.log(reminderNumber)
            let config = await interaction.client.db.collection('reminders').findOne( { userID: await interaction.user.id } );

            if (!config) { 
                let dataObject = {
                    userID: await interaction.user.id,
                    reminders: []
                };

                await interaction.client.db.collection('reminders').insertOne(dataObject);
            };

            let endDate;
            if (duration === 'm') {
                endDate = Math.trunc(moment(Date.now()).add(reminderNumber, 'minutes')/1000);
            } else if (duration === 'h') {
                endDate = Math.trunc(moment(Date.now()).add(reminderNumber, 'hours')/1000);
            } else if (duration === 'd') {
                endDate = Math.trunc(moment(Date.now()).add(reminderNumber, 'days')/1000);
            }
            
            await interaction.client.db.collection('reminders').updateOne( { userID: await interaction.user.id }, { $push: { reminders: { reason: reason, remindOn: endDate } } } );

            const embed = new EmbedBuilder()
                .setTitle('✅ Success!')
                .setDescription(`You will be reminded at <t:${endDate}:F> (<t:${endDate}:R>) for ${reason}`)
                .setColor(process.env.defaultColor);
                
            await interaction.reply( { embeds: [embed], ephemeral: true } );
            return;
        },
};