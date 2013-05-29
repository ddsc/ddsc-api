

var alarmDS = isc.RestDataSource.create({
  autoFetchData: false,
  dataFormat: 'custom',
  dataURL: settings.alarm_settings_url,
  fields:[
    {name: "id", title:"id", hidden: true},
    {name: "active_status", title: "actief", type: "boolean", width:35},
    {name: "name", title:"Naam"},
    {name: "object_id", title:"user_id", width: 50},
    {name: "frequency", title:"Frequentie", width: 60,
      valueMap: ['5 min', '10 min', '15 min', '30 min', '1 hr', '6 hr', '12 hr', '24 hr']
    },
    {name: "urgency", title:"Urgentie", width: 50, valueMap: ['High', 'Low']},
    {name: "message_type", title: "Notificatie", width: 80, valueMap: ['Email', 'No message']},// not supported at this moment: 'SMS', 'Email and SMS',
    {name: 'template', title: 'Sjabloon', hidden: true},
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
    if (dsResponse.httpResponseCode == 200) {
      var json_data = isc.JSON.decode(dsResponse.data);
      dsResponse.totalRows = json_data.length;
      dsResponse.data = json_data;
    } else {
      dsResponse.status = -101;
    }
  },
  handleError: function(dsRequest, dsResponse) {
    userWarning('Error', 'Fout in ophalen van gegevens.', true);
  }
});


var setAlarmFormData = function(data) {
  alarmForm.setData(data);
  alarmForm.setErrors([]);
  alarmItemList.setData(data.alarm_item_set);
}


var alarmList = isc.ListGrid.create({
  //ID: "alarmList",
  width:700,
  alternateRecordStyles:true,
  autoFetchData: true,
  dataSource: alarmDS,
  sortField: 'name',
  sortDirection: Array.ASCENDING,
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      httpHeaders: {
        "Accept" : "application/json"
      },
      callback: function(rpcResponse, data, rpcRequest) {
        data = isc.JSON.decode(data);
        setAlarmFormData(data);
      }
    });
  },
  canReorderFields: true
});


var alarmLocationDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.locations_url,
  autoFetchData: false,
  fields:[
    {name: 'id', title: 'iD', primaryKey: true, hidden: true},
    {name: 'uuid', title: 'UUID'},
    {name: 'name', title: 'Naam'}
  ]
});

var alarmTimeseriesDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.timeseries_url,
  autoFetchData: false,
  fields:[
    {name: 'id', title: 'iD', primaryKey: true, hidden: true},
    {name: 'uuid', title: 'UUID'},
    {name: 'name', title: 'Naam'}
  ]
});

var alarmLogicalGroupDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.logicalgroups_url,
  autoFetchData: false,
  fields:[
    {name: 'id', title: 'iD', primaryKey: true, hidden: true},
    {name: 'name', title: 'Naam'}
  ]
});


var alarmForm = isc.DynamicForm.create({
  dataSource: alarmDS,
  width: 400,
  numCols: 2,
  colWidths: [100, 300],
  fields: [
    {type: 'header', defaultValue: "Alarm instellingen"},
    {name: "id", title:"id", editorType: 'HiddenItem', canEdit: false},
    {name: "active_status", title: "aan/ uit", type: "boolean", defaultValue: true},
    {name: "name", width: "*"},
    {name: "frequency", width: "*"},
    {name: "urgency", width: "*"},
    {name: "message_type", width: "*"},
    {name: 'template', type: 'textArea', width: "*"},
    {type: 'header', defaultValue: "Regels"},
    {name: 'logical_check', width: "*"}
  ]
});

var alarmItemForm = isc.DynamicForm.create({
  width: 400,
  numCols: 2,
  margin: 20,
  colWidths: [75, 300],
  fields: [

    {name: "id", title: "id", editorType: 'HiddenItem', canEdit: false},
    {name: "name", title:"Naam", type: "text"},
    {type: 'header', defaultValue: "Object"},
    {name: "alarm_type", title: "Object type",  valueMap: ['timeseries', 'location', 'logical group'],
      redrawOnChange: true, width: 200},
    {
      name: 'timeseries', title: 'Tijdserie', editorType: 'DefaultSelectItem', displayField: 'name', valueField: 'id',
      showIf: "form.getValue('alarm_type') == 'timeseries'",
      optionDataSource: alarmTimeseriesDS,
      pickListFields:[
        {name:'uuid', width: 100},
        {name:'name'},
        {name:'parameter', title: 'parameter code', width: 80}

      ],
      width: '*'
    },
    {
      name: 'location', title: 'Locatie', editorType: 'DefaultSelectItem', displayField: 'name', valueField: 'id',
      showIf: "form.getValue('alarm_type') == 'location'",
      optionDataSource: alarmLocationDS,
      pickListFields:[
        {name:'uuid', width: 100},
        {name:'name'},
        {name:'parameter', title: 'parameter code', width: 80}

      ],
      width: '*'
    },
    {
      name: 'logical group', title: 'Logische groep', editorType: 'DefaultSelectItem', displayField: 'name', valueField: 'id',
      showIf: "form.getValue('alarm_type') == 'logical group'",
      optionDataSource: alarmLogicalGroupDS,
      pickListFields:[
        {name: 'name', title: 'Naam'},
        {name: 'owner', title: 'Eigenaar'}

      ],
      width: '*'
    },
    {type: 'header', defaultValue: "Controle op"},
    {name: 'logical_check', title: 'Alles binnen of object of ten minste een', valueMap: ['All', 'At least one'], width: 200},
    {name: "value_type", title:"Controle op", width: "*", valueMap: ['a. Waarde', 'b. Status - Aantal metingen',
      'c. Status - Percentage betrouwbare waarden',
      'd. Status - Percentage twijfelachtige waarden', 'e. Status - Percentage onbetrouwbare waarden',
      'f. Status - Minimum meetwaarde', 'g. Status - Maximum meetwaarde', 'h. Status - Gemiddelde meetwaarde',
      'i. Status - Standaard deviatie', 'j. Status - Tijd sinds laatste meting',
      'k. Status - Procentuele afwijking van het aantal te verwachten metingen']
    },
    {name: 'comparision', title: 'Logische controle', valueMap: ['==', '!=', '>', '<'], width: 80},
    {type: 'header', defaultValue: "Waarde(n) van tijdserie(s) binnen object"},
    {name: "value_double", title:"Decimaal", editorType: 'spinner', width: 80},
    {name: "value_int", title:"Geheel getal", editorType: 'spinner', type: 'number', width: 80},
    {name: "value_text", title: "Tekst", type: "text", width: "*"},
    {name: "cancelBtn", title: "Annuleren", type: "button", click: function(form) {
        alarmItemFormWindow.closeClick();
      }
    },
    {name: "storeBtn", title: "Klaar met bewerken", type: "button", click: function(form) {
        if (form.validate()) {
          var data = form.getValues();
          if (data.alarm_type) {
            data.object_id = data[data.alarm_type];
            data.content_object_name = form.getField(data.alarm_type).getDisplayValue();
          } else
            data.object_id = null;
            data.object_name = null;
          if (form.originalRecord) {
            isc.addProperties(form.originalRecord, data);
            alarmItemList.markForRedraw();
          } else {
            alarmItemList.addData(data);
          }
          alarmItemFormWindow.closeClick();
        }
      }
    }
  ]
});


