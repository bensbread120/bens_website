import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { BlogPost } from "../entity/BlogPost";

export class BlogPostController {
  private blogPostRepository = AppDataSource.getRepository(BlogPost);

  /**
   * Retrieves all blogPosts from the database
   * @param request - Express request object
   * @param response - Express response object
   * @returns JSON response containing an array of all blogPosts
   */
  async all(request: Request, response: Response) {
    const blogPosts = await this.blogPostRepository.find();

    return response.json(blogPosts);
  }

  /**
   * Retrieves a single blogPost by their ID
   * @param request - Express request object containing the blogPost ID in params
   * @param response - Express response object
   * @returns JSON response containing the blogPost if found, or 404 error if not found
   */
  async one(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const blogPost = await this.blogPostRepository.findOne({
      where: { id },
    });

    if (!blogPost) {
      return response.status(404).json({ message: "blogPost not found" });
    }
    return response.json(blogPost);
  }

  /**
   * Creates a new blogPost in the database
   * @param request - Express request object containing blogPost details in body
   * @param response - Express response object
   * @returns JSON response containing the created blogPost or error message
   */
  async save(request: Request, response: Response) {
    const { title, content, excerpt, image } = request.body;

    const blogPost = Object.assign(new BlogPost(), {
      title,
      content,
      excerpt,
      image,
    });

    try {
      const savedblogPost = await this.blogPostRepository.save(blogPost);
      return response.status(201).json(savedblogPost);
    } catch (error) {
      return response
        .status(400)
        .json({ message: "Error creating blogPost", error });
    }
  }

  /**
   * Deletes a blogPost from the database by their ID
   * @param request - Express request object containing the blogPost ID in params
   * @param response - Express response object
   * @returns JSON response with success message or 404 error if blogPost not found
   */
  async remove(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const blogPostToRemove = await this.blogPostRepository.findOne({
      where: { id },
    });

    if (!blogPostToRemove) {
      return response.status(404).json({ message: "blogPost not found" });
    }

    await this.blogPostRepository.remove(blogPostToRemove);
    return response.json({ message: "blogPost removed successfully" });
  }

  /**
   * Updates an existing blogPost's information
   * @param request - Express request object containing blogPost ID in params and updated details in body
   * @param response - Express response object
   * @returns JSON response containing the updated blogPost or error message
   */
  async update(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const { title, content, excerpt, image } = request.body;

    let blogPostToUpdate = await this.blogPostRepository.findOne({
      where: { id },
    });

    if (!blogPostToUpdate) {
      return response.status(404).json({ message: "blogPost not found" });
    }

    blogPostToUpdate = Object.assign(blogPostToUpdate, {
      title,
      content,
      excerpt,
      image,
    });

    try {
      const updatedblogPost = await this.blogPostRepository.save(blogPostToUpdate);
      return response.json(updatedblogPost);
    } catch (error) {
      return response
        .status(400)
        .json({ message: "Error updating blogPost", error });
    }
  }
}
