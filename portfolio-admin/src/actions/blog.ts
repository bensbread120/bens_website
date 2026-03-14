"use server"

import { db } from "@/lib/db"
import { put } from "@vercel/blob"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function createPost(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Unauthorized")
  }

  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const excerpt = formData.get("excerpt") as string
  const imageFile = formData.get("image") as File

  let imageUrl: string | null = null

  if (imageFile && imageFile.size > 0) {
    // const { url } = await put('articles/blob.txt', 'Hello World!', { access: 'private' });
    const putResult = await put(imageFile.name, imageFile, { access: "public" })
    imageUrl = putResult.url
  }

  await db.blogPost.create({ data: { title, content, excerpt, imageUrl } })
  // Add success message here
}

export async function getPosts() {
  return db.blogPost.findMany({ orderBy: { createdAt: "desc" } })
}

export async function getPostById(id: string) {
  return db.blogPost.findUnique({
    where: { id },
  });
}

export async function deletePost(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;

  await db.blogPost.delete({
    where: { id },
  });

  redirect("/blog?deleted=1");
}