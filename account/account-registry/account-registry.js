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


function saveOwner(){
    if(isMgrChanged && !isNewBO){
        $.ajax({
            method: 'PUT',
            url: $apiRoot + "otocloud-auth/user-management/update/" + cloneBOObj.manager.id + "?token=" + window.$token,
            data: JSON.stringify(cloneBOObj.manager),
            async: true,
            dataType: 'json',
            beforeSend: function (x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function (data) {
                if(data.errCode != undefined && data.errCode != null){
                    alert_autoClose('提示', '保存失败，错误码：' + data.errCode + '，原因：' + data.errMsg);
                    return;
                }

                BOObj = cloneBOObj;
                var dgList = $('#dgList');
                var row = dgList.datagrid('getSelected');
                row.obj = BOObj;

                resetState();
                alert_autoClose('提示', '保存成功!');

            },
            error: function (x, e) {
                alert(e.toString(), 0, "友好提醒");
            }
        });
    }
}


//保存
function save(){
    if(isMgrChanged || isAccountChanged || isNewBO){
        if(!isNewBO){
            if(isAccountChanged){
                var owner = cloneBOObj.manager;
                delete cloneBOObj.manager;
                $.ajax({
                    method: 'PUT',
                    url: $apiRoot + "otocloud-acct/account-registry?token=" + window.$token,
                    data: JSON.stringify(cloneBOObj),
                    async: true,
                    dataType: 'json',
                    beforeSend: function (x) {
                        x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                    },
                    success: function (data) {
                        if(data.errCode != undefined && data.errCode != null){
                            alert_autoClose('提示', '保存失败，错误码：' + data.errCode + '，原因：' + data.errMsg);
                            return;
                        }

                        cloneBOObj["manager"] = owner;
                        BOObj = cloneBOObj;
                        var dgList = $('#dgList');
                        var row = dgList.datagrid('getSelected');
                        row.obj = BOObj;

                        resetState();
                        alert_autoClose('提示', '保存成功!');

                    },
                    error: function (x, e) {
                        alert(e.toString(), 0, "友好提醒");
                    }
                });

            }else if(isMgrChanged){
                saveOwner();
            }
        }else {
            $.ajax({
                method: 'POST',
                url: $apiRoot + "otocloud-acct/account-registry/register?token=" + window.$token,
                data: JSON.stringify(cloneBOObj),
                async: true,
                dataType: 'json',
                beforeSend: function (x) {
                    x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                },
                success: function (data) {
                    if(data.errCode != undefined && data.errCode != null){
                        alert_autoClose('提示', '保存失败，错误码：' + data.errCode + '，原因：' + data.errMsg);
                        return;
                    }

                    //-------刷新关联属性------
                    cloneBOObj = data;
                    BOObj = cloneBOObj;

                    var dgList = $('#dgList');
                    var row = dgList.datagrid('getSelected');
                    var index = dgList.datagrid('getRowIndex', row);
                    row['id'] = data.id;
                    row['acct_code'] = data.acct_code;
                    row['acct_name'] = data.acct_name;
                    row['status'] = 'A';
                    row.obj = BOObj;
                    dgList.datagrid('refreshRow', index);

                    resetState();
                    alert_autoClose('提示', '保存成功!');

                },
                error: function (x, e) {
                    alert(e.toString(), 0, "友好提醒");
                }
            });
        }

    }
}

function resetState(){
    editIndex = undefined;
    isNewBO = false;
    isMgrChanged = false;
    isAccountChanged = false;
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
        onBeforeSelect: onBeforeSelect,
        onSelect: onRowSelected,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        }
    });
}

function onBeforeSelect(index,row){
    if(isAccountChanged || isMgrChanged){
        $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
        return false;
    }
    return true;
}



function newRep(){

        if(isAccountChanged || isMgrChanged){
            $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
            return;
        }

        var theDate = new Date();
        var theDateStr = theDate.format("yyyy-MM-dd");

        var dgList =  $('#dgList');
        var newObjIndex = dgList.datagrid('getRows').length;
        var newObj = {
            acct_code:"",
            acct_name: "",
            industry_code: "",
            ownership_code:"",
            area_code:"",
            address:"",
            contacts:"",
            tel:"",
            email:"",
            website_url:"",
            description:"",
            manager:{
                name: "",
                password: "",
                cell_no: "",
                email: ""
            }
        };

        var rowData = {
            id: "",
            acct_code:"",
            acct_name: "",
            status: "A",
            entry_datetime: "",
            obj: newObj
        };

        dgList.datagrid('appendRow',rowData);

        dgList.datagrid('selectRow', newObjIndex);

        isNewBO = true;

        isAccountChanged = true;


}



