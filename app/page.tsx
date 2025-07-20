import AuthingGuard from "@/components/AuthingGuard";

export default function HomePage() {
  return (
    <main className="bg-amber-700 h-screen w-screen flex justify-center items-center">
      <AuthingGuard />
    </main>
  );
}
