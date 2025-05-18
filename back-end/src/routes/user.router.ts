import { Router } from "express";
import { UserController } from "../controller/UserController";

const router = Router();
const userController = new UserController();

router.get("/auth/me", async (req, res) => {
  await userController.one(req, res);
});

router.post("/auth/login", async (req, res) => {
  await userController.login(req, res);
});

router.post("/auth/logout", async (req, res) => {
  await userController.logout(req, res);
});

router.post("/auth/register", async (req, res) => {
  await userController.register(req, res);
});

export default router;
