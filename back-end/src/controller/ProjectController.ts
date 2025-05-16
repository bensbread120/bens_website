import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";

export class ProjectController {
  private projectRepository = AppDataSource.getRepository(Project);

  /**
   * Retrieves all projects from the database
   * @param request - Express request object
   * @param response - Express response object
   * @returns JSON response containing an array of all projects
   */
  async all(request: Request, response: Response) {
    const projects = await this.projectRepository.find();

    return response.json(projects);
  }

  /**
   * Retrieves a single project by their ID
   * @param request - Express request object containing the project ID in params
   * @param response - Express response object
   * @returns JSON response containing the project if found, or 404 error if not found
   */
  async one(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      return response.status(404).json({ message: "project not found" });
    }
    return response.json(project);
  }

  /**
   * Creates a new project in the database
   * @param request - Express request object containing project details in body
   * @param response - Express response object
   * @returns JSON response containing the created project or error message
   */
  async save(request: Request, response: Response) {
    const { name, description, image, link } = request.body;

    const project = Object.assign(new Project(), {
      name,
      description,
      image,
      link,
    });

    try {
      const savedproject = await this.projectRepository.save(project);
      return response.status(201).json(savedproject);
    } catch (error) {
      return response
        .status(400)
        .json({ message: "Error creating project", error });
    }
  }

  /**
   * Deletes a project from the database by their ID
   * @param request - Express request object containing the project ID in params
   * @param response - Express response object
   * @returns JSON response with success message or 404 error if project not found
   */
  async remove(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const projectToRemove = await this.projectRepository.findOne({
      where: { id },
    });

    if (!projectToRemove) {
      return response.status(404).json({ message: "project not found" });
    }

    await this.projectRepository.remove(projectToRemove);
    return response.json({ message: "project removed successfully" });
  }

  /**
   * Updates an existing project's information
   * @param request - Express request object containing project ID in params and updated details in body
   * @param response - Express response object
   * @returns JSON response containing the updated project or error message
   */
  async update(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const { name, description, image, link } = request.body;

    let projectToUpdate = await this.projectRepository.findOne({
      where: { id },
    });

    if (!projectToUpdate) {
      return response.status(404).json({ message: "project not found" });
    }

    projectToUpdate = Object.assign(projectToUpdate, {
      name,
      description,
      image,
      link,
    });

    try {
      const updatedproject = await this.projectRepository.save(projectToUpdate);
      return response.json(updatedproject);
    } catch (error) {
      return response
        .status(400)
        .json({ message: "Error updating project", error });
    }
  }
}
