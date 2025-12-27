require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// --- 1. SETTINGS (Yahan Apni Details Daalein) ---
const CONFIG = {
    color: '#FFAA00', // Free Fire Orange
    logo: 'https://dl.dir.freefiremobile.com/common/web_event/official2.0/images/share_img.jpg',
    upi_id: 'your-upi-id@okbank', // Yahan apni UPI ID likh sakte hain
    qr_image: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg' // Yahan apna QR Code image link dalein
};

// --- 2. KEEP-ALIVE SERVER (Render ke liye) ---
const app = express();
app.get('/', (req, res) => res.send('🔥 Tournament Bot is Live!'));
app.listen(3000, () => console.log('✅ Server Ready on Port 3000'));

// --- 3. BOT SETUP ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- 4. COMMANDS LIST ---
const commands = [
    // 1. Budget Calculator
    new SlashCommandBuilder()
        .setName('budget')
        .setDescription('💰 Calculate Prize Pool & Profit')
        .addNumberOption(o => o.setName('entry').setDescription('Entry Fee').setRequired(true))
        .addNumberOption(o => o.setName('teams').setDescription('Total Teams').setRequired(true)),

    // 2. Points Calculator
    new SlashCommandBuilder()
        .setName('points')
        .setDescription('📊 Calculate Team Score')
        .addIntegerOption(o => o.setName('rank').setDescription('Rank (1-12)').setRequired(true))
        .addIntegerOption(o => o.setName('kills').setDescription('Kills').setRequired(true)),

    // 3. Slot List Maker (NEW)
    new SlashCommandBuilder()
        .setName('slots')
        .setDescription('wc Generate empty Slot List for management'),

    // 4. Rules (NEW)
    new SlashCommandBuilder()
        .setName('rules')
        .setDescription('📜 Post Official Tournament Rules'),

    // 5. Payment Info (NEW)
    new SlashCommandBuilder()
        .setName('pay')
        .setDescription('💳 Show UPI/QR for Entry Fee'),
        
    // 6. Help
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('❓ Show all commands')
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ All Features Loaded!');
});

// --- 5. COMMAND LOGIC ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // --- SLOT LIST COMMAND ---
    if (commandName === 'slots') {
        const slotText = `
**📋 TOURNAMENT SLOT LIST**
---------------------------
Slot 1: 
Slot 2: 
Slot 3: 
Slot 4: 
Slot 5: 
Slot 6: 
Slot 7: 
Slot 8: 
Slot 9: 
Slot 10: 
Slot 11: 
Slot 12: 
---------------------------
*Copy this list and edit team names!*
        `;
        await interaction.reply({ content: "Niche diye gaye text ko copy karke Teams ka naam bharein:", ephemeral: true });
        await interaction.channel.send(`\`\`\`${slotText}\`\`\``);
    }

    // --- RULES COMMAND ---
    if (commandName === 'rules') {
        const embed = new EmbedBuilder()
            .setColor('#FF0000') // Red for Alert
            .setTitle('📜 OFFICIAL TOURNAMENT RULES')
            .setThumbnail(CONFIG.logo)
            .addFields(
                { name: '1. General', value: '• Map: Bermuda / Purgatory\n• Mode: Squad (4v4)\n• Emulator: **Not Allowed** 🚫' },
                { name: '2. Scoring', value: '• Booyah = 12 Pts\n• 1 Kill = 1 Pt' },
                { name: '3. Disqualification', value: '• Teaming up with other squads.\n• Hacking or Glitch using.\n• Abusing in All-Chat.' },
                { name: '4. Prize Distribution', value: '• Prize will be sent via UPI within 2 hours of match end.' }
            )
            .setFooter({ text: 'Follow rules to avoid ban!' });
        
        await interaction.reply({ embeds: [embed] });
    }

    // --- PAYMENT COMMAND ---
    if (commandName === 'pay') {
        const embed = new EmbedBuilder()
            .setColor('#2ecc71') // Green for Money
            .setTitle('💳 Payment Details')
            .setDescription('Please pay the entry fee to confirm your slot.')
            .addFields(
                { name: 'UPI ID', value: `\`${CONFIG.upi_id}\``, inline: true },
                { name: 'Scan QR', value: 'Scan below to pay', inline: true }
            )
            .setImage(CONFIG.qr_image) // QR Code
            .setFooter({ text: 'Send screenshot after payment!' });

        await interaction.reply({ embeds: [embed] });
    }

    // --- BUDGET COMMAND ---
    if (commandName === 'budget') {
        const fee = interaction.options.getNumber('entry');
        const teams = interaction.options.getNumber('teams');
        
        const total = fee * teams;
        const prize = total * 0.70; // 70% Prize
        const profit = total - prize; // 30% Profit

        const embed = new EmbedBuilder()
            .setColor(CONFIG.color)
            .setTitle('💰 Budget Overview')
            .addFields(
                { name: 'Total Collection', value: `₹${total}`, inline: true },
                { name: 'Prize Pool (70%)', value: `₹${prize}`, inline: true },
                { name: 'Your Profit', value: `₹${profit}`, inline: true },
                { name: 'Distribution', value: `🥇 1st: ₹${(prize*0.5).toFixed(0)}\n🥈 2nd: ₹${(prize*0.3).toFixed(0)}\n🥉 3rd: ₹${(prize*0.2).toFixed(0)}` }
            );
        await interaction.reply({ embeds: [embed] });
    }

    // --- POINTS COMMAND ---
    if (commandName === 'points') {
        const rank = interaction.options.getInteger('rank');
        const kills = interaction.options.getInteger('kills');
        
        const ptsMap = { 1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1 };
        const score = (ptsMap[rank] || 0) + kills;

        const embed = new EmbedBuilder()
            .setColor(CONFIG.color)
            .setTitle(`Rank #${rank} Result`)
            .setDescription(`Kills: **${kills}** | Total Points: **${score}**`);
        
        await interaction.reply({ embeds: [embed] });
    }

    // --- HELP COMMAND ---
    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setColor(CONFIG.color)
            .setTitle('🤖 Bot Commands')
            .setDescription('Use these commands to manage your tournament:')
            .addFields(
                { name: '/slots', value: 'Get empty slot list format' },
                { name: '/rules', value: 'Post tournament rules' },
                { name: '/pay', value: 'Show UPI/QR for payments' },
                { name: '/budget', value: 'Calculate money & profit' },
                { name: '/points', value: 'Calculate team points' }
            );
        await interaction.reply({ embeds: [embed] });
    }
});

client.login(TOKEN);
