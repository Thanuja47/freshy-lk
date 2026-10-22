/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');
require('dotenv').config();
/* eslint-enable @typescript-eslint/no-require-imports */

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;');
    console.log('Product.imageUrl column: OK');
  } catch (e) {
    console.error('Product.imageUrl error:', e.message);
  }
  await pool.end();
}

run();
