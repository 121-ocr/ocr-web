
window.$token = localStorage.getItem("access_token");
var acctInfo = window.getCurrentAcctInfo();
var acctId = acctInfo.acct_id;
var acctName = acctInfo.acct_name;

function loadPostForUser (ddv, data, index) {

    if(data.id == undefined || data.id == null){
        return;
    }

    var ownerQuery = {
        user_id: data.id
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-user/query-post?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(retData) {
            if (retData.errCode != undefined && retData.errCode != null) {
                alert_autoClose('提示', '错误码：' + retData.errCode + '，原因：' + retData.errMsg);
            } else {
                showPostList(ddv, retData);
                $('#userList').datagrid('fixDetailRowHeight',index);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

function showPostList(ddv, data){

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
    ddv.datagrid('loadData',{
        total: data.total,
        rows: viewModel
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

    $('#userList').datagrid({
        loadMsg: "正在加载，请稍等...",
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
        onClickRow: userListOnClickRow,
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
                    {field:'post_code',title:'岗位编码',width:'100px'},
                    {field:'post_name',title:'岗位名称',width:'100px'}
                ]],
                onResize:function(){
                    $('#userList').datagrid('fixDetailRowHeight',index);
                },
                onLoadSuccess:function(){
                    setTimeout(function(){
                        $('#userList').datagrid('fixDetailRowHeight',index);
                    },0);
                }
            });
            //currentReplenishment = row.obj;
            loadPostForUser(ddv, row.obj, index);
            //shipmentDg = ddv;
        },
        toolbar :
            [
                {
                    text : '新建用户',
                    iconCls : 'icon-add',
                    handler : function() {
                        addUser();
                    }
                },
                {
                    text : '添加兼职',
                    iconCls : 'icon-add',
                    handler : function() {
                        addPartTimer();
                    }
                }
            ]

    });

}

var currentUserRow;
var currentUserRowIndex;
function userListOnClickRow(index, row){
    currentUserRow = row;
    currentUserRowIndex = index;
}


function addUser(){

    $('#cmb_post').combobox({
        mode: 'remote',
        valueField:'id',
        textField:'post_name',
        loader: postLoader,
        panelHeight:'auto',
        //onSelect: postSelected,
        required:true
    });

    $('#newUserDlg').window('open');  // open a window

}

//----- 添加兼职 ------
//添加兼职
function addPartTimer(){

    $('#dgList2').datagrid({
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
        onSelect: onBizUnitSelected2,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        }
    });

    $('#userList2').datagrid({
        loadMsg: "正在加载，请稍等...",
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
                    {field:'post_code',title:'岗位编码',width:'100px'},
                    {field:'post_name',title:'岗位名称',width:'100px'}
                ]],
                onResize:function(){
                    $('#userList2').datagrid('fixDetailRowHeight',index);
                },
                onLoadSuccess:function(){
                    setTimeout(function(){
                        $('#userList2').datagrid('fixDetailRowHeight',index);
                    },0);
                }
            });
            //currentReplenishment = row.obj;
            loadPostForUser2(ddv, row.obj, index);
            //shipmentDg = ddv;
        }

    });

    loadDgList2();


    $('#cmb_post2').combobox({
        mode: 'remote',
        valueField:'id',
        textField:'post_name',
        loader: postLoader,
        panelHeight:'auto',
        //onSelect: postSelected,
        required:true
    });

    $('#addPartTimerDlg').window('open');  // open a window

}

function insertPartTimeUser(){

    var userListDg = $('#userList2');
    var row = userListDg.datagrid('getSelected');
    if(row == null){
        alert_autoClose("提示","请选择一个用户.");
        return;
    }
    //var actIndex = userListDg.datagrid('getRowIndex', row);

    var cmb_post = $('#cmb_post2');
    var postId = parseInt(cmb_post.combobox('getValue'));
    var postName= cmb_post.combobox('getText');

    var postCode = postName;
    var posts = cmb_post.combobox('getData');
    for(var i in posts){
        var item = posts[i];
        if(item.id = postId){
            postCode = item.post_code;
        }
    }

    if(postId == null || isNaN(postId) || postId <= 0){
        alert_autoClose("提示","请选择一个岗位.");
        return;
    }

    var userData = {
        acct_id: acctId,
        biz_unit_id: currentBizUnit.id,
        post_id: postId,
        auth_user_id: row.obj.id
    };

    var userObj = cloneJsonObject(row.obj);
    userObj.post_code = postCode;
    userObj.post_name = postName;

    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-user/create-parttimer?token=" + window.$token,
        async : true,
        data: JSON.stringify(userData),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                alert_autoClose('提示', '保存成功');

                var dgLst = $('#userList');

                var row_data = {
                    name: userObj.name,
                    cell_no: userObj.cell_no,
                    email: userObj.email,
                    post_code: userObj.post_code,
                    post_name: userObj.post_name,
                    obj: userObj
                };
                dgLst.datagrid('appendRow',row_data);

                alert_autoClose('提示', '成功');

                $('#addPartTimerDlg').window('close');  // open a window

            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}


