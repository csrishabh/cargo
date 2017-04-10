(function(){
var app = angular.module('store',['ui.bootstrap','ngAnimate','angular-loading-bar','ui.grid' ,'ui.grid.selection' ,'ui.router','ui.grid.resizeColumns',
                                  
                                  'ui.grid.moveColumns','ui.grid.expandable','ui.grid.pinning','ui.grid.treeView', 'ui.grid.pagination' ,
   
                                  'ui.grid.edit', 'ui.grid.rowEdit', 'ui.grid.cellNav','ngSanitize','ui.select2', 'ui.select','ngCsv'])
  // set a custom template
var weburl = "http://localhost:9090/cargo-services";
var UIUrl = "/cargo/Catalog";

app.config(function($stateProvider, $urlRouterProvider ,$httpProvider) {
	$stateProvider
	.state('booking',{
		url: '/booking',
		templateUrl: UIUrl+'/Booking.html'	
	})
	
	.state('showBooking',{
		url: '/showBooking',
		templateUrl: UIUrl+'/consignmentdetails.html'
	})
	
	.state('dispatch',{
		url: '/dispatch',
		templateUrl: UIUrl+'/dispatch.html'
	})
	
	.state('dispatchDetails',{
		url: '/dispatchDetails',
		templateUrl: UIUrl+'/DispatcherDetails.html'
	})
	
	.state('addCityVia',{
		url: '/addCityVia',
		templateUrl: UIUrl+'/AddCityVia.html'
	})
	
	.state('addPerson',{
		url: '/addPerson',
		templateUrl: UIUrl+'/addPerson.html'
	})
	
    .state('showPayment',{
		url: '/showPayment',
		templateUrl: UIUrl+'/checkPayment.html'
	})
	
	$httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
	
});

app.directive('nextOnEnter', function () {
    return {
        restrict: 'A',
        link: function ($scope, selem, attrs) {
            selem.bind('keydown', function (e) {
                var code = e.keyCode || e.which;
                if (code === 13) {
                    e.preventDefault();
                    var pageElems = document.querySelectorAll('input, select, textarea'),
                        elem = e.originalEvent.srcElement
                        focusNext = false,
                        len = pageElems.length;
                    for (var i = 0; i < len; i++) {
                        var pe = pageElems[i];
                        if (focusNext) {
                            if (pe.style.display !== 'none') {
                                pe.focus();
                                break;
                            }
                        } else if (pe === elem) {
                            focusNext = true;
                        }
                    }
                }
            });
        }
    }
});


app.directive('input', ['$interval', function($interval) {
    return {
      restrict: 'E', // It restricts that the directive will only be a HTML element (tag name), not an attribute.
      link: function(scope, elm, attr) {
        if (attr.type === 'checkbox') {
          elm.on('keypress', function(event) {
            var keyCode = (event.keyCode ? event.keyCode : event.which);
            if (keyCode === 13) {
              event.preventDefault(); // only when enter key is pressed.
              elm.trigger('click');
              scope.$apply();
            }
          });
        }
      }
    };
  }
]);


app.controller('myctrl', function($location){
	
	$location.path('/booking')
	
	
});	


app.controller('myctrl2', function($location){
	
	this.showConsignment = function(consignments){
		$location.path('/showBooking')
	}
	
	this.book = function(consignments){
		$location.path('/booking')
	}
	this.dispatcherDetails = function(consignments){
		$location.path('/dispatchDetails')
	}
	this.addCityVia = function(consignments){
		$location.path('/addCityVia')
	}
	this.addPerson = function(consignments){
		$location.path('/addPerson')
	}
	this.showPayment = function(consignments){
		$location.path('/showPayment')
	}
});


app.controller('paymentController', [ '$http' ,'$scope', '$filter' ,function($http , $scope , $filter){
	
	$scope.persons=[];
	$scope.consignments=[];
	$scope.search = {};
	$scope.person = {};
	$scope.payments;
	$scope.totalDue = 0 ;
	$scope.addPayment = false;
	$scope.totalPaid = 0;
	$scope.payment ={};
	$scope.search.date1 = $scope.search.date2 = $scope.payment.date = new Date();
	document.getElementById('consignor').focus();
	$scope.search.type = "All";
	$scope.search.personType = "CONSIGNOR";
	$scope.getPersons = function(type,name){
		
		if(type != undefined && name != ""){
		$http.get(weburl+"/rest/get/person/"+type+"/"+name).success(function(data){	
			$scope.persons = data;
		});
		}
	}
	
	$scope.getPayments = function(){
		
		if($scope.person.selected == undefined){
			$scope.addAlert('warning', 'Please select Person First');
			
		}
		
		else{
			var personId = $scope.person.selected.id;
			var type = 'ALL';
			if($scope.search.type != undefined){
			type = $scope.search.type;
			}
			var currDate = $filter('date')(new Date(), 'dd-MM-yyyy');
		
			var date1 = currDate;
			var date2 = currDate;
		
			if($scope.search.date1 != undefined){
			date1  = $filter('date')($scope.search.date1, 'dd-MM-yyyy');
			}
			if($scope.search.date2 != undefined){
				date2  = $filter('date')($scope.search.date2, 'dd-MM-yyyy');
			}
			
			if(date1 > date2){
			$scope.addAlert('warning', 'FROM date can not be less greater then TO date');
			}
			
			else{
			
				var url = weburl+"/rest/get/consignment/person?"+"id="+ personId + "&type=" + type +"&date1=" + date1 + "&date2=" + date2;
				$http.get(url).success(function(data){
					$scope.consignments = data;
					$scope.setTotalDueAmount(data);	
				},
				function(data){
					$scope.addAlert('danger', 'You have entered worng data');
				})
				
				var url = weburl+"/rest/person/payment?"+"id="+ personId +"&date1=" + date1 + "&date2=" + date2;
				$http.get(url).success(function(data){	
					$scope.payments = data;	
					$scope.setTotalPaidAmount(data);
					$('#paymentDedtailsModal').modal('show');
				},
				function(data){
					$scope.addAlert('danger', 'You have entered worng data');
				})
				
		     
		   }
	 }
	}
	
	$scope.generatePaymentReport = function(){
		var personId = $scope.person.selected.id;
			var type = 'ALL';
			if($scope.search.type != undefined){
			type = $scope.search.type;
			}
			var currDate = $filter('date')(new Date(), 'dd-MM-yyyy');
		
			var date1 = currDate;
			var date2 = currDate;
		
			if($scope.search.date1 != undefined){
			date1  = $filter('date')($scope.search.date1, 'dd-MM-yyyy');
			}
			if($scope.search.date2 != undefined){
				date2  = $filter('date')($scope.search.date2, 'dd-MM-yyyy');
			}
			
			if(date1 > date2){
			$scope.addAlert('warning', 'FROM date can not be less greater then TO date');
			}
			else{
				var url = weburl+"/rest/payment/report?"+"id="+ personId+ "&type=" + type +"&date1=" + date1 + "&date2=" + date2;
				$http.get(url, { responseType: "arraybuffer" }).success(function(data){
					saveAs(new Blob([data],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), "PaymentSheet.xlsx");
				})
			}
	}
	
	$scope.setTotalPaidAmount = function(payments){
		var total = 0;
		for(var i= 0 ; i<payments.length ; i++){
			total = total + payments[i].amount;
		}
		$scope.totalPaid = total;
	}
	
	$scope.setTotalDueAmount = function(consignments){
		var total = 0;
		for(var i= 0 ; i<consignments.length ; i++){
			total = total + consignments[i].total;
		}
		$scope.totalDue = total;
	}
	
	$scope.savePayment = function(payment){
		$scope.addPayment = false;
		$http.post(weburl+"/rest/add/person/payment/"+$scope.person.selected.id, payment).success(function(data){	
		data.date = $filter('date')(data.date, 'yyyy-MM-dd');
		$scope.payments.push(data);	
		$scope.totalPaid = $scope.totalPaid + data.amount;
		$scope.addAlert('success', 'Payment Added successfully');	
		});	
		
	}
	
	$scope.addPayments = function(value){
		$scope.addPayment = value;
		if(value == false){
			$scope.payments = {};
			$scope.totalDue = 0;
			$scope.totalPaid = 0;
		}
	}
	
	
	
	
	$scope.alerts = [
	               ];

	               $scope.addAlert = function(type,messege) {
	                 $scope.alerts.push({type: type, msg: messege});
	               };

	               $scope.closeAlert = function(index) {
	                 $scope.alerts.splice(index, 1);
	               };
	
	
	}]); 



app.controller('personController', [ '$http' ,'$scope', function($http , $scope){
	
	$scope.cities = [];
	$scope.city = {};
	$scope.type = {};
	$scope.types = [
		  
	    {name: 'CONSIGNOR'},
	    {name: 'CONSIGNEE'}];
	document.getElementById('name').focus();
	this.addPerson = function(person){
		person.city = $scope.city.selected.name;
		person.type = $scope.type.selected.name;
		$http.post(weburl+'/rest/add/person', person).success(function(data){
			$scope.addAlert('success', 'Added Successfully');
			$scope.person = {};
			$scope.city = {};
			$scope.type = {};
		});	
			
	}
	
   $scope.getAllCities = function(name){
		if(name != ""){
		$http.get(weburl+"/rest/city/"+name).success(function(data){	
			$scope.cities = data;
		});
	}
   }
   
	$scope.alerts = [
	               ];

	               $scope.addAlert = function(type,messege) {
	                 $scope.alerts.push({type: type, msg: messege});
	               };

	               $scope.closeAlert = function(index) {
	                 $scope.alerts.splice(index, 1);
	               };
	
	
	}]); 

app.controller('CityViaController', [ '$http' ,'$scope', function($http , $scope){
	
	$scope.cities=[];
	document.getElementById('via').focus();
	$scope.type = "via";
	this.add = function(value,type){
		if(type === undefined){
			$scope.addAlert('warning', 'Please Select Type First');	
		}
		else if(value === undefined) {
			$scope.addAlert('warning', 'Please Enter Value');
		}
		if(type === "via"){
		$http.post(weburl+'/rest/add/via', value).success(function(data){	
			$scope.addAlert('success', 'Via Added Successfully');
		});	
		}
		else if (type === "city"){
			$http.post(weburl+'/rest/add/city', value).success(function(data){	
				$scope.addAlert('success', 'City Added Successfully');
			});
		}
	}
	
	
	$scope.alerts = [
	               ];

	               $scope.addAlert = function(type,messege) {
	                 $scope.alerts.push({type: type, msg: messege});
	               };

	               $scope.closeAlert = function(index) {
	                 $scope.alerts.splice(index, 1);
	               };
	
	
	}]); 



app.controller('BookingController', [ '$http' ,'$scope', '$document', function($http , $scope , $document){
	
	$scope.responceCome = false;
	$scope.cities=[];
	$scope.consignors = [];
	$scope.consingees = [];
	$scope.consignor ={};
	$scope.consignee = {};
    $scope.consignment={};
    $scope.consignment.payment_Type ='Cash';
    $scope.consignment.paidBy = 'CONSIGNOR';
    $scope.consignment.type = 'CRTN';
    $scope.consignment.entry_Date = new Date();
    document.getElementById('name').focus();
	this.addConsignment = function(consignment,consignor,consignee){
		if($scope.consignment.entry_Date >  new Date() ){
			$scope.addAlert('warning', 'You can not book an consignment in future date');
			return;
		}
		var persons = []; 
		if( $scope.consignment.payment_Type =='Cash'){
			$scope.consignor.selected.type = 'CONSIGNOR';
			$scope.consignee.selected.type = 'CONSIGNEE';
			$scope.consignor.selected.category = 'ADHOC';
			$scope.consignee.selected.category = 'ADHOC';	
		}
		else{
			if($scope.consignment.paidBy == 'CONSIGNOR'){
				$scope.consignee.selected.type = 'CONSIGNEE';
				$scope.consignee.selected.category = 'ADHOC';
			}
			else if($scope.consignment.paidBy == 'CONSIGNEE'){
				$scope.consignor.selected.type = 'CONSIGNOR';
				$scope.consignor.selected.category = 'ADHOC';
			}
			
		}
		persons.push(consignor.selected);
		persons.push(consignee.selected);
		consignment.persons = persons;
		$http.post(weburl+'/rest/consignment/create', consignment).success(function(data){	
			$scope.responceCome = true;
			$scope.consignment = {};
			$scope.consignor.selected = {};
			$scope.consignee.selected = {};
			$scope.getNextId();
			$scope.consignment.payment_Type ='Cash';
		    $scope.consignment.paidBy = 'CONSIGNOR';
			$scope.addAlert('success', 'Item Booked Successfully');
			$scope.consignment.type = 'CRTN';
			$scope.consignment.entry_Date = new Date();
			//$scope.digest();
		});	
	}
	
	
	$scope.getConsignors = function(name){
		if(name != ""){
		$http.get(weburl+"/rest/get/person/CONSIGNOR/"+name).success(function(data){	
			$scope.consignors = data;
		});
	}
	}
	
	$scope.getConsignees = function(name){
		if(name != ""){
		$http.get(weburl+"/rest/get/person/CONSIGNEE/"+name).success(function(data){	
			$scope.consignees = data;
		});
		}
	}
	
	$scope.getNextId = function(){
		$http.get(weburl+"/rest/consignment/next").success(function(data){	
			$scope.consignment.id = data;
		});
	}
	
	$scope.getAllCities = function(name){
		$http.get(weburl+"/rest/city/"+name).success(function(data){	
			$scope.cities = data;
		});
	}
	
	$scope.selectPaidBy = function(value){
		$scope.consignor.selected = {};
		$scope.consignee.selected = {};
		if(value == "Cash"){
		return;
		}
		else{
			$scope.header = "Due on";
		}
		document.getElementById('CONSIGNOR').focus();
		$('#paidByModal').modal('show');
		
	}
	
	$scope.closeModel = function(){
		if($scope.consignment.paidBy != undefined){
		$('#paidByModal').modal('hide');
		}
		else{
			$scope.addAlert('warning', 'Please Select one');	
		}
	}
	
	this.updateRate = function(){
		if($scope.basic_freight == undefined || $scope.basic_freight == ""  || !angular.isNumber($scope.basic_freight)){
			$scope.checked = false;
			return;
		}
		$scope.consignment.rate = ($scope.basic_freight-($scope.consignment.carrige_charge + $scope.consignment.other_charge + $scope.consignment.s_Tax))/$scope.consignment.weight;
	}
	
	$scope.getNextId();
	$scope.alerts = [
	               ];

	               $scope.addAlert = function(type,messege) {
	                 $scope.alerts.push({type: type, msg: messege});
	               };

	               $scope.closeAlert = function(index) {
	                 $scope.alerts.splice(index, 1);
	               };
	
	
	}]);  


app.controller('DispatcherDetails', [ '$http' ,'$scope','$filter','$q','$interval', function($http , $scope ,$filter,$q,$interval){
	$scope.search = {};
	$scope.search.date1 = $scope.search.date2 = new Date();
	document.getElementById('date').focus();
	var subGridColDef = [{field: 'id', displayName: 'Bulti Number' , width: '10%' ,enableColumnMenu: false ,enableCellEdit: false},
	                     {field:'consignor', displayName:'Consinor',enableColumnMenu: false,enableCellEdit: false ,width: '10%'},
	                     {field: 'consignor_Add1', displayName: 'add' ,visible:false},
	                     {field: 'consignor_Add2', displayName: 'add' ,visible:false},
	                     {field: 'consignor_State', displayName: 'add' ,visible:false},
	                     {field: 'consignor_country', displayName: 'add' ,visible:false},
	                     {field: 'consignor_Pin', displayName: 'add' ,visible:false},
	                     {field: 'consignor_Mobile', displayName: 'add' ,visible:false},
	                     {field: 'consingee', displayName: 'Consignee',enableColumnMenu: false,enableCellEdit: false,width: '10%'},
	                     {field: 'consignee_Add1', displayName: 'Destination',enableColumnMenu: false,enableCellEdit: false,width: '10%',visible:false},
	                     {field: 'consignee_Add2', displayName: 'add' ,visible:false},
	                     {field: 'consignee_State', displayName: 'add' ,visible:false},
	                     {field: 'to', displayName: 'Destination' ,width: '6%', enableColumnMenu: false ,enableCellEdit: false,width: '10%'},
	                     {field: 'consignee_Pin', displayName: 'add' ,visible:false},
	                     {field: 'consignee_Mobile', displayName: 'add' ,visible:false},
	                     {field: 'weight', displayName: 'WEIGHT', width: '8%' ,enableColumnMenu: false,enableCellEdit: false},
	                     {field: 'quantity', displayName: 'QUANTITY', width: '5%' ,enableColumnMenu: false,enableCellEdit: false,visible:false},
	                     {field: 'rate', displayName: 'RATE' , width: '8%',enableColumnMenu: false,enableCellEdit: false,visible:false},
	                     {field: 'carrige_charge', displayName: 'CARRIGE' , width: '8%',enableColumnMenu: false,enableCellEdit: false,visible:false},
	                     {field: 'other_charge', displayName: 'OTHER CHARGE', width: '8%',enableColumnMenu: false,enableCellEdit: false,visible:false},
	                     {field: 's_Tax', displayName: 'S TAX', width: '8%',enableColumnMenu: false,enableCellEdit: false,visible:false},
	                     {field: 'payment_Type', displayName: 'PAYMENT TYPE' , width: '12%',enableColumnMenu: false,enableCellEdit: false},
	                     {field: 'type', displayName: 'add' ,visible:false,enableColumnMenu: false,enableCellEdit: false},
	                     {field: 'entry_Date', displayName: 'DATE' ,type: 'date',enableColumnMenu: false,enableCellEdit: false,width: '10%'},
	                     {field: 'remarks', displayName: 'add' ,visible:false,enableColumnMenu: false,enableCellEdit: false},
	                     {field: 'status', displayName: 'STATUS',enableColumnMenu: false ,visible:false},
	                     {field:  'total', displayName: 'Total',enableCellEdit: false,enableColumnMenu: false,width: '10%'},
	                     {field: 'cbId', displayName: 'CRB ID',enableColumnMenu: false,enableCellEdit: true,width: '20%'},
	                     ];
	
	$scope.gridOptions = {
			enableFiltering: true,
			enableRowSelection: false,
			enableCellEdit: true,
		    expandableRowTemplate: '<div ui-grid="row.entity.subGridOptions" ui-grid-edit ui-grid-row-edit ui-grid-cellNav style=" width:1150px; height:160px;"></div>',
		    expandableRowHeight: 150,
		    //subGridVariable will be available in subGrid scope
		    expandableRowScope: {
		      subGridVariable: 'subGridScopeVariable'
		    },
	          onRegisterApi: function (gridApi) { 
              gridApi.expandable.on.rowExpandedStateChanged($scope, function (row) {
              if (row.isExpanded) {
              row.entity.subGridOptions = {
                columnDefs: subGridColDef,
                onRegisterApi: function (gridApi) {
  	        	  
  	        	  $scope.gridApi = gridApi;
  	        	  gridApi.rowEdit.on.saveRow($scope, $scope.saveRow);
                }
                };

              $http.get(weburl+'/rest/consignment/dispacthid/'+row.entity.id)
                .success(function(data) {
                  row.entity.subGridOptions.data = data;
                });
            }
        });
    }
		  }
	
	
	$scope.saveRow = function( rowEntity ) {
	    // create a fake promise - normally you'd use the promise returned by $http or $resource
		var promise = $q.defer();
	    $scope.updateConsignment(rowEntity);
	    $scope.gridApi.rowEdit.setSavePromise( rowEntity, promise.promise );
	    // fake a delay of 3 seconds whilst the save occurs, 
	   $interval( function() {
		   if($scope.isUpdated){
		    	$scope.isUpdated = false;
		    	promise.resolve();
		    	$scope.addAlert('success', 'Update Successfully');
		    }
		    else{
		    	promise.reject();
		    	$scope.addAlert('danger', 'Error occurred');
		    }
	    }, 3000, 1);
	  };	
		 
		  $scope.gridOptions.columnDefs = [
		    {field: 'id', displayName: 'ID' , width: '10%' ,enableColumnMenu: false ,enableCellEdit: false },
		    {field:'driver_Name', displayName:'NAME' ,visible:false},
		    {field: 'city', displayName: 'VIA' , width: '30%' ,enableColumnMenu: false ,enableCellEdit: false },
		    {field:'state', displayName:'STATE' , width: '30%' ,enableColumnMenu: false ,enableCellEdit: false},
		    {field: 'dispatch_Date', displayName: 'DATE' , width: '30%' ,enableColumnMenu: false ,enableCellEdit: false},
		  ];
	
	$scope.gridOptions.multiSelect = false;
	
	var currDate = $filter('date')(new Date(), 'dd-MM-yyyy');
	var url = weburl+"/rest/dispatcher/getDispatchers?date1="+currDate+"&date2="+currDate;
    $http.get(url).success(function(data){	
    	$scope.gridOptions.data = data;
		
	});
    $scope.isUpdated = false;
    $scope.updateConsignment = function(consignment){
    	/*/rest/dispatcher/update*/
    	return $http.post(weburl+"/rest/consignment/update/"+consignment.id, consignment.cbId).success(function(data){	
    		 $scope.isUpdated = true;
    	});
    }
    
    $scope.getDispatchers = function (){
    var date1 = $filter('date')($scope.search.date1, 'dd-MM-yyyy');
	var date2 = $filter('date')($scope.search.date2, 'dd-MM-yyyy');
	if($scope.search.date1 > $scope.search.date2){
		$scope.addAlert('warning', 'FROM date can not be less greater then TO date');
	}
	else{
	var url = weburl+"/rest/dispatcher/getDispatchers?date1="+date1+"&date2="+date2;
    $http.get(url).success(function(data){	
    	$scope.gridOptions.data = data;	
	});
	}
  }
    
    $scope.alerts = [
                   ];

  	               $scope.addAlert = function(type,messege) {
  	                 $scope.alerts.push({type: type, msg: messege});
  	               };

  	               $scope.closeAlert = function(index) {
  	                 $scope.alerts.splice(index, 1);
  	               };
	
	
	}]); 


app.controller('ConsignmentController', [ '$http' ,'$scope','myService' ,'$location' ,'$filter','uiGridConstants',function($http , $scope , myService , $location , $filter ,uiGridConstants ){
	
	var company = this;
	$scope.selectConsignmentId;
	$scope.selectConsignmentTotalAmt;
	$scope.addPayment = false;
	$scope.currPayment ;
	$scope.payments;
	$scope.responceCome = false;
	$scope.footerTemplate = '<div class="ui-grid-cell-contents">{{col.getAggregationValue()  }}</div>'
	$scope.selectedRows = 0;
	$scope.search = {};
	company.consignments = [];
	$scope.mySelections = [];
	$scope.search.date1 = $scope.search.date2 = new Date();
	$scope.search.type = "All";
	$scope.search.status = "BOOKED";
	document.getElementById('all').focus();
	 $scope.alerts = [
	                   ];

	  	               $scope.addAlert = function(type,messege) {
	  	                 $scope.alerts.push({type: type, msg: messege});
	  	               };

	  	               $scope.closeAlert = function(index) {
	  	                 $scope.alerts.splice(index, 1);
	  	               };
	
	var rowTemplate =  '<div>' +
    '  <div ng-class="{red: row.entity.status===\'DISPATCHED\' }" ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader }"  ui-grid-cell></div>' +
    '</div>';
	$scope.getHeader = function () {return ["ID", "Consignor Name","Congsinor Add","","Consignor State" ,"Consignor City","Congsinor Pin","Consignor Mobile",
	                                        
	                                        "Consignee Name","Consignee Add","","Consignee State" ,"Consignee City","Consignee Pin","Consignee Mobile",
	                                        
	                                        "Weight","Quantity","Rate","Carrige Charge","Other Charge","S Tax","Payment Type","Type","Entry Date",
	                                        
	                                        "Remarks","CRBID","Dispatcher Id","Status","Total"]};
	this.gridOptions = { 
			enableRowSelection: true,
			enableFiltering: true,
			showGridFooter: true,
		    showColumnFooter: true,
			rowTemplate:rowTemplate,
			columnDefs: [{field: 'id', displayName: 'ID' , width: '5%' ,enableColumnMenu: false},
							 {field:'consignor', displayName:'CONSIGNOR',enableColumnMenu: false,enableCellEdit: false ,width: '6%'},
		                     {field: 'consignor_Add1', displayName: 'add' ,visible:false},
		                     {field: 'consignor_Add2', displayName: 'add' ,visible:false},
		                     {field: 'consignor_State', displayName: 'add' ,visible:false},
		                     {field: 'consignor_country', displayName: 'add' ,visible:false},
		                     {field: 'consignor_Pin', displayName: 'add' ,visible:false},
		                     {field: 'consignor_Mobile', displayName: 'add' ,visible:false},
		                     {field: 'consingee', displayName: 'CONSIGNEE' ,width: '6%', enableColumnMenu: false},
		                     {field: 'consignee_Add1', displayName: 'add' ,visible:false},
		                     {field: 'consignee_Add2', displayName: 'add' ,visible:false},
		                     {field: 'consignee_State', displayName: 'add' ,visible:false},
		                     {field: 'to', displayName: 'City' ,width: '6%', enableColumnMenu: false},
		                     {field: 'consignee_Pin', displayName: 'add' ,visible:false},
		                     {field: 'consignee_Mobile', displayName: 'add' ,visible:false},
		                     {field: 'weight', displayName: 'WEIGHT', width: '6%' ,enableColumnMenu: false, footerCellTemplate: $scope.footerTemplate ,aggregationType: uiGridConstants.aggregationTypes.sum},
		                     {field: 'quantity', displayName: 'QUANTITY', width: '5%' ,enableColumnMenu: false, footerCellTemplate: $scope.footerTemplate ,aggregationType: uiGridConstants.aggregationTypes.sum},
		                     {field: 'rate', displayName: 'RATE' , width: '7%',enableColumnMenu: false, footerCellTemplate: $scope.footerTemplate ,aggregationType: uiGridConstants.aggregationTypes.sum},
		                     {field: 'carrige_charge', displayName: 'CARRIGE' , width: '8%',enableColumnMenu: false, footerCellTemplate: $scope.footerTemplate ,aggregationType: uiGridConstants.aggregationTypes.sum},
		                     {field: 'other_charge', displayName: 'OTHER CHARGE', width: '8%',enableColumnMenu: false, footerCellTemplate: $scope.footerTemplate ,aggregationType: uiGridConstants.aggregationTypes.sum},
		                     {field: 's_Tax', displayName: 'S TAX', width: '8%',enableColumnMenu: false,enableCellEdit: false, footerCellTemplate: $scope.footerTemplate ,aggregationType: uiGridConstants.aggregationTypes.sum},
		                     {field: 'payment_Type', displayName: 'PAYMENT TYPE' , width: '7%',enableColumnMenu: false},
		                     {field: 'type', displayName: 'add' ,visible:false,enableColumnMenu: false},
		                     {field: 'entry_Date', displayName: 'DATE' ,type: 'date',enableColumnMenu: false},
		                     {field: 'remarks', displayName: 'add' ,visible:false,enableColumnMenu: false},
		                     {field: 'status', displayName: 'STATUS',enableColumnMenu: false},
		                     {field:  'total', displayName: 'Total',enableColumnMenu: false ,aggregationType: uiGridConstants.aggregationTypes.sum},
		                     {field: 'dispatcherId', displayName: 'Dispatcher Id',enableColumnMenu: false},
		                     {field: 'cbId', displayName: 'CRB ID',enableColumnMenu: false},
		                     ],
		                    
		    onRegisterApi: function(gridApi){
		          $scope.gridApi = gridApi;
		          gridApi.selection.on.rowSelectionChanged($scope,function(rows){
		        	  $scope.mySelections = gridApi.selection.getSelectedRows();
		          });  
		    }
		    };
	
	this.gridOptions.multiSelect = true;
	var currDate = $filter('date')(new Date(), 'dd-MM-yyyy');
	var url = weburl+"/rest/consignments?"+"type="+ "All" + "&status=" + "BOOKED" +
	"&date1=" + currDate + "&date2=" + currDate;
	$http.get(url).success(function(data){	
		
		company.consignments = data;
		company.gridOptions.data = data;
		
	});
	
	this.addAmountInGrid = function(){
		for (var i = 0; i < company.gridOptions.data.length; i++) {
			var amt = company.gridOptions.data[i].weight * company.gridOptions.data[i].rate + (company.gridOptions.data[i].carrige_charge + company.gridOptions.data[i].other_charge + company.gridOptions.data[i].s_Tax);
			company.gridOptions.data[i].total = amt;
		}
	}
	
	this.getConsignments = function(){
		var currDate = $filter('date')(new Date(), 'dd-MM-yyyy');
		var date1 = currDate;
		var date2 = currDate;
		var type = 'All';
		var status = 'All';
		if($scope.search.date1 != undefined){
			date1  = $filter('date')($scope.search.date1, 'dd-MM-yyyy');
		}
		if($scope.search.date2 != undefined){
		date2  = $filter('date')($scope.search.date2, 'dd-MM-yyyy');
		}
		
		if($scope.search.type != undefined){
			type = $scope.search.type;
		}
		
		if($scope.search.status != undefined){
			status = $scope.search.status;
		}
		
		if(date1 > date2){
			$scope.addAlert('warning', 'FROM date can not be less greater then TO date');
		}
		else{
			
		var url = weburl+"/rest/consignments?"+"type="+ type + "&status=" + status +"&date1=" + date1 + "&date2=" + date2;
		$http.get(url).success(function(data){	
			
			company.consignments = data;
			company.gridOptions.data = data;	
		})
		};
	}
	
	
	$scope.generateCollectionReport = function(){
		var currDate = $filter('date')(new Date(), 'dd-MM-yyyy');
		var date1 = currDate;
		var date2 = currDate;
		var type = 'All';
		var status = 'All';
		if($scope.search.date1 != undefined){
			date1  = $filter('date')($scope.search.date1, 'dd-MM-yyyy');
		}
		if($scope.search.date2 != undefined){
		date2  = $filter('date')($scope.search.date2, 'dd-MM-yyyy');
		}
		
		if($scope.search.type != undefined){
			type = $scope.search.type;
		}
		
		if($scope.search.status != undefined){
			status = $scope.search.status;
		}
		
		if(date1 > date2){
			$scope.addAlert('warning', 'FROM date can not be less greater then TO date');
		}
		else{
		var url = weburl+"/rest/collection/report?"+"type="+ type + "&status=" + status +"&date1=" + date1 + "&date2=" + date2;
		$http.get(url, { responseType: "arraybuffer" }).success(function(data){
			
			saveAs(new Blob([data],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), "CollectionReport.xlsx");
		})
		}
	}
	
	this.deleteConsignments = function(consignments){
		if(consignments.length == 0){
			$scope.addAlert('warning', 'Please select one consignment to delete');
			
		}
		
		else if(consignments.length > 1){
			$scope.addAlert('warning', 'Select only one');
		}
		
		else if(consignments[0].status === "DISPATCHED"){
			$scope.addAlert('danger', 'You Can not delete dispatched consignment');
		}
		
		else{
		var id = consignments[0].id;
		
		$http.get(weburl+"/rest/consignment/delete?id="+id).success(function(){	
			var index = company.gridOptions.data.indexOf(consignments[0]);
			company.gridOptions.data.splice(index, 1);
			$scope.addAlert('success', 'Consignment deleted successfully');
		});	
		}
	}
	
	this.dispatch = function(consignments){
		if(consignments.length == 0){
			$scope.addAlert('warning', 'Please select consignments to Dispatch');
		}
		else{
		myService.set(consignments);
		$location.path('/dispatch')
		}
	}
	
	this.generateCsv = function(){
			 $scope.addAlert('success', 'file download successfully');
			 return company.gridOptions.data;	
	}
	
	}]);

app.controller('DispatcherController', [ '$http' ,'$scope','myService','$interval','$location', function($http , $scope, myService , $interval , $location){
	var company = this;
	company.consignments = myService.get();
	$scope.city ={};
	$scope.cities = [];
	$scope.mySelections = [];
	document.getElementById('name').focus();
	$scope.alerts = [
	                   ];

	  	               $scope.addAlert = function(type,messege) {
	  	                 $scope.alerts.push({type: type, msg: messege});
	  	               };

	  	               $scope.closeAlert = function(index) {
	  	                 $scope.alerts.splice(index, 1);
	  	               };
	
	this.gridOptions = { 
			enableRowSelection: true,
			enableFiltering: true,
			columnDefs: [{field: 'id', displayName: 'Bulti Number' , width: '10%' ,enableColumnMenu: false},
	                     {field:'consignor_Name', displayName:'NAME' ,visible:false},
	                     {field: 'consignor_Add1', displayName: 'add' ,visible:false},
	                     {field: 'consignor_Add2', displayName: 'add' ,visible:false},
	                     {field: 'consignor_State', displayName: 'add' ,visible:false},
	                     {field: 'consignor_country', displayName: 'add' ,visible:false},
	                     {field: 'consignor_Pin', displayName: 'add' ,visible:false},
	                     {field: 'consignor_Mobile', displayName: 'add' ,visible:false},
	                     {field: 'consignee_Name', displayName: 'add' ,visible:false},
	                     {field: 'consignee_Add1', displayName: 'add' ,visible:false},
	                     {field: 'consignee_Add2', displayName: 'add' ,visible:false},
	                     {field: 'consignee_State', displayName: 'add' ,visible:false},
	                     {field: 'to', displayName: 'City' ,width: '6%', enableColumnMenu: false},
	                     {field: 'consignee_Pin', displayName: 'add' ,visible:false},
	                     {field: 'consignee_Mobile', displayName: 'add' ,visible:false},
	                     {field: 'weight', displayName: 'WEIGHT', width: '8%' ,enableColumnMenu: false},
	                     {field: 'quantity', displayName: 'QUANTITY', width: '5%' ,enableColumnMenu: false},
	                     {field: 'rate', displayName: 'RATE' , width: '8%',enableColumnMenu: false},
	                     {field: 'carrige_charge', displayName: 'CARRIGE' , width: '8%',enableColumnMenu: false},
	                     {field: 'other_charge', displayName: 'OTHER CHARGE', width: '8%',enableColumnMenu: false},
	                     {field: 's_Tax', displayName: 'S TAX', width: '8%',enableColumnMenu: false,enableCellEdit: false},
	                     {field: 'payment_Type', displayName: 'PAYMENT TYPE' , width: '7%',enableColumnMenu: false},
	                     {field: 'type', displayName: 'add' ,visible:false,enableColumnMenu: false},
	                     {field: 'entry_Date', displayName: 'DATE' ,type: 'date',enableColumnMenu: false},
	                     {field: 'remarks', displayName: 'add' ,visible:false,enableColumnMenu: false},
	                     {field: 'status', displayName: 'STATUS',enableColumnMenu: false},
	                     {field:  'total', displayName: 'Total',enableColumnMenu: false},
	                     {field: 'dispatcherId', displayName: 'Dispatcher Id',enableColumnMenu: false},
	                     {field: 'cbId', displayName: 'CRB ID',enableColumnMenu: false},
	                     ],
		                    
		    onRegisterApi: function(gridApi){
		          $scope.gridApi = gridApi;
		          gridApi.selection.on.rowSelectionChanged($scope,function(rows){
		          $scope.mySelections = gridApi.selection.getSelectedRows();
		          });
		    }
		    };
	
	
	$scope.getNextId = function(){
		$http.get(weburl+"/rest/dispatcher/next").success(function(data){	
			$scope.dispatcher.id = data;
		});	
	}
	
	this.addAmountInGrid = function(){
		for (var i = 0; i < company.gridOptions.data.length; i++) {
			var amt = company.gridOptions.data[i].weight * company.gridOptions.data[i].rate + (company.gridOptions.data[i].carrige_charge + company.gridOptions.data[i].other_charge + company.gridOptions.data[i].s_Tax);
			company.gridOptions.data[i].total = amt;
		}
	}
	
    $scope.getAllCities = function(name){
		
    	if(name != ""){
		$http.get(weburl+"/rest/via/"+name).success(function(data){	
			$scope.cities = data;
		});
    	}
	}
	
	$scope.getNextId();
	$scope.responceCome = false;
	this.gridOptions.multiSelect = true;
	
	company.gridOptions.data = myService.get();

	this.addDispatcher = function(dispatcher){
		dispatcher.city = $scope.city.selected.city;
		dispatcher.consignments = company.consignments;
		$http.post(weburl+"/rest/dispatcher/create", dispatcher).success(function(data){	
			$scope.responceCome = true;
			$scope.dispatcher = {};
			$scope.city ={};
			$scope.addAlert('success', 'Items Dispatched successfully');
			$interval( function() {
				$location.path('/dispatchDetails')  
			    }, 2000, 1);
		});	
	}
	}]);   


app.factory('myService', function() {
	 var savedData = {}
	 function set(data) {
	   savedData = data;
	 }
	 function get() {
	  return savedData;
	 }

	 return {
	  set: set,
	  get: get
	 }

	});

})();

