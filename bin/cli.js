#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const PrismaConsole = require('../prismaConsole');

async function start() {
  try {
    console.log('Initializing Prisma Console...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    const prismaConsole = PrismaConsole.createConsole(prisma);
    await prismaConsole.start();
  } catch (error) {
    console.error('Failed to start Prisma Console:', error.message);
    process.exit(1);
  }
}

start();