# Prisma Console

A Rails-inspired interactive console for Prisma ORM that provides a powerful REPL environment for interacting with your database.

## Features

✨ **Rails-like Experience**
- Direct model access
- Interactive query execution
- Command history support
- Tab completion

🎨 **Beautiful Output**
- Colorized query results
- Formatted JSON output
- Clear error messages
- Null/undefined handling

🔧 **Developer Friendly**
- Run any JavaScript code
- Full async/await support
- Access to Prisma models and queries
- Command history persistence

## Installation

Add to your Prisma project:

```bash
npm install prisma-console
```

## Usage

Start the console:

```bash
npx prisma-console
```

Or add it to your package.json scripts:
```json
{
  "scripts": {
    "console": "prisma-console"
  }
}
```

Then run:
```bash
npm run console
```

### Example Commands

```javascript
// List all models
models

// Find all users
prisma.user.findMany()

// Create a new user
prisma.user.create({ 
  data: { 
    name: "John",
    email: "john@example.com"
  }
})

// Query with relations
prisma.user.findMany({
  include: {
    posts: true,
    profile: true
  }
})

// Run any JavaScript
const admins = await prisma.user.findMany({ where: { role: "ADMIN" }})
admins.map(a => a.email)
```

## Requirements

- Node.js >= 14.0.0
- A Prisma project with:
  - Valid schema.prisma file
  - Generated Prisma Client (`npx prisma generate`)
  - Configured database connection

## Contributing

Contributions are welcome! Here's how you can help:

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/zaidzuhaira/prisma-console.git
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch:
   ```bash
   git checkout -b my-feature
   ```
5. Make your changes
6. Submit a pull request

### Development Guidelines

- Follow existing code style
- Update documentation as needed
- Keep pull requests focused on single features/fixes

## License

ISC

## Support

If you find a bug or have a feature request, please [open an issue](https://github.com/zaidzuhaira/prisma-console/issues).
