
var currentChannelRow;
var hasChanged = false;

function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '渠道列表',
        iconCls : 'icon-a_detail',
        fit : true,
        singleSelect: true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : false,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        border : false,
        //onBeforeSelect: onBeforeSelect,
        onSelect: channelSelected,  //行选择事件
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
                onBeforeSelect: onBeforeSelect,
                onSelect: onWhSelected,  //仓库行选择事件
                columns:[[
                    {field:'warehouse_code',title:'仓库编码',width:'60px'},
                    {field:'name',title:'仓库名称',width:'100px',align:'left'},
                    {field:'character',title:'仓库类型',width:'60xp',align:'left'},
                    {field:'warehouse_status',title:'缺货情况',width:'60xp',align:'left'}
                ]],
                onResize:function(){
                    $('#dgList').datagrid('fixDetailRowHeight',index);
                },
                onLoadSuccess:function(){
                    setTimeout(function(){
                        $('#dgList').datagrid('fixDetailRowHeight',index);
                    },0);
                }
            });
            currentChannelRow = row.obj;
            loadChannelWarehouses(ddv, row.obj.link_account);
            $('#dgList').datagrid('fixDetailRowHeight',index);
        }
    });

    $('#allowCatalogDg').datagrid({
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
        onSelect: onAllowCatalogSelected  //行选择事件
    });
}

function channelSelected(){
    targetWarehouse = undefined;

}

function closeAllowCatalogDlg(){
    $('#allowCatalogDialog').window('close');
}

//选择允许销商品
function onAllowCatalogSelected (index, rowData) {

    var selectdData = rowData.obj;

    if(checkSkuRepeat(selectdData.product_sku_code)){
        alert_autoClose('提示','选择重复!');
        return;
    }

    //设置商品到当前表体行对象上
    delete selectdData._id;

    appendAllowGoods(selectdData);

}

//检查商品是否重复添加
function checkSkuRepeat(newSku){
    var dgList = $('#detailDg');
    var rows = dgList.datagrid('getRows');
    for(var index in rows) {
        var row = rows[index];
        if(row.obj.goods.product_sku_code == newSku){
            return true;
        }
    }
    return false;
}



function appendAllowGoods(selectdData){

    var newDetailObj = {
        sku: selectdData.product_sku_code,
        goods: selectdData
    };

    var rowData = {
        product_sku_code : selectdData.product_sku_code,
        title : selectdData.title,
        sales_catelog: selectdData.sales_catelogs,
        bar_code : selectdData.product_sku.bar_code,
        specifications: selectdData.product_sku.product_specifications,
        base_unit: selectdData.product_sku.product_spu.base_unit,
        brand: selectdData.product_sku.product_spu.brand.name,
        manufacturer: selectdData.product_sku.product_spu.brand.manufacturer.name,
        obj: newDetailObj
    };

    $('#detailDg').datagrid('appendRow',rowData);
}

function onBeforeSelect(index,row){
    if(hasChanged){
        $.messager.alert('提示','有未提交的补货记录，请先提交或取消!');
        return false;
    }
    return true;
}

//回退整个单据
function reject(){
    onWhSelected (whRowIndex, whRow);
    hasChanged = false;
}


var targetWarehouse;
var whRowIndex;
var whRow;

