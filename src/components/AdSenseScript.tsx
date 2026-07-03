import Script from "next/script";
import { adsensePublisherId, isAdSenseEnabled } from "../lib/monetization";

export default function AdSenseScript() {
  if (!isAdSenseEnabled || !adsensePublisherId) return null;

  return (
    <Script
      id="gradeglow-adsense"
      strategy="afterInteractive"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
      crossOrigin="anonymous"
    />
  );
}
