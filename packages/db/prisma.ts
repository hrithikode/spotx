import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as client from "./generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new client.PrismaClient({ adapter });

export { prisma };