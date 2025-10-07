class LibreriaSession {
    constructor() {
        this.messages = [];
    }

    // Gestión de usuario
    setUser(usuario) {
        sessionStorage.setItem('usuario', JSON.stringify(usuario));
    }

    getUser() {
        const data = sessionStorage.getItem('usuario');
        return data ? JSON.parse(data) : null;
    }

    clearUser() {
        sessionStorage.removeItem('usuario');
    }

    getRole() {
        const user = this.getUser();
        return user ? user.rol : 'invitado';
    }

    // Sistema de mensajes
    pushInfo(msg) {
        this.messages.push({ type: 'info', text: msg, id: Date.now() });
        this.notifyMessages();
    }

    pushError(msg) {
        this.messages.push({ type: 'error', text: msg, id: Date.now() });
        this.notifyMessages();
    }

    pushSuccess(msg) {
        this.messages.push({ type: 'success', text: msg, id: Date.now() });
        this.notifyMessages();
    }

    consume() {
        const msgs = [...this.messages];
        this.messages = [];
        return msgs;
    }

    notifyMessages() {
        window.dispatchEvent(new CustomEvent('messages-updated'));
    }
}

export const session = new LibreriaSession();