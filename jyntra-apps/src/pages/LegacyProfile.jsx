import React from 'react';

const PROFILE_CONFIG = {
  alumno: {
    file: '/jyntra-alumno_v14.html',
    title: 'JYNTRA · Alumno',
  },

  profesor: {
    file: '/jyntra-profesor_v12.html',
    title: 'JYNTRA · Profesor',
  },

  nutricionista: {
    file: '/jyntra-nutricionista_v8.html',
    title: 'JYNTRA · Nutricionista',
  },
};

function LegacyProfile({ role }) {
  const config = PROFILE_CONFIG[role];

  if (!config) {
    return (
      <main className="legacy-error">
        <h1>Perfil no encontrado</h1>
        <p>{role}</p>
      </main>
    );
  }

  return (
    <div className="legacy-profile-page">
      <iframe
        title={config.title}
        src={config.file}
        className="legacy-profile-frame"
      />
    </div>
  );
}

export default LegacyProfile;