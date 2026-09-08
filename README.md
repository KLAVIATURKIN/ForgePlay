# ForgePlay - Community Interaction Gamepad Controller

Control a virtual gamepad from (uses [PadForge](https://github.com/hifihedgehog/PadForge) as the virtual-controller layer): 
* Twitch chat 
* web controller 
* physical gamepad

## Table of Contents

- [Start Using](#start-using)
- [Twitch Commands](#twitch-commands)
- [Chat Input Syntax](#chat-input-syntax)
- [Web Gamepad](#web-gamepad)
- [Physical Gamepad](#physical-gamepad)
- [PadForge Setup](#padforge-setup)
- [Reference](#reference)

---

## Start Using

This is the **basic setup**. Advanced Twitch/WebSocket options can be configured later from the controller setup page.

1. Download the [latest PadForge release](https://github.com/hifihedgehog/PadForge/releases).
2. Read [PadForge — Your First Controller](https://padforge.org/docs/start/first-controller/) to learn how to create a virtual controller and assign real or web inputs to it.
3. Run **ForgePlay.exe**.
4. Open the web link provided by ForgePlay using web browser of PC/Tablet/Phone you want to use as a controller.
5. On **Configure your controller**:
   - Select the controller **Layout**.
   - Select the **Color**.
   - Leave **Advanced setup** disabled for the basic setup.
   - Enable **Physical gamepad** (when you want to pass a connected PC gamepad through the controller).
   - Leave **Client** empty unless you need to set a specific client ID to have static name; (application can generate one automatically per browser tab).
6. Click **Connect**.
7. Use the opened controller page as the web gamepad, or use the physical gamepad if enabled.
8. In PadForge, assign the Web Controller input to your virtual controller.

Under **Advanced setup**: Setup page provides optional **Twitch chat** and **WebSocket target** settings.
For Token Generation is used [TwitchTokenGenerator](https://twitchtokengenerator.com/quick/sh8gi7wxv0) app:
* open the link of [TwitchTokenGenerator](https://twitchtokengenerator.com/quick/sh8gi7wxv0)
* scroll down and click **Request Token**
* login with Twitch Account
* copy generated token from **Access token** (Generated Tokens panel)
* paste into ForgePlay Setup UI (with same login name used while token generated)

---

## Twitch Commands

| Command              | Chat user  | Moderator | Description                                                                                     |
|----------------------|:----------:|:---------:|-------------------------------------------------------------------------------------------------|
| `!claim @username`   |     ✓     |     —     | Request exclusive chat control.                                                                 |
| `!claim @username`   |     ✓     |     —     | Moderator can use the same command to allow user immediately, without voting.                   |
| `!accept @username`  |     ✓     |    ✓     | Vote to accept a pending control request. **3 votes are required**.                             |
| `!claim status`      |     ✓     |    ✓     | Show the current owner, remaining control time, and pending requests.                           |
| `!release`           | ✓ (owner) |     —     | Release your current control.                                                                   |
| `!release @username` |     —      |    ✓     | Force a user to release control.                                                                |
| `!skip`              |     ✓     |     -     | Vote to skip the current input sequence (**3 votes required**). Moderator skips immediately.    |
| `!skipAll`           |     ✓     |    ✓     | Same as `!skip`, also clears the waiting sequence queue. Moderator skips/clear immediately.     |

> Control ownership and voting are intended to keep chat input manageable when many users are sending commands.

---

## Chat Input Syntax

Inputs are processed from left to right and queued so that one chat sequence runs at a time.

### Basic inputs

__basic inputs available for Chat Sequences:__

| buttons | dpad  | sticks | trigger | touchpad | DualShock/DualSense | xbox | desctiption                                 |
|:-------:|:-----:|:------:|:-------:|:--------:|:-------------------:|:----:|---------------------------------------------|
|         |       |        |         |   tpad   |         ✓          |  -   | click touchpad                              |
|    a    |       |        |         |          |         ✓          |  ✓  | A button click                              |
|    b    |       |        |         |          |         ✓          |  ✓  | B button click                              |
|    x    |       |        |         |          |         ✓          |  ✓  | X button click                              |
|    y    |       |        |         |          |         ✓          |  ✓  | Y button click                              |
|   lb    |       |        |         |          |         ✓          |  ✓  | left bumper click                           |
|   rb    |       |        |         |          |         ✓          |  ✓  | right bumber click                          |
|  back   |       |        |         |          |         ✓          |  ✓  | back button                                 |
|  start  |       |        |         |          |         ✓          |  ✓  | start button                                |
|   ls    |       |   ls   |         |          |         ✓          |  ✓  | left stick click (stick control by web)     |
|   rs    |       |   rs   |         |          |         ✓          |  ✓  | right stick click (stick control by web     |
|  home   |       |        |         |          |         ✓          |  ✓  | home button click                           |
|         |  up   |        |         |          |         ✓          |  ✓  | UP dpad click                               |
|         |   u   |        |         |          |         ✓          |  ✓  | UP dpad click(short)                        |
|         | down  |        |         |          |         ✓          |  ✓  | DOWN dpad click                             |
|         |   d   |        |         |          |         ✓          |  ✓  | DOWN dpad click(short)                      |
|         | left  |        |         |          |         ✓          |  ✓  | LEFT dpad click                             |
|         |   l   |        |         |          |         ✓          |  ✓  | LEFT dpad click(short)                      |
|         | right |        |         |          |         ✓          |  ✓  | RIGHT dpad click                            |
|         |   r   |        |         |          |         ✓          |  ✓  | RIGHT dpad click(short)                     |
|         |       |        |   lt    |          |         ✓          |  ✓  | left trigger (physical pad controls pad %)  |
|         |       |        |   rt    |          |         ✓          |  ✓  | right trigger (physical pad controls pad %) |


### Input variants

| Chat input     | Example      | What happens                                                                  |
|----------------|--------------|-------------------------------------------------------------------------------|
| Press          | `!a`         | Press **A** for the default duration (200 ms).                                |
| Simultaneous   | `!a+b`       | Press **A and **B** at the same time.                                         |
| Timed(millis)  | `!a500ms`    | Hold **A** for 500 milliseconds, then release it.                             |
| Timed(seconds) | `!a1s`       | Hold **A** for 1 second, then release it.                                     |
| Timed(simult)  | `!a1s+b2s`   | Press **A** and **B** together, hold **A** for 1 sec and **B** for 2 sec.     |
| Hold           | `!_a`        | Press **A** and keep it held until it is released or the sequence ends.       |
| Hold(timed)    | `!_a500ms`   | _\[Same as Press\]_ Press **A**, keep it pressed for 500 ms, then release it. |
| Release        | `!-a`        | Release **A** immediately.                                                    |
| Release(timed) | `!-a500ms`   | Release **A**, keep it released for 500 ms, then press it again.              |
| Delay          | `!#500ms`    | Wait 500 ms without sending any input.                                        |
| Repeats        | `![a b]*3`   | Press **A** then Press **B** - repeat 3 times.                                |
| Group duration | `[a+b]500ms` | Apply 500 ms to grouped actions that do not already define a duration.        |

### Examples

_At the end of every chat sequence, the controller is reset to a safe neutral state._

> Press A, then press B after A's action finishes.\
> `!a b`

> Press A and B together.\
> `!a+b`

> Press A, then B, repeat three times.\
> `![a b]*3`

> Press A, wait 500 ms, then press B.\
> `!a #500ms b`

---

## Web Gamepad

The web controller is a touch/mouse interface that looks like a gamepad.

1. Use the on-screen buttons, D-pad, triggers, sticks, and touchpad where supported.
2. Inputs are sent directly to the virtual gamepad.
3. responds with vibration (also vibration triggers by a game events)

The web controller supports:
- Buttons
- D-pad
- Analog sticks
- Triggers
- Touchpad / touchpad click where the selected layout provides them

Use landscape orientation for the best experience.

---

## Physical Gamepad

A real gamepad can be used as another input source.

1. Connect the physical controller to the PC running the web application.
2. Open the ForgePlay page.
3. Enable physical-gamepad mode (`physical=1` in the application URL).
4. Press buttons or move the sticks on the connected controller.
5. The physical input is translated to the same virtual gamepad used by chat and the web controller.
6. responds with vibration by game events.

The application automatically monitors the browser's Gamepad API and maps the controller's buttons, D-pad, triggers and sticks.

---

## PadForge Setup

PadForge is responsible for creating the **virtual controller** that the game sees.

Follow the official guide:

[PadForge — Your First Controller](https://padforge.org/docs/start/first-controller/)

Typical setup:

```text
Real Controller / Web Controller
                ↓
        ForgePlay Client
                ↓
      PadForge input source
                ↓
    PadForge virtual controller
                ↓
              Games
```

For PadForge installation and current requirements, see the official documentation:

[PadForge Documentation](https://padforge.org/docs/)

---

## Reference

This project is **inspired by [PadForge](https://github.com/hifihedgehog/PadForge)** and uses PadForge as the virtual-controller layer.

- [PadForge GitHub](https://github.com/hifihedgehog/PadForge)
- [PadForge Releases](https://github.com/hifihedgehog/PadForge/releases)
- [PadForge Documentation](https://padforge.org/docs/)
- [ComfyJS](https://github.com/instafluff/ComfyJS)
- [Token Generator](https://twitchtokengenerator.com/quick/sh8gi7wxv0)