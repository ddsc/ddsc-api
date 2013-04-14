

var alarmDS = isc.RestDataSource.create({
  autoFetchData: false,
  dataFormat: 'custom',
  dataURL: "http://33.33.33.10:8001/api/v1/alarmsettings",
  fields:[
    {name: "id", title:"id", hidden: true},
    {name: "active_status", title: "actief", type: "boolean", width:35},
    {name: "name", title:"Naam"},
    {name: "object_id", title:"user_id", width: 50},
    {name: "frequency", title:"Frequentie", width: 60,
      valueMap: ['5 min', '10 min', '15 min', '30 min', '1 hr', '6 hr', '12 hr', '24 hr']
    },
    {name: "urgency", title:"Urgentie", width: 50, valueMap: ['High', 'Low']},
    {name: "message_type", title: "Notificatie", width: 80, valueMap: ['Email', 'SMS', 'Email and SMS']},
    {name: 'template', title: 'Template', hidden: true},
    {name: 'logical_check', title: 'Logische controle', valueMap: ['All', 'At least one'], hidden: true}
  ],
  transformRequest: function(dsRequest) {
    dsRequest.httpHeaders = {
      "Accept" : "application/json"
    }
    dsRequest.params = {
      page_size: 0
    }
  },
  transformResponse: function(dsResponse) {
    var json_data = isc.JSON.decode(dsResponse.data);
    dsResponse.totalRows = json_data.length;
    dsResponse.data = json_data;
  }
});


var alarmList = isc.ListGrid.create({
  //ID: "alarmList",
  width:700,
  alternateRecordStyles:true,
  autoFetchData: true,
  dataSource: alarmDS,
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      callback: function(rpcResponse, data, rpcRequest) {
        data = isc.JSON.decode(data);
        alarmForm.setData(data);
        alarmForm.setErrors([]);
        alarmItemList.setData(data.alarm_item_set);
      }
    });
  },
  canReorderFields: true
});


var alarmForm = isc.DynamicForm.create({
  //ID: "alarmForm",
  autoDraw: false,
  dataSource: alarmDS,
  width: 350,
  numCols: 2,
  colWidths: [100, 250],
  fields: [
    {type: 'header', defaultValue: "Alarm instellingen"},
    {name:"id", title:"id", canEdit: false},
    {name: "active_status", title: "actief", type: "boolean" , width: 300},
    {name:"name", width: "*"},
    {name:"frequency", width: "*"},
    {name:"urgency", width: "*"},
    {name: "message_type", width: "*"},
    {name: 'template', type: 'textArea', width: "*"},
    {type: 'header', defaultValue: "Regels"},
    {name: 'logical_check', width: "*"}
  ]
});


var alarmItemList = isc.ListGrid.create({
  //ID: "alarmItemList",
  width:700,
  autoFitMaxRecords: 5,
  autoFitData: "vertical",
  alternateRecordStyles: true,
  canEdit: true,
  editEvent: "click",
  fields:[
    {name: "alarm_type", title: "alarm type", type: "text", width:80, valueMap: ['timeseries', 'location', 'logical group']},
    {name: "object_id", title: "object_id", type: "text", width:50},
    {name: "id", title:"id", showIf: function() { return false; }},
    {name: "name", title:"Naam", showIf: function() { return false; }},
    {name: 'logical_check', title: 'wat', valueMap: ['All', 'At least one'], width: 50},
    {name: "value_type", title:"controle op", valueMap: ['a. Waarde', 'b. Status - Aantal metingen',
      'c. Status - Percentage betrouwbare waarden',
      'd. Status - Percentage twijfelachtige waarden', 'e. Status - Percentage onbetrouwbare waarden',
      'f. Status - Minimum meetwaarde', 'g. Status - Maximum meetwaarde', 'h. Status - Gemiddelde meetwaarde',
      'i. Status - Standaard deviatie', 'j. Status - Tijd sinds laatste meting',
      'k. Status - Procentuele afwijking van het aantal te verwachten metingen']
    },
    {name: 'comparision', title: 'vergelijking', valueMap: ['==', '!=', '>', '<'], width: 50},
    {name: "value_double", title:"decimaal", type: 'number', width: 50},
    {name: "value_int", title:"geheel getal", type: 'number', width: 50},
    {name: "value_text", title: "tekst", type: "text", width: 80},
    {name: "value_bool", title: "ja/nee", type: "boolean", width:50}
  ]
});


var saveAlarm = function(saveAsNew) {
  //todo: validation

  var data = alarmForm.getData();
  data.alarm_item_set = alarmItemList.getData();

  if (saveAsNew || !data.id) {
    alarmForm.setValue('id', null);
    //todo: set alarmItem id's on null
    var method = 'POST';
    var url = "http://33.33.33.10:8001/api/v1/alarmsettings";
  } else {
    var method = 'PUT';
    var url = data.url;
  }
  alarmForm.setErrors([]);


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
        alarmForm.setData(data);
        alarmItemList.setData(data.alarm_item_set);
        alarmList.fetchData({test: timestamp()}); //force new fetch with timestamp
        if (rpcResponse.httpResponseCode == 201) {
          //in case of create, the list serializer is used for the return. do extra fetch to get details
          RPCManager.sendRequest({
            actionURL: data.url,
            httpMethod: 'GET',
            callback: function(rpcResponse, data, rpcRequest) {
              data = isc.JSON.decode(data);
              alarmForm.setData(data);
              alarmItemList.setData(data.alarm_item_set);
            }
          });
        }

      } else if (rpcResponse.httpResponseCode == 400) {
        alarmForm.setErrors(isc.JSON.decode(rpcResponse.httpResponseText), true);
        alert('validatie mislukt');

      } else {
        alert('Opslaan mislukt. ' + data);
      }
    }
  });
}


alarmPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    alarmList,
    isc.VLayout.create({
      padding: 10,
      members: [
        alarmForm,
        alarmItemList,
        isc.HLayout.create({
          members: [
            isc.IButton.create({
              title:"Regel toevoegen",
              click:"alarmItemList.startEditingNew()"
            }),
            isc.IButton.create({
              title:"Regel verwijderen",
              click: function() {
                if (alarmItemList.getSelectedRecord()) {
                  alarmItemList.data.remove(alarmItemList.getSelectedRecord());
                }
              }
            })
          ]
        }),
        isc.HLayout.create({
          members: [
            isc.IButton.create({
              title: 'Annuleren',
              click: function() {
                alarmForm.setData([]);
                alarmForm.setErrors([]);
                alarmItemList.setData([]);
              }
            }),
            isc.IButton.create({
              title: 'Nieuw',
              click: function() {
                alarmForm.setData([]);
                alarmForm.setErrors([]);
                alarmItemList.setData([]);
              }
            }),
            isc.IButton.create({
              title: 'Opslaan',
              click: function() {
                saveAlarm(false);
              }
            }),
            isc.IButton.create({
              title: 'Opslaan als nieuw alarm',
              width: 200,
              click: function() {
                saveAlarm(true);
              }
            }),
            isc.IButton.create({
              title: 'Verwijderen',
              click: function() {
                var id = alarmForm.getValue('id');
                if (id) {
                  RPCManager.sendRequest({
                    actionURL: alarmForm.getData()['url'],
                    httpMethod: 'DELETE',
                    httpHeaders: {
                      'X-CSRFToken': document.cookie.split('=')[1]
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      alarmForm.setData([]);
                      alarmForm.setErrors([]);
                      alarmItemList.setData([]);
                      alarmList.fetchData({test: timestamp()}); //force new fetch with timestamp
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