
//子表行状态
var editIndex = undefined;

window.$token = localStorage.getItem("access_token");
var acctId = parseInt(window.getQueryString("acct_id"));
var acctName = window.getQueryString("acct_name");

var app;
var orgRolesRows;
//var appActivityRows;


function saveBizUnits(){
    var bizUnitDg = $('#bizUnitDg');
    var rows = bizUnitDg.datagrid('getRows');
    if(rows.length > 0){
        var bizUnits = [];
         for(var i=0; i<rows.length; i++) {
             var dataItem = rows[i].obj;
             if(dataItem.bizUnits != undefined && dataItem.bizUnits != null && dataItem.bizUnits.length > 0){
                 for(var i=0; i<dataItem.bizUnits.length; i++) {
                     var bizUnit = dataItem.bizUnits[i];
                     bizUnit.org_role_id = dataItem.org_role_id;
                     bizUnit.acct_id = acctId;
                     bizUnits.push(bizUnit);
                 }

             }
         }

        if(bizUnits.length > 0){

            //定义查询条件
            $.ajax({
                method : 'POST',
                url : $apiRoot + "otocloud-acct-org/my-bizunit/create?token=" + window.$token,
                async : true,
                data: JSON.stringify(bizUnits),
                dataType : 'json',
                beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
                success : function(data) {
                    if (data.errCode != undefined && data.errCode != null) {
                        alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
                    } else {
                        //alert_autoClose('提示', '成功');

                        $('#deployBizUnitDlg').window('close');  // open a window

                        var currentAcct = window.getCurrentAcctInfo();

                        parent.window.postMessage(
                            {
                                commandName: 'open', //'account-app-add',
                                id: 81,
                                title: '业务单元',
                                url: 'account-org/bizunit/bizunit.html?acct_id=' + currentAcct.acct_id + '&acct_name=' + currentAcct.acct_name
                            },
                            '*');


                    }
                },
                error: function (x, e) {
                    alert(e.toString(), 0, "友好提醒");
                }
            });

        }else{
            alert_autoClose('提示', '必须至少部署一个业务单元。');
        }

    }

}

