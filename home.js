
//加载应用模块
function loadAppModules(){
	$.get($apiBaseURL + "ocr-productcenter/catelog-mgr/getmodules?context=3|3|lj|aaa",
		function(data,status){
			if(status == "success"){
				$.each(data, function(i, item) {
					//加载组件目录
					var componentCatelog = $('<ul class="easyui-tree" style="padding:10px;"></ul>');
					componentCatelog.tree({
						data: item.children,
						onClick: function(node){
							addAppViewToWorkbench(node.id, node.text, node.attributes.url);
						}
					});
					//加载应用模块列表
					$('#appModuleList').accordion('add',{
						title: item.text,
						content: componentCatelog
					});
				});
			}else{

			}
	});
}

//响应tab创建事件
window.onmessage=function(e){
	var obj = JSON.parse(e.data);
	var title =  obj.title;
	var url = obj.url;

	var appWorkbench = $('#appWorkbench');
	appWorkbench.tabs('add',{
		title: title,
		content:'<iframe src="' + url+ '" class="easyui-panel" data-options="fit:true,border:false" frameborder="0"></iframe>',
		closable:true
	});
};

//添加或激活AppView到工作区
function addAppViewToWorkbench(id, title, appUrl){
	//var appPath = $apiBaseURL + appUrl;
	var appPath = appUrl;
	var appWorkbench = $('#appWorkbench');
	if(!appWorkbench.tabs("exists", title)) {
		appWorkbench.tabs('add',{
			title: title,
			content:'<iframe src="' + appPath + '" class="easyui-panel" data-options="fit:true,border:false" frameborder="0"></iframe>',
			closable:true
		});
	}else {
		appWorkbench.tabs("select", title);
		//刷新
		appWorkbench.tabs('getSelected').panel('panel').find('iframe').attr("src", appPath)
	}

}

//关闭工作区所有AppView
function closeAll() {
	var appWorkbench = $('#appWorkbench');
	var allTabs = appWorkbench.tabs('tabs');

	var closeTabsTitle = [];

	$.each(allTabs, function() {
		var opt = $(this).panel('options');

			closeTabsTitle.push(opt.title);

	});

	for ( var i = 0; i < closeTabsTitle.length; i++) {
		appWorkbench.tabs('close', closeTabsTitle[i]);
	}

}

