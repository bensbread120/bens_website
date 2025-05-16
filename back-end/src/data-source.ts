import { DataSource } from "typeorm";
import { BlogPost } from "./entity/BlogPost";
import { Project } from "./entity/Project";
import * as dotenv from 'dotenv';
dotenv.config();


export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // Auto creates tables (disable in production)
  logging: true,
  entities: [BlogPost, Project],
});
