isc.ClassFactory.defineClass('AquoDataSource', isc.FilterPaginatedDataSource);

isc.AquoDataSource.addProperties({
  autoFetchData: false,
  requestProperties: {
    httpHeaders: {
      "Accept" : "application/json"
    }
  },
  fields:[
    {name: 'id', title: 'iD', primaryKey: true, hidden: true},
    {name: 'code', title: 'Code'},
    {name: 'description', title: 'Beschrijving'},
    {name: 'group', title: 'Groep'}
  ]
});


var timeseriesDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.timeseries_url,
  requestProperties: {
    params: {
      management: true
    },
    httpHeaders: {
      "Accept" : "application/json"
    }
  },
  fields:[
    {name: 'id', title: 'id', hidden: true},
    {name: 'uuid', title: 'uuid'},
    {name: 'name', title: 'naam'},
    {name: 'description', title: 'beschrijving', hidden: true},
    {
      name: 'value_type', title: 'waarde type', valueMap: ['integer', 'float', 'text', 'image',
      'georeferenced remote sensing', 'movie', 'file'], canFilter: false, hidden: true
    },
    {name: 'source', title: 'bron systeem', hidden: true},//fk
    {name: 'owner', title: 'data eigenaar'},//fk
    {name: 'location.name', title: 'locatie'},//fk
    {name: 'parameter', title: 'parameter'},//aquo
    {name: 'unit', title: 'eenheid', hidden: true},//aquo
    {name: 'reference_frame', title: 'hoedaningheid', hidden: true},
    {name: 'compartment', title: 'compartiment', hidden: true},
    {name: 'measuring_device', title: 'meetapperatuur', hidden: true},
    {name: 'measuring_method', title: 'meetmethode', hidden: true},
    {name: 'processing_method', title: 'verwerkingsmethode', hidden: true},

    {name: 'validate_max_hard', title: 'harde bovengrens', hidden: true, type: 'float'},
    {name: 'validate_min_hard', title: 'harde ondergrens', hidden: true},
    {name: 'validate_max_soft', title: 'zachte bovengrens', hidden: true},
    {name: 'validate_min_soft', title: 'zachte ondergrens', hidden: true},
    {name: 'validate_diff_hard', title: 'harde maximale verandering', hidden: true},
    {name: 'validate_diff_soft', title: 'zachte maximale verandering', hidden: true},

    {name: 'first_value_timestamp', title: 'verwerkingsmethode', hidden: true},
    {name: 'latest_value', title: 'laatste waarde', canFilter: false, canSort: false},
    {name: 'latest_value_timestamp', title: 'tijdstip laatste waarde'},
    {name: 'supplying_systems', title: 'id_mapping', hidden: true}
  ]
});



function take_attribute_or_null(obj, field) {
  if (obj) {
    if (typeof(obj) == 'object') {
      if (field in obj) {
        return obj[field];
      }
    } else {
        return obj
      }
  }
  return null
}

var setTimeseriesFormData = function(data) {

  data.source = take_attribute_or_null(data.source, 'uuid');
  data.location = take_attribute_or_null(data.location, 'uuid');

  data.parameter = take_attribute_or_null(data.parameter, 'code');
  data.unit = take_attribute_or_null(data.unit, 'code');
  data.reference_frame = take_attribute_or_null(data.reference_frame, 'code');
  data.compartment = take_attribute_or_null(data.compartment, 'code');
  data.measuring_device = take_attribute_or_null(data.measuring_device, 'code');
  data.measuring_method = take_attribute_or_null(data.measuring_method, 'code');
  data.processing_method = take_attribute_or_null(data.processing_method, 'code');

  timeseriesForm.setData(data);

  timeseriesForm.setErrors([]);

}


var timeseriesList = isc.DefaultListGrid.create({
  width:700,
  dataSource: timeseriesDS,
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      httpHeaders: {
        "Accept" : "application/json"
      },
      callback: function(rpcResponse, data, rpcRequest) {
        data = isc.JSON.decode(data);
        setTimeseriesFormData(data);
      }
    });
  }
});


var locationDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.locations_url,
  autoFetchData: false,
  fields:[
    {name: 'id', title: 'iD', primaryKey: true, hidden: true},
    {name: 'uuid', title: 'UUID'},
    {name: 'name', title: 'Naam'}
  ]
});

var sourceDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.sources_url,
  autoFetchData: false,
  fields:[
    {name: 'uuid', title: 'UUID', primaryKey: true},
    {name: 'name', title: 'Naam'},
    {name: 'manufacturer', title: 'Leverancier'}
  ]
});


var timeseriesForm = isc.DynamicForm.create({
  //ID: 'alarmForm',
  autoDraw: false,
  dataSource: timeseriesDS,
  width: 600,
  numCols: 4,
  colWidths: [100, 200, 100, 200],
  fields: [
    {type: 'header', defaultValue: 'Tijdserie instellingen'},
    //{name: 'id', title: 'id', canEdit: false},
    {name: 'uuid', title: 'UUID', canEdit: false},
    {name: 'name', width: '*'},
    {name: 'description', type: 'textArea', width: '*'},
    {name: 'value_type', title: 'Waarde type'},
    {
      name: 'source', title: 'Bron systeem', editorType: 'DefaultSelectItem', valueField: 'uuid',
      optionDataSource: sourceDS,
      pickListFields:[
        {name: 'uuid', width: 100},
        {name: 'name'},
        {name: 'manufacturer', width: 100}
      ],
      width: '*'
    },
    {
      name: 'owner', title: 'Data eigenaar', type: 'combo',
      width: '*',
      valueField: 'name', displayField: 'name',
      optionDataSource: isc.DataSource.create({
        dataFormat: 'json',
        recordXPath: 'results',
        requestProperties: {
          params: {
            page_size: 1000,
            management: true
          },
          httpHeaders: {
            "Accept" : "application/json"
          }
        },
        dataURL: settings.dataowners_url,
        fields:[
          {name: 'id', title: 'ID', primaryKey: true},
          {name: 'name', title: 'Name'}
        ]
      })
    },
    {
      name: 'location', title: 'Locatie', editorType: 'DefaultSelectItem', valueField: 'uuid',
      optionDataSource: locationDS,
      pickListFields:[
        {name: 'uuid', width: 100},
        {name: 'name'}
      ],
      width: '*'
    },
    //{name: 'supplying_systems', title: 'id_mapping', hidden: true},

    {type: 'header', defaultValue: 'Aquo gegevens'},
    {
      name: 'parameter', title: 'Parameter', editorType: 'DefaultSelectItem', displayField: 'description', valueField: 'code',
      optionDataSource: isc.AquoDataSource.create({dataURL: settings.parameters_url}),
      pickListFields:[
        {name:'code', width: 100},
        {name:'description'},
        {name:'group', width: 100}
      ],
      width: '*'
    },
    {
      name: 'unit', title: 'Eenheid', editorType: 'DefaultSelectItem', displayField: 'description', valueField: 'code',
      optionDataSource: isc.AquoDataSource.create({dataURL: settings.units_url}),
      pickListFields:[
        {name:'code', width: 100},
        {name:'description'}
      ],
      width: '*'
    },
    {
      name: 'reference_frame', title: 'Hoedaningheid', editorType: 'DefaultSelectItem', displayField: 'description', valueField: 'code',
      optionDataSource: isc.AquoDataSource.create({dataURL: settings.referenceframes_url}),
      pickListFields:[
        {name:'code', width: 100},
        {name:'description'}
      ],
      width: '*'
    },
    {
      name: 'compartment', title: 'Compartiment', editorType: 'DefaultSelectItem', displayField: 'description', valueField: 'code',
      optionDataSource: isc.AquoDataSource.create({dataURL: settings.compartments_url}),
      pickListFields:[
        {name:'code', width: 100},
        {name:'description'}
      ],
      width: '*'
    },
    {
      name: 'measuring_device', title: 'Meetapperatuur', editorType: 'DefaultSelectItem', displayField: 'description', valueField: 'code',
      optionDataSource: isc.AquoDataSource.create({dataURL: settings.measuringdevices_url}),
      pickListFields:[
        {name:'code', width: 100},
        {name:'description'}
      ],
      width: '*'
    },
    {
      name: 'measuring_method', title: 'Meetmethode', editorType: 'DefaultSelectItem', displayField: 'description', valueField: 'code',
      optionDataSource: isc.AquoDataSource.create({dataURL: settings.measuringmethods_url}),
      pickListFields:[
        {name:'code', width: 100},
        {name:'description'}
      ],
      width: '*'
    },
    {
      name: 'processing_method', title: 'Verwerkingsmethode', editorType: 'DefaultSelectItem', displayField: 'description', valueField: 'code',
      optionDataSource: isc.AquoDataSource.create({dataURL: settings.processingmethods_url}),
      pickListFields:[
        {name:'code', width: 100},
        {name:'description'}
      ],
      width: '*'
    },
    {type: 'header', defaultValue: 'Validatie'},
    {name: 'validate_max_hard', editorType: 'spinner', step: 1},
    {name: 'validate_min_hard', editorType: 'spinner', step: 1},
    {name: 'validate_max_soft', editorType: 'spinner', step: 1},
    {name: 'validate_min_soft', editorType: 'spinner', step: 1},
    {name: 'validate_diff_hard', editorType: 'spinner', step: 1},
    {name: 'validate_diff_soft', editorType: 'spinner', step: 1},

    {type: 'header', defaultValue: 'Extra informatie'},
    {name: 'first_value_timestamp', title: 'Tijdstip eerste waarde', canEdit: false},
    {name: 'latest_value', title: 'Laatste waarde', canEdit: false},
    {name: 'latest_value_timestamp', title: 'Tijdstip laatste waarde', canEdit: false}
  ]
});


