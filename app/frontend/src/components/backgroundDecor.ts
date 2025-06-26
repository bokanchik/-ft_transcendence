class BackgroundDecor extends HTMLElement {
    readonly shadowRoot: ShadowRoot;

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        this.render();
    }

    private render(): void {
        const decorHTML = `
            <div id="background-decor-inner">
                <!-- Tout votre long code SVG va ici... -->
                <div class="rotate-parent -top-10 right-0 -translate-40 -rotate-120 origin-bottom -z-index-1000">
                    <svg width="450" height="500">
                        <!-- ... -->
                    </svg>
                </div>
                <!-- ... etc ... -->
            </div>
        `;

        const style = `
            <style>
                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    z-index: -1;
                    pointer-events: none;
                }

                /* Importez votre CSS principal ici. Le chemin doit être correct depuis la racine du site. */
                @import url('/css/style.css'); 
            </style>
        `;

        this.shadowRoot.innerHTML = `${style}${decorHTML}`;
    }
}

if (!customElements.get('background-decor')) {
    customElements.define('background-decor', BackgroundDecor);
}

export default BackgroundDecor;