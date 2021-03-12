(function () {

  // config
  var DEBUG = true;
  var MAP = [
    {
      raw: 'Date',
      key: 'date',
      clean: function (value) {
        return new Date(value);
      },
      format: function (value) {
        return value;
      }
    },
    {
      raw: 'Transaction Description',
      key: 'transactionDescription',
      clean: function (value) {
        return value;
      },
      format: function (value) {
        return value;
      }
    },
    {
      raw: 'Amount',
      key: 'amount',
      clean: function (value) {
        if (value === undefined) {
          return 0.00;
        }

        var num = value;

        if (typeof num === 'string') {
          num = parseFloat(value.replace('$',''));
        }

        return num;
      },
      format: function (value) {
        value = Math.round((value + 0.00001) * 100) / 100;
        value = value.toFixed(2);
        return (value < 0) ? '-$' + value.toString().slice(1,value.length) : '$'+value;
      }
    },
    {
      raw: 'Category',
      key: 'category',
      clean: function (value) {
        return value;
      },
      format: function (value) {
        return value;
      }
    }
  ];

  // internal variables
  var DATA = [];
  var CATEGORIES = [];

  // internal methods
  function init () {
    $('#parse').on('click', parse);
    $('#clear').on('click', clear);

    var $fileInput = $('#file-input');

    $fileInput.on('change', onFileChange);

    if ($fileInput.val()) {
      $('#parse, #clear').removeAttr('disabled');
    }
  }

  function parse () {
    var $fileInput = $('input[type=file]');

    if ($fileInput.val()) {
      $fileInput.parse({
        config: {
          header: true,
          complete: onParseComplete,
          skipEmptyLines: true
        },
        error: onParseError
      });
    }
    else alert('No file selected.');
  }

  function onParseError (err, file, inputElem, reason) {
    alert('There was an error parsing: ' + reason);
  }

  function clear () {
    var $fileInput = $('input[type=file]');

    if ($fileInput && $fileInput[0].value) {
      $fileInput[0].value = '';
    }

    $('#parse, #clear').prop('disabled', true);

    /*var $categories = $('#categories');

    if ($categories.length) {
      $categories.empty();
    }*/
  }

  function withdrawalsOnly () {
    return $('#withdrawals-only').is(':checked');
  }

  function onParseComplete (results) {
    if (DEBUG) console.log(results);

    cleanData(results.data);
  }

  function onFileChange () {
    if ($(this).val()) {
      $('#parse, #clear').removeAttr('disabled');
    }
  }

  function cleanData (resultData) {
    resultData.forEach(function (row) {

      if (DEBUG) console.log(row);

      var o = {};
      MAP.forEach(function (map) {
        o[map.key] = map.clean(row[map.raw]);
      });
      DATA.push(o);

    });

    // filter out withdrawals
    if (withdrawalsOnly()) {
      DATA = DATA.filter(d => d.transactionDescription.toLowerCase().indexOf('withdrawal') > -1);
    }

    // get categories
    DATA.forEach(function (row) {
      var category = row.category;

      if (CATEGORIES.indexOf(category) === -1) {
        if (category !== undefined) {
          CATEGORIES.push(category);
        } else console.log('Undefined category. Row data: ', row);
      }
    });

    CATEGORIES.sort();

    // set vue data
    app.data = DATA;
    app.categories = CATEGORIES;

    if (DEBUG) {
      console.log("DATA", DATA);
      console.log("CATEGORIES", CATEGORIES);
    }
  }

  $(document).ready(init);

  // vue
  var app = new Vue({
    el: '#vue-app',
    data: {
      data: null,
      categories: null,
      message: 'Hello Vue!'
    },
    methods: {
      categoryFilter: function (category) {
        return this.data.filter(function (row) {
          return row.category === category;
        });
      }
    }
  });

  /*Vue.component('category-table', {
    data: function () {
      return {
        category: null,
      }
    },
    template: '<h3>{{ category }}</h3>';
  });*/

  if (DEBUG) console.log(app);

})();
