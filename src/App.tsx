import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import TeamAppLayout from './TeamAppLayout';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-center" expand={true} richColors />
      <TeamAppLayout />
    </Router>
  );
};

export default App;
