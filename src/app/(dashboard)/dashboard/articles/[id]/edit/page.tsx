import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ArticleEditor } from "@/components/dashboard/article-editor"
import type { ArticleContent } from "@/components/dashboard/article-editor"

interface Props { params: Promise<{ id: string }> }

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params
  const article = await db.article.findUnique({ where: { id } })
  if (!article) notFound()

  return (
    <ArticleEditor
      initialData={{
        id:         article.id,
        title:      article.title,
        slug:       article.slug,
        excerpt:    article.excerpt ?? undefined,
        coverImage: article.coverImage ?? undefined,
        layout:     article.layout,
        content:    article.content as unknown as ArticleContent,
        tags:       article.tags,
        status:     article.status,
        featured:   article.featured,
      }}
    />
  )
}
