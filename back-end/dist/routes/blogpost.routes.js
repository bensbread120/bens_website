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
const BlogPostController_1 = require("../controller/BlogPostController");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
const blogPostController = new BlogPostController_1.BlogPostController();
// Get all blog posts
router.get("/blogPosts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield blogPostController.all(req, res);
}));
// Get a single blog post by ID
router.get("/blogPosts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield blogPostController.one(req, res);
}));
// Create a new blog post (with optional image upload)
router.post("/blogPosts", upload_middleware_1.upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield blogPostController.save(req, res);
}));
// Update an existing blog post (with optional image replacement)
router.put("/blogPosts/:id", upload_middleware_1.upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield blogPostController.update(req, res);
}));
// Delete a blog post by ID
router.delete("/blogPosts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield blogPostController.remove(req, res);
}));
exports.default = router;
//# sourceMappingURL=blogpost.routes.js.map