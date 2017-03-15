//﻿var allotInvObjIndex;
var allotInvObj;

//clone的数据
var cloneAllotInvObj;
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
            url: $invcenterURL + "ocr-inventorycenter/safestock/create?context=" + $token,
            data: JSON.stringify(cloneAllotInvObj),
            async: true,
            dataType: 'json',
            beforeSend: function (x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function (data) {

                //-------刷新关联属性------
                cloneAllotInvObj = data;
                allotInvObj = cloneAllotInvObj;

                var dgList = $('#dgList');
                var row = dgList.datagrid('getSelected');
                var index = dgList.datagrid('getRowIndex', row);
                row['bo_id'] = data.bo_id;
                row['sale_date'] = data.sale_date;
                row['salesman'] = data.salesman;

                row.obj = allotInvObj;
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
    $('#goodsDg').datagrid({
        loadMsg: "正在加载，请稍等...",
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 2, //每页的数据条数，默认10
        pageList: [2, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : true,
        onSelect: onGoodsSelected  //行选择事件
    });
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



function appendgoods(){

    $('#win').window('open'); // open a window
}



function append(){

    if (endEditing()){

        var theDate = new Date();
        var theDateStr = theDate.format("yyyy-MM-dd");

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
            sku: "",
            warehousecode: "",
            safenum: 0.0,
            warehouses:{},
            goods:{}
        };

        var rowData = {
            sku: "",
            warehousecode: "",
            safenum: 0.0,
            warehouses:{},
            goods:{},
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
    cloneAllotInvObj.detail = cloneJsonObject(allotInvObj.detail);


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
        cloneAllotInvObj = cloneJsonObject(allotInvObj);
        bindSelectedDataToCard(cloneAllotInvObj)


        isHeadChanged = false;
        isBodyChanged = false;
        isNewRep = false;
    }
}


function removeRep(){

    if (allotInvObjIndex == undefined || allotInvObjIndex == null){return}

    obj = new Object();
    obj._id = cloneAllotInvObj._id;

    $.messager.confirm('删除警告', '是否确认删除?', function(r){
        if (r){

            $.ajax({
                method: 'POST',
                url: $invcenterURL + "ocr-inventorycenter/safestock/remove?context=" + $token,
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
                            dgList.datagrid('selectRow',cloneAllotInvObj);
                        }else{
                            if(allotInvObjIndex == rowCount -1){
                                dgList.datagrid('selectRow',cloneAllotInvObj-1);
                            }else{
                                dgList.datagrid('selectRow',cloneAllotInvObj+1);
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
            sku:dataItem.sku,
            warehousecode:dataItem.warehousecode,
            safenum:dataItem.safenum,

            warehouses:dataItem.warehouses.name,
            goods:dataItem.goods.title,
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
		url : $invcenterURL + "ocr-inventorycenter/safestock/query?context=" + $token,
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
                           url : $invcenterURL + "ocr-inventorycenter/safestock/query?context=" + $token,
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

    allotInvObjIndex = rowIndex;
    allotInvObj = rowData.obj;

    //克隆数据
    cloneAllotInvObj = cloneJsonObject(allotInvObj);

    bindSelectedDataToCard(cloneAllotInvObj);


    var viewModel = new Array();
    $('#locationsDg').datagrid('loadData',{
        total: 0,
        rows: viewModel
    });

    initialized = false;
}

var currentRowIndex = 0;
function onDetailRowSelected(rowIndex, detailRowData){
    currentRowIndex = rowIndex;
    currentDetailRowObj = detailRowData.obj;
}

//绑定当前选择行的数据
function bindSelectedDataToCard(data){


    $('#sku').textbox('setValue',data.sku);
    $('#warehousecode').textbox('setValue',data.warehousecode);
    $('#safenum').textbox('setValue',data.safenum);

    $('#warehouses').textbox('setValue',data.warehouses.name);
    $('#goods').val(data.goods.title);

	 // if(data.warehouse != null||data.warehouse.length!=0) {
    //     $('#warehouse').combobox('setValue', data.warehouse.code);
    // }
    // else{
    //     $('#warehouse').combobox('setValue', "");
    // }
	

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


function onskuChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.sku = newValue;
    isBodyChanged =true;
    updateParentListRow('sku', cloneAllotInvObj.sku);
}
function onwarehousecodeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.warehousecode = newValue;
    isBodyChanged =true;
    updateParentListRow('warehousecode', cloneAllotInvObj.warehousecode);
}
function onsafenumChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.safenum = newValue;
    isBodyChanged =true;
    updateParentListRow('safenum', cloneAllotInvObj.safenum);
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

//detail数据前台分页
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

function refExpdateDateSel(date){
    var dd=date.format("yyyy-MM-dd");
    $('#ref_expdatestr').val(dd);



}


var warehoseLoader = function (param, success, error) {
    $.ajax({
        method: 'POST',
        url: $invcenterURL + "ocr-inventorycenter/invorg-mgr/queryAll?context=" + $account + "|" + $account + "|lj|aaa",
        async: true,
        data: JSON.stringify({}),
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {
            success(data.result);
        },
        error: function (x, e) {
            var args = [];
            args.push(e);
            error.apply(this, args);
        }
    });
}
//仓库选择
function onWarehoseSelected(record){
    if(initialized) return;
    cloneAllotInvObj.warehouses = record;

    isBodyChanged = true;
    //-------刷新关联属性------
    cloneAllotInvObj.warehousecode = record.code;
    // $('#sku').textbox('setValue',data.sku);
    $('#warehousecode').textbox('setValue',record.code);

    updateParentListRow('warehousecode', record.code);
    updateParentListRow('warehouses', record.name);
}

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

function showTree() {


    $.ajax({
        method: 'get',
        url:$channelURL + 'ocr-channel-manager/channel-org-mgr/findtree?context=3|3|lj|aaa',
        async: true,

        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {
            $('#locationTree').tree({data:data});
            // success(data.result);

        },
        error: function (x, e) {
            var args = [];
            args.push(e);
            // error.apply(this, args);
        }
    });

    $('#channelTreeDlg').window('open');
}

function showGoodsRefDialog() {
    $('#goodsRefDialog').window('open');
}

//品类树选择，查询商品列表
function catelogTreeSel(node) {

    var catelog = node.attributes.inner_code;

    //定义查询条件
    var condition = buildGoodsQueryCond(0, 1, catelog);

    $.ajax({
        method: 'POST',
        url: $goodsURL + "ocr-goods-center/goods-mgr/findall?context=3|3|lj|aaa",
        data: condition,
        async: true,
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {

            bindGoodsDg(data);

            $('#goodsDg').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh: function () {
                    var thisDg = $('#goodsDg');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage: function (pPageIndex, pPageSize) {
                    //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                    var gridOpts = $('#goodsDg').datagrid('options');
                    gridOpts.pageNumber = pPageIndex;
                    gridOpts.pageSize = pPageSize;

                    condition = buildGoodsQueryCond(0, pPageIndex, catelog);

                    //定义查询条件
                    $.ajax({
                        method: 'POST',
                        url: $goodsURL + "ocr-goods-center/goods-mgr/findall?context=3|3|lj|aaa",
                        data: condition,
                        async: true,
                        dataType: 'json',
                        beforeSend: function (x) {
                            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                        },
                        success: function (data) {

                            bindGoodsDg(data);
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

//绑定商品datagrid
function bindGoodsDg(data) {
    var dgLst = $('#goodsDg');
    var viewModel = new Array();
    for (var i in data.datas) {
        var dataItem = data.datas[i];
        var row_data = {
            product_sku_code: dataItem.product_sku_code,
            title: dataItem.title,
            batch_code:dataItem.invbatchcode,
            sales_catelog: dataItem.sales_catelogs,
            bar_code: dataItem.product_sku.bar_code,
            specifications: dataItem.product_sku.product_specifications,
            base_unit: dataItem.product_sku.product_spu.base_unit,
            //quantity: dataItem.quantity,
            brand: dataItem.product_sku.product_spu.brand.name,
            manufacturer: dataItem.product_sku.product_spu.brand.manufacturer.name,
            obj: dataItem
        };
        viewModel.push(row_data);
    }

    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}

function onGoodsSelected (index,rowData) {
    $('#goodsRefDialog').window('close');

    var selectdData = rowData;

    $('#goods').val(selectdData.title);

    //设置商品到当前表体行对象上
    // cloneAllotInvObj.goods.product_sku_code = selectdData.product_sku_code;
    // cloneAllotInvObj.goods.title = selectdData.title;
    // cloneAllotInvObj.goods.account = selectdData.obj.account;

    cloneAllotInvObj.goods=selectdData;

    $('#sku').textbox('setValue',selectdData.product_sku_code);
    cloneAllotInvObj.sku = selectdData.product_sku_code;

    isBodyChanged = true;

    // onGoodChange();
    //-------刷新关联属性------
    updateParentListRow('sku', selectdData.product_sku_code);
    updateParentListRow('goods', selectdData.title);
}
