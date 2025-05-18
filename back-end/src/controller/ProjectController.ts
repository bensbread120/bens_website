import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";

export class ProjectController {
  private projectRepository = AppDataSource.getRepository(Project);

  async all(request: Request, response: Response) {
    const projects = await this.projectRepository.find();

    const transformed =projects.map(project => ({
      ...project,
      image: project.image?.toString("base64") || null,
    }));

    return response.json(transformed);
  }

  async one(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      return response.status(404).json({ message: "Project not found" });
    }

    return response.json({
      ...project,
      image: project.image?.toString("base64") || null,
    });
  }

  async save(request: Request, response: Response) {
    const { name, description, link } = request.body;
    const imageBuffer = (request as any).file?.buffer;

    const project = Object.assign(new Project(), {
      name,
      description,
      link,
      image: imageBuffer,
    });

    try {
      const saved = await this.projectRepository.save(project);
      return response.status(201).json({
        ...saved,
        image: saved.image?.toString("base64") || null,
      });
    } catch (error) {
      return response.status(400).json({ message: "Error creating Project", error });
    }
  }

  async update(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const { name, description, link } = request.body;
    const imageBuffer = (request as any).file?.buffer;

    let project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      return response.status(404).json({ message: "Project not found" });
    }

    project = Object.assign(project, {
      name,
      description,
      link,
      image: imageBuffer ?? project.image,
    });

    try {
      const updated = await this.projectRepository.save(project);
      return response.json({
        ...updated,
        image: updated.image?.toString("base64") || null,
      });
    } catch (error) {
      return response.status(400).json({ message: "Error updating Project", error });
    }
  }

  async remove(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      return response.status(404).json({ message: "Project not found" });
    }

    await this.projectRepository.remove(project);
    return response.json({ message: "Project removed successfully" });
  }
}
