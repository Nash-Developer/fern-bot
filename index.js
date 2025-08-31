const { 
    Client,
    Events,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Map();

const helloCommand = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Replies with Hello!'),
    async execute(interaction) {
        await interaction.reply('Hello there!');
    },
};

client.commands.set(helloCommand.data.name, helloCommand);


client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Ready! Logged in as ${readyClient.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Started refreshing application (/) commands.');
        
        const commandsToRegister = [];
        for (const command of client.commands.values()) {
            commandsToRegister.push(command.data.toJSON());
        }

        await rest.put(
            Routes.applicationCommands(readyClient.user.id),
            { body: commandsToRegister },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {

    if (!interaction.isChatInputCommand()) { 
        return;
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (!interaction.replied || !interaction.deferred) {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            })
        }

        await interaction.followUp({
            content:'There was an error while executing this command!',
            ephemeral: true
        })
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);