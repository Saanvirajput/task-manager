'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        {/* Notion-style N logo */}
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl" style={{ fontFamily: 'Georgia, serif' }}>N</span>
        </div>
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
