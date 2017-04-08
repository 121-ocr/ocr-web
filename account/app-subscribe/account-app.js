
window.$token = localStorage.getItem("access_token");

var onmessage = function (event) {
    var obj = event.data;
    //添加应用后刷新应用列表
    if(obj.commandName="refresh_applist"){
        var acct_id = obj.acct_id;
        if(acct_id == currentAcctId){
            loadAppList(currentAcctId);
        }
    }

};
if (typeof window.addEventListener != 'undefined') {
    window.addEventListener('message', onmessage, false);
} else if (typeof window.attachEvent != 'undefined') {
    //for ie
    window.attachEvent('onmessage', onmessage);
}


//应用属性相关
var appInstIdRow;
var statusRow;
var appInstRow;
var entryDatetimeRow;
//var longDescRow;
function showGroup(){
    $('#appProp').propertygrid({
        columns:[[
            { field:'name', title:'Name', width:100, sortable:true },
            {
                field: 'value',
                title: 'Value',
                width: 200
                //formatter: appInstGroupFormater
            }
        ]],
        showGroup: true,
        showHeader:false,
        scrollbarSize: 0
    });

    appInstIdRow = {
        field: 'appID',
        name:'应用实例ID',
        value:'',
        group:'基本信息',
        editor:''
    };
    $('#appProp').propertygrid('appendRow',appInstIdRow);

    statusRow = {
        field: 'depStatus',
        name:'部署状态',
        value:'',
        group:'基本信息',
        editor:''
    };
    $('#appProp').propertygrid('appendRow',statusRow);

    appInstRow = {
        field: 'appInstGroup',
        name:'服务节点',
        value:'',
        group:'基本信息',
        //onClickCell: onClickCell,
        editor:{ 'type': 'combobox',
            options: {
                loader: appInstGroupLoader,
                mode: 'remote',
                valueField:'name',
                textField:'name',
                panelHeight:'auto'
                //onSelect: warehoseSelected,
                //required:true
            }
        }
    };
    $('#appProp').propertygrid('appendRow',appInstRow);

    entryDatetimeRow = {
        field: 'depDt',
        name:'部署时间',
        value:'',
        group:'基本信息',
        editor:''
    };
    $('#appProp').propertygrid('appendRow',entryDatetimeRow);

/*    longDescRow = {
        name:'简介',
        value:'',
        group:'基本信息',
        editor:''
    };
    $('#appProp').propertygrid('appendRow',longDescRow);*/

    runStateRow = {
        field: 'runStatus',
        name:'实时状态',
        value:'良好',
        group:'运行状况',
        editor:''
    };
    $('#appProp').propertygrid('appendRow',runStateRow);

    runStateRow = {
        field: 'online_userNum',
        name:'在线用户数',
        value:'100',
        group:'运行状况',
        editor:''
    };
    $('#appProp').propertygrid('appendRow',runStateRow);

}

var appInstGroupLoader = function(param,success,error){
    var condition = {
        app_id: currentAppRow.obj.d_app_id
    };

    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-app-inst/app-inst-group/get?token=" + window.$token,
        async : true,
        data: JSON.stringify(condition),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            success(data.result);
        },
        error: function (x, e) {
            var args = [];
            args.push(e);
            error.apply(this, args);
        }
    });
}

function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '企业租户列表',
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : false,
        onSelect: onRowSelected,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        }
    });

    $('#appList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '租户已部署应用',
        iconCls : 'icon-a_detail',
        fitColumns : false,
        rownumbers : true,
        singleSelect : true,
        border : false,
        onSelect: onAppSelected,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        },
        toolbar :
            [
                {
                    text : '添加',
                    iconCls : 'icon-add',
                    handler : function() {
                        addApp();
                    }
                },
                {
                    text : '卸载',
                    iconCls : 'icon-remove',
                    handler : function() {
                        deleteApp();
                    }
                },
                {
                    text : '停用',
                    iconCls : 'icon-cancel',
                    handler : function() {
                        appStop();
                    }
                },
                {
                    text: '启用',
                    iconCls : 'icon-ok',
                    handler : function() {
                        appStart();
                    }
                },
                {
                    text: '监控',
                    iconCls : 'icon-filter',
                    handler : function() {
                        computeRepNum();
                    }
                }
            ]
    });

}

