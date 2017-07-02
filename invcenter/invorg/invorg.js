window.$token = localStorage.getItem("access_token");
var acctInfo = window.getCurrentAcctInfo();
var acctId = acctInfo.acct_id;

//﻿var allotInvObjIndex;
var warehouseObj;

//clone的数据
var invorg;
var currentDetailRowObj;

//主子表状态
var isHeadChanged = false;
var isBodyChanged = false;
var isNewRep = false;

//子表行状态
var editIndex = undefined;

//保存
function save(){
    if(isHeadChanged || isBodyChanged || isNewRep){

        delete invorg.bizunit;

        $.ajax({
            method: 'POST',
            url: $apiRoot + "ocr-inventorycenter/invorg-mgr/create?token=" + window.$token,
            data: JSON.stringify(invorg),
            async: true,
            dataType: 'json',
            beforeSend: function (x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function (data) {

                //-------刷新关联属性------
                invorg = data;
                warehouseObj = invorg;

                var dgList = $('#dgList');
                var row = dgList.datagrid('getSelected');
                var index = dgList.datagrid('getRowIndex', row);
                row['bo_id'] = data.bo_id;
                row['sale_date'] = data.sale_date;
                row['salesman'] = data.salesman;

                row.obj = warehouseObj;
                dgList.datagrid('refreshRow', index);

                resetState();
                alert_autoClose('提示','保存成功!');

            },
            error: function (x, e) {
                alert(e.toString(), 0, "友好提醒");
            }
        });

    }
}

function resetState(){
    editIndex = undefined;
    isNewRep = false;
    isHeadChanged = false;
    isBodyChanged = false;
}

function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '仓库列表',
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

    $('#warehouseList').datagrid({
        loadMsg: "正在加载，请稍等...",
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        rownumbers : true,
        singleSelect : true,
        border : false,
        //onSelect: onAppSelected,  //行选择事件
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
                title:"VMI",
                fitColumns:true,
                singleSelect:true,
                rownumbers:true,
                loadMsg:'',
                height:'auto',
                columns:[[
                    {field:'supplier_code',title:'供应商编码',width:'100px'},
                    {field:'supplier_name',title:'供应商名称',width:'100px'}
                ]],
                onResize:function(){
                    $('#warehouseList').datagrid('fixDetailRowHeight',index);
                },
                onLoadSuccess:function(){
                    setTimeout(function(){
                        $('#warehouseList').datagrid('fixDetailRowHeight',index);
                    },0);
                }
            });
            //currentReplenishment = row.obj;
            loadVMISuppliers(ddv, row.obj, index);
            //shipmentDg = ddv;
        },

        toolbar :
            [
                {
                    text : '添加',
                    iconCls : 'icon-add',
                    handler : function() {
                        addWarehouse();
                    }
                },
                {
                    text : '删除',
                    iconCls : 'icon-remove',
                    handler : function() {
                        deleteWarehouse();
                    }
                }

            ]


    });

}

