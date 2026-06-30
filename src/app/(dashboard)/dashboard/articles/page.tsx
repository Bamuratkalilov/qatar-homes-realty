import Link from "next/link"
import { db } from "@/lib/db"
import { Plus, FileText, Globe, Archive, Pencil, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function getArticles() {
  return db.article.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  })
}

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT:     "bg-slate-100 text-slate-600",
  ARCHIVED:  "bg-amber-100 text-amber-700",
}

export default async function ArticlesPage() {
  const articles = await getArticles()
  const counts = {
    all:       articles.length,
    published: articles.filter(a => a.status === "PUBLISHED").length,
    draft:     articles.filter(a => a.status === "DRAFT").length,
    archived:  articles.filter(a => a.status === "ARCHIVED").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Articles</h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage neighbourhood guides & editorial content</p>
        </div>
        <Link href="/dashboard/articles/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
          <Plus className="w-4 h-4" /> New article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "All",       count: counts.all,       Icon: FileText, color: "text-slate-600 bg-slate-50"   },
          { label: "Published", count: counts.published, Icon: Globe,    color: "text-green-600 bg-green-50"   },
          { label: "Drafts",    count: counts.draft,     Icon: Pencil,   color: "text-blue-600 bg-blue-50"     },
          { label: "Archived",  count: counts.archived,  Icon: Archive,  color: "text-amber-600 bg-amber-50"   },
        ].map(({ label, count, Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Articles table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileText className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-semibold text-slate-600">No articles yet</p>
            <p className="text-sm mt-1">Create your first neighbourhood guide or article</p>
            <Link href="/dashboard/articles/new"
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
              Create article
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <th className="text-left px-6 py-4">Title</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Author</th>
                <th className="text-left px-6 py-4">Updated</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{article.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">/articles/{article.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_STYLES[article.status])}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{article.author.name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(article.updatedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {article.status === "PUBLISHED" && (
                        <a href={`/articles/${article.slug}`} target="_blank"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <Link href={`/dashboard/articles/${article.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
