import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import bcrypt from "bcrypt";

export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  // GET /auth/me
  async one(req: Request, res: Response) {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ id: user.id, email: user.email, name: user.name });
  }

  // POST /auth/login
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const hashed = await bcrypt.hash(password, user.salt);
    if (hashed !== user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Use session or JWT — here assuming session
    (req.session as any).userId = user.id;

    return res.json({ id: user.id, email: user.email, name: user.name });
  }

  // POST /auth/logout
  async logout(req: Request, res: Response) {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid"); // or your session cookie name
      return res.json({ message: "Logged out successfully" });
    });
  }

  // POST /auth/register (optional, for testing)
  async register(req: Request, res: Response) {
    const { email, password, name } = req.body;

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = Object.assign(new User(), {
      email,
      password: hashedPassword,
      salt,
      name,
    });

    try {
      const saved = await this.userRepository.save(user);
      return res.status(201).json({ id: saved.id, email: saved.email, name: saved.name });
    } catch (err) {
      return res.status(400).json({ message: "Error creating user", error: err });
    }
  }
}
