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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controller/UserController");
const router = (0, express_1.Router)();
const userController = new UserController_1.UserController();
router.get("/auth/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield userController.one(req, res);
}));
router.post("/auth/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield userController.login(req, res);
}));
router.post("/auth/logout", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield userController.logout(req, res);
}));
router.post("/auth/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield userController.register(req, res);
}));
exports.default = router;
//# sourceMappingURL=user.router.js.map