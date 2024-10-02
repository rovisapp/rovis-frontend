import { store } from '../store/init.js';

class TagBuilderList extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
        this.matchedelements = [];
        this.selectedtag ='';
        
    }
    


    connectedCallback() {
        this.render();
        this.subscribe();
        // 
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
    bindEvents(){
        this.querySelector('.btn-close').addEventListener('click', ()=>{this.remove()});

        
        this.querySelectorAll('.tagbuilderlistholderitembtn').forEach(button => {
            button.addEventListener('click', (event) => {
                console.log('tagbuilderlistholderitembtn clicked');
                this.dispatchEvent(new CustomEvent('EVT_TagBuilderList', {
                    bubbles: true,
                    detail: { selectedtag: event.target.getAttribute("data-idx") }
                }));
            });
        });
    }




    render() {
        if(this.matchedelements.length>0){
            let returnedtglistele = document.createElement("div");
            returnedtglistele.className='tagbuilderlistholderdiv';
            //returnedtglistele.style='border-color:var(--bs-primary)';
            let returnedtglisthtml = `
            <button type="button" class="btn-close tagbuilderlistclosebtn" style="margin-left:90%" aria-label="Close"></button> 
            <div class="list-group" style="max-height:300px;overflow-y:scroll;margin:0.25em">`;
            this.matchedelements.map((ele) => {
            returnedtglisthtml += ` <button type="button" class="list-group-item list-group-item-action tagbuilderlistholderitembtn" data-idx="${ele}">${ele}</button>`;
            });
            returnedtglisthtml += `</div>`;
            this.innerHTML = returnedtglisthtml; 
           
            this.bindEvents();
        }
        
  
    
    }

    subscribe() {
        this.unsubscribe = store.subscribe(() => this.render());
    }
}

customElements.define('tag-builder-list', TagBuilderList);
