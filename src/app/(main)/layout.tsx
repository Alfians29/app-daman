import Sidebar from '@/components/Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex min-h-screen'>
      <Sidebar />
      <main className='flex-1 lg:ml-64 p-6 lg:p-8'>
        <div className='max-w-[1440px] mx-auto'>{children}</div>
      </main>
    </div>
  );
}