var saveTimeseries = function(saveAsNew) {
  var data = timeseriesForm.getData();

  data = replace_null(data);

  saveObject(timeseriesForm, data, settings.timeseries_url, {
    saveAsNew: saveAsNew,
    idField: 'uuid',
    reloadList: timeseriesList,
    setFormData: setTimeseriesFormData
  });
}


timeseriesPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    timeseriesList,
    isc.VLayout.create({
      padding: 10,
      members: [
        timeseriesForm,
        isc.HLayout.create({
          members: [
            isc.IButton.create({
              title: 'Annuleren',
              click: function() {
                timeseriesForm.setData([]);
                timeseriesForm.setErrors([]);
              }
            }),
            isc.IButton.create({
              title: 'Nieuw',
              click: function() {
                timeseriesForm.setData([]);
                timeseriesForm.setErrors([]);
              }
            }),
            isc.IButton.create({
              title: 'Opslaan',
              click: function() {
                saveTimeseries(false);
              }
            }),
            isc.IButton.create({
              title: 'Verwijderen',
              click: function() {
                var uuid = timeseriesForm.getValue('uuid');
                if (uuid) {
                  RPCManager.sendRequest({
                    actionURL: timeseriesForm.getData()['url'],
                    httpMethod: 'DELETE',
                    httpHeaders: {
                      'X-CSRFToken': document.cookie.split('=')[1],
                      "Accept" : "application/json"
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      timeseriesForm.setData([]);
                      timeseriesForm.setErrors([]);
                      timeseriesList.invalidateCache(); //force new fetch with timestamp
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
            window.open(settings.doc.timeseries_url, "Help");
          }
        }),
        isc.IButton.create({
          title: 'Download template',
          click: function() {
            window.open(settings.template_download_url, "Template");
          }
        })
      ]
    })
  ]
});