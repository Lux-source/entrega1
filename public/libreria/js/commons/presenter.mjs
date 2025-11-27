export class Presenter {
	constructor(model, name, mountSelector = "main") {
		this.model = model;
		this.name = name;
		this.mountSelector = mountSelector;
		this.container = null;
	}

	render(props = {}) {
		const container = document.querySelector(`#${this.mountSelector}`);
		if (!container) return;

		container.innerHTML = this.template(props);
		this.container = container;
		this.bind();
	}

	template(props) {
		return "<div>Override template method</div>";
	}

	bind() {
	}

	desmontar() {
		if (this.container) {
			this.container.innerHTML = "";
		}
	}
}
