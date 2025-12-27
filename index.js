const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(3000, () => {
  console.log('Keep-Alive Server is running on port 3000');
});

require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// 1. Bot Setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Yahan apna Token daalein (Better security ke liye .env file use karein)
const TOKEN = 'MTQ1NDU0NzgzMzgzNDMxMTY5NA.GYIcK-.dqAyrg4v_kzA4kTY5nJFHZXI6CHXq7ahywCFsc';
const CLIENT_ID = '1454547833834311694'; // Bot ka Application ID

// 2. Commands Define Karna
const commands = [
    // Command 1: Budget Calculator
    new SlashCommandBuilder()
        .setName('budget')
        .setDescription('Calculate tournament budget, prize pool, and profit')
        .addNumberOption(option => 
            option.setName('entry_fee')
                .setDescription('Entry fee per squad')
                .setRequired(true))
        .addNumberOption(option => 
            option.setName('total_teams')
                .setDescription('Total number of teams')
                .setRequired(true))
        .addNumberOption(option => 
            option.setName('prize_percent')
                .setDescription('Percentage for prize pool (default 70%)')
                .setRequired(false)),

    // Command 2: Points Calculator
    new SlashCommandBuilder()
        .setName('points')
        .setDescription('Calculate team points based on Position and Kills')
        .addIntegerOption(option => 
            option.setName('rank')
                .setDescription('Team Position (1 to 12)')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('kills')
                .setDescription('Total Kills')
                .setRequired(true))
];

// 3. Commands Register Karna (Bot start hone par)
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    try {
        console.log('Refreshing slash commands...');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        console.log('Successfully registered commands!');
    } catch (error) {
        console.error(error);
    }
});

// 4. Command Logic (Calculator)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- LOGIC FOR BUDGET ---
    if (interaction.commandName === 'budget') {
        const fee = interaction.options.getNumber('entry_fee');
        const teams = interaction.options.getNumber('total_teams');
        const percent = interaction.options.getNumber('prize_percent') || 70; // Default 70%

        const totalCollection = fee * teams;
        const prizePool = (totalCollection * percent) / 100;
        const profit = totalCollection - prizePool;

        // Suggested Split (50-30-20)
        const p1 = Math.floor(prizePool * 0.50);
        const p2 = Math.floor(prizePool * 0.30);
        const p3 = Math.floor(prizePool * 0.20);

        const budgetEmbed = new EmbedBuilder()
            .setColor('#fca311') // FF Orange Color
            .setTitle('💰 Tournament Budget Calculator')
            .addFields(
                { name: 'Total Collection', value: `₹${totalCollection}`, inline: true },
                { name: 'Total Prize Pool', value: `₹${prizePool}`, inline: true },
                { name: 'Organizer Profit', value: `₹${profit}`, inline: true },
                { name: '\u200B', value: '\u200B' }, // Spacer
                { name: '🏆 Suggested Prize Distribution', value: `🥇 1st: ₹${p1}\n🥈 2nd: ₹${p2}\n🥉 3rd: ₹${p3}` }
            )
            .setFooter({ text: 'Free Fire Tournament Manager' });

        await interaction.reply({ embeds: [budgetEmbed] });
    }

    // --- LOGIC FOR POINTS ---
    if (interaction.commandName === 'points') {
        const rank = interaction.options.getInteger('rank');
        const kills = interaction.options.getInteger('kills');
        
        // FF Official Scoring System (Standard)
        let posPoints = 0;
        const pointsTable = {
            1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 
            6: 5, 7: 4, 8: 3, 9: 2, 10: 1
        };

        if (rank > 12 || rank < 1) {
            return interaction.reply({ content: '❌ Invalid Rank! Please enter rank between 1 and 12.', ephemeral: true });
        }

        posPoints = pointsTable[rank] || 0; // 11th aur 12th ko 0 points
        const killPoints = kills * 1; // 1 point per kill
        const totalScore = posPoints + killPoints;

        const pointsEmbed = new EmbedBuilder()
            .setColor('#00ff00') // Green Color
            .setTitle('📊 Team Score Calculator')
            .setDescription(`Results for **Rank #${rank}** with **${kills} Kills**`)
            .addFields(
                { name: 'Position Points', value: `${posPoints}`, inline: true },
                { name: 'Kill Points', value: `${killPoints}`, inline: true },
                { name: 'TOTAL SCORE', value: `**${totalScore}**`, inline: true }
            );

        await interaction.reply({ embeds: [pointsEmbed] });
    }
});

client.login(TOKEN);