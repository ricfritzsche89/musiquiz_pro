import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { getAccessToken } from './spotify';
import Login from './components/Login';
import HostView from './views/HostView';
import ControllerView from './views/ControllerView';

function App() {
  const [token, setToken] = useState(window.localStorage.getItem('access_token'));

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      getAccessToken(code).then(accessToken => {
        if (accessToken) {
          setToken(accessToken);
          // URL aufräumen
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          window.history.replaceState({}, document.title, url.pathname + url.hash);
        }
      });
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Haupt-Route: Spotify Login oder Host View */}
        <Route path="/" element={
          !token ? <Login /> : <HostView token={token} />
        } />

        {/* Controller Route: Für die Smartphones */}
        <Route path="/play" element={<ControllerView />} />

        {/* Fallback für alte Links */}
        <Route path="/controller" element={<ControllerView />} />
      </Routes>
    </Router>
  );
}

export default App;
