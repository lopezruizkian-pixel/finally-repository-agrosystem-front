// Small helper utilities for modals used across pages

export function mostrarConfirmacionGlobal(titulo, mensaje){
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.classList.add('modal-overlay','active');
        overlay.innerHTML = `
            <div class="modal-container">
              <div class="modal-header-custom">
                <h2 class="modal-title-custom"><i class="fas fa-exclamation-triangle"></i> ${titulo}</h2>
                <button class="btn-close-custom" id="_closeGlobalConfirm"><i class="fas fa-times"></i></button>
              </div>
              <div class="modal-body-custom">
                <div class="modal-icon-warning"><i class="fas fa-exclamation-circle"></i></div>
                <p class="modal-message">${mensaje}</p>
              </div>
              <div class="modal-footer-custom">
                <button class="btn-modal-cancelar" id="_noGlobal">No</button>
                <button class="btn-modal-confirmar" id="_yesGlobal">Sí</button>
              </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        const cleanup = () => { overlay.remove(); document.body.style.overflow = 'auto'; };
        document.getElementById('_yesGlobal').addEventListener('click', () => { cleanup(); resolve(true); });
        document.getElementById('_noGlobal').addEventListener('click', () => { cleanup(); resolve(false); });
        document.getElementById('_closeGlobalConfirm').addEventListener('click', () => { cleanup(); resolve(false); });
        overlay.addEventListener('click', (e) => { if(e.target === overlay){ cleanup(); resolve(false); } });
        const esc = (e) => { if(e.key === 'Escape'){ cleanup(); resolve(false); document.removeEventListener('keydown', esc); } };
        document.addEventListener('keydown', esc);
    });
}
