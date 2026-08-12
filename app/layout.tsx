import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./talumi/talumi.css";
import "./sudoku/sudoku.css";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Talumi – Gaming a Chill zóna",
  description: "Matematické hry a oddychové aktivity pre deti v Talumi.",
  icons: { icon: "/talumi-mark.png" },
  other: { "codex-preview": "development" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sk"><body className={bricolageGrotesque.variable}>{children}</body></html>;
}
