import { store } from '../store/init.js';

class DriveOptionsText extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
    }

    

    
    connectedCallback() {
        this.render();
        this.subscribe();
        

    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    bindEvents(){
        this.querySelector('input').addEventListener('change', (event) => {
            
            store.dispatch({
                type: 'MODIFYROUTEDEFAULTS',
                payload : {
                    property: this.getAttribute('state-property'),
                    value: event.target.value
                }
            });
            console.log(store.state)
        });
    }

    render() {
        const state = store.getState();
        const currentValue = state.routedefaults[this.getAttribute('state-property')];
        this.innerHTML = `
        <div class='input-group input-group-sm mb-2'>
        <span class='input-group-text' style='width:40%'>${this.getAttribute('label-start')}</span>
        <input type='text' class='form-control' value="${currentValue}">
        <span class='input-group-text' style='width:50%'>${this.getAttribute('label-end')}</span>
        </div>
    `;
    this.bindEvents();
    }

    subscribe() {
        this.unsubscribe = store.subscribe(() => this.render());
    }
}

customElements.define('drive-options-text', DriveOptionsText);
