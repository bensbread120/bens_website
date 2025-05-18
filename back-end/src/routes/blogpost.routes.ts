import { Router } from "express";
import { BlogPostController } from "../controller/BlogPostController";
import { upload } from "../middleware/upload.middleware";

const router = Router();
const blogPostController = new BlogPostController();

// Get all blog posts
router.get("/blogPosts", async (req, res) => {
  await blogPostController.all(req, res);
});

// Get a single blog post by ID
router.get("/blogPosts/:id", async (req, res) => {
  await blogPostController.one(req, res);
});

// Create a new blog post (with optional image upload)
router.post("/blogPosts", upload.single("image"), async (req, res) => {
  await blogPostController.save(req, res);
});

// Update an existing blog post (with optional image replacement)
router.put("/blogPosts/:id", upload.single("image"), async (req, res) => {
  await blogPostController.update(req, res);
});

// Delete a blog post by ID
router.delete("/blogPosts/:id", async (req, res) => {
  await blogPostController.remove(req, res);
});

export default router;
