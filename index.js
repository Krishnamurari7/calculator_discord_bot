require('dotenv').config();
const express = require('express'); // New Add
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// --- KEEP-ALIVE SERVER (Render ke liye zaroori) ---
const app = express();
app.get('/', (req, res) => {
    res.send('Bot is running 24/7!');
});
app.listen(3000, () => {
    console.log('Server is ready on port 3000');
});
// --------------------------------------------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Ab hum direct string nahi, environment variable use karenge
const TOKEN = process.env.TOKEN; 
const CLIENT_ID = process.env.CLIENT_ID; 

const commands = [
    new SlashCommandBuilder()
        .setName('budget')
        .setDescription('Calculate tournament budget')
        .addNumberOption(option => option.setName('entry_fee').setDescription('Entry fee').setRequired(true))
        .addNumberOption(option => option.setName('total_teams').setDescription('Total teams').setRequired(true))
        .addNumberOption(option => option.setName('prize_percent').setDescription('Prize pool %').setRequired(false)),

    new SlashCommandBuilder()
        .setName('points')
        .setDescription('Calculate points')
        .addIntegerOption(option => option.setName('rank').setDescription('Rank (1-12)').setRequired(true))
        .addIntegerOption(option => option.setName('kills').setDescription('Kills').setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Commands Registered!');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'budget') {
        const fee = interaction.options.getNumber('entry_fee');
        const teams = interaction.options.getNumber('total_teams');
        const percent = interaction.options.getNumber('prize_percent') || 70;
        
        const total = fee * teams;
        const prize = (total * percent) / 100;
        const profit = total - prize;
        
        const embed = new EmbedBuilder()
            .setColor('#fca311')
            .setTitle('💰 Budget Calculator')
            .addFields(
                { name: 'Collection', value: `₹${total}`, inline: true },
                { name: 'Prize Pool', value: `₹${prize}`, inline: true },
                { name: 'Profit', value: `₹${profit}`, inline: true }
            );
        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'points') {
        const rank = interaction.options.getInteger('rank');
        const kills = interaction.options.getInteger('kills');
        
        const pointsTable = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 };
        const posPts = (rank <= 10 && rank >= 1) ? pointsTable[rank] : 0;
        const total = posPts + kills;

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('📊 Points Calculator')
            .setDescription(`Rank: ${rank} | Kills: ${kills}\n**Total Score: ${total}**`);
        await interaction.reply({ embeds: [embed] });
    }
});

client.login(TOKEN);
