import ComfyJS from "./wrapper/comfy.wrapper.js"
import { ChatMessage } from "./model/ChatMessage.js";


let messageListeners = [];
let commandListeners = [];

export function connectToChat(channel, login, token) {
    if (channel === "" || channel === undefined) {
        console.warn("[twitch] channel to be specified (if chat connection required)");
        return;
    }

    if (token && login) {
        ComfyJS.Init(login, token, channel);
    } else {
        if (!token && login !== channel) {
            console.warn("[twitch] both login&token must be specified (silent mode connection)");
        }
        ComfyJS.Init(channel);
    }

    ComfyJS.onChat = (user, message, flags, self, extra) => {
        if (self) { // Ignore messages sent by the bot itself
            return;
        }

        const chatMessage = new ChatMessage(
            user,
            message,
            "",
            flags,
            extra,
            ""
        );

        for (const messageListener of messageListeners) { // notify listeners for chat messages
            messageListener(chatMessage);
        }
    };

    ComfyJS.onCommand = (user, command, message, flags, extra) => {
        const chatMessage = new ChatMessage(
            user,
            command + " " + message,
            command,
            flags,
            extra,
            message
        );

        for (const commandListener of commandListeners) { // notify listeners on command
            commandListener(chatMessage);
        }
    }
}

export function say(message, channel) {
    ComfyJS.Say(message, channel);
}

/**
 * @param {(chatMessage: ChatMessage) => void} callback
 */
export function onChatMessage(callback) {
    messageListeners.push(callback);

    // Return a function that can be used to unsubscribe
    return () => {
        messageListeners = messageListeners.filter(
            listener => listener !== callback
        );
    };
}

/**
 * @param {(chatMessage: ChatMessage) => void} callback
 */
export function onCommand(callback) {
    commandListeners.push(callback);

    // Return a function that can be used to unsubscribe
    return () => {
        commandListeners = commandListeners.filter(
            listener => listener !== callback
        )
    }
}