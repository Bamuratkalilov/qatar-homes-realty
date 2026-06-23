import { Phone, Mail, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900">Contact Us</h1>
        <p className="text-slate-500 mt-2">Get in touch with our team of Qatar property experts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Send us a message</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">First name</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Last name</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input type="tel" placeholder="+974..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">I am interested in</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option>Renting a property</option>
                <option>Buying a property</option>
                <option>General inquiry</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
              <textarea rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Tell us about your requirements..." />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition">
              Send Message
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Our Information</h2>
            <div className="space-y-4">
              {[
                { icon: Phone, label: "Phone", value: process.env.NEXT_PUBLIC_AGENCY_PHONE || "+974 4444 5555" },
                { icon: Mail, label: "Email", value: process.env.NEXT_PUBLIC_AGENCY_EMAIL || "info@qatarhomes.com" },
                { icon: MapPin, label: "Office", value: "West Bay, Doha, Qatar" },
                { icon: Clock, label: "Hours", value: "Sun–Thu: 8am–6pm | Sat: 10am–4pm" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
                    <p className="text-slate-900 font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-semibold text-slate-900 mb-2">WhatsApp</h3>
            <p className="text-slate-500 text-sm mb-4">Chat with us directly on WhatsApp for a faster response.</p>
            <a
              href={`https://wa.me/97444445555`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-green-600 transition"
            >
              Open WhatsApp Chat
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
