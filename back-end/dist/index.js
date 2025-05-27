"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const blogpost_routes_1 = __importDefault(require("./routes/blogpost.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const user_router_1 = __importDefault(require("./routes/user.router"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const allowedOrigins = ["http://localhost:3000", "https://benhatfield.com"];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/api", blogpost_routes_1.default);
app.use("/api", project_routes_1.default);
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_PASSWORD || "",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true if using HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));
app.use("/api", user_router_1.default);
const PORT_PASSED = parseInt(process.env.PORT || "3001", 10);
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Data Source has been initialized!");
    app.listen(PORT_PASSED, "127.0.0.1", () => {
        console.log(`Server is running locally on http://127.0.0.1:${PORT_PASSED}`);
    });
})
    .catch((error) => console.log("Error during Data Source initialization:", error));
//# sourceMappingURL=index.js.map