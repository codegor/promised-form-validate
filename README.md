# promised-form-validate

Library for easy validate form data like request form validating in laravel.

For Vue.js

At data() your set form object with fields (properties), every field could be like this: 

# Structure of fields:

```
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

# Example:
```javascript
import {validate} from "promised-form-validate";

{....}
    
data(){
    // ...
    form: {
        field1: {
            val: '', // use this for v-model for form field
            rules: 'require|in:1,2,3,4,5,6', // or you can provide a function(attrib, val, param, list) which return {r: result [boolean], e: error [string]} or if val it is object, you can check all of properties of val if you replay structure of val object where value of params will be rules
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

If you want, you can replace your error massage or rules and you can set validate method globally for Vue.js with your error massages. 
For now your can set any variable in error massages. 
Default is '%f_name%' key in a message and '%f_label%'. Name gets from field name, like 'field1' from example, label from label field prop if exists. 
You can replace default variable for error massage, set array of key name, like ['name', 'label', ...].

```javascript
Vue.use({
  install($Vue){
    // replace
    validate.rules = {
      //your rules
      your_rule: (attrib, val, param, list) => {
        // actions
        return true || false;
      },
    };
    
    // or extend
    validate.rules = Object.assign(validate.rules, {
      //your rules
      your_rule: (attrib, val, param, list) => {
        // actions
        return true || false;
      },
    });
    
    // somethig like that and for rules_mess and mess_vars
    validate.rules_mess = {
      rule_name: 'rule_massages, may be with vars like %f_name% or else',
      // ...
    };
    /**
    * in form definition
    * form: {
    *    _name_: {
    *         val: '', // use this for v-model for form field
    *         rules: 'require|in:1,2,3,4,5,6',
    *         filters: 'trim',
    *         error: false, // use this for paste error massage where you want
    *         label: 'Field1', // you can set label or another field specific data below and use it at form filed in template
    *         // ... another properties
    *         var1: 'some data for replace',
    *         var2: 'some else data for replace'
    *     }
    * }
    * 
    */
    validate.mess_vars = ['var1', 'var2', 'name']; 
    
    $Vue.prototype.validate = validate;
  }
})

```