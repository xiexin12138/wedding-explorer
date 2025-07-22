import { Header } from "@/components/Header";

export default function NeedHeaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen-dynamic flex flex-col">
      <Header />
      <main className="flex-1 flex justify-center items-center p-4">
        {children}
      </main>
    </div>
  );
}
