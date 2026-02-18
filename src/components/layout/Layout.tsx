import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

export default function Layout() {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Board', path: '/', icon: LayoutDashboard },
        { name: 'My Tickets', path: '/my-tickets', icon: Ticket },
    ];

    // Make Settings available for everyone so they can update their profile
    navItems.push({ name: 'Settings', path: '/settings', icon: Settings });

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-800">Ops Board</h1>
                    <p className="text-sm text-gray-500 mt-1">Store Operations</p>
                    {/* OPTIONAL: Show user name here if desired, or just rely on Settings page */}
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-black text-white'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                )
                            }
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Menu */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
                    <h1 className="text-lg font-bold text-gray-800">Ops Board</h1>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-gray-600 rounded-md hover:bg-gray-100"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </header>

                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 space-y-1 absolute top-16 left-0 right-0 z-50 shadow-lg">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                                        isActive
                                            ? 'bg-black text-white'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Sign Out
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div >
    );
}
