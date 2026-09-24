import React from 'react';

function InicioAlumno() {
  return (
    <section>
      <h1>Bienvenido, Alumno 🎓</h1>

      <p>
        Este es tu espacio personal en JintraApp.
      </p>

      <div className="dashboard-summary">
        <div className="summary-card">
          <span>📚</span>
          <h2>Mis cursos</h2>
          <p>Consulta tus cursos disponibles.</p>
        </div>

        <div className="summary-card">
          <span>📝</span>
          <h2>Actividades</h2>
          <p>Revisa tus actividades pendientes.</p>
        </div>

        <div className="summary-card">
          <span>📈</span>
          <h2>Progreso</h2>
          <p>Consulta tu evolución.</p>
        </div>
      </div>
    </section>
  );
}

export default InicioAlumno;