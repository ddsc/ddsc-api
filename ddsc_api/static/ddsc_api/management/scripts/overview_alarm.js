

var activeAlarmDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.active_alarm_url,
  fields:[
    {name: "id", title:"id", hidden: true},
    {name: "url", title:"url", hidden: true},
    {name: "active", title:"Actief", type: 'boolean'},
    {name: "alarm.name", title:"Naam"},
    {name: "first_triggered_on", title:"geactiveerd"},
    {name: "deactivated_on", title:"gedeactiveerd"},
    {name: "message", title:"bericht"},
    //{name: "active_status", title: "actief", type: "boolean", width:35},
    {name: "alarm.object_id", title:"user_id", width: 50, hidden: true},
    {name: "alarm.urgency", title:"Urgentie", width: 50},
    {name: "alarm.message_type", title: "Notificatie", width: 80, hidden: true}
  ]
});


var activeAlarmList = isc.DefaultListGrid.create({
  width: 700,
  dataSource: activeAlarmDS,
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      callback: function(rpcResponse, data, rpcRequest) {
        data = isc.JSON.decode(data);
        activeAlarmForm.setData(data);
      }
    });
  }
});


var activeAlarmForm = isc.DynamicForm.create({
  dataSource: activeAlarmDS,
  width: 350,
  numCols: 2,
  colWidths: [100, 250],
  fields: [
    {type: 'header', defaultValue: "Details actief alarm"},
    {name: "id", width: "*", canEdit: false},
    {name: "url", width: "*", canEdit: false},
    {name: "active", width: "*"},
    {name: "alarm.name", width: "*", readonly: true},
    {name: "first_triggered_on", width: "*", readonly: true},
    {name: "deactivated_on", width: "*", readonly: true},
    {name: "message", type: 'TextArea', width: "*", readonly: true},
    {name: "alarm.object_id", width: "*", readonly: true},
    {name: "alarm.urgency", width: "*", readonly: true},
    {name: "alarm.message_type", width: "*", readonly: true}
  ]
});


activeAlarmPage = isc.HLayout.create({
  membersMargin: 10,
  members: [
    activeAlarmList,
    activeAlarmForm
  ]
});