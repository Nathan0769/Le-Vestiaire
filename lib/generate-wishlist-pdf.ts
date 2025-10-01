interface WishlistItem {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  clubName: string;
}

interface GeneratePDFOptions {
  title: string;
  message: string;
  items: WishlistItem[];
  theme?: "christmas" | "birthday" | "default" | "valentine";
}

export async function generateWishlistPDF(
  options: GeneratePDFOptions
): Promise<Blob> {
  const { title, message, items, theme = "christmas" } = options;

  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  type RGB = [number, number, number];
  interface PDFTheme {
    primary: RGB;
    secondary: RGB;
    text: RGB;
    textLight: RGB;
  }
  const themes: Record<NonNullable<GeneratePDFOptions["theme"]>, PDFTheme> = {
    christmas: {
      primary: [220, 38, 38] as RGB, // red-600
      secondary: [22, 163, 74] as RGB, // green-600
      text: [31, 41, 55] as RGB, // gray-800
      textLight: [107, 114, 128] as RGB, // gray-500
    },
    birthday: {
      primary: [236, 72, 153] as RGB, // pink-500
      secondary: [139, 92, 246] as RGB, // purple-500
      text: [31, 41, 55] as RGB,
      textLight: [107, 114, 128] as RGB,
    },
    valentine: {
      primary: [236, 72, 153] as RGB, // pink-500
      secondary: [248, 113, 113] as RGB, // red-400
      text: [31, 41, 55] as RGB,
      textLight: [107, 114, 128] as RGB,
    },
    default: {
      primary: [59, 130, 246] as RGB, // blue-500
      secondary: [139, 92, 246] as RGB, // purple-500
      text: [31, 41, 55] as RGB,
      textLight: [107, 114, 128] as RGB,
    },
  };

  const colors = themes[theme];

  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setFontSize(24);
  doc.text("❤️", pageWidth / 2, 20, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 35, {
    align: "center",
    maxWidth: contentWidth,
  });

  if (message) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const messageLines = doc.splitTextToSize(message, contentWidth - 20);
    doc.text(messageLines, pageWidth / 2, 48, { align: "center" });
  }

  doc.setFontSize(10);
  doc.setTextColor(...colors.textLight);
  const currentDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(currentDate, pageWidth / 2, 70, { align: "center" });

  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          reject(new Error("Canvas context error"));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  try {
    const images = await Promise.all(
      items.map((item) => loadImage(item.imageUrl))
    );

    let y = 85;
    const itemsPerPage = 3;
    const itemHeight = 55;
    const imageSize = 40;

    items.forEach((item, index) => {
      if (index > 0 && index % itemsPerPage === 0) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(...colors.primary);
      doc.circle(margin + 6, y + 6, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text((index + 1).toString(), margin + 6, y + 8, { align: "center" });

      doc.setDrawColor(229, 231, 235); // gray-200
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentWidth, itemHeight, 3, 3, "S");

      doc.setFillColor(243, 244, 246); // gray-100
      doc.roundedRect(margin + 15, y + 5, imageSize, imageSize, 2, 2, "F");

      try {
        const imgData = images[index];
        doc.addImage(
          imgData,
          "JPEG",
          margin + 17,
          y + 7,
          imageSize - 4,
          imageSize - 4
        );
      } catch (err) {
        console.error("Erreur ajout image:", err);
      }

      const textX = margin + 15 + imageSize + 10;

      doc.setTextColor(...colors.text);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const clubNameLines = doc.splitTextToSize(
        item.clubName,
        contentWidth - imageSize - 30
      );
      doc.text(clubNameLines[0], textX, y + 15);

      doc.setTextColor(...colors.textLight);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const typeLabel = getJerseyTypeLabel(item.type);
      doc.text(`${typeLabel} • ${item.season}`, textX, y + 25);

      if (item.name !== item.clubName) {
        doc.setFontSize(9);
        const nameLines = doc.splitTextToSize(
          item.name,
          contentWidth - imageSize - 30
        );
        doc.text(nameLines[0], textX, y + 32);
      }

      doc.setDrawColor(...colors.textLight);
      doc.setLineWidth(0.3);
      doc.rect(contentWidth + margin - 15, y + itemHeight / 2 - 3, 6, 6);

      doc.setTextColor(...colors.textLight);
      doc.setFontSize(7);
      doc.text("Offert", contentWidth + margin - 15, y + itemHeight / 2 + 10, {
        align: "center",
        maxWidth: 10,
      });

      y += itemHeight + 5;
    });

    const footerY = pageHeight - 20;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setTextColor(...colors.textLight);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Créé avec Le Vestiaire Foot ⚽", pageWidth / 2, footerY, {
      align: "center",
    });
    doc.text("le-vestiaire-foot.fr", pageWidth / 2, footerY + 5, {
      align: "center",
    });
  } catch (error) {
    console.error("Erreur chargement des images pour PDF:", error);
    throw new Error("Impossible de charger les images des maillots");
  }

  return doc.output("blob");
}

function getJerseyTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    HOME: "Domicile",
    AWAY: "Extérieur",
    THIRD: "Third",
    FOURTH: "Fourth",
    GOALKEEPER: "Gardien",
    SPECIAL: "Spécial",
  };
  return typeLabels[type] || type;
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
