angular
	.module('app', [])
	.factory('ProjectService', function($rootScope, $http) {

		var ProjectService = {};

		ProjectService.selectedProject = null;
		ProjectService.projects = [];

		var url = 'https://dl.dropboxusercontent.com/u/21293595/andrei/js/projects.json';


		$http.get(url).success(function(data) {
	        ProjectService.projects = data;
	        ProjectService.getMoreProjects();
	    });

		ProjectService.getProjects = function() {
			return ProjectService.projects;
		}

		ProjectService.setSelectedProject = function(project) {
			ProjectService.selectedProject = project;
			$rootScope.$broadcast('selected-project-updated');
		}

		ProjectService.clearSelectedProject = function() {
			ProjectService.selectedProject = null
			$rootScope.$broadcast('selected-project-updated');
		}
		
		ProjectService.getMoreProjects = function() {
			$rootScope.$broadcast('get-more-projects');			
		}

		ProjectService.loadProjects = function(start, end) {
			var projects = ProjectService.getProjects();
			return projects.slice(start, end);
		}

		return ProjectService;

	})
	.directive('backToTop', function() {

		return {
			strict: 'A',
			link: function(scope, element, attr, ctrl) {

				var elem = angular.element(element)[0];

				element.on('click', function(event) {
					event.preventDefault();
					scroll(attr.href);	
				})

				var increments = 30;
				var timer = null;

				function stopShow() {
					clearTimeout(timer);
					increments = 20; 
				}

				function getstartElementTop(id) {
					return document.querySelector(id).offsetTop;
				}

				function getElementTop(id) {
					var elm = document.querySelector(id).parentNode
					var realTop = 0;

					do {
						realTop += elm.offsetTop;
						elm = elm.offsetParent;
					}
					while(elm);

					return realTop;
				}

				function getPageTop() {
					var pageTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

					if (pageTop === null || isNaN(pageTop) || pageTop === 'undefined') pageTop = 0;

					return pageTop;
				}

				function getScrollDirection(scrollValue, endElementTop) {
					var direction = 0;

					if (scrollValue > endElementTop) {
						direction = 1;
					}

					if (scrollValue < endElementTop) {
						direction = -1; 
					}

					return direction;
				}

				function getScrollPosition(start, end, pageTop) {
					return Math.abs(start - end - pageTop); 
				}

				function scroll(id) {
				  stopShow();
				  
				  var startElementTop = getstartElementTop(id)
				  var endElementTop =  getElementTop(id);
				  var pageTop = getPageTop();
				  var scrollValue = startElementTop - pageTop;
				  var position = getScrollPosition(startElementTop, endElementTop, pageTop);
				  var direction = getScrollDirection(scrollValue, endElementTop);

				  if(scrollValue !== endElementTop) {
				    step = ((position / 4) +1) * direction;

				    if(increments > 1) increments -= 1; 
				    else increments = 0; 

				    window.scrollBy(0, step);

				    timer = window.setTimeout(function() {
				      scroll(id);  
				    }, increments); 
				  }  

				  if(scrollValue === endElementTop) { 
				    stopShow();
				    return;
				  }
				}

			}
		}

	})
	.directive('stickyHeader', function() {

		return {
			strict: 'A',
			link: function(scope, element, attr, ctrl) {
				var elem = angular.element(element)[0];

				var waypoint = new Waypoint({
							 	element: elem,
							 		handler: function(direction) {
							   			
							   			if(direction === 'down') {
								   			ctrl.stickyClass = 'sticky';
								   		} else {
								   			ctrl.stickyClass = '';
								   		}

								   		scope.$apply();
									},
								 	offset: function() {
								 		return -this.element.clientHeight
								 	}
								});
			},
			controller: function() {
				this.stickyClass = '';
			},
			controllerAs: 'sticky'
		}

	})
	.directive('lazyLoadProjects', function(ProjectService) {

		return  {
			strict: 'A',
			link: function(scope, element, attr, ctrl) {
				var elem =  angular.element(element)[0];

				var waypoint = new Waypoint({
							 	element: elem,
							 		handler: function(direction) {
							   			scope.getMoreProjects()
									},
								 	offset: 20 
								});
			},
			controller: function($scope, ProjectService) {
				$scope.getMoreProjects = function() {
					ProjectService.getMoreProjects();
				}
			}
		}
	})
	.directive('projectTeaser', function() {

		return {
			strict: 'E',
			replace: true,
			scope: {
				project: '='
			},
			link: function(scope, element, attr, ctrl) {
				ctrl.title = scope.project.title;
				ctrl.subtitle = scope.project.subtitle;
				ctrl.thumb = scope.project.thumb;

				element.on('click', function() {
					var elem =  angular.element(element)[0];
					var bodyRect = document.body.getBoundingClientRect();
				    var elemRect = elem.getBoundingClientRect();
				    var offset   = elemRect.top - bodyRect.top;

					scope.project.top = elemRect.top;
					scope.project.left = 0;
					scope.project.scaleX = Math.round((elemRect.width / bodyRect.width)*100)/100;
					scope.project.scaleY = Math.round((elemRect.height / 600)*100)/100;
					ctrl.load();

				});

			},
			controller: function($scope, ProjectService) {
				this.title = '';
				this.subtitle = '';
				this.image = '';

				this.load = function(event) {
					ProjectService.setSelectedProject($scope.project);
				}
			},
			controllerAs: 'teaser',
			template:  '<article class="projectTeaser"> \
						 	<header class="projectTeaser_text"> \
					            <h3 ng-bind="teaser.title"></h3> \
					            <h5 ng-bind="teaser.subtitle"></h5> \
					        </header> \
					        <div class="projectTeaser_thumb" style="background-image: url({{teaser.thumb}})"> \
					        	<div class="overlay"></div> \
					        </div> \
					        <a href="" >View {{teaser.title}}</a> \
					    </article>'
		}

	})
	.directive('projectDetail', function() {

		return {
			strict: 'E',
			replace: true,
			controller: function($scope, ProjectService) {
				var self = this;

				this.selectedProject;
				this.title = '';
				this.subtitle = '';
				this.thumb = '';
				this.challenge = '';
				this.services = [];
				this.images = [];

				$scope.$on('selected-project-updated', function() {
					self.selectedProject = ProjectService.selectedProject;

					if(self.selectedProject != null) {
						self.title = self.selectedProject.title;
						self.short_text = self.selectedProject.short_text;
						self.thumb = self.selectedProject.thumb;
						self.challenge = self.selectedProject.challenge;
						self.services = self.selectedProject.services;
						self.images = self.selectedProject.images;
					}

				});
			},
			controllerAs: 'detail',
			template: '<div class="projectDetail"> \
						<header class="projectDetail_header"> \
							<div class="inner"> \
								<h1 ng-bind="detail.title"></h1> \
								<h2 ng-bind="detail.short_text"></h2> \
							</div> \
							<div class="projectDetail_thumb" style="background-image: url({{detail.thumb}})"> \
								<div class="overlay"></div> \
							</div> \
						</header> \
						<article class="projectDetail_content"> \
							<div class="inner"> \
								<div class="column"> \
									<h4>Challenge</h4> \
									<p ng-bind="detail.challenge"></p> \
								</div> \
								<div class="column"> \
									<h4>Services</h4> \
									<ul> \
										<li ng-repeat="service in detail.services" ng-bind="service"></li> \
									</ul> \
								</div> \
							</div> \
						</article> \
						<div class="projectDetail_images"> \
							<div class="inner"> \
								<img ng-repeat="image in detail.images" ng-src="img/{{image}}" /> \
							</div> \
						</div> \
						<footer class="page_footer"> \
							<div class="inner"> \
							    <a href="#modal-top" back-to-top>Back to top</a> \
						    </div> \
						</footer> \
					</div>'
		}

	})
	.directive('modal', function() {

		return {
			strict: 'E',
			replace: true,
			transclude: true,
			controller: function($scope, ProjectService, $timeout) {				
				var self = this;
				this.status = 'hide';

				this.left = 0;
				this.top = 0;
				this.scaleX = 0;
				this.scaleY = 0;

				this.close = function() {
					ProjectService.clearSelectedProject();
				}


				$scope.$on('selected-project-updated', function() {

					if(ProjectService.selectedProject != null) {

						self.left = ProjectService.selectedProject.left;
						self.top = ProjectService.selectedProject.top;
						self.scaleX = ProjectService.selectedProject.scaleX;
						self.scaleY = ProjectService.selectedProject.scaleY;

						$timeout(function() {
							self.status = 'opening';

							$timeout(function() {
								self.status = 'opening open';

								$timeout(function() {
									self.status = 'opening open loaded';
								}, 100);

							}, 300);

						}, 100);

					} else {

						self.status = 'hiding';

						$timeout(function() {
							self.status = 'hide';
							self.left = 0;
							self.top = 0;
						}, 500);

					}
				});
			},
			controllerAs: 'modal',
			template:  '<div id="modal-top" class="modal" ng-class="modal.status"> \
							<a href ng-click="modal.close()" class="close-button">close</a> \
							<div class="modalContainer" ng-transclude style="transform: translate({{modal.left}}px, {{modal.top}}px) scale({{modal.scaleX}},{{modal.scaleY}})"></div> \
						</div>'
		}

	})
	.controller('MainCtrl', function($scope, ProjectService) {
		var self = this;

		this.selectedProject = null;
		this.projectsShowing = 0;
		this.updating = false;
		this.projects = [];

		this.loadMoreProjects = function() {

			if(! this.updating) {
				this.updating = true;

				var increment = 3;

				if(ProjectService.projects.length > this.projectsShowing) {
					if((ProjectService.projects.length - this.projectsShowing) > increment) {
						this.projectsShowing += increment;
					} else {
						this.projectsShowing = ProjectService.projects.length;
					}
				}

				this.projects = ProjectService.loadProjects(0,this.projectsShowing);
				this.updating = false;

				$scope.$apply();
			}

		}
		
		this.isProjectSelected = function() {
			return (self.selectedProject != null);
		}

		$scope.$on('get-more-projects', function() {
			self.loadMoreProjects();
		});

		$scope.$on('selected-project-updated', function() {
			self.selectedProject = ProjectService.selectedProject;
		});

	});