var alarmItemFormWindow = isc.Window.create({
  title: "Alarm regel",
  autoSize: true,
  canDragReposition: true,
  canDragResize: true,
  autoCenter: true,
  isModal: true,
  items: [
    alarmItemForm
  ]
});


var alarmItemList = isc.ListGrid.create({
  //ID: "alarmItemList",
  width:700,
  autoFitMaxRecords: 5,
  autoFitData: "vertical",
  alternateRecordStyles: true,
  showRecordComponents: true,
  showRecordComponentsByCell: true,
  canRemoveRecords: true,
  fields:[
    {name: "alarm_type", title: "alarm type", type: "text", width:80, valueMap: ['timeseries', 'location', 'logical group']},
    {name: "object_id", title: "object id", type: "text", width:50},
    {name: "content_object_name", title: "object naam", type: "text", width:50},
    {name: "id", title:"id", showIf: function() { return false; }},
    {name: "name", title:"Naam", showIf: function() { return false; }},
    {name: 'logical_check', title: 'wat', width: 50},
    {name: "value_type", title:"controle op"},
    {name: 'comparision', title: 'vergelijking', width: 50},
    {name: "value_double", title:"decimaal", type: 'number', width: 50},
    {name: "value_int", title:"geheel getal", type: 'number', width: 50},
    {name: "value_text", title: "tekst", type: "text", width: 80},
    {name: "edit_field", title: "bewerk", width: 90, align: "center"}
    //,{name: "value_bool", title: "ja/nee", type: "boolean", width:50}
  ],
  createRecordComponent : function (record, colNum) {
     var fieldName = this.getFieldName(colNum);
    if (fieldName == "edit_field") {
      var button = isc.IButton.create({
        height: 18,
        width: 80,
        icon: static_media_root + "ddsc_api/management/images/comment_edit.png",
        title: "Bewerk",
        click : function () {
          record['logical group'] = null;
          record['timeseries'] = null;
          record['location'] = null;
          if (record.alarm_type) {
              record[record.alarm_type] = record.object_id;
          }
          alarmItemFormWindow.show();
          alarmItemForm.setData(record);
          alarmItemForm.originalRecord = record;
        }
      });
      return button;
    }
    return null;
  }
});


var saveAlarm = function(saveAsNew) {
  var data = alarmForm.getData();
  var alarm_items = alarmItemList.getData();
  alarm_items.every( function(item) {
    for (atr in item) {
      if (atr.startsWith('_')) {
        delete item[atr];
      }
    }
  });
  data.alarm_item_set =alarm_items

  saveObject(alarmForm, data, settings.alarm_settings_url, {
    saveAsNew: saveAsNew,
    reloadList: alarmList,
    setFormData: setAlarmFormData,
    extraValidationMessage: function(data) {
      if (data.alarm_item_set) {
        message = 'Invoer fout in alarm_items, met de volgende meldingen: <br>'
        for (var i=0; i<data.alarm_item_set.length; i++) {
          for (key in data.alarm_item_set[i]) {
            message += "Veld: '" + key + "', melding: '" + data.alarm_item_set[i][key]+ "'<br>"
          }
        }
        return message
      }
      return ''
    }
  });
}

alarmPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    alarmList,
    isc.VLayout.create({
      padding: 10,
      membersMargin: 10,
      members: [
        alarmForm,
        alarmItemList,
        isc.HLayout.create({
          members: [
            isc.IButton.create({
              title: "Regel toevoegen",
              click: function () {
                alarmItemForm.setData([]);
                alarmItemForm.originalRecord = null;
                alarmItemFormWindow.show();
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
                      'X-CSRFToken': document.cookie.split('=')[1],
                      "Accept" : "application/json"
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      alarmForm.setData([]);
                      alarmForm.setErrors([]);
                      alarmItemList.setData([]);
                      alarmList.invalidateCache(); //force new fetch with timestamp
                    }
                  });
                }
              }
            })
          ]
        }),
        isc.IButton.create({
          title: 'Help',
          click: function() {
            window.open(settings.doc.alarms_url, "Help");
          }
        })
      ]
    })
  ]
});