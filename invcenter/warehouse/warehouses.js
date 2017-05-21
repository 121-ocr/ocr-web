﻿window.$token = localStorage.getItem("access_token");

//﻿var allotInvObjIndex;
var warehouseObj;

//clone的数据
var warehouse;
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

        $.ajax({
            method: 'POST',
            url: $apiRoot + "ocr-inventorycenter/warehouse-mgr/create?token=" + window.$token,
            data: JSON.stringify(warehouse),
            async: true,
            dataType: 'json',
            beforeSend: function (x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function (data) {

                //-------刷新关联属性------
                warehouse = data;
                warehouseObj = warehouse;

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

    $('#vmiOwnerList').datagrid({
        loadMsg: "正在加载，请稍等...",
        iconCls : 'icon-a_detail',
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
        toolbar :
            [
                {
                    text : '添加',
                    iconCls : 'icon-add',
                    handler : function() {
                        addSupplier();
                    }
                },
                {
                    text : '删除',
                    iconCls : 'icon-remove',
                    handler : function() {
                        deleteSupplier();
                    }
                }

            ]
    });

}


function addSupplier(){

    var supplierDg = $('#supplierDg');
    supplierDg.datagrid('loadData',{
        total: 0,
        rows: []
    });
    //定义查询条件
    $.ajax({
        method : 'GET',
        url : $apiRoot + "ocr-inventorycenter/suppliers-mgr/query-nopaging?token=" + window.$token,
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
                    if(!existSupplier(dataItem.code)) {
                        var row_data = {
                            supplier_code: dataItem.code,
                            supplier_name: dataItem.name,
                            obj: dataItem
                        };
                        viewModel.push(row_data);
                    }
                }

                supplierDg.datagrid('loadData',{
                    total: data.total,
                    rows: viewModel
                });

            }
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

    $('#supplierDlg').window('open');  // open a window
}

function existSupplier(supplierCode){
    if(warehouse.vmi_suppliers != undefined && warehouse.vmi_suppliers != null && warehouse.vmi_suppliers.length > 0){
        for(var j in warehouse.vmi_suppliers){
            var supplier = warehouse.vmi_suppliers[j];
            if(supplier.supplier_code == supplierCode){
                return true;
            }
        }
    }
    return false;
}

function removeSupplier(supplierCode){
    if(warehouse.vmi_suppliers != undefined && warehouse.vmi_suppliers != null && warehouse.vmi_suppliers.length > 0){
        for(var j in warehouse.vmi_suppliers){
            var supplier = warehouse.vmi_suppliers[j];
            if(supplier.supplier_code == supplierCode){
                warehouse.vmi_suppliers.splice(j,1);
                return;
            }
        }
    }
    return;
}


function supplierSelectOk(){

    var supplierRows = $('#supplierDg').datagrid('getSelections');
    if(supplierRows != null && supplierRows.length > 0) {
        if (warehouse.vmi_suppliers == undefined || warehouse.vmi_suppliers == null) {
            warehouse.vmi_suppliers = [];
        }

        var vmiOwnerList = $('#vmiOwnerList');

        for (var i in supplierRows) {
            var dataItem = supplierRows[i].obj;
            var newItem = {
                supplier_code: dataItem.code,
                supplier_name: dataItem.name
            };
            warehouse.vmi_suppliers.push(newItem);
            var row_data = {
                supplier_code: newItem.supplier_code,
                supplier_name: newItem.supplier_name,
                obj: newItem
            };

            vmiOwnerList.datagrid('appendRow', row_data);
        }

        isHeadChanged = true;
    }

    $('#supplierDlg').window('close');  // open a window

}

function deleteSupplier() {
    var vmiOwnerList = $('#vmiOwnerList');

    var row = vmiOwnerList.datagrid('getSelected');
    if(row != null) {

        removeSupplier(row.obj.supplier_code);

        var actIndex = vmiOwnerList.datagrid('getRowIndex', row);

        vmiOwnerList.datagrid('deleteRow', actIndex);

        if (actIndex > 0) {
            vmiOwnerList.datagrid('selectRow', actIndex - 1);
        } else {
            var rows = vmiOwnerList.datagrid('getRows');
            if (rows.length > 0) {
                vmiOwnerList.datagrid('selectRow', actIndex + 1);
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
            detail_code: "",
            goods: {},
            // quantity: 0,
            nynum: 0,
            nsnum: 0,
            unqualifiednum: 0,
            locations: "",
            shelflife: 0,
            shelflifeunit:"",
            expdate:theDateStr,
            su_batch_code:"",
            batch_code: "",
            purchase_price: {},
            supply_price: {},
            supply_amount: {},
            discount: "",
            discount_amount: {},
            note: ""
        };
        warehouse.detail.push(newDetailObj);

        var rowData = {
            product_sku_code : "",
            title : "",
            sales_catelog: {},
            bar_code : "",
            specifications: {},
            base_unit: "",
            batch_code: "",
            // quantity: 0,
            nynum: 0,
            nsnum: 0,
            unqualifiednum: 0,
            locations: "",
            shelflife: 0,
            shelflifeunit:"",
            expdate:theDateStr,
            su_batch_code:"",
            purchase_price: 0.00,
            supply_price: 0.00,
            supply_amount: 0.00,
            discount: 0.00,
            discount_amount: 0.00,
            brand: "",
            manufacturer: "",
            note: "",
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
            code: "",
            name: "",
            type: {},
            character:{},
            region_code:"",
            region_name:"",
            region_detail:"",
            purchase_org:{}
        };

        var rowData = {
            code: "",
            name: "",
            type: {},
            character:{},
            region_code:"",
            region_name:"",
            region_detail:"",
            purchase_org:{},
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
    warehouse.detail = cloneJsonObject(warehouseObj.detail);
    bindSelectedDataToSubDetail(warehouse.detail);

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
        warehouse = cloneJsonObject(warehouseObj);
        bindSelectedDataToCard(warehouse)
        bindSelectedDataToSubDetail(warehouse.detail);

        isHeadChanged = false;
        isBodyChanged = false;
        isNewRep = false;
    }
}

function removeRep(){

    if (allotInvObjIndex == undefined || allotInvObjIndex == null){return}

    obj = new Object();
    obj._id = warehouse._id;

    $.messager.confirm('删除警告', '是否确认删除?', function(r){
        if (r){

            $.ajax({
                method: 'POST',
                url: $apiRoot + "ocr-inventorycenter/warehouse-mgr/remove?token=" + window.$token,
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
                            dgList.datagrid('selectRow',warehouse);
                        }else{
                            if(allotInvObjIndex == rowCount -1){
                                dgList.datagrid('selectRow',warehouse-1);
                            }else{
                                dgList.datagrid('selectRow',warehouse+1);
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

        var row_data = {
            name:dataItem.name,
            code:dataItem.code,
            type:dataItem.type.name,
            character:dataItem.character.name,
            region_code:dataItem.region_code,
            region_name:dataItem.region_name,
            region_detail:dataItem.region_detail,
            account:dataItem.account,
            // sale_date: dataItem.sale_date,
            // salesman: dataItem.salesman,
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
        url : $apiRoot + "ocr-inventorycenter/warehouse-mgr/query?token=" + window.$token,
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

    //定义查询条件
    $.ajax({
        method : 'GET',
        url :  $apiRoot + 'ocr-inventorycenter/warehouse-mgr/owner-bizunit.get?token=' + window.$token,
        async : true,
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
    warehouse.owner_bizunit = {
        id: record.id,
        unit_code: record.unit_code,
        unit_name: record.unit_name
    };
}



//行选择事件

var initialized = false;
function onRowSelected (rowIndex, rowData) {
    initialized = true;

    allotInvObjIndex = rowIndex;
    warehouseObj = rowData.obj;

    //克隆数据
    warehouse = cloneJsonObject(warehouseObj);

    bindSelectedDataToCard(warehouse);
    bindSelectedDataToSubDetail(warehouse.vmi_suppliers);

    var viewModel = new Array();
    $('#locationsDg').datagrid('loadData',{
        total: 0,
        rows: viewModel
    });

    initialized = false;
}

//绑定到子表
function bindSelectedDataToSubDetail(detailData){
    //var detailDg = $('#vmiOwnerList');
    //detailDg.datagrid('loadData', { total: 0, rows: [] });
    bindDetailData(detailData);
}

//绑定表体数据
function bindDetailData(data){
    var dgLst = $('#vmiOwnerList');
    var viewModel = new Array();
    for ( var i in data) {
        var dataItem = data[i];

        var row_data = {
            supplier_code : dataItem.supplier_code,
            supplier_name : dataItem.supplier_name,
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


    $('#code').textbox('setValue',data.code);
    $('#name').textbox('setValue',data.name);
    $('#type').textbox('setValue',data.type.name);
    $('#character').textbox('setValue',data.character.name);
    $('#region_code').textbox('setValue',data.region_code);
    $('#region_name').textbox('setValue',data.region_name);
    $('#region_detail').textbox('setValue',data.region_detail);

    $('#purchase_org').textbox('setValue',data.purchase_org.name);

    //$('#cmb_bizunit').combobox('setValue', data.owner_bizunit.unit_name);



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


function onWarehouseCodeChanged(newValue,oldValue) {
    if(initialized) return;
    warehouse.code = newValue;
    isBodyChanged =true;
    updateParentListRow('code', warehouse.code);
}
function onWarehouseNameChanged(newValue,oldValue) {
    if(initialized) return;
    warehouse.name = newValue;
    isBodyChanged =true;
    updateParentListRow('name', warehouse.name);
}

function onRegionCodeChanged(newValue,oldValue){
    if(initialized) return;
    warehouse.region_code = newValue;
    isBodyChanged = true;
    updateParentListRow('region_code', warehouse.region_code);
}

function onRegionNameChanged(newValue,oldValue) {
    if(initialized) return;
    warehouse.region_name = newValue;
    isBodyChanged = true;

    updateParentListRow('region_name', warehouse.region_name);
}
function onRegionDetailChanged(newValue,oldValue) {
    if(initialized) return;
    warehouse.region_detail= newValue;
    isBodyChanged = true;

    updateParentListRow('region_detail', newValue);
}




//仓库类型选择
function onTypeSelected(record){
    if(initialized) return;
    warehouse.type = {
        code: record.code,
        name: record.name
    };
    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('type', record.name);
}

function onCharacterSelected(record){
    if(initialized) return;
    warehouse.character = {
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
    warehouse.purchase_org = record.attributes;

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
    var warehousecode = warehouse.warehouse.code;
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




