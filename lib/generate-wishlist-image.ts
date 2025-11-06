interface WishlistItem {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  clubName: string;
}

interface GenerateImageOptions {
  title: string;
  message: string;
  items: WishlistItem[];
  theme?: "christmas" | "birthday" | "default" | "valentine";
  locale?: string;
}

interface Translations {
  JerseyType: Record<string, string>;
  Wishlist: {
    sharedClient: {
      createdWith: string;
      brandName: string;
    };
  };
}

async function loadTranslations(locale: string): Promise<Translations> {
  const messages = await import(`@/messages/${locale}.json`);
  return messages.default as Translations;
}

function getJerseyTypeLabel(type: string, translations: Translations): string {
  const jerseyTypes = translations.JerseyType;
  return jerseyTypes[type] || type;
}

export async function generateWishlistImage(
  options: GenerateImageOptions
): Promise<Blob> {
  const { title, message, items, theme = "christmas", locale = "fr" } = options;
  const translations = await loadTranslations(locale);
  const t = translations.Wishlist.sharedClient;

  const width = 1080;
  const headerHeight = 300;
  const itemsPerRow = 2;
  const itemSize = 480;
  const itemPadding = 40;
  const rows = Math.ceil(items.length / itemsPerRow);
  const gridHeight = rows * (itemSize + itemPadding) + itemPadding;
  const footerHeight = 150;
  const height = headerHeight + gridHeight + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Impossible de créer le contexte canvas");
  }

  const themes = {
    christmas: {
      gradient1: "#DC2626", // red-600
      gradient2: "#16A34A", // green-600
      accent: "#DC2626",
      bg: "#FEF2F2", // red-50
      text: "#1F2937", // gray-800
      textLight: "#6B7280", // gray-500
    },
    birthday: {
      gradient1: "#EC4899", // pink-500
      gradient2: "#8B5CF6", // purple-500
      accent: "#EC4899",
      bg: "#FDF4FF", // pink-50
      text: "#1F2937",
      textLight: "#6B7280",
    },
    default: {
      gradient1: "#3B82F6", // blue-500
      gradient2: "#8B5CF6", // purple-500
      accent: "#3B82F6",
      bg: "#F9FAFB", // gray-50
      text: "#1F2937",
      textLight: "#6B7280",
    },
    valentine: {
      gradient1: "#EC4899", // pink-500
      gradient2: "#F87171", // red-400
      accent: "#EC4899",
      bg: "#FDF2F8", // pink-50
      text: "#1F2937",
      textLight: "#6B7280",
    },
  };

  const colors = themes[theme];

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors.gradient1 + "20");
  gradient.addColorStop(0.5, colors.gradient2 + "20");
  gradient.addColorStop(1, colors.gradient1 + "20");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, headerHeight);

  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(width / 2, 80, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("❤️", width / 2, 95);

  ctx.fillStyle = colors.text;
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, 160);

  if (message) {
    ctx.fillStyle = colors.textLight;
    ctx.font = "28px Arial";
    const maxWidth = width - 100;
    const words = message.split(" ");
    let line = "";
    let y = 210;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, width / 2, y);
        line = words[i] + " ";
        y += 35;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);
  }

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  try {
    const images = await Promise.all(
      items.map((item) => loadImage(item.imageUrl))
    );

    items.forEach((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x =
        col * (itemSize + itemPadding) +
        itemPadding +
        (itemsPerRow === 2 ? 60 : 0);
      const y = row * (itemSize + itemPadding) + itemPadding + headerHeight;

      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      const radius = 20;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + itemSize - radius, y);
      ctx.quadraticCurveTo(x + itemSize, y, x + itemSize, y + radius);
      ctx.lineTo(x + itemSize, y + itemSize - radius);
      ctx.quadraticCurveTo(
        x + itemSize,
        y + itemSize,
        x + itemSize - radius,
        y + itemSize
      );
      ctx.lineTo(x + radius, y + itemSize);
      ctx.quadraticCurveTo(x, y + itemSize, x, y + itemSize - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = "transparent";

      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(x + 40, y + 40, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText((index + 1).toString(), x + 40, y + 50);

      const img = images[index];
      const imgSize = 320;
      const imgX = x + (itemSize - imgSize) / 2;
      const imgY = y + 30;

      ctx.fillStyle = "#F3F4F6";
      ctx.fillRect(imgX, imgY, imgSize, imgSize);

      const scale = Math.min(imgSize / img.width, imgSize / img.height) * 0.9;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const imgCenterX = imgX + (imgSize - scaledWidth) / 2;
      const imgCenterY = imgY + (imgSize - scaledHeight) / 2;

      ctx.drawImage(img, imgCenterX, imgCenterY, scaledWidth, scaledHeight);

      ctx.fillStyle = colors.text;
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      const clubNameY = y + imgY + imgSize + 35;

      let clubName = item.clubName;
      if (ctx.measureText(clubName).width > itemSize - 40) {
        while (ctx.measureText(clubName + "...").width > itemSize - 40) {
          clubName = clubName.slice(0, -1);
        }
        clubName += "...";
      }
      ctx.fillText(clubName, x + itemSize / 2, clubNameY);

      ctx.fillStyle = colors.textLight;
      ctx.font = "18px Arial";
      const typeLabel = getJerseyTypeLabel(item.type, translations);
      ctx.fillText(
        `${typeLabel} • ${item.season}`,
        x + itemSize / 2,
        clubNameY + 30
      );
    });
  } catch (error) {
    console.error("Erreur chargement des images:", error);
    throw new Error("Impossible de charger les images des maillots");
  }

  const footerY = headerHeight + gridHeight;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, footerY, width, footerHeight);

  ctx.fillStyle = colors.textLight;
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${t.createdWith} ${t.brandName} ⚽`, width / 2, footerY + 60);

  ctx.font = "18px Arial";
  ctx.fillText("le-vestiaire-foot.fr", width / 2, footerY + 95);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Erreur lors de la création du blob"));
      }
    }, "image/png");
  });
}

export function downloadImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
