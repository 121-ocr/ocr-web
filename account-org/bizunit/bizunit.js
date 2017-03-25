
window.$token = localStorage.getItem("access_token");
var acctInfo = window.getCurrentAcctInfo();
var acctId = acctInfo.acct_id;
var acctName = acctInfo.acct_name;


function deployBizUnit(){
    var currentAcct = window.getCurrentAcctInfo();

    parent.window.postMessage(
        {
            commandName: 'open',
            id: 66,
            title: '[' + currentAcct.acct_name + ']&nbsp;应用部署',
            url: 'account-org/bizunit/bizunit-add.html?acct_id=' + currentAcct.acct_id + '&acct_name=' + currentAcct.acct_name
        },
        '*');
}

function editBizUnit(){

    $('#txtbizUnitCode').textbox('setValue',currentBizUnit.unit_code);
    $('#txtbizUnitName').textbox('setValue',currentBizUnit.unit_name);

    $('#bizUnitEditDlg').window('open');  // open a window
}

function updateBizUnit(){
    var unit_code = $('#txtbizUnitCode').val();
    var unit_name = $('#txtbizUnitName').val();

    var bizUnitData = {
        unit_code: unit_code,
        unit_name: unit_name
    };

    var bizUnitId = currentBizUnit.id;

    //定义查询条件
    $.ajax({
        method : 'PUT',
        url : $apiRoot + "otocloud-acct-org/my-bizunit/" + bizUnitId + "?token=" + window.$token,
        async : true,
        data: JSON.stringify(bizUnitData),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                alert_autoClose('提示', '保存成功');

                $('#bizUnitEditDlg').window('close');  // open a window

                currentBizUnit.unit_code = unit_code;
                currentBizUnit.unit_name = unit_name;

                currentBizUnitRow["unit_code"] = unit_code;
                currentBizUnitRow["unit_name"] = unit_name;

                $('#dgList').datagrid('refreshRow', currentBizUnitIndex);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });


}


