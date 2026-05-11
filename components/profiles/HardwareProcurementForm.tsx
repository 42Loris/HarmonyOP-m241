"use client";

import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { scrapeHardwareAction } from "@/actions/hardware-scraper";
import { addProfileHardwareAction } from "@/actions/profile-hardware";
import SubmitButton from "@/components/ui/SubmitButton";

interface HardwareProcurementFormProps {
  profileId: string;
}

const CATEGORIES = [
  { value: "NOTEBOOK", label: "Notebook / Laptop" },
  { value: "MONITOR", label: "Monitor" },
  { value: "KEYBOARD", label: "Keyboard" },
  { value: "MOUSE", label: "Mouse" },
  { value: "HEADSET", label: "Headset / Audio" },
  { value: "WEBCAM", label: "Webcam" },
  { value: "ACCESSORY", label: "Other Accessory" },
];

export default function HardwareProcurementForm({ profileId }: HardwareProcurementFormProps) {
  const [url, setUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<{ title: string; price: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError(null);

    if (newUrl.startsWith("http")) {
      setIsScraping(true);
      const result = await scrapeHardwareAction(newUrl);
      setIsScraping(false);

      if ("error" in result) {
        setError(result.error || "Could not scrape product data.");
        setScrapedData(null);
      } else {
        setScrapedData(result as { title: string; price: number });
      }
    } else {
      setScrapedData(null);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
      <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <ShoppingCart className="h-4 w-4" /> Add Hardware Requirement
      </h3>
      <form 
        action={async (formData) => {
          const res = await addProfileHardwareAction(formData);
          if (res.success) {
            setUrl("");
            setScrapedData(null);
            setError(null);
          }
        }} 
        className="space-y-4"
      >
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="itemName" value={scrapedData?.title || ""} />
        <input type="hidden" name="price" value={scrapedData?.price?.toString() || ""} />

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
          <select name="category" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900 dark:border-slate-700">
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Product URL (Digitec, etc.)</label>
          <div className="relative">
            <input 
              type="url" 
              name="url" 
              value={url}
              onChange={handleUrlChange}
              required 
              placeholder="https://www.digitec.ch/..." 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm pr-10" 
            />
            {isScraping && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {scrapedData && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{scrapedData.title}</p>
            <p className="text-sm font-bold text-blue-600">Estimated Price: CHF {scrapedData.price.toFixed(2)}</p>
          </div>
        )}

        {error && (
          <p className="text-[10px] text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</p>
        )}
        
        <SubmitButton 
          defaultText="Add to Procurement List" 
          loadingText="Saving..." 
          disabled={!scrapedData || isScraping}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
        />
      </form>
    </div>
  );
}