function appStop(){
    var appListDg = $('#appList');
    var row = appListDg.datagrid('getSelected');

    var condition = {
        is_platform: row.obj.is_platform,
        acct_id: currentAcctId,
        app_code: row.obj.app_code,
        acct_app_id: row.obj.id,
        app_inst_group: appInstRow.value
    };

    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-app-inst/app-inst-control/stop?token=" + window.$token,
        async : true,
        data: JSON.stringify(condition),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            row.obj.status = 'U';
            statusRow.value = 'U';
            $('#appProp').propertygrid('refreshRow', 1);

            alert_autoClose("提示", "停用成功");
        },
        error: function (x, e) {
            var args = [];
            args.push(e);
            error.apply(this, args);
        }
    });
}

function appStart(){

    var appListDg = $('#appList');
    var row = appListDg.datagrid('getSelected');

    var condition = {
        is_platform: row.obj.is_platform,
        acct_id: currentAcctId,
        app_code: row.obj.app_code,
        acct_app_id: row.obj.id,
        app_inst_group: appInstRow.value
    };


    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-app-inst/app-inst-control/startup?token=" + window.$token,
        async : true,
        data: JSON.stringify(condition),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            row.obj.app_inst_group = appInstRow.value;
            row.obj.status = 'A';
            statusRow.value = 'A';
            $('#appProp').propertygrid('refreshRow', 1);

            alert_autoClose("提示", "启用成功");
        },
        error: function (x, e) {
            var args = [];
            args.push(e);
            error.apply(this, args);
        }
    });
}


function deleteApp(){

    var appListDg = $('#appList');
    var row = appListDg.datagrid('getSelected');
    var index = appListDg.datagrid('getRowIndex', row);

    $.messager.confirm('Confirm','Are you sure?',function(r){
        if (r){
            //$('#tt').datagrid('deleteRow', getRowIndex(target));
            //var  row = appListDg.datagrid('getRows')[index];

            var condition = {
                is_platform: row.obj.is_platform,
                acct_id: currentAcctId,
                app_code: row.obj.app_code,
                acct_app_id: row.obj.id,
                app_inst_group: appInstRow.value
            };

            $.ajax({
                method : 'POST',
                url : $apiRoot + "otocloud-acct/acct-app/delete?token=" + window.$token,
                async : true,
                data: JSON.stringify(condition),
                dataType : 'json',
                beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
                success : function(data) {

                    appListDg.datagrid('deleteRow', index);

                    if(index > 0){
                        appListDg.datagrid('selectRow', index-1);
                    }else{
                        var rows = appListDg.datagrid('getRows');
                        if(rows.length > 0){
                            appListDg.datagrid('selectRow', index+1);
                        }
                    }

                    alert_autoClose("提示", "删除成功");
                },
                error: function (x, e) {
                    var args = [];
                    args.push(e);
                    error.apply(this, args);
                }
            });

        }
    });
}

function addApp(){
    //var currentAcct = window.getCurrentAcctInfo();

    parent.window.postMessage(
        {
            commandName: 'open', //'account-app-add',
            id: 100,
            title: '[' + currentAcctName + ']&nbsp;应用部署',
            url: 'account/app-subscribe/account-app-add.html?acct_id=' + currentAcctId + '&acct_name=' + currentAcctName
        },
        '*');
}


//单元格加提示信息
function formatCellTooltip(value){
    return "<span title='" + value + "'>" + value + "</span>";
}

//绑定列表行数据
function bindDgListData(data){
    var dgLst = $('#dgList');
    var viewModel = new Array();
    for ( var i in data.datas) {
        var dataItem = data.datas[i];
        var row_data = {
            id: dataItem.id,
            acct_code: dataItem.acct_code,
            acct_name: dataItem.acct_name,
            status: dataItem.status,
            entry_datetime: dataItem.entry_datetime,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });
}

