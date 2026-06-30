"use client"

import { useState, useRef } from "react"
import { Home, Phone, User, CheckCircle, ChevronDown, AlertCircle } from "lucide-react"

const T = {
  en: {
    dir: "ltr" as const,
    tagline: "Premium Properties in Qatar",
    heading: "Find Your Property",
    subheading: "Fill in your details and we'll find the best options for you",
    name: "Full Name", namePlaceholder: "Ahmed Al-Rashid",
    phone: "WhatsApp / Phone", phonePlaceholder: "5555 1234",
    intent: "I want to",
    rent: "Rent", buy: "Buy",
    category: "Category", residential: "Residential", commercial: "Commercial",
    propertyType: "Property Type", selectType: "Select type",
    bedrooms: "Bedrooms",
    area: "Preferred Area", anyArea: "Any area", otherArea: "Other (type your area)", areaPlaceholder: "Type your preferred area...",
    budget: "Maximum Budget", perMonth: "per month", budgetPlaceholder: "e.g. 8,500",
    notes: "Additional Notes", notesOptional: "(optional)", notesPlaceholder: "e.g. Need parking, prefer ground floor, moving in August...",
    submit: "Get Free Consultation →", sending: "Sending...",
    disclaimer: "Your information is confidential and secure.",
    thankYou: "Thank You!", contactSoon: "Our agent will contact you shortly.",
    resTypes: ["Apartment", "Villa", "Studio", "Duplex", "Penthouse", "Townhouse", "Compound", "Whole Building"],
    comTypes: ["Office", "Shop / Retail", "Warehouse", "Showroom", "Labor Camp", "Restaurant / F&B", "Co-working Space"],
    beds: ["Studio", "1", "2", "3", "4", "5+"],
    errors: {
      name: "Please enter your full name (at least 3 characters)",
      phone: "Please enter a valid 8-digit Qatar number",
      intent: "Please select Rent or Buy",
      category: "Please select a category",
      propertyType: "Please select a property type",
      bedrooms: "Please select number of bedrooms",
      area: "Please select your preferred area",
      budget: "Please select or enter your budget",
    }
  },
  ar: {
    dir: "rtl" as const,
    tagline: "عقارات متميزة في قطر",
    heading: "ابحث عن عقارك",
    subheading: "أدخل بياناتك وسنجد لك أفضل الخيارات",
    name: "الاسم الكامل", namePlaceholder: "أحمد الراشد",
    phone: "واتساب / الهاتف", phonePlaceholder: "5555 1234",
    intent: "أريد",
    rent: "إيجار", buy: "شراء",
    category: "الفئة", residential: "سكني", commercial: "تجاري",
    propertyType: "نوع العقار", selectType: "اختر النوع",
    bedrooms: "غرف النوم",
    area: "المنطقة المفضلة", anyArea: "أي منطقة", otherArea: "أخرى (اكتب منطقتك)", areaPlaceholder: "اكتب منطقتك المفضلة...",
    budget: "الحد الأقصى للميزانية", perMonth: "شهرياً", budgetPlaceholder: "مثال: 8,500",
    notes: "ملاحظات إضافية", notesOptional: "(اختياري)", notesPlaceholder: "مثال: أحتاج موقف سيارة، أفضل الطابق الأرضي، الانتقال في أغسطس...",
    submit: "احصل على استشارة مجانية ←", sending: "جاري الإرسال...",
    disclaimer: "معلوماتك سرية وآمنة تماماً.",
    thankYou: "شكراً لك!", contactSoon: "سيتصل بك وكيلنا قريباً.",
    resTypes: ["شقة", "فيلا", "استوديو", "دوبلكس", "بنتهاوس", "تاون هاوس", "كمبوند", "مبنى كامل"],
    comTypes: ["مكتب", "محل / تجزئة", "مستودع", "معرض", "مخيم عمال", "مطعم / أغذية", "مساحة عمل مشتركة"],
    beds: ["استوديو", "1", "2", "3", "4", "5+"],
    errors: {
      name: "يرجى إدخال اسمك الكامل (3 أحرف على الأقل)",
      phone: "يرجى إدخال رقم قطري صحيح مكون من 8 أرقام",
      intent: "يرجى اختيار إيجار أو شراء",
      category: "يرجى اختيار الفئة",
      propertyType: "يرجى اختيار نوع العقار",
      bedrooms: "يرجى اختيار عدد غرف النوم",
      area: "يرجى اختيار المنطقة المفضلة",
      budget: "يرجى اختيار أو إدخال الميزانية",
    }
  },
}

