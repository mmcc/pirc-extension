# pirc-extension

A [pi](https://pi.dev) extension that decomposes work into IRC-coordinated subagents. A lead agent spawns worker agents that communicate and coordinate over IRC channels in real time.

This is more of a silly experiment rather than something serious. I think there's a lot of promise, and I'm enjoying getting to use IRC again, but I make no guarantees that this is "good" or even a remotely reasonable idea. _Please_ don't subject any public IRC servers to your bots.

I _have_ started using this as just an interface with Pi, even without the subagent stuff, by just chatting with the `lead` in IRC. My setup is that I run the IRC server + Pi session on a small NUC in my basement, then connect to IRC via Tailscale from other devices so I can continue sessions on the go. That part, at the very least, is pretty neat.

## Quick Start

### 1. Run an IRC Server

The easiest way to get started is with [Ergo](https://github.com/ergochat/ergo) via Docker:

```bash
docker run -d \
  --name ergo \
  -p 6667:6667 \
  -p 6697:6697 \
  -v ergo-data:/ircd \
  ghcr.io/ergochat/ergo:stable
```

This gives you a local IRC server on port `6667` (plaintext) and `6697` (TLS) with Ergo's defaults (which are more than likely totally fine for a local usecase).

### 2. Install the Extension

```bash
pi install git:github.com/mmcc/pirc-extension
```

or clone the repo and hack away

```bash
# From your project directory
pnpm add /path/to/pirc-extension
```

Then add it to your project's `package.json`:

```json
{
  "pi": {
    "extensions": ["pirc-extension"]
  }
}
```

Or load it directly when running pi:

```bash
# Via github
pi -e git:github.com/mmcc/pirc-extension

# Via a local clone
pi -e /path/to/pirc-extension
```

### 3. Configure

Configuration is via CLI flags (preferred) or environment variables (fallback). Flags take precedence over env vars.

#### CLI Flags

```bash
pi -e /path/to/pirc-extension \
  --pirc-server localhost \
  --pirc-port 6667 \
  --pirc-nick lead \
  --pirc-channels "#myproject,#myproject-tasks,#myproject-status"
```

#### Environment Variables

```bash
export PIRC_SERVER=localhost
export PIRC_PORT=6667
export PIRC_NICK=lead
export PIRC_CHANNELS="#myproject,#myproject-tasks,#myproject-status"
```

#### Reference

| Flag              | Env Var               | Default                    | Description                                           |
| ----------------- | --------------------- | -------------------------- | ----------------------------------------------------- |
| `--pirc-nick`     | `PIRC_NICK`           | `lead`                     | IRC nickname for the lead agent                       |
| `--pirc-server`   | `PIRC_SERVER`         | `localhost`                | IRC server hostname                                   |
| `--pirc-port`     | `PIRC_PORT`           | `6667`                     | IRC server port                                       |
| `--pirc-channels` | `PIRC_CHANNELS`       | auto                       | Comma-separated list of channels to join              |
| —                 | `PIRC_WATCH_CHANNELS` | same as channels           | Channels that trigger notifications to the lead agent |
| —                 | `PI_PROVIDER`         | `anthropic`                | LLM provider for spawned subagents                    |
| —                 | `PI_MODEL`            | `claude-sonnet-4-20250514` | Model for spawned subagents                           |

When no channels are specified, they default to `#<project>`, `#<project>-tasks`, and `#<project>-status`, where `<project>` is derived from your current working directory name.

## Usage

### Commands

| Command                    | Description                                                                      |
| -------------------------- | -------------------------------------------------------------------------------- |
| `/pirc-plan <description>` | Describe what you want built and the lead agent will decompose it into subagents |
| `/pirc-agents`             | Show running agents and IRC channel status                                       |
| `/pirc-killall`            | Kill all running subagents                                                       |

### Tools

The extension registers these tools, available to both the lead agent and all subagents:

- **`irc_send`** — Send a message to an IRC channel (supports reply threading via `replyTo`)
- **`irc_read`** — Read recent message history from a channel
- **`irc_channels`** — List joined channels and buffered message counts
- **`spawn_agent`** — Spawn a new pi subagent with a role and instructions
- **`list_agents`** — List all running subagents and their status
- **`kill_agent`** — Stop a subagent by nickname
- **`message_agent`** — Send a direct RPC prompt to a subagent (bypasses IRC)

### How It Works

1. The lead pi agent connects to IRC and joins the project channels.
2. When you run `/pirc-plan`, the lead agent breaks the work into roles and spawns subagents.
3. Each subagent is a separate `pi --mode rpc` process that also connects to IRC with the pirc extension loaded.
4. Agents coordinate by posting messages to shared IRC channels — task claims go to `#<project>-tasks`, progress updates to `#<project>-status`, and general discussion to `#<project>`.
5. IRC messages from watched channels are delivered to agents automatically as they arrive.

### Example

```bash
# Start pi in your project with the extension loaded
pi -e /path/to/pirc-extension --pirc-server localhost --pirc-port 6667

# Then in pi:
/pirc-plan Build a REST API with user auth and a test suite
```

The lead agent will spawn workers like `myproject-api-builder`, `myproject-auth`, `myproject-tester` — each with specific instructions — and they'll coordinate over IRC to build it out.