//绑定列表行数据
function bindDgListData2(data){
    var dgLst = $('#dgList2');
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        if(dataItem.id != currentBizUnit.id) {
            var row_data = {
                unit_code: dataItem.unit_code,
                unit_name: dataItem.unit_name,
                unit_manager: dataItem.unit_manager,
                role_name: dataItem.role_name,
                obj: dataItem
            };
            viewModel.push(row_data);
        }
    }
    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });
}

//var repCurrentPageIndex = 1;
//加载数据列表
function loadDgList2(){

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
            bindDgListData2(data);
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

var currentBizUnit2;
var currentBizUnitRow2;
var currentBizUnitIndex2;
function onBizUnitSelected2 (rowIndex, rowData) {
    currentBizUnitIndex2 = rowIndex;
    currentBizUnitRow2 = rowData;
    currentBizUnit2 = rowData.obj;
    loadUsers2(rowData.obj.id);

}

function loadPostForUser2 (ddv, data, index) {

    if(data.id == undefined || data.id == null){
        return;
    }

    var ownerQuery = {
        user_id: data.id
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-user/query-post?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(retData) {
            if (retData.errCode != undefined && retData.errCode != null) {
                alert_autoClose('提示', '错误码：' + retData.errCode + '，原因：' + retData.errMsg);
            } else {
                showPostList(ddv, retData);
                $('#userList2').datagrid('fixDetailRowHeight',index);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}



var repCurrentPageIndex2 = 1;
//加载数据列表
function loadUsers2 (acct_biz_unit_id) {

    var condStr = buildUserQueryCond(acct_biz_unit_id, 0, 1);

    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-user/query?token=" + window.$token,
        async : true,
        data: condStr,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            bindUserListData2(data);

            $('#userList2').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh:function(){
                    var thisDg = $('#userList2');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage : function(pPageIndex, pPageSize) {
                        //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                        repCurrentPageIndex2 = pPageIndex;
                        var gridOpts = $('#userList2').datagrid('options');
                        gridOpts.pageNumber = pPageIndex;
                        gridOpts.pageSize = pPageSize;

                        condStr = buildUserQueryCond(acct_biz_unit_id, 0, pPageIndex);

                        //定义查询条件
                        $.ajax({
                            method: 'POST',
                            url : $apiRoot + "otocloud-acct-org/my-user/query?token=" + window.$token,
                            data: condStr,
                            async: true,
                            dataType: 'json',
                            beforeSend: function (x) {
                                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                            },
                            success: function (data) {
                                bindUserListData2(data);
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


//绑定列表行数据
function bindUserListData2(data){
    var dgLst = $('#userList2');
    var viewModel = new Array();
    for ( var i in data.datas) {
        var dataItem = data.datas[i];
        var row_data = {
            name: dataItem.name,
            cell_no: dataItem.cell_no,
            email: dataItem.email,
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
//--------------------------------------

var postLoader = function(param,success,error){

    if(currentBizUnit == undefined){
        return;
    }

    var ownerQuery = {
        acct_biz_unit_id: currentBizUnit.id
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
                success(data.result);
            }
        },
        error: function (x, e) {
            var args = [];
            args.push(e);
            error.apply(this, args);
        }
    });

}



function insertNewUser(){
    var user_name = $('#user_name').val();
    var cell_no = $('#cell_no').val();
    var password = $('#password').val();
    var user_email = $('#user_email').val();

    var cmb_post = $('#cmb_post');
    var postId = parseInt(cmb_post.combobox('getValue'));
    var postName= cmb_post.combobox('getText');

    var postCode = postName;
    var posts = cmb_post.combobox('getData');
    for(var i in posts){
        var item = posts[i];
        if(item.id = postId){
            postCode = item.post_code;
        }
    }

    var userData = {
        acct_id: acctId,
        biz_unit_id: currentBizUnit.id,
        post_id: postId,
        user: {
            name: user_name,
            password: password,
            cell_no: cell_no,
            email: user_email
        }
    };

    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-user/create?token=" + window.$token,
        async : true,
        data: JSON.stringify(userData),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                alert_autoClose('提示', '保存成功');

                var dgLst = $('#userList');

                var dataItem = userData.user;
                dataItem.id = data.id;
                dataItem.post_code = postCode;
                dataItem.post_name = postName;
                var row_data = {
                    name: dataItem.name,
                    cell_no: dataItem.cell_no,
                    email: dataItem.email,
                    post_code: dataItem.post_code,
                    post_name: dataItem.post_name,
                    obj: dataItem
                };
                dgLst.datagrid('appendRow',row_data);

                alert_autoClose('提示', '成功');

                $('#newUserDlg').window('close');  // open a window
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

//用户操作按钮
function postActionColumnFormat(value,row,index){
    var e = '<a href="javascript:void(0)" onclick="editUser(' + index + ')">修改</a> ';
    var d = '<a href="javascript:void(0)" onclick="deleteUser(' + index + ',1)">删除</a>';
    //var d = '<a href="javascript:void(0)" onclick="deleteUser(' + index + ',1)">从本企业删除</a>';
    return e+d;
}

var currentUserRow;
var currentUserIndex;
function editUser(index){
    var postList = $('#userList');
    var  row = postList.datagrid('getRows')[index];

    currentUserRow = row;
    currentUserIndex = index;

    $('#user_name2').textbox('setValue',row.obj.name);
    $('#cell_no2').textbox('setValue',row.obj.cell_no);
    $('#password2').textbox('setValue',row.obj.password);
    $('#user_email2').textbox('setValue',row.obj.email);

    $('#userEditDlg').window('open');  // open a window
}

function updateUser(){

    var userId = currentUserRow.obj.id;
    var name = $('#user_name2').val();
    var cell_no = $('#cell_no2').val();
    var password = $('#password2').val();
    var email = $('#user_email2').val();

    var userData = {
        name: name,
        cell_no: cell_no,
        password: password,
        email: email
    };

    //定义查询条件
    $.ajax({
        method : 'PUT',
        url : $apiRoot + "otocloud-acct-org/my-user/update/" + userId + "?token=" + window.$token,
        async : true,
        data: JSON.stringify(userData),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                alert_autoClose('提示', '保存成功');

                $('#userEditDlg').window('close');  // open a window

                currentUserRow.obj.name = name;
                currentUserRow.obj.cell_no = cell_no;
                currentUserRow.obj.password = password;
                currentUserRow.obj.email = email;

                currentUserRow["name"] = name;
                currentUserRow["cell_no"] = cell_no;
                currentUserRow["email"] = email;

                $('#userList').datagrid('refreshRow', currentUserIndex);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });


}

function deleteUser(index, delete_acct_user){

    var postList = $('#userList');

    $.messager.confirm('Confirm','Are you sure?',function(r){
        if (r){
            var  row = postList.datagrid('getRows')[index];
            var userId = row.obj.id;

            var needDelAcctUser = false;
            if(delete_acct_user == 1){
                needDelAcctUser = true;
            }
            var deleteData = {
                acct_id: acctId,
                acct_biz_unit_post_id: row.obj.acct_biz_unit_post_id,
                auto_delete_acct_user: needDelAcctUser
            };

            $.ajax({
                method : 'DELETE',
                url : $apiRoot + "otocloud-acct-org/my-user/delete/" + userId + "?token=" + window.$token,
                async : true,
                data: JSON.stringify(deleteData),
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
                            postList.datagrid('selectRow', index);
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
    loadUsers(rowData.obj.id);

}

//构建分页条件
function buildUserQueryCond(biz_unit_id, total, pageNum) {
    var condition = {
        biz_unit_id: biz_unit_id,
        paging: {
            sort_field: "id",
            sort_direction: -1,
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
function loadUsers (acct_biz_unit_id) {

    var condStr = buildUserQueryCond(acct_biz_unit_id, 0, 1);

    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "otocloud-acct-org/my-user/query?token=" + window.$token,
        async : true,
        data: condStr,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            bindUserListData(data);

            $('#userList').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh:function(){
                    var thisDg = $('#userList');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage : function(pPageIndex, pPageSize) {
                    if(isNewRep){
                        if(repCurrentPageIndex != pPageIndex) {
                            $('#userList').datagrid('getPager').pagination('select', repCurrentPageIndex);
                            $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
                        }
                        return;
                    }else {
                        //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                        repCurrentPageIndex = pPageIndex;
                        var gridOpts = $('#userList').datagrid('options');
                        gridOpts.pageNumber = pPageIndex;
                        gridOpts.pageSize = pPageSize;

                        condStr = buildUserQueryCond(acct_biz_unit_id, 0, pPageIndex);

                        //定义查询条件
                        $.ajax({
                            method: 'POST',
                            url : $apiRoot + "otocloud-acct-org/my-user/query?token=" + window.$token,
                            data: condStr,
                            async: true,
                            dataType: 'json',
                            beforeSend: function (x) {
                                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                            },
                            success: function (data) {
                                bindUserListData(data);
                            },
                            error: function (x, e) {
                                alert(e.toString(), 0, "友好提醒");
                            }
                        });
                    }
                }
            });

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}


//绑定列表行数据
function bindUserListData(data){
    var dgLst = $('#userList');
    var viewModel = new Array();
    for ( var i in data.datas) {
        var dataItem = data.datas[i];
        var row_data = {
            name: dataItem.name,
            cell_no: dataItem.cell_no,
            email: dataItem.email,
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





