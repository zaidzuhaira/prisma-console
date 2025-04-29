const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const chalk = require('chalk');

class PrismaConsole {
  constructor(prismaClient) {
    this.prisma = prismaClient;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: (line) => {
        const completions = ['exit', 'help', 'models', 'create', 'read', 'update', 'delete'];
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
      },
    });
  }

  async executeQuery(input) {
    try {
      const result = await eval(input);
      console.log(chalk.green('Result:'), result);
      return result;
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      return null;
    }
  }

  showHelp() {
    console.log(`
Available commands:
- exit: Exit the console
- help: Show this help message
- models: List available models
- create <model> <data>: Create a new record
- read <model>: Read all records of a model
- update <model> <id> <data>: Update a record by ID
- delete <model> <id>: Delete a record by ID
`);
  }

  async listModels() {
    const models = Object.keys(this.prisma);
    console.log('Available models:', models.join(', '));
  }

  async prompt() {
    this.rl.question(chalk.green('Prisma > '), async (input) => {
      const args = input.split(' ');
      const command = args[0].toLowerCase();

      if (command === 'exit') {
        console.log('Exiting Prisma Console...');
        await this.prisma.$disconnect();
        this.rl.close();
        return;
      }

      switch (command) {
        case 'help':
          this.showHelp();
          break;
        case 'models':
          await this.listModels();
          break;
        case 'create':
          if (args.length < 3) {
            console.log('Usage: create <model> <data>');
          } else {
            const model = args[1];
            const data = JSON.parse(args.slice(2).join(' '));
            await this.executeQuery(`this.prisma.${model}.create({ data })`);
          }
          break;
        case 'read':
          if (args.length < 2) {
            console.log('Usage: read <model>');
          } else {
            const model = args[1];
            await this.executeQuery(`this.prisma.${model}.findMany()`);
          }
          break;
        case 'update':
          if (args.length < 4) {
            console.log('Usage: update <model> <id> <data>');
          } else {
            const model = args[1];
            const id = parseInt(args[2], 10);
            const data = JSON.parse(args.slice(3).join(' '));
            await this.executeQuery(`this.prisma.${model}.update({ where: { id }, data })`);
          }
          break;
        case 'delete':
          if (args.length < 3) {
            console.log('Usage: delete <model> <id>');
          } else {
            const model = args[1];
            const id = parseInt(args[2], 10);
            await this.executeQuery(`this.prisma.${model}.delete({ where: { id } })`);
          }
          break;
        default:
          console.log('Unknown command. Type "help" for a list of commands.');
      }
      this.prompt();
    });
  }

  async start() {
    console.log(chalk.cyan('Welcome to Prisma Console!'));
    console.log('Type "help" for a list of commands or "exit" to leave the console.');
    await this.prompt();
  }
}

module.exports = PrismaConsole;
module.exports.createConsole = (prismaClient) => {
  return new PrismaConsole(prismaClient);
};
