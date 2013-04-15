
var uploadDS = isc.RestDataSource.create({
  autoFetchData: false,
  dataFormat: 'custom',
  recordXPath: 'results',
  bypassCache: false,
  dataURL: settings.alarm_settings_url,
  fields:[
    {name: "file", title:"CSV file", type: 'binary'}
  ]
});


var uploadForm = isc.DynamicForm.create({
  autoDraw: false,
  width: 350,
  numCols: 2,
  colWidths: [100, 250],
  dataSource: uploadDS,
  fields: [
    { type: 'header', defaultValue: "Upload bestand met waarden"},
    { name: 'file'},
    {
      name: 'postBtn',
      title: 'Opslaan',
      type: 'Button',
      click: function(form) {
        //todo: validation

        debugger;
        //var data = form.getData();
        form.saveData();
      }
    }
  ]
});

fileUploadPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    uploadForm
  ]
});