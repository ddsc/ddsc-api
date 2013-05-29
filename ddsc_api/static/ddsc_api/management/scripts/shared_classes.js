//
// class: FilterPaginatedDataSource
// Base class with communication to rest api, including pagination and filter support
isc.ClassFactory.defineClass("UncachedResultSet", isc.ResultSet);

isc.UncachedResultSet.addProperties({
  useClientSorting: false
});



function userWarning(title, message, addContactInfo) {

  if (addContactInfo) {
     message = message + '<br>Probeer het (later) nog eens. ' +
        'Controleer of u nog bent ingelogd door de pagina te herladen. ' +
        'Blijft het probleem optreden, neem dan contact op met de helpdesk.'
  }

  isc.Dialog.create({
    autoDraw: true,
    title: title,
    message : message,
    icon:"[SKIN]warn.png",
    buttons : [
      isc.Button.create({ title:"OK" })
    ],
    buttonClick : function (button, index) {
      this.hide();
    }
  });
}

  //
// class: FilterPaginatedDataSource
// Base class with communication to rest api, including pagination and filter support
isc.ClassFactory.defineClass("FilterPaginatedDataSource", isc.RestDataSource);

isc.FilterPaginatedDataSource.addProperties({
  dataFormat: 'custom',
  useClientSorting:false,
  /*requestProperties: {
    params: {}
  },*/
  resultSetClass: isc.UncachedResultSet,
  transformRequest: function(dsRequest) {
    if (typeof(dsRequest.httpHeaders)!='object') {
      dsRequest.httpHeaders = {};
    }

    dsRequest.httpHeaders["Accept"] = "application/json";

    if (typeof(dsRequest.params)!='object') {
      dsRequest.params = {};
    }

    if (typeof(dsRequest.startRow)=='number' && typeof(dsRequest.dataPageSize)=='number') {
      dsRequest.params.page = Math.floor(dsRequest.startRow / dsRequest.dataPageSize) + 1; //first result is page 1
      dsRequest.params.page_size = dsRequest.dataPageSize;
    }

    if (dsRequest.data) {
      var filter = {}
      for (key in dsRequest.data ) {
        if (key === 'id') {
          filter[key] = dsRequest.data[key];
        } else if (typeof(dsRequest.startRow)!='number') {
          //request for specific value - used for 'start' value in forms
          filter[key] = dsRequest.data[key];
          dsRequest.params.page = 1;
        } else {
          filter[key + '__icontains'] = dsRequest.data[key];
        }
      }
      dsRequest.params.filter = filter;
      console.log('request');
      console.log(dsRequest.params);
    }
    if (dsRequest.sortBy && dsRequest.sortBy.length>0) {
      dsRequest.params.order = dsRequest.sortBy
    }

  },
  allowAdvancedCriteria: true,
  transformResponse: function(dsResponse) {
    //debugger;
    if (dsResponse.httpResponseCode == 200) {
      var json_data = isc.JSON.decode(dsResponse.data);
      dsResponse.totalRows = json_data.count;
      dsResponse.data = json_data.results;
      if (dsResponse.context.params.page_size) {
        dsResponse.startRow = (dsResponse.context.params.page - 1) * dsResponse.context.params.page_size;
        dsResponse.endRow = dsResponse.startRow + dsResponse.context.params.page_size;
        console.log('got row ' + dsResponse.startRow + ' till ' + dsResponse.endRow);
      }
    } else {
      console.log('error in fetch');
      console.log(dsResponse);
      dsResponse.totalRows = null;
      dsResponse.startRow = 0;
      dsResponse.endRow = 0;
      dsResponse.data = [];
      dsResponse.status = -101;
    }
  },
  handleError: function(dsRequest, dsResponse) {
    userWarning('Error', 'Fout in ophalen van gegevens.', true);
  }
});


//
// class: DefaultSelectItem
// default settings for SelectItem in management pages
isc.ClassFactory.defineClass("DefaultSelectItem", isc.SelectItem);

isc.DefaultSelectItem.addProperties({
  pickListWidth:400,
  pickListProperties: {
    showFilterEditor:true,
    dataPageSize: 20,
    filterEditorSubmit: function (criteria) {
      this.scrollToRow(0);
    }
  },
  autoFetchData: false,
  valueField: 'id',
  displayField: 'name'
});

//
// class: DefaultGridList
// default settings for SelectItem in management pages
isc.ClassFactory.defineClass("DefaultListGrid", isc.ListGrid);

isc.DefaultListGrid.addProperties({
  alternateRecordStyles:true,
  autoFetchData: true,
  showFilterEditor: true,
  filterEditorSubmit: function (criteria) {
    this.scrollToRow(0);
  },
  //canReorderFields: true,
  dataPageSize: 30,
  drawAheadRatio: 2
});


function replace_null(data) {
  if (typeof(data) == 'object') {
    for (field in data) {
      if (data[field] == null) {
        data[field] = '';
      }
    }
  }
  return data;
}

//save function


function saveObject(form, data, post_url, options) {

  //todo: clientside form validation

  var default_options = {
    saveAsNew: true,
    idField: 'id',
    setFormData: function(data) {
      form.setData(data);
      form.setErrors([]);
    },
    reloadList: null,
    extraValidationMessage: null,
    postSave: null
  }
  options = isc.addProperties(default_options, options)

  if (options.saveAsNew || !data[options.idField]) {
    delete data[options.idField];
    delete data.url;
    var method = 'POST';
    var url = post_url;
  } else {
    var method = 'PUT';
    var url = data.url;
    data = replace_null(data);
  }

  form.setErrors([]);

  RPCManager.sendRequest({
    actionURL: url,
    httpMethod: method,
    data: data,
    params: data,
    httpHeaders: {
      'X-CSRFToken': document.cookie.split('=')[1],
      'Accept-Language': 'nl',
      "Accept" : "application/json"
    },
    callback: function(rpcResponse, data, rpcRequest) {
      if (rpcResponse.httpResponseCode == 200 || rpcResponse.httpResponseCode == 201) {
        console.log('Opslaan gelukt');
       var data = isc.JSON.decode(data);
        options.setFormData(data);
        if (options.reloadList) {
          options.reloadList.invalidateCache(); //force new fetch with timestamp
        }
        if (rpcResponse.httpResponseCode == 201) {
          //in case of create, the list serializer is used for the return. do extra fetch to get details
          RPCManager.sendRequest({
            actionURL: data.url,
            httpMethod: 'GET',
            httpHeaders: {
              "Accept" : "application/json"
            },
            callback: function(rpcResponse, data, rpcRequest) {
              var data = isc.JSON.decode(data);
              options.setFormData(data);
            }
          });
        }
      } else if (rpcResponse.httpResponseCode == 400) {
        //show validation errors
        var data = isc.JSON.decode(rpcResponse.httpResponseText);
        form.setErrors(data, true);

        if (data && data['__all__']) {
          data['detail'] = data['__all__'];
        }

        var message = 'Validatie fout. Voer de gegevens juist in en sla het nog een keer op. ';
        if (data && data['detail']) {
          message = message + data['detail'];
        }
        if (options.extraValidationMessage) {
          message += options.extraValidationMessage(data);
        }
        userWarning('Validatie', message, false);
      } else {
        //show error message
        try {
          var data = isc.JSON.decode(rpcResponse.httpResponseText);
        } catch (e) {
          var data = {detail: ' '}
        }
        var message = 'Fout bij opslaan. '
        if (data && data['detail']) {
          message = message + data['detail']
        }
        userWarning('Error', message, true);
      }
    }
  });
}
