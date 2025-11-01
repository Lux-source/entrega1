import { Presenter } from "../../commons/presenter.mjs";
import { session } from "../../commons/libreria-session.mjs";

const templateUrl = new URL("./messages.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar layout/messages.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="messages-container"><div class="message message-error">No se pudieron cargar los mensajes.</div></div>';
}

export class Messages extends Presenter {
	constructor() {
		super(null, "messages", "messages");
		this.onMessagesUpdated = this.onMessagesUpdated.bind(this);
		this.onClick = this.onClick.bind(this);
		this.autoClearTimeout = null;

		window.addEventListener("messages-updated", this.onMessagesUpdated);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		const hasMessages = this.renderMessages();

		if (hasMessages && this.messagesContainer) {
			this.messagesContainer.addEventListener("click", this.onClick);
		}
	}

	cacheDom() {
		this.containerEl = this.container;
		this.messagesContainer = this.container?.querySelector(
			'[data-element="messages-container"]'
		);
		this.templateEl = this.container?.querySelector(
			'template[data-element="message-template"]'
		);
	}

	renderMessages() {
		const messages = session.consume();

		if (!messages.length) {
			this.clearMessages();
			return false;
		}

		if (!this.messagesContainer) {
			return false;
		}

		this.messagesContainer
			.querySelectorAll('[data-element="message"]')
			.forEach((node) => node.remove());

		const templateNode = this.templateEl?.content?.firstElementChild;

		messages.forEach((message) => {
			const element = templateNode
				? templateNode.cloneNode(true)
				: this.createFallbackMessageElement();

			if (element) {
				element.dataset.id = message.id;
				element.classList.add(`message-${message.type}`);

				const textEl = element.querySelector('[data-element="message-text"]');
				if (textEl) {
					textEl.textContent = message.text;
				}

				const closeButton = element.querySelector(
					'[data-element="close-button"]'
				);
				if (closeButton) {
					closeButton.dataset.id = message.id;
				}

				this.messagesContainer.appendChild(element);
			}
		});

		if (this.autoClearTimeout) {
			clearTimeout(this.autoClearTimeout);
		}

		this.autoClearTimeout = window.setTimeout(() => {
			this.clearMessages();
		}, 5000);

		return true;
	}

	createFallbackMessageElement() {
		const element = document.createElement("div");
		element.className = "message";
		element.dataset.element = "message";

		const span = document.createElement("span");
		span.className = "message-text";
		span.dataset.element = "message-text";

		const button = document.createElement("button");
		button.type = "button";
		button.className = "message-close";
		button.dataset.element = "close-button";
		button.textContent = "×";

		element.appendChild(span);
		element.appendChild(button);

		return element;
	}

	onClick(event) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const closeButton = target.closest('[data-element="close-button"]');
		if (!closeButton) {
			return;
		}

		const messageEl = closeButton.closest('[data-element="message"]');
		if (messageEl) {
			messageEl.remove();
		}

		if (!this.messagesContainer?.querySelector('[data-element="message"]')) {
			this.clearMessages();
		}
	}

	onMessagesUpdated() {
		this.render();
	}

	clearMessages() {
		if (this.autoClearTimeout) {
			clearTimeout(this.autoClearTimeout);
			this.autoClearTimeout = null;
		}

		if (this.messagesContainer) {
			this.messagesContainer.removeEventListener("click", this.onClick);
		}

		if (this.containerEl) {
			this.containerEl.innerHTML = "";
		}

		this.messagesContainer = null;
		this.templateEl = null;
	}

	unmount() {
		window.removeEventListener("messages-updated", this.onMessagesUpdated);

		if (this.messagesContainer) {
			this.messagesContainer.removeEventListener("click", this.onClick);
		}

		this.clearMessages();
		super.unmount();
	}
}
