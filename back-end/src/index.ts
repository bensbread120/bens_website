import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import blogPostRoutes from "./routes/blogpost.routes";
import projectRoutes from "./routes/project.routes";
import userRoutes from "./routes/user.router"
import cors from "cors";
import session from "express-session";
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: "http://localhost:3000", // or your frontend domain
  credentials: true
}));
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

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) =>
    console.log("Error during Data Source initialization:", error)
  );

