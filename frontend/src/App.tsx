import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/Home';
import { LocalityPage } from './pages/Locality';
import { PropertyPage } from './pages/Property';
import { ComparePage } from './pages/Compare';
import { MapPage } from './pages/Map';
import { AnalyticsPage } from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/locality/:id" element={<LocalityPage />} />
          <Route path="/locality/slug/:slug" element={<LocalityPage />} />
          <Route path="/property/:id" element={<PropertyPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
