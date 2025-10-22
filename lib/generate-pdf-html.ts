import type { Theme } from "@/types/theme";

interface WishlistItem {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  clubName: string;
}

interface GeneratePDFHTMLOptions {
  title: string;
  message: string;
  items: WishlistItem[];
  theme?: Theme;
}

const THEME_CONFIG = {
  christmas: {
    gradient: "from-red-50 via-green-50 to-red-50",
    headerGradient: "from-red-600 to-green-600",
    border: "border-red-200",
    cardBorder: "border-red-200",
    badge: "bg-red-500/20 text-red-700 border-red-200",
    button: "bg-gradient-to-r from-red-600 to-green-600",
  },
  birthday: {
    gradient: "from-pink-50 via-purple-50 to-pink-50",
    headerGradient: "from-pink-500 to-purple-500",
    border: "border-pink-200",
    cardBorder: "border-pink-200",
    badge: "bg-pink-500/20 text-pink-700 border-pink-200",
    button: "bg-gradient-to-r from-pink-500 to-purple-500",
  },
  valentine: {
    gradient: "from-pink-50 via-red-50 to-pink-50",
    headerGradient: "from-pink-500 to-red-400",
    border: "border-pink-200",
    cardBorder: "border-pink-200",
    badge: "bg-pink-500/20 text-pink-700 border-pink-200",
    button: "bg-gradient-to-r from-pink-500 to-red-400",
  },
  default: {
    gradient: "from-blue-50 via-purple-50 to-blue-50",
    headerGradient: "from-blue-500 to-purple-500",
    border: "border-blue-200",
    cardBorder: "border-blue-200",
    badge: "bg-blue-500/20 text-blue-700 border-blue-200",
    button: "bg-gradient-to-r from-blue-500 to-purple-500",
  },
};

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

export function generatePDFHTML(options: GeneratePDFHTMLOptions): string {
  const { title, message, items, theme = "christmas" } = options;
  const config = THEME_CONFIG[theme];

  const currentDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isChristmasTime = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    return month === 12 || month === 1;
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        body {
          font-family: 'Inter', sans-serif;
          padding-top: 24px;
        }

        @page {
          margin: 0;
          size: A4;
        }

        /* Le header annule le padding du body pour être collé en haut page 1 */
        .header-section {
          margin-top: -24px;
        }

        .page-break {
          page-break-after: always;
        }

        .jersey-card {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .jersey-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media print {
          .jersey-card {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="page-container min-h-screen bg-gradient-to-br ${
        config.gradient
      }">
        <!-- Header -->
        <div class="header-section bg-white/80 backdrop-blur-sm border-b ${
          config.border
        }">
          <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br ${
                config.headerGradient
              } rounded-full flex items-center justify-center">
                <span class="text-white text-xl">🎁</span>
              </div>
              <div>
                <h1 class="font-bold text-gray-800">Le Vestiaire</h1>
                <p class="text-xs text-gray-600">Liste de souhaits</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full border border-gray-300 bg-white/50 text-sm">
                ${items.length} maillot${items.length > 1 ? "s" : ""}
              </span>
              ${isChristmasTime() ? '<span class="text-lg">🎄</span>' : ""}
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <!-- Title -->
          <div class="text-center space-y-2">
            <h1 class="text-2xl font-bold text-gray-800 leading-tight">
              ${title}
            </h1>

            ${
              message
                ? `
              <div class="max-w-2xl mx-auto">
                <p class="text-sm text-gray-600 leading-relaxed">${message}</p>
              </div>
            `
                : ""
            }

            <div class="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div class="flex items-center gap-1">
                <span>📅</span>
                <span>${currentDate}</span>
              </div>
              <div class="flex items-center gap-1">
                <span>👕</span>
                <span>${items.length} maillot${
    items.length > 1 ? "s" : ""
  }</span>
              </div>
            </div>
          </div>

          <!-- Jerseys Grid -->
          <div class="jersey-grid">
            ${items
              .map(
                (jersey) => `
              <div class="jersey-card bg-white/80 backdrop-blur-sm rounded-lg border ${
                config.cardBorder
              } overflow-hidden">
                <div class="p-4 space-y-3">
                  <!-- Image -->
                  <div class="relative w-full" style="height: 180px;">
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden w-full h-full flex items-center justify-center">
                      <img
                        src="${jersey.imageUrl}"
                        alt="${jersey.name}"
                        class="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>

                  <!-- Info -->
                  <div class="space-y-2">
                    <div>
                      <h3 class="font-bold text-base text-gray-800 line-clamp-2">
                        ${jersey.clubName}
                      </h3>
                      <p class="text-xs text-gray-600">${jersey.name}</p>
                    </div>

                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded text-xs font-medium ${
                        config.badge
                      } border">
                        ${getJerseyTypeLabel(jersey.type)}
                      </span>
                      <span class="px-2 py-0.5 rounded text-xs font-medium bg-white/50 text-gray-800 border border-gray-300">
                        ${jersey.season}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <!-- Footer -->
          <div class="text-center space-y-3 pt-6 mt-6 border-t ${
            config.border
          }">
            <div class="space-y-2">
              <p class="text-sm text-gray-600">Cette liste a été créée avec</p>
              <div class="inline-block px-4 py-2 rounded-lg ${
                config.button
              } text-white font-medium text-sm">
                <span class="flex items-center gap-2">
                   Le Vestiaire Foot ⚽
                </span>
              </div>
            </div>

            <div class="text-xs text-gray-500">
              <p>Créez votre propre collection de maillots et partagez vos envies avec vos proches ⚽</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
