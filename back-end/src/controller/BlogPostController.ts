import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { BlogPost } from "../entity/BlogPost";

export class BlogPostController {
  private blogPostRepository = AppDataSource.getRepository(BlogPost);

  async all(request: Request, response: Response) {
    const blogPosts = await this.blogPostRepository.find();

    const transformed = blogPosts.map(post => ({
      ...post,
      image: post.image?.toString("base64") || null,
    }));

    return response.json(transformed);
  }

  async one(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const blogPost = await this.blogPostRepository.findOne({ where: { id } });

    if (!blogPost) {
      return response.status(404).json({ message: "blogPost not found" });
    }

    return response.json({
      ...blogPost,
      image: blogPost.image?.toString("base64") || null,
    });
  }

  async save(request: Request, response: Response) {
    const { title, content, excerpt } = request.body;
    const imageBuffer = (request as any).file?.buffer;

    const blogPost = Object.assign(new BlogPost(), {
      title,
      content,
      excerpt,
      image: imageBuffer,
    });

    try {
      const saved = await this.blogPostRepository.save(blogPost);
      return response.status(201).json({
        ...saved,
        image: saved.image?.toString("base64") || null,
      });
    } catch (error) {
      return response.status(400).json({ message: "Error creating blogPost", error });
    }
  }

  async update(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const { title, content, excerpt } = request.body;
    const imageBuffer = (request as any).file?.buffer;

    let blogPost = await this.blogPostRepository.findOne({ where: { id } });

    if (!blogPost) {
      return response.status(404).json({ message: "blogPost not found" });
    }

    blogPost = Object.assign(blogPost, {
      title,
      content,
      excerpt,
      image: imageBuffer ?? blogPost.image,
    });

    try {
      const updated = await this.blogPostRepository.save(blogPost);
      return response.json({
        ...updated,
        image: updated.image?.toString("base64") || null,
      });
    } catch (error) {
      return response.status(400).json({ message: "Error updating blogPost", error });
    }
  }

  async remove(request: Request, response: Response) {
    const id = parseInt(request.params.id);
    const blogPost = await this.blogPostRepository.findOne({ where: { id } });

    if (!blogPost) {
      return response.status(404).json({ message: "blogPost not found" });
    }

    await this.blogPostRepository.remove(blogPost);
    return response.json({ message: "blogPost removed successfully" });
  }
}
