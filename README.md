Library for easy validate form data like request form validating in laravel.

For Vue.js

At data() your set form object with fields (properties), every field could be like this: 

structure of fields:
```javascript
  {
    __name__:{
      val: __def-value__, //then current value
      rules: 'require|in:1,2,3,4,5,6'
      or
      rules:{ //this functional is recursive :)
        __name_sub_obj_val__: 'require|in:1,2,3,4,5,6'
      },
      filters: 'trim|with_params:1,2,3,4,5,6'
      or
      filters:{ //this functional is recursive :)
        __name_sub_obj_val__: 'trim|with_params:1,2,3,4,5,6'
      },
      error: '' //reactive for error for input
    }
  }
```

Example:
```javascript
import {validate} from "promised-form-validate";

{....}
    
data(){
    // ...
    form: {
        field1: {
            val: '', // use this for v-model for form field
            rules: 'require|in:1,2,3,4,5,6',
            filters: 'trim',
            error: false, // use this for paste error massage where you want
            label: 'Field1', // you can set label or another field specific data below and use it at form filed in template
            // ... another properties
        }
    }
    // ...
},
methods: {
    // ...
    send(){
        validate(this.form).then(r => {
            // code for valid result
        });
    },
    // ...
}
```
All rules and filters you can see at code at file Validation.js

