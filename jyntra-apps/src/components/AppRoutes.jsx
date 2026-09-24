import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import LandingPage from '../pages/LandingPage';
import Profesor from '../pages/Profesor';
import Nutricionista from '../pages/Nutricionista';

import AlumnoLayout from './AlumnoLayout';

import InicioAlumno from '../pages/alumno/InicioAlumno';
import PerfilAlumno from '../pages/alumno/PerfilAlumno';
import CursosAlumno from '../pages/alumno/CursosAlumno';
import ActividadesAlumno from '../pages/alumno/ActividadesAlumno';
import NutricionAlumno from '../pages/alumno/NutricionAlumno';
import ProgresoAlumno from '../pages/alumno/ProgresoAlumno';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LandingPage />} />

        <Route path="/alumno" element={<AlumnoLayout />}>
          <Route index element={<InicioAlumno />} />
          <Route path="perfil" element={<PerfilAlumno />} />
          <Route path="cursos" element={<CursosAlumno />} />
          <Route path="actividades" element={<ActividadesAlumno />} />
          <Route path="nutricion" element={<NutricionAlumno />} />
          <Route path="progreso" element={<ProgresoAlumno />} />
        </Route>

        <Route path="/profesor" element={<Profesor />} />

        <Route path="/nutricionista" element={<Nutricionista />} />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;