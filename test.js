var arr = 'some thing good'.split(' ');
var obj = {
  some: {
    thing: {
      good: 'day'
    }
  }
};

var value = getValue(arr, obj);
console.log(value);

function getValue(arr, obj) {
  var result = obj;
  var successful = arr.every(function(field, index, array){
    console.log('run:', index, 'field:', field);
    if (result[field]) {
      result = result[field];
      return true;
    }
    else {
      return false;
    }
  });
  if (successful) {
    return result;
  }
};
