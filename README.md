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
//or if you want to use External lib for validation rules Validator (https://www.npmjs.com/package/Validator)
import {validateExt} from "promised-form-validate";

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
Your can set any variable in error massages. 
Default is '%f_name%' key in a message and '%f_label%'. Name gets from field name, like 'field1' from example, label from label field prop if exists. 
You can replace default variable for error massage, set array of key name, like ['name', 'label', ...].

```javascript
import Vue from 'vue';
import validation from "promised-form-validate";

Vue.use({
  install($Vue){
    // replace
    validation.rules = {
      //your rules
      your_rule: (attrib, val, param, list) => {
        // actions
        return true || false;
      },
    };
    
    // or extend
    validation.rules = Object.assign(validate.rules, {
      //your rules
      your_rule: (attrib, val, param, list) => {
        // actions
        return true || false;
      },
    });
    
    // somethig like that and for rules_mess and mess_vars
    validation.rules_mess = {
      rule_name: 'rule_massages, may be with vars like %f_name% or else',
      // ...
    };
    // or extend
    validation.rules_mess = Object.assign(validate.rules_mess, {
      rule_name: 'rule_massages, may be with vars like %f_name% or else',
      // ...
    });
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
    validation.mess_vars = ['var1', 'var2', 'name']; 
    
    $Vue.prototype.$validate = (fields, options) => validation.validate(fields, options);
  }
})

```

For now you can use external library [Validator](https://www.npmjs.com/package/Validator) for rules and massages set.
if you want to set your massages for this lib you can do this:

```javascript
import Vue from 'vue';
import validation from "promised-form-validate";

Vue.use({
  install($Vue){
    // replace
    validation.customRules = {
      //your rules
      your_rule: (name,value,params) => {
        // actions
        return true || false;
      },
      // or
      your_rule_with_mess: {
        handle(name,value,params) => {
          // actions
          return true || false;
        },
        message: 'there is error message'
      }
    };
    
    // somethig like that and for rules_mess. mess_vars doesn't work.
    validation.messages = {
      // custom message for based rules
      required: 'You forgot the :attr field',
      email: ':attr is not valid',
      // custom message for specific rule of attribute
      'receiver.email': 'The receiver email address is not valid'
    };
    
    // you can set custom Names for attribute
    validation.customNames = { 
      email: 'Email Address' 
    };
    
    /**
    * in form definition
    * form: {
    *    _name_: {
    *         val: '', // use this for v-model for form field
    *         rules: 'required|in:1,2,3,4,5,6',
    *         filters: 'trim',
    *         error: false, // use this for paste error massage where you want
    *     }
    *    _name2_: {
    *         val: [
    *           {
    *             f1: '',
    *             f2: '',
    *             ...
    *           },
    *           ...
    *         ], // use this for v-model for form field
    *         rules: {
    *           '*':{
    *             f1:'required|in:1,2,3,4,5,6',
    *             f2:'required_if:_name2_.*.f1,2|in:1,2,3,4,5,6|',
    *             f3:'required_if:f1,1|in:1,2,3,4,5,6|',
    *           }
    *         }'require|in:1,2,3,4,5,6',
    *         filters: {
    *           *: {
    *             f1: 'trim',
    *             f2: 'trim'
    *           }
    *         },
    *         error: [
    *           {
    *             f1: false,
    *             f2: false
    *           }, 
    *           ...
    *         ], // use this for paste error massage where you want
    *     }
    * }
    * 
    */
    
    $Vue.prototype.$validate = (fields, options) => validation.validate(fields, Object.assign({lib:'ext'}, ('object' == typeof options ? options : {})));
  }
})

```