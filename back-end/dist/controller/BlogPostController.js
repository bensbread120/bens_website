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
exports.BlogPostController = void 0;
const data_source_1 = require("../data-source");
const BlogPost_1 = require("../entity/BlogPost");
class BlogPostController {
    constructor() {
        this.blogPostRepository = data_source_1.AppDataSource.getRepository(BlogPost_1.BlogPost);
    }
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const blogPosts = yield this.blogPostRepository.find();
            const transformed = blogPosts.map(post => {
                var _a;
                return (Object.assign(Object.assign({}, post), { image: ((_a = post.image) === null || _a === void 0 ? void 0 : _a.toString("base64")) || null }));
            });
            return response.json(transformed);
        });
    }
    one(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const id = parseInt(request.params.id);
            const blogPost = yield this.blogPostRepository.findOne({ where: { id } });
            if (!blogPost) {
                return response.status(404).json({ message: "blogPost not found" });
            }
            return response.json(Object.assign(Object.assign({}, blogPost), { image: ((_a = blogPost.image) === null || _a === void 0 ? void 0 : _a.toString("base64")) || null }));
        });
    }
    save(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { title, content, excerpt } = request.body;
            const imageBuffer = (_a = request.file) === null || _a === void 0 ? void 0 : _a.buffer;
            const blogPost = Object.assign(new BlogPost_1.BlogPost(), {
                title,
                content,
                excerpt,
                image: imageBuffer,
            });
            try {
                const saved = yield this.blogPostRepository.save(blogPost);
                return response.status(201).json(Object.assign(Object.assign({}, saved), { image: ((_b = saved.image) === null || _b === void 0 ? void 0 : _b.toString("base64")) || null }));
            }
            catch (error) {
                return response.status(400).json({ message: "Error creating blogPost", error });
            }
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const id = parseInt(request.params.id);
            const { title, content, excerpt } = request.body;
            const imageBuffer = (_a = request.file) === null || _a === void 0 ? void 0 : _a.buffer;
            let blogPost = yield this.blogPostRepository.findOne({ where: { id } });
            if (!blogPost) {
                return response.status(404).json({ message: "blogPost not found" });
            }
            blogPost = Object.assign(blogPost, {
                title,
                content,
                excerpt,
                image: imageBuffer !== null && imageBuffer !== void 0 ? imageBuffer : blogPost.image,
            });
            try {
                const updated = yield this.blogPostRepository.save(blogPost);
                return response.json(Object.assign(Object.assign({}, updated), { image: ((_b = updated.image) === null || _b === void 0 ? void 0 : _b.toString("base64")) || null }));
            }
            catch (error) {
                return response.status(400).json({ message: "Error updating blogPost", error });
            }
        });
    }
    remove(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = parseInt(request.params.id);
            const blogPost = yield this.blogPostRepository.findOne({ where: { id } });
            if (!blogPost) {
                return response.status(404).json({ message: "blogPost not found" });
            }
            yield this.blogPostRepository.remove(blogPost);
            return response.json({ message: "blogPost removed successfully" });
        });
    }
}
exports.BlogPostController = BlogPostController;
//# sourceMappingURL=BlogPostController.js.map