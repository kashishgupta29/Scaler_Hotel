import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopBar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <TopBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<div className="p-6">Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
