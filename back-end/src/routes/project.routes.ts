import { Router } from "express";
import { ProjectController } from "../controller/ProjectController";
import { upload } from "../middleware/upload.middleware";

const router = Router();
const projectController = new ProjectController();

router.get("/projects", async (req, res) => {
  await projectController.all(req, res);
});

router.get("/projects/:id", async (req, res) => {
  await projectController.one(req, res);
});

router.post("/projects", upload.single("image"), async (req, res) => {
  await projectController.save(req, res);
});

router.put("/projects/:id", upload.single("image"), async (req, res) => {
  await projectController.update(req, res);
});

router.delete("/projects/:id", async (req, res) => {
  await projectController.remove(req, res);
});

export default router;
