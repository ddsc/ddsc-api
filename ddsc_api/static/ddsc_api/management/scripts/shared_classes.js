//
// class: FilterPaginatedDataSource
// Base class with communication to rest api, including pagination and filter support
isc.ClassFactory.defineClass("FilterPaginatedDataSource", isc.RestDataSource);

isc.FilterPaginatedDataSource.addProperties({
  dataFormat: 'custom',
  useClientSorting:false,
  transformRequest: function(dsRequest) {
    dsRequest.httpHeaders = {
      "Accept" : "application/json"
    }
    dsRequest.params = {};

    if (typeof(dsRequest.startRow)=='number' && typeof(dsRequest.dataPageSize)=='number') {

      dsRequest.params = {
        page: Math.floor(dsRequest.startRow / dsRequest.dataPageSize) + 1, //first result is page 1
        page_size: dsRequest.dataPageSize
      }
    }

    if (dsRequest.data) {
      var filter = {}
      for (key in dsRequest.data ) {
        if (key === 'id') {
          filter[key] = dsRequest.data[key];
        } else if (!typeof(dsRequest.startRow)=='number') {
          //request for specific value - used for 'start' value in forms
          filter[key] = dsRequest.data[key];
        } else {
          filter[key + '__icontains'] = dsRequest.data[key];
        }
      }
      dsRequest.params.filter = filter;
      debugger;
    }
    if (dsRequest.sortBy && dsRequest.sortBy.length>0) {
      dsRequest.params.order = dsRequest.sortBy
    }

  },
  allowAdvancedCriteria: true,
  transformResponse: function(dsResponse) {
    var json_data = isc.JSON.decode(dsResponse.data);
    dsResponse.totalRows = json_data.count;
    dsResponse.data = json_data.results;
    if (dsResponse.context.params.page_size) {
      dsResponse.startRow = (dsResponse.context.params.page - 1) * dsResponse.context.params.page_size;
      dsResponse.endRow = dsResponse.startRow + dsResponse.context.params.page_size;
      console.log('got row ' + dsResponse.startRow + ' till ' + dsResponse.endRow);
    }
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
  autoFetchData: false,
  valueField: 'id',
  displayField: 'name'
});

