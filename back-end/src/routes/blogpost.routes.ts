import { Router } from "express";
import { BlogPostController } from "../controller/BlogPostController";

const router = Router();
const blogPostController = new BlogPostController();

router.get("/blogPosts", async (req, res) => {
  await blogPostController.all(req, res);
});

router.get("/blogPosts/:id", async (req, res) => {
  await blogPostController.one(req, res);
});

router.post("/blogPosts", async (req, res) => {
  await blogPostController.save(req, res);
});

router.put("/blogPosts/:id", async (req, res) => {
  await blogPostController.update(req, res);
});

router.delete("/blogPosts/:id", async (req, res) => {
  await blogPostController.remove(req, res);
});

export default router;
