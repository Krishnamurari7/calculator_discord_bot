require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// --- 1. KEEP-ALIVE SERVER (Render ke liye) ---
const app = express();
app.get('/', (req, res) => res.send('🔥 FF Tournament Bot is Running 24/7!'));
app.listen(3000, () => console.log('✅ Keep-Alive Server Ready on Port 3000'));

// --- 2. CONFIGURATION ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const FF_COLOR = '#FFAA00'; // Free Fire Gold Color
const FF_LOGO = 'https://dl.dir.freefiremobile.com/common/web_event/official2.0/images/share_img.jpg'; // Official Logo

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// --- 3. COMMANDS LIST ---
const commands = [
    // Command: Budget
    new SlashCommandBuilder()
        .setName('budget')
        .setDescription('💰 Calculate Prize Pool, Profit & Split')
        .addNumberOption(opt => opt.setName('entry_fee').setDescription('Entry Fee per Squad').setRequired(true))
        .addNumberOption(opt => opt.setName('total_teams').setDescription('Total Teams/Slots').setRequired(true))
        .addNumberOption(opt => opt.setName('prize_percent').setDescription('Prize Pool % (Default 70%)').setRequired(false)),

    // Command: Points
    new SlashCommandBuilder()
        .setName('points')
        .setDescription('📊 Calculate Team Score (Position + Kills)')
        .addIntegerOption(opt => opt.setName('rank').setDescription('Team Position (1-12)').setRequired(true))
        .addIntegerOption(opt => opt.setName('kills').setDescription('Total Kills').setRequired(true)),

    // Command: Toss (New)
    new SlashCommandBuilder()
        .setName('toss')
        .setDescription('🪙 Flip a coin for map selection or tie-breaker'),

    // Command: Format (New)
    new SlashCommandBuilder()
        .setName('format')
        .setDescription('📝 Get a text format for Team Registration'),

    // Command: Help (New)
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('❓ See all available commands')
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

// --- 4. REGISTER COMMANDS ---
client.once('ready', async () => {
    console.log(`🤖 Logged in as ${client.user.tag}!`);
    try {
        console.log('🔄 Refreshing commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Commands Registered Successfully!');
    } catch (error) {
        console.error(error);
    }
});

// --- 5. HANDLING COMMANDS ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- LOGIC: BUDGET ---
    if (interaction.commandName === 'budget') {
        const fee = interaction.options.getNumber('entry_fee');
        const teams = interaction.options.getNumber('total_teams');
        const percent = interaction.options.getNumber('prize_percent') || 70;

        const totalCollection = fee * teams;
        const prizePool = (totalCollection * percent) / 100;
        const profit = totalCollection - prizePool;

        // Auto Split (50% - 30% - 20%)
        const p1 = Math.floor(prizePool * 0.50);
        const p2 = Math.floor(prizePool * 0.30);
        const p3 = Math.floor(prizePool * 0.20);

        const embed = new EmbedBuilder()
            .setColor(FF_COLOR)
            .setTitle('💰 Tournament Finance Calculator')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/3135/3135706.png') // Money Icon
            .setDescription(`**Entry Fee:** ₹${fee} | **Teams:** ${teams}`)
            .addFields(
                { name: '💵 Total Collection', value: `\`₹${totalCollection}\``, inline: true },
                { name: '🏆 Total Prize Pool', value: `\`₹${prizePool}\``, inline: true },
                { name: '📈 Organizer Profit', value: `\`₹${profit}\``, inline: true },
                { name: '\u200B', value: '-----------------------------' }, // Separator
                { name: '🥇 1st Place (50%)', value: `**₹${p1}**`, inline: true },
                { name: '🥈 2nd Place (30%)', value: `**₹${p2}**`, inline: true },
                { name: '🥉 3rd Place (20%)', value: `**₹${p3}**`, inline: true }
            )
            .setFooter({ text: 'Calculated by FF Manager Bot', iconURL: FF_LOGO })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // --- LOGIC: POINTS ---
    if (interaction.commandName === 'points') {
        const rank = interaction.options.getInteger('rank');
        const kills = interaction.options.getInteger('kills');

        // FF Official Points Table
        const pointsTable = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 };
        
        let posPts = 0;
        let titleText = `Rank #${rank}`;
        let color = '#ffffff'; // Default White

        if (rank === 1) {
            posPts = 12;
            titleText = "🏆 BOOYAH! (Rank #1)";
            color = '#FFD700'; // Gold
        } else if (rank >= 2 && rank <= 12) {
            posPts = pointsTable[rank] || 0;
            color = '#C0C0C0'; // Silver/Grey
        } else {
            return interaction.reply({ content: '❌ Invalid Rank! Please enter 1-12.', ephemeral: true });
        }

        const totalScore = posPts + kills;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: 'Match Result Calculator', iconURL: FF_LOGO })
            .setTitle(titleText)
            .addFields(
                { name: '📍 Position Points', value: `${posPts}`, inline: true },
                { name: '💀 Kill Points', value: `${kills}`, inline: true },
                { name: '🔥 TOTAL SCORE', value: `__**${totalScore}**__`, inline: true }
            )
            .setFooter({ text: 'Official FF Scoring System' });

        await interaction.reply({ embeds: [embed] });
    }

    // --- LOGIC: TOSS ---
    if (interaction.commandName === 'toss') {
        const outcomes = ['Heads', 'Tails'];
        const result = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🪙 Coin Toss')
            .setDescription(`The coin landed on: **${result.toUpperCase()}**`);

        await interaction.reply({ embeds: [embed] });
    }

    // --- LOGIC: FORMAT ---
    if (interaction.commandName === 'format') {
        const formatText = `
**📋 TEAM REGISTRATION FORMAT**
-----------------------------
**Team Name:** [Your Team Name]
**Leader:** [Leader Name + UID]
**Contact:** [WhatsApp No]
**Members:**
1. Player 1 (UID)
2. Player 2 (UID)
3. Player 3 (UID)
4. Player 4 (UID)
        `;
        await interaction.reply({ content: "Here is the format to copy:", code: true }); // Sends as code block
        await interaction.channel.send(formatText);
    }

    // --- LOGIC: HELP ---
    if (interaction.commandName === 'help') {
        const embed = new EmbedBuilder()
            .setColor(FF_COLOR)
            .setTitle('🤖 Bot Commands List')
            .setThumbnail(FF_LOGO)
            .addFields(
                { name: '💰 /budget', value: 'Calculate Profit & Prize distribution' },
                { name: '📊 /points', value: 'Calculate Total Score from Rank & Kills' },
                { name: '🪙 /toss', value: 'Flip a coin for tie-breakers' },
                { name: '📝 /format', value: 'Get Team Registration Format' }
            )
            .setFooter({ text: 'Developed for FF Tournaments' });

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(TOKEN);
