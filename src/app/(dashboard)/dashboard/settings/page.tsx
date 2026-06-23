import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Bell, Key, Building2, User } from "lucide-react"

export default function SettingsPage() {
  return (
    <div>
      <Header title="Settings" description="Manage your account and agency settings" />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Agent Profile</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <Input defaultValue="Ahmad Al-Mansoori" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <Input defaultValue="Property Consultant" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <Input type="email" defaultValue="ahmad@qatarhomes.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <Input type="tel" defaultValue="+974 5555 1234" />
            </div>
            <Button>Save Profile</Button>
          </div>
        </div>

        {/* Agency */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Agency Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Agency Name</label>
              <Input defaultValue="Qatar Homes Realty" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <Input defaultValue="+974 4444 5555" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <Input defaultValue="info@qatarhomes.com" />
              </div>
            </div>
            <Button>Save Agency</Button>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">API Configuration</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Configure these in your .env.local file</p>
          <div className="space-y-3">
            {[
              { label: "Claude AI (Anthropic)", key: "ANTHROPIC_API_KEY", hint: "Get from console.anthropic.com" },
              { label: "Resend (Email)", key: "RESEND_API_KEY", hint: "Get from resend.com" },
              { label: "Supabase URL", key: "NEXT_PUBLIC_SUPABASE_URL", hint: "Get from supabase.com" },
              { label: "Database URL", key: "DATABASE_URL", hint: "PostgreSQL connection string" },
            ].map(({ label, key, hint }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 font-mono">
                    {key}=&quot;...&quot;
                  </code>
                  <span className="text-xs text-slate-400">{hint}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "New lead notification", desc: "Get notified when a new lead is added" },
              { label: "Appointment reminders", desc: "Reminder 1 hour before appointments" },
              { label: "Follow-up reminders", desc: "Daily digest of leads needing follow-up" },
              { label: "Document signed", desc: "Alert when a client signs a document" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