function deployBizUnit(){
    var appRow = $('#dgList').datagrid('getSelected');
    if(appRow == null){
        alert_autoClose('提示', '请选择一个应用进行部署.');
        return;
    }

    app = appRow.obj;
    //appActivityRows = appActivitiesGrid.datagrid('getSelections');

    orgRolesRows = $('#roleList').datagrid('getSelections');
    if(orgRolesRows == null || orgRolesRows.length <= 0){
        alert_autoClose('提示', '请选择至少一个业务职能进行部署.');
        return;
    }

    $('#deployBizUnitDlg').window('open');  // open a window

    $('#depAppLab').html("<span> 为租户[&nbsp;" + acctName + "&nbsp;]订购的应用:[&nbsp;" + appRow.obj.app_name + "-" +  appRow.obj.app_code  + "&nbsp;] &nbsp;部署业务单元</span>");

    var bizUnitDg = $('#bizUnitDg');
    var viewModel = new Array();
    for(var i=0; i<orgRolesRows.length; i++){
        var dataItem = orgRolesRows[i].obj;
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
    bizUnitDg.datagrid('loadData',{
        total: viewModel.length,
        rows: viewModel
    });

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
        singleSelect : true,
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
                columns:[[
                    /*{field:'ck',checkbox:true},*/
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

        $('#bizUnitDg').datagrid({
            loadMsg: "正在加载，请稍等...",
            title : '业务职能列表',
            iconCls : 'icon-a_detail',
            fit : true,
            fitColumns : false,
            remoteSort: false,
            rownumbers : true,
            pagination : false,
            singleSelect : true,
            border : true,
            //onBeforeSelect: onBeforeSelect,
            //onSelect: onAppSelected,  //行选择事件
            autoUpdateDetail: true,
            view: detailview,
            onLoadSuccess: function (data) {
                if (data.total > 0) {
                    var dg = $(this);
                    dg.datagrid('selectRow', 0);
                    //$('#gridleft').datagrid('selectRow', 0);
                }
            },
            detailFormatter:function(index,row){
                return '<div style="padding:2px"><table class="ddv"></table></div>';
            },
            onExpandRow: function(index,row){
                currentRowIndex = index;
                var ddv = $(this).datagrid('getRowDetail',index).find('table.ddv');
                ddv.datagrid({
                    fitColumns:true,
                    singleSelect:true,
                    rownumbers:true,
                    idField:'unit_code',
                    loadMsg:'',
                    height:'auto',
                    onClickCell: onClickCell,
                    columns:[[
                        {field:'unit_code',title:'业务单元编码',width:'100px',editor:'unitCodeEditor'},
                        {field:'unit_name',title:'业务单元名称',width:'150px',editor:'unitNameEditor'},
                        {field:'is_global',title:'是否全局业务单元',width:'90px',editor:'isGlobalcheckbox'}
                    ]],
                    onResize:function(){
                        $('#bizUnitDg').datagrid('fixDetailRowHeight',index);
                    },
                    onLoadSuccess:function(row,data){
                        setTimeout(function(){
                            $('#bizUnitDg').datagrid('fixDetailRowHeight',index);
                        },0);

                    },
                    toolbar :
                        [
                            {
                                text : '[ 业务单元 ] '
                            },
                            {
                                text: '添加新业务单元',
                                iconCls : 'icon-add',
                                handler : function() {
                                    appendBizUnit(ddv,index);
                                }
                            },
                            {
                                text: '删除',
                                iconCls : 'icon-remove',
                                handler : function() {
                                    removeBizUnit(ddv, index);
                                }
                            }
                        ]
                });
                currentOrgRoleInfoRow = row;
                loadBizUnitInfos(ddv, row.obj);
                $('#bizUnitDg').datagrid('fixDetailRowHeight',index);
                //$('#bizUnitDg').datagrid('fixDetailRowHeight',index);
            }
        });


    }


function removeBizUnit(ddv, pIndex){
    subGrid = ddv;

    var row = $(ddv).datagrid('getSelected');
    if(row == null) return;

    var index = $(ddv).datagrid('getRowIndex', row);

    var orgRoleObj = getOrgRoleObj(pIndex);

    if(orgRoleObj.bizUnits != undefined) {
        removeByValue(orgRoleObj.bizUnits, row.obj);
    }else{
    }

    $(ddv).datagrid('cancelEdit', index)
        .datagrid('deleteRow', index);

    if(index > 0){
        $(ddv).datagrid('selectRow', index-1);
    }else{
        var rows = $(ddv).datagrid('getRows');
        if(rows.length > 0){
            $(ddv).datagrid('selectRow', index+1);
        }
    }

    $('#detailDg').datagrid('fixDetailRowHeight',pIndex);
}

function getOrgRoleObj(index){
    var parentDg = $('#bizUnitDg');
    var parentRows = parentDg.datagrid('getRows');
    return parentRows[index].obj;
}

var currentOrgRoleInfoRow;

function showBizUnitList(ddv, data){

    var dgLst = ddv;
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        var row_data = {
            id: dataItem.id,
            unit_code: dataItem.unit_code,
            unit_name: dataItem.unit_name,
            //unit_manager: dataItem.unit_manager,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}


$.extend($.fn.datagrid.methods, {
    editCell: function(jq,param){
        return jq.each(function(){
            var opts = $(this).datagrid('options');
            var fields = $(this).datagrid('getColumnFields',true).concat($(this).datagrid('getColumnFields'));
            for(var i=0; i<fields.length; i++){
                var col = $(this).datagrid('getColumnOption', fields[i]);
                col.editor1 = col.editor;
                if (fields[i] != param.field){
                    col.editor = null;
                }
            }
            $(this).datagrid('beginEdit', param.index);
            for(var i=0; i<fields.length; i++){
                var col = $(this).datagrid('getColumnOption', fields[i]);
                col.editor = col.editor1;
            }
        });
    }
});

function endEditing(ddv){
    if (editIndex == undefined){return true}
    if ($(ddv).datagrid('validateRow', editIndex)){
        $(ddv).datagrid('endEdit', editIndex);
        editIndex = undefined;
        return true;
    } else {
        return false;
    }
}

var subGrid = undefined;
function onClickCell(index, field){
    var ddv = this;
    subGrid = ddv;

    var rows = $(ddv).datagrid('getRows');
    if(rows[index].obj.is_shipped){
        editIndex = index;
        return;
    }

    if (endEditing(ddv)){
        var row = $(ddv).datagrid('selectRow', index);
        var editor = $(row).datagrid('editCell', {index:index,field:field} );
        editIndex = index;
    }
}

function appendBizUnit(ddv, index){

    subGrid = ddv;

    if (endEditing(ddv)){

        var bizUnit = {
            org_role_id: currentOrgRoleInfoRow.obj.org_role_id,
            unit_code: "",
            unit_name: "",
            is_global: true
            //unit_manager: ""
        };

        var bizUnits = [];
        if(currentOrgRoleInfoRow.obj.bizUnits != undefined) {
            bizUnits = currentOrgRoleInfoRow.obj.bizUnits;
        }else{
            currentOrgRoleInfoRow.obj.bizUnits = [];
            currentOrgRoleInfoRow.obj.bizUnits = bizUnits;
        }
        bizUnits.push(bizUnit);

        var rowData = {
            unit_code: "",
            unit_name: "",
            is_global: true,
            //unit_manager: "",
            obj: bizUnit
        };

        $(ddv).datagrid('appendRow',rowData);

        //必须加入到originalRows中，否则翻页会有问题
        //var data = $("#detailDg").datagrid('getData');
        //data.originalRows.push(rowData);

        editIndex = $(ddv).datagrid('getRows').length-1;
        $(ddv).datagrid('selectRow', editIndex)
            .datagrid('beginEdit', editIndex);

        $('#bizUnitDg').datagrid('fixDetailRowHeight',index);

    }
}


var newbizUnits;
function loadBizUnitInfos (ddv, orgRoleInfo) {
    newbizUnits = orgRoleInfo.bizUnits;
    if(orgRoleInfo.bizUnits != undefined && orgRoleInfo.bizUnits != null) {
        var viewModel = new Array();
        for (var i in orgRoleInfo.bizUnits) {
            var dataItem = orgRoleInfo.bizUnits[i];
            var row_data = {
                unit_code: dataItem.unit_code,
                unit_name: dataItem.unit_name,
                unit_manager: dataItem.unit_manager,
                obj: dataItem
            };
            viewModel.push(row_data);
        }
        ddv.datagrid('loadData', {
            total: viewModel.length,
            rows: viewModel
        });
    }

}


$.extend($.fn.datagrid.defaults.editors, {
    unitManagerEditor : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' style='width:100px' onchange='unitManagerChanged(this);'>");
            editorContainer.append(input)
            editorContainer.appendTo(container);
            return input;
        },
        getValue: function(target)
        {
            return $(target).val();
            //return $(target).children("input").val();
        },
        setValue: function(target, value)
        {
            $(target).val(value).focus().select();

            //$(target).children("input").val(value);
        },
        resize: function(target, width)
        {
            var span = $(target);
            if ($.boxModel == true){
                span.width(width - (span.outerWidth() - span.width()) - 5);
            } else {
                span.width(width - 5);
            }
        }

    }
});

function unitManagerChanged(theInput){
    var value = theInput.value;
    if(value == ""){
        return;
    }

    if(editIndex != undefined && editIndex != null) {
        var rows = $(subGrid).datagrid('getRows');
        var row = rows[editIndex];

        row['unit_manager'] = value;
        row.obj.unit_manager = value;

        $(subGrid).datagrid('refreshRow', editIndex);
    }
}




$.extend($.fn.datagrid.defaults.editors, {
    unitNameEditor : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' style='width:100px' onchange='unitNameChanged(this);'>");
            editorContainer.append(input)
            editorContainer.appendTo(container);
            return input;
        },
        getValue: function(target)
        {
            return $(target).val();
            //return $(target).children("input").val();
        },
        setValue: function(target, value)
        {
            $(target).val(value).focus().select();

            //$(target).children("input").val(value);
        },
        resize: function(target, width)
        {
            var span = $(target);
            if ($.boxModel == true){
                span.width(width - (span.outerWidth() - span.width()) - 5);
            } else {
                span.width(width - 5);
            }
        }

    }
});

function unitNameChanged(theInput){
    var value = theInput.value;
    if(value == ""){
        return;
    }

    if(editIndex != undefined && editIndex != null) {
        var rows = $(subGrid).datagrid('getRows');
        var row = rows[editIndex];

        row['unit_name'] = value;
        row.obj.unit_name = value;

        $(subGrid).datagrid('refreshRow', editIndex);
    }
}


$.extend($.fn.datagrid.defaults.editors,
{
    isGlobalcheckbox:
    {
        init: function (container, options) {
            var input = $('<input type="checkbox" onclick="isGlobalClick(this);">').appendTo(container);
            return input;
        },
        getValue: function (target) {
            return $(target).prop('checked');
        },
        setValue: function (target, value) {
            $(target).prop('checked', value);
        }
    }
});

function isGlobalClick(theInput){
    var value = theInput.checked;

    if(editIndex != undefined && editIndex != null) {
        var rows = $(subGrid).datagrid('getRows');
        var row = rows[editIndex];

        row['is_global'] = value;
        row.obj.is_global = value;

       // $(subGrid).datagrid('refreshRow', editIndex);
    }
}

$.extend($.fn.datagrid.defaults.editors, {
    unitCodeEditor : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' style='width:100px' onchange='unitCodeChanged(this);'>");
            editorContainer.append(input)
            editorContainer.appendTo(container);
            return input;
        },
        getValue: function(target)
        {
            return $(target).val();
            //return $(target).children("input").val();
        },
        setValue: function(target, value)
        {
            $(target).val(value).focus().select();

            //$(target).children("input").val(value);
        },
        resize: function(target, width)
        {
            var span = $(target);
            if ($.boxModel == true){
                span.width(width - (span.outerWidth() - span.width()) - 5);
            } else {
                span.width(width - 5);
            }
        }

    }
});

