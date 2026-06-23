"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn, getInitials } from "@/lib/utils"
import {
  Building2, LayoutDashboard, Home, Users, UserCheck,
  Calendar, FileText, TrendingUp, Bot, Settings, LogOut, ChevronRight, Shield, BarChart2, MessageCircle
} from "lucide-react"

const agentNav = [
  { label: "Dashboard",   href: "/dashboard",            icon: LayoutDashboard },
  { label: "Properties",  href: "/dashboard/properties", icon: Home            },
  { label: "Leads",       href: "/dashboard/leads",      icon: UserCheck       },
  { label: "Clients",     href: "/dashboard/clients",    icon: Users           },
  { label: "Calendar",    href: "/dashboard/calendar",   icon: Calendar        },
  { label: "Documents",   href: "/dashboard/documents",  icon: FileText        },
  { label: "Reports",     href: "/dashboard/reports",    icon: BarChart2       },
  { label: "Marketing",   href: "/dashboard/marketing",  icon: TrendingUp      },
  { label: "WhatsApp AI", href: "/dashboard/whatsapp",   icon: MessageCircle   },
  { label: "AI Assistant",href: "/dashboard/assistant",  icon: Bot             },
  { label: "Settings",    href: "/dashboard/settings",   icon: Settings        },
]

const adminNav = [
  { label: "Team Overview", href: "/dashboard/admin", icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 flex flex-col z-30">
      <div className="p-5 border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              {process.env.NEXT_PUBLIC_AGENCY_NAME || "Qatar Homes"}
            </p>
            <p className="text-slate-400 text-xs">Realty Platform</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        <ul className="space-y-0.5">
          {agentNav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                  {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                </Link>
              </li>
            )
          })}
        </ul>

        {(session?.user as { role?: string })?.role === "ADMIN" && (
          <div>
            <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Admin</p>
            <ul className="space-y-0.5">
              {adminNav.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        active
                          ? "bg-purple-600 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{label}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(session?.user?.name || session?.user?.email || "A")}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-white text-sm font-medium truncate">{session?.user?.name || "Agent"}</p>
            <p className="text-slate-400 text-xs truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
