/**
 * Libre Projects namespace
 */

lp = $.extend(lp, {

	/**
	 * Actual user locale
	 */
	locale: 'en',

	/**
	 * Translation dictionaries
	 */
	dictionaries: {},

	setLocale: function(locale) {
		if (!locale) {
			locale = $.cookie('locale');
		}
		if (!locale) {
			locale = window.navigator.language ? window.navigator.language : window.navigator.userLanguage;
		}

		if (locale != lp.locale) {
			$.cookie('locale', locale);
			lp.locale = locale;

			$.each(lp.locales, function(lidx, availableLocale) {
				if (locale.indexOf(availableLocale.id) != -1 || !locale.indexOf(availableLocale.name != -1)) {
					$('#locale a').removeClass('selected');
					$('#lang-' + availableLocale.id).addClass('selected');
					lp.translateTo(availableLocale.id);
				}
			} );
		}
	},

	getDictionary: function(locale) {
		$.getJSON('js/locales/' + locale + '.json', function(dictionary) {
			lp.dictionaries[locale] = dictionary;
			lp.translateTo(locale);
		} );
	},

	translateTo: function(locale) {
		if (!locale) {
			return;
		}

		if (typeof lp.dictionaries[locale] == 'undefined') {
			lp.getDictionary(locale);
			return;
		}

		$('.translatable').each(function(idxe, element) {
			var $element = $(element);
			var translation = '';

			if (typeof lp.dictionaries[locale][$element.data('translatable')] == 'string') {
				translation = lp.dictionaries[locale][$element.data('translatable')];
			} else {
				translation = $element.data('translatable');
			}
			$element.html(translation);
		} );
	},

	initTranslation: function() {
		$('.translatable').each(function(idxe, element) {
			var $element = $(element);
			$element.data('translatable', $element.html().replace(/"/g, '\''));
		} );
	},

	search: function() {
		var $search = $(this);

		// Only do the following after 100ms if keyup is not being used again
		$search.doTimeout('lp.search', 100, function() {
			var value = $search.val().toLowerCase()

			// Hide or show projects depending if they match or not
			$('#categories ul li span').each(function(idx, project) {
				var $project = $(project);
				if (value && $project.text().toLowerCase().indexOf(value) == -1) {
					$project.parents('li').hide();
				} else {
					$project.parents('li').show();
				}
			} );

			// Hide or show categories depending if all their projects are hidden or not
			$('#categories ul').each(function() {
				var $category = $(this);
				if ($category.find('li:visible').length) {
					$category.show().prev().show();
				} else {
					$category.hide().prev().hide();
				}
			} );
		} );
	},

	moveProjectToFavorites: function($li, $star) {
		if (!$star) {
			$star = $li.find('.star')
		}
		$star.removeClass('star-off')
		     .addClass('star-on');
		if ($li) {
			$li.appendTo($('h2#favorites').next());
			$('h2#favorites').show().next().show();
		}
	},

	removeProjectFromFavorites: function($li, $star) {
		if (!$star) {
			$star = $li.find('.star')
		}
		$star.removeClass('star-on')
		     .addClass('star-off');
		$li.appendTo($('h2#' + $li.data('category')).next());
		if ($('h2#favorites').next().find('li:visible').length == 0) {
			$('h2#favorites').hide().next().hide();
		}
	},

	addProjectToState: function(project) {
		var frags = $.deparam.fragment();
		if (typeof frags['favs'] == 'undefined') {
			frags['favs'] = '';
		}
		var favs = frags['favs'].split(',');
		if (typeof favs[project] == 'undefined') {
			favs.push(project);
		}
		favs = favs.filter(function(element){return element.length != ''});
		frags['favs'] = favs.join(',');
		$.bbq.pushState(frags);
	},

	removeProjectFromState: function(project) {
		var frags = $.deparam.fragment();
		if (typeof frags['favs'] != 'undefined') {
			var favs = frags['favs'].split(',');
			if (typeof favs[project]) {
				favs = favs.filter(function(element){return element != project});
			}
			if (favs.length == 0) {
				frags['favs'] = '';
			} else {
				frags['favs'] = favs.join(',');
			}
		}
		$.bbq.pushState(frags);
	},

	/**
	 * When the state change, we have to check if all projects in favorites
	 * still are there or if they have to be added or sent back to their
	 * categories.
	 */
	onStateChange: function(e) {
		var frags = $.deparam.fragment();
		if (typeof frags['favs'] != 'undefined') {
			var favs = frags['favs'].split(',');

			// Adding to favorites
			$.each(frags['favs'].split(','), function(idxf, fav) {
				if (fav) {
					var $project = $('#favorites').next().find('#' + fav);
					if ($project.length == 0) {
						lp.moveProjectToFavorites($('#' + fav));
					}
				}
			} );

			// Removing from favorites
			$('#favorites').next().find('li').each(function(idxf, fav) {
				var $fav = $(fav);
				if (favs.indexOf($fav.attr('id')) == -1 && fav != '') {
					lp.removeProjectFromFavorites($fav);
				}
			} );
		}
	}
} );

$(document).ready(function() {

	// Create translations availables
	var $locale = $('#locale');
	$.each(lp.locales, function(lidx, locale) {
		var $li = $('<li />');
		var $a = $('<a href="#" id="lang-' + locale.id + '" onclick="javascript:lp.setLocale(\'' + locale.id + '\');return false;" />').html('<img src="images/countries/' + locale.id + '.png" alt="' + locale.name + ' flag" />').appendTo($li);
		$li.appendTo($locale);
	} );

	// Total number of projects
	$('#nb-projects').html(lp.projects.length);

	// Create categories and adding projects
	var $categories = $('#categories')
	$.each(lp.categories, function(cidx, category) {
		var $h2 = $('<h2 id="' + category.id + '" />')
			          .html('<a href="#' + category.id + '" class="translatable">' + category.id + '</a>')
				  .appendTo($categories);

		var $ul = $('<ul />').appendTo($categories);
		$.each(lp.projects, function(pidx, project) {
			if (category.id == project.category) {
				$('<li id="' + project.id + '" />').html('<a href="' + project.address + '"><img src="logos/' + project.id + '.png" alt="" /><span><strong>' + project.name + '</strong>' + project.description + '</span><span class="star star-off"></span></a></li>')
					   .data('category', category.id)
					   .appendTo($ul);
			}
		} );
	} );

	lp.initTranslation();
	lp.setLocale();

	// Search
	$("label").inFieldLabels();
	$('#searching').keyup(lp.search).keyup();

	$('.star').click(function() {
		var $star = $(this);
		var $li = $star.parents('li');
		var $category = $star.parents('ul').prev();
		if ($category.attr('id') != 'favorites') {
			lp.moveProjectToFavorites($li, $star);
			lp.addProjectToState($li.attr('id'));
		} else {
			lp.removeProjectFromFavorites($li, $star);
			lp.removeProjectFromState($li.attr('id'));
		}
		return false;
	} );

	$(window).bind('hashchange', lp.onStateChange).trigger('hashchange');
} );
