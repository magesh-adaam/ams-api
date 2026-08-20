import "reflect-metadata";
import { DataSource } from "typeorm";
import { Client } from "pg";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";
import { Facility } from "../entities/Facility";
import { Block } from "../entities/Block";
import { Level } from "../entities/Level";
import { Department } from "../entities/Department";
import { UserLocation } from "../entities/UserLocation";
import { AssetClassification } from "../entities/AssetClassification";
import { AssetType } from "../entities/AssetType";
import { Asset } from "../entities/Asset";
import { PpmChecklist } from "../entities/PpmChecklist";
import { PpmChecklistTask } from "../entities/PpmChecklistTask";
import { Setting } from "../entities/Setting";
import * as dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = parseInt(process.env.DB_PORT || "5432", 10);
const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "postgres";
const dbName = process.env.DB_NAME || "cafms";

export async function ensureDatabaseExists() {
  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: "postgres", // Connect to default postgres DB
  });

  try {
    await client.connect();
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`[Database] Database "${dbName}" does not exist. Creating it now...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[Database] Database "${dbName}" created successfully.`);
    } else {
      console.log(`[Database] Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error("[Database] Error checking/creating database:", err);
    throw err;
  } finally {
    await client.end();
  }
}

export const AppDataSource = new DataSource({
  type: "postgres",
  ...(process.env.DATABASE_URL 
    ? { 
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } 
      } 
    : {
        host: dbHost,
        port: dbPort,
        username: dbUser,
        password: dbPassword,
        database: dbName,
      }
  ),
  synchronize: true, // Auto-sync entities (tables) in development
  logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : false,
  entities: [User, Role, Permission, Facility, Block, Level, Department, UserLocation, AssetClassification, AssetType, Asset, PpmChecklist, PpmChecklistTask, Setting],
  migrations: [],
  subscribers: [],
});
