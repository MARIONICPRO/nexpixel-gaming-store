// ============================================
// CONTACTO.JS - Envío de mensajes (GMAIL)
// ============================================

// ✅ Número de WhatsApp de NexPixel
const NEXPIXEL_WHATSAPP = '573208216442';

function toggleCampoContacto() {
    const via           = document.querySelector('input[name="respuesta-via"]:checked')?.value;
    const grupoEmail    = document.getElementById('grupo-email');
    const grupoWhatsapp = document.getElementById('grupo-whatsapp');
    const inputEmail    = document.getElementById('contacto-email');
    const inputWhatsapp = document.getElementById('contacto-whatsapp');

    if (via === 'whatsapp') {
        grupoEmail.style.display    = 'none';
        grupoWhatsapp.style.display = 'block';
        inputEmail.removeAttribute('required');
        inputWhatsapp.setAttribute('required', '');
    } else {
        grupoEmail.style.display    = 'block';
        grupoWhatsapp.style.display = 'none';
        inputEmail.setAttribute('required', '');
        inputWhatsapp.removeAttribute('required');
    }
}

function enviarMensaje() {
    const nombre       = document.getElementById('contacto-nombre').value.trim();
    const email        = document.getElementById('contacto-email').value.trim();
    const whatsapp     = document.getElementById('contacto-whatsapp').value.trim();
    const tipo         = document.getElementById('contacto-tipo').value;
    const mensaje      = document.getElementById('contacto-mensaje').value.trim();
    const respuestaVia = document.querySelector('input[name="respuesta-via"]:checked')?.value || 'email';
    const respuestaDiv = document.getElementById('form-mensaje');

    if (!nombre || !tipo || !mensaje) {
        mostrarNotificacion('Completa todos los campos obligatorios', 'error');
        return;
    }
    if (respuestaVia === 'email' && !email) {
        mostrarNotificacion('Ingresa tu correo electrónico', 'error');
        return;
    }
    if (respuestaVia === 'whatsapp' && !whatsapp) {
        mostrarNotificacion('Ingresa tu número de WhatsApp', 'error');
        return;
    }

    let url = '';

    if (respuestaVia === 'whatsapp') {
        // WhatsApp: abre la app/web con mensaje preescrito
        const texto = `Hola NexPixel! 👋\n\nNombre: ${nombre}\nWhatsApp: ${whatsapp}\nMotivo: ${tipo}\n\nMensaje:\n${mensaje}`;
        url = `https://wa.me/${NEXPIXEL_WHATSAPP}?text=${encodeURIComponent(texto)}`;
    } else {
        // 🔥 GMAIL en navegador (NO Outlook)
        const asunto = `Contacto NexPixel - ${tipo}`;
        const cuerpo = `Nombre: ${nombre}%0D%0AEmail: ${email}%0D%0AWhatsApp: ${whatsapp || 'No indicado'}%0D%0A%0D%0A${mensaje}`;
        url = `https://mail.google.com/mail/?view=cm&fs=1&to=dgvr007@gmail.com&su=${encodeURIComponent(asunto)}&body=${cuerpo}`;
    }

    // Abrir en nueva pestaña
    window.open(url, '_blank');

    // Resetear formulario
    document.getElementById('form-contacto').reset();
    document.getElementById('grupo-email').style.display    = 'block';
    document.getElementById('grupo-whatsapp').style.display = 'none';
    const radioEmail = document.querySelector('input[name="respuesta-via"][value="email"]');
    if (radioEmail) radioEmail.checked = true;

    // Mostrar confirmación
    const color = respuestaVia === 'whatsapp' ? '#25D366' : '#ea4335';  // Rojo Gmail
    const icono = respuestaVia === 'whatsapp' ? 'fa-brands fa-whatsapp' : 'fa-solid fa-envelope';
    const label = respuestaVia === 'whatsapp' ? 'Abrir WhatsApp' : 'Abrir Gmail';

    respuestaDiv.style.display      = 'block';
    respuestaDiv.style.background   = 'rgba(46, 204, 113, 0.15)';
    respuestaDiv.style.color        = '#2ecc71';
    respuestaDiv.style.padding      = '1.2rem';
    respuestaDiv.style.borderRadius = '10px';
    respuestaDiv.innerHTML = `
        <i class="fa-solid fa-circle-check"></i> ¡Listo! Si no se abrió, haz clic aquí:<br><br>
        <a href="${url}" target="_blank" rel="noopener noreferrer"
           style="display:inline-flex; align-items:center; gap:8px;
                  background:${color}; color:white; padding:12px 24px;
                  border-radius:8px; font-weight:bold; font-size:15px;
                  text-decoration:none;">
            <i class="${icono}"></i> ${label}
        </a>
    `;
}

window.toggleCampoContacto = toggleCampoContacto;
window.enviarMensaje       = enviarMensaje;