import { NextRequest, NextResponse } from "next/server";
import { generatePDFHTML } from "@/lib/generate-pdf-html";
import type { Theme } from "@/types/theme";

interface WishlistItem {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  clubName: string;
}

interface RequestBody {
  title: string;
  message: string;
  items: WishlistItem[];
  theme?: Theme;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { title, message, items, theme = "christmas" } = body;

    if (!title || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Titre et items requis" },
        { status: 400 }
      );
    }

    // Générer le HTML
    const html = generatePDFHTML({
      title,
      message,
      items,
      theme,
    });

    let browser:
      | Awaited<ReturnType<typeof import("puppeteer").default.launch>>
      | undefined;

    try {
      const isDev = process.env.NODE_ENV === "development";

      if (isDev) {
        const puppeteer = await import("puppeteer");
        browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
      } else {
        // En prod, chromium serverless
        const puppeteerCore = await import("puppeteer-core");
        const chromium = await import("@sparticuz/chromium");

        browser = await puppeteerCore.launch({
          args: chromium.default.args,
          executablePath: await chromium.default.executablePath(),
          headless: true,
        });
      }

      if (!browser) {
        throw new Error("Échec du lancement du navigateur");
      }

      const page = await browser.newPage();

      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });

      // Charger le HTML
      await page.setContent(html, {
        waitUntil: ["networkidle0", "load"],
      });

      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise((resolve) => {
                  img.onload = img.onerror = resolve;
                })
            )
        );
      });

      // Générer le PDF
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
      });

      await browser.close();

      const buffer = Buffer.from(pdfBuffer);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="wishlist-${Date.now()}.pdf"`,
        },
      });
    } catch (puppeteerError) {
      console.error("Erreur Puppeteer:", puppeteerError);
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error("Erreur fermeture navigateur:", closeError);
        }
      }
      throw puppeteerError;
    }
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
