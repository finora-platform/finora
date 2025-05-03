const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

client.on('qr', (qr) => {
    console.log('Scan this QR code:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('WhatsApp is ready!');

    // List all chats (groups) the user is part of
    const chats = await client.getChats();
    const groupName = "Bhai Bhai Bhai 😎🧿🫂"; // Change this to the exact group name
// Find the group by name
    const group = chats.find(chat => chat.isGroup && chat.name === groupName);

    if (group) {
        // Send message to the group
        client.sendMessage(group.id._serialized, "🚀 Trade update message here!");
        console.log("Message sent to the group.");
    } else {
        console.log("Group not found. Double-check the name.");
    }
});

client.initialize();
