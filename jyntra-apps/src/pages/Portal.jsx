import React from 'react';

const perfiles = [
  {
    rol: 'alumno',
    titulo: 'Alumno',
    descripcion: 'Entrena, registra y consulta tus resultados.',
    icono: '🎓',
    archivo: '/jyntra-alumno_v14.html',
  },
  {
    rol: 'profesor',
    titulo: 'Profesor',
    descripcion: 'Evalúa, planifica y haz seguimiento.',
    icono: '👨‍🏫',
    archivo: '/jyntra-profesor_v12.html',
  },
  {
    rol: 'nutricionista',
    titulo: 'Nutricionista',
    descripcion: 'Anamnesis, plan alimentario y control.',
    icono: '🥗',
    archivo: '/jyntra-nutricionista_v8.html',
  },
];

function Portal() {
  return (
    <main className="portal">
      <div className="portal-container">

        <header className="portal-header">
          <div className="portal-brand">
            JYNTRA <span>TECHNOLOGIES</span>
          </div>

          <div className="portal-eyebrow">
            Plataforma de entrenamiento y nutrición
          </div>

          <h1>
            Elige tu perfil
            <em>y entra a tu espacio</em>
          </h1>

          <p>
            Cada perfil abre su propia aplicación.
            Ingresa con tu cuenta para continuar.
          </p>
        </header>

        <section className="portal-grid">
          {perfiles.map((perfil) => (
            <a
              key={perfil.rol}
              href={perfil.archivo}
              className={`portal-card portal-${perfil.rol}`}
            >
              <div className="portal-icon">
                {perfil.icono}
              </div>

              <div className="portal-title">
                {perfil.titulo}
              </div>

              <div className="portal-description">
                {perfil.descripcion}
              </div>

              <div className="portal-action">
                Entrar o crear cuenta →
              </div>
            </a>
          ))}
        </section>

        <footer className="portal-footer">
          <a href="/jyntra-app_v10.html">
            Abrir portal original
          </a>

          <div>
            Al crear una cuenta se solicita el consentimiento correspondiente.
          </div>
        </footer>

      </div>
    </main>
  );
}

export default Portal;