const EN_PROP_TYPES = {
  res: ["Apartment", "Villa", "Studio", "Duplex", "Penthouse", "Townhouse", "Compound", "Whole Building"],
  com: ["Office", "Shop / Retail", "Warehouse", "Showroom", "Labor Camp", "Restaurant / F&B", "Co-working Space"],
}

const PROP_TYPE_ENUM = {
  res: ["APARTMENT", "VILLA", "STUDIO", "DUPLEX", "PENTHOUSE", "TOWNHOUSE", "COMPOUND", "WHOLE_BUILDING"],
  com: ["OFFICE", "SHOP", "WAREHOUSE", "SHOWROOM", "LABOR_CAMP", "RESTAURANT", "COWORKING"],
}

const BEDROOM_MAP: Record<string, number | null> = {
  "Studio": 0, "استوديو": 0,
  "1": 1, "2": 2, "3": 3, "4": 4, "5+": 5,
}

const DISTRICTS = [
  "West Bay", "The Pearl-Qatar", "Lusail", "Al Sadd", "Al Waab",
  "Al Rayyan", "Bin Mahmoud", "Al Duhail", "Al Thumama", "Al Wakra",
  "Al Khor", "Muaither", "Industrial Area",
]


function Err({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 font-medium mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {msg}
    </p>
  )
}

