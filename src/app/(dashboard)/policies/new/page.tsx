"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { policiesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";

type PolicyType = "auto" | "casco" | "property" | "travel";

const typeLabels: Record<PolicyType, string> = {
  auto: "Avtomobil (MTPL)", casco: "Kasko", property: "Əmlak", travel: "Səfər",
};

export default function NewPolicyPage() {
  const router = useRouter();
  const [type, setType] = useState<PolicyType>("auto");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setDetail = (key: string, value: any) => setDetails(d => ({ ...d, [key]: value }));

  const handlePreview = async () => {
    try {
      const res = await policiesApi.previewPrice(type, details);
      setPreviewPrice(res.data.premium_amount);
    } catch (e: any) {
      setError(e.response?.data?.message || "Hesablama xətası");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await policiesApi.create({ type, customer_name: customerName, customer_phone: customerPhone, customer_email: customerEmail, start_date: startDate, end_date: endDate, notes, details });
      router.push("/policies");
    } catch (e: any) {
      setError(e.response?.data?.message || "Xəta baş verdi");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/policies"><Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-slate-900">Yeni Sığorta</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sığorta növü */}
        <Card>
          <CardHeader><CardTitle>Sığorta Növü</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(typeLabels) as PolicyType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setDetails({}); setPreviewPrice(null); }}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${type === t ? "border-primary bg-primary/5 text-primary" : "border-gray-200 hover:border-gray-300"}`}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Müştəri məlumatları */}
        <Card>
          <CardHeader><CardTitle>Müştəri Məlumatları</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Ad Soyad *</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+994 50 XXX XX XX" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Başlama tarixi *</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Bitmə tarixi *</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        {/* Növ üçün xüsusi sahələr */}
        <Card>
          <CardHeader><CardTitle>{typeLabels[type]} Məlumatları</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {type === "auto" && <>
              <Field label="Avtomobil nömrəsi *" value={details.plate} onChange={v => setDetail("plate", v)} required />
              <Field label="Marka *" value={details.brand} onChange={v => setDetail("brand", v)} required />
              <Field label="Model *" value={details.model} onChange={v => setDetail("model", v)} required />
              <Field label="İstehsal ili *" type="number" value={details.year} onChange={v => setDetail("year", v)} required placeholder="2020" />
              <Field label="Motor həcmi (L) *" type="number" step="0.1" value={details.engine_volume} onChange={v => setDetail("engine_volume", v)} required placeholder="1.6" />
              <Field label="Sahibin adı *" value={details.owner_name} onChange={v => setDetail("owner_name", v)} required />
            </>}
            {type === "casco" && <>
              <Field label="Avtomobil nömrəsi *" value={details.plate} onChange={v => setDetail("plate", v)} required />
              <Field label="Marka *" value={details.brand} onChange={v => setDetail("brand", v)} required />
              <Field label="Model *" value={details.model} onChange={v => setDetail("model", v)} required />
              <Field label="İstehsal ili *" type="number" value={details.year} onChange={v => setDetail("year", v)} required />
              <Field label="Avtomobilin dəyəri (AZN) *" type="number" value={details.car_value} onChange={v => setDetail("car_value", v)} required />
              <Field label="Sürücü sayı *" type="number" value={details.driver_count} onChange={v => setDetail("driver_count", v)} required placeholder="1" />
            </>}
            {type === "property" && <>
              <div className="sm:col-span-2 space-y-2">
                <Label>Ünvan *</Label>
                <Input value={details.address || ""} onChange={e => setDetail("address", e.target.value)} required />
              </div>
              <Field label="Sahə (m²) *" type="number" value={details.area} onChange={v => setDetail("area", v)} required />
              <Field label="Əmlakın dəyəri (AZN) *" type="number" value={details.property_value} onChange={v => setDetail("property_value", v)} required />
              <div className="space-y-2">
                <Label>Bina tipi *</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={details.building_type || ""} onChange={e => setDetail("building_type", e.target.value)} required>
                  <option value="">Seçin</option>
                  <option value="apartment">Mənzil</option>
                  <option value="house">Ev</option>
                  <option value="commercial">Kommersiya</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Bölgə *</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={details.region || ""} onChange={e => setDetail("region", e.target.value)} required>
                  <option value="">Seçin</option>
                  <option value="baku">Bakı</option>
                  <option value="sumgait">Sumqayıt</option>
                  <option value="ganja">Gəncə</option>
                  <option value="other">Digər</option>
                </select>
              </div>
            </>}
            {type === "travel" && <>
              <Field label="Gedilən ölkə/bölgə *" value={details.country} onChange={v => setDetail("country", v)} required />
              <div className="space-y-2">
                <Label>Destinasiya zonası *</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={details.destination_zone || ""} onChange={e => setDetail("destination_zone", e.target.value)} required>
                  <option value="">Seçin</option>
                  <option value="cis">MDB ölkələri</option>
                  <option value="europe">Avropa</option>
                  <option value="asia">Asiya</option>
                  <option value="usa_canada">ABŞ/Kanada</option>
                  <option value="other">Digər</option>
                </select>
              </div>
              <Field label="Şəxs sayı *" type="number" value={details.persons_count} onChange={v => setDetail("persons_count", v)} required placeholder="1" />
              <div className="space-y-2">
                <Label>Əhatə növü *</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={details.coverage_type || ""} onChange={e => setDetail("coverage_type", e.target.value)} required>
                  <option value="">Seçin</option>
                  <option value="basic">Əsas</option>
                  <option value="standard">Standart</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </>}
          </CardContent>
        </Card>

        {/* Qeydlər */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <Label>Qeydlər</Label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              placeholder="Əlavə qeydlər..."
            />
          </CardContent>
        </Card>

        {/* Qiymət preview */}
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <Button type="button" variant="outline" onClick={handlePreview}>
            <Calculator size={16} className="mr-2" />
            Qiyməti hesabla
          </Button>
          {previewPrice !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-900 font-semibold">
              Təxmini premium: {formatCurrency(previewPrice)}
            </div>
          )}
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Sığortanı yarat</Button>
          <Link href="/policies"><Button type="button" variant="outline">Ləğv et</Button></Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text", placeholder, step }: any) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value || ""}
        onChange={(e: any) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        step={step}
      />
    </div>
  );
}
