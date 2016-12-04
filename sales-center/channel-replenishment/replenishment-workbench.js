
var currentChannelRow;

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
                onSelect: onWhSelected,  //行选择事件
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
}


var targetAcct;
var targetWh;
function onWhSelected (rowIndex, rowData) {
    //initialized = true;

    var warehouseInfo = rowData.obj.ba_warehouses;

    targetAcct = warehouseInfo.account;
    targetWh = warehouseInfo.code;

    var query = {
        goodaccount: $account,
        warehousecode: warehouseInfo.code
    };

    $.ajax({
        method : 'POST',
        url : $invcenterURL + "/ocr-inventorycenter/stockonhand_mgr/query?context=" + $account + "|" + warehouseInfo.account + "|lj|aaa",
        async : true,
        data: JSON.stringify(query),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            bindReplenishmentDetail(data);
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

//绑定补货详情工作区Datagrid
function bindReplenishmentDetail(data){
    var viewModel = new Array();
    for ( var i in data.result) {
        var dataItem = data.result[i];
        var row_data = {
            product_sku_code : dataItem.sku,
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
                to_account: targetAcct,
                to_warehouse_code: targetWh,
                sku: row.obj.sku
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

    var html = '<table cellpadding="0" cellspacing="0" style="width:100%">'+
            '<tr style="height: 14px; background-color: #EAEDF1">' +
                '<td style="text-align: center">仓库</td>' +
                '<td style="text-align: center">存量</td>' +
                '<td style="text-align: center">发货量</td>' +
            '</tr>';

    for(var i in value.sub_nums){
        var warehouseInfo = value.sub_nums[i];
        var trHtml = '<tr style="height: 16px">' +
        '<td style="text-align: center">' + warehouseInfo.warehouses.name + '</td>' +
        '<td style="text-align: center">' + warehouseInfo.onhandnum + '</td>' +
        '<td style="text-align: center"><input tag=\"' + warehouseInfo.warehouses.code + '\" style="width:50px" onchange="onStockNumChanged(this);"></td>' +
        '</tr>';
        html += trHtml;
    }

    html += '</table>';

    return html;
}

//补货数量填写响应事件
function onStockNumChanged(theInput){
    var theValue = theInput.value;
    if(theValue == null || theValue == undefined || theValue == "") return;

    var whCode = theInput.getAttribute("tag");

    var dgList = $('#detailDg');
    var row = dgList.datagrid('getSelected');
    var warehouseStockInfo = row["supply_onhand"];

    for(var i in warehouseStockInfo.sub_nums){
        var warehouseInfo = warehouseStockInfo.sub_nums[i];
        if(warehouseInfo.warehouses.code == whCode){
            //warehouseInfo.warehouses.
            warehouseInfo.rep_quantity = theValue;
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
        //onLoadSuccess: addSubTotalRow,
        toolbar :
            [
                {
                    text : '查看补货关系',
                    iconCls : 'icon-search',
                    handler : function() {
                        append();
                    }
                },
                {
                    text : '从补货仓加入',
                    iconCls : 'icon-add',
                    handler : function() {
                        append();
                    }
                },
                {
                    text: '修改',
                    iconCls : 'icon-edit',
                    handler : function() {

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
                        removeDetail();
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

//补货数量填写响应事件
function onStockNumChanged(theInput){
    var theValue = theInput.value;
    if(theValue == null || theValue == undefined || theValue == "") return;

    var whCode = theInput.getAttribute("tag");

    var dgList = $('#detailDg');
    var row = dgList.datagrid('getSelected');
    var warehouseStockInfo = row["supply_onhand"];

    for(var i in warehouseStockInfo.sub_nums){
        var warehouseInfo = warehouseStockInfo.sub_nums[i];
        if(warehouseInfo.warehouses.code == whCode){
            //warehouseInfo.warehouses.
            warehouseInfo.rep_quantity = theValue;
            break;
        }
    }
}

//提交渠道补货单并通知仓库发货（生成拣货单）
function notifyDelivery(){
    var dgList = $('#detailDg');
    var rows = dgList.datagrid('getRows');

    var replenishmentObjs = buildReplenishmentObj(rows);

    var replenishmentArray = [];

    for(var k in replenishmentObjs){
        replenishmentArray.push(replenishmentObjs[k]);
    }

    var jsArray =  JSON.stringify(replenishmentArray);

    $.ajax({
        method: 'POST',
        url: $salesURL + "ocr-sales-center/channel-restocking/batch_create?context=3|3|lj|aaa",
        data: jsArray,
        async: true,
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json-array; charset=utf-8");
        },
        success: function (data) {

            var msg = "成功数：" + data.successed_count; + "，失败数：" + data.failed_count;
            alert_autoClose('提示',msg);

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });


}

//构建渠道补货单
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
}


//商品参照
$.extend($.fn.datagrid.defaults.editors, {
    goodsRef : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' id='goodsEditor' style='width:100px'>");
            //参照按钮
            var button = $("<button style='width: 23px; height: 23px' onclick='showGoodsRefDialog();'>...</button>");

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

//显示商品选择对话框
function showGoodsRefDialog() {
    $('#goodsRefDialog').window('open');
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



//构建分页条件
function buildGoodsQueryCond(total, pageNum, cateLog) {
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 2,
            total: total,
            total_page: -1
        },
        query: {'sales_catelogs.inner_code':cateLog}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
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

//选择商品
function onGoodsSelected (index, rowData) {
    $('#goodsRefDialog').window('close');
    var selectdData = rowData.obj;
    $('#goodsEditor').val(selectdData.title);

    //设置商品到当前表体行对象上
    delete selectdData._id;
    currentDetailRowObj.goods = selectdData;

    //-------刷新关联属性------
    var row = $('#detailDg').datagrid('getSelected');
    var index = $('#detailDg').datagrid('getRowIndex', row);

    row['product_sku_code'] = selectdData.product_sku_code;
    row['title'] = selectdData.title;
    row['sales_catelog'] = selectdData.sales_catelogs;
    row['bar_code'] = selectdData.product_sku.bar_code;
    if(selectdData.product_sku.product_specifications != null)
        row['specifications'] = selectdData.product_sku.product_specifications;

    row['base_unit'] = selectdData.product_sku.product_spu.base_unit;

    if(selectdData.product_sku.product_spu.brand != null) {
        row['brand'] = selectdData.product_sku.product_spu.brand.name;
        row['manufacturer'] = selectdData.product_sku.product_spu.brand.manufacturer.name;
    }
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


function append(){
    if (endEditing()){

        var newDetailObj = {
            detail_code: "",
            goods: {},
            quantity: 0,
            supply_price: {},
            retail_price: {},
            commission: {}
        };
        cloneReplenishmentObj.details.push(newDetailObj);

        var rowData = {
            product_sku_code : "",
            title : "",
            sales_catelog: {},
            bar_code : "",
            specifications: {},
            base_unit: "",
            quantity: 0,
            supply_price: 0.00,
            retail_price: 0.00,
            commission: 0.00,
            brand: "",
            manufacturer: "",
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
            bo_id: "",
            req_date: theDateStr,
            req_send_date: theDateStr,
            req_code: "",
            channel: {},
            restocking_warehose: {},
            "is_completed": "",
            "completed_date": "",
            "details": []
        };

        var rowData = {
            code : "",
            req_date : "",
            req_send_date: "",
            req_code : "",
            channel_name: "",
            restocking_warehose: "",
            is_completed: "",
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


//回退整个单据
function reject(){
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;

    if(isNewRep){
        removeRep();
    }else {
        //重新克隆
        cloneReplenishmentObj = cloneJsonObject(replenishmentObj);
        bindSelectedDataToCard(cloneReplenishmentObj)
        bindSelectedDataToSubDetail(cloneReplenishmentObj.details);

        isHeadChanged = false;
        isBodyChanged = false;
        isNewRep = false;
    }
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