//构建分页条件
function buildRepsQueryCond(total, pageNum) {
    var condition = {
        paging: {
            sort_field: "id",
            sort_direction: 1,
            page_number: pageNum,
            page_size: 5,
            total: total,
            total_page: -1
        }
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}
var repCurrentPageIndex = 1;
//加载数据列表
function loadDgList(){

    var condStr = buildRepsQueryCond(0,1);

    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct/account-registry/query?token=" + window.$token,
        async : true,
        data: condStr,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            bindDgListData(data);

            $('#dgList').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh:function(){
                    var thisDg = $('#dgList');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage : function(pPageIndex, pPageSize) {
                        //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                        repCurrentPageIndex = pPageIndex;
                        var gridOpts = $('#dgList').datagrid('options');
                        gridOpts.pageNumber = pPageIndex;
                        gridOpts.pageSize = pPageSize;

                        condStr = buildRepsQueryCond(0, pPageIndex);

                        //定义查询条件
                        $.ajax({
                            method: 'POST',
                            url : $apiRoot + "otocloud-acct/account-registry/query?token=" + window.$token,
                            data: condStr,
                            async: true,
                            dataType: 'json',
                            beforeSend: function (x) {
                                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                            },
                            success: function (data) {
                                bindDgListData(data);
                            },
                            error: function (x, e) {
                                alert(e.toString(), 0, "友好提醒");
                            }
                        });
                    }

            });

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

var currentAppRow;
function onAppSelected (rowIndex, rowData) {
    currentAppRow = rowData;

    refreshAppPropGrid(rowData.obj);

    loadActivity(rowData.obj.id);

    loadBizRoles(rowData.obj.d_app_id);

}

function loadActivity (acct_app_id) {

    var ownerQuery = {
        acct_app_id: acct_app_id
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct/acct-app/activities-get?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                showActList(data);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

function loadBizRoles (appId) {

    var ownerQuery = {
        app_id: appId
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-app-store/app-mgr/app-orgrole-get?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                showBizRoleList(data);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}


function actListSetting() {
    $('#actList').datagrid({
        loadMsg: "正在加载，请稍等...",
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        singleSelect: true,
        border: false,
        detailFormatter: function (index, row) {
            return '<div style="padding:2px"><table class="ddv"></table></div>';
        }
    });
}


function bizRoleListSetting() {
    $('#roleList').datagrid({
        fit: true,
        singleSelect: true,
        border: false,
        view: detailview,
        detailFormatter: function (index, row) {
            return '<div style="padding:2px"><table class="ddv"></table></div>';
        },
        onExpandRow: function (index, row) {
            currentRowIndex = index;
            var ddv = $(this).datagrid('getRowDetail', index).find('table.ddv');
            ddv.datagrid({
                fitColumns: true,
                singleSelect: true,
                rownumbers: true,
                loadMsg: '',
                height: 'auto',
                columns: [[
                    {field: 'id', title: '业务单元ID', width: '70px', align: 'left'},
                    {field: 'unit_code', title: '业务单元代码', width: '100px', align: 'left'},
                    {field: 'unit_name', title: '业务单元名', width: '120xp', align: 'left'},
                    {field: 'unit_manager', title: '业务主管', width: '100px', align: 'left'}
                ]],
                onResize: function () {
                    $('#roleList').datagrid('fixDetailRowHeight', index);
                },
                onLoadSuccess: function () {
                    setTimeout(function () {
                        $('#roleList').datagrid('fixDetailRowHeight', index);
                    }, 0);
                }
            });
            //currentChannelRow = row.obj;
            loadAcctUnitInfos(ddv, currentAcctId, row.obj.org_role_id);
            $('#roleList').datagrid('fixDetailRowHeight', index);
        }
    });
}

function loadAcctUnitInfos(ddv, currentAcctId, org_role_id){
    var ownerQuery = {
        acct_id: currentAcctId,
        org_role_id: org_role_id
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct/bizunit/query-by-orgrole?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                showBizUnitList(ddv, data);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

function showBizUnitList(ddv, data){

    var dgLst = ddv;
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        var row_data = {
            id: dataItem.id,
            unit_code: dataItem.unit_code,
            unit_name: dataItem.unit_name,
            unit_manager: dataItem.unit_manager,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}


function showBizRoleList(data){

    var dgLst = $('#roleList');
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        var row_data = {
            org_role_id: dataItem.org_role_id,
            role_code: dataItem.role_code,
            role_name: dataItem.role_name,
            desc: dataItem.desc,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}



function showActList(data){

    var dgLst = $('#actList');
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        var row_data = {
            activity_code: dataItem.activity_code,
            activity_name: dataItem.activity_name,
            activity_desc: dataItem.activity_desc,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}

//活动删除
function activityActionColumnFormat(value,row,index){
    //var e = '<a href="javascript:void(0)" onclick="editrow(this)">修改</a> ';
    var d = '<a href="javascript:void(0)" onclick="deleteActivity(' + index + ')">删除</a>';
    return d;
}

function deleteActivity(index){

    var appListDg = $('#actList');
    //var row = appListDg.datagrid('getSelected');
    //var index = appListDg.datagrid('getRowIndex', row);

    $.messager.confirm('Confirm','Are you sure?',function(r){
        if (r){
            //$('#tt').datagrid('deleteRow', getRowIndex(target));
            var  row = appListDg.datagrid('getRows')[index];

            var condition = {
                acct_app_activity_id: row.obj.id
            };

            $.ajax({
                method : 'POST',
                url : $apiRoot + "otocloud-acct/acct-app/activity-delete?token=" + window.$token,
                async : true,
                data: JSON.stringify(condition),
                dataType : 'json',
                beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
                success : function(data) {

                    appListDg.datagrid('deleteRow', index);

                    if(index > 0){
                        appListDg.datagrid('selectRow', index-1);
                    }else{
                        var rows = appListDg.datagrid('getRows');
                        if(rows.length > 0){
                            appListDg.datagrid('selectRow', index+1);
                        }
                    }

                    alert_autoClose("提示", "删除成功");
                },
                error: function (x, e) {
                    var args = [];
                    args.push(e);
                    error.apply(this, args);
                }
            });

        }
    });
}


function refreshAppPropGrid(appData){

    appInstIdRow.value = appData.id;
    $('#appProp').propertygrid('refreshRow', 0);

    statusRow.value = appData.status;
    $('#appProp').propertygrid('refreshRow', 1);

    appInstRow.value = appData.app_inst_group;
    $('#appProp').propertygrid('refreshRow', 2);

    entryDatetimeRow.value = appData.entry_datetime;
    $('#appProp').propertygrid('refreshRow', 3);

/*    longDescRow.value = appData.long_desc;
    $('#appProp').propertygrid('refreshRow', 4);*/

}

function clearAppPropGrid(){

    appInstIdRow.value = "";
    $('#appProp').propertygrid('refreshRow', 0);

    statusRow.value = "";
    $('#appProp').propertygrid('refreshRow', 1);

    appInstRow.value = "";
    $('#appProp').propertygrid('refreshRow', 2);

    entryDatetimeRow.value = "";
    $('#appProp').propertygrid('refreshRow', 3);

/*    longDescRow.value = "";
    $('#appProp').propertygrid('refreshRow', 4);*/

}


var currentAcctId;
var currentAcctName;
//行选择事件
var initialized = false;
function onRowSelected (rowIndex, rowData) {
    initialized = true;

    clearAppPropGrid();

    currentAcctId = rowData.obj.id;
    currentAcctName = rowData.obj.acct_name;

    loadAppList(currentAcctId);
}

function loadAppList(acctId){
    var ownerQuery = {
        acct_id: acctId
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct/acct-app/query?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                showAppList(data);
                initialized = false;
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });
}

function showAppList(data){

    var dgLst = $('#appList');
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        var row_data = {
            app_code: dataItem.app_code,
            app_name: dataItem.app_name,
            app_version: dataItem.app_version,
            is_platform: dataItem.is_platform,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}



//排序
function compareDatetime(a,b){
    var oDate1 = new Date(a);
    var oDate2 = new Date(b);
    if(oDate1.getTime() > oDate2.getTime()){
        return 1;
        //alert('第一个大');
    } else if (oDate1.getTime() < oDate2.getTime()){
        return -1;
        //alert('第二个大');
    } else {
        return 0;
        //alert('相等');
    }
}

function compareDigit(a,b){
    if (a == b)
        return 0;
    return (a>b ? 1 : -1);
}
