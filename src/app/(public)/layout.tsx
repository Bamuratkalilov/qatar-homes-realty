import { Navbar } from "@/components/public/navbar";
import { ChatWidget } from "@/components/public/chat-widget";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {children}
      <ChatWidget />
      <footer className="bg-slate-900 text-slate-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">
                Qatar Homes Realty
              </h3>
              <p className="text-sm">
                Your trusted partner for residential property in Qatar.
              </p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/listings?listingType=SALE"
                    className="hover:text-white transition"
                  >
                    Buy Property
                  </a>
                </li>
                <li>
                  <a
                    href="/listings?listingType=RENT"
                    className="hover:text-white transition"
                  >
                    Rent Property
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Contact</h4>
              <p className="text-sm">{process.env.NEXT_PUBLIC_AGENCY_PHONE}</p>
              <p className="text-sm">{process.env.NEXT_PUBLIC_AGENCY_EMAIL}</p>
              <p className="text-sm">Doha, Qatar</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs">
            © 2025 Qatar Homes Realty. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
