const { PrismaClient } = require('@prisma/client');
const repl = require('repl');
const chalk = require('chalk');
const util = require('util');
const vm = require('vm');

class PrismaConsole {
  constructor(prismaClient) {
    this.prisma = prismaClient;
    // Bind methods to preserve context
    this.colorizeValue = this.colorizeValue.bind(this);
    this.setupContext = this.setupContext.bind(this);
  }

  colorizeValue(value) {
    if (value === null) return chalk.gray('null');
    if (value === undefined) return chalk.gray('undefined');
    
    switch (typeof value) {
      case 'number':
        return chalk.yellow(value);
      case 'boolean':
        return chalk.blue(value);
      case 'string':
        return chalk.green(`"${value}"`);
      case 'object':
        if (Array.isArray(value)) {
          return `[\n${value.map(item => `    ${this.colorizeValue(item)}`).join(',\n')}\n  ]`;
        }
        if (value instanceof Date) {
          return chalk.magenta(value.toISOString());
        }
        return `{\n${Object.entries(value)
          .map(([k, v]) => `    ${chalk.cyan(k)}: ${this.colorizeValue(v)}`)
          .join(',\n')}\n  }`;
      default:
        return value;
    }
  }

  setupContext(context) {
    // Add Prisma client to context
    context.prisma = this.prisma;

    // Add utility functions
    context.pp = (obj) => {
      console.log(this.colorizeValue(obj));
      return obj;
    };

    context.models = () => {
      const models = Object.keys(this.prisma).filter(key => !key.startsWith('$'));
      console.log('\nAvailable models:');
      models.forEach(model => {
        console.log(chalk.green(`  ➜ prisma.${model}`));
      });
      console.log();
    };

    context.help = () => {
      console.log(`
Available commands:
- .exit: Exit the console
- help(): Show this help message
- models(): List available models
- pp(obj): Pretty print an object

Examples:
  const users = await prisma.user.findMany()
  const user = await prisma.user.findFirst()
  pp(await prisma.user.findMany())
  const posts = await prisma.post.findMany({ include: { author: true }})
`);
    };
  }

  async start() {
    console.log(chalk.cyan('Welcome to Prisma Console!'));
    console.log('Type "help()" for usage examples or ".exit" to leave the console.');

    const replServer = repl.start({
      prompt: chalk.green('> '),
      useColors: true,
      terminal: true,
      ignoreUndefined: true,
      eval: (cmd, context, filename, callback) => {
        // Create a context for vm
        const vmContext = vm.createContext(context);
        
        try {
          // Remove REPL's automatic () wrapper to allow declarations
          cmd = cmd.trim();
          if (cmd === '') return callback(null);

          // Handle special commands
          if (cmd === 'help()') {
            context.help();
            return callback(null);
          }
          if (cmd === 'models()') {
            context.models();
            return callback(null);
          }

          // Wrap in async IIFE if needed
          if (cmd.includes('await ')) {
            cmd = `(async () => { return ${cmd} })()`;
          }

          // Execute in vm context
          const script = new vm.Script(cmd);
          const result = script.runInContext(vmContext);

          // Handle promises
          if (result && typeof result.then === 'function') {
            result
              .then(val => callback(null, val))
              .catch(err => callback(err));
          } else {
            callback(null, result);
          }
        } catch (err) {
          callback(err);
        }
      },
      writer: (output) => {
        if (output === undefined) return chalk.gray('undefined');
        if (output === null) return chalk.gray('null');
        return this.colorizeValue(output);
      }
    });

    // Setup context with Prisma models and utilities
    this.setupContext(replServer.context);

    // Handle cleanup on exit
    replServer.on('exit', async () => {
      console.log(chalk.cyan('\nGoodbye! Disconnecting from database...'));
      await this.prisma.$disconnect();
      process.exit();
    });

    return replServer;
  }
}

// Export the PrismaConsole class
module.exports = PrismaConsole;

// Factory function to create a new PrismaConsole instance
module.exports.createConsole = (prismaClient) => {
  return new PrismaConsole(prismaClient);
};