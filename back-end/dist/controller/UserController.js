"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const data_source_1 = require("../data-source");
const User_1 = require("../entity/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserController {
    constructor() {
        this.userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
    }
    // GET /auth/me
    one(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.session) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            const user = yield this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.json({ id: user.id, email: user.email, name: user.name });
        });
    }
    // POST /auth/login
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            const user = yield this.userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            const hashed = yield bcrypt_1.default.hash(password, user.salt);
            if (hashed !== user.password) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            // Use session or JWT — here assuming session
            req.session.userId = user.id;
            return res.json({ id: user.id, email: user.email, name: user.name });
        });
    }
    // POST /auth/logout
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = req.session) === null || _a === void 0 ? void 0 : _a.destroy((err) => {
                if (err) {
                    return res.status(500).json({ message: "Logout failed" });
                }
                res.clearCookie("connect.sid"); // or your session cookie name
                return res.json({ message: "Logged out successfully" });
            });
        });
    }
    // POST /auth/register (optional, for testing)
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password, name } = req.body;
            const existing = yield this.userRepository.findOne({ where: { email } });
            if (existing) {
                return res.status(400).json({ message: "Email already in use" });
            }
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(password, salt);
            const user = Object.assign(new User_1.User(), {
                email,
                password: hashedPassword,
                salt,
                name,
            });
            try {
                const saved = yield this.userRepository.save(user);
                return res.status(201).json({ id: saved.id, email: saved.email, name: saved.name });
            }
            catch (err) {
                return res.status(400).json({ message: "Error creating user", error: err });
            }
        });
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map