function loadVMISuppliers (ddv, data, index) {

    if(data.warehouse_code == undefined || data.warehouse_code == null){
        return;
    }

    var ownerQuery = {
        code: data.warehouse_code,
        account: acctId.toString()
    };
    var ownerQueryData = JSON.stringify(ownerQuery);
    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "ocr-inventorycenter/warehouse-mgr/queryAll?token=" + window.$token,
        async : true,
        data: ownerQueryData,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(retData) {
            if (retData.errCode != undefined && retData.errCode != null) {
                alert_autoClose('提示', '错误码：' + retData.errCode + '，原因：' + retData.errMsg);
            } else {
                showVMISupplierList(ddv, retData);
                $('#warehouseList').datagrid('fixDetailRowHeight',index);
            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

function showVMISupplierList(ddv, data){

    var viewModel = new Array();
    if(data.result.length > 0){
        var dataItem = data.result[0];
        if(dataItem.vmi_suppliers != undefined){
            var vmi_suppliers = dataItem.vmi_suppliers;
            if(vmi_suppliers.length > 0){
                for ( var i in vmi_suppliers) {
                    var vmi_supplier = vmi_suppliers[i];
                    var row_data = {
                        supplier_code: vmi_supplier.supplier_code,
                        supplier_name: vmi_supplier.supplier_name,
                        obj: vmi_supplier
                    };
                    viewModel.push(row_data);
                }
                ddv.datagrid('loadData',{
                    total: viewModel.length,
                    rows: viewModel
                });

            }
        }

    }

}


function addWarehouse(){

    var warehouseDg = $('#warehouseDg');
    warehouseDg.datagrid('loadData',{
        total: 0,
        rows: []
    });
    //定义查询条件
    $.ajax({
        method : 'GET',
        url : $apiRoot + "ocr-inventorycenter/warehouse-mgr/query-nopaging?token=" + window.$token,
        async : true,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
            } else {
                var viewModel = new Array();
                for ( var i in data) {
                    var dataItem = data[i];
                    if(!existWarehouse(dataItem.code)) {
                        var row_data = {
                            warehouse_code: dataItem.code,
                            warehouse_name: dataItem.name,
                            obj: dataItem
                        };
                        viewModel.push(row_data);
                    }
                }

                warehouseDg.datagrid('loadData',{
                    total: data.total,
                    rows: viewModel
                });

            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

    $('#warehouseDlg').window('open');  // open a window
}

function existWarehouse(warehouseCode){
    if(invorg.warehouses != undefined && invorg.warehouses != null && invorg.warehouses.length > 0){
        for(var j in invorg.warehouses){
            var warehouse = invorg.warehouses[j];
            if(warehouse.warehouse_code == warehouseCode){
                return true;
            }
        }
    }
    return false;
}

function removeWarehouse(warehouseCode){
    if(invorg.warehouses != undefined && invorg.warehouses != null && invorg.warehouses.length > 0){
        for(var j in invorg.warehouses){
            var warehouse = invorg.warehouses[j];
            if(warehouse.warehouse_code == warehouseCode){
                invorg.warehouses.splice(j,1);
                return;
            }
        }
    }
    return;
}


function warehouseSelectOk(){

    var warehouseRows = $('#warehouseDg').datagrid('getSelections');
    if(warehouseRows != null && warehouseRows.length > 0) {
        if (invorg.warehouses == undefined || invorg.warehouses == null) {
            invorg.warehouses = [];
        }

        var warehouseList = $('#warehouseList');

        for (var i in warehouseRows) {
            var dataItem = warehouseRows[i].obj;
            var newItem = {
                warehouse_code: dataItem.code,
                warehouse_name: dataItem.name
            };
            invorg.warehouses.push(newItem);
            var row_data = {
                warehouse_code: newItem.warehouse_code,
                warehouse_name: newItem.warehouse_name,
                obj: newItem
            };

            warehouseList.datagrid('appendRow', row_data);
        }

        isHeadChanged = true;
    }

    $('#warehouseDlg').window('close');  // open a window

}

function deleteWarehouse() {
    var warehouseList = $('#warehouseList');

    var row = warehouseList.datagrid('getSelected');
    if(row != null) {

        removeWarehouse(row.obj.warehouse_code);

        var actIndex = warehouseList.datagrid('getRowIndex', row);

        warehouseList.datagrid('deleteRow', actIndex);

        if (actIndex > 0) {
            warehouseList.datagrid('selectRow', actIndex - 1);
        } else {
            var rows = warehouseList.datagrid('getRows');
            if (rows.length > 0) {
                warehouseList.datagrid('selectRow', actIndex + 1);
            }
        }

        isHeadChanged = true;

        alert_autoClose("提示", "需要点击“保存”才能最终删除！");
    }
}


function detailListSetting(){
	$('#win').window({
    width:600,
    height:400,
    modal:true
});
}


function onBeforeSelect(index,row){
    if(isBodyChanged || isHeadChanged){
        $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
        return false;
    }
    return true;
}






//构建分页条件
function buildGoodsQueryCond(total, pageNum, cateLog) {
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 10,
            total: total,
            total_page: -1
        },
        query: {'sales_catelogs.inner_code':cateLog}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
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


function endEditing(){
    if (editIndex == undefined){return true}
    if ($('#detailDg').datagrid('validateRow', editIndex)){
        $('#detailDg').datagrid('endEdit', editIndex);
        editIndex = undefined;
        return true;
    } else {
        return false;
    }
}
function onClickCell(index, field){
    if (endEditing()){

        isBodyChanged = true;

        $('#detailDg').datagrid('selectRow', index)
            .datagrid('editCell', {index:index,field:field});
        editIndex = index;
    }

}

function onAfterEdit(index, row){
    var a = 0;
}

function onEndEdit(index, row) {
    //对于合计行进行处理
    // var ed = $(this).datagrid('getEditor', {
    //     index: index,
    //     field: 'quantity'
    // });
    // if (ed != null && ed != undefined) {
    //     var newValue = $(ed.target).val();
    //     row.quantity = newValue; //设置当前行的数量值
    //     currentDetailRowObj.quantity = newValue; //设置当前行对象的值
    // }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'nynum'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.nynum = parseFloat(newValue); //设置当前行的数量值
        currentDetailRowObj.nynum = parseFloat(newValue); //设置当前行对象的值
    }
    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'nsnum'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.nsnum = parseFloat(newValue); //设置当前行的数量值
        currentDetailRowObj.nsnum = parseFloat(newValue); //设置当前行对象的值
    }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'unqualifiednum'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.unqualifiednum = parseFloat(newValue); //设置当前行的数量值
        currentDetailRowObj.unqualifiednum = parseFloat(newValue); //设置当前行对象的值
    }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'locations'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.locations = newValue; //设置当前行的数量值
        currentDetailRowObj.locations = newValue; //设置当前行对象的值
    }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'shelflife'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.shelflife = newValue; //设置当前行的数量值
        currentDetailRowObj.shelflife = newValue; //设置当前行对象的值
    }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'shelflifeunit'
		
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.shelflifeunit = newValue; //设置当前行的数量值
        currentDetailRowObj.shelflifeunit = newValue; //设置当前行对象的值
    }
    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'expdate'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.expdate = newValue; //设置当前行的数量值
        currentDetailRowObj.expdate = newValue; //设置当前行对象的值
    }
    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'su_batch_code'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.su_batch_code = newValue; //设置当前行的数量值
        currentDetailRowObj.su_batch_code = newValue; //设置当前行对象的值
    }
	
	 var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'batch_code'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.batch_code = newValue; //设置当前行的数量值
        currentDetailRowObj.batch_code = newValue; //设置当前行对象的值
    }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'purchase_price'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.purchase_price = parseFloat(newValue); //设置采购价
        currentDetailRowObj.purchase_price = {
            tax_type: "VTA",
            tax_rate: 0.17,
            price: {
                original_currency: {
                    money: 0.00,
                    currency_type: "USD"
                },
                currency: {
                    money: parseFloat(newValue),
                    currency_type: "CYN"
                }
            }
        };

    }


    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'supply_price'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.supply_price = parseFloat(newValue); //设置当前行的数量值
        currentDetailRowObj.supply_price = {
            tax_type: "VTA",
            tax_rate: 0.17,
            price: {
                original_currency: {
                    money: 0.00,
                    currency_type: "USD"
                },
                currency: {
                    money: parseFloat(newValue),
                    currency_type: "CYN"
                }
            }
        };

    }

    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'supply_amount'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.supply_amount = newValue; //设置当前行的数量值
        currentDetailRowObj.supply_amount = newValue; //设置当前行对象的值
    }
    var ed = $(this).datagrid('getEditor', {
        index: index,
        field: 'discount_amount'
    });
    if (ed != null && ed != undefined) {
        var newValue = $(ed.target).val();
        row.discount_amount = newValue; //设置当前行的数量值
        currentDetailRowObj.discount_amount = newValue; //设置当前行对象的值
    }
    refreshSubTotalRows(); //刷新小计列
}

