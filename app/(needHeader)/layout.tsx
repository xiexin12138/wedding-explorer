import { Header } from "@/components/Header";

export default function NeedHeaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen-dynamic flex flex-col">
      <Header />
      <main>
        {children}
      </main>
    </div>
  );
}