//回退整个单据
function reject(){
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;

    if(isNewBO){
        removeRep();
    }else {
        //重新克隆
        cloneBOObj = cloneJsonObject(BOObj);
        bindSelectedDataToCard(cloneBOObj)
        isMgrChanged = false;
        isAccountChanged = false;
        isNewBO = false;
    }
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
            });

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

//行选择事件

var initialized = false;
function onRowSelected (rowIndex, rowData) {
    initialized = true;

    //BOObjIndex = rowIndex;
    BOObj = rowData.obj;

    if(BOObj.manager == undefined || BOObj.manager == null){
        var ownerQuery = {
            acct_id: BOObj.id
        };
        var ownerQueryData = JSON.stringify(ownerQuery);
        //定义查询条件
        $.ajax({
            method : 'POST',
            url : $apiRoot + "otocloud-auth/user-management/owner-query?token=" + window.$token,
            async : true,
            data: ownerQueryData,
            dataType : 'json',
            beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
            success : function(data) {
                if (data.errCode != undefined && data.errCode != null) {
                    alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
                } else {
                    BOObj.manager = {
                        id: data.id,
                        name: data.name,
                        password: data.password,
                        cell_no: data.cell_no,
                        email: data.email
                    }
                }
                //克隆数据
                cloneBOObj = cloneJsonObject(BOObj);
                bindSelectedDataToCard(cloneBOObj);
                initialized = false;
            },
            error: function (x, e) {
                alert(e.toString(), 0, "友好提醒");
            }
        });
    }else{
        //克隆数据
        cloneBOObj = cloneJsonObject(BOObj);
        bindSelectedDataToCard(cloneBOObj);
        initialized = false;
    }

}


//绑定当前选择行的数据
function bindSelectedDataToCard(data){
    $('#id').textbox('setValue',data.id);
    $('#acct_code').textbox('setValue',data.acct_code);
    $('#acct_name').textbox('setValue',data.acct_name);
    $('#contacts').textbox('setValue',data.contacts);
    $('#tel').textbox('setValue',data.tel);
    $('#email').textbox('setValue',data.email);
    $('#address').textbox('setValue',data.address);
    $('#website_url').textbox('setValue',data.website_url);
    $('#entry_datetime').textbox('setValue',data.entry_datetime);
    $('#status').textbox('setValue',data.status);

    var mgr = data.manager;
    if(mgr != null){
        $('#user_name').textbox('setValue',mgr.name);
        $('#cell_no').textbox('setValue',mgr.cell_no);
        $('#password').textbox('setValue',mgr.password);
        $('#user_email').textbox('setValue',mgr.email);
    }
}

function onAcctCodeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.acct_code = newValue;
    isAccountChanged = true;
}

function onAcctNameChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.acct_name = newValue;
    isAccountChanged = true;
}

function onContactsChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.contacts = newValue;
    isAccountChanged = true;
}

function onTelChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.tel = newValue;
    isAccountChanged = true;
}

function onMailChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.email = newValue;
    isAccountChanged = true;
}

function onAddressChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.address = newValue;
    isAccountChanged = true;
}

function onWebsiteUrlChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.website_url = newValue;
    isAccountChanged = true;
}

function onUserNameChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.manager.name = newValue;
    isMgrChanged = true;
}


function onCellNoChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.manager.cell_no = newValue;
    isMgrChanged = true;
}

function onPasswordChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.manager.password = newValue;
    isMgrChanged = true;
}

function onMgrEmailChanged(newValue,oldValue) {
    if(initialized) return;
    cloneBOObj.manager.email = newValue;
    isMgrChanged = true;
}


//卡片内容变更后刷新父列表
function updateParentListRow(field, value){
    //-------刷新关联属性------
    var dgList = $('#dgList');
    var row = dgList.datagrid('getSelected');
    var index = dgList.datagrid('getRowIndex', row);

    row[field] = value;
    dgList.datagrid('refreshRow', index);
}


function compute(date, colName) {
    var total = 0;
    for (var i = 0; i < date.length; i++) {
        total += parseFloat(date[i][colName]);
    }
    return total;
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
