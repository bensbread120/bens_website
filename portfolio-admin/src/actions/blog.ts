"use server"

import { db } from "@/lib/db"
import { put } from "@vercel/blob"

export async function createPost(formData: FormData) {
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
}

export async function getPosts() {
  return db.blogPost.findMany({ orderBy: { createdAt: "desc" } })
}

export async function getPostById(id: string) {
  return db.blogPost.findUnique({
    where: { id },
  });
}