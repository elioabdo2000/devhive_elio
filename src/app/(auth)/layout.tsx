export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-teal-soft/60 px-4 py-12">
      {children}
    </div>
  );
}
