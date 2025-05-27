import axios from "axios";



const api = axios.create({
  baseURL: "/api", // matches your Express backend
  withCredentials: true, // always send cookies
});

export interface User {
  id: number
  name: string;
  email: string;
  password: string;
  image: string | File | null;
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  image: string | File | null; // base64 on read, File on write
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  image: string | File | null;
  link: string;
}



export const blogPostApi = {
  getAllBlogPosts: async () => {
    const response = await api.get("/blogPosts");
    return response.data;
  },

  getBlogPostById: async (id: number) => {
    const response = await api.get(`/blogPosts/${id}`);
    return response.data;
  },

  createBlogPost: async (blogPost: Partial<BlogPost>) => {
    const formData = new FormData();
    formData.append("title", blogPost.title || "");
    formData.append("content", blogPost.content || "");
    formData.append("excerpt", blogPost.excerpt || "");
    if (blogPost.image instanceof File) {
      formData.append("image", blogPost.image); // Only append if it's a File
    }

    const response = await api.post("/blogPosts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  

  updateBlogPost: async (id: number, blogPost: Partial<BlogPost>) => {
    const formData = new FormData();
    formData.append("title", blogPost.title || "");
    formData.append("content", blogPost.content || "");
    formData.append("excerpt", blogPost.excerpt || "");
    if (blogPost.image instanceof File) {
      formData.append("image", blogPost.image);
    }

    const response = await api.put(`/blogPosts/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

  return response.data;
},

  deleteBlogPost: async (id: number) => {
    const response = await api.delete(`/blogPosts/${id}`);
    return response.data;
  },
};

export const projectApi = {
  getAllProjects: async () => {
    const response = await api.get("/projects");
    return response.data;
  },

  getProjectById: async (id: number) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (project: Partial<Project>) => {
    const formData = new FormData();
    formData.append("name", project.name || "");
    formData.append("description", project.description || "");
    formData.append("link", project.link || "");
    if (project.image instanceof File) {
      formData.append("image", project.image); // Only append if it's a File
    }

    const response = await api.post("/projects", formData, {
      headers: {
        "description-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  updateProject: async (id: number, project: Partial<Project>) => {
    const formData = new FormData();
    formData.append("name", project.name || "");
    formData.append("description", project.description || "");
    formData.append("link", project.link || "");
    if (project.image instanceof File) {
      formData.append("image", project.image);
    }

    const response = await api.put(`/Projects/${id}`, formData, {
      headers: {
        "description-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  deleteProject: async (id: number) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};

export const userApi = {

  getCurrentUser: async () => {
    const response = await api.get("/auth/me", { withCredentials: true })
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password }, { withCredentials: true });
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout", {}, { withCredentials: true });
    return response.data;
  },

  createUser: async (email: string, password: string) => {
    const name = "Ben Hatfield";
    const response = await api.post("/auth/register", { email, password, name},{ withCredentials: true })
    return response.data;
  }


};
