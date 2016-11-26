//初始化商品datagrid
function initGoodsDatagrid(){
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

//品类树选择
function catelogTreeSel(node) {

    var catelog = node.attributes.inner_code;

    //定义查询条件
    var condition = buildGoodsQueryCond(0, 1, catelog);

    $.ajax({
        method: 'POST',
        url: $apiBaseURL + "ocr-productcenter/product-mgr/findall?context=3|3|lj|aaa",
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
                        url: $apiBaseURL + "ocr-productcenter/product-mgr/findall?context=3|3|lj|aaa",
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


//选择商品
function onGoodsSelected (index, rowData) {
    $('#goodsRefDialog').window('close');
    var selectdData = rowData.obj;
    $('#goodsEditor').val(selectdData.title);

    //设置商品到当前表体行对象上
    currentDetailRowObj.goods = selectdData;

    //-------刷新关联属性------
    /* var row = $('#detailDg').datagrid('getSelected');
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
     }*/
}


//------------以下为放在表体的商品参照-----------------------
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

//单击参照按钮显示商品选择对话框
function showGoodsRefDialog() {
    $('#goodsRefDialog').window('open');
}

