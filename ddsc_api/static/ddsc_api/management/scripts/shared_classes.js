//
// class: FilterPaginatedDataSource
// Base class with communication to rest api, including pagination and filter support
isc.ClassFactory.defineClass("FilterPaginatedDataSource", isc.RestDataSource);

isc.FilterPaginatedDataSource.addProperties({
  dataFormat: 'custom',
  transformRequest: function(dsRequest) {
    dsRequest.httpHeaders = {
      "Accept" : "application/json"
    }
    dsRequest.params = {};

    if (typeof(dsRequest.startRow) == 'number') {
      dsRequest.params = {
        page: Math.floor(dsRequest.startRow / dsRequest.dataPageSize) + 1, //first result is page 1
        page_size: dsRequest.dataPageSize
      }
    }
    if (dsRequest.data) {
      var filter = {}
      for (key in dsRequest.data ) {
        key = key.replace('.', '__')
        if (key === 'id') {
          filter[key] = dsRequest.data[key];
        } else {
          filter[key + '__icontains'] = dsRequest.data[key];
        }
      }
      dsRequest.params.filter = filter;
    }
  },
  transformResponse: function(dsResponse) {
    var json_data = isc.JSON.decode(dsResponse.data);
    dsResponse.totalRows = json_data.count;
    dsResponse.data = json_data.results;
    dsResponse.startRow = (dsResponse.context.params.page - 1) * dsResponse.context.params.page_size;
    dsResponse.endRow = dsResponse.startRow + dsResponse.context.params.page_size;
    console.log('got row ' + dsResponse.startRow + ' till ' + dsResponse.endRow);
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
    dataPageSize: 20
  },
  valueField: 'id',
  displayField: 'name'
});

