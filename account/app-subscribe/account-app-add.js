//﻿var BOObjIndex;
var BOObj;

//clone的数据
var cloneBOObj;
var currentDetailRowObj;

//主子表状态
var isMgrChanged = false;
var isAccountChanged = false;
var isNewBO = false;

//子表行状态
var editIndex = undefined;

window.$token = localStorage.getItem("access_token");
var acctId = parseInt(window.getQueryString("acct_id"));
var acctName = window.getQueryString("acct_name");

var app;
var orgRolesRows;
var appActivityRows;

function deployApp(){

    var appRows = $('#dgList').datagrid('getSelections');

    var subscribeInfos = [];
    for ( var i in appRows) {
        var appInfo = appRows[i].obj;
        if(appInfo.activities != null && appInfo.activities.length > 0){
            var appSubcribeInfo = {
                acct_id: acctId,
                d_app_id: appInfo.id,
                app_version_id: appInfo.app_version_id,
                d_app_version: appInfo.app_version,
                is_platform: appInfo.is_platform,
                app_inst_group: "",
                activities: []
            };
            for ( var i in appInfo.activities) {
                var activityInfo = appInfo.activities[i];
                if(activityInfo.isChecked != undefined && activityInfo.isChecked) {
                    appSubcribeInfo.activities.push({
                        app_activity_id: activityInfo.id
                    });
                }
            }
            subscribeInfos.push(appSubcribeInfo);
        }

    }


    if(subscribeInfos.length > 0){

        //定义查询条件
        $.ajax({
            method : 'POST',
            url : $apiRoot + "otocloud-acct/acct-app/create?token=" + window.$token,
            async : true,
            data: JSON.stringify(subscribeInfos),
            dataType : 'json',
            beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
            success : function(data) {
                if (data.errCode != undefined && data.errCode != null) {
                    alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
                } else {
                    alert_autoClose('提示', '应用添加成功');

                    var dgLst = $('#dgList');
                    var viewModel = new Array();
                    dgLst.datagrid('loadData',{
                        total: 0,
                        rows: viewModel
                    });

                    //通知应用订购iframe页面刷新应用列表
                    var accountAppIFrm = parent.window.document.getElementsByTagName('iframe')["frm_72"];
                    accountAppIFrm.contentWindow.postMessage(
                        {
                            commandName: 'refresh_applist',
                            acct_id: acctId
                        },
                        '*');

                    //刷新页面
                    loadDgList();


                }
            },
            error: function (x, e) {
                alert(e.toString(), 0, "友好提醒");
            }
        });

    }else{
        alert_autoClose('提示', '必须至少选择一个应用。');
    }
}

function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '应用列表',
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : false,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : false,
        border : false,
        //onBeforeSelect: onBeforeSelect,
        onSelect: onAppSelected,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        },
        view: detailview,
        detailFormatter:function(index,row){
            return '<div style="padding:2px"><table class="ddv"></table></div>';
        },
        onExpandRow: function(index,row){
            var ddv = $(this).datagrid('getRowDetail',index).find('table.ddv');
            ddv.datagrid({
                fitColumns:true,
                singleSelect:false,
                rownumbers:true,
                loadMsg:'',
                height:'auto',
                //onBeforeSelect: onShipmentBeforeSelect,
                //onSelect: showShipmentDetail,  //仓库行选择事件
                onCheck: onAppCheck,
                onUncheck: onAppUncheck,
                columns:[[
                    {field:'ck',checkbox:true},
                    {field:'activity_code',title:'业务活动代码',width:'100px'},
                    {field:'activity_name',title:'业务活动名',width:'100px'},
                    {field:'activity_desc',title:'业务活动描述',width:'120px'},
                    {field:'auth_roles',title:'业务角色',width:'120px',align:'left', formatter:formatAuthRolesHandle }
                ]],
                toolbar :
                    [
                        {
                            text : '[ 业务活动 ] '
                        }
                    ],
                onResize:function(){
                    $('#dgList').datagrid('fixDetailRowHeight',index);
                },
                onLoadSuccess:function(){
                    setTimeout(function(){
                        $('#dgList').datagrid('fixDetailRowHeight',index);
                    },0);
                }
            });
            //currentReplenishment = row.obj;
            loadActivity(ddv, row.obj, index);
            //shipmentDg = ddv;
        }

    });

}


