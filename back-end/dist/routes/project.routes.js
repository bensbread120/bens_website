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
const ProjectController_1 = require("../controller/ProjectController");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
const projectController = new ProjectController_1.ProjectController();
router.get("/projects", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield projectController.all(req, res);
}));
router.get("/projects/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield projectController.one(req, res);
}));
router.post("/projects", upload_middleware_1.upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield projectController.save(req, res);
}));
router.put("/projects/:id", upload_middleware_1.upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield projectController.update(req, res);
}));
router.delete("/projects/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield projectController.remove(req, res);
}));
exports.default = router;
//# sourceMappingURL=project.routes.js.map