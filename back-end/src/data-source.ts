import { DataSource } from "typeorm";
import { BlogPost } from "./entity/BlogPost";
import { Project } from "./entity/Project";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "your_mysql_username",
  password: "your_mysql_password",
  database: "your_database_name",
  synchronize: true, // Auto creates tables (disable in production)
  logging: true,
  entities: [BlogPost, Project],
});
