# Natural Language CLI (nlcli)

A command-line interface that converts natural language instructions into bash commands using NestJS Commander.

## Features

- 🤖 **AI-Powered**: Uses OpenAI to understand natural language instructions
- 🗣️ **Natural Language Processing**: Convert human-readable instructions to bash commands
- 📋 **Multiple Options**: Get several command options for each instruction
- 🔍 **Risk Assessment**: Each command is labeled with risk levels (low, medium, high)
- 🛡️ **Safe Execution**: Confirmation prompts before executing commands
- 🔄 **Dry Run Mode**: Preview commands without executing them
- 🎨 **Beautiful Interface**: Colorful, intuitive command-line interface
- 🔄 **Fallback System**: Falls back to pattern matching if OpenAI is unavailable

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm run build
```

3. Install the CLI globally:
```bash
pnpm run install-global
```

This will build the project and link it globally so you can use `nlcli` from anywhere.

## Configuration

### OpenAI API Setup (Recommended)

For the best experience, configure OpenAI API access:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

2. Create a `.env` file in the project root:
```bash
cp env.example .env
```

3. Add your OpenAI API key to the `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. The CLI will automatically use OpenAI for natural language processing

### Without OpenAI (Fallback Mode)

If no OpenAI API key is configured, the CLI will fall back to pattern matching. This provides basic functionality but with limited understanding of natural language.

## Usage

### Global Usage (Recommended)
Once installed globally, you can use `nlcli` from any directory:

```bash
# Interactive mode - CLI will prompt for instructions
nlcli

# Direct instruction
nlcli -i "list all files in the current directory"

# Dry run mode - preview commands without executing
nlcli -d -i "delete all text files"

# Get help
nlcli --help
```

### Local Development Usage
For development or if not installed globally:
```bash
# Interactive mode
npx ts-node src/main.ts

# Direct instruction
npx ts-node src/main.ts -i "list all files in the current directory"

# Dry run mode
npx ts-node src/main.ts -d -i "delete all text files"
```

### Global CLI Management
```bash
# Update the global CLI after making changes
pnpm run update-global

# Uninstall the global CLI
pnpm run uninstall-global

# Reinstall the global CLI
pnpm run install-global
```

## Example Commands

The CLI understands various types of natural language instructions. With OpenAI, it can handle complex and varied phrasing:

### File Operations
- "list all files in the current directory"
- "show me what's in this folder with details"
- "create a new folder called projects"
- "make a file named test.txt"
- "delete the file readme.md"
- "find all JavaScript files in subdirectories"
- "copy all images to a backup folder"

### Git Operations
- "check git status"
- "what's the current state of my repository?"
- "add all files to git"
- "commit the changes with a message"
- "push to main branch"
- "show me the recent commits"
- "create a new branch for feature development"

### System Operations
- "show current directory"
- "where am I in the filesystem?"
- "check disk usage"
- "show running processes"
- "find files containing 'config'"
- "monitor system resources"
- "check network connectivity"

### Package Management
- "install express package"
- "add lodash to my project"
- "start the development server"
- "build the project for production"
- "update all dependencies"
- "remove unused packages"

### Complex Instructions
- "backup all my source code files"
- "find and delete all log files older than 7 days"
- "compress the dist folder into a zip file"
- "search for TODO comments in my code"
- "check if port 3000 is available"

## Command Line Options

- `-i, --instruction <instruction>`: Provide instruction directly
- `-d, --dry`: Show commands without executing them
- `-h, --help`: Show help information

## Risk Levels

Commands are categorized by risk level:
- 🟢 **Low**: Safe operations (ls, pwd, git status)
- 🟡 **Medium**: Potentially impactful (git push, npm install)
- 🔴 **High**: Destructive operations (rm -rf, system modifications)

## Development

### Running in Development Mode
```bash
pnpm run start:dev
```

### Building for Production
```bash
pnpm run build
```

### Running Tests
```bash
pnpm test
```

### Code Quality
```bash
# Format code
pnpm format

# Check formatting
pnpm format:check

# Lint code
pnpm lint

# Check linting
pnpm lint:check

# Run both linting and formatting
pnpm check

# Check code quality for CI
pnpm check:ci
```

## Architecture

The CLI is built with:
- **NestJS Commander**: For CLI framework and dependency injection
- **OpenAI**: For AI-powered natural language processing
- **Inquirer**: For interactive prompts
- **Chalk**: For colored terminal output
- **Ora**: For loading spinners
- **Biome.js**: For fast linting and formatting

### Key Components

1. **OpenAIService**: Handles API calls to OpenAI for natural language processing
2. **CommandParserService**: Parses natural language and generates command options (with fallback)
3. **NaturalLanguageCommand**: Main CLI command handler
4. **AppModule**: NestJS module configuration

### Flow

1. User enters natural language instruction
2. **OpenAIService** processes the instruction using GPT-3.5-turbo
3. If OpenAI fails, **CommandParserService** falls back to pattern matching
4. User selects from multiple command options
5. Command is executed with confirmation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project for your own needs! 
