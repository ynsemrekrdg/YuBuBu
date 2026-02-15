import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageCircle, User, LogOut, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import Avatar from './Avatar';
import AIButton from '../ai/AIButton';

export default function Layout() {
  const { user, studentProfile, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: 'Ana Sayfa' },
    { to: '/ai-chat', icon: MessageCircle, label: 'AI Sohbet' },
    { to: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" aria-label="Ana sayfa">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="w-10 h-10 bg-yub-500 rounded-xl flex items-center justify-center shadow-md"
            >
              <BookOpen className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-gray-800 hidden sm:block">
              Yu<span className="text-yub-500">Bu</span>Bu
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Ana navigasyon">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-yub-100 text-yub-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <Avatar
                  name={user.name}
                  difficulty={studentProfile?.learning_difficulty}
                  size="sm"
                />
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Çıkış yap"
                  title="Çıkış yap"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg"
        aria-label="Mobil navigasyon"
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all
                  ${isActive ? 'text-yub-600' : 'text-gray-400'}
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating AI Button (student only) */}
      {user?.role === 'student' && location.pathname !== '/ai-chat' && (
        <AIButton />
      )}

      {/* Bottom spacing for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
