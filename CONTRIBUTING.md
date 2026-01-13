# Contributing to wcp

Thank you for your interest in contributing to wcp! This document provides
guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) v2.x or later

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/wcp.git
   cd wcp
   ```
3. Run the tests to make sure everything works:
   ```bash
   deno task test
   ```

## Development Workflow

### Running the Project

```bash
# Run in development mode
deno task dev

# Run tests
deno task test

# Format code
deno fmt

# Lint code
deno lint

# Compile to binary
deno task compile
```

### Code Style

- **Formatting**: Run `deno fmt` before committing
- **Linting**: Run `deno lint` and fix any issues
- **Zero external dependencies**: Only use Deno standard library (`@std/*`)
- **TypeScript**: Use strict types, avoid `any`

### Testing

- Write tests for new features
- Ensure all tests pass before submitting a PR
- Tests are located in the `tests/` directory

## Submitting Changes

### Pull Request Process

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Add my feature"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/my-feature
   ```

4. Open a Pull Request against the `main` branch

### PR Requirements

- All tests must pass
- Code must be formatted (`deno fmt`)
- Code must pass linting (`deno lint`)
- Include a clear description of the changes

### Commit Messages

Write clear, concise commit messages that describe what was changed and why:

- ✅ `Add stdin forwarding to client connections`
- ✅ `Fix socket cleanup on SIGTERM`
- ❌ `Fixed stuff`
- ❌ `WIP`

## Project Structure

```
mod.ts                    # Entry point
src/
├── cli/                  # Command-line interface
│   ├── args.ts          # Argument parsing
│   ├── commands.ts      # Command handlers
│   ├── animation.ts     # ASCII animations
│   ├── detect.ts        # Project detection
│   ├── init.ts          # Init command
│   └── menu.ts          # Interactive menu
├── core/                 # Core functionality
│   ├── daemon.ts        # Server/daemon
│   ├── client.ts        # Client connection
│   ├── broadcast.ts     # Message broadcasting
│   ├── process.ts       # Child process handling
│   └── protocol.ts      # Message protocol
└── utils/                # Utilities
    ├── ring-buffer.ts   # Circular buffer
    └── socket.ts        # Socket management
```

## Reporting Issues

- Use GitHub Issues to report bugs
- Include steps to reproduce the issue
- Include your OS and Deno version
- Include relevant error messages or logs

## Questions?

Feel free to open an issue for any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.