function deleteBizUnit(){

    $.messager.confirm('Confirm','Are you sure?',function(r){
        if (r){

            $.ajax({
                method : 'DELETE',
                url : $apiRoot + "otocloud-acct-org/my-bizunit/" + currentBizUnit.id + "?token=" + window.$token,
                async : true,
                dataType : 'json',
                beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
                success : function(data) {

                    var bizUnitDg = $('#dgList');

                    bizUnitDg.datagrid('deleteRow', currentBizUnitIndex);

                    if(index > 0){
                        bizUnitDg.datagrid('selectRow', index-1);
                    }else{
                        var rows = bizUnitDg.datagrid('getRows');
                        if(rows.length > 0){
                            bizUnitDg.datagrid('selectRow', index+1);
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




var currentPostActivityList;
var currentPostData;
function addActivityForPost(ddv, data, index){
    currentPostData = data;
    currentPostActivityList = ddv;

    var bizActivityDg = $('#bizActivityDg2');
    bizActivityDg.datagrid('loadData',{
        total: 0,
        rows: []
    });

    var ownerQuery = {
        acct_id: acctId,
        org_role_id: currentBizUnit.org_role_id
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-bizunit/query-activity?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                var rows = currentPostActivityList.datagrid('getRows');

                var viewModel = new Array();
                for ( var i in data.result) {
                    var dataItem = data.result[i];
                    var existData = false;
                    if(rows.length > 0){
                        for ( var i in rows) {
                            var row = rows[i];
                            if(row.obj.d_app_activity_id == dataItem.id){
                                existData = true;
                                break;
                            }
                        }
                    }
                    if(!existData) {
                        var row_data = {
                            app_name: dataItem.app_name,
                            activity_code: dataItem.activity_code,
                            activity_name: dataItem.activity_name,
                            activity_desc: dataItem.activity_desc,
                            obj: dataItem
                        };
                        viewModel.push(row_data);
                    }
                }

                bizActivityDg.datagrid('loadData',{
                    total: data.total,
                    rows: viewModel
                });
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

    $('#bizActivityDlg').window('open');  // open a window

}


function deployActivityForPost(){
    var appActivityRows = $('#bizActivityDg2').datagrid('getSelections');

    var postData = {
        acct_id: acctId,
        acct_biz_unit_post_id: currentPostData.id,
        post_activity: []
    };

    var temp = [];
    for ( var i in appActivityRows) {
        var dataItem = appActivityRows[i].obj;
        postData.post_activity.push({
            acct_app_activity_id: dataItem.acct_app_activity_id,
            d_app_id: dataItem.app_id,
            d_acct_app_id:dataItem.acct_app_id,
            d_app_activity_id: dataItem.id,
            d_app_activity_code: dataItem.activity_code
        });

        var row_data = {
            d_app_activity_id: dataItem.id,
            activity_code: dataItem.activity_code,
            activity_name: dataItem.activity_name,
            activity_desc: dataItem.activity_desc
        };
        temp.push(row_data);
        //currentActivityDDV.datagrid('appendRow',row_data);
    }

    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-bizunit-post/activity-create?token=" + window.$token,
        async : true,
        data: JSON.stringify(postData),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                for ( var i in temp) {
                    var dataItem = temp[i];
                    var row_data = {
                        activity_code: dataItem.activity_code,
                        activity_name: dataItem.activity_name,
                        activity_desc: dataItem.activity_desc,
                        //auth_roles: dataItem.auth_roles,
                        obj: dataItem
                    };
                    currentPostActivityList.datagrid('appendRow',row_data);
                }

                alert_autoClose('提示', '成功');

                $('#bizActivityDlg').window('close');  // open a window
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });


}


function loadPostActivity (ddv, data, index) {

     if(data.id == undefined || data.id == null){
        return;
     }

     var ownerQuery = {
         acct_biz_unit_post_id: data.id
     };
     var ownerQueryData = JSON.stringify(ownerQuery);
     //定义查询条件
     $.ajax({
     method : 'POST',
     url : $apiRoot + "otocloud-acct-org/my-bizunit-post/activity-query?token=" + window.$token,
     async : true,
     data: ownerQueryData,
     dataType : 'json',
     beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
         success : function(retData) {
             if (retData.errCode != undefined && retData.errCode != null) {
                alert_autoClose('提示', '错误码：' + retData.errCode + '，原因：' + retData.errMsg);
             } else {
                 showActList(ddv, retData);
                $('#postList').datagrid('fixDetailRowHeight',index);
             }
         },
         error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
         }
     });

}



function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '业务单元',
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
        onSelect: onBizUnitSelected,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        }
    });

    $('#postList').datagrid({
        loadMsg: "正在加载，请稍等...",
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
        //onClickCell: onClickCell,
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
                singleSelect:true,
                rownumbers:true,
                loadMsg:'',
                height:'auto',
                //onBeforeSelect: onShipmentBeforeSelect,
                //onSelect: showShipmentDetail,  //仓库行选择事件
                columns:[[
                    {field:'ck',checkbox:true},
                    {field:'activity_code',title:'业务活动代码',width:'100px'},
                    {field:'activity_name',title:'业务活动名',width:'100px'},
                    {field:'activity_desc',title:'业务活动描述',width:'120px'}
                ]],
                toolbar :
                    [
                        {
                            text : '[ 业务活动 ] '
                        },
                        {
                            text : '添加',
                            iconCls : 'icon-add',
                            handler : function() {
                                addActivityForPost(ddv, row.obj, index);
                            }
                        },
                        {
                            text : '删除',
                            iconCls : 'icon-remove',
                            handler : function() {
                                deleteActivity(ddv, row.obj, index);
                            }
                        }
                    ],
                onResize:function(){
                    $('#postList').datagrid('fixDetailRowHeight',index);
                },
                onLoadSuccess:function(){
                    setTimeout(function(){
                        $('#postList').datagrid('fixDetailRowHeight',index);
                    },0);
                }
            });
            //currentReplenishment = row.obj;
            loadPostActivity(ddv, row.obj, index);
            //shipmentDg = ddv;
        },
        toolbar :
            [
                {
                    text : '增加岗位',
                    iconCls : 'icon-add',
                    handler : function() {
                        addPost();
                    }
                }
            ]

    });

    $('#bizActivityDg').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '选择业务功能',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : false,
        singleSelect : false,
        border : true,
        groupField: 'app_name',
        view: groupview,
        groupFormatter:function(value, rows){
            return value + ' - (' + rows.length + ')';
        }
    });

    $('#bizActivityDg2').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '选择业务活动',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : false,
        singleSelect : false,
        border : true,
        groupField: 'app_name',
        view: groupview,
        groupFormatter:function(value, rows){
            return value + ' - (' + rows.length + ')';
        }
    });
}

