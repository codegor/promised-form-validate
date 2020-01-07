import _ from 'lodash';
import Validator from 'Validator';
import messages from "Validator/src/messages";
import dot from "dot-object";

messages.empty_url = messages.url;

class ValidatorExt extends Validator{
  setData(data) {
    this.data = dot.dot(data);
  }
  getValue(name) {
    if(_.includes(name, '*')){
      let matches = ('string' == typeof this.name) ? this.name.matchAll(/\[([0-9]+)\]/g) : [];
      let params = [];
      for(let i of matches)
        params.push(i[0]);

      for(let i of params)
        name = name.replace(/(\.\*)/, i);

      if ('undefined' !== typeof this.data[name])
        return this.data[name];

    } else if(_.includes(this.name, '.')){
      let p = this.name.split('.');
      p.pop();
      p = p.join('.')+'.'+name;
      if ('undefined' !== typeof this.data[p])
        return this.data[p];
    }

    if ('undefined' === typeof this.data[name])
      return '';

    return this.data[name];
  }
  getMessage(name, rule) {
    // 1) return custom message if defined
    let msg = this.getCustomMessage(name, rule);
    if (typeof msg === 'undefined') {
      let key = this.snakeCase(rule.name);

      // 2) then, use the default message for that rule, and re-test
      msg = messages[key];
    }

    // 3) check if the message has subtype
    if (typeof msg === 'object') {
      let subtype = this.getDataType(name);
      msg = messages[key][subtype];
    }

    return typeof msg === 'undefined' ? '' : msg;
  }
  validate(name, value, rule) {
    let v = this.getValue(name); // for test for now
    let method = this.findRuleMethod(rule);

    // return method.apply(this, [name, value, rule.params])
    return method.apply(this, [name, value, rule.params]);
  }
  checkRules(name, value, rules, fields){
    let res = true;
    let err = '';
    value = ('undefined' === typeof value) ? '' : value;

    let ruls = this.parseItemRules(rules);

    this.rules = ruls; // for err mes get type
    this.name = name; // for get param value from conditions rule

    ruls.filter(rule => rule.name !== 'Nullable').forEach((rule) => { // [{name:CamelCaseName, params:[]},...]
      let r = this.validate(name, value, rule);
      res = res == true ? r : res;
      if (false == r)
        err += ('' == err ? '' : '; ') + this.getErrorMsg(name,rule);
    });

    return {r: res, e: err};
  }

  validateEmptyUrl(name, value) {
    if (typeof value === 'string') {
      if(value.trim() !== '')
        return this.validateUrl(name, value);
      else
        return true;
    }

    return false;
  }
}

const help = {
  typeAction(fn){
    return {
      undefined(val, param){
        return fn(0, param);
      },
      number(val, param){
        return fn(val, param);
      },
      string(val, param) {
        return fn(val.length, param);
      },
      object(val, param){
        if(null === val)
          return fn(val, param);
        else if(val.hasOwnProperty('length'))
          return fn(val.length, param);
        else
          return fn(Object.getOwnPropertyNames(val).length, param);
      }
    };
  }
}

