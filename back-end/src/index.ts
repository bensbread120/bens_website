import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import blogPostRoutes from "./routes/blogpost.routes";
import projectRoutes from "./routes/project.routes";
import userRoutes from "./routes/user.router"
import cors from "cors";
import session from "express-session";
import { hostname } from "os";
const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = ["http://localhost:3000", "https://benhatfield.com"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
 
app.use(express.json());
app.use("/api", blogPostRoutes);
app.use("/api", projectRoutes);


app.use(session({
  secret: process.env.SESSION_PASSWORD || "",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use("/api", userRoutes);

const PORT_PASSED = parseInt(process.env.PORT || "3001", 10);

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    app.listen(PORT_PASSED, "127.0.0.1", () => {
      console.log(`Server is running locally on http://127.0.0.1:${PORT_PASSED}`);
    });
  })
  .catch((error) =>
    console.log("Error during Data Source initialization:", error)
  );

