
var selectedAcctInfo;

function init() {

	window.$token = localStorage.getItem("access_token");

	var defaultAcctInfo = localStorage.getItem("default_acct");
	if (defaultAcctInfo != undefined && defaultAcctInfo != null) {
		var defaultAcctObj = JSON.parse(defaultAcctInfo);
		loginAccount(defaultAcctObj);
	} else {
		var acctInfo = localStorage.getItem("accts");
		if (acctInfo != undefined && acctInfo != null) {
			var acctList = JSON.parse(acctInfo);
			if (acctList.length == 1) {
				localStorage.setItem("default_acct", JSON.stringify(acctList[0]));
				loginAccount(acctList[0]);
			} else {
				$('#cmbAccts').combobox({
					valueField: 'acct_id',
					textField: 'acct_name',
					data: acctList,
					onSelect: function (record) {
						selectedAcctInfo = record;
					}
				});
				$('#acctSelDlg').window('open');  // open a window
			}
		}

	}
}

function accountSubmit() {

	if (selectedAcctInfo == null) {
		alert_autoClose("提示：", "请选择您的组织.");
		$('#cmbAccts').focus();
	} else {
		var remember = $('#ckRemember').prop('checked');
		if (remember) {
			localStorage.setItem("default_acct", JSON.stringify(selectedAcctInfo));
		}else{
			localStorage.removeItem("default_acct");
		}
		$('#acctSelDlg').window('close');  // close a window
		loginAccount(selectedAcctInfo);
	}

}

//设置页面右侧设置用户登录状态信息
function showUserLoginStateInfo(acct){
	$('#userAcctLab').html("<span> 用户：[&nbsp;" + localStorage.getItem("user_name") + "&nbsp;] &nbsp; &nbsp;  组织：[&nbsp;" + acct.acct_name + "&nbsp;]</span>");
}

//设置当前session中的acct_info
function setSessionAcctInfo(acct){
	sessionStorage.setItem("current_acct", JSON.stringify(acct));
}

function loginAccount(acct) {

	//设置当前session中的acct_info
	setSessionAcctInfo(acct);

	//页面右侧设置用户登录状态信息
	showUserLoginStateInfo(acct);

	var loginInfo = {
		acct_id: acct.acct_id
	};
	var loginReqData = JSON.stringify(loginInfo);

	//定义查询条件
	$.ajax({
		method : 'POST',
		url : $apiRoot + "otocloud-auth/user-management/login?token=" + window.$token,
		async : true,
		data: loginReqData,
		dataType : 'json',
		beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
		success : function(data) {
			//todo:
			loadAppModules();
		},
		error: function (x, e) {
			alert(e.toString(), 0, "友好提醒");
		}
	});
}

function cleanAccordion(){
	var pannels = $('#appModuleList').accordion('panels');
	pannels.forEach(function(item){
		var index = $('#appModuleList').accordion('getPanelIndex',item);
		$('#appModuleList').accordion('remove',index);
	})
}


//加载应用模块
function loadAppModules(){

	cleanAccordion();

	//加载应用列表
	$.get($apiRoot + "otocloud-portal/user-menu-get/get?token=" + window.$token,
		function(menus,status){
			if(status == "success"){
				$.each(menus.menu_items, function(i, item) {
					//加载组件目录
					var componentCatelog = $('<ul class="easyui-tree" style="padding:10px;"></ul>');
					componentCatelog.tree({
						data: item.children,
						onClick: function(node){
							addAppViewToWorkbench(node.id, node.text, node.attributes.url);
						}
					});
					//加载应用列表
					$('#appModuleList').accordion('add',{
						title: item.text,
						content: componentCatelog
					});
				});
			}else{

			}
	});
}

//切换租户
function switchAcct(){
	var acctInfo = localStorage.getItem("accts");
	if (acctInfo != undefined && acctInfo != null) {
		localStorage.removeItem("default_acct");
		init();
	}else{
		alert_autoClose("提示：", "您只有一个组织，不能切换.");
	}
}

function exit(){
	document.location.href = 'login/login.html'
}

//添加或激活AppView到工作区
function addAppViewToWorkbench(id, title, appUrl){
	//var appPath = $apiBaseURL + appUrl;
	var appPath = appUrl;
	var appWorkbench = $('#appWorkbench');
	if(!appWorkbench.tabs("exists", title)) {
		appWorkbench.tabs('add',{
			title: title,
			content:'<iframe id="frm_' + id + '" src="' + appPath + '" class="easyui-panel" data-options="fit:true,border:false" frameborder="0"></iframe>',
			closable:true
		});
	}else {
		appWorkbench.tabs("select", title);
		//刷新
		appWorkbench.tabs('getSelected').panel('panel').find('iframe').attr("src", appPath);
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


var onmessage = function (event) {
	//var data = event.data;
	var origin = event.origin;

	var obj = event.data;
	if(obj.commandName="open"){
		var id = obj.id;
		var title =  obj.title;
		var url = obj.url;

		var appWorkbench = $('#appWorkbench');
		if(!appWorkbench.tabs("exists", title)) {
			appWorkbench.tabs('add', {
				title: title,
				content: '<iframe id="frm_' + id + '" src="' + url + '" class="easyui-panel" data-options="fit:true,border:false" frameborder="0"></iframe>',
				closable: true
			});
		}else{
			appWorkbench.tabs("select", title);
			//刷新
			appWorkbench.tabs('getSelected').panel('panel').find('iframe').attr("src", url);
		}

	}

};
if (typeof window.addEventListener != 'undefined') {
	window.addEventListener('message', onmessage, false);
} else if (typeof window.attachEvent != 'undefined') {
	//for ie
	window.attachEvent('onmessage', onmessage);
}

/*
 //响应tab创建事件
 window.onmessage=function(e){
 var obj = JSON.parse(e.data);
 var id = obj.id;
 var title =  obj.title;
 var url = obj.url;

 var appWorkbench = $('#appWorkbench');
 appWorkbench.tabs('add',{
 title: title,
 content:'<iframe id="frm_' + id + '" src="' + url+ '" class="easyui-panel" data-options="fit:true,border:false" frameborder="0"></iframe>',
 closable:true
 });
 };
 */

