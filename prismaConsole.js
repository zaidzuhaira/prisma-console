const { PrismaClient } = require('@prisma/client');
const repl = require('repl');
const chalk = require('chalk');
const util = require('util');
const _ = require('lodash');
const PrettyError = require('pretty-error');
const { format } = require('date-fns');

class PrismaConsole {
  constructor(prismaClient) {
    if (!prismaClient) {
      console.warn(chalk.yellow('No Prisma client provided, creating a new instance...'));
      this.prisma = new PrismaClient();
    } else {
      this.prisma = prismaClient;
    }
    
    this.prettyError = new PrettyError();
    this.loadedModels = new Map();
    this.context = {};
    this.helpers = {
      format,
      _,
      inspect: (obj) => util.inspect(obj, { colors: true, depth: null }),
      pp: (obj) => console.log(util.inspect(obj, { colors: true, depth: null })),
      time: () => new Date(),
      reload: () => this.reloadContext(),
      models: () => this.listModels(),
      first: async (model, n = 1) => {
        const results = await this.prisma[model].findMany({ take: n });
        return n === 1 ? results[0] : results;
      },
      last: async (model, n = 1) => {
        const results = await this.prisma[model].findMany({ 
          orderBy: { id: 'desc' },
          take: n 
        });
        return n === 1 ? results[0] : results;
      },
      where: async (model, conditions) => {
        return this.prisma[model].findMany({ where: conditions });
      },
      create: async (model, data) => {
        return this.prisma[model].create({ data });
      },
      update: async (model, id, data) => {
        return this.prisma[model].update({ 
          where: { id: parseInt(id) },
          data 
        });
      },
      delete: async (model, id) => {
        return this.prisma[model].delete({ 
          where: { id: parseInt(id) }
        });
      }
    };
  }

  async loadModelContext() {
    try {
      const dmmf = await this.prisma._getDmmf();
      const models = dmmf.modelMap;
      
      for (const [modelName, model] of Object.entries(models)) {
        // Make model available directly in context (like User, Post, etc)
        this.context[modelName] = this.prisma[modelName.toLowerCase()];
        
        // Add model-specific helper methods
        this.context[`create_${modelName.toLowerCase()}`] = async (data) => {
          return this.prisma[modelName.toLowerCase()].create({ data });
        };
        
        this.context[`all_${modelName.toLowerCase()}`] = async () => {
          return this.prisma[modelName.toLowerCase()].findMany();
        };
        
        this.loadedModels.set(modelName, model);
      }
    } catch (error) {
      console.error(this.prettyError.render(error));
    }
  }

  async reloadContext() {
    await this.loadModelContext();
    console.log(chalk.green('Context reloaded!'));
    return 'OK';
  }

  async listModels() {
    try {
      console.log(chalk.cyan('\nAvailable models and methods:'));
      for (const [modelName, model] of this.loadedModels.entries()) {
        console.log(chalk.bold(`\n${modelName}:`));
        console.log('Fields:');
        model.fields.forEach(field => {
          console.log(`  ${chalk.green(field.name)}: ${chalk.yellow(field.type)}${field.isRequired ? chalk.red(' (required)') : ''}`);
        });
        
        console.log('\nAvailable methods:');
        console.log(`  ${modelName}.findMany()`);
        console.log(`  ${modelName}.findUnique()`);
        console.log(`  ${modelName}.create()`);
        console.log(`  ${modelName}.update()`);
        console.log(`  ${modelName}.delete()`);
        console.log(`  create_${modelName.toLowerCase()}(data)`);
        console.log(`  all_${modelName.toLowerCase()}()`);
      }
      
      console.log(chalk.cyan('\nHelper methods:'));
      console.log('  first(model, n = 1)    - Get first n records');
      console.log('  last(model, n = 1)     - Get last n records');
      console.log('  where(model, conditions) - Find records matching conditions');
      console.log('  pp(obj)                - Pretty print an object');
      console.log('  reload!                - Reload the console context');
      console.log('  models                 - List all models and their fields');
      
    } catch (error) {
      console.error(this.prettyError.render(error));
    }
  }

  enhanceREPL(replServer) {
    // Add history support
    require('repl.history')(replServer, process.env.HOME + '/.node_repl_history');

    // Better completion
    replServer.completer = (line) => {
      const completions = [
        'help', 'models', 'reload!', 'first', 'last', 'where',
        'create', 'update', 'delete', 'pp', 'inspect', '_',
        ...Array.from(this.loadedModels.keys()),
      ];

      const hits = completions.filter((c) => c.startsWith(line));
      return [hits.length ? hits : completions, line];
    };

    // Custom writer for better output formatting
    replServer.writer = (output) => {
      if (output === undefined) return 'undefined';
      if (output === null) return 'null';
      
      if (output instanceof Promise) {
        return 'Promise { <pending> }';
      }
      
      if (typeof output === 'object') {
        return util.inspect(output, { colors: true, depth: null });
      }
      
      return output;
    };
  }

  async start() {
    console.log(chalk.bold.cyan('Welcome to the Enhanced Prisma Console!'));
    console.log(chalk.cyan('Loading models and initializing context...'));
    
    await this.loadModelContext();
    
    const replServer = repl.start({
      prompt: chalk.green('prisma > '),
      useColors: true,
      ignoreUndefined: true,
      eval: async (cmd, context, filename, callback) => {
        try {
          const result = await eval(cmd);
          callback(null, result);
        } catch (error) {
          callback(this.prettyError.render(error));
        }
      }
    });

    // Enhance REPL with better features
    this.enhanceREPL(replServer);

    // Add context and helpers to REPL context
    Object.assign(replServer.context, this.context, this.helpers, { prisma: this.prisma });

    replServer.on('exit', async () => {
      console.log(chalk.cyan('\nGoodbye! Disconnecting from database...'));
      await this.prisma.$disconnect();
      process.exit();
    });
  }
}

module.exports = PrismaConsole;
module.exports.createConsole = (prismaClient) => {
  return new PrismaConsole(prismaClient);
};
