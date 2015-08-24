angular
	.module('app', ['ngRoute'])
	.config(['$routeProvider',
		function($routeProvider) {
			$routeProvider.
				when('/home', {
				templateUrl: 'views/home.tpl.html'
			}).
			when('/project/:slug', {
				templateUrl: 'views/project-detail.tpl.html'
			}).
			otherwise({
				redirectTo: '/home'
			});
	}])
	.factory('ProjectService', function($rootScope, $http) {

		var ProjectService = {};

		ProjectService.selectedProject = null;
		ProjectService.selectedIndex = 0;
		ProjectService.projects = [];

		var url = 'js/projects.json';


		$http.get(url).success(function(data) {
	        ProjectService.projects = data;
	        ProjectService.projectsLoaded();
	    });

		ProjectService.getProjects = function() {
			return ProjectService.projects;
		}

		ProjectService.projectsLoaded = function() {
			$rootScope.$broadcast('projects-loaded');	
		}

		ProjectService.setSelectedProject = function(project) {
			ProjectService.selectedProject = project;
			ProjectService.setSelectedIndex(project);
			$rootScope.$broadcast('selected-project-updated');
		}

		ProjectService.setSelectedProjectBySlug = function(slug) {
			ProjectService.projects.forEach(function(project) {
			
				if(project.slug === slug) {
					ProjectService.setSelectedProject(project);
				}
			});
		}

		ProjectService.setSelectedIndex = function(project) {
			for(var i = 0; i < ProjectService.projects.length; i++) {
				if(ProjectService.projects[i].slug === project.slug) {
					ProjectService.selectedIndex = i;
					i = ProjectService.projects.length;
				}
			}
		}

		ProjectService.getNextProject = function() {
			if(ProjectService.selectedIndex < ProjectService.projects.length-1) {
				return ProjectService.projects[ProjectService.selectedIndex + 1];
			} else {
				return ProjectService.projects[0];
			}
		}

		ProjectService.getPreviousProject = function() {
			if(ProjectService.selectedIndex > 0) {
				return ProjectService.projects[ProjectService.selectedIndex - 1];
			} else {
				return ProjectService.projects[ProjectService.projects.length - 1];
			}
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
	.directive('lazyLoadImages', function(ProjectService) {

		return  {
			strict: 'A',
			link: function(scope, element, attr, ctrl) {
				var elem =  angular.element(element)[0];

				var waypoint = new Waypoint({
							 	element: elem,
							 		handler: function(direction) {
							   			ctrl.getMoreImages()
									},
								 	offset: 0
								});
			},
			controller: function($scope, ProjectService) {
				// this.showing = 0;
				this.total = ProjectService.selectedProject.images.length;
				// this.increment = this.total;
				this.images = [];

				this.getMoreImages = function() {
					this.images = ProjectService.selectedProject.images.slice(0, this.total);

					// if(this.total > this.showing) {

					// 	if(this.total - this.showing > this.increment) {
					// 		this.showing += this.increment;
					// 		this.images = ProjectService.selectedProject.images.slice(0, this.showing);
					// 	} else {
					// 		this.showing = this.total;
					// 		this.images = ProjectService.selectedProject.images.slice(0, this.showing);
					// 	}
					// }	
				}
			},
			controllerAs: 'imageStore'

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
				var elem =  angular.element(element)[0];

				ctrl.title = scope.project.title;
				ctrl.subtitle = scope.project.subtitle;
				ctrl.thumb = scope.project.thumb;
				ctrl.slug = scope.project.slug;

				element.on('click', function() {
					
					var bodyRect = document.body.getBoundingClientRect();
				    var elemRect = elem.getBoundingClientRect();
				    var offset   = elemRect.top - bodyRect.top;

					scope.project.top = elemRect.top;
					scope.project.left = 0;
					scope.project.scaleX = Math.round((elemRect.width / bodyRect.width)*100)/100;
					scope.project.scaleY = Math.round((elemRect.height / 600)*100)/100;
					ctrl.load();

				});

				new Waypoint({
							 	element: elem,
							 		handler: function(direction) {
							 			console.log('triggered');
							   			// ctrl.getMoreImages()
							   			// ctrl.active = true;
							   			element.addClass('active');
							   			// scope.$apply();

									},
								 	offset: 'bottom-in-view'
								});

			},
			controller: function($scope, ProjectService, $location, $timeout) {
				this.title = '';
				this.subtitle = '';
				this.image = '';
				this.slug = '';
				this.active = false;

				this.load = function(event) {
					ProjectService.setSelectedProject($scope.project);
					$timeout(function() {
						// $window.location.href = '#/project/' + $scope.project.slug;
						$location.path('/project/' + $scope.project.slug);
					},100);
				}
			},
			controllerAs: 'teaser',
			template:  '<article id="#{{teaser.slug}}" class="projectTeaser" ng-class="{\'active\':teaser.active}"> \
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
	.directive('modal', function() {

		return {
			strict: 'E',
			replace: true,
			transclude: true,
			link: function(scope, element) {

			},
			controller: function($scope, ProjectService, $timeout, $location) {				
				var self = this;
				this.status = 'hide';

				this.left = 0;
				this.top = 0;
				this.scaleX = 0;
				this.scaleY = 0;

				this.close = function() {
					ProjectService.clearSelectedProject();
					$location.path('/home');
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

						}, 1);

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
							<div class="modalContainer" ng-transclude></div> \
						</div>'
		}

	})
	.controller('ProjectDetailCtrl', function($scope, $routeParams, $location, ProjectService) {
		var self = this;

		this.title = '';
		this.subtitle = '';
		this.thumb = '';
		this.challenge = '';
		this.services = [];
		this.images = [];
		this.next = {};
		this.previous = {};

		this.updateProjectDetails = function() {
			if(ProjectService.selectedProject != null) {									
				self.title = ProjectService.selectedProject.title;
				self.short_text = ProjectService.selectedProject.short_text;
				self.thumb = ProjectService.selectedProject.thumb;
				self.challenge = ProjectService.selectedProject.challenge;
				self.services = ProjectService.selectedProject.services;
				self.images = ProjectService.selectedProject.images;
				self.next = ProjectService.getNextProject();
				self.previous = ProjectService.getPreviousProject();
			}
		}

		this.goToNext = function() {
			$location.path('/project/'+this.next.slug);
		};

		this.goToPrevious = function() {
			$location.path('/project/'+this.previous.slug);
		};


		$scope.$on('projects-loaded', function() {
			ProjectService.setSelectedProjectBySlug($routeParams.slug);
		});

		$scope.$on('selected-project-updated', function() {	
			self.updateProjectDetails();			
		});


		if(ProjectService.projects.length > 0) {
			ProjectService.setSelectedProjectBySlug($routeParams.slug);
			this.updateProjectDetails();
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
			}

		}

		$scope.$on('get-more-projects', function() {
			self.loadMoreProjects();
		});

		$scope.$on('projects-loaded', function() {
			self.loadMoreProjects();
		});

		if(ProjectService.projects.length > 0) {
			this.loadMoreProjects();
		}

	})
	.controller('AppCtrl', function($scope, $timeout, ProjectService) {
		var self = this;
		this.firstLoad = true;
		this.loading = true;

		$timeout(function() {
			self.firstLoad = false;
		}, 1500)

		$scope.$on('projects-loaded', function() {
			self.loading = false;
			// self.firstLoad = false;
		});
	});



