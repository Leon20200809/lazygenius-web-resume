import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Leon.C Web Resume", template: "%s | Leon.C Web Resume" },
  description: "Leon.Cに任せられる仕事、公開環境まで届ける実装力、業務上のメリット、GitHubで確認できる実績をまとめたWebレジュメです。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">
        <a href="#main-content" className="skip-link">
          本文へ移動
        </a>
        {children}
      </body>
    </html>
  );
}
