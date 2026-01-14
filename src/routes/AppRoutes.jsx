// frontend/routes/AppRoutes.jsx
import { Route, Routes } from 'react-router-dom';
import Login from '../pages/Login';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Otras rutas */}
    </Routes>
  );
};

export default AppRoutes;