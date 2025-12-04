import { useState, useEffect } from "react";

interface CurrencyInfo {
  symbol: string;
  code: string;
  locale: string;
}

const currencyMap: Record<string, CurrencyInfo> = {
  US: { symbol: "$", code: "USD", locale: "en-US" },
  GB: { symbol: "£", code: "GBP", locale: "en-GB" },
  EU: { symbol: "€", code: "EUR", locale: "de-DE" },
  DE: { symbol: "€", code: "EUR", locale: "de-DE" },
  FR: { symbol: "€", code: "EUR", locale: "fr-FR" },
  ES: { symbol: "€", code: "EUR", locale: "es-ES" },
  IT: { symbol: "€", code: "EUR", locale: "it-IT" },
  JP: { symbol: "¥", code: "JPY", locale: "ja-JP" },
  CN: { symbol: "¥", code: "CNY", locale: "zh-CN" },
  IN: { symbol: "₹", code: "INR", locale: "en-IN" },
  AU: { symbol: "A$", code: "AUD", locale: "en-AU" },
  CA: { symbol: "C$", code: "CAD", locale: "en-CA" },
  BR: { symbol: "R$", code: "BRL", locale: "pt-BR" },
  MX: { symbol: "MX$", code: "MXN", locale: "es-MX" },
  KR: { symbol: "₩", code: "KRW", locale: "ko-KR" },
  RU: { symbol: "₽", code: "RUB", locale: "ru-RU" },
  ZA: { symbol: "R", code: "ZAR", locale: "en-ZA" },
  AE: { symbol: "د.إ", code: "AED", locale: "ar-AE" },
  SA: { symbol: "﷼", code: "SAR", locale: "ar-SA" },
  SG: { symbol: "S$", code: "SGD", locale: "en-SG" },
  HK: { symbol: "HK$", code: "HKD", locale: "zh-HK" },
  NZ: { symbol: "NZ$", code: "NZD", locale: "en-NZ" },
  CH: { symbol: "CHF", code: "CHF", locale: "de-CH" },
  SE: { symbol: "kr", code: "SEK", locale: "sv-SE" },
  NO: { symbol: "kr", code: "NOK", locale: "nb-NO" },
  DK: { symbol: "kr", code: "DKK", locale: "da-DK" },
  PL: { symbol: "zł", code: "PLN", locale: "pl-PL" },
  TR: { symbol: "₺", code: "TRY", locale: "tr-TR" },
  TH: { symbol: "฿", code: "THB", locale: "th-TH" },
  ID: { symbol: "Rp", code: "IDR", locale: "id-ID" },
  MY: { symbol: "RM", code: "MYR", locale: "ms-MY" },
  PH: { symbol: "₱", code: "PHP", locale: "en-PH" },
  VN: { symbol: "₫", code: "VND", locale: "vi-VN" },
  PK: { symbol: "₨", code: "PKR", locale: "en-PK" },
  BD: { symbol: "৳", code: "BDT", locale: "bn-BD" },
  NG: { symbol: "₦", code: "NGN", locale: "en-NG" },
  EG: { symbol: "E£", code: "EGP", locale: "ar-EG" },
  IL: { symbol: "₪", code: "ILS", locale: "he-IL" },
};

const defaultCurrency: CurrencyInfo = { symbol: "$", code: "USD", locale: "en-US" };

export const useCurrency = () => {
  const [currency, setCurrency] = useState<CurrencyInfo>(defaultCurrency);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // First try browser locale
        const browserLocale = navigator.language || "en-US";
        const countryFromLocale = browserLocale.split("-")[1]?.toUpperCase();
        
        if (countryFromLocale && currencyMap[countryFromLocale]) {
          setCurrency(currencyMap[countryFromLocale]);
          setIsLoading(false);
          return;
        }

        // Fallback: Try to get from timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const countryFromTimezone = getCountryFromTimezone(timezone);
        
        if (countryFromTimezone && currencyMap[countryFromTimezone]) {
          setCurrency(currencyMap[countryFromTimezone]);
        }
      } catch (error) {
        console.log("Using default currency");
      } finally {
        setIsLoading(false);
      }
    };

    detectCurrency();
  }, []);

  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat(currency.locale, {
        style: "currency",
        currency: currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency.symbol}${amount.toFixed(2)}`;
    }
  };

  return { currency, formatCurrency, isLoading };
};

function getCountryFromTimezone(timezone: string): string | null {
  const timezoneToCountry: Record<string, string> = {
    "America/New_York": "US",
    "America/Los_Angeles": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "Europe/London": "GB",
    "Europe/Paris": "FR",
    "Europe/Berlin": "DE",
    "Europe/Madrid": "ES",
    "Europe/Rome": "IT",
    "Asia/Tokyo": "JP",
    "Asia/Shanghai": "CN",
    "Asia/Kolkata": "IN",
    "Australia/Sydney": "AU",
    "America/Toronto": "CA",
    "America/Sao_Paulo": "BR",
    "America/Mexico_City": "MX",
    "Asia/Seoul": "KR",
    "Europe/Moscow": "RU",
    "Africa/Johannesburg": "ZA",
    "Asia/Dubai": "AE",
    "Asia/Singapore": "SG",
    "Asia/Hong_Kong": "HK",
    "Pacific/Auckland": "NZ",
    "Europe/Zurich": "CH",
    "Europe/Stockholm": "SE",
    "Europe/Oslo": "NO",
    "Europe/Copenhagen": "DK",
    "Europe/Warsaw": "PL",
    "Europe/Istanbul": "TR",
    "Asia/Bangkok": "TH",
    "Asia/Jakarta": "ID",
    "Asia/Kuala_Lumpur": "MY",
    "Asia/Manila": "PH",
    "Asia/Ho_Chi_Minh": "VN",
    "Asia/Karachi": "PK",
    "Asia/Dhaka": "BD",
    "Africa/Lagos": "NG",
    "Africa/Cairo": "EG",
    "Asia/Jerusalem": "IL",
  };

  return timezoneToCountry[timezone] || null;
}

export default useCurrency;