function deleteActivity(ddv, obj, index) {

    var row = ddv.datagrid('getSelected');
    var actIndex = ddv.datagrid('getRowIndex', row);

    $.messager.confirm('Confirm','Are you sure?',function(r){
        if (r){
             var postActId = row.obj.id;

            var postData={
                post_id: obj.id,
                post_activity_id: postActId
            }

            $.ajax({
                method : 'POST',
                url : $apiRoot + "otocloud-acct-org/my-bizunit-post/delete-activity?token=" + window.$token,
                async : true,
                data: JSON.stringify(postData),
                dataType : 'json',
                beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
                success : function(data) {

                    ddv.datagrid('deleteRow', actIndex);

                    if(actIndex > 0){
                        ddv.datagrid('selectRow', actIndex-1);
                    }else{
                        var rows = ddv.datagrid('getRows');
                        if(rows.length > 0){
                            ddv.datagrid('selectRow', actIndex+1);
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


function addPost(){

    var ownerQuery = {
        acct_id: acctId,
        org_role_id: currentBizUnit.org_role_id
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-bizunit/query-activity?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                var bizActivityDg = $('#bizActivityDg');
                var viewModel = new Array();
                for ( var i in data.result) {
                    var dataItem = data.result[i];
                    var row_data = {
                        app_name: dataItem.app_name,
                        activity_code: dataItem.activity_code,
                        activity_name: dataItem.activity_name,
                        activity_desc: dataItem.activity_desc,
                        obj: dataItem
                    };
                    viewModel.push(row_data);
                }

                bizActivityDg.datagrid('loadData',{
                    total: data.total,
                    rows: viewModel
                });
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

    $('#newPostDlg').window('open');  // open a window

}

function insertNewPost(){

    var appActivityRows = $('#bizActivityDg').datagrid('getSelections');

    var postData = {
        post_code: $('#txtPostCode').val(),
        post_name: $('#txtPostName').val(),
        d_org_role_id: currentBizUnit.org_role_id,
        acct_biz_unit_id: currentBizUnit.id,
        acct_id: acctId,
        post_activity: []
    };

    for ( var i in appActivityRows) {
        var dataItem = appActivityRows[i].obj;
        postData.post_activity.push({
            acct_app_activity_id: dataItem.acct_app_activity_id,
            d_app_id: dataItem.app_id,
            d_acct_app_id:dataItem.acct_app_id,
            d_app_activity_id: dataItem.id,
            d_app_activity_code: dataItem.activity_code
        });
    }

    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-bizunit-post/create?token=" + window.$token,
        async : true,
        data: JSON.stringify(postData),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                postData.id = data.id;
                var rowData = {
                    post_code: postData.post_code,
                    post_name: postData.post_name,
                    obj: postData
                };
                $('#postList').datagrid('appendRow',rowData);

                $('#newPostDlg').window('close');  // open a window

                alert_autoClose('提示', '成功');
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

//岗位操作按钮
function postActionColumnFormat(value,row,index){
    var e = '<a href="javascript:void(0)" onclick="editPost(' + index + ')">修改</a> ';
    var d = '<a href="javascript:void(0)" onclick="deletePost(' + index + ')">删除</a>';
    return e+d;
}

var currentPostRow;
var currentPostIndex;
function editPost(index){
    var postList = $('#postList');
    var  row = postList.datagrid('getRows')[index];

    currentPostRow = row;
    currentPostIndex = index;

    $('#txtPostCode2').textbox('setValue',row.obj.post_code);
    $('#txtPostName2').textbox('setValue',row.obj.post_name);

    $('#postEditDlg').window('open');  // open a window
}

function updatePost(){

    var postId = currentPostRow.obj.id;
    var post_code = $('#txtPostCode2').val();
    var post_name = $('#txtPostName2').val();

    var postData = {
        post_code: post_code,
        post_name: post_name
    };

    //定义查询条件
    $.ajax({
        method : 'PUT',
        url : $apiRoot + "otocloud-acct-org/my-bizunit-post/" + postId + "?token=" + window.$token,
        async : true,
        data: JSON.stringify(postData),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                alert_autoClose('提示', '保存成功');

                $('#postEditDlg').window('close');  // open a window

                currentPostRow.obj.post_code = post_code;
                currentPostRow.obj.post_name = post_name;

                currentPostRow["post_code"] = post_code;
                currentPostRow["post_name"] = post_name;

                $('#postList').datagrid('refreshRow', currentPostIndex);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });


}

function deletePost(index){

    var postList = $('#postList');

    $.messager.confirm('Confirm','Are you sure?',function(r){
        if (r){
            var  row = postList.datagrid('getRows')[index];
            var postId = row.obj.id;

            $.ajax({
                method : 'DELETE',
                url : $apiRoot + "otocloud-acct-org/my-bizunit-post/" + postId + "?token=" + window.$token,
                async : true,
                dataType : 'json',
                beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
                success : function(data) {

                    postList.datagrid('deleteRow', index);

                    //刷新索引，触发formater事件
                    var rows = postList.datagrid('getRows');
                    if(rows != null && rows.length > 0){
                        var i = rows.length - 1;
                        while(i>=0){
                            postList.datagrid('refreshRow',i);
                            i = i - 1;
                            if(i < index){
                                break;
                            }
                        }
                    }

/*                    if(index > 0){
                        postList.datagrid('selectRow', index-1);
                    }else{
                        var rows = postList.datagrid('getRows');
                        if(rows.length > 0){
                            postList.datagrid('selectRow', index+1);
                        }
                    }*/

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
            unit_code: dataItem.unit_code,
            unit_name: dataItem.unit_name,
            unit_manager: dataItem.unit_manager,
            role_name: dataItem.role_name,
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
        url : $apiRoot + "otocloud-acct-org/my-bizunit/query?token=" + window.$token,
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

var currentBizUnit;
var currentBizUnitRow;
var currentBizUnitIndex;
function onBizUnitSelected (rowIndex, rowData) {
    currentBizUnitIndex = rowIndex;
    currentBizUnitRow = rowData;
    currentBizUnit = rowData.obj;
    loadPosts(rowData.obj.id);

}

var appActivitiesGrid;
function loadActivity (ddv, appInfo, index) {
    appActivitiesGrid = ddv;
    var ownerQuery = {
        app_id: appInfo.id,
        load_auth_roles: true
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-app-store/activity-mgr/get?token=" + window.$token,
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

function showPostList(data){

    var dgLst = $('#postList');
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        var row_data = {
            post_code: dataItem.post_code,
            post_name: dataItem.post_name,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}

function loadPosts (acct_biz_unit_id) {

    var ownerQuery = {
        acct_biz_unit_id: acct_biz_unit_id
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-bizunit-post/query?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                showPostList(data);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
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
            //auth_roles: dataItem.auth_roles,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}



