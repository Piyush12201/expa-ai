import "./globals.css";
import { Manrope, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata = {
  title: "Expa AI | Business Idea Intelligence",
  description:
    "Turn raw business ideas into a high-quality launch dashboard with strategy, risk, and opportunity analysis.",
  icons: {
    icon: "/pravideon-logo.png",
    shortcut: "/pravideon-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${manrope.variable}`}>
        {children}
      </body>
    </html>
  );
}
