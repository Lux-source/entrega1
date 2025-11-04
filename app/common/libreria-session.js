class LibreriaSession {
    constructor() {
        this.messages = [];
    }

    // Gestión de usuario
    setUser(usuario) {
        localStorage.setItem('usuario', JSON.stringify(usuario));
    }

    getUser() {
        const data = localStorage.getItem('usuario');
        return data ? JSON.parse(data) : null;
    }

    clearUser() {
        localStorage.removeItem('usuario');
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