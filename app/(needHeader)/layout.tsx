import { Header } from "@/components/Header";

export default function NeedHeaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen-dynamic flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
