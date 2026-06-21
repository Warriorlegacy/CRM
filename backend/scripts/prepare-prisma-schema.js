const fs = require('fs');
const path = require('path');

const prismaDir = path.join(__dirname, '..', 'prisma');
const activeSchema = path.join(prismaDir, 'schema.prisma');
const sqliteSchema = path.join(prismaDir, 'schema.sqlite.prisma');
const postgresSchema = path.join(prismaDir, 'schema.railway.prisma');

const shouldUsePostgres = process.env.VERCEL === '1' || process.env.RAILWAY_ENVIRONMENT || process.env.RENDER || process.env.DATABASE_URL?.includes('postgresql');
const sourceSchema = shouldUsePostgres ? postgresSchema : sqliteSchema;

if (!fs.existsSync(sourceSchema)) {
  throw new Error(`Prisma source schema not found: ${sourceSchema}`);
}

fs.copyFileSync(sourceSchema, activeSchema);
console.log(`Prisma schema prepared from ${path.basename(sourceSchema)}`);
