import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://localhost:5432/freshy_lk",
  },
});
