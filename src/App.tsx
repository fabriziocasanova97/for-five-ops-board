import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Board from './pages/Board';

import Settings from './pages/Settings';

import StoreInventory from './pages/StoreInventory';

// Placeholders
const MyTickets = () => <div className="p-4">My Tickets Logic Here</div>;

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Board />} />
          <Route path="/inventory" element={<StoreInventory />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
