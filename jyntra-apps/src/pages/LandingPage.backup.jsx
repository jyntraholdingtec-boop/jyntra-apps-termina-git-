import React from 'react';

function LandingPage() {
  return (
    <main className="landing-page">
      <section className="hero">
        <span className="hero-badge">JintraApp</span>

        <h1>Bienvenido a JintraApp</h1>

        <p>
          Accede a la plataforma para ingresar a tu perfil.
        </p>

        <a
          href="/jyntra-app_v10.html"
          className="profile-button"
        >
          Entrar a JintraApp →
        </a>
      </section>
    </main>
  );
}

export default LandingPage;