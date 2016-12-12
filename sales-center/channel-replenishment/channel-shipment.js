var replenishmentObjIndex;
var replenishmentObj;

var cloneReplenishmentObj;

//新增发货单
var newShipmentDetails = [];

//子表行状态
var editIndex = undefined;

//保存
function confirm(){
    if(newShipmentDetails.length > 0){

        var data = cloneReplenishmentObj;

        $.ajax({
            method: 'POST',
            url: $salesURL + "ocr-sales-center/channel-restocking/create?context=3|3|lj|aaa",
            data: JSON.stringify(cloneReplenishmentObj),
            async: true,
            dataType: 'json',
            beforeSend: function (x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function (data) {

                //-------刷新关联属性------
                cloneReplenishmentObj = data;
                replenishmentObj = cloneReplenishmentObj;

                var dgList = $('#dgList');
                var row = dgList.datagrid('getSelected');
                var index = dgList.datagrid('getRowIndex', row);
                row['code'] = data.bo_id;
                row['req_date'] = data.req_date;
                row['req_send_date'] = data.req_send_date;
                row.obj = replenishmentObj;
                dgList.datagrid('refreshRow', index);

                resetState();
                alert_autoClose('提示','保存成功!');

            },
            error: function (x, e) {
                alert(e.toString(), 0, "友好提醒");
            }
        });

    }else{
        alert_autoClose('提示','没有要提交的数据!');
    }
}

function resetState(){
    editIndex = undefined;
    newShipmentDetails = [];
}

function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '渠道补货单列表',
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

function detailListSetting(){
    $('#detailDg').datagrid({
        title : '渠道补货单详情',
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
        showFooter: true,
        //onLoadSuccess: addSubTotalRow,
/*        onClickCell: onClickCell,
        onEndEdit: onEndEdit,*/
        onSelect: onDetailRowSelected,  //行选择事件
        autoUpdateDetail: false,
        view: detailview,
        detailFormatter:function(index,row){
            return '<div style="padding:2px"><table class="ddv"></table></div>';
        },
        toolbar :
            [
                {
                    text : '整单签发',
                    iconCls : 'icon-large-smartart',
                    handler : function() {
                        autoAddShipmentInfoForAllRow();
                    }
                },
                {
                    text : '整行签发',
                    iconCls : 'icon-large-smartart',
                    handler : function() {
                        autoAddShipmentInfoForRow();
                    }
                }
            ],
        onExpandRow: function(index,row){
            currentRowIndex = index;
            var ddv = $(this).datagrid('getRowDetail',index).find('table.ddv');
            ddv.datagrid({
                fitColumns:true,
                singleSelect:true,
                rownumbers:true,
                loadMsg:'',
                height:'auto',
                onSelect: onShipmentSelected,  //行选择事件
                onClickCell: onClickCell,
                //onEndEdit: onEndEdit,
                columns:[[
                    {field:'ship_quantity',title:'发货数量',width:'60px',editor:'shipQuantityEditor'},
                    {field:'ship_date',title:'发货日期',width:'100px',align:'left'},
                    {field:'ship_actor',title:'发货人',width:'60xp',align:'left'},
                    {field:'ship_code',title:'发货单号',width:'100px',align:'left'},
                    {field:'logistics_code',title:'物流单号',width:'100xp',align:'left', editor:'logisticsCodeEditor'},
                    {field:'is_shipped',title:'已发货',width:'100xp',align:'left'}
                ]],
                onResize:function(){
                    $('#detailDg').datagrid('fixDetailRowHeight',index);
                },
                onLoadSuccess:function(){
                    setTimeout(function(){
                        $('#detailDg').datagrid('fixDetailRowHeight',index);
                    },0);
                },
                toolbar :
                [
                    {
                        text : '[ 发货记录 ] '
                    },
                    {
                        text : '新增',
                        iconCls : 'icon-add',
                        handler : function() {
                            append(ddv,index);
                        }
                    },
                    {
                        text: '删除',
                        iconCls : 'icon-remove',
                        handler : function() {
                            removeDetail(ddv, index);
                        }
                    }
                ]
            });
            //currentChannelRow = row.obj;
            loadShipmentInfos(ddv, row.obj.shipments);
            $('#detailDg').datagrid('fixDetailRowHeight',index);
        }
    });

}

function autoAddShipmentInfoForAllRow() {
    var detailDg = $('#detailDg');
    var rows = detailDg.datagrid('getRows');
    if(rows != null && rows.length > 0){
        for(var index in rows) {
            var row = rows[index];
            addShipmentInfoForRow(detailDg, row, index);
        }
    }
}

function autoAddShipmentInfoForRow() {
    var detailDg = $('#detailDg');
    var row = detailDg.datagrid('getSelected');
    var index = detailDg.datagrid('getRowIndex', row);
    addShipmentInfoForRow(detailDg, row, index);
}

function addShipmentInfoForRow(detailDg, row, index){
    if(row != null) {
        detailDg.datagrid('expandRow', index);

        var ddv = detailDg.datagrid('getRowDetail', index).find('table.ddv');

        var subRows = $(ddv).datagrid('getRows');
        if(subRows != null && subRows.length > 0){
            //alert_autoClose("提示", "已存在发货记录,不能整行签发");
            return;
        }

        var theDate = new Date();
        var theDateStr = theDate.format("yyyy-MM-dd");

        var shipmentObj = {
            ship_quantity: row.obj.pick_quantity,
            ship_date: theDateStr,
            ship_actor: $user,
            ship_code: "",
            logistics_code: "",
            is_shipped: false,
            accept_completed: false,
            accept_quantity: 0,
            reject_quantity: 0
        };
        newShipmentDetails.push(shipmentObj);
        var repDetailItemObj = getRepDetailItemObj(index);
        if (repDetailItemObj.shipments == undefined || repDetailItemObj.shipments == null) {
            repDetailItemObj.shipments = [];
        }
        repDetailItemObj.shipments.push(shipmentObj);

        var rowData = {
            ship_quantity: row.obj.pick_quantity,
            ship_date: theDateStr,
            ship_actor: $user,
            ship_code: "",
            logistics_code: "",
            is_shipped: "否",
            obj: shipmentObj
        };

        $(ddv).datagrid('appendRow', rowData);

        detailDg.datagrid('fixDetailRowHeight', index);
    }
}


function loadShipmentInfos(ddv, data){
    var viewModel = new Array();
    for ( var i in data) {
        var dataItem = data[i];
        var isShipped = (dataItem.is_shipped)?"是":"否";
        var row_data = {
            ship_quantity: dataItem.ship_quantity,
            ship_date : dataItem.ship_date,
            ship_code : dataItem.ship_code,
            logistics_code : dataItem.logistics_code,
            is_shipped: isShipped,
            obj: dataItem
        };
        viewModel.push(row_data);
    }

    ddv.datagrid('loadData',viewModel);
}


function onBeforeSelect(index,row){
    if(newShipmentDetails.length > 0){
        $.messager.alert('提示','有未提交的发货记录，请先提交或取消!');
        return false;
    }
    return true;
}

//商品分类字段格式化
function formatCatelogsCol(catelogArray){
    //计算规格字符串
    var ret = '';
    for(var idx in catelogArray){
        var item = catelogArray[idx];
        if(idx == 0)
            ret = item.name;
        else
            ret += ',' + item.name;
    }
    return "<span title='" + ret + "'>" + ret + "</span>";
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

//发货数量
$.extend($.fn.datagrid.defaults.editors, {
    logisticsCodeEditor : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' style='width:100px' onchange='logisticsCodeChanged(this);'>");
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

//物流编号设置值
function logisticsCodeChanged(theInput){
    var value = theInput.value;
    if(value == ""){
        return;
    }
    //-------刷新关联属性------
    /*    var row = $(subGrid).datagrid('getSelected');
     var index = $(subGrid).datagrid('getRowIndex', row);*/

    if(editIndex != undefined && editIndex != null) {
        var rows = $(subGrid).datagrid('getRows');
        var row = rows[editIndex];
        row['logistics_code'] = value;
        row.obj.logistics_code = value;

        $(subGrid).datagrid('refreshRow', editIndex);
    }
}

//发货数量
$.extend($.fn.datagrid.defaults.editors, {
    shipQuantityEditor : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' style='width:100px' onchange='shipQuantityChanged(this);'>");
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

//发货数量设置
function shipQuantityChanged(theInput){
    var value = theInput.value;
    if(value == ""){
        return;
    }
    //-------刷新关联属性------
/*    var row = $(subGrid).datagrid('getSelected');
    var index = $(subGrid).datagrid('getRowIndex', row);*/

    if(editIndex != undefined && editIndex != null) {
        var rows = $(subGrid).datagrid('getRows');
        var row = rows[editIndex];
        row['ship_quantity'] = value;
        row.obj.ship_quantity = value;

        $(subGrid).datagrid('refreshRow', editIndex);
    }
}

function onShipmentSelected(rowIndex, detailRowData){
    editIndex = rowIndex;
}

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

function append(ddv, index){

    subGrid = ddv;

    if (endEditing(ddv)){

        var theDate = new Date();
        var theDateStr = theDate.format("yyyy-MM-dd");

        var shipmentObj = {
            ship_quantity: 0,
            ship_date: theDateStr,
            ship_actor: $user,
            ship_code: "",
            logistics_code: "",
            is_shipped: false,
            accept_completed: false,
            accept_quantity: 0,
            reject_quantity: 0
        };
        newShipmentDetails.push(shipmentObj);
        var repDetailItemObj = getRepDetailItemObj(index);
        if(repDetailItemObj.shipments == undefined || repDetailItemObj.shipments == null){
            repDetailItemObj.shipments = [];
        }
        repDetailItemObj.shipments.push(shipmentObj);

        var rowData = {
            ship_quantity : 0,
            ship_date : theDateStr,
            ship_actor: $user,
            ship_code: "",
            logistics_code: "",
            is_shipped: "否",
            obj: shipmentObj
        };

        $(ddv).datagrid('appendRow',rowData);

        //必须加入到originalRows中，否则翻页会有问题
        //var data = $("#detailDg").datagrid('getData');
        //data.originalRows.push(rowData);

        editIndex = $(ddv).datagrid('getRows').length-1;
        $(ddv).datagrid('selectRow', editIndex)
            .datagrid('beginEdit', editIndex);

        $('#detailDg').datagrid('fixDetailRowHeight',index);

    }
}

function getRepDetailItemObj(index){
    var parentDg = $('#detailDg');
    var parentRows = parentDg.datagrid('getRows');
    return parentRows[index].obj;
}

function removeDetail(ddv, pIndex){
    subGrid = ddv;

     var row = $(ddv).datagrid('getSelected');
     if(row == null) return;

     var index = $(ddv).datagrid('getRowIndex', row);

    if(row.obj.is_shipped){
        alert_autoClose("提示","已发货，不允许删除");
        return;
    }

    removeByValue(newShipmentDetails, row.obj);
    var repDetailItemObj = getRepDetailItemObj(pIndex);
    if(repDetailItemObj.shipments == undefined || repDetailItemObj.shipments == null){
    }else {
        removeByValue(repDetailItemObj.shipments, row.obj);
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


//回退整个单据
function reject(){
    //重新克隆
    cloneReplenishmentObj = cloneJsonObject(replenishmentObj);
    bindSelectedDataToSubDetail(cloneReplenishmentObj.details);

    resetState();
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
            code : dataItem.bo.bo_id,
            req_date : dataItem.bo.req_date,
            req_send_date: dataItem.bo.req_send_date,
            req_code : dataItem.bo.req_code,
            channel_name: dataItem.bo.channel.name,
            is_completed: dataItem.bo.is_completed,
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
        url : $salesURL + "ocr-sales-center/channel-restocking/findcreated?context=3|3|lj|aaa",
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
 /*                   if(isNewRep){
                        if(repCurrentPageIndex != pPageIndex) {
                            $('#dgList').datagrid('getPager').pagination('select', repCurrentPageIndex);
                            $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
                        }
                        return;
                    }else {*/
                        //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                        repCurrentPageIndex = pPageIndex;
                        var gridOpts = $('#dgList').datagrid('options');
                        gridOpts.pageNumber = pPageIndex;
                        gridOpts.pageSize = pPageSize;

                        condStr = buildRepsQueryCond(0, pPageIndex);

                        //定义查询条件
                        $.ajax({
                            method: 'POST',
                            url: $salesURL + "ocr-sales-center/channel-restocking/findcreated?context=3|3|lj|aaa",
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

//行选择事件

var initialized = false;
function onRowSelected (rowIndex, rowData) {
    initialized = true;

    replenishmentObjIndex = rowIndex;
    replenishmentObj = rowData.obj;

    cloneReplenishmentObj = cloneJsonObject(replenishmentObj);
    bindSelectedDataToSubDetail(cloneReplenishmentObj.bo.details);

    initialized = false;
}

var currentRowIndex = 0;
function onDetailRowSelected(rowIndex, detailRowData){
    currentRowIndex = rowIndex;
}

//绑定到子表
function bindSelectedDataToSubDetail(detailData){
    var detailDg = $('#detailDg');
    //detailDg.datagrid('loadData', { total: 0, rows: [] });
    bindDetailData(detailData);
}

//绑定表体数据
function bindDetailData(data){
    var dgLst = $('#detailDg');
    var viewModel = new Array();
    for ( var i in data) {
        var dataItem = data[i];
        var pickCompleted = (dataItem.pick_completed)?"是":"否";
        var shipCompleted = (dataItem.ship_completed)?"是":"否";

        var row_data = {
            restocking_warehose: dataItem.restocking_warehose.name,
            product_sku_code : dataItem.goods.product_sku_code,
            title : dataItem.goods.title,
            sales_catelog: dataItem.goods.sales_catelogs,
            bar_code : dataItem.goods.product_sku.bar_code,
            invbatchcode: dataItem.invbatchcode,
            shelf_life: dataItem.shelf_life,
            specifications: dataItem.goods.product_sku.product_specifications,
            base_unit: dataItem.goods.product_sku.product_spu.base_unit,
            quantity: dataItem.quantity,
            pick_quantity: dataItem.pick_quantity,
            pick_completed: pickCompleted,
            ship_completed: shipCompleted,
            obj: dataItem
        };
        viewModel.push(row_data);
        //dgLst.datagrid('appendRow', row_data);
    }

    dgLst.datagrid({loadFilter: pagerFilter}).datagrid('loadData',viewModel);
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

//构建“合计”行
function buildSubTotalRow(data) {
    var subTotal = {
            product_sku_code: '<span class="subtotal">合计</span>',
            quantity: '<span class="subtotal">' + compute(data, "quantity") + '</span>',
            title : '',
            sales_catelog: '',
            bar_code : '',
            specifications: '',
            base_unit: '',
            supply_price: '',
            retail_price: '',
            commission: '',
            brand: '',
            manufacturer: ''
        };
    return subTotal;
}

function compute(date, colName) {
    var total = 0;
    for (var i = 0; i < date.length; i++) {
        total += parseFloat(date[i][colName]);
    }
    return total;
}

//从新计算合计行
function refreshSubTotalRows(){
    //计算合计列
    var footerRows = $('#detailDg').datagrid('getFooterRows');
    var rows = $("#detailDg").datagrid("getRows"); //获取当前页的所有行。
    footerRows[0]['quantity'] = '<span class="subtotal">' + computeForRows(rows, "quantity") + '</span>';
    $('#detailDg').datagrid('reloadFooter');
}

function computeForRows(rows, colName) {
    var total = 0;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        total += parseFloat(row[colName]);
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