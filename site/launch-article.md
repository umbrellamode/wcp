# The Blind Spot in AI-Assisted Coding

**You're coding with AI. Your dev server crashes. You have no idea.**

There's a fundamental problem with how we use AI coding assistants today, and
it's hiding in plain sight.

When Claude Code, Cursor, or any AI agent runs your dev server, something
strange happens: you lose visibility. The terminal becomes a black box. Errors
scroll by unseen. Your hot reload breaks, and you don't find out until you've
made three more changes that depend on code that never compiled.

I built wcp to fix this.

---

## The Problem Nobody Talks About

AI coding assistants have transformed how we write software. They understand
context, refactor fearlessly, and iterate faster than any human could alone. But
there's a catch.

**When your AI runs a dev server, you're coding blind.**

Think about a typical workflow:

1. You ask Claude to start your Next.js dev server
2. Claude runs `npm run dev`
3. You ask for a component change
4. Claude makes the edit
5. You refresh the browser... nothing works

What happened? The dev server threw an error on step 3. Claude saw it, maybe.
You didn't. The feedback loop that makes development feel _alive_, the instant
gratification of seeing your changes work, it's gone.

This isn't a minor inconvenience. It fundamentally breaks the development
experience.

---

## Why This Matters More Than You Think

The magic of modern development is the feedback loop. You write code, you see
results, you iterate. Hot module replacement, live reload, instant preview: these
tools exist because immediate feedback is how humans learn and build.

AI assistants disrupt this loop in a subtle but devastating way.

When you cede terminal control to an AI agent, you lose:

- **Error visibility**: Compilation errors, type mismatches, and runtime
  warnings happen in silence
- **Log context**: The debugging breadcrumbs that tell you _why_ something
  broke
- **Status awareness**: Is the server even running? Did it restart? Is it
  rebuilding?
- **Interactive debugging**: You can't type into a process you can't see

Some developers solve this by running the dev server themselves in a separate
terminal. But that defeats the purpose. You want the AI to handle the
infrastructure while you focus on the logic.

Others try to remember to check back with the AI: "Hey, any errors?" But that's
cognitive overhead. It interrupts flow. And it doesn't work retroactively. By the
time you ask, you've already moved on.

---

## Introducing wcp: Your Window into AI-Controlled Processes

wcp (wormhole control protocol) creates a bridge between your AI's terminal and
yours.

```bash
# In your AI coding session
wcp dev

# In your own terminal
wcp watch
```

That's it. Now you see everything the AI sees—in real-time.

When your dev server throws an error, you see it. When hot reload triggers, you
see it. When a background build completes, you see it.

The AI keeps control. You keep visibility.

---

## How It Works

wcp creates Unix domain sockets that act as log multiplexers. When your AI
starts a dev server through wcp, the output flows to:

1. The AI's terminal (so it can react to errors)
2. Any number of external terminals you connect
3. A ring buffer that stores the last 1000 lines

That ring buffer is crucial. It means you can connect _after_ something happens
and still see what went wrong. Open a terminal five minutes into a session and
you get full context, not a blank screen.

```
$ wcp watch
Connecting to dev session...
--- Replaying 47 buffered lines ---
> next dev
  ▲ Next.js 14.2.0
  - Local: http://localhost:3000

✓ Compiled in 1.2s
--- Live stream ---
```

It's bidirectional too. Type into your terminal and it goes to the process. Need
to answer a prompt, confirm an action, or send a signal? You don't need to ask
the AI to do it for you.

---

## Why I Built This

I kept running into the same frustration.

You're deep in a coding session with Claude. Things are flowing. Then you notice
the browser preview looks stale. You check. The dev server died 10 minutes ago.
Every edit since then compiled against nothing. You've been coding in a void.

Or worse: the server _is_ running, but there's a subtle error. A deprecation
warning that hints at breaking changes. A memory leak log that explains why
things are slow. Information that would have changed your approach, if only
you'd seen it.

I tried workarounds. Split-screen terminals. Periodic check-ins. Asking the AI
to "summarize any errors." None of it felt right.

What I wanted was simple: **see what the AI sees, without taking over what the
AI controls.**

wcp is that window.

---

## Get Started in 30 Seconds

```bash
# Install
curl -fsSL https://wcp.dev/install | bash

# In your AI session: start the dev server
wcp dev

# In your terminal: watch everything
wcp watch
```

wcp auto-detects your project type (Next.js, Vite, Cargo, Go, Deno) and starts the
right dev command. No configuration needed for most projects.

For custom setups, the config lives in a readable `WCP.md` file right in your
project root.

---

## The Future of AI-Assisted Development

AI coding assistants are getting better every month. They're writing more code,
understanding more context, and handling more complexity.

But the interface between human and AI? That's still being figured out.

I believe the answer isn't to give AI more control _or_ to take back control.
It's to build better visibility. Let the AI drive. But give yourself a
dashboard.

wcp is my first step in that direction. A simple tool that solves a real
problem. No magic, no complexity. Just a clear view into what's happening in your
AI-controlled terminals.

Because you shouldn't have to code blind.

---

**wcp is free, open source, and available now.**

```bash
curl -fsSL https://wcp.dev/install | bash
```

Star us on GitHub:
[github.com/umbrellamode/wcp](https://github.com/umbrellamode/wcp)
