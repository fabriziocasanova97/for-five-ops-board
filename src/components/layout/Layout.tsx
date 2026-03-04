import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, Settings, LogOut, Menu, X, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

// Add proper types for the context
export type LayoutContextType = {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Layout() {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Need this to conditionally render fallback button
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Board', path: '/', icon: LayoutDashboard },
        { name: 'Gas Tanks', path: '/inventory', icon: ClipboardList },
        { name: 'My Tickets', path: '/my-tickets', icon: Ticket },
    ];

    // Link to Settings is handled in the footer now

    const isBoardPage = location.pathname === '/';

    // Force body to not scroll when on the board page (critical for mobile safari/chrome)
    useEffect(() => {
        if (isBoardPage) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed'; // Prevents iOS bounce
            document.body.style.width = '100%';
            document.body.style.height = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
        };
    }, [isBoardPage]);

    return (
        <div className="flex h-screen bg-[#fafafa]">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-black border-r border-gray-800">
                <div className="p-8 border-b border-gray-800">
                    <span className="block text-2xl font-bold font-[family-name:--font-for-five] tracking-tighter text-white">FOR FIVE</span>
                    {/* OPTIONAL: Show user name here if desired, or just rely on Settings page */}
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg',
                                    isActive
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-gray-400 hover:bg-gray-900 hover:text-white hover:translate-x-1'
                                )
                            }
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800 space-y-2">
                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                                isActive
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-400 hover:bg-gray-900 hover:text-white hover:translate-x-1'
                            )
                        }
                    >
                        <Settings className="w-5 h-5 mr-3" />
                        Settings
                    </NavLink>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-950/30 hover:text-rose-500 transition-colors rounded-md"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Menu */}
            <div className="flex flex-col flex-1 overflow-hidden relative">
                {/* Simplify Header - Title & Logo */}
                <header className="md:hidden flex items-center justify-between p-4 bg-black text-white border-b border-gray-800 shrink-0">
                    <span className="text-xl font-bold font-[family-name:--font-for-five] tracking-tighter">FOR FIVE</span>
                </header>

                {/* Mobile Navigation Dropdown - Slide up from bottom since trigger is at bottom */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-black border-t border-gray-800 px-4 py-2 space-y-1 fixed bottom-16 left-0 right-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-2 fade-in">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-md',
                                        isActive
                                            ? 'bg-white text-black'
                                            : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                                    )
                                }
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </NavLink>
                        ))}
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                handleSignOut();
                            }}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-gray-900 transition-colors rounded-md"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Sign Out
                        </button>
                    </div>
                )}

                {/* Mobile Menu Backdrop/Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Main Content Area */}
                <main className={clsx(
                    "flex-1 p-4 md:p-8 bg-[#fafafa]",
                    isBoardPage ? "overflow-hidden flex flex-col" : "overflow-auto"
                )}>
                    <Outlet context={{ isMobileMenuOpen, setIsMobileMenuOpen } satisfies LayoutContextType} />
                </main>

                {/* Fallback Mobile Menu Button (FAB) for non-board pages */}
                {!isBoardPage && (
                    <div className="md:hidden fixed bottom-4 left-4 z-50">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-3 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors border border-gray-800"
                            aria-label="Menu"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
}
