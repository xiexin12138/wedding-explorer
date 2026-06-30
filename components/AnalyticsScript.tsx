import Script from "next/script";
import {
  ANALYTICS_PROVIDER,
  ANALYTICS_SCRIPT_SRC,
  ANALYTICS_SITE_ID,
  ANALYTICS_WEBSITE_ID,
  ANALYTICS_TOKEN,
  GOOGLE_ANALYTICS_ID,
} from "@/lib/client-config";
import { headers } from "next/headers";

interface AnalyticsScriptProps {
  // 可以传入自定义的 data-domain，如果不传则使用当前域名
  dataDomain?: string;
}

export async function AnalyticsScript({ dataDomain }: AnalyticsScriptProps) {
  // 获取当前请求的域名
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const domain = dataDomain || host;

  // 如果没有配置任何分析服务，则不渲染
  if (!ANALYTICS_PROVIDER) {
    return null;
  }

  // 根据不同的分析服务提供商渲染不同的脚本
  switch (ANALYTICS_PROVIDER.toLowerCase()) {
    case "plausible":
      if (!ANALYTICS_SCRIPT_SRC) return null;
      return (
        <Script
          defer
          data-domain={domain}
          src={ANALYTICS_SCRIPT_SRC}
          strategy="afterInteractive"
        />
      );

    case "umami":
      if (!ANALYTICS_SCRIPT_SRC || !ANALYTICS_WEBSITE_ID) return null;
      return (
        <Script
          defer
          src={ANALYTICS_SCRIPT_SRC}
          data-website-id={ANALYTICS_WEBSITE_ID}
          strategy="afterInteractive"
        />
      );

    case "fathom":
      if (!ANALYTICS_SITE_ID) return null;
      return (
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site={ANALYTICS_SITE_ID}
          defer
          strategy="afterInteractive"
        />
      );

    case "cloudflare":
      if (!ANALYTICS_TOKEN) return null;
      return (
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={`{"token": "${ANALYTICS_TOKEN}"}`}
          strategy="afterInteractive"
        />
      );

    case "google-analytics":
      if (!GOOGLE_ANALYTICS_ID) return null;
      return (
        <>
          <Script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GOOGLE_ANALYTICS_ID}');
            `}
          </Script>
        </>
      );

    case "custom":
      if (!ANALYTICS_SCRIPT_SRC) return null;
      return (
        <Script defer src={ANALYTICS_SCRIPT_SRC} strategy="afterInteractive" />
      );

    default:
      console.warn(`不支持的分析服务提供商: ${ANALYTICS_PROVIDER}`);
      return null;
  }
}