function unitCodeChanged(theInput){
    var value = theInput.value;
    if(value == ""){
        return;
    }

    if(editIndex != undefined && editIndex != null) {
        var rows = $(subGrid).datagrid('getRows');
        var row = rows[editIndex];

        row['unit_code'] = value;
        row.obj.unit_code = value;

        $(subGrid).datagrid('refreshRow', editIndex);
    }
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
            id: dataItem.d_app_id,
            code: dataItem.app_code,
            name: dataItem.app_name,
            app_version: dataItem.app_version,
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
        url : $apiRoot + "otocloud-acct-org/my-app-subscribe/query?token=" + window.$token,
        async : true,
        data: condStr,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            bindDgListData(data);

 /*           $('#dgList').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh:function(){
                    var thisDg = $('#dgList');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage : function(pPageIndex, pPageSize) {
                    if(isNewBO){
                        if(repCurrentPageIndex != pPageIndex) {
                            $('#dgList').datagrid('getPager').pagination('select', repCurrentPageIndex);
                            $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
                        }
                        return;
                    }else {
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
                }
            });*/

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

function onAppSelected (rowIndex, rowData) {

    loadBizRoles(rowData.obj.d_app_id);

}

var appActivitiesGrid;
function loadActivity (ddv, appInfo, index) {
    appActivitiesGrid = ddv;
    var ownerQuery = {
        acct_app_id: appInfo.id,
        load_auth_roles: true
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-app-subscribe/activities-get?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                showActList(ddv, data);
                $('#dgList').datagrid('fixDetailRowHeight',index);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

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



function showActList(dgLst, data){

    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
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


function removeByValue(arr, val) {
    for(var i=0; i<arr.length; i++){
        if(arr[i] == val){
            arr.splice(i, 1);
            break;
        }
    }
}