export default function InquiryPage() {
  const [lang, setLang] = useState<"en" | "ar">("en")
  const [step, setStep] = useState<"form" | "done">("form")
  const [loading, setLoading] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [customDistrict, setCustomDistrict] = useState(false)
  const [districtFrozen, setDistrictFrozen] = useState(false)
  const firstErrorRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState({
    name: "", phone: "", listingType: "", category: "",
    propertyTypeIndex: -1, budget: "", bedrooms: "",
    district: "", customDistrict: "", notes: "",
  })

  const t = T[lang]
  const isRent = form.listingType === "RENT"
  const isResidential = form.category === "RESIDENTIAL"
  const isCommercial = form.category === "COMMERCIAL"
  const displayTypes = isCommercial ? t.comTypes : t.resTypes
  const location = customDistrict ? form.customDistrict : form.district

  const errors = {
    name: form.name.trim().length < 3,
    phone: form.phone.length < 8,
    intent: !form.listingType,
    category: !form.category,
    propertyType: form.propertyTypeIndex < 0,
    bedrooms: isResidential && !form.bedrooms,
    area: customDistrict ? (!districtFrozen || !form.customDistrict) : !form.district,
    budget: !form.budget,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  function set(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function err(field: keyof typeof errors) {
    return attempted && errors[field]
  }

  const borderErr = "border-red-400 focus-within:ring-red-400"
  const borderOk = "border-slate-200"

  async function translateIfArabic(text: string): Promise<string> {
    if (lang === "en" || !text.trim()) return text
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    const data = await res.json()
    return data.translated || text
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setAttempted(true)
    if (hasErrors) {
      setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50)
      return
    }
    setLoading(true)
    try {
      const enPropertyType = form.propertyTypeIndex >= 0
        ? (isCommercial ? EN_PROP_TYPES.com : EN_PROP_TYPES.res)[form.propertyTypeIndex]
        : ""
      const [translatedNotes, translatedArea] = await Promise.all([
        translateIfArabic(form.notes),
        translateIfArabic(form.customDistrict),
      ])
      const parts = [
        form.listingType === "RENT" ? "Looking to rent" : "Looking to buy",
        enPropertyType,
        form.bedrooms ? `${isResidential && lang === "ar" && form.bedrooms === "استوديو" ? "Studio" : form.bedrooms} bedroom(s)` : "",
        location ? `in ${customDistrict ? translatedArea : location}` : "",
        form.budget ? `budget: ${form.budget}` : "",
      ].filter(Boolean)
      const propTypeEnum = form.propertyTypeIndex >= 0
        ? (isCommercial ? PROP_TYPE_ENUM.com : PROP_TYPE_ENUM.res)[form.propertyTypeIndex]
        : undefined

      const bedroomNum = BEDROOM_MAP[form.bedrooms] ?? undefined

      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: `+974${form.phone}`,
          message: [parts.join(", "), translatedNotes ? `Notes: ${translatedNotes}` : ""].filter(Boolean).join(" | "),
          source: "TIKTOK",
          propertyType: propTypeEnum,
          listingType: form.listingType,
          bedrooms: bedroomNum,
          budget: form.budget,
        }),
      })
      setStep("done")
    } finally {
      setLoading(false)
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4" dir={t.dir}>
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{t.thankYou}</h1>
          <p className="text-blue-100 text-lg">{t.contactSoon}</p>
          <div className="mt-8 bg-white/10 rounded-2xl px-6 py-4">
            <p className="text-white font-semibold">Qatar Homes Realty</p>
          </div>
        </div>
      </div>
    )
  }

  let firstErrorSet = false
  function firstErrRef(hasErr: boolean) {
    if (hasErr && !firstErrorSet) { firstErrorSet = true; return firstErrorRef }
    return undefined
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 pb-10" dir={t.dir}>
      <div className="max-w-lg mx-auto">
        <div className="pt-8 pb-4 px-6 text-center">
          <div className="flex justify-center mb-5">
            <div className="bg-white/20 rounded-xl p-1 flex gap-1">
              {(["en", "ar"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition ${lang === l ? "bg-white text-blue-700" : "text-white hover:bg-white/20"}`}>
                  {l === "en" ? "English" : "العربية"}
                </button>
              ))}
            </div>
          </div>
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Home className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-white text-2xl font-bold">Qatar Homes Realty</h1>
          <p className="text-blue-100 mt-1 text-sm">{t.tagline}</p>
        </div>

        <div className="mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
            <h2 className="text-xl font-bold text-slate-900">{t.heading}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{t.subheading}</p>
          </div>

          <form onSubmit={submit} className="px-6 py-5 space-y-5" noValidate>

            {/* Name */}
            <div ref={firstErrRef(!!err("name"))}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.name} <span className="text-red-500">*</span>
              </label>
              <div className={`relative border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${err("name") ? borderErr : borderOk}`}>
                <User className={`absolute ${lang === "ar" ? "right-3.5" : "left-3.5"} top-3.5 w-4 h-4 text-slate-400`} />
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder={t.namePlaceholder}
                  className={`w-full ${lang === "ar" ? "pr-10 pl-4 text-right" : "pl-10 pr-4"} py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none bg-white`} />
              </div>
              {err("name") && <Err msg={t.errors.name} />}
            </div>

            {/* Phone */}
            <div ref={firstErrRef(!!err("phone"))}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.phone} <span className="text-red-500">*</span>
              </label>
              <div className={`flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${lang === "ar" ? "flex-row-reverse" : ""} ${err("phone") ? borderErr : borderOk}`}>
                <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-slate-200 text-slate-600 font-semibold text-sm whitespace-nowrap select-none border-r">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  🇶🇦 +974
                </div>
                <input type="tel" value={form.phone}
                  onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 8); set("phone", d) }}
                  placeholder={t.phonePlaceholder} inputMode="numeric" maxLength={8}
                  className={`flex-1 px-3 py-3 text-base placeholder:text-slate-400 focus:outline-none bg-white ${lang === "ar" ? "text-right" : ""} text-slate-800`} />
              </div>
              {err("phone") && <Err msg={t.errors.phone} />}
            </div>

            {/* Rent or Buy */}
            <div ref={firstErrRef(!!err("intent"))}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t.intent} <span className="text-red-500">*</span>
              </label>
              <div className={`grid grid-cols-2 gap-3 rounded-xl ${err("intent") ? "ring-2 ring-red-400 ring-offset-2" : ""}`}>
                {[{ value: "RENT", label: t.rent }, { value: "SALE", label: t.buy }].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => { set("listingType", opt.value); set("budget", "") }}
                    className={`py-3.5 rounded-xl border-2 font-semibold text-sm transition ${form.listingType === opt.value ? "border-blue-600 bg-blue-600 text-white" : err("intent") ? "border-red-300 text-slate-600" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {err("intent") && <Err msg={t.errors.intent} />}
            </div>

            {/* Category */}
            <div ref={firstErrRef(!!err("category"))}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t.category} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[{ value: "RESIDENTIAL", label: t.residential }, { value: "COMMERCIAL", label: t.commercial }].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => { set("category", opt.value); set("propertyTypeIndex", -1) }}
                    className={`py-3 rounded-xl border-2 font-semibold text-sm transition ${form.category === opt.value ? "border-blue-600 bg-blue-600 text-white" : err("category") ? "border-red-300 text-slate-600" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {err("category") && <Err msg={t.errors.category} />}
            </div>

            {/* Property Type */}
            <div ref={firstErrRef(!!err("propertyType"))}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.propertyType} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select value={form.propertyTypeIndex}
                  onChange={(e) => set("propertyTypeIndex", parseInt(e.target.value))}
                  className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-base ${lang === "ar" ? "text-right" : ""} ${err("propertyType") ? "border-red-400" : "border-slate-200"}`}>
                  <option value={-1}>{t.selectType}</option>
                  {displayTypes.map((ty, i) => <option key={i} value={i}>{ty}</option>)}
                </select>
                <ChevronDown className={`absolute ${lang === "ar" ? "left-3.5" : "right-3.5"} top-3.5 w-4 h-4 text-slate-400 pointer-events-none`} />
              </div>
              {err("propertyType") && <Err msg={t.errors.propertyType} />}
            </div>

            {/* Bedrooms */}
            {isResidential && (
              <div ref={firstErrRef(!!err("bedrooms"))}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t.bedrooms} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {t.beds.map((b) => (
                    <button key={b} type="button" onClick={() => set("bedrooms", b)}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${form.bedrooms === b ? "border-blue-600 bg-blue-600 text-white" : err("bedrooms") ? "border-red-300 text-slate-600" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}>
                      {b}
                    </button>
                  ))}
                </div>
                {err("bedrooms") && <Err msg={t.errors.bedrooms} />}
              </div>
            )}

            {/* Area */}
            <div ref={firstErrRef(!!err("area"))}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.area} <span className="text-red-500">*</span>
              </label>
              {!customDistrict ? (
                <div className="relative">
                  <select value={form.district} onChange={(e) => {
                    if (e.target.value === "__other__") { setCustomDistrict(true); set("district", "") }
                    else set("district", e.target.value)
                  }} className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-base ${lang === "ar" ? "text-right" : ""} ${err("area") ? "border-red-400" : "border-slate-200"}`}>
                    <option value="">{t.anyArea}</option>
                    {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    <option value="__other__">{t.otherArea}</option>
                  </select>
                  <ChevronDown className={`absolute ${lang === "ar" ? "left-3.5" : "right-3.5"} top-3.5 w-4 h-4 text-slate-400 pointer-events-none`} />
                </div>
              ) : districtFrozen ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-blue-300 bg-blue-50 rounded-xl">
                  <span className="flex-1 text-blue-800 font-medium text-sm">{form.customDistrict}</span>
                  <button type="button" onClick={() => { setDistrictFrozen(false); setCustomDistrict(false); set("customDistrict", ""); set("district", "") }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap">Edit</button>
                  <button type="button" onClick={() => { setCustomDistrict(false); setDistrictFrozen(false); set("customDistrict", "") }}
                    className="text-slate-400 hover:text-red-500 text-lg leading-none">×</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={form.customDistrict}
                    onChange={(e) => set("customDistrict", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (form.customDistrict.trim()) setDistrictFrozen(true) } }}
                    placeholder={t.areaPlaceholder}
                    className={`flex-1 px-4 py-3 border rounded-xl text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${lang === "ar" ? "text-right" : ""} ${err("area") ? "border-red-400" : "border-slate-200"}`} />
                  <button type="button"
                    onClick={() => { if (form.customDistrict.trim()) setDistrictFrozen(true) }}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition"
                    disabled={!form.customDistrict.trim()}>✓</button>
                  <button type="button" onClick={() => { setCustomDistrict(false); set("customDistrict", "") }}
                    className="px-3 py-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-sm">↩</button>
                </div>
              )}
              {err("area") && <Err msg={t.errors.area} />}
            </div>

            {/* Budget */}
            {form.listingType && (
              <div ref={firstErrRef(!!err("budget"))}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t.budget} <span className="text-red-500">*</span>
                  {isRent && <span className="text-slate-400 font-normal text-xs ml-1">({t.perMonth})</span>}
                </label>
                <div className={`flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${err("budget") ? borderErr : borderOk}`}>
                  <div className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-slate-500 font-semibold text-sm whitespace-nowrap select-none">
                    QAR
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.budget}
                    onChange={(e) => set("budget", e.target.value)}
                    placeholder={t.budgetPlaceholder}
                    className={`flex-1 px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none bg-white ${lang === "ar" ? "text-right" : ""}`}
                  />
                </div>
                {err("budget") && <Err msg={t.errors.budget} />}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.notes} <span className="text-slate-400 font-normal text-xs">{t.notesOptional}</span>
              </label>
              <textarea value={form.notes}
                onChange={(e) => { if (e.target.value.length <= 200) set("notes", e.target.value) }}
                placeholder={t.notesPlaceholder} rows={3}
                className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base ${lang === "ar" ? "text-right" : ""}`} />
              <p className={`text-xs text-slate-400 mt-1 ${lang === "ar" ? "text-left" : "text-right"}`}>{form.notes.length}/200</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition text-lg">
              {loading ? t.sending : t.submit}
            </button>

            <p className="text-center text-xs text-slate-400 pb-2">{t.disclaimer}</p>
          </form>
        </div>
      </div>
    </div>
  )
}
