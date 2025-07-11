import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import OSINTDashboard from './components/OSINTDashboard';
import TaskManager from './components/TaskManager';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<OSINTDashboard />} />
          <Route path="/tasks" element={<TaskManager />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
