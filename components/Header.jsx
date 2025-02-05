import React from 'react';
import Link from 'next/link';
import { Brain } from 'lucide-react';

const Header = () => (
  <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-gray-800 shadow-sm">
    <Link className="flex items-center justify-center" href="#">
      <Brain className="h-6 w-6 text-primary" />
      <span className="ml-2 text-lg font-bold">Instruct AI</span>
    </Link>
    <nav className="ml-auto flex gap-4 sm:gap-6">
      <Link className="text-sm font-medium hover:text-primary transition-colors" href="#">
        Dashboard
      </Link>
      <Link className="text-sm font-medium hover:text-primary transition-colors" href="#">
        Progress
      </Link>
      <Link className="text-sm font-medium hover:text-primary transition-colors" href="#">
        Settings
      </Link>
    </nav>
  </header>
);

export default Header;