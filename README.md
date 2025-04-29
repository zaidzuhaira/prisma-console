# Prisma Console

A Rails-inspired interactive console for Prisma ORM that runs in your project context, similar to the Prisma CLI.

## Features

- Rails-like model access (User.findMany() instead of prisma.user.findMany())
- Uses your project's Prisma schema and configuration
- Helper methods like `first()`, `last()`, `where()`
- Pretty printing with `pp()`
- Multi-line input support
- Command history with arrow keys
- Tab completion for models and methods
- Automatic model loading and context
- Lodash utilities via `_`
- Date formatting via `format()`

## Installation

Add to your Prisma project:

```bash
npm install prisma-console
```

## Usage

After installing in your Prisma project:

```bash
npx prisma-console
```

Or add a script to your package.json:
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

The console will automatically:
1. Find your Prisma schema
2. Use your project's database configuration
3. Load your models and their relationships
4. Provide Rails-like helpers for your models

### Direct Model Access
```javascript
// Find all users
User.findMany()

// Create a user
User.create({ data: { name: 'John', email: 'john@example.com' } })

// Or use the shorthand
create_user({ name: 'John', email: 'john@example.com' })
```

### Helper Methods
```javascript
// Get first user
first('User')

// Get last 3 posts
last('Post', 3)

// Find users by condition
where('User', { email: 'john@example.com' })

// Get all records of a model
all_users()
```

### Utility Functions
```javascript
// Pretty print objects
pp(await User.findMany())

// Use lodash utilities
_.groupBy(await Post.findMany(), 'authorId')

// Format dates
format(new Date(), 'yyyy-MM-dd')

// List all models and their fields
models()

// Reload the console context
reload!
```

### Multi-line Input
The console supports multi-line input for complex queries:
```javascript
User.findMany({
  where: { email: 'john@example.com' },
  include: {
    posts: true,
    profile: true
  }
})
```

## Requirements

- Node.js >= 14.0.0
- A Prisma project with:
  - Valid schema.prisma file
  - Generated Prisma Client
  - Configured database connection

## License

ISC