#!/usr/bin/env node

const path = require('path');
const PrismaConsole = require('../prismaConsole');

// Helper to check if @prisma/client exists in the current working directory
const findLocalPrismaClient = () => {
  try {
    const projectPath = process.cwd();
    return require(path.join(projectPath, 'node_modules/@prisma/client'));
  } catch (error) {
    return null;
  }
};

const start = async () => {
  try {
    // Try to use the project's Prisma client first
    const localPrisma = findLocalPrismaClient();
    if (localPrisma && localPrisma.PrismaClient) {
      const existingClient = global.prisma || new localPrisma.PrismaClient();
      const console = PrismaConsole.createConsole(existingClient);
      await console.start();
    } else {
      // Fall back to creating a new instance
      const console = new PrismaConsole();
      await console.start();
    }
  } catch (error) {
    console.error('Failed to start Prisma Console:', error.message);
    process.exit(1);
  }
};

start();