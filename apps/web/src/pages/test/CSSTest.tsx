import React from 'react';
import '../../styles/test.css';

export function CSSTest() {
  return (
    <div className="test-container">
      <div className="test-card">
        <h1 className="test-title">Test CSS Direct</h1>
        <p className="test-subtitle">
          Si vous voyez des couleurs et des effets, le CSS se charge correctement !
        </p>
        
        <div className="test-grid">
          <button className="test-button">
            Bouton Bleu
          </button>
          <button className="test-button green">
            Bouton Vert
          </button>
          <button className="test-button red">
            Bouton Rouge
          </button>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <span className="test-status success">✅ CSS Chargé</span>
          <span className="test-status error">❌ Tailwind KO</span>
          <span className="test-status warning">⚠️ En test</span>
        </div>
        
        <div style={{ marginTop: '20px', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>Si vous voyez :</p>
          <ul style={{ textAlign: 'left', marginTop: '10px' }}>
            <li>• Un fond dégradé violet/bleu</li>
            <li>• Une carte blanche centrée</li>
            <li>• Des boutons colorés avec hover</li>
            <li>• Des badges colorés</li>
          </ul>
          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
            → Le CSS fonctionne, le problème est Tailwind !
          </p>
        </div>
      </div>
    </div>
  );
}
