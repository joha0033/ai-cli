# Natural Language CLI (nlcli)

A command-line interface that converts natural language instructions into bash commands using NestJS Commander.

## Features

- 🗣️ **Natural Language Processing**: Convert human-readable instructions to bash commands
- 📋 **Multiple Options**: Get several command options for each instruction
- 🔍 **Risk Assessment**: Each command is labeled with risk levels (low, medium, high)
- 🛡️ **Safe Execution**: Confirmation prompts before executing commands
- 🔄 **Dry Run Mode**: Preview commands without executing them
- 🎨 **Beautiful Interface**: Colorful, intuitive command-line interface

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm run build
```

3. Link the CLI globally (optional):
```bash
pnpm link --global
```

## Usage

### Interactive Mode
Run the CLI without any arguments to enter interactive mode:
```bash
npx ts-node src/main.ts
# or if linked globally:
nlcli
```

### Command Line Arguments
You can also pass instructions directly:
```bash
npx ts-node src/main.ts -i "list all files in the current directory"
```

### Dry Run Mode
Preview commands without executing them:
```bash
npx ts-node src/main.ts -d -i "delete all text files"
```

## Example Commands

The CLI understands various types of natural language instructions:

### File Operations
- "list all files in the current directory"
- "create a new folder called projects"
- "make a file named test.txt"
- "delete the file readme.md"

### Git Operations
- "check git status"
- "add all files to git"
- "commit the changes"
- "push to main branch"

### System Operations
- "show current directory"
- "check disk usage"
- "show running processes"
- "find files containing 'config'"

### Package Management
- "install express package"
- "start the development server"
- "build the project"

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

## Architecture

The CLI is built with:
- **NestJS Commander**: For CLI framework and dependency injection
- **Inquirer**: For interactive prompts
- **Chalk**: For colored terminal output
- **Ora**: For loading spinners

### Key Components

1. **CommandParserService**: Parses natural language and generates command options
2. **NaturalLanguageCommand**: Main CLI command handler
3. **AppModule**: NestJS module configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project for your own needs! 
