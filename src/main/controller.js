import {connectToChat, onChatMessage, onCommand, say} from './twitch.js';
import {XBOX360gamepad} from "./gamepad/XBOX360gamepad.js";
import {XBOXONEgamepad} from "./gamepad/XBOXONEgamepad.js";
import {XBOXSgamepad} from "./gamepad/XBOXSgamepad.js";
import {DS4gamepad} from "./gamepad/DS4gamepad.js";
import {DUALSENSEgamepad} from "./gamepad/DUALSENSEgamepad.js";
import {PhysicalGamepad} from "./gamepad/PHYSICALgamepad.js";
import {CommandExecutor} from "./input/CommandExecutor.js";
import {InputCommandQueue} from "./input/InputCommandQueue.js";
import {CommandParser} from "./input/CommandParser.js";
import {LayoutInitializer} from "./layout/LayoutInitializer.js";
import {createCommandHandler} from "./command/CommandHandler.js";
import {controllerView} from "./layout/ControllerView.js";
import {SCgamepad} from "./gamepad/SCgamepad.js";

const params = new URLSearchParams(
    typeof location !== "undefined" ? location.search : ""
);
const layout = params.get("layout") || "xbox360";
const color = params.get("color") || "default";
const host = params.get("host") || "";
const port = params.get("port") || "";
const client = params.get("client") || "";
const channel = params.get("channel") || "";
const login = params.get("login") || channel;
const token = params.get("token") || "";
const physical = (params.get("physical") || "0") === "1";

let gamepad;
switch (layout.toLowerCase()) {
    case "xbox360"   : gamepad = new XBOX360gamepad  (client, host, port); break;
    case "xbox1"     :
    case "xboxone"   : gamepad = new XBOXONEgamepad  (client, host, port); break;
    case "xboxseries":
    case "xboxs"     : gamepad = new XBOXSgamepad    (client, host, port); break;
    case "ds4"       : gamepad = new DS4gamepad      (client, host, port); break;
    case "dualsense" : gamepad = new DUALSENSEgamepad(client, host, port); break;
    // case "steamcontroller" : gamepad = new SCgamepad(client, host, port); break;
    default          : gamepad = new XBOX360gamepad  (client, host, port); break;
}

const executor = new CommandExecutor(gamepad);
const queue = new InputCommandQueue(executor);
const parser = new CommandParser(gamepad.validInputs());
const layoutControl = new LayoutInitializer(gamepad, color, controllerView);
layoutControl.initialize().then(r => {
    if (physical) {
        new PhysicalGamepad(gamepad).start();
        console.log("[APP] Physical gamepad input enabled");
    }
    console.log("[APP] gamepad been initialized");
});
const { commandHandler, claimControl } = createCommandHandler(
    queue,
    {
        say(message) {
            if (token && login) {
                say(message, channel);
            }
        }
    }
)

connectToChat(channel, login, token);
onChatMessage((message) => {
    // controllerView.setStatus(message.user + ": " + message.content)
});
onCommand((message) => {
    if (commandHandler.handle(message)) {
        return;
    }
    if (!claimControl.canExecute(message)) {
        return;
    }

    try {
        const sequence = parser.parse(message);
        queue.enqueue(sequence);
    } catch (error) {
        console.error("[APP] invalid input: " + error);
    }
});