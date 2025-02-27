 /**
 * Created by Michael on 04/05/14.
 */

describe('dirPagination directive', function() {

    var $compile;
    var $scope;
    var containingElement;
    var myCollection;

    beforeEach(module('angularUtils.directives.dirPagination'));
    beforeEach(module('templates-main'));

    beforeEach(inject(function($rootScope, _$compile_) {

        $compile = _$compile_;
        $scope = $rootScope.$new();
        containingElement = angular.element('<div></div>');

        myCollection = [];
        for(var i = 1; i <= 100; i++) {
            myCollection.push('item ' + i);
        }
    }));

    function compileElement(collection, itemsPerPage, currentPage, customExpression, totalItems) {
        var expression;
        var totalItemsHtml;
        var html;
        $scope.collection = collection;
        $scope.itemsPerPage = itemsPerPage;
        $scope.currentPage = currentPage || 1;
        $scope.totalItems = totalItems || undefined;
        totalItemsHtml =  (typeof totalItems !== 'undefined') ? 'total-items="totalItems"' : '';
        expression = customExpression || "item in collection | itemsPerPage: itemsPerPage";
        html = '<ul class="list"><li dir-paginate="'+ expression + '" current-page="currentPage" ' + totalItemsHtml + ' >{{ item }}</li></ul> ' +
            '<dir-pagination-controls></dir-pagination-controls>';
        containingElement.append($compile(html)($scope));
        $scope.$apply();
    }

    function getListItems() {
        return containingElement.find('ul.list li').map(function() {
            return $(this).text().trim();
        }).get();
    }

    function getPageLinksArray() {
        return containingElement.find('ul.pagination li').map(function() {
            return $(this).text().trim();
        }).get();
    }

    describe('paginated list', function() {

        it('should throw an exception if itemsPerPage filter not set', function() {
            function compile() {
                var customExpression = "item in collection";
                compileElement(myCollection, 5, 1, customExpression);
            }
            expect(compile).toThrow("pagination directive: the 'itemsPerPage' filter must be set.");
        });

        it('should allow a space after itemsPerPage and before the colon', function() {
            function compile() {
                var customExpression = "item in collection | itemsPerPage : 10";
                compileElement(myCollection, 5, 1, customExpression);
            }
            expect(compile).not.toThrow();
        });

        it('should repeat the items like ng-repeat', function() {
            compileElement(myCollection);
            var listItems = getListItems();

            expect(listItems.length).toBe(100);
        });

        it('should limit the items to match itemsPerPage = 10', function() {
            var listItems;

            compileElement(myCollection, 10);
            listItems = getListItems();
            expect(listItems.length).toBe(10);
        });

        it('should limit the items to match itemsPerPage = 50', function() {
            var listItems;

            compileElement(myCollection, 50);
            listItems = getListItems();
            expect(listItems.length).toBe(50);
        });

        it('should not mutate the collection itself ', function() {
            compileElement(myCollection);
            expect($scope.collection.length).toBe(100);
            compileElement(myCollection, 50);
            expect($scope.collection.length).toBe(100);
            compileElement(myCollection, 5);
            expect($scope.collection.length).toBe(100);
        });

        it('should work correctly with other filters (filter)', function() {
            $scope.filterBy = '2';
            var customExpression = "item in collection | filter: filterBy | itemsPerPage: itemsPerPage";
            compileElement(myCollection, 5, 1, customExpression);

            var listItems = getListItems();
            expect(listItems).toEqual(['item 2', 'item 12', 'item 20', 'item 21', 'item 22']);
        });

        it('should work correctly with other filters (orderBy)', function() {
            var customExpression = "item in collection | orderBy:'toString()':true | itemsPerPage: itemsPerPage";
            compileElement(myCollection, 5, 1, customExpression);

            var listItems = getListItems();
            expect(listItems).toEqual(['item 99', 'item 98', 'item 97', 'item 96', 'item 95']);
        });

        it('should work inside a transcluded directive (ng-if)', function() {
            $scope.collection = myCollection;
            var html = '<div ng-if="true">' +
                            '<ul class="list"><li dir-paginate="item in collection | itemsPerPage: 5">{{ item }}</li></ul> ' +
                            '<dir-pagination-controls></dir-pagination-controls>' +
                        '</div>';
            containingElement.append($compile(html)($scope));
            $scope.$apply();

            var listItems = getListItems();
            expect(listItems).toEqual(['item 1', 'item 2', 'item 3', 'item 4', 'item 5']);
        });

        it('should display the second page when compiled with currentPage = 2', function() {
            var listItems;
            compileElement(myCollection, 3, 2);
            listItems = getListItems();
            expect(listItems).toEqual(['item 4', 'item 5', 'item 6']);
        });

        it('should display the next page when the currentPage changes', function() {
            var listItems;
            compileElement(myCollection, 3);
            listItems = getListItems();
            expect(listItems).toEqual(['item 1', 'item 2', 'item 3']);

            $scope.$apply(function() {
                $scope.currentPage = 2;
            });
            listItems = getListItems();
            expect(listItems).toEqual(['item 4', 'item 5', 'item 6']);

            $scope.$apply(function() {
                $scope.currentPage = 3;
            });
            listItems = getListItems();
            expect(listItems).toEqual(['item 7', 'item 8', 'item 9']);
        });


        it('should work if itemsPerPage is a literal value', function() {
            var customExpression = "item in collection | itemsPerPage: 2";
            compileElement(myCollection, null, 1, customExpression);

            var listItems = getListItems();
            expect(listItems.length).toEqual(2);
            expect(listItems).toEqual(['item 1', 'item 2']);
        });

    });

    describe('if currentPage attribute is not set', function() {

        beforeEach(function() {
            $scope.collection = myCollection;
            html = '<ul class="list"><li dir-paginate="item in collection | itemsPerPage: 3">{{ item }}</li></ul> ' +
                '<dir-pagination-controls></dir-pagination-controls>';
            containingElement.append($compile(html)($scope));
            $scope.$apply();
        });

        it('should compile', function() {
            var listItems = getListItems();
            expect(listItems).toEqual(['item 1', 'item 2', 'item 3']);
        });

        it('should page correctly', function() {
            var pagination = containingElement.find('ul.pagination');

            pagination.children().eq(3).find('a').triggerHandler('click');
            $scope.$apply();
            expect($scope.__default__currentPage).toBe(3);
            var listItems = getListItems();
            expect(listItems).toEqual(['item 7', 'item 8', 'item 9']);
        });
    });

    describe('pagination controls', function() {

        it('should throw an exception if the dir-paginate directive has not been set up', function() {
            function compile() {
                var html = '<dir-pagination-controls></dir-pagination-controls>';
                containingElement.append($compile(html)($scope));
                $scope.$apply();
            }

            expect(compile).toThrow("pagination directive: the pagination controls cannot be used without the corresponding pagination directive.");
        });

        it('should not display pagination if all rows fit on one page', function() {
            compileElement(myCollection, 9999);
            var paginationLinks = getPageLinksArray();

            expect(paginationLinks.length).toBe(0);
        });

        it('should paginate by default if all items do not fit on page', function() {
            compileElement(myCollection, 40);
            var paginationLinks = getPageLinksArray();

            expect(paginationLinks).toEqual(['‹','1', '2', '3', '›']);
        });

        it('should update the currentPage property of $scope when links clicked', function() {
            compileElement(myCollection, 40);
            var pagination = containingElement.find('ul.pagination');

            pagination.children().eq(3).find('a').triggerHandler('click');
            $scope.$apply();
            expect($scope.currentPage).toBe(3);

            pagination.children().eq(2).find('a').triggerHandler('click');
            $scope.$apply();
            expect($scope.currentPage).toBe(2);

            pagination.children().eq(1).find('a').triggerHandler('click');
            $scope.$apply();
            expect($scope.currentPage).toBe(1);
        });

        it('should set the pagination.current value to 5 when compiled with currentPage = 5', function() {
            compileElement(myCollection, 3, 5);
            var activePageItem = containingElement.find('li.active').eq(0);
            var activePage = activePageItem.text().trim();

            expect(activePage).toEqual('5');
        });

        it('should show the correct pagination links at start of sequence', function() {
            compileElement(myCollection, 1);
            var pageLinks = getPageLinksArray();

            expect(pageLinks).toEqual(['‹','1', '2', '3', '4', '5', '6', '7', '...', '100', '›']);
        });

        it('should show the correct pagination links in middle sequence', function() {
            compileElement(myCollection, 1);
            $scope.$apply(function() {
                $scope.currentPage = 50;
            });
            var pageLinks = getPageLinksArray();

            expect(pageLinks).toEqual(['‹','1', '...', '48', '49', '50', '51', '52', '...', '100', '›']);
        });

        it('should show the correct pagination links at end of sequence', function() {
            compileElement(myCollection, 1);
            $scope.$apply(function() {
                $scope.currentPage = 99;
            });
            var pageLinks = getPageLinksArray();

            expect(pageLinks).toEqual(['‹','1', '...', '94', '95', '96', '97', '98', '99', '100', '›']);
        });

        it('should show the correct pagination links after item removed from cllection', function() {
            compileElement(myCollection, 1);
            $scope.$apply(function() {
                $scope.currentPage = 98;
            });

            $scope.$apply(function() {
                $scope.collection.pop();
            });
            var pageLinks = getPageLinksArray();

            expect(pageLinks).toEqual(['‹','1', '...', '93', '94', '95', '96', '97', '98', '99', '›']);
        });

        it('should calculate pages based off collection after all filters are applied', function() {
            $scope.filterBy = '2';
            var customExpression = "item in collection | filter: filterBy | itemsPerPage: itemsPerPage";
            compileElement(myCollection, 5, 1, customExpression);

            var pageLinks = getPageLinksArray();
            expect(pageLinks.length).toEqual(6);
        });

        it('should update the active page to reflect the value of the current-page property', function() {
            compileElement(myCollection, 10, 3);

            var activeLink = containingElement.find('ul.pagination li.active');
            expect(activeLink.html()).toContain(3);

            $scope.$apply(function() {
                $scope.currentPage = 1;
            });

            activeLink = containingElement.find('ul.pagination li.active');
            expect(activeLink.html()).toContain(1);
        });

        describe('optional attributes', function() {

            function compileWithAttributes(attributes) {
                $scope.collection = myCollection;
                $scope.currentPage = 1;
                html = '<ul class="list"><li dir-paginate="item in collection | itemsPerPage: 10" current-page="currentPage">{{ item }}</li></ul> ' +
                    '<dir-pagination-controls ' + attributes + ' ></dir-pagination-controls>';
                containingElement.append($compile(html)($scope));
                $scope.$apply();
            }


            it('should accept a max-size attribute to limit the length of the control', function() {
                compileWithAttributes(' max-size="5" ');

                var pageLinks = getPageLinksArray();

                expect(pageLinks).toEqual(['‹','1', '2', '3', '...', '10', '›']);
            });

            it('should impose a minimum max-size of 5', function() {
                compileWithAttributes(' max-size="2" ');

                var pageLinks = getPageLinksArray();

                expect(pageLinks).toEqual(['‹','1', '2', '3', '...', '10', '›']);
            });

            it('should go to the last page when clicking the end arrow', function() {
                compileWithAttributes(' boundary-links="true" ');
                var pagination = containingElement.find('ul.pagination');

                pagination.children().eq(10).find('a').triggerHandler('click');
                $scope.$apply();
                expect($scope.currentPage).toBe(10);
            });

            it('should go to the first page when clicking the end arrow', function() {
                compileWithAttributes(' boundary-links="true" ');
                var pagination = containingElement.find('ul.pagination');

                $scope.$apply(function() {
                    $scope.currentPage = 5;
                });
                expect($scope.currentPage).toBe(5);

                pagination.children().eq(0).find('a').triggerHandler('click');
                $scope.$apply();
                expect($scope.currentPage).toBe(1);
            });

            it('should page forward', function() {
                compileWithAttributes('  ');
                var pagination = containingElement.find('ul.pagination');

                pagination.children().eq(10).find('a').triggerHandler('click');
                $scope.$apply();
                expect($scope.currentPage).toBe(2);
            });

            describe('on-page-change callback', function() {

                beforeEach(function() {
                    $scope.myCallback = function(currentPage) {
                        return "The current page is " + currentPage;
                    };
                    spyOn($scope, 'myCallback').and.callThrough();
                    compileWithAttributes(' on-page-change="myCallback(newPageNumber)" ');
                });

                it('should call the callback once when page link clicked', function() {
                    var pagination = containingElement.find('ul.pagination');

                    expect($scope.myCallback.calls.count()).toEqual(0);
                    pagination.children().eq(2).find('a').triggerHandler('click');
                    $scope.$apply();
                    expect($scope.myCallback).toHaveBeenCalled();
                    expect($scope.myCallback.calls.count()).toEqual(1);
                });

                it('should pass the current page number to the callback', function() {
                    var pagination = containingElement.find('ul.pagination');

                    pagination.children().eq(2).find('a').triggerHandler('click');
                    $scope.$apply();
                    expect($scope.myCallback).toHaveBeenCalledWith(2);
                });
            });

            describe('total-items attribute', function() {

                it('should give correct pagination at 200', function() {
                    compileElement(myCollection, 100, 1, false, 200);

                    var pageLinks = getPageLinksArray();
                    expect(pageLinks).toEqual(['‹','1', '2', '›']);
                });

                it('should give correct pagination at 500', function() {
                    compileElement(myCollection, 100, 1, false, 500);

                    var pageLinks = getPageLinksArray();
                    expect(pageLinks).toEqual(['‹','1', '2','3','4','5', '›']);
                });

                it('should correctly display the second page of results', function() {
                    compileElement(myCollection, 100, 2, false, 500);
                    listItems = getListItems();
                    expect(listItems.length).toEqual(100);
                });
            });
        });

    });

    describe('multiple pagination instances per page', function() {

        var collection1, collection2, currentPage1, currentPage2;

        beforeEach(function() {
            collection1 = [];
            collection2 = [];
            for (var i = 0; i < 20; i++) {
                collection1.push('c1:' + i);
                collection2.push('c2:' + i);
            }
        });

        /**
         * Compile function for multiple pagination directives on a single page
         * @param collection
         * @param itemsPerPage
         * @param currentPage
         * @param paginationId
         * @param customExpression
         */
        function compileMultipleInstance(collection, itemsPerPage, currentPage, paginationId, customExpression) {
            var expression;
            var html;
            if ($scope.collection === undefined) {
                $scope.collection = {};
            }
            if ($scope.itemsPerPage === undefined) {
                $scope.itemsPerPage = {};
            }
            if ($scope.currentPage === undefined) {
                $scope.currentPage = {};
            }
            $scope.collection[paginationId] = collection;
            $scope.itemsPerPage[paginationId] = itemsPerPage;
            $scope.currentPage[paginationId] = currentPage || 1;
            expression = customExpression || "item in collection." + paginationId + " | itemsPerPage: itemsPerPage." + paginationId + ": '" + paginationId + "'";
            html = '<ul class="list"><li dir-paginate="'+ expression + '" current-page="currentPage.' + paginationId + '" pagination-id="' + paginationId + '" >{{ item }}</li></ul> ' +
                '<dir-pagination-controls pagination-id="' + paginationId + '"></dir-pagination-controls>';
            containingElement.append($compile(html)($scope));
            $scope.$apply();
        }

        function clickPaginationLink(paginationId, index) {
            var pagination = containingElement.find('dir-pagination-controls[pagination-id="' + paginationId + '"]');

            pagination.find('li').eq(index).find('a').triggerHandler('click');
            $scope.$apply();
        }

        function getMultiPageLinksArray(paginationId) {
            return containingElement.find('dir-pagination-controls[pagination-id="' + paginationId + '"] li').map(function() {
                return $(this).text().trim();
            }).get();
        }

        function getMultiListItems(paginationId) {
            return containingElement.find('li[pagination-id="' + paginationId + '"]').map(function() {
                return $(this).text().trim();
            }).get();
        }

        it('should allow pagination-id to control a specific collection', function() {
            compileMultipleInstance(collection1, 5, 1, "c1" );
            compileMultipleInstance(collection2, 5, 1, "c2" );

            clickPaginationLink("c1", 2);
            clickPaginationLink("c2", 4);

            expect($scope.currentPage.c1).toEqual(2);
            expect($scope.currentPage.c2).toEqual(4);
        });

        it('should allow independent changing of items per page', function() {
            compileMultipleInstance(collection1, 5, 1, "c1" );
            compileMultipleInstance(collection2, 5, 1, "c2" );

            expect(getMultiPageLinksArray("c1").length).toBe(6);
            expect(getMultiPageLinksArray("c2").length).toBe(6);

            $scope.$apply(function() {
                $scope.itemsPerPage.c1 = 10;
            });

            expect(getMultiPageLinksArray("c1").length).toBe(4);
            expect(getMultiPageLinksArray("c2").length).toBe(6);

            $scope.$apply(function() {
                $scope.itemsPerPage.c2 = 7;
            });

            expect(getMultiPageLinksArray("c1").length).toBe(4);
            expect(getMultiPageLinksArray("c2").length).toBe(5);
        });

        it('should allow independent filtering', function() {
            compileMultipleInstance(collection1, 5, 1, "c1", "item in collection.c1 | filter: filter1 | itemsPerPage: itemsPerPage.c1: 'c1'");
            compileMultipleInstance(collection2, 5, 1, "c2", "item in collection.c2 | filter: filter2 | itemsPerPage: itemsPerPage.c2: 'c2'" );

            $scope.$apply(function() {
                $scope.filter1 = "7";
                $scope.filter2 = "8";
            });

            expect(getMultiListItems("c1")).toEqual(['c1:7', 'c1:17']);
            expect(getMultiListItems("c2")).toEqual(['c2:8', 'c2:18']);

        });

        it('should allow independent setting of current-page externally', function() {
            compileMultipleInstance(collection1, 2, 1, "c1" );
            compileMultipleInstance(collection2, 2, 1, "c2" );

            $scope.$apply(function() {
                $scope.currentPage.c1 = 2;
                $scope.currentPage.c2 = 4;
            });

            expect(getMultiListItems("c1")).toEqual(['c1:2', 'c1:3']);
            expect(getMultiListItems("c2")).toEqual(['c2:6', 'c2:7']);
        });

        it('should throw an exception if a non-existant paginationId is set in the pagination-controls', function() {
            $scope.collection = [1,2,3,4,5];

            function compile() {
                var html = '<ul class="list"><li dir-paginate="item in collection | itemsPerPage: 3 : \'id1\'" pagination-id="id1" >{{ item }}</li></ul> ' +
                    '<dir-pagination-controls pagination-id="id2"></dir-pagination-controls>';

                containingElement.append($compile(html)($scope));
                $scope.$apply();
            }

            expect(compile).toThrow("pagination directive: the pagination controls (id: id2) cannot be used without the corresponding pagination directive.");
        });

        it('should throw an exception if a non-existant paginationId is set in the itemsPerPage filter', function() {
            $scope.collection = [1,2,3,4,5];

            function compile() {
                var html = '<ul class="list"><li dir-paginate="item in collection | itemsPerPage: 3 : \'id2\'" pagination-id="id1" >{{ item }}</li></ul> ' +
                    '<dir-pagination-controls pagination-id="id1"></dir-pagination-controls>';

                containingElement.append($compile(html)($scope));
                $scope.$apply();
            }

            expect(compile).toThrow("pagination directive: the itemsPerPage id argument (id: id2) does not match a registered pagination-id.");
        });

    });

    describe('multi element functionality', function() {

        function compileMultiElement(collection, itemsPerPage, currentPage) {
            var html;
            $scope.collection = collection;
            $scope.itemsPerPage = itemsPerPage || 10;
            $scope.currentPage = currentPage || 1;
            html = '<div>' +
                        '<div dir-paginate-start="item in collection | itemsPerPage: itemsPerPage" current-page="currentPage">header</div>' +
                        '<p>{{ item }}</p>' +
                        '<div dir-paginate-end>footer</div>' +
                    '</div> ';
            containingElement.append($compile(html)($scope));
            $scope.$apply();
        }

        it('should compile with multi element syntax', function() {
            function compile() {
                compileMultiElement([]);
            }
            expect(compile).not.toThrow();
        });

        it('should display the list correctly', function() {
            compileMultiElement(myCollection, 3);
            expect(containingElement.find('p').length).toEqual(3);
        });

        it('should page correctly', function() {
            compileMultiElement(myCollection, 3);

            expect(containingElement.find('p').eq(0).html()).toEqual('item 1');

            $scope.$apply(function() {
                $scope.currentPage = 2;
            });

            expect(containingElement.find('p').eq(0).html()).toEqual('item 4');
        });

        it('should work with data-dir-paginate-start syntax', function() {
            function compile() {
                var html = '<div>' +
                    '<h1 data-dir-paginate-start="item in collection | itemsPerPage: 3">{{ item }}</h1>' +
                    '<p data-dir-paginate-end>stuff</p>' +
                    '</div> ';
                $scope.collection = myCollection;
                containingElement.append($compile(html)($scope));
                $scope.$apply();
            }

            expect(compile).not.toThrow();
            expect(containingElement.find('h1').length).toEqual(3);
            expect(containingElement.find('p').length).toEqual(3);
        });
    });
});
