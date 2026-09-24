import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';

function AlumnoLayout() {
  const menuItems = [
    {
      to: '/alumno',
      label: 'Inicio',
      icon: '🏠',
      end: true,
    },
    {
      to: '/alumno/perfil',
      label: 'Mi perfil',
      icon: '👤',
    },
    {
      to: '/alumno/cursos',
      label: 'Mis cursos',
      icon: '📚',
    },
    {
      to: '/alumno/actividades',
      label: 'Actividades',
      icon: '📝',
    },
    {
      to: '/alumno/nutricion',
      label: 'Nutrición',
      icon: '🥗',
    },
    {
      to: '/alumno/progreso',
      label: 'Mi progreso',
      icon: '📈',
    },
  ];

  return (
    <div className="alumno-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>JintraApp</span>
          <small>Alumno</small>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="back-home">
            ← Volver al inicio
          </Link>
        </div>
      </aside>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AlumnoLayout;