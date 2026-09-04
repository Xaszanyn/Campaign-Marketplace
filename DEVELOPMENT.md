# Campaign Marketplace

## Project Creation

# Next.js Setup

```cmd
npx create-next-app@latest campaign-marketplace

cd campaign-marketplace

npm install @trpc/server @trpc/client @trpc/react-query zod react-hook-form @hookform/resolvers

npx shadcn@latest init
```

# Drizzle & Postgres Setup

```cmd
pnpm add drizzle-orm postgres

pnpm add -D drizzle-kit
```

# Data Model & Migration

```cmd
pnpm drizzle-kit generate
```