function formatAuthRolesHandle(value){
    if(value == undefined) return "";

    var html = '<table border="0.5" cellpadding="0" cellspacing="0" style="width:100%">' +
        '<tr style="height: 14px; background-color: #EAEDF1">' +
            '<td style="text-align: center">ID</td>' +
            '<td style="text-align: center">角色名</td>' +
            //'<td style="text-align: center">角色类型</td>' +
        '</tr>';

    for(var i in value) {
        var authRole = value[i];

        html += '<tr style="height: 16px; background-color: ivory">' +
            '<td style="text-align: center">' + authRole.auth_role_id + '</td>' +
            '<td style="text-align: center">' + authRole.role_name + '</td>' +
            //'<td style="text-align: center">' + authRole.role_type_code + '</td>' +
        '</tr>';
    }

    html += '</table>';

    return html;
}


function formatAuthRolesForOrgRole(value){
    if(value == undefined) return "";

    var html = '<table border="0.5" cellpadding="0" cellspacing="0" style="width:100%">' +
        '<tr style="height: 14px; background-color: #EAEDF1">' +
        '<td style="text-align: center">ID</td>' +
        '<td style="text-align: center">角色名</td>' +
        '<td style="text-align: center">角色类型</td>' +
        '</tr>';

    for(var i in value) {
        var authRole = value[i];

        html += '<tr style="height: 16px; background-color: ivory">' +
            '<td style="text-align: center">' + authRole.id + '</td>' +
            '<td style="text-align: center">' + authRole.role_name + '</td>' +
            '<td style="text-align: center">' + authRole.role_type_code + '</td>' +
            '</tr>';
    }

    html += '</table>';

    return html;
}

//单元格加提示信息
function formatCellTooltip(value){
    return "<span title='" + value + "'>" + value + "</span>";
}

//绑定列表行数据
function bindDgListData(data){
    var dgLst = $('#dgList');
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        var row_data = {
            id: dataItem.id,
            code: dataItem.code,
            name: dataItem.name,
            app_version: dataItem.app_version,
            is_platform: dataItem.is_platform,
            short_desc: dataItem.short_desc,
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
function buildRepsQueryCond() {
    var condition = {
        acct_id: acctId
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}
//var repCurrentPageIndex = 1;
//加载数据列表
function loadDgList(){

    var condStr = buildRepsQueryCond();

    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct/acct-app/new-applist-query?token=" + window.$token,
        async : true,
        data: condStr,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            bindDgListData(data);
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

function onAppSelected (rowIndex, rowData) {

    loadBizRoles(rowData.obj.id);

}

function onAppCheck(index,row){
    if(row.obj != undefined){
        row.obj.isChecked = true;
    }
}

function onAppUncheck(index,row){
    if(row.obj != undefined){
        row.obj.isChecked = false;
    }
}

var appActivitiesGrid;
function loadActivity (ddv, appInfo, index) {
    if(appInfo.activities != undefined && appInfo.activities.length > 0){
        showActList(ddv, appInfo.activities);
        $('#dgList').datagrid('fixDetailRowHeight',index);
        return;
    }

    appActivitiesGrid = ddv;
    var ownerQuery = {
        app_id: appInfo.id,
        acct_id: acctId,
        load_auth_roles: true
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-app-store/activity-mgr/get-unsubscribe?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                appInfo.activities = data.result;
                showActList(ddv, data.result);
                $('#dgList').datagrid('fixDetailRowHeight',index);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

function showActList(dgLst, data){

    var selectedIndexs = [];

    var viewModel = new Array();
    for ( var i in data) {
        var dataItem = data[i];
        if(dataItem.isChecked != undefined &&　dataItem.isChecked){
            selectedIndexs.push(i);
        }
        var row_data = {
            activity_code: dataItem.activity_code,
            activity_name: dataItem.activity_name,
            activity_desc: dataItem.activity_desc,
            auth_roles: dataItem.auth_roles,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

    for ( var i in selectedIndexs) {
        var selectedIndex = selectedIndexs[i];
        dgLst.datagrid('checkRow',selectedIndex);
    }
}


function loadBizRoles (appId) {

    var ownerQuery = {
        app_id: appId,
        load_auth_roles: true
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


function bizRoleListSetting() {
    $('#roleList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '业务职能',
        fit: true,
        singleSelect : false,
        border : false,
        //onBeforeSelect: onBeforeSelect,
        //onSelect: onRowSelected,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        }
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
            auth_roles: dataItem.auth_roles,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}

