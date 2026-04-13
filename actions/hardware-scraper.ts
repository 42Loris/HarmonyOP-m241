"use server";

import * as cheerio from "cheerio";

/**
 * scrapeHardwareAction
 * 
 * Fetches HTML from a given URL and extracts product Title and Price.
 * Optimized for Digitec.ch and other modern e-commerce sites using
 * Open Graph meta tags and JSON-LD structured data.
 */
export async function scrapeHardwareAction(url: string): Promise<{ title: string; price: number } | { error: string }> {
  if (!url) return { error: "URL is required" };

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        return { error: "Access blocked by bot protection. Please enter details manually." };
      }
      return { error: `Failed to fetch URL (Status: ${res.status})` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Try Open Graph Meta Tags (Most Reliable)
    let title = $('meta[property="og:title"]').attr("content") || $('meta[name="twitter:title"]').attr("content");
    let price: string | undefined = $('meta[property="product:price:amount"]').attr("content");

    // 2. Try JSON-LD (Standard for E-commerce)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "{}");
        
        // Product data can be the root object or inside a @graph array
        const findProduct = (obj: unknown): any => {
          if (!obj || typeof obj !== "object") return null;
          const candidate = obj as Record<string, any>;
          if (candidate["@type"] === "Product") return candidate;
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const p = findProduct(item);
              if (p) return p;
            }
          } else {
            for (const key in candidate) {
              const p = findProduct(candidate[key]);
              if (p) return p;
            }
          }
          return null;
        };

        const product = findProduct(data);
        if (product) {
          if (!title) title = product.name;
          if (!price) {
            if (product.offers) {
              if (Array.isArray(product.offers)) {
                price = product.offers[0]?.price?.toString();
              } else {
                price = product.offers.price?.toString();
              }
            }
          }
        }
      } catch (e) {
        // Silent catch for JSON parse errors
      }
    });

    // 3. Fallback to Page Title if still no title
    if (!title) {
      title = $("title").text().split("|")[0].trim();
    }

    if (!title) return { error: "Could not extract product name." };
    if (!price) return { error: "Could not extract price. Please enter it manually." };

    // Clean price (remove currency symbols if present)
    const numericPrice = price.replace(/[^0-9.]/g, "");

    return { 
      title: title.trim(), 
      price: parseFloat(numericPrice) 
    };

  } catch (error: unknown) {
    console.error("Scraper Error:", error);
    return { error: "An unexpected error occurred while scraping." };
  }
}