const Validation = {
  errorFormat: 'simple', // simple | text | object
  lib: 'own', // own | ext
  validator: {},
  messages: {}, // here you can set your massages for ext lib see https://www.npmjs.com/package/Validator
  customNames: {}, // here you can set customNames for ext lib see https://www.npmjs.com/package/Validator
  customRules: {}, // here you can set array of customRules in format name:{handle(name,value,params){}, message: ''} for ext lib see https://www.npmjs.com/package/Validator

  rules: {
    require: (attrib, val, param, list) => {
      if (('number' == typeof val && isNaN(val)) || null === val || 'undefined' == typeof val || 0 === val.length || ('object' == typeof val && 0 == Object.getOwnPropertyNames(val).length)) return false; else return true;
    },
    email: (attrib, val, param, list) => {
      let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(val);
    },
    phone: (attrib, val, param, list) => {
      let re = /^[+]{0,1}[0-9]{1,3}[\s\-]{0,1}[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]{7,14}[\s\#]{0,2}[/0-9]{0,4}$/g;
      return re.test(val);
    },
    in: (attrib, val, param, list) => {
      return -1 != _.indexOf(param.split(','), val)
    },
    in_u: (attrib, val, param, list) => {
      return -1 != _.indexOf(param.split(','), _.toLower(val))
    },
    not_in: (attrib, val, param, list) => {
      return -1 == _.indexOf(param.split(','), val)
    },
    alpha_dash_space: (attrib, val, param, list) => {
      return (/^[0-9A-Z_-\s]*$/i).test(val)
    },
    less: (attrib, val, param, list) => {
      let a = help.typeAction(_.lt);
      return a[typeof val](val, param);
    },
    greater: (attrib, val, param, list) => {
      let a = help.typeAction(_.gt);
      return a[typeof val](val, param);
    },
    number: (attrib, val, param, list) => {
      return (/^[0-9]*$/i).test(val)
    },
    _: (attrib, val, param, list) => {
    },
  },

  rules_mess: {
    require: 'The %f_name% field is required',
    email: 'Please fill in %f_name% valid email address',
    phone: 'Please fill in %f_name% valid phone number',
    in: 'Sorry, you can not use this value in %f_name%',
    in_u: 'Sorry, you can not use this value in %f_name%',
    not_in: 'Sorry, you can not use this value in %f_name%',
    alpha_dash_space: 'Please, choose proper symbols for %f_name%',
    less: 'Please set less then %f_param% in %f_name%',
    greater: 'Please set greater then %f_param% in %f_name%',
    number: 'Please set a number in %f_name%',
    _: '',
  },

  mess_vars: ['name', 'label', 'param'],

  filters: {
    trim: (attrib, val, param, list) => {
      return val.trim();
    },
    _: (attrib, val, param, list) => {
    },
  },

  /*
  structure of fields:
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
   */
  validate(fields, options) {
    let obj = this;
    if(options && 'object' == typeof options && options.hasOwnProperty('errorFormat') && _.includes(['simple', 'text', 'object'], options.errorFormat))
      this.errorFormat = options.errorFormat;
    if(options && 'object' == typeof options && options.hasOwnProperty('lib') && _.includes(['own', 'ext'], options.lib))
      this.lib = options.lib;

    if('ext' == this.lib){
      this.validator = new ValidatorExt(this.gerChackedFields(fields), {}, this.messages, this.customNames);
      if(0 != Object.getOwnPropertyNames(this.customRules).length)
        for(let i in this.customRules)
          this.validator.extend(i,
            ('function' == typeof this.customRules[i] ? this.customRules[i] : (
              'object' == typeof this.customRules[i] && this.customRules[i].hasOwnProperty('handle') ?
                this.customRules[i].handle : () => {console.log('RULE ERROR, should be or function of object {handle(){}, message}', i, this.customRules[i])}
            )),
            ('object' == typeof this.customRules[i] && this.customRules[i].hasOwnProperty('message')) ?
              this.customRules[i].message : ''
          );
    }

    return new Promise((resolve, reject) => {
      let res = true;
      if ('object' == typeof fields) {
        for (let att in fields) {
          if (fields[att].hasOwnProperty('error'))
            fields[att].error = false;

          if ('object' == typeof fields[att] && fields[att].hasOwnProperty('rules') && fields[att].hasOwnProperty('val')) {
            let {r, e} = obj.checkRules(att, fields[att].val, fields[att].rules, fields);
            res = res == true ? r : res;
            if (false == r)
              fields[att].error = e;
          }
        }
      } else console.error("Validation: input fields should be an object type...");
      if (res)
        resolve(obj.gerChackedFields(fields));
      else
        reject(fields);
    });
  },

  objCheckRules(res, err, att, val, rules, fields, objErr) {
    let {r, e} = this.checkRules(att, val, rules, fields, objErr);
    res = res == true ? r : res;
    if (false == r){
      if('object' == this.errorFormat || objErr) {
        if('object' != typeof err)
          err = {};
        err[rule] = e;
      } else{
        let mes = ('simple' == this.errorFormat) ? e : rule + ': ' + e;
        err += ('' == err ? '' : ' & ') + mes;
      }
    }
    return {r: res, e: err};
  },
  simpleCheckRules(res, err, att, val, rules, fields){
    if('ext' == this.lib){
      let {r, e} = this.validator.checkRules(att, val, rules, fields);
      res = res == true ? r : res;
      if (false == r)
        err += ('' == err ? '' : '; ') + e;
    } else {
      let ruls = rules.split('|');
      for (let i in ruls) {
        let rule = ruls[i].split(':');
        if ('' == rule[0]) {
          console.warn('Validation: you have empty validation rules.');
          break;
        }
        if (this.rules.hasOwnProperty(rule[0])) {
          let r = this.rules[rule[0]](att, val, rule[1], fields, path);
          res = res == true ? r : res;
          if (false == r)
            err += ('' == err ? '' : '; ') + this.rules_mess[rule[0]].replace(new RegExp('%f_param%', "g"), rule[1]);
        } else console.error("Validation: I don't know about " + rule[0] + " rule...");
      }
    }

    return {r: res, e: err};
  },

  checkRules(att, val, rules, fields, objErr) {
    let res = true;
    let err = '';
    if ('object' == typeof rules) {
      for (let rule in rules) {
        if('*' == rule && Array.isArray(val)){
          if('object' != typeof err)
            err = {};
          for(let i in val){
            let {r, e} = this.objCheckRules(res, false, att+'['+i+']', val[i], rules[rule], fields, true);
            res = r;
            err[i] = e;
          }
        } else if (val.hasOwnProperty(rule)) {
          let {r, e} = this.objCheckRules(res, err, att+'.'+rule, val[rule], rules[rule], fields, objErr);
          res = r;
          err = e;
        } else console.error('Validation: rules describe another object, this hasn\'t property for this rule');
      }
    } else if ('function' == typeof rules) {
      let {r, e} = rules(att, val, rules, fields); // expected return object = {r: res, e: err}
      res = !!r;
      if (false == r)
        err += ('' == err ? '' : '; ') + e;
    } else {
      let {r, e} = this.simpleCheckRules(res, err, att, val, rules, fields);
      res = r;
      err = e;
    }

    let shoultUncompres = false
    if('object' == typeof err) {
      err = JSON.stringify(err);
      shoultUncompres = true;
    }

    let attFirst = att.split('.');
    attFirst = attFirst[0];
    attFirst = attFirst.replace(/\[[0-9]+\]/, '');
    _.each(this.mess_vars, v => {
      if('name' == v)
        err = err.replace(new RegExp('%f_'+v+'%', "g"), att);
      else if(fields[attFirst].hasOwnProperty(v))
          err = err.replace(new RegExp('%f_'+v+'%', "g"), fields[attFirst][v]);
    });

    if(shoultUncompres)
      err = JSON.parse(err);

    return {r: res, e: err};
  },

  filter(att, val, filters, fields) {
    if ('object' == typeof filters) {
      for (let filter in filters) {
        if('*' == filter && Array.isArray(val)){
          for(let i in val){
            val[i] = this.filter(att, val[i], filters[filter], fields);
          }
        } else if (val.hasOwnProperty(filter)) {
          val[filter] = this.filter(att, val[filter], filters[filter], fields);
        } else console.error('Validation: filter describe another object, this hasn\'t property for this filter');
      }
    } else {
      let filtrs = filters.split('|');
      for (let i in filtrs) {
        let filter = filtrs[i].split(':');
        if (this.filters.hasOwnProperty(filter[0])) {
          val = this.filters[filter[0]](att, val, filter[1], fields);
        } else console.error("Validation: I don't know about " + filter[0] + " filter...");
      }
    }
    return val;
  },

  gerChackedFields(fields) {
    if ('object' != typeof fields) {
      console.error("Validation: input fields should be an object type...");
      return fields;
    }

    let res = {};
    for (let att in fields) {
      if ('object' == typeof fields[att] && fields[att].hasOwnProperty('filters') && fields[att].hasOwnProperty('val'))
        fields[att].val = this.filter(att, fields[att].val, fields[att].filters, fields);

      if ('object' == typeof fields[att] && fields[att].hasOwnProperty('val'))
        res[att] = fields[att].val;
      else
        res[att] = fields[att];
    }
    return res;
  }

};

export default {
  ...Validation
}

export function validate(fields, options) {
  return Validation.validate(fields, options);
}

export function validateExt(fields, options) {
  return Validation.validate(fields, Object.assign({lib:'ext'}, ('object' == typeof options ? options : {})));
}

