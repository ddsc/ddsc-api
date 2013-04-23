RPCManager.allowCrossDomainCalls = true

rowCount = 0

var locationDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.locations_url,
  fields:[
    {name:"url", title:"Url", hidden: true},
    {name:"uuid", title:"Uuid", hidden: true},
    {name:"name", title:"Naam"},
    {name:"description", title:"Beschrijving"},
    {name:"point_geometry", title:"punt geometrie"},
    {name:"geometry_precision", title:"geometrie precisie"},
    {name: "path", title: "path", type: "text", width: 80},
    {name: "depth", title: "diepte", type: "integer", width:50, hidden: true}
  ]
});

var locationList = isc.ListGrid.create({
  width:700,
  alternateRecordStyles:true,
  showFilterEditor: true,
  dataSource: locationDS,
  autoFetchData: true,
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      callback: function(rpcResponse, data, rpcRequest) {
        locationForm.setData(isc.JSON.decode(data));
        locationForm.setErrors([]);
      }
    });
  },
  //canReorderFields: true,
  useClientSorting:false,
  dataPageSize: 50,
  drawAheadRatio: 2
});


var locationForm = isc.DynamicForm.create({
  numCols: 2,
  colWidths: [100, 250],
  width: 350,
  dataSource: locationDS,
  fields: [
    {type: 'header', defaultValue: "Locatie", width: "*"},
    {name:"uuid", canEdit: false},
    {name:"name", width: '*'},
    {name:"description", type: 'TextArea', width: '*'},
    {name:"point_geometry", width: '*'},
    {name:"geometry_precision", type: 'spinner'},
    {name: "path", width: '*', canEdit: false},
    {name: "depth", width: '*', canEdit: false}
  ]
});

var saveLocation = function(saveAsNew) {

  var data = locationForm.getData();

  if (saveAsNew || !data.uuid) {
    delete data.uuid;
    delete data.url;
    delete data.path;
    delete data.depth;
    //todo: set alarmItem id's on null
    var method = 'POST';
    var url = settings.locations_url;
  } else {
    var method = 'PUT';
    var url = data.url;
  }
  locationForm.setErrors([]);

  RPCManager.sendRequest({
    actionURL: url,
    httpMethod: method,
    data: data,
    params: data,
    httpHeaders: {
      'X-CSRFToken': document.cookie.split('=')[1]
    },
    callback: function(rpcResponse, data, rpcRequest) {

      if (rpcResponse.httpResponseCode == 200 || rpcResponse.httpResponseCode == 201) {
        console.log('Gelukt');
        var data = isc.JSON.decode(data);
        locationForm.setData(data);
        locationList.fetchData({test: timestamp()}); //force new fetch with timestamp
        if (rpcResponse.httpResponseCode == 201) {
          //in case of create, the list serializer is used for the return. do extra fetch to get details
          RPCManager.sendRequest({
            actionURL: data.url,
            httpMethod: 'GET',
            callback: function(rpcResponse, data, rpcRequest) {
              data = isc.JSON.decode(data);
              locationForm.setData(data);
            }
          });
        }
      } else if (rpcResponse.httpResponseCode == 400) {
        locationForm.setErrors(isc.JSON.decode(rpcResponse.httpResponseText), true);
        alert('validatie mislukt.');

      } else {
        alert('Opslaan mislukt.');
      }
    }
  });
}

locationPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    locationList,
    isc.VLayout.create({
      members: [
        locationForm,
        isc.HLayout.create({
          members: [
            isc.IButton.create({
              title: 'Annuleren',
              click: function() {
                locationForm.setData([]);
                locationForm.setErrors([]);
              }
            }),
            isc.IButton.create({
              title: 'Nieuw',
              click: function() {
                locationForm.setData([]);
                locationForm.setErrors([]);
              }
            }),
            isc.IButton.create({
              title: 'Opslaan',
              click: function() {
                saveLocation(false);
              }
            }),
            isc.IButton.create({
              title: 'Verwijderen',
              click: function() {
                var uuid = locationForm.getValue('uuid');
                if (uuid) {
                  RPCManager.sendRequest({
                    actionURL: locationForm.getData()['url'],
                    httpMethod: 'DELETE',
                    httpHeaders: {
                      'X-CSRFToken': document.cookie.split('=')[1]
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      locationForm.setData([]);
                      locationForm.setErrors([]);
                      locationList.fetchData({test: timestamp()}); //force new fetch with timestamp
                    }
                  });
                }
              }
            })
          ]
        })
      ]
    })
  ]
});