function appendgoods(){
	
	$('#win').window('open'); // open a window
}


	
function append(){

    if (endEditing()){

        var theDate = new Date();
        var theDateStr = theDate.format("yyyy-MM-dd");

        var newDetailObj = {
            biz_unit_code: "",
            bizunit: {
                unit_code : "",
                unit_name : "",
                is_global: false,
                role_name : ""
            }
        };
        invorg.detail.push(newDetailObj);

        var rowData = {
            unit_code : "",
            unit_name : "",
            is_global: false,
            role_name : "",
            obj: newDetailObj
        };

        $('#detailDg').datagrid('appendRow',rowData);

        //必须加入到originalRows中，否则翻页会有问题
        var data = $("#detailDg").datagrid('getData');
        data.originalRows.push(rowData);

        editIndex = $('#detailDg').datagrid('getRows').length-1;
        $('#detailDg').datagrid('selectRow', editIndex)
            .datagrid('beginEdit', editIndex);

        isBodyChanged = true;

    }
}

function newRep(){

    if (endEditing()){
        if(isBodyChanged || isHeadChanged){
            $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
            return;
        }

        var theDate = new Date();
        var theDateStr = theDate.format("yyyy-MM-dd");

        var dgList =  $('#dgList');
        var newObjIndex = dgList.datagrid('getRows').length;
        var newObj = {
            biz_unit_code: "",
            bizunit: {
                unit_code : "",
                unit_name : "",
                is_global: false,
                role_name : ""
            },
            warehouses: []
        };

        var rowData = {
            unit_code : "",
            unit_name : "",
            is_global: false,
            role_name : "",
            obj: newObj
        };

        dgList.datagrid('appendRow',rowData);

        //必须加入到originalRows中，否则翻页会有问题
        //var data = dgList.datagrid('getData');
        //data.originalRows.push(rowData);

        dgList.datagrid('selectRow', newObjIndex);

        isNewRep = true;

        isBodyChanged = true;

    }
}

