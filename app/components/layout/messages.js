import { Presenter } from '../../common/presenter.js';
import { session } from '../../common/libreria-session.js';

export class Messages extends Presenter {
    constructor() {
        super(null, 'messages', 'messages');
        window.addEventListener('messages-updated', () => this.render());
    }

    template() {
        const messages = session.consume();
        if (messages.length === 0) return '';

        return `
            <div class="messages-container">
                ${messages.map(msg => `
                    <div class="message message-${msg.type}" data-id="${msg.id}">
                        ${msg.text}
                        <button class="message-close" data-id="${msg.id}">×</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    bind() {
        const closeButtons = this.container.querySelectorAll('.message-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const msgEl = e.target.closest('.message');
                if (msgEl) msgEl.remove();
            });
        });

        // Auto-cerrar después de 5s
        setTimeout(() => {
            this.container.innerHTML = '';
        }, 5000);
    }
}