function onWhSelected (rowIndex, rowData) {
    whRowIndex = rowIndex;
    whRow = rowData;

    targetWarehouse = rowData.obj.ba_warehouses;

    var gridPanel = $("#detailDg").datagrid("getPanel");//先获取panel对象
    gridPanel.panel('setTitle', "[" + targetWarehouse.name + "] 补货处理");//再通过panel对象去修改title

    var queryParam = {
        query: {
            warehousecode: targetWarehouse.code,
            goodaccount: $account
        },
        group_keys: ["warehousecode","sku","invbatchcode","shelf_life"],
        need_goods: true
    };

    $.ajax({
        method : 'POST',
        url : $invcenterURL + "ocr-inventorycenter/stockonhand-mgr/query?context=" + $account + "|" + targetWarehouse.account + "|lj|aaa",
        async : true,
        data: JSON.stringify(queryParam),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            groupBySKU(data);
            bindReplenishmentDetail(data.result);
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

//按sku分组汇总
function groupBySKU(data){
    var skuMap = new Object();
    var skuList = [];
    for ( var i in data) {
        var dataItem = data[i];
        var skuObj;
        if (dataItem._id.sku in skuMap) {
            skuObj = skuMap[dataItem._id.sku];
            skuObj.batchDetails.push(dataItem);
            skuObj.onhandnum += dataItem.onhandnum;
        } else {
            var temp = cloneJsonObject(dataItem);
            temp.batchDetails = [];
            temp.batchDetails.push(dataItem);
            skuMap[dataItem._id.sku] = temp;
            skuList.push(temp);
        }
    }
    data.result = skuList;
}


//绑定补货详情工作区Datagrid
function bindReplenishmentDetail(groupStocks){
    var viewModel = new Array();
    for ( var i in groupStocks) {
        var dataItem = groupStocks[i];
        var sku = dataItem._id.sku;
        var row_data = {
            product_sku_code : sku,
            title : dataItem.goods.title,
            sales_catelog: dataItem.goods.sales_catelogs,
            specifications: dataItem.goods.product_sku.product_specifications,
            base_unit: dataItem.goods.product_sku.product_spu.base_unit,
            quantity_onhand: dataItem.onhandnum,
            obj: dataItem
         };
        viewModel.push(row_data);
    }
    $('#detailDg').datagrid('loadData',viewModel);
}


//单元格加提示信息
function formatCellTooltip(value){
    if(value == undefined) value = "";
    return "<span title='" + value + "'>" + value + "</span>";
}

//绑定列表行数据
function bindDgListData(data){
    var dgLst = $('#dgList');
    var viewModel = new Array();
    for ( var i in data.datas) {
        var dataItem = data.datas[i];
        var row_data = {
            code : dataItem.code,
            name : dataItem.name,
            channel_type: dataItem.channel_type.name,
            level : dataItem.level.name,
            region: dataItem.region.full_name,
            customer: dataItem.customer.name,
            link_account: dataItem.link_account,
            channel_assistant: dataItem.channel_assistant,
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
        },
        query: { channel_assistant: $user }
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
        url : $channelURL + "ocr-channel-manager/channel-org-mgr/findall?context=3|3|lj|aaa",
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
                            url: $salesURL + "ocr-channel-manager/channel-org-mgr/findall?context=3|3|lj|aaa",
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


function loadChannelWarehouses(ddv, channelAccount){

    var condStr = {
        goods_owner: $account,
        warehouse_account: channelAccount
    }

    $.ajax({
        method : 'POST',
        url : $channelURL + "ocr-channel-manager/supplyrelation-mgr/bc_vmi_relations.get?context=" + $account + "|" + $account + "|lj|aaa",
        async : true,
        data: JSON.stringify(condStr),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            bindChannelWhDg(ddv, data);
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

//绑定列表行数据
function bindChannelWhDg(ddv, data){
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        var row_data = {
            warehouse_code : dataItem.warehouse_code,
            name : dataItem.ba_warehouses.name,
            character: dataItem.ba_warehouses.character.name,
            obj: dataItem
        };
        viewModel.push(row_data);
    }
    ddv.datagrid('loadData',viewModel);
}


function computeRepNum(){
        var dgList = $("#detailDg");
        var rows = dgList.datagrid('getRows');
        for(var index in rows) {
            var row = rows[index];

            var query = {
                to_account: targetWarehouse.account,
                to_warehouse_code: targetWarehouse.code,
                sku: row.obj.goods.product_sku_code
            }

            queryFromWhOnHand(query, dgList, row, index);
        }
}

function queryFromWhOnHand(query, dgList, row, index){
    $.ajax({
        method: 'POST',
        url: $channelURL + "ocr-channel-manager/supplyrelation-mgr/warehousestocks.get?context=" + $account + "|" + $account + "|lj|aaa",
        async: true,
        data: JSON.stringify(query),
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {
            //var onhandNum = data.total;

            row['supply_onhand'] = data;

            dgList.datagrid('refreshRow', index);
        }
    });

}

function formatSupplyOnHand(value){
    if(value == undefined) return "";

    if(!value.exist_batch_price){
        var html = '<table cellpadding="0" cellspacing="0" style="width:100%">'+
            '<tr style="height: 20px; background-color: ivory">' +
                '<td style="text-align: left; width: 62px"><input type="checkbox" onclick="onFIFOCheck(this);">FIFO</td>' +
                '<td style="text-align: left; width: 20px">数量:</td>' +
                '<td style="text-align: left"><input style="width:70px" onchange="" disabled="disabled"></td>' +
            '</tr>' +
            '<tr style="height: 20px; background-color: ivory">' +
                '<td style="text-align: left" colspan="3">' +
                    generateStockoutTable(value) +
                '</td>' +
            '</tr>' +
         '</table>';

        return html;

    }else{
        return generateStockoutTable(value);
    }
}

function generateStockoutTable(value){

    var html = '<table border="0.5" cellpadding="0" cellspacing="0" style="width:100%">'+
        '<tr style="height: 14px; background-color: #EAEDF1">' +
            '<td style="text-align: center">仓库</td>' +
            '<td style="text-align: center">批次</td>' +
            '<td style="text-align: center">保质期</td>' +
            '<td style="text-align: center">存量</td>' +
            '<td style="text-align: center">发货量</td>' +
            '<td style="text-align: center">供货价</td>' +
            '<td style="text-align: center">零售价</td>' +
            '<td style="text-align: center">佣金</td>' +
        '</tr>';

    for(var i in value.sub_nums){
        var warehouseInfo = value.sub_nums[i];
        var supply_price = (warehouseInfo.supply_price==undefined)?0.00: warehouseInfo.supply_price.price.currency.money.toFixed(2);
        var retail_price = (warehouseInfo.retail_price==undefined)?0.00:warehouseInfo.retail_price.price.currency.money.toFixed(2);
        var commission = (warehouseInfo.commission==undefined)?0.00:warehouseInfo.commission.commission_value.currency.money.toFixed(2);

        var trHtml = '<tr style="height: 16px; background-color: ivory">' +
                '<td style="text-align: center">' + warehouseInfo.warehousename + '</td>' +
                '<td style="text-align: center">' + warehouseInfo.invbatchcode + '</td>' +
                '<td style="text-align: center">' + warehouseInfo.shelf_life + '</td>' +
                '<td style="text-align: center">' + warehouseInfo.onhandnum + '</td>' +
                '<td style="text-align: center"><input wh_code="' + warehouseInfo.warehousecode + '" batch_code="' + warehouseInfo.invbatchcode
                + '" style="width:50px" onchange="onStockNumChanged(this);"></td>' +
                '<td style="text-align: center">' + supply_price + '</td>' +
                '<td style="text-align: center">' + retail_price + '</td>' +
                '<td style="text-align: center">' + commission + '</td>' +
            '</tr>';
        html += trHtml;
    }

    html += '</table>';

    return html;
}

function onFIFOCheck(ck){
    if(ck.checked){
        var inputObj = ck.parentNode.parentNode.cells[2].childNodes[0];
        inputObj.disabled = "";
        var tableObj = ck.parentNode.parentNode.parentNode;
        tableObj.rows[1].hidden = true;

    }else{
        var inputObj = ck.parentNode.parentNode.cells[2].childNodes[0];
        inputObj.disabled = "disabled";

        var tableObj = ck.parentNode.parentNode.parentNode;
        tableObj.rows[1].hidden = false;

    }
}

//补货数量填写响应事件
function onStockNumChanged(theInput){

    hasChanged = true;

    var theValue = theInput.value;
    if(theValue == null || theValue == undefined || theValue == "") return;

    var whCode = theInput.getAttribute("wh_code");
    var batchCode = theInput.getAttribute("batch_code");

    var dgList = $('#detailDg');
    var row = dgList.datagrid('getSelected');
    var warehouseStockInfo = row["supply_onhand"];

    for(var i in warehouseStockInfo.sub_nums){
        var warehouseInfo = warehouseStockInfo.sub_nums[i];
        if(warehouseInfo.warehousecode == whCode
            && warehouseInfo.invbatchcode == batchCode){
            //warehouseInfo.warehouses.
            warehouseInfo.rep_quantity = parseFloat(theValue);
            break;
        }
    }
}


function detailListSetting(){
    $('#detailDg').datagrid({
        title : '商品补货处理',
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
        autoUpdateDetail: false,
        view: detailview,
        onSelect: onDetailRowSelected,  //行选择事件
        detailFormatter:function(index,row){
            return '<div style="padding:2px"><table class="ddv"></table></div>';
        },
        onExpandRow: function(index,row){
            var batchDetails = row.obj.batchDetails;
            if(batchDetails != null && batchDetails != undefined && batchDetails.length > 0) {
                var ddv = $(this).datagrid('getRowDetail', index).find('table.ddv');
                ddv.datagrid({
                    fitColumns: true,
                    singleSelect: true,
                    rownumbers: true,
                    loadMsg: '',
                    height: 'auto',
                    //onSelect: onWhSelected,  //行选择事件
                    columns: [[
                        {field: 'invbatchcode', title: '批次号', width: '60px'},
                        {field: 'shelf_life', title: '保质期', width: '100px', align: 'left'},
                        {field: 'onhandnum', title: '现存量', width: '100px', align: 'left'}
                    ]],
                    onResize: function () {
                        $('#detailDg').datagrid('fixDetailRowHeight', index);
                    },
                    onLoadSuccess: function () {
                        setTimeout(function () {
                            $('#detailDg').datagrid('fixDetailRowHeight', index);
                        }, 0);
                    }
                });
                bindSkuBatchs(ddv, row);
                $('#detailDg').datagrid('fixDetailRowHeight', index);
            }
        },
        //onLoadSuccess: addSubTotalRow,
        toolbar :
            [
                {
                    text : '查看补货仓库',
                    iconCls : 'icon-search',
                    handler : function() {
                        showRelations();
                    }
                },
                {
                    text : '添加商品',
                    iconCls : 'icon-add',
                    handler : function() {
                        appendGoods();
                    }
                },
                {
                    text: '删除',
                    iconCls : 'icon-remove',
                    handler : function() {
                        removeDetail();
                    }
                },
                {
                    text: '自动补货计算',
                    iconCls : 'icon-sum',
                    handler : function() {
                        computeRepNum();
                    }
                },
                {
                    text: '使用建议补货量',
                    iconCls : 'icon-ok',
                    handler : function() {

                    }
                },
                {
                    text: '刷新并撤销',
                    iconCls : 'icon-reload',
                    handler : function() {
                        reject();
                    }
                },
                {
                    text: '通知发货',
                    iconCls : 'icon-redo',
                    handler : function() {
                        notifyDelivery();
                    }
                }
            ]
    });


    $('#warehouseList').datalist({
        textField: 'name'
    });
}

function showRelations(){

    if(targetWarehouse == null || targetWarehouse.account == undefined){
        alert_autoClose('提示','请先选择渠道仓库!');
        return;
    }

    loadRepRelations();

    $('#repRelDialog').window('open');
}

//绑定供货仓库列表
function bindRepRelationsDg(data) {
    var dgLst = $('#warehouseList');
    var viewModel = new Array();
    for (var i in data.result) {
        var dataItem = data.result[i].ba_warehouses;
        var row_data = {
            name: dataItem.name
        };
        viewModel.push(row_data);
    }

    dgLst.datalist('loadData',viewModel);

}

function loadRepRelations(){
    //定义查询条件
    var condition = {
        to_warehouse_code: targetWarehouse.code,
        to_account: targetWarehouse.account
    }

    var reqData = JSON.stringify(condition);

    $.ajax({
        method: 'POST',
        url: $channelURL + "ocr-channel-manager/supplyrelation-mgr/bc_replenishment_warehouses.get?context=3|3|lj|aaa",
        data: reqData,
        async: true,
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {

            bindRepRelationsDg(data);

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

var currentRowIndex = -1;
function onDetailRowSelected(rowIndex, detailRowData){
    currentRowIndex = rowIndex;
}

function removeDetail(){
    if (currentRowIndex == undefined){return}
    $('#detailDg').datagrid('deleteRow', currentRowIndex);
    currentRowIndex = undefined;
}


//绑定允销商品datagrid
function bindAllowCatalogDg(data) {
    var dgLst = $('#allowCatalogDg');
    var viewModel = new Array();
    for (var i in data.datas) {
        var dataItem = data.datas[i].goods;
        var row_data = {
            product_sku_code: dataItem.product_sku_code,
            title: dataItem.title,
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


//构建分页条件
function buildAllowCatalogQueryCond(total, pageNum) {
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 2,
            total: total,
            total_page: -1
        },
        query: {'channel.account':targetWarehouse.account}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}

//打开允销目录，添加商品
function appendGoods(){

    if(targetWarehouse == null || targetWarehouse.account == undefined){
        alert_autoClose('提示','请先选择渠道仓库!');
        return;
    }
    loadAllowCatalogs();

    $('#allowCatalogDialog').window('open');
}

//加载允销目录
function loadAllowCatalogs() {

    //定义查询条件
    var condition = buildAllowCatalogQueryCond(0, 1);

    $.ajax({
        method: 'POST',
        url: $channelURL + "ocr-channel-manager/allowcatalog-mgr/find_pagination?context=3|3|lj|aaa",
        data: condition,
        async: true,
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {

            bindAllowCatalogDg(data);

            $('#allowCatalogDg').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh: function () {
                    var thisDg = $('#allowCatalogDg');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage: function (pPageIndex, pPageSize) {
                    //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                    var gridOpts = $('#allowCatalogDg').datagrid('options');
                    gridOpts.pageNumber = pPageIndex;
                    gridOpts.pageSize = pPageSize;

                    condition = buildAllowCatalogQueryCond(0, pPageIndex);

                    //定义查询条件
                    $.ajax({
                        method: 'POST',
                        url:  $channelURL + "ocr-channel-manager/allowcatalog-mgr/find_pagination?context=3|3|lj|aaa",
                        data: condition,
                        async: true,
                        dataType: 'json',
                        beforeSend: function (x) {
                            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                        },
                        success: function (data) {

                            bindAllowCatalogDg(data);
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

function bindSkuBatchs(ddv, row){
    var batchDetails = row.obj.batchDetails;
    if(batchDetails != null && batchDetails != undefined && batchDetails.length > 0) {
        var viewModel = new Array();
        for (var i in batchDetails) {
            var dataItem = batchDetails[i];
            var row_data = {
                invbatchcode: dataItem._id.invbatchcode,
                shelf_life: dataItem._id.shelf_life,
                onhandnum: dataItem.onhandnum
            };
            viewModel.push(row_data);
        }
        ddv.datagrid('loadData', viewModel);
    }

}



//提交渠道补货单并通知仓库发货（生成拣货单）
function notifyDelivery(){
    var dgList = $('#detailDg');
    var rows = dgList.datagrid('getRows');

    if(rows.length <= 0){
        alert_autoClose('提示','没有补货内容!');
        return;
    }

    var replenishmentObj = buildReplenishmentObj(rows);

    var replenishmentJson = JSON.stringify(replenishmentObj);

    $.ajax({
        method: 'POST',
        url: $salesURL + "ocr-sales-center/channel-restocking/commit?context=3|3|lj|aaa",
        data: replenishmentJson,
        async: true,
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {
          if(data != null && data.length > 0){
                var hasErr = false;
                var errMsg = "<ul>";
                for(var i in data){
                    var item = data[i];
                    if(item.details != null && item.details.length > 0){
                        for(var j in item.details) {
                            hasErr = true;
                            var detail = item.details[j];
                            errMsg += "<li>" + item.warehouse.name + "->" + detail.sku + "." + detail.batch_code + " 下达拣货失败，原因：" + detail.error + "</li>";
                        }
                    }
                }
                errMsg += "</ul>";
                if(hasErr) {
                    $.messager.alert('提示', errMsg);
                }else
                    alert_autoClose('提示', "提交仓库拣货成功！");
            }else {
                alert_autoClose('提示', "提交仓库拣货成功！");
            }
            hasChanged = false;
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });


}

/*构建渠道补货单
function buildReplenishmentObj(rows){

    var replenishmentObjs = new Object();

    for(var index in rows) {

        var row = rows[index];
        var deliveryNumInfo = row['supply_onhand'];
        for (var i in deliveryNumInfo.sub_nums) {
            var deliveryItem = deliveryNumInfo.sub_nums[i];
            var replenishmentObj;
            if (deliveryItem.warehouses.code in replenishmentObjs) {
                replenishmentObj = replenishmentObjs[deliveryItem.warehouses.code];
            } else {
                var theDate = new Date();
                var theDateStr = theDate.format("yyyy-MM-dd");
                replenishmentObj = {
                    req_date: theDateStr,
                    req_send_date: theDateStr,
                    req_code: "",
                    channel: currentChannelRow,
                    restocking_warehose: {
                        code: deliveryItem.warehouses.code,
                        name: deliveryItem.warehouses.name
                    },
                    is_completed: false,
                    completed_date: "",
                    details: []
                }
                replenishmentObjs[deliveryItem.warehouses.code] = replenishmentObj;
            }

            var detailItem = {
                detail_code: i,
                goods: row.obj.goods,
                quantity: deliveryItem.rep_quantity,
                supply_price: {},
                retail_price: {},
                supply_amount: {},
                retail_amount: {},
                commission: {}
            }

            replenishmentObj.details.push(detailItem);
        }
    }

    return replenishmentObjs;
}*/

//构建渠道补货单
function buildReplenishmentObj(rows){

    var theDate = new Date();
    var theDateStr = theDate.format("yyyy-MM-dd");

    delete targetWarehouse._id;
    delete currentChannelRow._id;

    var replenishmentObj = {
        req_date: theDateStr,
        req_send_date: theDateStr,
        req_code: "",
        channel: currentChannelRow,
        target_warehose: targetWarehouse,
        is_completed: false,
        completed_date: "",
        details: []
    }

    for(var index in rows) {

        var row = rows[index];
        var deliveryNumInfo = row['supply_onhand'];
        for (var i in deliveryNumInfo.sub_nums) {
            var deliveryItem = deliveryNumInfo.sub_nums[i];
            if(deliveryItem.rep_quantity != null &&
                deliveryItem.rep_quantity != undefined) {
                var supply_price = (deliveryItem.supply_price==undefined)?null:deliveryItem.supply_price;
                var retail_price = (deliveryItem.retail_price==undefined)?null:deliveryItem.retail_price;
                var commission = (deliveryItem.commission==undefined)?null:deliveryItem.commission;

                var detailCode = String(replenishmentObj.details.length + 1);

                var detailItem = {
                    restocking_warehose: {
                        code: deliveryItem.warehousecode,
                        name: deliveryItem.warehousename,
                        account: $account
                    },
                    detail_code: detailCode,
                    goods: row.obj.goods,
                    invbatchcode: deliveryItem.invbatchcode,
                    shelf_life: deliveryItem.shelf_life,
                    quantity: deliveryItem.rep_quantity,
                    ship_completed: false,
                    pick_completed: false,
                    pick_quantity: 0,
                    supply_price: supply_price,
                    retail_price: retail_price,
                    supply_amount: {},
                    retail_amount: {},
                    commission: commission
                }

                replenishmentObj.details.push(detailItem);
            }
        }
    }

    return replenishmentObj;
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