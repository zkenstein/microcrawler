// Copyright, 2013-2014, by Tomas Korcak. <korczis@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

(function () {
    'use strict';

    var define = require('amdefine')(module);

    /**
     * Array of modules this one depends on.
     * @type {Array}
     */
    var deps = [
        './lib'
    ];

    define(deps, function(Mc) {
        // First step is to create engine
        var engine = new Mc.Engine();

        // Register listing processor
        engine.registerProcessor('yelp.listing', function($, item) {
            var results = [];

            // Process pagination
            $('.pagination-links > li > a').each(function($) {
                var url = 'http://www.yelp.com' + this.attr('href');
                results.push({
                    type: 'url',
                    url: url,
                    processor: 'yelp.listing'
                });
            });

            // Process results
            $('.search-result').each(function () {
                var result = {};

                // Name
                result.businessName = $(this).find('h3 > span > a').text();
                result.detailUrl = 'http://www.yelp.com' + $(this).find('h3 > span > a').attr('href');

                // Phone number
                var tmp = $(this).find('.biz-phone').text();
                tmp = tmp.replace(/\D/g, '');
                tmp = parseInt(tmp);
                result.phoneNumber = tmp;

                // Reviews
                result.reviews = {};

                // Number of reviews
                tmp = $(this).find('.review-count').text();
                tmp = tmp.slice(14, -14);
                tmp = parseInt(tmp);
                result.reviews.number = tmp;

                // Stars
                tmp = $(this).find('.star-img').attr('title');
                tmp = tmp.slice(0, -12);
                tmp = parseFloat(tmp);
                result.reviews.stars = tmp;

                // Address
                result.address = {};

                // Neighborhood street
                tmp = $(this).find('.neighborhood-str-list').text();
                tmp = tmp.slice(13, -8);
                result.address.neighborhoodStr = tmp;

                // Full address
                tmp = $(this).find('address').text();
                tmp = tmp.slice(13, -10);
                result.address.fullAddress = tmp;

                // Category
                var categories = [];
                $(this).find('.category-str-list a').each(function () {
                    var category = this.text();
                    categories.push(category);
                });

                result.categories = categories;

                result.listingUrl = item.url;

                /*
                results.push({
                    type: 'data',
                    data: result
                });
                //*/

                results.push({
                    type: 'url',
                    url: result.detailUrl,
                    processor: 'yelp.listing.details',
                    data: result
                });
            });

            // console.log(JSON.stringify(results, null, 4));

            return results;
        });

        engine.registerProcessor('yelp.listing.details', function($, item) {
            var results = [];

            var result = item;

            result.data.openingHours = [];

            // TODO: Enrich result with details from $
            $('.hours-table > tbody > tr > td:not(.extra)').each(function(e) {
                result.data.openingHours.push({
                    from: $(this).find('span:nth-child(1)').text(),
                    to: $(this).find('span:nth-child(2)').text()
                });
            });

            console.log(JSON.stringify(result, null, 4));

            results.push({
                type: 'data',
                data: result.data
            });

            return results;
        });

        var results = [];

        // Register on data event handler
        engine.on('data', function (result) {
            results.push(result);
            console.log(JSON.stringify(result, null, 4));
        });

        // Main url where to start scrapping
        var mainUrl = 'http://www.yelp.com/search?find_desc=restaurants&find_loc=Los+Angeles%2C+CA&ns=1&ls=f4de31e623458437';

        // Enqueue URL and use yelp.listing processor registered above
        engine.enqueueUrl(mainUrl, 'yelp.listing');

        // Now just launch the engine and wait for results
        engine.run().done(function() {
            // This is handler of success
            console.log('Done, ' + results.length + ' results!');
        }, function(err) {
            // This is handler of error
            console.log('ERROR: ' + err);
        });
    });

}());
