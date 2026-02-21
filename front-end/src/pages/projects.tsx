import { useState, useEffect } from "react";
import Background from "@/components/Background";
import ProjectCard from "@/components/ProjectCard";
import { projectApi, Project } from "../services/api";
import { requireAuth } from "@/lib/requireAuth";
import { GetServerSideProps } from "next";

type ProjectsPageProps = {
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export const getServerSideProps: GetServerSideProps<ProjectsPageProps> = async (ctx) => {
  return requireAuth(ctx);
};

export default function ProjectsPage({ user }: ProjectsPageProps) {

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editProject, setEditProject] = useState<Partial<Project>>({});

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    link: "",
  });
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectApi.getAllProjects();
      setProjects(data);
      setError(null);
    } catch {
      setError("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // Pass the File object directly as `image` property
    await projectApi.createProject({ ...newProject, image: newImageFile || undefined });

    setNewProject({ name: "", description: "", link: "" });
    setNewImageFile(null);
    fetchProjects();
  } catch {
    setError("Failed to create Project.");
  }
};


  const handleDeleteProject = async (id: number) => {
    try {
      await projectApi.deleteProject(id);
      fetchProjects();
    } catch {
      setError("Failed to delete Project");
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId) return;

    try {
      await projectApi.updateProject(editingProjectId, editProject);
      setEditingProjectId(null);
      setEditProject({});
      fetchProjects();
    } catch {
      setError("Failed to update Project");
    }
  };

  const startEditing = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProject({
      name: project.name,
      description: project.description,
      image: project.image,
      link: project.link,
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Background>
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white text-center mb-12">Projects</h1>

        {/* Create Project Form */}
        {user && (
          <form
            onSubmit={handleCreateProject}
            className="mb-8 p-6 border rounded bg-white"
          >
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Link"
                value={newProject.link}
                onChange={(e) =>
                  setNewProject({ ...newProject, link: e.target.value })
                }
                className="p-2 border rounded"
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                className="p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Project
            </button>
          </form>
        )}
        {/* Projects List */}
        <div className="grid grid-cols-2 gap-8">
          {projects.map((project) =>
            editingProjectId === project.id ? (
              <form
                key={project.id}
                onSubmit={handleUpdateProject}
                className="p-6 border rounded bg-white"
              >
                <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="name"
                    value={editProject.name || ""}
                    onChange={(e) =>
                      setEditProject({ ...editProject, name: e.target.value })
                    }
                    className="p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={editProject.description || ""}
                    onChange={(e) =>
                      setEditProject({ ...editProject, description: e.target.value })
                    }
                    className="p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="link"
                    value={editProject.link || ""}
                    onChange={(e) =>
                      setEditProject({ ...editProject, link: e.target.value })
                    }
                    className="p-2 border rounded"
                    required
                  />
                  {/* If you want to update image with file upload, you can implement here */}
                </div>
                <div className="mt-4 flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProjectId(null);
                      setEditProject({});
                    }}
                    className="px-6 py-2 bg-gray-400 text-black rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div key={project.id} className="relative">
                <ProjectCard
                  name={project.name}
                  description={project.description}
                  link={project.link}
                  image={
                    // image could be base64 or URL string
                    typeof project.image === "string"
                      ? project.image.startsWith("data:") // already base64/URL
                        ? project.image
                        : `data:image/jpeg;base64,${project.image}`
                      : ""
                  }
                />
                {user && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => startEditing(project)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </Background>
  );
}
