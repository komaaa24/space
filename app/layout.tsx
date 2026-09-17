import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatspace — AI agent barcha kanallaringizda",
  description:
    "Instagram, Telegram va YouTube akkauntlaringizni ulang — AI chatbot mijozlaringizga 24/7 avtomatik javob beradi, leadlarni yig'adi va buyurtma rasmiylashtiradi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
