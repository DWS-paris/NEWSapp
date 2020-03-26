class FormClass {
    constructor( formTag, inputsTag, ...checkFields ){
        // Set dynamic data
        this.formTag = formTag;
        this.inputsTag = inputsTag;
        this.checkFields = checkFields;

        // Set static data
        this.formObject = undefined;
        this.formErrorObject = undefined;
        this.formError = undefined;
    }

    resetFormObject(){
        this.formObject = {};
        this.formErrorObject = {};
        this.formError = 0;
    }

    checkFormFields(){
        return new Promise( (resolve, reject) => {
            // Reset form objects data
            this.resetFormObject();

            // Check input values
            for( let input of this.inputsTag ){
                // Check min length value
                if( input.value.length < input.getAttribute('minlength') ) { 
                    // Set form error object
                    this.formErrorObject[input.getAttribute('name')] = 'error';

                    // Add form error
                    this.formError += 1;
                };
                
                // Set form object
                this.formObject[input.getAttribute('name')] = input.value;
            }

            // Check form error
            if( this.formError === 0 ) { 
                // Check equality option
                if( this.checkFields.length !== 0 ){ 
                    
                    // Check equality
                    if( this.checkFields[0].value !== this.checkFields[1].value){
                        // Set form error object
                        this.formErrorObject[this.checkFields[0].getAttribute('name')] = 'error';
                        this.formErrorObject[this.checkFields[1].getAttribute('name')] = 'error';

                        // Reject Promise
                        return reject({ ok: false, data: this.formErrorObject });
                    }
                    else{ return resolve({ ok: true, data: this.formObject }) } // Resolve Promise
                }
                else{ return resolve({ ok: true, data: this.formObject }) } // Resolve Promise
            }
            else{ return reject({ ok: false, data: this.formErrorObject }) }; // Reject Promise
        })
        
    }

    reset(){

    }
}