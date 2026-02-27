import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}
