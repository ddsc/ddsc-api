

var statusDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.status_url,
  fields:[
    {name: "id", title:"id", hidden: true},
    {name: "url", title:"url", hidden: true},
    {name: "date", title:"Datum"},
    {name: "timeseries.name", title:"Naam", width: 150},
    {name: "timeseries.location.name", title:"Locatie Naam", hidden: true},
    {name: "timeseries.parameter", title:"Parameter code"},
    {name: "timeseries.unit", title:"Eenheids code", hidden: true},
    {name: "nr_of_measurements_total", title:"Aantal metingen", canFilter: false},
    {name: "nr_of_measurements_reliable", title:"Nr betrouwbaar", canFilter: false},
    {name: "nr_of_measurements_doubtful", title:"Nr twijfelachtig", canFilter: false},
    {name: "nr_of_measurements_unreliable", title:"Nr onbetrouwbaar", canFilter: false},
    {name: "min_val", title:"Min", canSort: false, canFilter: false},
    {name: "max_val", title:"Max", canSort: false, canFilter: false},
    {name: "mean_val", title:"Gemiddelde", canSort: false, canFilter: false},
    {name: "std_val", title:"Standaard deviatie", hidden:true}
  ]
});


var statusList = isc.DefaultListGrid.create({
  width: 900,
  dataSource: statusDS,
  sortField: 'date',
  sortDirection: Array.DESCENDING,
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      httpHeaders: {
        "Accept" : "application/json"
      },
      callback: function(rpcResponse, data, rpcRequest) {
        data = isc.JSON.decode(data);
        statusForm.setData(data);
      }
    });
  }
});


var statusForm = isc.DynamicForm.create({
  dataSource: statusDS,
  width: 350,
  numCols: 2,
  colWidths: [100, 250],
  fields: [
    {type: 'header', defaultValue: "Details Status"},
    {name: "id", width: "*", canEdit: false},
    {name: "date", width: "*"},
    {name: "timeseries.name", width: "*"},
    {name: "timeseries.parameter", width: "*"},
    {name: "nr_of_measurements_total", width: "*"},
    {name: "nr_of_measurements_reliable", width: "*"},
    {name: "nr_of_measurements_doubtful", width: "*"},
    {name: "nr_of_measurements_unreliable", width: "*"},
    {name: "min_val", width: "*"},
    {name: "max_val", width: "*"},
    {name: "mean_val", width: "*"},
    {name: "std_val", width: "*"}
  ]
});


statusPage = isc.HLayout.create({
  membersMargin: 10,
  members: [
    statusList,
    isc.VLayout.create({
      members: [
        statusForm,
        isc.IButton.create({
          title: 'Help',
          click: function() {
            window.open(settings.doc.status_overview_url, "Help");
          }
        })
      ]
    })
  ]
});