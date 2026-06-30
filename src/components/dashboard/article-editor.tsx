"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, Trash2, GripVertical, Image, AlignLeft, List,
  AlertCircle, Minus, ChevronUp, ChevronDown, Upload,
  Save, Globe, FileText, Heading, Quote,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Block types ────────────────────────────────────────────────────────────

export type BlockType = "paragraph" | "heading" | "image" | "bullets" | "callout" | "pros_cons" | "divider" | "quote"

export interface Block {
  id: string
  type: BlockType
  // paragraph / heading / quote
  text?: string
  level?: 2 | 3
  // image
  url?: string
  caption?: string
  // bullets
  items?: string[]
  // callout
  style?: "info" | "warning" | "tip"
  // pros_cons
  pros?: string[]
  cons?: string[]
}

export interface ArticleContent {
  blocks: Block[]
}

interface Props {
  initialData?: {
    id?: string
    title?: string
    slug?: string
    excerpt?: string
    coverImage?: string
    layout?: string
    content?: ArticleContent
    tags?: string[]
    status?: string
    featured?: boolean
  }
}

function uid() { return Math.random().toString(36).slice(2, 9) }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

const BLOCK_MENU: { type: BlockType; label: string; Icon: React.ElementType }[] = [
  { type: "paragraph",  label: "Paragraph",   Icon: AlignLeft   },
  { type: "heading",    label: "Heading",      Icon: Heading     },
  { type: "image",      label: "Image",        Icon: Image       },
  { type: "bullets",    label: "Bullet list",  Icon: List        },
  { type: "callout",    label: "Callout box",  Icon: AlertCircle },
  { type: "pros_cons",  label: "Pros & Cons",  Icon: Minus       },
  { type: "quote",      label: "Quote",        Icon: Quote       },
  { type: "divider",    label: "Divider",      Icon: Minus       },
]

// ── Individual block editors ───────────────────────────────────────────────

function ParagraphBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  return (
    <textarea
      value={block.text || ""}
      onChange={e => onChange({ ...block, text: e.target.value })}
      placeholder="Write your paragraph here…"
      rows={4}
      className="w-full text-slate-700 text-base leading-relaxed resize-y outline-none border border-slate-200 rounded-xl p-4 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
    />
  )
}

function HeadingBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {([2, 3] as const).map(l => (
          <button key={l} onClick={() => onChange({ ...block, level: l })}
            className={cn("px-3 py-1 rounded-lg text-xs font-bold border transition",
              block.level === l ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-blue-300")}>
            H{l}
          </button>
        ))}
      </div>
      <input
        value={block.text || ""}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Heading text…"
        className={cn(
          "w-full outline-none border border-slate-200 rounded-xl p-4 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition font-bold text-slate-900",
          block.level === 2 ? "text-2xl" : "text-xl"
        )}
      />
    </div>
  )
}

function ImageBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) onChange({ ...block, url: data.url })
    } finally { setUploading(false) }
  }

  return (
    <div className="space-y-3">
      {block.url ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          <img src={block.url} alt="block" className="w-full max-h-80 object-cover" />
          <button onClick={() => onChange({ ...block, url: "" })}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className={cn(
          "flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition",
          uploading && "opacity-60 pointer-events-none"
        )}>
          {uploading ? <span className="text-sm text-slate-500">Uploading…</span> : (
            <>
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500 font-medium">Click to upload image</span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG, WebP</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}
      <input
        value={block.caption || ""}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)…"
        className="w-full text-sm outline-none border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-400 transition text-slate-600"
      />
    </div>
  )
}

function BulletsBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const items = block.items || [""]
  function update(i: number, val: string) {
    const next = [...items]; next[i] = val; onChange({ ...block, items: next })
  }
  function add() { onChange({ ...block, items: [...items, ""] }) }
  function remove(i: number) { onChange({ ...block, items: items.filter((_, x) => x !== i) }) }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
          <input value={item} onChange={e => update(i, e.target.value)}
            placeholder={`Item ${i + 1}…`}
            className="flex-1 outline-none border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-blue-400 transition" />
          <button onClick={() => remove(i)} className="p-1.5 text-slate-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:text-blue-700">
        <Plus className="w-4 h-4" /> Add item
      </button>
    </div>
  )
}

function CalloutBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const styles = [
    { key: "info",    label: "Info",    cls: "bg-blue-50 border-blue-300 text-blue-900"   },
    { key: "tip",     label: "Tip",     cls: "bg-green-50 border-green-300 text-green-900" },
    { key: "warning", label: "Warning", cls: "bg-amber-50 border-amber-300 text-amber-900" },
  ] as const
  const active = styles.find(s => s.key === block.style) || styles[0]

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {styles.map(s => (
          <button key={s.key} onClick={() => onChange({ ...block, style: s.key })}
            className={cn("px-3 py-1 rounded-full text-xs font-medium border transition",
              block.style === s.key ? "ring-2 ring-offset-1 ring-blue-400" : "", s.cls)}>
            {s.label}
          </button>
        ))}
      </div>
      <textarea
        value={block.text || ""}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Callout text…"
        rows={3}
        className={cn("w-full outline-none rounded-xl p-4 text-sm leading-relaxed resize-none border-2 transition focus:ring-1 focus:ring-blue-400", active.cls)}
      />
    </div>
  )
}

function ProsConsBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const pros = block.pros || [""]
  const cons = block.cons || [""]

  function updateList(key: "pros" | "cons", i: number, val: string) {
    const arr = key === "pros" ? [...pros] : [...cons]
    arr[i] = val
    onChange({ ...block, [key]: arr })
  }
  function addItem(key: "pros" | "cons") {
    onChange({ ...block, [key]: key === "pros" ? [...pros, ""] : [...cons, ""] })
  }
  function removeItem(key: "pros" | "cons", i: number) {
    onChange({ ...block, [key]: key === "pros" ? pros.filter((_, x) => x !== i) : cons.filter((_, x) => x !== i) })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {(["pros", "cons"] as const).map(key => {
        const items = key === "pros" ? pros : cons
        const color = key === "pros" ? "green" : "red"
        return (
          <div key={key} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-4`}>
            <p className={`font-bold text-${color}-800 text-sm mb-3 capitalize`}>{key}</p>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={item} onChange={e => updateList(key, i, e.target.value)}
                    placeholder={`${key === "pros" ? "Pro" : "Con"} ${i + 1}…`}
                    className={`flex-1 outline-none border border-${color}-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:border-${color}-400 transition`} />
                  <button onClick={() => removeItem(key, i)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => addItem(key)} className={`flex items-center gap-1 text-${color}-700 text-xs font-medium hover:text-${color}-800`}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QuoteBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  return (
    <textarea
      value={block.text || ""}
      onChange={e => onChange({ ...block, text: e.target.value })}
      placeholder="Quote text…"
      rows={3}
      className="w-full outline-none border-l-4 border-blue-500 pl-5 py-3 italic text-slate-600 text-lg resize-none focus:outline-none bg-transparent"
    />
  )
}

function BlockEditor({ block, onChange, onDelete, onMove, total, index }: {
  block: Block
  onChange: (b: Block) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
  total: number
  index: number
}) {
  const meta = BLOCK_MENU.find(m => m.type === block.type)

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-400">
          <GripVertical className="w-4 h-4" />
          {meta && <meta.Icon className="w-4 h-4" />}
          <span className="text-xs font-medium text-slate-500">{meta?.label}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onMove(-1)} disabled={index === 0}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-500">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Block content */}
      {block.type === "paragraph"  && <ParagraphBlock block={block} onChange={onChange} />}
      {block.type === "heading"    && <HeadingBlock   block={block} onChange={onChange} />}
      {block.type === "image"      && <ImageBlock     block={block} onChange={onChange} />}
      {block.type === "bullets"    && <BulletsBlock   block={block} onChange={onChange} />}
      {block.type === "callout"    && <CalloutBlock   block={block} onChange={onChange} />}
      {block.type === "pros_cons"  && <ProsConsBlock  block={block} onChange={onChange} />}
      {block.type === "quote"      && <QuoteBlock     block={block} onChange={onChange} />}
      {block.type === "divider"    && <hr className="border-slate-200" />}
    </div>
  )
}

function AddBlockButton({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex justify-center">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-600 border border-dashed border-slate-300 hover:border-blue-400 rounded-full px-4 py-1.5 transition bg-white">
        <Plus className="w-3.5 h-3.5" /> Add block
      </button>
      {open && (
        <div className="absolute top-full mt-2 z-20 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 grid grid-cols-2 gap-1 w-64">
          {BLOCK_MENU.map(({ type, label, Icon }) => (
            <button key={type} onClick={() => { onAdd(type); setOpen(false) }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-sm text-slate-700 font-medium transition">
              <Icon className="w-4 h-4 text-slate-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main editor ───────────────────────────────────────────────────────────

const LAYOUTS = [
  { key: "standard", label: "Standard",  desc: "Single column article"      },
  { key: "magazine", label: "Magazine",  desc: "Hero image + wide body"     },
  { key: "guide",    label: "Guide",     desc: "With table of contents"     },
]

export function ArticleEditor({ initialData }: Props) {
  const router = useRouter()
  const isEdit = !!initialData?.id

  const [title,       setTitle]      = useState(initialData?.title       || "")
  const [slug,        setSlug]       = useState(initialData?.slug        || "")
  const [excerpt,     setExcerpt]    = useState(initialData?.excerpt     || "")
  const [coverImage,  setCoverImage] = useState(initialData?.coverImage  || "")
  const [layout,      setLayout]     = useState(initialData?.layout      || "standard")
  const [status,      setStatus]     = useState(initialData?.status      || "DRAFT")
  const [featured,    setFeatured]   = useState(initialData?.featured    || false)
  const [tags,        setTags]       = useState((initialData?.tags || []).join(", "))
  const [blocks,      setBlocks]     = useState<Block[]>(initialData?.content?.blocks || [])
  const [saving,      setSaving]     = useState(false)
  const [coverUp,     setCoverUp]    = useState(false)
  const [slugEdited,  setSlugEdited] = useState(!!initialData?.slug)

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugEdited) setSlug(slugify(v))
  }

  function addBlock(type: BlockType) {
    const defaultsMap: Record<BlockType, Partial<Block>> = {
      paragraph:  { text: "" },
      heading:    { text: "", level: 2 as const },
      image:      { url: "", caption: "" },
      bullets:    { items: [""] },
      callout:    { text: "", style: "info" as const },
      pros_cons:  { pros: [""], cons: [""] },
      quote:      { text: "" },
      divider:    {},
    }
    setBlocks(b => [...b, { id: uid(), type, ...defaultsMap[type] }])
  }

  function updateBlock(id: string, updated: Block) {
    setBlocks(b => b.map(x => x.id === id ? updated : x))
  }

  function deleteBlock(id: string) {
    setBlocks(b => b.filter(x => x.id !== id))
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks(b => {
      const i = b.findIndex(x => x.id === id)
      const j = i + dir
      if (j < 0 || j >= b.length) return b
      const n = [...b]; [n[i], n[j]] = [n[j], n[i]]; return n
    })
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setCoverUp(true)
    const fd = new FormData(); fd.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) setCoverImage(data.url)
    } finally { setCoverUp(false) }
  }

  async function save(publishStatus?: string) {
    setSaving(true)
    const body = {
      title, slug, excerpt, coverImage, layout,
      content: { blocks },
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      status: publishStatus || status,
      featured,
    }
    try {
      const url  = isEdit ? `/api/articles/${initialData.id}` : "/api/articles"
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.article) {
        if (publishStatus) setStatus(publishStatus)
        router.push("/dashboard/articles")
        router.refresh()
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/articles")}
              className="text-slate-500 hover:text-slate-700 text-sm">← Articles</button>
            <span className="text-slate-300">|</span>
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full",
              status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")}>
              {status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => save()} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition">
              <Save className="w-4 h-4" /> Save draft
            </button>
            {status !== "PUBLISHED" ? (
              <button onClick={() => save("PUBLISHED")} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 transition">
                <Globe className="w-4 h-4" /> Publish
              </button>
            ) : (
              <button onClick={() => save("DRAFT")} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-60 transition">
                <FileText className="w-4 h-4" /> Unpublish
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

        {/* Left — main editor */}
        <div className="space-y-6">
          {/* Title */}
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Article title…"
            className="w-full text-3xl font-bold text-slate-900 outline-none placeholder-slate-300 border-none bg-transparent"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">/articles/</span>
            <input
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
              className="flex-1 text-blue-600 outline-none border-b border-slate-200 focus:border-blue-400 bg-transparent"
            />
          </div>

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            placeholder="Short excerpt shown in listings and SEO…"
            rows={2}
            className="w-full text-slate-500 text-base outline-none border border-slate-200 rounded-xl p-4 focus:border-blue-400 resize-none transition"
          />

          {/* Cover image */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cover Image</p>
            {coverImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                <img src={coverImage} alt="cover" className="w-full h-56 object-cover" />
                <button onClick={() => setCoverImage("")}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={cn(
                "flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed border-slate-300 bg-white cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition",
                coverUp && "opacity-60 pointer-events-none"
              )}>
                {coverUp ? <span className="text-sm text-slate-500">Uploading…</span> : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500 font-medium">Upload cover image</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
            )}
          </div>

          {/* Blocks */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Content Blocks</p>
            {blocks.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                No blocks yet. Add your first block below.
              </div>
            )}
            {blocks.map((block, i) => (
              <div key={block.id}>
                <BlockEditor
                  block={block}
                  index={i}
                  total={blocks.length}
                  onChange={b => updateBlock(block.id, b)}
                  onDelete={() => deleteBlock(block.id)}
                  onMove={dir => moveBlock(block.id, dir)}
                />
                <div className="py-1">
                  <AddBlockButton onAdd={addBlock} />
                </div>
              </div>
            ))}
            {blocks.length === 0 && <AddBlockButton onAdd={addBlock} />}
          </div>
        </div>

        {/* Right — settings panel */}
        <div className="space-y-5">

          {/* Layout picker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Layout</p>
            <div className="space-y-2">
              {LAYOUTS.map(l => (
                <button key={l.key} onClick={() => setLayout(l.key)}
                  className={cn("w-full text-left px-4 py-3 rounded-xl border transition",
                    layout === l.key
                      ? "border-blue-400 bg-blue-50 text-blue-800"
                      : "border-slate-200 hover:border-slate-300 text-slate-700")}>
                  <p className="font-semibold text-sm">{l.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tags</p>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="the-pearl, luxury, guide…"
              className="w-full text-sm outline-none border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-400 transition"
            />
            <p className="text-xs text-slate-400 mt-2">Comma-separated</p>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Options</p>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-700 font-medium">Featured article</span>
              <div onClick={() => setFeatured(v => !v)}
                className={cn("w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                  featured ? "bg-blue-600" : "bg-slate-200")}>
                <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow",
                  featured ? "left-6" : "left-1")} />
              </div>
            </label>
          </div>

          {/* Danger */}
          {isEdit && (
            <div className="bg-white rounded-2xl border border-red-200 p-5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Danger Zone</p>
              <button
                onClick={async () => {
                  if (!confirm("Delete this article? This cannot be undone.")) return
                  await fetch(`/api/articles/${initialData.id}`, { method: "DELETE" })
                  router.push("/dashboard/articles")
                  router.refresh()
                }}
                className="w-full py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition">
                Delete article
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
