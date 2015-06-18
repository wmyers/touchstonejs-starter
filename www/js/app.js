(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
  Copyright (c) 2015 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/

(function () {
	'use strict';

	function classNames () {

		var classes = '';

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if ('string' === argType || 'number' === argType) {
				classes += ' ' + arg;

			} else if (Array.isArray(arg)) {
				classes += ' ' + classNames.apply(null, arg);

			} else if ('object' === argType) {
				for (var key in arg) {
					if (arg.hasOwnProperty(key) && arg[key]) {
						classes += ' ' + key;
					}
				}
			}
		}

		return classes.substr(1);
	}

	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		// AMD. Register as an anonymous module.
		define(function () {
			return classNames;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = classNames;
	} else {
		window.classNames = classNames;
	}

}());

},{}],2:[function(require,module,exports){
var React = require('react');

// Enable React Touch Events
React.initializeTouchEvents(true);

function getTouchProps(touch) {
	if (!touch) return {};
	return {
		pageX: touch.pageX,
		pageY: touch.pageY,
		clientX: touch.clientX,
		clientY: touch.clientY
	};
}

function extend(target, source) {
	if (!source || Object.prototype.toString.call(source) !== '[object Object]') return target;
	for (var key in source) {
		if (source.hasOwnProperty(key)) {
			target[key] = source[key];
		}
	}
	return target;
}

/**
 * Tappable Component
 * ==================
 */

module.exports = React.createClass({
	
	displayName: 'Tappable',
	
	propTypes: {
		
		component: React.PropTypes.any,              // component to create
		className: React.PropTypes.string,           // optional className
		classBase: React.PropTypes.string,           // base for generated classNames
		style: React.PropTypes.object,               // additional style properties for the component
		disabled: React.PropTypes.bool,              // only applies to buttons
		
		moveThreshold: React.PropTypes.number,       // pixels to move before cancelling tap
		pressDelay: React.PropTypes.number,          // ms to wait before detecting a press
		pressMoveThreshold: React.PropTypes.number,  // pixels to move before cancelling press
		preventDefault: React.PropTypes.bool,        // whether to preventDefault on all events
		stopPropagation: React.PropTypes.bool,       // whether to stopPropagation on all events
		
		onTap: React.PropTypes.func,                 // fires when a tap is detected
		onPress: React.PropTypes.func,               // fires when a press is detected
		onTouchStart: React.PropTypes.func,          // pass-through touch event
		onTouchMove: React.PropTypes.func,           // pass-through touch event
		onTouchEnd: React.PropTypes.func,            // pass-through touch event
		onMouseDown: React.PropTypes.func,           // pass-through mouse event
		onMouseUp: React.PropTypes.func,             // pass-through mouse event
		onMouseMove: React.PropTypes.func,           // pass-through mouse event
		onMouseOut: React.PropTypes.func             // pass-through mouse event
		
	},
	
	getDefaultProps: function() {
		return {
			component: 'span',
			classBase: 'Tappable',
			moveThreshold: 100,
			pressDelay: 1000,
			pressMoveThreshold: 5
		};
	},
	
	getInitialState: function() {
		return {
			isActive: false,
			touchActive: false
		};
	},
	
	componentWillUnmount: function() {
		this.cleanupScrollDetection();
		this.cancelPressDetection();
	},
	
	processEvent: function(event) {
		if (this.props.preventDefault) event.preventDefault();
		if (this.props.stopPropagation) event.stopPropagation();
	},
	
	onTouchStart: function(event) {
		if (this.props.onTouchStart && this.props.onTouchStart(event) === false) return;
		this.processEvent(event);
		window._blockMouseEvents = true;
		this._initialTouch = this._lastTouch = getTouchProps(event.touches[0]);
		this.initScrollDetection();
		this.initPressDetection(this.endTouch);
		this.setState({
			isActive: true
		});
	},
	
	initScrollDetection: function() {
		this._scrollParents = [];
		this._scrollPos = { top: 0, left: 0 };
		var node = this.getDOMNode();
		while (node) {
			if (node.scrollHeight > node.offsetHeight || node.scrollWidth > node.offsetWidth) {
				this._scrollParents.push(node);
				this._scrollPos.top += node.scrollTop;
				this._scrollPos.left += node.scrollLeft;
			}
			node = node.parentNode;
		}
	},
	
	calculateMovement: function(touch) {
		return {
			x: Math.abs(touch.clientX - this._initialTouch.clientX),
			y: Math.abs(touch.clientY - this._initialTouch.clientY)
		};
	},
	
	detectScroll: function() {
		var currentScrollPos = { top: 0, left: 0 };
		for (var i = 0; i < this._scrollParents.length; i++) {
			currentScrollPos.top += this._scrollParents[i].scrollTop;
			currentScrollPos.left += this._scrollParents[i].scrollLeft;
		}
		return !(currentScrollPos.top === this._scrollPos.top && currentScrollPos.left === this._scrollPos.left);
	},
	
	cleanupScrollDetection: function() {
		this._scrollParents = undefined;
		this._scrollPos = undefined;
	},
	
	initPressDetection: function(callback) {
		if (!this.props.onPress) return;
		this._pressTimeout = setTimeout(function() {
			this.props.onPress();
			callback();
		}.bind(this), this.props.pressDelay);
	},
	
	cancelPressDetection: function() {
		clearTimeout(this._pressTimeout);
	},
	
	onTouchMove: function(event) {
		if (!this._initialTouch) return;
		this.processEvent(event);
		if (this.detectScroll()) {
			return this.endTouch(event);
		}
		this.props.onTouchMove && this.props.onTouchMove(event);
		this._lastTouch = getTouchProps(event.touches[0]);
		var movement = this.calculateMovement(this._lastTouch);
		if (movement.x > this.props.pressMoveThreshold || movement.y > this.props.pressMoveThreshold) {
			this.cancelPressDetection();
		}
		if (movement.x > this.props.moveThreshold || movement.y > this.props.moveThreshold) {
			if (this.state.isActive) {
				this.setState({
					isActive: false
				});
			}
		} else {
			if (!this.state.isActive) {
				this.setState({
					isActive: true
				});
			}
		}
	},
	
	onTouchEnd: function(event) {
		if (!this._initialTouch) return;
		this.processEvent(event);
		var movement = this.calculateMovement(this._lastTouch);
		if (movement.x <= this.props.moveThreshold && movement.y <= this.props.moveThreshold) {
			this.props.onTap && this.props.onTap(event);
		}
		this.endTouch(event);
	},
	
	endTouch: function() {
		this.cancelPressDetection();
		this.props.onTouchEnd && this.props.onTouchEnd(event);
		this._initialTouch = null;
		this._lastTouch = null;
		this.setState({
			isActive: false
		});
	},
	
	onMouseDown: function(event) {
		if (window._blockMouseEvents) {
			window._blockMouseEvents = false;
			return;
		}
		if (this.props.onMouseDown && this.props.onMouseDown(event) === false) return;
		this.processEvent(event);
		this.initPressDetection(this.endMouseEvent);
		this._mouseDown = true;
		this.setState({
			isActive: true
		});
	},
	
	onMouseMove: function(event) {
		if (window._blockMouseEvents || !this._mouseDown) return;
		this.processEvent(event);
		this.props.onMouseMove && this.props.onMouseMove(event);
	},
	
	onMouseUp: function(event) {
		if (window._blockMouseEvents || !this._mouseDown) return;
		this.processEvent(event);
		this.props.onMouseUp && this.props.onMouseUp(event);
		this.props.onTap && this.props.onTap(event);
		this.endMouseEvent();
	},
	
	onMouseOut: function(event) {
		if (window._blockMouseEvents || !this._mouseDown) return;
		this.processEvent(event);
		this.props.onMouseOut && this.props.onMouseOut(event);
		this.endMouseEvent();
	},
	
	endMouseEvent: function() {
		this.cancelPressDetection();
		this._mouseDown = false;
		this.setState({
			isActive: false
		});
	},
	
	render: function() {
		
		var className = this.props.classBase + (this.state.isActive ? '-active' : '-inactive');
		if (this.props.className) {
			className += ' ' + this.props.className;
		}
		
		var style = {
			WebkitTapHighlightColor: 'rgba(0,0,0,0)',
			WebkitTouchCallout: 'none',
			WebkitUserSelect: 'none',
			KhtmlUserSelect: 'none',
			MozUserSelect: 'none',
			msUserSelect: 'none',
			userSelect: 'none',
			cursor: 'pointer'
		};
		
		extend(style, this.props.style);
		
		return React.createElement(this.props.component, {
			style: style,
			className: className,
			disabled: this.props.disabled,
			onTouchStart: this.onTouchStart,
			onTouchMove: this.onTouchMove,
			onTouchEnd: this.onTouchEnd,
			onMouseDown: this.onMouseDown,
			onMouseMove: this.onMouseMove,
			onMouseUp: this.onMouseUp,
			onMouseOut: this.onMouseOut
		}, this.props.children);
		
	}
	
});

},{"react":undefined}],3:[function(require,module,exports){
module.exports = function Timers() {
  var intervals = []
  var timeouts = []

  return {
    clearIntervals: function() {
      intervals.map(clearInterval)
    },

    clearTimeouts: function() {
      timeouts.map(clearTimeout)
    },

    componentWillMount: function() {
      intervals = []
      timeouts = []
    },

    componentWillUnmount: function() {
      this.clearIntervals()
      this.clearTimeouts()
    },

    setInterval: function(callback, interval) {
      var self = this

      intervals.push(setInterval(function() {
        if (!self.isMounted()) return

        callback()
      }, interval))
    },

    setIntervalWait: function(callback, interval) {
      var active = false
      var self = this

      intervals.push(setInterval(function() {
        if (active) return
        if (!self.isMounted()) return

        active = true
        callback(function() {
          active = false
        })
      }, interval))
    },

    setTimeout: function(callback, timeout) {
      var self = this

      timeouts.push(setTimeout(function() {
        if (!self.isMounted()) return

        callback()
      }, timeout))
    }
  }
}

},{}],4:[function(require,module,exports){
module.exports = {
	createApp: require('./lib/createApp'),
	Navigation: require('./lib/mixins/Navigation'),
	Link: require('./lib/components/Link'),
	UI: require('./lib/ui')
};

},{"./lib/components/Link":5,"./lib/createApp":7,"./lib/mixins/Navigation":9,"./lib/ui":35}],5:[function(require,module,exports){
'use strict';

var React = require('react/addons');
var Tappable = require('react-tappable');
var Navigation = require('../mixins/Navigation');

var transitions = require('../constants/transitions');
var validTransitions = Object.keys(transitions);

/**
 * Touchstone Link Component
 * =========================
 */

module.exports = React.createClass({
	displayName: 'Link',

	mixins: [Navigation],

	propTypes: {
		to: React.PropTypes.string.isRequired,
		params: React.PropTypes.object,
		viewTransition: React.PropTypes.oneOf(validTransitions),
		component: React.PropTypes.any,
		className: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			viewTransition: 'none',
			component: 'span'
		};
	},

	action: function action() {
		var params = this.props.params;

		if ('function' === typeof params) {
			params = params.call(this);
		}

		this.showView(this.props.to, this.props.viewTransition, params);
	},

	render: function render() {
		return React.createElement(
			Tappable,
			{ onTap: this.action, className: this.props.className, component: this.props.component },
			this.props.children
		);
	}
});

},{"../constants/transitions":6,"../mixins/Navigation":9,"react-tappable":38,"react/addons":undefined}],6:[function(require,module,exports){
'use strict';

module.exports = {
  'none': {
    'in': false,
    'out': false
  },
  'fade': {
    'in': true,
    'out': true
  },
  'fade-contract': {
    'in': true,
    'out': true
  },
  'fade-expand': {
    'in': true,
    'out': true
  },
  'show-from-left': {
    'in': true,
    'out': true
  },
  'show-from-right': {
    'in': true,
    'out': true
  },
  'show-from-top': {
    'in': true,
    'out': true
  },
  'show-from-bottom': {
    'in': true,
    'out': true
  },
  'reveal-from-left': {
    'in': true,
    'out': true
  },
  'reveal-from-right': {
    'in': true,
    'out': true
  },
  'reveal-from-top': {
    'in': false,
    'out': true
  },
  'reveal-from-bottom': {
    'in': false,
    'out': true
  }
};
},{}],7:[function(require,module,exports){
'use strict';

var xtend = require('xtend/mutable');
var React = require('react/addons');
var UI = require('./ui');
var Transition = require('./mixins/Transition');

/**
 * Touchstone App
 * ==============
 *
 * This function should be called with your app's views.
 *
 * It returns a Mixin which should be added to your App.
 */
function createApp(argViews) {
	var viewFactories = {};

	for (var viewName in argViews) {
		var view = argViews[viewName];

		viewFactories[viewName] = React.createFactory(view);
	}

	return {
		mixins: [Transition],

		componentWillMount: function componentWillMount() {
			this.views = viewFactories;
		},

		childContextTypes: {
			currentView: React.PropTypes.string,
			app: React.PropTypes.object.isRequired
		},

		getChildContext: function getChildContext() {
			return {
				currentView: this.state.currentView,
				app: this
			};
		},

		getCurrentView: function getCurrentView() {
			var viewsData = {};
			viewsData[this.state.currentView] = this.getView(this.state.currentView);

			return React.addons.createFragment(viewsData);
		},

		getInitialState: function getInitialState() {
			return {
				viewTransition: this.getCSSTransition()
			};
		},

		getView: function getView(key) {
			var view = viewFactories[key];
			if (!view) return this.getViewNotFound();

			var props = xtend({ key: key }, this.state.currentViewProps);

			if (this.getViewProps) {
				xtend(props, this.getViewProps());
			}

			return view(props);
		},

		getViewNotFound: function getViewNotFound() {
			return React.createElement(
				UI.View,
				null,
				React.createElement(
					UI.ViewContent,
					null,
					React.createElement(UI.Feedback, {
						iconName: 'ion-alert-circled',
						iconType: 'danger',
						text: 'Sorry, the view <strong>"' + this.state.currentView + '"</strong> is not available.',
						actionText: 'Okay, take me home',
						actionFn: this.gotoDefaultView
					})
				)
			);
		},

		showView: function showView(key, transition, props, state) {
			if (typeof transition === 'object') {
				props = transition;
				transition = 'none';
			}

			if (typeof transition !== 'string') {
				transition = 'none';
			}

			console.log('Showing view |' + key + '| with transition |' + transition + '| and props ' + JSON.stringify(props));

			var newState = xtend({
				currentView: key,
				currentViewProps: props,
				previousView: this.state.currentView,
				viewTransition: this.getCSSTransition(transition)
			}, state);

			this.setState(newState);
		}
	};
}

module.exports = createApp;
},{"./mixins/Transition":10,"./ui":35,"react/addons":undefined,"xtend/mutable":39}],8:[function(require,module,exports){
'use strict';

module.exports = '<?xml version="1.0" encoding="utf-8"?>' + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"' + '\t viewBox="-242 183.4 90 65.4" enable-background="new -242 183.4 90 65.4" xml:space="preserve">' + '<path class="svg-path" d="M-166,183.4H-205c-3.8,0-7.4,1.5-10.1,4.2l-25.6,25.6c-1.6,1.6-1.6,4.2,0,5.8l25.6,25.6c2.7,2.7,6.3,4.2,10.1,4.2h39.1' + '\tc7.9,0,14-6.4,14-14.3v-36.8C-152,189.8-158.1,183.4-166,183.4 M-169.8,228.4l-4.3,4.3l-12.3-12.3l-12.3,12.3l-4.3-4.3l12.3-12.3' + '\tl-12.3-12.3l4.3-4.3l12.3,12.3l12.3-12.3l4.3,4.3l-12.3,12.3L-169.8,228.4z"/>' + '</svg>';
},{}],9:[function(require,module,exports){
'use strict';

var React = require('react/addons');

/**
 * Touchstone Navigation Mixin
 * ===========================
 */

module.exports = {

	displayName: 'Navigation',

	contextTypes: {
		currentView: React.PropTypes.string,
		app: React.PropTypes.object.isRequired
	},

	showView: function showView() {
		this.context.app.showView.apply(this.context.app, arguments);
	},

	showViewFn: function showViewFn() {
		var args = arguments;
		return (function () {
			this.context.app.showView.apply(this.context.app, args);
		}).bind(this);
	}

};
},{"react/addons":undefined}],10:[function(require,module,exports){
'use strict';

var xtend = require('xtend/mutable');
var transitions = require('../constants/transitions');

module.exports = {
	getCSSTransition: function getCSSTransition(key) {
		key = key in transitions ? key : 'none';

		return xtend({
			key: key,
			name: 'view-transition-' + key,
			'in': false,
			out: false
		}, transitions[key]);
	}
};
},{"../constants/transitions":6,"xtend/mutable":39}],11:[function(require,module,exports){
'use strict';

var React = require('react/addons');
var classnames = require('classnames');
var ViewContent = require('./ViewContent');

var alertTypes = ['default', 'primary', 'success', 'warning', 'danger'];

module.exports = React.createClass({
	displayName: 'Alertbar',
	propTypes: {
		className: React.PropTypes.string,
		height: React.PropTypes.string,
		pulse: React.PropTypes.bool,
		type: React.PropTypes.oneOf(alertTypes)
	},
	getDefaultProps: function getDefaultProps() {
		return {
			height: '30px',
			type: 'default'
		};
	},
	render: function render() {
		var className = classnames(this.props.className, this.props.type, {
			'Alertbar': true,
			'pulse': this.props.pulse
		});
		var content = this.props.pulse ? React.createElement(
			'div',
			{ className: 'Alertbar-inner' },
			this.props.children
		) : this.props.children;

		return React.createElement(
			ViewContent,
			{ height: this.props.height, className: className },
			content
		);
	}
});
},{"./ViewContent":34,"classnames":37,"react/addons":undefined}],12:[function(require,module,exports){
'use strict';

var React = require('react/addons');
var Tappable = require('react-tappable');

var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'exports',

	propTypes: {
		className: React.PropTypes.string,
		iconName: React.PropTypes.string,
		iconType: React.PropTypes.string,
		header: React.PropTypes.string,
		subheader: React.PropTypes.string,
		text: React.PropTypes.string,
		actionText: React.PropTypes.string,
		actionFn: React.PropTypes.func
	},

	render: function render() {
		var viewClassName = classnames('view-feedback', this.props.className);
		var iconClassName = classnames('view-feedback-icon', this.props.iconName, this.props.iconType);

		var icon = this.props.iconName ? React.createElement('div', { className: iconClassName }) : null;
		var header = this.props.header ? React.createElement(
			'div',
			{ className: 'view-feedback-header' },
			this.props.header
		) : null;
		var subheader = this.props.subheader ? React.createElement(
			'div',
			{ className: 'view-feedback-subheader' },
			this.props.subheader
		) : null;
		var text = this.props.text ? React.createElement('div', { className: 'view-feedback-text', dangerouslySetInnerHTML: { __html: this.props.text } }) : null;
		var action = this.props.actionText ? React.createElement(
			Tappable,
			{ onTap: this.props.actionFn, className: 'view-feedback-action' },
			this.props.actionText
		) : null;

		return React.createElement(
			'div',
			{ className: viewClassName },
			icon,
			header,
			subheader,
			text,
			action
		);
	}
});
},{"classnames":37,"react-tappable":38,"react/addons":undefined}],13:[function(require,module,exports){
'use strict';

var React = require('react/addons'),
    classnames = require('classnames'),
    ViewContent = require('./ViewContent');

module.exports = React.createClass({
	displayName: 'Footerbar',
	propTypes: {
		className: React.PropTypes.string,
		height: React.PropTypes.string,
		type: React.PropTypes.string
	},
	getDefaultProps: function getDefaultProps() {
		return {
			height: '44px'
		};
	},
	render: function render() {
		var className = classnames(this.props.className, this.props.type, {
			'Footerbar': true
		});

		return React.createElement(
			ViewContent,
			{ height: this.props.height, className: className },
			this.props.children
		);
	}
});
},{"./ViewContent":34,"classnames":37,"react/addons":undefined}],14:[function(require,module,exports){
'use strict';

var React = require('react/addons'),
    classnames = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('../mixins/Navigation');

module.exports = React.createClass({
	mixins: [Navigation],
	displayName: 'ActionButton',
	propTypes: {
		className: React.PropTypes.string,
		component: React.PropTypes.string,
		showView: React.PropTypes.string,
		viewTransition: React.PropTypes.string,
		viewProps: React.PropTypes.object,
		disabled: React.PropTypes.bool,
		onTap: React.PropTypes.func,
		active: React.PropTypes.bool,
		label: React.PropTypes.string,
		icon: React.PropTypes.string
	},
	getDefaultProps: function getDefaultProps() {
		return {
			component: 'div',
			disabled: false,
			active: false
		};
	},
	render: function render() {
		var className = classnames(this.props.className, this.props.icon, {
			'Footerbar-button': true,
			'active': this.props.active,
			'disabled': this.props.disabled
		});

		var label = this.props.label ? React.createElement(
			'div',
			{ className: 'Footerbar-button-label' },
			this.props.label
		) : null;
		var action = this.props.showView ? this.showViewFn(this.props.showView, this.props.viewTransition, this.props.viewProps) : this.props.onTap;

		return React.createElement(
			Tappable,
			{ className: className, component: this.props.component, onTap: action },
			label,
			this.props.children
		);
	}
});
},{"../mixins/Navigation":9,"classnames":37,"react-tappable":38,"react/addons":undefined}],15:[function(require,module,exports){
'use strict';

var classnames = require('classnames');

var React = require('react/addons');

module.exports = React.createClass({
	displayName: 'Headerbar',

	propTypes: {
		className: React.PropTypes.string,
		height: React.PropTypes.string,
		label: React.PropTypes.string,
		fixed: React.PropTypes.bool,
		type: React.PropTypes.string
	},

	render: function render() {
		var className = classnames('Headerbar', this.props.className, this.props.type, { 'fixed': this.props.fixed });

		var label;
		if (this.props.label !== undefined) {
			label = React.createElement(
				'div',
				{ className: 'Headerbar-label' },
				this.props.label
			);
		}

		return React.createElement(
			'div',
			{ height: this.props.height, className: className },
			this.props.children,
			label
		);
	}
});
},{"classnames":37,"react/addons":undefined}],16:[function(require,module,exports){
'use strict';

var React = require('react/addons');
var Tappable = require('react-tappable');

var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'HeaderbarButton',
	propTypes: {
		className: React.PropTypes.string,
		disabled: React.PropTypes.bool,
		icon: React.PropTypes.string,
		label: React.PropTypes.string,
		onTap: React.PropTypes.func,
		position: React.PropTypes.string,
		primary: React.PropTypes.bool,
		visible: React.PropTypes.bool
	},

	getDefaultProps: function getDefaultProps() {
		return {
			visible: true,
			disabled: false
		};
	},

	render: function render() {
		var className = classnames('Headerbar-button', this.props.className, this.props.position, this.props.icon, {
			'hidden': !this.props.visible,
			'disabled': this.props.disabled,
			'is-primary': this.props.primary
		});

		return React.createElement(
			Tappable,
			{ onTap: this.props.onTap, className: className },
			this.props.label,
			this.props.children
		);
	}
});
},{"classnames":37,"react-tappable":38,"react/addons":undefined}],17:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var blacklist = require('blacklist');
var classnames = require('classnames');

var React = require('react/addons');

module.exports = React.createClass({
	displayName: 'Input',
	propTypes: {
		first: React.PropTypes.bool
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'text'
		};
	},

	render: function render() {
		var className = classnames('field-item list-item', {
			'is-first': this.props.first,
			'u-selectable': this.props.disabled
		}, this.props.className);

		var inputProps = blacklist(this.props, 'children', 'className', 'first');

		return React.createElement(
			'div',
			{ className: className },
			React.createElement(
				'div',
				{ className: 'item-inner' },
				React.createElement(
					'label',
					{ className: 'item-content' },
					React.createElement('input', _extends({ className: 'field' }, inputProps))
				),
				this.props.children
			)
		);
	}
});
},{"blacklist":36,"classnames":37,"react/addons":undefined}],18:[function(require,module,exports){
'use strict';

var React = require('react/addons'),
    classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'ItemMedia',
	propTypes: {
		className: React.PropTypes.string,
		icon: React.PropTypes.string,
		avatar: React.PropTypes.string,
		thumbnail: React.PropTypes.string
	},

	render: function render() {
		var className = classnames({
			'item-media': true,
			'is-icon': this.props.icon,
			'is-avatar': this.props.avatar || this.props.avatarInitials,
			'is-thumbnail': this.props.thumbnail
		}, this.props.className);

		// media types
		var icon = this.props.icon ? React.createElement('div', { className: 'item-icon ' + this.props.icon }) : null;
		var avatar = this.props.avatar || this.props.avatarInitials ? React.createElement(
			'div',
			{ className: 'item-avatar' },
			this.props.avatar ? React.createElement('img', { src: this.props.avatar }) : this.props.avatarInitials
		) : null;
		var thumbnail = this.props.thumbnail ? React.createElement(
			'div',
			{ className: 'item-thumbnail' },
			React.createElement('img', { src: this.props.thumbnail })
		) : null;

		return React.createElement(
			'div',
			{ className: className },
			icon,
			avatar,
			thumbnail
		);
	}
});
},{"classnames":37,"react/addons":undefined}],19:[function(require,module,exports){
'use strict';

var React = require('react/addons'),
    classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'ItemNote',
	propTypes: {
		className: React.PropTypes.string,
		type: React.PropTypes.string,
		label: React.PropTypes.string,
		icon: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'default'
		};
	},

	render: function render() {
		var className = classnames({
			'item-note': true
		}, this.props.type, this.props.className);

		// elements
		var label = this.props.label ? React.createElement(
			'div',
			{ className: 'item-note-label' },
			this.props.label
		) : null;
		var icon = this.props.icon ? React.createElement('div', { className: 'item-note-icon ' + this.props.icon }) : null;

		return React.createElement(
			'div',
			{ className: className },
			label,
			icon
		);
	}
});
},{"classnames":37,"react/addons":undefined}],20:[function(require,module,exports){
'use strict';

var classnames = require('classnames');
var icons = {
	del: require('../icons/delete')
};

var ViewContent = require('./ViewContent');
var KeypadButton = require('./KeypadButton');
var React = require('react/addons');

module.exports = React.createClass({
	displayName: 'Keypad',
	propTypes: {
		action: React.PropTypes.func,
		className: React.PropTypes.string,
		stowed: React.PropTypes.bool,
		enableDel: React.PropTypes.bool,
		type: React.PropTypes.oneOf(['black-translucent', 'white-translucent']),
		wildkey: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'default'
		};
	},

	render: function render() {
		var action = this.props.action;
		var typeName = 'Keypad--' + this.props.type;
		var keypadClassName = classnames(this.props.className, typeName, 'Keypad', {
			'is-stowed': this.props.stowed
		});

		var wildkey;

		if (this.props.wildkey === 'decimal') {
			wildkey = React.createElement(KeypadButton, { value: 'decimal', primaryLabel: '·', aux: true });
		} else {
			wildkey = React.createElement(KeypadButton, { aux: true, disabled: true });
		}

		return React.createElement(
			ViewContent,
			{ className: keypadClassName },
			React.createElement(KeypadButton, { action: function () {
					return action('1');
				}, primaryLabel: '1' }),
			React.createElement(KeypadButton, { action: function () {
					return action('2');
				}, primaryLabel: '2', secondaryLabel: 'ABC' }),
			React.createElement(KeypadButton, { action: function () {
					return action('3');
				}, primaryLabel: '3', secondaryLabel: 'DEF' }),
			React.createElement(KeypadButton, { action: function () {
					return action('4');
				}, primaryLabel: '4', secondaryLabel: 'GHI' }),
			React.createElement(KeypadButton, { action: function () {
					return action('5');
				}, primaryLabel: '5', secondaryLabel: 'JKL' }),
			React.createElement(KeypadButton, { action: function () {
					return action('6');
				}, primaryLabel: '6', secondaryLabel: 'MNO' }),
			React.createElement(KeypadButton, { action: function () {
					return action('7');
				}, primaryLabel: '7', secondaryLabel: 'PQRS' }),
			React.createElement(KeypadButton, { action: function () {
					return action('8');
				}, primaryLabel: '8', secondaryLabel: 'TUV' }),
			React.createElement(KeypadButton, { action: function () {
					return action('9');
				}, primaryLabel: '9', secondaryLabel: 'WXYZ' }),
			wildkey,
			React.createElement(KeypadButton, { action: function () {
					return action('0');
				}, primaryLabel: '0' }),
			React.createElement(KeypadButton, { action: function () {
					return action('delete');
				}, icon: icons.del, disabled: !this.props.enableDel, aux: true })
		);
	}
});
},{"../icons/delete":8,"./KeypadButton":21,"./ViewContent":34,"classnames":37,"react/addons":undefined}],21:[function(require,module,exports){
'use strict';

var classnames = require('classnames');

var React = require('react/addons');
var Tappable = require('react-tappable');

module.exports = React.createClass({
	displayName: 'KeypadButton',
	propTypes: {
		action: React.PropTypes.func,
		aux: React.PropTypes.bool,
		className: React.PropTypes.string,
		disabled: React.PropTypes.bool,
		icon: React.PropTypes.string,
		primaryLabel: React.PropTypes.string,
		secondaryLabel: React.PropTypes.string,
		value: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			action: function action() {}
		};
	},

	render: function render() {
		var className = classnames('Keypad-button', {
			'is-auxiliary': this.props.aux,
			'disabled': this.props.disabled
		}, this.props.className);

		var primaryLabel = this.props.primaryLabel ? React.createElement(
			'div',
			{ className: 'Keypad-button-primary-label' },
			this.props.primaryLabel
		) : null;
		var secondaryLabel = this.props.secondaryLabel ? React.createElement(
			'div',
			{ className: 'Keypad-button-secondary-label' },
			this.props.secondaryLabel
		) : null;
		var icon = this.props.icon ? React.createElement('span', { className: 'Keypad-button-icon', dangerouslySetInnerHTML: { __html: this.props.icon } }) : null;

		return React.createElement(
			'div',
			{ className: 'Keypad-cell' },
			React.createElement(
				Tappable,
				{ onTap: this.props.action, className: className, component: 'div' },
				icon,
				primaryLabel,
				secondaryLabel
			)
		);
	}
});
},{"classnames":37,"react-tappable":38,"react/addons":undefined}],22:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = require('react/addons');
var blacklist = require('blacklist');
var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'LabelInput',

	propTypes: {
		alignTop: React.PropTypes.bool,
		className: React.PropTypes.string,
		disabled: React.PropTypes.bool,
		first: React.PropTypes.bool,
		label: React.PropTypes.string,
		readOnly: React.PropTypes.bool,
		value: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'text',
			readOnly: false
		};
	},

	render: function render() {
		var className = classnames(this.props.className, 'list-item', 'field-item', {
			'align-top': this.props.alignTop,
			'is-first': this.props.first,
			'u-selectable': this.props.disabled
		});

		var props = blacklist(this.props, 'alignTop', 'children', 'first', 'readOnly');
		var renderInput = this.props.readOnly ? React.createElement(
			'div',
			{ className: 'field u-selectable' },
			this.props.value
		) : React.createElement('input', _extends({ className: 'field' }, props));

		return React.createElement(
			'label',
			{ className: className },
			React.createElement(
				'div',
				{ className: 'item-inner' },
				React.createElement(
					'div',
					{ className: 'field-label' },
					this.props.label
				),
				React.createElement(
					'div',
					{ className: 'field-control' },
					renderInput,
					this.props.children
				)
			)
		);
	}
});
},{"blacklist":36,"classnames":37,"react/addons":undefined}],23:[function(require,module,exports){
'use strict';

var React = require('react/addons'),
    classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'LabelSelect',
	propTypes: {
		className: React.PropTypes.string,
		label: React.PropTypes.string,
		first: React.PropTypes.bool
	},
	getDefaultProps: function getDefaultProps() {
		return {
			className: ''
		};
	},
	getInitialState: function getInitialState() {
		return {
			value: this.props.value
		};
	},
	updateInputValue: function updateInputValue(event) {
		this.setState({
			value: event.target.value
		});
	},
	render: function render() {
		// Set Classes
		var className = classnames(this.props.className, {
			'list-item': true,
			'is-first': this.props.first
		});

		// Map Options
		var options = this.props.options.map((function (op) {
			return React.createElement(
				'option',
				{ key: 'option-' + op.value, value: op.value },
				op.label
			);
		}).bind(this));

		return React.createElement(
			'label',
			{ className: className },
			React.createElement(
				'div',
				{ className: 'item-inner' },
				React.createElement(
					'div',
					{ className: 'field-label' },
					this.props.label
				),
				React.createElement(
					'div',
					{ className: 'field-control' },
					React.createElement(
						'select',
						{ value: this.state.value, onChange: this.updateInputValue, className: 'select-field' },
						options
					),
					React.createElement(
						'div',
						{ className: 'select-field-indicator' },
						React.createElement('div', { className: 'select-field-indicator-arrow' })
					)
				)
			)
		);
	}
});
},{"classnames":37,"react/addons":undefined}],24:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = require('react/addons');

var blacklist = require('blacklist');
var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'LabelTextarea',

	getDefaultProps: function getDefaultProps() {
		return {
			rows: 3
		};
	},

	render: function render() {
		var className = classnames(this.props.className, 'list-item', 'field-item', 'align-top', {
			'is-first': this.props.first,
			'u-selectable': this.props.disabled
		});

		var props = blacklist(this.props, 'children', 'className', 'disabled', 'first', 'label', 'readonly');

		var renderInput = this.props.readonly ? React.createElement(
			'div',
			{ className: 'field u-selectable' },
			this.props.value
		) : React.createElement('textarea', _extends({}, props, { className: 'field' }));

		return React.createElement(
			'div',
			{ className: className },
			React.createElement(
				'label',
				{ className: 'item-inner' },
				React.createElement(
					'div',
					{ className: 'field-label' },
					this.props.label
				),
				React.createElement(
					'div',
					{ className: 'field-control' },
					renderInput,
					this.props.children
				)
			)
		);
	}
});
},{"blacklist":36,"classnames":37,"react/addons":undefined}],25:[function(require,module,exports){
'use strict';

var React = require('react/addons'),
    classnames = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('../mixins/Navigation');

module.exports = React.createClass({
	displayName: 'LoadingButton',
	mixins: [Navigation],
	propTypes: {
		className: React.PropTypes.string,
		showView: React.PropTypes.string,
		viewTransition: React.PropTypes.string,
		viewProps: React.PropTypes.object,
		component: React.PropTypes.string,
		onTap: React.PropTypes.func,
		type: React.PropTypes.string,
		disabled: React.PropTypes.bool,
		loading: React.PropTypes.bool,
		label: React.PropTypes.string
	},
	getDefaultProps: function getDefaultProps() {
		return {
			disabled: false,
			loading: false
		};
	},
	render: function render() {
		// Class Name
		var className = classnames(this.props.className, this.props.type, {
			'loading-button': true,
			'disabled': this.props.disabled,
			'is-loading': this.props.loading
		});

		// Set Variables
		var label = this.props.label && !this.props.loading ? React.createElement(
			'div',
			{ className: 'loading-button-text' },
			this.props.label
		) : null;
		var onTap = this.props.showView ? this.showViewFn(this.props.showView, this.props.viewTransition, this.props.viewProps) : this.props.onTap;
		var loadingElements = this.props.loading ? React.createElement(
			'span',
			{ className: 'loading-button-icon-wrapper' },
			React.createElement('span', { className: 'loading-button-icon' })
		) : null;

		// Output Component
		return React.createElement(
			Tappable,
			{ className: className, component: this.props.component, onTap: onTap },
			loadingElements,
			label,
			this.props.children
		);
	}
});
},{"../mixins/Navigation":9,"classnames":37,"react-tappable":38,"react/addons":undefined}],26:[function(require,module,exports){
'use strict';

var Keypad = require('./Keypad');
var React = require('react/addons');
var ViewContent = require('./ViewContent');

var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'Passcode',
	propTypes: {
		action: React.PropTypes.func,
		className: React.PropTypes.string,
		keyboardIsStowed: React.PropTypes.bool,
		type: React.PropTypes.string,
		helpText: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			className: '',
			helpText: 'Enter your passcode',
			type: 'default'
		};
	},

	getInitialState: function getInitialState() {
		return {
			helpText: this.props.helpText,
			keyboardIsStowed: true,
			passcode: ''
		};
	},

	componentDidMount: function componentDidMount() {
		var self = this;

		// slide the keyboard up after the view is shown
		setTimeout(function () {
			if (!this.isMounted()) return;

			self.setState({ keyboardIsStowed: false });
		}, 400);
	},

	handlePasscode: function handlePasscode(keyCode) {
		var passcode = this.state.passcode;

		if (keyCode === 'delete') {
			passcode = passcode.slice(0, -1);
		} else {
			passcode = passcode.concat(keyCode);
		}

		if (passcode.length !== 4) {
			return this.setState({
				passcode: passcode
			});
		}

		var self = this;
		setTimeout(function () {
			self.props.action(passcode);
		}, 200); // the transition that stows the keyboard takes 150ms, it freezes if interrupted by the ReactCSSTransitionGroup

		this.setState({ passcode: passcode });
	},

	render: function render() {
		var passcode = this.state.passcode;
		var passcodeClassname = classnames('Passcode', this.props.type);
		var passcodeFields = [0, 1, 2, 3].map(function (i) {
			var passcodeFieldClassname = classnames('Passcode-input', {
				'has-value': passcode.length > i
			});

			return React.createElement(
				'div',
				{ className: 'Passcode-field' },
				React.createElement('div', { className: passcodeFieldClassname })
			);
		});

		return React.createElement(
			ViewContent,
			{ grow: true },
			React.createElement(
				'div',
				{ className: passcodeClassname },
				React.createElement(
					'div',
					{ className: 'Passcode-label' },
					this.props.helpText
				),
				React.createElement(
					'div',
					{ className: 'Passcode-fields' },
					passcodeFields
				)
			),
			React.createElement(Keypad, { type: this.props.type, action: this.handlePasscode, enableDel: Boolean(this.state.passcode.length), stowed: this.state.keyboardIsStowed })
		);
	}
});
},{"./Keypad":20,"./ViewContent":34,"classnames":37,"react/addons":undefined}],27:[function(require,module,exports){
'use strict';

var React = require('react/addons');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var Transition = require('../mixins/Transition');

var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'Popup',
	mixins: [Transition],

	propTypes: {
		className: React.PropTypes.string,
		visible: React.PropTypes.bool
	},

	getDefaultProps: function getDefaultProps() {
		return {
			transition: 'none'
		};
	},

	renderBackdrop: function renderBackdrop() {
		if (!this.props.visible) return null;
		return React.createElement('div', { className: 'Modal-backdrop' });
	},

	renderDialog: function renderDialog() {
		if (!this.props.visible) return null;

		// Set classnames
		var dialogClassName = classnames('Modal-dialog', this.props.className);

		return React.createElement(
			'div',
			{ className: dialogClassName },
			this.props.children
		);
	},

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'Modal' },
			React.createElement(
				ReactCSSTransitionGroup,
				{ transitionName: 'Modal-dialog', component: 'div' },
				this.renderDialog()
			),
			React.createElement(
				ReactCSSTransitionGroup,
				{ transitionName: 'Modal-background', component: 'div' },
				this.renderBackdrop()
			)
		);
	}
});
},{"../mixins/Transition":10,"classnames":37,"react/addons":undefined}],28:[function(require,module,exports){
'use strict';

var React = require('react/addons');
var classNames = require('classnames');

module.exports = React.createClass({
	displayName: 'PopupIcon',
	propTypes: {
		name: React.PropTypes.string.isRequired,
		type: React.PropTypes.oneOf(['default', 'muted', 'primary', 'success', 'warning', 'danger']),
		spinning: React.PropTypes.bool
	},

	render: function render() {
		var className = classNames('Modal-icon', {
			'is-spinning': this.props.spinning
		}, this.props.name, this.props.type);

		return React.createElement('div', { className: className });
	}
});
},{"classnames":37,"react/addons":undefined}],29:[function(require,module,exports){
'use strict';

var React = require('react');
var Tappable = require('react-tappable');

var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'RadioList',

	propTypes: {
		options: React.PropTypes.array,
		value: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]),
		icon: React.PropTypes.string,
		onChange: React.PropTypes.func
	},

	onChange: function onChange(value) {
		this.props.onChange(value);
	},

	render: function render() {
		var self = this;
		var options = this.props.options.map(function (op, i) {
			var iconClassname = classnames('item-icon primary', op.icon);
			var tappableClassname = classnames('list-item', { 'is-first': i === 0 });
			var checkMark = op.value === self.props.value ? React.createElement(
				'div',
				{ className: 'item-note primary' },
				React.createElement('div', { className: 'item-note-icon ion-checkmark' })
			) : null;
			var icon = op.icon ? React.createElement(
				'div',
				{ className: 'item-media' },
				React.createElement('span', { className: iconClassname })
			) : null;

			function onChange() {
				self.onChange(op.value);
			}

			return React.createElement(
				Tappable,
				{ key: 'option-' + i, onTap: onChange, className: tappableClassname },
				icon,
				React.createElement(
					'div',
					{ className: 'item-inner' },
					React.createElement(
						'div',
						{ className: 'item-title' },
						op.label
					),
					checkMark
				)
			);
		});

		return React.createElement(
			'div',
			null,
			options
		);
	}
});
},{"classnames":37,"react":undefined,"react-tappable":38}],30:[function(require,module,exports){
'use strict';

var React = require('react');
var Tappable = require('react-tappable');

var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'Switch',

	propTypes: {
		className: React.PropTypes.string,
		on: React.PropTypes.bool,
		onTap: React.PropTypes.func,
		type: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'default'
		};
	},

	render: function render() {
		var className = classnames('switch', 'switch-' + this.props.type, { 'on': this.props.on });

		return React.createElement(
			Tappable,
			{ onTap: this.props.onTap, className: className, component: 'label' },
			React.createElement(
				'div',
				{ className: 'track' },
				React.createElement('div', { className: 'handle' })
			)
		);
	}
});
},{"classnames":37,"react":undefined,"react-tappable":38}],31:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var blacklist = require('blacklist');
var classnames = require('classnames');

var React = require('react/addons');

module.exports = React.createClass({
	displayName: 'Textarea',
	propTypes: {
		className: React.PropTypes.string,
		first: React.PropTypes.bool,
		rows: React.PropTypes.number
	},

	getDefaultProps: function getDefaultProps() {
		return {
			rows: 3
		};
	},

	render: function render() {
		var className = classnames('field-item list-item', {
			'is-first': this.props.first,
			'u-selectable': this.props.disabled
		}, this.props.className);

		var inputProps = blacklist(this.props, 'children', 'className', 'first');

		return React.createElement(
			'div',
			{ className: className },
			React.createElement(
				'div',
				{ className: 'item-inner' },
				React.createElement(
					'label',
					{ className: 'item-content' },
					React.createElement('textarea', _extends({ className: 'field' }, inputProps))
				),
				this.props.children
			)
		);
	}
});
},{"blacklist":36,"classnames":37,"react/addons":undefined}],32:[function(require,module,exports){
'use strict';

var React = require('react');
var classnames = require('classnames');
var Tappable = require('react-tappable');

module.exports = React.createClass({
	displayName: 'Toggle',

	propTypes: {
		className: React.PropTypes.string,
		onChange: React.PropTypes.func.isRequired,
		options: React.PropTypes.array.isRequired,
		type: React.PropTypes.string,
		value: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'primary'
		};
	},

	onChange: function onChange(value) {
		this.props.onChange(value);
	},

	render: function render() {
		var componentClassName = classnames('Toggle', this.props.className, this.props.type);
		var self = this;

		var options = this.props.options.map(function (op) {
			function onChange() {
				self.onChange(op.value);
			}

			var itemClassName = classnames('Toggle-item', {
				'active': op.value === self.props.value
			});

			return React.createElement(
				Tappable,
				{ key: 'option-' + op.value, onTap: onChange, className: itemClassName },
				op.label
			);
		});

		return React.createElement(
			'div',
			{ className: componentClassName },
			options
		);
	}
});
},{"classnames":37,"react":undefined,"react-tappable":38}],33:[function(require,module,exports){
'use strict';

var React = require('react/addons');

var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'View',

	propTypes: {
		className: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			className: ''
		};
	},

	render: function render() {
		var className = classnames('View', this.props.className);

		// react does not currently support duplicate properties (which we need for vendor-prefixed values)
		// see https://github.com/facebook/react/issues/2020
		// moved the display properties to css/touchstone/view.less using the class ".View"
		// when supported, apply the following:
		// display: '-webkit-box',
		// display: '-webkit-flex',
		// display: '-moz-box',
		// display: '-moz-flex',
		// display: '-ms-flexbox',
		// display: 'flex',

		var inlineStyle = {
			WebkitFlexDirection: 'column',
			MozFlexDirection: 'column',
			msFlexDirection: 'column',
			FlexDirection: 'column',
			WebkitAlignItems: 'stretch',
			MozAlignItems: 'stretch',
			AlignItems: 'stretch',
			WebkitJustifyContent: 'space-between',
			MozJustifyContent: 'space-between',
			JustifyContent: 'space-between'
		};

		return React.createElement(
			'div',
			{ className: className, style: inlineStyle },
			this.props.children
		);
	}
});
},{"classnames":37,"react/addons":undefined}],34:[function(require,module,exports){
'use strict';

var React = require('react/addons');
var classnames = require('classnames');

module.exports = React.createClass({
	displayName: 'ViewContent',
	propTypes: {
		id: React.PropTypes.string,
		className: React.PropTypes.string,
		height: React.PropTypes.string,
		scrollable: React.PropTypes.bool,
		grow: React.PropTypes.bool
	},

	getDefaultProps: function getDefaultProps() {
		return {
			className: '',
			height: ''
		};
	},

	render: function render() {
		var className = classnames({
			'ViewContent': true,
			'springy-scrolling': this.props.scrollable
		}, this.props.className);

		var inlineStyle = {};

		// set height on blocks if provided
		if (this.props.height) {
			inlineStyle.height = this.props.height;
		}

		// stretch to take up space
		if (this.props.grow) {
			inlineStyle.WebkitBoxFlex = '1';
			inlineStyle.WebkitFlex = '1';
			inlineStyle.MozBoxFlex = '1';
			inlineStyle.MozFlex = '1';
			inlineStyle.MsFlex = '1';
			inlineStyle.flex = '1';
		}

		// allow blocks to be scrollable
		if (this.props.scrollable) {
			inlineStyle.overflowY = 'auto';
			inlineStyle.WebkitOverflowScrolling = 'touch';
		}

		return React.createElement(
			'div',
			{ className: className, id: this.props.id, style: inlineStyle },
			this.props.children
		);
	}
});
},{"classnames":37,"react/addons":undefined}],35:[function(require,module,exports){
'use strict';

module.exports = {
	Alertbar: require('./Alertbar'),
	Feedback: require('./Feedback'),
	Footerbar: require('./Footerbar'),
	FooterbarButton: require('./FooterbarButton'),
	Headerbar: require('./Headerbar'),
	HeaderbarButton: require('./HeaderbarButton'),
	Input: require('./Input'),
	ItemMedia: require('./ItemMedia'),
	ItemNote: require('./ItemNote'),
	Keypad: require('./Keypad'),
	LabelInput: require('./LabelInput'),
	LabelSelect: require('./LabelSelect'),
	LabelTextarea: require('./LabelTextarea'),
	LoadingButton: require('./LoadingButton'),
	Popup: require('./Popup'),
	PopupIcon: require('./PopupIcon'),
	Passcode: require('./Passcode'),
	RadioList: require('./RadioList'),
	Switch: require('./Switch'),
	Textarea: require('./Textarea'),
	Toggle: require('./Toggle'),
	View: require('./View'),
	ViewContent: require('./ViewContent')
};
},{"./Alertbar":11,"./Feedback":12,"./Footerbar":13,"./FooterbarButton":14,"./Headerbar":15,"./HeaderbarButton":16,"./Input":17,"./ItemMedia":18,"./ItemNote":19,"./Keypad":20,"./LabelInput":22,"./LabelSelect":23,"./LabelTextarea":24,"./LoadingButton":25,"./Passcode":26,"./Popup":27,"./PopupIcon":28,"./RadioList":29,"./Switch":30,"./Textarea":31,"./Toggle":32,"./View":33,"./ViewContent":34}],36:[function(require,module,exports){
module.exports = function blacklist (src) {
  var copy = {}, filter = arguments[1]

  if (typeof filter === 'string') {
    filter = {}
    for (var i = 1; i < arguments.length; i++) {
      filter[arguments[i]] = true
    }
  }

  for (var key in src) {
    // blacklist?
    if (filter[key]) continue

    copy[key] = src[key]
  }

  return copy
}

},{}],37:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],38:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = require('react');

// Enable React Touch Events
React.initializeTouchEvents(true);

function getTouchProps(touch) {
	if (!touch) return {};
	return {
		pageX: touch.pageX,
		pageY: touch.pageY,
		clientX: touch.clientX,
		clientY: touch.clientY
	};
}

function isDataOrAriaProp(key) {
	return key.indexOf('data-') === 0 || key.indexOf('aria-') === 0;
}

function getPinchProps(touches) {
	return {
		touches: Array.prototype.map.call(touches, function copyTouch(touch) {
			return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
		}),
		center: { x: (touches[0].pageX + touches[1].pageX) / 2, y: (touches[0].pageY + touches[1].pageY) / 2 },
		angle: Math.atan() * (touches[1].pageY - touches[0].pageY) / (touches[1].pageX - touches[0].pageX) * 180 / Math.PI,
		distance: Math.sqrt(Math.pow(Math.abs(touches[1].pageX - touches[0].pageX), 2) + Math.pow(Math.abs(touches[1].pageY - touches[0].pageY), 2))
	};
}

/**
 * Tappable Mixin
 * ==============
 */

var Mixin = {
	propTypes: {
		moveThreshold: React.PropTypes.number, // pixels to move before cancelling tap
		pressDelay: React.PropTypes.number, // ms to wait before detecting a press
		pressMoveThreshold: React.PropTypes.number, // pixels to move before cancelling press
		preventDefault: React.PropTypes.bool, // whether to preventDefault on all events
		stopPropagation: React.PropTypes.bool, // whether to stopPropagation on all events

		onTap: React.PropTypes.func, // fires when a tap is detected
		onPress: React.PropTypes.func, // fires when a press is detected
		onTouchStart: React.PropTypes.func, // pass-through touch event
		onTouchMove: React.PropTypes.func, // pass-through touch event
		onTouchEnd: React.PropTypes.func, // pass-through touch event
		onMouseDown: React.PropTypes.func, // pass-through mouse event
		onMouseUp: React.PropTypes.func, // pass-through mouse event
		onMouseMove: React.PropTypes.func, // pass-through mouse event
		onMouseOut: React.PropTypes.func, // pass-through mouse event

		onPinchStart: React.PropTypes.func, // fires when a pinch gesture is started
		onPinchMove: React.PropTypes.func, // fires on every touch-move when a pinch action is active
		onPinchEnd: React.PropTypes.func // fires when a pinch action ends
	},

	getDefaultProps: function getDefaultProps() {
		return {
			moveThreshold: 100,
			pressDelay: 1000,
			pressMoveThreshold: 5
		};
	},

	getInitialState: function getInitialState() {
		return {
			isActive: false,
			touchActive: false,
			pinchActive: false
		};
	},

	componentWillUnmount: function componentWillUnmount() {
		this.cleanupScrollDetection();
		this.cancelPressDetection();
	},

	processEvent: function processEvent(event) {
		if (this.props.preventDefault) event.preventDefault();
		if (this.props.stopPropagation) event.stopPropagation();
	},

	onTouchStart: function onTouchStart(event) {
		if (this.props.onTouchStart && this.props.onTouchStart(event) === false) return;
		this.processEvent(event);
		window._blockMouseEvents = true;

		if (event.touches.length === 1) {
			this._initialTouch = this._lastTouch = getTouchProps(event.touches[0]);
			this.initScrollDetection();
			this.initPressDetection(event, this.endTouch);
			this.setState({
				isActive: true
			});
		} else if ((this.props.onPinchStart || this.props.onPinchMove || this.props.onPinchEnd) && event.touches.length === 2) {
			this.onPinchStart(event);
		}
	},

	onPinchStart: function onPinchStart(event) {
		// in case the two touches didn't start exactly at the same time
		if (this._initialTouch) this.endTouch();

		var touches = event.touches;

		this._initialPinch = getPinchProps(touches);

		this._initialPinch = _extends(this._initialPinch, {
			displacement: { x: 0, y: 0 },
			displacementVelocity: { x: 0, y: 0 },
			rotation: 0,
			rotationVelocity: 0,
			zoom: 1,
			zoomVelocity: 0,
			time: Date.now()
		});

		this._lastPinch = this._initialPinch;

		this.props.onPinchStart && this.props.onPinchStart(this._initialPinch, event);
	},

	onPinchMove: function onPinchMove(event) {
		if (this._initialTouch) this.endTouch();

		var touches = event.touches;

		if (touches.length !== 2) {
			return this.onPinchEnd(event) // bail out before disaster
			;
		}

		var currentPinch = touches[0].identifier === this._initialPinch.touches[0].identifier && touches[1].identifier === this._initialPinch.touches[1].identifier ? getPinchProps(touches) // the touches are in the correct order
		: touches[1].identifier === this._initialPinch.touches[0].identifier && touches[0].identifier === this._initialPinch.touches[1].identifier ? getPinchProps(touches.reverse()) // the touches have somehow changed order
		: getPinchProps(touches); // something is wrong, but we still have two touch-points, so we try not to fail

		currentPinch.displacement = {
			x: currentPinch.center.x - this._initialPinch.center.x,
			y: currentPinch.center.y - this._initialPinch.center.y
		};

		currentPinch.time = Date.now();
		var timeSinceLastPinch = currentPinch.time - this._lastPinch.time;

		currentPinch.displacementVelocity = {
			x: (currentPinch.displacement.x - this._lastPinch.displacement.x) / timeSinceLastPinch,
			y: (currentPinch.displacement.y - this._lastPinch.displacement.y) / timeSinceLastPinch
		};

		currentPinch.rotation = currentPinch.angle - this._initialPinch.angle;
		currentPinch.rotationVelocity = currentPinch.rotation - this._lastPinch.rotation / timeSinceLastPinch;

		currentPinch.zoom = currentPinch.distance / this._initialPinch.distance;
		currentPinch.zoomVelocity = (currentPinch.zoom - this._lastPinch.zoom) / timeSinceLastPinch;

		this.props.onPinchMove && this.props.onPinchMove(currentPinch, event);

		this._lastPinch = currentPinch;
	},

	onPinchEnd: function onPinchEnd(event) {
		// TODO use helper to order touches by identifier and use actual values on touchEnd.
		var currentPinch = _extends({}, this._lastPinch);
		currentPinch.time = Date.now();

		if (currentPinch.time - this._lastPinch.time > 16) {
			currentPinch.displacementVelocity = 0;
			currentPinch.rotationVelocity = 0;
			currentPinch.zoomVelocity = 0;
		}

		this.props.onPinchEnd && this.props.onPinchEnd(currentPinch, event);

		this._initialPinch = this._lastPinch = null;

		// If one finger is still on screen, it should start a new touch event for swiping etc
		// But it should never fire an onTap or onPress event.
		// Since there is no support swipes yet, this should be disregarded for now
		// if (event.touches.length === 1) {
		// 	this.onTouchStart(event);
		// }
	},

	initScrollDetection: function initScrollDetection() {
		this._scrollPos = { top: 0, left: 0 };
		this._scrollParents = [];
		this._scrollParentPos = [];
		var node = this.getDOMNode();
		while (node) {
			if (node.scrollHeight > node.offsetHeight || node.scrollWidth > node.offsetWidth) {
				this._scrollParents.push(node);
				this._scrollParentPos.push(node.scrollTop + node.scrollLeft);
				this._scrollPos.top += node.scrollTop;
				this._scrollPos.left += node.scrollLeft;
			}
			node = node.parentNode;
		}
	},

	calculateMovement: function calculateMovement(touch) {
		return {
			x: Math.abs(touch.clientX - this._initialTouch.clientX),
			y: Math.abs(touch.clientY - this._initialTouch.clientY)
		};
	},

	detectScroll: function detectScroll() {
		var currentScrollPos = { top: 0, left: 0 };
		for (var i = 0; i < this._scrollParents.length; i++) {
			currentScrollPos.top += this._scrollParents[i].scrollTop;
			currentScrollPos.left += this._scrollParents[i].scrollLeft;
		}
		return !(currentScrollPos.top === this._scrollPos.top && currentScrollPos.left === this._scrollPos.left);
	},

	cleanupScrollDetection: function cleanupScrollDetection() {
		this._scrollParents = undefined;
		this._scrollPos = undefined;
	},

	initPressDetection: function initPressDetection(event, callback) {
		if (!this.props.onPress) return;
		this._pressTimeout = setTimeout((function () {
			this.props.onPress(event);
			callback();
		}).bind(this), this.props.pressDelay);
	},

	cancelPressDetection: function cancelPressDetection() {
		clearTimeout(this._pressTimeout);
	},

	onTouchMove: function onTouchMove(event) {
		if (this._initialTouch) {
			this.processEvent(event);

			if (this.detectScroll()) return this.endTouch(event);

			this.props.onTouchMove && this.props.onTouchMove(event);
			this._lastTouch = getTouchProps(event.touches[0]);
			var movement = this.calculateMovement(this._lastTouch);
			if (movement.x > this.props.pressMoveThreshold || movement.y > this.props.pressMoveThreshold) {
				this.cancelPressDetection();
			}
			if (movement.x > this.props.moveThreshold || movement.y > this.props.moveThreshold) {
				if (this.state.isActive) {
					this.setState({
						isActive: false
					});
				}
			} else {
				if (!this.state.isActive) {
					this.setState({
						isActive: true
					});
				}
			}
		} else if (this._initialPinch && event.touches.length === 2) {
			this.onPinchMove(event);
			event.preventDefault();
		}
	},

	onTouchEnd: function onTouchEnd(event) {
		var _this = this;

		if (this._initialTouch) {
			this.processEvent(event);
			var afterEndTouch;
			var movement = this.calculateMovement(this._lastTouch);
			if (movement.x <= this.props.moveThreshold && movement.y <= this.props.moveThreshold && this.props.onTap) {
				event.preventDefault();
				afterEndTouch = function () {
					var finalParentScrollPos = _this._scrollParents.map(function (node) {
						return node.scrollTop + node.scrollLeft;
					});
					var stoppedMomentumScroll = _this._scrollParentPos.some(function (end, i) {
						return end !== finalParentScrollPos[i];
					});
					if (!stoppedMomentumScroll) {
						_this.props.onTap(event);
					}
				};
			}
			this.endTouch(event, afterEndTouch);
		} else if (this._initialPinch && event.touches.length + event.changedTouches.length === 2) {
			this.onPinchEnd(event);
			event.preventDefault();
		}
	},

	endTouch: function endTouch(event, callback) {
		this.cancelPressDetection();
		if (event && this.props.onTouchEnd) this.props.onTouchEnd(event);
		this._initialTouch = null;
		this._lastTouch = null;
		this.setState({
			isActive: false
		}, callback);
	},

	onMouseDown: function onMouseDown(event) {
		if (window._blockMouseEvents) {
			window._blockMouseEvents = false;
			return;
		}
		if (this.props.onMouseDown && this.props.onMouseDown(event) === false) return;
		this.processEvent(event);
		this.initPressDetection(event, this.endMouseEvent);
		this._mouseDown = true;
		this.setState({
			isActive: true
		});
	},

	onMouseMove: function onMouseMove(event) {
		if (window._blockMouseEvents || !this._mouseDown) return;
		this.processEvent(event);
		this.props.onMouseMove && this.props.onMouseMove(event);
	},

	onMouseUp: function onMouseUp(event) {
		if (window._blockMouseEvents || !this._mouseDown) return;
		this.processEvent(event);
		this.props.onMouseUp && this.props.onMouseUp(event);
		this.props.onTap && this.props.onTap(event);
		this.endMouseEvent();
	},

	onMouseOut: function onMouseOut(event) {
		if (window._blockMouseEvents || !this._mouseDown) return;
		this.processEvent(event);
		this.props.onMouseOut && this.props.onMouseOut(event);
		this.endMouseEvent();
	},

	endMouseEvent: function endMouseEvent() {
		this.cancelPressDetection();
		this._mouseDown = false;
		this.setState({
			isActive: false
		});
	},

	touchStyles: function touchStyles() {
		return {
			WebkitTapHighlightColor: 'rgba(0,0,0,0)',
			WebkitTouchCallout: 'none',
			WebkitUserSelect: 'none',
			KhtmlUserSelect: 'none',
			MozUserSelect: 'none',
			msUserSelect: 'none',
			userSelect: 'none',
			cursor: 'pointer'
		};
	},

	handlers: function handlers() {
		return {
			onTouchStart: this.onTouchStart,
			onTouchMove: this.onTouchMove,
			onTouchEnd: this.onTouchEnd,
			onMouseDown: this.onMouseDown,
			onMouseUp: this.onMouseUp,
			onMouseMove: this.onMouseMove,
			onMouseOut: this.onMouseOut
		};
	}
};

/**
 * Tappable Component
 * ==================
 */

var Component = React.createClass({

	displayName: 'Tappable',

	mixins: [Mixin],

	propTypes: {
		component: React.PropTypes.any, // component to create
		className: React.PropTypes.string, // optional className
		classBase: React.PropTypes.string, // base for generated classNames
		style: React.PropTypes.object, // additional style properties for the component
		disabled: React.PropTypes.bool // only applies to buttons
	},

	getDefaultProps: function getDefaultProps() {
		return {
			component: 'span',
			classBase: 'Tappable'
		};
	},

	render: function render() {
		var props = this.props;
		var className = props.classBase + (this.state.isActive ? '-active' : '-inactive');

		if (props.className) {
			className += ' ' + props.className;
		}

		var style = {};
		_extends(style, this.touchStyles(), props.style);

		var newComponentProps = _extends({}, props, {
			style: style,
			className: className,
			disabled: props.disabled,
			handlers: this.handlers
		}, this.handlers());

		delete newComponentProps.onTap;
		delete newComponentProps.onPress;
		delete newComponentProps.onPinchStart;
		delete newComponentProps.onPinchMove;
		delete newComponentProps.onPinchEnd;
		delete newComponentProps.moveThreshold;
		delete newComponentProps.pressDelay;
		delete newComponentProps.pressMoveThreshold;
		delete newComponentProps.preventDefault;
		delete newComponentProps.stopPropagation;
		delete newComponentProps.component;

		return React.createElement(props.component, newComponentProps, props.children);
	}
});

Component.Mixin = Mixin;
module.exports = Component;
},{"react":undefined}],39:[function(require,module,exports){
module.exports = extend

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],40:[function(require,module,exports){
'use strict';

module.exports = [{ name: 'December', number: '12', season: 'Summer' }, { name: 'January', number: '1', season: 'Summer' }, { name: 'February', number: '2', season: 'Summer' }, { name: 'March', number: '3', season: 'Autumn' }, { name: 'April', number: '4', season: 'Autumn' }, { name: 'May', number: '5', season: 'Autumn' }, { name: 'June', number: '6', season: 'Winter' }, { name: 'July', number: '7', season: 'Winter' }, { name: 'August', number: '8', season: 'Winter' }, { name: 'September', number: '9', season: 'Spring' }, { name: 'October', number: '10', season: 'Spring' }, { name: 'November', number: '11', season: 'Spring' }];

},{}],41:[function(require,module,exports){
'use strict';

module.exports = [{ name: { first: 'Benjamin', last: 'Lupton' }, joinedDate: 'Mar 8, 2009', location: 'Sydney, AU', img: 'https://avatars0.githubusercontent.com/u/61148?v=3&s=460', bio: '', flavour: 'vanilla' }, { name: { first: 'Boris', last: 'Bozic' }, joinedDate: 'Mar 12, 2013', location: 'Sydney, AU', img: 'https://avatars1.githubusercontent.com/u/3838716?v=3&s=460', bio: '', flavour: 'chocolate' }, { name: { first: 'Carlos', last: 'Colon' }, joinedDate: 'Nov 7, 2013', location: 'New Hampshire, USA', img: 'https://avatars3.githubusercontent.com/u/5872515?v=3&s=460', bio: '', flavour: 'caramel' }, { name: { first: 'David', last: 'Banham' }, joinedDate: 'Feb 22, 2011', location: 'Sydney, AU', img: 'https://avatars3.githubusercontent.com/u/631832?v=3&s=460', bio: '', flavour: 'strawberry' }, { name: { first: 'Frederic', last: 'Beaudet' }, joinedDate: 'Mar 12, 2013', location: 'Montreal', img: 'https://avatars0.githubusercontent.com/u/3833335?v=3&s=460', bio: '', flavour: 'strawberry' }, { name: { first: 'James', last: 'Allen' }, joinedDate: 'Feb 14, 2013', location: 'Manchester', img: '', bio: '', flavour: 'banana' }, { name: { first: 'Jed', last: 'Watson' }, joinedDate: 'Jun 24, 2011', location: 'Sydney, AU', img: 'https://avatars1.githubusercontent.com/u/872310?v=3&s=460', bio: '', flavour: 'banana' }, { name: { first: 'Joss', last: 'Mackison' }, joinedDate: 'Nov 6, 2012', location: 'Sydney, AU', img: 'https://avatars2.githubusercontent.com/u/2730833?v=3&s=460', bio: '', flavour: 'lemon' }, { name: { first: 'Johnny', last: 'Estilles' }, joinedDate: 'Sep 23, 2013', location: 'Philippines', img: '', bio: '', flavour: 'lemon' }, { name: { first: 'Markus', last: 'Padourek' }, joinedDate: 'Oct 17, 2012', location: 'London, UK', img: 'https://avatars2.githubusercontent.com/u/2580254?v=3&s=460', bio: '', flavour: 'pastaccio' }, { name: { first: 'Mike', last: 'Grabowski' }, joinedDate: 'Oct 2, 2012', location: 'London, UK', img: 'https://avatars3.githubusercontent.com/u/2464966?v=3&s=460', bio: '', flavour: 'vanilla' }, { name: { first: 'Rob', last: 'Morris' }, joinedDate: 'Oct 18, 2012', location: 'Sydney, AU', img: 'https://avatars3.githubusercontent.com/u/2587163?v=3&s=460', bio: '', flavour: 'chocolate' }, { name: { first: 'Simon', last: 'Taylor' }, joinedDate: 'Sep 14, 2013', location: 'Sydney, AU', img: 'https://avatars1.githubusercontent.com/u/5457267?v=3&s=460', bio: '', flavour: 'caramel' }, { name: { first: 'Steven', last: 'Steneker' }, joinedDate: 'Jun 30, 2008', location: 'Sydney, AU', img: 'https://avatars3.githubusercontent.com/u/15554?v=3&s=460', bio: '', flavour: 'strawberry' }, { name: { first: 'Tom', last: 'Walker' }, joinedDate: 'Apr 19, 2011', location: 'Sydney, AU', img: 'https://avatars2.githubusercontent.com/u/737821?v=3&s=460', bio: '', flavour: 'banana' }, { name: { first: 'Tuan', last: 'Hoang' }, joinedDate: 'Mar 19, 2013', location: 'Sydney, AU', img: 'https://avatars0.githubusercontent.com/u/3906505?v=3&s=460', bio: '', flavour: 'lemon' }];

},{}],42:[function(require,module,exports){
'use strict';

var React = require('react/addons');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var classnames = require('classnames');

var Touchstone = require('touchstonejs');

var config = require('./config');

var views = {

  // app
  'home': require('./views/home'),

  // components
  'component-feedback': require('./views/component/feedback'),

  'component-headerbar': require('./views/component/bar-header'),
  'component-headerbar-search': require('./views/component/bar-header-search'),
  'component-alertbar': require('./views/component/bar-alert'),
  'component-actionbar': require('./views/component/bar-action'),
  'component-footerbar': require('./views/component/bar-footer'),

  'component-passcode': require('./views/component/passcode'),
  'component-toggle': require('./views/component/toggle'),
  'component-form': require('./views/component/form'),

  'component-simple-list': require('./views/component/list-simple'),
  'component-complex-list': require('./views/component/list-complex'),
  'component-categorised-list': require('./views/component/list-categorised'),

  // transitions
  'transitions': require('./views/transitions'),
  'transitions-target': require('./views/transitions-target'),

  // details view
  'details': require('./views/details'),
  'radio-list': require('./views/radio-list')
};

var App = React.createClass({
  displayName: 'App',

  mixins: [Touchstone.createApp(views)],

  getInitialState: function getInitialState() {
    var startView = 'home';

    // resort to #viewName if it exists
    if (window.location.hash) {
      var hash = window.location.hash.slice(1);

      if (hash in views) startView = hash;
    }

    var initialState = {
      currentView: startView,
      isNativeApp: typeof cordova !== 'undefined'
    };

    return initialState;
  },

  gotoDefaultView: function gotoDefaultView() {
    this.showView('home', 'fade');
  },

  render: function render() {
    var appWrapperClassName = classnames({
      'app-wrapper': true,
      'is-native-app': this.state.isNativeApp
    });

    return React.createElement(
      'div',
      { className: appWrapperClassName },
      React.createElement(
        'div',
        { className: 'device-silhouette' },
        React.createElement(
          ReactCSSTransitionGroup,
          { transitionName: this.state.viewTransition.name, transitionEnter: this.state.viewTransition['in'], transitionLeave: this.state.viewTransition.out, className: 'view-wrapper', component: 'div' },
          this.getCurrentView()
        )
      ),
      React.createElement(
        'div',
        { className: 'demo-wrapper' },
        React.createElement('img', { src: 'img/logo-mark.svg', alt: 'TouchstoneJS', className: 'demo-brand', width: '80', height: '80' }),
        React.createElement(
          'h1',
          null,
          'TouchstoneJS',
          React.createElement(
            'small',
            null,
            ' demo'
          )
        ),
        React.createElement(
          'p',
          null,
          'React.js powered UI framework for developing beautiful hybrid mobile apps.'
        ),
        React.createElement(
          'ul',
          { className: 'demo-links' },
          React.createElement(
            'li',
            null,
            React.createElement(
              'a',
              { href: 'https://twitter.com/touchstonejs', target: '_blank', className: 'ion-social-twitter' },
              'Twitter'
            )
          ),
          React.createElement(
            'li',
            null,
            React.createElement(
              'a',
              { href: 'https://github.com/jedwatson/touchstonejs', target: '_blank', className: 'ion-social-github' },
              'Github'
            )
          ),
          React.createElement(
            'li',
            null,
            React.createElement(
              'a',
              { href: 'http://touchstonejs.io', target: '_blank', className: 'ion-map' },
              'Roadmap'
            )
          )
        )
      )
    );
  }
});

function startApp() {
  React.render(React.createElement(App, null), document.getElementById('app'));
}

function onDeviceReady() {
  StatusBar.styleDefault();
  startApp();
}

if (typeof cordova === 'undefined') {
  startApp();
} else {
  document.addEventListener('deviceready', onDeviceReady, false);
}

},{"./config":43,"./views/component/bar-action":44,"./views/component/bar-alert":45,"./views/component/bar-footer":46,"./views/component/bar-header":48,"./views/component/bar-header-search":47,"./views/component/feedback":49,"./views/component/form":50,"./views/component/list-categorised":51,"./views/component/list-complex":52,"./views/component/list-simple":53,"./views/component/passcode":54,"./views/component/toggle":55,"./views/details":56,"./views/home":57,"./views/radio-list":58,"./views/transitions":60,"./views/transitions-target":59,"classnames":1,"react/addons":undefined,"touchstonejs":4}],43:[function(require,module,exports){
"use strict";

module.exports = {};

},{}],44:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	flashAlert: function flashAlert(alertContent) {
		alert(alertContent);
	},

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Action Bar' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Label Only'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						UI.ActionButtons,
						null,
						React.createElement(UI.ActionButton, { onTap: this.flashAlert.bind(this, 'You tapped an action button.'), label: 'Primary Action' }),
						React.createElement(UI.ActionButton, { onTap: this.flashAlert.bind(this, 'You tapped an action button.'), label: 'Secondary Action' })
					)
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Icon Only'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						UI.ActionButtons,
						null,
						React.createElement(UI.ActionButton, { onTap: this.flashAlert.bind(this, 'You tapped an action button.'), icon: 'ion-arrow-up-c' }),
						React.createElement(UI.ActionButton, { onTap: this.flashAlert.bind(this, 'You tapped an action button.'), icon: 'ion-arrow-down-c' })
					)
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Icon & Label'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						UI.ActionButtons,
						null,
						React.createElement(UI.ActionButton, { onTap: this.flashAlert.bind(this, 'You tapped an action button.'), label: 'Primary Action', icon: 'ion-arrow-up-c' }),
						React.createElement(UI.ActionButton, { onTap: this.flashAlert.bind(this, 'You tapped an action button.'), label: 'Secondary Action', icon: 'ion-arrow-down-c' })
					)
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Easily Customisable'
				),
				React.createElement(
					UI.ActionButtons,
					{ className: 'special' },
					React.createElement(UI.ActionButton, { onTap: this.flashAlert.bind(this, 'You tapped an action button.'), label: 'Primary', icon: 'ion-android-contact' }),
					React.createElement(UI.ActionButton, { onTap: this.flashAlert.bind(this, 'You tapped an action button.'), label: 'Secondary', icon: 'ion-android-contacts' }),
					React.createElement(UI.ActionButton, { onTap: this.flashAlert.bind(this, 'You tapped an action button.'), label: 'Tertiary', icon: 'ion-android-friends' })
				)
			)
		);
	}
});

},{"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],45:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	getInitialState: function getInitialState() {
		return {
			alertType: 'default'
		};
	},

	handleAlertChange: function handleAlertChange(newAlertType) {

		this.setState({
			alertType: newAlertType
		});
	},

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Alert Bar' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.Alertbar,
				{ type: this.state.alertType },
				'When the state is "',
				this.state.alertType,
				'"'
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(
					'div',
					{ className: 'panel panel--first' },
					React.createElement(UI.RadioList, { value: this.state.alertType, onChange: this.handleAlertChange, options: [{ label: 'Default', value: 'default' }, { label: 'Primary', value: 'primary' }, { label: 'Success', value: 'success' }, { label: 'Warning', value: 'warning' }, { label: 'Danger', value: 'danger' }] })
				)
			)
		);
	}
});

},{"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],46:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	getInitialState: function getInitialState() {
		return {
			typeKey: 'icon'
		};
	},

	handleFooterChange: function handleFooterChange(newType) {

		this.setState({
			typeKey: newType
		});
	},

	render: function render() {

		var footerbarClass = SetClass(this.state.typeKey, {
			'footerbar': true
		});
		var renderFooterbar;

		if (this.state.typeKey === 'icon') {
			renderFooterbar = React.createElement(
				UI.Footerbar,
				{ type: 'default' },
				React.createElement(UI.FooterbarButton, { icon: 'ion-ios7-arrow-left' }),
				React.createElement(UI.FooterbarButton, { icon: 'ion-ios7-arrow-right', disabled: true }),
				React.createElement(UI.FooterbarButton, { icon: 'ion-ios7-download' }),
				React.createElement(UI.FooterbarButton, { icon: 'ion-ios7-bookmarks-outline' }),
				React.createElement(UI.FooterbarButton, { icon: 'ion-ios7-browsers' })
			);
		} else if (this.state.typeKey === 'label') {
			renderFooterbar = React.createElement(
				UI.Footerbar,
				{ type: 'default' },
				React.createElement(UI.FooterbarButton, { label: 'Back' }),
				React.createElement(UI.FooterbarButton, { label: 'Forward', disabled: true }),
				React.createElement(UI.FooterbarButton, { label: 'Download' }),
				React.createElement(UI.FooterbarButton, { label: 'Bookmarks' }),
				React.createElement(UI.FooterbarButton, { label: 'Tabs' })
			);
		} else if (this.state.typeKey === 'both') {
			renderFooterbar = React.createElement(
				UI.Footerbar,
				{ type: 'default' },
				React.createElement(UI.FooterbarButton, { label: 'Back', icon: 'ion-ios7-arrow-left' }),
				React.createElement(UI.FooterbarButton, { label: 'Forward', icon: 'ion-ios7-arrow-right', disabled: true }),
				React.createElement(UI.FooterbarButton, { label: 'Download', icon: 'ion-ios7-download' }),
				React.createElement(UI.FooterbarButton, { label: 'Bookmarks', icon: 'ion-ios7-bookmarks-outline' }),
				React.createElement(UI.FooterbarButton, { label: 'Tabs', icon: 'ion-ios7-browsers' })
			);
		}

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Footer Bar' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(
					'div',
					{ className: 'view-feedback' },
					'Your app\'s amazing content here.'
				)
			),
			renderFooterbar
		);
	}
});
/*<div className="view-inner">
<UI.Toggle value={this.state.typeKey} onChange={this.handleFooterChange} options={[
	{ label: 'Icon', value: 'icon' },
	{ label: 'Label', value: 'label' },
	{ label: 'Both', value: 'both' }
]} />
</div>*/

},{"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],47:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Navigation = require('touchstonejs').Navigation,
    Tappable = require('react-tappable'),
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

var Timers = require('react-timers');
var Months = require('../../../data/months');

var Search = React.createClass({
	displayName: 'Search',

	mixins: [Timers()],

	propTypes: {
		searchString: React.PropTypes.string,
		onChange: React.PropTypes.func.isRequired
	},

	componentDidMount: function componentDidMount() {
		var self = this;

		this.setTimeout(function () {
			self.refs.input.getDOMNode().focus();
		}, 1000);
	},

	handleChange: function handleChange(event) {
		this.props.onChange(event.target.value);
	},

	reset: function reset() {
		this.props.onChange('');
		this.refs.input.getDOMNode().focus();
	},

	render: function render() {

		var clearIcon = Boolean(this.props.searchString.length) ? React.createElement(Tappable, { onTap: this.reset, className: 'Headerbar-form-clear ion-close-circled' }) : '';

		return React.createElement(
			UI.Headerbar,
			{ type: 'default', height: '36px', className: 'Headerbar-form Subheader' },
			React.createElement(
				'div',
				{ className: 'Headerbar-form-field Headerbar-form-icon ion-ios7-search-strong' },
				React.createElement('input', { ref: 'input', value: this.props.searchString, onChange: this.handleChange, className: 'Headerbar-form-input', placeholder: 'Search...' }),
				clearIcon
			)
		);
	}

});

var Item = React.createClass({
	displayName: 'Item',

	mixins: [Navigation],
	render: function render() {
		return React.createElement(
			'div',
			{ className: 'list-item' },
			React.createElement(
				'div',
				{ className: 'item-inner' },
				this.props.month.name
			)
		);
	}
});

var List = React.createClass({
	displayName: 'List',

	getDefaultProps: function getDefaultProps() {
		return {
			searchString: ''
		};
	},

	render: function render() {

		var searchString = this.props.searchString;
		var months = [];
		var lastSeason = '';
		var renderList = React.createElement(
			'div',
			{ className: 'view-feedback-text' },
			'No match found...'
		);

		this.props.months.forEach(function (month, i) {

			// filter months
			if (searchString && month.name.toLowerCase().indexOf(searchString.toLowerCase()) === -1) {
				return;
			}

			// insert categories

			var season = month.season;

			if (lastSeason !== season) {
				lastSeason = season;

				months.push(React.createElement(
					'div',
					{ className: 'list-header', key: 'list-header-' + i },
					season
				));
			}

			// create list

			month.key = 'month-' + i;
			months.push(React.createElement(Item, { month: month }));
		});

		var wrapperClassName = SetClass(months.length ? 'panel mb-0' : 'view-feedback');

		if (months.length) {
			renderList = months;
		}

		return React.createElement(
			'div',
			{ className: wrapperClassName },
			renderList
		);
	}
});

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	getInitialState: function getInitialState() {
		return {
			searchString: '',
			months: Months
		};
	},

	updateSearch: function updateSearch(str) {
		this.setState({ searchString: str });
	},

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Filter Months' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(Search, { searchString: this.state.searchString, onChange: this.updateSearch }),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(List, { months: this.state.months, searchString: this.state.searchString })
			)
		);
	}
});

},{"../../../data/months":40,"classnames":1,"react":undefined,"react-tappable":2,"react-timers":3,"touchstonejs":4}],48:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	getInitialState: function getInitialState() {
		return {
			typeKey: 'default'
		};
	},

	handleHeaderChange: function handleHeaderChange(newType) {

		this.setState({
			typeKey: newType
		});
	},

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: this.state.typeKey, label: 'Header Bar' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(
					'div',
					{ className: 'panel panel--first' },
					React.createElement(UI.RadioList, { value: this.state.typeKey, onChange: this.handleHeaderChange, options: [{ label: 'Default', value: 'default' }, { label: 'Green', value: 'green' }, { label: 'Blue', value: 'blue' }, { label: 'Light Blue', value: 'light-blue' }, { label: 'Yellow', value: 'yellow' }, { label: 'Orange', value: 'orange' }, { label: 'Red', value: 'red' }, { label: 'Pink', value: 'pink' }, { label: 'Purple', value: 'purple' }] })
				)
			)
		);
	}
});

},{"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],49:[function(require,module,exports){
'use strict';

var React = require('react');
var UI = require('touchstonejs').UI;
var Link = require('touchstonejs').Link;

module.exports = React.createClass({
	displayName: 'exports',

	flashAlert: function flashAlert(alertContent) {
		window.alert(alertContent);
	},

	render: function render() {
		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Feedback' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.ViewContent,
				null,
				React.createElement(UI.Feedback, { iconName: 'ion-compass', iconType: 'primary', header: 'Optional Header', subheader: 'Subheader, also optional', text: 'Feedback message copy goes here. It can be of any length.', actionText: 'Optional Action', actionFn: this.flashAlert.bind(this, 'You clicked the action.') })
			)
		);
	}
});

},{"react":undefined,"touchstonejs":4}],50:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	getInitialState: function getInitialState() {
		return {
			flavour: 'strawberry'
		};
	},

	handleFlavourChange: function handleFlavourChange(newFlavour) {

		this.setState({
			flavour: newFlavour
		});
	},

	handleSwitch: function handleSwitch(key, event) {
		var newState = {};
		newState[key] = !this.state[key];

		this.setState(newState);
	},

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Form' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Inputs'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(UI.Input, { placeholder: 'Default' }),
					React.createElement(UI.Input, { defaultValue: 'With Value', placeholder: 'Placeholder' }),
					React.createElement(UI.Textarea, { defaultValue: 'Longtext is good for bios etc.', placeholder: 'Longtext' })
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Labelled Inputs'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(UI.LabelInput, { type: 'email', label: 'Email', placeholder: 'your.name@example.com' }),
					React.createElement(UI.LabelInput, { type: 'url', label: 'URL', placeholder: 'http://www.yourwebsite.com' }),
					React.createElement(UI.LabelInput, { noedit: true, label: 'No Edit', value: 'Un-editable, scrollable, selectable content' }),
					React.createElement(UI.LabelSelect, { label: 'Flavour', value: this.state.flavour, onChange: this.handleFlavourChange, options: [{ label: 'Vanilla', value: 'vanilla' }, { label: 'Chocolate', value: 'chocolate' }, { label: 'Caramel', value: 'caramel' }, { label: 'Strawberry', value: 'strawberry' }, { label: 'Banana', value: 'banana' }, { label: 'Lemon', value: 'lemon' }, { label: 'Pastaccio', value: 'pastaccio' }] }),
					React.createElement(
						'div',
						{ className: 'list-item field-item' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							React.createElement(
								'div',
								{ className: 'field-label' },
								'Switch'
							),
							React.createElement(UI.Switch, { onTap: this.handleSwitch.bind(this, 'verifiedCreditCard'), on: this.state.verifiedCreditCard })
						)
					)
				)
			)
		);
	}
});

},{"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],51:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

var Months = require('../../../data/months');

var HeaderList = React.createClass({
	displayName: 'HeaderList',

	render: function render() {

		var months = [];
		var lastSeason = '';

		this.props.months.forEach(function (month, i) {

			var season = month.season;

			if (lastSeason !== season) {
				lastSeason = season;

				months.push(React.createElement(
					'div',
					{ className: 'list-header', key: 'list-header-' + i },
					season
				));
			}

			month.key = 'month-' + i;
			months.push(React.createElement(
				'div',
				{ className: 'list-item' },
				React.createElement(
					'div',
					{ className: 'item-inner' },
					month.name
				)
			));
		});

		return React.createElement(
			'div',
			{ className: 'panel mb-0' },
			months
		);
	}
});

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Categorised List' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(HeaderList, { months: Months })
			)
		);
	}
});

},{"../../../data/months":40,"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],52:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

var People = require('../../../data/people');

var ComplexListItem = React.createClass({
	displayName: 'ComplexListItem',

	mixins: [Navigation],

	render: function render() {

		var initials = this.props.user.name.first.charAt(0).toUpperCase() + this.props.user.name.last.charAt(0).toUpperCase();

		return React.createElement(
			Link,
			{ to: 'details', viewTransition: 'show-from-right', params: { user: this.props.user, prevView: 'component-complex-list' }, className: 'list-item', component: 'div' },
			React.createElement(UI.ItemMedia, { avatar: this.props.user.img, avatarInitials: initials }),
			React.createElement(
				'div',
				{ className: 'item-inner' },
				React.createElement(
					'div',
					{ className: 'item-content' },
					React.createElement(
						'div',
						{ className: 'item-title' },
						[this.props.user.name.first, this.props.user.name.last].join(' ')
					),
					React.createElement(
						'div',
						{ className: 'item-subtitle' },
						this.props.user.location
					)
				),
				React.createElement(UI.ItemNote, { type: 'default', label: this.props.user.joinedDate.slice(-4), icon: 'ion-chevron-right' })
			)
		);
	}
});

var ComplexList = React.createClass({
	displayName: 'ComplexList',

	render: function render() {

		var users = [];

		this.props.users.forEach(function (user, i) {
			user.key = 'user-' + i;
			users.push(React.createElement(ComplexListItem, { user: user }));
		});

		return React.createElement(
			'div',
			null,
			React.createElement(
				'div',
				{ className: 'panel panel--first avatar-list' },
				users
			)
		);
	}
});

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Complex List' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(ComplexList, { users: People })
			)
		);
	}
});

},{"../../../data/people":41,"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],53:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

var People = require('../../../data/people');

var SimpleListItem = React.createClass({
	displayName: 'SimpleListItem',

	mixins: [Navigation],

	render: function render() {

		return React.createElement(
			Link,
			{ to: 'details', viewTransition: 'show-from-right', params: { user: this.props.user, prevView: 'component-simple-list' }, className: 'list-item is-tappable', component: 'div' },
			React.createElement(
				'div',
				{ className: 'item-inner' },
				React.createElement(
					'div',
					{ className: 'item-title' },
					[this.props.user.name.first, this.props.user.name.last].join(' ')
				)
			)
		);
	}
});

var SimpleList = React.createClass({
	displayName: 'SimpleList',

	render: function render() {

		var users = [];

		this.props.users.forEach(function (user, i) {
			user.key = 'user-' + i;
			users.push(React.createElement(SimpleListItem, { user: user }));
		});

		return React.createElement(
			'div',
			null,
			React.createElement(
				'div',
				{ className: 'panel panel--first' },
				users
			)
		);
	}
});

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Simple List' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(SimpleList, { users: People })
			)
		);
	}
});

},{"../../../data/people":41,"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],54:[function(require,module,exports){
'use strict';

var React = require('react'),
    Dialogs = require('touchstonejs').Dialogs,
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation, Dialogs],

	getInitialState: function getInitialState() {
		return {};
	},

	handlePasscode: function handlePasscode(passcode) {
		alert('Your passcode is "' + passcode + '".');

		this.showView('home', 'fade');
	},

	render: function render() {
		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Enter Passcode' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(UI.Passcode, { action: this.handlePasscode, helpText: 'Enter a passcode' })
		);
	}
});

},{"react":undefined,"touchstonejs":4}],55:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

var Months = require('../../../data/months');

var MonthList = React.createClass({
	displayName: 'MonthList',

	render: function render() {

		var months = [];
		var lastSeason = '';
		var filterState = this.props.filterState;

		this.props.months.forEach(function (month, i) {

			if (filterState !== 'all' && filterState !== month.season.toLowerCase()) {
				return;
			}

			var season = month.season;

			if (lastSeason !== season) {
				lastSeason = season;

				months.push(React.createElement(
					'div',
					{ className: 'list-header', key: 'list-header-' + i },
					season
				));
			}

			month.key = 'month-' + i;
			months.push(React.createElement(
				'div',
				{ className: 'list-item' },
				React.createElement(
					'div',
					{ className: 'item-inner' },
					month.name
				)
			));
		});

		return React.createElement(
			'div',
			{ className: 'panel mb-0' },
			months
		);
	}
});

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	getInitialState: function getInitialState() {
		return {
			activeToggleItemKey: 'all',
			typeKey: 'primary',
			months: Months
		};
	},

	handleToggleActiveChange: function handleToggleActiveChange(newItem) {

		var selectedItem = newItem;

		if (this.state.activeToggleItemKey === newItem) {
			selectedItem = 'all';
		}

		this.setState({
			activeToggleItemKey: selectedItem
		});
	},

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Toggle' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.Headerbar,
				{ type: 'default', height: '36px', className: 'Subheader' },
				React.createElement(UI.Toggle, { value: this.state.activeToggleItemKey, onChange: this.handleToggleActiveChange, options: [{ label: 'Summer', value: 'summer' }, { label: 'Autumn', value: 'autumn' }, { label: 'Winter', value: 'winter' }, { label: 'Spring', value: 'spring' }] })
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(MonthList, { months: this.state.months, filterState: this.state.activeToggleItemKey })
			)
		);
	}
});

},{"../../../data/months":40,"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],56:[function(require,module,exports){
'use strict';

var React = require('react'),
    Tappable = require('react-tappable'),
    Dialogs = require('touchstonejs').Dialogs,
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

var Timers = require('react-timers');

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation, Dialogs, Timers()],

	getDefaultProps: function getDefaultProps() {
		return {
			prevView: 'home'
		};
	},

	getInitialState: function getInitialState() {
		return {
			processing: false,
			formIsValid: false,
			bioValue: this.props.user.bio || ''
		};
	},

	showFlavourList: function showFlavourList() {
		this.showView('radio-list', 'show-from-right', { user: this.props.user, flavour: this.state.flavour });
	},

	handleBioInput: function handleBioInput(event) {
		this.setState({
			bioValue: event.target.value,
			formIsValid: event.target.value.length ? true : false
		});
	},

	processForm: function processForm() {
		var self = this;

		this.setState({ processing: true });

		this.setTimeout(function () {
			self.showView('home', 'fade', {});
		}, 750);
	},

	flashAlert: function flashAlert(alertContent, callback) {
		return callback(this.showAlertDialog({ message: alertContent }));
	},

	render: function render() {

		// fields
		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: [this.props.user.name.first, this.props.user.name.last].join(' ') },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				),
				React.createElement(UI.LoadingButton, { loading: this.state.processing, disabled: !this.state.formIsValid, onTap: this.processForm, label: 'Save', className: 'Headerbar-button right is-primary' })
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(
					'div',
					{ className: 'panel panel--first' },
					React.createElement(UI.LabelInput, { label: 'Name', value: [this.props.user.name.first, this.props.user.name.last].join(' '), placeholder: 'Full name', first: true }),
					React.createElement(UI.LabelInput, { label: 'Location', value: this.props.user.location, placeholder: 'Suburb, Country' }),
					React.createElement(UI.LabelInput, { label: 'Joined', value: this.props.user.joinedDate, placeholder: 'Date' }),
					React.createElement(UI.LabelTextarea, { label: 'Bio', value: this.state.bioValue, placeholder: '(required)', onChange: this.handleBioInput })
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						Tappable,
						{ onTap: this.showFlavourList, className: 'list-item is-first', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Favourite Icecream',
							React.createElement(
								'div',
								{ className: 'item-note default' },
								React.createElement(
									'div',
									{ className: 'item-note-label' },
									this.props.user.flavour
								),
								React.createElement('div', { className: 'item-note-icon ion-chevron-right' })
							)
						)
					)
				),
				React.createElement(
					Tappable,
					{ onTap: this.flashAlert.bind(this, 'You clicked the Primary Button.'), className: 'panel-button primary', component: 'button' },
					'Primary Button'
				),
				React.createElement(
					Tappable,
					{ onTap: this.flashAlert.bind(this, 'You clicked the Default Button.'), className: 'panel-button', component: 'button' },
					'Default Button'
				),
				React.createElement(
					Tappable,
					{ onTap: this.flashAlert.bind(this, 'You clicked the Danger Button.'), className: 'panel-button danger', component: 'button' },
					'Danger Button'
				)
			)
		);
	}
});
/*<div className="panel-header text-caps">Basic details</div>*/

},{"react":undefined,"react-tappable":2,"react-timers":3,"touchstonejs":4}],57:[function(require,module,exports){
'use strict';

var React = require('react');
var Tappable = require('react-tappable');
var Navigation = require('touchstonejs').Navigation;
var Link = require('touchstonejs').Link;
var UI = require('touchstonejs').UI;

var Timers = require('react-timers');

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation, Timers()],

	getInitialState: function getInitialState() {
		return {
			popup: {
				visible: false,
				iconName: 'ion-load-c'
			}
		};
	},
	showLoadingPopup: function showLoadingPopup() {
		this.setState({
			popup: {
				visible: true,
				loading: true,
				header: 'Loading',
				iconName: 'ion-load-c',
				iconType: 'default'
			}
		});

		var self = this;

		this.setTimeout(function () {
			self.setState({
				popup: {
					visible: true,
					loading: false,
					header: 'Done!',
					iconName: 'ion-ios7-checkmark',
					iconType: 'success'
				}
			});
		}, 2000);

		this.setTimeout(function () {
			self.setState({
				popup: {
					visible: false,
					iconName: 'ion-load-c'
				}
			});
		}, 3000);
	},

	render: function render() {
		return React.createElement(
			UI.View,
			null,
			React.createElement(UI.Headerbar, { type: 'default', label: 'TouchstoneJS' }),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Bars'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						Link,
						{ component: 'div', to: 'component-headerbar', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Header Bar'
						)
					),
					React.createElement(
						Link,
						{ component: 'div', to: 'component-headerbar-search', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Header Bar Search'
						)
					),
					React.createElement(
						Link,
						{ component: 'div', to: 'component-alertbar', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Alert Bar'
						)
					),
					React.createElement(
						Link,
						{ component: 'div', to: 'component-footerbar', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Footer Bar'
						)
					)
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Lists'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						Link,
						{ component: 'div', to: 'component-simple-list', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Simple List'
						)
					),
					React.createElement(
						Link,
						{ component: 'div', to: 'component-complex-list', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Complex List'
						)
					)
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'UI Elements'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						Link,
						{ component: 'div', to: 'component-toggle', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Toggle'
						)
					),
					React.createElement(
						Link,
						{ component: 'div', to: 'component-form', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Form Fields'
						)
					),
					React.createElement(
						Link,
						{ component: 'div', to: 'component-passcode', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Passcode / Keypad'
						)
					),
					React.createElement(
						Tappable,
						{ component: 'div', onTap: this.showLoadingPopup, className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Loading Spinner'
						)
					)
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Application State'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						Link,
						{ component: 'div', to: 'transitions', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'View Transitions'
						)
					),
					React.createElement(
						Link,
						{ component: 'div', to: 'component-feedback', viewTransition: 'show-from-right', className: 'list-item is-tappable' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'View Feedback'
						)
					)
				)
			),
			React.createElement(
				UI.Popup,
				{ visible: this.state.popup.visible },
				React.createElement(UI.PopupIcon, { name: this.state.popup.iconName, type: this.state.popup.iconType, spinning: this.state.popup.loading }),
				React.createElement(
					'strong',
					null,
					this.state.popup.header
				)
			)
		);
	}
});
/* This is covered in other components
<Link component="div" to="component-categorised-list" viewTransition="show-from-right" className="list-item is-tappable">
<div className="item-inner">Categorised List</div>
</Link>*/

},{"react":undefined,"react-tappable":2,"react-timers":3,"touchstonejs":4}],58:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Tappable = require('react-tappable'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	getInitialState: function getInitialState() {
		return {
			flavour: this.props.user.flavour
		};
	},

	handleFlavourChange: function handleFlavourChange(newFlavour) {

		this.setState({
			flavour: newFlavour
		});
	},

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Favourite Icecream' },
				React.createElement(
					Link,
					{ to: 'details', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button', viewProps: { user: this.props.user, flavour: this.state.flavour } },
					'Details'
				)
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(
					'div',
					{ className: 'panel panel--first' },
					React.createElement(UI.RadioList, { value: this.state.flavour, onChange: this.handleFlavourChange, options: [{ label: 'Vanilla', value: 'vanilla' }, { label: 'Chocolate', value: 'chocolate' }, { label: 'Caramel', value: 'caramel' }, { label: 'Strawberry', value: 'strawberry' }, { label: 'Banana', value: 'banana' }, { label: 'Lemon', value: 'lemon' }, { label: 'Pastaccio', value: 'pastaccio' }] })
				)
			)
		);
	}
});
/*<UI.HeaderbarButton showView="details" viewTransition="reveal-from-right" viewProps={{ user: this.props.user, flavour: this.state.flavour }} label="Details" icon="ion-chevron-left" />*/

},{"classnames":1,"react":undefined,"react-tappable":2,"touchstonejs":4}],59:[function(require,module,exports){
'use strict';

var React = require('react'),
    Navigation = require('touchstonejs').Navigation,
    UI = require('touchstonejs').UI;

var Timers = require('react-timers');

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation, Timers()],

	componentDidMount: function componentDidMount() {
		var self = this;

		this.setTimeout(function () {
			self.showView('transitions', 'fade');
		}, 1000);
	},

	render: function render() {
		return React.createElement(
			UI.View,
			null,
			React.createElement(UI.Headerbar, { type: 'default', label: 'Target View' }),
			React.createElement(
				UI.ViewContent,
				null,
				React.createElement(UI.Feedback, { iconKey: 'ion-ios7-photos', iconType: 'muted', text: 'Hold on a sec...' })
			)
		);
	}
});

},{"react":undefined,"react-timers":3,"touchstonejs":4}],60:[function(require,module,exports){
'use strict';

var React = require('react'),
    SetClass = require('classnames'),
    Navigation = require('touchstonejs').Navigation,
    Link = require('touchstonejs').Link,
    UI = require('touchstonejs').UI;

module.exports = React.createClass({
	displayName: 'exports',

	mixins: [Navigation],

	render: function render() {

		return React.createElement(
			UI.View,
			null,
			React.createElement(
				UI.Headerbar,
				{ type: 'default', label: 'Transitions' },
				React.createElement(
					Link,
					{ to: 'home', viewTransition: 'reveal-from-right', className: 'Headerbar-button ion-chevron-left', component: 'button' },
					'Back'
				)
			),
			React.createElement(
				UI.ViewContent,
				{ grow: true, scrollable: true },
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Default'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						Link,
						{ to: 'transitions-target', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'None'
						)
					)
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Fade'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'fade', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Fade'
						)
					),
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'fade-expand', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Fade Expand'
						)
					),
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'fade-contract', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Fade Contract'
						)
					)
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Show'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'show-from-left', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Show from Left'
						)
					),
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'show-from-right', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Show from Right'
						)
					),
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'show-from-top', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Show from Top'
						)
					),
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'show-from-bottom', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Show from Bottom'
						)
					)
				),
				React.createElement(
					'div',
					{ className: 'panel-header text-caps' },
					'Reveal'
				),
				React.createElement(
					'div',
					{ className: 'panel' },
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'reveal-from-left', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Reveal from Left'
						)
					),
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'reveal-from-right', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Reveal from Right'
						)
					),
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'reveal-from-top', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Reveal from Top'
						)
					),
					React.createElement(
						Link,
						{ to: 'transitions-target', viewTransition: 'reveal-from-bottom', className: 'list-item is-tappable', component: 'div' },
						React.createElement(
							'div',
							{ className: 'item-inner' },
							'Reveal from Bottom'
						)
					)
				)
			)
		);
	}
});

},{"classnames":1,"react":undefined,"touchstonejs":4}]},{},[42])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMtdGFza3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9jbGFzc25hbWVzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0LXRhcHBhYmxlL3NyYy9UYXBwYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC10aW1lcnMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvY29tcG9uZW50cy9MaW5rLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvY29uc3RhbnRzL3RyYW5zaXRpb25zLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvY3JlYXRlQXBwLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvaWNvbnMvZGVsZXRlLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvbWl4aW5zL05hdmlnYXRpb24uanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi9taXhpbnMvVHJhbnNpdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0FsZXJ0YmFyLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvRmVlZGJhY2suanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9Gb290ZXJiYXIuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9Gb290ZXJiYXJCdXR0b24uanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9IZWFkZXJiYXIuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9IZWFkZXJiYXJCdXR0b24uanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9JbnB1dC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0l0ZW1NZWRpYS5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0l0ZW1Ob3RlLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvS2V5cGFkLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvS2V5cGFkQnV0dG9uLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvTGFiZWxJbnB1dC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0xhYmVsU2VsZWN0LmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvTGFiZWxUZXh0YXJlYS5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0xvYWRpbmdCdXR0b24uanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9QYXNzY29kZS5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL1BvcHVwLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvUG9wdXBJY29uLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvUmFkaW9MaXN0LmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvU3dpdGNoLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvVGV4dGFyZWEuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9Ub2dnbGUuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9WaWV3LmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvVmlld0NvbnRlbnQuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbm9kZV9tb2R1bGVzL2JsYWNrbGlzdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbm9kZV9tb2R1bGVzL3JlYWN0LXRhcHBhYmxlL2xpYi9UYXBwYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbm9kZV9tb2R1bGVzL3h0ZW5kL211dGFibGUuanMiLCIvZGV2LWpzL2RlbW9zL2ZvcmtlZC90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvZGF0YS9tb250aHMuanMiLCIvZGV2LWpzL2RlbW9zL2ZvcmtlZC90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvZGF0YS9wZW9wbGUuanMiLCIvZGV2LWpzL2RlbW9zL2ZvcmtlZC90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvYXBwLmpzIiwiL2Rldi1qcy9kZW1vcy9mb3JrZWQvdG91Y2hzdG9uZWpzLXN0YXJ0ZXIvc3JjL2pzL2NvbmZpZy5qcyIsIi9kZXYtanMvZGVtb3MvZm9ya2VkL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy92aWV3cy9jb21wb25lbnQvYmFyLWFjdGlvbi5qcyIsIi9kZXYtanMvZGVtb3MvZm9ya2VkL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy92aWV3cy9jb21wb25lbnQvYmFyLWFsZXJ0LmpzIiwiL2Rldi1qcy9kZW1vcy9mb3JrZWQvdG91Y2hzdG9uZWpzLXN0YXJ0ZXIvc3JjL2pzL3ZpZXdzL2NvbXBvbmVudC9iYXItZm9vdGVyLmpzIiwiL2Rldi1qcy9kZW1vcy9mb3JrZWQvdG91Y2hzdG9uZWpzLXN0YXJ0ZXIvc3JjL2pzL3ZpZXdzL2NvbXBvbmVudC9iYXItaGVhZGVyLXNlYXJjaC5qcyIsIi9kZXYtanMvZGVtb3MvZm9ya2VkL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy92aWV3cy9jb21wb25lbnQvYmFyLWhlYWRlci5qcyIsIi9kZXYtanMvZGVtb3MvZm9ya2VkL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy92aWV3cy9jb21wb25lbnQvZmVlZGJhY2suanMiLCIvZGV2LWpzL2RlbW9zL2ZvcmtlZC90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvY29tcG9uZW50L2Zvcm0uanMiLCIvZGV2LWpzL2RlbW9zL2ZvcmtlZC90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvY29tcG9uZW50L2xpc3QtY2F0ZWdvcmlzZWQuanMiLCIvZGV2LWpzL2RlbW9zL2ZvcmtlZC90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvY29tcG9uZW50L2xpc3QtY29tcGxleC5qcyIsIi9kZXYtanMvZGVtb3MvZm9ya2VkL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy92aWV3cy9jb21wb25lbnQvbGlzdC1zaW1wbGUuanMiLCIvZGV2LWpzL2RlbW9zL2ZvcmtlZC90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvY29tcG9uZW50L3Bhc3Njb2RlLmpzIiwiL2Rldi1qcy9kZW1vcy9mb3JrZWQvdG91Y2hzdG9uZWpzLXN0YXJ0ZXIvc3JjL2pzL3ZpZXdzL2NvbXBvbmVudC90b2dnbGUuanMiLCIvZGV2LWpzL2RlbW9zL2ZvcmtlZC90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvZGV0YWlscy5qcyIsIi9kZXYtanMvZGVtb3MvZm9ya2VkL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy92aWV3cy9ob21lLmpzIiwiL2Rldi1qcy9kZW1vcy9mb3JrZWQvdG91Y2hzdG9uZWpzLXN0YXJ0ZXIvc3JjL2pzL3ZpZXdzL3JhZGlvLWxpc3QuanMiLCIvZGV2LWpzL2RlbW9zL2ZvcmtlZC90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvdHJhbnNpdGlvbnMtdGFyZ2V0LmpzIiwiL2Rldi1qcy9kZW1vcy9mb3JrZWQvdG91Y2hzdG9uZWpzLXN0YXJ0ZXIvc3JjL2pzL3ZpZXdzL3RyYW5zaXRpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDZkEsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUNoQixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUksTUFBTSxFQUFFLElBQUksRUFBRyxNQUFNLEVBQUUsUUFBUSxFQUFFLEVBQ3ZELEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBSyxNQUFNLEVBQUUsR0FBRyxFQUFJLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFDdkQsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFJLE1BQU0sRUFBRSxHQUFHLEVBQUksTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUN2RCxFQUFFLElBQUksRUFBRSxPQUFPLEVBQU8sTUFBTSxFQUFFLEdBQUcsRUFBSSxNQUFNLEVBQUUsUUFBUSxFQUFFLEVBQ3ZELEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBTyxNQUFNLEVBQUUsR0FBRyxFQUFJLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFDdkQsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFTLE1BQU0sRUFBRSxH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QUFrQixFQUFDLFNBQVMsRUFBQyx1QkFBdUIsRUFBQyxTQUFTLEVBQUMsS0FBSztNQUFDOztTQUFLLFNBQVMsRUFBQyxZQUFZOztPQUF1QjtNQUFPO0tBQzNLO0FBQUMsVUFBSTtRQUFDLEVBQUUsRUFBQyxvQkFBb0IsRUFBQyxjQUFjLEVBQUMsbUJBQW1CLEVBQUMsU0FBUyxFQUFDLHVCQUF1QixFQUFDLFNBQVMsRUFBQyxLQUFLO01BQUM7O1NBQUssU0FBUyxFQUFDLFlBQVk7O09BQXdCO01BQU87S0FDN0s7QUFBQyxVQUFJO1FBQUMsRUFBRSxFQUFDLG9CQUFvQixFQUFDLGNBQWMsRUFBQyxpQkFBaUIsRUFBQyxTQUFTLEVBQUMsdUJBQXVCLEVBQUMsU0FBUyxFQUFDLEtBQUs7TUFBQzs7U0FBSyxTQUFTLEVBQUMsWUFBWTs7T0FBc0I7TUFBTztLQUN6SztBQUFDLFVBQUk7UUFBQyxFQUFFLEVBQUMsb0JBQW9CLEVBQUMsY0FBYyxFQUFDLG9CQUFvQixFQUFDLFNBQVMsRUFBQyx1QkFBdUIsRUFBQyxTQUFTLEVBQUMsS0FBSztNQUFDOztTQUFLLFNBQVMsRUFBQyxZQUFZOztPQUF5QjtNQUFPO0tBQzFLO0lBQ1U7R0FDUixDQUNUO0VBQ0Y7Q0FDRCxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gIENvcHlyaWdodCAoYykgMjAxNSBKZWQgV2F0c29uLlxuICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UgKE1JVCksIHNlZVxuICBodHRwOi8vamVkd2F0c29uLmdpdGh1Yi5pby9jbGFzc25hbWVzXG4qL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0ZnVuY3Rpb24gY2xhc3NOYW1lcyAoKSB7XG5cblx0XHR2YXIgY2xhc3NlcyA9ICcnO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKCdzdHJpbmcnID09PSBhcmdUeXBlIHx8ICdudW1iZXInID09PSBhcmdUeXBlKSB7XG5cdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsgYXJnO1xuXG5cdFx0XHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuXHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKTtcblxuXHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PT0gYXJnVHlwZSkge1xuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gYXJnKSB7XG5cdFx0XHRcdFx0aWYgKGFyZy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGtleTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcy5zdWJzdHIoMSk7XG5cdH1cblxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cblx0XHRkZWZpbmUoZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXM7XG5cdFx0fSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXM7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LmNsYXNzTmFtZXMgPSBjbGFzc05hbWVzO1xuXHR9XG5cbn0oKSk7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG4vLyBFbmFibGUgUmVhY3QgVG91Y2ggRXZlbnRzXG5SZWFjdC5pbml0aWFsaXplVG91Y2hFdmVudHModHJ1ZSk7XG5cbmZ1bmN0aW9uIGdldFRvdWNoUHJvcHModG91Y2gpIHtcblx0aWYgKCF0b3VjaCkgcmV0dXJuIHt9O1xuXHRyZXR1cm4ge1xuXHRcdHBhZ2VYOiB0b3VjaC5wYWdlWCxcblx0XHRwYWdlWTogdG91Y2gucGFnZVksXG5cdFx0Y2xpZW50WDogdG91Y2guY2xpZW50WCxcblx0XHRjbGllbnRZOiB0b3VjaC5jbGllbnRZXG5cdH07XG59XG5cbmZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQsIHNvdXJjZSkge1xuXHRpZiAoIXNvdXJjZSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc291cmNlKSAhPT0gJ1tvYmplY3QgT2JqZWN0XScpIHJldHVybiB0YXJnZXQ7XG5cdGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcblx0XHRpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdHRhcmdldFtrZXldID0gc291cmNlW2tleV07XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICogVGFwcGFibGUgQ29tcG9uZW50XG4gKiA9PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0XG5cdGRpc3BsYXlOYW1lOiAnVGFwcGFibGUnLFxuXHRcblx0cHJvcFR5cGVzOiB7XG5cdFx0XG5cdFx0Y29tcG9uZW50OiBSZWFjdC5Qcm9wVHlwZXMuYW55LCAgICAgICAgICAgICAgLy8gY29tcG9uZW50IHRvIGNyZWF0ZVxuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZywgICAgICAgICAgIC8vIG9wdGlvbmFsIGNsYXNzTmFtZVxuXHRcdGNsYXNzQmFzZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZywgICAgICAgICAgIC8vIGJhc2UgZm9yIGdlbmVyYXRlZCBjbGFzc05hbWVzXG5cdFx0c3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsICAgICAgICAgICAgICAgLy8gYWRkaXRpb25hbCBzdHlsZSBwcm9wZXJ0aWVzIGZvciB0aGUgY29tcG9uZW50XG5cdFx0ZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgICAgLy8gb25seSBhcHBsaWVzIHRvIGJ1dHRvbnNcblx0XHRcblx0XHRtb3ZlVGhyZXNob2xkOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLCAgICAgICAvLyBwaXhlbHMgdG8gbW92ZSBiZWZvcmUgY2FuY2VsbGluZyB0YXBcblx0XHRwcmVzc0RlbGF5OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLCAgICAgICAgICAvLyBtcyB0byB3YWl0IGJlZm9yZSBkZXRlY3RpbmcgYSBwcmVzc1xuXHRcdHByZXNzTW92ZVRocmVzaG9sZDogUmVhY3QuUHJvcFR5cGVzLm51bWJlciwgIC8vIHBpeGVscyB0byBtb3ZlIGJlZm9yZSBjYW5jZWxsaW5nIHByZXNzXG5cdFx0cHJldmVudERlZmF1bHQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgLy8gd2hldGhlciB0byBwcmV2ZW50RGVmYXVsdCBvbiBhbGwgZXZlbnRzXG5cdFx0c3RvcFByb3BhZ2F0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgLy8gd2hldGhlciB0byBzdG9wUHJvcGFnYXRpb24gb24gYWxsIGV2ZW50c1xuXHRcdFxuXHRcdG9uVGFwOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgICAgICAgICAgICAgICAgIC8vIGZpcmVzIHdoZW4gYSB0YXAgaXMgZGV0ZWN0ZWRcblx0XHRvblByZXNzOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgICAgICAgICAgICAgICAvLyBmaXJlcyB3aGVuIGEgcHJlc3MgaXMgZGV0ZWN0ZWRcblx0XHRvblRvdWNoU3RhcnQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgICAgICAvLyBwYXNzLXRocm91Z2ggdG91Y2ggZXZlbnRcblx0XHRvblRvdWNoTW92ZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgICAvLyBwYXNzLXRocm91Z2ggdG91Y2ggZXZlbnRcblx0XHRvblRvdWNoRW5kOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgICAgICAgICAgICAvLyBwYXNzLXRocm91Z2ggdG91Y2ggZXZlbnRcblx0XHRvbk1vdXNlRG93bjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgICAvLyBwYXNzLXRocm91Z2ggbW91c2UgZXZlbnRcblx0XHRvbk1vdXNlVXA6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgICAgICAgICAvLyBwYXNzLXRocm91Z2ggbW91c2UgZXZlbnRcblx0XHRvbk1vdXNlTW92ZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgICAvLyBwYXNzLXRocm91Z2ggbW91c2UgZXZlbnRcblx0XHRvbk1vdXNlT3V0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyAgICAgICAgICAgICAvLyBwYXNzLXRocm91Z2ggbW91c2UgZXZlbnRcblx0XHRcblx0fSxcblx0XG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbXBvbmVudDogJ3NwYW4nLFxuXHRcdFx0Y2xhc3NCYXNlOiAnVGFwcGFibGUnLFxuXHRcdFx0bW92ZVRocmVzaG9sZDogMTAwLFxuXHRcdFx0cHJlc3NEZWxheTogMTAwMCxcblx0XHRcdHByZXNzTW92ZVRocmVzaG9sZDogNVxuXHRcdH07XG5cdH0sXG5cdFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpc0FjdGl2ZTogZmFsc2UsXG5cdFx0XHR0b3VjaEFjdGl2ZTogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXHRcblx0Y29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY2xlYW51cFNjcm9sbERldGVjdGlvbigpO1xuXHRcdHRoaXMuY2FuY2VsUHJlc3NEZXRlY3Rpb24oKTtcblx0fSxcblx0XG5cdHByb2Nlc3NFdmVudDogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRpZiAodGhpcy5wcm9wcy5wcmV2ZW50RGVmYXVsdCkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRpZiAodGhpcy5wcm9wcy5zdG9wUHJvcGFnYXRpb24pIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHR9LFxuXHRcblx0b25Ub3VjaFN0YXJ0OiBmdW5jdGlvbihldmVudCkge1xuXHRcdGlmICh0aGlzLnByb3BzLm9uVG91Y2hTdGFydCAmJiB0aGlzLnByb3BzLm9uVG91Y2hTdGFydChldmVudCkgPT09IGZhbHNlKSByZXR1cm47XG5cdFx0dGhpcy5wcm9jZXNzRXZlbnQoZXZlbnQpO1xuXHRcdHdpbmRvdy5fYmxvY2tNb3VzZUV2ZW50cyA9IHRydWU7XG5cdFx0dGhpcy5faW5pdGlhbFRvdWNoID0gdGhpcy5fbGFzdFRvdWNoID0gZ2V0VG91Y2hQcm9wcyhldmVudC50b3VjaGVzWzBdKTtcblx0XHR0aGlzLmluaXRTY3JvbGxEZXRlY3Rpb24oKTtcblx0XHR0aGlzLmluaXRQcmVzc0RldGVjdGlvbih0aGlzLmVuZFRvdWNoKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGlzQWN0aXZlOiB0cnVlXG5cdFx0fSk7XG5cdH0sXG5cdFxuXHRpbml0U2Nyb2xsRGV0ZWN0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl9zY3JvbGxQYXJlbnRzID0gW107XG5cdFx0dGhpcy5fc2Nyb2xsUG9zID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblx0XHR2YXIgbm9kZSA9IHRoaXMuZ2V0RE9NTm9kZSgpO1xuXHRcdHdoaWxlIChub2RlKSB7XG5cdFx0XHRpZiAobm9kZS5zY3JvbGxIZWlnaHQgPiBub2RlLm9mZnNldEhlaWdodCB8fCBub2RlLnNjcm9sbFdpZHRoID4gbm9kZS5vZmZzZXRXaWR0aCkge1xuXHRcdFx0XHR0aGlzLl9zY3JvbGxQYXJlbnRzLnB1c2gobm9kZSk7XG5cdFx0XHRcdHRoaXMuX3Njcm9sbFBvcy50b3AgKz0gbm9kZS5zY3JvbGxUb3A7XG5cdFx0XHRcdHRoaXMuX3Njcm9sbFBvcy5sZWZ0ICs9IG5vZGUuc2Nyb2xsTGVmdDtcblx0XHRcdH1cblx0XHRcdG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdFx0fVxuXHR9LFxuXHRcblx0Y2FsY3VsYXRlTW92ZW1lbnQ6IGZ1bmN0aW9uKHRvdWNoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHg6IE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSB0aGlzLl9pbml0aWFsVG91Y2guY2xpZW50WCksXG5cdFx0XHR5OiBNYXRoLmFicyh0b3VjaC5jbGllbnRZIC0gdGhpcy5faW5pdGlhbFRvdWNoLmNsaWVudFkpXG5cdFx0fTtcblx0fSxcblx0XG5cdGRldGVjdFNjcm9sbDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGN1cnJlbnRTY3JvbGxQb3MgPSB7IHRvcDogMCwgbGVmdDogMCB9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fc2Nyb2xsUGFyZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y3VycmVudFNjcm9sbFBvcy50b3AgKz0gdGhpcy5fc2Nyb2xsUGFyZW50c1tpXS5zY3JvbGxUb3A7XG5cdFx0XHRjdXJyZW50U2Nyb2xsUG9zLmxlZnQgKz0gdGhpcy5fc2Nyb2xsUGFyZW50c1tpXS5zY3JvbGxMZWZ0O1xuXHRcdH1cblx0XHRyZXR1cm4gIShjdXJyZW50U2Nyb2xsUG9zLnRvcCA9PT0gdGhpcy5fc2Nyb2xsUG9zLnRvcCAmJiBjdXJyZW50U2Nyb2xsUG9zLmxlZnQgPT09IHRoaXMuX3Njcm9sbFBvcy5sZWZ0KTtcblx0fSxcblx0XG5cdGNsZWFudXBTY3JvbGxEZXRlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX3Njcm9sbFBhcmVudHMgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5fc2Nyb2xsUG9zID0gdW5kZWZpbmVkO1xuXHR9LFxuXHRcblx0aW5pdFByZXNzRGV0ZWN0aW9uOiBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRcdGlmICghdGhpcy5wcm9wcy5vblByZXNzKSByZXR1cm47XG5cdFx0dGhpcy5fcHJlc3NUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMucHJvcHMub25QcmVzcygpO1xuXHRcdFx0Y2FsbGJhY2soKTtcblx0XHR9LmJpbmQodGhpcyksIHRoaXMucHJvcHMucHJlc3NEZWxheSk7XG5cdH0sXG5cdFxuXHRjYW5jZWxQcmVzc0RldGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KHRoaXMuX3ByZXNzVGltZW91dCk7XG5cdH0sXG5cdFxuXHRvblRvdWNoTW92ZTogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRpZiAoIXRoaXMuX2luaXRpYWxUb3VjaCkgcmV0dXJuO1xuXHRcdHRoaXMucHJvY2Vzc0V2ZW50KGV2ZW50KTtcblx0XHRpZiAodGhpcy5kZXRlY3RTY3JvbGwoKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZW5kVG91Y2goZXZlbnQpO1xuXHRcdH1cblx0XHR0aGlzLnByb3BzLm9uVG91Y2hNb3ZlICYmIHRoaXMucHJvcHMub25Ub3VjaE1vdmUoZXZlbnQpO1xuXHRcdHRoaXMuX2xhc3RUb3VjaCA9IGdldFRvdWNoUHJvcHMoZXZlbnQudG91Y2hlc1swXSk7XG5cdFx0dmFyIG1vdmVtZW50ID0gdGhpcy5jYWxjdWxhdGVNb3ZlbWVudCh0aGlzLl9sYXN0VG91Y2gpO1xuXHRcdGlmIChtb3ZlbWVudC54ID4gdGhpcy5wcm9wcy5wcmVzc01vdmVUaHJlc2hvbGQgfHwgbW92ZW1lbnQueSA+IHRoaXMucHJvcHMucHJlc3NNb3ZlVGhyZXNob2xkKSB7XG5cdFx0XHR0aGlzLmNhbmNlbFByZXNzRGV0ZWN0aW9uKCk7XG5cdFx0fVxuXHRcdGlmIChtb3ZlbWVudC54ID4gdGhpcy5wcm9wcy5tb3ZlVGhyZXNob2xkIHx8IG1vdmVtZW50LnkgPiB0aGlzLnByb3BzLm1vdmVUaHJlc2hvbGQpIHtcblx0XHRcdGlmICh0aGlzLnN0YXRlLmlzQWN0aXZlKSB7XG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRcdGlzQWN0aXZlOiBmYWxzZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCF0aGlzLnN0YXRlLmlzQWN0aXZlKSB7XG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRcdGlzQWN0aXZlOiB0cnVlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0XG5cdG9uVG91Y2hFbmQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKCF0aGlzLl9pbml0aWFsVG91Y2gpIHJldHVybjtcblx0XHR0aGlzLnByb2Nlc3NFdmVudChldmVudCk7XG5cdFx0dmFyIG1vdmVtZW50ID0gdGhpcy5jYWxjdWxhdGVNb3ZlbWVudCh0aGlzLl9sYXN0VG91Y2gpO1xuXHRcdGlmIChtb3ZlbWVudC54IDw9IHRoaXMucHJvcHMubW92ZVRocmVzaG9sZCAmJiBtb3ZlbWVudC55IDw9IHRoaXMucHJvcHMubW92ZVRocmVzaG9sZCkge1xuXHRcdFx0dGhpcy5wcm9wcy5vblRhcCAmJiB0aGlzLnByb3BzLm9uVGFwKGV2ZW50KTtcblx0XHR9XG5cdFx0dGhpcy5lbmRUb3VjaChldmVudCk7XG5cdH0sXG5cdFxuXHRlbmRUb3VjaDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jYW5jZWxQcmVzc0RldGVjdGlvbigpO1xuXHRcdHRoaXMucHJvcHMub25Ub3VjaEVuZCAmJiB0aGlzLnByb3BzLm9uVG91Y2hFbmQoZXZlbnQpO1xuXHRcdHRoaXMuX2luaXRpYWxUb3VjaCA9IG51bGw7XG5cdFx0dGhpcy5fbGFzdFRvdWNoID0gbnVsbDtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGlzQWN0aXZlOiBmYWxzZVxuXHRcdH0pO1xuXHR9LFxuXHRcblx0b25Nb3VzZURvd246IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKHdpbmRvdy5fYmxvY2tNb3VzZUV2ZW50cykge1xuXHRcdFx0d2luZG93Ll9ibG9ja01vdXNlRXZlbnRzID0gZmFsc2U7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmICh0aGlzLnByb3BzLm9uTW91c2VEb3duICYmIHRoaXMucHJvcHMub25Nb3VzZURvd24oZXZlbnQpID09PSBmYWxzZSkgcmV0dXJuO1xuXHRcdHRoaXMucHJvY2Vzc0V2ZW50KGV2ZW50KTtcblx0XHR0aGlzLmluaXRQcmVzc0RldGVjdGlvbih0aGlzLmVuZE1vdXNlRXZlbnQpO1xuXHRcdHRoaXMuX21vdXNlRG93biA9IHRydWU7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRpc0FjdGl2ZTogdHJ1ZVxuXHRcdH0pO1xuXHR9LFxuXHRcblx0b25Nb3VzZU1vdmU6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKHdpbmRvdy5fYmxvY2tNb3VzZUV2ZW50cyB8fCAhdGhpcy5fbW91c2VEb3duKSByZXR1cm47XG5cdFx0dGhpcy5wcm9jZXNzRXZlbnQoZXZlbnQpO1xuXHRcdHRoaXMucHJvcHMub25Nb3VzZU1vdmUgJiYgdGhpcy5wcm9wcy5vbk1vdXNlTW92ZShldmVudCk7XG5cdH0sXG5cdFxuXHRvbk1vdXNlVXA6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKHdpbmRvdy5fYmxvY2tNb3VzZUV2ZW50cyB8fCAhdGhpcy5fbW91c2VEb3duKSByZXR1cm47XG5cdFx0dGhpcy5wcm9jZXNzRXZlbnQoZXZlbnQpO1xuXHRcdHRoaXMucHJvcHMub25Nb3VzZVVwICYmIHRoaXMucHJvcHMub25Nb3VzZVVwKGV2ZW50KTtcblx0XHR0aGlzLnByb3BzLm9uVGFwICYmIHRoaXMucHJvcHMub25UYXAoZXZlbnQpO1xuXHRcdHRoaXMuZW5kTW91c2VFdmVudCgpO1xuXHR9LFxuXHRcblx0b25Nb3VzZU91dDogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRpZiAod2luZG93Ll9ibG9ja01vdXNlRXZlbnRzIHx8ICF0aGlzLl9tb3VzZURvd24pIHJldHVybjtcblx0XHR0aGlzLnByb2Nlc3NFdmVudChldmVudCk7XG5cdFx0dGhpcy5wcm9wcy5vbk1vdXNlT3V0ICYmIHRoaXMucHJvcHMub25Nb3VzZU91dChldmVudCk7XG5cdFx0dGhpcy5lbmRNb3VzZUV2ZW50KCk7XG5cdH0sXG5cdFxuXHRlbmRNb3VzZUV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNhbmNlbFByZXNzRGV0ZWN0aW9uKCk7XG5cdFx0dGhpcy5fbW91c2VEb3duID0gZmFsc2U7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRpc0FjdGl2ZTogZmFsc2Vcblx0XHR9KTtcblx0fSxcblx0XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0XG5cdFx0dmFyIGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY2xhc3NCYXNlICsgKHRoaXMuc3RhdGUuaXNBY3RpdmUgPyAnLWFjdGl2ZScgOiAnLWluYWN0aXZlJyk7XG5cdFx0aWYgKHRoaXMucHJvcHMuY2xhc3NOYW1lKSB7XG5cdFx0XHRjbGFzc05hbWUgKz0gJyAnICsgdGhpcy5wcm9wcy5jbGFzc05hbWU7XG5cdFx0fVxuXHRcdFxuXHRcdHZhciBzdHlsZSA9IHtcblx0XHRcdFdlYmtpdFRhcEhpZ2hsaWdodENvbG9yOiAncmdiYSgwLDAsMCwwKScsXG5cdFx0XHRXZWJraXRUb3VjaENhbGxvdXQ6ICdub25lJyxcblx0XHRcdFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcblx0XHRcdEtodG1sVXNlclNlbGVjdDogJ25vbmUnLFxuXHRcdFx0TW96VXNlclNlbGVjdDogJ25vbmUnLFxuXHRcdFx0bXNVc2VyU2VsZWN0OiAnbm9uZScsXG5cdFx0XHR1c2VyU2VsZWN0OiAnbm9uZScsXG5cdFx0XHRjdXJzb3I6ICdwb2ludGVyJ1xuXHRcdH07XG5cdFx0XG5cdFx0ZXh0ZW5kKHN0eWxlLCB0aGlzLnByb3BzLnN0eWxlKTtcblx0XHRcblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCh0aGlzLnByb3BzLmNvbXBvbmVudCwge1xuXHRcdFx0c3R5bGU6IHN0eWxlLFxuXHRcdFx0Y2xhc3NOYW1lOiBjbGFzc05hbWUsXG5cdFx0XHRkaXNhYmxlZDogdGhpcy5wcm9wcy5kaXNhYmxlZCxcblx0XHRcdG9uVG91Y2hTdGFydDogdGhpcy5vblRvdWNoU3RhcnQsXG5cdFx0XHRvblRvdWNoTW92ZTogdGhpcy5vblRvdWNoTW92ZSxcblx0XHRcdG9uVG91Y2hFbmQ6IHRoaXMub25Ub3VjaEVuZCxcblx0XHRcdG9uTW91c2VEb3duOiB0aGlzLm9uTW91c2VEb3duLFxuXHRcdFx0b25Nb3VzZU1vdmU6IHRoaXMub25Nb3VzZU1vdmUsXG5cdFx0XHRvbk1vdXNlVXA6IHRoaXMub25Nb3VzZVVwLFxuXHRcdFx0b25Nb3VzZU91dDogdGhpcy5vbk1vdXNlT3V0XG5cdFx0fSwgdGhpcy5wcm9wcy5jaGlsZHJlbik7XG5cdFx0XG5cdH1cblx0XG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gVGltZXJzKCkge1xuICB2YXIgaW50ZXJ2YWxzID0gW11cbiAgdmFyIHRpbWVvdXRzID0gW11cblxuICByZXR1cm4ge1xuICAgIGNsZWFySW50ZXJ2YWxzOiBmdW5jdGlvbigpIHtcbiAgICAgIGludGVydmFscy5tYXAoY2xlYXJJbnRlcnZhbClcbiAgICB9LFxuXG4gICAgY2xlYXJUaW1lb3V0czogZnVuY3Rpb24oKSB7XG4gICAgICB0aW1lb3V0cy5tYXAoY2xlYXJUaW1lb3V0KVxuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaW50ZXJ2YWxzID0gW11cbiAgICAgIHRpbWVvdXRzID0gW11cbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5jbGVhckludGVydmFscygpXG4gICAgICB0aGlzLmNsZWFyVGltZW91dHMoKVxuICAgIH0sXG5cbiAgICBzZXRJbnRlcnZhbDogZnVuY3Rpb24oY2FsbGJhY2ssIGludGVydmFsKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgaW50ZXJ2YWxzLnB1c2goc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghc2VsZi5pc01vdW50ZWQoKSkgcmV0dXJuXG5cbiAgICAgICAgY2FsbGJhY2soKVxuICAgICAgfSwgaW50ZXJ2YWwpKVxuICAgIH0sXG5cbiAgICBzZXRJbnRlcnZhbFdhaXQ6IGZ1bmN0aW9uKGNhbGxiYWNrLCBpbnRlcnZhbCkge1xuICAgICAgdmFyIGFjdGl2ZSA9IGZhbHNlXG4gICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgaW50ZXJ2YWxzLnB1c2goc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChhY3RpdmUpIHJldHVyblxuICAgICAgICBpZiAoIXNlbGYuaXNNb3VudGVkKCkpIHJldHVyblxuXG4gICAgICAgIGFjdGl2ZSA9IHRydWVcbiAgICAgICAgY2FsbGJhY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYWN0aXZlID0gZmFsc2VcbiAgICAgICAgfSlcbiAgICAgIH0sIGludGVydmFsKSlcbiAgICB9LFxuXG4gICAgc2V0VGltZW91dDogZnVuY3Rpb24oY2FsbGJhY2ssIHRpbWVvdXQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpc1xuXG4gICAgICB0aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghc2VsZi5pc01vdW50ZWQoKSkgcmV0dXJuXG5cbiAgICAgICAgY2FsbGJhY2soKVxuICAgICAgfSwgdGltZW91dCkpXG4gICAgfVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0Y3JlYXRlQXBwOiByZXF1aXJlKCcuL2xpYi9jcmVhdGVBcHAnKSxcblx0TmF2aWdhdGlvbjogcmVxdWlyZSgnLi9saWIvbWl4aW5zL05hdmlnYXRpb24nKSxcblx0TGluazogcmVxdWlyZSgnLi9saWIvY29tcG9uZW50cy9MaW5rJyksXG5cdFVJOiByZXF1aXJlKCcuL2xpYi91aScpXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyk7XG52YXIgTmF2aWdhdGlvbiA9IHJlcXVpcmUoJy4uL21peGlucy9OYXZpZ2F0aW9uJyk7XG5cbnZhciB0cmFuc2l0aW9ucyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy90cmFuc2l0aW9ucycpO1xudmFyIHZhbGlkVHJhbnNpdGlvbnMgPSBPYmplY3Qua2V5cyh0cmFuc2l0aW9ucyk7XG5cbi8qKlxuICogVG91Y2hzdG9uZSBMaW5rIENvbXBvbmVudFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0xpbmsnLFxuXG5cdG1peGluczogW05hdmlnYXRpb25dLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdHRvOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG5cdFx0cGFyYW1zOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxuXHRcdHZpZXdUcmFuc2l0aW9uOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YodmFsaWRUcmFuc2l0aW9ucyksXG5cdFx0Y29tcG9uZW50OiBSZWFjdC5Qcm9wVHlwZXMuYW55LFxuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR2aWV3VHJhbnNpdGlvbjogJ25vbmUnLFxuXHRcdFx0Y29tcG9uZW50OiAnc3Bhbidcblx0XHR9O1xuXHR9LFxuXG5cdGFjdGlvbjogZnVuY3Rpb24gYWN0aW9uKCkge1xuXHRcdHZhciBwYXJhbXMgPSB0aGlzLnByb3BzLnBhcmFtcztcblxuXHRcdGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgcGFyYW1zKSB7XG5cdFx0XHRwYXJhbXMgPSBwYXJhbXMuY2FsbCh0aGlzKTtcblx0XHR9XG5cblx0XHR0aGlzLnNob3dWaWV3KHRoaXMucHJvcHMudG8sIHRoaXMucHJvcHMudmlld1RyYW5zaXRpb24sIHBhcmFtcyk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRUYXBwYWJsZSxcblx0XHRcdHsgb25UYXA6IHRoaXMuYWN0aW9uLCBjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLCBjb21wb25lbnQ6IHRoaXMucHJvcHMuY29tcG9uZW50IH0sXG5cdFx0XHR0aGlzLnByb3BzLmNoaWxkcmVuXG5cdFx0KTtcblx0fVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAnbm9uZSc6IHtcbiAgICAnaW4nOiBmYWxzZSxcbiAgICAnb3V0JzogZmFsc2VcbiAgfSxcbiAgJ2ZhZGUnOiB7XG4gICAgJ2luJzogdHJ1ZSxcbiAgICAnb3V0JzogdHJ1ZVxuICB9LFxuICAnZmFkZS1jb250cmFjdCc6IHtcbiAgICAnaW4nOiB0cnVlLFxuICAgICdvdXQnOiB0cnVlXG4gIH0sXG4gICdmYWRlLWV4cGFuZCc6IHtcbiAgICAnaW4nOiB0cnVlLFxuICAgICdvdXQnOiB0cnVlXG4gIH0sXG4gICdzaG93LWZyb20tbGVmdCc6IHtcbiAgICAnaW4nOiB0cnVlLFxuICAgICdvdXQnOiB0cnVlXG4gIH0sXG4gICdzaG93LWZyb20tcmlnaHQnOiB7XG4gICAgJ2luJzogdHJ1ZSxcbiAgICAnb3V0JzogdHJ1ZVxuICB9LFxuICAnc2hvdy1mcm9tLXRvcCc6IHtcbiAgICAnaW4nOiB0cnVlLFxuICAgICdvdXQnOiB0cnVlXG4gIH0sXG4gICdzaG93LWZyb20tYm90dG9tJzoge1xuICAgICdpbic6IHRydWUsXG4gICAgJ291dCc6IHRydWVcbiAgfSxcbiAgJ3JldmVhbC1mcm9tLWxlZnQnOiB7XG4gICAgJ2luJzogdHJ1ZSxcbiAgICAnb3V0JzogdHJ1ZVxuICB9LFxuICAncmV2ZWFsLWZyb20tcmlnaHQnOiB7XG4gICAgJ2luJzogdHJ1ZSxcbiAgICAnb3V0JzogdHJ1ZVxuICB9LFxuICAncmV2ZWFsLWZyb20tdG9wJzoge1xuICAgICdpbic6IGZhbHNlLFxuICAgICdvdXQnOiB0cnVlXG4gIH0sXG4gICdyZXZlYWwtZnJvbS1ib3R0b20nOiB7XG4gICAgJ2luJzogZmFsc2UsXG4gICAgJ291dCc6IHRydWVcbiAgfVxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciB4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kL211dGFibGUnKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIFVJID0gcmVxdWlyZSgnLi91aScpO1xudmFyIFRyYW5zaXRpb24gPSByZXF1aXJlKCcuL21peGlucy9UcmFuc2l0aW9uJyk7XG5cbi8qKlxuICogVG91Y2hzdG9uZSBBcHBcbiAqID09PT09PT09PT09PT09XG4gKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgY2FsbGVkIHdpdGggeW91ciBhcHAncyB2aWV3cy5cbiAqXG4gKiBJdCByZXR1cm5zIGEgTWl4aW4gd2hpY2ggc2hvdWxkIGJlIGFkZGVkIHRvIHlvdXIgQXBwLlxuICovXG5mdW5jdGlvbiBjcmVhdGVBcHAoYXJnVmlld3MpIHtcblx0dmFyIHZpZXdGYWN0b3JpZXMgPSB7fTtcblxuXHRmb3IgKHZhciB2aWV3TmFtZSBpbiBhcmdWaWV3cykge1xuXHRcdHZhciB2aWV3ID0gYXJnVmlld3Nbdmlld05hbWVdO1xuXG5cdFx0dmlld0ZhY3Rvcmllc1t2aWV3TmFtZV0gPSBSZWFjdC5jcmVhdGVGYWN0b3J5KHZpZXcpO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRtaXhpbnM6IFtUcmFuc2l0aW9uXSxcblxuXHRcdGNvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24gY29tcG9uZW50V2lsbE1vdW50KCkge1xuXHRcdFx0dGhpcy52aWV3cyA9IHZpZXdGYWN0b3JpZXM7XG5cdFx0fSxcblxuXHRcdGNoaWxkQ29udGV4dFR5cGVzOiB7XG5cdFx0XHRjdXJyZW50VmlldzogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRcdGFwcDogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkXG5cdFx0fSxcblxuXHRcdGdldENoaWxkQ29udGV4dDogZnVuY3Rpb24gZ2V0Q2hpbGRDb250ZXh0KCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y3VycmVudFZpZXc6IHRoaXMuc3RhdGUuY3VycmVudFZpZXcsXG5cdFx0XHRcdGFwcDogdGhpc1xuXHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0Z2V0Q3VycmVudFZpZXc6IGZ1bmN0aW9uIGdldEN1cnJlbnRWaWV3KCkge1xuXHRcdFx0dmFyIHZpZXdzRGF0YSA9IHt9O1xuXHRcdFx0dmlld3NEYXRhW3RoaXMuc3RhdGUuY3VycmVudFZpZXddID0gdGhpcy5nZXRWaWV3KHRoaXMuc3RhdGUuY3VycmVudFZpZXcpO1xuXG5cdFx0XHRyZXR1cm4gUmVhY3QuYWRkb25zLmNyZWF0ZUZyYWdtZW50KHZpZXdzRGF0YSk7XG5cdFx0fSxcblxuXHRcdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gZ2V0SW5pdGlhbFN0YXRlKCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dmlld1RyYW5zaXRpb246IHRoaXMuZ2V0Q1NTVHJhbnNpdGlvbigpXG5cdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRnZXRWaWV3OiBmdW5jdGlvbiBnZXRWaWV3KGtleSkge1xuXHRcdFx0dmFyIHZpZXcgPSB2aWV3RmFjdG9yaWVzW2tleV07XG5cdFx0XHRpZiAoIXZpZXcpIHJldHVybiB0aGlzLmdldFZpZXdOb3RGb3VuZCgpO1xuXG5cdFx0XHR2YXIgcHJvcHMgPSB4dGVuZCh7IGtleToga2V5IH0sIHRoaXMuc3RhdGUuY3VycmVudFZpZXdQcm9wcyk7XG5cblx0XHRcdGlmICh0aGlzLmdldFZpZXdQcm9wcykge1xuXHRcdFx0XHR4dGVuZChwcm9wcywgdGhpcy5nZXRWaWV3UHJvcHMoKSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB2aWV3KHByb3BzKTtcblx0XHR9LFxuXG5cdFx0Z2V0Vmlld05vdEZvdW5kOiBmdW5jdGlvbiBnZXRWaWV3Tm90Rm91bmQoKSB7XG5cdFx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0VUkuVmlldyxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRVSS5WaWV3Q29udGVudCxcblx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoVUkuRmVlZGJhY2ssIHtcblx0XHRcdFx0XHRcdGljb25OYW1lOiAnaW9uLWFsZXJ0LWNpcmNsZWQnLFxuXHRcdFx0XHRcdFx0aWNvblR5cGU6ICdkYW5nZXInLFxuXHRcdFx0XHRcdFx0dGV4dDogJ1NvcnJ5LCB0aGUgdmlldyA8c3Ryb25nPlwiJyArIHRoaXMuc3RhdGUuY3VycmVudFZpZXcgKyAnXCI8L3N0cm9uZz4gaXMgbm90IGF2YWlsYWJsZS4nLFxuXHRcdFx0XHRcdFx0YWN0aW9uVGV4dDogJ09rYXksIHRha2UgbWUgaG9tZScsXG5cdFx0XHRcdFx0XHRhY3Rpb25GbjogdGhpcy5nb3RvRGVmYXVsdFZpZXdcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpXG5cdFx0XHQpO1xuXHRcdH0sXG5cblx0XHRzaG93VmlldzogZnVuY3Rpb24gc2hvd1ZpZXcoa2V5LCB0cmFuc2l0aW9uLCBwcm9wcywgc3RhdGUpIHtcblx0XHRcdGlmICh0eXBlb2YgdHJhbnNpdGlvbiA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0cHJvcHMgPSB0cmFuc2l0aW9uO1xuXHRcdFx0XHR0cmFuc2l0aW9uID0gJ25vbmUnO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodHlwZW9mIHRyYW5zaXRpb24gIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHRyYW5zaXRpb24gPSAnbm9uZSc7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnNvbGUubG9nKCdTaG93aW5nIHZpZXcgfCcgKyBrZXkgKyAnfCB3aXRoIHRyYW5zaXRpb24gfCcgKyB0cmFuc2l0aW9uICsgJ3wgYW5kIHByb3BzICcgKyBKU09OLnN0cmluZ2lmeShwcm9wcykpO1xuXG5cdFx0XHR2YXIgbmV3U3RhdGUgPSB4dGVuZCh7XG5cdFx0XHRcdGN1cnJlbnRWaWV3OiBrZXksXG5cdFx0XHRcdGN1cnJlbnRWaWV3UHJvcHM6IHByb3BzLFxuXHRcdFx0XHRwcmV2aW91c1ZpZXc6IHRoaXMuc3RhdGUuY3VycmVudFZpZXcsXG5cdFx0XHRcdHZpZXdUcmFuc2l0aW9uOiB0aGlzLmdldENTU1RyYW5zaXRpb24odHJhbnNpdGlvbilcblx0XHRcdH0sIHN0YXRlKTtcblxuXHRcdFx0dGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XG5cdFx0fVxuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUFwcDsiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cInV0Zi04XCI/PicgKyAnPCFET0NUWVBFIHN2ZyBQVUJMSUMgXCItLy9XM0MvL0RURCBTVkcgMS4xLy9FTlwiIFwiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkXCI+JyArICc8c3ZnIHZlcnNpb249XCIxLjFcIiBpZD1cIkxheWVyXzFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeD1cIjBweFwiIHk9XCIwcHhcIicgKyAnXFx0IHZpZXdCb3g9XCItMjQyIDE4My40IDkwIDY1LjRcIiBlbmFibGUtYmFja2dyb3VuZD1cIm5ldyAtMjQyIDE4My40IDkwIDY1LjRcIiB4bWw6c3BhY2U9XCJwcmVzZXJ2ZVwiPicgKyAnPHBhdGggY2xhc3M9XCJzdmctcGF0aFwiIGQ9XCJNLTE2NiwxODMuNEgtMjA1Yy0zLjgsMC03LjQsMS41LTEwLjEsNC4ybC0yNS42LDI1LjZjLTEuNiwxLjYtMS42LDQuMiwwLDUuOGwyNS42LDI1LjZjMi43LDIuNyw2LjMsNC4yLDEwLjEsNC4yaDM5LjEnICsgJ1xcdGM3LjksMCwxNC02LjQsMTQtMTQuM3YtMzYuOEMtMTUyLDE4OS44LTE1OC4xLDE4My40LTE2NiwxODMuNCBNLTE2OS44LDIyOC40bC00LjMsNC4zbC0xMi4zLTEyLjNsLTEyLjMsMTIuM2wtNC4zLTQuM2wxMi4zLTEyLjMnICsgJ1xcdGwtMTIuMy0xMi4zbDQuMy00LjNsMTIuMywxMi4zbDEyLjMtMTIuM2w0LjMsNC4zbC0xMi4zLDEyLjNMLTE2OS44LDIyOC40elwiLz4nICsgJzwvc3ZnPic7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcblxuLyoqXG4gKiBUb3VjaHN0b25lIE5hdmlnYXRpb24gTWl4aW5cbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG5cdGRpc3BsYXlOYW1lOiAnTmF2aWdhdGlvbicsXG5cblx0Y29udGV4dFR5cGVzOiB7XG5cdFx0Y3VycmVudFZpZXc6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0YXBwOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWRcblx0fSxcblxuXHRzaG93VmlldzogZnVuY3Rpb24gc2hvd1ZpZXcoKSB7XG5cdFx0dGhpcy5jb250ZXh0LmFwcC5zaG93Vmlldy5hcHBseSh0aGlzLmNvbnRleHQuYXBwLCBhcmd1bWVudHMpO1xuXHR9LFxuXG5cdHNob3dWaWV3Rm46IGZ1bmN0aW9uIHNob3dWaWV3Rm4oKSB7XG5cdFx0dmFyIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0cmV0dXJuIChmdW5jdGlvbiAoKSB7XG5cdFx0XHR0aGlzLmNvbnRleHQuYXBwLnNob3dWaWV3LmFwcGx5KHRoaXMuY29udGV4dC5hcHAsIGFyZ3MpO1xuXHRcdH0pLmJpbmQodGhpcyk7XG5cdH1cblxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciB4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kL211dGFibGUnKTtcbnZhciB0cmFuc2l0aW9ucyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy90cmFuc2l0aW9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0Q1NTVHJhbnNpdGlvbjogZnVuY3Rpb24gZ2V0Q1NTVHJhbnNpdGlvbihrZXkpIHtcblx0XHRrZXkgPSBrZXkgaW4gdHJhbnNpdGlvbnMgPyBrZXkgOiAnbm9uZSc7XG5cblx0XHRyZXR1cm4geHRlbmQoe1xuXHRcdFx0a2V5OiBrZXksXG5cdFx0XHRuYW1lOiAndmlldy10cmFuc2l0aW9uLScgKyBrZXksXG5cdFx0XHQnaW4nOiBmYWxzZSxcblx0XHRcdG91dDogZmFsc2Vcblx0XHR9LCB0cmFuc2l0aW9uc1trZXldKTtcblx0fVxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG52YXIgVmlld0NvbnRlbnQgPSByZXF1aXJlKCcuL1ZpZXdDb250ZW50Jyk7XG5cbnZhciBhbGVydFR5cGVzID0gWydkZWZhdWx0JywgJ3ByaW1hcnknLCAnc3VjY2VzcycsICd3YXJuaW5nJywgJ2RhbmdlciddO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdBbGVydGJhcicsXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRoZWlnaHQ6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0cHVsc2U6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdHR5cGU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihhbGVydFR5cGVzKVxuXHR9LFxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aGVpZ2h0OiAnMzBweCcsXG5cdFx0XHR0eXBlOiAnZGVmYXVsdCdcblx0XHR9O1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gY2xhc3NuYW1lcyh0aGlzLnByb3BzLmNsYXNzTmFtZSwgdGhpcy5wcm9wcy50eXBlLCB7XG5cdFx0XHQnQWxlcnRiYXInOiB0cnVlLFxuXHRcdFx0J3B1bHNlJzogdGhpcy5wcm9wcy5wdWxzZVxuXHRcdH0pO1xuXHRcdHZhciBjb250ZW50ID0gdGhpcy5wcm9wcy5wdWxzZSA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAnQWxlcnRiYXItaW5uZXInIH0sXG5cdFx0XHR0aGlzLnByb3BzLmNoaWxkcmVuXG5cdFx0KSA6IHRoaXMucHJvcHMuY2hpbGRyZW47XG5cblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFZpZXdDb250ZW50LFxuXHRcdFx0eyBoZWlnaHQ6IHRoaXMucHJvcHMuaGVpZ2h0LCBjbGFzc05hbWU6IGNsYXNzTmFtZSB9LFxuXHRcdFx0Y29udGVudFxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgVGFwcGFibGUgPSByZXF1aXJlKCdyZWFjdC10YXBwYWJsZScpO1xuXG52YXIgY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnZXhwb3J0cycsXG5cblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGljb25OYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGljb25UeXBlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGhlYWRlcjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRzdWJoZWFkZXI6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dGV4dDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRhY3Rpb25UZXh0OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGFjdGlvbkZuOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciB2aWV3Q2xhc3NOYW1lID0gY2xhc3NuYW1lcygndmlldy1mZWVkYmFjaycsIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblx0XHR2YXIgaWNvbkNsYXNzTmFtZSA9IGNsYXNzbmFtZXMoJ3ZpZXctZmVlZGJhY2staWNvbicsIHRoaXMucHJvcHMuaWNvbk5hbWUsIHRoaXMucHJvcHMuaWNvblR5cGUpO1xuXG5cdFx0dmFyIGljb24gPSB0aGlzLnByb3BzLmljb25OYW1lID8gUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6IGljb25DbGFzc05hbWUgfSkgOiBudWxsO1xuXHRcdHZhciBoZWFkZXIgPSB0aGlzLnByb3BzLmhlYWRlciA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAndmlldy1mZWVkYmFjay1oZWFkZXInIH0sXG5cdFx0XHR0aGlzLnByb3BzLmhlYWRlclxuXHRcdCkgOiBudWxsO1xuXHRcdHZhciBzdWJoZWFkZXIgPSB0aGlzLnByb3BzLnN1YmhlYWRlciA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAndmlldy1mZWVkYmFjay1zdWJoZWFkZXInIH0sXG5cdFx0XHR0aGlzLnByb3BzLnN1YmhlYWRlclxuXHRcdCkgOiBudWxsO1xuXHRcdHZhciB0ZXh0ID0gdGhpcy5wcm9wcy50ZXh0ID8gUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICd2aWV3LWZlZWRiYWNrLXRleHQnLCBkYW5nZXJvdXNseVNldElubmVySFRNTDogeyBfX2h0bWw6IHRoaXMucHJvcHMudGV4dCB9IH0pIDogbnVsbDtcblx0XHR2YXIgYWN0aW9uID0gdGhpcy5wcm9wcy5hY3Rpb25UZXh0ID8gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFRhcHBhYmxlLFxuXHRcdFx0eyBvblRhcDogdGhpcy5wcm9wcy5hY3Rpb25GbiwgY2xhc3NOYW1lOiAndmlldy1mZWVkYmFjay1hY3Rpb24nIH0sXG5cdFx0XHR0aGlzLnByb3BzLmFjdGlvblRleHRcblx0XHQpIDogbnVsbDtcblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogdmlld0NsYXNzTmFtZSB9LFxuXHRcdFx0aWNvbixcblx0XHRcdGhlYWRlcixcblx0XHRcdHN1YmhlYWRlcixcblx0XHRcdHRleHQsXG5cdFx0XHRhY3Rpb25cblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpLFxuICAgIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyksXG4gICAgVmlld0NvbnRlbnQgPSByZXF1aXJlKCcuL1ZpZXdDb250ZW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0Zvb3RlcmJhcicsXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRoZWlnaHQ6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dHlwZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aGVpZ2h0OiAnNDRweCdcblx0XHR9O1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gY2xhc3NuYW1lcyh0aGlzLnByb3BzLmNsYXNzTmFtZSwgdGhpcy5wcm9wcy50eXBlLCB7XG5cdFx0XHQnRm9vdGVyYmFyJzogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRWaWV3Q29udGVudCxcblx0XHRcdHsgaGVpZ2h0OiB0aGlzLnByb3BzLmhlaWdodCwgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSxcblx0XHRcdHRoaXMucHJvcHMuY2hpbGRyZW5cblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpLFxuICAgIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyksXG4gICAgVGFwcGFibGUgPSByZXF1aXJlKCdyZWFjdC10YXBwYWJsZScpLFxuICAgIE5hdmlnYXRpb24gPSByZXF1aXJlKCcuLi9taXhpbnMvTmF2aWdhdGlvbicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbTmF2aWdhdGlvbl0sXG5cdGRpc3BsYXlOYW1lOiAnQWN0aW9uQnV0dG9uJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGNvbXBvbmVudDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRzaG93VmlldzogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHR2aWV3VHJhbnNpdGlvbjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHR2aWV3UHJvcHM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXG5cdFx0ZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdG9uVGFwOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcblx0XHRhY3RpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdGxhYmVsOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGljb246IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbXBvbmVudDogJ2RpdicsXG5cdFx0XHRkaXNhYmxlZDogZmFsc2UsXG5cdFx0XHRhY3RpdmU6IGZhbHNlXG5cdFx0fTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9IGNsYXNzbmFtZXModGhpcy5wcm9wcy5jbGFzc05hbWUsIHRoaXMucHJvcHMuaWNvbiwge1xuXHRcdFx0J0Zvb3RlcmJhci1idXR0b24nOiB0cnVlLFxuXHRcdFx0J2FjdGl2ZSc6IHRoaXMucHJvcHMuYWN0aXZlLFxuXHRcdFx0J2Rpc2FibGVkJzogdGhpcy5wcm9wcy5kaXNhYmxlZFxuXHRcdH0pO1xuXG5cdFx0dmFyIGxhYmVsID0gdGhpcy5wcm9wcy5sYWJlbCA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAnRm9vdGVyYmFyLWJ1dHRvbi1sYWJlbCcgfSxcblx0XHRcdHRoaXMucHJvcHMubGFiZWxcblx0XHQpIDogbnVsbDtcblx0XHR2YXIgYWN0aW9uID0gdGhpcy5wcm9wcy5zaG93VmlldyA/IHRoaXMuc2hvd1ZpZXdGbih0aGlzLnByb3BzLnNob3dWaWV3LCB0aGlzLnByb3BzLnZpZXdUcmFuc2l0aW9uLCB0aGlzLnByb3BzLnZpZXdQcm9wcykgOiB0aGlzLnByb3BzLm9uVGFwO1xuXG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRUYXBwYWJsZSxcblx0XHRcdHsgY2xhc3NOYW1lOiBjbGFzc05hbWUsIGNvbXBvbmVudDogdGhpcy5wcm9wcy5jb21wb25lbnQsIG9uVGFwOiBhY3Rpb24gfSxcblx0XHRcdGxhYmVsLFxuXHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdIZWFkZXJiYXInLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRoZWlnaHQ6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0bGFiZWw6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0Zml4ZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdHR5cGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gY2xhc3NuYW1lcygnSGVhZGVyYmFyJywgdGhpcy5wcm9wcy5jbGFzc05hbWUsIHRoaXMucHJvcHMudHlwZSwgeyAnZml4ZWQnOiB0aGlzLnByb3BzLmZpeGVkIH0pO1xuXG5cdFx0dmFyIGxhYmVsO1xuXHRcdGlmICh0aGlzLnByb3BzLmxhYmVsICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGxhYmVsID0gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdHsgY2xhc3NOYW1lOiAnSGVhZGVyYmFyLWxhYmVsJyB9LFxuXHRcdFx0XHR0aGlzLnByb3BzLmxhYmVsXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGhlaWdodDogdGhpcy5wcm9wcy5oZWlnaHQsIGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sXG5cdFx0XHR0aGlzLnByb3BzLmNoaWxkcmVuLFxuXHRcdFx0bGFiZWxcblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKTtcblxudmFyIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0hlYWRlcmJhckJ1dHRvbicsXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG5cdFx0aWNvbjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRsYWJlbDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRvblRhcDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG5cdFx0cG9zaXRpb246IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0cHJpbWFyeTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG5cdFx0dmlzaWJsZTogUmVhY3QuUHJvcFR5cGVzLmJvb2xcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dmlzaWJsZTogdHJ1ZSxcblx0XHRcdGRpc2FibGVkOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9IGNsYXNzbmFtZXMoJ0hlYWRlcmJhci1idXR0b24nLCB0aGlzLnByb3BzLmNsYXNzTmFtZSwgdGhpcy5wcm9wcy5wb3NpdGlvbiwgdGhpcy5wcm9wcy5pY29uLCB7XG5cdFx0XHQnaGlkZGVuJzogIXRoaXMucHJvcHMudmlzaWJsZSxcblx0XHRcdCdkaXNhYmxlZCc6IHRoaXMucHJvcHMuZGlzYWJsZWQsXG5cdFx0XHQnaXMtcHJpbWFyeSc6IHRoaXMucHJvcHMucHJpbWFyeVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRUYXBwYWJsZSxcblx0XHRcdHsgb25UYXA6IHRoaXMucHJvcHMub25UYXAsIGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sXG5cdFx0XHR0aGlzLnByb3BzLmxhYmVsLFxuXHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIGJsYWNrbGlzdCA9IHJlcXVpcmUoJ2JsYWNrbGlzdCcpO1xudmFyIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdJbnB1dCcsXG5cdHByb3BUeXBlczoge1xuXHRcdGZpcnN0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAndGV4dCdcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc25hbWVzKCdmaWVsZC1pdGVtIGxpc3QtaXRlbScsIHtcblx0XHRcdCdpcy1maXJzdCc6IHRoaXMucHJvcHMuZmlyc3QsXG5cdFx0XHQndS1zZWxlY3RhYmxlJzogdGhpcy5wcm9wcy5kaXNhYmxlZFxuXHRcdH0sIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblxuXHRcdHZhciBpbnB1dFByb3BzID0gYmxhY2tsaXN0KHRoaXMucHJvcHMsICdjaGlsZHJlbicsICdjbGFzc05hbWUnLCAnZmlyc3QnKTtcblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sXG5cdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0eyBjbGFzc05hbWU6ICdpdGVtLWlubmVyJyB9LFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdCdsYWJlbCcsXG5cdFx0XHRcdFx0eyBjbGFzc05hbWU6ICdpdGVtLWNvbnRlbnQnIH0sXG5cdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudCgnaW5wdXQnLCBfZXh0ZW5kcyh7IGNsYXNzTmFtZTogJ2ZpZWxkJyB9LCBpbnB1dFByb3BzKSlcblx0XHRcdFx0KSxcblx0XHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyksXG4gICAgY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnSXRlbU1lZGlhJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGljb246IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0YXZhdGFyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdHRodW1ibmFpbDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc25hbWVzKHtcblx0XHRcdCdpdGVtLW1lZGlhJzogdHJ1ZSxcblx0XHRcdCdpcy1pY29uJzogdGhpcy5wcm9wcy5pY29uLFxuXHRcdFx0J2lzLWF2YXRhcic6IHRoaXMucHJvcHMuYXZhdGFyIHx8IHRoaXMucHJvcHMuYXZhdGFySW5pdGlhbHMsXG5cdFx0XHQnaXMtdGh1bWJuYWlsJzogdGhpcy5wcm9wcy50aHVtYm5haWxcblx0XHR9LCB0aGlzLnByb3BzLmNsYXNzTmFtZSk7XG5cblx0XHQvLyBtZWRpYSB0eXBlc1xuXHRcdHZhciBpY29uID0gdGhpcy5wcm9wcy5pY29uID8gUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdpdGVtLWljb24gJyArIHRoaXMucHJvcHMuaWNvbiB9KSA6IG51bGw7XG5cdFx0dmFyIGF2YXRhciA9IHRoaXMucHJvcHMuYXZhdGFyIHx8IHRoaXMucHJvcHMuYXZhdGFySW5pdGlhbHMgPyBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogJ2l0ZW0tYXZhdGFyJyB9LFxuXHRcdFx0dGhpcy5wcm9wcy5hdmF0YXIgPyBSZWFjdC5jcmVhdGVFbGVtZW50KCdpbWcnLCB7IHNyYzogdGhpcy5wcm9wcy5hdmF0YXIgfSkgOiB0aGlzLnByb3BzLmF2YXRhckluaXRpYWxzXG5cdFx0KSA6IG51bGw7XG5cdFx0dmFyIHRodW1ibmFpbCA9IHRoaXMucHJvcHMudGh1bWJuYWlsID8gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6ICdpdGVtLXRodW1ibmFpbCcgfSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2ltZycsIHsgc3JjOiB0aGlzLnByb3BzLnRodW1ibmFpbCB9KVxuXHRcdCkgOiBudWxsO1xuXG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSxcblx0XHRcdGljb24sXG5cdFx0XHRhdmF0YXIsXG5cdFx0XHR0aHVtYm5haWxcblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpLFxuICAgIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0l0ZW1Ob3RlJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdHR5cGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0bGFiZWw6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0aWNvbjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZGVmYXVsdCdcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc25hbWVzKHtcblx0XHRcdCdpdGVtLW5vdGUnOiB0cnVlXG5cdFx0fSwgdGhpcy5wcm9wcy50eXBlLCB0aGlzLnByb3BzLmNsYXNzTmFtZSk7XG5cblx0XHQvLyBlbGVtZW50c1xuXHRcdHZhciBsYWJlbCA9IHRoaXMucHJvcHMubGFiZWwgPyBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogJ2l0ZW0tbm90ZS1sYWJlbCcgfSxcblx0XHRcdHRoaXMucHJvcHMubGFiZWxcblx0XHQpIDogbnVsbDtcblx0XHR2YXIgaWNvbiA9IHRoaXMucHJvcHMuaWNvbiA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnaXRlbS1ub3RlLWljb24gJyArIHRoaXMucHJvcHMuaWNvbiB9KSA6IG51bGw7XG5cblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6IGNsYXNzTmFtZSB9LFxuXHRcdFx0bGFiZWwsXG5cdFx0XHRpY29uXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcbnZhciBpY29ucyA9IHtcblx0ZGVsOiByZXF1aXJlKCcuLi9pY29ucy9kZWxldGUnKVxufTtcblxudmFyIFZpZXdDb250ZW50ID0gcmVxdWlyZSgnLi9WaWV3Q29udGVudCcpO1xudmFyIEtleXBhZEJ1dHRvbiA9IHJlcXVpcmUoJy4vS2V5cGFkQnV0dG9uJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnS2V5cGFkJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0YWN0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcblx0XHRjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0c3Rvd2VkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcblx0XHRlbmFibGVEZWw6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdHR5cGU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ2JsYWNrLXRyYW5zbHVjZW50JywgJ3doaXRlLXRyYW5zbHVjZW50J10pLFxuXHRcdHdpbGRrZXk6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2RlZmF1bHQnXG5cdFx0fTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgYWN0aW9uID0gdGhpcy5wcm9wcy5hY3Rpb247XG5cdFx0dmFyIHR5cGVOYW1lID0gJ0tleXBhZC0tJyArIHRoaXMucHJvcHMudHlwZTtcblx0XHR2YXIga2V5cGFkQ2xhc3NOYW1lID0gY2xhc3NuYW1lcyh0aGlzLnByb3BzLmNsYXNzTmFtZSwgdHlwZU5hbWUsICdLZXlwYWQnLCB7XG5cdFx0XHQnaXMtc3Rvd2VkJzogdGhpcy5wcm9wcy5zdG93ZWRcblx0XHR9KTtcblxuXHRcdHZhciB3aWxka2V5O1xuXG5cdFx0aWYgKHRoaXMucHJvcHMud2lsZGtleSA9PT0gJ2RlY2ltYWwnKSB7XG5cdFx0XHR3aWxka2V5ID0gUmVhY3QuY3JlYXRlRWxlbWVudChLZXlwYWRCdXR0b24sIHsgdmFsdWU6ICdkZWNpbWFsJywgcHJpbWFyeUxhYmVsOiAnwrcnLCBhdXg6IHRydWUgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHdpbGRrZXkgPSBSZWFjdC5jcmVhdGVFbGVtZW50KEtleXBhZEJ1dHRvbiwgeyBhdXg6IHRydWUsIGRpc2FibGVkOiB0cnVlIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0Vmlld0NvbnRlbnQsXG5cdFx0XHR7IGNsYXNzTmFtZToga2V5cGFkQ2xhc3NOYW1lIH0sXG5cdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KEtleXBhZEJ1dHRvbiwgeyBhY3Rpb246IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRyZXR1cm4gYWN0aW9uKCcxJyk7XG5cdFx0XHRcdH0sIHByaW1hcnlMYWJlbDogJzEnIH0pLFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChLZXlwYWRCdXR0b24sIHsgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFjdGlvbignMicpO1xuXHRcdFx0XHR9LCBwcmltYXJ5TGFiZWw6ICcyJywgc2Vjb25kYXJ5TGFiZWw6ICdBQkMnIH0pLFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChLZXlwYWRCdXR0b24sIHsgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFjdGlvbignMycpO1xuXHRcdFx0XHR9LCBwcmltYXJ5TGFiZWw6ICczJywgc2Vjb25kYXJ5TGFiZWw6ICdERUYnIH0pLFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChLZXlwYWRCdXR0b24sIHsgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFjdGlvbignNCcpO1xuXHRcdFx0XHR9LCBwcmltYXJ5TGFiZWw6ICc0Jywgc2Vjb25kYXJ5TGFiZWw6ICdHSEknIH0pLFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChLZXlwYWRCdXR0b24sIHsgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFjdGlvbignNScpO1xuXHRcdFx0XHR9LCBwcmltYXJ5TGFiZWw6ICc1Jywgc2Vjb25kYXJ5TGFiZWw6ICdKS0wnIH0pLFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChLZXlwYWRCdXR0b24sIHsgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFjdGlvbignNicpO1xuXHRcdFx0XHR9LCBwcmltYXJ5TGFiZWw6ICc2Jywgc2Vjb25kYXJ5TGFiZWw6ICdNTk8nIH0pLFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChLZXlwYWRCdXR0b24sIHsgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFjdGlvbignNycpO1xuXHRcdFx0XHR9LCBwcmltYXJ5TGFiZWw6ICc3Jywgc2Vjb25kYXJ5TGFiZWw6ICdQUVJTJyB9KSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoS2V5cGFkQnV0dG9uLCB7IGFjdGlvbjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiBhY3Rpb24oJzgnKTtcblx0XHRcdFx0fSwgcHJpbWFyeUxhYmVsOiAnOCcsIHNlY29uZGFyeUxhYmVsOiAnVFVWJyB9KSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoS2V5cGFkQnV0dG9uLCB7IGFjdGlvbjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiBhY3Rpb24oJzknKTtcblx0XHRcdFx0fSwgcHJpbWFyeUxhYmVsOiAnOScsIHNlY29uZGFyeUxhYmVsOiAnV1hZWicgfSksXG5cdFx0XHR3aWxka2V5LFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChLZXlwYWRCdXR0b24sIHsgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFjdGlvbignMCcpO1xuXHRcdFx0XHR9LCBwcmltYXJ5TGFiZWw6ICcwJyB9KSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoS2V5cGFkQnV0dG9uLCB7IGFjdGlvbjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiBhY3Rpb24oJ2RlbGV0ZScpO1xuXHRcdFx0XHR9LCBpY29uOiBpY29ucy5kZWwsIGRpc2FibGVkOiAhdGhpcy5wcm9wcy5lbmFibGVEZWwsIGF1eDogdHJ1ZSB9KVxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnS2V5cGFkQnV0dG9uJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0YWN0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcblx0XHRhdXg6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG5cdFx0aWNvbjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRwcmltYXJ5TGFiZWw6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0c2Vjb25kYXJ5TGFiZWw6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dmFsdWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YWN0aW9uOiBmdW5jdGlvbiBhY3Rpb24oKSB7fVxuXHRcdH07XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9IGNsYXNzbmFtZXMoJ0tleXBhZC1idXR0b24nLCB7XG5cdFx0XHQnaXMtYXV4aWxpYXJ5JzogdGhpcy5wcm9wcy5hdXgsXG5cdFx0XHQnZGlzYWJsZWQnOiB0aGlzLnByb3BzLmRpc2FibGVkXG5cdFx0fSwgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXG5cdFx0dmFyIHByaW1hcnlMYWJlbCA9IHRoaXMucHJvcHMucHJpbWFyeUxhYmVsID8gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6ICdLZXlwYWQtYnV0dG9uLXByaW1hcnktbGFiZWwnIH0sXG5cdFx0XHR0aGlzLnByb3BzLnByaW1hcnlMYWJlbFxuXHRcdCkgOiBudWxsO1xuXHRcdHZhciBzZWNvbmRhcnlMYWJlbCA9IHRoaXMucHJvcHMuc2Vjb25kYXJ5TGFiZWwgPyBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogJ0tleXBhZC1idXR0b24tc2Vjb25kYXJ5LWxhYmVsJyB9LFxuXHRcdFx0dGhpcy5wcm9wcy5zZWNvbmRhcnlMYWJlbFxuXHRcdCkgOiBudWxsO1xuXHRcdHZhciBpY29uID0gdGhpcy5wcm9wcy5pY29uID8gUmVhY3QuY3JlYXRlRWxlbWVudCgnc3BhbicsIHsgY2xhc3NOYW1lOiAnS2V5cGFkLWJ1dHRvbi1pY29uJywgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw6IHsgX19odG1sOiB0aGlzLnByb3BzLmljb24gfSB9KSA6IG51bGw7XG5cblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6ICdLZXlwYWQtY2VsbCcgfSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFRhcHBhYmxlLFxuXHRcdFx0XHR7IG9uVGFwOiB0aGlzLnByb3BzLmFjdGlvbiwgY2xhc3NOYW1lOiBjbGFzc05hbWUsIGNvbXBvbmVudDogJ2RpdicgfSxcblx0XHRcdFx0aWNvbixcblx0XHRcdFx0cHJpbWFyeUxhYmVsLFxuXHRcdFx0XHRzZWNvbmRhcnlMYWJlbFxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG52YXIgY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnTGFiZWxJbnB1dCcsXG5cblx0cHJvcFR5cGVzOiB7XG5cdFx0YWxpZ25Ub3A6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG5cdFx0Zmlyc3Q6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdGxhYmVsOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdHJlYWRPbmx5OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcblx0XHR2YWx1ZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRyZWFkT25seTogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc25hbWVzKHRoaXMucHJvcHMuY2xhc3NOYW1lLCAnbGlzdC1pdGVtJywgJ2ZpZWxkLWl0ZW0nLCB7XG5cdFx0XHQnYWxpZ24tdG9wJzogdGhpcy5wcm9wcy5hbGlnblRvcCxcblx0XHRcdCdpcy1maXJzdCc6IHRoaXMucHJvcHMuZmlyc3QsXG5cdFx0XHQndS1zZWxlY3RhYmxlJzogdGhpcy5wcm9wcy5kaXNhYmxlZFxuXHRcdH0pO1xuXG5cdFx0dmFyIHByb3BzID0gYmxhY2tsaXN0KHRoaXMucHJvcHMsICdhbGlnblRvcCcsICdjaGlsZHJlbicsICdmaXJzdCcsICdyZWFkT25seScpO1xuXHRcdHZhciByZW5kZXJJbnB1dCA9IHRoaXMucHJvcHMucmVhZE9ubHkgPyBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogJ2ZpZWxkIHUtc2VsZWN0YWJsZScgfSxcblx0XHRcdHRoaXMucHJvcHMudmFsdWVcblx0XHQpIDogUmVhY3QuY3JlYXRlRWxlbWVudCgnaW5wdXQnLCBfZXh0ZW5kcyh7IGNsYXNzTmFtZTogJ2ZpZWxkJyB9LCBwcm9wcykpO1xuXG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnbGFiZWwnLFxuXHRcdFx0eyBjbGFzc05hbWU6IGNsYXNzTmFtZSB9LFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdHsgY2xhc3NOYW1lOiAnaXRlbS1pbm5lcicgfSxcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ2ZpZWxkLWxhYmVsJyB9LFxuXHRcdFx0XHRcdHRoaXMucHJvcHMubGFiZWxcblx0XHRcdFx0KSxcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ2ZpZWxkLWNvbnRyb2wnIH0sXG5cdFx0XHRcdFx0cmVuZGVySW5wdXQsXG5cdFx0XHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKSxcbiAgICBjbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdMYWJlbFNlbGVjdCcsXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRsYWJlbDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRmaXJzdDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcblx0fSxcblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNsYXNzTmFtZTogJydcblx0XHR9O1xuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uIGdldEluaXRpYWxTdGF0ZSgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dmFsdWU6IHRoaXMucHJvcHMudmFsdWVcblx0XHR9O1xuXHR9LFxuXHR1cGRhdGVJbnB1dFZhbHVlOiBmdW5jdGlvbiB1cGRhdGVJbnB1dFZhbHVlKGV2ZW50KSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHR2YWx1ZTogZXZlbnQudGFyZ2V0LnZhbHVlXG5cdFx0fSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdC8vIFNldCBDbGFzc2VzXG5cdFx0dmFyIGNsYXNzTmFtZSA9IGNsYXNzbmFtZXModGhpcy5wcm9wcy5jbGFzc05hbWUsIHtcblx0XHRcdCdsaXN0LWl0ZW0nOiB0cnVlLFxuXHRcdFx0J2lzLWZpcnN0JzogdGhpcy5wcm9wcy5maXJzdFxuXHRcdH0pO1xuXG5cdFx0Ly8gTWFwIE9wdGlvbnNcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMucHJvcHMub3B0aW9ucy5tYXAoKGZ1bmN0aW9uIChvcCkge1xuXHRcdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdvcHRpb24nLFxuXHRcdFx0XHR7IGtleTogJ29wdGlvbi0nICsgb3AudmFsdWUsIHZhbHVlOiBvcC52YWx1ZSB9LFxuXHRcdFx0XHRvcC5sYWJlbFxuXHRcdFx0KTtcblx0XHR9KS5iaW5kKHRoaXMpKTtcblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2xhYmVsJyxcblx0XHRcdHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHR7IGNsYXNzTmFtZTogJ2l0ZW0taW5uZXInIH0sXG5cdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdFx0eyBjbGFzc05hbWU6ICdmaWVsZC1sYWJlbCcgfSxcblx0XHRcdFx0XHR0aGlzLnByb3BzLmxhYmVsXG5cdFx0XHRcdCksXG5cdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdFx0eyBjbGFzc05hbWU6ICdmaWVsZC1jb250cm9sJyB9LFxuXHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0XHQnc2VsZWN0Jyxcblx0XHRcdFx0XHRcdHsgdmFsdWU6IHRoaXMuc3RhdGUudmFsdWUsIG9uQ2hhbmdlOiB0aGlzLnVwZGF0ZUlucHV0VmFsdWUsIGNsYXNzTmFtZTogJ3NlbGVjdC1maWVsZCcgfSxcblx0XHRcdFx0XHRcdG9wdGlvbnNcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHRcdHsgY2xhc3NOYW1lOiAnc2VsZWN0LWZpZWxkLWluZGljYXRvcicgfSxcblx0XHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnc2VsZWN0LWZpZWxkLWluZGljYXRvci1hcnJvdycgfSlcblx0XHRcdFx0XHQpXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xuXG52YXIgYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG52YXIgY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnTGFiZWxUZXh0YXJlYScsXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJvd3M6IDNcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc25hbWVzKHRoaXMucHJvcHMuY2xhc3NOYW1lLCAnbGlzdC1pdGVtJywgJ2ZpZWxkLWl0ZW0nLCAnYWxpZ24tdG9wJywge1xuXHRcdFx0J2lzLWZpcnN0JzogdGhpcy5wcm9wcy5maXJzdCxcblx0XHRcdCd1LXNlbGVjdGFibGUnOiB0aGlzLnByb3BzLmRpc2FibGVkXG5cdFx0fSk7XG5cblx0XHR2YXIgcHJvcHMgPSBibGFja2xpc3QodGhpcy5wcm9wcywgJ2NoaWxkcmVuJywgJ2NsYXNzTmFtZScsICdkaXNhYmxlZCcsICdmaXJzdCcsICdsYWJlbCcsICdyZWFkb25seScpO1xuXG5cdFx0dmFyIHJlbmRlcklucHV0ID0gdGhpcy5wcm9wcy5yZWFkb25seSA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAnZmllbGQgdS1zZWxlY3RhYmxlJyB9LFxuXHRcdFx0dGhpcy5wcm9wcy52YWx1ZVxuXHRcdCkgOiBSZWFjdC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScsIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6ICdmaWVsZCcgfSkpO1xuXG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdsYWJlbCcsXG5cdFx0XHRcdHsgY2xhc3NOYW1lOiAnaXRlbS1pbm5lcicgfSxcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ2ZpZWxkLWxhYmVsJyB9LFxuXHRcdFx0XHRcdHRoaXMucHJvcHMubGFiZWxcblx0XHRcdFx0KSxcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ2ZpZWxkLWNvbnRyb2wnIH0sXG5cdFx0XHRcdFx0cmVuZGVySW5wdXQsXG5cdFx0XHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKSxcbiAgICBjbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpLFxuICAgIFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKSxcbiAgICBOYXZpZ2F0aW9uID0gcmVxdWlyZSgnLi4vbWl4aW5zL05hdmlnYXRpb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnTG9hZGluZ0J1dHRvbicsXG5cdG1peGluczogW05hdmlnYXRpb25dLFxuXHRwcm9wVHlwZXM6IHtcblx0XHRjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0c2hvd1ZpZXc6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dmlld1RyYW5zaXRpb246IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dmlld1Byb3BzOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxuXHRcdGNvbXBvbmVudDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRvblRhcDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG5cdFx0dHlwZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG5cdFx0bG9hZGluZzogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG5cdFx0bGFiZWw6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGRpc2FibGVkOiBmYWxzZSxcblx0XHRcdGxvYWRpbmc6IGZhbHNlXG5cdFx0fTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0Ly8gQ2xhc3MgTmFtZVxuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc25hbWVzKHRoaXMucHJvcHMuY2xhc3NOYW1lLCB0aGlzLnByb3BzLnR5cGUsIHtcblx0XHRcdCdsb2FkaW5nLWJ1dHRvbic6IHRydWUsXG5cdFx0XHQnZGlzYWJsZWQnOiB0aGlzLnByb3BzLmRpc2FibGVkLFxuXHRcdFx0J2lzLWxvYWRpbmcnOiB0aGlzLnByb3BzLmxvYWRpbmdcblx0XHR9KTtcblxuXHRcdC8vIFNldCBWYXJpYWJsZXNcblx0XHR2YXIgbGFiZWwgPSB0aGlzLnByb3BzLmxhYmVsICYmICF0aGlzLnByb3BzLmxvYWRpbmcgPyBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogJ2xvYWRpbmctYnV0dG9uLXRleHQnIH0sXG5cdFx0XHR0aGlzLnByb3BzLmxhYmVsXG5cdFx0KSA6IG51bGw7XG5cdFx0dmFyIG9uVGFwID0gdGhpcy5wcm9wcy5zaG93VmlldyA/IHRoaXMuc2hvd1ZpZXdGbih0aGlzLnByb3BzLnNob3dWaWV3LCB0aGlzLnByb3BzLnZpZXdUcmFuc2l0aW9uLCB0aGlzLnByb3BzLnZpZXdQcm9wcykgOiB0aGlzLnByb3BzLm9uVGFwO1xuXHRcdHZhciBsb2FkaW5nRWxlbWVudHMgPSB0aGlzLnByb3BzLmxvYWRpbmcgPyBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J3NwYW4nLFxuXHRcdFx0eyBjbGFzc05hbWU6ICdsb2FkaW5nLWJ1dHRvbi1pY29uLXdyYXBwZXInIH0sXG5cdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KCdzcGFuJywgeyBjbGFzc05hbWU6ICdsb2FkaW5nLWJ1dHRvbi1pY29uJyB9KVxuXHRcdCkgOiBudWxsO1xuXG5cdFx0Ly8gT3V0cHV0IENvbXBvbmVudFxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0VGFwcGFibGUsXG5cdFx0XHR7IGNsYXNzTmFtZTogY2xhc3NOYW1lLCBjb21wb25lbnQ6IHRoaXMucHJvcHMuY29tcG9uZW50LCBvblRhcDogb25UYXAgfSxcblx0XHRcdGxvYWRpbmdFbGVtZW50cyxcblx0XHRcdGxhYmVsLFxuXHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEtleXBhZCA9IHJlcXVpcmUoJy4vS2V5cGFkJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBWaWV3Q29udGVudCA9IHJlcXVpcmUoJy4vVmlld0NvbnRlbnQnKTtcblxudmFyIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1Bhc3Njb2RlJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0YWN0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcblx0XHRjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0a2V5Ym9hcmRJc1N0b3dlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG5cdFx0dHlwZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRoZWxwVGV4dDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjbGFzc05hbWU6ICcnLFxuXHRcdFx0aGVscFRleHQ6ICdFbnRlciB5b3VyIHBhc3Njb2RlJyxcblx0XHRcdHR5cGU6ICdkZWZhdWx0J1xuXHRcdH07XG5cdH0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiBnZXRJbml0aWFsU3RhdGUoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGhlbHBUZXh0OiB0aGlzLnByb3BzLmhlbHBUZXh0LFxuXHRcdFx0a2V5Ym9hcmRJc1N0b3dlZDogdHJ1ZSxcblx0XHRcdHBhc3Njb2RlOiAnJ1xuXHRcdH07XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uIGNvbXBvbmVudERpZE1vdW50KCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdC8vIHNsaWRlIHRoZSBrZXlib2FyZCB1cCBhZnRlciB0aGUgdmlldyBpcyBzaG93blxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCF0aGlzLmlzTW91bnRlZCgpKSByZXR1cm47XG5cblx0XHRcdHNlbGYuc2V0U3RhdGUoeyBrZXlib2FyZElzU3Rvd2VkOiBmYWxzZSB9KTtcblx0XHR9LCA0MDApO1xuXHR9LFxuXG5cdGhhbmRsZVBhc3Njb2RlOiBmdW5jdGlvbiBoYW5kbGVQYXNzY29kZShrZXlDb2RlKSB7XG5cdFx0dmFyIHBhc3Njb2RlID0gdGhpcy5zdGF0ZS5wYXNzY29kZTtcblxuXHRcdGlmIChrZXlDb2RlID09PSAnZGVsZXRlJykge1xuXHRcdFx0cGFzc2NvZGUgPSBwYXNzY29kZS5zbGljZSgwLCAtMSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHBhc3Njb2RlID0gcGFzc2NvZGUuY29uY2F0KGtleUNvZGUpO1xuXHRcdH1cblxuXHRcdGlmIChwYXNzY29kZS5sZW5ndGggIT09IDQpIHtcblx0XHRcdHJldHVybiB0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0cGFzc2NvZGU6IHBhc3Njb2RlXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxmLnByb3BzLmFjdGlvbihwYXNzY29kZSk7XG5cdFx0fSwgMjAwKTsgLy8gdGhlIHRyYW5zaXRpb24gdGhhdCBzdG93cyB0aGUga2V5Ym9hcmQgdGFrZXMgMTUwbXMsIGl0IGZyZWV6ZXMgaWYgaW50ZXJydXB0ZWQgYnkgdGhlIFJlYWN0Q1NTVHJhbnNpdGlvbkdyb3VwXG5cblx0XHR0aGlzLnNldFN0YXRlKHsgcGFzc2NvZGU6IHBhc3Njb2RlIH0pO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBwYXNzY29kZSA9IHRoaXMuc3RhdGUucGFzc2NvZGU7XG5cdFx0dmFyIHBhc3Njb2RlQ2xhc3NuYW1lID0gY2xhc3NuYW1lcygnUGFzc2NvZGUnLCB0aGlzLnByb3BzLnR5cGUpO1xuXHRcdHZhciBwYXNzY29kZUZpZWxkcyA9IFswLCAxLCAyLCAzXS5tYXAoZnVuY3Rpb24gKGkpIHtcblx0XHRcdHZhciBwYXNzY29kZUZpZWxkQ2xhc3NuYW1lID0gY2xhc3NuYW1lcygnUGFzc2NvZGUtaW5wdXQnLCB7XG5cdFx0XHRcdCdoYXMtdmFsdWUnOiBwYXNzY29kZS5sZW5ndGggPiBpXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHR7IGNsYXNzTmFtZTogJ1Bhc3Njb2RlLWZpZWxkJyB9LFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogcGFzc2NvZGVGaWVsZENsYXNzbmFtZSB9KVxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0Vmlld0NvbnRlbnQsXG5cdFx0XHR7IGdyb3c6IHRydWUgfSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHR7IGNsYXNzTmFtZTogcGFzc2NvZGVDbGFzc25hbWUgfSxcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ1Bhc3Njb2RlLWxhYmVsJyB9LFxuXHRcdFx0XHRcdHRoaXMucHJvcHMuaGVscFRleHRcblx0XHRcdFx0KSxcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ1Bhc3Njb2RlLWZpZWxkcycgfSxcblx0XHRcdFx0XHRwYXNzY29kZUZpZWxkc1xuXHRcdFx0XHQpXG5cdFx0XHQpLFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChLZXlwYWQsIHsgdHlwZTogdGhpcy5wcm9wcy50eXBlLCBhY3Rpb246IHRoaXMuaGFuZGxlUGFzc2NvZGUsIGVuYWJsZURlbDogQm9vbGVhbih0aGlzLnN0YXRlLnBhc3Njb2RlLmxlbmd0aCksIHN0b3dlZDogdGhpcy5zdGF0ZS5rZXlib2FyZElzU3Rvd2VkIH0pXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSZWFjdENTU1RyYW5zaXRpb25Hcm91cCA9IFJlYWN0LmFkZG9ucy5DU1NUcmFuc2l0aW9uR3JvdXA7XG52YXIgVHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4uL21peGlucy9UcmFuc2l0aW9uJyk7XG5cbnZhciBjbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdQb3B1cCcsXG5cdG1peGluczogW1RyYW5zaXRpb25dLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHR2aXNpYmxlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0cmFuc2l0aW9uOiAnbm9uZSdcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlckJhY2tkcm9wOiBmdW5jdGlvbiByZW5kZXJCYWNrZHJvcCgpIHtcblx0XHRpZiAoIXRoaXMucHJvcHMudmlzaWJsZSkgcmV0dXJuIG51bGw7XG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnTW9kYWwtYmFja2Ryb3AnIH0pO1xuXHR9LFxuXG5cdHJlbmRlckRpYWxvZzogZnVuY3Rpb24gcmVuZGVyRGlhbG9nKCkge1xuXHRcdGlmICghdGhpcy5wcm9wcy52aXNpYmxlKSByZXR1cm4gbnVsbDtcblxuXHRcdC8vIFNldCBjbGFzc25hbWVzXG5cdFx0dmFyIGRpYWxvZ0NsYXNzTmFtZSA9IGNsYXNzbmFtZXMoJ01vZGFsLWRpYWxvZycsIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogZGlhbG9nQ2xhc3NOYW1lIH0sXG5cdFx0XHR0aGlzLnByb3BzLmNoaWxkcmVuXG5cdFx0KTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6ICdNb2RhbCcgfSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFJlYWN0Q1NTVHJhbnNpdGlvbkdyb3VwLFxuXHRcdFx0XHR7IHRyYW5zaXRpb25OYW1lOiAnTW9kYWwtZGlhbG9nJywgY29tcG9uZW50OiAnZGl2JyB9LFxuXHRcdFx0XHR0aGlzLnJlbmRlckRpYWxvZygpXG5cdFx0XHQpLFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0UmVhY3RDU1NUcmFuc2l0aW9uR3JvdXAsXG5cdFx0XHRcdHsgdHJhbnNpdGlvbk5hbWU6ICdNb2RhbC1iYWNrZ3JvdW5kJywgY29tcG9uZW50OiAnZGl2JyB9LFxuXHRcdFx0XHR0aGlzLnJlbmRlckJhY2tkcm9wKClcblx0XHRcdClcblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIGNsYXNzTmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1BvcHVwSWNvbicsXG5cdHByb3BUeXBlczoge1xuXHRcdG5hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcblx0XHR0eXBlOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWydkZWZhdWx0JywgJ211dGVkJywgJ3ByaW1hcnknLCAnc3VjY2VzcycsICd3YXJuaW5nJywgJ2RhbmdlciddKSxcblx0XHRzcGlubmluZzogUmVhY3QuUHJvcFR5cGVzLmJvb2xcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gY2xhc3NOYW1lcygnTW9kYWwtaWNvbicsIHtcblx0XHRcdCdpcy1zcGlubmluZyc6IHRoaXMucHJvcHMuc3Bpbm5pbmdcblx0XHR9LCB0aGlzLnByb3BzLm5hbWUsIHRoaXMucHJvcHMudHlwZSk7XG5cblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6IGNsYXNzTmFtZSB9KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKTtcblxudmFyIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1JhZGlvTGlzdCcsXG5cblx0cHJvcFR5cGVzOiB7XG5cdFx0b3B0aW9uczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LFxuXHRcdHZhbHVlOiBSZWFjdC5Qcm9wVHlwZXMub25lT2ZUeXBlKFtSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXSksXG5cdFx0aWNvbjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRvbkNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcblx0fSxcblxuXHRvbkNoYW5nZTogZnVuY3Rpb24gb25DaGFuZ2UodmFsdWUpIHtcblx0XHR0aGlzLnByb3BzLm9uQ2hhbmdlKHZhbHVlKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIG9wdGlvbnMgPSB0aGlzLnByb3BzLm9wdGlvbnMubWFwKGZ1bmN0aW9uIChvcCwgaSkge1xuXHRcdFx0dmFyIGljb25DbGFzc25hbWUgPSBjbGFzc25hbWVzKCdpdGVtLWljb24gcHJpbWFyeScsIG9wLmljb24pO1xuXHRcdFx0dmFyIHRhcHBhYmxlQ2xhc3NuYW1lID0gY2xhc3NuYW1lcygnbGlzdC1pdGVtJywgeyAnaXMtZmlyc3QnOiBpID09PSAwIH0pO1xuXHRcdFx0dmFyIGNoZWNrTWFyayA9IG9wLnZhbHVlID09PSBzZWxmLnByb3BzLnZhbHVlID8gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdHsgY2xhc3NOYW1lOiAnaXRlbS1ub3RlIHByaW1hcnknIH0sXG5cdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnaXRlbS1ub3RlLWljb24gaW9uLWNoZWNrbWFyaycgfSlcblx0XHRcdCkgOiBudWxsO1xuXHRcdFx0dmFyIGljb24gPSBvcC5pY29uID8gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdHsgY2xhc3NOYW1lOiAnaXRlbS1tZWRpYScgfSxcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudCgnc3BhbicsIHsgY2xhc3NOYW1lOiBpY29uQ2xhc3NuYW1lIH0pXG5cdFx0XHQpIDogbnVsbDtcblxuXHRcdFx0ZnVuY3Rpb24gb25DaGFuZ2UoKSB7XG5cdFx0XHRcdHNlbGYub25DaGFuZ2Uob3AudmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0VGFwcGFibGUsXG5cdFx0XHRcdHsga2V5OiAnb3B0aW9uLScgKyBpLCBvblRhcDogb25DaGFuZ2UsIGNsYXNzTmFtZTogdGFwcGFibGVDbGFzc25hbWUgfSxcblx0XHRcdFx0aWNvbixcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ2l0ZW0taW5uZXInIH0sXG5cdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHRcdFx0eyBjbGFzc05hbWU6ICdpdGVtLXRpdGxlJyB9LFxuXHRcdFx0XHRcdFx0b3AubGFiZWxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdGNoZWNrTWFya1xuXHRcdFx0XHQpXG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdG51bGwsXG5cdFx0XHRvcHRpb25zXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKTtcblxudmFyIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1N3aXRjaCcsXG5cblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdG9uOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcblx0XHRvblRhcDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG5cdFx0dHlwZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZGVmYXVsdCdcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc25hbWVzKCdzd2l0Y2gnLCAnc3dpdGNoLScgKyB0aGlzLnByb3BzLnR5cGUsIHsgJ29uJzogdGhpcy5wcm9wcy5vbiB9KTtcblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0VGFwcGFibGUsXG5cdFx0XHR7IG9uVGFwOiB0aGlzLnByb3BzLm9uVGFwLCBjbGFzc05hbWU6IGNsYXNzTmFtZSwgY29tcG9uZW50OiAnbGFiZWwnIH0sXG5cdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0eyBjbGFzc05hbWU6ICd0cmFjaycgfSxcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdoYW5kbGUnIH0pXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG52YXIgY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1RleHRhcmVhJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGZpcnN0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcblx0XHRyb3dzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJvd3M6IDNcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc25hbWVzKCdmaWVsZC1pdGVtIGxpc3QtaXRlbScsIHtcblx0XHRcdCdpcy1maXJzdCc6IHRoaXMucHJvcHMuZmlyc3QsXG5cdFx0XHQndS1zZWxlY3RhYmxlJzogdGhpcy5wcm9wcy5kaXNhYmxlZFxuXHRcdH0sIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblxuXHRcdHZhciBpbnB1dFByb3BzID0gYmxhY2tsaXN0KHRoaXMucHJvcHMsICdjaGlsZHJlbicsICdjbGFzc05hbWUnLCAnZmlyc3QnKTtcblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sXG5cdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0eyBjbGFzc05hbWU6ICdpdGVtLWlubmVyJyB9LFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdCdsYWJlbCcsXG5cdFx0XHRcdFx0eyBjbGFzc05hbWU6ICdpdGVtLWNvbnRlbnQnIH0sXG5cdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnLCBfZXh0ZW5kcyh7IGNsYXNzTmFtZTogJ2ZpZWxkJyB9LCBpbnB1dFByb3BzKSlcblx0XHRcdFx0KSxcblx0XHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBjbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xudmFyIFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnVG9nZ2xlJyxcblxuXHRwcm9wVHlwZXM6IHtcblx0XHRjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0b25DaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG5cdFx0b3B0aW9uczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXG5cdFx0dHlwZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHR2YWx1ZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAncHJpbWFyeSdcblx0XHR9O1xuXHR9LFxuXG5cdG9uQ2hhbmdlOiBmdW5jdGlvbiBvbkNoYW5nZSh2YWx1ZSkge1xuXHRcdHRoaXMucHJvcHMub25DaGFuZ2UodmFsdWUpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjb21wb25lbnRDbGFzc05hbWUgPSBjbGFzc25hbWVzKCdUb2dnbGUnLCB0aGlzLnByb3BzLmNsYXNzTmFtZSwgdGhpcy5wcm9wcy50eXBlKTtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMucHJvcHMub3B0aW9ucy5tYXAoZnVuY3Rpb24gKG9wKSB7XG5cdFx0XHRmdW5jdGlvbiBvbkNoYW5nZSgpIHtcblx0XHRcdFx0c2VsZi5vbkNoYW5nZShvcC52YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBpdGVtQ2xhc3NOYW1lID0gY2xhc3NuYW1lcygnVG9nZ2xlLWl0ZW0nLCB7XG5cdFx0XHRcdCdhY3RpdmUnOiBvcC52YWx1ZSA9PT0gc2VsZi5wcm9wcy52YWx1ZVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRUYXBwYWJsZSxcblx0XHRcdFx0eyBrZXk6ICdvcHRpb24tJyArIG9wLnZhbHVlLCBvblRhcDogb25DaGFuZ2UsIGNsYXNzTmFtZTogaXRlbUNsYXNzTmFtZSB9LFxuXHRcdFx0XHRvcC5sYWJlbFxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogY29tcG9uZW50Q2xhc3NOYW1lIH0sXG5cdFx0XHRvcHRpb25zXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcblxudmFyIGNsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1ZpZXcnLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjbGFzc05hbWU6ICcnXG5cdFx0fTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gY2xhc3NuYW1lcygnVmlldycsIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblxuXHRcdC8vIHJlYWN0IGRvZXMgbm90IGN1cnJlbnRseSBzdXBwb3J0IGR1cGxpY2F0ZSBwcm9wZXJ0aWVzICh3aGljaCB3ZSBuZWVkIGZvciB2ZW5kb3ItcHJlZml4ZWQgdmFsdWVzKVxuXHRcdC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvaXNzdWVzLzIwMjBcblx0XHQvLyBtb3ZlZCB0aGUgZGlzcGxheSBwcm9wZXJ0aWVzIHRvIGNzcy90b3VjaHN0b25lL3ZpZXcubGVzcyB1c2luZyB0aGUgY2xhc3MgXCIuVmlld1wiXG5cdFx0Ly8gd2hlbiBzdXBwb3J0ZWQsIGFwcGx5IHRoZSBmb2xsb3dpbmc6XG5cdFx0Ly8gZGlzcGxheTogJy13ZWJraXQtYm94Jyxcblx0XHQvLyBkaXNwbGF5OiAnLXdlYmtpdC1mbGV4Jyxcblx0XHQvLyBkaXNwbGF5OiAnLW1vei1ib3gnLFxuXHRcdC8vIGRpc3BsYXk6ICctbW96LWZsZXgnLFxuXHRcdC8vIGRpc3BsYXk6ICctbXMtZmxleGJveCcsXG5cdFx0Ly8gZGlzcGxheTogJ2ZsZXgnLFxuXG5cdFx0dmFyIGlubGluZVN0eWxlID0ge1xuXHRcdFx0V2Via2l0RmxleERpcmVjdGlvbjogJ2NvbHVtbicsXG5cdFx0XHRNb3pGbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcblx0XHRcdG1zRmxleERpcmVjdGlvbjogJ2NvbHVtbicsXG5cdFx0XHRGbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcblx0XHRcdFdlYmtpdEFsaWduSXRlbXM6ICdzdHJldGNoJyxcblx0XHRcdE1vekFsaWduSXRlbXM6ICdzdHJldGNoJyxcblx0XHRcdEFsaWduSXRlbXM6ICdzdHJldGNoJyxcblx0XHRcdFdlYmtpdEp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG5cdFx0XHRNb3pKdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLFxuXHRcdFx0SnVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJ1xuXHRcdH07XG5cblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6IGNsYXNzTmFtZSwgc3R5bGU6IGlubGluZVN0eWxlIH0sXG5cdFx0XHR0aGlzLnByb3BzLmNoaWxkcmVuXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBjbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdWaWV3Q29udGVudCcsXG5cdHByb3BUeXBlczoge1xuXHRcdGlkOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRoZWlnaHQ6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0c2Nyb2xsYWJsZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG5cdFx0Z3JvdzogUmVhY3QuUHJvcFR5cGVzLmJvb2xcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y2xhc3NOYW1lOiAnJyxcblx0XHRcdGhlaWdodDogJydcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc25hbWVzKHtcblx0XHRcdCdWaWV3Q29udGVudCc6IHRydWUsXG5cdFx0XHQnc3ByaW5neS1zY3JvbGxpbmcnOiB0aGlzLnByb3BzLnNjcm9sbGFibGVcblx0XHR9LCB0aGlzLnByb3BzLmNsYXNzTmFtZSk7XG5cblx0XHR2YXIgaW5saW5lU3R5bGUgPSB7fTtcblxuXHRcdC8vIHNldCBoZWlnaHQgb24gYmxvY2tzIGlmIHByb3ZpZGVkXG5cdFx0aWYgKHRoaXMucHJvcHMuaGVpZ2h0KSB7XG5cdFx0XHRpbmxpbmVTdHlsZS5oZWlnaHQgPSB0aGlzLnByb3BzLmhlaWdodDtcblx0XHR9XG5cblx0XHQvLyBzdHJldGNoIHRvIHRha2UgdXAgc3BhY2Vcblx0XHRpZiAodGhpcy5wcm9wcy5ncm93KSB7XG5cdFx0XHRpbmxpbmVTdHlsZS5XZWJraXRCb3hGbGV4ID0gJzEnO1xuXHRcdFx0aW5saW5lU3R5bGUuV2Via2l0RmxleCA9ICcxJztcblx0XHRcdGlubGluZVN0eWxlLk1vekJveEZsZXggPSAnMSc7XG5cdFx0XHRpbmxpbmVTdHlsZS5Nb3pGbGV4ID0gJzEnO1xuXHRcdFx0aW5saW5lU3R5bGUuTXNGbGV4ID0gJzEnO1xuXHRcdFx0aW5saW5lU3R5bGUuZmxleCA9ICcxJztcblx0XHR9XG5cblx0XHQvLyBhbGxvdyBibG9ja3MgdG8gYmUgc2Nyb2xsYWJsZVxuXHRcdGlmICh0aGlzLnByb3BzLnNjcm9sbGFibGUpIHtcblx0XHRcdGlubGluZVN0eWxlLm92ZXJmbG93WSA9ICdhdXRvJztcblx0XHRcdGlubGluZVN0eWxlLldlYmtpdE92ZXJmbG93U2Nyb2xsaW5nID0gJ3RvdWNoJztcblx0XHR9XG5cblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6IGNsYXNzTmFtZSwgaWQ6IHRoaXMucHJvcHMuaWQsIHN0eWxlOiBpbmxpbmVTdHlsZSB9LFxuXHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdEFsZXJ0YmFyOiByZXF1aXJlKCcuL0FsZXJ0YmFyJyksXG5cdEZlZWRiYWNrOiByZXF1aXJlKCcuL0ZlZWRiYWNrJyksXG5cdEZvb3RlcmJhcjogcmVxdWlyZSgnLi9Gb290ZXJiYXInKSxcblx0Rm9vdGVyYmFyQnV0dG9uOiByZXF1aXJlKCcuL0Zvb3RlcmJhckJ1dHRvbicpLFxuXHRIZWFkZXJiYXI6IHJlcXVpcmUoJy4vSGVhZGVyYmFyJyksXG5cdEhlYWRlcmJhckJ1dHRvbjogcmVxdWlyZSgnLi9IZWFkZXJiYXJCdXR0b24nKSxcblx0SW5wdXQ6IHJlcXVpcmUoJy4vSW5wdXQnKSxcblx0SXRlbU1lZGlhOiByZXF1aXJlKCcuL0l0ZW1NZWRpYScpLFxuXHRJdGVtTm90ZTogcmVxdWlyZSgnLi9JdGVtTm90ZScpLFxuXHRLZXlwYWQ6IHJlcXVpcmUoJy4vS2V5cGFkJyksXG5cdExhYmVsSW5wdXQ6IHJlcXVpcmUoJy4vTGFiZWxJbnB1dCcpLFxuXHRMYWJlbFNlbGVjdDogcmVxdWlyZSgnLi9MYWJlbFNlbGVjdCcpLFxuXHRMYWJlbFRleHRhcmVhOiByZXF1aXJlKCcuL0xhYmVsVGV4dGFyZWEnKSxcblx0TG9hZGluZ0J1dHRvbjogcmVxdWlyZSgnLi9Mb2FkaW5nQnV0dG9uJyksXG5cdFBvcHVwOiByZXF1aXJlKCcuL1BvcHVwJyksXG5cdFBvcHVwSWNvbjogcmVxdWlyZSgnLi9Qb3B1cEljb24nKSxcblx0UGFzc2NvZGU6IHJlcXVpcmUoJy4vUGFzc2NvZGUnKSxcblx0UmFkaW9MaXN0OiByZXF1aXJlKCcuL1JhZGlvTGlzdCcpLFxuXHRTd2l0Y2g6IHJlcXVpcmUoJy4vU3dpdGNoJyksXG5cdFRleHRhcmVhOiByZXF1aXJlKCcuL1RleHRhcmVhJyksXG5cdFRvZ2dsZTogcmVxdWlyZSgnLi9Ub2dnbGUnKSxcblx0VmlldzogcmVxdWlyZSgnLi9WaWV3JyksXG5cdFZpZXdDb250ZW50OiByZXF1aXJlKCcuL1ZpZXdDb250ZW50Jylcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBibGFja2xpc3QgKHNyYykge1xuICB2YXIgY29weSA9IHt9LCBmaWx0ZXIgPSBhcmd1bWVudHNbMV1cblxuICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ3N0cmluZycpIHtcbiAgICBmaWx0ZXIgPSB7fVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmaWx0ZXJbYXJndW1lbnRzW2ldXSA9IHRydWVcbiAgICB9XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgLy8gYmxhY2tsaXN0P1xuICAgIGlmIChmaWx0ZXJba2V5XSkgY29udGludWVcblxuICAgIGNvcHlba2V5XSA9IHNyY1trZXldXG4gIH1cblxuICByZXR1cm4gY29weVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG4vLyBFbmFibGUgUmVhY3QgVG91Y2ggRXZlbnRzXG5SZWFjdC5pbml0aWFsaXplVG91Y2hFdmVudHModHJ1ZSk7XG5cbmZ1bmN0aW9uIGdldFRvdWNoUHJvcHModG91Y2gpIHtcblx0aWYgKCF0b3VjaCkgcmV0dXJuIHt9O1xuXHRyZXR1cm4ge1xuXHRcdHBhZ2VYOiB0b3VjaC5wYWdlWCxcblx0XHRwYWdlWTogdG91Y2gucGFnZVksXG5cdFx0Y2xpZW50WDogdG91Y2guY2xpZW50WCxcblx0XHRjbGllbnRZOiB0b3VjaC5jbGllbnRZXG5cdH07XG59XG5cbmZ1bmN0aW9uIGlzRGF0YU9yQXJpYVByb3Aoa2V5KSB7XG5cdHJldHVybiBrZXkuaW5kZXhPZignZGF0YS0nKSA9PT0gMCB8fCBrZXkuaW5kZXhPZignYXJpYS0nKSA9PT0gMDtcbn1cblxuZnVuY3Rpb24gZ2V0UGluY2hQcm9wcyh0b3VjaGVzKSB7XG5cdHJldHVybiB7XG5cdFx0dG91Y2hlczogQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRvdWNoZXMsIGZ1bmN0aW9uIGNvcHlUb3VjaCh0b3VjaCkge1xuXHRcdFx0cmV0dXJuIHsgaWRlbnRpZmllcjogdG91Y2guaWRlbnRpZmllciwgcGFnZVg6IHRvdWNoLnBhZ2VYLCBwYWdlWTogdG91Y2gucGFnZVkgfTtcblx0XHR9KSxcblx0XHRjZW50ZXI6IHsgeDogKHRvdWNoZXNbMF0ucGFnZVggKyB0b3VjaGVzWzFdLnBhZ2VYKSAvIDIsIHk6ICh0b3VjaGVzWzBdLnBhZ2VZICsgdG91Y2hlc1sxXS5wYWdlWSkgLyAyIH0sXG5cdFx0YW5nbGU6IE1hdGguYXRhbigpICogKHRvdWNoZXNbMV0ucGFnZVkgLSB0b3VjaGVzWzBdLnBhZ2VZKSAvICh0b3VjaGVzWzFdLnBhZ2VYIC0gdG91Y2hlc1swXS5wYWdlWCkgKiAxODAgLyBNYXRoLlBJLFxuXHRcdGRpc3RhbmNlOiBNYXRoLnNxcnQoTWF0aC5wb3coTWF0aC5hYnModG91Y2hlc1sxXS5wYWdlWCAtIHRvdWNoZXNbMF0ucGFnZVgpLCAyKSArIE1hdGgucG93KE1hdGguYWJzKHRvdWNoZXNbMV0ucGFnZVkgLSB0b3VjaGVzWzBdLnBhZ2VZKSwgMikpXG5cdH07XG59XG5cbi8qKlxuICogVGFwcGFibGUgTWl4aW5cbiAqID09PT09PT09PT09PT09XG4gKi9cblxudmFyIE1peGluID0ge1xuXHRwcm9wVHlwZXM6IHtcblx0XHRtb3ZlVGhyZXNob2xkOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLCAvLyBwaXhlbHMgdG8gbW92ZSBiZWZvcmUgY2FuY2VsbGluZyB0YXBcblx0XHRwcmVzc0RlbGF5OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLCAvLyBtcyB0byB3YWl0IGJlZm9yZSBkZXRlY3RpbmcgYSBwcmVzc1xuXHRcdHByZXNzTW92ZVRocmVzaG9sZDogUmVhY3QuUHJvcFR5cGVzLm51bWJlciwgLy8gcGl4ZWxzIHRvIG1vdmUgYmVmb3JlIGNhbmNlbGxpbmcgcHJlc3Ncblx0XHRwcmV2ZW50RGVmYXVsdDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsIC8vIHdoZXRoZXIgdG8gcHJldmVudERlZmF1bHQgb24gYWxsIGV2ZW50c1xuXHRcdHN0b3BQcm9wYWdhdGlvbjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsIC8vIHdoZXRoZXIgdG8gc3RvcFByb3BhZ2F0aW9uIG9uIGFsbCBldmVudHNcblxuXHRcdG9uVGFwOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgLy8gZmlyZXMgd2hlbiBhIHRhcCBpcyBkZXRlY3RlZFxuXHRcdG9uUHJlc3M6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAvLyBmaXJlcyB3aGVuIGEgcHJlc3MgaXMgZGV0ZWN0ZWRcblx0XHRvblRvdWNoU3RhcnQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAvLyBwYXNzLXRocm91Z2ggdG91Y2ggZXZlbnRcblx0XHRvblRvdWNoTW92ZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsIC8vIHBhc3MtdGhyb3VnaCB0b3VjaCBldmVudFxuXHRcdG9uVG91Y2hFbmQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAvLyBwYXNzLXRocm91Z2ggdG91Y2ggZXZlbnRcblx0XHRvbk1vdXNlRG93bjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsIC8vIHBhc3MtdGhyb3VnaCBtb3VzZSBldmVudFxuXHRcdG9uTW91c2VVcDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsIC8vIHBhc3MtdGhyb3VnaCBtb3VzZSBldmVudFxuXHRcdG9uTW91c2VNb3ZlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgLy8gcGFzcy10aHJvdWdoIG1vdXNlIGV2ZW50XG5cdFx0b25Nb3VzZU91dDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsIC8vIHBhc3MtdGhyb3VnaCBtb3VzZSBldmVudFxuXG5cdFx0b25QaW5jaFN0YXJ0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgLy8gZmlyZXMgd2hlbiBhIHBpbmNoIGdlc3R1cmUgaXMgc3RhcnRlZFxuXHRcdG9uUGluY2hNb3ZlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgLy8gZmlyZXMgb24gZXZlcnkgdG91Y2gtbW92ZSB3aGVuIGEgcGluY2ggYWN0aW9uIGlzIGFjdGl2ZVxuXHRcdG9uUGluY2hFbmQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jIC8vIGZpcmVzIHdoZW4gYSBwaW5jaCBhY3Rpb24gZW5kc1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRtb3ZlVGhyZXNob2xkOiAxMDAsXG5cdFx0XHRwcmVzc0RlbGF5OiAxMDAwLFxuXHRcdFx0cHJlc3NNb3ZlVGhyZXNob2xkOiA1XG5cdFx0fTtcblx0fSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uIGdldEluaXRpYWxTdGF0ZSgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aXNBY3RpdmU6IGZhbHNlLFxuXHRcdFx0dG91Y2hBY3RpdmU6IGZhbHNlLFxuXHRcdFx0cGluY2hBY3RpdmU6IGZhbHNlXG5cdFx0fTtcblx0fSxcblxuXHRjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG5cdFx0dGhpcy5jbGVhbnVwU2Nyb2xsRGV0ZWN0aW9uKCk7XG5cdFx0dGhpcy5jYW5jZWxQcmVzc0RldGVjdGlvbigpO1xuXHR9LFxuXG5cdHByb2Nlc3NFdmVudDogZnVuY3Rpb24gcHJvY2Vzc0V2ZW50KGV2ZW50KSB7XG5cdFx0aWYgKHRoaXMucHJvcHMucHJldmVudERlZmF1bHQpIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0aWYgKHRoaXMucHJvcHMuc3RvcFByb3BhZ2F0aW9uKSBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0fSxcblxuXHRvblRvdWNoU3RhcnQ6IGZ1bmN0aW9uIG9uVG91Y2hTdGFydChldmVudCkge1xuXHRcdGlmICh0aGlzLnByb3BzLm9uVG91Y2hTdGFydCAmJiB0aGlzLnByb3BzLm9uVG91Y2hTdGFydChldmVudCkgPT09IGZhbHNlKSByZXR1cm47XG5cdFx0dGhpcy5wcm9jZXNzRXZlbnQoZXZlbnQpO1xuXHRcdHdpbmRvdy5fYmxvY2tNb3VzZUV2ZW50cyA9IHRydWU7XG5cblx0XHRpZiAoZXZlbnQudG91Y2hlcy5sZW5ndGggPT09IDEpIHtcblx0XHRcdHRoaXMuX2luaXRpYWxUb3VjaCA9IHRoaXMuX2xhc3RUb3VjaCA9IGdldFRvdWNoUHJvcHMoZXZlbnQudG91Y2hlc1swXSk7XG5cdFx0XHR0aGlzLmluaXRTY3JvbGxEZXRlY3Rpb24oKTtcblx0XHRcdHRoaXMuaW5pdFByZXNzRGV0ZWN0aW9uKGV2ZW50LCB0aGlzLmVuZFRvdWNoKTtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRpc0FjdGl2ZTogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIGlmICgodGhpcy5wcm9wcy5vblBpbmNoU3RhcnQgfHwgdGhpcy5wcm9wcy5vblBpbmNoTW92ZSB8fCB0aGlzLnByb3BzLm9uUGluY2hFbmQpICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoID09PSAyKSB7XG5cdFx0XHR0aGlzLm9uUGluY2hTdGFydChldmVudCk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uUGluY2hTdGFydDogZnVuY3Rpb24gb25QaW5jaFN0YXJ0KGV2ZW50KSB7XG5cdFx0Ly8gaW4gY2FzZSB0aGUgdHdvIHRvdWNoZXMgZGlkbid0IHN0YXJ0IGV4YWN0bHkgYXQgdGhlIHNhbWUgdGltZVxuXHRcdGlmICh0aGlzLl9pbml0aWFsVG91Y2gpIHRoaXMuZW5kVG91Y2goKTtcblxuXHRcdHZhciB0b3VjaGVzID0gZXZlbnQudG91Y2hlcztcblxuXHRcdHRoaXMuX2luaXRpYWxQaW5jaCA9IGdldFBpbmNoUHJvcHModG91Y2hlcyk7XG5cblx0XHR0aGlzLl9pbml0aWFsUGluY2ggPSBfZXh0ZW5kcyh0aGlzLl9pbml0aWFsUGluY2gsIHtcblx0XHRcdGRpc3BsYWNlbWVudDogeyB4OiAwLCB5OiAwIH0sXG5cdFx0XHRkaXNwbGFjZW1lbnRWZWxvY2l0eTogeyB4OiAwLCB5OiAwIH0sXG5cdFx0XHRyb3RhdGlvbjogMCxcblx0XHRcdHJvdGF0aW9uVmVsb2NpdHk6IDAsXG5cdFx0XHR6b29tOiAxLFxuXHRcdFx0em9vbVZlbG9jaXR5OiAwLFxuXHRcdFx0dGltZTogRGF0ZS5ub3coKVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5fbGFzdFBpbmNoID0gdGhpcy5faW5pdGlhbFBpbmNoO1xuXG5cdFx0dGhpcy5wcm9wcy5vblBpbmNoU3RhcnQgJiYgdGhpcy5wcm9wcy5vblBpbmNoU3RhcnQodGhpcy5faW5pdGlhbFBpbmNoLCBldmVudCk7XG5cdH0sXG5cblx0b25QaW5jaE1vdmU6IGZ1bmN0aW9uIG9uUGluY2hNb3ZlKGV2ZW50KSB7XG5cdFx0aWYgKHRoaXMuX2luaXRpYWxUb3VjaCkgdGhpcy5lbmRUb3VjaCgpO1xuXG5cdFx0dmFyIHRvdWNoZXMgPSBldmVudC50b3VjaGVzO1xuXG5cdFx0aWYgKHRvdWNoZXMubGVuZ3RoICE9PSAyKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vblBpbmNoRW5kKGV2ZW50KSAvLyBiYWlsIG91dCBiZWZvcmUgZGlzYXN0ZXJcblx0XHRcdDtcblx0XHR9XG5cblx0XHR2YXIgY3VycmVudFBpbmNoID0gdG91Y2hlc1swXS5pZGVudGlmaWVyID09PSB0aGlzLl9pbml0aWFsUGluY2gudG91Y2hlc1swXS5pZGVudGlmaWVyICYmIHRvdWNoZXNbMV0uaWRlbnRpZmllciA9PT0gdGhpcy5faW5pdGlhbFBpbmNoLnRvdWNoZXNbMV0uaWRlbnRpZmllciA/IGdldFBpbmNoUHJvcHModG91Y2hlcykgLy8gdGhlIHRvdWNoZXMgYXJlIGluIHRoZSBjb3JyZWN0IG9yZGVyXG5cdFx0OiB0b3VjaGVzWzFdLmlkZW50aWZpZXIgPT09IHRoaXMuX2luaXRpYWxQaW5jaC50b3VjaGVzWzBdLmlkZW50aWZpZXIgJiYgdG91Y2hlc1swXS5pZGVudGlmaWVyID09PSB0aGlzLl9pbml0aWFsUGluY2gudG91Y2hlc1sxXS5pZGVudGlmaWVyID8gZ2V0UGluY2hQcm9wcyh0b3VjaGVzLnJldmVyc2UoKSkgLy8gdGhlIHRvdWNoZXMgaGF2ZSBzb21laG93IGNoYW5nZWQgb3JkZXJcblx0XHQ6IGdldFBpbmNoUHJvcHModG91Y2hlcyk7IC8vIHNvbWV0aGluZyBpcyB3cm9uZywgYnV0IHdlIHN0aWxsIGhhdmUgdHdvIHRvdWNoLXBvaW50cywgc28gd2UgdHJ5IG5vdCB0byBmYWlsXG5cblx0XHRjdXJyZW50UGluY2guZGlzcGxhY2VtZW50ID0ge1xuXHRcdFx0eDogY3VycmVudFBpbmNoLmNlbnRlci54IC0gdGhpcy5faW5pdGlhbFBpbmNoLmNlbnRlci54LFxuXHRcdFx0eTogY3VycmVudFBpbmNoLmNlbnRlci55IC0gdGhpcy5faW5pdGlhbFBpbmNoLmNlbnRlci55XG5cdFx0fTtcblxuXHRcdGN1cnJlbnRQaW5jaC50aW1lID0gRGF0ZS5ub3coKTtcblx0XHR2YXIgdGltZVNpbmNlTGFzdFBpbmNoID0gY3VycmVudFBpbmNoLnRpbWUgLSB0aGlzLl9sYXN0UGluY2gudGltZTtcblxuXHRcdGN1cnJlbnRQaW5jaC5kaXNwbGFjZW1lbnRWZWxvY2l0eSA9IHtcblx0XHRcdHg6IChjdXJyZW50UGluY2guZGlzcGxhY2VtZW50LnggLSB0aGlzLl9sYXN0UGluY2guZGlzcGxhY2VtZW50LngpIC8gdGltZVNpbmNlTGFzdFBpbmNoLFxuXHRcdFx0eTogKGN1cnJlbnRQaW5jaC5kaXNwbGFjZW1lbnQueSAtIHRoaXMuX2xhc3RQaW5jaC5kaXNwbGFjZW1lbnQueSkgLyB0aW1lU2luY2VMYXN0UGluY2hcblx0XHR9O1xuXG5cdFx0Y3VycmVudFBpbmNoLnJvdGF0aW9uID0gY3VycmVudFBpbmNoLmFuZ2xlIC0gdGhpcy5faW5pdGlhbFBpbmNoLmFuZ2xlO1xuXHRcdGN1cnJlbnRQaW5jaC5yb3RhdGlvblZlbG9jaXR5ID0gY3VycmVudFBpbmNoLnJvdGF0aW9uIC0gdGhpcy5fbGFzdFBpbmNoLnJvdGF0aW9uIC8gdGltZVNpbmNlTGFzdFBpbmNoO1xuXG5cdFx0Y3VycmVudFBpbmNoLnpvb20gPSBjdXJyZW50UGluY2guZGlzdGFuY2UgLyB0aGlzLl9pbml0aWFsUGluY2guZGlzdGFuY2U7XG5cdFx0Y3VycmVudFBpbmNoLnpvb21WZWxvY2l0eSA9IChjdXJyZW50UGluY2guem9vbSAtIHRoaXMuX2xhc3RQaW5jaC56b29tKSAvIHRpbWVTaW5jZUxhc3RQaW5jaDtcblxuXHRcdHRoaXMucHJvcHMub25QaW5jaE1vdmUgJiYgdGhpcy5wcm9wcy5vblBpbmNoTW92ZShjdXJyZW50UGluY2gsIGV2ZW50KTtcblxuXHRcdHRoaXMuX2xhc3RQaW5jaCA9IGN1cnJlbnRQaW5jaDtcblx0fSxcblxuXHRvblBpbmNoRW5kOiBmdW5jdGlvbiBvblBpbmNoRW5kKGV2ZW50KSB7XG5cdFx0Ly8gVE9ETyB1c2UgaGVscGVyIHRvIG9yZGVyIHRvdWNoZXMgYnkgaWRlbnRpZmllciBhbmQgdXNlIGFjdHVhbCB2YWx1ZXMgb24gdG91Y2hFbmQuXG5cdFx0dmFyIGN1cnJlbnRQaW5jaCA9IF9leHRlbmRzKHt9LCB0aGlzLl9sYXN0UGluY2gpO1xuXHRcdGN1cnJlbnRQaW5jaC50aW1lID0gRGF0ZS5ub3coKTtcblxuXHRcdGlmIChjdXJyZW50UGluY2gudGltZSAtIHRoaXMuX2xhc3RQaW5jaC50aW1lID4gMTYpIHtcblx0XHRcdGN1cnJlbnRQaW5jaC5kaXNwbGFjZW1lbnRWZWxvY2l0eSA9IDA7XG5cdFx0XHRjdXJyZW50UGluY2gucm90YXRpb25WZWxvY2l0eSA9IDA7XG5cdFx0XHRjdXJyZW50UGluY2guem9vbVZlbG9jaXR5ID0gMDtcblx0XHR9XG5cblx0XHR0aGlzLnByb3BzLm9uUGluY2hFbmQgJiYgdGhpcy5wcm9wcy5vblBpbmNoRW5kKGN1cnJlbnRQaW5jaCwgZXZlbnQpO1xuXG5cdFx0dGhpcy5faW5pdGlhbFBpbmNoID0gdGhpcy5fbGFzdFBpbmNoID0gbnVsbDtcblxuXHRcdC8vIElmIG9uZSBmaW5nZXIgaXMgc3RpbGwgb24gc2NyZWVuLCBpdCBzaG91bGQgc3RhcnQgYSBuZXcgdG91Y2ggZXZlbnQgZm9yIHN3aXBpbmcgZXRjXG5cdFx0Ly8gQnV0IGl0IHNob3VsZCBuZXZlciBmaXJlIGFuIG9uVGFwIG9yIG9uUHJlc3MgZXZlbnQuXG5cdFx0Ly8gU2luY2UgdGhlcmUgaXMgbm8gc3VwcG9ydCBzd2lwZXMgeWV0LCB0aGlzIHNob3VsZCBiZSBkaXNyZWdhcmRlZCBmb3Igbm93XG5cdFx0Ly8gaWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG5cdFx0Ly8gXHR0aGlzLm9uVG91Y2hTdGFydChldmVudCk7XG5cdFx0Ly8gfVxuXHR9LFxuXG5cdGluaXRTY3JvbGxEZXRlY3Rpb246IGZ1bmN0aW9uIGluaXRTY3JvbGxEZXRlY3Rpb24oKSB7XG5cdFx0dGhpcy5fc2Nyb2xsUG9zID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblx0XHR0aGlzLl9zY3JvbGxQYXJlbnRzID0gW107XG5cdFx0dGhpcy5fc2Nyb2xsUGFyZW50UG9zID0gW107XG5cdFx0dmFyIG5vZGUgPSB0aGlzLmdldERPTU5vZGUoKTtcblx0XHR3aGlsZSAobm9kZSkge1xuXHRcdFx0aWYgKG5vZGUuc2Nyb2xsSGVpZ2h0ID4gbm9kZS5vZmZzZXRIZWlnaHQgfHwgbm9kZS5zY3JvbGxXaWR0aCA+IG5vZGUub2Zmc2V0V2lkdGgpIHtcblx0XHRcdFx0dGhpcy5fc2Nyb2xsUGFyZW50cy5wdXNoKG5vZGUpO1xuXHRcdFx0XHR0aGlzLl9zY3JvbGxQYXJlbnRQb3MucHVzaChub2RlLnNjcm9sbFRvcCArIG5vZGUuc2Nyb2xsTGVmdCk7XG5cdFx0XHRcdHRoaXMuX3Njcm9sbFBvcy50b3AgKz0gbm9kZS5zY3JvbGxUb3A7XG5cdFx0XHRcdHRoaXMuX3Njcm9sbFBvcy5sZWZ0ICs9IG5vZGUuc2Nyb2xsTGVmdDtcblx0XHRcdH1cblx0XHRcdG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdFx0fVxuXHR9LFxuXG5cdGNhbGN1bGF0ZU1vdmVtZW50OiBmdW5jdGlvbiBjYWxjdWxhdGVNb3ZlbWVudCh0b3VjaCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR4OiBNYXRoLmFicyh0b3VjaC5jbGllbnRYIC0gdGhpcy5faW5pdGlhbFRvdWNoLmNsaWVudFgpLFxuXHRcdFx0eTogTWF0aC5hYnModG91Y2guY2xpZW50WSAtIHRoaXMuX2luaXRpYWxUb3VjaC5jbGllbnRZKVxuXHRcdH07XG5cdH0sXG5cblx0ZGV0ZWN0U2Nyb2xsOiBmdW5jdGlvbiBkZXRlY3RTY3JvbGwoKSB7XG5cdFx0dmFyIGN1cnJlbnRTY3JvbGxQb3MgPSB7IHRvcDogMCwgbGVmdDogMCB9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fc2Nyb2xsUGFyZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y3VycmVudFNjcm9sbFBvcy50b3AgKz0gdGhpcy5fc2Nyb2xsUGFyZW50c1tpXS5zY3JvbGxUb3A7XG5cdFx0XHRjdXJyZW50U2Nyb2xsUG9zLmxlZnQgKz0gdGhpcy5fc2Nyb2xsUGFyZW50c1tpXS5zY3JvbGxMZWZ0O1xuXHRcdH1cblx0XHRyZXR1cm4gIShjdXJyZW50U2Nyb2xsUG9zLnRvcCA9PT0gdGhpcy5fc2Nyb2xsUG9zLnRvcCAmJiBjdXJyZW50U2Nyb2xsUG9zLmxlZnQgPT09IHRoaXMuX3Njcm9sbFBvcy5sZWZ0KTtcblx0fSxcblxuXHRjbGVhbnVwU2Nyb2xsRGV0ZWN0aW9uOiBmdW5jdGlvbiBjbGVhbnVwU2Nyb2xsRGV0ZWN0aW9uKCkge1xuXHRcdHRoaXMuX3Njcm9sbFBhcmVudHMgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5fc2Nyb2xsUG9zID0gdW5kZWZpbmVkO1xuXHR9LFxuXG5cdGluaXRQcmVzc0RldGVjdGlvbjogZnVuY3Rpb24gaW5pdFByZXNzRGV0ZWN0aW9uKGV2ZW50LCBjYWxsYmFjaykge1xuXHRcdGlmICghdGhpcy5wcm9wcy5vblByZXNzKSByZXR1cm47XG5cdFx0dGhpcy5fcHJlc3NUaW1lb3V0ID0gc2V0VGltZW91dCgoZnVuY3Rpb24gKCkge1xuXHRcdFx0dGhpcy5wcm9wcy5vblByZXNzKGV2ZW50KTtcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0fSkuYmluZCh0aGlzKSwgdGhpcy5wcm9wcy5wcmVzc0RlbGF5KTtcblx0fSxcblxuXHRjYW5jZWxQcmVzc0RldGVjdGlvbjogZnVuY3Rpb24gY2FuY2VsUHJlc3NEZXRlY3Rpb24oKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KHRoaXMuX3ByZXNzVGltZW91dCk7XG5cdH0sXG5cblx0b25Ub3VjaE1vdmU6IGZ1bmN0aW9uIG9uVG91Y2hNb3ZlKGV2ZW50KSB7XG5cdFx0aWYgKHRoaXMuX2luaXRpYWxUb3VjaCkge1xuXHRcdFx0dGhpcy5wcm9jZXNzRXZlbnQoZXZlbnQpO1xuXG5cdFx0XHRpZiAodGhpcy5kZXRlY3RTY3JvbGwoKSkgcmV0dXJuIHRoaXMuZW5kVG91Y2goZXZlbnQpO1xuXG5cdFx0XHR0aGlzLnByb3BzLm9uVG91Y2hNb3ZlICYmIHRoaXMucHJvcHMub25Ub3VjaE1vdmUoZXZlbnQpO1xuXHRcdFx0dGhpcy5fbGFzdFRvdWNoID0gZ2V0VG91Y2hQcm9wcyhldmVudC50b3VjaGVzWzBdKTtcblx0XHRcdHZhciBtb3ZlbWVudCA9IHRoaXMuY2FsY3VsYXRlTW92ZW1lbnQodGhpcy5fbGFzdFRvdWNoKTtcblx0XHRcdGlmIChtb3ZlbWVudC54ID4gdGhpcy5wcm9wcy5wcmVzc01vdmVUaHJlc2hvbGQgfHwgbW92ZW1lbnQueSA+IHRoaXMucHJvcHMucHJlc3NNb3ZlVGhyZXNob2xkKSB7XG5cdFx0XHRcdHRoaXMuY2FuY2VsUHJlc3NEZXRlY3Rpb24oKTtcblx0XHRcdH1cblx0XHRcdGlmIChtb3ZlbWVudC54ID4gdGhpcy5wcm9wcy5tb3ZlVGhyZXNob2xkIHx8IG1vdmVtZW50LnkgPiB0aGlzLnByb3BzLm1vdmVUaHJlc2hvbGQpIHtcblx0XHRcdFx0aWYgKHRoaXMuc3RhdGUuaXNBY3RpdmUpIHtcblx0XHRcdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0XHRcdGlzQWN0aXZlOiBmYWxzZVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoIXRoaXMuc3RhdGUuaXNBY3RpdmUpIHtcblx0XHRcdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0XHRcdGlzQWN0aXZlOiB0cnVlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRoaXMuX2luaXRpYWxQaW5jaCAmJiBldmVudC50b3VjaGVzLmxlbmd0aCA9PT0gMikge1xuXHRcdFx0dGhpcy5vblBpbmNoTW92ZShldmVudCk7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblx0fSxcblxuXHRvblRvdWNoRW5kOiBmdW5jdGlvbiBvblRvdWNoRW5kKGV2ZW50KSB7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdGlmICh0aGlzLl9pbml0aWFsVG91Y2gpIHtcblx0XHRcdHRoaXMucHJvY2Vzc0V2ZW50KGV2ZW50KTtcblx0XHRcdHZhciBhZnRlckVuZFRvdWNoO1xuXHRcdFx0dmFyIG1vdmVtZW50ID0gdGhpcy5jYWxjdWxhdGVNb3ZlbWVudCh0aGlzLl9sYXN0VG91Y2gpO1xuXHRcdFx0aWYgKG1vdmVtZW50LnggPD0gdGhpcy5wcm9wcy5tb3ZlVGhyZXNob2xkICYmIG1vdmVtZW50LnkgPD0gdGhpcy5wcm9wcy5tb3ZlVGhyZXNob2xkICYmIHRoaXMucHJvcHMub25UYXApIHtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0YWZ0ZXJFbmRUb3VjaCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHR2YXIgZmluYWxQYXJlbnRTY3JvbGxQb3MgPSBfdGhpcy5fc2Nyb2xsUGFyZW50cy5tYXAoZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRcdFx0XHRcdHJldHVybiBub2RlLnNjcm9sbFRvcCArIG5vZGUuc2Nyb2xsTGVmdDtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR2YXIgc3RvcHBlZE1vbWVudHVtU2Nyb2xsID0gX3RoaXMuX3Njcm9sbFBhcmVudFBvcy5zb21lKGZ1bmN0aW9uIChlbmQsIGkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBlbmQgIT09IGZpbmFsUGFyZW50U2Nyb2xsUG9zW2ldO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGlmICghc3RvcHBlZE1vbWVudHVtU2Nyb2xsKSB7XG5cdFx0XHRcdFx0XHRfdGhpcy5wcm9wcy5vblRhcChldmVudCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5lbmRUb3VjaChldmVudCwgYWZ0ZXJFbmRUb3VjaCk7XG5cdFx0fSBlbHNlIGlmICh0aGlzLl9pbml0aWFsUGluY2ggJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggKyBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGggPT09IDIpIHtcblx0XHRcdHRoaXMub25QaW5jaEVuZChldmVudCk7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblx0fSxcblxuXHRlbmRUb3VjaDogZnVuY3Rpb24gZW5kVG91Y2goZXZlbnQsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5jYW5jZWxQcmVzc0RldGVjdGlvbigpO1xuXHRcdGlmIChldmVudCAmJiB0aGlzLnByb3BzLm9uVG91Y2hFbmQpIHRoaXMucHJvcHMub25Ub3VjaEVuZChldmVudCk7XG5cdFx0dGhpcy5faW5pdGlhbFRvdWNoID0gbnVsbDtcblx0XHR0aGlzLl9sYXN0VG91Y2ggPSBudWxsO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0aXNBY3RpdmU6IGZhbHNlXG5cdFx0fSwgY2FsbGJhY2spO1xuXHR9LFxuXG5cdG9uTW91c2VEb3duOiBmdW5jdGlvbiBvbk1vdXNlRG93bihldmVudCkge1xuXHRcdGlmICh3aW5kb3cuX2Jsb2NrTW91c2VFdmVudHMpIHtcblx0XHRcdHdpbmRvdy5fYmxvY2tNb3VzZUV2ZW50cyA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAodGhpcy5wcm9wcy5vbk1vdXNlRG93biAmJiB0aGlzLnByb3BzLm9uTW91c2VEb3duKGV2ZW50KSA9PT0gZmFsc2UpIHJldHVybjtcblx0XHR0aGlzLnByb2Nlc3NFdmVudChldmVudCk7XG5cdFx0dGhpcy5pbml0UHJlc3NEZXRlY3Rpb24oZXZlbnQsIHRoaXMuZW5kTW91c2VFdmVudCk7XG5cdFx0dGhpcy5fbW91c2VEb3duID0gdHJ1ZTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGlzQWN0aXZlOiB0cnVlXG5cdFx0fSk7XG5cdH0sXG5cblx0b25Nb3VzZU1vdmU6IGZ1bmN0aW9uIG9uTW91c2VNb3ZlKGV2ZW50KSB7XG5cdFx0aWYgKHdpbmRvdy5fYmxvY2tNb3VzZUV2ZW50cyB8fCAhdGhpcy5fbW91c2VEb3duKSByZXR1cm47XG5cdFx0dGhpcy5wcm9jZXNzRXZlbnQoZXZlbnQpO1xuXHRcdHRoaXMucHJvcHMub25Nb3VzZU1vdmUgJiYgdGhpcy5wcm9wcy5vbk1vdXNlTW92ZShldmVudCk7XG5cdH0sXG5cblx0b25Nb3VzZVVwOiBmdW5jdGlvbiBvbk1vdXNlVXAoZXZlbnQpIHtcblx0XHRpZiAod2luZG93Ll9ibG9ja01vdXNlRXZlbnRzIHx8ICF0aGlzLl9tb3VzZURvd24pIHJldHVybjtcblx0XHR0aGlzLnByb2Nlc3NFdmVudChldmVudCk7XG5cdFx0dGhpcy5wcm9wcy5vbk1vdXNlVXAgJiYgdGhpcy5wcm9wcy5vbk1vdXNlVXAoZXZlbnQpO1xuXHRcdHRoaXMucHJvcHMub25UYXAgJiYgdGhpcy5wcm9wcy5vblRhcChldmVudCk7XG5cdFx0dGhpcy5lbmRNb3VzZUV2ZW50KCk7XG5cdH0sXG5cblx0b25Nb3VzZU91dDogZnVuY3Rpb24gb25Nb3VzZU91dChldmVudCkge1xuXHRcdGlmICh3aW5kb3cuX2Jsb2NrTW91c2VFdmVudHMgfHwgIXRoaXMuX21vdXNlRG93bikgcmV0dXJuO1xuXHRcdHRoaXMucHJvY2Vzc0V2ZW50KGV2ZW50KTtcblx0XHR0aGlzLnByb3BzLm9uTW91c2VPdXQgJiYgdGhpcy5wcm9wcy5vbk1vdXNlT3V0KGV2ZW50KTtcblx0XHR0aGlzLmVuZE1vdXNlRXZlbnQoKTtcblx0fSxcblxuXHRlbmRNb3VzZUV2ZW50OiBmdW5jdGlvbiBlbmRNb3VzZUV2ZW50KCkge1xuXHRcdHRoaXMuY2FuY2VsUHJlc3NEZXRlY3Rpb24oKTtcblx0XHR0aGlzLl9tb3VzZURvd24gPSBmYWxzZTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGlzQWN0aXZlOiBmYWxzZVxuXHRcdH0pO1xuXHR9LFxuXG5cdHRvdWNoU3R5bGVzOiBmdW5jdGlvbiB0b3VjaFN0eWxlcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0V2Via2l0VGFwSGlnaGxpZ2h0Q29sb3I6ICdyZ2JhKDAsMCwwLDApJyxcblx0XHRcdFdlYmtpdFRvdWNoQ2FsbG91dDogJ25vbmUnLFxuXHRcdFx0V2Via2l0VXNlclNlbGVjdDogJ25vbmUnLFxuXHRcdFx0S2h0bWxVc2VyU2VsZWN0OiAnbm9uZScsXG5cdFx0XHRNb3pVc2VyU2VsZWN0OiAnbm9uZScsXG5cdFx0XHRtc1VzZXJTZWxlY3Q6ICdub25lJyxcblx0XHRcdHVzZXJTZWxlY3Q6ICdub25lJyxcblx0XHRcdGN1cnNvcjogJ3BvaW50ZXInXG5cdFx0fTtcblx0fSxcblxuXHRoYW5kbGVyczogZnVuY3Rpb24gaGFuZGxlcnMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG9uVG91Y2hTdGFydDogdGhpcy5vblRvdWNoU3RhcnQsXG5cdFx0XHRvblRvdWNoTW92ZTogdGhpcy5vblRvdWNoTW92ZSxcblx0XHRcdG9uVG91Y2hFbmQ6IHRoaXMub25Ub3VjaEVuZCxcblx0XHRcdG9uTW91c2VEb3duOiB0aGlzLm9uTW91c2VEb3duLFxuXHRcdFx0b25Nb3VzZVVwOiB0aGlzLm9uTW91c2VVcCxcblx0XHRcdG9uTW91c2VNb3ZlOiB0aGlzLm9uTW91c2VNb3ZlLFxuXHRcdFx0b25Nb3VzZU91dDogdGhpcy5vbk1vdXNlT3V0XG5cdFx0fTtcblx0fVxufTtcblxuLyoqXG4gKiBUYXBwYWJsZSBDb21wb25lbnRcbiAqID09PT09PT09PT09PT09PT09PVxuICovXG5cbnZhciBDb21wb25lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0ZGlzcGxheU5hbWU6ICdUYXBwYWJsZScsXG5cblx0bWl4aW5zOiBbTWl4aW5dLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGNvbXBvbmVudDogUmVhY3QuUHJvcFR5cGVzLmFueSwgLy8gY29tcG9uZW50IHRvIGNyZWF0ZVxuXHRcdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZywgLy8gb3B0aW9uYWwgY2xhc3NOYW1lXG5cdFx0Y2xhc3NCYXNlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAvLyBiYXNlIGZvciBnZW5lcmF0ZWQgY2xhc3NOYW1lc1xuXHRcdHN0eWxlOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LCAvLyBhZGRpdGlvbmFsIHN0eWxlIHByb3BlcnRpZXMgZm9yIHRoZSBjb21wb25lbnRcblx0XHRkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wgLy8gb25seSBhcHBsaWVzIHRvIGJ1dHRvbnNcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29tcG9uZW50OiAnc3BhbicsXG5cdFx0XHRjbGFzc0Jhc2U6ICdUYXBwYWJsZSdcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBwcm9wcyA9IHRoaXMucHJvcHM7XG5cdFx0dmFyIGNsYXNzTmFtZSA9IHByb3BzLmNsYXNzQmFzZSArICh0aGlzLnN0YXRlLmlzQWN0aXZlID8gJy1hY3RpdmUnIDogJy1pbmFjdGl2ZScpO1xuXG5cdFx0aWYgKHByb3BzLmNsYXNzTmFtZSkge1xuXHRcdFx0Y2xhc3NOYW1lICs9ICcgJyArIHByb3BzLmNsYXNzTmFtZTtcblx0XHR9XG5cblx0XHR2YXIgc3R5bGUgPSB7fTtcblx0XHRfZXh0ZW5kcyhzdHlsZSwgdGhpcy50b3VjaFN0eWxlcygpLCBwcm9wcy5zdHlsZSk7XG5cblx0XHR2YXIgbmV3Q29tcG9uZW50UHJvcHMgPSBfZXh0ZW5kcyh7fSwgcHJvcHMsIHtcblx0XHRcdHN0eWxlOiBzdHlsZSxcblx0XHRcdGNsYXNzTmFtZTogY2xhc3NOYW1lLFxuXHRcdFx0ZGlzYWJsZWQ6IHByb3BzLmRpc2FibGVkLFxuXHRcdFx0aGFuZGxlcnM6IHRoaXMuaGFuZGxlcnNcblx0XHR9LCB0aGlzLmhhbmRsZXJzKCkpO1xuXG5cdFx0ZGVsZXRlIG5ld0NvbXBvbmVudFByb3BzLm9uVGFwO1xuXHRcdGRlbGV0ZSBuZXdDb21wb25lbnRQcm9wcy5vblByZXNzO1xuXHRcdGRlbGV0ZSBuZXdDb21wb25lbnRQcm9wcy5vblBpbmNoU3RhcnQ7XG5cdFx0ZGVsZXRlIG5ld0NvbXBvbmVudFByb3BzLm9uUGluY2hNb3ZlO1xuXHRcdGRlbGV0ZSBuZXdDb21wb25lbnRQcm9wcy5vblBpbmNoRW5kO1xuXHRcdGRlbGV0ZSBuZXdDb21wb25lbnRQcm9wcy5tb3ZlVGhyZXNob2xkO1xuXHRcdGRlbGV0ZSBuZXdDb21wb25lbnRQcm9wcy5wcmVzc0RlbGF5O1xuXHRcdGRlbGV0ZSBuZXdDb21wb25lbnRQcm9wcy5wcmVzc01vdmVUaHJlc2hvbGQ7XG5cdFx0ZGVsZXRlIG5ld0NvbXBvbmVudFByb3BzLnByZXZlbnREZWZhdWx0O1xuXHRcdGRlbGV0ZSBuZXdDb21wb25lbnRQcm9wcy5zdG9wUHJvcGFnYXRpb247XG5cdFx0ZGVsZXRlIG5ld0NvbXBvbmVudFByb3BzLmNvbXBvbmVudDtcblxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KHByb3BzLmNvbXBvbmVudCwgbmV3Q29tcG9uZW50UHJvcHMsIHByb3BzLmNoaWxkcmVuKTtcblx0fVxufSk7XG5cbkNvbXBvbmVudC5NaXhpbiA9IE1peGluO1xubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQ7IiwibW9kdWxlLmV4cG9ydHMgPSBleHRlbmRcblxuZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCkge1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcblx0eyBuYW1lOiAnRGVjZW1iZXInLCAgIG51bWJlcjogJzEyJywgIHNlYXNvbjogJ1N1bW1lcicgfSxcblx0eyBuYW1lOiAnSmFudWFyeScsICAgIG51bWJlcjogJzEnLCAgIHNlYXNvbjogJ1N1bW1lcicgfSxcblx0eyBuYW1lOiAnRmVicnVhcnknLCAgIG51bWJlcjogJzInLCAgIHNlYXNvbjogJ1N1bW1lcicgfSxcblx0eyBuYW1lOiAnTWFyY2gnLCAgICAgIG51bWJlcjogJzMnLCAgIHNlYXNvbjogJ0F1dHVtbicgfSxcblx0eyBuYW1lOiAnQXByaWwnLCAgICAgIG51bWJlcjogJzQnLCAgIHNlYXNvbjogJ0F1dHVtbicgfSxcblx0eyBuYW1lOiAnTWF5JywgICAgICAgIG51bWJlcjogJzUnLCAgIHNlYXNvbjogJ0F1dHVtbicgfSxcblx0eyBuYW1lOiAnSnVuZScsICAgICAgIG51bWJlcjogJzYnLCAgIHNlYXNvbjogJ1dpbnRlcicgfSxcblx0eyBuYW1lOiAnSnVseScsICAgICAgIG51bWJlcjogJzcnLCAgIHNlYXNvbjogJ1dpbnRlcicgfSxcblx0eyBuYW1lOiAnQXVndXN0JywgICAgIG51bWJlcjogJzgnLCAgIHNlYXNvbjogJ1dpbnRlcicgfSxcblx0eyBuYW1lOiAnU2VwdGVtYmVyJywgIG51bWJlcjogJzknLCAgIHNlYXNvbjogJ1NwcmluZycgfSxcblx0eyBuYW1lOiAnT2N0b2JlcicsICAgIG51bWJlcjogJzEwJywgIHNlYXNvbjogJ1NwcmluZycgfSxcblx0eyBuYW1lOiAnTm92ZW1iZXInLCAgIG51bWJlcjogJzExJywgIHNlYXNvbjogJ1NwcmluZycgfVxuXTsiLCJtb2R1bGUuZXhwb3J0cyA9IFtcblx0eyBuYW1lOiB7IGZpcnN0OiAnQmVuamFtaW4nLCBsYXN0OiAnTHVwdG9uJyB9LCAgICBqb2luZWREYXRlOiAnTWFyIDgsIDIwMDknLCAgIGxvY2F0aW9uOiAnU3lkbmV5LCBBVScsICAgICAgICAgIGltZzogJ2h0dHBzOi8vYXZhdGFyczAuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvNjExNDg/dj0zJnM9NDYwJywgICAgYmlvOiAnJywgIGZsYXZvdXI6ICd2YW5pbGxhJ30sXG5cdHsgbmFtZTogeyBmaXJzdDogJ0JvcmlzJywgICAgbGFzdDogJ0JvemljJyB9LCAgICAgam9pbmVkRGF0ZTogJ01hciAxMiwgMjAxMycsICBsb2NhdGlvbjogJ1N5ZG5leSwgQVUnLCAgICAgICAgICBpbWc6ICdodHRwczovL2F2YXRhcnMxLmdpdGh1YnVzZXJjb250ZW50LmNvbS91LzM4Mzg3MTY/dj0zJnM9NDYwJywgIGJpbzogJycsICBmbGF2b3VyOiAnY2hvY29sYXRlJ30sXG5cdHsgbmFtZTogeyBmaXJzdDogJ0NhcmxvcycsICAgbGFzdDogJ0NvbG9uJyB9LCAgICAgam9pbmVkRGF0ZTogJ05vdiA3LCAyMDEzJywgICBsb2NhdGlvbjogJ05ldyBIYW1wc2hpcmUsIFVTQScsICBpbWc6ICdodHRwczovL2F2YXRhcnMzLmdpdGh1YnVzZXJjb250ZW50LmNvbS91LzU4NzI1MTU/dj0zJnM9NDYwJywgIGJpbzogJycsICBmbGF2b3VyOiAnY2FyYW1lbCd9LFxuXHR7IG5hbWU6IHsgZmlyc3Q6ICdEYXZpZCcsICAgIGxhc3Q6ICdCYW5oYW0nIH0sICAgIGpvaW5lZERhdGU6ICdGZWIgMjIsIDIwMTEnLCAgbG9jYXRpb246ICdTeWRuZXksIEFVJywgICAgICAgICAgaW1nOiAnaHR0cHM6Ly9hdmF0YXJzMy5naXRodWJ1c2VyY29udGVudC5jb20vdS82MzE4MzI/dj0zJnM9NDYwJywgICBiaW86ICcnLCAgZmxhdm91cjogJ3N0cmF3YmVycnknfSxcblx0eyBuYW1lOiB7IGZpcnN0OiAnRnJlZGVyaWMnLCBsYXN0OiAnQmVhdWRldCcgfSwgICBqb2luZWREYXRlOiAnTWFyIDEyLCAyMDEzJywgIGxvY2F0aW9uOiAnTW9udHJlYWwnLCAgICAgICAgICAgIGltZzogJ2h0dHBzOi8vYXZhdGFyczAuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMzgzMzMzNT92PTMmcz00NjAnLCAgYmlvOiAnJywgIGZsYXZvdXI6ICdzdHJhd2JlcnJ5J30sXG5cdHsgbmFtZTogeyBmaXJzdDogJ0phbWVzJywgICAgbGFzdDogJ0FsbGVuJyB9LCAgICAgam9pbmVkRGF0ZTogJ0ZlYiAxNCwgMjAxMycsICBsb2NhdGlvbjogJ01hbmNoZXN0ZXInLCAgICAgICAgICBpbWc6ICcnLCAgYmlvOiAnJywgIGZsYXZvdXI6ICdiYW5hbmEnfSxcblx0eyBuYW1lOiB7IGZpcnN0OiAnSmVkJywgICAgICBsYXN0OiAnV2F0c29uJyB9LCAgICBqb2luZWREYXRlOiAnSnVuIDI0LCAyMDExJywgIGxvY2F0aW9uOiAnU3lkbmV5LCBBVScsICAgICAgICAgIGltZzogJ2h0dHBzOi8vYXZhdGFyczEuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvODcyMzEwP3Y9MyZzPTQ2MCcsICAgYmlvOiAnJywgIGZsYXZvdXI6ICdiYW5hbmEnfSxcblx0eyBuYW1lOiB7IGZpcnN0OiAnSm9zcycsICAgICBsYXN0OiAnTWFja2lzb24nIH0sICBqb2luZWREYXRlOiAnTm92IDYsIDIwMTInLCAgIGxvY2F0aW9uOiAnU3lkbmV5LCBBVScsICAgICAgICAgIGltZzogJ2h0dHBzOi8vYXZhdGFyczIuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMjczMDgzMz92PTMmcz00NjAnLCAgYmlvOiAnJywgIGZsYXZvdXI6ICdsZW1vbid9LFxuXHR7IG5hbWU6IHsgZmlyc3Q6ICdKb2hubnknLCAgIGxhc3Q6ICdFc3RpbGxlcycgfSwgIGpvaW5lZERhdGU6ICdTZXAgMjMsIDIwMTMnLCAgbG9jYXRpb246ICdQaGlsaXBwaW5lcycsICAgICAgICAgaW1nOiAnJywgIGJpbzogJycsICBmbGF2b3VyOiAnbGVtb24nfSxcblx0eyBuYW1lOiB7IGZpcnN0OiAnTWFya3VzJywgICBsYXN0OiAnUGFkb3VyZWsnIH0sICBqb2luZWREYXRlOiAnT2N0IDE3LCAyMDEyJywgIGxvY2F0aW9uOiAnTG9uZG9uLCBVSycsICAgICAgICAgIGltZzogJ2h0dHBzOi8vYXZhdGFyczIuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMjU4MDI1ND92PTMmcz00NjAnLCAgYmlvOiAnJywgIGZsYXZvdXI6ICdwYXN0YWNjaW8nfSxcblx0eyBuYW1lOiB7IGZpcnN0OiAnTWlrZScsICAgICBsYXN0OiAnR3JhYm93c2tpJyB9LCBqb2luZWREYXRlOiAnT2N0IDIsIDIwMTInLCAgIGxvY2F0aW9uOiAnTG9uZG9uLCBVSycsICAgICAgICAgIGltZzogJ2h0dHBzOi8vYXZhdGFyczMuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMjQ2NDk2Nj92PTMmcz00NjAnLCAgYmlvOiAnJywgIGZsYXZvdXI6ICd2YW5pbGxhJ30sXG5cdHsgbmFtZTogeyBmaXJzdDogJ1JvYicsICAgICAgbGFzdDogJ01vcnJpcycgfSwgICAgam9pbmVkRGF0ZTogJ09jdCAxOCwgMjAxMicsICBsb2NhdGlvbjogJ1N5ZG5leSwgQVUnLCAgICAgICAgICBpbWc6ICdodHRwczovL2F2YXRhcnMzLmdpdGh1YnVzZXJjb250ZW50LmNvbS91LzI1ODcxNjM/dj0zJnM9NDYwJywgIGJpbzogJycsICBmbGF2b3VyOiAnY2hvY29sYXRlJ30sXG5cdHsgbmFtZTogeyBmaXJzdDogJ1NpbW9uJywgICAgbGFzdDogJ1RheWxvcicgfSwgICAgam9pbmVkRGF0ZTogJ1NlcCAxNCwgMjAxMycsICBsb2NhdGlvbjogJ1N5ZG5leSwgQVUnLCAgICAgICAgICBpbWc6ICdodHRwczovL2F2YXRhcnMxLmdpdGh1YnVzZXJjb250ZW50LmNvbS91LzU0NTcyNjc/dj0zJnM9NDYwJywgIGJpbzogJycsICBmbGF2b3VyOiAnY2FyYW1lbCd9LFxuXHR7IG5hbWU6IHsgZmlyc3Q6ICdTdGV2ZW4nLCAgIGxhc3Q6ICdTdGVuZWtlcicgfSwgIGpvaW5lZERhdGU6ICdKdW4gMzAsIDIwMDgnLCAgbG9jYXRpb246ICdTeWRuZXksIEFVJywgICAgICAgICAgaW1nOiAnaHR0cHM6Ly9hdmF0YXJzMy5naXRodWJ1c2VyY29udGVudC5jb20vdS8xNTU1ND92PTMmcz00NjAnLCAgICBiaW86ICcnLCAgZmxhdm91cjogJ3N0cmF3YmVycnknfSxcblx0eyBuYW1lOiB7IGZpcnN0OiAnVG9tJywgICAgICBsYXN0OiAnV2Fsa2VyJyB9LCAgICBqb2luZWREYXRlOiAnQXByIDE5LCAyMDExJywgIGxvY2F0aW9uOiAnU3lkbmV5LCBBVScsICAgICAgICAgIGltZzogJ2h0dHBzOi8vYXZhdGFyczIuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvNzM3ODIxP3Y9MyZzPTQ2MCcsICAgYmlvOiAnJywgIGZsYXZvdXI6ICdiYW5hbmEnfSxcblx0eyBuYW1lOiB7IGZpcnN0OiAnVHVhbicsICAgICBsYXN0OiAnSG9hbmcnIH0sICAgICBqb2luZWREYXRlOiAnTWFyIDE5LCAyMDEzJywgIGxvY2F0aW9uOiAnU3lkbmV5LCBBVScsICAgICAgICAgIGltZzogJ2h0dHBzOi8vYXZhdGFyczAuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMzkwNjUwNT92PTMmcz00NjAnLCAgYmlvOiAnJywgIGZsYXZvdXI6ICdsZW1vbicgfVxuXTsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSZWFjdENTU1RyYW5zaXRpb25Hcm91cCA9IFJlYWN0LmFkZG9ucy5DU1NUcmFuc2l0aW9uR3JvdXA7XG52YXIgY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIFRvdWNoc3RvbmUgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKTtcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG5cbnZhciB2aWV3cyA9IHtcblxuICAvLyBhcHBcbiAgJ2hvbWUnOiByZXF1aXJlKCcuL3ZpZXdzL2hvbWUnKSxcblxuICAvLyBjb21wb25lbnRzXG4gICdjb21wb25lbnQtZmVlZGJhY2snOiByZXF1aXJlKCcuL3ZpZXdzL2NvbXBvbmVudC9mZWVkYmFjaycpLFxuXG4gICdjb21wb25lbnQtaGVhZGVyYmFyJzogcmVxdWlyZSgnLi92aWV3cy9jb21wb25lbnQvYmFyLWhlYWRlcicpLFxuICAnY29tcG9uZW50LWhlYWRlcmJhci1zZWFyY2gnOiByZXF1aXJlKCcuL3ZpZXdzL2NvbXBvbmVudC9iYXItaGVhZGVyLXNlYXJjaCcpLFxuICAnY29tcG9uZW50LWFsZXJ0YmFyJzogcmVxdWlyZSgnLi92aWV3cy9jb21wb25lbnQvYmFyLWFsZXJ0JyksXG4gICdjb21wb25lbnQtYWN0aW9uYmFyJzogcmVxdWlyZSgnLi92aWV3cy9jb21wb25lbnQvYmFyLWFjdGlvbicpLFxuICAnY29tcG9uZW50LWZvb3RlcmJhcic6IHJlcXVpcmUoJy4vdmlld3MvY29tcG9uZW50L2Jhci1mb290ZXInKSxcblxuICAnY29tcG9uZW50LXBhc3Njb2RlJzogcmVxdWlyZSgnLi92aWV3cy9jb21wb25lbnQvcGFzc2NvZGUnKSxcbiAgJ2NvbXBvbmVudC10b2dnbGUnOiByZXF1aXJlKCcuL3ZpZXdzL2NvbXBvbmVudC90b2dnbGUnKSxcbiAgJ2NvbXBvbmVudC1mb3JtJzogcmVxdWlyZSgnLi92aWV3cy9jb21wb25lbnQvZm9ybScpLFxuXG4gICdjb21wb25lbnQtc2ltcGxlLWxpc3QnOiByZXF1aXJlKCcuL3ZpZXdzL2NvbXBvbmVudC9saXN0LXNpbXBsZScpLFxuICAnY29tcG9uZW50LWNvbXBsZXgtbGlzdCc6IHJlcXVpcmUoJy4vdmlld3MvY29tcG9uZW50L2xpc3QtY29tcGxleCcpLFxuICAnY29tcG9uZW50LWNhdGVnb3Jpc2VkLWxpc3QnOiByZXF1aXJlKCcuL3ZpZXdzL2NvbXBvbmVudC9saXN0LWNhdGVnb3Jpc2VkJyksXG5cbiAgLy8gdHJhbnNpdGlvbnNcbiAgJ3RyYW5zaXRpb25zJzogcmVxdWlyZSgnLi92aWV3cy90cmFuc2l0aW9ucycpLFxuICAndHJhbnNpdGlvbnMtdGFyZ2V0JzogcmVxdWlyZSgnLi92aWV3cy90cmFuc2l0aW9ucy10YXJnZXQnKSxcblxuICAvLyBkZXRhaWxzIHZpZXdcbiAgJ2RldGFpbHMnOiByZXF1aXJlKCcuL3ZpZXdzL2RldGFpbHMnKSxcbiAgJ3JhZGlvLWxpc3QnOiByZXF1aXJlKCcuL3ZpZXdzL3JhZGlvLWxpc3QnKVxufTtcblxudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbVG91Y2hzdG9uZS5jcmVhdGVBcHAodmlld3MpXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc3RhcnRWaWV3ID0gJ2hvbWUnO1xuXG4gICAgLy8gcmVzb3J0IHRvICN2aWV3TmFtZSBpZiBpdCBleGlzdHNcbiAgICBpZiAod2luZG93LmxvY2F0aW9uLmhhc2gpIHtcbiAgICAgIHZhciBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoMSk7XG5cbiAgICAgIGlmIChoYXNoIGluIHZpZXdzKSBzdGFydFZpZXcgPSBoYXNoO1xuICAgIH1cblxuICAgIHZhciBpbml0aWFsU3RhdGUgPSB7XG4gICAgICBjdXJyZW50Vmlldzogc3RhcnRWaWV3LFxuICAgICAgaXNOYXRpdmVBcHA6ICh0eXBlb2YgY29yZG92YSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgfTtcblxuICAgIHJldHVybiBpbml0aWFsU3RhdGU7XG4gIH0sXG5cbiAgZ290b0RlZmF1bHRWaWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zaG93VmlldygnaG9tZScsICdmYWRlJyk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFwcFdyYXBwZXJDbGFzc05hbWUgPSBjbGFzc25hbWVzKHtcbiAgICAgICdhcHAtd3JhcHBlcic6IHRydWUsXG4gICAgICAnaXMtbmF0aXZlLWFwcCc6IHRoaXMuc3RhdGUuaXNOYXRpdmVBcHBcbiAgICB9KTtcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YXBwV3JhcHBlckNsYXNzTmFtZX0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZGV2aWNlLXNpbGhvdWV0dGVcIj5cbiAgICAgICAgICA8UmVhY3RDU1NUcmFuc2l0aW9uR3JvdXAgdHJhbnNpdGlvbk5hbWU9e3RoaXMuc3RhdGUudmlld1RyYW5zaXRpb24ubmFtZX0gdHJhbnNpdGlvbkVudGVyPXt0aGlzLnN0YXRlLnZpZXdUcmFuc2l0aW9uLmlufSB0cmFuc2l0aW9uTGVhdmU9e3RoaXMuc3RhdGUudmlld1RyYW5zaXRpb24ub3V0fSBjbGFzc05hbWU9XCJ2aWV3LXdyYXBwZXJcIiBjb21wb25lbnQ9XCJkaXZcIj5cbiAgICAgICAgICAgIHt0aGlzLmdldEN1cnJlbnRWaWV3KCl9XG4gICAgICAgICAgPC9SZWFjdENTU1RyYW5zaXRpb25Hcm91cD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZGVtby13cmFwcGVyXCI+XG4gICAgICAgICAgPGltZyBzcmM9XCJpbWcvbG9nby1tYXJrLnN2Z1wiIGFsdD1cIlRvdWNoc3RvbmVKU1wiIGNsYXNzTmFtZT1cImRlbW8tYnJhbmRcIiB3aWR0aD1cIjgwXCIgaGVpZ2h0PVwiODBcIiAvPlxuICAgICAgICAgIDxoMT5cbiAgICAgICAgICAgIFRvdWNoc3RvbmVKU1xuICAgICAgICAgICAgPHNtYWxsPiBkZW1vPC9zbWFsbD5cbiAgICAgICAgICA8L2gxPlxuICAgICAgICAgIDxwPlJlYWN0LmpzIHBvd2VyZWQgVUkgZnJhbWV3b3JrIGZvciBkZXZlbG9waW5nIGJlYXV0aWZ1bCBoeWJyaWQgbW9iaWxlIGFwcHMuPC9wPlxuICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJkZW1vLWxpbmtzXCI+XG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cImh0dHBzOi8vdHdpdHRlci5jb20vdG91Y2hzdG9uZWpzXCIgdGFyZ2V0PVwiX2JsYW5rXCIgY2xhc3NOYW1lPVwiaW9uLXNvY2lhbC10d2l0dGVyXCI+VHdpdHRlcjwvYT48L2xpPlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vamVkd2F0c29uL3RvdWNoc3RvbmVqc1wiIHRhcmdldD1cIl9ibGFua1wiIGNsYXNzTmFtZT1cImlvbi1zb2NpYWwtZ2l0aHViXCI+R2l0aHViPC9hPjwvbGk+XG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cImh0dHA6Ly90b3VjaHN0b25lanMuaW9cIiB0YXJnZXQ9XCJfYmxhbmtcIiBjbGFzc05hbWU9XCJpb24tbWFwXCI+Um9hZG1hcDwvYT48L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIHN0YXJ0QXBwICgpIHtcbiAgUmVhY3QucmVuZGVyKDxBcHAgLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKSk7XG59XG5cbmZ1bmN0aW9uIG9uRGV2aWNlUmVhZHkgKCkge1xuICBTdGF0dXNCYXIuc3R5bGVEZWZhdWx0KCk7XG4gIHN0YXJ0QXBwKCk7XG59XG5cbmlmICh0eXBlb2YgY29yZG92YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgc3RhcnRBcHAoKTtcbn0gZWxzZSB7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2RldmljZXJlYWR5Jywgb25EZXZpY2VSZWFkeSwgZmFsc2UpO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7fTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFNldENsYXNzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpLFxuXHRUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyksXG5cdE5hdmlnYXRpb24gPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5OYXZpZ2F0aW9uLFxuXHRMaW5rID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTGluayxcblx0VUkgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5VSTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW05hdmlnYXRpb25dLFxuXG5cdGZsYXNoQWxlcnQ6IGZ1bmN0aW9uIChhbGVydENvbnRlbnQpIHtcblx0XHRhbGVydChhbGVydENvbnRlbnQpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxVSS5WaWV3PlxuXHRcdFx0XHQ8VUkuSGVhZGVyYmFyIHR5cGU9XCJkZWZhdWx0XCIgbGFiZWw9XCJBY3Rpb24gQmFyXCI+XG5cdFx0XHRcdFx0PExpbmsgdG89XCJob21lXCIgdmlld1RyYW5zaXRpb249XCJyZXZlYWwtZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cIkhlYWRlcmJhci1idXR0b24gaW9uLWNoZXZyb24tbGVmdFwiIGNvbXBvbmVudD1cImJ1dHRvblwiPkJhY2s8L0xpbms+XG5cdFx0XHRcdDwvVUkuSGVhZGVyYmFyPlxuXHRcdFx0XHQ8VUkuVmlld0NvbnRlbnQgZ3JvdyBzY3JvbGxhYmxlPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGVyIHRleHQtY2Fwc1wiPkxhYmVsIE9ubHk8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsXCI+XG5cdFx0XHRcdFx0XHQ8VUkuQWN0aW9uQnV0dG9ucz5cblx0XHRcdFx0XHRcdFx0PFVJLkFjdGlvbkJ1dHRvbiBvblRhcD17dGhpcy5mbGFzaEFsZXJ0LmJpbmQodGhpcywgJ1lvdSB0YXBwZWQgYW4gYWN0aW9uIGJ1dHRvbi4nKX0gIGxhYmVsPVwiUHJpbWFyeSBBY3Rpb25cIiAvPlxuXHRcdFx0XHRcdFx0XHQ8VUkuQWN0aW9uQnV0dG9uIG9uVGFwPXt0aGlzLmZsYXNoQWxlcnQuYmluZCh0aGlzLCAnWW91IHRhcHBlZCBhbiBhY3Rpb24gYnV0dG9uLicpfSBsYWJlbD1cIlNlY29uZGFyeSBBY3Rpb25cIiAvPlxuXHRcdFx0XHRcdFx0PC9VSS5BY3Rpb25CdXR0b25zPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGVyIHRleHQtY2Fwc1wiPkljb24gT25seTwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWxcIj5cblx0XHRcdFx0XHRcdDxVSS5BY3Rpb25CdXR0b25zPlxuXHRcdFx0XHRcdFx0XHQ8VUkuQWN0aW9uQnV0dG9uIG9uVGFwPXt0aGlzLmZsYXNoQWxlcnQuYmluZCh0aGlzLCAnWW91IHRhcHBlZCBhbiBhY3Rpb24gYnV0dG9uLicpfSAgaWNvbj1cImlvbi1hcnJvdy11cC1jXCIgLz5cblx0XHRcdFx0XHRcdFx0PFVJLkFjdGlvbkJ1dHRvbiBvblRhcD17dGhpcy5mbGFzaEFsZXJ0LmJpbmQodGhpcywgJ1lvdSB0YXBwZWQgYW4gYWN0aW9uIGJ1dHRvbi4nKX0gaWNvbj1cImlvbi1hcnJvdy1kb3duLWNcIiAvPlxuXHRcdFx0XHRcdFx0PC9VSS5BY3Rpb25CdXR0b25zPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGVyIHRleHQtY2Fwc1wiPkljb24gJmFtcDsgTGFiZWw8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsXCI+XG5cdFx0XHRcdFx0XHQ8VUkuQWN0aW9uQnV0dG9ucz5cblx0XHRcdFx0XHRcdFx0PFVJLkFjdGlvbkJ1dHRvbiBvblRhcD17dGhpcy5mbGFzaEFsZXJ0LmJpbmQodGhpcywgJ1lvdSB0YXBwZWQgYW4gYWN0aW9uIGJ1dHRvbi4nKX0gIGxhYmVsPVwiUHJpbWFyeSBBY3Rpb25cIiAgICBpY29uPVwiaW9uLWFycm93LXVwLWNcIiAvPlxuXHRcdFx0XHRcdFx0XHQ8VUkuQWN0aW9uQnV0dG9uIG9uVGFwPXt0aGlzLmZsYXNoQWxlcnQuYmluZCh0aGlzLCAnWW91IHRhcHBlZCBhbiBhY3Rpb24gYnV0dG9uLicpfSBsYWJlbD1cIlNlY29uZGFyeSBBY3Rpb25cIiBpY29uPVwiaW9uLWFycm93LWRvd24tY1wiIC8+XG5cdFx0XHRcdFx0XHQ8L1VJLkFjdGlvbkJ1dHRvbnM+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbC1oZWFkZXIgdGV4dC1jYXBzXCI+RWFzaWx5IEN1c3RvbWlzYWJsZTwvZGl2PlxuXHRcdFx0XHRcdDxVSS5BY3Rpb25CdXR0b25zIGNsYXNzTmFtZT1cInNwZWNpYWxcIj5cblx0XHRcdFx0XHRcdDxVSS5BY3Rpb25CdXR0b24gb25UYXA9e3RoaXMuZmxhc2hBbGVydC5iaW5kKHRoaXMsICdZb3UgdGFwcGVkIGFuIGFjdGlvbiBidXR0b24uJyl9ICBsYWJlbD1cIlByaW1hcnlcIiAgIGljb249XCJpb24tYW5kcm9pZC1jb250YWN0XCIgLz5cblx0XHRcdFx0XHRcdDxVSS5BY3Rpb25CdXR0b24gb25UYXA9e3RoaXMuZmxhc2hBbGVydC5iaW5kKHRoaXMsICdZb3UgdGFwcGVkIGFuIGFjdGlvbiBidXR0b24uJyl9ICBsYWJlbD1cIlNlY29uZGFyeVwiIGljb249XCJpb24tYW5kcm9pZC1jb250YWN0c1wiIC8+XG5cdFx0XHRcdFx0XHQ8VUkuQWN0aW9uQnV0dG9uIG9uVGFwPXt0aGlzLmZsYXNoQWxlcnQuYmluZCh0aGlzLCAnWW91IHRhcHBlZCBhbiBhY3Rpb24gYnV0dG9uLicpfSAgbGFiZWw9XCJUZXJ0aWFyeVwiICBpY29uPVwiaW9uLWFuZHJvaWQtZnJpZW5kc1wiIC8+XG5cdFx0XHRcdFx0PC9VSS5BY3Rpb25CdXR0b25zPlxuXHRcdFx0XHQ8L1VJLlZpZXdDb250ZW50PlxuXHRcdFx0PC9VSS5WaWV3PlxuXHRcdCk7XG5cdH1cbn0pO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0U2V0Q2xhc3MgPSByZXF1aXJlKCdjbGFzc25hbWVzJyksXG5cdFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKSxcblx0TmF2aWdhdGlvbiA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLk5hdmlnYXRpb24sXG5cdExpbmsgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5MaW5rLFxuXHRVSSA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLlVJO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbTmF2aWdhdGlvbl0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGFsZXJ0VHlwZTogJ2RlZmF1bHQnXG5cdFx0fVxuXHR9LFxuXG5cdGhhbmRsZUFsZXJ0Q2hhbmdlOiBmdW5jdGlvbiAobmV3QWxlcnRUeXBlKSB7XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGFsZXJ0VHlwZTogbmV3QWxlcnRUeXBlXG5cdFx0fSk7XG5cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8VUkuVmlldz5cblx0XHRcdFx0PFVJLkhlYWRlcmJhciB0eXBlPVwiZGVmYXVsdFwiIGxhYmVsPVwiQWxlcnQgQmFyXCI+XG5cdFx0XHRcdFx0PExpbmsgdG89XCJob21lXCIgdmlld1RyYW5zaXRpb249XCJyZXZlYWwtZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cIkhlYWRlcmJhci1idXR0b24gaW9uLWNoZXZyb24tbGVmdFwiIGNvbXBvbmVudD1cImJ1dHRvblwiPkJhY2s8L0xpbms+XG5cdFx0XHRcdDwvVUkuSGVhZGVyYmFyPlxuXHRcdFx0XHQ8VUkuQWxlcnRiYXIgdHlwZT17dGhpcy5zdGF0ZS5hbGVydFR5cGV9PldoZW4gdGhlIHN0YXRlIGlzIFwie3RoaXMuc3RhdGUuYWxlcnRUeXBlfVwiPC9VSS5BbGVydGJhcj5cblx0XHRcdFx0PFVJLlZpZXdDb250ZW50IGdyb3cgc2Nyb2xsYWJsZT5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsIHBhbmVsLS1maXJzdFwiPlxuXHRcdFx0XHRcdFx0PFVJLlJhZGlvTGlzdCB2YWx1ZT17dGhpcy5zdGF0ZS5hbGVydFR5cGV9IG9uQ2hhbmdlPXt0aGlzLmhhbmRsZUFsZXJ0Q2hhbmdlfSBvcHRpb25zPXtbXG5cdFx0XHRcdFx0XHRcdHsgbGFiZWw6ICdEZWZhdWx0JywgIHZhbHVlOiAnZGVmYXVsdCcgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ1ByaW1hcnknLCAgdmFsdWU6ICdwcmltYXJ5JyB9LFxuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnU3VjY2VzcycsICB2YWx1ZTogJ3N1Y2Nlc3MnIH0sXG5cdFx0XHRcdFx0XHRcdHsgbGFiZWw6ICdXYXJuaW5nJywgIHZhbHVlOiAnd2FybmluZycgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ0RhbmdlcicsICAgdmFsdWU6ICdkYW5nZXInIH1cblx0XHRcdFx0XHRcdF19IC8+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvVUkuVmlld0NvbnRlbnQ+XG5cdFx0XHQ8L1VJLlZpZXc+XG5cdFx0KTtcblx0fVxufSk7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRTZXRDbGFzcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKSxcblx0VGFwcGFibGUgPSByZXF1aXJlKCdyZWFjdC10YXBwYWJsZScpLFxuXHROYXZpZ2F0aW9uID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTmF2aWdhdGlvbixcblx0TGluayA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLkxpbmssXG5cdFVJID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuVUk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtOYXZpZ2F0aW9uXSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZUtleTogJ2ljb24nXG5cdFx0fVxuXHR9LFxuXG5cdGhhbmRsZUZvb3RlckNoYW5nZTogZnVuY3Rpb24gKG5ld1R5cGUpIHtcblxuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0dHlwZUtleTogbmV3VHlwZVxuXHRcdH0pO1xuXG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgZm9vdGVyYmFyQ2xhc3MgPSBTZXRDbGFzcyh0aGlzLnN0YXRlLnR5cGVLZXksIHtcblx0XHRcdCdmb290ZXJiYXInOiB0cnVlXG5cdFx0fSk7XG5cdFx0dmFyIHJlbmRlckZvb3RlcmJhcjtcblxuXHRcdGlmICh0aGlzLnN0YXRlLnR5cGVLZXkgPT09ICdpY29uJykge1xuXHRcdFx0cmVuZGVyRm9vdGVyYmFyID0gKDxVSS5Gb290ZXJiYXIgdHlwZT1cImRlZmF1bHRcIj5cblx0XHRcdFx0PFVJLkZvb3RlcmJhckJ1dHRvbiBpY29uPVwiaW9uLWlvczctYXJyb3ctbGVmdFwiIC8+XG5cdFx0XHRcdDxVSS5Gb290ZXJiYXJCdXR0b24gaWNvbj1cImlvbi1pb3M3LWFycm93LXJpZ2h0XCIgZGlzYWJsZWQgLz5cblx0XHRcdFx0PFVJLkZvb3RlcmJhckJ1dHRvbiBpY29uPVwiaW9uLWlvczctZG93bmxvYWRcIiAvPlxuXHRcdFx0XHQ8VUkuRm9vdGVyYmFyQnV0dG9uIGljb249XCJpb24taW9zNy1ib29rbWFya3Mtb3V0bGluZVwiIC8+XG5cdFx0XHRcdDxVSS5Gb290ZXJiYXJCdXR0b24gaWNvbj1cImlvbi1pb3M3LWJyb3dzZXJzXCIgLz5cblx0XHRcdDwvVUkuRm9vdGVyYmFyPilcblx0XHR9IGVsc2UgaWYgKHRoaXMuc3RhdGUudHlwZUtleSA9PT0gJ2xhYmVsJykge1xuXHRcdFx0cmVuZGVyRm9vdGVyYmFyID0gKDxVSS5Gb290ZXJiYXIgdHlwZT1cImRlZmF1bHRcIj5cblx0XHRcdFx0PFVJLkZvb3RlcmJhckJ1dHRvbiBsYWJlbD1cIkJhY2tcIiAvPlxuXHRcdFx0XHQ8VUkuRm9vdGVyYmFyQnV0dG9uIGxhYmVsPVwiRm9yd2FyZFwiIGRpc2FibGVkIC8+XG5cdFx0XHRcdDxVSS5Gb290ZXJiYXJCdXR0b24gbGFiZWw9XCJEb3dubG9hZFwiIC8+XG5cdFx0XHRcdDxVSS5Gb290ZXJiYXJCdXR0b24gbGFiZWw9XCJCb29rbWFya3NcIiAvPlxuXHRcdFx0XHQ8VUkuRm9vdGVyYmFyQnV0dG9uIGxhYmVsPVwiVGFic1wiIC8+XG5cdFx0XHQ8L1VJLkZvb3RlcmJhcj4pXG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0YXRlLnR5cGVLZXkgPT09ICdib3RoJykge1xuXHRcdFx0cmVuZGVyRm9vdGVyYmFyID0gKDxVSS5Gb290ZXJiYXIgdHlwZT1cImRlZmF1bHRcIj5cblx0XHRcdFx0PFVJLkZvb3RlcmJhckJ1dHRvbiBsYWJlbD1cIkJhY2tcIiBpY29uPVwiaW9uLWlvczctYXJyb3ctbGVmdFwiIC8+XG5cdFx0XHRcdDxVSS5Gb290ZXJiYXJCdXR0b24gbGFiZWw9XCJGb3J3YXJkXCIgaWNvbj1cImlvbi1pb3M3LWFycm93LXJpZ2h0XCIgZGlzYWJsZWQgLz5cblx0XHRcdFx0PFVJLkZvb3RlcmJhckJ1dHRvbiBsYWJlbD1cIkRvd25sb2FkXCIgaWNvbj1cImlvbi1pb3M3LWRvd25sb2FkXCIgLz5cblx0XHRcdFx0PFVJLkZvb3RlcmJhckJ1dHRvbiBsYWJlbD1cIkJvb2ttYXJrc1wiIGljb249XCJpb24taW9zNy1ib29rbWFya3Mtb3V0bGluZVwiIC8+XG5cdFx0XHRcdDxVSS5Gb290ZXJiYXJCdXR0b24gbGFiZWw9XCJUYWJzXCIgaWNvbj1cImlvbi1pb3M3LWJyb3dzZXJzXCIgLz5cblx0XHRcdDwvVUkuRm9vdGVyYmFyPilcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PFVJLlZpZXc+XG5cdFx0XHRcdDxVSS5IZWFkZXJiYXIgdHlwZT1cImRlZmF1bHRcIiBsYWJlbD1cIkZvb3RlciBCYXJcIj5cblx0XHRcdFx0XHQ8TGluayB0bz1cImhvbWVcIiB2aWV3VHJhbnNpdGlvbj1cInJldmVhbC1mcm9tLXJpZ2h0XCIgY2xhc3NOYW1lPVwiSGVhZGVyYmFyLWJ1dHRvbiBpb24tY2hldnJvbi1sZWZ0XCIgY29tcG9uZW50PVwiYnV0dG9uXCI+QmFjazwvTGluaz5cblx0XHRcdFx0PC9VSS5IZWFkZXJiYXI+XG5cdFx0XHRcdDxVSS5WaWV3Q29udGVudCBncm93IHNjcm9sbGFibGU+XG5cdFx0XHRcdFx0ey8qPGRpdiBjbGFzc05hbWU9XCJ2aWV3LWlubmVyXCI+XG5cdFx0XHRcdFx0XHQ8VUkuVG9nZ2xlIHZhbHVlPXt0aGlzLnN0YXRlLnR5cGVLZXl9IG9uQ2hhbmdlPXt0aGlzLmhhbmRsZUZvb3RlckNoYW5nZX0gb3B0aW9ucz17W1xuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnSWNvbicsIHZhbHVlOiAnaWNvbicgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ0xhYmVsJywgdmFsdWU6ICdsYWJlbCcgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ0JvdGgnLCB2YWx1ZTogJ2JvdGgnIH1cblx0XHRcdFx0XHRcdF19IC8+XG5cdFx0XHRcdFx0PC9kaXY+Ki99XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ2aWV3LWZlZWRiYWNrXCI+XG5cdFx0XHRcdFx0XHRZb3VyIGFwcCdzIGFtYXppbmcgY29udGVudCBoZXJlLlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L1VJLlZpZXdDb250ZW50PlxuXHRcdFx0XHR7cmVuZGVyRm9vdGVyYmFyfVxuXHRcdFx0PC9VSS5WaWV3PlxuXHRcdCk7XG5cdH1cbn0pO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0U2V0Q2xhc3MgPSByZXF1aXJlKCdjbGFzc25hbWVzJyksXG5cdE5hdmlnYXRpb24gPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5OYXZpZ2F0aW9uLFxuXHRUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyksXG5cdExpbmsgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5MaW5rLFxuXHRVSSA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLlVJO1xuXG52YXIgVGltZXJzID0gcmVxdWlyZSgncmVhY3QtdGltZXJzJyk7XG52YXIgTW9udGhzID0gcmVxdWlyZSgnLi4vLi4vLi4vZGF0YS9tb250aHMnKTtcblxudmFyIFNlYXJjaCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbVGltZXJzKCldLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdHNlYXJjaFN0cmluZzogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcblx0XHRvbkNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGYucmVmcy5pbnB1dC5nZXRET01Ob2RlKCkuZm9jdXMoKTtcblx0XHR9LCAxMDAwKTtcblx0fSxcblxuXHRoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uIChldmVudCkge1xuXHRcdHRoaXMucHJvcHMub25DaGFuZ2UoZXZlbnQudGFyZ2V0LnZhbHVlKTtcblx0fSxcblxuXHRyZXNldDogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMucHJvcHMub25DaGFuZ2UoJycpO1xuXHRcdHRoaXMucmVmcy5pbnB1dC5nZXRET01Ob2RlKCkuZm9jdXMoKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBjbGVhckljb24gPSBCb29sZWFuKHRoaXMucHJvcHMuc2VhcmNoU3RyaW5nLmxlbmd0aCkgPyA8VGFwcGFibGUgb25UYXA9e3RoaXMucmVzZXR9IGNsYXNzTmFtZT1cIkhlYWRlcmJhci1mb3JtLWNsZWFyIGlvbi1jbG9zZS1jaXJjbGVkXCIgLz4gOiAnJztcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8VUkuSGVhZGVyYmFyIHR5cGU9XCJkZWZhdWx0XCIgaGVpZ2h0PVwiMzZweFwiIGNsYXNzTmFtZT1cIkhlYWRlcmJhci1mb3JtIFN1YmhlYWRlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIkhlYWRlcmJhci1mb3JtLWZpZWxkIEhlYWRlcmJhci1mb3JtLWljb24gaW9uLWlvczctc2VhcmNoLXN0cm9uZ1wiPlxuXHRcdFx0XHRcdDxpbnB1dCByZWY9XCJpbnB1dFwiIHZhbHVlPXt0aGlzLnByb3BzLnNlYXJjaFN0cmluZ30gb25DaGFuZ2U9e3RoaXMuaGFuZGxlQ2hhbmdlfSBjbGFzc05hbWU9XCJIZWFkZXJiYXItZm9ybS1pbnB1dFwiIHBsYWNlaG9sZGVyPSdTZWFyY2guLi4nIC8+XG5cdFx0XHRcdFx0e2NsZWFySWNvbn1cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L1VJLkhlYWRlcmJhcj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG52YXIgSXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbTmF2aWdhdGlvbl0sXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImxpc3QtaXRlbVwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj57dGhpcy5wcm9wcy5tb250aC5uYW1lfTwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWFyY2hTdHJpbmc6ICcnXG5cdFx0fTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBzZWFyY2hTdHJpbmcgPSB0aGlzLnByb3BzLnNlYXJjaFN0cmluZztcblx0XHR2YXIgbW9udGhzID0gW107XG5cdFx0dmFyXHRsYXN0U2Vhc29uID0gJyc7XG5cdFx0dmFyIHJlbmRlckxpc3QgPSA8ZGl2IGNsYXNzTmFtZT1cInZpZXctZmVlZGJhY2stdGV4dFwiPk5vIG1hdGNoIGZvdW5kLi4uPC9kaXY+O1xuXG5cdFx0dGhpcy5wcm9wcy5tb250aHMuZm9yRWFjaChmdW5jdGlvbiAobW9udGgsIGkpIHtcblxuXHRcdFx0Ly8gZmlsdGVyIG1vbnRoc1xuXHRcdFx0aWYgKHNlYXJjaFN0cmluZyAmJiBtb250aC5uYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzZWFyY2hTdHJpbmcudG9Mb3dlckNhc2UoKSkgPT09IC0xKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gaW5zZXJ0IGNhdGVnb3JpZXNcblxuXHRcdFx0dmFyIHNlYXNvbiA9IG1vbnRoLnNlYXNvbjtcblxuXHRcdFx0aWYgKGxhc3RTZWFzb24gIT09IHNlYXNvbikge1xuXHRcdFx0XHRsYXN0U2Vhc29uID0gc2Vhc29uO1xuXG5cdFx0XHRcdG1vbnRocy5wdXNoKFxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibGlzdC1oZWFkZXJcIiBrZXk9e1wibGlzdC1oZWFkZXItXCIgKyBpfT57c2Vhc29ufTwvZGl2PlxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBjcmVhdGUgbGlzdFxuXG5cdFx0XHRtb250aC5rZXkgPSAnbW9udGgtJyArIGk7XG5cdFx0XHRtb250aHMucHVzaChSZWFjdC5jcmVhdGVFbGVtZW50KEl0ZW0sIHsgbW9udGg6IG1vbnRoIH0pKTtcblx0XHR9KTtcblxuXHRcdHZhciB3cmFwcGVyQ2xhc3NOYW1lID0gU2V0Q2xhc3MobW9udGhzLmxlbmd0aCA/ICdwYW5lbCBtYi0wJyA6ICd2aWV3LWZlZWRiYWNrJyk7XG5cblx0XHRpZiAobW9udGhzLmxlbmd0aCkge1xuXHRcdFx0cmVuZGVyTGlzdCA9IG1vbnRocztcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9e3dyYXBwZXJDbGFzc05hbWV9PlxuXHRcdFx0XHR7cmVuZGVyTGlzdH1cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRtaXhpbnM6IFtOYXZpZ2F0aW9uXSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VhcmNoU3RyaW5nOiAnJyxcblx0XHRcdG1vbnRoczogTW9udGhzXG5cdFx0fVxuXHR9LFxuXG5cdHVwZGF0ZVNlYXJjaDogZnVuY3Rpb24gKHN0cikge1xuXHRcdHRoaXMuc2V0U3RhdGUoeyBzZWFyY2hTdHJpbmc6IHN0ciB9KTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8VUkuVmlldz5cblx0XHRcdFx0PFVJLkhlYWRlcmJhciB0eXBlPVwiZGVmYXVsdFwiIGxhYmVsPVwiRmlsdGVyIE1vbnRoc1wiPlxuXHRcdFx0XHRcdDxMaW5rIHRvPVwiaG9tZVwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJIZWFkZXJiYXItYnV0dG9uIGlvbi1jaGV2cm9uLWxlZnRcIiBjb21wb25lbnQ9XCJidXR0b25cIj5CYWNrPC9MaW5rPlxuXHRcdFx0XHQ8L1VJLkhlYWRlcmJhcj5cblx0XHRcdFx0PFNlYXJjaCBzZWFyY2hTdHJpbmc9e3RoaXMuc3RhdGUuc2VhcmNoU3RyaW5nfSBvbkNoYW5nZT17dGhpcy51cGRhdGVTZWFyY2h9IC8+XG5cdFx0XHRcdDxVSS5WaWV3Q29udGVudCBncm93IHNjcm9sbGFibGU+XG5cdFx0XHRcdFx0PExpc3QgbW9udGhzPXt0aGlzLnN0YXRlLm1vbnRoc30gc2VhcmNoU3RyaW5nPXt0aGlzLnN0YXRlLnNlYXJjaFN0cmluZ30gLz5cblx0XHRcdFx0PC9VSS5WaWV3Q29udGVudD5cblx0XHRcdDwvVUkuVmlldz5cblx0XHQpO1xuXHR9XG59KTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFNldENsYXNzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpLFxuXHRUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyksXG5cdE5hdmlnYXRpb24gPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5OYXZpZ2F0aW9uLFxuXHRMaW5rID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTGluayxcblx0VUkgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5VSTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW05hdmlnYXRpb25dLFxuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlS2V5OiAnZGVmYXVsdCdcblx0XHR9XG5cdH0sXG5cblx0aGFuZGxlSGVhZGVyQ2hhbmdlOiBmdW5jdGlvbiAobmV3VHlwZSkge1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHR0eXBlS2V5OiBuZXdUeXBlXG5cdFx0fSk7XG5cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8VUkuVmlldz5cblx0XHRcdFx0PFVJLkhlYWRlcmJhciB0eXBlPXt0aGlzLnN0YXRlLnR5cGVLZXl9IGxhYmVsPVwiSGVhZGVyIEJhclwiPlxuXHRcdFx0XHRcdDxMaW5rIHRvPVwiaG9tZVwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJIZWFkZXJiYXItYnV0dG9uIGlvbi1jaGV2cm9uLWxlZnRcIiBjb21wb25lbnQ9XCJidXR0b25cIj5CYWNrPC9MaW5rPlxuXHRcdFx0XHQ8L1VJLkhlYWRlcmJhcj5cblx0XHRcdFx0PFVJLlZpZXdDb250ZW50IGdyb3cgc2Nyb2xsYWJsZT5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsIHBhbmVsLS1maXJzdFwiPlxuXHRcdFx0XHRcdFx0PFVJLlJhZGlvTGlzdCB2YWx1ZT17dGhpcy5zdGF0ZS50eXBlS2V5fSBvbkNoYW5nZT17dGhpcy5oYW5kbGVIZWFkZXJDaGFuZ2V9IG9wdGlvbnM9e1tcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ0RlZmF1bHQnLCAgdmFsdWU6ICdkZWZhdWx0JyB9LFxuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnR3JlZW4nLCB2YWx1ZTogJ2dyZWVuJyB9LFxuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnQmx1ZScsIHZhbHVlOiAnYmx1ZScgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ0xpZ2h0IEJsdWUnLCB2YWx1ZTogJ2xpZ2h0LWJsdWUnIH0sXG5cdFx0XHRcdFx0XHRcdHsgbGFiZWw6ICdZZWxsb3cnLCB2YWx1ZTogJ3llbGxvdycgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ09yYW5nZScsIHZhbHVlOiAnb3JhbmdlJyB9LFxuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnUmVkJywgdmFsdWU6ICdyZWQnIH0sXG5cdFx0XHRcdFx0XHRcdHsgbGFiZWw6ICdQaW5rJywgdmFsdWU6ICdwaW5rJyB9LFxuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnUHVycGxlJywgdmFsdWU6ICdwdXJwbGUnIH1cblx0XHRcdFx0XHRcdF19IC8+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvVUkuVmlld0NvbnRlbnQ+XG5cdFx0XHQ8L1VJLlZpZXc+XG5cdFx0KTtcblx0fVxufSk7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFVJID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuVUk7XG52YXIgTGluayA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLkxpbms7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRmbGFzaEFsZXJ0OiBmdW5jdGlvbiAoYWxlcnRDb250ZW50KSB7XG5cdFx0d2luZG93LmFsZXJ0KGFsZXJ0Q29udGVudCk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxVSS5WaWV3PlxuXHRcdFx0XHQ8VUkuSGVhZGVyYmFyIHR5cGU9XCJkZWZhdWx0XCIgbGFiZWw9XCJGZWVkYmFja1wiPlxuXHRcdFx0XHRcdDxMaW5rIHRvPVwiaG9tZVwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJIZWFkZXJiYXItYnV0dG9uIGlvbi1jaGV2cm9uLWxlZnRcIiBjb21wb25lbnQ9XCJidXR0b25cIj5CYWNrPC9MaW5rPlxuXHRcdFx0XHQ8L1VJLkhlYWRlcmJhcj5cblx0XHRcdFx0PFVJLlZpZXdDb250ZW50PlxuXHRcdFx0XHRcdDxVSS5GZWVkYmFjayBpY29uTmFtZT1cImlvbi1jb21wYXNzXCIgaWNvblR5cGU9XCJwcmltYXJ5XCIgaGVhZGVyPVwiT3B0aW9uYWwgSGVhZGVyXCIgc3ViaGVhZGVyPVwiU3ViaGVhZGVyLCBhbHNvIG9wdGlvbmFsXCIgdGV4dD1cIkZlZWRiYWNrIG1lc3NhZ2UgY29weSBnb2VzIGhlcmUuIEl0IGNhbiBiZSBvZiBhbnkgbGVuZ3RoLlwiIGFjdGlvblRleHQ9XCJPcHRpb25hbCBBY3Rpb25cIiBhY3Rpb25Gbj17dGhpcy5mbGFzaEFsZXJ0LmJpbmQodGhpcywgJ1lvdSBjbGlja2VkIHRoZSBhY3Rpb24uJyl9IC8+XG5cdFx0XHRcdDwvVUkuVmlld0NvbnRlbnQ+XG5cdFx0XHQ8L1VJLlZpZXc+XG5cdFx0KTtcblx0fVxufSk7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRTZXRDbGFzcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKSxcblx0VGFwcGFibGUgPSByZXF1aXJlKCdyZWFjdC10YXBwYWJsZScpLFxuXHROYXZpZ2F0aW9uID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTmF2aWdhdGlvbixcblx0TGluayA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLkxpbmssXG5cdFVJID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuVUk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtOYXZpZ2F0aW9uXSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Zmxhdm91cjogJ3N0cmF3YmVycnknXG5cdFx0fVxuXHR9LFxuXG5cdGhhbmRsZUZsYXZvdXJDaGFuZ2U6IGZ1bmN0aW9uIChuZXdGbGF2b3VyKSB7XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGZsYXZvdXI6IG5ld0ZsYXZvdXJcblx0XHR9KTtcblxuXHR9LFxuXG5cdGhhbmRsZVN3aXRjaDogZnVuY3Rpb24gKGtleSwgZXZlbnQpIHtcblx0XHR2YXIgbmV3U3RhdGUgPSB7fTtcblx0XHRuZXdTdGF0ZVtrZXldID0gIXRoaXMuc3RhdGVba2V5XTtcblxuXHRcdHRoaXMuc2V0U3RhdGUobmV3U3RhdGUpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxVSS5WaWV3PlxuXHRcdFx0XHQ8VUkuSGVhZGVyYmFyIHR5cGU9XCJkZWZhdWx0XCIgbGFiZWw9XCJGb3JtXCI+XG5cdFx0XHRcdFx0PExpbmsgdG89XCJob21lXCIgdmlld1RyYW5zaXRpb249XCJyZXZlYWwtZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cIkhlYWRlcmJhci1idXR0b24gaW9uLWNoZXZyb24tbGVmdFwiIGNvbXBvbmVudD1cImJ1dHRvblwiPkJhY2s8L0xpbms+XG5cdFx0XHRcdDwvVUkuSGVhZGVyYmFyPlxuXHRcdFx0XHQ8VUkuVmlld0NvbnRlbnQgZ3JvdyBzY3JvbGxhYmxlPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGVyIHRleHQtY2Fwc1wiPklucHV0czwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWxcIj5cblx0XHRcdFx0XHRcdDxVSS5JbnB1dCBwbGFjZWhvbGRlcj1cIkRlZmF1bHRcIiAvPlxuXHRcdFx0XHRcdFx0PFVJLklucHV0IGRlZmF1bHRWYWx1ZT1cIldpdGggVmFsdWVcIiBwbGFjZWhvbGRlcj1cIlBsYWNlaG9sZGVyXCIgLz5cblx0XHRcdFx0XHRcdDxVSS5UZXh0YXJlYSBkZWZhdWx0VmFsdWU9XCJMb25ndGV4dCBpcyBnb29kIGZvciBiaW9zIGV0Yy5cIiBwbGFjZWhvbGRlcj1cIkxvbmd0ZXh0XCIgLz5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsLWhlYWRlciB0ZXh0LWNhcHNcIj5MYWJlbGxlZCBJbnB1dHM8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsXCI+XG5cdFx0XHRcdFx0XHQ8VUkuTGFiZWxJbnB1dCB0eXBlPVwiZW1haWxcIiBsYWJlbD1cIkVtYWlsXCIgICBwbGFjZWhvbGRlcj1cInlvdXIubmFtZUBleGFtcGxlLmNvbVwiIC8+XG5cdFx0XHRcdFx0XHQ8VUkuTGFiZWxJbnB1dCB0eXBlPVwidXJsXCIgICBsYWJlbD1cIlVSTFwiICAgICBwbGFjZWhvbGRlcj1cImh0dHA6Ly93d3cueW91cndlYnNpdGUuY29tXCIgLz5cblx0XHRcdFx0XHRcdDxVSS5MYWJlbElucHV0IG5vZWRpdCAgICAgICBsYWJlbD1cIk5vIEVkaXRcIiB2YWx1ZT1cIlVuLWVkaXRhYmxlLCBzY3JvbGxhYmxlLCBzZWxlY3RhYmxlIGNvbnRlbnRcIiAvPlxuXHRcdFx0XHRcdFx0PFVJLkxhYmVsU2VsZWN0IGxhYmVsPVwiRmxhdm91clwiIHZhbHVlPXt0aGlzLnN0YXRlLmZsYXZvdXJ9IG9uQ2hhbmdlPXt0aGlzLmhhbmRsZUZsYXZvdXJDaGFuZ2V9IG9wdGlvbnM9e1tcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ1ZhbmlsbGEnLCAgICB2YWx1ZTogJ3ZhbmlsbGEnIH0sXG5cdFx0XHRcdFx0XHRcdHsgbGFiZWw6ICdDaG9jb2xhdGUnLCAgdmFsdWU6ICdjaG9jb2xhdGUnIH0sXG5cdFx0XHRcdFx0XHRcdHsgbGFiZWw6ICdDYXJhbWVsJywgICAgdmFsdWU6ICdjYXJhbWVsJyB9LFxuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnU3RyYXdiZXJyeScsIHZhbHVlOiAnc3RyYXdiZXJyeScgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ0JhbmFuYScsICAgICB2YWx1ZTogJ2JhbmFuYScgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ0xlbW9uJywgICAgICB2YWx1ZTogJ2xlbW9uJyB9LFxuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnUGFzdGFjY2lvJywgIHZhbHVlOiAncGFzdGFjY2lvJyB9XG5cdFx0XHRcdFx0XHRdfSAvPlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJsaXN0LWl0ZW0gZmllbGQtaXRlbVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5cblx0XHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkLWxhYmVsXCI+U3dpdGNoPC9kaXY+XG5cdFx0XHRcdFx0XHRcdFx0PFVJLlN3aXRjaCBvblRhcD17dGhpcy5oYW5kbGVTd2l0Y2guYmluZCh0aGlzLCAndmVyaWZpZWRDcmVkaXRDYXJkJyl9IG9uPXt0aGlzLnN0YXRlLnZlcmlmaWVkQ3JlZGl0Q2FyZH0gLz5cblx0XHRcdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9VSS5WaWV3Q29udGVudD5cblx0XHRcdDwvVUkuVmlldz5cblx0XHQpO1xuXHR9XG59KTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFNldENsYXNzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpLFxuXHRUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyksXG5cdE5hdmlnYXRpb24gPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5OYXZpZ2F0aW9uLFxuXHRMaW5rID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTGluayxcblx0VUkgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5VSTtcblxudmFyIE1vbnRocyA9IHJlcXVpcmUoJy4uLy4uLy4uL2RhdGEvbW9udGhzJyk7XG5cbnZhciBIZWFkZXJMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBtb250aHMgPSBbXTtcblx0XHR2YXJcdGxhc3RTZWFzb24gPSAnJztcblxuXHRcdHRoaXMucHJvcHMubW9udGhzLmZvckVhY2goZnVuY3Rpb24gKG1vbnRoLCBpKSB7XG5cblx0XHRcdHZhciBzZWFzb24gPSBtb250aC5zZWFzb247XG5cblx0XHRcdGlmIChsYXN0U2Vhc29uICE9PSBzZWFzb24pIHtcblx0XHRcdFx0bGFzdFNlYXNvbiA9IHNlYXNvbjtcblxuXHRcdFx0XHRtb250aHMucHVzaChcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImxpc3QtaGVhZGVyXCIga2V5PXtcImxpc3QtaGVhZGVyLVwiICsgaX0+e3NlYXNvbn08L2Rpdj5cblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0bW9udGgua2V5ID0gJ21vbnRoLScgKyBpO1xuXHRcdFx0bW9udGhzLnB1c2goPGRpdiBjbGFzc05hbWU9XCJsaXN0LWl0ZW1cIj48ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj57bW9udGgubmFtZX08L2Rpdj48L2Rpdj4pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWwgbWItMFwiPlxuXHRcdFx0XHR7bW9udGhzfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtOYXZpZ2F0aW9uXSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8VUkuVmlldz5cblx0XHRcdFx0PFVJLkhlYWRlcmJhciB0eXBlPVwiZGVmYXVsdFwiIGxhYmVsPVwiQ2F0ZWdvcmlzZWQgTGlzdFwiPlxuXHRcdFx0XHRcdDxMaW5rIHRvPVwiaG9tZVwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJIZWFkZXJiYXItYnV0dG9uIGlvbi1jaGV2cm9uLWxlZnRcIiBjb21wb25lbnQ9XCJidXR0b25cIj5CYWNrPC9MaW5rPlxuXHRcdFx0XHQ8L1VJLkhlYWRlcmJhcj5cblx0XHRcdFx0PFVJLlZpZXdDb250ZW50IGdyb3cgc2Nyb2xsYWJsZT5cblx0XHRcdFx0XHQ8SGVhZGVyTGlzdCBtb250aHM9e01vbnRoc30gLz5cblx0XHRcdFx0PC9VSS5WaWV3Q29udGVudD5cblx0XHRcdDwvVUkuVmlldz5cblx0XHQpO1xuXHR9XG59KTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFNldENsYXNzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpLFxuXHRUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyksXG5cdE5hdmlnYXRpb24gPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5OYXZpZ2F0aW9uLFxuXHRMaW5rID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTGluayxcblx0VUkgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5VSTtcblxudmFyIFBlb3BsZSA9IHJlcXVpcmUoJy4uLy4uLy4uL2RhdGEvcGVvcGxlJyk7XG5cbnZhciBDb21wbGV4TGlzdEl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW05hdmlnYXRpb25dLFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdFxuXHRcdHZhciBpbml0aWFscyA9IHRoaXMucHJvcHMudXNlci5uYW1lLmZpcnN0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICtcblx0XHRcdHRoaXMucHJvcHMudXNlci5uYW1lLmxhc3QuY2hhckF0KDApLnRvVXBwZXJDYXNlKCk7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PExpbmsgdG89XCJkZXRhaWxzXCIgdmlld1RyYW5zaXRpb249XCJzaG93LWZyb20tcmlnaHRcIiBwYXJhbXM9e3sgdXNlcjogdGhpcy5wcm9wcy51c2VyLCBwcmV2VmlldzogJ2NvbXBvbmVudC1jb21wbGV4LWxpc3QnIH19IGNsYXNzTmFtZT1cImxpc3QtaXRlbVwiIGNvbXBvbmVudD1cImRpdlwiPlxuXHRcdFx0XHQ8VUkuSXRlbU1lZGlhIGF2YXRhcj17dGhpcy5wcm9wcy51c2VyLmltZ30gYXZhdGFySW5pdGlhbHM9e2luaXRpYWxzfSAvPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0tY29udGVudFwiPlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJpdGVtLXRpdGxlXCI+e1t0aGlzLnByb3BzLnVzZXIubmFtZS5maXJzdCwgdGhpcy5wcm9wcy51c2VyLm5hbWUubGFzdF0uam9pbignICcpfTwvZGl2PlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJpdGVtLXN1YnRpdGxlXCI+e3RoaXMucHJvcHMudXNlci5sb2NhdGlvbn08L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8VUkuSXRlbU5vdGUgdHlwZT1cImRlZmF1bHRcIiBsYWJlbD17dGhpcy5wcm9wcy51c2VyLmpvaW5lZERhdGUuc2xpY2UoLTQpfSBpY29uPVwiaW9uLWNoZXZyb24tcmlnaHRcIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvTGluaz5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIENvbXBsZXhMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciB1c2VycyA9IFtdO1xuXHRcdFxuXHRcdHRoaXMucHJvcHMudXNlcnMuZm9yRWFjaChmdW5jdGlvbiAodXNlciwgaSkge1xuXHRcdFx0dXNlci5rZXkgPSAndXNlci0nICsgaTtcblx0XHRcdHVzZXJzLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudChDb21wbGV4TGlzdEl0ZW0sIHsgdXNlcjogdXNlciB9KSk7XG5cdFx0fSk7XG5cdFx0XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWwgcGFuZWwtLWZpcnN0IGF2YXRhci1saXN0XCI+XG5cdFx0XHRcdFx0e3VzZXJzfVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbTmF2aWdhdGlvbl0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PFVJLlZpZXc+XG5cdFx0XHRcdDxVSS5IZWFkZXJiYXIgdHlwZT1cImRlZmF1bHRcIiBsYWJlbD1cIkNvbXBsZXggTGlzdFwiPlxuXHRcdFx0XHRcdDxMaW5rIHRvPVwiaG9tZVwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJIZWFkZXJiYXItYnV0dG9uIGlvbi1jaGV2cm9uLWxlZnRcIiBjb21wb25lbnQ9XCJidXR0b25cIj5CYWNrPC9MaW5rPlxuXHRcdFx0XHQ8L1VJLkhlYWRlcmJhcj5cblx0XHRcdFx0PFVJLlZpZXdDb250ZW50IGdyb3cgc2Nyb2xsYWJsZT5cblx0XHRcdFx0XHQ8Q29tcGxleExpc3QgdXNlcnM9e1Blb3BsZX0gLz5cblx0XHRcdFx0PC9VSS5WaWV3Q29udGVudD5cblx0XHRcdDwvVUkuVmlldz5cblx0XHQpO1xuXHR9XG59KTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFNldENsYXNzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpLFxuXHRUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyksXG5cdE5hdmlnYXRpb24gPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5OYXZpZ2F0aW9uLFxuXHRMaW5rID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTGluayxcblx0VUkgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5VSTtcblxudmFyIFBlb3BsZSA9IHJlcXVpcmUoJy4uLy4uLy4uL2RhdGEvcGVvcGxlJyk7XG5cbnZhciBTaW1wbGVMaXN0SXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbTmF2aWdhdGlvbl0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PExpbmsgdG89XCJkZXRhaWxzXCIgdmlld1RyYW5zaXRpb249XCJzaG93LWZyb20tcmlnaHRcIiBwYXJhbXM9e3sgdXNlcjogdGhpcy5wcm9wcy51c2VyLCBwcmV2VmlldzogJ2NvbXBvbmVudC1zaW1wbGUtbGlzdCcgfX0gY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLXRhcHBhYmxlXCIgY29tcG9uZW50PVwiZGl2XCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaXRlbS1pbm5lclwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaXRlbS10aXRsZVwiPntbdGhpcy5wcm9wcy51c2VyLm5hbWUuZmlyc3QsIHRoaXMucHJvcHMudXNlci5uYW1lLmxhc3RdLmpvaW4oJyAnKX08L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L0xpbms+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBTaW1wbGVMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciB1c2VycyA9IFtdO1xuXHRcdFxuXHRcdHRoaXMucHJvcHMudXNlcnMuZm9yRWFjaChmdW5jdGlvbiAodXNlciwgaSkge1xuXHRcdFx0dXNlci5rZXkgPSAndXNlci0nICsgaTtcblx0XHRcdHVzZXJzLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudChTaW1wbGVMaXN0SXRlbSwgeyB1c2VyOiB1c2VyIH0pKTtcblx0XHR9KTtcblx0XHRcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbCBwYW5lbC0tZmlyc3RcIj5cblx0XHRcdFx0XHR7dXNlcnN9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtOYXZpZ2F0aW9uXSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8VUkuVmlldz5cblx0XHRcdFx0PFVJLkhlYWRlcmJhciB0eXBlPVwiZGVmYXVsdFwiIGxhYmVsPVwiU2ltcGxlIExpc3RcIj5cblx0XHRcdFx0XHQ8TGluayB0bz1cImhvbWVcIiB2aWV3VHJhbnNpdGlvbj1cInJldmVhbC1mcm9tLXJpZ2h0XCIgY2xhc3NOYW1lPVwiSGVhZGVyYmFyLWJ1dHRvbiBpb24tY2hldnJvbi1sZWZ0XCIgY29tcG9uZW50PVwiYnV0dG9uXCI+QmFjazwvTGluaz5cblx0XHRcdFx0PC9VSS5IZWFkZXJiYXI+XG5cdFx0XHRcdDxVSS5WaWV3Q29udGVudCBncm93IHNjcm9sbGFibGU+XG5cdFx0XHRcdFx0PFNpbXBsZUxpc3QgdXNlcnM9e1Blb3BsZX0gLz5cblx0XHRcdFx0PC9VSS5WaWV3Q29udGVudD5cblx0XHRcdDwvVUkuVmlldz5cblx0XHQpO1xuXHR9XG59KTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdERpYWxvZ3MgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5EaWFsb2dzLFxuXHROYXZpZ2F0aW9uID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTmF2aWdhdGlvbixcblx0TGluayA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLkxpbmssXG5cdFVJID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuVUk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtOYXZpZ2F0aW9uLCBEaWFsb2dzXSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge31cblx0fSxcblxuXHRoYW5kbGVQYXNzY29kZTogZnVuY3Rpb24gKHBhc3Njb2RlKSB7XG5cdFx0YWxlcnQoJ1lvdXIgcGFzc2NvZGUgaXMgXCInICsgcGFzc2NvZGUgKyAnXCIuJyk7XG5cblx0XHR0aGlzLnNob3dWaWV3KCdob21lJywgJ2ZhZGUnKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PFVJLlZpZXc+XG5cdFx0XHRcdDxVSS5IZWFkZXJiYXIgdHlwZT1cImRlZmF1bHRcIiBsYWJlbD1cIkVudGVyIFBhc3Njb2RlXCI+XG5cdFx0XHRcdFx0PExpbmsgdG89XCJob21lXCIgdmlld1RyYW5zaXRpb249XCJyZXZlYWwtZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cIkhlYWRlcmJhci1idXR0b24gaW9uLWNoZXZyb24tbGVmdFwiIGNvbXBvbmVudD1cImJ1dHRvblwiPkJhY2s8L0xpbms+XG5cdFx0XHRcdDwvVUkuSGVhZGVyYmFyPlxuXHRcdFx0XHQ8VUkuUGFzc2NvZGUgYWN0aW9uPXt0aGlzLmhhbmRsZVBhc3Njb2RlfSBoZWxwVGV4dD1cIkVudGVyIGEgcGFzc2NvZGVcIiAvPlxuXHRcdFx0PC9VSS5WaWV3PlxuXHRcdCk7XG5cdH1cbn0pO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0U2V0Q2xhc3MgPSByZXF1aXJlKCdjbGFzc25hbWVzJyksXG5cdFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKSxcblx0TmF2aWdhdGlvbiA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLk5hdmlnYXRpb24sXG5cdExpbmsgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5MaW5rLFxuXHRVSSA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLlVJO1xuXG52YXIgTW9udGhzID0gcmVxdWlyZSgnLi4vLi4vLi4vZGF0YS9tb250aHMnKTtcblxudmFyIE1vbnRoTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgbW9udGhzID0gW107XG5cdFx0dmFyXHRsYXN0U2Vhc29uID0gJyc7XG5cdFx0dmFyIGZpbHRlclN0YXRlID0gdGhpcy5wcm9wcy5maWx0ZXJTdGF0ZTtcblx0XHRcblx0XHR0aGlzLnByb3BzLm1vbnRocy5mb3JFYWNoKGZ1bmN0aW9uIChtb250aCwgaSkge1xuXHRcdFx0XG5cdFx0XHRpZiAoZmlsdGVyU3RhdGUgIT09ICdhbGwnICYmIGZpbHRlclN0YXRlICE9PSBtb250aC5zZWFzb24udG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciBzZWFzb24gPSBtb250aC5zZWFzb247XG5cblx0XHRcdGlmIChsYXN0U2Vhc29uICE9PSBzZWFzb24pIHtcblx0XHRcdFx0bGFzdFNlYXNvbiA9IHNlYXNvbjtcblxuXHRcdFx0XHRtb250aHMucHVzaChcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImxpc3QtaGVhZGVyXCIga2V5PXtcImxpc3QtaGVhZGVyLVwiICsgaX0+e3NlYXNvbn08L2Rpdj5cblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0bW9udGgua2V5ID0gJ21vbnRoLScgKyBpO1xuXHRcdFx0bW9udGhzLnB1c2goPGRpdiBjbGFzc05hbWU9XCJsaXN0LWl0ZW1cIj48ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj57bW9udGgubmFtZX08L2Rpdj48L2Rpdj4pO1xuXHRcdH0pO1xuXHRcdFxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsIG1iLTBcIj5cblx0XHRcdFx0e21vbnRoc31cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbTmF2aWdhdGlvbl0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGFjdGl2ZVRvZ2dsZUl0ZW1LZXk6ICdhbGwnLFxuXHRcdFx0dHlwZUtleTogJ3ByaW1hcnknLFxuXHRcdFx0bW9udGhzOiBNb250aHNcblx0XHR9XG5cdH0sXG5cblx0aGFuZGxlVG9nZ2xlQWN0aXZlQ2hhbmdlOiBmdW5jdGlvbiAobmV3SXRlbSkge1xuXG5cdFx0dmFyIHNlbGVjdGVkSXRlbSA9IG5ld0l0ZW07XG5cblx0XHRpZiAodGhpcy5zdGF0ZS5hY3RpdmVUb2dnbGVJdGVtS2V5ID09PSBuZXdJdGVtKSB7XG5cdFx0XHRzZWxlY3RlZEl0ZW0gPSAnYWxsJztcblx0XHR9XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGFjdGl2ZVRvZ2dsZUl0ZW1LZXk6IHNlbGVjdGVkSXRlbVxuXHRcdH0pO1xuXG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PFVJLlZpZXc+XG5cdFx0XHRcdDxVSS5IZWFkZXJiYXIgdHlwZT1cImRlZmF1bHRcIiBsYWJlbD1cIlRvZ2dsZVwiPlxuXHRcdFx0XHRcdDxMaW5rIHRvPVwiaG9tZVwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJIZWFkZXJiYXItYnV0dG9uIGlvbi1jaGV2cm9uLWxlZnRcIiBjb21wb25lbnQ9XCJidXR0b25cIj5CYWNrPC9MaW5rPlxuXHRcdFx0XHQ8L1VJLkhlYWRlcmJhcj5cblx0XHRcdFx0PFVJLkhlYWRlcmJhciB0eXBlPVwiZGVmYXVsdFwiIGhlaWdodD1cIjM2cHhcIiBjbGFzc05hbWU9XCJTdWJoZWFkZXJcIj5cblx0XHRcdFx0XHQ8VUkuVG9nZ2xlIHZhbHVlPXt0aGlzLnN0YXRlLmFjdGl2ZVRvZ2dsZUl0ZW1LZXl9IG9uQ2hhbmdlPXt0aGlzLmhhbmRsZVRvZ2dsZUFjdGl2ZUNoYW5nZX0gb3B0aW9ucz17W1xuXHRcdFx0XHRcdFx0eyBsYWJlbDogJ1N1bW1lcicsIHZhbHVlOiAnc3VtbWVyJyB9LFxuXHRcdFx0XHRcdFx0eyBsYWJlbDogJ0F1dHVtbicsIHZhbHVlOiAnYXV0dW1uJyB9LFxuXHRcdFx0XHRcdFx0eyBsYWJlbDogJ1dpbnRlcicsIHZhbHVlOiAnd2ludGVyJyB9LFxuXHRcdFx0XHRcdFx0eyBsYWJlbDogJ1NwcmluZycsIHZhbHVlOiAnc3ByaW5nJyB9XG5cdFx0XHRcdFx0XX0gLz5cblx0XHRcdFx0PC9VSS5IZWFkZXJiYXI+XG5cdFx0XHRcdDxVSS5WaWV3Q29udGVudCBncm93IHNjcm9sbGFibGU+XG5cdFx0XHRcdFx0PE1vbnRoTGlzdCBtb250aHM9e3RoaXMuc3RhdGUubW9udGhzfSBmaWx0ZXJTdGF0ZT17dGhpcy5zdGF0ZS5hY3RpdmVUb2dnbGVJdGVtS2V5fSAvPlxuXHRcdFx0XHQ8L1VJLlZpZXdDb250ZW50PlxuXHRcdFx0PC9VSS5WaWV3PlxuXHRcdCk7XG5cdH1cbn0pO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0VGFwcGFibGUgPSByZXF1aXJlKCdyZWFjdC10YXBwYWJsZScpLFxuXHREaWFsb2dzID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuRGlhbG9ncyxcblx0TmF2aWdhdGlvbiA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLk5hdmlnYXRpb24sXG5cdExpbmsgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5MaW5rLFxuXHRVSSA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLlVJO1xuXG52YXIgVGltZXJzID0gcmVxdWlyZSgncmVhY3QtdGltZXJzJylcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW05hdmlnYXRpb24sIERpYWxvZ3MsIFRpbWVycygpXSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cHJldlZpZXc6ICdob21lJ1xuXHRcdH1cblx0fSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cHJvY2Vzc2luZzogZmFsc2UsXG5cdFx0XHRmb3JtSXNWYWxpZDogZmFsc2UsXG5cdFx0XHRiaW9WYWx1ZTogdGhpcy5wcm9wcy51c2VyLmJpbyB8fCAnJ1xuXHRcdH1cblx0fSxcblxuXHRzaG93Rmxhdm91ckxpc3Q6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLnNob3dWaWV3KCdyYWRpby1saXN0JywgJ3Nob3ctZnJvbS1yaWdodCcsIHsgdXNlcjogdGhpcy5wcm9wcy51c2VyLCBmbGF2b3VyOiB0aGlzLnN0YXRlLmZsYXZvdXIgfSk7XG5cdH0sXG5cblx0aGFuZGxlQmlvSW5wdXQ6IGZ1bmN0aW9uIChldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0YmlvVmFsdWU6IGV2ZW50LnRhcmdldC52YWx1ZSxcblx0XHRcdGZvcm1Jc1ZhbGlkOiBldmVudC50YXJnZXQudmFsdWUubGVuZ3RoID8gdHJ1ZSA6IGZhbHNlXG5cdFx0fSk7XG5cdH0sXG5cblx0cHJvY2Vzc0Zvcm06IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLnNldFN0YXRlKHsgcHJvY2Vzc2luZzogdHJ1ZSB9KTtcblxuXHRcdHRoaXMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxmLnNob3dWaWV3KCdob21lJywgJ2ZhZGUnLCB7fSk7XG5cdFx0fSwgNzUwKTtcblx0fSxcblxuXHRmbGFzaEFsZXJ0OiBmdW5jdGlvbiAoYWxlcnRDb250ZW50LCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBjYWxsYmFjayh0aGlzLnNob3dBbGVydERpYWxvZyh7IG1lc3NhZ2U6IGFsZXJ0Q29udGVudCB9KSk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cblx0XHQvLyBmaWVsZHNcblx0XHRyZXR1cm4gKFxuXHRcdFx0PFVJLlZpZXc+XG5cdFx0XHRcdDxVSS5IZWFkZXJiYXIgdHlwZT1cImRlZmF1bHRcIiBsYWJlbD17W3RoaXMucHJvcHMudXNlci5uYW1lLmZpcnN0LCB0aGlzLnByb3BzLnVzZXIubmFtZS5sYXN0XS5qb2luKCcgJyl9PlxuXHRcdFx0XHRcdDxMaW5rIHRvPVwiaG9tZVwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJIZWFkZXJiYXItYnV0dG9uIGlvbi1jaGV2cm9uLWxlZnRcIiBjb21wb25lbnQ9XCJidXR0b25cIj5CYWNrPC9MaW5rPlxuXHRcdFx0XHRcdDxVSS5Mb2FkaW5nQnV0dG9uIGxvYWRpbmc9e3RoaXMuc3RhdGUucHJvY2Vzc2luZ30gZGlzYWJsZWQ9eyF0aGlzLnN0YXRlLmZvcm1Jc1ZhbGlkfSBvblRhcD17dGhpcy5wcm9jZXNzRm9ybX0gbGFiZWw9XCJTYXZlXCIgY2xhc3NOYW1lPVwiSGVhZGVyYmFyLWJ1dHRvbiByaWdodCBpcy1wcmltYXJ5XCIgLz5cblx0XHRcdFx0PC9VSS5IZWFkZXJiYXI+XG5cdFx0XHRcdDxVSS5WaWV3Q29udGVudCBncm93IHNjcm9sbGFibGU+XG5cdFx0XHRcdFx0ey8qPGRpdiBjbGFzc05hbWU9XCJwYW5lbC1oZWFkZXIgdGV4dC1jYXBzXCI+QmFzaWMgZGV0YWlsczwvZGl2PiovfVxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWwgcGFuZWwtLWZpcnN0XCI+XG5cdFx0XHRcdFx0XHQ8VUkuTGFiZWxJbnB1dCBsYWJlbD1cIk5hbWVcIiAgICAgdmFsdWU9e1t0aGlzLnByb3BzLnVzZXIubmFtZS5maXJzdCwgdGhpcy5wcm9wcy51c2VyLm5hbWUubGFzdF0uam9pbignICcpfSAgICAgICBwbGFjZWhvbGRlcj1cIkZ1bGwgbmFtZVwiIGZpcnN0IC8+XG5cdFx0XHRcdFx0XHQ8VUkuTGFiZWxJbnB1dCBsYWJlbD1cIkxvY2F0aW9uXCIgdmFsdWU9e3RoaXMucHJvcHMudXNlci5sb2NhdGlvbn0gICBwbGFjZWhvbGRlcj1cIlN1YnVyYiwgQ291bnRyeVwiIC8+XG5cdFx0XHRcdFx0XHQ8VUkuTGFiZWxJbnB1dCBsYWJlbD1cIkpvaW5lZFwiICAgdmFsdWU9e3RoaXMucHJvcHMudXNlci5qb2luZWREYXRlfSBwbGFjZWhvbGRlcj1cIkRhdGVcIiAvPlxuXHRcdFx0XHRcdFx0PFVJLkxhYmVsVGV4dGFyZWEgbGFiZWw9XCJCaW9cIiAgIHZhbHVlPXt0aGlzLnN0YXRlLmJpb1ZhbHVlfSAgICAgICAgcGxhY2Vob2xkZXI9XCIocmVxdWlyZWQpXCIgb25DaGFuZ2U9e3RoaXMuaGFuZGxlQmlvSW5wdXR9IC8+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbFwiPlxuXHRcdFx0XHRcdFx0PFRhcHBhYmxlIG9uVGFwPXt0aGlzLnNob3dGbGF2b3VyTGlzdH0gY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLWZpcnN0XCIgY29tcG9uZW50PVwiZGl2XCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaXRlbS1pbm5lclwiPlxuXHRcdFx0XHRcdFx0XHRcdEZhdm91cml0ZSBJY2VjcmVhbVxuXHRcdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaXRlbS1ub3RlIGRlZmF1bHRcIj5cblx0XHRcdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaXRlbS1ub3RlLWxhYmVsXCI+e3RoaXMucHJvcHMudXNlci5mbGF2b3VyfTwvZGl2PlxuXHRcdFx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJpdGVtLW5vdGUtaWNvbiBpb24tY2hldnJvbi1yaWdodFwiIC8+XG5cdFx0XHRcdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0PC9UYXBwYWJsZT5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8VGFwcGFibGUgb25UYXA9e3RoaXMuZmxhc2hBbGVydC5iaW5kKHRoaXMsICdZb3UgY2xpY2tlZCB0aGUgUHJpbWFyeSBCdXR0b24uJyl9IGNsYXNzTmFtZT1cInBhbmVsLWJ1dHRvbiBwcmltYXJ5XCIgY29tcG9uZW50PVwiYnV0dG9uXCI+XG5cdFx0XHRcdFx0XHRQcmltYXJ5IEJ1dHRvblxuXHRcdFx0XHRcdDwvVGFwcGFibGU+XG5cdFx0XHRcdFx0PFRhcHBhYmxlIG9uVGFwPXt0aGlzLmZsYXNoQWxlcnQuYmluZCh0aGlzLCAnWW91IGNsaWNrZWQgdGhlIERlZmF1bHQgQnV0dG9uLicpfSBjbGFzc05hbWU9XCJwYW5lbC1idXR0b25cIiBjb21wb25lbnQ9XCJidXR0b25cIj5cblx0XHRcdFx0XHRcdERlZmF1bHQgQnV0dG9uXG5cdFx0XHRcdFx0PC9UYXBwYWJsZT5cblx0XHRcdFx0XHQ8VGFwcGFibGUgb25UYXA9e3RoaXMuZmxhc2hBbGVydC5iaW5kKHRoaXMsICdZb3UgY2xpY2tlZCB0aGUgRGFuZ2VyIEJ1dHRvbi4nKX0gY2xhc3NOYW1lPVwicGFuZWwtYnV0dG9uIGRhbmdlclwiIGNvbXBvbmVudD1cImJ1dHRvblwiPlxuXHRcdFx0XHRcdFx0RGFuZ2VyIEJ1dHRvblxuXHRcdFx0XHRcdDwvVGFwcGFibGU+XG5cdFx0XHRcdDwvVUkuVmlld0NvbnRlbnQ+XG5cdFx0XHQ8L1VJLlZpZXc+XG5cdFx0KTtcblx0fVxufSk7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKTtcbnZhciBOYXZpZ2F0aW9uID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTmF2aWdhdGlvbjtcbnZhciBMaW5rID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTGluaztcbnZhciBVSSA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLlVJO1xuXG52YXIgVGltZXJzID0gcmVxdWlyZSgncmVhY3QtdGltZXJzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtOYXZpZ2F0aW9uLCBUaW1lcnMoKV0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHZpc2libGU6IGZhbHNlLFxuXHRcdFx0XHRpY29uTmFtZTogJ2lvbi1sb2FkLWMnXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblx0c2hvd0xvYWRpbmdQb3B1cDogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0dmlzaWJsZTogdHJ1ZSxcblx0XHRcdFx0bG9hZGluZzogdHJ1ZSxcblx0XHRcdFx0aGVhZGVyOiAnTG9hZGluZycsXG5cdFx0XHRcdGljb25OYW1lOiAnaW9uLWxvYWQtYycsXG5cdFx0XHRcdGljb25UeXBlOiAnZGVmYXVsdCdcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR2aXNpYmxlOiB0cnVlLFxuXHRcdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRcdGhlYWRlcjogJ0RvbmUhJyxcblx0XHRcdFx0XHRpY29uTmFtZTogJ2lvbi1pb3M3LWNoZWNrbWFyaycsXG5cdFx0XHRcdFx0aWNvblR5cGU6ICdzdWNjZXNzJ1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9LCAyMDAwKTtcblxuXHRcdHRoaXMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR2aXNpYmxlOiBmYWxzZSxcblx0XHRcdFx0XHRpY29uTmFtZTogJ2lvbi1sb2FkLWMnXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0sIDMwMDApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8VUkuVmlldz5cblx0XHRcdFx0PFVJLkhlYWRlcmJhciB0eXBlPVwiZGVmYXVsdFwiIGxhYmVsPVwiVG91Y2hzdG9uZUpTXCIgLz5cblx0XHRcdFx0PFVJLlZpZXdDb250ZW50IGdyb3cgc2Nyb2xsYWJsZT5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsLWhlYWRlciB0ZXh0LWNhcHNcIj5CYXJzPC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbFwiPlxuXHRcdFx0XHRcdFx0PExpbmsgY29tcG9uZW50PVwiZGl2XCIgdG89XCJjb21wb25lbnQtaGVhZGVyYmFyXCIgdmlld1RyYW5zaXRpb249XCJzaG93LWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJsaXN0LWl0ZW0gaXMtdGFwcGFibGVcIj5cblx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJpdGVtLWlubmVyXCI+SGVhZGVyIEJhcjwvZGl2PlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgY29tcG9uZW50PVwiZGl2XCIgdG89XCJjb21wb25lbnQtaGVhZGVyYmFyLXNlYXJjaFwiIHZpZXdUcmFuc2l0aW9uPVwic2hvdy1mcm9tLXJpZ2h0XCIgY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLXRhcHBhYmxlXCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaXRlbS1pbm5lclwiPkhlYWRlciBCYXIgU2VhcmNoPC9kaXY+XG5cdFx0XHRcdFx0XHQ8L0xpbms+XG5cdFx0XHRcdFx0XHQ8TGluayBjb21wb25lbnQ9XCJkaXZcIiB0bz1cImNvbXBvbmVudC1hbGVydGJhclwiIHZpZXdUcmFuc2l0aW9uPVwic2hvdy1mcm9tLXJpZ2h0XCIgY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLXRhcHBhYmxlXCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaXRlbS1pbm5lclwiPkFsZXJ0IEJhcjwvZGl2PlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgY29tcG9uZW50PVwiZGl2XCIgdG89XCJjb21wb25lbnQtZm9vdGVyYmFyXCIgdmlld1RyYW5zaXRpb249XCJzaG93LWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJsaXN0LWl0ZW0gaXMtdGFwcGFibGVcIj5cblx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJpdGVtLWlubmVyXCI+Rm9vdGVyIEJhcjwvZGl2PlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGVyIHRleHQtY2Fwc1wiPkxpc3RzPC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbFwiPlxuXHRcdFx0XHRcdFx0PExpbmsgY29tcG9uZW50PVwiZGl2XCIgdG89XCJjb21wb25lbnQtc2ltcGxlLWxpc3RcIiB2aWV3VHJhbnNpdGlvbj1cInNob3ctZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5TaW1wbGUgTGlzdDwvZGl2PlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgY29tcG9uZW50PVwiZGl2XCIgdG89XCJjb21wb25lbnQtY29tcGxleC1saXN0XCIgdmlld1RyYW5zaXRpb249XCJzaG93LWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJsaXN0LWl0ZW0gaXMtdGFwcGFibGVcIj5cblx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJpdGVtLWlubmVyXCI+Q29tcGxleCBMaXN0PC9kaXY+XG5cdFx0XHRcdFx0XHQ8L0xpbms+XG5cdFx0XHRcdFx0XHR7LyogVGhpcyBpcyBjb3ZlcmVkIGluIG90aGVyIGNvbXBvbmVudHNcblx0XHRcdFx0XHRcdDxMaW5rIGNvbXBvbmVudD1cImRpdlwiIHRvPVwiY29tcG9uZW50LWNhdGVnb3Jpc2VkLWxpc3RcIiB2aWV3VHJhbnNpdGlvbj1cInNob3ctZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5DYXRlZ29yaXNlZCBMaXN0PC9kaXY+XG5cdFx0XHRcdFx0XHQ8L0xpbms+Ki99XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbC1oZWFkZXIgdGV4dC1jYXBzXCI+VUkgRWxlbWVudHM8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsXCI+XG5cdFx0XHRcdFx0XHQ8TGluayBjb21wb25lbnQ9XCJkaXZcIiB0bz1cImNvbXBvbmVudC10b2dnbGVcIiAgIHZpZXdUcmFuc2l0aW9uPVwic2hvdy1mcm9tLXJpZ2h0XCIgY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLXRhcHBhYmxlXCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaXRlbS1pbm5lclwiPlRvZ2dsZTwvZGl2PlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgY29tcG9uZW50PVwiZGl2XCIgdG89XCJjb21wb25lbnQtZm9ybVwiICAgICB2aWV3VHJhbnNpdGlvbj1cInNob3ctZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5Gb3JtIEZpZWxkczwvZGl2PlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgY29tcG9uZW50PVwiZGl2XCIgdG89XCJjb21wb25lbnQtcGFzc2NvZGVcIiB2aWV3VHJhbnNpdGlvbj1cInNob3ctZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5QYXNzY29kZSAvIEtleXBhZDwvZGl2PlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PFRhcHBhYmxlIGNvbXBvbmVudD1cImRpdlwiIG9uVGFwPXt0aGlzLnNob3dMb2FkaW5nUG9wdXB9IGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5Mb2FkaW5nIFNwaW5uZXI8L2Rpdj5cblx0XHRcdFx0XHRcdDwvVGFwcGFibGU+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbC1oZWFkZXIgdGV4dC1jYXBzXCI+QXBwbGljYXRpb24gU3RhdGU8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsXCI+XG5cdFx0XHRcdFx0XHQ8TGluayBjb21wb25lbnQ9XCJkaXZcIiB0bz1cInRyYW5zaXRpb25zXCIgdmlld1RyYW5zaXRpb249XCJzaG93LWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJsaXN0LWl0ZW0gaXMtdGFwcGFibGVcIj5cblx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJpdGVtLWlubmVyXCI+VmlldyBUcmFuc2l0aW9uczwvZGl2PlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgY29tcG9uZW50PVwiZGl2XCIgdG89XCJjb21wb25lbnQtZmVlZGJhY2tcIiB2aWV3VHJhbnNpdGlvbj1cInNob3ctZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5WaWV3IEZlZWRiYWNrPC9kaXY+XG5cdFx0XHRcdFx0XHQ8L0xpbms+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvVUkuVmlld0NvbnRlbnQ+XG5cdFx0XHRcdDxVSS5Qb3B1cCB2aXNpYmxlPXt0aGlzLnN0YXRlLnBvcHVwLnZpc2libGV9PlxuXHRcdFx0XHRcdDxVSS5Qb3B1cEljb24gbmFtZT17dGhpcy5zdGF0ZS5wb3B1cC5pY29uTmFtZX0gdHlwZT17dGhpcy5zdGF0ZS5wb3B1cC5pY29uVHlwZX0gc3Bpbm5pbmc9e3RoaXMuc3RhdGUucG9wdXAubG9hZGluZ30gLz5cblx0XHRcdFx0XHQ8c3Ryb25nPnt0aGlzLnN0YXRlLnBvcHVwLmhlYWRlcn08L3N0cm9uZz5cblx0XHRcdFx0PC9VSS5Qb3B1cD5cblx0XHRcdDwvVUkuVmlldz5cblx0XHQpO1xuXHR9XG59KTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFNldENsYXNzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpLFxuXHRUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyksXG5cdE5hdmlnYXRpb24gPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5OYXZpZ2F0aW9uLFxuXHRMaW5rID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTGluayxcblx0VUkgPSByZXF1aXJlKCd0b3VjaHN0b25lanMnKS5VSTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW05hdmlnYXRpb25dLFxuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRmbGF2b3VyOiB0aGlzLnByb3BzLnVzZXIuZmxhdm91clxuXHRcdH1cblx0fSxcblxuXHRoYW5kbGVGbGF2b3VyQ2hhbmdlOiBmdW5jdGlvbiAobmV3Rmxhdm91cikge1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRmbGF2b3VyOiBuZXdGbGF2b3VyXG5cdFx0fSk7XG5cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8VUkuVmlldz5cblx0XHRcdFx0PFVJLkhlYWRlcmJhciB0eXBlPVwiZGVmYXVsdFwiIGxhYmVsPVwiRmF2b3VyaXRlIEljZWNyZWFtXCI+XG5cdFx0XHRcdFx0PExpbmsgdG89XCJkZXRhaWxzXCIgdmlld1RyYW5zaXRpb249XCJyZXZlYWwtZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cIkhlYWRlcmJhci1idXR0b24gaW9uLWNoZXZyb24tbGVmdFwiIGNvbXBvbmVudD1cImJ1dHRvblwiIHZpZXdQcm9wcz17eyB1c2VyOiB0aGlzLnByb3BzLnVzZXIsIGZsYXZvdXI6IHRoaXMuc3RhdGUuZmxhdm91ciB9fT5EZXRhaWxzPC9MaW5rPlxuXHRcdFx0XHRcdHsvKjxVSS5IZWFkZXJiYXJCdXR0b24gc2hvd1ZpZXc9XCJkZXRhaWxzXCIgdmlld1RyYW5zaXRpb249XCJyZXZlYWwtZnJvbS1yaWdodFwiIHZpZXdQcm9wcz17eyB1c2VyOiB0aGlzLnByb3BzLnVzZXIsIGZsYXZvdXI6IHRoaXMuc3RhdGUuZmxhdm91ciB9fSBsYWJlbD1cIkRldGFpbHNcIiBpY29uPVwiaW9uLWNoZXZyb24tbGVmdFwiIC8+Ki99XG5cdFx0XHRcdDwvVUkuSGVhZGVyYmFyPlxuXHRcdFx0XHQ8VUkuVmlld0NvbnRlbnQgZ3JvdyBzY3JvbGxhYmxlPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWwgcGFuZWwtLWZpcnN0XCI+XG5cdFx0XHRcdFx0XHQ8VUkuUmFkaW9MaXN0IHZhbHVlPXt0aGlzLnN0YXRlLmZsYXZvdXJ9IG9uQ2hhbmdlPXt0aGlzLmhhbmRsZUZsYXZvdXJDaGFuZ2V9IG9wdGlvbnM9e1tcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ1ZhbmlsbGEnLCAgICB2YWx1ZTogJ3ZhbmlsbGEnIH0sXG5cdFx0XHRcdFx0XHRcdHsgbGFiZWw6ICdDaG9jb2xhdGUnLCAgdmFsdWU6ICdjaG9jb2xhdGUnIH0sXG5cdFx0XHRcdFx0XHRcdHsgbGFiZWw6ICdDYXJhbWVsJywgICAgdmFsdWU6ICdjYXJhbWVsJyB9LFxuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnU3RyYXdiZXJyeScsIHZhbHVlOiAnc3RyYXdiZXJyeScgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ0JhbmFuYScsICAgICB2YWx1ZTogJ2JhbmFuYScgfSxcblx0XHRcdFx0XHRcdFx0eyBsYWJlbDogJ0xlbW9uJywgICAgICB2YWx1ZTogJ2xlbW9uJyB9LFxuXHRcdFx0XHRcdFx0XHR7IGxhYmVsOiAnUGFzdGFjY2lvJywgIHZhbHVlOiAncGFzdGFjY2lvJyB9XG5cdFx0XHRcdFx0XHRdfSAvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L1VJLlZpZXdDb250ZW50PlxuXHRcdFx0PC9VSS5WaWV3PlxuXHRcdCk7XG5cdH1cbn0pO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TmF2aWdhdGlvbiA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLk5hdmlnYXRpb24sXG5cdFVJID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuVUk7XG5cbnZhciBUaW1lcnMgPSByZXF1aXJlKCdyZWFjdC10aW1lcnMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbTmF2aWdhdGlvbiwgVGltZXJzKCldLFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGYuc2hvd1ZpZXcoJ3RyYW5zaXRpb25zJywgJ2ZhZGUnKTtcblx0XHR9LCAxMDAwKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PFVJLlZpZXc+XG5cdFx0XHRcdDxVSS5IZWFkZXJiYXIgdHlwZT1cImRlZmF1bHRcIiBsYWJlbD1cIlRhcmdldCBWaWV3XCIgLz5cblx0XHRcdFx0PFVJLlZpZXdDb250ZW50PlxuXHRcdFx0XHRcdDxVSS5GZWVkYmFjayBpY29uS2V5PVwiaW9uLWlvczctcGhvdG9zXCIgaWNvblR5cGU9XCJtdXRlZFwiIHRleHQ9XCJIb2xkIG9uIGEgc2VjLi4uXCIgLz5cblx0XHRcdFx0PC9VSS5WaWV3Q29udGVudD5cblx0XHRcdDwvVUkuVmlldz5cblx0XHQpO1xuXHR9XG59KTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFNldENsYXNzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpLFxuXHROYXZpZ2F0aW9uID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuTmF2aWdhdGlvbixcblx0TGluayA9IHJlcXVpcmUoJ3RvdWNoc3RvbmVqcycpLkxpbmssXG5cdFVJID0gcmVxdWlyZSgndG91Y2hzdG9uZWpzJykuVUk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtOYXZpZ2F0aW9uXSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8VUkuVmlldz5cblx0XHRcdFx0PFVJLkhlYWRlcmJhciB0eXBlPVwiZGVmYXVsdFwiIGxhYmVsPVwiVHJhbnNpdGlvbnNcIj5cblx0XHRcdFx0XHQ8TGluayB0bz1cImhvbWVcIiB2aWV3VHJhbnNpdGlvbj1cInJldmVhbC1mcm9tLXJpZ2h0XCIgY2xhc3NOYW1lPVwiSGVhZGVyYmFyLWJ1dHRvbiBpb24tY2hldnJvbi1sZWZ0XCIgY29tcG9uZW50PVwiYnV0dG9uXCI+QmFjazwvTGluaz5cblx0XHRcdFx0PC9VSS5IZWFkZXJiYXI+XG5cdFx0XHRcdDxVSS5WaWV3Q29udGVudCBncm93IHNjcm9sbGFibGU+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbC1oZWFkZXIgdGV4dC1jYXBzXCI+RGVmYXVsdDwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWxcIj5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidHJhbnNpdGlvbnMtdGFyZ2V0XCIgY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLXRhcHBhYmxlXCIgY29tcG9uZW50PVwiZGl2XCI+PGRpdiBjbGFzc05hbWU9XCJpdGVtLWlubmVyXCI+Tm9uZTwvZGl2PjwvTGluaz5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsLWhlYWRlciB0ZXh0LWNhcHNcIj5GYWRlPC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbFwiPlxuXHRcdFx0XHRcdFx0PExpbmsgdG89XCJ0cmFuc2l0aW9ucy10YXJnZXRcIiB2aWV3VHJhbnNpdGlvbj1cImZhZGVcIiBjbGFzc05hbWU9XCJsaXN0LWl0ZW0gaXMtdGFwcGFibGVcIiBjb21wb25lbnQ9XCJkaXZcIj48ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5GYWRlPC9kaXY+PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgdG89XCJ0cmFuc2l0aW9ucy10YXJnZXRcIiB2aWV3VHJhbnNpdGlvbj1cImZhZGUtZXhwYW5kXCIgY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLXRhcHBhYmxlXCIgY29tcG9uZW50PVwiZGl2XCI+PGRpdiBjbGFzc05hbWU9XCJpdGVtLWlubmVyXCI+RmFkZSBFeHBhbmQ8L2Rpdj48L0xpbms+XG5cdFx0XHRcdFx0XHQ8TGluayB0bz1cInRyYW5zaXRpb25zLXRhcmdldFwiIHZpZXdUcmFuc2l0aW9uPVwiZmFkZS1jb250cmFjdFwiIGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiIGNvbXBvbmVudD1cImRpdlwiPjxkaXYgY2xhc3NOYW1lPVwiaXRlbS1pbm5lclwiPkZhZGUgQ29udHJhY3Q8L2Rpdj48L0xpbms+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwYW5lbC1oZWFkZXIgdGV4dC1jYXBzXCI+U2hvdzwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicGFuZWxcIj5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidHJhbnNpdGlvbnMtdGFyZ2V0XCIgdmlld1RyYW5zaXRpb249XCJzaG93LWZyb20tbGVmdFwiIGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiIGNvbXBvbmVudD1cImRpdlwiPjxkaXYgY2xhc3NOYW1lPVwiaXRlbS1pbm5lclwiPlNob3cgZnJvbSBMZWZ0PC9kaXY+PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgdG89XCJ0cmFuc2l0aW9ucy10YXJnZXRcIiB2aWV3VHJhbnNpdGlvbj1cInNob3ctZnJvbS1yaWdodFwiIGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiIGNvbXBvbmVudD1cImRpdlwiPjxkaXYgY2xhc3NOYW1lPVwiaXRlbS1pbm5lclwiPlNob3cgZnJvbSBSaWdodDwvZGl2PjwvTGluaz5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidHJhbnNpdGlvbnMtdGFyZ2V0XCIgdmlld1RyYW5zaXRpb249XCJzaG93LWZyb20tdG9wXCIgY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLXRhcHBhYmxlXCIgY29tcG9uZW50PVwiZGl2XCI+PGRpdiBjbGFzc05hbWU9XCJpdGVtLWlubmVyXCI+U2hvdyBmcm9tIFRvcDwvZGl2PjwvTGluaz5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidHJhbnNpdGlvbnMtdGFyZ2V0XCIgdmlld1RyYW5zaXRpb249XCJzaG93LWZyb20tYm90dG9tXCIgY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLXRhcHBhYmxlXCIgY29tcG9uZW50PVwiZGl2XCI+PGRpdiBjbGFzc05hbWU9XCJpdGVtLWlubmVyXCI+U2hvdyBmcm9tIEJvdHRvbTwvZGl2PjwvTGluaz5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsLWhlYWRlciB0ZXh0LWNhcHNcIj5SZXZlYWw8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInBhbmVsXCI+XG5cdFx0XHRcdFx0XHQ8TGluayB0bz1cInRyYW5zaXRpb25zLXRhcmdldFwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tbGVmdFwiIGNsYXNzTmFtZT1cImxpc3QtaXRlbSBpcy10YXBwYWJsZVwiIGNvbXBvbmVudD1cImRpdlwiPjxkaXYgY2xhc3NOYW1lPVwiaXRlbS1pbm5lclwiPlJldmVhbCBmcm9tIExlZnQ8L2Rpdj48L0xpbms+XG5cdFx0XHRcdFx0XHQ8TGluayB0bz1cInRyYW5zaXRpb25zLXRhcmdldFwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tcmlnaHRcIiBjbGFzc05hbWU9XCJsaXN0LWl0ZW0gaXMtdGFwcGFibGVcIiBjb21wb25lbnQ9XCJkaXZcIj48ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5SZXZlYWwgZnJvbSBSaWdodDwvZGl2PjwvTGluaz5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidHJhbnNpdGlvbnMtdGFyZ2V0XCIgdmlld1RyYW5zaXRpb249XCJyZXZlYWwtZnJvbS10b3BcIiBjbGFzc05hbWU9XCJsaXN0LWl0ZW0gaXMtdGFwcGFibGVcIiBjb21wb25lbnQ9XCJkaXZcIj48ZGl2IGNsYXNzTmFtZT1cIml0ZW0taW5uZXJcIj5SZXZlYWwgZnJvbSBUb3A8L2Rpdj48L0xpbms+XG5cdFx0XHRcdFx0XHQ8TGluayB0bz1cInRyYW5zaXRpb25zLXRhcmdldFwiIHZpZXdUcmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tYm90dG9tXCIgY2xhc3NOYW1lPVwibGlzdC1pdGVtIGlzLXRhcHBhYmxlXCIgY29tcG9uZW50PVwiZGl2XCI+PGRpdiBjbGFzc05hbWU9XCJpdGVtLWlubmVyXCI+UmV2ZWFsIGZyb20gQm90dG9tPC9kaXY+PC9MaW5rPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L1VJLlZpZXdDb250ZW50PlxuXHRcdFx0PC9VSS5WaWV3PlxuXHRcdCk7XG5cdH1cbn0pO1xuIl19
