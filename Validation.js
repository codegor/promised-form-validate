import _ from 'lodash';

const Validation = {
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
      return _.lt(val, param)
    },
    greater: (attrib, val, param, list) => {
      return _.gt(val, param)
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
    less: 'Please set less then current in %f_name%',
    greater: 'Please set greater then current in %f_name%',
    number: 'Please set a number in %f_name%',
    _: '',
  },

  mess_vars: ['name', 'label'],

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
  validate(fields) {
    let obj = this;
    return new Promise(function (resolve, reject) {
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

  checkRules(att, val, rules, fields) {
    let res = true;
    let err = '';
    if ('object' == typeof rules) {
      for (let rule in rules) {
        if (val.hasOwnProperty(rule)) {
          let {r, e} = this.checkRules(att, val[rule], rules[rule], fields);
          res = res == true ? r : res;
          if (false == r)
            err += ('' == err ? '' : '; ') + rule + ': ' + e;
        } else console.error('Validation: rules describe another object, this hasn\'t property for this rule');
      }
    } else if ('function' == typeof rules) {
      let {r, e} = rules(att, val, rules, fields); // expected return object = {r: res, e: err}
      res = !!r;
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
          let r = this.rules[rule[0]](att, val, rule[1], fields);
          res = res == true ? r : res;
          if (false == r)
            err += ('' == err ? '' : '; ') + this.rules_mess[rule[0]];
        } else console.error("Validation: I don't know about " + rule[0] + " rule...");
      }
    }
    _.each(this.mess_vars, v => {
      if('name' == v)
        err = err.replace(new RegExp('%f_'+v+'%', "g"), att);
      else if(fields[att].hasOwnProperty(v))
          err = err.replace(new RegExp('%f_'+v+'%', "g"), fields[att][v]);
    })
    return {r: res, e: err};
  },

  filter(att, val, filters, fields) {
    if ('object' == typeof filters) {
      for (let filter in filters) {
        if (val.hasOwnProperty(filter)) {
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

}

export default {
  ...Validation
}

export function validate(fields) {
  return Validation.validate(fields);
}