function removeDetail(){
    if (currentRowIndex == undefined){return}
    $('#detailDg').datagrid('cancelEdit', currentRowIndex)
        .datagrid('deleteRow', currentRowIndex);
    currentRowIndex = undefined;

    isBodyChanged = true;
}
/*function accept(){
    if (endEditing()){
        $('#detailDg').datagrid('acceptChanges');
    }
}*/

//回退表体
function rejectDetail(){
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;
    //克隆
    invorg.detail = cloneJsonObject(warehouseObj.detail);
    bindSelectedDataToSubDetail(invorg.detail);

    isBodyChanged = false;
}
/*function getChanges(){
    var rows = $('#detailDg').datagrid('getChanges');
    alert(rows.length+' rows are changed!');
}*/


//回退整个单据
function reject(){
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;

    if(isNewRep){
        removeRep();
    }else {
        //重新克隆
        invorg = cloneJsonObject(warehouseObj);
        bindSelectedDataToCard(invorg)
        bindSelectedDataToSubDetail(invorg.detail);

        isHeadChanged = false;
        isBodyChanged = false;
        isNewRep = false;
    }
}

function removeRep(){

    if (allotInvObjIndex == undefined || allotInvObjIndex == null){return}

    obj = new Object();
    obj._id = invorg._id;

    $.messager.confirm('删除警告', '是否确认删除?', function(r){
        if (r){

            $.ajax({
                method: 'POST',
                url: $apiRoot + "ocr-inventorycenter/invorg-mgr/remove?token=" + window.$token,
                data: JSON.stringify(obj),
                async: true,
                dataType: 'json',
                beforeSend: function (x) {
                    x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                },
                success: function (data) {
                    //$.messager.alert('提示','删除成功!');
                    resetState();

                    var dgList = $('#dgList');
                    dgList.datagrid('deleteRow', allotInvObjIndex);
                    currentRowIndex = undefined;

                    //$.messager.alert('提示','删除成功!');
                    alert_autoClose('提示','删除成功!');

                    //当前指针指向正确的位置
                    var rowCount = dgList.datagrid('getRows').length + 1;
                    if(rowCount > 0){
                        if(allotInvObjIndex == 0){
                            dgList.datagrid('selectRow',invorg);
                        }else{
                            if(allotInvObjIndex == rowCount -1){
                                dgList.datagrid('selectRow',invorg-1);
                            }else{
                                dgList.datagrid('selectRow',invorg+1);
                            }
                        }
                    }
                },
                error: function (x, e) {
                    alert(e.toString(), 0, "友好提醒");
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
	
     for ( var i in data.datas) {
        var dataItem = data.datas[i];
         var bizunit = dataItem.bizunit;
         var row_data = {
             unit_code: bizunit.unit_code,
             unit_name: bizunit.unit_name,
             is_global: bizunit.is_global,
             role_name: bizunit.role_name,
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
            sort_field: "_id",
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
function loadDgList(){

    var condStr = buildRepsQueryCond(0,1);

    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $apiRoot + "ocr-inventorycenter/invorg-mgr/query?token=" + window.$token,
        async : true,
        data: condStr,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            if (data.errCode != undefined && data.errCode != null) {
                alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
                return;
            }

            bindDgListData(data);

            $('#dgList').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh:function(){
                    var thisDg = $('#dgList');
                    thisDg.pagination('loading...');

                    thisDg.pagination('loaded');
                },
                onSelectPage : function(pPageIndex, pPageSize) {
                    if(isNewRep){
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
                            url: $apiRoot + "ocr-inventorycenter/pharseinv-mgr/query?token=" + window.$token,
                            data: condStr,
                            async: true,
                            dataType: 'json',
                            beforeSend: function (x) {
                                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                            },
                            success: function (data) {
                                if (data.errCode != undefined && data.errCode != null) {
                                    alert_autoClose('提示', '错误码：' + data.errCode + '，原因：' + data.errMsg);
                                    return;
                                }
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

var bizUnitLoader = function(param,success,error){

    var query = {
        acct_id: acctId
    }

    //定义查询条件
    $.ajax({
        method : 'POST',
        url :  $apiRoot + 'otocloud-acct-org/my-bizunit/query?token=' + window.$token,
        async : true,
        data: JSON.stringify(query),
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

function bizUnitSelected(record){
    isBodyChanged = true;
    invorg.biz_unit_code = record.unit_code;
    invorg.bizunit = {
        unit_code: record.unit_code,
        unit_name: record.unit_name,
        is_global: record.is_global,
        role_name: record.role_name
    }

    $('#bizunit_code').textbox('setValue',record.unit_code);
    $('#is_global').textbox('setValue',record.is_global);
    $('#role_name').textbox('setValue',record.role_name);

    isBodyChanged =true;
    updateParentListRow('unit_code', record.unit_code);
    updateParentListRow('unit_name', record.unit_name);
    updateParentListRow('is_global', record.is_global);
    updateParentListRow('role_name', record.role_name);
}



//行选择事件

var initialized = false;
function onRowSelected (rowIndex, rowData) {
    initialized = true;

    allotInvObjIndex = rowIndex;
    warehouseObj = rowData.obj;

    //克隆数据
    invorg = cloneJsonObject(warehouseObj);

    bindSelectedDataToCard(invorg);
    if(invorg.warehouses == undefined){
        invorg.warehouses = [];
    }
    bindSelectedDataToSubDetail(invorg.warehouses);

    var viewModel = new Array();
    $('#locationsDg').datagrid('loadData',{
        total: 0,
        rows: viewModel
    });

    initialized = false;
}

//绑定到子表
function bindSelectedDataToSubDetail(detailData){
    //var detailDg = $('#warehouseList');
    //detailDg.datagrid('loadData', { total: 0, rows: [] });
    bindDetailData(detailData);
}

//绑定表体数据
function bindDetailData(data){
    var dgLst = $('#warehouseList');
    var viewModel = new Array();
    for ( var i in data) {
        var dataItem = data[i];

        var row_data = {
            warehouse_code : dataItem.warehouse_code,
            warehouse_name : dataItem.warehouse_name,
            obj: dataItem
        };
        viewModel.push(row_data);
        //dgLst.datagrid('appendRow', row_data);
    }

    dgLst.datagrid('loadData',{
        total: viewModel.length,
        rows: viewModel
    });

    //dgLst.datagrid({loadFilter: pagerFilter}).datagrid('loadData',viewModel);
}

var currentRowIndex = 0;
function onDetailRowSelected(rowIndex, detailRowData){
    currentRowIndex = rowIndex;
    currentDetailRowObj = detailRowData.obj;
}

//绑定当前选择行的数据
function bindSelectedDataToCard(data){

    $('#bizunit_code').textbox('setValue',data.bizunit.unit_code);
    $('#cmb_bizunit').combobox('setValue', data.bizunit.unit_code);
    $('#is_global').textbox('setValue',data.bizunit.is_global);
    $('#role_name').textbox('setValue',data.bizunit.role_name);

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


//仓库类型选择
function onTypeSelected(record){
    if(initialized) return;
    invorg.type = {
        code: record.code,
        name: record.name
    };
    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('type', record.name);
}

function onCharacterSelected(record){
    if(initialized) return;
    invorg.character = {
        code: record.code,
        name: record.name
    };

    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('character', record.name);
}

//渠道选择
function purchaseOrglSel(record){
    if(initialized) return;
    invorg.purchase_org = record.attributes;

    $('#channel_type').textbox('setValue',record.attributes.channel_type.name);

    if(record.attributes.customer != null)
        $('#customer').textbox('setValue',record.attributes.customer.name);
    else
        $('#customer').textbox('setValue',"");

    isBodyChanged = true;

    //-------刷新关联属性------
    updateParentListRow('purchase_org', record.attributes.name);

}




//规格字段格式化
function formatSpecificationCol(specArray){
    //计算规格字符串
    var specifications = '';
    for(var specIdx in specArray){
        var specItem = specArray[specIdx];
        if(specIdx == 0)
            specifications = specItem.specification_name + ':' + specItem.specification_value;
        else
            specifications += ',' + specItem.specification_name + ':' + specItem.specification_value;
    }
    return "<span title='" + specifications + "'>" + specifications + "</span>";
}

/*//detail数据前台分页
function pagerFilter(data){
    if (typeof data.length == 'number' && typeof data.splice == 'function'){    // 判断数据是否是数组
        data = {
            total: data.length,
            rows: data,
            footer: [
                buildSubTotalRow(data)
            ]
        }
    }
    var dg = $(this);
    var opts = dg.datagrid('options');
    var pager = dg.datagrid('getPager');
    pager.pagination({
        onSelectPage:function(pageNum, pageSize){
            opts.pageNumber = pageNum;
            opts.pageSize = pageSize;
            pager.pagination('refresh',{
                pageNumber:pageNum,
                pageSize:pageSize
            });

            //bindDetailData(data);
            dg.datagrid('loadData',data);
        }
    });
    if (!data.originalRows){
        data.originalRows = (data.rows);
    }
    var start = (opts.pageNumber-1)*parseInt(opts.pageSize);
    var end = start + parseInt(opts.pageSize);
    data.rows = (data.originalRows.slice(start, end));
    data.footer =  [
        buildSubTotalRow(data.rows)
    ];
    return data;
}*/


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

//显示商品选择对话框
function showLocationsRefDialog() {
    var dgLst =  $('#locationsRefDialog');
    dgLst.window('open');

}
$.extend($.fn.datagrid.defaults.editors, {
    locationsRef : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' id='locationsEditor' style='width:100px'>");
            //参照按钮
            var button = $("<button style='width: 23px; height: 23px' onclick='showLocationsRefDialog();'>...</button>");

            editorContainer.append(input).append(button);
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

            $(target).val(value);
            //$(target).children("input").val(value);
        },
        resize: function(target, width)
        {
            var span = $(target);
            if ($.boxModel == true){
                span.width(width - (span.outerWidth() - span.width()) - 30);
            } else {
                span.width(width - 30);
            }
        }

    }
});


					


//构建分页条件
function buildLocationsQueryCond(total, pageNum,sku,type) {
    var warehousecode = invorg.invorg.code;
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 2,
            total: total,
            total_page: -1
        },
        query: {'sku':sku,'type':type, 'warehousecode': warehousecode}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}





//构建分页条件
function buildGoodRefQueryCond(sku,nsnum,warehousecode) {
    var condition = {

        query: {'sku':sku,'type':"fixed",'nsnum':nsnum,"warehousecode":warehousecode}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}

function refExpdateDateSel(date){
	var dd=date.format("yyyy-MM-dd");
	 $('#ref_expdatestr').val(dd);
}




