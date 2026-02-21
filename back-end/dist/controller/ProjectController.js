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
exports.ProjectController = void 0;
const data_source_1 = require("../data-source");
const Project_1 = require("../entity/Project");
class ProjectController {
    constructor() {
        this.projectRepository = data_source_1.AppDataSource.getRepository(Project_1.Project);
    }
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const projects = yield this.projectRepository.find();
            const transformed = projects.map(project => {
                var _a;
                return (Object.assign(Object.assign({}, project), { image: ((_a = project.image) === null || _a === void 0 ? void 0 : _a.toString("base64")) || null }));
            });
            return response.json(transformed);
        });
    }
    one(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const id = parseInt(request.params.id);
            const project = yield this.projectRepository.findOne({ where: { id } });
            if (!project) {
                return response.status(404).json({ message: "Project not found" });
            }
            return response.json(Object.assign(Object.assign({}, project), { image: ((_a = project.image) === null || _a === void 0 ? void 0 : _a.toString("base64")) || null }));
        });
    }
    save(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { name, description, link } = request.body;
            const imageBuffer = (_a = request.file) === null || _a === void 0 ? void 0 : _a.buffer;
            const project = Object.assign(new Project_1.Project(), {
                name,
                description,
                link,
                image: imageBuffer,
            });
            try {
                const saved = yield this.projectRepository.save(project);
                return response.status(201).json(Object.assign(Object.assign({}, saved), { image: ((_b = saved.image) === null || _b === void 0 ? void 0 : _b.toString("base64")) || null }));
            }
            catch (error) {
                return response.status(400).json({ message: "Error creating Project", error });
            }
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const id = parseInt(request.params.id);
            const { name, description, link } = request.body;
            const imageBuffer = (_a = request.file) === null || _a === void 0 ? void 0 : _a.buffer;
            let project = yield this.projectRepository.findOne({ where: { id } });
            if (!project) {
                return response.status(404).json({ message: "Project not found" });
            }
            project = Object.assign(project, {
                name,
                description,
                link,
                image: imageBuffer !== null && imageBuffer !== void 0 ? imageBuffer : project.image,
            });
            try {
                const updated = yield this.projectRepository.save(project);
                return response.json(Object.assign(Object.assign({}, updated), { image: ((_b = updated.image) === null || _b === void 0 ? void 0 : _b.toString("base64")) || null }));
            }
            catch (error) {
                return response.status(400).json({ message: "Error updating Project", error });
            }
        });
    }
    remove(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = parseInt(request.params.id);
            const project = yield this.projectRepository.findOne({ where: { id } });
            if (!project) {
                return response.status(404).json({ message: "Project not found" });
            }
            yield this.projectRepository.remove(project);
            return response.json({ message: "Project removed successfully" });
        });
    }
}
exports.ProjectController = ProjectController;
//# sourceMappingURL=ProjectController.js.map